import { authClientState, socket } from "../online/socketClient.js";

function renderMapCardWrapper(content: string, extraClass = "") {
  return `<div class="map-card-col ${extraClass}">${content}</div>`;
}

export function renderMapSelectionScreen() {
  const user = authClientState.user;
  const displayName = user?.displayName || user?.username || "Nhà Lữ Hành";

  return `
    <div class="map-selection-screen">
      <header class="hub-topbar">
        <div class="hub-topbar__logo">TREKPOLOGY</div>
        <nav class="hub-topbar__nav">
          <button onclick="window.gotoDashboard()">← Quay lại Trang Chủ</button>
        </nav>
        <div class="hub-topbar__user">${displayName}</div>
      </header>

      <div class="map-selection__container">
        <div class="map-selection__header">
          <h2>Chọn Điểm Đến</h2>
          <p>Hành trình tiếp theo của bạn sẽ bắt đầu từ đâu?</p>
        </div>

        <div class="map-grid">

          ${renderMapCardWrapper(`
            <div class="map-card map-card--active">
              <div class="map-card__bg" style="background-image: url('./assets/saigon.jpg')"></div>
              <div class="map-card__overlay"></div>
              <div class="map-card__content">
                <span class="map-card__badge">Đã Mở Khoá</span>
                <div class="map-card__info">
                  <h3 class="map-card__title">SÀI GÒN</h3>
                  <p class="map-card__desc">Thành phố không ngủ, trung tâm kinh tế và văn hoá sôi động bậc nhất.</p>
                </div>
                <div class="map-card__actions">
                  <button class="map-card__btn map-card__btn--primary" id="btn-find-match" onclick="window.startMatchmaking(this)">Tìm Trận</button>
                  <button class="map-card__btn map-card__btn--secondary" onclick="window.gotoOnlineLobby()">Tạo Phòng</button>
                </div>
              </div>
            </div>
          `)}

          ${renderMapCardWrapper(`
            <div class="map-card map-card--locked">
              <div class="map-card__bg" style="background-image: url('./assets/danang.jpg')"></div>
              <div class="map-card__overlay"></div>
              <div class="map-card__content">
                <span class="map-card__badge map-card__badge--locked">Sắp ra mắt</span>
                <div class="map-card__info">
                  <h3 class="map-card__title">ĐÀ NẴNG</h3>
                  <p class="map-card__desc">Thành phố đáng sống với những cây cầu độc đáo và bờ biển quyến rũ.</p>
                </div>
              </div>
            </div>
          `)}

          ${renderMapCardWrapper(`
            <div class="map-card map-card--locked">
              <div class="map-card__bg" style="background-image: url('./assets/hanoi.jpeg')"></div>
              <div class="map-card__overlay"></div>
              <div class="map-card__content">
                <span class="map-card__badge map-card__badge--locked">Sắp ra mắt</span>
                <div class="map-card__info">
                  <h3 class="map-card__title">HÀ NỘI</h3>
                  <p class="map-card__desc">Thủ đô ngàn năm văn hiến, phố cổ thâm trầm và những gánh hàng hoa.</p>
                </div>
              </div>
            </div>
          `)}

          ${renderMapCardWrapper(`
            <div class="map-card map-card--locked">
              <div class="map-card__bg" style="background-image: url('https://images.unsplash.com/photo-1599839619722-39751411ea63?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')"></div>
              <div class="map-card__overlay"></div>
              <div class="map-card__content">
                <span class="map-card__badge map-card__badge--locked">Sắp ra mắt</span>
                <div class="map-card__info">
                  <h3 class="map-card__title">ĐÀ LẠT</h3>
                  <p class="map-card__desc">Thành phố sương mù lãng mạn, rừng thông reo và thời tiết se lạnh quanh năm.</p>
                </div>
              </div>
            </div>
          `)}

        </div>
      </div>
    </div>
  `;
}

// =========================================================
// MÀN "ĐANG TÌM TRẬN" — video máy bay loop + bộ đếm + cất cánh
// =========================================================
let isSearchingMatch = false;
const MM_TARGET = 4;

