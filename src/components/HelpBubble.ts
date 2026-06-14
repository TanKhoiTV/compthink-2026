export type HelpStep = {
	title: string;
	description: string;
};

export type HelpBubbleProps = {
	title: string;
	steps: HelpStep[];
	bubbleLabel?: string;
	position?: "home" | "game";
	className?: string;
};

type HelpConfig = Required<Omit<HelpBubbleProps, "className">> & {
	id: string;
	className: string;
};

const helpConfigs = new Map<string, HelpConfig>();
let delegationBound = false;
let activeHelpId: string | null = null;

export const HOME_HELP_STEPS: HelpStep[] = [
	{
		title: "Bắt đầu hành trình",
		description:
			"Bấm 'Bắt đầu hành trình' để vào game và bắt đầu xây dựng lịch trình du lịch.",
	},
	{
		title: "Khám phá Việt Nam",
		description:
			"Xem Góc khám phá để tìm hiểu địa điểm, món ăn, văn hóa và các điểm đến nổi bật.",
	},
	{
		title: "Đăng nhập",
		description:
			"Đăng nhập để lưu tiến trình, xem lịch sử chơi và bảng xếp hạng.",
	},
	{
		title: "Mục tiêu",
		description:
			"Trong game, hãy sắp xếp hành trình hợp lý để đạt tổng điểm cao nhất.",
	},
];

export const GAME_HELP_STEPS: HelpStep[] = [
	{
		title: "Lịch trình 5 ngày",
		description:
			"Mỗi trận có 5 ngày, mỗi ngày gồm 5 khung giờ: Sáng, Trưa, Chiều, Tối, Khuya.",
	},
	{
		title: "Chọn thẻ",
		description: "Chọn thẻ địa điểm hoặc hoạt động từ bộ bài trên tay.",
	},
	{
		title: "Đặt thẻ",
		description:
			"Đặt thẻ vào ô thời gian phù hợp trên lịch trình để xây dựng hành trình.",
	},
	{
		title: "Quản lý tài nguyên",
		description:
			"Mỗi thẻ có thể cộng điểm và tiêu hao Tiền hoặc Thể lực. Hãy tính toán trước khi đặt.",
	},
	{
		title: "Combo",
		description:
			"Một số thẻ có thể tạo combo theo loại như Ẩm thực, Văn hóa, Thiên nhiên hoặc Di sản.",
	},
	{
		title: "Xác nhận lượt",
		description:
			"Sau khi sắp xếp xong, bấm 'Xác nhận' để hoàn tất lượt.",
	},
	{
		title: "Mục tiêu",
		description:
			"Cố gắng xây dựng hành trình du lịch có tổng điểm cao nhất.",
	},
];

export function renderHelpBubble({
	title,
	steps,
	bubbleLabel,
	position = "home",
	className = "",
}: HelpBubbleProps): string {
	const safeSteps = steps.length > 0 ? steps : [{ title, description: "" }];
	const label = bubbleLabel ?? (position === "game" ? "Cách chơi" : "Hướng dẫn");
	const id = position === "game" ? "help-gameplay" : "help-homepage";
	const config: HelpConfig = {
		id,
		title,
		steps: safeSteps,
		bubbleLabel: label,
		position,
		className,
	};

	helpConfigs.set(id, config);

	return `
    <div class="help-bubble-shell help-bubble-shell--${position} ${escapeAttr(className)}" data-help-shell="${id}">
      <button
        type="button"
        class="help-bubble"
        data-help-bubble-id="${id}"
        aria-label="Mở hướng dẫn"
        title="${escapeAttr(label)}"
      >
        <span class="help-bubble__tooltip" role="tooltip">${escapeHtml(label)}</span>
        <span class="help-bubble__icon" aria-hidden="true">📖</span>
      </button>

      <div class="help-modal-backdrop" data-help-modal-backdrop="${id}" hidden>
        <section
          class="help-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="${id}-title"
          tabindex="-1"
        >
          <button
            type="button"
            class="help-modal__close"
            data-help-close="${id}"
            aria-label="Đóng hướng dẫn"
          >×</button>

          <div class="help-modal__eyebrow" data-help-step-count="${id}">
            Bước 1/${safeSteps.length}
          </div>
          <h2 id="${id}-title" class="help-modal__title">${escapeHtml(title)}</h2>

          <div class="help-modal__step">
            <h3 data-help-step-title="${id}">${escapeHtml(safeSteps[0].title)}</h3>
            <p data-help-step-description="${id}">${escapeHtml(safeSteps[0].description)}</p>
          </div>

          <div class="help-modal__dots" aria-hidden="true" data-help-dots="${id}">
            ${safeSteps
							.map(
								(_, index) =>
									`<span class="help-modal__dot ${index === 0 ? "is-active" : ""}" data-help-dot-index="${index}"></span>`,
							)
							.join("")}
          </div>

          <div class="help-modal__actions">
            <button type="button" class="help-modal__button help-modal__button--ghost" data-help-prev="${id}" disabled>
              Quay lại
            </button>
            <button type="button" class="help-modal__button help-modal__button--primary" data-help-next="${id}">
              ${safeSteps.length === 1 ? "Hoàn tất" : "Tiếp"}
            </button>
          </div>
        </section>
      </div>
    </div>
  `;
}

