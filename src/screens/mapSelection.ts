import { authClientState } from "../online/socketClient.ts";

export function renderMapSelectionScreen(): string {
  return `
    <div id="map-selection-screen" class="hub">
      <div id="hub-hero" class="hub__hero">
        <div class="hub-hero__media" id="hub-hero-media">
          <video id="hub-hero-video" class="hub-hero__video" muted loop playsinline preload="auto"
            poster="/assets/videos/one-minute-in-vietnam-poster.jpg">
            <source src="/assets/videos/one-minute-in-vietnam.mp4" type="video/mp4" />
            <p>Trình duyệt không hỗ trợ phát video.</p>
          </video>
          <div class="hub-hero__video-controls">
            <button id="hub-hero-video-hitarea" class="hub-hero__video-mute hub-hero__video-mute--paused"
              type="button" aria-label="Tạm dừng video"></button>
            <div class="hub-hero__video-mute-group">
              <button id="hub-hero-video-mute" class="hub-hero__video-mute hub-hero__video-mute--unmuted"
                type="button" aria-label="Tắt tiếng video" aria-pressed="false"></button>
              <input id="hub-hero-video-volume" class="hub-hero__video-volume" type="range" min="0" max="1" step="0.05"
                value="0.85" aria-label="Âm lượng video" />
            </div>
          </div>
        </div>
        <div class="hub__hero-title-section">
          <div class="hub__hero-badge">Pre-Alpha Demo</div>
          <h1 class="hub__hero-title">Trekkopoly</h1>
          <p class="hub__hero-subtitle">Bản đồ du lịch Việt Nam thu nhỏ!</p>
        </div>
      </div>

      <div class="hub__user-panel" id="hub-user-panel"></div>

      <div class="hub__map-selection" id="hub-map-selection"></div>

      <div class="hub__footer">
        <div class="hub__footer-section">
          <p class="hub__footer-label">Chọn thành phố</p>
          <p class="hub__footer-desc">
            Chọn một thành phố để khám phá. Mỗi thành phố có các bộ thẻ (card pool) riêng,
            gồm các điểm đến ẩm thực, văn hóa và hoạt động đặc trưng.
          </p>
        </div>
      </div>
    </div>
  `;
}
