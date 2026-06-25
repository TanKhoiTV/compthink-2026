import type { PlayerId, RoomState, ServerTravelCardData } from "./types.js";
import { createServerDeck, PLAYER_IDS, shuffleCards } from "./gameEngine.js";

const DRAFT_STARTING_POOL_SIZE = 7;
const DRAFT_PICK_TARGET = 5;
const DRAFT_PICK_SECONDS = 90;
export { DRAFT_PICK_SECONDS };
const DRAFT_CENTER_DEAL_CARD_MS = 900;
const DRAFT_CENTER_DEAL_GAP_MS = 150;
const DRAFT_CENTER_DEAL_STEP_MS = DRAFT_CENTER_DEAL_CARD_MS +
  DRAFT_CENTER_DEAL_GAP_MS;
const DRAFT_PASS_ANIMATION_MS = 1500;

function getDraftCenterDealDurationMs(cardCount: number): number {
  const n = Math.max(1, Math.min(DRAFT_STARTING_POOL_SIZE, cardCount));
  return DRAFT_CENTER_DEAL_STEP_MS * (n - 1) + DRAFT_CENTER_DEAL_CARD_MS + 250;
}

function getDraftDealHoldSeconds(
  cardCount: number,
  includePass = false,
): number {
  const dealMs = getDraftCenterDealDurationMs(cardCount);
  const extraMs = includePass ? DRAFT_PASS_ANIMATION_MS + 300 : 300;
  return Math.max(1, Math.ceil((dealMs + extraMs) / 1000));
}

function maxDraftPoolSize(state: RoomState, playerIds: PlayerId[]): number {
  if (playerIds.length === 0) return DRAFT_STARTING_POOL_SIZE;
  return Math.max(
    ...playerIds.map((id) => state.players[id].draftPool.length),
    1,
  );
}

function getActiveDraftPlayerIds(state: RoomState): PlayerId[] {
  const connectedPlayerIds = PLAYER_IDS.filter((playerId) => {
    return state.players[playerId].isConnected;
  });

  return connectedPlayerIds.length > 0 ? connectedPlayerIds : ["p1"];
}

function collectCardIdsOnBoards(state: RoomState): Set<string> {
  const ids = new Set<string>();

  for (const playerId of PLAYER_IDS) {
    for (const row of state.players[playerId].board) {
      for (const cell of row) {
        if (cell?.type === "card" && cell.cardId) {
          ids.add(cell.cardId);
        }
      }
    }
  }

  return ids;
}

function collectInFlightDraftCardIds(state: RoomState): Set<string> {
  const ids = new Set<string>();

  for (const playerId of PLAYER_IDS) {
    const player = state.players[playerId];

    for (
      const card of [
        ...player.draftPool,
        ...player.pickedDraftCards,
        ...player.hand,
      ]
    ) {
      ids.add(card.id);
    }
  }

  return ids;
}

function rebuildDeckFromAvailableCards(state: RoomState) {
  if (state.deck.length >= DRAFT_STARTING_POOL_SIZE) return;

  const usedOnBoards = collectCardIdsOnBoards(state);
  const inFlight = collectInFlightDraftCardIds(state);
  const deckIds = new Set(state.deck.map((card) => card.id));

  const available = createServerDeck().filter((card) => {
    return !usedOnBoards.has(card.id) && !inFlight.has(card.id) &&
      !deckIds.has(card.id);
  });

  if (available.length > 0) {
    state.deck = shuffleCards([...state.deck, ...available]);
    return;
  }

  if (state.deck.length > 0) return;

  const emergency = createServerDeck().filter((card) => !inFlight.has(card.id));
  state.deck = shuffleCards(
    emergency.length > 0 ? emergency : createServerDeck(),
  );
}

function drawRandomCardsFromDeck(
  state: RoomState,
  count: number,
): ServerTravelCardData[] {
  rebuildDeckFromAvailableCards(state);
  state.deck = shuffleCards(state.deck);

  const cards = state.deck.slice(0, Math.min(count, state.deck.length));
  state.deck = state.deck.slice(cards.length);

  return cards;
}

