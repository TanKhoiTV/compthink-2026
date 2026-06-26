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
// LOGIC TÌM TRẬN & HỦY TÌM TRẬN
// =========================================================
let isSearchingMatch = false;

(window as any).startMatchmaking = function (btnElement: HTMLButtonElement) {
  const user = authClientState.user;
  const playerName = user?.displayName || user?.username || "Lữ Khách";

  if (!isSearchingMatch) {
    // --- BẬT TÌM TRẬN ---
    isSearchingMatch = true;
    socket.emit("matchmaking:find", { playerName });

    if (btnElement) {
      btnElement.innerText = "Hủy Tìm (Đang chờ...)";
      btnElement.style.backgroundColor = "#7a2828"; 
      btnElement.style.borderColor = "#7a2828";
      btnElement.style.boxShadow = "0 0 10px rgba(122, 40, 40, 0.8)";
    }
  } else {
    // --- HỦY TÌM TRẬN ---
    isSearchingMatch = false;
    socket.emit("matchmaking:cancel");

    if (btnElement) {
      btnElement.innerText = "Tìm Trận";
      btnElement.style.backgroundColor = ""; 
      btnElement.style.borderColor = "";
      btnElement.style.boxShadow = "";
    }
  }
};

// Reset nút khi server báo đã ghép phòng thành công (Phòng hờ lỗi UI)
socket.on("room:joined", () => {
  isSearchingMatch = false;
  const btnElement = document.getElementById("btn-find-match");
  if (btnElement) {
    btnElement.innerText = "Tìm Trận";
    btnElement.style.backgroundColor = "";
    btnElement.style.borderColor = "";
    btnElement.style.boxShadow = "";
  }
});