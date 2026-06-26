/*
  Product tour — vertical slice: bước AUTH (gated-real).

  Tự chạy lần đầu vào trang: chiếu đèn panel đăng nhập/đăng ký, chỉ qua bước khi
  người chơi THỰC SỰ đăng nhập (ctx.isLoggedIn() === true). Sau đó (milestone sau)
  sẽ nối tiếp: chọn map → tạo phòng → tạo trận → gameplay → kết quả → về home.

  app.ts chỉ cần gọi maybeStartOnboarding({ isLoggedIn }) một lần sau khi hub render.
*/
import { startSpotlightTour, type SpotlightStep, type TourController } from "./spotlight.js";
import { showResultsReveal, type TourPlayer } from "./resultsReveal.js";

const SEEN_KEY = "trek_onboarding_seen_v1";

let active = false;
let controller: TourController | null = null;

export type OnboardingCtx = {
  isLoggedIn: () => boolean;
  /** Phase trận hiện tại (onlineClientState.roomState?.phase) cho waitUntil. */
  getPhase: () => string | null;
  /** Số thẻ người chơi đã đặt trên bàn ngày hiện tại. */
  getSelfPlacedCount: () => number;
  /** Người chơi đã chọn (select) một thẻ draft chưa (chưa xác nhận). */
  getDraftSelected: () => boolean;
  /** Số thẻ người chơi đã chốt (Kết thúc lượt) trong draft. */
  getDraftPickedCount: () => number;
  /** Ngày hiện tại (0-based) để chiếu điểm cuối. */
  getDayIndex: () => number;
  /** 4 người chơi + điểm hiện tại cho màn kết quả. */
  getPlayers: () => TourPlayer[];
  /** Rời phòng + về dashboard. */
  gotoHome: () => void;
};

/** Tour có đang chạy không (để app.ts tạm ẩn modal welcome). */
export function isOnboardingActive(): boolean {
  return active;
}

