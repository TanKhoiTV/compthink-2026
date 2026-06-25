import { authClientState, getSavedOnlineSession } from "../online/socketClient.js";
import type { OnlineRoomState, PlayerPublicState } from "../online/socketClient.js";
import type { PlayerId } from "../types.js";

// ──────────────────────────────────────────
// Saigon Collage: types, constants, helpers
// ──────────────────────────────────────────

export function renderSaigonCollageBackground() {
  return `<div class="saigon-collage-bg" aria-hidden="true"></div>`;
}

export const SAIGON_COLLAGE_BG_SIZE = {
  width: 1308,
  height: 801,
} as const;

type SaigonHotspotKey = "vendor" | "vehicle" | "foodcart" | "women";

export type SaigonAlphaHotspot = {
  key: SaigonHotspotKey;
  selector: string;
  x: number;
  y: number;
  width: number;
  height: number;
  image?: HTMLImageElement;
  canvas?: HTMLCanvasElement;
  ctx?: CanvasRenderingContext2D | null;
};

const SAIGON_COLLAGE_HOTSPOTS: SaigonAlphaHotspot[] = [
  // v4: tọa độ crop trực tiếp từ ảnh nền gốc 1308x801.
  // Vì sprite lấy từ chính ảnh nền nên khi glow sẽ khớp vị trí, không còn bị "phân thân".
  {
    key: "vendor",
    selector: ".saigon-collage-bg__glow--vendor",
    x: 0,
    y: 0,
    width: 430,
    height: 330,
  },
  {
    key: "vehicle",
    selector: ".saigon-collage-bg__glow--vehicle",
    x: 590,
    y: 72,
    width: 360,
    height: 190,
  },
  {
    key: "foodcart",
    selector: ".saigon-collage-bg__glow--foodcart",
    x: 0,
    y: 455,
    width: 405,
    height: 305,
  },
  {
    key: "women",
    selector: ".saigon-collage-bg__glow--women",
    x: 900,
    y: 485,
    width: 390,
    height: 295,
  },
];

