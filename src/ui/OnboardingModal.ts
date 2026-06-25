export type OnboardingStep = {
  title: string;
  description: string;
};

type OnboardingModalOptions = {
  title?: string;
  steps?: OnboardingStep[];
};

const DEFAULT_ONBOARDING_TITLE = "Chào mừng đến với Trekpology";

let isOnboardingOpen = false;
let onboardingStepIndex = 0;
let hasCheckedAutoOpen = false;

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: "Bắt đầu với Trekpology",
    description:
      "Trekpology là game lập lịch trình du lịch Việt Nam bằng thẻ bài. Nhiệm vụ của bạn là xây dựng hành trình hợp lý để đạt điểm cao nhất.",
  },
  {
    title: "Khám phá trang chính",
    description:
      "Tại trang chính, bạn có thể bấm Bắt Đầu Hành Trình, xem Góc khám phá và mở Hướng Dẫn Chơi hoặc Về Chúng Tôi.",
  },
  {
    title: "Đăng nhập",
    description:
      "Đăng nhập hoặc đăng ký ở bảng tài khoản để dùng tên người chơi của bạn, tạo phòng online và quay lại phòng đang chơi.",
  },
  {
    title: "Chọn điểm đến",
    description:
      "Sau khi đăng nhập, chọn Sài Gòn ở màn Chọn Điểm Đến rồi dùng Tìm Trận hoặc Tạo Phòng để vào khu vực online.",
  },
  {
    title: "Tạo hoặc vào phòng",
    description:
      "Ở màn online, bấm Tạo Phòng để mở phòng mới. Sau khi phòng được tạo, bạn sẽ vào lobby và thấy mã phòng để gửi cho bạn bè.",
  },
  {
    title: "Mời bạn bè bằng mã phòng",
    description:
      "Copy mã phòng trong lobby rồi gửi cho người chơi khác. Người được mời chọn cùng điểm đến, nhập mã phòng ở ô tham gia phòng và bấm Vào Phòng.",
  },
  {
    title: "Chuẩn bị trong lobby",
    description:
      "Trong phòng chờ, kiểm tra danh sách người chơi, bấm Sẵn sàng và chờ chủ phòng bắt đầu trận khi mọi người đã sẵn sàng.",
  },
  {
    title: "Xây dựng lịch trình",
    description:
      "Trong trận, hãy draft thẻ rồi đặt các địa điểm vào lịch trình 5 ngày với các khung giờ Sáng, Trưa, Chiều, Tối và Khuya.",
  },
  {
    title: "Quản lý tài nguyên",
    description:
      "Mỗi thẻ có thể tiêu hao Tiền hoặc Thể lực và đem lại điểm. Tính toán trước khi xác nhận lượt để hoàn thành hành trình có điểm cao nhất.",
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

export function openOnboardingModal(startIndex = 0) {
  isOnboardingOpen = true;
  setOnboardingStep(startIndex);
  document.body.classList.add("onboarding-modal-open");
  refreshOnboardingModal();
}

export function syncOnboardingAutoOpen(canShow: boolean) {
  if (!canShow || hasCheckedAutoOpen) return;

  hasCheckedAutoOpen = true;
  isOnboardingOpen = true;
  onboardingStepIndex = 0;
  document.body.classList.add("onboarding-modal-open");
}

export function renderOnboardingModal(options: OnboardingModalOptions = {}) {
  if (!isOnboardingOpen) return "";

  const steps = options.steps?.length ? options.steps : ONBOARDING_STEPS;
  const title = options.title || DEFAULT_ONBOARDING_TITLE;
  const stepIndex = Math.max(
    0,
    Math.min(onboardingStepIndex, steps.length - 1),
  );
  const step = steps[stepIndex];

  return `
    <div class="onboarding-backdrop" data-onboarding-backdrop>
      <section
        class="onboarding-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        aria-describedby="onboarding-description"
        tabindex="-1"
      >
        <button type="button" class="onboarding-modal__close" data-onboarding-close aria-label="Đóng hướng dẫn">×</button>
        <p class="onboarding-modal__eyebrow">Hướng dẫn nhanh</p>
        <h2 id="onboarding-title" class="onboarding-modal__title">${
    escapeHtml(title)
  }</h2>
        <div class="onboarding-modal__step" aria-live="polite">
          <strong class="onboarding-modal__count">Bước ${
    stepIndex + 1
  }/${steps.length}</strong>
          <h3>${escapeHtml(step.title)}</h3>
          <p id="onboarding-description">${escapeHtml(step.description)}</p>
        </div>
        <div class="onboarding-modal__dots" aria-label="Tiến trình hướng dẫn">
          ${
    steps
      .map(
        (_, index) =>
          `<button type="button" class="onboarding-modal__dot ${
            index === stepIndex ? "is-active" : ""
          }" data-onboarding-dot="${index}" aria-label="Đến bước ${
            index + 1
          }"></button>`,
      )
      .join("")
  }
        </div>
        <div class="onboarding-modal__actions">
          <button type="button" class="onboarding-modal__nav" data-onboarding-prev ${
    stepIndex === 0 ? "disabled" : ""
  }>Quay lại</button>
          <button type="button" class="onboarding-modal__nav onboarding-modal__nav--primary" data-onboarding-next>
            ${stepIndex === steps.length - 1 ? "Hoàn tất" : "Tiếp"}
          </button>
        </div>
      </section>
    </div>
  `;
}

function closeOnboardingModal() {
  isOnboardingOpen = false;
  onboardingStepIndex = 0;
  document.body.classList.remove("onboarding-modal-open");
  document.querySelectorAll<HTMLElement>("[data-onboarding-backdrop]").forEach((
    modal,
  ) => modal.remove());
}

function setOnboardingStep(index: number) {
  onboardingStepIndex = Math.max(
    0,
    Math.min(index, ONBOARDING_STEPS.length - 1),
  );
}

function refreshOnboardingModal() {
  const markup = renderOnboardingModal();
  if (!markup) return;

  const existingModals = Array.from(
    document.querySelectorAll<HTMLElement>("[data-onboarding-backdrop]"),
  );
  const firstModal = existingModals.shift();

  existingModals.forEach((modal) => modal.remove());

  if (firstModal) {
    updateOnboardingModalContent(firstModal);
    return;
  }

  const shell = document.getElementById("app") || document.body;
  shell.insertAdjacentHTML("beforeend", markup);
}

function updateOnboardingModalContent(backdrop: HTMLElement) {
  const stepIndex = Math.max(
    0,
    Math.min(onboardingStepIndex, ONBOARDING_STEPS.length - 1),
  );
  const step = ONBOARDING_STEPS[stepIndex];
  const count = backdrop.querySelector<HTMLElement>(".onboarding-modal__count");
  const title = backdrop.querySelector<HTMLElement>(
    ".onboarding-modal__step h3",
  );
  const description = backdrop.querySelector<HTMLElement>(
    "#onboarding-description",
  );
  const prevButton = backdrop.querySelector<HTMLButtonElement>(
    "[data-onboarding-prev]",
  );
  const nextButton = backdrop.querySelector<HTMLButtonElement>(
    "[data-onboarding-next]",
  );
  const dots = Array.from(
    backdrop.querySelectorAll<HTMLButtonElement>("[data-onboarding-dot]"),
  );

  if (count) {
    count.textContent = `Bước ${stepIndex + 1}/${ONBOARDING_STEPS.length}`;
  }
  if (title) title.textContent = step.title;
  if (description) description.textContent = step.description;
  if (prevButton) prevButton.disabled = stepIndex === 0;
  if (nextButton) {
    nextButton.textContent = stepIndex === ONBOARDING_STEPS.length - 1
      ? "Hoàn tất"
      : "Tiếp";
  }

  dots.forEach((dot, index) => {
    dot.classList.toggle("is-active", index === stepIndex);
  });
}

export function initOnboardingModalDelegation() {
  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    if (target.closest("[data-onboarding-open]")) {
      event.preventDefault();
      openOnboardingModal();
      return;
    }

    const backdrop = target.closest<HTMLElement>("[data-onboarding-backdrop]");
    if (!backdrop) return;

    if (target === backdrop || target.closest("[data-onboarding-close]")) {
      event.preventDefault();
      closeOnboardingModal();
      return;
    }

    if (target.closest("[data-onboarding-prev]")) {
      event.preventDefault();
      setOnboardingStep(onboardingStepIndex - 1);
      refreshOnboardingModal();
      return;
    }

    if (target.closest("[data-onboarding-next]")) {
      event.preventDefault();
      if (onboardingStepIndex >= ONBOARDING_STEPS.length - 1) {
        closeOnboardingModal();
      } else {
        setOnboardingStep(onboardingStepIndex + 1);
        refreshOnboardingModal();
      }
      return;
    }

    const dot = target.closest<HTMLElement>("[data-onboarding-dot]");
    if (dot) {
      event.preventDefault();
      setOnboardingStep(Number(dot.dataset.onboardingDot || "0"));
      refreshOnboardingModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (document.querySelector("[data-onboarding-backdrop]")) {
      closeOnboardingModal();
    }
  });
}
