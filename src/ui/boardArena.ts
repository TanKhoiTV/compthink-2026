import { state } from "../state/gameState.js";
import {
	getBoardSlots,
	getCurrentDraftPlayer,
	getOnlineSelfDraftPool,
	getOnlineSelfHand,
	isOnlineRoomActive,
} from "../game/queries.js";
import { stripCardText } from "./cardDisplay.js";
import { getCurrentReplayStep } from "./renderHelpers.js";
import {
	getBoardCardByPosition as getBoardCardByPositionFromSlots,
	getCardTagKeys,
	getPlacedCards as getPlacedCardsFromSlots,
} from "../game/board.js";
import type { TravelCardData } from "../types.js";

// ── Board cell helpers ────────────────────────────────────────

export function isLastPlacedBoardCell(rowIndex: number, colIndex: number) {
	return (
		state.lastPlacedBoardPosition !== null &&
		state.lastPlacedBoardPosition.rowIndex === rowIndex &&
		state.lastPlacedBoardPosition.colIndex === colIndex
	);
}

export function getPlacedCards(): TravelCardData[] {
	return getPlacedCardsFromSlots(getBoardSlots());
}

export function getHandCardById(id: string | null) {
	if (!id) return null;

	if (isOnlineRoomActive()) {
		const onlineDraftCard =
			getOnlineSelfDraftPool()?.find((card) => card.id === id) ?? null;

		if (onlineDraftCard) {
			return onlineDraftCard;
		}

		const onlineHandCard =
			getOnlineSelfHand()?.find((card) => card.id === id) ?? null;

		if (onlineHandCard) {
			return onlineHandCard;
		}
	}

	if (state.isDraftPhase) {
		const draftCard =
			getCurrentDraftPlayer()?.pool.find((card) => card.id === id) ?? null;

		if (draftCard) {
			return draftCard;
		}
	}

	return state.playerHand.find((card) => card.id === id) ?? null;
}

export function getBoardCardByPosition(
	rowIndex: number,
	colIndex: number,
): TravelCardData | null {
	return getBoardCardByPositionFromSlots(getBoardSlots(), rowIndex, colIndex);
}

export function getUtilityPlacementEffect(card: TravelCardData) {
	const effect = card.onPlayEffect;
	const tags = getCardTagKeys(card);
	const isUtilityCard =
		tags.includes("UTILITY") ||
		String(card.tag || "").toLowerCase() === "utility" ||
		stripCardText(card.tagLabel || "")
			.toLowerCase()
			.includes("tiện ích");

	const fullText = stripCardText(
		[
			card.name,
			card.shortName || "",
			card.description || "",
			card.bonusText || "",
			card.tagLabel || "",
		].join(" "),
	).toLowerCase();

	const explicitValue = Number(effect?.effect_value ?? 0);
	const numberMatch = fullText.match(/(?:\+|nhận|hoi|hồi|cộng|thêm)\s*(\d+)/i);
	const inferredValue = numberMatch ? Number(numberMatch[1]) : 1;
	const value = explicitValue > 0 ? explicitValue : inferredValue;

	if (effect?.has_effect) {
		if (effect.effect_type === "RECOVER_XU") {
			return {
				type: "coin" as const,
				value,
				label: `+${value} Xu`,
				icon: "🪙",
			};
		}

		if (effect.effect_type === "RECOVER_LA") {
			return {
				type: "stamina" as const,
				value,
				label: `+${value} Thể lực`,
				icon: "⚡",
			};
		}

		if (effect.effect_type === "GAIN_VP") {
			return {
				type: "vp" as const,
				value,
				label: `+${value} VP`,
				icon: "★",
			};
		}
	}

	/*
    Fallback cho data utility nếu mapper/server chưa truyền onPlayEffect.
    Đọc mô tả/bonus để vẫn hiện đúng hiệu ứng.
  */
	if (!isUtilityCard) return null;

	if (
		fullText.includes("xu") ||
		fullText.includes("tiền") ||
		fullText.includes("coin") ||
		fullText.includes("gold")
	) {
		return {
			type: "coin" as const,
			value,
			label: `+${value} Xu`,
			icon: "🪙",
		};
	}

	if (
		fullText.includes("thể lực") ||
		fullText.includes("the luc") ||
		fullText.includes("năng lượng") ||
		fullText.includes("nang luong") ||
		fullText.includes("stamina") ||
		fullText.includes("nl")
	) {
		return {
			type: "stamina" as const,
			value,
			label: `+${value} Thể lực`,
			icon: "⚡",
		};
	}

	if (
		fullText.includes("vp") ||
		fullText.includes("điểm") ||
		fullText.includes("diem")
	) {
		return {
			type: "vp" as const,
			value,
			label: `+${value} VP`,
			icon: "★",
		};
	}

	return {
		type: "vp" as const,
		value,
		label: `+${value} VP`,
		icon: "★",
	};
}

export function renderUtilityEffectFlash(rowIndex: number, colIndex: number) {
	if (
		!state.lastUtilityEffectFlash ||
		state.lastUtilityEffectFlash.rowIndex !== rowIndex ||
		state.lastUtilityEffectFlash.colIndex !== colIndex
	) {
		return "";
	}

	const { type, value } = state.lastUtilityEffectFlash;
	const icon = type === "coin" ? "🪙" : type === "stamina" ? "⚡" : "★";
	const label =
		type === "coin"
			? `+${value} Xu`
			: type === "stamina"
				? `+${value} Thể lực`
				: `+${value} VP`;

	return `
    <div class="utility-effect-pop utility-effect-pop--${type}" aria-hidden="true">
      <div class="utility-effect-pop__burst"></div>
      <div class="utility-effect-pop__icon">${icon}</div>
      <div class="utility-effect-pop__label">${label}</div>
      <div class="utility-effect-pop__spark utility-effect-pop__spark--1"></div>
      <div class="utility-effect-pop__spark utility-effect-pop__spark--2"></div>
      <div class="utility-effect-pop__spark utility-effect-pop__spark--3"></div>
    </div>
  `;
}

export function getReplayStepForBoardCell(rowIndex: number, colIndex: number) {
	if (!state.simulationResult) return null;

	const stepIndex = state.simulationResult.replaySteps.findIndex(
		(step) => step.rowIndex === rowIndex && step.dayIndex === colIndex,
	);

	if (stepIndex < 0 || stepIndex > state.simulationReplayIndex) {
		return null;
	}

	return state.simulationResult.replaySteps[stepIndex] ?? null;
}

export function getBoardCellReplayClass(rowIndex: number, colIndex: number) {
	if (!state.simulationResult || colIndex !== state.currentDayIndex) return "";

	const currentStep = getCurrentReplayStep();
	const isCurrent =
		currentStep?.rowIndex === rowIndex && currentStep?.dayIndex === colIndex;

	const stepIndex = state.simulationResult.replaySteps.findIndex(
		(step) => step.rowIndex === rowIndex && step.dayIndex === colIndex,
	);

	const step =
		stepIndex >= 0 ? state.simulationResult.replaySteps[stepIndex] : null;
	const isProcessed = stepIndex >= 0 && stepIndex < state.simulationReplayIndex;
	const eventClass =
		step?.eventType && stepIndex <= state.simulationReplayIndex
			? `board-cell--event-${step.eventType}`
			: "";

	if (isCurrent) return `board-cell--replay-current ${eventClass}`.trim();
	if (isProcessed) return `board-cell--replay-done ${eventClass}`.trim();
	return "board-cell--replay-pending";
}
