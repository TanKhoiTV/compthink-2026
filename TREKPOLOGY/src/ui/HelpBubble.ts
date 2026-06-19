export type HelpStep = {
  title: string;
  body: string;
};

type HelpBubbleOptions = {
  id: string;
  title: string;
  bubbleLabel: string;
  steps: HelpStep[];
  placement: "home" | "game";
};

let activeHelpId: string | null = null;
let activeHelpIndex = 0;

export const HOME_HELP_STEPS: HelpStep[] = [
  {
    title: "Bắt đầu hành trình",
    body: "Bấm “Bắt Đầu Hành Trình” để vào game, chọn bản đồ và bắt đầu một chuyến đi mới.",
  },
  {
    title: "Góc khám phá",
    body: "Khu vực bên phải giới thiệu các địa điểm, văn hóa, ẩm thực và thiên nhiên trong Trekpology.",
  },
  {
    title: "Tài khoản",
    body: "Đăng nhập để tạo phòng online, quay lại phòng đang chơi và giữ đúng tên người chơi của bạn.",
  },
  {
    title: "Mục tiêu",
    body: "Xây dựng lịch trình 5 ngày thật hợp lý để thu thập nhiều điểm hành trình nhất.",
  },
];

export const GAME_HELP_STEPS: HelpStep[] = [
  {
    title: "Lịch trình 5 ngày",
    body: "Mỗi ván có 5 ngày, mỗi ngày gồm 5 khung giờ: Sáng, Trưa, Chiều, Tối và Khuya.",
  },
  {
    title: "Chọn thẻ",
    body: "Ở phase draft, chọn 1 thẻ từ nhóm bài đang hiển thị trước khi hết thời gian.",
  },
  {
    title: "Đặt thẻ",
    body: "Ở phase lên kế hoạch, chọn thẻ trên tay rồi đặt vào ô ngày và khung giờ phù hợp.",
  },
  {
    title: "Quản lý tài nguyên",
    body: "Mỗi thẻ tiêu hao Xu hoặc Thể lực. Hãy kiểm tra tài nguyên còn lại trước khi đặt.",
  },
  {
    title: "Tối ưu điểm",
    body: "Ghép các thẻ cùng chủ đề, đúng thời điểm hoặc đúng combo để tăng tổng điểm.",
  },
  {
    title: "Kết thúc lượt",
    body: "Khi đã sắp xếp xong, bấm nút kết thúc hoặc xác nhận kế hoạch để chuyển phase.",
  },
  {
    title: "Chiến thắng",
    body: "Sau 5 ngày, người có tổng điểm hành trình cao nhất sẽ giành chiến thắng.",
  },
];

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderHelpBubble(options: HelpBubbleOptions) {
  const steps = options.steps.length ? options.steps : [{ title: options.title, body: "" }];
  const isOpen = activeHelpId === options.id;
  const stepIndex = isOpen ? Math.max(0, Math.min(activeHelpIndex, steps.length - 1)) : 0;
  const safeId = escapeHtml(options.id);
  const safeTitle = escapeHtml(options.title);
  const safeBubbleLabel = escapeHtml(options.bubbleLabel);
  const encodedSteps = escapeHtml(JSON.stringify(steps));
  const currentStep = steps[stepIndex];

  return `
    <div class="help-bubble-shell help-bubble-shell--${options.placement}" data-help-id="${safeId}">
      <button
        type="button"
        class="help-bubble"
        data-help-open="${safeId}"
        aria-haspopup="dialog"
        aria-controls="${safeId}-dialog"
        aria-label="${safeBubbleLabel}"
        title="${safeBubbleLabel}"
      >
        <span class="help-bubble__icon" aria-hidden="true">📖</span>
        <span class="help-bubble__text">${safeBubbleLabel}</span>
      </button>
      <div
        class="help-modal-backdrop"
        data-help-backdrop="${safeId}"
        data-help-steps="${encodedSteps}"
        data-help-index="${stepIndex}"
        ${isOpen ? "" : "hidden"}
      >
        <section
          class="help-modal"
          id="${safeId}-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="${safeId}-title"
          aria-describedby="${safeId}-body"
          tabindex="-1"
        >
          <button type="button" class="help-modal__close" data-help-close="${safeId}" aria-label="Đóng hướng dẫn">×</button>
          <p class="help-modal__eyebrow">${safeBubbleLabel}</p>
          <h2 class="help-modal__title" id="${safeId}-title">${safeTitle}</h2>
          <div class="help-modal__step" aria-live="polite">
            <strong class="help-modal__step-count" data-help-count>${steps.length > 1 ? `Bước ${stepIndex + 1}/${steps.length}` : "Hướng dẫn"}</strong>
            <h3 data-help-step-title>${escapeHtml(currentStep.title)}</h3>
            <p id="${safeId}-body" data-help-step-body>${escapeHtml(currentStep.body)}</p>
          </div>
          <div class="help-modal__dots" data-help-dots aria-label="Tiến trình hướng dẫn">
            ${steps.map((_, index) => `<button type="button" class="help-modal__dot ${index === stepIndex ? "is-active" : ""}" data-help-dot="${index}" aria-label="Đến bước ${index + 1}"></button>`).join("")}
          </div>
          <div class="help-modal__actions">
            <button type="button" class="help-modal__nav" data-help-prev ${stepIndex === 0 ? "disabled" : ""}>Quay lại</button>
            <button type="button" class="help-modal__nav help-modal__nav--primary" data-help-next>${stepIndex === steps.length - 1 ? "Đã hiểu" : "Tiếp theo"}</button>
          </div>
        </section>
      </div>
    </div>
  `;
}