/** Đã xem tour rồi? (để không tự mở lại mỗi lần load) */
export function hasSeenOnboarding(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function markSeen() {
  try {
    localStorage.setItem(SEEN_KEY, "1");
  } catch {
    /* ignore */
  }
}

/** Có phần tử khớp selector trong DOM không (dùng cho waitUntil chuyển màn). */
function present(selector: string): boolean {
  return Boolean(document.querySelector(selector));
}

/**
 * Chuỗi bước: auth → bắt đầu → chọn map → tạo phòng → sẵn sàng.
 * Mỗi bước gated-real: chỉ qua khi người chơi thực sự thao tác (waitUntil dò
 * DOM của màn kế xuất hiện). Phần gameplay (vào trận thật + bot) là milestone sau.
 */
function buildTourSteps(ctx: OnboardingCtx): SpotlightStep[] {
  return [
    {
      id: "auth",
      target: "#hub-auth",
      title: "Bắt đầu hành trình tại đây",
      body: "Đăng ký tài khoản mới hoặc đăng nhập để tạo phòng, mời bạn bè cùng chơi và lưu tiến trình của bạn.",
      placement: "left",
      advance: { waitUntil: () => ctx.isLoggedIn() },
      primaryLabel: "Đăng nhập để tiếp tục…",
    },
    {
      id: "start",
      target: ".btn-play",
      title: "Vào hành trình",
      body: "Tuyệt! Giờ bấm “Bắt Đầu Hành Trình” để chọn điểm đến cho chuyến đi.",
      advance: { waitUntil: () => present(".map-selection-screen") },
      primaryLabel: "Bấm Bắt Đầu Hành Trình…",
    },
    {
      id: "map",
      target: ".map-card--active",
      title: "Chọn điểm đến",
      body: "Sài Gòn đã mở khoá. Bấm “Tạo Phòng” ngay trên thẻ này để lập một phòng chơi.",
      advance: { waitUntil: () => present(".online-entry-screen") },
      primaryLabel: "Bấm Tạo Phòng…",
    },
    {
      id: "createRoom",
      target: 'button[onclick*="createRoomFromLobby"]',
      title: "Tạo phòng",
      body: "Tạo một phòng mới — bạn sẽ là chủ phòng (P1) và có mã phòng để mời bạn bè vào cùng.",
      advance: { waitUntil: () => present('button[onclick*="toggleReadyFromLobby"]') },
      primaryLabel: "Bấm Tạo phòng…",
    },
    {
      id: "ready",
      target: 'button[onclick*="toggleReadyFromLobby"]',
      title: "Sẵn sàng vào trận",
      body: "Bấm “Sẵn sàng”. Các ghế trống sẽ được điền bằng bot để bạn vào trận ngay.",
      placement: "top",
      advance: {
        waitUntil: () => present('button[onclick*="startOnlineGame"]:not([disabled])'),
      },
      primaryLabel: "Bấm Sẵn sàng…",
    },
    {
      id: "start",
      target: 'button[onclick*="startOnlineGame"]',
      title: "Bắt đầu trận",
      body: "Mọi người đã sẵn sàng. Bấm “Bắt đầu” để khởi động trận đấu.",
      placement: "top",
      advance: { waitUntil: () => ctx.getPhase() === "draft" },
      primaryLabel: "Bấm Bắt đầu…",
    },
    {
      id: "draft-pick",
      target: ".draft-center-overlay",
      title: "Chọn thẻ (Draft)",
      body: "Bấm nút “CHỌN” trên một thẻ địa điểm bạn thích để chọn nó.",
      placement: "auto",
      padding: 6,
      passive: true,
      allowSkipResults: true,
      advance: { waitUntil: () => ctx.getDraftSelected() },
      primaryLabel: "Bấm CHỌN trên một thẻ…",
    },
    {
      id: "draft-confirm",
      target: 'button[onclick*="confirmDraftPick"]',
      title: "Kết thúc lượt",
      body: "Đã chọn thẻ? Bấm “Kết thúc lượt” để xác nhận lá đầu tiên.",
      placement: "left",
      passive: true,
      allowSkipResults: true,
      advance: { waitUntil: () => ctx.getDraftPickedCount() >= 1 },
      primaryLabel: "Bấm Kết thúc lượt…",
    },
    {
      id: "draft-free",
      target: "body",
      title: "Bạn đã biết cách Draft! 👍",
      body: "Giờ tự chọn nốt các thẻ cho những vòng còn lại. Khi đủ thẻ, game sẽ tự chuyển sang xếp lịch trình.",
      noSpotlight: true,
      allowSkipResults: true,
      advance: { waitUntil: () => ctx.getPhase() === "planning" },
      primaryLabel: "Đang chờ bạn chọn xong…",
    },
    {
      id: "place-hand",
      target: ".player-hand",
      title: "Bài trên tay",
      body: "Đây là các thẻ bạn vừa chọn. Bấm chọn một thẻ ở đây để chuẩn bị xếp lên bàn.",
      placement: "top",
      padding: 6,
      passive: true,
      allowSkipResults: true,
      advance: "next",
      primaryLabel: "Tiếp",
    },
    {
      id: "place-board",
      target: ".board-grid",
      title: "Xếp lên lịch trình",
      body: "Bấm vào một ô khung giờ trống trên bàn để đặt thẻ vừa chọn. Ghép thẻ cùng chủ đề để ăn combo!",
      placement: "auto",
      padding: 6,
      passive: true,
      allowSkipResults: true,
      advance: { waitUntil: () => ctx.getSelfPlacedCount() >= 1 },
      primaryLabel: "Đặt một thẻ lên bàn…",
    },
    {
      id: "place-free",
      target: "body",
      title: "Tuyệt! Bạn đã biết cách xếp 🎉",
      body: "Xếp thêm thẻ tùy thích. Khi xong, bấm nút “Xác nhận” (góc phải) để chốt ngày và xem chấm điểm.",
      noSpotlight: true,
      allowSkipResults: true,
      advance: { waitUntil: () => ctx.getPhase() === "result" },
      primaryLabel: "Đang chờ bạn xếp xong…",
    },
    {
      id: "finale",
      target: ".board-grid, #app",
      title: "Bạn đã nắm cách chơi! 🎉",
      body: "Bạn vừa đi qua Draft → Xếp lịch → Chấm điểm. Bấm để xem nhanh kết quả của cả hành trình 5 ngày (mô phỏng).",
      placement: "auto",
      passive: true,
      advance: "next",
      primaryLabel: "Xem kết quả cuối →",
    },
  ];
}

/**
 * Mở tour lần đầu nếu chưa xem và chưa đăng nhập. Idempotent: gọi nhiều lần
 * (mỗi render) cũng chỉ khởi động một lần.
 */
export function maybeStartOnboarding(ctx: OnboardingCtx): boolean {
  if (active || hasSeenOnboarding()) return active;
  if (ctx.isLoggedIn()) return false; // đã đăng nhập sẵn → bỏ qua slice auth
  startTour(ctx);
  return true;
}

/** Gắn 1 lần: nút [data-tutorial-open] (vd "Hướng Dẫn Chơi") → mở lại tour. */
export function initTourLauncher(ctxFactory: () => OnboardingCtx): void {
  document.addEventListener("click", (event) => {
    const trigger = (event.target as HTMLElement | null)?.closest?.(
      "[data-tutorial-open]",
    );
    if (!trigger) return;
    event.preventDefault();
    startTour(ctxFactory());
  });
}

const IN_MATCH = ["cinematic", "draft", "planning", "simulation", "result"];
let skipFab: HTMLElement | null = null;
let fabPoll = 0;

function removeSkipFab() {
  window.clearInterval(fabPoll);
  fabPoll = 0;
  skipFab?.remove();
  skipFab = null;
}

/**
 * Nút skip NỔI cố định — hiện suốt khi đang trong trận tutorial, kể cả khi người
 * chơi đã tắt hướng dẫn. Bấm → ra màn kết quả luôn.
 */
function startSkipFabWatcher(ctx: OnboardingCtx, onReveal: () => void) {
  removeSkipFab();
  const ensure = () => {
    const phase = ctx.getPhase();
    const inMatch = Boolean(phase && IN_MATCH.includes(phase));
    if (inMatch && !skipFab) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tour-skip-fab";
      btn.textContent = "⏭ Bỏ qua phần chơi · Xem kết quả";
      btn.addEventListener("click", onReveal);
      document.body.appendChild(btn);
      skipFab = btn;
    } else if (!inMatch && skipFab) {
      skipFab.remove();
      skipFab = null;
    }
  };
  ensure();
  fabPoll = window.setInterval(ensure, 800);
}

