/*
  Coachmark / spotlight engine — TỰ CHỨA, tái dùng cho product tour.

  Kỹ thuật "4 mask-rect": phủ tối bằng 4 hình chữ nhật (trên/dưới/trái/phải)
  bao quanh target. Ưu điểm so với 1 overlay khoét lỗ:
    - Vùng tối CHẶN click (pointer-events:auto) → gated tour.
    - Đúng ô target KHÔNG bị che → click xuyên xuống control THẬT (gated-real).
    - Re-layout mỗi frame để bám target đang animate (vd #hub-auth--pulse).

  Engine không biết gì về game; bước (SpotlightStep) khai báo target + nội dung
  + điều kiện qua bước (bấm "Tiếp" hoặc waitUntil() thành true khi user thao tác).
*/

export type SpotlightPlacement = "auto" | "top" | "bottom" | "left" | "right";

export type SpotlightStep = {
  id: string;
  /** Selector hoặc getter trả về phần tử cần chiếu đèn. */
  target: string | (() => Element | null);
  title: string;
  body: string;
  placement?: SpotlightPlacement;
  /** Đệm quanh target (px). */
  padding?: number;
  /**
   * Cách qua bước:
   *  - "next" (mặc định): hiện nút sơ cấp, bấm để qua.
   *  - { waitUntil }: gated-real — tự qua khi predicate true (vd: đã đăng nhập).
   */
  advance?: "next" | { waitUntil: () => boolean };
  /** Nhãn nút sơ cấp (khi advance = "next"). */
  primaryLabel?: string;
  /**
   * passive = chỉ chiếu đèn + tooltip, KHÔNG chặn click ngoài target.
   * Dùng cho bước trong trận (draft/đặt thẻ) cần thao tác tự do nhiều phần tử.
   */
  passive?: boolean;
  /** Hiện link "Bỏ qua, xem kết quả" — cho phép skip ra màn kết quả từ bước này. */
  allowSkipResults?: boolean;
  /**
   * noSpotlight = KHÔNG chiếu đèn/làm tối, chỉ hiện tooltip ở GÓC TRÁI-DƯỚI.
   * Dùng cho bước "để người chơi tự chơi" (sau khi đã hướng dẫn 1 lần).
   * target nên đặt "body".
   */
  noSpotlight?: boolean;
  /** Gọi khi bước này được qua (bấm "Tiếp"/waitUntil) — vd: resume replay đang pause. */
  onAdvance?: () => void;
};

export type TourController = { stop: (reason?: "finish" | "skip") => void };

type TourOptions = {
  onFinish?: () => void;
  onSkip?: () => void;
  /** Bấm "Bỏ qua, xem kết quả" ở bước cho phép → nhảy ra màn kết quả. */
  onShowResults?: () => void;
  /** ms chờ target xuất hiện trước khi bỏ qua bước. */
  targetTimeoutMs?: number;
};

const Z = 5000;

