import { state } from "../state/gameState.js";
import { sendPlaceCard } from "../online/socketClient.js";
import {
	getBoardSlots,
	getRemainingResources,
	isOnlineRoomActive,
} from "../game/queries.js";
import { getUtilityPlacementEffect } from "../ui/boardArena.js";
import { rerenderArena } from "../ui/arenaRenderer.js";
import { playGameSound } from "../audio/gameAudio.js";
import {
	applyUtilityPlacementEffect,
	triggerUtilityEffectFlash,
} from "./utilityEffects.js";
import { addLocalDebtOrExhaustToken } from "./debtTokens.js";
import { placeBotCardsAfterPlayerMove } from "../app.js";

export function canPlaceOnBoardCell(rowIndex: number, colIndex: number) {
	const cell = getBoardSlots()[rowIndex]?.[colIndex] ?? null;

	return cell === null;
}

export function placeHandCardOnBoard(
	cardId: string,
	rowIndex: number,
	colIndex: number,
) {
	if (state.isSimulationMode || state.isInitialDealInProgress) return;
	if (colIndex !== state.currentDayIndex) return;
	if (!canPlaceOnBoardCell(rowIndex, colIndex)) return;

	const handIndex = state.playerHand.findIndex((card) => card.id === cardId);
	if (handIndex === -1) return;

	const selectedCard = state.playerHand[handIndex];

	if (isOnlineRoomActive()) {
		playGameSound("cardPlace");

		const onlineUtilityEffect = getUtilityPlacementEffect(selectedCard);

		if (onlineUtilityEffect) {
			triggerUtilityEffectFlash({
				rowIndex,
				colIndex,
				type: onlineUtilityEffect.type,
				value: onlineUtilityEffect.value,
			});
		}

		sendPlaceCard({
			cardId: selectedCard.id,
			rowIndex,
			colIndex,
			tag: selectedCard.tag,
			icon: selectedCard.icon,
			vp: selectedCard.vp,
			coin: selectedCard.coin,
			stamina: selectedCard.stamina,
			name: selectedCard.name,
		});

		state.selectedHandCardId = null;
		state.draggedHandCardId = null;
		state.focusedHandCardId = null;
		state.focusedBoardCard = null;
		state.focusedBoardPosition = null;
		state.suppressNextClick = false;

		if (onlineUtilityEffect) {
			rerenderArena();
		}

		return;
	}

	const remainingBeforePlace = getRemainingResources();
	const coinDebt = Math.max(0, selectedCard.coin - remainingBeforePlace.coin);
	const staminaDebt = Math.max(
		0,
		selectedCard.stamina - remainingBeforePlace.stamina,
	);

	playGameSound("cardPlace");

	state.playerHand.splice(handIndex, 1);

	const didApplyUtilityEffect = applyUtilityPlacementEffect(
		selectedCard,
		rowIndex,
		colIndex,
	);

	if (!didApplyUtilityEffect) {
		getBoardSlots()[rowIndex][colIndex] = selectedCard;

		addLocalDebtOrExhaustToken({
			rowIndex,
			colIndex,
			card: selectedCard,
			coinDebt,
			staminaDebt,
		});
	}

	sendPlaceCard({
		cardId: selectedCard.id,
		rowIndex,
		colIndex,
		tag: selectedCard.tag,
		icon: selectedCard.icon,
		vp: selectedCard.vp,
		coin: selectedCard.coin,
		stamina: selectedCard.stamina,
		image: selectedCard.image,
		name: selectedCard.name,
	});

	placeBotCardsAfterPlayerMove(selectedCard);

	state.selectedHandCardId = null;
	state.draggedHandCardId = null;
	state.focusedHandCardId = null;
	state.focusedBoardCard = null;
	state.focusedBoardPosition = null;
	state.suppressNextClick = false;

	state.lastPlacedBoardPosition = { rowIndex, colIndex };

	rerenderArena();

	window.setTimeout(() => {
		if (
			state.lastPlacedBoardPosition?.rowIndex === rowIndex &&
			state.lastPlacedBoardPosition?.colIndex === colIndex
		) {
			state.lastPlacedBoardPosition = null;
			rerenderArena();
		}
	}, 420);
}

export function placeSelectedHandCard(rowIndex: number, colIndex: number) {
	if (!state.selectedHandCardId) return;

	placeHandCardOnBoard(state.selectedHandCardId, rowIndex, colIndex);
}

export function canDiscardHandCard() {
	return (
		!state.isDraftPhase &&
		!state.isSimulationMode &&
		!state.isInitialDealInProgress
	);
}