function getHelpSteps(backdrop: HTMLElement): HelpStep[] {
  try {
    const parsed = JSON.parse(backdrop.dataset.helpSteps || "[]") as HelpStep[];
    return parsed.length ? parsed : [{ title: "Hướng dẫn", body: "" }];
  } catch {
    return [{ title: "Hướng dẫn", body: "" }];
  }
}

function setHelpStep(backdrop: HTMLElement, nextIndex: number) {
  const steps = getHelpSteps(backdrop);
  const index = Math.max(0, Math.min(nextIndex, steps.length - 1));
  const step = steps[index];

  if (activeHelpId === backdrop.dataset.helpBackdrop) {
    activeHelpIndex = index;
  }

  backdrop.dataset.helpIndex = String(index);
  backdrop.querySelector<HTMLElement>("[data-help-count]")!.textContent =
    steps.length > 1 ? `Bước ${index + 1}/${steps.length}` : "Hướng dẫn";
  backdrop.querySelector<HTMLElement>("[data-help-step-title]")!.textContent = step.title;
  backdrop.querySelector<HTMLElement>("[data-help-step-body]")!.textContent = step.body;

  const prevButton = backdrop.querySelector<HTMLButtonElement>("[data-help-prev]");
  const nextButton = backdrop.querySelector<HTMLButtonElement>("[data-help-next]");
  if (prevButton) prevButton.disabled = index === 0;
  if (nextButton) nextButton.textContent = index === steps.length - 1 ? "Đã hiểu" : "Tiếp theo";

  backdrop.querySelectorAll<HTMLButtonElement>("[data-help-dot]").forEach((dot) => {
    dot.classList.toggle("is-active", Number(dot.dataset.helpDot) === index);
  });
}

function openHelpModal(id: string) {
  const backdrop = document.querySelector<HTMLElement>(`[data-help-backdrop="${id}"]`);
  if (!backdrop) return;

  activeHelpId = id;
  activeHelpIndex = 0;
  setHelpStep(backdrop, 0);
  backdrop.hidden = false;
  document.body.classList.add("help-modal-open");
  window.setTimeout(() => backdrop.querySelector<HTMLElement>(".help-modal")?.focus(), 0);
}

function closeHelpModal(backdrop: HTMLElement) {
  activeHelpId = null;
  activeHelpIndex = 0;
  setHelpStep(backdrop, 0);
  backdrop.hidden = true;
  document.body.classList.remove("help-modal-open");
}

export function initHelpBubbleDelegation() {
  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    const openButton = target.closest<HTMLElement>("[data-help-open]");
    if (openButton) {
      event.preventDefault();
      openHelpModal(openButton.dataset.helpOpen || "");
      return;
    }

    const backdrop = target.closest<HTMLElement>("[data-help-backdrop]");
    if (!backdrop) return;

    if (target === backdrop || target.closest("[data-help-close]")) {
      event.preventDefault();
      closeHelpModal(backdrop);
      return;
    }

    const currentIndex = Number(backdrop.dataset.helpIndex || "0");
    const steps = getHelpSteps(backdrop);

    if (target.closest("[data-help-prev]")) {
      event.preventDefault();
      setHelpStep(backdrop, currentIndex - 1);
      return;
    }

    if (target.closest("[data-help-next]")) {
      event.preventDefault();
      if (currentIndex >= steps.length - 1) closeHelpModal(backdrop);
      else setHelpStep(backdrop, currentIndex + 1);
      return;
    }

    const dot = target.closest<HTMLElement>("[data-help-dot]");
    if (dot) {
      event.preventDefault();
      setHelpStep(backdrop, Number(dot.dataset.helpDot || "0"));
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const openBackdrop = document.querySelector<HTMLElement>("[data-help-backdrop]:not([hidden])");
    if (openBackdrop) closeHelpModal(openBackdrop);
  });
}