export function startSpotlightTour(
  steps: SpotlightStep[],
  opts: TourOptions = {}
): TourController {
  if (!steps.length) {
    opts.onFinish?.();
    return { stop() {} };
  }

  const reduceMotion = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  let index = 0;
  let rafId = 0;
  let waitPoll = 0;
  let stopped = false;

  // ── DOM scaffold ────────────────────────────────────────────
  const layer = document.createElement("div");
  layer.className = "sl-layer";
  layer.style.zIndex = String(Z);

  const masks = ["top", "right", "bottom", "left"].map((side) => {
    const m = document.createElement("div");
    m.className = `sl-mask sl-mask--${side}`;
    layer.appendChild(m);
    return m;
  });

  const ring = document.createElement("div");
  ring.className = "sl-ring" + (reduceMotion ? " sl-ring--static" : "");
  layer.appendChild(ring);

  // Vòng "click vào đây" — co dần vào target để mời thao tác.
  const pulse = document.createElement("div");
  pulse.className = "sl-pulse" + (reduceMotion ? " sl-pulse--static" : "");
  pulse.innerHTML = '<span class="sl-pulse__ring"></span>';
  layer.appendChild(pulse);

  const tip = document.createElement("div");
  tip.className = "sl-tip";
  tip.setAttribute("role", "dialog");
  tip.setAttribute("aria-live", "polite");
  layer.appendChild(tip);

  document.body.appendChild(layer);
  document.body.classList.add("sl-open");

  // ── Click delegation cho nút trong tooltip ─────────────────
  tip.addEventListener("click", (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-sl]");
    if (!el) return;
    e.preventDefault();
    if (el.dataset.sl === "skip") return stop("skip");
    if (el.dataset.sl === "results") {
      stop("skip");
      opts.onShowResults?.();
      return;
    }
    if (el.dataset.sl === "next") return next();
    if (el.dataset.sl === "prev") return prev();
  });

  function resolveTarget(step: SpotlightStep): Element | null {
    return typeof step.target === "string"
      ? document.querySelector(step.target)
      : step.target();
  }

  let lastLayoutKey = "";
  function layout() {
    const step = steps[index];

    // noSpotlight: không chiếu đèn, tooltip neo góc trái-dưới (để người chơi tự chơi).
    if (step.noSpotlight) {
      if (lastLayoutKey === "nospot") return;
      lastLayoutKey = "nospot";
      layer.classList.add("sl-nospot");
      const tr = tip.getBoundingClientRect();
      // chừa ~64px dưới cho nút skip nổi (.tour-skip-fab)
      const ty = Math.max(12, window.innerHeight - tr.height - 72);
      tip.style.transform = `translate(16px, ${Math.round(ty)}px)`;
      tip.dataset.placement = "corner";
      return;
    }
    layer.classList.remove("sl-nospot");

    const el = resolveTarget(step);
    if (!el) return;
    const pad = step.padding ?? 8;
    const r = el.getBoundingClientRect();
    const x = Math.max(0, r.left - pad);
    const y = Math.max(0, r.top - pad);
    const w = r.width + pad * 2;
    const h = r.height + pad * 2;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Bỏ qua nếu rect không đổi (làm tròn) → tránh ghi DOM mỗi frame gây nhấp nháy.
    const key = `${index}|${Math.round(x)}|${Math.round(y)}|${Math.round(w)}|${Math.round(h)}|${vw}|${vh}`;
    if (key === lastLayoutKey) return;
    lastLayoutKey = key;

    // 4 mask quây quanh ô target
    setRect(masks[0], 0, 0, vw, y); // top
    setRect(masks[1], x + w, y, Math.max(0, vw - (x + w)), h); // right
    setRect(masks[2], 0, y + h, vw, Math.max(0, vh - (y + h))); // bottom
    setRect(masks[3], 0, y, x, h); // left

    setRect(ring, x, y, w, h);
    setRect(pulse, x, y, w, h);

    placeTooltip(step, x, y, w, h, vw, vh);
  }

  function placeTooltip(
    step: SpotlightStep,
    x: number,
    y: number,
    w: number,
    h: number,
    vw: number,
    vh: number
  ) {
    const tr = tip.getBoundingClientRect();
    const gap = 14;
    let placement = step.placement ?? "auto";
    if (placement === "auto") {
      placement = y + h + gap + tr.height <= vh ? "bottom" : "top";
    }
    let tx: number;
    let ty: number;
    if (placement === "bottom" || placement === "top") {
      tx = clamp(x + w / 2 - tr.width / 2, 12, vw - tr.width - 12);
      ty = placement === "bottom" ? y + h + gap : y - tr.height - gap;
    } else {
      ty = clamp(y + h / 2 - tr.height / 2, 12, vh - tr.height - 12);
      tx = placement === "right" ? x + w + gap : x - tr.width - gap;
    }
    tip.style.transform = `translate(${Math.round(tx)}px, ${Math.round(ty)}px)`;
    tip.dataset.placement = placement;
  }

  function renderTip() {
    const step = steps[index];
    const isWait = typeof step.advance === "object";
    const isLast = index === steps.length - 1;
    const showResults = step.allowSkipResults === true && Boolean(opts.onShowResults);
    tip.innerHTML = `
      <div class="sl-tip__skiprow">
        ${showResults ? `<button type="button" class="sl-tip__results" data-sl="results">⏭ Bỏ qua, xem kết quả</button>` : ""}
        <button type="button" class="sl-tip__skip" data-sl="skip">Bỏ qua hướng dẫn</button>
      </div>
      <p class="sl-tip__count">Bước ${index + 1}/${steps.length}</p>
      <h3 class="sl-tip__title">${esc(step.title)}</h3>
      <p class="sl-tip__body">${esc(step.body)}</p>
      <div class="sl-tip__dots">
        ${steps
          .map(
            (_, i) =>
              `<span class="sl-dot ${i === index ? "is-active" : ""}"></span>`
          )
          .join("")}
      </div>
      <div class="sl-tip__actions">
        ${index > 0 ? `<button type="button" class="sl-btn sl-btn--ghost" data-sl="prev">Quay lại</button>` : "<span></span>"}
        ${
          isWait
            ? `<span class="sl-tip__hint">⌛ ${esc(step.primaryLabel ?? "Hãy thao tác để tiếp tục…")}</span>`
            : `<button type="button" class="sl-btn sl-btn--primary" data-sl="next">${esc(step.primaryLabel ?? (isLast ? "Hoàn tất" : "Tiếp theo"))}</button>`
        }
      </div>
    `;
    // Fade-in nhẹ mỗi lần đổi bước (re-trigger animation, chỉ chạm opacity).
    if (!reduceMotion) {
      tip.classList.remove("sl-tip--enter");
      void tip.offsetWidth;
      tip.classList.add("sl-tip--enter");
    }
  }

  function goTo(i: number) {
    if (stopped) return;
    window.clearInterval(waitPoll);
    index = i;
    const step = steps[index];

    // Điều kiện qua bước đã thoả sẵn (vd: đã đăng nhập → bỏ bước auth) → bỏ qua,
    // không treo chờ target không tồn tại.
    if (typeof step.advance === "object" && step.advance.waitUntil()) {
      return next();
    }

    // chờ target xuất hiện (màn có thể chưa render)
    const deadline = Date.now() + (opts.targetTimeoutMs ?? 8000);
    const tryStart = () => {
      if (stopped) return;
      if (resolveTarget(step)) {
        layer.classList.toggle("sl-passive", step.passive === true);
        renderTip();
        layout();
        layer.classList.add("sl-ready"); // hiện overlay chỉ khi đã định vị xong
        if (typeof step.advance === "object") {
          waitPoll = window.setInterval(() => {
            if ((step.advance as { waitUntil: () => boolean }).waitUntil()) {
              window.clearInterval(waitPoll);
              next();
            }
          }, 200);
        }
      } else if (Date.now() < deadline) {
        window.setTimeout(tryStart, 120);
      } else {
        next(); // bỏ qua bước nếu target không tới
      }
    };
    tryStart();
  }

  function next() {
    steps[index]?.onAdvance?.(); // hook khi qua bước (vd: resume replay)
    if (index >= steps.length - 1) return stop("finish");
    goTo(index + 1);
  }
  function prev() {
    if (index > 0) goTo(index - 1);
  }

  function tick() {
    if (stopped) return;
    layout();
    rafId = requestAnimationFrame(tick);
  }

  // Esc = bỏ qua
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") stop("skip");
  };

  function stop(reason: "finish" | "skip" = "finish") {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(rafId);
    window.clearInterval(waitPoll);
    document.removeEventListener("keydown", onKey);
    layer.remove();
    document.body.classList.remove("sl-open");
    if (reason === "skip") opts.onSkip?.();
    else opts.onFinish?.();
  }

  document.addEventListener("keydown", onKey);
  goTo(0);
  rafId = requestAnimationFrame(tick);

  return { stop };
}

/* ── helpers ─────────────────────────────────────────────── */
function setRect(el: HTMLElement, x: number, y: number, w: number, h: number) {
  el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  el.style.width = `${Math.round(w)}px`;
  el.style.height = `${Math.round(h)}px`;
}
function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(v, hi));
}
function esc(v: string) {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