function returnCardsToDeck(state: RoomState, cards: ServerTravelCardData[]) {
  if (cards.length === 0) return;

  state.deck = shuffleCards([...state.deck, ...cards]);
}

export function startDraftForCurrentDay(state: RoomState) {
  state.phase = "draft";
  state.draftRound = 1;
  state.timer = DRAFT_PICK_SECONDS;
  state.draftTimerHold = getDraftDealHoldSeconds(DRAFT_STARTING_POOL_SIZE);

  const activePlayerIds = getActiveDraftPlayerIds(state);

  PLAYER_IDS.forEach((playerId) => {
    const player = state.players[playerId];

    player.draftPool = [];
    player.pickedDraftCards = [];
    player.hand = [];
    player.selectedDraftCardId = null;
    player.draftPickConfirmed = false;
  });

  /*
    Random thật từ deck thật.
    Không tạo card generated/fake nữa.
    Với online nhiều người: mỗi người nhận 7 lá ban đầu rồi draft chuyền bài.
    Với 1 người: sau mỗi lần pick, pool sẽ được roll lại ở finishDraftRound().
  */
  activePlayerIds.forEach((playerId) => {
    state.players[playerId].draftPool = drawRandomCardsFromDeck(
      state,
      DRAFT_STARTING_POOL_SIZE,
    );
  });
}

export function selectDraftCard(
  state: RoomState,
  payload: {
    playerId: PlayerId;
    cardId: string;
  },
): string | null {
  if (state.phase !== "draft") {
    return "Chưa tới phase chia bài.";
  }

  const player = state.players[payload.playerId];

  if (!player) return "Không tìm thấy người chơi.";
  if (!player.isConnected) return "Người chơi chưa kết nối.";
  if (!player.draftPool.some((card) => card.id === payload.cardId)) {
    return "Lá này không nằm trong bài đang được chọn.";
  }

  player.selectedDraftCardId = player.selectedDraftCardId === payload.cardId
    ? null
    : payload.cardId;

  return null;
}

export function confirmDraftPick(
  state: RoomState,
  payload: {
    playerId: PlayerId;
  },
): string | null {
  if (state.phase !== "draft") {
    return "Chưa tới phase chia bài.";
  }

  const player = state.players[payload.playerId];

  if (!player) return "Không tìm thấy người chơi.";
  if (!player.isConnected) return "Người chơi chưa kết nối.";
  if (player.selectedDraftCardId === null) {
    return "Bạn chưa chọn lá bài.";
  }

  player.draftPickConfirmed = true;

  const activePlayerIds = getActiveDraftPlayerIds(state);
  const allConfirmed = activePlayerIds.every((playerId) => {
    const activePlayer = state.players[playerId];

    if (activePlayer.draftPool.length === 0) return true;

    return activePlayer.draftPickConfirmed;
  });

  if (allConfirmed) {
    finishDraftRound(state);
  }

  return null;
}