export function prepareSaigonAlphaCanvas(
  hotspot: SaigonAlphaHotspot,
  shell: HTMLElement,
) {
  if (hotspot.ctx && hotspot.canvas && hotspot.image?.complete) {
    return;
  }

  const image = shell.querySelector<HTMLImageElement>(hotspot.selector);

  if (
    !image ||
    !image.complete ||
    image.naturalWidth <= 0 ||
    image.naturalHeight <= 0
  ) {
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  if (!ctx) {
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0);

  hotspot.image = image;
  hotspot.canvas = canvas;
  hotspot.ctx = ctx;
}

export function getSaigonBackgroundCoordinate(
  shell: HTMLElement,
  event: MouseEvent,
) {
  const rect = shell.getBoundingClientRect();
  const scale = Math.max(
    rect.width / SAIGON_COLLAGE_BG_SIZE.width,
    rect.height / SAIGON_COLLAGE_BG_SIZE.height,
  );
  const renderedWidth = SAIGON_COLLAGE_BG_SIZE.width * scale;
  const renderedHeight = SAIGON_COLLAGE_BG_SIZE.height * scale;
  const offsetX = (rect.width - renderedWidth) / 2;
  const offsetY = (rect.height - renderedHeight) / 2;

  return {
    x: (event.clientX - rect.left - offsetX) / scale,
    y: (event.clientY - rect.top - offsetY) / scale,
  };
}

export function isInsideOpaqueSaigonPixel(
  hotspot: SaigonAlphaHotspot,
  bgX: number,
  bgY: number,
) {
  if (
    bgX < hotspot.x ||
    bgX > hotspot.x + hotspot.width ||
    bgY < hotspot.y ||
    bgY > hotspot.y + hotspot.height
  ) {
    return false;
  }

  if (!hotspot.ctx || !hotspot.canvas) {
    return false;
  }

  const localX = (bgX - hotspot.x) / hotspot.width;
  const localY = (bgY - hotspot.y) / hotspot.height;
  const pixelX = Math.min(
    hotspot.canvas.width - 1,
    Math.max(0, Math.floor(localX * hotspot.canvas.width)),
  );
  const pixelY = Math.min(
    hotspot.canvas.height - 1,
    Math.max(0, Math.floor(localY * hotspot.canvas.height)),
  );
  const alpha = hotspot.ctx.getImageData(pixelX, pixelY, 1, 1).data[3];

  // Alpha nhỏ là viền feather / nền trong suốt, không tính hover.
  return alpha > 28;
}

export function setupSaigonCollageHover() {
  // Background hover/glow đã tắt. Chỉ giữ một background tĩnh.
  const shell = document.querySelector<HTMLElement>(".game-shell");
  if (shell) {
    delete shell.dataset.saigonHover;
  }
}

// ──────────────────────────────────────────
// Screen renderers — PURE (extracted as-is)
// ──────────────────────────────────────────

export function renderAuthScreen() {
  return `
    <main class="auth-screen">
      <section class="auth-card">
        <div class="auth-card__brand">
          <span>TREKPOLOGY</span>
          <h1>Đăng nhập</h1>
          <p>Đăng nhập tài khoản để tạo phòng, join room và reconnect theo người chơi thật.</p>
        </div>

        <div class="auth-card__grid">
          <form id="auth-login-form" class="auth-form">
            <h2>Đăng nhập</h2>
            <label>
              Username
              <input id="auth-login-username" autocomplete="username" placeholder="an" />
            </label>
            <label>
              Password
              <input id="auth-login-password" autocomplete="current-password" type="password" placeholder="••••••" />
            </label>
            <button type="submit">Đăng nhập</button>
          </form>

          <form id="auth-register-form" class="auth-form">
            <h2>Đăng ký</h2>
            <label>
              Tên hiển thị
              <input id="auth-register-display-name" placeholder="An" maxlength="18" />
            </label>
            <label>
              Username
              <input id="auth-register-username" autocomplete="username" placeholder="an" />
            </label>
            <label>
              Password
              <input id="auth-register-password" autocomplete="new-password" type="password" placeholder="ít nhất 6 ký tự" />
            </label>
            <button type="submit">Tạo tài khoản</button>
          </form>
        </div>

        <div id="auth-status" class="auth-card__status" aria-live="polite"></div>

        <p class="auth-card__note">
          Bản này lưu user local trên server bằng file JSON và hash password bằng PBKDF2.
          Khi deploy thật, có thể chuyển sang PostgreSQL/Prisma mà không đổi flow UI.
        </p>
      </section>
    </main>
  `;
}

export function renderOnlineEntryScreen() {
  const savedSession = getSavedOnlineSession();

  return `
    <main class="online-entry-screen">
      <section class="online-entry-card">
        <div class="online-entry-card__brand">
          <span>TREKPOLOGY</span>
          <h1>Online Room</h1>
          <p>Tạo phòng, mời bạn bè bằng mã phòng, rồi bắt đầu khi mọi người sẵn sàng.</p>
          <p class="online-entry-card__welcome">
            Xin chào, <strong>${
    authClientState.user?.displayName ?? authClientState.user?.username ??
      "Nhà Lữ Hành"
  }</strong>
          </p>
          <button
            type="button"
            class="online-entry-card__back"
            onclick="event.stopPropagation(); window.gotoDashboard()"
          >
            ← Quay lại trang chủ
          </button>
        </div>

        <div class="online-entry-grid">
          <form class="online-entry-form" onsubmit="event.preventDefault(); event.stopPropagation(); window.createRoomFromLobby()">
            <h2>Tạo phòng</h2>
            <label>
              Tên của bạn
              <input id="lobby-create-name" value="${
    authClientState.user?.displayName ?? "An"
  }" maxlength="18" />
            </label>
            <button
              type="button"
              onclick="event.preventDefault(); event.stopPropagation(); window.createRoomFromLobby()"
            >
              Tạo phòng
            </button>
          </form>

          <form class="online-entry-form" onsubmit="event.preventDefault(); event.stopPropagation(); window.joinRoomFromLobby()">
            <h2>Vào phòng</h2>
            <label>
              Tên của bạn
              <input id="lobby-join-name" value="${
    authClientState.user?.displayName ?? "Player"
  }" maxlength="18" />
            </label>
            <label>
              Room code
              <input id="lobby-room-code" placeholder="ABC123" maxlength="8" />
            </label>
            <button
              type="button"
              onclick="event.preventDefault(); event.stopPropagation(); window.joinRoomFromLobby()"
            >
              Join phòng
            </button>
            <p class="online-entry-form__note">Slot offline đã có chủ chỉ có thể quay lại bằng Reconnect, không join lại bằng code.</p>
          </form>
        </div>

        ${
    savedSession
      ? `
              <div class="online-entry-card__resume">
                <div>
                  <strong>Phiên cũ</strong>
                  <span>Room ${savedSession.roomId} • ${savedSession.playerId} • ${savedSession.playerName}</span>
                </div>
                <button onclick="event.stopPropagation(); reconnectSavedRoomFromLobby()">Reconnect</button>
                <button class="online-entry-card__ghost" onclick="event.stopPropagation(); clearSavedRoomFromLobby()">Xóa lưu</button>
              </div>
            `
      : ""
  }
      </section>
    </main>
  `;
}

// ──────────────────────────────────────────
// Screen renderers — MIXED (refactored params)
// ──────────────────────────────────────────

export function renderOnlineLobbyRoomScreen(
  roomState: OnlineRoomState | null,
  selfPlayer: PlayerPublicState | null,
  currentPlayerId: PlayerId | null,
  canStart: boolean,
  playerIds: PlayerId[],
) {
  const isHost = currentPlayerId === "p1";

  if (!roomState || roomState.phase !== "lobby") {
    return "";
  }

  const playersHtml = playerIds
    .map((playerId) => {
      const player = roomState.players[playerId];
      const isSelf = playerId === currentPlayerId;

      const slotClass = player.isConnected
        ? "is-connected"
        : player.hasJoined
        ? "is-offline"
        : "is-empty";
      const statusText = player.isConnected
        ? player.isReady ? "READY" : "WAIT"
        : player.hasJoined
        ? "OFFLINE"
        : "-";

      const hasOccupiedSlot = player.isConnected || player.hasJoined;
      const playerDisplayName = hasOccupiedSlot ? player.name : "Đang chờ...";

      return `
        <div class="online-lobby-player ${slotClass} ${
        isSelf ? "is-self" : ""
      }">
          <div class="online-lobby-player__slot">${playerId.toUpperCase()}</div>
          <div class="online-lobby-player__info">
            <strong>${playerDisplayName}</strong>
            <span>${
        player.isConnected
          ? (player.isReady ? "Sẵn sàng" : "Chưa sẵn sàng")
          : player.hasJoined
          ? "Đã offline • giữ slot"
          : "Trống"
      }</span>
          </div>
          <div class="online-lobby-player__status ${
        player.isReady ? "is-ready" : ""
      } ${
        player.hasJoined && !player.isConnected ? "is-offline" : ""
      }">${statusText}</div>
        </div>
      `;
    })
    .join("");

  return `
    <main class="online-lobby-screen">
      <section class="online-lobby-card">
        <div class="online-lobby-card__header">
          <div>
            <span>ONLINE ROOM</span>
            <h1>${roomState.roomId}</h1>
            <p>Bạn là ${currentPlayerId?.toUpperCase()} • ${
    selfPlayer?.name ?? "Player"
  }</p>
          </div>

          <div class="online-lobby-card__header-actions">
            <button class="online-lobby-card__copy" onclick="event.stopPropagation(); copyRoomCodeFromLobby()">Copy code</button>
            <button class="online-lobby-card__leave" onclick="event.stopPropagation(); leaveRoomFromLobby()">Thoát phòng</button>
          </div>
        </div>

        <div class="online-lobby-card__players">
          ${playersHtml}
        </div>

        <div class="online-lobby-card__actions">
          <button
            class="online-lobby-card__ready ${
    selfPlayer?.isReady ? "is-ready" : ""
  }"
            onclick="event.stopPropagation(); toggleReadyFromLobby()"
          >
            ${selfPlayer?.isReady ? "Hủy sẵn sàng" : "Sẵn sàng"}
          </button>

          <button
            class="online-lobby-card__start"
            ${isHost && canStart ? "" : "disabled"}
            onclick="event.stopPropagation(); startOnlineGame()"
            title="${
    isHost
      ? "Cần tất cả người chơi connected sẵn sàng."
      : "Chỉ host P1 được bắt đầu."
  }"
          >
            Bắt đầu
          </button>
        </div>

        <div class="online-lobby-card__hint">
          Host là P1. Tất cả người chơi đang trong phòng cần bấm Sẵn sàng trước khi bắt đầu.
        </div>
      </section>
    </main>
  `;
}

export function renderOnlineRoomMenu(params: {
  isRoomActive: boolean;
  roomId: string | null;
  roomPhase: string | undefined;
  renderInGameMusicControl: () => string;
}) {
  if (!params.isRoomActive || params.roomPhase === "lobby") {
    return "";
  }

  return `
    <div class="online-room-menu" onclick="event.stopPropagation()">
      <input id="online-room-menu-toggle" class="online-room-menu__toggle-input" type="checkbox" />

      <label
        class="online-room-menu__button"
        for="online-room-menu-toggle"
        title="Mở menu phòng"
      >
        ☰
      </label>

      <div class="online-room-menu__panel">
        <div class="online-room-menu__text">
          <strong>Menu phòng</strong>
          <span>Room ${params.roomId ?? "-"}</span>
        </div>

        ${params.renderInGameMusicControl()}

        <button
          class="online-room-menu__ranking"
          onclick="event.stopPropagation(); openMidGameRanking()"
          title="Xem bảng xếp hạng giữa trận"
        >
          BXH
        </button>

        <div class="online-room-menu__export" title="Xuất chứng nhận hành trình">
          <span>Xuất</span>
          <button onclick="event.stopPropagation(); downloadTravelCertificateHtml()">Certificate</button>
        </div>

        <button
          class="online-room-menu__leave"
          onclick="event.stopPropagation(); leaveRoomFromLobby()"
          title="Thoát khỏi phòng online"
        >
          ✕
        </button>
      </div>
    </div>
  `;
}

export function applyLobbyBackground(
  appEl: HTMLElement,
  isRoomActive: boolean,
  roomPhase: string | undefined,
) {
  const isLobbyScreen = !isRoomActive || roomPhase === "lobby";

  if (isLobbyScreen) {
    // Set background directly on #app — inline style beats CSS !important
    appEl.style.setProperty(
      "background",
      "url('./assets/backgrounds/lobby-background.jpg') center/cover no-repeat #0c0b11",
      "important",
    );
  } else {
    // Remove inline override, let CSS handle game background
    appEl.style.removeProperty("background");
  }
}