export function initHelpBubbleDelegation(): void {
	if (delegationBound) return;
	delegationBound = true;

	document.addEventListener("click", handleHelpClick);
	document.addEventListener("keydown", (event) => {
		if (event.key === "Escape" && activeHelpId) {
			closeHelp(activeHelpId);
		}
	});
}

function handleHelpClick(event: MouseEvent): void {
	const target = event.target as HTMLElement | null;
	if (!target) return;

	const openButton = target.closest<HTMLElement>("[data-help-bubble-id]");
	if (openButton) {
		event.preventDefault();
		event.stopPropagation();
		openHelp(openButton.dataset.helpBubbleId ?? "");
		return;
	}

	const closeButton = target.closest<HTMLElement>("[data-help-close]");
	if (closeButton) {
		event.preventDefault();
		closeHelp(closeButton.dataset.helpClose ?? "");
		return;
	}

	const prevButton = target.closest<HTMLElement>("[data-help-prev]");
	if (prevButton) {
		event.preventDefault();
		const id = prevButton.dataset.helpPrev ?? "";
		const modal = getModal(id);
		if (!modal) return;
		updateHelpStep(id, Number(modal.dataset.stepIndex ?? 0) - 1);
		return;
	}

	const nextButton = target.closest<HTMLElement>("[data-help-next]");
	if (nextButton) {
		event.preventDefault();
		const id = nextButton.dataset.helpNext ?? "";
		const config = helpConfigs.get(id);
		const modal = getModal(id);
		if (!config || !modal) return;

		const currentIndex = Number(modal.dataset.stepIndex ?? 0);
		if (currentIndex >= config.steps.length - 1) {
			closeHelp(id);
			return;
		}

		updateHelpStep(id, currentIndex + 1);
		return;
	}

	const backdrop = target.closest<HTMLElement>("[data-help-modal-backdrop]");
	if (backdrop && event.target === backdrop) {
		closeHelp(backdrop.dataset.helpModalBackdrop ?? "");
	}
}

function openHelp(id: string): void {
	if (!id || !helpConfigs.has(id)) return;

	activeHelpId = id;
	const backdrop = getBackdrop(id);
	if (!backdrop) return;

	backdrop.hidden = false;
	backdrop.classList.add("is-open");
	updateHelpStep(id, 0);

	window.requestAnimationFrame(() => {
		getModal(id)?.focus();
	});
}

function closeHelp(id: string): void {
	const backdrop = getBackdrop(id);
	if (!backdrop) return;

	backdrop.classList.remove("is-open");
	backdrop.hidden = true;
	updateHelpStep(id, 0);

	if (activeHelpId === id) {
		activeHelpId = null;
	}
}

function updateHelpStep(id: string, nextIndex: number): void {
	const config = helpConfigs.get(id);
	const modal = getModal(id);
	if (!config || !modal) return;

	const index = Math.max(0, Math.min(nextIndex, config.steps.length - 1));
	const step = config.steps[index];
	modal.dataset.stepIndex = String(index);

	const countEl = document.querySelector<HTMLElement>(
		`[data-help-step-count="${id}"]`,
	);
	const titleEl = document.querySelector<HTMLElement>(
		`[data-help-step-title="${id}"]`,
	);
	const descriptionEl = document.querySelector<HTMLElement>(
		`[data-help-step-description="${id}"]`,
	);
	const prevButton = document.querySelector<HTMLButtonElement>(
		`[data-help-prev="${id}"]`,
	);
	const nextButton = document.querySelector<HTMLButtonElement>(
		`[data-help-next="${id}"]`,
	);
	const dotEls = document.querySelectorAll<HTMLElement>(
		`[data-help-dots="${id}"] .help-modal__dot`,
	);

	if (countEl) countEl.textContent = `Bước ${index + 1}/${config.steps.length}`;
	if (titleEl) titleEl.textContent = step.title;
	if (descriptionEl) descriptionEl.textContent = step.description;
	if (prevButton) prevButton.disabled = index === 0;
	if (nextButton) {
		nextButton.textContent =
			index === config.steps.length - 1 ? "Hoàn tất" : "Tiếp";
	}

	dotEls.forEach((dot, dotIndex) => {
		dot.classList.toggle("is-active", dotIndex === index);
	});
}

function getBackdrop(id: string): HTMLElement | null {
	return document.querySelector(`[data-help-modal-backdrop="${id}"]`);
}

function getModal(id: string): HTMLElement | null {
	return getBackdrop(id)?.querySelector(".help-modal") ?? null;
}

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

function escapeAttr(value: string): string {
	return escapeHtml(value).replace(/`/g, "&#096;");
}
