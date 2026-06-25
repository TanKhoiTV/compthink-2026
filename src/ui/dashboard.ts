import { authClientState } from "../online/socketClient.js";

export const HERO_VIDEO_SRC = "./assets/videos/one-minute-in-vietnam.mp4";

const HUB_HERO_MUTED_KEY = "trek.hubHeroMuted";
let globalHeroVideo: HTMLVideoElement | null = null;

export function cleanupDashboardHub() {
  if (globalHeroVideo) {
    try {
      globalHeroVideo.pause();
      globalHeroVideo.muted = true;
      globalHeroVideo.removeAttribute("src");
      globalHeroVideo.load();
    } catch {}
    globalHeroVideo = null;
  }
}

export function initDashboardHub() {
  cleanupDashboardHub();

  const media = document.getElementById("hub-hero-media") as HTMLElement | null;
  const video = document.getElementById("hub-hero-video") as
    | HTMLVideoElement
    | null;
  const hitarea = document.getElementById("hub-hero-video-hitarea") as
    | HTMLButtonElement
    | null;
  const muteButton = document.getElementById("hub-hero-video-mute") as
    | HTMLButtonElement
    | null;
  const volumeSlider = document.getElementById("hub-hero-video-volume") as
    | HTMLInputElement
    | null;

  if (!media || !video || !hitarea || !muteButton || !volumeSlider) return;
  globalHeroVideo = video;

  video.playsInline = true;
  video.volume = parseFloat(volumeSlider.value) || 0.85;

  const updateVideoStatus = () => {
    media.classList.toggle("hub-hero__media--paused", video.paused);

    muteButton.classList.toggle(
      "hub-hero__video-mute--muted",
      video.muted || video.volume === 0,
    );
    muteButton.classList.toggle(
      "hub-hero__video-mute--unmuted",
      !video.muted && video.volume > 0,
    );
    muteButton.setAttribute(
      "aria-label",
      (video.muted || video.volume === 0)
        ? "Bật tiếng video"
        : "Tắt tiếng video",
    );
    muteButton.setAttribute(
      "aria-pressed",
      (video.muted || video.volume === 0) ? "true" : "false",
    );

    volumeSlider.value = video.volume.toString();

    if (video.paused) {
      hitarea.setAttribute("aria-label", "Tiếp tục video");
      return;
    }

    hitarea.setAttribute("aria-label", "Tạm dừng video");
  };

  const tryAutoplay = async () => {
    let userMutedState = localStorage.getItem(HUB_HERO_MUTED_KEY) === "true";
    video.muted = userMutedState;

    try {
      await video.play();
      updateVideoStatus();
      return;
    } catch {
      video.muted = true;

      try {
        await video.play();
      } catch {
        /* Autoplay blocked entirely */
      }

      updateVideoStatus();
    }
  };

  muteButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (video.muted) {
      video.muted = false;
      if (video.volume === 0) video.volume = 0.5;
    } else {
      video.muted = true;
    }

    localStorage.setItem(HUB_HERO_MUTED_KEY, String(video.muted));

    if (!video.paused) {
      void video.play();
    }

    updateVideoStatus();
  });

  hitarea.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (video.paused) {
      void video.play();
    } else {
      video.pause();
    }

    updateVideoStatus();
  });

  video.addEventListener("play", updateVideoStatus);
  video.addEventListener("pause", updateVideoStatus);
  video.addEventListener("volumechange", updateVideoStatus);

  volumeSlider.addEventListener("input", (event) => {
    event.stopPropagation();
    const val = parseFloat(volumeSlider.value);
    video.volume = val;
    if (val > 0) {
      video.muted = false;
    }
  });

  void tryAutoplay();

  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    video.addEventListener("loadeddata", () => {
      void tryAutoplay();
    }, { once: true });
  }
}

function renderHubHeroMedia() {
  return `
    <div class="hub-hero__media" id="hub-hero-media">
      <div class="hub-hero__video-fallback" aria-hidden="true">
        <div class="hero-placeholder-pattern"></div>
      </div>
      <video
        id="hub-hero-video"
        class="hub-hero__video"
        autoplay
        loop
        playsinline
        preload="auto"
      >
        <source src="${HERO_VIDEO_SRC}" type="video/mp4" />
      </video>
      <div class="hub-hero__scrim" aria-hidden="true"></div>
      <button
        type="button"
        class="hub-hero__hitarea"
        id="hub-hero-video-hitarea"
        aria-label="Điều khiển video nền"
      ></button>
      <div class="hub-hero__audio-controls">
        <input 
          type="range" 
          class="hub-hero__video-volume" 
          id="hub-hero-video-volume" 
          min="0" max="1" step="0.01" value="0.85"
          aria-label="Âm lượng video"
        />
        <button
          type="button"
          class="hub-hero__video-mute hub-hero__video-mute--muted"
          id="hub-hero-video-mute"
          aria-label="Bật tiếng video"
          aria-pressed="true"
        >
          <svg class="hub-hero__video-mute-icon hub-hero__video-mute-icon--off" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              fill="currentColor"
              d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z"
            />
          </svg>
          <svg class="hub-hero__video-mute-icon hub-hero__video-mute-icon--on" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              fill="currentColor"
              d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"
            />
          </svg>
        </button>
      </div>
    </div>
  `;
}

