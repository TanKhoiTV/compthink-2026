(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=function(e,t,n,r){function i(e){return e instanceof n?e:new n(function(t){t(e)})}return new(n||=Promise)(function(n,a){function o(e){try{c(r.next(e))}catch(e){a(e)}}function s(e){try{c(r.throw(e))}catch(e){a(e)}}function c(e){e.done?n(e.value):i(e.value).then(o,s)}c((r=r.apply(e,t||[])).next())})},t=`travel_board_auth_user`,n={isReady:!1,user:null};function r(){try{let e=localStorage.getItem(t);if(!e)return null;let n=JSON.parse(e);return!n||!n.username?null:n}catch{return null}}function i(e){localStorage.setItem(t,JSON.stringify(e))}function a(e,t){let n=e.trim();return{id:n.toLowerCase(),username:n,displayName:t?.trim()||n}}function o(t){return e(this,void 0,void 0,function*(){let e=t.username.trim();if(!e)throw Error(`Nhập username trước.`);if(!t.password)throw Error(`Nhập password trước.`);let r=a(e);return n.user=r,n.isReady=!0,i(r),r})}function s(t){return e(this,void 0,void 0,function*(){let e=t.username.trim();if(!e)throw Error(`Nhập username trước.`);if(!t.password||t.password.length<6)throw Error(`Password cần ít nhất 6 ký tự.`);let r=a(e,t.displayName);return n.user=r,n.isReady=!0,i(r),r})}function c(){n.user=null,n.isReady=!0,d.roomId=null,d.playerId=null,d.roomState=null,localStorage.removeItem(t),h()}var l=io(`http://localhost:3001`),u=`travel_board_online_session`,d={roomId:null,playerId:null,roomState:null};function f(){localStorage.removeItem(u)}f();function p(e){!d.roomId||!d.playerId||(localStorage.removeItem(u),sessionStorage.setItem(u,JSON.stringify({roomId:d.roomId,playerId:d.playerId,playerName:e??d.roomState?.players[d.playerId]?.name??`Player`})))}function m(){let e=sessionStorage.getItem(u);if(!e)return null;try{return JSON.parse(e)}catch{return sessionStorage.removeItem(u),null}}function h(){sessionStorage.removeItem(u),localStorage.removeItem(u),d.roomId=null,d.playerId=null,d.roomState=null}function g(e){n.user=r(),n.isReady=!0,window.setTimeout(e,0),l.on(`connect`,()=>{let e=m();!e||d.roomState||l.emit(`room:reconnect`,e)}),l.on(`room:joined`,t=>{d.roomId=t.roomId,d.playerId=t.playerId,d.roomState=t.state,p(t.state.players[t.playerId]?.name),console.log(`Joined room:`,t.roomId,`as`,t.playerId),e()}),l.on(`room:state`,t=>{d.roomState=t,e()}),l.on(`game:error`,e=>{alert(e.message)}),l.on(`connect_error`,()=>{console.warn(`Không kết nối được socket server. Kiểm tra server port 3001.`)}),l.on(`room:left`,()=>{h(),e()})}function ee(e){l.connected||l.connect(),l.emit(`room:create`,{playerName:e})}function te(e,t){l.connected||l.connect(),l.emit(`room:join`,{roomId:e,playerName:t})}function ne(e,t,n){l.emit(`room:reconnect`,{roomId:e,playerId:t,playerName:n})}function re(e){!d.roomId||!d.playerId||l.emit(`room:setReady`,{roomId:d.roomId,playerId:d.playerId,isReady:e})}function ie(){if(!d.roomId||!d.playerId){h();return}l.emit(`room:leave`,{roomId:d.roomId,playerId:d.playerId}),h()}function ae(){!d.roomId||!d.playerId||l.emit(`game:start`,{roomId:d.roomId,playerId:d.playerId})}function oe(e){!d.roomId||!d.playerId||l.emit(`draft:selectCard`,{roomId:d.roomId,playerId:d.playerId,cardId:e})}function se(e){!d.roomId||!d.playerId||l.emit(`planning:placeCard`,Object.assign({roomId:d.roomId,playerId:d.playerId},e))}function ce(e){!d.roomId||!d.playerId||l.emit(`planning:discardCard`,Object.assign({roomId:d.roomId,playerId:d.playerId},e))}function le(e={}){!d.roomId||!d.playerId||l.emit(`planning:payDebt`,Object.assign({roomId:d.roomId,playerId:d.playerId},e))}function ue(e){!d.roomId||!d.playerId||l.emit(`planning:returnBoardCard`,Object.assign({roomId:d.roomId,playerId:d.playerId},e))}function de(e,t=``){return`<div class="map-card-col ${t}">${e}</div>`}function fe(){let e=n.user;return`
    <div class="map-selection-screen">
      <header class="hub-topbar">
        <div class="hub-topbar__logo">TREKPOLOGY</div>
        <nav class="hub-topbar__nav">
          <button onclick="window.gotoDashboard()">← Quay lại Trang Chủ</button>
        </nav>
        <div class="hub-topbar__user">${e?.displayName||e?.username||`Nhà Lữ Hành`}</div>
      </header>

      <div class="map-selection__container">
        <div class="map-selection__header">
          <h2>Chọn Điểm Đến</h2>
          <p>Hành trình tiếp theo của bạn sẽ bắt đầu từ đâu?</p>
        </div>

        <div class="map-grid">

          ${de(`
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
                  <button class="map-card__btn map-card__btn--primary" onclick="window.gotoOnlineLobby()">Tìm Trận</button>
                  <button class="map-card__btn map-card__btn--secondary" onclick="window.gotoOnlineLobby()">Tạo Phòng</button>
                </div>
              </div>
            </div>
          `)}

          ${de(`
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

          ${de(`
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

          ${de(`
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
  `}var pe=function(e,t,n,r){function i(e){return e instanceof n?e:new n(function(t){t(e)})}return new(n||=Promise)(function(n,a){function o(e){try{c(r.next(e))}catch(e){a(e)}}function s(e){try{c(r.throw(e))}catch(e){a(e)}}function c(e){e.done?n(e.value):i(e.value).then(o,s)}c((r=r.apply(e,t||[])).next())})},me=`./assets/videos/one-minute-in-vietnam.mp4`;function he(){let e=document.getElementById(`hub-hero-media`),t=document.getElementById(`hub-hero-video`),n=document.getElementById(`hub-hero-video-hitarea`),r=document.getElementById(`hub-hero-video-mute`),i=document.getElementById(`hub-hero-video-volume`);if(!e||!t||!n||!r||!i)return;t.playsInline=!0,t.volume=parseFloat(i.value)||.85;let a=()=>{if(e.classList.toggle(`hub-hero__media--paused`,t.paused),r.classList.toggle(`hub-hero__video-mute--muted`,t.muted||t.volume===0),r.classList.toggle(`hub-hero__video-mute--unmuted`,!t.muted&&t.volume>0),r.setAttribute(`aria-label`,t.muted||t.volume===0?`Bật tiếng video`:`Tắt tiếng video`),r.setAttribute(`aria-pressed`,t.muted||t.volume===0?`true`:`false`),i.value=t.volume.toString(),t.paused){n.setAttribute(`aria-label`,`Tiếp tục video`);return}n.setAttribute(`aria-label`,`Tạm dừng video`)},o=()=>pe(this,void 0,void 0,function*(){t.muted=!1;try{yield t.play(),a();return}catch{t.muted=!0;try{yield t.play()}catch{}a()}});r.addEventListener(`click`,e=>{e.preventDefault(),e.stopPropagation(),t.muted?(t.muted=!1,t.volume===0&&(t.volume=.5)):t.muted=!0,t.paused||t.play(),a()}),n.addEventListener(`click`,e=>{e.preventDefault(),e.stopPropagation(),t.paused?t.play():t.pause(),a()}),t.addEventListener(`play`,a),t.addEventListener(`pause`,a),t.addEventListener(`volumechange`,a),i.addEventListener(`input`,e=>{e.stopPropagation();let n=parseFloat(i.value);t.volume=n,n>0&&(t.muted=!1)}),o(),t.readyState<HTMLMediaElement.HAVE_CURRENT_DATA&&t.addEventListener(`loadeddata`,()=>{o()},{once:!0})}function ge(){return`
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
        <source src="${me}" type="video/mp4" />
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
  `}function _e(){return`
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
  `}function ve(){return`
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
  `}function ye(e,t){return e?`
    <div class="hub-topbar__account">
      <span class="hub-topbar__user">${t}</span>
      <button
        type="button"
        class="hub-topbar__logout"
        onclick="event.stopPropagation(); window.logoutFromAuthScreen()"
        title="Đăng xuất"
      >
        Thoát
      </button>
    </div>
  `:`
      <button
        type="button"
        class="hub-topbar__guest"
        onclick="window.focusHubAuthPanel()"
      >
        Đăng nhập
      </button>
    `}function be(e=!1){let t=n.user,r=!!t,i=t?.displayName||t?.username||`Nhà Lữ Hành`;return`
    <div class="dashboard-hub ${e?`dashboard-hub--loading`:``}">

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
          <button onclick="document.getElementById('modal-rules').classList.add('hub-modal--open')">Hướng Dẫn Chơi</button>
          <button onclick="document.getElementById('modal-about').classList.add('hub-modal--open')">Về Chúng Tôi</button>
        </nav>
        ${ye(r,i)}
      </header>

      <!-- Body: 2 cột -->
      <div class="hub-body">

        <!-- Cột trái: Hero -->
        <div class="hub-hero">
          ${ge()}

          <div class="hub-hero__overlay">
            <div class="hub-hero__content">
              <p class="hero-eyebrow">GAME THẺ BÀI CHIẾN LƯỢC</p>
              <h1 class="hero-title">Khám Phá<br/>Việt Nam</h1>
              <p class="hero-sub">Xây dựng hành trình, thu thập địa điểm,<br/>trở thành nhà lữ hành xuất sắc nhất.</p>
              <button class="btn-play" onclick="window.gotoMapSelection()">
                ▶ &nbsp;BẮT ĐẦU HÀNH TRÌNH
              </button>
              ${r?``:`<p class="hero-auth-hint">Đăng nhập ở panel bên phải để vào phòng online.</p>`}
            </div>
          </div>
        </div>

        <!-- Cột phải: Auth hoặc Góc Khám Phá -->
        <aside class="hub-side">
          <div class="hub-side__inner">
            ${r?ve():_e()}
          </div>
        </aside>

      </div>
    </div>
  `}var xe=[{card_id:`SG_FOOD_001`,name:`Cà Phê Bệt Nhà Thờ Đức Bà`,description:`Trải nghiệm vỉa hè chuẩn Sài Gòn. Thức uống siêu rẻ nhưng bạn phải đánh cược với thời tiết nắng mưa bất chợt.`,image_url:`images/phase1/sg_food_001.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`OUTDOOR`],cost:{xu:1,la:0},base_vp:5,location:{lat:10.7798,lng:106.699,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`COMMON`,icon:`☕`},{card_id:`SG_FOOD_002`,name:`Ăn Vặt Hồ Con Rùa`,description:`Tụ điểm hóng gió lý tưởng nhưng khói bụi giao thông là điều không thể tránh khỏi.`,image_url:`images/phase1/sg_food_002.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`OUTDOOR`],cost:{xu:1,la:0},base_vp:5,location:{lat:10.7828,lng:106.6955,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`COMMON`,icon:`🍽️`},{card_id:`SG_FOOD_003`,name:`Cà Phê Vợt Cheo Leo`,description:`Hương vị thời gian đọng lại trong quán cà phê vợt lâu đời nhất thành phố. Yên bình, rẻ và an toàn tuyệt đối.`,image_url:`images/phase1/sg_food_003.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`INDOOR`],cost:{xu:1,la:0},base_vp:8,location:{lat:10.7685,lng:106.678,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`COMMON`,icon:`☕`},{card_id:`SG_FOOD_004`,name:`Phá Lấu Bò Cô Oanh (Quận 4)`,description:`Chén phá lấu đỏ au, thơm lừng nước cốt dừa ăn kèm bánh mì nóng giòn. Ngồi ghế súp vỉa hè ngắm xe cộ qua lại đúng chất dân chơi Quận 4.`,image_url:`images/phase1/sg_food_004.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`OUTDOOR`],cost:{xu:1,la:0},base_vp:5,location:{lat:10.7598,lng:106.7015,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`COMMON`,icon:`🍽️`},{card_id:`SG_FOOD_005`,name:`Súp Cua Chợ Tân Định`,description:`Chén súp nóng hổi, đặc ruột cạnh ngôi chợ hồng biểu tượng. Cứu đói nhanh gọn cho hành trình dài.`,image_url:`images/phase1/sg_food_005.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`OUTDOOR`],cost:{xu:1,la:0},base_vp:5,location:{lat:10.7895,lng:106.6881,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`COMMON`,icon:`🍽️`},{card_id:`SG_FOOD_006`,name:`Bánh Mì Huỳnh Hoa`,description:`Ổ bánh mì nặng trịch pate, ăn một nửa cũng đủ no. Đổi lại, bạn phải kiên nhẫn xếp hàng mua mang đi.`,image_url:`images/phase1/sg_food_006.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`OUTDOOR`],cost:{xu:2,la:0},base_vp:10,location:{lat:10.7715,lng:106.6931,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🥖`},{card_id:`SG_FOOD_007`,name:`Phố Ẩm Thực Hồ Thị Kỷ`,description:`Thiên đường ăn vặt và mùi hoa tươi đan xen. Ăn no căng bụng nhưng rã rời đôi chân vì chen lấn.`,image_url:`images/phase1/sg_food_007.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`OUTDOOR`],cost:{xu:2,la:1},base_vp:15,location:{lat:10.7671,lng:106.6773,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🍽️`},{card_id:`SG_FOOD_008`,name:`Cà Phê Chung Cư 42 Nguyễn Huệ`,description:`Trạm nghỉ chân hoài cổ nhìn ra phố đi bộ hiện đại. Nơi trú mưa hoàn hảo giữa lịch trình cạn kiệt.`,image_url:`images/phase1/sg_food_008.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`INDOOR`],cost:{xu:2,la:0},base_vp:12,location:{lat:10.7743,lng:106.7031,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`☕`},{card_id:`SG_FOOD_009`,name:`Phố Sủi Cảo Hà Tôn Quyền`,description:`Tiếng gọi món rôm rả cả góc phố người Hoa. Nằm xa trung tâm nên hãy cẩn thận bẫy khoảng cách di chuyển.`,image_url:`images/phase1/sg_food_009.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`OUTDOOR`],cost:{xu:2,la:0},base_vp:12,location:{lat:10.7592,lng:106.6558,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🍽️`},{card_id:`SG_FOOD_010`,name:`Cơm Tấm Ba Ghiền`,description:`Miếng sườn nướng than to bằng cái đĩa. Trải nghiệm no nê.`,image_url:`images/phase1/sg_food_010.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`INDOOR`],cost:{xu:2,la:1},base_vp:15,location:{lat:10.7951,lng:106.6781,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🍚`},{card_id:`SG_FOOD_011`,name:`Phố Ốc Vĩnh Khánh`,description:`Mùi bơ tỏi và mỡ hành nức mũi. Đại diện xuất sắc nhất cho văn hóa ăn ốc của giới trẻ thành phố.`,image_url:`images/phase1/sg_food_011.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`OUTDOOR`],cost:{xu:2,la:0},base_vp:12,location:{lat:10.7601,lng:106.7029,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🍽️`},{card_id:`SG_FOOD_012`,name:`Bánh Xèo Đinh Công Tráng`,description:`Tiệm bánh xèo miền Nam truyền thống ẩn trong hẻm. Vừa giòn.`,image_url:`images/phase1/sg_food_012.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`INDOOR`],cost:{xu:2,la:0},base_vp:10,location:{lat:10.7901,lng:106.689,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🍽️`},{card_id:`SG_FOOD_013`,name:`Chè Hà Ký Chợ Lớn`,description:`Chè trứng gà trà, chè mè đen trứ danh. Điểm chốt ngọt ngào sau chuyến khám phá văn hóa phố Tàu.`,image_url:`images/phase1/sg_food_013.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`INDOOR`],cost:{xu:2,la:0},base_vp:10,location:{lat:10.7516,lng:106.6622,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🍽️`},{card_id:`SG_FOOD_014`,name:`Phở Hòa Pasteur`,description:`Biểu tượng Phở miền Nam nổi tiếng với khách quốc tế. Không gian lịch sự, giá cao nhưng trải nghiệm tròn trịa.`,image_url:`images/phase1/sg_food_014.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`INDOOR`],cost:{xu:3,la:0},base_vp:15,location:{lat:10.7892,lng:106.6896,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`EPIC`,icon:`🍜`},{card_id:`SG_FOOD_015`,name:`Lẩu Cá Kèo Bà Huyện Thanh Quan`,description:`Nồi lẩu chua lá giang sôi sùng sục cùng cá kèo tươi rói. Biểu tượng nhậu lai rai cực kỳ bén mồi của người miền Nam.`,image_url:`images/phase1/sg_food_015.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`INDOOR`],cost:{xu:3,la:0},base_vp:18,location:{lat:10.7785,lng:106.6858,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`EPIC`,icon:`🍲`},{card_id:`SG_FOOD_016`,name:`Quán Bụi - Hương Vị Quê Nhà`,description:`Những món ăn thuần Việt được nâng tầm tinh tế. Không gian hoài cổ với chén sành, đũa tre, mang lại lượng điểm ổn định giữa lòng Quận 1.`,image_url:`images/phase1/sg_food_016.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`INDOOR`],cost:{xu:3,la:0},base_vp:18,location:{lat:10.7831,lng:106.7025,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`EPIC`,icon:`🍽️`},{card_id:`SG_FOOD_017`,name:`Dimsum Tiến Phát`,description:`Bữa sáng xa xỉ kiểu Quảng Đông. Đánh đổi số tiền lớn để thu về lượng điểm khổng lồ ngay từ lúc bình minh.`,image_url:`images/phase1/sg_food_017.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`INDOOR`],cost:{xu:4,la:0},base_vp:25,location:{lat:10.7538,lng:106.6631,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`EPIC`,icon:`🍽️`},{card_id:`SG_FOOD_018`,name:`Nhà Hàng Chay Hum`,description:`Không gian thiền tịnh, thức ăn thanh lọc. Mọi muộn phiền tan biến, cơ thể bạn được hồi phục sinh lực hoàn toàn.`,image_url:`images/phase1/sg_food_018.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`INDOOR`],cost:{xu:4,la:0},base_vp:15,location:{lat:10.7811,lng:106.6914,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`EPIC`,icon:`🍽️`},{card_id:`SG_FOOD_019`,name:`Ăn Tối Du Thuyền Sông Sài Gòn`,description:`Thưởng thức bít tết và rượu vang trôi dọc dòng sông rực sáng ánh đèn. Trải nghiệm đắt đỏ nhưng xứng đáng từng đồng.`,image_url:`images/phase1/sg_food_019.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`ACTION`],cost:{xu:5,la:0},base_vp:35,location:{lat:10.763,lng:106.7071,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`LEGENDARY`,icon:`🍽️`},{card_id:`SG_FOOD_020`,name:`Harpers-Bazaar Tầng 79 Landmark 81`,description:`Bữa ăn trên đỉnh bầu trời Sài Gòn. Bạn đốt ngót nghét 60% ngân sách khởi điểm để giáng đòn chí mạng về điểm số.`,image_url:`images/phase1/sg_food_020.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`INDOOR`],cost:{xu:6,la:0},base_vp:45,location:{lat:10.795,lng:106.7218,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`LEGENDARY`,icon:`🍽️`},{card_id:`SG_FOOD_021`,name:`Cơm Quê Dượng Bầu`,description:`Mâm cơm quê mộc mạc với trứng chiên, canh chua nhưng được phục vụ trong không gian sang trọng bậc nhất. Trải nghiệm tìm về tuổi thơ nhưng với một cái giá của người trưởng thành.`,image_url:`images/phase1/sg_food_021.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`INDOOR`],cost:{xu:5,la:0},base_vp:35,location:{lat:10.7725,lng:106.6901,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`LEGENDARY`,icon:`🍚`},{card_id:`SG_FOOD_022`,name:`Ly Dừa Tắc Pasteur`,description:`Thức uống giải nhiệt huyền thoại dưới những tán cây cổ thụ. Rẻ, mát lạnh nhưng bạn phải đứng uống giữa khói bụi dòng xe qua lại.`,image_url:`images/phase1/sg_food_022.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`OUTDOOR`],cost:{xu:1,la:0},base_vp:5,location:{lat:10.7891,lng:106.6894,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`COMMON`,icon:`☕`},{card_id:`SG_FOOD_023`,name:`Bột Chiên Đạt Thành`,description:`Đĩa bột chiên giòn rụm với trứng và đu đủ ngâm chua. Nằm sâu trong khu người Hoa, giá rẻ và an toàn tuyệt đối khỏi những cơn mưa.`,image_url:`images/phase1/sg_food_023.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`INDOOR`],cost:{xu:1,la:0},base_vp:8,location:{lat:10.7545,lng:106.6642,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`COMMON`,icon:`🍽️`},{card_id:`SG_FOOD_024`,name:`Xôi Mặn Bùi Thị Xuân`,description:`Gói xôi thập cẩm bọc lá chuối chắc nịch đầy lạp xưởng và chà bông. Bữa sáng quốc dân cung cấp năng lượng tức thì để bắt đầu ngày mới.`,image_url:`images/phase1/sg_food_024.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`OUTDOOR`],cost:{xu:1,la:0},base_vp:5,location:{lat:10.7681,lng:106.688,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`COMMON`,icon:`🍽️`},{card_id:`SG_FOOD_025`,name:`Lẩu Bò Tí Chuột`,description:`Nồi lẩu khói nghi ngút bên vỉa hè sầm uất. Ngon rẻ và rất dễ để tụ tập nối Combo với bạn bè vào buổi tối muộn.`,image_url:`images/phase1/sg_food_025.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`OUTDOOR`],cost:{xu:2,la:0},base_vp:12,location:{lat:10.764,lng:106.6835,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🍲`},{card_id:`SG_FOOD_026`,name:`Bún Thịt Nướng Kiều Bảo`,description:`Hương vị thịt nướng sả ướp đậm đà lan tỏa cả góc phố. Một lựa chọn cực kỳ chắc bụng, miễn nhiễm với thời tiết xấu.`,image_url:`images/phase1/sg_food_026.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`INDOOR`],cost:{xu:2,la:0},base_vp:10,location:{lat:10.7761,lng:106.666,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🍽️`},{card_id:`SG_FOOD_027`,name:`Ốc Như Điện Biên Phủ`,description:`Một trong những tiệm ốc chất lượng nhất. Bạn được ăn ngon, an toàn nhưng phải chầu chực xếp hàng lấy số đến mức hao mòn thể lực.`,image_url:`images/phase1/sg_food_027.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`INDOOR`],cost:{xu:2,la:1},base_vp:15,location:{lat:10.7718,lng:106.6811,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🍽️`},{card_id:`SG_FOOD_028`,name:`Tàu Hũ Đá Xe Lam`,description:`Chén tàu hũ truyền thống kết hợp topping hiện đại. Khuất bóng ở khu phố ẩm thực sầm uất, là trạm nghỉ chân ngọt ngào và mát lạnh.`,image_url:`images/phase1/sg_food_028.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`INDOOR`],cost:{xu:2,la:0},base_vp:10,location:{lat:10.7965,lng:106.6912,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🛵`},{card_id:`SG_FOOD_029`,name:`Lẩu Cua Đất Mũi`,description:`Thưởng thức cua Cà Mau chắc thịt trong không gian máy lạnh. Tốn kém nhưng lại mang đến lượng VP khổng lồ vô cùng an toàn.`,image_url:`images/phase1/sg_food_029.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`INDOOR`],cost:{xu:4,la:0},base_vp:22,location:{lat:10.7621,lng:106.6912,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`EPIC`,icon:`🍲`},{card_id:`SG_FOOD_030`,name:`Noir. Dining in the Dark`,description:`Bữa ăn tuyệt mật hoàn toàn trong bóng tối, được phục vụ bởi người khiếm thị. Trải nghiệm ẩm thực thức tỉnh mọi giác quan khiến tâm trí bạn kiệt sức nhưng ấn tượng sâu sắc.`,image_url:`images/phase1/sg_food_030.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`INDOOR`],cost:{xu:5,la:0},base_vp:35,location:{lat:10.7885,lng:106.6948,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!0,effect_type:`DEDUCT_LA`,effect_value:1},rarity:`LEGENDARY`,icon:`🍽️`}],Se=[{card_id:`SG_UTIL_001`,name:`Trụ ATM`,description:`Ngân sách cạn kiệt, bạn rảo bộ tìm bốt ATM để tiếp tế đạn dược. Mỏi chân đôi chút nhưng ví tiền lại rủng rỉnh.`,image_url:`images/phase1/sg_util_001.png`,phase_pool:`SAIGON`,tags:[`UTILITY`,`INDOOR`],cost:{xu:0,la:1},base_vp:0,location:{lat:10.7715,lng:106.6931,is_virtual:!0,label:`Sài Gòn`},on_play_effect:{has_effect:!0,effect_type:`RECOVER_XU`,effect_value:2},rarity:`UNCOMMON`,icon:`💰`},{card_id:`SG_UTIL_002`,name:`Trụ ATM`,description:`Ngân sách cạn kiệt, bạn rảo bộ tìm bốt ATM để tiếp tế đạn dược. Mỏi chân đôi chút nhưng ví tiền lại rủng rỉnh.`,image_url:`images/phase1/sg_util_001.png`,phase_pool:`SAIGON`,tags:[`UTILITY`,`INDOOR`],cost:{xu:0,la:1},base_vp:0,location:{lat:10.7715,lng:106.6931,is_virtual:!0,label:`Sài Gòn`},on_play_effect:{has_effect:!0,effect_type:`RECOVER_XU`,effect_value:2},rarity:`UNCOMMON`,icon:`💰`},{card_id:`SG_UTIL_003`,name:`Voucher Xe Công Nghệ`,description:`Chớp được mã gọi xe giá hời trên ứng dụng. Ngồi ô tô máy lạnh cho phép bạn nhảy cóc đến bất cứ đâu mà không lo mỏi chân.`,image_url:`images/phase1/sg_util_003.png`,phase_pool:`SAIGON`,tags:[`UTILITY`,`INDOOR`],cost:{xu:1,la:0},base_vp:0,location:{lat:10.7715,lng:106.6931,is_virtual:!0,label:`Sài Gòn`},on_play_effect:{has_effect:!0,effect_type:`IGNORE_DISTANCE_NEXT`,effect_value:1},rarity:`COMMON`,icon:`🎟️`},{card_id:`SG_UTIL_004`,name:`Voucher Xe Công Nghệ`,description:`Chớp được mã gọi xe giá hời trên ứng dụng. Ngồi ô tô máy lạnh cho phép bạn nhảy cóc đến bất cứ đâu mà không lo mỏi chân.`,image_url:`images/phase1/sg_util_003.png`,phase_pool:`SAIGON`,tags:[`UTILITY`,`INDOOR`],cost:{xu:1,la:0},base_vp:0,location:{lat:10.7715,lng:106.6931,is_virtual:!0,label:`Sài Gòn`},on_play_effect:{has_effect:!0,effect_type:`IGNORE_DISTANCE_NEXT`,effect_value:1},rarity:`COMMON`,icon:`🎟️`},{card_id:`SG_UTIL_005`,name:`Voucher Giảm Giá`,description:`Thu thập được một mã khuyến mãi chớp nhoáng. Thẻ này sẽ giúp bạn giảm đáng kể chi phí cho hoạt động đắt đỏ tiếp theo.`,image_url:`images/phase1/sg_util_005.png`,phase_pool:`SAIGON`,tags:[`UTILITY`,`INDOOR`,`OUTDOOR`],cost:{xu:0,la:0},base_vp:0,location:{lat:10.7715,lng:106.6931,is_virtual:!0,label:`Sài Gòn`},on_play_effect:{has_effect:!0,effect_type:`DISCOUNT_XU_NEXT`,effect_value:2},rarity:`COMMON`,icon:`🎟️`},{card_id:`SG_UTIL_006`,name:`Voucher Giảm Giá`,description:`Thu thập được một mã khuyến mãi chớp nhoáng. Thẻ này sẽ giúp bạn giảm đáng kể chi phí cho hoạt động đắt đỏ tiếp theo.`,image_url:`images/phase1/sg_util_005.png`,phase_pool:`SAIGON`,tags:[`UTILITY`,`INDOOR`,`OUTDOOR`],cost:{xu:0,la:0},base_vp:0,location:{lat:10.7715,lng:106.6931,is_virtual:!0,label:`Sài Gòn`},on_play_effect:{has_effect:!0,effect_type:`DISCOUNT_XU_NEXT`,effect_value:2},rarity:`COMMON`,icon:`🎟️`},{card_id:`SG_UTIL_007`,name:`Xe Đạp Công Cộng`,description:`Quét mã thuê một chiếc xe đạp để băng qua dòng xe kẹt cứng. Né được thuật toán trừ điểm khoảng cách nhưng bạn sẽ toát mồ hôi hột.`,image_url:`images/phase1/sg_util_007.png`,phase_pool:`SAIGON`,tags:[`UTILITY`,`OUTDOOR`],cost:{xu:0,la:2},base_vp:0,location:{lat:10.7715,lng:106.6931,is_virtual:!0,label:`Sài Gòn`},on_play_effect:{has_effect:!0,effect_type:`IGNORE_DISTANCE_NEXT`,effect_value:1},rarity:`EPIC`,icon:`🛵`},{card_id:`SG_UTIL_008`,name:`Xe Đạp Công Cộng`,description:`Quét mã thuê một chiếc xe đạp để băng qua dòng xe kẹt cứng. Né được thuật toán trừ điểm khoảng cách nhưng bạn sẽ toát mồ hôi hột.`,image_url:`images/phase1/sg_util_007.png`,phase_pool:`SAIGON`,tags:[`UTILITY`,`OUTDOOR`],cost:{xu:0,la:2},base_vp:0,location:{lat:10.7715,lng:106.6931,is_virtual:!0,label:`Sài Gòn`},on_play_effect:{has_effect:!0,effect_type:`IGNORE_DISTANCE_NEXT`,effect_value:1},rarity:`EPIC`,icon:`🛵`},{card_id:`SG_UTIL_009`,name:`Tiệm Massage Chân`,description:`Ngâm chân thảo mộc và ấn huyệt chuyên sâu. Một khoản đầu tư xứng đáng để đôi chân được hồi sinh sau chuỗi ngày cuốc bộ rã rời.`,image_url:`images/phase1/sg_util_009.png`,phase_pool:`SAIGON`,tags:[`UTILITY`,`INDOOR`],cost:{xu:2,la:0},base_vp:0,location:{lat:10.7715,lng:106.6931,is_virtual:!0,label:`Sài Gòn`},on_play_effect:{has_effect:!0,effect_type:`RECOVER_LA`,effect_value:3},rarity:`UNCOMMON`,icon:`⚡`},{card_id:`SG_UTIL_010`,name:`Tiệm Massage Chân`,description:`Ngâm chân thảo mộc và ấn huyệt chuyên sâu. Một khoản đầu tư xứng đáng để đôi chân được hồi sinh sau chuỗi ngày cuốc bộ rã rời.`,image_url:`images/phase1/sg_util_009.png`,phase_pool:`SAIGON`,tags:[`UTILITY`,`INDOOR`],cost:{xu:2,la:0},base_vp:0,location:{lat:10.7715,lng:106.6931,is_virtual:!0,label:`Sài Gòn`},on_play_effect:{has_effect:!0,effect_type:`RECOVER_LA`,effect_value:3},rarity:`UNCOMMON`,icon:`⚡`},{card_id:`SG_UTIL_011`,name:`Cửa Hàng Tiện Lợi 24/7`,description:`Đẩy cửa bước vào, luồng khí lạnh phả vào mặt lập tức xua tan cái nóng. Mua tạm chai nước suối và đứng hưởng sái điều hòa.`,image_url:`images/phase1/sg_util_011.png`,phase_pool:`SAIGON`,tags:[`UTILITY`,`INDOOR`],cost:{xu:0,la:0},base_vp:0,location:{lat:10.7715,lng:106.6931,is_virtual:!0,label:`Sài Gòn`},on_play_effect:{has_effect:!0,effect_type:`RECOVER_LA`,effect_value:1},rarity:`COMMON`,icon:`⚡`},{card_id:`SG_UTIL_012`,name:`Cửa Hàng Tiện Lợi 24/7`,description:`Đẩy cửa bước vào, luồng khí lạnh phả vào mặt lập tức xua tan cái nóng. Mua tạm chai nước suối và đứng hưởng sái điều hòa.`,image_url:`images/phase1/sg_util_011.png`,phase_pool:`SAIGON`,tags:[`UTILITY`,`INDOOR`],cost:{xu:0,la:0},base_vp:0,location:{lat:10.7715,lng:106.6931,is_virtual:!0,label:`Sài Gòn`},on_play_effect:{has_effect:!0,effect_type:`RECOVER_LA`,effect_value:1},rarity:`COMMON`,icon:`⚡`},{card_id:`SG_UTIL_013`,name:`Tiệm Gội Đầu Dưỡng Sinh`,description:`Đắm chìm trong hương sả chanh và những động tác xoa bóp điêu luyện. Trải nghiệm thư giãn đặc sản này giúp bạn rũ bỏ mọi mệt mỏi.`,image_url:`images/phase1/sg_util_013.png`,phase_pool:`SAIGON`,tags:[`UTILITY`,`INDOOR`],cost:{xu:1,la:0},base_vp:0,location:{lat:10.7715,lng:106.6931,is_virtual:!0,label:`Sài Gòn`},on_play_effect:{has_effect:!0,effect_type:`RECOVER_LA`,effect_value:2},rarity:`COMMON`,icon:`⚡`},{card_id:`SG_UTIL_014`,name:`Tiệm Gội Đầu Dưỡng Sinh`,description:`Đắm chìm trong hương sả chanh và những động tác xoa bóp điêu luyện. Trải nghiệm thư giãn đặc sản này giúp bạn rũ bỏ mọi mệt mỏi.`,image_url:`images/phase1/sg_util_013.png`,phase_pool:`SAIGON`,tags:[`UTILITY`,`INDOOR`],cost:{xu:1,la:0},base_vp:0,location:{lat:10.7715,lng:106.6931,is_virtual:!0,label:`Sài Gòn`},on_play_effect:{has_effect:!0,effect_type:`RECOVER_LA`,effect_value:2},rarity:`COMMON`,icon:`⚡`},{card_id:`SG_UTIL_015`,name:`Thuê Thợ Ảnh Dạo`,description:`Bắt gặp một thợ nháy dạo chuyên nghiệp, bạn chi tiền để có bộ ảnh sống ảo chất lượng. Nhân đôi giá trị kỷ niệm cho điểm đến kế tiếp.`,image_url:`images/phase1/sg_util_015.png`,phase_pool:`SAIGON`,tags:[`UTILITY`,`OUTDOOR`],cost:{xu:2,la:0},base_vp:0,location:{lat:10.7715,lng:106.6931,is_virtual:!0,label:`Sài Gòn`},on_play_effect:{has_effect:!0,effect_type:`DOUBLE_VP_NEXT`,effect_value:1},rarity:`UNCOMMON`,icon:`🧰`}],Ce=[{card_id:`SG_ACT_001`,name:`Thảo Cầm Viên Sài Gòn`,description:`Lạc bước giữa không gian xanh mát của khu bảo tồn động thực vật lâu đời nhất thành phố. Khuôn viên rộng lớn sẽ ngốn của bạn không ít mồ hôi và sức lực.`,image_url:`images/phase1/sg_act_001.png`,phase_pool:`SAIGON`,tags:[`ACTION`,`OUTDOOR`],cost:{xu:1,la:2},base_vp:15,location:{lat:10.7873344,lng:106.7050566,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`EPIC`,icon:`🎒`},{card_id:`SG_ACT_002`,name:`Phố Tây Bùi Viện`,description:`Nhịp sống cuồng nhiệt không ngủ. Bạn vui hết nấc trong tiếng nhạc xập xình, nhưng việc chen lấn giữa biển người sẽ vắt kiệt thể lực của bạn.`,image_url:`images/phase1/sg_act_002.png`,phase_pool:`SAIGON`,tags:[`ACTION`,`OUTDOOR`],cost:{xu:2,la:2},base_vp:22,location:{lat:10.7674,lng:106.694,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`EPIC`,icon:`🎒`},{card_id:`SG_ACT_003`,name:`Nhà hát Kịch IDECAF`,description:`Thưởng thức những vở kịch chất lượng cao trong không gian khán phòng ấm cúng. Trải nghiệm giải trí tuyệt vời mà không tốn một giọt mồ hôi.`,image_url:`images/phase1/sg_act_003.png`,phase_pool:`SAIGON`,tags:[`ACTION`,`INDOOR`],cost:{xu:3,la:0},base_vp:20,location:{lat:10.7796931,lng:106.7037049,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`EPIC`,icon:`🎒`},{card_id:`SG_ACT_004`,name:`Công viên nước Đầm Sen`,description:`Vẫy vùng trong làn nước mát lạnh và thử sức với các ống trượt cảm giác mạnh. Một ngày vui chơi tơi bời nhưng cũng đốt cháy toàn bộ năng lượng.`,image_url:`images/phase1/sg_act_004.png`,phase_pool:`SAIGON`,tags:[`ACTION`,`OUTDOOR`],cost:{xu:2,la:2},base_vp:22,location:{lat:10.7688947,lng:106.6359939,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`EPIC`,icon:`🌳`},{card_id:`SG_ACT_005`,name:`Snow Town Sài Gòn`,description:`Trải nghiệm cái lạnh cắt da giữa lòng thành phố nhiệt đới. Chơi đùa với bãi tuyết nhân tạo mang lại cảm giác thích thú lạ kỳ và vô cùng sảng khoái.`,image_url:`images/phase1/sg_act_005.png`,phase_pool:`SAIGON`,tags:[`ACTION`,`INDOOR`],cost:{xu:3,la:1},base_vp:28,location:{lat:10.771911,lng:106.753896,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`EPIC`,icon:`🎒`},{card_id:`SG_ACT_006`,name:`Sân vận động Thống Nhất`,description:`Hòa mình vào không khí cuồng nhiệt trên khán đài. Tiếng hò reo cổ vũ vang dội làm bạn vô cùng phấn khích và tiêu hao đôi chút năng lượng.`,image_url:`images/phase1/sg_act_006.png`,phase_pool:`SAIGON`,tags:[`ACTION`,`OUTDOOR`],cost:{xu:1,la:1},base_vp:12,location:{lat:10.760687,lng:106.6632718,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🏃`},{card_id:`SG_ACT_007`,name:`Jump Arena HimLam`,description:`Thử thách bản thân với các trò chơi nhún nhảy bạt lò xo. Một hoạt động thể chất cường độ cao, đảm bảo khiến bạn thở dốc chỉ sau vài chục phút.`,image_url:`images/phase1/sg_act_007.png`,phase_pool:`SAIGON`,tags:[`ACTION`,`INDOOR`],cost:{xu:2,la:2},base_vp:20,location:{lat:10.7420731,lng:106.6951195,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`EPIC`,icon:`🎒`},{card_id:`SG_ACT_008`,name:`Khu du lịch Văn Thánh`,description:`Tận hưởng không gian xanh mát và yên bình ven hồ. Một buổi cắm trại dã ngoại nhẹ nhàng giúp gắn kết tình cảm với những người bạn đồng hành.`,image_url:`images/phase1/sg_act_008.png`,phase_pool:`SAIGON`,tags:[`ACTION`,`OUTDOOR`],cost:{xu:2,la:1},base_vp:15,location:{lat:10.7987213,lng:106.7165604,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🎒`},{card_id:`SG_ACT_009`,name:`Chèo thuyền SUP Thanh Đa`,description:`Khua mái chèo lướt đi trên dòng sông tĩnh lặng ngắm hoàng hôn. Trải nghiệm lãng mạn nhưng cũng đòi hỏi sự thăng bằng và sức mạnh đáng kể từ đôi tay.`,image_url:`images/phase1/sg_act_009.png`,phase_pool:`SAIGON`,tags:[`ACTION`,`OUTDOOR`],cost:{xu:2,la:2},base_vp:22,location:{lat:10.8202401,lng:106.7262736,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`EPIC`,icon:`🚣`},{card_id:`SG_ACT_010`,name:`Công viên văn hóa Suối Tiên`,description:`Khu vui chơi giải trí khổng lồ mang đậm màu sắc văn hóa dân tộc. Đi bộ qua các đền đài và tham gia vô vàn trò chơi sẽ rút cạn sức lực của bạn.`,image_url:`images/phase1/sg_act_010.png`,phase_pool:`SAIGON`,tags:[`ACTION`,`OUTDOOR`],cost:{xu:2,la:3},base_vp:25,location:{lat:10.8661863,lng:106.8031678,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`LEGENDARY`,icon:`🌳`},{card_id:`SG_ACT_011`,name:`Khu căn cứ Vàm Sát Đảo Khỉ`,description:`Hành trình mạo hiểm tiến sâu vào khu dự trữ sinh quyển ngập mặn. Thách thức lớn về cả khoảng cách di chuyển lẫn sức chịu đựng trước thiên nhiên hoang dã.`,image_url:`images/phase1/sg_act_011.png`,phase_pool:`SAIGON`,tags:[`ACTION`,`OUTDOOR`],cost:{xu:3,la:3},base_vp:35,location:{lat:10.4094821,lng:106.888644,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`LEGENDARY`,icon:`🎒`},{card_id:`SG_ACT_012`,name:`Phố đi bộ Nguyễn Huệ`,description:`Tản bộ thong dong trên con phố hiện đại bậc nhất nhộn nhịp người qua lại. Khá dễ chịu vào buổi tối nhưng sẽ rút sức bạn nhanh chóng nếu ghé qua vào buổi trưa.`,image_url:`images/phase1/sg_act_012.png`,phase_pool:`SAIGON`,tags:[`ACTION`,`OUTDOOR`],cost:{xu:0,la:1},base_vp:10,location:{lat:10.7740664,lng:106.7036542,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🎒`},{card_id:`SG_ACT_013`,name:`Saigon Centre`,description:`Chìm đắm trong thế giới mua sắm cao cấp ngập tràn ánh đèn và hàng hiệu. Một trải nghiệm đốt tiền nhanh chóng nhưng bù lại bằng sự thỏa mãn tuyệt đối.`,image_url:`images/phase1/sg_act_013.png`,phase_pool:`SAIGON`,tags:[`ACTION`,`INDOOR`],cost:{xu:2,la:1},base_vp:15,location:{lat:10.7731031,lng:106.70105,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🎒`},{card_id:`SG_ACT_014`,name:`Khu liên hợp Thể thao Quận 5`,description:`Đắm mình dưới làn nước xanh mát của hồ bơi hoặc bung sức tại các sân cầu lông. Lựa chọn tuyệt vời để rèn luyện thể chất vào những ngày nhiệt độ tăng cao.`,image_url:`images/phase1/sg_act_014.png`,phase_pool:`SAIGON`,tags:[`ACTION`,`INDOOR`],cost:{xu:1,la:2},base_vp:18,location:{lat:10.7524216,lng:106.6685424,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`EPIC`,icon:`🏃`},{card_id:`SG_ACT_015`,name:`Công Viên Bờ Sông Sài Gòn Tp Thủ Đức`,description:`Ngắm nhìn toàn cảnh thành phố lung linh từ phía bờ Đông. Bãi cỏ rộng lớn và gió lộng thổi không ngừng, lý tưởng để dạo mát và thả diều.`,image_url:`images/phase1/sg_act_015.png`,phase_pool:`SAIGON`,tags:[`ACTION`,`OUTDOOR`],cost:{xu:0,la:1},base_vp:10,location:{lat:10.7716904,lng:106.7098014,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🌳`},{card_id:`SG_ACT_016`,name:`Archery Tag Vietnam`,description:`Hóa thân thành cung thủ trong một trận chiến sinh tồn đầy kịch tính. Bạn sẽ phải chạy nước rút, ẩn nấp và ngắm bắn liên tục đến bở hơi tai.`,image_url:`images/phase1/sg_act_016.png`,phase_pool:`SAIGON`,tags:[`ACTION`,`OUTDOOR`],cost:{xu:2,la:2},base_vp:20,location:{lat:10.8198607,lng:106.7256808,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`EPIC`,icon:`🎒`},{card_id:`SG_ACT_017`,name:`Sân trượt băng Vincom Landmark 81`,description:`Mũi giày trượt lướt êm ái trên mặt băng lạnh giá trong tòa nhà cao nhất Việt Nam. Trải nghiệm giải trí xa xỉ tiêu tốn không ít hầu bao của bạn.`,image_url:`images/phase1/sg_act_017.png`,phase_pool:`SAIGON`,tags:[`ACTION`,`INDOOR`],cost:{xu:4,la:1},base_vp:30,location:{lat:10.7943125,lng:106.7220625,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`EPIC`,icon:`🏃`},{card_id:`SG_ACT_018`,name:`Công viên Tao Đàn`,description:`Lá phổi xanh của thành phố ngập tràn bóng cây cổ thụ. Dạo bước trên những con đường rợp bóng mát là cách tuyệt vời để thư giãn đôi chân mỏi mệt.`,image_url:`images/phase1/sg_act_018.png`,phase_pool:`SAIGON`,tags:[`ACTION`,`OUTDOOR`],cost:{xu:0,la:1},base_vp:8,location:{lat:10.7755796,lng:106.6920797,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🌳`},{card_id:`SG_ACT_019`,name:`Board Game Station`,description:`Đấu trí căng thẳng qua những ván cờ đầy toan tính. Tiếng cười nói rộn rã trong phòng máy lạnh xua tan đi cái mệt nhọc của những chuyến đi dài.`,image_url:`images/phase1/sg_phase_act_019.png`,phase_pool:`SAIGON`,tags:[`ACTION`,`INDOOR`],cost:{xu:1,la:1},base_vp:15,location:{lat:10.765794,lng:106.695688,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🎒`},{card_id:`SG_ACT_020`,name:`Trải nghiệm Saigon Waterbus`,description:`Lướt trên mặt sóng ngắm nhìn toàn cảnh đường chân trời hiện đại dọc hai bờ sông. Trải nghiệm ngắm cảnh thư thái tuyệt vời mà không đòi hỏi nhiều sự vận động.`,image_url:`images/phase1/sg_act_020.png`,phase_pool:`SAIGON`,tags:[`ACTION`,`OUTDOOR`],cost:{xu:1,la:0},base_vp:12,location:{lat:10.773403,lng:106.705552,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🎒`}],we=[{card_id:`SG_CULT_001`,name:`Dinh Độc Lập`,description:`Chứng nhân lịch sử với kiến trúc độc bản. Khám phá các sảnh đường khổng lồ và đường hầm bí mật sẽ tiêu tốn không ít thể lực của bạn.`,image_url:`images/phase1/sg_cult_001.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`INDOOR`,`OUTDOOR`],cost:{xu:3,la:1},base_vp:22,location:{lat:10.7769942,lng:106.6953021,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`EPIC`,icon:`🏯`},{card_id:`SG_CULT_002`,name:`Bưu điện trung tâm Sài Gòn`,description:`Mái vòm thép vĩ đại mang đậm dấu ấn hoài niệm. Gửi một tấm bưu thiếp và tận hưởng không gian kiến trúc Pháp an toàn, mát mẻ.`,image_url:`images/phase1/sg_cult_002.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`INDOOR`],cost:{xu:1,la:0},base_vp:10,location:{lat:10.7799129,lng:106.699902,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🏯`},{card_id:`SG_CULT_003`,name:`Nhà thờ Đức Bà Sài Gòn`,description:`Biểu tượng tôn giáo với gạch nung đỏ rực. Chiêm ngưỡng vẻ đẹp cổ kính từ bên ngoài và lắng nghe tiếng chuông ngân vang giữa phố thị.`,image_url:`images/phase1/sg_cult_003.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`OUTDOOR`],cost:{xu:0,la:1},base_vp:8,location:{lat:10.7797855,lng:106.6990189,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`⛪`},{card_id:`SG_CULT_004`,name:`Bảo tàng Chứng tích Chiến tranh`,description:`Trải nghiệm lịch sử sâu sắc và nặng nề. Những tư liệu chân thực khiến bạn tĩnh lặng và tiêu hao đáng kể năng lượng tinh thần.`,image_url:`images/phase1/sg_cult_004.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`INDOOR`],cost:{xu:2,la:1},base_vp:15,location:{lat:10.7795106,lng:106.6920916,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🏛️`},{card_id:`SG_CULT_005`,name:`Bảo tàng Lịch sử Thành phố Hồ Chí Minh`,description:`Kho tàng di sản ngàn năm của dân tộc. Đi bộ mải miết qua các gian trưng bày rộng lớn đòi hỏi sự bền bỉ của đôi chân.`,image_url:`images/phase1/sg_cult_005.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`INDOOR`],cost:{xu:2,la:1},base_vp:15,location:{lat:10.788075,lng:106.7047291,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🏛️`},{card_id:`SG_CULT_006`,name:`Bảo tàng Mỹ thuật Thành phố Hồ Chí Minh`,description:`Tòa dinh thự 99 cửa với hành lang ngập nắng. Trạm dừng chân nghệ thuật tuyệt đẹp để cho ra đời những bức ảnh lưu niệm ấn tượng.`,image_url:`images/phase1/sg_cult_006.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`INDOOR`],cost:{xu:2,la:0},base_vp:15,location:{lat:10.7699472,lng:106.6992162,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🏛️`},{card_id:`SG_CULT_007`,name:`Nhà hát Thành phố Hồ Chí Minh`,description:`Thưởng thức nghệ thuật thính phòng trong một công trình tráng lệ. Một buổi tối đắt đỏ nhưng mang lại trải nghiệm văn hóa đẳng cấp.`,image_url:`images/phase1/sg_cult_007.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`INDOOR`,`OUTDOOR`],cost:{xu:5,la:0},base_vp:35,location:{lat:10.7766128,lng:106.7031715,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`LEGENDARY`,icon:`🏯`},{card_id:`SG_CULT_008`,name:`UBND Thành phố Hồ Chí Minh`,description:`Kiến trúc thời Pháp tuyệt đẹp ngay trung tâm. Một điểm check-in không tốn kém, nhưng việc nán lại lâu dưới nắng gắt sẽ khiến bạn hao tổn sức lực.`,image_url:`images/phase1/sg_cult_008.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`OUTDOOR`],cost:{xu:0,la:1},base_vp:8,location:{lat:10.7765431,lng:106.700916,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🏯`},{card_id:`SG_CULT_009`,name:`Chùa Ngọc Hoàng`,description:`Ngôi chùa cổ linh thiêng ngập trong khói nhang. Nơi du khách tìm kiếm sự bình an và tĩnh lặng giữa nhịp sống hối hả.`,image_url:`images/phase1/sg_cult_009.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`INDOOR`],cost:{xu:1,la:0},base_vp:12,location:{lat:10.7919963,lng:106.6981791,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🛕`},{card_id:`SG_CULT_010`,name:`Miếu Bà Thiên Hậu - Hội Quán Tuệ Thành`,description:`Tuyệt tác kiến trúc của người Hoa tại Chợ Lớn. Khói nhang vòng cuộn tỏa mang theo những lời cầu nguyện bình an che chở bạn khỏi muộn phiền.`,image_url:`images/phase1/sg_cult_010.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`INDOOR`],cost:{xu:1,la:0},base_vp:12,location:{lat:10.7532496,lng:106.6611735,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🛕`},{card_id:`SG_CULT_011`,name:`Hội Quán Nghĩa An`,description:`Rực rỡ với nghệ thuật chạm khắc gỗ tinh xảo. Nơi giao lưu văn hóa và tín ngưỡng đặc sắc của cộng đồng Triều Châu ẩn mình trong khu phố chật hẹp.`,image_url:`images/phase1/sg_cult_011.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`INDOOR`],cost:{xu:1,la:0},base_vp:12,location:{lat:10.753729,lng:106.6620902,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🛕`},{card_id:`SG_CULT_012`,name:`Chợ Bình Tây`,description:`Khu chợ đầu mối sầm uất với kiến trúc hình bát quái. Đôi chân bạn mỏi nhừ vì luồn lách qua hàng ngàn sạp hàng chen chúc.`,image_url:`images/phase1/sg_cult_012.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`INDOOR`],cost:{xu:2,la:1},base_vp:15,location:{lat:10.7493638,lng:106.6510455,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🏯`},{card_id:`SG_CULT_013`,name:`Nhà thờ Giáo xứ Thánh Phanxicô Xaviê`,description:`Sự kết hợp độc đáo giữa kiến trúc Gothic và phong cách Á Đông nằm ngay giữa lòng khu Chợ Lớn sầm uất.`,image_url:`images/phase1/sg_cult_013.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`INDOOR`,`OUTDOOR`],cost:{xu:0,la:1},base_vp:8,location:{lat:10.751965,lng:106.6543386,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`⛪`},{card_id:`SG_CULT_014`,name:`Hội quán Ôn Lăng - Chùa quan âm`,description:`Ngôi chùa cổ kính với mặt tiền lộng lẫy và những quần thể tượng gốm tinh xảo trải dài trên mái ngói nhuốm màu thời gian.`,image_url:`images/phase1/sg_cult_014.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`INDOOR`],cost:{xu:1,la:0},base_vp:12,location:{lat:10.7541333,lng:106.6596253,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🛕`},{card_id:`SG_CULT_015`,name:`Bến Nhà Rồng - Bảo tàng Hồ Chí Minh`,description:`Tòa nhà mang kiến trúc Á-Âu bên bờ sông lộng gió. Không gian lịch sử hào hùng cùng tầm nhìn thoáng đãng ra dòng sông rộng lớn.`,image_url:`images/phase1/sg_cult_015.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`INDOOR`,`OUTDOOR`],cost:{xu:3,la:1},base_vp:20,location:{lat:10.7682488,lng:106.7068028,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`EPIC`,icon:`🏛️`},{card_id:`SG_CULT_016`,name:`Lăng Tả quân Lê Văn Duyệt (Lăng Ông - Bà Chiểu)`,description:`Biểu tượng văn hóa lâu đời của đất Gia Định. Việc tản bộ trong khuôn viên rộng lớn và uy nghiêm này đòi hỏi sự bền bỉ của đôi chân.`,image_url:`images/phase1/sg_cult_016.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`INDOOR`,`OUTDOOR`],cost:{xu:1,la:1},base_vp:12,location:{lat:10.8022201,lng:106.697085,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🏯`},{card_id:`SG_CULT_017`,name:`Địa Đạo Củ Chi - Bến Dược`,description:`Hành trình luồn lách dưới lòng đất hẹp. Một thử thách sinh tồn vắt kiệt thể lực và tốn kém thời gian đi lại, nhưng trải nghiệm lịch sử mang lại thực sự vô giá.`,image_url:`images/phase1/sg_cult_017.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`OUTDOOR`],cost:{xu:4,la:3},base_vp:40,location:{lat:11.1463927,lng:106.45944,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`LEGENDARY`,icon:`🏯`},{card_id:`SG_CULT_018`,name:`Chiến khu Rừng Sác`,description:`Khám phá căn cứ địa giữa rừng ngập mặn Cần Giờ. Hành trình lội rừng vất vả và chặng đường dài sẽ thử thách sức chịu đựng của bạn.`,image_url:`images/phase1/sg_cult_018.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`OUTDOOR`],cost:{xu:4,la:2},base_vp:35,location:{lat:10.4155579,lng:106.8818514,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`LEGENDARY`,icon:`🏯`},{card_id:`SG_CULT_019`,name:`Chùa Bửu Long`,description:`Lộng lẫy như một cung điện Thái Lan thu nhỏ ẩn mình ở vùng ven thành phố. Bạn sẽ mất kha khá thời gian và sức lực để đến được đây, nhưng khung cảnh thì hoàn toàn xứng đáng.`,image_url:`images/phase1/sg_cult_019.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`OUTDOOR`],cost:{xu:2,la:2},base_vp:25,location:{lat:10.8788722,lng:106.8350287,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`EPIC`,icon:`🛕`},{card_id:`SG_CULT_020`,name:`Khu Tưởng niệm Liệt sĩ Ngã ba Giồng`,description:`Di tích lịch sử oai hùng nằm lặng lẽ ở ngoại ô Hóc Môn. Một chuyến đi dài về vùng ven sẽ thử thách tính kiên nhẫn và sức bền của bất kỳ đôi chân nào.`,image_url:`images/phase1/sg_cult_020.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`OUTDOOR`],cost:{xu:1,la:2},base_vp:25,location:{lat:10.868225,lng:106.5585429,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`EPIC`,icon:`🏯`},{card_id:`SG_CULT_021`,name:`Đình Bình Hòa`,description:`Di tích kiến trúc cổ mang đậm dấu ấn làng mạc Nam Bộ xưa. Yên tĩnh, mộc mạc và hoàn toàn tách biệt khỏi nhịp sống ồn ào của phố thị.`,image_url:`images/phase1/sg_cult_021.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`INDOOR`,`OUTDOOR`],cost:{xu:0,la:0},base_vp:8,location:{lat:10.8117004,lng:106.6964598,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`COMMON`,icon:`🏯`},{card_id:`SG_CULT_022`,name:`Chùa Pháp Vân`,description:`Điểm đến tâm linh thanh tịnh. Nơi thích hợp để trú chân, lấy lại sự bình tĩnh và phục hồi tinh thần sau những chặng đường dài.`,image_url:`images/phase1/sg_cult_022.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`INDOOR`],cost:{xu:0,la:0},base_vp:8,location:{lat:10.8122079,lng:106.6930287,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`COMMON`,icon:`🛕`},{card_id:`SG_CULT_024`,name:`Bảo tàng Phụ nữ Nam bộ`,description:`Tìm hiểu về vẻ đẹp và sự kiên cường của người phụ nữ Nam Bộ. Một không gian mang tính giáo dục và là trạm dừng chân an toàn khỏi thời tiết khắc nghiệt.`,image_url:`images/phase1/sg_cult_024.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`INDOOR`],cost:{xu:1,la:0},base_vp:10,location:{lat:10.7836813,lng:106.6876327,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🏛️`},{card_id:`SG_CULT_025`,name:`Nhà thờ Tân Định (Nhà thờ Màu Hồng)`,description:`Công trình kiến trúc Gothic rực rỡ với sắc hồng độc đáo. Một bức ảnh check-in tại đây là điều không thể thiếu, dù thời tiết bên ngoài có oi ả đến đâu.`,image_url:`images/phase1/sg_cult_025.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`OUTDOOR`],cost:{xu:1,la:0},base_vp:10,location:{lat:10.7887,lng:106.6896,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`⛪`},{card_id:`SG_CULT_026`,name:`Hẻm Hào Sĩ Phường`,description:`Con hẻm trăm tuổi mang đậm màu sắc điện ảnh Hong Kong xưa. Đi bộ nhẹ nhàng nhưng mang lại cảm giác bình yên, hoài cổ giữa lòng Chợ Lớn sầm uất.`,image_url:`images/phase1/sg_cult_026.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`OUTDOOR`],cost:{xu:0,la:1},base_vp:8,location:{lat:10.7521,lng:106.6631,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🏯`},{card_id:`SG_CULT_027`,name:`Phố Lồng Đèn Lương Nhữ Học`,description:`Cả khu phố rực sáng bởi hàng ngàn chiếc lồng đèn thủ công. Vô cùng náo nhiệt nhưng việc luồn lách giữa dòng người đông đúc sẽ làm bạn toát mồ hôi.`,image_url:`images/phase1/sg_cult_027.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`OUTDOOR`],cost:{xu:1,la:1},base_vp:10,location:{lat:10.7523,lng:106.6578,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🏯`},{card_id:`SG_CULT_028`,name:`Chùa Giác Lâm`,description:`Tổ đình lâu đời nhất Sài Gòn với kiến trúc chữ Tam truyền thống. Không gian tĩnh lặng, an toàn để bạn né tránh những cơn mưa rào bất chợt.`,image_url:`images/phase1/sg_cult_028.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`INDOOR`],cost:{xu:1,la:0},base_vp:12,location:{lat:10.7686,lng:106.6473,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🛕`},{card_id:`SG_CULT_029`,name:`Bến Bình Đông`,description:`Tản bộ dọc dòng kênh ngắm nhìn những chiếc thuyền chở đầy hoa trái miền Tây. Một trải nghiệm văn hóa sông nước hiếm hoi còn sót lại.`,image_url:`images/phase1/sg_cult_029.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`OUTDOOR`],cost:{xu:0,la:1},base_vp:8,location:{lat:10.7381,lng:106.6525,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🏯`},{card_id:`SG_CULT_030`,name:`Bảo tàng TP.HCM (Dinh Gia Long)`,description:`Khám phá câu chuyện phát triển của thành phố trong tòa dinh thự cổ kính. Cầu thang gỗ và những hành lang rộng mở đem đến sự thư thái tuyệt đối.`,image_url:`images/phase1/sg_cult_030.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`INDOOR`],cost:{xu:2,la:0},base_vp:15,location:{lat:10.7758,lng:106.6997,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🏛️`},{card_id:`SG_CULT_031`,name:`Việt Nam Quốc Tự`,description:`Ngôi chùa khổng lồ với bảo tháp sừng sững giữa lòng Quận 10. Khuôn viên rộng lớn đòi hỏi bạn phải đi bộ khá nhiều dưới tiết trời oi ả.`,image_url:`images/phase1/sg_cult_031.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`INDOOR`,`OUTDOOR`],cost:{xu:1,la:1},base_vp:15,location:{lat:10.7709,lng:106.6733,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🏯`},{card_id:`SG_CULT_032`,name:`Phố Đồ Cổ Lê Công Kiều`,description:`Con phố ngắn ngủi nhưng chứa đựng hàng ngàn món cổ vật. Bạn mất khá nhiều thời gian và công sức để lùng sục những món đồ ưng ý dọc hai bên vỉa hè.`,image_url:`images/phase1/sg_cult_032.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`OUTDOOR`],cost:{xu:1,la:1},base_vp:15,location:{lat:10.7708,lng:106.7011,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🏯`},{card_id:`SG_CULT_033`,name:`Bảo tàng Y học Cổ truyền Việt Nam (FITO Museum)`,description:`Một bảo tàng tư nhân độc đáo với kiến trúc gỗ chạm khắc tinh xảo. Đắt tiền, nhưng trải nghiệm không gian y học cổ truyền dịu mát là vô giá.`,image_url:`images/phase1/sg_cult_033.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`INDOOR`],cost:{xu:3,la:0},base_vp:18,location:{lat:10.7766,lng:106.6738,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`EPIC`,icon:`🏛️`},{card_id:`SG_CULT_034`,name:`Đền Tưởng niệm các Vua Hùng`,description:`Công trình uy nghiêm mang đậm tinh thần dân tộc. Việc lặn lội ra tận vùng ngoại ô ngập nắng sẽ bào mòn đáng kể thể lực của bạn.`,image_url:`images/phase1/sg_cult_034.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`OUTDOOR`],cost:{xu:2,la:2},base_vp:22,location:{lat:10.8415,lng:106.829,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`EPIC`,icon:`🏯`},{card_id:`SG_CULT_035`,name:`Bảo tàng Áo Dài`,description:`Không gian kiến trúc mộc mạc ẩn mình giữa thiên nhiên tĩnh lặng. Một chuyến đi đòi hỏi sự đầu tư lớn về mặt thời gian và sức lực khi phải rời xa chốn thị thành.`,image_url:`images/phase1/sg_cult_035.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`INDOOR`,`OUTDOOR`],cost:{xu:3,la:1},base_vp:22,location:{lat:10.8143,lng:106.8409,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`EPIC`,icon:`🏛️`},{card_id:`SG_CULT_036`,name:`Tu viện Khánh An`,description:`Góc Nhật Bản thu nhỏ với những mảng màu nâu trầm và mái ngói uốn lượn. Nằm khá xa trung tâm thành phố, đòi hỏi bạn phải có một lịch trình di chuyển thật khéo léo.`,image_url:`images/phase1/sg_cult_036.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`INDOOR`,`OUTDOOR`],cost:{xu:2,la:1},base_vp:20,location:{lat:10.8705,lng:106.6713,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`EPIC`,icon:`🏯`}],Te=[...xe,...Se,...Ce,...we];console.log(`[DATA CHECK] cards.phase1.ts loaded`),console.log(`[DATA CHECK] total cards:`,Te.length),console.log(`[DATA CHECK] tag counts:`,Te.reduce((e,t)=>{let n=t.tags?.[0]??`UNKNOWN`;return e[n]=(e[n]??0)+1,e},{})),console.log(`[DATA CHECK] first 10 cards:`,Te.slice(0,10));function Ee(e){return e.includes(`FOOD`)?`FOOD`:e.includes(`CULTURE`)?`CULTURE`:e.includes(`ACTION`)?`ACTION`:e.includes(`UTILITY`)?`UTILITY`:e[0]??`FOOD`}function De(e){switch(e){case`FOOD`:return`Ẩm thực`;case`CULTURE`:return`Văn hóa`;case`ACTION`:return`Khám phá`;case`UTILITY`:return`Tiện ích`;case`OUTDOOR`:return`Ngoài trời`;case`INDOOR`:return`Trong nhà`;default:return`Khác`}}function Oe(e){switch(e){case`COMMON`:return`★`;case`UNCOMMON`:return`★★`;case`EPIC`:return`★★★★`;case`LEGENDARY`:return`★★★★★`;default:return`★`}}function ke(e){switch(e){case`COMMON`:return`common`;case`UNCOMMON`:return`uncommon`;case`EPIC`:return`epic`;case`LEGENDARY`:return`legendary`;default:return`common`}}function Ae(e){if(e.on_play_effect.has_effect){if(e.on_play_effect.effect_type===`RECOVER_LA`)return`Khi đặt xuống: hồi ${e.on_play_effect.effect_value} thể lực`;if(e.on_play_effect.effect_type===`RECOVER_XU`)return`Khi đặt xuống: hồi ${e.on_play_effect.effect_value} xu`;if(e.on_play_effect.effect_type===`GAIN_VP`)return`Khi đặt xuống: +${e.on_play_effect.effect_value} VP`}return e.tags.includes(`FOOD`)?`Nếu có 2 lá Ẩm thực: +5 VP`:e.tags.includes(`CULTURE`)?`Nếu có 2 lá Văn hóa: +8 VP`:e.tags.includes(`ACTION`)?`Nếu đặt sau lá Khám phá: +10 VP`:`Không có hiệu ứng đặc biệt`}function je(e){let t=e.trim(),n={"Cà Phê Bệt Nhà Thờ Đức Bà":`Cà Phê Bệt`,"Bánh Tráng Nướng Hồ Con Rùa":`Bánh Tráng`,"Cà Phê Vợt Cheo Leo":`Cà Phê Vợt`,"Phá Lấu Bò Cô Oanh":`Phá Lấu`,"Súp Cua Chợ Tân Định":`Súp Cua`,"Bánh Mì Huỳnh Hoa":`Bánh Mì`,"Phố Ẩm Thực Hồ Thị Kỷ":`Hồ Thị Kỷ`,"Cà Phê Chung Cư 42 Nguyễn Huệ":`Cà Phê 42`,"Phố Sủi Cảo Hà Tôn Quyền":`Sủi Cảo`,"Cơm Tấm Ba Ghiền":`Cơm Tấm`,"Phố Ốc Vĩnh Khánh":`Ốc Vĩnh Khánh`,"Bánh Xèo Đinh Công Tráng":`Bánh Xèo`,"Chè Hà Ký Chợ Lớn":`Chè Hà Ký`,"Phở Hòa Pasteur":`Phở Hòa`,"Lẩu Cá Kèo Bà Huyện Thanh Quan":`Lẩu Cá Kèo`,"Dimsum Tiến Phát":`Dimsum`,"Nhà Hàng Chay Hum":`Chay Hum`,"Ăn Tối Du Thuyền Sông Sài Gòn":`Du Thuyền Tối`,"Tầng 79 Landmark 81":`Landmark 81`,"Cơm Quê Dượng Bầu":`Dượng Bầu`,"Du Thuyền Hạ Long":`Du Thuyền`,"Chợ Đêm Đà Lạt":`Chợ Đêm`};if(n[t])return n[t];if(t.length<=14)return t;let r=t.split(/\s+/);return r.length<=3?t:r.slice(0,3).join(` `)}function Me(e){let t=e.trim(),n={"Quận 1 - Công viên 30/4":`Q.1`,"Quận 3 - Vòng xoay Công trường Quốc Tế":`Q.3`,"Quận 3 - Giáp ranh Quận 10":`Q.3`,"Quận 4 - Đường Tôn Đản":`Q.4`,"Quận 1 - Chợ Tân Định":`Q.1`,"Quận 1 - Đường Lê Thị Riêng":`Q.1`,"Quận 10 - Chợ Hoa":`Q.10`,"Quận 1 - Phố đi bộ Nguyễn Huệ":`Q.1`,"Quận 11 - Khu Chợ Lớn":`Q.11`,"Phú Nhuận - Cư xá Nguyễn Văn Trỗi":`Phú Nhuận`,"Quận 4 - Bờ kè":`Q.4`,"Quận 1 - Gần chợ Tân Định":`Q.1`,"Quận 5 - Châu Văn Liêm":`Q.5`,"Quận 3 - Đường Pasteur":`Q.3`,"Quận 3 - Bà Huyện Thanh Quan":`Q.3`,"Quận 5 - Khu Chợ Lớn":`Q.5`,"Quận 3 - Võ Văn Tần":`Q.3`,"Quận 4 - Bến cảng Nhà Rồng":`Q.4`,"Bình Thạnh - Vinhomes Central Park":`Bình Thạnh`,"Khu vực trung tâm":`Trung tâm`,"Sài Gòn":`Sài Gòn`,"Hà Nội":`Hà Nội`,"Đà Lạt":`Đà Lạt`,"Đà Nẵng":`Đà Nẵng`,"Quảng Ninh":`Quảng Ninh`};if(n[t])return n[t];if(t.length<=12)return t;if(t.includes(`Quận`)){let e=t.match(/Quận\s*\d+/i);if(e)return e[0].replace(`Quận`,`Q.`)}return t.slice(0,12).trim()+`...`}function Ne(e){let t=Ee(e.tags),n=e.location.label??e.phase_pool;return{id:e.card_id,name:e.name,shortName:je(e.name),city:n,shortCity:Me(n),image:e.image_url,rarity:ke(e.rarity),rarityLabel:Oe(e.rarity),vp:e.base_vp,coin:e.cost.xu,stamina:e.cost.la,tag:t.toLowerCase(),tagLabel:De(t),tags:e.tags,onPlayEffect:e.on_play_effect,icon:e.icon,description:e.description,bonusText:Ae(e)}}var _=[1,2,3,4,5],Pe=[`Sáng`,`Trưa`,`Chiều`,`Tối`,`Khuya`];function Fe(){return Pe.map(()=>_.map(()=>null))}function Ie(e,t){let n=[];for(let r=0;r<Pe.length;r+=1){let i=e[r]?.[t]??null;i&&n.push(i)}return n}function Le(e,t,n){return e[t]?.[n]??null}function Re(e){return e.tags&&e.tags.length>0?e.tags.map(e=>e.toUpperCase()):[e.tag.toUpperCase()]}function ze(e,t){return e.filter(e=>Re(e).includes(t)).length}function Be(){return 1}function Ve(e,t=Be()){return e[t]}function He({placedCards:e,getBoardDisplayName:t}){let n=e.reduce((e,t)=>e+t.vp,0),r=e.reduce((e,t)=>e+t.coin,0),i=e.reduce((e,t)=>e+t.stamina,0),a=[],o=0,s=rt(e,`FOOD`),c=rt(e,`CULTURE`),l=rt(e,`ACTION`);s>=2&&(o+=5,a.push(`Combo Ẩm thực x${s}: +5 VP`)),c>=2&&(o+=8,a.push(`Combo Văn hóa x${c}: +8 VP`)),l>=2&&(o+=10,a.push(`Chuỗi Khám phá x${l}: +10 VP`));for(let n of e){let e=n.onPlayEffect;e?.has_effect&&e.effect_type===`GAIN_VP`&&(o+=e.effect_value,a.push(`${t(n)}: +${e.effect_value} VP`))}return a.length===0&&a.push(`Chưa có bonus nào được kích hoạt`),{baseVP:n,bonusVP:o,totalVP:n+o,spentCoin:r,spentStamina:i,usedSlots:e.length,lines:a}}function Ue(e){return e?.boardTokenType??null}function We(e){return Ue(e)===`debt`}function Ge(e){return Ue(e)===`lock`}function Ke(e){return e?.debtAmount??0}function qe({boardSlots:e,currentDayIndex:t,dayLabel:n,rows:r,getCardTagKeys:i,countCardsWithTag:a,getCurrentDayPlacedCards:o}){let s=[],c=t,l={dayIndex:c,label:n,vp:0,steps:0},u=o(c),d=null;for(let t=0;t<r.length;t+=1){let o=e[t]?.[c]??null,f=r[t];if(!o){s.push({id:`empty_${c}_${t}`,dayIndex:c,rowIndex:t,dayLabel:n,timeLabel:f,title:`Không có hoạt động`,subtitle:`Không có hoạt động, xem như thời gian nghỉ / di chuyển.`,vpDelta:0,coinDelta:0,staminaDelta:0,isEmpty:!0});continue}if(We(o)){l.vp+=-20,l.steps+=1,s.push({id:o.id,dayIndex:c,rowIndex:t,dayLabel:n,timeLabel:f,title:`Token nợ`,subtitle:`Nợ tiền ${Ke(o)} xu`,vpDelta:-20,coinDelta:0,staminaDelta:0,isDebtPenalty:!0,isBoardToken:!0});continue}if(Ge(o)){s.push({id:o.id,dayIndex:c,rowIndex:t,dayLabel:n,timeLabel:f,title:`Bị khóa`,subtitle:`Kiệt sức, không thể xếp hoạt động.`,vpDelta:0,coinDelta:0,staminaDelta:0,isBoardToken:!0});continue}let p=i(o),m=``;p.includes(`FOOD`)&&a(u,`FOOD`)>=2?m=`Combo Ẩm thực đang kích hoạt`:p.includes(`CULTURE`)&&a(u,`CULTURE`)>=2?m=`Combo Văn hóa đang kích hoạt`:p.includes(`ACTION`)&&a(u,`ACTION`)>=2&&(m=`Chuỗi Khám phá đang kích hoạt`);let h=Xe(o,c,t),g=(d?$e(d,o,c,t):null)??h,ee=g?.vpDelta??0,te=g?.staminaDelta??0,ne=o.vp+ee;l.vp+=ne,l.steps+=1,s.push({id:o.id,dayIndex:c,rowIndex:t,dayLabel:n,timeLabel:f,title:o.name,subtitle:`${o.city} • ${o.tagLabel}`,vpDelta:ne,coinDelta:-o.coin,staminaDelta:-o.stamina+te,comboText:m,eventText:g?.text,eventType:g?.type,eventVpDelta:ee,eventStaminaDelta:te,distanceKm:g?.distanceKm,isBadEvent:g?.isBad===!0}),d=o}return{steps:s,daySummaries:[l]}}function Je({boardSlots:e,currentDayIndex:t,dayLabel:n,rows:r,getBoardDisplayName:i,getCardTagKeys:a,countCardsWithTag:o,getCurrentDayPlacedCards:s}){let c=He({placedCards:s(),getBoardDisplayName:i}),l=[],u=[],{steps:d,daySummaries:f}=qe({boardSlots:e,currentDayIndex:t,dayLabel:n,rows:r,getCardTagKeys:a,countCardsWithTag:o,getCurrentDayPlacedCards:s}),p=d.reduce((e,t)=>t.isDebtPenalty?e+Math.abs(t.vpDelta):e,0),m=d.reduce((e,t)=>t.eventType===`promo`||t.eventType===`storm`?e+(t.eventVpDelta??0):e,0),h=d.reduce((e,t)=>t.eventType===`distance`?e+Math.abs(t.eventVpDelta??0):e,0);c.usedSlots===0&&l.push(`Chưa có thẻ nào trên lịch trình.`),c.usedSlots>0&&c.bonusVP===0&&l.push(`Lịch trình chưa kích hoạt combo nào.`);for(let n=0;n<e.length;n+=1)e[n].filter((e,n)=>n===t).filter(e=>e!==null).length>=4&&l.push(`${r[n]} có lịch dày, nên chừa ô nghỉ/di chuyển.`);l.length===0&&l.push(`Lịch trình hiện tại ổn để mô phỏng MVP.`);for(let e of d)e.eventText&&u.push(`${e.timeLabel}: ${e.eventText}`);u.length===0&&u.push(`Không có event phát sinh trong ngày này.`);let g=d.reduce((e,t)=>e+t.vpDelta,0)+c.bonusVP;return Object.assign(Object.assign({},c),{debtPenalty:p,eventModifier:m,distancePenalty:h,finalVP:g,warnings:l,events:u,replaySteps:d,daySummaries:f,lines:[...c.lines,`Debt penalty: -${p} VP`,`Event modifier: ${m>=0?`+`:``}${m} VP`,`Distance penalty: -${h} VP`,`Final VP: ${g}`]})}function Ye(e){let t=2166136261;for(let n=0;n<e.length;n+=1)t^=e.charCodeAt(n),t=Math.imul(t,16777619);return(t>>>0)/4294967295}function Xe(e,t,n){if(Ye(`${e.id}|${t}|${n}|scan-event`)>=.15)return null;let r=Ye(`${e.id}|${t}|${n}|event-type`);return r<1/3?{type:`promo`,text:`Khuyến mãi: +10 VP`,vpDelta:10,staminaDelta:0,isBad:!1}:r<2/3?{type:`traffic`,text:`Kẹt xe: -8 thể lực`,vpDelta:0,staminaDelta:-8,isBad:!0}:{type:`storm`,text:`Mưa giông: -10 VP`,vpDelta:-10,staminaDelta:0,isBad:!0}}function Ze(e){let t=e;return typeof t.lat==`number`&&typeof t.lng==`number`?{lat:t.lat,lng:t.lng}:t.location&&typeof t.location==`object`&&typeof t.location.lat==`number`&&typeof t.location.lng==`number`?{lat:t.location.lat,lng:t.location.lng}:null}function Qe(e,t,n,r){let i=Ze(e),a=Ze(t);return i&&a?et(i,a):e.city===t.city?4+Math.round(Ye(`${e.id}|${t.id}|same-city|${n}|${r}`)*12):22+Math.round(Ye(`${e.id}|${t.id}|distance`)*18)}function $e(e,t,n,r){let i=Qe(e,t,n,r);return i<=20?null:{type:`distance`,text:`Khoảng cách > 20km`,vpDelta:-30,staminaDelta:0,distanceKm:i,isBad:!0}}function et(e,t){let n=tt(t.lat-e.lat),r=tt(t.lng-e.lng),i=tt(e.lat),a=tt(t.lat),o=Math.sin(n/2)**2+Math.cos(i)*Math.cos(a)*Math.sin(r/2)**2;return Math.round(6371*2*Math.atan2(Math.sqrt(o),Math.sqrt(1-o)))}function tt(e){return e*Math.PI/180}function nt(e){return e.tags&&e.tags.length>0?e.tags.map(e=>e.toUpperCase()):[e.tag.toUpperCase()]}function rt(e,t){return e.filter(e=>nt(e).includes(t)).length}function it({cards:e,fallbackCards:t,handSize:n}){return e.length>=n?e:[...e,...t.slice(0,n-e.length)]}function at(e){let t=[...e];for(let e=t.length-1;e>0;--e){let n=Math.floor(Math.random()*(e+1)),r=t[e];t[e]=t[n],t[n]=r}return t}function ot({deck:e,playerHand:t,shuffleCards:n}){return t.length===0?{deck:e,playerHand:t}:{deck:n([...e,...t]),playerHand:[]}}function st({totals:e,startingCoin:t,startingStamina:n}){return{coin:Math.max(0,t-e.coin),stamina:Math.max(0,n-e.stamina)}}function ct({card:e,remaining:t}){let n=Math.max(0,e.coin-t.coin),r=Math.max(0,e.stamina-t.stamina);return{canAfford:n===0&&r===0,missingCoin:n,missingStamina:r}}function lt(e){let t=[];return e.missingCoin>0&&t.push(`thiếu ${e.missingCoin} xu`),e.missingStamina>0&&t.push(`thiếu ${e.missingStamina} thể lực`),t.length===0?`Đủ tài nguyên để đặt lá này`:`Không đủ tài nguyên: ${t.join(`, `)}`}var ut={deal:`assets/sounds/card-deal.mp3`,returnDeck:`assets/sounds/card-return-deck.mp3`,cardSelect:`assets/sounds/card-select.mp3`,cardPlace:`assets/sounds/card-place.mp3`,button:`assets/sounds/ui-click.mp3`,scanCell:`assets/sounds/scan-cell.mp3`,scanBad:`assets/sounds/scan-bad.mp3`,eventTraffic:`assets/sounds/event-traffic.mp3`,eventDistance:`assets/sounds/event-distance.mp3`,eventStorm:`assets/sounds/event-storm.mp3`,eventPromo:`assets/sounds/event-promo.mp3`},dt=null,ft=!1,pt=0,mt=0,ht=0,gt=0,_t={},vt={},yt={};function bt(){let e=window.AudioContext??window.webkitAudioContext;return e?(dt||=new e,dt):null}function v(e){if(!_t[e]){let t=new Audio(ut[e]);t.preload=`auto`,t.crossOrigin=`anonymous`,t.volume={deal:.78,returnDeck:.68,cardSelect:.82,cardPlace:.76,button:.6,scanCell:.62,scanBad:.72,eventTraffic:.62,eventDistance:.72,eventStorm:.7,eventPromo:.74}[e],t.playbackRate={deal:1.08,returnDeck:1,cardSelect:1.08,cardPlace:.95,button:1.05,scanCell:1.14,scanBad:.96,eventTraffic:1.06,eventDistance:1.02,eventStorm:1,eventPromo:1.08}[e],_t[e]=t}return _t[e]}function xt(){let e=bt();e?.state===`suspended`&&e.resume(),v(`deal`).load(),v(`returnDeck`).load(),v(`cardSelect`).load(),v(`cardPlace`).load(),v(`button`).load(),v(`scanCell`).load(),v(`scanBad`).load(),v(`eventTraffic`).load(),v(`eventDistance`).load(),v(`eventStorm`).load(),v(`eventPromo`).load(),ft=!0}function y(e,t){var n;if(!ft)return;t?.exclusive&&((n=vt[e])==null||n.pause(),vt[e]=void 0,yt[e]!==void 0&&(window.clearTimeout(yt[e]),yt[e]=void 0));let r=v(e),i=r.cloneNode(!0);i.volume=t?.volume??r.volume,i.playbackRate=t?.playbackRate??r.playbackRate,i.currentTime=t?.startTime??0,t?.exclusive&&(vt[e]=i),i.play().catch(()=>{}),t?.durationMs!==void 0&&(yt[e]=window.setTimeout(()=>{i.pause(),vt[e]=void 0,yt[e]=void 0},t.durationMs))}function St(e,t){let n=e.createGain();return n.gain.setValueAtTime(Math.max(1e-4,t),e.currentTime),n.connect(e.destination),n}function Ct(e,t,n=1){let r=e.sampleRate,i=Math.max(1,Math.floor(r*t)),a=e.createBuffer(1,i,r),o=a.getChannelData(0),s=0,c=0;for(let e=0;e<i;e+=1){let t=e/i,r=Math.min(1,t/.045),a=(1-t)**2.05,l=Math.random()*2-1;s=(s+.035*l)/1.035,Math.random()>.985?c=(Math.random()*2-1)*.65*n:c*=.82,o[e]=(l*.55+s*5.8+c*.42)*r*a}return a}function wt(e){let t=bt();if(!t||!ft)return;let n=e.duration??.11,r=e.startDelay??0,i=e.volume??.06,a=t.currentTime+r,o=t.createBufferSource(),s=t.createBiquadFilter(),c=t.createBiquadFilter(),l=t.createBiquadFilter(),u=St(t,i),d=t.createStereoPanner?.call(t);o.buffer=Ct(t,n,e.roughness??1),o.playbackRate.setValueAtTime(e.playbackRate??1,a),s.type=`highpass`,s.frequency.setValueAtTime(e.highpass??240,a),s.Q.setValueAtTime(.55,a),l.type=`bandpass`,l.frequency.setValueAtTime(e.bandpass??1800,a),l.Q.setValueAtTime(.85,a),c.type=`lowpass`,c.frequency.setValueAtTime(e.lowpass??4200,a),c.Q.setValueAtTime(.6,a),u.gain.setValueAtTime(1e-4,a),u.gain.linearRampToValueAtTime(i,a+n*.12),u.gain.exponentialRampToValueAtTime(1e-4,a+n),o.connect(s),s.connect(l),l.connect(c),d?(d.pan.setValueAtTime(e.pan??0,a),c.connect(d),d.connect(u)):c.connect(u),o.start(a),o.stop(a+n+.02)}function Tt(e=0,t=.05){wt({duration:.045,volume:t,startDelay:e,highpass:55,bandpass:260,lowpass:900,playbackRate:.72,roughness:.55})}function b(e){let t=performance.now();if(e===`button`){if(t-pt<35)return;pt=t,y(`button`,{volume:.72,playbackRate:1.06,startTime:0,durationMs:260,exclusive:!0});return}if(e===`cardSelect`){if(t-mt<80)return;mt=t,y(`cardSelect`,{volume:.84,playbackRate:1.06,startTime:.02});return}if(e===`cardPlace`){y(`cardPlace`,{volume:.86,playbackRate:.98,startTime:.01,durationMs:420,exclusive:!0});return}if(e===`deal`){if(t-ht<430)return;ht=t,y(`deal`,{volume:.82,playbackRate:1.12,startTime:.08});return}if(e===`returnDeck`){if(t-gt<850)return;gt=t,y(`returnDeck`,{volume:.72,playbackRate:1.02,startTime:.02,durationMs:520,exclusive:!0});return}if(e===`scanCell`){y(`scanCell`,{volume:.62,playbackRate:1.14,startTime:0,durationMs:260,exclusive:!0});return}if(e===`scanBad`){y(`scanBad`,{volume:.76,playbackRate:.96,startTime:0,durationMs:420,exclusive:!0});return}if(e===`eventTraffic`){y(`eventTraffic`,{volume:.62,playbackRate:1.06,startTime:0,durationMs:980,exclusive:!0});return}if(e===`eventDistance`){y(`eventDistance`,{volume:.72,playbackRate:1.02,startTime:0,durationMs:650,exclusive:!0});return}if(e===`eventStorm`){y(`eventStorm`,{volume:.7,playbackRate:1,startTime:0,durationMs:1120,exclusive:!0});return}if(e===`eventPromo`){y(`eventPromo`,{volume:.74,playbackRate:1.08,startTime:0,durationMs:820,exclusive:!0});return}e===`reject`&&(wt({duration:.06,volume:.055,highpass:90,bandpass:420,lowpass:1100,playbackRate:.7,roughness:.8}),Tt(.05,.045))}function Et(){document.addEventListener(`pointerdown`,e=>{xt();let t=e.target;if(!t)return;let n=!!t.closest(`[data-hand-card-id], [data-draft-card-id], .hand-card, .daily-draft-card`),r=t.closest(`.board-mini`);if(!n){if(r){b(`cardSelect`);return}b(`button`)}},!0)}var Dt=function(e,t,n,r){function i(e){return e instanceof n?e:new n(function(t){t(e)})}return new(n||=Promise)(function(n,a){function o(e){try{c(r.next(e))}catch(e){a(e)}}function s(e){try{c(r.throw(e))}catch(e){a(e)}}function c(e){e.done?n(e.value):i(e.value).then(o,s)}c((r=r.apply(e,t||[])).next())})},Ot=`travel_board_certificate_history`;function kt(e){return e.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu,`-`).replace(/^-+|-+$/g,``).slice(0,64)||`lich-trinh`}function At(){let e=G(),t=dr(),n=mr(),r=new Date().toISOString(),i=_.map((t,n)=>({day:t,label:`Ngày ${t}`,slots:Pe.map((t,r)=>{let i=e[r]?.[n]??null;return{timeLabel:t,card:i?{id:i.id,name:i.name,city:i.city,tag:i.tag,tagLabel:i.tagLabel,vp:i.vp,coin:i.coin,stamina:i.stamina,description:i.description}:null}})}));return{version:1,createdAt:r,playerName:fn(),phaseNumber:w,currentDay:_[T],score:{baseVP:t.baseVP,bonusVP:t.bonusVP,totalVP:H?.finalVP??t.totalVP,accumulatedVP:E},resources:{spentCoin:t.spentCoin,spentStamina:t.spentStamina,remainingCoin:n.coin,remainingStamina:n.stamina,usedSlots:t.usedSlots},timeline:i}}function jt(){return`${Ot}:${d.roomId??`local`}:${d.playerId??`p1`}`}function Mt(){try{let e=localStorage.getItem(jt());if(!e)return[];let t=JSON.parse(e);return Array.isArray(t)?t:[]}catch{return[]}}function Nt(e){localStorage.setItem(jt(),JSON.stringify(e))}function Pt(e){if(e.length===0)return`Chưa có dữ liệu`;let t=new Map;for(let n of e){let e=n.tag||`unknown`,r=t.get(e)??{label:n.tagLabel||n.tag||`Khác`,count:0};r.count+=1,t.set(e,r)}let n=[...t.values()].sort((e,t)=>t.count-e.count);return n.length>=2&&n[0].count===n[1].count?`Kết hợp`:n[0]?.label??`Kết hợp`}function Ft(e=w){let t=G(),n=_.map((e,n)=>({day:e,label:`Ngày ${e}`,slots:Pe.map((e,r)=>{let i=t[r]?.[n]??null;return{timeLabel:e,card:i?{id:i.id,name:i.name,city:i.city,tag:i.tag,tagLabel:i.tagLabel,vp:i.vp,coin:i.coin,stamina:i.stamina,description:i.description}:null}})})),r=[];for(let e of n)for(let t of e.slots)t.card&&r.push(t.card);let i=n.filter(e=>e.slots.some(e=>e.card!==null)).length,a=r.length;return{phaseNumber:e,phaseScore:r.reduce((e,t)=>e+t.vp,0),completedDays:i,completedSlots:a,styleLabel:Pt(r),days:n,updatedAt:new Date().toISOString()}}function It(){if(!S()||!d.roomState||d.roomState.phase===`lobby`||d.roomState.phase===`draft`)return;let e=Ft(w);if(e.completedSlots<=0)return;let t=Mt().filter(t=>t.phaseNumber!==e.phaseNumber);t.push(e),t.sort((e,t)=>e.phaseNumber-t.phaseNumber),Nt(t)}function Lt(){It();let e=Mt(),t=Ft(w),n=e.filter(e=>e.phaseNumber!==t.phaseNumber);t.completedSlots>0&&n.push(t),n.sort((e,t)=>e.phaseNumber-t.phaseNumber);let r=[1,2,3].map(e=>n.find(t=>t.phaseNumber===e)??{phaseNumber:e,phaseScore:0,completedDays:0,completedSlots:0,styleLabel:`Chưa hoàn thành`,days:_.map(e=>({day:e,label:`Ngày ${e}`,slots:Pe.map(e=>({timeLabel:e,card:null}))})),updatedAt:new Date().toISOString()}),i=r.reduce((e,t)=>e+t.phaseScore,0),a=r.filter(e=>e.completedSlots>0).length,o=r.reduce((e,t)=>e+t.completedSlots,0),s=r.reduce((e,t)=>e+t.completedDays,0);return{version:1,exportedAt:new Date().toISOString(),playerName:fn(),roomId:d.roomId??`LOCAL`,totalScore:i,completedPhaseCount:a,completedDays:s,completedSlots:o,phases:r}}function Rt(){let e=Lt(),t=JSON.stringify(e).replace(/</g,`\\u003c`);return`<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Chứng nhận hành trình - ${e.playerName}</title>
  <style>
    :root {
      --ink: #4e3325;
      --muted: rgba(78, 51, 37, 0.68);
      --gold: #d99a2b;
      --gold-dark: #9b641f;
      --paper: #fff7e8;
      --paper-2: #f3e3c6;
      --violet: #7c3aed;
      --green: #4f7d2b;
      --blue: #2563eb;
    }

    * {
      box-sizing: border-box;
      text-rendering: optimizeLegibility;
    }

    html {
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    body {
      margin: 0;
      min-height: 100vh;
      background:
        radial-gradient(circle at 50% 0%, rgba(255,255,255,.92), transparent 38%),
        linear-gradient(180deg, #efe1c8, #d7bd8d);
      color: var(--ink);
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, "Helvetica Neue", sans-serif;
      display: grid;
      place-items: center;
      padding: 22px;
    }

    button {
      font: inherit;
    }

    .certificate {
      width: min(980px, 100%);
      background:
        radial-gradient(circle at 15% 8%, rgba(255,255,255,.9), transparent 26%),
        radial-gradient(circle at 85% 92%, rgba(255,255,255,.55), transparent 30%),
        linear-gradient(180deg, #fff8ea, #f3dfb8);
      border: 3px double rgba(168, 111, 31, .72);
      border-radius: 28px;
      box-shadow:
        0 28px 80px rgba(82, 49, 19, .24),
        inset 0 0 0 10px rgba(255,255,255,.32);
      padding: 34px;
      position: relative;
      overflow: hidden;
    }

    .certificate::before,
    .certificate::after {
      content: "";
      position: absolute;
      width: 360px;
      height: 360px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(217,154,43,.12), transparent 68%);
      pointer-events: none;
    }

    .certificate::before {
      left: -170px;
      top: -170px;
    }

    .certificate::after {
      right: -170px;
      bottom: -170px;
    }

    .toolbar {
      position: sticky;
      top: 0;
      z-index: 4;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-bottom: 12px;
      font-family: system-ui, sans-serif;
    }

    .toolbar button {
      cursor: pointer;
      border: 0;
      border-radius: 999px;
      padding: 10px 14px;
      color: white;
      background: linear-gradient(135deg, #8b5cf6, #6d28d9);
      font-weight: 800;
      box-shadow: 0 10px 18px rgba(109, 40, 217, .22);
    }

    .header {
      position: relative;
      z-index: 1;
      text-align: center;
    }

    .compass {
      width: 54px;
      height: 54px;
      margin: 0 auto 8px;
      display: grid;
      place-items: center;
      border: 2px solid rgba(155, 100, 31, .36);
      border-radius: 50%;
      color: var(--gold-dark);
      font-size: 30px;
      background: rgba(255,255,255,.36);
    }

    .header h1 {
      margin: 0;
      font-family: "Segoe UI", Arial, "Helvetica Neue", sans-serif;
      font-size: clamp(34px, 5vw, 58px);
      font-weight: 900;
      letter-spacing: .02em;
      text-transform: uppercase;
      text-shadow: 0 2px 0 rgba(255,255,255,.65);
    }

    .subtitle {
      margin-top: 8px;
      color: var(--gold-dark);
      font-size: 20px;
    }

    .player {
      margin-top: 22px;
      font-family: "Segoe UI", Arial, "Helvetica Neue", sans-serif;
      font-size: clamp(34px, 4.4vw, 54px);
      font-weight: 900;
      line-height: 1.15;
    }

    .score-panel {
      width: min(620px, 100%);
      margin: 20px auto 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 18px;
      border: 2px solid rgba(188, 129, 48, .52);
      border-radius: 22px;
      padding: 14px 24px;
      background: rgba(255,255,255,.42);
      box-shadow: inset 0 1px 0 rgba(255,255,255,.78), 0 10px 22px rgba(111, 69, 24, .08);
    }

    .score-panel span {
      font-size: 21px;
      font-weight: 800;
    }

    .score-panel strong {
      color: #d97706;
      font-size: clamp(52px, 7vw, 86px);
      line-height: .9;
    }

    .hint {
      margin: 0;
      color: var(--muted);
      font-size: 16px;
    }

    .phase-tabs {
      margin: 28px 0 18px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      position: relative;
      z-index: 1;
    }

    .phase-tab {
      cursor: pointer;
      border: 2px solid rgba(182, 126, 47, .36);
      border-radius: 20px;
      background: rgba(255,255,255,.44);
      padding: 14px;
      color: var(--ink);
      box-shadow: inset 0 1px 0 rgba(255,255,255,.74);
      transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease;
    }

    .phase-tab:hover,
    .phase-tab.is-active {
      transform: translateY(-2px);
      border-color: rgba(124, 58, 237, .5);
      box-shadow: 0 12px 22px rgba(87, 49, 20, .12), inset 0 1px 0 rgba(255,255,255,.8);
    }

    .phase-tab h2 {
      margin: 0 0 8px;
      color: var(--phase-color);
      font-size: 22px;
    }

    .phase-tab p {
      margin: 6px 0;
      color: var(--muted);
      font-size: 15px;
    }

    .phase-tab strong {
      color: var(--phase-color);
      font-size: 22px;
    }

    .timeline {
      position: relative;
      z-index: 1;
      border: 2px solid rgba(174, 116, 39, .32);
      border-radius: 24px;
      padding: 20px;
      background: rgba(255,255,255,.38);
    }

    .timeline-head {
      display: flex;
      align-items: end;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 16px;
    }

    .timeline-head h3 {
      margin: 0;
      font-size: 28px;
    }

    .timeline-head span {
      color: var(--muted);
      font-size: 15px;
    }

    .days {
      display: grid;
      gap: 14px;
    }

    .day-card {
      border: 1px solid rgba(174, 116, 39, .28);
      border-radius: 18px;
      background: rgba(255, 251, 239, .78);
      padding: 14px;
    }

    .day-card h4 {
      margin: 0 0 10px;
      color: var(--phase-color);
      font-size: 20px;
    }

    .slots {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 8px;
    }

    .slot {
      min-height: 116px;
      border: 1px dashed rgba(160, 115, 66, .46);
      border-radius: 14px;
      padding: 10px;
      background: rgba(255,255,255,.45);
    }

    .slot em {
      display: block;
      color: var(--gold-dark);
      font-style: normal;
      font-weight: 900;
      margin-bottom: 6px;
    }

    .slot strong {
      display: block;
      min-height: 34px;
      font-size: 15px;
      line-height: 1.12;
    }

    .slot span {
      color: #15803d;
      display: block;
      font-weight: 900;
      margin-top: 7px;
    }

    .slot small {
      color: var(--muted);
      display: block;
      margin-top: 4px;
      line-height: 1.25;
    }

    .empty {
      opacity: .58;
    }

    .badges {
      margin-top: 18px;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      position: relative;
      z-index: 1;
    }

    .badge {
      border: 1px solid rgba(174, 116, 39, .28);
      border-radius: 999px;
      background: rgba(255,255,255,.42);
      padding: 12px;
      text-align: center;
      color: var(--ink);
      font-weight: 800;
    }

    .footer {
      margin-top: 24px;
      text-align: center;
      color: var(--muted);
      font-size: 15px;
      position: relative;
      z-index: 1;
    }

    .signature {
      display: block;
      margin-top: 6px;
      color: var(--ink);
      font-size: 28px;
      font-style: italic;
    }

    @media print {
      body {
        background: white;
        padding: 0;
      }

      .toolbar {
        display: none;
      }

      .certificate {
        box-shadow: none;
        border-radius: 0;
        width: 100%;
      }
    }

    @media (max-width: 760px) {
      .certificate {
        padding: 22px;
      }

      .phase-tabs,
      .badges {
        grid-template-columns: 1fr;
      }

      .slots {
        grid-template-columns: 1fr;
      }

      .score-panel {
        flex-direction: column;
        gap: 4px;
      }
    }
  </style>
</head>
<body>
  <main class="certificate">
    <div class="toolbar">
      <button onclick="window.print()">In / Lưu PDF</button>
    </div>

    <section class="header">
      <div class="compass">✦</div>
      <h1>Chứng nhận hành trình</h1>
      <div class="subtitle">Tổng kết 3 phase</div>
      <div class="player" id="playerName"></div>

      <div class="score-panel">
        <span>TỔNG ĐIỂM</span>
        <strong id="totalScore"></strong>
        <span>VP</span>
      </div>

      <p class="hint">Bấm vào từng phase để xem chi tiết hành trình ngày 1 → 5.</p>
    </section>

    <section class="phase-tabs" id="phaseTabs"></section>

    <section class="timeline" id="timeline"></section>

    <section class="badges">
      <div class="badge">🍽️ Ẩm thực nổi bật</div>
      <div class="badge">📅 Lịch trình hiệu quả</div>
      <div class="badge">🏔️ Khám phá bền bỉ</div>
      <div class="badge">🏆 Hoàn thành 3 phase</div>
    </section>

    <footer class="footer">
      <div id="exportDate"></div>
      <span class="signature">Travel Board Online</span>
    </footer>
  </main>

  <script>
    const certificateData = ${t};
    let activePhaseNumber = certificateData.phases.find((phase) => phase.completedSlots > 0)?.phaseNumber ?? 1;

    function escapeHtml(value) {
      return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    function getPhaseColor(phaseNumber) {
      if (phaseNumber === 1) return "#4f7d2b";
      if (phaseNumber === 2) return "#2563eb";
      return "#7c3aed";
    }

    function renderPhaseTabs() {
      const root = document.querySelector("#phaseTabs");

      root.innerHTML = certificateData.phases.map((phase) => {
        const isActive = phase.phaseNumber === activePhaseNumber;
        const color = getPhaseColor(phase.phaseNumber);

        return \`
          <button class="phase-tab \${isActive ? "is-active" : ""}" style="--phase-color: \${color}" onclick="selectPhase(\${phase.phaseNumber})">
            <h2>PHASE \${phase.phaseNumber}</h2>
            <p>Điểm: <strong>\${phase.phaseScore} VP</strong></p>
            <p>Ngày hoàn thành: \${phase.completedDays}/5</p>
            <p>Phong cách: \${escapeHtml(phase.styleLabel)}</p>
          </button>
        \`;
      }).join("");
    }

    function renderTimeline() {
      const phase = certificateData.phases.find((item) => item.phaseNumber === activePhaseNumber) ?? certificateData.phases[0];
      const root = document.querySelector("#timeline");
      const color = getPhaseColor(phase.phaseNumber);

      root.style.setProperty("--phase-color", color);

      root.innerHTML = \`
        <div class="timeline-head">
          <div>
            <h3>Chi tiết Phase \${phase.phaseNumber}</h3>
            <span>\${phase.completedSlots} slot • \${phase.completedDays}/5 ngày • \${phase.phaseScore} VP</span>
          </div>
        </div>

        <div class="days">
          \${phase.days.map((day) => {
            const hasAnyCard = day.slots.some((slot) => slot.card);

            return \`
              <article class="day-card \${hasAnyCard ? "" : "empty"}">
                <h4>\${escapeHtml(day.label)}</h4>
                <div class="slots">
                  \${day.slots.map((slot) => {
                    if (!slot.card) {
                      return \`
                        <div class="slot empty">
                          <em>\${escapeHtml(slot.timeLabel)}</em>
                          <strong>Nghỉ / Di chuyển</strong>
                          <small>Chưa có hoạt động</small>
                        </div>
                      \`;
                    }

                    return \`
                      <div class="slot">
                        <em>\${escapeHtml(slot.timeLabel)}</em>
                        <strong>\${escapeHtml(slot.card.name)}</strong>
                        <small>\${escapeHtml(slot.card.city || "Không rõ khu vực")}</small>
                        <span>+\${slot.card.vp} VP</span>
                        <small>\${escapeHtml(slot.card.tagLabel || slot.card.tag)}</small>
                      </div>
                    \`;
                  }).join("")}
                </div>
              </article>
            \`;
          }).join("")}
        </div>
      \`;
    }

    function selectPhase(phaseNumber) {
      activePhaseNumber = phaseNumber;
      renderPhaseTabs();
      renderTimeline();
    }

    document.querySelector("#playerName").textContent = certificateData.playerName;
    document.querySelector("#totalScore").textContent = certificateData.totalScore;
    document.querySelector("#exportDate").textContent = "Ngày xuất: " + new Date(certificateData.exportedAt).toLocaleDateString("vi-VN");
    renderPhaseTabs();
    renderTimeline();
  <\/script>
</body>
</html>`}function zt(){Vt(`${kt(`${Lt().playerName}-chung-nhan-hanh-trinh-3-phase`)}.html`,Rt(),`text/html;charset=utf-8`)}function Bt(){let e=At(),t=[];t.push(`LỮ KHÁCH BÀN CỜ - LỊCH TRÌNH DU LỊCH`),t.push(`Người chơi: ${e.playerName}`),t.push(`Phase: ${e.phaseNumber}`),t.push(`Ngày xuất: ${new Date(e.createdAt).toLocaleString(`vi-VN`)}`),t.push(``),t.push(`TỔNG KẾT`),t.push(`- Điểm ngày: ${e.score.totalVP} VP`),t.push(`- Tổng phase hiện tại: ${e.score.accumulatedVP} VP`),t.push(`- Xu đã dùng: ${e.resources.spentCoin}`),t.push(`- Thể lực đã dùng: ${e.resources.spentStamina}`),t.push(`- Slot đã dùng: ${e.resources.usedSlots}/25`),t.push(``);for(let n of e.timeline)if(n.slots.some(e=>e.card!==null)){t.push(n.label.toUpperCase());for(let e of n.slots){if(!e.card){t.push(`- ${e.timeLabel}: Nghỉ / Di chuyển`);continue}t.push(`- ${e.timeLabel}: ${e.card.name} (${e.card.city||`Không rõ khu vực`})`),t.push(`  Tag: ${e.card.tagLabel||e.card.tag} • VP: ${e.card.vp} • Xu: ${e.card.coin} • Thể lực: ${e.card.stamina}`),e.card.description&&t.push(`  Ghi chú: ${e.card.description}`)}t.push(``)}return t.join(`
`)}function Vt(e,t,n){let r=new Blob([t],{type:n}),i=URL.createObjectURL(r),a=document.createElement(`a`);a.href=i,a.download=e,document.body.appendChild(a),a.click(),a.remove(),URL.revokeObjectURL(i)}function Ht(e){let t=At(),n=kt(`${t.playerName}-phase-${t.phaseNumber}-lich-trinh`);if(e===`json`){Vt(`${n}.json`,JSON.stringify(t,null,2),`application/json;charset=utf-8`);return}Vt(`${n}.txt`,Bt(),`text/plain;charset=utf-8`)}function Ut(){return Dt(this,void 0,void 0,function*(){let e=Bt();try{yield navigator.clipboard.writeText(e),alert(`Đã copy lịch trình vào clipboard.`)}catch{prompt(`Copy lịch trình:`,e)}})}var Wt=function(e,t,n,r){function i(e){return e instanceof n?e:new n(function(t){t(e)})}return new(n||=Promise)(function(n,a){function o(e){try{c(r.next(e))}catch(e){a(e)}}function s(e){try{c(r.throw(e))}catch(e){a(e)}}function c(e){e.done?n(e.value):i(e.value).then(o,s)}c((r=r.apply(e,t||[])).next())})},Gt=document.getElementById(`app`),Kt=[{id:`p2`,rank:3,name:`Cường`,score:180,coin:890,stamina:20,usedSlots:3},{id:`p1`,rank:1,name:`An`,score:0,coin:3,stamina:2,usedSlots:0,active:!0}],qt=[{id:`p3`,rank:3,name:`Minh`,score:190,coin:720,stamina:15,usedSlots:3},{id:`p4`,rank:3,name:`Khánh`,score:240,coin:720,stamina:15,usedSlots:3}],x={coffee:`https://images.unsplash.com/photo-1517701550927-30cf4ba1f0d5?auto=format&fit=crop&w=1000&q=80`,bridge:`https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=80`,sea:`https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80`,food:`https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1000&q=80`,market:`https://images.unsplash.com/photo-1563492065599-3520f775eeed?auto=format&fit=crop&w=1000&q=80`,night:`https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1000&q=80`,temple:`https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1000&q=80`};x.coffee,x.bridge,x.sea,x.food,x.night;function Jt(e){return e.image&&e.image.trim().length>0?e:Object.assign(Object.assign({},e),{image:x.food})}function Yt(){return it({cards:Te.map(Ne).map(Jt),fallbackCards:[],handSize:5})}function Xt(e){return at(e)}function Zt(){let e=ot({deck:In,playerHand:k,shuffleCards:Xt});In=e.deck,k=e.playerHand}function Qt(){return`Ngày ${_[T]}`}function $t(){return`Phase ${w}`}function S(){return!!(d.roomId&&d.playerId&&d.roomState)}function en(){return d.roomState?.phase===`gameover`}function tn(){let e=d.roomState;return e?C.map(t=>{let n=e.players[t];return{playerId:t,name:n.name,score:n.score,coin:n.coin,stamina:n.stamina,usedSlots:n.usedSlots,isConnected:n.isConnected}}).sort((e,t)=>t.score===e.score?t.coin===e.coin?t.stamina-e.stamina:t.coin-e.coin:t.score-e.score):[]}function nn(){return d.roomState?.self??null}function rn(){return nn()?.draftPool??null}function an(){return S()?Q??rn():null}function on(e){return(e??[]).map(e=>e.id).join(`,`)}function sn(){let e=rn();Q=e?[...e]:null,Ka=null}function cn(){return nn()?.hand??null}function ln(){return nn()?.selectedDraftCardId??null}function un(){return ln()??Rn}function dn(e){return!e||!d.roomState?null:d.roomState.players[e]??null}function fn(){return dn(d.playerId??`p1`)?.name??`Player`}function pn(){return`${$t()} • ${Qt()}`.toUpperCase()}function mn(){let e=d.playerId;return!e||!d.roomState?null:d.roomState.players[e]??null}function hn(){let e=d.roomState;return e?C.map(t=>e.players[t]).filter(e=>e.isConnected):[]}function gn(){let e=d.roomState;if(!e||e.phase!==`lobby`||d.playerId!==`p1`)return!1;let t=hn();return t.length>0&&t.every(e=>e.isReady)}function _n(){let e=m();return`
    <main class="online-entry-screen">
      <section class="online-entry-card">
        <div class="online-entry-card__brand">
          <span>TREKPOLOGY</span>
          <h1>Online Room</h1>
          <p>Tạo phòng, mời bạn bè bằng mã phòng, rồi bắt đầu khi mọi người sẵn sàng.</p>
          <p class="online-entry-card__welcome">
            Xin chào, <strong>${n.user?.displayName??n.user?.username??`Nhà Lữ Hành`}</strong>
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
              <input id="lobby-create-name" value="${n.user?.displayName??`An`}" maxlength="18" />
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
              <input id="lobby-join-name" value="${n.user?.displayName??`Player`}" maxlength="18" />
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

        ${e?`
              <div class="online-entry-card__resume">
                <div>
                  <strong>Phiên cũ</strong>
                  <span>Room ${e.roomId} • ${e.playerId} • ${e.playerName}</span>
                </div>
                <button onclick="event.stopPropagation(); reconnectSavedRoomFromLobby()">Reconnect</button>
                <button class="online-entry-card__ghost" onclick="event.stopPropagation(); clearSavedRoomFromLobby()">Xóa lưu</button>
              </div>
            `:``}
      </section>
    </main>
  `}function vn(){let e=d.roomState,t=mn(),n=d.playerId===`p1`,r=gn();if(!e||e.phase!==`lobby`)return``;let i=C.map(t=>{let n=e.players[t],r=t===d.playerId,i=n.isConnected?`is-connected`:n.hasJoined?`is-offline`:`is-empty`,a=n.isConnected?n.isReady?`READY`:`WAIT`:n.hasJoined?`OFFLINE`:`-`,o=n.isConnected||n.hasJoined?n.name:`Đang chờ...`;return`
        <div class="online-lobby-player ${i} ${r?`is-self`:``}">
          <div class="online-lobby-player__slot">${t.toUpperCase()}</div>
          <div class="online-lobby-player__info">
            <strong>${o}</strong>
            <span>${n.isConnected?n.isReady?`Sẵn sàng`:`Chưa sẵn sàng`:n.hasJoined?`Đã offline • giữ slot`:`Trống`}</span>
          </div>
          <div class="online-lobby-player__status ${n.isReady?`is-ready`:``} ${n.hasJoined&&!n.isConnected?`is-offline`:``}">${a}</div>
        </div>
      `}).join(``);return`
    <main class="online-lobby-screen">
      <section class="online-lobby-card">
        <div class="online-lobby-card__header">
          <div>
            <span>ONLINE ROOM</span>
            <h1>${e.roomId}</h1>
            <p>Bạn là ${d.playerId?.toUpperCase()} • ${t?.name??`Player`}</p>
          </div>

          <div class="online-lobby-card__header-actions">
            <button class="online-lobby-card__copy" onclick="event.stopPropagation(); copyRoomCodeFromLobby()">Copy code</button>
            <button class="online-lobby-card__leave" onclick="event.stopPropagation(); leaveRoomFromLobby()">Thoát phòng</button>
          </div>
        </div>

        <div class="online-lobby-card__players">
          ${i}
        </div>

        <div class="online-lobby-card__actions">
          <button
            class="online-lobby-card__ready ${t?.isReady?`is-ready`:``}"
            onclick="event.stopPropagation(); toggleReadyFromLobby()"
          >
            ${t?.isReady?`Hủy sẵn sàng`:`Sẵn sàng`}
          </button>

          <button
            class="online-lobby-card__start"
            ${n&&r?``:`disabled`}
            onclick="event.stopPropagation(); startOnlineGame()"
            title="${n?`Cần tất cả người chơi connected sẵn sàng.`:`Chỉ host P1 được bắt đầu.`}"
          >
            Bắt đầu
          </button>
        </div>

        <div class="online-lobby-card__hint">
          Host là P1. Tất cả người chơi đang trong phòng cần bấm Sẵn sàng trước khi bắt đầu.
        </div>
      </section>
    </main>
  `}function yn(e){return dn(e)?.board??null}function bn(){return d.playerId??`p1`}function xn(e){return!e||!d.roomState?null:d.roomState.players[e]?.score??null}function Sn(){return xn(d.playerId??`p1`)}function Cn(e){let t=nn();return[...Q??[],...Ka??[],...t?.draftPool??[],...t?.pickedDraftCards??[],...t?.hand??[],...k,...On].find(t=>t.id===e)??null}function wn(e){let t=Cn(e.cardId);if(t&&!e.type)return t;if(e.type===`debt`)return Object.assign(Object.assign({},Or({rowIndex:0,colIndex:0,amount:e.debtAmount??0,sourceCardName:e.sourceCardName??e.name??`Lá đã vay`,lockedReason:e.lockedReason})),{id:e.cardId});if(e.type===`lock`)return Object.assign(Object.assign({},kr({rowIndex:0,colIndex:0,sourceCardName:e.sourceCardName??e.name??`Lá đã vay thể lực`})),{id:e.cardId});let n=e.name??e.cardId,r=e.tag||`food`;return{id:e.cardId,name:n,shortName:n,city:``,shortCity:``,image:e.image??x.food,rarity:`common`,rarityLabel:`★`,vp:e.vp,coin:e.coin??0,stamina:e.stamina??0,tag:r,tagLabel:r,tags:[r.toUpperCase()],icon:e.icon,description:``,bonusText:``}}function Tn(e){let t=yn(e);return t?t.map(e=>e.map(e=>e?wn(e):null)):null}function En(){let e=d.roomState;if(!e)return;w=e.phaseNumber??w,T=Math.max(0,Math.min(4,e.dayIndex));let t=e.players[d.playerId??`p1`];t&&(E=t.score),It(),j=e.phase===`draft`,V=e.phase===`simulation`||e.phase===`result`||e.phase===`gameover`,W=e.phase===`result`||e.phase===`gameover`,Vn=e.draftRound,zn=e.timer,Gn=e.timer,S()&&(Zr(),ai(),er());let n=e.self.draftPool??[],r=on(n),i=on(Q),a=Q!==null;if(S()){let t=e.phase===`draft`&&Va!==`draft`,o=e.phase===`draft`&&Va===`draft`&&r!==Ua;t?(Qa(),sn(),qa=!0,Ja=!1,A=!0,M=!1,Za=!1,b(`deal`),Wa=window.setTimeout(()=>{fi()},1320)):o&&a&&i!==r?(Qa(),Ka=[...n],qa=!1,Ja=!0,A=!1,M=!0,Wa=window.setTimeout(()=>{Ka&&=(Q=[...Ka],null),M=!1,A=!0,qa=!0,Wa=null,Rn=e.self.selectedDraftCardId,Z(),li(),Wa=window.setTimeout(()=>{fi()},1320)},1500)):e.phase===`draft`&&!a&&sn(),e.phase===`planning`&&Va===`draft`&&Q!==null&&Q.length>0&&!Ya&&Xa===null&&(Qa(),Ya=!0,j=!0,V=!1,M=!0,A=!1,Ja=!0,qa=!1,Xa=window.setTimeout(()=>{Ya=!1,M=!1,Q=null,Ka=null,Xa=null,Ba=``,pi()},1550)),e.phase!==`draft`&&!Ya&&(Qa(),Q=null,Ka=null,qa=!1,Ja=!1,A=!1,M=!1),Va=e.phase,Ha=e.draftRound,Ua=r}if(S()&&e.phase===`planning`&&Va===`draft`&&!Ya&&!Za){pi();return}if(e.phase===`planning`&&!Ya){let e=cn();e&&(k=[...e])}if(e.phase===`draft`&&(k=[],Rn=e.self.selectedDraftCardId,ei()),e.phase===`simulation`||e.phase===`result`){if(S()&&!Ga){yi();return}H||(H=ur(),U=0)}else H=null,U=0,W=!1,Ga=!1,Nn=!1}function Dn(e=T){return Ie(G(),e)}var On=Yt(),C=[`p1`,`p2`,`p3`,`p4`];function kn(){return{p1:Fe(),p2:Fe(),p3:Fe(),p4:Fe()}}function An(){if(S()){let e=Tn(bn());if(e)return e}return Hn.p1}var w=1,T=0,E=0,jn={coin:0,stamina:0},D={coin:0,stamina:0},O=0,Mn=!1,Nn=!1,Pn=null,Fn=null,In=Xt(On),k=[],A=!1,j=!0,Ln=[],Rn=null,zn=10,Bn=null,M=!1,Vn=1,Hn=kn(),Un=null,N=null,P=null,F=null,I=null,L=null,R=null,z=null,Wn=null,B=!1,V=!1,H=null,Gn=15,Kn=null,U=0,qn=null,W=!1,Jn=!1;function G(){return An()}function Yn(){return C.filter(e=>e!==`p1`)}function Xn(e,t=T){for(let n=0;n<e.length;n+=1)if(e[n]?.[t]===null)return{rowIndex:n,colIndex:t};for(let t=0;t<e.length;t+=1)for(let n=0;n<e[t].length;n+=1)if(e[t][n]===null)return{rowIndex:t,colIndex:n};return null}function Zn(e,t,n){return Object.assign(Object.assign({},e),{id:`${e.id}_${t}_${T}_${n}_${Date.now()}`})}function Qn(e,t,n){let r=Hn[e],i=Xn(r,T);i&&(r[i.rowIndex][i.colIndex]=Zn(t,e,n))}function $n(e){let t=0,n=Hn[e];for(let e=0;e<n.length;e+=1)n[e]?.[T]!==null&&(t+=1);return t}function er(){Un!==null&&(window.clearInterval(Un),Un=null)}function tr(e){S()||Yn().forEach((t,n)=>{$n(t)>=3||Qn(t,e,n)})}function nr(e){let t=0;for(let n of Hn[e])for(let e of n)e&&(t+=1);return t}function rr(e,t){return I!==null&&I.rowIndex===e&&I.colIndex===t}function ir(){return He({placedCards:Dn(),getBoardDisplayName:Sr})}function ar(){qn!==null&&(window.clearInterval(qn),qn=null)}function or(){return!H||H.replaySteps.length===0?null:H.replaySteps[Math.min(U,H.replaySteps.length-1)]}function sr(e){if(!e)return!1;let t=e;return t.isBadEvent===!0||t.isNegativeEvent===!0||t.eventType===`traffic`||t.eventType===`storm`||t.eventType===`distance`}function cr(e){return e?.eventType?e.eventType===`promo`?`eventPromo`:e.eventType===`traffic`?`eventTraffic`:e.eventType===`storm`?`eventStorm`:e.eventType===`distance`?`eventDistance`:null:null}function lr(){let e=or();e&&b(cr(e)??(sr(e)?`scanBad`:`scanCell`))}function ur(){return Je({boardSlots:G(),currentDayIndex:T,dayLabel:Qt(),rows:Pe,getBoardDisplayName:Sr,getCardTagKeys:Re,countCardsWithTag:ze,getCurrentDayPlacedCards:Dn})}function dr(){return H?{baseVP:H.baseVP,bonusVP:H.bonusVP,totalVP:H.finalVP,spentCoin:H.spentCoin,spentStamina:H.spentStamina+gi(H),usedSlots:H.usedSlots,lines:H.lines}:ir()}function fr(){let e=H?dr():ir();return{vp:E,coin:e.spentCoin,stamina:e.spentStamina,usedSlots:e.usedSlots}}function pr(){let e=fr();return Kt.map(t=>{if(!t.active)return Object.assign(Object.assign({},t),{usedSlots:t.id?nr(t.id):t.usedSlots});let n=mr();return Object.assign(Object.assign({},t),{score:e.vp,coin:Math.max(0,n.coin),stamina:Math.max(0,n.stamina),usedSlots:e.usedSlots})})}function mr(){if(S()){let e=mn();if(e)return{coin:e.coin,stamina:e.stamina}}let e=st({totals:fr(),startingCoin:3,startingStamina:2});return{coin:e.coin+jn.coin+D.coin,stamina:e.stamina+jn.stamina+D.stamina}}function hr(e){return ct({card:e,remaining:mr()})}function gr(e){return lt(hr(e))}function _r(e,t,n,r){let i=e.trim().length;return i>=r?`${t} ${t}--xs`:i>=n?`${t} ${t}--sm`:t}function vr(e){return _r(e,`hand-card__name`,16,23)}function yr(e){return _r(e,`hand-card__city`,18,28)}function br(e){return _r(e,`board-mini__name`,12,18)}function xr(e){return _r(e,`board-mini__city`,12,21)}function Sr(e){return e.shortName?.trim()||e.name}function Cr(e){return e.shortCity?.trim()||e.city}function wr(e){return e?.boardTokenType??null}function Tr(e){return wr(e)===`debt`}function Er(e){return wr(e)===`lock`}function Dr(e,t){return(G()[e]?.[t]??null)===null}function Or(e){return{id:`debt_token_${e.rowIndex}_${e.colIndex}_${Date.now()}`,name:e.lockedReason?`Nợ + Kiệt sức`:`Token Nợ`,shortName:e.lockedReason?`Nợ + Kiệt sức`:`Token Nợ`,city:`Trả ${e.amount} xu`,shortCity:`Trả ${e.amount} xu`,image:x.food,rarity:`common`,rarityLabel:`!`,vp:0,coin:0,stamina:0,tag:`utility`,tagLabel:`Nợ`,tags:[`UTILITY`],icon:`💸`,description:`Bấm để trả ${e.amount} xu. Nếu không trả trước khi hết ngày sẽ bị -20 VP.`,bonusText:`Không trả nợ: -20 VP`,boardTokenType:`debt`,debtAmount:e.amount,lockedReason:e.lockedReason,sourceCardName:e.sourceCardName}}function kr(e){return{id:`exhaust_lock_${e.rowIndex}_${e.colIndex}_${Date.now()}`,name:`Bị khóa`,shortName:`Bị khóa`,city:`Kiệt sức`,shortCity:`Kiệt sức`,image:x.food,rarity:`common`,rarityLabel:`!`,vp:0,coin:0,stamina:0,tag:`utility`,tagLabel:`Khóa`,tags:[`UTILITY`],icon:`🔒`,description:`Ô này bị khóa vì đã vay thể lực ở ${e.sourceCardName}.`,bonusText:`Không thể xếp bài vào ô này.`,boardTokenType:`lock`,lockedReason:`Kiệt sức`,sourceCardName:e.sourceCardName}}function Ar(e,t){return e<Pe.length-1?{rowIndex:e+1,colIndex:t}:t<4?{rowIndex:0,colIndex:t+1}:null}function jr(e){if(e.coinDebt>0&&(O+=e.coinDebt),e.staminaDebt<=0)return;let t=Ar(e.rowIndex,e.colIndex);t&&G()[t.rowIndex]?.[t.colIndex]===null&&(G()[t.rowIndex][t.colIndex]=kr({rowIndex:t.rowIndex,colIndex:t.colIndex,sourceCardName:e.card.name}))}function Mr(e,t,n){let r=n.debtAmount??0,i=mr();if(!(r<=0)){if(i.coin<r){alert(`Không đủ xu để trả nợ. Cần ${r} xu.`);return}D=Object.assign(Object.assign({},D),{coin:D.coin-r}),G()[e][t]=null,b(`eventPromo`),q()}}function Nr(e,t,n){if(t!==T){R=n,z={rowIndex:e,colIndex:t},q();return}if(S()){le({rowIndex:e,colIndex:t});return}Mr(e,t,n)}function Pr(e,t,n){let r=Ar(e,t);if(!r)return;let i=G()[r.rowIndex]?.[r.colIndex]??null;i&&i.boardTokenType===`lock`&&i.sourceCardName===n.name&&(G()[r.rowIndex][r.colIndex]=null)}function Fr(e){return _r(e,`focused-card__name`,18,25)}function Ir(e){return _r(e,`focused-card__city`,18,28)}function Lr(e){if(!e)return null;if(S()){let t=rn()?.find(t=>t.id===e)??null;if(t)return t;let n=cn()?.find(t=>t.id===e)??null;if(n)return n}if(j){let t=Xr()?.pool.find(t=>t.id===e)??null;if(t)return t}return k.find(t=>t.id===e)??null}function Rr(e,t){return Le(G(),e,t)}function zr(e){let t=Dn(),n=Re(e);return n.includes(`FOOD`)&&ze(t,`FOOD`)>=2||n.includes(`CULTURE`)&&ze(t,`CULTURE`)>=2||n.includes(`ACTION`)&&ze(t,`ACTION`)>=2?!0:e.onPlayEffect?.has_effect===!0&&e.onPlayEffect.effect_type===`GAIN_VP`}function Br(e,t){let n=Sr(e),r=Cr(e),i=br(n);xr(r);let a=zr(e),o=e;if(o.boardTokenType===`debt`)return`
      <article
        class="board-mini board-mini--token board-mini--debt"
        title="Bấm để trả ${o.debtAmount??0} xu"
      >
        <div class="board-mini-token__icon">💸</div>
        <strong>Nợ tiền ${o.debtAmount??0} xu</strong>
      </article>
    `;if(o.boardTokenType===`lock`)return`
      <article
        class="board-mini board-mini--token board-mini--lock"
        title="Ô bị khóa vì kiệt sức"
      >
        <div class="board-mini-token__icon">🔒</div>
        <strong>Bị khóa kiệt sức</strong>
      </article>
    `;let s=t?.eventType?`board-mini--event-${t.eventType}`:``,c=t?.eventType===`promo`?`✨`:t?.eventType===`traffic`?`🚧`:t?.eventType===`storm`?`⛈️`:t?.eventType===`distance`?`⚠️`:``,l=t?.eventType===`promo`?`+${t.eventVpDelta??0} VP Event`:t?.eventType===`traffic`?`${t.eventStaminaDelta??0} Thể lực`:t?.eventType===`storm`?`${t.eventVpDelta??0} VP Event`:t?.eventType===`distance`?`Khoảng cách > 20km`:``;return`
    <article
      class="board-mini board-mini--${e.rarity} ${a?`board-mini--bonus-active`:``} ${s}"
      title="${e.name} - ${e.city}${t?.eventText?` • ${t.eventText}`:``}"
    >
      ${t?.eventType?`
            <div class="board-mini__event-pill">${l}</div>
            <div class="board-mini__event-icon">${c}</div>
            ${t.eventType===`distance`?``:t.eventText?`<div class="board-mini__event-note">${t.eventText}</div>`:``}
          `:``}

      <div
        class="board-mini__image"
        style="background-image: url('${e.image}'), url('${x.food}')"
      ></div>

      <div class="board-mini__tag board-mini__tag--${e.tag}">
        ${e.tagLabel}
      </div>

      <div class="board-mini__info">
        <h3 class="${i}">${n}</h3>
        <div class="board-mini__vp">★ ${e.vp}</div>
      </div>
    </article>
  `}function Vr(e,t){let n=j&&e.id===un(),r=!j&&e.id===N,i=n||r,a=hr(e).canAfford?gr(e):`Thiếu tài nguyên: đặt lá này sẽ tạo nợ / kiệt sức.`;return`
    <article
      class="hand-card hand-card--${e.rarity} hand-card--fan-${t+1} ${r?`hand-card--selected`:``} ${n?`hand-card--draft-selected`:``} "
      data-hand-card-id="${e.id}"
      style="${i?`box-shadow: 0 0 0 4px rgba(255,255,255,.95), 0 0 0 8px rgba(139,92,246,.82), 0 18px 34px rgba(75,47,25,.28);`:``}"
      title="${a}"
      onpointerdown="${j?``:`event.stopPropagation(); startHandPointerDrag(event, '${e.id}')`}"
      onclick="${j?``:`event.stopPropagation(); window['selectHandCard']('${e.id}')`}"
    >
      ${r?`<button
              class="hand-card__close"
              onclick="event.stopPropagation(); clearSelectedHandCard()"
              title="Hủy chọn"
            >×</button>`:``}

      <div class="hand-card__header">
        <div class="hand-card__title-block">
          <h3 class="${vr(e.name)}">${e.name}</h3>
          <div class="${yr(e.city)}">📍 ${e.city}</div>
        </div>

        <div class="hand-card__vp">${e.vp}</div>
      </div>

      <div class="hand-card__image" style="background-image: url('${e.image}'), url('${x.food}')">
        <div class="hand-card__icons">
          <span>${e.icon}</span>
          <span>★</span>
        </div>
      </div>

      <div class="hand-card__content">
        <div class="hand-card__meta-row">
          <span class="hand-card__rarity">${e.rarityLabel}</span>
          <span class="hand-card__tag">${e.tagLabel}</span>
        </div>

        <p>${e.description}</p>

        <div class="hand-card__bonus">
          ${e.bonusText}
        </div>
      </div>

      <div class="hand-card__footer">
        <div>
          <span>GOLD</span>
          <strong>${e.coin}</strong>
        </div>

        <div>
          <span>STAMINA</span>
          <strong>${e.stamina}</strong>
        </div>
      </div>
    </article>
  `}function Hr(e){let t=Fr(e.name),n=Ir(e.city);return`
    <div class="focused-card-overlay" onclick="closeFocusedHandCard()">
      <div class="focused-card-backdrop-glow"></div>

      <article
        class="focused-card focused-card--${e.rarity}"
        onclick="event.stopPropagation()"
      >
        <button
          class="focused-card__close"
          onclick="event.stopPropagation(); closeFocusedHandCard()"
          title="Đóng"
        >×</button>

        <div class="focused-card__header">
          <div class="focused-card__title-wrap">
            <h2 class="${t}">${e.name}</h2>
            <span class="${n}">📍 ${e.city}</span>
          </div>

          <div class="focused-card__vp">${e.vp}</div>
        </div>

        <div class="focused-card__image" style="background-image: url('${e.image}'), url('${x.food}')">
          <div class="focused-card__icons">
            <span>${e.icon}</span>
            <span>★</span>
          </div>
        </div>

        <div class="focused-card__body">
          <div class="focused-card__tags">
            <span>${e.rarityLabel}</span>
            <span>${e.tagLabel}</span>
          </div>

          <p>${e.description}</p>

          <div class="focused-card__bonus">
            ${e.bonusText}
          </div>
        </div>

        <div class="focused-card__footer">
          <div>
            <span>GOLD</span>
            <strong>${e.coin}</strong>
          </div>

          <div>
            <span>STAMINA</span>
            <strong>${e.stamina}</strong>
          </div>
        </div>

        ${z?`
              <button
                class="focused-card__return-button"
                onclick="event.stopPropagation(); returnFocusedBoardCardToHand()"
                title="Rút lá này từ board về tay"
              >
                ↩ Rút về tay
              </button>
            `:``}
      </article>
    </div>
  `}function Ur(){let e=Xr()?.pool??[],t=Qr();return`
    <div class="draft-hand-meta">
      <div class="draft-hand-meta__info">
        <span>Vòng ${Vn}/5</span>
        <strong>${t?Sr(t):`Bấm 1 lá để chọn`}</strong>
        <em>
          ${A?`Đang phát bài vào tay...`:M?`Đang chuyền bài còn lại vào lượt kế tiếp...`:t?`Đã chọn. Hết giờ mới chuyền bài.`:e.length>0?`Bấm để chọn, giữ 0.5s để xem lớn.`:`Đang chuẩn bị bài...`}
        </em>
      </div>

      <div class="draft-hand-meta__wait">
        <span>Chờ hết giờ</span>
      </div>
    </div>
  `}function Wr(){let e=S()?an():null,t=Xr(),n=e??t?.pool??[];return n.length===0?`<div class="draft-hand-empty">Đang chuẩn bị bài...</div>`:n.map((e,t)=>$r(e,t)).join(``)}function Gr(e){return(Ln[{p1:1,p2:0,p3:2,p4:3}[e]]?.picked??[]).map(e=>e.icon)}function Kr(e){return!!(e&&e!==`p1`&&j)}function qr(e){let t=yn(e);if(!t)return Array.from({length:25}).map(()=>`<div class="opponent-cell">+</div>`).join(``);let n=[];for(let e of t)for(let t of e){if(!t){n.push(`<div class="opponent-cell">+</div>`);continue}n.push(`
        <div
          class="opponent-cell opponent-cell--filled opponent-cell--${t.tag}"
          title="${t.cardId} • ${t.tag} • ${t.vp} VP"
        >
          ${t.icon}
        </div>
      `)}return n.join(``)}function Jr(e){if(!e)return Array.from({length:25}).map(()=>`<div class="opponent-cell">+</div>`).join(``);if(d.roomState)return qr(e);let t=Hn[e],n=Kr(e)?Gr(e):[],r=[],i=0;for(let e of t)for(let t of e){let e=n[i]??``;if(!t){r.push(`
          <div
            class="opponent-cell ${e?`opponent-cell--draft-preview`:``}"
            title="${e?`Người chơi này đã chọn 1 lá trong phase draft`:``}"
          >
            ${e||`+`}
          </div>
        `),i+=1;continue}r.push(`
        <div
          class="opponent-cell opponent-cell--filled opponent-cell--${t.tag}"
          title="${t.name} • ${t.tagLabel} • ${t.vp} VP"
        >
          ${t.icon}
        </div>
      `),i+=1}return r.join(``)}function Yr(e){let t=dn(e.id),n=t?Object.assign(Object.assign({},e),{name:t.name,score:t.score,coin:t.coin,stamina:t.stamina,usedSlots:t.usedSlots}):e,r=t?.isConnected===!1?` side-player--offline`:``;return`
    <section class="side-player ${n.active?`side-player--active`:``}${r}">
      <div class="side-player__top">
        <div class="side-player__identity">
          <span class="rank">#${n.rank}</span>
          <h3>${n.name}</h3>
        </div>

        <div class="side-player__score">
          ${n.score}
          ${t?.hasJoined&&t?.isConnected===!1?`<span class="side-player__offline-badge">OFFLINE</span>`:``}
        </div>
      </div>

      <div class="side-player__resources">
        <span>🪙 ${n.coin}</span>
        <span class="separator">|</span>
        <span>⚡ ${n.stamina}</span>
        <span class="slot-count">${n.usedSlots}/25</span>
      </div>

      <div class="opponent-board">
        ${Jr(n.id)}
      </div>
    </section>
  `}function Xr(){return Ve(Ln,Be())}function Zr(){Bn!==null&&(window.clearInterval(Bn),Bn=null)}function Qr(){if(S()){let e=an(),t=un();return!e||!t?null:e.find(e=>e.id===t)??null}let e=Xr();return!e||!Rn?null:e.pool.find(e=>e.id===Rn)??null}function $r(e,t){let n=e.id===un();return`
    <article
      class="daily-draft-card daily-draft-card--${t+1} draft-deal-slot ${n?`daily-draft-card--selected`:``}"
      data-draft-card-id="${e.id}"
      title="${e.name} - ${e.city}"
    >
      ${Vr(e,t)}
    </article>
  `}function ei(){let e=un();Array.from(document.querySelectorAll(`[data-draft-card-id]`)).forEach(t=>{let n=t.dataset.draftCardId===e,r=t.querySelector(`.hand-card`);t.classList.toggle(`daily-draft-card--selected`,n),r?.classList.toggle(`hand-card--draft-selected`,n),n?(t.style.setProperty(`z-index`,`99999`,`important`),t.style.setProperty(`isolation`,`isolate`,`important`)):(t.style.removeProperty(`z-index`),t.style.removeProperty(`isolation`)),r&&(n?(r.style.setProperty(`z-index`,`99999`,`important`),r.style.setProperty(`position`,`relative`,`important`)):(r.style.removeProperty(`z-index`),r.style.removeProperty(`position`)))});let t=Qr(),n=document.querySelector(`.draft-hand-meta__info strong`);n&&(n.textContent=t?Sr(t):`Bấm 1 lá để chọn`);let r=document.querySelector(`.draft-hand-meta__info em`);r&&(r.textContent=t?`Đã chọn. Bấm lại lá đó để hủy chọn.`:`Bấm để chọn, giữ 0.5s để xem lớn.`)}function ti(e){if(!j||M||B&&(B=!1,L||R||z))return;let t=Rn===e?null:e;if(b(`cardSelect`),Rn=t,L=null,R=null,z=null,S()){oe(e),ei();return}Z()}function ni(e){if(!(j||V||A)){if(B){B=!1;return}b(`cardSelect`),N=N===e?null:e,P=null,L=null,R=null,z=null,Z()}}function ri(){j||(N=null,P=null,L=null,R=null,z=null,q())}function ii(e){let t=Math.max(0,e),n=Math.floor(t/60),r=t%60;return`${n}:${r<10?`0${r}`:`${r}`}`}function ai(){Kn!==null&&(window.clearInterval(Kn),Kn=null)}function oi(){ai(),!S()&&(V||j||(Kn=window.setInterval(()=>{if(--Gn,Gn<=0){Gn=0,ai(),vi();return}q()},1e3)))}function si(){Pn!==null&&(window.clearTimeout(Pn),Pn=null)}function ci(){Fn!==null&&(window.clearTimeout(Fn),Fn=null)}function li(){b(`deal`),window.requestAnimationFrame(()=>{window.requestAnimationFrame(()=>{document.querySelector(`.player-hand--draft.player-hand--dealing`)?.classList.add(`deal-active`)})})}function ui(){if(!S()||!j||!A)return;let e=document.querySelector(`.player-hand--draft.player-hand--dealing`);!e||e.classList.contains(`deal-active`)||e.classList.add(`deal-active`)}function di(){b(`returnDeck`),window.requestAnimationFrame(()=>{window.requestAnimationFrame(()=>{var e;let t=document.querySelector(`.player-hand__cards.is-passing`),n=document.querySelector(`.deck-card-stack`);if(!t||!n)return;let r=Array.from(t.querySelectorAll(`.draft-deal-slot:not(.daily-draft-card--selected)`)),i=t.getBoundingClientRect(),a=n.getBoundingClientRect(),o=i.left+i.width*.5,s=i.top+i.height*.38,c=a.left+a.width*.34,l=a.top+a.height*.54;r.forEach((e,t)=>{let n=e.getBoundingClientRect(),i=n.left+n.width*.5,a=n.top+n.height*.5,u=t-(r.length-1)/2,d=o-i+u*5,f=s-a+Math.abs(u)*3,p=c-i+u*2,m=l-a+u*2,h=d+(p-d)*.34,g=Math.min(f,m)-150-Math.abs(u)*7,ee=d+(p-d)*.72,te=Math.min(f,m)-185-Math.abs(u)*5;e.style.setProperty(`--gather-x`,`${d}px`),e.style.setProperty(`--gather-y`,`${f}px`),e.style.setProperty(`--gather-r`,`${u*4}deg`),e.style.setProperty(`--arc1-x`,`${h}px`),e.style.setProperty(`--arc1-y`,`${g}px`),e.style.setProperty(`--arc2-x`,`${ee}px`),e.style.setProperty(`--arc2-y`,`${te}px`),e.style.setProperty(`--deck-in-x`,`${p}px`),e.style.setProperty(`--deck-in-y`,`${m}px`),e.style.setProperty(`--deck-r`,`${-6+u*3}deg`)}),(e=n.closest(`.deck-pile-panel`))==null||e.classList.add(`deck-receiving`),t.classList.add(`pass-active`)})})}function fi(){A=!1,Wa=null;let e=document.querySelector(`.player-hand`);e?.classList.remove(`player-hand--dealing`,`is-dealing`,`deal-active`);let t=e?.querySelector(`.player-hand__meta`);t&&(t.textContent=`Còn ${zn}s • bấm 1 lá để chọn`);let n=e?.querySelector(`.draft-hand-meta__info em`);n&&(n.textContent=`Bấm để chọn, giữ 0.5s để xem lớn.`),ei()}function pi(){let e=cn();e&&(k=[...e]),j=!1,V=!1,M=!1,A=!0,Za=!0,b(`deal`),Z(),Ba=$a(),window.requestAnimationFrame(()=>{document.querySelector(`.player-hand:not(.player-hand--draft)`)?.classList.add(`planning-deal-active`)}),window.setTimeout(()=>{A=!1;let e=document.querySelector(`.player-hand`);e?.classList.remove(`player-hand--dealing`,`is-dealing`,`deal-active`,`planning-deal-active`);let t=e?.querySelector(`.player-hand__meta`);t&&(t.textContent=`Giữ 0.5s để xem lớn`)},1760)}function mi(){si(),ci(),ar(),ai(),er(),Zt(),T>=4?(!Mn&&O>0&&(E-=O*10,Mn=!0),w+=1,T=0,Hn=kn(),In=Xt(On),jn={coin:0,stamina:0},D={coin:0,stamina:0},O=0,Mn=!1):T+=1,V=!1,H=null,U=0,W=!1,Nn=!1,Gn=15,N=null,P=null,L=null,R=null,z=null,I=null,B=!1}function hi(e){return e?e.replaySteps.reduce((e,t)=>({coin:e.coin,stamina:e.stamina+(t.eventStaminaDelta??0)}),{coin:0,stamina:0}):{coin:0,stamina:0}}function gi(e){let t=hi(e);return Math.abs(Math.min(0,t.stamina))}function _i(){if(!H||Nn)return;let e=hi(H);E+=H.finalVP,D={coin:D.coin+e.coin,stamina:D.stamina+e.stamina},Nn=!0}function vi(){K(),ea(),er(),N=null,P=null,L=null,R=null,z=null,B=!1,H=ur(),U=0,W=!1,V=!0,lr(),ai(),ar(),qn=window.setInterval(()=>{if(H){if(U>=H.replaySteps.length-1){U=H.replaySteps.length-1,W=!0,_i(),ar(),q(),si(),Pn=window.setTimeout(()=>{mi()},1800);return}U+=1,lr(),q()}},850),q()}function yi(){K(),ea(),er(),ai(),ar(),N=null,P=null,L=null,R=null,z=null,B=!1,H=ur(),U=0,W=!1,V=!0,Ga=!0,lr(),qn=window.setInterval(()=>{if(H){if(U>=H.replaySteps.length-1){U=H.replaySteps.length-1,W=!0,ar(),Z();return}U+=1,lr(),Z()}},850),Z()}function bi(){er(),V=!1,H=null,U=0,W=!1,Nn=!1,Gn=15,si(),ci(),A=!1,ar(),N=null,P=null,L=null,R=null,z=null,B=!1,q(),oi()}function xi(){let e=dr(),t=d.roomState?.phase===`lobby`||d.roomState?.phase===`cinematic`,n=Sn()??(H?ki():E),r=pn();return`
    <section class="score-breakdown score-breakdown--status" title="${r}">
      <div class="score-breakdown__header score-breakdown__capsule score-breakdown__capsule--score">
        <span>ĐIỂM</span>
        <strong>${n}</strong>
      </div>

      <div class="score-breakdown__details score-breakdown__capsule score-breakdown__capsule--phase">
        <span>PHASE</span>
        <strong>${r}</strong>
      </div>

      <div class="score-breakdown__item score-breakdown__capsule score-breakdown__capsule--slots">
        <span>SLOT</span>
        <strong>${e.usedSlots}/5</strong>
      </div>

      ${t?`
            <div class="score-breakdown__lobby-actions">
              <button
                class="online-start-button"
                onclick="event.stopPropagation(); startOnlineGame()"
                title="Bắt đầu trò chơi cho toàn bộ người chơi trong phòng."
              >
                ▶ Bắt đầu trò chơi
              </button>
            </div>
          `:``}

      ${H?`
            <button
              class="score-breakdown__timer score-breakdown__timer--reset"
              onclick="event.stopPropagation(); resetSimulation()"
              title="Prototype: mở khóa để test lại lượt"
            >
              ↺ Test lại
            </button>
          `:j?`
              <div
                class="score-breakdown__timer ${zn<=3?`score-breakdown__timer--danger`:``}"
                title="Thời gian chọn bài trong phase chia bài."
              >
                <span>DRAFT</span>
                <strong>${zn}s</strong>
              </div>
            `:`
              <div
                class="score-breakdown__timer ${Gn<=10?`score-breakdown__timer--danger`:``}"
                title="Đồng hồ đếm ngược. Hết giờ hệ thống tự mô phỏng."
              >
                <span>TIME</span>
                <strong>${ii(Gn)}</strong>
              </div>
            `}
    </section>
  `}function Si(){if(V||H||en())return``;let e=mr();return`
    <div class="resource-orbs" aria-label="Tài nguyên hiện tại">
      <div class="resource-orb resource-orb--coin" title="Xu hiện có">
        <div class="resource-orb__frame">
          <div class="resource-orb__icon resource-orb__icon--coin">💰</div>
          <div class="resource-orb__value">${e.coin}</div>
        </div>
        <div class="resource-orb__label">TIỀN</div>
      </div>

      <div class="resource-orb resource-orb--stamina" title="Thể lực hiện có">
        <div class="resource-orb__frame">
          <div class="resource-orb__icon resource-orb__icon--stamina">🏃</div>
          <div class="resource-orb__value">${e.stamina}</div>
        </div>
        <div class="resource-orb__label">THỂ LỰC</div>
      </div>
    </div>
  `}function Ci(){if(!en())return``;let e=tn(),t=d.playerId;return`
    <section class="final-ranking-panel">
      <div class="final-ranking-panel__header">
        <span>KẾT THÚC PHASE</span>
        <h2>Bảng xếp hạng cuối cùng</h2>
        <p>Hết 5 ngày. BXH sẽ tự đóng sau ${d.roomState?.timer??10}s để qua Phase ${w+1}.</p>
      </div>

      <div class="final-ranking-panel__list">
        ${e.map((e,n)=>`
              <div class="final-ranking-row ${e.playerId===t?`final-ranking-row--self`:``}">
                <div class="final-ranking-row__rank">#${n+1}</div>

                <div class="final-ranking-row__name">
                  <strong>${e.name}</strong>
                  <span>${e.playerId}${e.isConnected?``:` • offline`}</span>
                </div>

                <div class="final-ranking-row__score">${e.score} VP</div>

                <div class="final-ranking-row__meta">
                  <span>🪙 ${e.coin}</span>
                  <span>⚡ ${e.stamina}</span>
                  <span>${e.usedSlots}/25</span>
                </div>
              </div>
            `).join(``)}
      </div>

      ${wi(`travel-export-panel--final`)}

      <div class="final-ranking-panel__footer">
        ${w>=3?`Đã kết thúc Phase 3. Đây là kết quả cuối của game.`:`Đang chuẩn bị chuyển sang Phase ${w+1}...`}
      </div>
    </section>
  `}function wi(e=``){return`
    <div class="flow-export travel-export-panel ${e}">
      <span>Xuất lịch trình</span>
      <p>Xuất board hiện tại thành lịch trình du lịch để lưu hoặc chia sẻ.</p>
      <div class="flow-export__actions">
        <button onclick="event.stopPropagation(); downloadTravelCertificateHtml()">Certificate</button>
        <button onclick="event.stopPropagation(); copyTravelTimeline()">Copy text</button>
      </div>
    </div>
  `}function Ti(e){return e>0?`+${e} VP`:e<0?`${e} VP`:`0 VP`}function Ei(){return H?H.replaySteps.slice(0,U+1).reduce((e,t)=>e+t.vpDelta,0):0}function Di(){return H&&Nn?E-H.finalVP:E}function Oi(){return H?Di()+(W?H.finalVP:Ei()):E}function ki(){return H?W?E:Di():E}function Ai(){if(!H)return``;let e=H,t=or(),n=Math.max(1,e.replaySteps.length),r=Math.min(U+1,n),i=W?e.finalVP:Ei(),a=U===n-1?460:U===n-2?180:0,o=223+U*366+a,s=e=>e===`storm`?`⛈`:e===`traffic`?`🚦`:e===`distance`?`🧭`:e===`promo`?`🏷`:`✦`,c=e=>e.eventText?e.eventText:e.eventType===`storm`?`Mưa giông`:e.eventType===`traffic`?`Kẹt xe`:e.eventType===`distance`?`Xa tuyến`:e.eventType===`promo`?`Ưu đãi`:``;return`
    <section class="ticket-scan-overlay" onclick="event.stopPropagation()">
      <div class="ticket-scan-overlay__scrim"></div>

      <div class="ticket-scan-overlay__header">
        <span>ĐANG QUÉT TÍNH ĐIỂM</span>
        <strong>${$t()} • ${Qt()}</strong>
        <em>${t?`Đang tính: ${t.timeLabel}`:`Đang chuẩn bị...`}</em>
      </div>

      <div class="ticket-scan-strip">
        <div class="ticket-scan-strip__backdrop"></div>

        <div
          class="ticket-scan-track"
          style="transform: translateX(calc(50% - ${o}px)); --scan-index: ${U};"
        >
          ${e.replaySteps.map((t,r)=>{let i=r===n-1,a=!W&&i&&r===U,o=!W&&r===U&&!a,l=W||r<U||a,u=!W&&r>U,d=c(t),f=!!(t.eventType||t.eventText);return`
                <article
                  class="score-ticket ${o?`is-active`:``} ${l?`is-torn`:``} ${u?`is-future`:``} ${t.isEmpty?`is-empty`:``} ${f?`has-event`:``} ${t.eventType?`score-ticket--event-${t.eventType}`:``}"
                >
                  <div class="score-ticket__perforation score-ticket__perforation--left"></div>
                  <div class="score-ticket__perforation score-ticket__perforation--right"></div>

                  <div class="score-ticket__head">
                    <span>${t.timeLabel}</span>
                    <strong>${t.vpDelta>=0?`+`:``}${t.vpDelta} VP</strong>
                  </div>

                  <div class="score-ticket__body">
                    <h4>${t.title}</h4>
                    <p>${t.subtitle}</p>
                  </div>

                  <div class="score-ticket__stats">
                    <span class="${t.coinDelta>0?`is-cost`:``}">Xu ${t.coinDelta}</span>
                    <span class="${t.staminaDelta>0?`is-cost`:``}">Lực ${t.staminaDelta}</span>
                  </div>

                  ${t.comboText?`<div class="score-ticket__combo">COMBO</div>`:``}

                  ${f?`
                        <div class="score-ticket__stamp">
                          <b>${s(t.eventType)}</b>
                          <span>${d}</span>
                        </div>
                      `:``}

                  <div class="score-ticket__tear-mark"></div>
                </article>

                ${r<e.replaySteps.length-1?`<div class="score-ticket-connector ${r<U?`is-passed`:``}"></div>`:``}
              `}).join(``)}
        </div>
      </div>

      <div class="ticket-scan-overlay__footer">
        <div>
          <span>Tiến trình</span>
          <strong>${r}/${n}</strong>
        </div>

        <div>
          <span>Điểm ngày</span>
          <strong>${Ti(i)}</strong>
        </div>

        <div>
          <span>Tổng phase</span>
          <strong>${ki()} VP</strong>
        </div>

        ${W?`
              <div class="ticket-scan-overlay__complete">
                <span>Hoàn tất</span>
                <strong>${Di()} → ${Oi()} VP</strong>
              </div>
            `:``}
      </div>
    </section>
  `}function ji(e,t){if(!H)return null;let n=H.replaySteps.findIndex(n=>n.rowIndex===e&&n.dayIndex===t);return n<0||n>U?null:H.replaySteps[n]??null}function Mi(e,t){if(!H||t!==T)return``;let n=or(),r=n?.rowIndex===e&&n?.dayIndex===t,i=H.replaySteps.findIndex(n=>n.rowIndex===e&&n.dayIndex===t),a=i>=0?H.replaySteps[i]:null,o=i>=0&&i<U,s=a?.eventType&&i<=U?`board-cell--event-${a.eventType}`:``;return r?`board-cell--replay-current ${s}`.trim():o?`board-cell--replay-done ${s}`.trim():`board-cell--replay-pending`}var Ni=!1,Pi=``;function Fi(){if(S()){let e=mn();return Math.max(0,e?.coinDebt??0)}return Math.max(0,O)}function Ii(){Fi()<=0||(Ni=!0,Pi=``,Z())}function Li(){Ni=!1,Pi=``,Z()}function Ri(){if(Fi()<=0){Li();return}if(S()){le(),Li();return}let e=mr(),t=Math.min(e.coin,O);if(t<=0){Pi=`Bạn chưa có xu để trả nợ lúc này.`,Z();return}if(O=Math.max(0,O-t),D=Object.assign(Object.assign({},D),{coin:D.coin-t}),Pi=O>0?`Đã trả ${t} xu. Hiện còn nợ ${O} xu.`:`Đã trả hết nợ (${t} xu).`,b(`eventPromo`),O<=0){Li();return}Z()}function zi(){return`
    <svg class="player-effect-seal__icon-svg" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path class="player-effect-seal__icon-solid" d="M30.8 10.2c.8-1.5 2.9-1.5 3.7 0l2.2 4.1c.3.5.8.9 1.4 1l4.8 1c1.8.4 2.3 2.6.9 3.7l-3.3 2.7c-.5.4-.8 1-.8 1.6l.1 1.8c4.4 1.8 7.5 5.9 7.5 10.7c0 6.4-5.1 11.5-11.5 11.5h-7.6c-6.8 0-12.4-5.5-12.4-12.3c0-4.8 2.8-8.9 6.9-10.8l.1-.9c.1-.7-.2-1.3-.7-1.8l-3-2.5c-1.4-1.2-.8-3.4 1-3.8l4.4-.9c.6-.1 1.1-.5 1.4-1l2.3-4.1Z"/>
      <path class="player-effect-seal__icon-cut" d="M34.8 29.6l-3.2 5l3.5 3.2l-2.5 4.6l4.1 3.6"/>
      <text class="player-effect-seal__icon-mark" x="31.9" y="38.6" text-anchor="middle">$</text>
    </svg>
  `}function Bi(){if(!Ni)return``;let e=Fi(),t=mr().coin,n=e*10;return`
    <div
      class="effect-token-modal-backdrop"
      onclick="event.stopPropagation(); window.closeDebtTokenModal()"
    >
      <section
        class="effect-token-modal effect-token-modal--debt"
        onclick="event.stopPropagation()"
      >
        <button
          type="button"
          class="effect-token-modal__close"
          onclick="event.stopPropagation(); window.closeDebtTokenModal()"
          aria-label="Đóng cửa sổ token nợ"
          title="Đóng"
        >
          ✕
        </button>

        <div class="effect-token-modal__header">
          <div class="effect-token-modal__seal-preview">
            <span class="player-effect-seal player-effect-seal--debt player-effect-seal--preview">
              <span class="player-effect-seal__surface">
                <span class="player-effect-seal__ring"></span>
                <span class="player-effect-seal__glyph player-effect-seal__glyph--debt" aria-hidden="true">${zi()}</span>
              </span>

              <span class="player-effect-seal__count">${e}</span>
            </span>
          </div>

          <div class="effect-token-modal__title-wrap">
            <span class="effect-token-modal__eyebrow">TOKEN NỢ</span>
            <h3>Nợ ${e} xu</h3>
            <p>Cuối game nếu chưa trả: <strong>-${n} VP</strong></p>
          </div>
        </div>

        <div class="effect-token-modal__body">
          <div class="effect-token-modal__info">
            <div>
              <span>Hiện đang nợ</span>
              <strong>${e} xu</strong>
            </div>
            <div>
              <span>Xu hiện có</span>
              <strong>${t} xu</strong>
            </div>
          </div>

          <p class="effect-token-modal__desc">
            Bấm trả nợ để thanh toán số xu hiện đang nợ. Nếu kết thúc game mà vẫn còn nợ,
            bạn sẽ bị trừ tổng cộng <strong>-${n} VP</strong>.
          </p>

          ${Pi?`<div class="effect-token-modal__notice">${Pi}</div>`:``}
        </div>

        <div class="effect-token-modal__footer">
          <button
            type="button"
            class="effect-token-modal__ghost"
            onclick="event.stopPropagation(); window.closeDebtTokenModal()"
          >
            Đóng
          </button>

          <button
            type="button"
            class="effect-token-modal__primary ${t<=0?`is-disabled`:``}"
            onclick="event.stopPropagation(); window.payCoinDebtFromModal()"
          >
            Trả nợ
          </button>
        </div>
      </section>
    </div>
  `}function Vi(){let e=[],t=Fi();return t>0&&e.push(`
      <button
        type="button"
        class="player-effect-seal player-effect-seal--debt"
        onclick="event.stopPropagation(); window.openDebtTokenModal()"
        aria-label="Token nợ: ${t} xu"
      >
        <span class="player-effect-seal__surface">
          <span class="player-effect-seal__ring"></span>

          <span class="player-effect-seal__glyph player-effect-seal__glyph--debt" aria-hidden="true">${zi()}</span>
        </span>

        <span class="player-effect-seal__count">${t}</span>
        <span class="player-effect-seal__hover-label">TOKEN NỢ</span>
      </button>
    `),e.length?`
    <div class="player-effect-dock">
      ${e.join(``)}
    </div>
  `:`
      <div class="player-effect-dock player-effect-dock--empty">
        <div class="player-effect-dock__placeholder">Hiệu ứng đang có</div>
      </div>
    `}function Hi(){S()||In.length;let e=(S()?cn():null)?.length??k.length;return`
    <section
      class="deck-pile-panel"
      data-discard-drop-zone="true"
      title="Kéo thả lá bài trên tay vào đây để discard và nhận lại Xu/Thể lực bằng chi phí của lá."
    >
      ${Vi()}

      <div class="deck-pile-panel__visual">
        <div class="deck-card-stack">
          <div class="deck-card-stack__card deck-card-stack__card--layer-3"></div>
          <div class="deck-card-stack__card deck-card-stack__card--layer-2"></div>
          <div class="deck-card-stack__card deck-card-stack__card--layer-1"></div>

          <div class="deck-card-stack__card deck-card-stack__card--back">
            <div class="deck-card-stack__back-frame">
              <div class="deck-card-stack__corner deck-card-stack__corner--tl">✦</div>
              <div class="deck-card-stack__corner deck-card-stack__corner--tr">✦</div>
              <div class="deck-card-stack__corner deck-card-stack__corner--bl">✦</div>
              <div class="deck-card-stack__corner deck-card-stack__corner--br">✦</div>

              <div class="deck-card-stack__crest">
                <div class="deck-card-stack__crest-ring"></div>
                <div class="deck-card-stack__crest-core">🧭</div>
              </div>

              <div class="deck-card-stack__brand">
                <span class="deck-card-stack__brand-top">LỮ KHÁCH</span>
                <strong class="deck-card-stack__brand-main">BÀN CỜ</strong>
                <em class="deck-card-stack__brand-sub">TRAVEL DECK</em>
              </div>

              <div class="deck-card-stack__route">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="deck-pile-panel__info">
        <div>
          <span>Trên tay</span>
          <strong>${e}</strong>
        </div>

        <div>
          <span>Đã xếp ngày</span>
          <strong>${Dn().length}</strong>
        </div>
      </div>
    </section>
  `}function Ui(){let e=Lr(L)??R;return`
    <main class="arena ${en()?`arena--gameover`:``} ${V?`arena--scanning`:``}">
      <div class="arena__top arena__top--with-score">
        <div class="arena__title-block">
          <div class="blue-line"></div>

          <div>
            <h1>${fn()}</h1>
          </div>
        </div>

        ${xi()}
      </div>

      ${Si()}

      <div class="arena__main">
        <div class="board-block">
          <div class="days-header">
            ${_.map((e,t)=>`<div class="day-pill ${t===T?`day-pill--current`:``} ${t<T?`day-pill--done`:``}">NGÀY ${e}</div>`).join(``)}
          </div>

          <section class="board-grid">
            ${Pe.map((e,t)=>`
                  <div class="time-label">${e}</div>

                  ${_.map((e,n)=>{let r=Rr(t,n),i=n===T,a=!j&&!V&&!A&&i&&N!==null&&r===null;return r?`
                        <div
                          class="board-cell board-cell--occupied board-cell--clickable ${Mi(t,n)} ${rr(t,n)?`board-cell--just-placed`:``}"
                          data-board-drop-cell="true"
                          data-row-index="${t}"
                          data-col-index="${n}"
                          onclick="event.stopPropagation(); handleBoardCellClick(${t}, ${n})"
                          title="Ô đã có bài - bấm để xem lớn"
                        >
                          ${Br(r,ji(t,n))}
                        </div>
                      `:`
                          <div
                            class="board-cell board-cell--empty ${Mi(t,n)} ${V?`board-cell--locked-mode`:``} ${!i&&!V?`board-cell--not-current-day`:``} ${a?`board-cell--placeable`:``}"
                            data-board-drop-cell="true"
                            data-row-index="${t}"
                            data-col-index="${n}"
                            onclick="event.stopPropagation(); handleBoardCellClick(${t}, ${n})"
                            title="${i?a?`Thả lá đang kéo vào ô ngày hiện tại`:`Chỉ xếp bài cho ngày hiện tại`:`Không phải ngày hiện tại`}"
                          >
                            <span class="empty-plus">+</span>
                          </div>
                        `}).join(``)}
                `).join(``)}
          </section>
        </div>

        ${en()?Ci():j?``:Ai()}

        ${V?``:`
              <section
          class="player-hand ${A?`player-hand--dealing is-dealing`:``} ${j?`player-hand--draft`:``}"
          onclick="${j?``:`clearSelectedHandCard()`}"
        >
          <div class="player-hand__top">
            <div class="player-hand__title">
              <span class="hand-badge">${j?`DRAFT`:`HAND`}</span>
              <h2>
                ${j?`Chọn bài ngày ${_[T]}`:`Bài ngày ${_[T]}`}
              </h2>
            </div>

            <div class="player-hand__meta ${j&&zn<=3?`player-hand__meta--danger`:``}">
              ${j?A?`Đang phát bài...`:`Còn ${zn}s • ${M?`Đang chuyền bài...`:`bấm 1 lá để chọn`}`:A?`Đang chia bài...`:`Giữ 0.5s để xem lớn`}
            </div>
          </div>

          ${j?Ur():``}

          <div class="player-hand__cards ${j&&M?`is-passing`:``}">
            ${j?Wr():k.map((e,t)=>Vr(e,t)).join(``)}
          </div>
        </section>
            `}
      </div>

      ${e?Hr(e):``}
    </main>
  `}function K(){Wn!==null&&(window.clearTimeout(Wn),Wn=null)}function q(){let e=document.querySelector(`.arena`);e&&(e.outerHTML=Ui())}function Wi(e,t,n){if(V||A||n!==T||!Dr(t,n))return;let r=k.findIndex(t=>t.id===e);if(r===-1)return;let i=k[r];if(S()){b(`cardPlace`),se({cardId:i.id,rowIndex:t,colIndex:n,tag:i.tag,icon:i.icon,vp:i.vp,coin:i.coin,stamina:i.stamina,name:i.name}),N=null,P=null,L=null,R=null,z=null,B=!1;return}let a=mr(),o=Math.max(0,i.coin-a.coin),s=Math.max(0,i.stamina-a.stamina);b(`cardPlace`),k.splice(r,1),G()[t][n]=i,jr({rowIndex:t,colIndex:n,card:i,coinDebt:o,staminaDebt:s}),se({cardId:i.id,rowIndex:t,colIndex:n,tag:i.tag,icon:i.icon,vp:i.vp,coin:i.coin,stamina:i.stamina,image:i.image,name:i.name}),tr(i),N=null,P=null,L=null,R=null,z=null,B=!1,I={rowIndex:t,colIndex:n},q(),window.setTimeout(()=>{I?.rowIndex===t&&I?.colIndex===n&&(I=null,q())},420)}function Gi(e,t){N&&Wi(N,e,t)}function Ki(){if(V||!z)return;let{rowIndex:e,colIndex:t}=z;if(t!==T)return;let n=G()[e]?.[t];if(!(!n||Tr(n)||Er(n))){if(S()){ue({rowIndex:e,colIndex:t}),L=null,R=null,z=null,I=null,N=null,B=!1;return}for(G()[e][t]=null,Pr(e,t,n),k.unshift(n);k.length>5;){let e=k.pop();e&&In.unshift(e)}L=null,R=null,z=null,I=null,N=null,B=!1,q()}}function qi(e){if(!F||F.isDragging)return;K(),L=null,R=null,z=null,B=!1;let{source:t}=F,n=t.getBoundingClientRect(),r=t.cloneNode(!0);r.classList.add(`hand-card--drag-clone`),r.classList.remove(`hand-card--selected`),r.style.width=`${n.width}px`,r.style.height=`${n.height}px`,r.style.left=`${n.left}px`,r.style.top=`${n.top}px`,r.style.transform=`none`,r.style.pointerEvents=`none`,document.body.appendChild(r),t.classList.add(`hand-card--drag-source-hidden`),F.clone=r,F.offsetX=e.clientX-n.left,F.offsetY=e.clientY-n.top,F.isDragging=!0,P=F.id,N=F.id,Ji(e)}function Ji(e){F?.clone&&(F.clone.style.left=`${e.clientX-F.offsetX}px`,F.clone.style.top=`${e.clientY-F.offsetY}px`)}function Yi(e){return document.elementFromPoint(e.clientX,e.clientY)?.closest(`[data-board-drop-cell='true']`)}function Xi(e){return document.elementFromPoint(e.clientX,e.clientY)?.closest(`[data-discard-drop-zone='true']`)}function Zi(){document.querySelectorAll(`.deck-pile-panel--discard-hover`).forEach(e=>{e.classList.remove(`deck-pile-panel--discard-hover`),delete e.dataset.discardCoin,delete e.dataset.discardStamina})}function Qi(){return!j&&!V&&!A}function $i(e){if(!Qi())return;let t=k.findIndex(t=>t.id===e);if(t===-1)return;let n=k[t];if(b(`returnDeck`),S()){let e=d.roomState,t=d.playerId;if(e&&t){let r=e.self.hand.findIndex(e=>e.id===n.id);r>=0&&e.self.hand.splice(r,1);let i=e.players[t];i&&(i.coin+=n.coin,i.stamina+=n.stamina),k=[...e.self.hand]}ce({cardId:n.id,coin:n.coin,stamina:n.stamina,name:n.name}),N=null,P=null,L=null,R=null,z=null,B=!1,Z();return}k.splice(t,1),jn={coin:jn.coin+n.coin,stamina:jn.stamina+n.stamina},N=null,P=null,L=null,R=null,z=null,B=!1,q()}function ea(){var e;oa(),Zi(),F?.source&&F.source.classList.remove(`hand-card--drag-source-hidden`),(e=F?.clone)==null||e.remove(),F=null,P=null}function ta(e){if(!F)return;let t=e.clientX-F.startX,n=e.clientY-F.startY,r=Math.hypot(t,n);if(!F.isDragging&&r>=8&&(K(),qi(e)),!F?.isDragging)return;e.preventDefault(),Ji(e),oa(),Zi();let i=Xi(e);if(i&&Qi()){let e=Lr(P);i.classList.add(`deck-pile-panel--discard-hover`),i.dataset.discardCoin=String(e?.coin??0),i.dataset.discardStamina=String(e?.stamina??0);return}let a=Yi(e);if(!a)return;let o=Number(a.dataset.rowIndex),s=Number(a.dataset.colIndex),c=Lr(P);Number.isInteger(o)&&Number.isInteger(s)&&Dr(o,s)&&c?a.classList.add(`board-cell--drag-hover`):a.classList.add(`board-cell--drag-invalid`)}function na(e){document.removeEventListener(`pointermove`,ta),document.removeEventListener(`pointerup`,na),document.removeEventListener(`pointercancel`,ra);let t=F,n=t?.isDragging===!0;if(K(),t){if(n){let n=Yi(e),r=Xi(e),i=Number(n?.dataset.rowIndex),a=Number(n?.dataset.colIndex),o=t.id;ea(),B=!0,window.setTimeout(()=>{B=!1},0);let s=Lr(o);if(r&&s&&Qi()){$i(o);return}if(n&&Number.isInteger(i)&&Number.isInteger(a)&&Dr(i,a)&&s){Wi(o,i,a);return}n&&Number.isInteger(i)&&Number.isInteger(a)?ia(i,a):ia(),N=null,q();return}ea()}}function ra(){document.removeEventListener(`pointermove`,ta),document.removeEventListener(`pointerup`,na),document.removeEventListener(`pointercancel`,ra),K(),ea(),N=null,B=!1,q()}function ia(e,t){b(`reject`);let n=e!==void 0&&t!==void 0?document.querySelector(`[data-row-index="${e}"][data-col-index="${t}"]`):document.querySelector(`.arena`);n?.classList.add(`resource-rejected-feedback`),window.setTimeout(()=>{n?.classList.remove(`resource-rejected-feedback`)},380)}function aa(e){return e.dataTransfer?.getData(`text/plain`)||P}function oa(){document.querySelectorAll(`.board-cell--drag-hover, .board-cell--drag-invalid`).forEach(e=>{e.classList.remove(`board-cell--drag-hover`),e.classList.remove(`board-cell--drag-invalid`)})}window.startDragHandCard=(e,t)=>{var n;K(),P=t,N=t,L=null,R=null,z=null,B=!0,(n=e.dataTransfer)==null||n.setData(`text/plain`,t),e.dataTransfer&&(e.dataTransfer.effectAllowed=`move`)},window.endDragHandCard=()=>{K(),oa(),P=null,window.setTimeout(()=>{B=!1},0)},window.handleBoardCellDragOver=(e,t,n)=>{!P||G()[t][n]!==null||(e.dataTransfer&&(e.dataTransfer.dropEffect=`move`),e.currentTarget?.classList.add(`board-cell--drag-hover`))},window.handleBoardCellDragLeave=e=>{e.currentTarget?.classList.remove(`board-cell--drag-hover`)},window.dropHandCardOnBoard=(e,t,n)=>{K(),oa();let r=aa(e);if(P=null,!r)return;let i=Lr(r);if(!Dr(t,n)||!i){ia(t,n);return}Wi(r,t,n)},window.startHandPointerDrag=(e,t)=>{if(A||V||e.button!==0||!Lr(t))return;ea();let n=e.currentTarget;n&&(F={id:t,source:n,clone:null,startX:e.clientX,startY:e.clientY,offsetX:0,offsetY:0,isDragging:!1},document.addEventListener(`pointermove`,ta),document.addEventListener(`pointerup`,na),document.addEventListener(`pointercancel`,ra))},window.openDebtTokenModal=()=>{Ii()},window.closeDebtTokenModal=()=>{Li()},window.payCoinDebtFromModal=()=>{Ri()},window.selectDraftCard=ti,window.confirmDraftPick=()=>{},window.startHoldHandCard=e=>{M||A||(K(),Wn=window.setTimeout(()=>{L=e,R=null,z=null,B=!0,K(),q()},500))},window.cancelHoldHandCard=()=>{K()},window.clearSelectedHandCard=()=>{K(),N!==null&&(N=null,q())},window.handleBoardCellClick=(e,t)=>{K();let n=Rr(e,t);if(n){if(Tr(n)){if(!j&&!A&&t===T&&N){Gi(e,t);return}Nr(e,t,n);return}ea(),L=null,R=n,z={rowIndex:e,colIndex:t},N=null,B=!1,q();return}!j&&!A&&t===T&&Gi(e,t)},window.focusBoardCard=(e,t)=>{let n=Rr(e,t);n&&(L=null,R=n,z={rowIndex:e,colIndex:t},N=null,B=!1,q())},window.runSimulation=()=>{vi()},window.resetSimulation=()=>{bi()},window.returnFocusedBoardCardToHand=()=>{Ki()},window.closeFocusedHandCard=()=>{K(),L=null,R=null,z=null,P=null,B=!1,q()};function sa(e){let t={p1:1,p2:3,p3:3,p4:3};return[...Kt,...qt].find(t=>t.id===e)??{id:e,rank:t[e],name:e.toUpperCase(),score:0,coin:3,stamina:2,usedSlots:0}}function ca(){let e=d.playerId;return!e||!d.roomState?[]:C.filter(t=>t===e?!1:d.roomState?.players[t]?.isConnected===!0).map(e=>{let t=sa(e),n=d.roomState?.players[e];return Object.assign(Object.assign({},t),{name:n?.name??t.name,score:n?.score??t.score,coin:n?.coin??t.coin,stamina:n?.stamina??t.stamina,usedSlots:n?.usedSlots??t.usedSlots,active:!1})})}function la(){return S()?ca().slice(0,2):pr()}function ua(){return S()?ca().slice(2):[qt[0]]}function da(){let e=d.roomState;return e?C.map(t=>{let n=e.players[t];return{playerId:t,name:n?.name??t.toUpperCase(),score:n?.score??0,coin:n?.coin??3,stamina:n?.stamina??2,usedSlots:n?.usedSlots??0,isConnected:n?.isConnected??!1,hasJoined:n?.hasJoined??!1}}).filter(e=>e.hasJoined||e.isConnected).sort((e,t)=>t.score===e.score?t.usedSlots===e.usedSlots?e.playerId.localeCompare(t.playerId):t.usedSlots-e.usedSlots:t.score-e.score):[]}function fa(){if(!Jn||!S())return``;let e=da(),t=d.playerId;return`
    <div class="mid-ranking-backdrop" onclick="event.stopPropagation(); closeMidGameRanking()">
      <section class="mid-ranking-modal" onclick="event.stopPropagation()">
        <div class="mid-ranking-modal__header">
          <div>
            <span>BẢNG XẾP HẠNG GIỮA TRẬN</span>
            <h2>${pn()}</h2>
            <p>Cập nhật sau mỗi ngày khi server cộng điểm simulation xong.</p>
          </div>

          <button
            class="mid-ranking-modal__close"
            onclick="event.stopPropagation(); closeMidGameRanking()"
            title="Đóng bảng xếp hạng"
          >
            ✕
          </button>
        </div>

        <div class="mid-ranking-modal__list">
          ${e.length>0?e.map((e,n)=>`
                      <div class="mid-ranking-row ${e.playerId===t?`mid-ranking-row--self`:``}">
                        <div class="mid-ranking-row__rank">#${n+1}</div>

                        <div class="mid-ranking-row__player">
                          <strong>${e.name}</strong>
                          <span>${e.playerId}${e.isConnected?``:` • offline`}</span>
                        </div>

                        <div class="mid-ranking-row__score">${e.score} VP</div>

                        <div class="mid-ranking-row__meta">
                          <span>🪙 ${e.coin}</span>
                          <span>⚡ ${e.stamina}</span>
                          <span>${e.usedSlots}/25</span>
                        </div>
                      </div>
                    `).join(``):`<div class="mid-ranking-empty">Chưa có người chơi trong phòng.</div>`}
        </div>

        <div class="mid-ranking-modal__footer">
          Điểm chỉ thay đổi sau khi kết thúc quét điểm từng ngày.
        </div>
      </section>
    </div>
  `}var pa=`assets/sounds/in-game-background.mp3`,ma=`travelDeck.inGameMusicMuted`,ha=`travelDeck.inGameMusicVolume`,ga=.5,_a=null,va=localStorage.getItem(ma),ya=Number(localStorage.getItem(ha)),J=va===`true`,Y=ya;(!Number.isFinite(Y)||Y<=0)&&(Y=ga,localStorage.setItem(ha,String(Y)),va===null&&localStorage.setItem(ma,`false`));function ba(e){return Math.max(0,Math.min(1,e))}function xa(){if(!_a){let e=new Audio(pa);e.loop=!0,e.preload=`auto`,e.volume=ba(Y),e.muted=J,_a=e}return _a}function Sa(){return S()&&d.roomState?.phase!==`lobby`}function Ca(){document.querySelectorAll(`audio, video`).forEach(e=>{if(e===_a)return;let t=e;try{t.pause(),t.muted=!0,(t.id===`hub-hero-video`||t.classList.contains(`hub-hero__video`))&&(t.currentTime=0)}catch{}})}function wa(){let e=xa();if(e.volume=ba(Y),e.muted=J,!Sa()){e.pause();return}if(Ca(),J||Y<=0){e.pause();return}e.play().catch(()=>{})}function Ta(){let e=document.querySelector(`[data-in-game-music-toggle]`),t=document.querySelector(`[data-in-game-music-value]`),n=document.querySelector(`[data-in-game-music-slider]`);e&&(e.classList.toggle(`is-muted`,J||Y<=0),e.textContent=J||Y<=0?`🔇`:`🔊`,e.title=J?`Bật nhạc nền`:`Tắt nhạc nền`),t&&(t.textContent=`${Math.round(ba(Y)*100)}%`),n&&(n.value=String(Math.round(ba(Y)*100)))}function Ea(){J=!J,localStorage.setItem(ma,String(J)),!J&&Y<=0&&(Y=ga,localStorage.setItem(ha,String(Y))),wa(),Ta()}function Da(e){let t=typeof e==`number`?e:Number(e);Number.isFinite(t)&&(Y=ba(t>1?t/100:t),J=Y<=0,localStorage.setItem(ha,String(Y)),localStorage.setItem(ma,String(J)),wa(),Ta())}function Oa(){let e=Math.round(ba(Y)*100),t=J||e<=0;return`
    <div class="online-room-menu__music" title="Nhạc nền trong trận">
      <button
        type="button"
        class="online-room-menu__music-toggle ${t?`is-muted`:``}"
        data-in-game-music-toggle
        onclick="event.stopPropagation(); window.toggleInGameBackgroundMusic()"
        title="${t?`Bật nhạc nền`:`Tắt nhạc nền`}"
      >
        ${t?`🔇`:`🔊`}
      </button>

      <div class="online-room-menu__music-body">
        <div class="online-room-menu__music-head">
          <span>Nhạc nền</span>
          <strong data-in-game-music-value>${e}%</strong>
        </div>

        <input
          data-in-game-music-slider
          class="online-room-menu__music-slider"
          type="range"
          min="0"
          max="100"
          step="1"
          value="${e}"
          oninput="event.stopPropagation(); window.setInGameBackgroundMusicVolume(event.target.value)"
          onchange="event.stopPropagation(); window.setInGameBackgroundMusicVolume(event.target.value)"
        />
      </div>
    </div>
  `}function ka(){let e=()=>{wa()};document.addEventListener(`pointerdown`,e,{passive:!0}),document.addEventListener(`keydown`,e)}window.toggleInGameBackgroundMusic=Ea,window.setInGameBackgroundMusicVolume=Da;function Aa(){return!S()||d.roomState?.phase===`lobby`?``:`
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
          <span>Room ${d.roomId??`-`}</span>
        </div>

        ${Oa()}

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
  `}function ja(e){return Array.from({length:Math.max(0,e)},()=>`<section class="side-player side-player--empty-spacer" aria-hidden="true"></section>`).join(``)}var X=`dashboard`,Ma=null;function Na(e){if(e!==`dashboard`&&Ca(),!document.startViewTransition){X=e,Z();return}document.startViewTransition(()=>{X=e,Z()})}window.gotoMapSelection=()=>{if(!n.user){window.focusHubAuthPanel(),$(`Đăng nhập hoặc đăng ký để bắt đầu hành trình.`);return}let e=document.createElement(`video`);e.src=`./assets/chuyencanh.mp4`,e.muted=!0,e.playsInline=!0,e.style.cssText=[`position:fixed`,`inset:0`,`width:100%`,`height:100%`,`object-fit:cover`,`z-index:9999`,`pointer-events:none`,`opacity:0`,`transition:opacity 0.4s ease`].join(`;`),document.body.appendChild(e),e.playbackRate=1.75,e.play().catch(()=>{e.muted=!0,e.playbackRate=1.75,e.play()}),requestAnimationFrame(()=>{requestAnimationFrame(()=>{e.style.opacity=`1`})});let t=!1;e.addEventListener(`timeupdate`,()=>{!t&&e.currentTime>=3.5&&(t=!0,Ma=e,document.body.removeChild(e),e.style.cssText=[`position:absolute`,`inset:0`,`width:100%`,`height:100%`,`object-fit:cover`,`z-index:0`,`pointer-events:none`,`opacity:1`].join(`;`),X=`map_selection`,Z(),requestAnimationFrame(()=>{document.querySelectorAll(`.map-card-col`).forEach((e,t)=>{setTimeout(()=>e.classList.add(`map-card-col--slide-in`),200+t*140)})})),e.duration&&e.currentTime>=e.duration-.5&&(e.currentTime=5)})},window.gotoOnlineLobby=()=>{if(!n.user){window.focusHubAuthPanel(),$(`Đăng nhập hoặc đăng ký để bắt đầu hành trình.`);return}Na(`lobby`)},window.gotoDashboard=()=>{Ma&&=(Ma.pause(),Ma.remove(),null),Na(`dashboard`)},window.switchHubAuthTab=e=>{document.querySelectorAll(`[data-hub-auth-tab]`).forEach(t=>{t.classList.toggle(`is-active`,t.dataset.hubAuthTab===e)}),document.querySelectorAll(`[data-hub-auth-panel]`).forEach(t=>{t.classList.toggle(`is-active`,t.dataset.hubAuthPanel===e)})},window.focusHubAuthPanel=()=>{let e=document.getElementById(`hub-auth`);if(!e){X=`dashboard`,Z(),window.requestAnimationFrame(()=>{window.focusHubAuthPanel()});return}e.scrollIntoView({behavior:`smooth`,block:`start`}),e.classList.remove(`hub-auth--pulse`),window.requestAnimationFrame(()=>{e.classList.add(`hub-auth--pulse`)}),e.querySelector(`input`)?.focus()},window.startOfflineGame=()=>{alert(`Chế độ chơi offline (Bot) đang được phát triển!`)};function Pa(){return`<div class="saigon-collage-bg" aria-hidden="true"></div>`}var Fa=null,Ia=!1;function La(){console.log(`TRIGGERING CINEMATIC TRANSITION!`),Ia=!0;let e=document.querySelector(`.online-lobby-card`);e&&e.classList.add(`is-exiting`);let t=document.getElementById(`cinematic-transition-video`),n=document.getElementById(`white-flash-overlay`);if(!t||!n){console.warn(`Missing video or overlay for cinematic transition.`),Ia=!1,Z();return}setTimeout(()=>{t.style.display=`block`,t.currentTime=0,t.play().catch(e=>{console.warn(`Video play failed with sound, attempting muted.`,e),t.muted=!0,t.play().catch(e=>{console.error(`Video play failed completely.`,e)})});let e=()=>{if(!Ia)return;Ia=!1,n.style.display=`block`,n.style.opacity=`1`,t.style.display=`none`,t.ontimeupdate=null,Z();let e=document.querySelector(`.game-shell`);e&&e.classList.add(`is-zooming-in`),setTimeout(()=>{n.style.opacity=`0`,setTimeout(()=>{n.style.display=`none`,e&&e.classList.remove(`is-zooming-in`)},1500)},50)};t.onended=e,t.ontimeupdate=()=>{t.duration&&t.currentTime>=t.duration-.2&&e()},setTimeout(()=>{Ia&&(console.warn(`Cinematic transition video timeout fallback.`),e())},2e4)},400)}function Ra(){let e=document.querySelector(`.game-shell`);e&&delete e.dataset.saigonHover}function za(){if(!n.isReady)return be(!0);if(!S())return!n.user||X===`dashboard`?(X=`dashboard`,be()):X===`map_selection`?fe():_n();if(d.roomState?.phase===`lobby`)return vn();let e=la(),t=ua();return`
    <div class="game-shell">
      ${Pa()}
      ${Aa()}
      ${fa()}
      ${Bi()}

      <aside class="players-column players-column--left">
        ${e.map(Yr).join(``)}
        ${ja(2-e.length)}
      </aside>

      ${Ui()}

      <aside class="players-column players-column--right">
        ${t.map(Yr).join(``)}
        ${ja(1-t.length)}
        ${Hi()}
      </aside>
    </div>
  `}window.rerenderGameShell=Z;function Z(){if(Ca(),Gt.innerHTML=za(),Ra(),wa(),he(),X===`map_selection`&&Ma){let e=document.querySelector(`.map-selection-screen`);e&&e.firstChild&&e.insertBefore(Ma,e.firstChild)}}var Ba=``,Va=null,Ha=0,Ua=``,Wa=null,Ga=!1,Q=null,Ka=null,qa=!1,Ja=!1,Ya=!1,Xa=null,Za=!1;function Qa(){Wa!==null&&(window.clearTimeout(Wa),Wa=null),Xa!==null&&(window.clearTimeout(Xa),Xa=null)}function $a(){let e=d.roomState;if(!e)return`offline`;let t=e.self,n=C.map(t=>{let n=e.players[t],r=n.board.map(e=>e.map(e=>e?`${e.cardId}:${e.tag}:${e.icon}:${e.vp}`:`-`).join(`,`)).join(`|`);return[t,n.name,n.score,n.coin,n.stamina,n.usedSlots,n.isConnected?`1`:`0`,n.isReady?`1`:`0`,r].join(`~`)}).join(`||`);return[e.phase,e.phaseNumber??1,e.dayIndex,e.draftRound,t.draftPool.map(e=>e.id).join(`,`),t.pickedDraftCards.map(e=>e.id).join(`,`),t.hand.map(e=>e.id).join(`,`),n].join(`##`)}function eo(){let e=d.roomState,t=document.querySelector(`.score-breakdown__timer`),n=t?.querySelector(`strong`);if(!(!e||!t||!n)){if(e.phase===`draft`){n.textContent=`${e.timer}s`,t.classList.toggle(`score-breakdown__timer--danger`,e.timer<=3);return}if(e.phase===`planning`){n.textContent=ii(e.timer),t.classList.toggle(`score-breakdown__timer--danger`,e.timer<=10);return}e.phase===`gameover`&&(n.textContent=`${e.timer}s`,t.classList.toggle(`score-breakdown__timer--danger`,e.timer<=3))}}function to(){let e=$a(),t=d.roomState?.phase??null;if(e!==Ba){if(console.log(`Signature changed:`,Ba,`=>`,e),Ba=e,Fa===`lobby`&&t===`cinematic`){Fa=t,La();return}Fa=t,Ia||Z(),qa&&(qa=!1,li(),window.setTimeout(()=>{ui()},80)),Ja&&(Ja=!1,di());return}eo()}Z(),Ba=$a(),Fa=d.roomState?.phase??null;function no(){let e=0,t=0,n=null,r=null,i=!1,a=!1;function o(){K(),n=null,r=null,i=!1}document.addEventListener(`pointerdown`,o=>{let s=o.target;if(!s)return;let c=s.closest(`[data-draft-card-id]`),l=s.closest(`[data-hand-card-id]`),u=null,d=null;j&&c?(u=c.dataset.draftCardId??null,d=`draft`):!j&&!V&&l&&(u=l.dataset.handCardId??null,d=`hand`),!(!u||!d)&&(n=u,r=d,i=!1,e=o.clientX,t=o.clientY,K(),d===`draft`&&!M&&(a=!0,ti(u)),Wn=window.setTimeout(()=>{n&&(i=!0,L=n,R=null,z=null,B=!0,Z())},500))},!0),document.addEventListener(`pointermove`,r=>{!n||Wn===null||Math.hypot(r.clientX-e,r.clientY-t)>8&&o()},!0),document.addEventListener(`pointerup`,a=>{let s=n,c=r,l=i,u=Math.hypot(a.clientX-e,a.clientY-t);o(),c===`draft`&&s&&!l&&u<=8&&j&&(a.preventDefault(),a.stopPropagation())},!0),document.addEventListener(`pointercancel`,()=>{o()},!0),document.addEventListener(`click`,e=>{let t=e.target;if(!t)return;let n=t.closest(`[data-draft-card-id]`);if(n&&j){if(e.preventDefault(),e.stopPropagation(),a){a=!1;return}let t=n.dataset.draftCardId;t&&ti(t);return}let r=t.closest(`[data-hand-card-id]`);if(r&&!j){e.preventDefault(),e.stopPropagation();let t=r.dataset.handCardId;t&&ni(t)}},!0)}no(),ro(),Et(),ka(),g(()=>{En(),to()}),window.createOnlineRoom=(e=`An`)=>{ee(e)},window.joinOnlineRoom=(e,t=`Player`)=>{te(e,t)},window.startOnlineGame=()=>{ae()},window.selectDraftCard=ti,window.selectHandCard=ni,window.clearSelectedHandCard=ri;function $(e,t=!1){let n=document.querySelector(`#hub-auth-status`)??document.querySelector(`#auth-status`);n&&(n.textContent=e,n.classList.toggle(`hub-auth__status--error`,t),n.classList.toggle(`hub-auth__status--success`,!!e&&!t),n.classList.toggle(`auth-card__status--error`,t),n.classList.toggle(`auth-card__status--success`,!!e&&!t))}function ro(){document.addEventListener(`submit`,e=>{let t=e.target;if(t){if(t.id===`auth-login-form`||t.id===`hub-auth-login-form`){e.preventDefault(),e.stopPropagation(),window.loginFromAuthScreen();return}(t.id===`auth-register-form`||t.id===`hub-auth-register-form`)&&(e.preventDefault(),e.stopPropagation(),window.registerFromAuthScreen())}},!0)}window.loginFromAuthScreen=()=>Wt(void 0,void 0,void 0,function*(){let e=document.querySelector(`#hub-auth-login-username`)??document.querySelector(`#auth-login-username`),t=document.querySelector(`#hub-auth-login-password`)??document.querySelector(`#auth-login-password`);$(`Đang đăng nhập...`);try{yield o({username:e?.value.trim()??``,password:t?.value??``}),$(`Đăng nhập thành công.`),Z()}catch(e){let t=e instanceof Error?e.message:`Đăng nhập thất bại.`;$(t,!0),alert(t)}}),window.registerFromAuthScreen=()=>Wt(void 0,void 0,void 0,function*(){let e=document.querySelector(`#hub-auth-register-display-name`)??document.querySelector(`#auth-register-display-name`),t=document.querySelector(`#hub-auth-register-username`)??document.querySelector(`#auth-register-username`),n=document.querySelector(`#hub-auth-register-password`)??document.querySelector(`#auth-register-password`);$(`Đang tạo tài khoản...`);try{yield s({displayName:e?.value.trim()||void 0,username:t?.value.trim()??``,password:n?.value??``}),$(`Tạo tài khoản thành công.`),Z()}catch(e){let t=e instanceof Error?e.message:`Đăng ký thất bại.`;$(t,!0),alert(t)}}),window.logoutFromAuthScreen=()=>{c(),d.roomId=null,d.playerId=null,d.roomState=null,X=`dashboard`,Z()},window.createRoomFromLobby=()=>{Ca(),ee(document.querySelector(`#lobby-create-name`)?.value.trim()||n.user?.displayName||n.user?.username||`An`)},window.joinRoomFromLobby=()=>{Ca();let e=document.querySelector(`#lobby-join-name`),t=document.querySelector(`#lobby-room-code`),n=e?.value.trim()||`Player`,r=t?.value.trim().toUpperCase();if(!r){alert(`Nhập room code trước.`);return}te(r,n)},window.reconnectSavedRoomFromLobby=()=>{Ca();let e=m();e&&ne(e.roomId,e.playerId,e.playerName)},window.clearSavedRoomFromLobby=()=>{h(),Z()},window.toggleReadyFromLobby=()=>{let e=mn();if(!e||!d.playerId||!d.roomState)return;let t=!e.isReady;d.roomState.players[d.playerId].isReady=t,Z(),re(t)},window.leaveRoomFromLobby=()=>{ie(),Z()},window.copyRoomCodeFromLobby=()=>Wt(void 0,void 0,void 0,function*(){let e=d.roomId;if(e)try{yield navigator.clipboard.writeText(e),alert(`Đã copy room code: ${e}`)}catch{prompt(`Copy room code:`,e)}}),window.openMidGameRanking=()=>{Jn=!0,Z()},window.closeMidGameRanking=()=>{Jn=!1,Z()},window.downloadTravelCertificateHtml=()=>{zt()},window.downloadTravelTimelineTxt=()=>{Ht(`txt`)},window.downloadTravelTimelineJson=()=>{Ht(`json`)},window.copyTravelTimeline=()=>{Ut()},window.debugOnlineBoards=()=>{let e=d.roomState;if(!e)return console.log(`No online room state.`),null;let t={},n=[`p1`,`p2`,`p3`,`p4`];for(let r of n){let n=e.players[r],i=[];for(let e=0;e<n.board.length;e+=1){let t=n.board[e];for(let n=0;n<t.length;n+=1){let r=t[n];r&&i.push({rowIndex:e,colIndex:n,cardId:r.cardId,tag:r.tag,icon:r.icon,vp:r.vp})}}t[r]={name:n.name,connected:n.isConnected,usedSlots:n.usedSlots,filledCells:i}}return console.table(n.map(e=>({playerId:e,name:t[e].name,connected:t[e].connected,usedSlots:t[e].usedSlots,filled:t[e].filledCells.length}))),console.log(t),t},window.onlineClientState=d,window.debugOnlineScores=()=>{let e=d.roomState;if(!e)return console.log(`No online room state.`),null;let t=C.map(t=>{let n=e.players[t];return{playerId:t,name:n.name,score:n.score,coin:n.coin,stamina:n.stamina,usedSlots:n.usedSlots,connected:n.isConnected,ready:n.isReady,joined:n.hasJoined}});return console.table(t),t},globalThis.createOnlineRoom=window.createOnlineRoom,globalThis.joinOnlineRoom=window.joinOnlineRoom,globalThis.startOnlineGame=window.startOnlineGame,globalThis.selectDraftCard=window.selectDraftCard,globalThis.selectHandCard=window.selectHandCard,globalThis.clearSelectedHandCard=window.clearSelectedHandCard,globalThis.loginFromAuthScreen=window.loginFromAuthScreen,globalThis.registerFromAuthScreen=window.registerFromAuthScreen,globalThis.logoutFromAuthScreen=window.logoutFromAuthScreen,globalThis.forceLogoutAuth=window.logoutFromAuthScreen,globalThis.createRoomFromLobby=window.createRoomFromLobby,globalThis.joinRoomFromLobby=window.joinRoomFromLobby,globalThis.reconnectSavedRoomFromLobby=window.reconnectSavedRoomFromLobby,globalThis.clearSavedRoomFromLobby=window.clearSavedRoomFromLobby,globalThis.toggleReadyFromLobby=window.toggleReadyFromLobby,globalThis.copyRoomCodeFromLobby=window.copyRoomCodeFromLobby,globalThis.leaveRoomFromLobby=window.leaveRoomFromLobby,globalThis.onlineClientState=d,globalThis.openMidGameRanking=window.openMidGameRanking,globalThis.closeMidGameRanking=window.closeMidGameRanking,globalThis.downloadTravelCertificateHtml=window.downloadTravelCertificateHtml,globalThis.toggleInGameBackgroundMusic=window.toggleInGameBackgroundMusic,globalThis.setInGameBackgroundMusicVolume=window.setInGameBackgroundMusicVolume,globalThis.downloadTravelTimelineTxt=window.downloadTravelTimelineTxt,globalThis.downloadTravelTimelineJson=window.downloadTravelTimelineJson,globalThis.copyTravelTimeline=window.copyTravelTimeline,globalThis.playGameSound=b,globalThis.debugOnlineBoards=window.debugOnlineBoards,globalThis.selectDraftCard=window.selectDraftCard,Z();