// Dựng overlay full-screen: video phòng chờ + bảng trạng thái + 4 ghế.
function buildMatchmakingOverlay(): HTMLElement {
  const el = document.createElement("div");
  el.id = "mm-overlay";
  el.className = "mm-overlay";
  const seats = Array.from({ length: MM_TARGET }, (_, i) =>
    `<span class="mm-seat${i === 0 ? " is-you" : ""}" data-seat="${i}">
       <svg viewBox="0 0 24 24" class="mm-seat__icon" aria-hidden="true"><path d="M12 12c2.7 0 4.5-1.9 4.5-4.5S14.7 3 12 3 7.5 4.9 7.5 7.5 9.3 12 12 12Zm0 2c-3.6 0-8 1.8-8 4.5V21h16v-2.5c0-2.7-4.4-4.5-8-4.5Z"/></svg>
       <b class="mm-seat__tag">${i === 0 ? "Bạn" : "Đang chờ"}</b>
     </span>`
  ).join("");

  el.innerHTML = `
    <video class="mm-overlay__video" autoplay muted loop playsinline preload="auto">
      <source src="./assets/matchmaking-plane.mp4" type="video/mp4" />
    </video>
    <div class="mm-overlay__scrim"></div>
    <div class="mm-overlay__flash"></div>

    <div class="mm-panel">
      <div class="mm-panel__kicker"><i class="mm-radar"></i>CHUYẾN BAY ĐANG MỞ CỬA</div>
      <h1 class="mm-panel__title" id="mm-title">Đang tìm <span>bạn đồng hành</span><i class="mm-dots"><b>.</b><b>.</b><b>.</b></i></h1>
      <p class="mm-panel__sub" id="mm-sub">Đang kết nối những lữ khách cùng chuyến đến Sài Gòn</p>

      <div class="mm-seats" id="mm-seats">${seats}</div>

      <div class="mm-count" id="mm-count"><b>1</b><span>/ ${MM_TARGET} lữ khách đã lên chuyến</span></div>

      <div class="mm-path"><span class="mm-path__plane">✈</span></div>

      <button class="mm-cancel" id="mm-cancel" type="button" onclick="window.cancelMatchmaking()">Huỷ tìm trận</button>
    </div>
  `;
  return el;
}

function showMatchmakingOverlay() {
  if (document.getElementById("mm-overlay")) return;
  const el = buildMatchmakingOverlay();
  document.body.appendChild(el);
  void el.offsetWidth; // ép reflow để transition vào chạy
  el.classList.add("mm-overlay--visible");
  setMatchmakingCount(1); // mặc định: chính mình
}

function hideMatchmakingOverlay() {
  const el = document.getElementById("mm-overlay");
  if (!el) return;
  el.classList.remove("mm-overlay--visible");
  window.setTimeout(() => el.remove(), 420);
}

// Cập nhật số ghế đã đầy + bộ đếm theo số người trong hàng đợi.
function setMatchmakingCount(count: number) {
  const el = document.getElementById("mm-overlay");
  if (!el) return;
  const safe = Math.max(1, Math.min(MM_TARGET, count));
  el.querySelectorAll<HTMLElement>(".mm-seat").forEach((seat, i) => {
    const filled = i < safe;
    seat.classList.toggle("is-filled", filled);
    const tag = seat.querySelector(".mm-seat__tag");
    if (tag && !seat.classList.contains("is-you")) {
      tag.textContent = filled ? "Đã vào" : "Đang chờ";
    }
  });
  const countEl = el.querySelector("#mm-count b");
  if (countEl) countEl.textContent = String(safe);
}

// Đủ đội hình → đổi chữ, đầy 4 ghế, rồi "cất cánh" (zoom + loé sáng) trước cinematic.
function playMatchmakingTakeoff() {
  const el = document.getElementById("mm-overlay");
  if (!el) return;
  setMatchmakingCount(MM_TARGET);
  const title = el.querySelector("#mm-title");
  const sub = el.querySelector("#mm-sub");
  const kicker = el.querySelector(".mm-panel__kicker");
  const cancel = el.querySelector("#mm-cancel");
  if (title) title.innerHTML = `Đủ đội hình — <span>cất cánh!</span>`;
  if (sub) sub.textContent = "Đang đưa cả đoàn vào hành trình…";
  if (kicker) kicker.innerHTML = `<i class="mm-radar is-on"></i>HOÀN TẤT GHÉP TRẬN`;
  cancel?.remove();

  el.classList.add("mm-overlay--found");
  window.setTimeout(() => el.classList.add("mm-overlay--takeoff"), 700);
  window.setTimeout(() => hideMatchmakingOverlay(), 1700);
}

(window as any).startMatchmaking = function () {
  if (isSearchingMatch) {
    (window as any).cancelMatchmaking();
    return;
  }
  const user = authClientState.user;
  const playerName = user?.displayName || user?.username || "Lữ Khách";
  isSearchingMatch = true;
  socket.emit("matchmaking:find", { playerName });
  showMatchmakingOverlay();
};

(window as any).cancelMatchmaking = function () {
  if (!isSearchingMatch) return;
  isSearchingMatch = false;
  socket.emit("matchmaking:cancel");
  hideMatchmakingOverlay();
};

// Bộ đếm live từ server (số người đang chờ trong hàng đợi).
socket.on("matchmaking:status", (payload: { count: number; target: number }) => {
  if (!isSearchingMatch) return;
  setMatchmakingCount(payload?.count ?? 1);
});

// Đã ghép đủ phòng → chạy animation cất cánh rồi vào trận.
socket.on("room:joined", () => {
  if (isSearchingMatch) {
    isSearchingMatch = false;
    playMatchmakingTakeoff();
  }
});