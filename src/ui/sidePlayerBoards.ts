import { currentPlayerId, playerIds, state } from "../state/gameState.js";
import {
  getBoardTotals,
  getOnlinePlayer,
  getOnlinePlayerBoard,
  getRemainingResources,
  isOnlineRoomActive,
} from "../game/queries.js";
import type { Player, PlayerId, TravelCardData } from "../types.js";
import { STARTING_COIN, STARTING_STAMINA } from "../game/constants.js";
import { onlineClientState } from "../online/socketClient.js";

// ── Data ──────────────────────────────────────────────────────

const playersLeftBase: Player[] = [
  {
    id: "p2",
    rank: 3,
    name: "Cường",
    score: 180,
    coin: 890,
    stamina: 20,
    usedSlots: 3,
  },
  {
    id: "p1",
    rank: 1,
    name: "An",
    score: 0,
    coin: STARTING_COIN,
    stamina: STARTING_STAMINA,
    usedSlots: 0,
    active: true,
  },
];

const playersRight: Player[] = [
  {
    id: "p3",
    rank: 3,
    name: "Minh",
    score: 190,
    coin: 720,
    stamina: 15,
    usedSlots: 3,
  },
  {
    id: "p4",
    rank: 3,
    name: "Khánh",
    score: 240,
    coin: 720,
    stamina: 15,
    usedSlots: 3,
  },
];

// ── Internal helpers ──────────────────────────────────────────

function getPlayerBoardUsedSlots(playerId: PlayerId): number {
  let usedSlots = 0;

  for (const row of state.playerBoards[playerId]) {
    for (const card of row) {
      if (card) usedSlots += 1;
    }
  }

  return usedSlots;
}

function getPlayersLeft() {
  const totals = getBoardTotals();

  return playersLeftBase.map((player) => {
    if (!player.active) {
      return {
        ...player,
        usedSlots: player.id
          ? getPlayerBoardUsedSlots(player.id)
          : player.usedSlots,
      };
    }

    const remaining = getRemainingResources();

    return {
      ...player,
      score: totals.vp,
      coin: Math.max(0, remaining.coin),
      stamina: Math.max(0, remaining.stamina),
      usedSlots: totals.usedSlots,
    };
  });
}

function getPlayersRight() {
  return playersRight.map((player) => {
    return {
      ...player,
      usedSlots: player.id
        ? getPlayerBoardUsedSlots(player.id)
        : player.usedSlots,
    };
  });
}

function getDraftPreviewIconsForPlayer(playerId: PlayerId): string[] {
  const draftIndexByPlayerId: Record<PlayerId, number> = {
    p1: 1,
    p2: 0,
    p3: 2,
    p4: 3,
  };

  const draftPlayer = state.draftPlayers[draftIndexByPlayerId[playerId]];
  const pickedCards = draftPlayer?.picked ?? [];

  return pickedCards.map((card) => card.icon);
}

function shouldRenderDraftPreviewOnSideBoard(playerId?: PlayerId): boolean {
  return Boolean(
    playerId && playerId !== currentPlayerId && state.isDraftPhase,
  );
}

function renderOnlineSideBoard(playerId: PlayerId) {
  const onlineBoard = getOnlinePlayerBoard(playerId);

  if (!onlineBoard) {
    return Array.from({ length: 25 })
      .map(() => `<div class="opponent-cell">+</div>`)
      .join("");
  }

  const cells: string[] = [];

  for (const row of onlineBoard) {
    for (const cell of row) {
      if (!cell) {
        cells.push(`<div class="opponent-cell">+</div>`);
        continue;
      }

      cells.push(`
        <div
          class="opponent-cell opponent-cell--filled opponent-cell--${cell.tag}"
          title="${cell.cardId} • ${cell.tag} • ${cell.vp} VP"
        >
          ${cell.icon}
        </div>
      `);
    }
  }

  return cells.join("");
}

function getStaticPlayerById(playerId: PlayerId): Player {
  const fallbackRankByPlayerId: Record<PlayerId, number> = {
    p1: 1,
    p2: 3,
    p3: 3,
    p4: 3,
  };

  return (
    [...playersLeftBase, ...playersRight].find(
      (player) => player.id === playerId,
    ) ?? {
      id: playerId,
      rank: fallbackRankByPlayerId[playerId],
      name: playerId.toUpperCase(),
      score: 0,
      coin: STARTING_COIN,
      stamina: STARTING_STAMINA,
      usedSlots: 0,
    }
  );
}