export function finishDraftRound(state: RoomState) {
  if (state.phase !== "draft") return;

  const activePlayerIds = getActiveDraftPlayerIds(state);

  for (const playerId of activePlayerIds) {
    const player = state.players[playerId];

    if (player.draftPool.length === 0) continue;

    const selectedCard = player.draftPool.find((card) =>
      card.id === player.selectedDraftCardId
    ) ??
      player.draftPool[0];

    player.pickedDraftCards.push(selectedCard);
    player.draftPool = player.draftPool.filter((card) =>
      card.id !== selectedCard.id
    );
    player.selectedDraftCardId = null;
    player.draftPickConfirmed = false;
  }

  const everyonePickedEnough = activePlayerIds.every((playerId) => {
    return state.players[playerId].pickedDraftCards.length >= DRAFT_PICK_TARGET;
  });

  if (everyonePickedEnough) {
    finishDraftAndStartPlanning(state);
    return;
  }

  if (activePlayerIds.length > 1) {
    rotateDraftPoolsClockwise(state, activePlayerIds);

    if (
      activePlayerIds.every((playerId) =>
        state.players[playerId].draftPool.length === 0
      )
    ) {
      for (const playerId of activePlayerIds) {
        const needed = DRAFT_PICK_TARGET -
          state.players[playerId].pickedDraftCards.length;
        const nextPoolSize = Math.min(
          DRAFT_STARTING_POOL_SIZE,
          Math.max(needed, DRAFT_STARTING_POOL_SIZE - DRAFT_PICK_TARGET + 1),
        );

        state.players[playerId].draftPool = drawRandomCardsFromDeck(
          state,
          nextPoolSize,
        );
        state.players[playerId].selectedDraftCardId = null;
        state.players[playerId].draftPickConfirmed = false;
      }

      if (
        activePlayerIds.every((playerId) =>
          state.players[playerId].draftPool.length === 0
        )
      ) {
        finishDraftAndStartPlanning(state);
        return;
      }
    }
  } else {
    /*
      Online 1 người: không giữ pool cũ.
      Trả bài dư về deck rồi random lại pool mới với số lá giảm dần:
      7 -> pick -> 6 -> pick -> 5 -> pick -> 4 -> pick -> 3.
    */
    const onlyPlayerId = activePlayerIds[0];
    const onlyPlayer = state.players[onlyPlayerId];
    returnCardsToDeck(state, onlyPlayer.draftPool);

    const nextPoolSize = Math.max(
      DRAFT_STARTING_POOL_SIZE - onlyPlayer.pickedDraftCards.length,
      DRAFT_STARTING_POOL_SIZE - DRAFT_PICK_TARGET + 1,
    );

    onlyPlayer.draftPool = drawRandomCardsFromDeck(state, nextPoolSize);

    if (onlyPlayer.draftPool.length === 0) {
      finishDraftAndStartPlanning(state);
      return;
    }

    onlyPlayer.selectedDraftCardId = null;
    onlyPlayer.draftPickConfirmed = false;
  }

  state.draftRound += 1;
  state.timer = DRAFT_PICK_SECONDS;
  state.draftTimerHold = getDraftDealHoldSeconds(
    maxDraftPoolSize(state, activePlayerIds),
    activePlayerIds.length > 1,
  );
}

function resetSinglePlayerDraftPool(state: RoomState, playerId: PlayerId) {
  const player = state.players[playerId];

  returnCardsToDeck(state, player.draftPool);

  const nextPoolSize = Math.max(
    DRAFT_STARTING_POOL_SIZE - player.pickedDraftCards.length,
    DRAFT_STARTING_POOL_SIZE - DRAFT_PICK_TARGET + 1,
  );

  player.draftPool = drawRandomCardsFromDeck(state, nextPoolSize);
  player.selectedDraftCardId = null;
}

function rotateDraftPoolsClockwise(
  state: RoomState,
  activePlayerIds: PlayerId[],
) {
  if (activePlayerIds.length <= 1) return;

  const oldPools = activePlayerIds.map((playerId) => {
    return [...state.players[playerId].draftPool];
  });

  activePlayerIds.forEach((playerId, index) => {
    const sourceIndex = (index - 1 + activePlayerIds.length) %
      activePlayerIds.length;
    state.players[playerId].draftPool = oldPools[sourceIndex];
  });
}

function finishDraftAndStartPlanning(state: RoomState) {
  state.phase = "planning";
  state.timer = 60;
  state.draftTimerHold = 0;

  const leftoverDraftCards: ServerTravelCardData[] = [];

  for (const playerId of PLAYER_IDS) {
    const player = state.players[playerId];

    leftoverDraftCards.push(...player.draftPool);

    player.hand = player.pickedDraftCards.slice(0, DRAFT_PICK_TARGET);
    player.pickedDraftCards = player.hand.slice();
    player.draftPool = [];
    player.selectedDraftCardId = null;
    player.planningConfirmed = false;
  }

  returnCardsToDeck(state, leftoverDraftCards);
}
