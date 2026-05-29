/**
 * lobby.ts — Create/join room forms and lobby screen rendering.
 *
 * Extracted from TREKPOLOGY/src/app.ts (lines 531–670).
 * Interactive handlers use window.* globals bound in app.ts.
 */

export function renderOnlineEntryScreen(
	savedSession: { roomId: string; playerId: string; playerName: string } | null,
	userDisplayName: string,
): string {
	return `
    <main class="online-entry-screen">
      <section class="online-entry-card">
        <div class="online-entry-card__brand">
          <span>TREKPOLOGY</span>
          <h1>Online Room</h1>
          <p>Tạo phòng, mời bạn bè bằng mã phòng, rồi bắt đầu khi mọi người sẵn sàng.</p>
          <p class="online-entry-card__welcome">
            Xin chào, <strong>${userDisplayName}</strong>
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
              <input id="lobby-create-name" value="${userDisplayName}" maxlength="18" />
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
              <input id="lobby-join-name" value="${userDisplayName}" maxlength="18" />
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
                <button onclick="event.stopPropagation(); window.reconnectSavedRoomFromLobby()">Reconnect</button>
                <button class="online-entry-card__ghost" onclick="event.stopPropagation(); window.clearSavedRoomFromLobby()">Xóa lưu</button>
              </div>
            `
						: ""
				}
      </section>
    </main>
  `;
}

export function renderOnlineLobbyRoomScreen(
	roomId: string,
	playerId: string,
	selfPlayerName: string,
	phase: string,
	players: Array<{
		id: string;
		name: string;
		isConnected: boolean;
		hasJoined: boolean;
		isReady: boolean;
	}>,
	isHost: boolean,
	canStart: boolean,
): string {
	if (phase !== "lobby") return "";

	const playersHtml = players
		.map((player) => {
			const isSelf = player.id === playerId;

			const slotClass = player.isConnected
				? "is-connected"
				: player.hasJoined
					? "is-offline"
					: "is-empty";
			const statusText = player.isConnected
				? player.isReady
					? "READY"
					: "WAIT"
				: player.hasJoined
					? "OFFLINE"
					: "-";

			const hasOccupiedSlot = player.isConnected || player.hasJoined;
			const playerDisplayName = hasOccupiedSlot ? player.name : "Đang chờ...";

			return `
        <div class="online-lobby-player ${slotClass} ${isSelf ? "is-self" : ""}">
          <div class="online-lobby-player__slot">${player.id.toUpperCase()}</div>
          <div class="online-lobby-player__info">
            <strong>${playerDisplayName}</strong>
            <span>${player.isConnected ? (player.isReady ? "Sẵn sàng" : "Chưa sẵn sàng") : player.hasJoined ? "Đã offline • giữ slot" : "Trống"}</span>
          </div>
          <div class="online-lobby-player__status ${player.isReady ? "is-ready" : ""} ${player.hasJoined && !player.isConnected ? "is-offline" : ""}">${statusText}</div>
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
            <h1>${roomId}</h1>
            <p>Bạn là ${playerId.toUpperCase()} • ${selfPlayerName}</p>
          </div>

          <div class="online-lobby-card__header-actions">
            <button class="online-lobby-card__copy" onclick="event.stopPropagation(); window.copyRoomCodeFromLobby()">Copy code</button>
            <button class="online-lobby-card__leave" onclick="event.stopPropagation(); window.leaveRoomFromLobby()">Thoát phòng</button>
          </div>
        </div>

        <div class="online-lobby-card__players">
          ${playersHtml}
        </div>

        <div class="online-lobby-card__actions">
          <button
            class="online-lobby-card__ready"
            onclick="event.stopPropagation(); window.toggleReadyFromLobby()"
          >
            Sẵn sàng
          </button>

          <button
            class="online-lobby-card__start"
            ${isHost && canStart ? "" : "disabled"}
            onclick="event.stopPropagation(); window.startOnlineGame()"
            title="${isHost ? "Cần tất cả người chơi connected sẵn sàng." : "Chỉ host P1 được bắt đầu."}"
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