function getVisibleSidePlayersForOnline(): Player[] {
  const selfPlayerId = onlineClientState.playerId;

  if (!selfPlayerId || !onlineClientState.roomState) {
    return [];
  }

  return playerIds
    .filter((playerId) => {
      if (playerId === selfPlayerId) return false;

      const onlinePlayer = onlineClientState.roomState?.players[playerId];

      /*
        Trong màn chơi chỉ hiện người chơi đang online.
        Slot trống/offline không render card mini/sidebar nữa, để chỗ đó là khoảng trắng.
        Lobby vẫn hiện OFFLINE để biết ai đã rời phòng.
      */
      return onlinePlayer?.isConnected === true;
    })
    .map((playerId) => {
      const staticPlayer = getStaticPlayerById(playerId);
      const onlinePlayer = onlineClientState.roomState?.players[playerId];

      return {
        ...staticPlayer,
        name: onlinePlayer?.name ?? staticPlayer.name,
        score: onlinePlayer?.score ?? staticPlayer.score,
        coin: onlinePlayer?.coin ?? staticPlayer.coin,
        stamina: onlinePlayer?.stamina ?? staticPlayer.stamina,
        usedSlots: onlinePlayer?.usedSlots ?? staticPlayer.usedSlots,
        active: false,
      };
    });
}

// ── Exported functions ────────────────────────────────────────

export function renderSidePlayerBoard(playerId?: PlayerId) {
  if (!playerId) {
    return Array.from({ length: 25 })
      .map(() => `<div class="opponent-cell">+</div>`)
      .join("");
  }

  if (onlineClientState.roomState) {
    return renderOnlineSideBoard(playerId);
  }

  const board = state.playerBoards[playerId];
  const draftPreviewIcons = shouldRenderDraftPreviewOnSideBoard(playerId)
    ? getDraftPreviewIconsForPlayer(playerId)
    : [];
  const cells: string[] = [];
  let flatIndex = 0;

  for (const row of board) {
    for (const card of row) {
      const previewIcon = draftPreviewIcons[flatIndex] ?? "";

      if (!card) {
        cells.push(`
          <div
            class="opponent-cell ${
          previewIcon ? "opponent-cell--draft-preview" : ""
        }"
            title="${
          previewIcon ? "Người chơi này đã chọn 1 lá trong phase draft" : ""
        }"
          >
            ${previewIcon || "+"}
          </div>
        `);
        flatIndex += 1;
        continue;
      }

      cells.push(`
        <div
          class="opponent-cell opponent-cell--filled opponent-cell--${card.tag}"
          title="${card.name} • ${card.tagLabel} • ${card.vp} VP"
        >
          ${card.icon}
        </div>
      `);
      flatIndex += 1;
    }
  }

  return cells.join("");
}

export function renderPlayer(player: Player) {
  const onlinePlayer = getOnlinePlayer(player.id);
  const displayPlayer = onlinePlayer
    ? {
      ...player,
      name: onlinePlayer.name,
      score: onlinePlayer.score,
      coin: onlinePlayer.coin,
      stamina: onlinePlayer.stamina,
      usedSlots: onlinePlayer.usedSlots,
    }
    : player;
  const connectionClass = onlinePlayer?.isConnected === false
    ? " side-player--offline"
    : "";

  return `
    <section class="side-player ${
    displayPlayer.active ? "side-player--active" : ""
  }${connectionClass}">
      <div class="side-player__top">
        <div class="side-player__identity">
          <span class="rank">#${displayPlayer.rank}</span>
          <h3>${displayPlayer.name}</h3>
        </div>

        <div class="side-player__score">
          ${displayPlayer.score}
          ${
    onlinePlayer?.hasJoined && onlinePlayer?.isConnected === false
      ? `<span class="side-player__offline-badge">OFFLINE</span>`
      : ""
  }
        </div>
      </div>

      <div class="side-player__resources">
        <span>🪙 ${displayPlayer.coin}</span>
        <span class="separator">|</span>
        <span>⚡ ${displayPlayer.stamina}</span>
        <span class="slot-count">${displayPlayer.usedSlots}/25</span>
      </div>

      <div class="opponent-board">
        ${renderSidePlayerBoard(displayPlayer.id)}
      </div>
    </section>
  `;
}

export function getLeftSidePlayersToRender(): Player[] {
  if (isOnlineRoomActive()) {
    return getVisibleSidePlayersForOnline().slice(0, 2);
  }

  return getPlayersLeft();
}

export function getRightSidePlayersToRender(): Player[] {
  if (isOnlineRoomActive()) {
    return getVisibleSidePlayersForOnline().slice(2);
  }

  return [playersRight[0]];
}

export function renderSidePlayerSpacers(count: number) {
  return Array.from({ length: Math.max(0, count) }, () => {
    return `<section class="side-player side-player--empty-spacer" aria-hidden="true"></section>`;
  }).join("");
}