function renderHubAuthPanel() {
  return `
    <section class="hub-auth" id="hub-auth">
      <div class="hub-auth__header">
        <span class="hub-auth__eyebrow">TÀI KHOẢN</span>
        <h3 class="hub-auth__title">Bắt đầu hành trình</h3>
        <p class="hub-auth__lead">Đăng nhập hoặc tạo tài khoản để tạo phòng, join bạn bè và lưu tiến trình.</p>
      </div>

      <div class="hub-auth__tabs" role="tablist">
        <button
          type="button"
          class="hub-auth__tab is-active"
          data-hub-auth-tab="login"
          onclick="window.switchHubAuthTab('login')"
        >
          Đăng nhập
        </button>
        <button
          type="button"
          class="hub-auth__tab"
          data-hub-auth-tab="register"
          onclick="window.switchHubAuthTab('register')"
        >
          Đăng ký
        </button>
      </div>

      <div class="hub-auth__panels">
        <form id="hub-auth-login-form" class="hub-auth__panel is-active" data-hub-auth-panel="login">
          <label>
            Username
            <input id="hub-auth-login-username" autocomplete="username" placeholder="an" />
          </label>
          <label>
            Password
            <input id="hub-auth-login-password" autocomplete="current-password" type="password" placeholder="••••••" />
          </label>
          <button type="submit">Đăng nhập</button>
        </form>

        <form id="hub-auth-register-form" class="hub-auth__panel" data-hub-auth-panel="register">
          <label>
            Tên hiển thị
            <input id="hub-auth-register-display-name" placeholder="An" maxlength="18" />
          </label>
          <label>
            Username
            <input id="hub-auth-register-username" autocomplete="username" placeholder="an" />
          </label>
          <label>
            Password
            <input id="hub-auth-register-password" autocomplete="new-password" type="password" placeholder="ít nhất 6 ký tự" />
          </label>
          <button type="submit">Tạo tài khoản</button>
        </form>
      </div>

      <div id="hub-auth-status" class="hub-auth__status" aria-live="polite"></div>
    </section>
  `;
}

function renderHubExplorePanel() {
  return `
    <section class="hub-explore">
      <h3 class="side-title">Góc Khám Phá</h3>

      <div class="news-item">
        <span class="news-badge news-badge--new">MỚI</span>
        <h4>Trekpology Alpha 1.0</h4>
        <p>Phiên bản đầu tiên ra mắt với bản đồ Sài Gòn — hơn 60 địa điểm đang chờ bạn khám phá.</p>
      </div>

      <div class="news-item">
        <span class="news-badge news-badge--culture">VĂN HOÁ</span>
        <h4>Chùa Bà Thiên Hậu</h4>
        <p>Ngôi chùa hơn 300 năm tuổi tại Chợ Lớn — biểu tượng văn hoá người Hoa giữa lòng Sài Gòn.</p>
      </div>

      <div class="news-item">
        <span class="news-badge news-badge--food">ẨM THỰC</span>
        <h4>Bánh Mì Sài Gòn</h4>
        <p>Ổ bánh mì đặc trưng với nhân phong phú — đại diện ẩm thực đường phố nổi tiếng toàn cầu.</p>
      </div>

      <div class="news-item">
        <span class="news-badge news-badge--nature">THIÊN NHIÊN</span>
        <h4>Cần Giờ Mangrove</h4>
        <p>Khu rừng ngập mặn lớn nhất Đông Nam Á nằm ngay cửa ngõ Sài Gòn — Di sản Sinh quyển UNESCO.</p>
      </div>

      <div class="news-item">
        <span class="news-badge news-badge--heritage">DI SẢN</span>
        <h4>Bưu Điện Trung Tâm</h4>
        <p>Công trình kiến trúc thực dân Pháp thế kỷ 19, do Gustave Eiffel thiết kế — biểu tượng Sài Gòn.</p>
      </div>
    </section>
  `;
}

function renderHubTopbarUser(isLoggedIn: boolean, displayName: string) {
  if (!isLoggedIn) {
    return `
      <button
        type="button"
        class="hub-topbar__guest"
        onclick="window.focusHubAuthPanel()"
      >
        Đăng nhập
      </button>
    `;
  }

  return `
    <div class="hub-topbar__account">
      <span class="hub-topbar__user">${displayName}</span>
      <button
        type="button"
        class="hub-topbar__logout"
        onclick="event.stopPropagation(); window.logoutFromAuthScreen()"
        title="Đăng xuất"
      >
        Thoát
      </button>
    </div>
  `;
}