/** Mở tour theo yêu cầu (vd nút "Hướng Dẫn Chơi") — không phụ thuộc cờ đã-xem. */
export function startTour(ctx: OnboardingCtx): TourController {
  if (active && controller) return controller;
  active = true;
  const cleanup = () => {
    active = false;
    controller = null;
    markSeen();
  };
  const reveal = () => {
    removeSkipFab();
    controller?.stop("skip"); // gỡ overlay hướng dẫn TRƯỚC khi cleanup set null
    cleanup();
    // chỉ hiện kết quả nếu đã thực sự vào trận (có người chơi)
    const players = ctx.getPlayers();
    if (players.length > 0) {
      showResultsReveal(players, ctx.getDayIndex() + 1, ctx.gotoHome);
    }
  };
  controller = startSpotlightTour(buildTourSteps(ctx), {
    // Hoàn tất tour (bấm "Xem kết quả cuối" ở bước cuối) → bịa kết quả → về home.
    onFinish: reveal,
    // Bấm "Bỏ qua, xem kết quả" giữa chừng → ra màn kết quả luôn.
    onShowResults: reveal,
    // Bỏ qua hướng dẫn → tắt overlay hướng dẫn, NHƯNG vẫn giữ nút skip nổi.
    onSkip: cleanup,
    targetTimeoutMs: 15000, // chờ cinematic (~7s) + deal animation trước khi có thẻ draft
  });
  // Nút skip nổi: hiện ngay khi vào trận, tồn tại tới khi bấm hoặc rời trận.
  startSkipFabWatcher(ctx, reveal);
  return controller;
}