export function renderDashboard(isLoading = false) {
  const user = authClientState.user;
  const isLoggedIn = Boolean(user);
  const displayName = user?.displayName || user?.username || "Nhà Lữ Hành";

  return `
    <div class="dashboard-hub ${isLoading ? "dashboard-hub--loading" : ""}">
      <!-- Modal: Hướng Dẫn Chơi -->
      <div class="hub-modal" id="modal-rules" onclick="if(event.target===this)this.classList.remove('hub-modal--open')">
        <div class="hub-modal__box">
          <button class="hub-modal__close" onclick="document.getElementById('modal-rules').classList.remove('hub-modal--open')">✕</button>
          <h2>Hướng Dẫn Chơi</h2>
          <div class="hub-modal__content">
            <h3>🎯 Mục tiêu</h3>
            <p>Mỗi người chơi xây dựng lịch trình du lịch 5 ngày, thu thập các thẻ địa điểm và ghi càng nhiều điểm VP (Điểm Hành Trình) càng tốt.</p>

            <h3>🃏 Thẻ bài</h3>
            <p>Mỗi thẻ đại diện cho một địa điểm du lịch tại Việt Nam — có các thuộc tính: Thể loại (Văn Hoá, Ẩm Thực, Thiên Nhiên...), Chi phí (Xu & Thể Lực), và Điểm VP.</p>

            <h3>⚙️ Một lượt chơi</h3>
            <ol>
              <li><strong>Draft:</strong> Chọn 1 thẻ từ tay bài chung, truyền phần còn lại cho người kế tiếp.</li>
              <li><strong>Lên kế hoạch:</strong> Đặt các thẻ đã chọn vào bảng lịch trình 5×5 của bạn.</li>
              <li><strong>Tính điểm:</strong> Server tính điểm cuối mỗi ngày theo combo thẻ.</li>
            </ol>

            <h3>🏆 Kết thúc</h3>
            <p>Sau 5 ngày chơi, người có tổng VP cao nhất giành chiến thắng và nhận Chứng Nhận Hành Trình.</p>
          </div>
        </div>
      </div>

      <!-- Modal: Về Chúng Tôi -->
      <div class="hub-modal" id="modal-about" onclick="if(event.target===this)this.classList.remove('hub-modal--open')">
        <div class="hub-modal__box">
          <button class="hub-modal__close" onclick="document.getElementById('modal-about').classList.remove('hub-modal--open')">✕</button>
          <h2>Về Chúng Tôi</h2>
          <div class="hub-modal__content">
            <p><strong>TREKPOLOGY</strong> là tựa game thẻ bài chiến lược lấy cảm hứng từ vẻ đẹp văn hoá và thiên nhiên Việt Nam.</p>
            <p>Chúng tôi tin rằng du lịch không chỉ là di chuyển — mà là khám phá, học hỏi và kết nối. Mỗi thẻ bài là một câu chuyện thật từ đất nước Việt Nam.</p>
            <h3>🔮 Sắp ra mắt</h3>
            <p>Đà Lạt • Hội An • Hạ Long • Hà Nội</p>
            <p style="margin-top:16px; font-size:12px; opacity:0.6">Phiên bản Alpha 1.0 — 2025</p>
          </div>
        </div>
      </div>

      <!-- Topbar -->
      <header class="hub-topbar">
        <div class="hub-topbar__logo">TREKPOLOGY</div>
        <nav class="hub-topbar__nav">
          <button type="button" data-onboarding-open>Hướng Dẫn Chơi</button>
          <button onclick="document.getElementById('modal-about').classList.add('hub-modal--open')">Về Chúng Tôi</button>
        </nav>
        ${renderHubTopbarUser(isLoggedIn, displayName)}
      </header>

      <!-- Body: 2 cột -->
      <div class="hub-body">

        <!-- Cột trái: Hero -->
        <div class="hub-hero">
          ${renderHubHeroMedia()}

          <div class="hub-hero__overlay">
            <div class="hub-hero__content">
              <p class="hero-eyebrow">GAME THẺ BÀI CHIẾN LƯỢC</p>
              <h1 class="hero-title">Khám Phá<br/>Việt Nam</h1>
              <p class="hero-sub">Xây dựng hành trình, thu thập địa điểm,<br/>trở thành nhà lữ hành xuất sắc nhất.</p>
              <button class="btn-play" onclick="window.gotoMapSelection()">
                ▶ &nbsp;BẮT ĐẦU HÀNH TRÌNH
              </button>
              ${
    !isLoggedIn
      ? `<p class="hero-auth-hint">Đăng nhập ở panel bên phải để vào phòng online.</p>`
      : ""
  }
            </div>
          </div>
        </div>

        <!-- Cột phải: Auth hoặc Góc Khám Phá -->
        <aside class="hub-side">
          <div class="hub-side__inner">
            ${isLoggedIn ? renderHubExplorePanel() : renderHubAuthPanel()}
          </div>
        </aside>

      </div>
    </div>
  `;
}
