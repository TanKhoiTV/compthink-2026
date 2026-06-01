(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=function(e,t,n,r){function i(e){return e instanceof n?e:new n(function(t){t(e)})}return new(n||=Promise)(function(n,a){function o(e){try{c(r.next(e))}catch(e){a(e)}}function s(e){try{c(r.throw(e))}catch(e){a(e)}}function c(e){e.done?n(e.value):i(e.value).then(o,s)}c((r=r.apply(e,t||[])).next())})},t=`travel_board_auth_user`,n={isReady:!1,user:null};function r(){try{let e=localStorage.getItem(t);if(!e)return null;let n=JSON.parse(e);return!n||!n.username?null:n}catch{return null}}function i(e){localStorage.setItem(t,JSON.stringify(e))}function a(e,t){let n=e.trim();return{id:n.toLowerCase(),username:n,displayName:t?.trim()||n}}function o(t){return e(this,void 0,void 0,function*(){let e=t.username.trim();if(!e)throw Error(`Nhập username trước.`);if(!t.password)throw Error(`Nhập password trước.`);let r=a(e);return n.user=r,n.isReady=!0,i(r),r})}function s(t){return e(this,void 0,void 0,function*(){let e=t.username.trim();if(!e)throw Error(`Nhập username trước.`);if(!t.password||t.password.length<6)throw Error(`Password cần ít nhất 6 ký tự.`);let r=a(e,t.displayName);return n.user=r,n.isReady=!0,i(r),r})}function c(){n.user=null,n.isReady=!0,d.roomId=null,d.playerId=null,d.roomState=null,localStorage.removeItem(t),ee()}var l=io(`http://localhost:3001`),u=`travel_board_online_session`,d={roomId:null,playerId:null,roomState:null};function f(){localStorage.removeItem(u)}f();function p(e){!d.roomId||!d.playerId||(localStorage.removeItem(u),sessionStorage.setItem(u,JSON.stringify({roomId:d.roomId,playerId:d.playerId,playerName:e??d.roomState?.players[d.playerId]?.name??`Player`})))}function m(){let e=sessionStorage.getItem(u);if(!e)return null;try{return JSON.parse(e)}catch{return sessionStorage.removeItem(u),null}}function ee(){sessionStorage.removeItem(u),localStorage.removeItem(u),d.roomId=null,d.playerId=null,d.roomState=null}function h(e){n.user=r(),n.isReady=!0,window.setTimeout(e,0),l.on(`connect`,()=>{let e=m();!e||d.roomState||l.emit(`room:reconnect`,e)}),l.on(`room:joined`,t=>{d.roomId=t.roomId,d.playerId=t.playerId,d.roomState=t.state,p(t.state.players[t.playerId]?.name),console.log(`Joined room:`,t.roomId,`as`,t.playerId),e()}),l.on(`room:state`,t=>{d.roomState=t,e()}),l.on(`game:error`,e=>{alert(e.message)}),l.on(`connect_error`,()=>{console.warn(`Không kết nối được socket server. Kiểm tra server port 3001.`)}),l.on(`room:left`,()=>{ee(),e()})}function g(e){l.connected||l.connect(),l.emit(`room:create`,{playerName:e})}function te(e,t){l.connected||l.connect(),l.emit(`room:join`,{roomId:e,playerName:t})}function ne(e,t,n){l.emit(`room:reconnect`,{roomId:e,playerId:t,playerName:n})}function re(e){!d.roomId||!d.playerId||l.emit(`room:setReady`,{roomId:d.roomId,playerId:d.playerId,isReady:e})}function ie(){if(!d.roomId||!d.playerId){ee();return}l.emit(`room:leave`,{roomId:d.roomId,playerId:d.playerId}),ee()}function ae(){!d.roomId||!d.playerId||l.emit(`game:start`,{roomId:d.roomId,playerId:d.playerId})}function oe(e){!d.roomId||!d.playerId||l.emit(`draft:selectCard`,{roomId:d.roomId,playerId:d.playerId,cardId:e})}function se(){!d.roomId||!d.playerId||l.emit(`draft:confirmPick`,{roomId:d.roomId,playerId:d.playerId})}function ce(e){!d.roomId||!d.playerId||l.emit(`planning:placeCard`,Object.assign({roomId:d.roomId,playerId:d.playerId},e))}function le(e){!d.roomId||!d.playerId||l.emit(`planning:discardCard`,Object.assign({roomId:d.roomId,playerId:d.playerId},e))}function ue(e={}){!d.roomId||!d.playerId||l.emit(`planning:payDebt`,Object.assign({roomId:d.roomId,playerId:d.playerId},e))}function de(e){!d.roomId||!d.playerId||l.emit(`planning:returnBoardCard`,Object.assign({roomId:d.roomId,playerId:d.playerId},e))}function fe(e,t=``){return`<div class="map-card-col ${t}">${e}</div>`}function pe(){let e=n.user;return`
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

          ${fe(`
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

          ${fe(`
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

          ${fe(`
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

          ${fe(`
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
  `}var me=function(e,t,n,r){function i(e){return e instanceof n?e:new n(function(t){t(e)})}return new(n||=Promise)(function(n,a){function o(e){try{c(r.next(e))}catch(e){a(e)}}function s(e){try{c(r.throw(e))}catch(e){a(e)}}function c(e){e.done?n(e.value):i(e.value).then(o,s)}c((r=r.apply(e,t||[])).next())})},he=`./assets/videos/one-minute-in-vietnam.mp4`,ge=`trek.hubHeroMuted`,_e=null;function ve(){if(_e){try{_e.pause(),_e.muted=!0,_e.removeAttribute(`src`),_e.load()}catch{}_e=null}}function ye(){ve();let e=document.getElementById(`hub-hero-media`),t=document.getElementById(`hub-hero-video`),n=document.getElementById(`hub-hero-video-hitarea`),r=document.getElementById(`hub-hero-video-mute`),i=document.getElementById(`hub-hero-video-volume`);if(!e||!t||!n||!r||!i)return;_e=t,t.playsInline=!0,t.volume=parseFloat(i.value)||.85;let a=()=>{if(e.classList.toggle(`hub-hero__media--paused`,t.paused),r.classList.toggle(`hub-hero__video-mute--muted`,t.muted||t.volume===0),r.classList.toggle(`hub-hero__video-mute--unmuted`,!t.muted&&t.volume>0),r.setAttribute(`aria-label`,t.muted||t.volume===0?`Bật tiếng video`:`Tắt tiếng video`),r.setAttribute(`aria-pressed`,t.muted||t.volume===0?`true`:`false`),i.value=t.volume.toString(),t.paused){n.setAttribute(`aria-label`,`Tiếp tục video`);return}n.setAttribute(`aria-label`,`Tạm dừng video`)},o=()=>me(this,void 0,void 0,function*(){t.muted=localStorage.getItem(ge)===`true`;try{yield t.play(),a();return}catch{t.muted=!0;try{yield t.play()}catch{}a()}});r.addEventListener(`click`,e=>{e.preventDefault(),e.stopPropagation(),t.muted?(t.muted=!1,t.volume===0&&(t.volume=.5)):t.muted=!0,localStorage.setItem(ge,String(t.muted)),t.paused||t.play(),a()}),n.addEventListener(`click`,e=>{e.preventDefault(),e.stopPropagation(),t.paused?t.play():t.pause(),a()}),t.addEventListener(`play`,a),t.addEventListener(`pause`,a),t.addEventListener(`volumechange`,a),i.addEventListener(`input`,e=>{e.stopPropagation();let n=parseFloat(i.value);t.volume=n,n>0&&(t.muted=!1)}),o(),t.readyState<HTMLMediaElement.HAVE_CURRENT_DATA&&t.addEventListener(`loadeddata`,()=>{o()},{once:!0})}function be(){return`
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
        <source src="${he}" type="video/mp4" />
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
  `}function xe(){return`
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
  `}function Se(){return`
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
  `}function Ce(e,t){return e?`
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
    `}function we(e=!1){let t=n.user,r=!!t,i=t?.displayName||t?.username||`Nhà Lữ Hành`;return`
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
        ${Ce(r,i)}
      </header>

      <!-- Body: 2 cột -->
      <div class="hub-body">

        <!-- Cột trái: Hero -->
        <div class="hub-hero">
          ${be()}

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
            ${r?Se():xe()}
          </div>
        </aside>

      </div>
    </div>
  `}var Te=[{card_id:`SG_FOOD_001`,name:`Cà Phê Bệt Nhà Thờ Đức Bà`,description:`Trải nghiệm vỉa hè chuẩn Sài Gòn. Thức uống siêu rẻ nhưng bạn phải đánh cược với thời tiết nắng mưa bất chợt.`,image_url:`images/phase1/sg_food_001.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`OUTDOOR`],cost:{xu:1,la:0},base_vp:5,location:{lat:10.7798,lng:106.699,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`COMMON`,icon:`☕`},{card_id:`SG_FOOD_002`,name:`Ăn Vặt Hồ Con Rùa`,description:`Tụ điểm hóng gió lý tưởng nhưng khói bụi giao thông là điều không thể tránh khỏi.`,image_url:`images/phase1/sg_food_002.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`OUTDOOR`],cost:{xu:1,la:0},base_vp:5,location:{lat:10.7828,lng:106.6955,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`COMMON`,icon:`🍽️`},{card_id:`SG_FOOD_003`,name:`Cà Phê Vợt Cheo Leo`,description:`Hương vị thời gian đọng lại trong quán cà phê vợt lâu đời nhất thành phố. Yên bình, rẻ và an toàn tuyệt đối.`,image_url:`images/phase1/sg_food_003.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`INDOOR`],cost:{xu:1,la:0},base_vp:8,location:{lat:10.7685,lng:106.678,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`COMMON`,icon:`☕`},{card_id:`SG_FOOD_004`,name:`Phá Lấu Bò Cô Oanh (Quận 4)`,description:`Chén phá lấu đỏ au, thơm lừng nước cốt dừa ăn kèm bánh mì nóng giòn. Ngồi ghế súp vỉa hè ngắm xe cộ qua lại đúng chất dân chơi Quận 4.`,image_url:`images/phase1/sg_food_004.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`OUTDOOR`],cost:{xu:1,la:0},base_vp:5,location:{lat:10.7598,lng:106.7015,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`COMMON`,icon:`🍽️`},{card_id:`SG_FOOD_005`,name:`Súp Cua Chợ Tân Định`,description:`Chén súp nóng hổi, đặc ruột cạnh ngôi chợ hồng biểu tượng. Cứu đói nhanh gọn cho hành trình dài.`,image_url:`images/phase1/sg_food_005.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`OUTDOOR`],cost:{xu:1,la:0},base_vp:5,location:{lat:10.7895,lng:106.6881,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`COMMON`,icon:`🍽️`},{card_id:`SG_FOOD_006`,name:`Bánh Mì Huỳnh Hoa`,description:`Ổ bánh mì nặng trịch pate, ăn một nửa cũng đủ no. Đổi lại, bạn phải kiên nhẫn xếp hàng mua mang đi.`,image_url:`images/phase1/sg_food_006.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`OUTDOOR`],cost:{xu:2,la:0},base_vp:10,location:{lat:10.7715,lng:106.6931,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🥖`},{card_id:`SG_FOOD_007`,name:`Phố Ẩm Thực Hồ Thị Kỷ`,description:`Thiên đường ăn vặt và mùi hoa tươi đan xen. Ăn no căng bụng nhưng rã rời đôi chân vì chen lấn.`,image_url:`images/phase1/sg_food_007.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`OUTDOOR`],cost:{xu:2,la:1},base_vp:15,location:{lat:10.7671,lng:106.6773,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🍽️`},{card_id:`SG_FOOD_008`,name:`Cà Phê Chung Cư 42 Nguyễn Huệ`,description:`Trạm nghỉ chân hoài cổ nhìn ra phố đi bộ hiện đại. Nơi trú mưa hoàn hảo giữa lịch trình cạn kiệt.`,image_url:`images/phase1/sg_food_008.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`INDOOR`],cost:{xu:2,la:0},base_vp:12,location:{lat:10.7743,lng:106.7031,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`☕`},{card_id:`SG_FOOD_009`,name:`Phố Sủi Cảo Hà Tôn Quyền`,description:`Tiếng gọi món rôm rả cả góc phố người Hoa. Nằm xa trung tâm nên hãy cẩn thận bẫy khoảng cách di chuyển.`,image_url:`images/phase1/sg_food_009.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`OUTDOOR`],cost:{xu:2,la:0},base_vp:12,location:{lat:10.7592,lng:106.6558,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🍽️`},{card_id:`SG_FOOD_010`,name:`Cơm Tấm Ba Ghiền`,description:`Miếng sườn nướng than to bằng cái đĩa. Trải nghiệm no nê.`,image_url:`images/phase1/sg_food_010.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`INDOOR`],cost:{xu:2,la:1},base_vp:15,location:{lat:10.7951,lng:106.6781,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🍚`},{card_id:`SG_FOOD_011`,name:`Phố Ốc Vĩnh Khánh`,description:`Mùi bơ tỏi và mỡ hành nức mũi. Đại diện xuất sắc nhất cho văn hóa ăn ốc của giới trẻ thành phố.`,image_url:`images/phase1/sg_food_011.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`OUTDOOR`],cost:{xu:2,la:0},base_vp:12,location:{lat:10.7601,lng:106.7029,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🍽️`},{card_id:`SG_FOOD_012`,name:`Bánh Xèo Đinh Công Tráng`,description:`Tiệm bánh xèo miền Nam truyền thống ẩn trong hẻm. Vừa giòn.`,image_url:`images/phase1/sg_food_012.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`INDOOR`],cost:{xu:2,la:0},base_vp:10,location:{lat:10.7901,lng:106.689,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🍽️`},{card_id:`SG_FOOD_013`,name:`Chè Hà Ký Chợ Lớn`,description:`Chè trứng gà trà, chè mè đen trứ danh. Điểm chốt ngọt ngào sau chuyến khám phá văn hóa phố Tàu.`,image_url:`images/phase1/sg_food_013.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`INDOOR`],cost:{xu:2,la:0},base_vp:10,location:{lat:10.7516,lng:106.6622,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🍽️`},{card_id:`SG_FOOD_014`,name:`Phở Hòa Pasteur`,description:`Biểu tượng Phở miền Nam nổi tiếng với khách quốc tế. Không gian lịch sự, giá cao nhưng trải nghiệm tròn trịa.`,image_url:`images/phase1/sg_food_014.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`INDOOR`],cost:{xu:3,la:0},base_vp:15,location:{lat:10.7892,lng:106.6896,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`EPIC`,icon:`🍜`},{card_id:`SG_FOOD_015`,name:`Lẩu Cá Kèo Bà Huyện Thanh Quan`,description:`Nồi lẩu chua lá giang sôi sùng sục cùng cá kèo tươi rói. Biểu tượng nhậu lai rai cực kỳ bén mồi của người miền Nam.`,image_url:`images/phase1/sg_food_015.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`INDOOR`],cost:{xu:3,la:0},base_vp:18,location:{lat:10.7785,lng:106.6858,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`EPIC`,icon:`🍲`},{card_id:`SG_FOOD_016`,name:`Quán Bụi - Hương Vị Quê Nhà`,description:`Những món ăn thuần Việt được nâng tầm tinh tế. Không gian hoài cổ với chén sành, đũa tre, mang lại lượng điểm ổn định giữa lòng Quận 1.`,image_url:`images/phase1/sg_food_016.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`INDOOR`],cost:{xu:3,la:0},base_vp:18,location:{lat:10.7831,lng:106.7025,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`EPIC`,icon:`🍽️`},{card_id:`SG_FOOD_017`,name:`Dimsum Tiến Phát`,description:`Bữa sáng xa xỉ kiểu Quảng Đông. Đánh đổi số tiền lớn để thu về lượng điểm khổng lồ ngay từ lúc bình minh.`,image_url:`images/phase1/sg_food_017.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`INDOOR`],cost:{xu:4,la:0},base_vp:25,location:{lat:10.7538,lng:106.6631,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`EPIC`,icon:`🍽️`},{card_id:`SG_FOOD_018`,name:`Nhà Hàng Chay Hum`,description:`Không gian thiền tịnh, thức ăn thanh lọc. Mọi muộn phiền tan biến, cơ thể bạn được hồi phục sinh lực hoàn toàn.`,image_url:`images/phase1/sg_food_018.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`INDOOR`],cost:{xu:4,la:0},base_vp:15,location:{lat:10.7811,lng:106.6914,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`EPIC`,icon:`🍽️`},{card_id:`SG_FOOD_019`,name:`Ăn Tối Du Thuyền Sông Sài Gòn`,description:`Thưởng thức bít tết và rượu vang trôi dọc dòng sông rực sáng ánh đèn. Trải nghiệm đắt đỏ nhưng xứng đáng từng đồng.`,image_url:`images/phase1/sg_food_019.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`ACTION`],cost:{xu:5,la:0},base_vp:35,location:{lat:10.763,lng:106.7071,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`LEGENDARY`,icon:`🍽️`},{card_id:`SG_FOOD_020`,name:`Harpers-Bazaar Tầng 79 Landmark 81`,description:`Bữa ăn trên đỉnh bầu trời Sài Gòn. Bạn đốt ngót nghét 60% ngân sách khởi điểm để giáng đòn chí mạng về điểm số.`,image_url:`images/phase1/sg_food_020.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`INDOOR`],cost:{xu:6,la:0},base_vp:45,location:{lat:10.795,lng:106.7218,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`LEGENDARY`,icon:`🍽️`},{card_id:`SG_FOOD_021`,name:`Cơm Quê Dượng Bầu`,description:`Mâm cơm quê mộc mạc với trứng chiên, canh chua nhưng được phục vụ trong không gian sang trọng bậc nhất. Trải nghiệm tìm về tuổi thơ nhưng với một cái giá của người trưởng thành.`,image_url:`images/phase1/sg_food_021.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`INDOOR`],cost:{xu:5,la:0},base_vp:35,location:{lat:10.7725,lng:106.6901,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`LEGENDARY`,icon:`🍚`},{card_id:`SG_FOOD_022`,name:`Ly Dừa Tắc Pasteur`,description:`Thức uống giải nhiệt huyền thoại dưới những tán cây cổ thụ. Rẻ, mát lạnh nhưng bạn phải đứng uống giữa khói bụi dòng xe qua lại.`,image_url:`images/phase1/sg_food_022.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`OUTDOOR`],cost:{xu:1,la:0},base_vp:5,location:{lat:10.7891,lng:106.6894,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`COMMON`,icon:`☕`},{card_id:`SG_FOOD_023`,name:`Bột Chiên Đạt Thành`,description:`Đĩa bột chiên giòn rụm với trứng và đu đủ ngâm chua. Nằm sâu trong khu người Hoa, giá rẻ và an toàn tuyệt đối khỏi những cơn mưa.`,image_url:`images/phase1/sg_food_023.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`INDOOR`],cost:{xu:1,la:0},base_vp:8,location:{lat:10.7545,lng:106.6642,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`COMMON`,icon:`🍽️`},{card_id:`SG_FOOD_024`,name:`Xôi Mặn Bùi Thị Xuân`,description:`Gói xôi thập cẩm bọc lá chuối chắc nịch đầy lạp xưởng và chà bông. Bữa sáng quốc dân cung cấp năng lượng tức thì để bắt đầu ngày mới.`,image_url:`images/phase1/sg_food_024.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`OUTDOOR`],cost:{xu:1,la:0},base_vp:5,location:{lat:10.7681,lng:106.688,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`COMMON`,icon:`🍽️`},{card_id:`SG_FOOD_025`,name:`Lẩu Bò Tí Chuột`,description:`Nồi lẩu khói nghi ngút bên vỉa hè sầm uất. Ngon rẻ và rất dễ để tụ tập nối Combo với bạn bè vào buổi tối muộn.`,image_url:`images/phase1/sg_food_025.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`OUTDOOR`],cost:{xu:2,la:0},base_vp:12,location:{lat:10.764,lng:106.6835,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🍲`},{card_id:`SG_FOOD_026`,name:`Bún Thịt Nướng Kiều Bảo`,description:`Hương vị thịt nướng sả ướp đậm đà lan tỏa cả góc phố. Một lựa chọn cực kỳ chắc bụng, miễn nhiễm với thời tiết xấu.`,image_url:`images/phase1/sg_food_026.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`INDOOR`],cost:{xu:2,la:0},base_vp:10,location:{lat:10.7761,lng:106.666,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🍽️`},{card_id:`SG_FOOD_027`,name:`Ốc Như Điện Biên Phủ`,description:`Một trong những tiệm ốc chất lượng nhất. Bạn được ăn ngon, an toàn nhưng phải chầu chực xếp hàng lấy số đến mức hao mòn thể lực.`,image_url:`images/phase1/sg_food_027.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`INDOOR`],cost:{xu:2,la:1},base_vp:15,location:{lat:10.7718,lng:106.6811,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🍽️`},{card_id:`SG_FOOD_028`,name:`Tàu Hũ Đá Xe Lam`,description:`Chén tàu hũ truyền thống kết hợp topping hiện đại. Khuất bóng ở khu phố ẩm thực sầm uất, là trạm nghỉ chân ngọt ngào và mát lạnh.`,image_url:`images/phase1/sg_food_028.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`INDOOR`],cost:{xu:2,la:0},base_vp:10,location:{lat:10.7965,lng:106.6912,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🛵`},{card_id:`SG_FOOD_029`,name:`Lẩu Cua Đất Mũi`,description:`Thưởng thức cua Cà Mau chắc thịt trong không gian máy lạnh. Tốn kém nhưng lại mang đến lượng VP khổng lồ vô cùng an toàn.`,image_url:`images/phase1/sg_food_029.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`INDOOR`],cost:{xu:4,la:0},base_vp:22,location:{lat:10.7621,lng:106.6912,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`EPIC`,icon:`🍲`},{card_id:`SG_FOOD_030`,name:`Noir. Dining in the Dark`,description:`Bữa ăn tuyệt mật hoàn toàn trong bóng tối, được phục vụ bởi người khiếm thị. Trải nghiệm ẩm thực thức tỉnh mọi giác quan khiến tâm trí bạn kiệt sức nhưng ấn tượng sâu sắc.`,image_url:`images/phase1/sg_food_030.png`,phase_pool:`SAIGON`,tags:[`FOOD`,`INDOOR`],cost:{xu:5,la:0},base_vp:35,location:{lat:10.7885,lng:106.6948,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!0,effect_type:`DEDUCT_LA`,effect_value:1},rarity:`LEGENDARY`,icon:`🍽️`}],Ee=[{card_id:`SG_UTIL_001`,name:`Trụ ATM`,description:`Ngân sách cạn kiệt, bạn rảo bộ tìm bốt ATM để tiếp tế đạn dược. Mỏi chân đôi chút nhưng ví tiền lại rủng rỉnh.`,image_url:`images/phase1/sg_util_001.png`,phase_pool:`SAIGON`,tags:[`UTILITY`,`INDOOR`],cost:{xu:0,la:1},base_vp:0,location:{lat:10.7715,lng:106.6931,is_virtual:!0,label:`Sài Gòn`},on_play_effect:{has_effect:!0,effect_type:`RECOVER_XU`,effect_value:2},rarity:`UNCOMMON`,icon:`💰`},{card_id:`SG_UTIL_002`,name:`Trụ ATM`,description:`Ngân sách cạn kiệt, bạn rảo bộ tìm bốt ATM để tiếp tế đạn dược. Mỏi chân đôi chút nhưng ví tiền lại rủng rỉnh.`,image_url:`images/phase1/sg_util_001.png`,phase_pool:`SAIGON`,tags:[`UTILITY`,`INDOOR`],cost:{xu:0,la:1},base_vp:0,location:{lat:10.7715,lng:106.6931,is_virtual:!0,label:`Sài Gòn`},on_play_effect:{has_effect:!0,effect_type:`RECOVER_XU`,effect_value:2},rarity:`UNCOMMON`,icon:`💰`},{card_id:`SG_UTIL_003`,name:`Voucher Xe Công Nghệ`,description:`Chớp được mã gọi xe giá hời trên ứng dụng. Ngồi ô tô máy lạnh cho phép bạn nhảy cóc đến bất cứ đâu mà không lo mỏi chân.`,image_url:`images/phase1/sg_util_003.png`,phase_pool:`SAIGON`,tags:[`UTILITY`,`INDOOR`],cost:{xu:1,la:0},base_vp:0,location:{lat:10.7715,lng:106.6931,is_virtual:!0,label:`Sài Gòn`},on_play_effect:{has_effect:!0,effect_type:`IGNORE_DISTANCE_NEXT`,effect_value:1},rarity:`COMMON`,icon:`🎟️`},{card_id:`SG_UTIL_004`,name:`Voucher Xe Công Nghệ`,description:`Chớp được mã gọi xe giá hời trên ứng dụng. Ngồi ô tô máy lạnh cho phép bạn nhảy cóc đến bất cứ đâu mà không lo mỏi chân.`,image_url:`images/phase1/sg_util_003.png`,phase_pool:`SAIGON`,tags:[`UTILITY`,`INDOOR`],cost:{xu:1,la:0},base_vp:0,location:{lat:10.7715,lng:106.6931,is_virtual:!0,label:`Sài Gòn`},on_play_effect:{has_effect:!0,effect_type:`IGNORE_DISTANCE_NEXT`,effect_value:1},rarity:`COMMON`,icon:`🎟️`},{card_id:`SG_UTIL_005`,name:`Voucher Giảm Giá`,description:`Thu thập được một mã khuyến mãi chớp nhoáng. Thẻ này sẽ giúp bạn giảm đáng kể chi phí cho hoạt động đắt đỏ tiếp theo.`,image_url:`images/phase1/sg_util_005.png`,phase_pool:`SAIGON`,tags:[`UTILITY`,`INDOOR`,`OUTDOOR`],cost:{xu:0,la:0},base_vp:0,location:{lat:10.7715,lng:106.6931,is_virtual:!0,label:`Sài Gòn`},on_play_effect:{has_effect:!0,effect_type:`DISCOUNT_XU_NEXT`,effect_value:2},rarity:`COMMON`,icon:`🎟️`},{card_id:`SG_UTIL_006`,name:`Voucher Giảm Giá`,description:`Thu thập được một mã khuyến mãi chớp nhoáng. Thẻ này sẽ giúp bạn giảm đáng kể chi phí cho hoạt động đắt đỏ tiếp theo.`,image_url:`images/phase1/sg_util_005.png`,phase_pool:`SAIGON`,tags:[`UTILITY`,`INDOOR`,`OUTDOOR`],cost:{xu:0,la:0},base_vp:0,location:{lat:10.7715,lng:106.6931,is_virtual:!0,label:`Sài Gòn`},on_play_effect:{has_effect:!0,effect_type:`DISCOUNT_XU_NEXT`,effect_value:2},rarity:`COMMON`,icon:`🎟️`},{card_id:`SG_UTIL_007`,name:`Xe Đạp Công Cộng`,description:`Quét mã thuê một chiếc xe đạp để băng qua dòng xe kẹt cứng. Né được thuật toán trừ điểm khoảng cách nhưng bạn sẽ toát mồ hôi hột.`,image_url:`images/phase1/sg_util_007.png`,phase_pool:`SAIGON`,tags:[`UTILITY`,`OUTDOOR`],cost:{xu:0,la:2},base_vp:0,location:{lat:10.7715,lng:106.6931,is_virtual:!0,label:`Sài Gòn`},on_play_effect:{has_effect:!0,effect_type:`IGNORE_DISTANCE_NEXT`,effect_value:1},rarity:`EPIC`,icon:`🛵`},{card_id:`SG_UTIL_008`,name:`Xe Đạp Công Cộng`,description:`Quét mã thuê một chiếc xe đạp để băng qua dòng xe kẹt cứng. Né được thuật toán trừ điểm khoảng cách nhưng bạn sẽ toát mồ hôi hột.`,image_url:`images/phase1/sg_util_007.png`,phase_pool:`SAIGON`,tags:[`UTILITY`,`OUTDOOR`],cost:{xu:0,la:2},base_vp:0,location:{lat:10.7715,lng:106.6931,is_virtual:!0,label:`Sài Gòn`},on_play_effect:{has_effect:!0,effect_type:`IGNORE_DISTANCE_NEXT`,effect_value:1},rarity:`EPIC`,icon:`🛵`},{card_id:`SG_UTIL_009`,name:`Tiệm Massage Chân`,description:`Ngâm chân thảo mộc và ấn huyệt chuyên sâu. Một khoản đầu tư xứng đáng để đôi chân được hồi sinh sau chuỗi ngày cuốc bộ rã rời.`,image_url:`images/phase1/sg_util_009.png`,phase_pool:`SAIGON`,tags:[`UTILITY`,`INDOOR`],cost:{xu:2,la:0},base_vp:0,location:{lat:10.7715,lng:106.6931,is_virtual:!0,label:`Sài Gòn`},on_play_effect:{has_effect:!0,effect_type:`RECOVER_LA`,effect_value:3},rarity:`UNCOMMON`,icon:`⚡`},{card_id:`SG_UTIL_010`,name:`Tiệm Massage Chân`,description:`Ngâm chân thảo mộc và ấn huyệt chuyên sâu. Một khoản đầu tư xứng đáng để đôi chân được hồi sinh sau chuỗi ngày cuốc bộ rã rời.`,image_url:`images/phase1/sg_util_009.png`,phase_pool:`SAIGON`,tags:[`UTILITY`,`INDOOR`],cost:{xu:2,la:0},base_vp:0,location:{lat:10.7715,lng:106.6931,is_virtual:!0,label:`Sài Gòn`},on_play_effect:{has_effect:!0,effect_type:`RECOVER_LA`,effect_value:3},rarity:`UNCOMMON`,icon:`⚡`},{card_id:`SG_UTIL_011`,name:`Cửa Hàng Tiện Lợi 24/7`,description:`Đẩy cửa bước vào, luồng khí lạnh phả vào mặt lập tức xua tan cái nóng. Mua tạm chai nước suối và đứng hưởng sái điều hòa.`,image_url:`images/phase1/sg_util_011.png`,phase_pool:`SAIGON`,tags:[`UTILITY`,`INDOOR`],cost:{xu:0,la:0},base_vp:0,location:{lat:10.7715,lng:106.6931,is_virtual:!0,label:`Sài Gòn`},on_play_effect:{has_effect:!0,effect_type:`RECOVER_LA`,effect_value:1},rarity:`COMMON`,icon:`⚡`},{card_id:`SG_UTIL_012`,name:`Cửa Hàng Tiện Lợi 24/7`,description:`Đẩy cửa bước vào, luồng khí lạnh phả vào mặt lập tức xua tan cái nóng. Mua tạm chai nước suối và đứng hưởng sái điều hòa.`,image_url:`images/phase1/sg_util_011.png`,phase_pool:`SAIGON`,tags:[`UTILITY`,`INDOOR`],cost:{xu:0,la:0},base_vp:0,location:{lat:10.7715,lng:106.6931,is_virtual:!0,label:`Sài Gòn`},on_play_effect:{has_effect:!0,effect_type:`RECOVER_LA`,effect_value:1},rarity:`COMMON`,icon:`⚡`},{card_id:`SG_UTIL_013`,name:`Tiệm Gội Đầu Dưỡng Sinh`,description:`Đắm chìm trong hương sả chanh và những động tác xoa bóp điêu luyện. Trải nghiệm thư giãn đặc sản này giúp bạn rũ bỏ mọi mệt mỏi.`,image_url:`images/phase1/sg_util_013.png`,phase_pool:`SAIGON`,tags:[`UTILITY`,`INDOOR`],cost:{xu:1,la:0},base_vp:0,location:{lat:10.7715,lng:106.6931,is_virtual:!0,label:`Sài Gòn`},on_play_effect:{has_effect:!0,effect_type:`RECOVER_LA`,effect_value:2},rarity:`COMMON`,icon:`⚡`},{card_id:`SG_UTIL_014`,name:`Tiệm Gội Đầu Dưỡng Sinh`,description:`Đắm chìm trong hương sả chanh và những động tác xoa bóp điêu luyện. Trải nghiệm thư giãn đặc sản này giúp bạn rũ bỏ mọi mệt mỏi.`,image_url:`images/phase1/sg_util_013.png`,phase_pool:`SAIGON`,tags:[`UTILITY`,`INDOOR`],cost:{xu:1,la:0},base_vp:0,location:{lat:10.7715,lng:106.6931,is_virtual:!0,label:`Sài Gòn`},on_play_effect:{has_effect:!0,effect_type:`RECOVER_LA`,effect_value:2},rarity:`COMMON`,icon:`⚡`},{card_id:`SG_UTIL_015`,name:`Thuê Thợ Ảnh Dạo`,description:`Bắt gặp một thợ nháy dạo chuyên nghiệp, bạn chi tiền để có bộ ảnh sống ảo chất lượng. Nhân đôi giá trị kỷ niệm cho điểm đến kế tiếp.`,image_url:`images/phase1/sg_util_015.png`,phase_pool:`SAIGON`,tags:[`UTILITY`,`OUTDOOR`],cost:{xu:2,la:0},base_vp:0,location:{lat:10.7715,lng:106.6931,is_virtual:!0,label:`Sài Gòn`},on_play_effect:{has_effect:!0,effect_type:`DOUBLE_VP_NEXT`,effect_value:1},rarity:`UNCOMMON`,icon:`🧰`}],De=[{card_id:`SG_ACT_001`,name:`Thảo Cầm Viên Sài Gòn`,description:`Lạc bước giữa không gian xanh mát của khu bảo tồn động thực vật lâu đời nhất thành phố. Khuôn viên rộng lớn sẽ ngốn của bạn không ít mồ hôi và sức lực.`,image_url:`images/phase1/sg_act_001.png`,phase_pool:`SAIGON`,tags:[`ACTION`,`OUTDOOR`],cost:{xu:1,la:2},base_vp:15,location:{lat:10.7873344,lng:106.7050566,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`EPIC`,icon:`🎒`},{card_id:`SG_ACT_002`,name:`Phố Tây Bùi Viện`,description:`Nhịp sống cuồng nhiệt không ngủ. Bạn vui hết nấc trong tiếng nhạc xập xình, nhưng việc chen lấn giữa biển người sẽ vắt kiệt thể lực của bạn.`,image_url:`images/phase1/sg_act_002.png`,phase_pool:`SAIGON`,tags:[`ACTION`,`OUTDOOR`],cost:{xu:2,la:2},base_vp:22,location:{lat:10.7674,lng:106.694,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`EPIC`,icon:`🎒`},{card_id:`SG_ACT_003`,name:`Nhà hát Kịch IDECAF`,description:`Thưởng thức những vở kịch chất lượng cao trong không gian khán phòng ấm cúng. Trải nghiệm giải trí tuyệt vời mà không tốn một giọt mồ hôi.`,image_url:`images/phase1/sg_act_003.png`,phase_pool:`SAIGON`,tags:[`ACTION`,`INDOOR`],cost:{xu:3,la:0},base_vp:20,location:{lat:10.7796931,lng:106.7037049,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`EPIC`,icon:`🎒`},{card_id:`SG_ACT_004`,name:`Công viên nước Đầm Sen`,description:`Vẫy vùng trong làn nước mát lạnh và thử sức với các ống trượt cảm giác mạnh. Một ngày vui chơi tơi bời nhưng cũng đốt cháy toàn bộ năng lượng.`,image_url:`images/phase1/sg_act_004.png`,phase_pool:`SAIGON`,tags:[`ACTION`,`OUTDOOR`],cost:{xu:2,la:2},base_vp:22,location:{lat:10.7688947,lng:106.6359939,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`EPIC`,icon:`🌳`},{card_id:`SG_ACT_005`,name:`Snow Town Sài Gòn`,description:`Trải nghiệm cái lạnh cắt da giữa lòng thành phố nhiệt đới. Chơi đùa với bãi tuyết nhân tạo mang lại cảm giác thích thú lạ kỳ và vô cùng sảng khoái.`,image_url:`images/phase1/sg_act_005.png`,phase_pool:`SAIGON`,tags:[`ACTION`,`INDOOR`],cost:{xu:3,la:1},base_vp:28,location:{lat:10.771911,lng:106.753896,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`EPIC`,icon:`🎒`},{card_id:`SG_ACT_006`,name:`Sân vận động Thống Nhất`,description:`Hòa mình vào không khí cuồng nhiệt trên khán đài. Tiếng hò reo cổ vũ vang dội làm bạn vô cùng phấn khích và tiêu hao đôi chút năng lượng.`,image_url:`images/phase1/sg_act_006.png`,phase_pool:`SAIGON`,tags:[`ACTION`,`OUTDOOR`],cost:{xu:1,la:1},base_vp:12,location:{lat:10.760687,lng:106.6632718,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🏃`},{card_id:`SG_ACT_007`,name:`Jump Arena HimLam`,description:`Thử thách bản thân với các trò chơi nhún nhảy bạt lò xo. Một hoạt động thể chất cường độ cao, đảm bảo khiến bạn thở dốc chỉ sau vài chục phút.`,image_url:`images/phase1/sg_act_007.png`,phase_pool:`SAIGON`,tags:[`ACTION`,`INDOOR`],cost:{xu:2,la:2},base_vp:20,location:{lat:10.7420731,lng:106.6951195,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`EPIC`,icon:`🎒`},{card_id:`SG_ACT_008`,name:`Khu du lịch Văn Thánh`,description:`Tận hưởng không gian xanh mát và yên bình ven hồ. Một buổi cắm trại dã ngoại nhẹ nhàng giúp gắn kết tình cảm với những người bạn đồng hành.`,image_url:`images/phase1/sg_act_008.png`,phase_pool:`SAIGON`,tags:[`ACTION`,`OUTDOOR`],cost:{xu:2,la:1},base_vp:15,location:{lat:10.7987213,lng:106.7165604,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🎒`},{card_id:`SG_ACT_009`,name:`Chèo thuyền SUP Thanh Đa`,description:`Khua mái chèo lướt đi trên dòng sông tĩnh lặng ngắm hoàng hôn. Trải nghiệm lãng mạn nhưng cũng đòi hỏi sự thăng bằng và sức mạnh đáng kể từ đôi tay.`,image_url:`images/phase1/sg_act_009.png`,phase_pool:`SAIGON`,tags:[`ACTION`,`OUTDOOR`],cost:{xu:2,la:2},base_vp:22,location:{lat:10.8202401,lng:106.7262736,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`EPIC`,icon:`🚣`},{card_id:`SG_ACT_010`,name:`Công viên văn hóa Suối Tiên`,description:`Khu vui chơi giải trí khổng lồ mang đậm màu sắc văn hóa dân tộc. Đi bộ qua các đền đài và tham gia vô vàn trò chơi sẽ rút cạn sức lực của bạn.`,image_url:`images/phase1/sg_act_010.png`,phase_pool:`SAIGON`,tags:[`ACTION`,`OUTDOOR`],cost:{xu:2,la:3},base_vp:25,location:{lat:10.8661863,lng:106.8031678,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`LEGENDARY`,icon:`🌳`},{card_id:`SG_ACT_011`,name:`Khu căn cứ Vàm Sát Đảo Khỉ`,description:`Hành trình mạo hiểm tiến sâu vào khu dự trữ sinh quyển ngập mặn. Thách thức lớn về cả khoảng cách di chuyển lẫn sức chịu đựng trước thiên nhiên hoang dã.`,image_url:`images/phase1/sg_act_011.png`,phase_pool:`SAIGON`,tags:[`ACTION`,`OUTDOOR`],cost:{xu:3,la:3},base_vp:35,location:{lat:10.4094821,lng:106.888644,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`LEGENDARY`,icon:`🎒`},{card_id:`SG_ACT_012`,name:`Phố đi bộ Nguyễn Huệ`,description:`Tản bộ thong dong trên con phố hiện đại bậc nhất nhộn nhịp người qua lại. Khá dễ chịu vào buổi tối nhưng sẽ rút sức bạn nhanh chóng nếu ghé qua vào buổi trưa.`,image_url:`images/phase1/sg_act_012.png`,phase_pool:`SAIGON`,tags:[`ACTION`,`OUTDOOR`],cost:{xu:0,la:1},base_vp:10,location:{lat:10.7740664,lng:106.7036542,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🎒`},{card_id:`SG_ACT_013`,name:`Saigon Centre`,description:`Chìm đắm trong thế giới mua sắm cao cấp ngập tràn ánh đèn và hàng hiệu. Một trải nghiệm đốt tiền nhanh chóng nhưng bù lại bằng sự thỏa mãn tuyệt đối.`,image_url:`images/phase1/sg_act_013.png`,phase_pool:`SAIGON`,tags:[`ACTION`,`INDOOR`],cost:{xu:2,la:1},base_vp:15,location:{lat:10.7731031,lng:106.70105,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🎒`},{card_id:`SG_ACT_014`,name:`Khu liên hợp Thể thao Quận 5`,description:`Đắm mình dưới làn nước xanh mát của hồ bơi hoặc bung sức tại các sân cầu lông. Lựa chọn tuyệt vời để rèn luyện thể chất vào những ngày nhiệt độ tăng cao.`,image_url:`images/phase1/sg_act_014.png`,phase_pool:`SAIGON`,tags:[`ACTION`,`INDOOR`],cost:{xu:1,la:2},base_vp:18,location:{lat:10.7524216,lng:106.6685424,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`EPIC`,icon:`🏃`},{card_id:`SG_ACT_015`,name:`Công Viên Bờ Sông Sài Gòn Tp Thủ Đức`,description:`Ngắm nhìn toàn cảnh thành phố lung linh từ phía bờ Đông. Bãi cỏ rộng lớn và gió lộng thổi không ngừng, lý tưởng để dạo mát và thả diều.`,image_url:`images/phase1/sg_act_015.png`,phase_pool:`SAIGON`,tags:[`ACTION`,`OUTDOOR`],cost:{xu:0,la:1},base_vp:10,location:{lat:10.7716904,lng:106.7098014,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🌳`},{card_id:`SG_ACT_016`,name:`Archery Tag Vietnam`,description:`Hóa thân thành cung thủ trong một trận chiến sinh tồn đầy kịch tính. Bạn sẽ phải chạy nước rút, ẩn nấp và ngắm bắn liên tục đến bở hơi tai.`,image_url:`images/phase1/sg_act_016.png`,phase_pool:`SAIGON`,tags:[`ACTION`,`OUTDOOR`],cost:{xu:2,la:2},base_vp:20,location:{lat:10.8198607,lng:106.7256808,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`EPIC`,icon:`🎒`},{card_id:`SG_ACT_017`,name:`Sân trượt băng Vincom Landmark 81`,description:`Mũi giày trượt lướt êm ái trên mặt băng lạnh giá trong tòa nhà cao nhất Việt Nam. Trải nghiệm giải trí xa xỉ tiêu tốn không ít hầu bao của bạn.`,image_url:`images/phase1/sg_act_017.png`,phase_pool:`SAIGON`,tags:[`ACTION`,`INDOOR`],cost:{xu:4,la:1},base_vp:30,location:{lat:10.7943125,lng:106.7220625,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`EPIC`,icon:`🏃`},{card_id:`SG_ACT_018`,name:`Công viên Tao Đàn`,description:`Lá phổi xanh của thành phố ngập tràn bóng cây cổ thụ. Dạo bước trên những con đường rợp bóng mát là cách tuyệt vời để thư giãn đôi chân mỏi mệt.`,image_url:`images/phase1/sg_act_018.png`,phase_pool:`SAIGON`,tags:[`ACTION`,`OUTDOOR`],cost:{xu:0,la:1},base_vp:8,location:{lat:10.7755796,lng:106.6920797,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🌳`},{card_id:`SG_ACT_019`,name:`Board Game Station`,description:`Đấu trí căng thẳng qua những ván cờ đầy toan tính. Tiếng cười nói rộn rã trong phòng máy lạnh xua tan đi cái mệt nhọc của những chuyến đi dài.`,image_url:`images/phase1/sg_phase_act_019.png`,phase_pool:`SAIGON`,tags:[`ACTION`,`INDOOR`],cost:{xu:1,la:1},base_vp:15,location:{lat:10.765794,lng:106.695688,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🎒`},{card_id:`SG_ACT_020`,name:`Trải nghiệm Saigon Waterbus`,description:`Lướt trên mặt sóng ngắm nhìn toàn cảnh đường chân trời hiện đại dọc hai bờ sông. Trải nghiệm ngắm cảnh thư thái tuyệt vời mà không đòi hỏi nhiều sự vận động.`,image_url:`images/phase1/sg_act_020.png`,phase_pool:`SAIGON`,tags:[`ACTION`,`OUTDOOR`],cost:{xu:1,la:0},base_vp:12,location:{lat:10.773403,lng:106.705552,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🎒`}],Oe=[{card_id:`SG_CULT_001`,name:`Dinh Độc Lập`,description:`Chứng nhân lịch sử với kiến trúc độc bản. Khám phá các sảnh đường khổng lồ và đường hầm bí mật sẽ tiêu tốn không ít thể lực của bạn.`,image_url:`images/phase1/sg_cult_001.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`INDOOR`,`OUTDOOR`],cost:{xu:3,la:1},base_vp:22,location:{lat:10.7769942,lng:106.6953021,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`EPIC`,icon:`🏯`},{card_id:`SG_CULT_002`,name:`Bưu điện trung tâm Sài Gòn`,description:`Mái vòm thép vĩ đại mang đậm dấu ấn hoài niệm. Gửi một tấm bưu thiếp và tận hưởng không gian kiến trúc Pháp an toàn, mát mẻ.`,image_url:`images/phase1/sg_cult_002.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`INDOOR`],cost:{xu:1,la:0},base_vp:10,location:{lat:10.7799129,lng:106.699902,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🏯`},{card_id:`SG_CULT_003`,name:`Nhà thờ Đức Bà Sài Gòn`,description:`Biểu tượng tôn giáo với gạch nung đỏ rực. Chiêm ngưỡng vẻ đẹp cổ kính từ bên ngoài và lắng nghe tiếng chuông ngân vang giữa phố thị.`,image_url:`images/phase1/sg_cult_003.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`OUTDOOR`],cost:{xu:0,la:1},base_vp:8,location:{lat:10.7797855,lng:106.6990189,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`⛪`},{card_id:`SG_CULT_004`,name:`Bảo tàng Chứng tích Chiến tranh`,description:`Trải nghiệm lịch sử sâu sắc và nặng nề. Những tư liệu chân thực khiến bạn tĩnh lặng và tiêu hao đáng kể năng lượng tinh thần.`,image_url:`images/phase1/sg_cult_004.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`INDOOR`],cost:{xu:2,la:1},base_vp:15,location:{lat:10.7795106,lng:106.6920916,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🏛️`},{card_id:`SG_CULT_005`,name:`Bảo tàng Lịch sử Thành phố Hồ Chí Minh`,description:`Kho tàng di sản ngàn năm của dân tộc. Đi bộ mải miết qua các gian trưng bày rộng lớn đòi hỏi sự bền bỉ của đôi chân.`,image_url:`images/phase1/sg_cult_005.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`INDOOR`],cost:{xu:2,la:1},base_vp:15,location:{lat:10.788075,lng:106.7047291,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🏛️`},{card_id:`SG_CULT_006`,name:`Bảo tàng Mỹ thuật Thành phố Hồ Chí Minh`,description:`Tòa dinh thự 99 cửa với hành lang ngập nắng. Trạm dừng chân nghệ thuật tuyệt đẹp để cho ra đời những bức ảnh lưu niệm ấn tượng.`,image_url:`images/phase1/sg_cult_006.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`INDOOR`],cost:{xu:2,la:0},base_vp:15,location:{lat:10.7699472,lng:106.6992162,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🏛️`},{card_id:`SG_CULT_007`,name:`Nhà hát Thành phố Hồ Chí Minh`,description:`Thưởng thức nghệ thuật thính phòng trong một công trình tráng lệ. Một buổi tối đắt đỏ nhưng mang lại trải nghiệm văn hóa đẳng cấp.`,image_url:`images/phase1/sg_cult_007.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`INDOOR`,`OUTDOOR`],cost:{xu:5,la:0},base_vp:35,location:{lat:10.7766128,lng:106.7031715,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`LEGENDARY`,icon:`🏯`},{card_id:`SG_CULT_008`,name:`UBND Thành phố Hồ Chí Minh`,description:`Kiến trúc thời Pháp tuyệt đẹp ngay trung tâm. Một điểm check-in không tốn kém, nhưng việc nán lại lâu dưới nắng gắt sẽ khiến bạn hao tổn sức lực.`,image_url:`images/phase1/sg_cult_008.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`OUTDOOR`],cost:{xu:0,la:1},base_vp:8,location:{lat:10.7765431,lng:106.700916,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🏯`},{card_id:`SG_CULT_009`,name:`Chùa Ngọc Hoàng`,description:`Ngôi chùa cổ linh thiêng ngập trong khói nhang. Nơi du khách tìm kiếm sự bình an và tĩnh lặng giữa nhịp sống hối hả.`,image_url:`images/phase1/sg_cult_009.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`INDOOR`],cost:{xu:1,la:0},base_vp:12,location:{lat:10.7919963,lng:106.6981791,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🛕`},{card_id:`SG_CULT_010`,name:`Miếu Bà Thiên Hậu - Hội Quán Tuệ Thành`,description:`Tuyệt tác kiến trúc của người Hoa tại Chợ Lớn. Khói nhang vòng cuộn tỏa mang theo những lời cầu nguyện bình an che chở bạn khỏi muộn phiền.`,image_url:`images/phase1/sg_cult_010.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`INDOOR`],cost:{xu:1,la:0},base_vp:12,location:{lat:10.7532496,lng:106.6611735,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🛕`},{card_id:`SG_CULT_011`,name:`Hội Quán Nghĩa An`,description:`Rực rỡ với nghệ thuật chạm khắc gỗ tinh xảo. Nơi giao lưu văn hóa và tín ngưỡng đặc sắc của cộng đồng Triều Châu ẩn mình trong khu phố chật hẹp.`,image_url:`images/phase1/sg_cult_011.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`INDOOR`],cost:{xu:1,la:0},base_vp:12,location:{lat:10.753729,lng:106.6620902,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🛕`},{card_id:`SG_CULT_012`,name:`Chợ Bình Tây`,description:`Khu chợ đầu mối sầm uất với kiến trúc hình bát quái. Đôi chân bạn mỏi nhừ vì luồn lách qua hàng ngàn sạp hàng chen chúc.`,image_url:`images/phase1/sg_cult_012.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`INDOOR`],cost:{xu:2,la:1},base_vp:15,location:{lat:10.7493638,lng:106.6510455,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🏯`},{card_id:`SG_CULT_013`,name:`Nhà thờ Giáo xứ Thánh Phanxicô Xaviê`,description:`Sự kết hợp độc đáo giữa kiến trúc Gothic và phong cách Á Đông nằm ngay giữa lòng khu Chợ Lớn sầm uất.`,image_url:`images/phase1/sg_cult_013.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`INDOOR`,`OUTDOOR`],cost:{xu:0,la:1},base_vp:8,location:{lat:10.751965,lng:106.6543386,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`⛪`},{card_id:`SG_CULT_014`,name:`Hội quán Ôn Lăng - Chùa quan âm`,description:`Ngôi chùa cổ kính với mặt tiền lộng lẫy và những quần thể tượng gốm tinh xảo trải dài trên mái ngói nhuốm màu thời gian.`,image_url:`images/phase1/sg_cult_014.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`INDOOR`],cost:{xu:1,la:0},base_vp:12,location:{lat:10.7541333,lng:106.6596253,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🛕`},{card_id:`SG_CULT_015`,name:`Bến Nhà Rồng - Bảo tàng Hồ Chí Minh`,description:`Tòa nhà mang kiến trúc Á-Âu bên bờ sông lộng gió. Không gian lịch sử hào hùng cùng tầm nhìn thoáng đãng ra dòng sông rộng lớn.`,image_url:`images/phase1/sg_cult_015.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`INDOOR`,`OUTDOOR`],cost:{xu:3,la:1},base_vp:20,location:{lat:10.7682488,lng:106.7068028,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`EPIC`,icon:`🏛️`},{card_id:`SG_CULT_016`,name:`Lăng Tả quân Lê Văn Duyệt (Lăng Ông - Bà Chiểu)`,description:`Biểu tượng văn hóa lâu đời của đất Gia Định. Việc tản bộ trong khuôn viên rộng lớn và uy nghiêm này đòi hỏi sự bền bỉ của đôi chân.`,image_url:`images/phase1/sg_cult_016.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`INDOOR`,`OUTDOOR`],cost:{xu:1,la:1},base_vp:12,location:{lat:10.8022201,lng:106.697085,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🏯`},{card_id:`SG_CULT_017`,name:`Địa Đạo Củ Chi - Bến Dược`,description:`Hành trình luồn lách dưới lòng đất hẹp. Một thử thách sinh tồn vắt kiệt thể lực và tốn kém thời gian đi lại, nhưng trải nghiệm lịch sử mang lại thực sự vô giá.`,image_url:`images/phase1/sg_cult_017.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`OUTDOOR`],cost:{xu:4,la:3},base_vp:40,location:{lat:11.1463927,lng:106.45944,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`LEGENDARY`,icon:`🏯`},{card_id:`SG_CULT_018`,name:`Chiến khu Rừng Sác`,description:`Khám phá căn cứ địa giữa rừng ngập mặn Cần Giờ. Hành trình lội rừng vất vả và chặng đường dài sẽ thử thách sức chịu đựng của bạn.`,image_url:`images/phase1/sg_cult_018.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`OUTDOOR`],cost:{xu:4,la:2},base_vp:35,location:{lat:10.4155579,lng:106.8818514,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`LEGENDARY`,icon:`🏯`},{card_id:`SG_CULT_019`,name:`Chùa Bửu Long`,description:`Lộng lẫy như một cung điện Thái Lan thu nhỏ ẩn mình ở vùng ven thành phố. Bạn sẽ mất kha khá thời gian và sức lực để đến được đây, nhưng khung cảnh thì hoàn toàn xứng đáng.`,image_url:`images/phase1/sg_cult_019.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`OUTDOOR`],cost:{xu:2,la:2},base_vp:25,location:{lat:10.8788722,lng:106.8350287,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`EPIC`,icon:`🛕`},{card_id:`SG_CULT_020`,name:`Khu Tưởng niệm Liệt sĩ Ngã ba Giồng`,description:`Di tích lịch sử oai hùng nằm lặng lẽ ở ngoại ô Hóc Môn. Một chuyến đi dài về vùng ven sẽ thử thách tính kiên nhẫn và sức bền của bất kỳ đôi chân nào.`,image_url:`images/phase1/sg_cult_020.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`OUTDOOR`],cost:{xu:1,la:2},base_vp:25,location:{lat:10.868225,lng:106.5585429,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`EPIC`,icon:`🏯`},{card_id:`SG_CULT_021`,name:`Đình Bình Hòa`,description:`Di tích kiến trúc cổ mang đậm dấu ấn làng mạc Nam Bộ xưa. Yên tĩnh, mộc mạc và hoàn toàn tách biệt khỏi nhịp sống ồn ào của phố thị.`,image_url:`images/phase1/sg_cult_021.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`INDOOR`,`OUTDOOR`],cost:{xu:0,la:0},base_vp:8,location:{lat:10.8117004,lng:106.6964598,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`COMMON`,icon:`🏯`},{card_id:`SG_CULT_022`,name:`Chùa Pháp Vân`,description:`Điểm đến tâm linh thanh tịnh. Nơi thích hợp để trú chân, lấy lại sự bình tĩnh và phục hồi tinh thần sau những chặng đường dài.`,image_url:`images/phase1/sg_cult_022.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`INDOOR`],cost:{xu:0,la:0},base_vp:8,location:{lat:10.8122079,lng:106.6930287,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`COMMON`,icon:`🛕`},{card_id:`SG_CULT_024`,name:`Bảo tàng Phụ nữ Nam bộ`,description:`Tìm hiểu về vẻ đẹp và sự kiên cường của người phụ nữ Nam Bộ. Một không gian mang tính giáo dục và là trạm dừng chân an toàn khỏi thời tiết khắc nghiệt.`,image_url:`images/phase1/sg_cult_024.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`INDOOR`],cost:{xu:1,la:0},base_vp:10,location:{lat:10.7836813,lng:106.6876327,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🏛️`},{card_id:`SG_CULT_025`,name:`Nhà thờ Tân Định (Nhà thờ Màu Hồng)`,description:`Công trình kiến trúc Gothic rực rỡ với sắc hồng độc đáo. Một bức ảnh check-in tại đây là điều không thể thiếu, dù thời tiết bên ngoài có oi ả đến đâu.`,image_url:`images/phase1/sg_cult_025.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`OUTDOOR`],cost:{xu:1,la:0},base_vp:10,location:{lat:10.7887,lng:106.6896,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`⛪`},{card_id:`SG_CULT_026`,name:`Hẻm Hào Sĩ Phường`,description:`Con hẻm trăm tuổi mang đậm màu sắc điện ảnh Hong Kong xưa. Đi bộ nhẹ nhàng nhưng mang lại cảm giác bình yên, hoài cổ giữa lòng Chợ Lớn sầm uất.`,image_url:`images/phase1/sg_cult_026.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`OUTDOOR`],cost:{xu:0,la:1},base_vp:8,location:{lat:10.7521,lng:106.6631,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🏯`},{card_id:`SG_CULT_027`,name:`Phố Lồng Đèn Lương Nhữ Học`,description:`Cả khu phố rực sáng bởi hàng ngàn chiếc lồng đèn thủ công. Vô cùng náo nhiệt nhưng việc luồn lách giữa dòng người đông đúc sẽ làm bạn toát mồ hôi.`,image_url:`images/phase1/sg_cult_027.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`OUTDOOR`],cost:{xu:1,la:1},base_vp:10,location:{lat:10.7523,lng:106.6578,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🏯`},{card_id:`SG_CULT_028`,name:`Chùa Giác Lâm`,description:`Tổ đình lâu đời nhất Sài Gòn với kiến trúc chữ Tam truyền thống. Không gian tĩnh lặng, an toàn để bạn né tránh những cơn mưa rào bất chợt.`,image_url:`images/phase1/sg_cult_028.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`INDOOR`],cost:{xu:1,la:0},base_vp:12,location:{lat:10.7686,lng:106.6473,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🛕`},{card_id:`SG_CULT_029`,name:`Bến Bình Đông`,description:`Tản bộ dọc dòng kênh ngắm nhìn những chiếc thuyền chở đầy hoa trái miền Tây. Một trải nghiệm văn hóa sông nước hiếm hoi còn sót lại.`,image_url:`images/phase1/sg_cult_029.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`OUTDOOR`],cost:{xu:0,la:1},base_vp:8,location:{lat:10.7381,lng:106.6525,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🏯`},{card_id:`SG_CULT_030`,name:`Bảo tàng TP.HCM (Dinh Gia Long)`,description:`Khám phá câu chuyện phát triển của thành phố trong tòa dinh thự cổ kính. Cầu thang gỗ và những hành lang rộng mở đem đến sự thư thái tuyệt đối.`,image_url:`images/phase1/sg_cult_030.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`INDOOR`],cost:{xu:2,la:0},base_vp:15,location:{lat:10.7758,lng:106.6997,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🏛️`},{card_id:`SG_CULT_031`,name:`Việt Nam Quốc Tự`,description:`Ngôi chùa khổng lồ với bảo tháp sừng sững giữa lòng Quận 10. Khuôn viên rộng lớn đòi hỏi bạn phải đi bộ khá nhiều dưới tiết trời oi ả.`,image_url:`images/phase1/sg_cult_031.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`INDOOR`,`OUTDOOR`],cost:{xu:1,la:1},base_vp:15,location:{lat:10.7709,lng:106.6733,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🏯`},{card_id:`SG_CULT_032`,name:`Phố Đồ Cổ Lê Công Kiều`,description:`Con phố ngắn ngủi nhưng chứa đựng hàng ngàn món cổ vật. Bạn mất khá nhiều thời gian và công sức để lùng sục những món đồ ưng ý dọc hai bên vỉa hè.`,image_url:`images/phase1/sg_cult_032.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`OUTDOOR`],cost:{xu:1,la:1},base_vp:15,location:{lat:10.7708,lng:106.7011,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`UNCOMMON`,icon:`🏯`},{card_id:`SG_CULT_033`,name:`Bảo tàng Y học Cổ truyền Việt Nam (FITO Museum)`,description:`Một bảo tàng tư nhân độc đáo với kiến trúc gỗ chạm khắc tinh xảo. Đắt tiền, nhưng trải nghiệm không gian y học cổ truyền dịu mát là vô giá.`,image_url:`images/phase1/sg_cult_033.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`INDOOR`],cost:{xu:3,la:0},base_vp:18,location:{lat:10.7766,lng:106.6738,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`EPIC`,icon:`🏛️`},{card_id:`SG_CULT_034`,name:`Đền Tưởng niệm các Vua Hùng`,description:`Công trình uy nghiêm mang đậm tinh thần dân tộc. Việc lặn lội ra tận vùng ngoại ô ngập nắng sẽ bào mòn đáng kể thể lực của bạn.`,image_url:`images/phase1/sg_cult_034.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`OUTDOOR`],cost:{xu:2,la:2},base_vp:22,location:{lat:10.8415,lng:106.829,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`EPIC`,icon:`🏯`},{card_id:`SG_CULT_035`,name:`Bảo tàng Áo Dài`,description:`Không gian kiến trúc mộc mạc ẩn mình giữa thiên nhiên tĩnh lặng. Một chuyến đi đòi hỏi sự đầu tư lớn về mặt thời gian và sức lực khi phải rời xa chốn thị thành.`,image_url:`images/phase1/sg_cult_035.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`INDOOR`,`OUTDOOR`],cost:{xu:3,la:1},base_vp:22,location:{lat:10.8143,lng:106.8409,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`EPIC`,icon:`🏛️`},{card_id:`SG_CULT_036`,name:`Tu viện Khánh An`,description:`Góc Nhật Bản thu nhỏ với những mảng màu nâu trầm và mái ngói uốn lượn. Nằm khá xa trung tâm thành phố, đòi hỏi bạn phải có một lịch trình di chuyển thật khéo léo.`,image_url:`images/phase1/sg_cult_036.png`,phase_pool:`SAIGON`,tags:[`CULTURE`,`INDOOR`,`OUTDOOR`],cost:{xu:2,la:1},base_vp:20,location:{lat:10.8705,lng:106.6713,is_virtual:!1,label:`Sài Gòn`},on_play_effect:{has_effect:!1,effect_type:`NONE`,effect_value:0},rarity:`EPIC`,icon:`🏯`}],ke=[...Te,...Ee,...De,...Oe];console.log(`[DATA CHECK] cards.phase1.ts loaded`),console.log(`[DATA CHECK] total cards:`,ke.length),console.log(`[DATA CHECK] tag counts:`,ke.reduce((e,t)=>{let n=t.tags?.[0]??`UNKNOWN`;return e[n]=(e[n]??0)+1,e},{})),console.log(`[DATA CHECK] first 10 cards:`,ke.slice(0,10));function Ae(e){return e.includes(`FOOD`)?`FOOD`:e.includes(`CULTURE`)?`CULTURE`:e.includes(`ACTION`)?`ACTION`:e.includes(`UTILITY`)?`UTILITY`:e[0]??`FOOD`}function je(e){switch(e){case`FOOD`:return`Ẩm thực`;case`CULTURE`:return`Văn hóa`;case`ACTION`:return`Khám phá`;case`UTILITY`:return`Tiện ích`;case`OUTDOOR`:return`Ngoài trời`;case`INDOOR`:return`Trong nhà`;default:return`Khác`}}function Me(e){switch(e){case`COMMON`:return`★`;case`UNCOMMON`:return`★★`;case`EPIC`:return`★★★★`;case`LEGENDARY`:return`★★★★★`;default:return`★`}}function Ne(e){switch(e){case`COMMON`:return`common`;case`UNCOMMON`:return`uncommon`;case`EPIC`:return`epic`;case`LEGENDARY`:return`legendary`;default:return`common`}}function Pe(e){if(e.on_play_effect.has_effect){if(e.on_play_effect.effect_type===`RECOVER_LA`)return`Khi đặt xuống: hồi ${e.on_play_effect.effect_value} thể lực`;if(e.on_play_effect.effect_type===`RECOVER_XU`)return`Khi đặt xuống: hồi ${e.on_play_effect.effect_value} xu`;if(e.on_play_effect.effect_type===`GAIN_VP`)return`Khi đặt xuống: +${e.on_play_effect.effect_value} VP`}return e.tags.includes(`FOOD`)?`Nếu có 2 lá Ẩm thực: +5 VP`:e.tags.includes(`CULTURE`)?`Nếu có 2 lá Văn hóa: +8 VP`:e.tags.includes(`ACTION`)?`Nếu đặt sau lá Khám phá: +10 VP`:`Không có hiệu ứng đặc biệt`}function Fe(e){let t=e.trim(),n={"Cà Phê Bệt Nhà Thờ Đức Bà":`Cà Phê Bệt`,"Bánh Tráng Nướng Hồ Con Rùa":`Bánh Tráng`,"Cà Phê Vợt Cheo Leo":`Cà Phê Vợt`,"Phá Lấu Bò Cô Oanh":`Phá Lấu`,"Súp Cua Chợ Tân Định":`Súp Cua`,"Bánh Mì Huỳnh Hoa":`Bánh Mì`,"Phố Ẩm Thực Hồ Thị Kỷ":`Hồ Thị Kỷ`,"Cà Phê Chung Cư 42 Nguyễn Huệ":`Cà Phê 42`,"Phố Sủi Cảo Hà Tôn Quyền":`Sủi Cảo`,"Cơm Tấm Ba Ghiền":`Cơm Tấm`,"Phố Ốc Vĩnh Khánh":`Ốc Vĩnh Khánh`,"Bánh Xèo Đinh Công Tráng":`Bánh Xèo`,"Chè Hà Ký Chợ Lớn":`Chè Hà Ký`,"Phở Hòa Pasteur":`Phở Hòa`,"Lẩu Cá Kèo Bà Huyện Thanh Quan":`Lẩu Cá Kèo`,"Dimsum Tiến Phát":`Dimsum`,"Nhà Hàng Chay Hum":`Chay Hum`,"Ăn Tối Du Thuyền Sông Sài Gòn":`Du Thuyền Tối`,"Tầng 79 Landmark 81":`Landmark 81`,"Cơm Quê Dượng Bầu":`Dượng Bầu`,"Du Thuyền Hạ Long":`Du Thuyền`,"Chợ Đêm Đà Lạt":`Chợ Đêm`};if(n[t])return n[t];if(t.length<=14)return t;let r=t.split(/\s+/);return r.length<=3?t:r.slice(0,3).join(` `)}function Ie(e){let t=e.trim(),n={"Quận 1 - Công viên 30/4":`Q.1`,"Quận 3 - Vòng xoay Công trường Quốc Tế":`Q.3`,"Quận 3 - Giáp ranh Quận 10":`Q.3`,"Quận 4 - Đường Tôn Đản":`Q.4`,"Quận 1 - Chợ Tân Định":`Q.1`,"Quận 1 - Đường Lê Thị Riêng":`Q.1`,"Quận 10 - Chợ Hoa":`Q.10`,"Quận 1 - Phố đi bộ Nguyễn Huệ":`Q.1`,"Quận 11 - Khu Chợ Lớn":`Q.11`,"Phú Nhuận - Cư xá Nguyễn Văn Trỗi":`Phú Nhuận`,"Quận 4 - Bờ kè":`Q.4`,"Quận 1 - Gần chợ Tân Định":`Q.1`,"Quận 5 - Châu Văn Liêm":`Q.5`,"Quận 3 - Đường Pasteur":`Q.3`,"Quận 3 - Bà Huyện Thanh Quan":`Q.3`,"Quận 5 - Khu Chợ Lớn":`Q.5`,"Quận 3 - Võ Văn Tần":`Q.3`,"Quận 4 - Bến cảng Nhà Rồng":`Q.4`,"Bình Thạnh - Vinhomes Central Park":`Bình Thạnh`,"Khu vực trung tâm":`Trung tâm`,"Sài Gòn":`Sài Gòn`,"Hà Nội":`Hà Nội`,"Đà Lạt":`Đà Lạt`,"Đà Nẵng":`Đà Nẵng`,"Quảng Ninh":`Quảng Ninh`};if(n[t])return n[t];if(t.length<=12)return t;if(t.includes(`Quận`)){let e=t.match(/Quận\s*\d+/i);if(e)return e[0].replace(`Quận`,`Q.`)}return t.slice(0,12).trim()+`...`}function Le(e){let t=Ae(e.tags),n=e.location.label??e.phase_pool;return{id:e.card_id,name:e.name,shortName:Fe(e.name),city:n,shortCity:Ie(n),image:e.image_url,rarity:Ne(e.rarity),rarityLabel:Me(e.rarity),vp:e.base_vp,coin:e.cost.xu,stamina:e.cost.la,tag:t.toLowerCase(),tagLabel:je(t),tags:e.tags,onPlayEffect:e.on_play_effect,icon:e.icon,description:e.description,bonusText:Pe(e)}}var Re=[1,2,3,4,5],ze=[`Sáng`,`Trưa`,`Chiều`,`Tối`,`Khuya`];function Be(){return ze.map(()=>Re.map(()=>null))}function Ve(e,t){let n=[];for(let r=0;r<ze.length;r+=1){let i=e[r]?.[t]??null;i&&n.push(i)}return n}function He(e,t,n){return e[t]?.[n]??null}function Ue(e){return e.tags&&e.tags.length>0?e.tags.map(e=>e.toUpperCase()):[e.tag.toUpperCase()]}function We(e,t){return e.filter(e=>Ue(e).includes(t)).length}function Ge(){return 1}function Ke(e,t=Ge()){return e[t]}function qe(e){return e.length===0?null:e[Math.floor(Math.random()*e.length)]}function Je(e){let t=e.map(e=>[...e.pool]);return e.map((n,r)=>{let i=(r-1+e.length)%e.length;return Object.assign(Object.assign({},n),{pool:t[i]})})}function Ye({placedCards:e,getBoardDisplayName:t}){let n=e.reduce((e,t)=>e+t.vp,0),r=e.reduce((e,t)=>e+t.coin,0),i=e.reduce((e,t)=>e+t.stamina,0),a=[],o=0,s=ut(e,`FOOD`),c=ut(e,`CULTURE`),l=ut(e,`ACTION`);s>=2&&(o+=5,a.push(`Combo Ẩm thực x${s}: +5 VP`)),c>=2&&(o+=8,a.push(`Combo Văn hóa x${c}: +8 VP`)),l>=2&&(o+=10,a.push(`Chuỗi Khám phá x${l}: +10 VP`));for(let n of e){let e=n.onPlayEffect;e?.has_effect&&e.effect_type===`GAIN_VP`&&(o+=e.effect_value,a.push(`${t(n)}: +${e.effect_value} VP`))}return a.length===0&&a.push(`Chưa có bonus nào được kích hoạt`),{baseVP:n,bonusVP:o,totalVP:n+o,spentCoin:r,spentStamina:i,usedSlots:e.length,lines:a}}function Xe(e){return e?.boardTokenType??null}function Ze(e){return Xe(e)===`debt`}function Qe(e){return Xe(e)===`lock`}function $e(e){return e?.debtAmount??0}function et({boardSlots:e,currentDayIndex:t,dayLabel:n,rows:r,getCardTagKeys:i,countCardsWithTag:a,getCurrentDayPlacedCards:o}){let s=[],c=t,l={dayIndex:c,label:n,vp:0,steps:0},u=o(c),d=null;for(let t=0;t<r.length;t+=1){let o=e[t]?.[c]??null,f=r[t];if(!o){s.push({id:`empty_${c}_${t}`,dayIndex:c,rowIndex:t,dayLabel:n,timeLabel:f,title:`Không có hoạt động`,subtitle:`Không có hoạt động, xem như thời gian nghỉ / di chuyển.`,vpDelta:0,coinDelta:0,staminaDelta:0,isEmpty:!0});continue}if(Ze(o)){l.vp+=-20,l.steps+=1,s.push({id:o.id,dayIndex:c,rowIndex:t,dayLabel:n,timeLabel:f,title:`Token nợ`,subtitle:`Nợ tiền ${$e(o)} xu`,vpDelta:-20,coinDelta:0,staminaDelta:0,isDebtPenalty:!0,isBoardToken:!0});continue}if(Qe(o)){s.push({id:o.id,dayIndex:c,rowIndex:t,dayLabel:n,timeLabel:f,title:`Bị khóa`,subtitle:`Kiệt sức, không thể xếp hoạt động.`,vpDelta:0,coinDelta:0,staminaDelta:0,isBoardToken:!0});continue}let p=i(o),m=``;p.includes(`FOOD`)&&a(u,`FOOD`)>=2?m=`Combo Ẩm thực đang kích hoạt`:p.includes(`CULTURE`)&&a(u,`CULTURE`)>=2?m=`Combo Văn hóa đang kích hoạt`:p.includes(`ACTION`)&&a(u,`ACTION`)>=2&&(m=`Chuỗi Khám phá đang kích hoạt`);let ee=rt(o,c,t),h=(d?ot(d,o,c,t):null)??ee,g=h?.vpDelta??0,te=h?.staminaDelta??0,ne=o.vp+g;l.vp+=ne,l.steps+=1,s.push({id:o.id,dayIndex:c,rowIndex:t,dayLabel:n,timeLabel:f,title:o.name,subtitle:`${o.city} • ${o.tagLabel}`,vpDelta:ne,coinDelta:-o.coin,staminaDelta:-o.stamina+te,comboText:m,eventText:h?.text,eventType:h?.type,eventVpDelta:g,eventStaminaDelta:te,distanceKm:h?.distanceKm,isBadEvent:h?.isBad===!0}),d=o}return{steps:s,daySummaries:[l]}}function tt({boardSlots:e,currentDayIndex:t,dayLabel:n,rows:r,getBoardDisplayName:i,getCardTagKeys:a,countCardsWithTag:o,getCurrentDayPlacedCards:s}){let c=Ye({placedCards:s(),getBoardDisplayName:i}),l=[],u=[],{steps:d,daySummaries:f}=et({boardSlots:e,currentDayIndex:t,dayLabel:n,rows:r,getCardTagKeys:a,countCardsWithTag:o,getCurrentDayPlacedCards:s}),p=d.reduce((e,t)=>t.isDebtPenalty?e+Math.abs(t.vpDelta):e,0),m=d.reduce((e,t)=>t.eventType===`promo`||t.eventType===`storm`?e+(t.eventVpDelta??0):e,0),ee=d.reduce((e,t)=>t.eventType===`distance`?e+Math.abs(t.eventVpDelta??0):e,0);c.usedSlots===0&&l.push(`Chưa có thẻ nào trên lịch trình.`),c.usedSlots>0&&c.bonusVP===0&&l.push(`Lịch trình chưa kích hoạt combo nào.`);for(let n=0;n<e.length;n+=1)e[n].filter((e,n)=>n===t).filter(e=>e!==null).length>=4&&l.push(`${r[n]} có lịch dày, nên chừa ô nghỉ/di chuyển.`);l.length===0&&l.push(`Lịch trình hiện tại ổn để mô phỏng MVP.`);for(let e of d)e.eventText&&u.push(`${e.timeLabel}: ${e.eventText}`);u.length===0&&u.push(`Không có event phát sinh trong ngày này.`);let h=d.reduce((e,t)=>e+t.vpDelta,0)+c.bonusVP;return Object.assign(Object.assign({},c),{debtPenalty:p,eventModifier:m,distancePenalty:ee,finalVP:h,warnings:l,events:u,replaySteps:d,daySummaries:f,lines:[...c.lines,`Debt penalty: -${p} VP`,`Event modifier: ${m>=0?`+`:``}${m} VP`,`Distance penalty: -${ee} VP`,`Final VP: ${h}`]})}function nt(e){let t=2166136261;for(let n=0;n<e.length;n+=1)t^=e.charCodeAt(n),t=Math.imul(t,16777619);return(t>>>0)/4294967295}function rt(e,t,n){if(nt(`${e.id}|${t}|${n}|scan-event`)>=.15)return null;let r=nt(`${e.id}|${t}|${n}|event-type`);return r<1/3?{type:`promo`,text:`Khuyến mãi: +10 VP`,vpDelta:10,staminaDelta:0,isBad:!1}:r<2/3?{type:`traffic`,text:`Kẹt xe: -8 thể lực`,vpDelta:0,staminaDelta:-8,isBad:!0}:{type:`storm`,text:`Mưa giông: -10 VP`,vpDelta:-10,staminaDelta:0,isBad:!0}}function it(e){let t=e;return typeof t.lat==`number`&&typeof t.lng==`number`?{lat:t.lat,lng:t.lng}:t.location&&typeof t.location==`object`&&typeof t.location.lat==`number`&&typeof t.location.lng==`number`?{lat:t.location.lat,lng:t.location.lng}:null}function at(e,t,n,r){let i=it(e),a=it(t);return i&&a?st(i,a):e.city===t.city?4+Math.round(nt(`${e.id}|${t.id}|same-city|${n}|${r}`)*12):22+Math.round(nt(`${e.id}|${t.id}|distance`)*18)}function ot(e,t,n,r){let i=at(e,t,n,r);return i<=20?null:{type:`distance`,text:`Khoảng cách > 20km`,vpDelta:-30,staminaDelta:0,distanceKm:i,isBad:!0}}function st(e,t){let n=ct(t.lat-e.lat),r=ct(t.lng-e.lng),i=ct(e.lat),a=ct(t.lat),o=Math.sin(n/2)**2+Math.cos(i)*Math.cos(a)*Math.sin(r/2)**2;return Math.round(6371*2*Math.atan2(Math.sqrt(o),Math.sqrt(1-o)))}function ct(e){return e*Math.PI/180}function lt(e){return e.tags&&e.tags.length>0?e.tags.map(e=>e.toUpperCase()):[e.tag.toUpperCase()]}function ut(e,t){return e.filter(e=>lt(e).includes(t)).length}function dt({cards:e,fallbackCards:t,handSize:n}){return e.length>=n?e:[...e,...t.slice(0,n-e.length)]}function ft(e){let t=[...e];for(let e=t.length-1;e>0;--e){let n=Math.floor(Math.random()*(e+1)),r=t[e];t[e]=t[n],t[n]=r}return t}function pt({deck:e,playerHand:t,shuffleCards:n}){return t.length===0?{deck:e,playerHand:t}:{deck:n([...e,...t]),playerHand:[]}}function mt({totals:e,startingCoin:t,startingStamina:n}){return{coin:Math.max(0,t-e.coin),stamina:Math.max(0,n-e.stamina)}}function ht({card:e,remaining:t}){let n=Math.max(0,e.coin-t.coin),r=Math.max(0,e.stamina-t.stamina);return{canAfford:n===0&&r===0,missingCoin:n,missingStamina:r}}function gt(e){let t=[];return e.missingCoin>0&&t.push(`thiếu ${e.missingCoin} xu`),e.missingStamina>0&&t.push(`thiếu ${e.missingStamina} thể lực`),t.length===0?`Đủ tài nguyên để đặt lá này`:`Không đủ tài nguyên: ${t.join(`, `)}`}var _t={deal:`assets/sounds/card-deal.mp3`,returnDeck:`assets/sounds/card-return-deck.mp3`,cardSelect:`assets/sounds/card-select.mp3`,cardPlace:`assets/sounds/card-place.mp3`,button:`assets/sounds/ui-click.mp3`,scanCell:`assets/sounds/scan-cell.mp3`,scanBad:`assets/sounds/scan-bad.mp3`,eventTraffic:`assets/sounds/event-traffic.mp3`,eventDistance:`assets/sounds/event-distance.mp3`,eventStorm:`assets/sounds/event-storm.mp3`,eventPromo:`assets/sounds/event-promo.mp3`},vt=null,yt=!1,bt=0,xt=0,St=0,Ct=0,wt={},Tt={},Et={};function Dt(){let e=window.AudioContext??window.webkitAudioContext;return e?(vt||=new e,vt):null}function _(e){if(!wt[e]){let t=new Audio(_t[e]);t.preload=`auto`,t.crossOrigin=`anonymous`,t.volume={deal:.78,returnDeck:.68,cardSelect:.82,cardPlace:.76,button:.6,scanCell:.62,scanBad:.72,eventTraffic:.62,eventDistance:.72,eventStorm:.7,eventPromo:.74}[e],t.playbackRate={deal:1.08,returnDeck:1,cardSelect:1.08,cardPlace:.95,button:1.05,scanCell:1.14,scanBad:.96,eventTraffic:1.06,eventDistance:1.02,eventStorm:1,eventPromo:1.08}[e],wt[e]=t}return wt[e]}function Ot(){let e=Dt();e?.state===`suspended`&&e.resume(),_(`deal`).load(),_(`returnDeck`).load(),_(`cardSelect`).load(),_(`cardPlace`).load(),_(`button`).load(),_(`scanCell`).load(),_(`scanBad`).load(),_(`eventTraffic`).load(),_(`eventDistance`).load(),_(`eventStorm`).load(),_(`eventPromo`).load(),yt=!0}function kt(e,t){var n;if(!yt)return;t?.exclusive&&((n=Tt[e])==null||n.pause(),Tt[e]=void 0,Et[e]!==void 0&&(window.clearTimeout(Et[e]),Et[e]=void 0));let r=_(e),i=r.cloneNode(!0);i.volume=t?.volume??r.volume,i.playbackRate=t?.playbackRate??r.playbackRate,i.currentTime=t?.startTime??0,t?.exclusive&&(Tt[e]=i),i.play().catch(()=>{}),t?.durationMs!==void 0&&(Et[e]=window.setTimeout(()=>{i.pause(),Tt[e]=void 0,Et[e]=void 0},t.durationMs))}function At(e,t){let n=e.createGain();return n.gain.setValueAtTime(Math.max(1e-4,t),e.currentTime),n.connect(e.destination),n}function jt(e,t,n=1){let r=e.sampleRate,i=Math.max(1,Math.floor(r*t)),a=e.createBuffer(1,i,r),o=a.getChannelData(0),s=0,c=0;for(let e=0;e<i;e+=1){let t=e/i,r=Math.min(1,t/.045),a=(1-t)**2.05,l=Math.random()*2-1;s=(s+.035*l)/1.035,Math.random()>.985?c=(Math.random()*2-1)*.65*n:c*=.82,o[e]=(l*.55+s*5.8+c*.42)*r*a}return a}function Mt(e){let t=Dt();if(!t||!yt)return;let n=e.duration??.11,r=e.startDelay??0,i=e.volume??.06,a=t.currentTime+r,o=t.createBufferSource(),s=t.createBiquadFilter(),c=t.createBiquadFilter(),l=t.createBiquadFilter(),u=At(t,i),d=t.createStereoPanner?.call(t);o.buffer=jt(t,n,e.roughness??1),o.playbackRate.setValueAtTime(e.playbackRate??1,a),s.type=`highpass`,s.frequency.setValueAtTime(e.highpass??240,a),s.Q.setValueAtTime(.55,a),l.type=`bandpass`,l.frequency.setValueAtTime(e.bandpass??1800,a),l.Q.setValueAtTime(.85,a),c.type=`lowpass`,c.frequency.setValueAtTime(e.lowpass??4200,a),c.Q.setValueAtTime(.6,a),u.gain.setValueAtTime(1e-4,a),u.gain.linearRampToValueAtTime(i,a+n*.12),u.gain.exponentialRampToValueAtTime(1e-4,a+n),o.connect(s),s.connect(l),l.connect(c),d?(d.pan.setValueAtTime(e.pan??0,a),c.connect(d),d.connect(u)):c.connect(u),o.start(a),o.stop(a+n+.02)}function Nt(e=0,t=.05){Mt({duration:.045,volume:t,startDelay:e,highpass:55,bandpass:260,lowpass:900,playbackRate:.72,roughness:.55})}function v(e){let t=performance.now();if(e===`button`){if(t-bt<35)return;bt=t,kt(`button`,{volume:.72,playbackRate:1.06,startTime:0,durationMs:260,exclusive:!0});return}if(e===`cardSelect`){if(t-xt<80)return;xt=t,kt(`cardSelect`,{volume:.84,playbackRate:1.06,startTime:.02});return}if(e===`cardPlace`){kt(`cardPlace`,{volume:.86,playbackRate:.98,startTime:.01,durationMs:420,exclusive:!0});return}if(e===`deal`){if(t-St<430)return;St=t,kt(`deal`,{volume:.82,playbackRate:1.12,startTime:.08});return}if(e===`returnDeck`){if(t-Ct<850)return;Ct=t,kt(`returnDeck`,{volume:.72,playbackRate:1.02,startTime:.02,durationMs:520,exclusive:!0});return}if(e===`scanCell`){kt(`scanCell`,{volume:.62,playbackRate:1.14,startTime:0,durationMs:260,exclusive:!0});return}if(e===`scanBad`){kt(`scanBad`,{volume:.76,playbackRate:.96,startTime:0,durationMs:420,exclusive:!0});return}if(e===`eventTraffic`){kt(`eventTraffic`,{volume:.62,playbackRate:1.06,startTime:0,durationMs:980,exclusive:!0});return}if(e===`eventDistance`){kt(`eventDistance`,{volume:.72,playbackRate:1.02,startTime:0,durationMs:650,exclusive:!0});return}if(e===`eventStorm`){kt(`eventStorm`,{volume:.7,playbackRate:1,startTime:0,durationMs:1120,exclusive:!0});return}if(e===`eventPromo`){kt(`eventPromo`,{volume:.74,playbackRate:1.08,startTime:0,durationMs:820,exclusive:!0});return}e===`reject`&&(Mt({duration:.06,volume:.055,highpass:90,bandpass:420,lowpass:1100,playbackRate:.7,roughness:.8}),Nt(.05,.045))}function Pt(){document.addEventListener(`pointerdown`,e=>{Ot();let t=e.target;if(!t)return;let n=!!t.closest(`[data-hand-card-id], [data-draft-card-id], .hand-card, .daily-draft-card`),r=t.closest(`.board-mini`);if(!n){if(r){v(`cardSelect`);return}v(`button`)}},!0)}var Ft=function(e,t,n,r){function i(e){return e instanceof n?e:new n(function(t){t(e)})}return new(n||=Promise)(function(n,a){function o(e){try{c(r.next(e))}catch(e){a(e)}}function s(e){try{c(r.throw(e))}catch(e){a(e)}}function c(e){e.done?n(e.value):i(e.value).then(o,s)}c((r=r.apply(e,t||[])).next())})},It=`travel_board_certificate_history`;function Lt(e){return e.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu,`-`).replace(/^-+|-+$/g,``).slice(0,64)||`lich-trinh`}function Rt(){let e=H(),t=Ur(),n=Kr(),r=new Date().toISOString(),i=Re.map((t,n)=>({day:t,label:`Ngày ${t}`,slots:ze.map((t,r)=>{let i=e[r]?.[n]??null;return{timeLabel:t,card:i?{id:i.id,name:i.name,city:i.city,tag:i.tag,tagLabel:i.tagLabel,vp:i.vp,coin:i.coin,stamina:i.stamina,description:i.description}:null}})}));return{version:1,createdAt:r,playerName:An(),phaseNumber:Zn,currentDay:Re[x],score:{baseVP:t.baseVP,bonusVP:t.bonusVP,totalVP:z?.finalVP??t.totalVP,accumulatedVP:Qn},resources:{spentCoin:t.spentCoin,spentStamina:t.spentStamina,remainingCoin:n.coin,remainingStamina:n.stamina,usedSlots:t.usedSlots},timeline:i}}function zt(){return`${It}:${d.roomId??`local`}:${d.playerId??`p1`}`}function Bt(){try{let e=localStorage.getItem(zt());if(!e)return[];let t=JSON.parse(e);return Array.isArray(t)?t:[]}catch{return[]}}function Vt(e){localStorage.setItem(zt(),JSON.stringify(e))}function Ht(e){if(e.length===0)return`Chưa có dữ liệu`;let t=new Map;for(let n of e){let e=n.tag||`unknown`,r=t.get(e)??{label:n.tagLabel||n.tag||`Khác`,count:0};r.count+=1,t.set(e,r)}let n=[...t.values()].sort((e,t)=>t.count-e.count);return n.length>=2&&n[0].count===n[1].count?`Kết hợp`:n[0]?.label??`Kết hợp`}function Ut(e=Zn){let t=H(),n=Re.map((e,n)=>({day:e,label:`Ngày ${e}`,slots:ze.map((e,r)=>{let i=t[r]?.[n]??null;return{timeLabel:e,card:i?{id:i.id,name:i.name,city:i.city,tag:i.tag,tagLabel:i.tagLabel,vp:i.vp,coin:i.coin,stamina:i.stamina,description:i.description}:null}})})),r=[];for(let e of n)for(let t of e.slots)t.card&&r.push(t.card);let i=n.filter(e=>e.slots.some(e=>e.card!==null)).length,a=r.length;return{phaseNumber:e,phaseScore:r.reduce((e,t)=>e+t.vp,0),completedDays:i,completedSlots:a,styleLabel:Ht(r),days:n,updatedAt:new Date().toISOString()}}function Wt(){if(!b()||!d.roomState||d.roomState.phase===`lobby`||d.roomState.phase===`draft`)return;let e=Ut(Zn);if(e.completedSlots<=0)return;let t=Bt().filter(t=>t.phaseNumber!==e.phaseNumber);t.push(e),t.sort((e,t)=>e.phaseNumber-t.phaseNumber),Vt(t)}function Gt(){Wt();let e=Bt(),t=Ut(Zn),n=e.filter(e=>e.phaseNumber!==t.phaseNumber);t.completedSlots>0&&n.push(t),n.sort((e,t)=>e.phaseNumber-t.phaseNumber);let r=[1,2,3].map(e=>n.find(t=>t.phaseNumber===e)??{phaseNumber:e,phaseScore:0,completedDays:0,completedSlots:0,styleLabel:`Chưa hoàn thành`,days:Re.map(e=>({day:e,label:`Ngày ${e}`,slots:ze.map(e=>({timeLabel:e,card:null}))})),updatedAt:new Date().toISOString()}),i=r.reduce((e,t)=>e+t.phaseScore,0),a=r.filter(e=>e.completedSlots>0).length,o=r.reduce((e,t)=>e+t.completedSlots,0),s=r.reduce((e,t)=>e+t.completedDays,0);return{version:1,exportedAt:new Date().toISOString(),playerName:An(),roomId:d.roomId??`LOCAL`,totalScore:i,completedPhaseCount:a,completedDays:s,completedSlots:o,phases:r}}function Kt(){let e=Gt(),t=JSON.stringify(e).replace(/</g,`\\u003c`);return`<!doctype html>
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
</html>`}function qt(){Yt(`${Lt(`${Gt().playerName}-chung-nhan-hanh-trinh-3-phase`)}.html`,Kt(),`text/html;charset=utf-8`)}function Jt(){let e=Rt(),t=[];t.push(`LỮ KHÁCH BÀN CỜ - LỊCH TRÌNH DU LỊCH`),t.push(`Người chơi: ${e.playerName}`),t.push(`Phase: ${e.phaseNumber}`),t.push(`Ngày xuất: ${new Date(e.createdAt).toLocaleString(`vi-VN`)}`),t.push(``),t.push(`TỔNG KẾT`),t.push(`- Điểm ngày: ${e.score.totalVP} VP`),t.push(`- Tổng phase hiện tại: ${e.score.accumulatedVP} VP`),t.push(`- Xu đã dùng: ${e.resources.spentCoin}`),t.push(`- Thể lực đã dùng: ${e.resources.spentStamina}`),t.push(`- Slot đã dùng: ${e.resources.usedSlots}/25`),t.push(``);for(let n of e.timeline)if(n.slots.some(e=>e.card!==null)){t.push(n.label.toUpperCase());for(let e of n.slots){if(!e.card){t.push(`- ${e.timeLabel}: Nghỉ / Di chuyển`);continue}t.push(`- ${e.timeLabel}: ${e.card.name} (${e.card.city||`Không rõ khu vực`})`),t.push(`  Tag: ${e.card.tagLabel||e.card.tag} • VP: ${e.card.vp} • Xu: ${e.card.coin} • Thể lực: ${e.card.stamina}`),e.card.description&&t.push(`  Ghi chú: ${e.card.description}`)}t.push(``)}return t.join(`
`)}function Yt(e,t,n){let r=new Blob([t],{type:n}),i=URL.createObjectURL(r),a=document.createElement(`a`);a.href=i,a.download=e,document.body.appendChild(a),a.click(),a.remove(),URL.revokeObjectURL(i)}function Xt(e){let t=Rt(),n=Lt(`${t.playerName}-phase-${t.phaseNumber}-lich-trinh`);if(e===`json`){Yt(`${n}.json`,JSON.stringify(t,null,2),`application/json;charset=utf-8`);return}Yt(`${n}.txt`,Jt(),`text/plain;charset=utf-8`)}function Zt(){return Ft(this,void 0,void 0,function*(){let e=Jt();try{yield navigator.clipboard.writeText(e),alert(`Đã copy lịch trình vào clipboard.`)}catch{prompt(`Copy lịch trình:`,e)}})}var Qt=function(e,t,n,r){function i(e){return e instanceof n?e:new n(function(t){t(e)})}return new(n||=Promise)(function(n,a){function o(e){try{c(r.next(e))}catch(e){a(e)}}function s(e){try{c(r.throw(e))}catch(e){a(e)}}function c(e){e.done?n(e.value):i(e.value).then(o,s)}c((r=r.apply(e,t||[])).next())})},$t=document.getElementById(`app`),en=7,tn=5,nn=[{id:`p2`,rank:3,name:`Cường`,score:180,coin:890,stamina:20,usedSlots:3},{id:`p1`,rank:1,name:`An`,score:0,coin:3,stamina:2,usedSlots:0,active:!0}],rn=[{id:`p3`,rank:3,name:`Minh`,score:190,coin:720,stamina:15,usedSlots:3},{id:`p4`,rank:3,name:`Khánh`,score:240,coin:720,stamina:15,usedSlots:3}],y={coffee:`https://images.unsplash.com/photo-1517701550927-30cf4ba1f0d5?auto=format&fit=crop&w=1000&q=80`,bridge:`https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=80`,sea:`https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80`,food:`https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1000&q=80`,market:`https://images.unsplash.com/photo-1563492065599-3520f775eeed?auto=format&fit=crop&w=1000&q=80`,night:`https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1000&q=80`,temple:`https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1000&q=80`};y.coffee,y.bridge,y.sea,y.food,y.night;function an(e){return e.image&&e.image.trim().length>0?e:Object.assign(Object.assign({},e),{image:y.food})}function on(e){for(let t of e){if(!t.image)continue;let e=new Image;e.src=t.image}}function sn(){let e=[];for(let t of E)e.push(...t.pool),e.push(...t.picked);on(e)}function cn(){return dt({cards:ke.map(Le).map(an),fallbackCards:[],handSize:5})}function ln(e){return ft(e)}function un(){let e=pt({deck:ar,playerHand:C,shuffleCards:ln});ar=e.deck,C=e.playerHand}function dn(){return`Ngày ${Re[x]}`}function fn(){return`Phase ${Zn}`}function b(){return!!(d.roomId&&d.playerId&&d.roomState)}function pn(){return d.roomState?.phase===`gameover`}function mn(){let e=d.roomState;return e?qn.map(t=>{let n=e.players[t];return{playerId:t,name:n.name,score:n.score,coin:n.coin,stamina:n.stamina,usedSlots:n.usedSlots,isConnected:n.isConnected}}).sort((e,t)=>t.score===e.score?t.coin===e.coin?t.stamina-e.stamina:t.coin-e.coin:t.score-e.score):[]}function hn(){return d.roomState?.self??null}function gn(){return hn()?.draftPool??null}function _n(){if(!b())return null;let e=gn();if(O&&!$){let t=Gs??Y;return t&&t.length>0?t:e&&e.length>0?(Y=[...e],Y):t??e}return Y&&Y.length>0?Y:e&&e.length>0?(Y=[...e],Y):Y??e}function vn(e){return(e??[]).map(e=>e.id).join(`,`)}function yn(){let e=gn();Y=e?[...e]:null,Ks=null}function bn(e=`visible-sync`){if(!b())return!1;let t=d.roomState;if(!t||t.phase!==`draft`)return!1;let n=gn();if(!n||n.length===0)return!1;let r=Y??Gs??Ks,i=!!r&&r.length>0,a=X>0&&Date.now()>X+180,o=w||Js||O||Date.now()<X;return i&&!(a&&o)&&!o?!1:(dc(),lc(),Y=[...n],Gs=null,Ks=null,Z=null,Q=null,O=!1,w=!1,tc=!1,nc=!1,X=0,D=t.self.selectedDraftCardId??null,zs=``,console.debug(`[DRAFT SYNC] recovered draft pool after tab visible: ${e}`,{poolSize:n.length,timer:t.timer,round:t.draftRound}),!0)}function xn(){document.visibilityState===`visible`&&bn(`visibility/focus`)&&J()}function Sn(){return O&&!$}function Cn(){Us=null,Ks&&=(Y=[...Ks],null),Gs=null,Z=null,Q=null,O=!1,Ki(),w=!0,D=d.roomState?.self.selectedDraftCardId??null,zs=``,J(),uc(),Us=window.setTimeout(()=>{to()},qs)}function wn(e,t){if(!($||!T)&&e.length!==0){if(O){t?.length&&(Ks=[...t]);return}dc(),Gs=[...e],t?.length&&(Ks=[...t]),D=null,Q=null,Ki(),tc=!1,nc=!0,w=!1,O=!0,Us=window.setTimeout(()=>{Cn()},Qs)}}function Tn(){return hn()?.hand??null}function En(){return hn()?.selectedDraftCardId??null}function Dn(){return En()??D}function On(){return!T||sc()||O||!Z||!b()?!1:qn.filter(e=>d.roomState?.players[e]?.isConnected).length>1}function kn(e){return!e||!d.roomState?null:d.roomState.players[e]??null}function An(){return kn(d.playerId??`p1`)?.name??`Player`}function jn(){return`${fn()} • ${dn()}`.toUpperCase()}function Mn(){let e=d.playerId;return!e||!d.roomState?null:d.roomState.players[e]??null}function Nn(){let e=d.roomState;return e?qn.map(t=>e.players[t]).filter(e=>e.isConnected):[]}function Pn(){let e=d.roomState;if(!e||e.phase!==`lobby`||d.playerId!==`p1`)return!1;let t=Nn();return t.length>0&&t.every(e=>e.isReady)}function Fn(){let e=m();return`
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
  `}function In(){let e=d.roomState,t=Mn(),n=d.playerId===`p1`,r=Pn();if(!e||e.phase!==`lobby`)return``;let i=qn.map(t=>{let n=e.players[t],r=t===d.playerId,i=n.isConnected?`is-connected`:n.hasJoined?`is-offline`:`is-empty`,a=n.isConnected?n.isReady?`READY`:`WAIT`:n.hasJoined?`OFFLINE`:`-`,o=n.isConnected||n.hasJoined?n.name:`Đang chờ...`;return`
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
  `}function Ln(e){return kn(e)?.board??null}function Rn(){return d.playerId??`p1`}function zn(e){return!e||!d.roomState?null:d.roomState.players[e]?.score??null}function Bn(){return zn(d.playerId??`p1`)}function Vn(e){let t=hn();return[...Y??[],...Ks??[],...t?.draftPool??[],...t?.pickedDraftCards??[],...t?.hand??[],...C,...Kn].find(t=>t.id===e)??null}function Hn(e){let t=Vn(e.cardId);if(t&&!e.type)return t;if(e.type===`debt`)return Object.assign(Object.assign({},oi({rowIndex:0,colIndex:0,amount:e.debtAmount??0,sourceCardName:e.sourceCardName??e.name??`Lá đã vay`,lockedReason:e.lockedReason})),{id:e.cardId});if(e.type===`lock`)return Object.assign(Object.assign({},si({rowIndex:0,colIndex:0,sourceCardName:e.sourceCardName??e.name??`Lá đã vay thể lực`})),{id:e.cardId});let n=e.name??e.cardId,r=e.tag||`food`;return{id:e.cardId,name:n,shortName:n,city:``,shortCity:``,image:e.image??y.food,rarity:`common`,rarityLabel:`★`,vp:e.vp,coin:e.coin??0,stamina:e.stamina??0,tag:r,tagLabel:r,tags:[r.toUpperCase()],icon:e.icon,description:``,bonusText:``}}function Un(e){let t=Ln(e);return t?t.map(e=>e.map(e=>e?Hn(e):null)):null}function Wn(){let e=d.roomState;if(!e)return;Zn=e.phaseNumber??Zn,x=Math.max(0,Math.min(4,e.dayIndex));let t=e.players[d.playerId??`p1`];t&&(Qn=t.score),Wt(),T=e.phase===`draft`,R=e.phase===`simulation`||e.phase===`result`||e.phase===`gameover`,V=e.phase===`result`||e.phase===`gameover`,dr=e.draftRound,or=e.timer,yr=e.timer,b()&&(wa(),qa(),kr());let n=e.self.draftPool??[],r=vn(n),i=Y!==null&&Y.length>0;if(b()){let t=e.phase===`draft`&&Bs!==`draft`,a=e.self.pickedDraftCards?.length??0,o=a>Xs,s=e.draftRound>Vs;if(t){dc(),Ki(),Z=null,Q=null,Gs=null,yn();let t=document.visibilityState!==`visible`||e.timer<89;tc=!t,nc=!1,w=!t,O=!1,ic=!1,t?(Js=!1,X=0,Us=null):Us=window.setTimeout(()=>{to()},qs)}else if(e.phase===`draft`&&Bs===`draft`&&(o||s)){if(O&&!$)n.length>0&&(Ks=[...n]),o&&!Ys&&(Z=null,Q=null);else if(!$){let e=Y??Gs??(n.length>0?[...n]:null);e?.length?wn(e,n):i||yn()}}else (e.phase===`draft`&&n.length>0&&(!Y||Y.length===0)||e.phase===`draft`&&!i)&&yn();e.phase===`planning`&&Bs===`draft`&&Y!==null&&Y.length>0&&!$&&rc===null&&(dc(),$=!0,T=!0,R=!1,O=!0,w=!1,nc=!0,tc=!1,rc=window.setTimeout(()=>{$=!1,O=!1,Y=null,Ks=null,rc=null,zs=``,no()},1550)),e.phase!==`draft`&&!$&&(dc(),Y=null,Gs=null,Ks=null,tc=!1,nc=!1,w=!1,O=!1),a>Xs&&!Ys&&!O&&(Z=null,Q=null),Xs=a,Bs=e.phase,Vs=e.draftRound,Hs=r}if(b()&&e.phase===`planning`&&Bs===`draft`&&!$&&!ic){no();return}if(e.phase===`planning`&&!$){let e=Tn();e&&(C=[...e])}if(e.phase===`draft`&&(C=[],Ys||(D=e.self.selectedDraftCardId,e.self.selectedDraftCardId&&!Z&&!sc()&&(Z=e.self.selectedDraftCardId)),!sc()&&!Ys&&(za(),Ba(),ja())),e.phase===`simulation`||e.phase===`result`){if(b()&&!Ws){fo();return}z||(z=Hr(),B=0)}else z=null,B=0,V=!1,Ws=!1,nr=!1}function Gn(e=x){return Ve(H(),e)}var Kn=cn(),qn=[`p1`,`p2`,`p3`,`p4`];function Jn(){return{p1:Be(),p2:Be(),p3:Be(),p4:Be()}}function Yn(){return{p1:new Set,p2:new Set,p3:new Set,p4:new Set}}function Xn(){if(b()){let e=Un(Rn());if(e)return e}return fr.p1}var Zn=1,x=0,Qn=0,$n={coin:0,stamina:0},S={coin:0,stamina:0},er=0,tr=!1,nr=!1,rr=null,ir=null,ar=ln(Kn),C=[],w=!1,T=!0,E=[],D=null,or=90,sr=null,O=!1,k=!1,A=!1,cr=null,lr=null,ur=null,dr=1,fr=Jn(),pr={p1:new Set,p2:new Set,p3:new Set,p4:new Set},mr=null,j=null,M=null,N=null,hr=null,gr=null,_r=null,P=null,F=null,I=null,vr=null,L=!1,R=!1,z=null,yr=15,br=null,B=0,xr=null,V=!1,Sr=!1;function H(){return Xn()}function Cr(){return qn.filter(e=>e!==`p1`)}function wr(e,t=x){for(let n=0;n<e.length;n+=1)if(e[n]?.[t]===null)return{rowIndex:n,colIndex:t};for(let t=0;t<e.length;t+=1)for(let n=0;n<e[t].length;n+=1)if(e[t][n]===null)return{rowIndex:t,colIndex:n};return null}function Tr(e,t,n){return Object.assign(Object.assign({},e),{id:`${e.id}_${t}_${x}_${n}_${Date.now()}`})}function Er(e){let t=E[{p1:1,p2:0,p3:2,p4:3}[e]]?.picked??[];return t.length>0?t:Kn}function Dr(e,t,n){let r=fr[e],i=wr(r,x);i&&(r[i.rowIndex][i.colIndex]=Tr(t,e,n))}function Or(e){let t=0,n=fr[e];for(let e=0;e<n.length;e+=1)n[e]?.[x]!==null&&(t+=1);return t}function kr(){mr!==null&&(window.clearInterval(mr),mr=null)}function Ar(){return Cr().some(e=>Or(e)<3)}function jr(){if(b()){kr();return}if(T||R||w){kr();return}let e=Cr(),t=e.filter(e=>Or(e)<3);if(t.length===0){for(let t of e)pr[t].add(x);kr();return}let n=t[Math.floor(Math.random()*t.length)],r=Er(n),i=Or(n),a=r[i%Math.max(1,r.length)]??Kn[0];if(!a){kr();return}Dr(n,a,i),G()}function Mr(){kr(),!b()&&(T||R||w||Ar()&&(mr=window.setInterval(()=>{jr()},1100)))}function Nr(e){b()||Cr().forEach((t,n)=>{Or(t)>=3||Dr(t,e,n)})}function Pr(e){let t=0;for(let n of fr[e])for(let e of n)e&&(t+=1);return t}function Fr(e,t){return hr!==null&&hr.rowIndex===e&&hr.colIndex===t}function Ir(){return Ye({placedCards:Gn(),getBoardDisplayName:ei})}function Lr(){xr!==null&&(window.clearInterval(xr),xr=null)}function Rr(){return!z||z.replaySteps.length===0?null:z.replaySteps[Math.min(B,z.replaySteps.length-1)]}function zr(e){if(!e)return!1;let t=e;return t.isBadEvent===!0||t.isNegativeEvent===!0||t.eventType===`traffic`||t.eventType===`storm`||t.eventType===`distance`}function Br(e){return e?.eventType?e.eventType===`promo`?`eventPromo`:e.eventType===`traffic`?`eventTraffic`:e.eventType===`storm`?`eventStorm`:e.eventType===`distance`?`eventDistance`:null:null}function Vr(){let e=Rr();e&&v(Br(e)??(zr(e)?`scanBad`:`scanCell`))}function Hr(){return tt({boardSlots:H(),currentDayIndex:x,dayLabel:dn(),rows:ze,getBoardDisplayName:ei,getCardTagKeys:Ue,countCardsWithTag:We,getCurrentDayPlacedCards:Gn})}function Ur(){return z?{baseVP:z.baseVP,bonusVP:z.bonusVP,totalVP:z.finalVP,spentCoin:z.spentCoin,spentStamina:z.spentStamina+co(z),usedSlots:z.usedSlots,lines:z.lines}:Ir()}function Wr(){let e=z?Ur():Ir();return{vp:Qn,coin:e.spentCoin,stamina:e.spentStamina,usedSlots:e.usedSlots}}function Gr(){let e=Wr();return nn.map(t=>{if(!t.active)return Object.assign(Object.assign({},t),{usedSlots:t.id?Pr(t.id):t.usedSlots});let n=Kr();return Object.assign(Object.assign({},t),{score:e.vp,coin:Math.max(0,n.coin),stamina:Math.max(0,n.stamina),usedSlots:e.usedSlots})})}function Kr(){if(b()){let e=Mn();if(e)return{coin:e.coin,stamina:e.stamina}}let e=mt({totals:Wr(),startingCoin:3,startingStamina:2});return{coin:e.coin+$n.coin+S.coin,stamina:e.stamina+$n.stamina+S.stamina}}function qr(e){return ht({card:e,remaining:Kr()})}function Jr(e){return gt(qr(e))}function Yr(e,t,n,r){let i=e.trim().length;return i>=r?`${t} ${t}--xs`:i>=n?`${t} ${t}--sm`:t}function Xr(e){return Yr(e,`hand-card__name`,16,23)}function Zr(e){return Yr(e,`hand-card__city`,18,28)}function Qr(e){return Yr(e,`board-mini__name`,12,18)}function $r(e){return Yr(e,`board-mini__city`,12,21)}function ei(e){return e.shortName?.trim()||e.name}function ti(e){return e.shortCity?.trim()||e.city}function ni(e){return e?.boardTokenType??null}function ri(e){return ni(e)===`debt`}function ii(e){return ni(e)===`lock`}function ai(e,t){return(H()[e]?.[t]??null)===null}function oi(e){return{id:`debt_token_${e.rowIndex}_${e.colIndex}_${Date.now()}`,name:e.lockedReason?`Nợ + Kiệt sức`:`Token Nợ`,shortName:e.lockedReason?`Nợ + Kiệt sức`:`Token Nợ`,city:`Trả ${e.amount} xu`,shortCity:`Trả ${e.amount} xu`,image:y.food,rarity:`common`,rarityLabel:`!`,vp:0,coin:0,stamina:0,tag:`utility`,tagLabel:`Nợ`,tags:[`UTILITY`],icon:`💸`,description:`Bấm để trả ${e.amount} xu. Nếu không trả trước khi hết ngày sẽ bị -20 VP.`,bonusText:`Không trả nợ: -20 VP`,boardTokenType:`debt`,debtAmount:e.amount,lockedReason:e.lockedReason,sourceCardName:e.sourceCardName}}function si(e){return{id:`exhaust_lock_${e.rowIndex}_${e.colIndex}_${Date.now()}`,name:`Bị khóa`,shortName:`Bị khóa`,city:`Kiệt sức`,shortCity:`Kiệt sức`,image:y.food,rarity:`common`,rarityLabel:`!`,vp:0,coin:0,stamina:0,tag:`utility`,tagLabel:`Khóa`,tags:[`UTILITY`],icon:`🔒`,description:`Ô này bị khóa vì đã vay thể lực ở ${e.sourceCardName}.`,bonusText:`Không thể xếp bài vào ô này.`,boardTokenType:`lock`,lockedReason:`Kiệt sức`,sourceCardName:e.sourceCardName}}function ci(e,t){return e<ze.length-1?{rowIndex:e+1,colIndex:t}:t<4?{rowIndex:0,colIndex:t+1}:null}function li(e){if(e.coinDebt>0&&(er+=e.coinDebt),e.staminaDebt<=0)return;let t=ci(e.rowIndex,e.colIndex);t&&H()[t.rowIndex]?.[t.colIndex]===null&&(H()[t.rowIndex][t.colIndex]=si({rowIndex:t.rowIndex,colIndex:t.colIndex,sourceCardName:e.card.name}))}function ui(e,t,n){let r=n.debtAmount??0,i=Kr();if(!(r<=0)){if(i.coin<r){alert(`Không đủ xu để trả nợ. Cần ${r} xu.`);return}S=Object.assign(Object.assign({},S),{coin:S.coin-r}),H()[e][t]=null,v(`eventPromo`),G()}}function di(e,t,n){if(t!==x){F=n,I={rowIndex:e,colIndex:t},G();return}if(b()){ue({rowIndex:e,colIndex:t});return}ui(e,t,n)}function fi(e,t,n){let r=ci(e,t);if(!r)return;let i=H()[r.rowIndex]?.[r.colIndex]??null;i&&i.boardTokenType===`lock`&&i.sourceCardName===n.name&&(H()[r.rowIndex][r.colIndex]=null)}function pi(e){return Yr(e,`focused-card__name`,18,25)}function mi(e){return Yr(e,`focused-card__city`,18,28)}function hi(e){if(!e)return null;if(b()){let t=gn()?.find(t=>t.id===e)??null;if(t)return t;let n=Tn()?.find(t=>t.id===e)??null;if(n)return n}if(T){let t=U()?.pool.find(t=>t.id===e)??null;if(t)return t}return C.find(t=>t.id===e)??null}function gi(e,t){return He(H(),e,t)}function _i(e){let t=Gn(),n=Ue(e);return n.includes(`FOOD`)&&We(t,`FOOD`)>=2||n.includes(`CULTURE`)&&We(t,`CULTURE`)>=2||n.includes(`ACTION`)&&We(t,`ACTION`)>=2?!0:e.onPlayEffect?.has_effect===!0&&e.onPlayEffect.effect_type===`GAIN_VP`}function vi(e){return e.replace(/<[^>]*>/g,` `).replace(/\s+/g,` `).trim()}function yi(e){let t=e.onPlayEffect,n=Ue(e).includes(`UTILITY`)||String(e.tag||``).toLowerCase()===`utility`||vi(e.tagLabel||``).toLowerCase().includes(`tiện ích`),r=vi([e.name,e.shortName||``,e.description||``,e.bonusText||``,e.tagLabel||``].join(` `)).toLowerCase(),i=Number(t?.effect_value??0),a=r.match(/(?:\+|nhận|hoi|hồi|cộng|thêm)\s*(\d+)/i),o=a?Number(a[1]):1,s=i>0?i:o;if(t?.has_effect){if(t.effect_type===`RECOVER_XU`)return{type:`coin`,value:s,label:`+${s} Xu`,icon:`🪙`};if(t.effect_type===`RECOVER_LA`)return{type:`stamina`,value:s,label:`+${s} Thể lực`,icon:`⚡`};if(t.effect_type===`GAIN_VP`)return{type:`vp`,value:s,label:`+${s} VP`,icon:`★`}}return n?r.includes(`xu`)||r.includes(`tiền`)||r.includes(`coin`)||r.includes(`gold`)?{type:`coin`,value:s,label:`+${s} Xu`,icon:`🪙`}:r.includes(`thể lực`)||r.includes(`the luc`)||r.includes(`năng lượng`)||r.includes(`nang luong`)||r.includes(`stamina`)||r.includes(`nl`)?{type:`stamina`,value:s,label:`+${s} Thể lực`,icon:`⚡`}:(r.includes(`vp`)||r.includes(`điểm`)||r.includes(`diem`),{type:`vp`,value:s,label:`+${s} VP`,icon:`★`}):null}function bi(e){let t=Date.now();gr=Object.assign(Object.assign({},e),{id:t}),_r=e.type,window.setTimeout(()=>{gr?.id===t&&(gr=null),_r===e.type&&(_r=null),G()},1050)}function xi(e,t,n){let r=yi(e);return r?(r.type===`coin`?(S=Object.assign(Object.assign({},S),{coin:S.coin+r.value}),v(`eventPromo`)):r.type===`stamina`?(S=Object.assign(Object.assign({},S),{stamina:S.stamina+r.value}),v(`eventPromo`)):r.type===`vp`&&(Qn+=r.value,v(`eventPromo`)),bi({rowIndex:t,colIndex:n,type:r.type,value:r.value}),!0):!1}function Si(e,t){if(!gr||gr.rowIndex!==e||gr.colIndex!==t)return``;let{type:n,value:r}=gr;return`
    <div class="utility-effect-pop utility-effect-pop--${n}" aria-hidden="true">
      <div class="utility-effect-pop__burst"></div>
      <div class="utility-effect-pop__icon">${n===`coin`?`🪙`:n===`stamina`?`⚡`:`★`}</div>
      <div class="utility-effect-pop__label">${n===`coin`?`+${r} Xu`:n===`stamina`?`+${r} Thể lực`:`+${r} VP`}</div>
      <div class="utility-effect-pop__spark utility-effect-pop__spark--1"></div>
      <div class="utility-effect-pop__spark utility-effect-pop__spark--2"></div>
      <div class="utility-effect-pop__spark utility-effect-pop__spark--3"></div>
    </div>
  `}function Ci(e,t){let n=ei(e),r=ti(e),i=Qr(n);$r(r);let a=_i(e),o=e;if(o.boardTokenType===`debt`)return`
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
        style="background-image: url('${e.image}'), url('${y.food}')"
      ></div>

      <div class="board-mini__tag board-mini__tag--${e.tag}">
        ${e.tagLabel}
      </div>

      <div class="board-mini__info">
        <h3 class="${i}">${n}</h3>
        <div class="board-mini__vp">★ ${e.vp}</div>
      </div>
    </article>
  `}function wi(e,t,n=!1){let r=T&&!n&&e.id===Z,i=!T&&e.id===j,a=r||i,o=qr(e).canAfford?Jr(e):`Thiếu tài nguyên: đặt lá này sẽ tạo nợ / kiệt sức.`;return`
    <article
      class="hand-card hand-card--${e.rarity} ${n?``:`hand-card--fan-${t+1}`} ${i?`hand-card--selected`:``} ${r?`hand-card--draft-selected`:``} "
      data-hand-card-id="${e.id}"
      style="${a?`box-shadow: 0 0 0 4px rgba(255,255,255,.95), 0 0 0 8px rgba(139,92,246,.82), 0 18px 34px rgba(75,47,25,.28);`:``}"
      title="${o}"
      onpointerdown="${T?``:`event.stopPropagation(); startHandPointerDrag(event, '${e.id}')`}"
      onclick="${T?``:`event.stopPropagation(); window['selectHandCard']('${e.id}')`}"
    >
      ${i?`<button
              class="hand-card__close"
              onclick="event.stopPropagation(); clearSelectedHandCard()"
              title="Hủy chọn"
            >×</button>`:``}

      <div class="hand-card__header">
        <div class="hand-card__title-block">
          <h3 class="${Xr(e.name)}">${e.name}</h3>
          <div class="${Zr(e.city)}">📍 ${e.city}</div>
        </div>

        <div class="hand-card__vp">${e.vp}</div>
      </div>

      <div class="hand-card__image" style="background-image: url('${e.image}'), url('${y.food}')">
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
  `}function Ti(e){let t=pi(e.name),n=mi(e.city);return`
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

        <div class="focused-card__image" style="background-image: url('${e.image}'), url('${y.food}')">
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

        ${I?`
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
  `}function Ei(){let e=U()?.pool??[],t=Ea();return`
    <div class="draft-hand-meta">
      <div class="draft-hand-meta__info">
        <span>Vòng ${dr}/5</span>
        <strong>${t?ei(t):`Bấm 1 lá để chọn`}</strong>
        <em>
          ${w?`Đang phát bài vào tay...`:O?`Đang chuyền bài còn lại vào lượt kế tiếp...`:t?`Đã chọn. Hết giờ mới chuyền bài.`:e.length>0?`Bấm để chọn, giữ 0.5s để xem lớn.`:`Đang chuẩn bị bài...`}
        </em>
      </div>

      <div class="draft-hand-meta__wait">
        <span>Chờ hết giờ</span>
      </div>
    </div>
  `}function Di(){return b()?hn()?.pickedDraftCards?.length??0:U()?.picked?.length??0}function Oi(){return b()?hn()?.pickedDraftCards??[]:U()?.picked??[]}function ki(e){return(b()?_n()??[]:U()?.pool??[]).find(t=>t.id===e)??null}function Ai(){let e=Oi(),t=Z;if(!t||e.some(e=>e.id===t))return e;let n=ki(t);return n?[...e,n]:e}function ji(){return Ai().length}var Mi={1:[{rotate:0,ty:-6}],2:[{rotate:-16,ty:-4},{rotate:16,ty:-4}],3:[{rotate:-18,ty:-5},{rotate:0,ty:-10},{rotate:18,ty:-5}],4:[{rotate:-20,ty:-3},{rotate:-8,ty:-8},{rotate:8,ty:-8},{rotate:20,ty:-3}],5:[{rotate:-18,ty:-2},{rotate:-9,ty:-7},{rotate:0,ty:-11},{rotate:9,ty:-7},{rotate:18,ty:-2}]};function Ni(){let e=document.documentElement,t=parseFloat(getComputedStyle(e).getPropertyValue(`--hand-card-w`))||158,n=parseFloat(getComputedStyle(e).getPropertyValue(`--hand-card-h`))||218;return{handCardW:t,handCardH:n,cardW:t*.84,cardH:n*.84,stepX:t*.46}}function Pi(e,t){return Mi[e]?.[t-1]??{rotate:0,ty:0}}function Fi(e,t){let n=document.querySelector(`.player-hand__cards--draft`);if(!n||e<1||t<1||t>e)return null;let r=Pi(e,t),{cardW:i,cardH:a,stepX:o}=Ni(),s=n.getBoundingClientRect(),c=i+(e-1)*o,l=s.left+(s.width-c)/2+(t-1)*o,u=s.bottom-a-4+r.ty;return new DOMRect(l,u,i,a)}function Ii(e){let t=e.className.match(/hand-card--picked-slot-(\d)/),n=e.closest(`[class*='picked-count-']`)?.className.match(/picked-count-(\d)/);return!t||!n?null:{count:parseInt(n[1],10),slotIndex:parseInt(t[1],10)}}function Li(){let e=ji(),t=e,n=Fi(e,t);return n?{rect:n,rotate:Pi(e,t).rotate}:null}function Ri(e){let t=Ii(e);if(!t)return null;let n=Fi(t.count,t.slotIndex);return n?{rect:n,rotate:Pi(t.count,t.slotIndex).rotate}:null}function zi(e){return document.querySelector(`.draft-center-card[data-draft-card-id="${e}"]`)?.closest(`.draft-center-card-wrapper`)??null}function Bi(e){var t;Z=null,D===e&&(D=null),(t=zi(e))==null||t.classList.remove(`draft-center-card-wrapper--flown-to-hand`),Ba(),za(),Gi()}function Vi(e,t,n){let r=n?.isPending?` hand-card--picked-pending`:``,i=n?.hiddenForMeasure?` hand-card--picked-pending-hidden`:``;return`
    <article
      class="hand-card hand-card--${e.rarity} hand-card--picked-draft hand-card--picked-slot-${t+1}${r}${i}"
      data-draft-hand-card-id="${e.id}"
    >
      <div class="hand-card__header">
        <div class="hand-card__title-block">
          <h3 class="${Xr(e.name)}">${e.name}</h3>
          <div class="${Zr(e.city)}">📍 ${e.city}</div>
        </div>

        <div class="hand-card__vp">${e.vp}</div>
      </div>

      <div class="hand-card__image" style="background-image: url('${e.image}'), url('${y.food}')">
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
  `}function Hi(e){let t=new Set(Oi().map(e=>e.id));return Ai().map((n,r)=>Vi(n,r,{isPending:n.id===Z&&!t.has(n.id),hiddenForMeasure:e?.hiddenPendingMeasure&&n.id===Z})).join(``)}function Ui(){return!T||$?!1:Sn()&&(Gs??Y)?.length||O&&ur?.length?!0:!(Di()>=tn)}function Wi(){return b()?Sn()?Gs??Y??[]:_n()??[]:O&&ur?ur:U()?.pool??[]}function Gi(){let e=document.querySelector(`.deck-pile-panel__draft-confirm`);e&&(e.disabled=!((Z||D)&&!Ys&&!O&&!sc()&&!A))}function Ki(){lr!==null&&(window.clearTimeout(lr),lr=null),k=!1,A=!1,cr=null}function qi(){return A||Ys||O||$}function Ji(){if(!T||!Ui()||O||$)return``;let e=k?`Mở pool`:`Thu gọn`;return`
    <button
      type="button"
      class="deck-pile-panel__pool-toggle"
      onclick="event.stopPropagation(); toggleDraftPoolCollapse()"
      ${qi()?`disabled`:``}
      title="${k?`Hiện lại pool chọn bài`:`Thu gọn pool để xem bàn cờ`}"
    >
      ${e}
    </button>
  `}function Yi(){let e=document.querySelector(`.deck-pile-panel__pool-toggle`);e&&(e.textContent=k?`Mở pool`:`Thu gọn`,e.disabled=qi(),e.title=k?`Hiện lại pool chọn bài`:`Thu gọn pool để xem bàn cờ`)}function Xi(){return document.querySelector(`.draft-center-overlay:not(.draft-center-overlay--returning)`)}function Zi(e){var t;let n=Xi(),r=document.querySelector(`.deck-card-stack`);if(!n||!r)return!1;let i=Array.from(n.querySelectorAll(`.draft-center-card-wrapper:not(.draft-center-card-wrapper--flown-to-hand)`));if(i.length===0)return!1;n.classList.remove(`draft-center-overlay--collapsed`,`draft-center-overlay--collapsing`,`draft-center-overlay--expanding`,`pass-active`);let a=n.getBoundingClientRect(),o=r.getBoundingClientRect();return Za(i,a.left+a.width*.5,a.top+a.height*.38,o.left+o.width*.34,o.top+o.height*.54),(t=r.closest(`.deck-pile-panel`))==null||t.classList.add(`deck-receiving`),n.classList.add(e===`collapse`?`draft-center-overlay--collapsing`:`draft-center-overlay--expanding`,`pass-active`),!0}function Qi(){var e;lr=null,A=!1,cr=null,k=!0;let t=Xi();t?.classList.remove(`draft-center-overlay--collapsing`,`pass-active`),t?.classList.add(`draft-center-overlay--collapsed`),(e=document.querySelector(`.deck-pile-panel`))==null||e.classList.remove(`deck-receiving`),Yi(),Gi()}function $i(){var e;lr=null,A=!1,cr=null,k=!1,Xi()?.classList.remove(`draft-center-overlay--expanding`,`draft-center-overlay--collapsed`,`pass-active`),(e=document.querySelector(`.deck-pile-panel`))==null||e.classList.remove(`deck-receiving`),Yi(),Gi()}function ea(){qi()||k||(A=!0,cr=`collapse`,Yi(),Gi(),v(`returnDeck`),window.requestAnimationFrame(()=>{window.requestAnimationFrame(()=>{Zi(`collapse`)||Qi()})}),lr=window.setTimeout(()=>{Qi()},$s))}function ta(){qi()||!k||(k=!1,A=!0,cr=`expand`,Xi()?.classList.remove(`draft-center-overlay--collapsed`),Yi(),Gi(),v(`cardSelect`),window.requestAnimationFrame(()=>{window.requestAnimationFrame(()=>{Zi(`expand`)||$i()})}),lr=window.setTimeout(()=>{$i()},$s))}function na(){!T||!Ui()||qi()||(k?ta():ea())}function ra(){return $&&O}function ia(){let e=_n()??[],t=new Set((hn()?.pickedDraftCards??[]).map(e=>e.id));return e.filter(e=>!t.has(e.id))}function aa(){let e=d.roomState?.draftTimerHold??0;if(b()){let t=gn(),n=X>0&&Date.now()>X+180;if(t?.length&&n)return e>0}return Js||w||O||e>0||Date.now()<X}function oa(){return aa()?`Chia bài`:`${or}s`}function sa(){let e=document.querySelector(`.player-hand__meta`);!e||!T||(e.textContent=aa()?`Đang chia bài...`:`Còn ${oa()} • ${O?`Đang chuyền bài...`:`bấm 1 lá để chọn`}`,e.classList.toggle(`player-hand__meta--danger`,ca()))}function ca(){return!aa()&&or<=3}function la(){if(!T||!Ui())return``;let e=Wi();if(e.length===0)return`
      <div class="draft-center-overlay">
        <p style="color:#fff5d1; font-size:1.2rem;">Đang chuẩn bị bài...</p>
      </div>
    `;let t=e.slice(0,4),n=e.slice(4),r=(e,t)=>e.map((e,n)=>{let r=t+n,i=t+n+1,a=Pa(e.id),o=O||k||A?``:`
          <button class="draft-center-btn" data-draft-card-id="${e.id}">
            CHỌN
          </button>
        `;return`
        <div class="draft-center-card-wrapper draft-center-card-wrapper--slot-${i} ${a?`draft-center-card-wrapper--flown-to-hand`:``}">
          <div class="draft-center-card" data-draft-card-id="${e.id}">
            ${wi(e,r,!0)}
          </div>
          ${o}
        </div>
      `}).join(``);return`
    <div class="draft-center-overlay ${[O&&!$?`draft-center-overlay--passing`:``,k&&!A?`draft-center-overlay--collapsed`:``,cr===`collapse`?`draft-center-overlay--collapsing`:``,cr===`expand`?`draft-center-overlay--expanding`:``].filter(Boolean).join(` `)}">
      <div class="draft-center-container">
        <div class="draft-center-row" style="display: flex; flex-direction: row; gap: 12px; justify-content: center;">${r(t,0)}</div>
        <div class="draft-center-row" style="display: flex; flex-direction: row; gap: 12px; justify-content: center;">${r(n,4)}</div>
      </div>
      ${On()?`<div class="draft-center-wait-banner">Đang chờ đối thủ...</div>`:``}
    </div>
  `}function ua(){return ra()?`
    <div class="draft-center-overlay draft-center-overlay--returning">
      <div class="draft-center-container draft-center-container--return">
        ${ia().map((e,t)=>`
        <div class="draft-center-card-wrapper draft-center-card-wrapper--return draft-center-card-wrapper--return-${t+1}">
          <div class="draft-center-card">
            ${wi(e,t,!0)}
          </div>
        </div>
      `).join(``)}
      </div>
    </div>
  `:``}function da(e){return(E[{p1:1,p2:0,p3:2,p4:3}[e]]?.picked??[]).map(e=>e.icon)}function fa(e){return!!(e&&e!==`p1`&&T)}function pa(e){let t=Ln(e);if(!t)return Array.from({length:25}).map(()=>`<div class="opponent-cell">+</div>`).join(``);let n=[];for(let e of t)for(let t of e){if(!t){n.push(`<div class="opponent-cell">+</div>`);continue}n.push(`
        <div
          class="opponent-cell opponent-cell--filled opponent-cell--${t.tag}"
          title="${t.cardId} • ${t.tag} • ${t.vp} VP"
        >
          ${t.icon}
        </div>
      `)}return n.join(``)}function ma(e){if(!e)return Array.from({length:25}).map(()=>`<div class="opponent-cell">+</div>`).join(``);if(d.roomState)return pa(e);let t=fr[e],n=fa(e)?da(e):[],r=[],i=0;for(let e of t)for(let t of e){let e=n[i]??``;if(!t){r.push(`
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
      `),i+=1}return r.join(``)}function ha(e){let t=kn(e.id),n=t?Object.assign(Object.assign({},e),{name:t.name,score:t.score,coin:t.coin,stamina:t.stamina,usedSlots:t.usedSlots}):e,r=t?.isConnected===!1?` side-player--offline`:``;return`
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
        ${ma(n.id)}
      </div>
    </section>
  `}function U(){return Ke(E,Ge())}function ga(){return!b()}function _a(e){let t=String(e.id??e.card_id??``).toUpperCase();if(t.includes(`_CULT_`)||t.startsWith(`SG_CULT`))return`CULTURE`;if(t.includes(`_ACT_`)||t.startsWith(`SG_ACT`))return`ACTION`;if(t.includes(`_UTIL_`)||t.startsWith(`SG_UTIL`))return`UTILITY`;if(t.includes(`_FOOD_`)||t.startsWith(`SG_FOOD`))return`FOOD`;let n=(e.tags??[]).map(e=>String(e).toUpperCase());if(n.includes(`CULTURE`))return`CULTURE`;if(n.includes(`ACTION`))return`ACTION`;if(n.includes(`UTILITY`))return`UTILITY`;if(n.includes(`FOOD`))return`FOOD`;let r=String(e.tag??``).toUpperCase();return r===`CULTURE`?`CULTURE`:r===`ACTION`?`ACTION`:r===`UTILITY`?`UTILITY`:r===`FOOD`?`FOOD`:`UNKNOWN`}function va(e){let t=[...e];for(let e=t.length-1;e>0;--e){let n=Math.floor(Math.random()*(e+1)),r=t[e];t[e]=t[n],t[n]=r}return t}function ya(e){return e.reduce((e,t)=>{let n=_a(t);return e[n]=(e[n]??0)+1,e},{})}function ba(e,t,n,r,i){if(n.length>=i)return;let a=e.get(t);if(!a||a.length===0)return;let o=a.shift();!o||r.has(o.id)||(n.push(o),r.add(o.id))}function xa(e){let t=[`FOOD`,`CULTURE`,`ACTION`,`UTILITY`,`FOOD`,`CULTURE`,`ACTION`];if(e<=t.length)return va(t.slice(0,e));let n=[...t],r=[`FOOD`,`CULTURE`,`ACTION`,`UTILITY`];for(;n.length<e;)n.push(r[n.length%r.length]);return va(n)}function Sa(e){if(e<=0||ar.length===0)return[];let t=ln(ar),n=new Map;for(let e of t){let t=_a(e),r=n.get(t)??[];r.push(e),n.set(t,r)}for(let[e,t]of n.entries())n.set(e,va(t));let r=[],i=new Set,a=xa(e);for(let t of a)ba(n,t,r,i,e);let o=va([`CULTURE`,`ACTION`,`UTILITY`,`FOOD`,`UNKNOWN`]);for(;r.length<e;){let t=!1;for(let a of o){let o=r.length;if(ba(n,a,r,i,e),r.length>o&&(t=!0),r.length>=e)break}if(!t)break}return ar=t.filter(e=>!i.has(e.id)),console.log(`[Draft] deck tag counts before draw:`,ya(t)),console.log(`[Draft] single-player pool:`,r.map(e=>`${e.id}:${_a(e)}`)),console.log(`[Draft] single-player pool tag counts:`,ya(r)),r}function Ca(){if(!ga())return;let e=Ge(),t=U();if(!t)return;t.pool.length>0&&(ar=ln([...ar,...t.pool]));let n=Sa(Math.max(en-t.picked.length,en-tn+1));E=E.map((t,r)=>r===e?Object.assign(Object.assign({},t),{pool:n}):t)}function wa(){sr!==null&&(window.clearInterval(sr),sr=null)}function Ta(){wa(),!b()&&(!T||O||(sr=window.setInterval(()=>{if(--or,or<=0){or=0,Aa();return}if(A){sa();return}G()},1e3)))}function Ea(){if(b()){let e=_n(),t=Dn();return!e||!t?null:e.find(e=>e.id===t)??null}let e=U();return!e||!D?null:e.pool.find(e=>e.id===D)??null}function Da(){E=Je(E)}function Oa(){wa(),Xa();let e=U(),t=E.reduce((e,t)=>(e.push(...t.pool),e),[]);t.length>0&&(ar=ln([...ar,...t])),C=e?e.picked.slice(0,tn):[],T=!1,O=!1,D=null,or=0,w=!0,G(),ao()}function ka(e){if(!T||O)return;let t=Ge(),n=[];if(ga()){let r=U();if(!r||r.pool.length===0){Oa();return}let i=r.pool.find(t=>t.id===e)??qe(r.pool);if(!i){Oa();return}n.push({playerIndex:t,pickedCard:i}),ur=[...r.pool],E=E.map((e,n)=>n===t?Object.assign(Object.assign({},e),{picked:[...e.picked,i],pool:e.pool.filter(e=>e.id!==i.id)}):e),D=null,Z=null,Q=null,O=!0,wa(),G(),Qa(),window.setTimeout(()=>{ur=null;let e=U();if(!e||e.picked.length>=tn){O=!1,Oa();return}Ca(),sn(),dr+=1,or=90,O=!1,ro()},Qs);return}let r=U();ur=r?[...r.pool]:null,E=E.map((r,i)=>{if(r.pool.length===0)return r;let a=i===t?r.pool.find(t=>t.id===e)??qe(r.pool):qe(r.pool);return a?(n.push({playerIndex:i,pickedCard:a}),Object.assign(Object.assign({},r),{picked:[...r.picked,a],pool:r.pool.filter(e=>e.id!==a.id)})):r}),D=null,Z=null,Q=null,O=!0,wa(),G(),Qa(),window.setTimeout(()=>{ur=null;let e=U();if(!e||e.picked.length>=tn){O=!1,Oa();return}Da(),sn(),dr+=1,or=90,O=!1,ro()},Qs)}function Aa(){let e=U();if(!e||e.picked.length>=tn){Oa();return}ka(D??null)}function ja(){Ba();let e=Ea(),t=document.querySelector(`.draft-hand-meta__info strong`);t&&(t.textContent=e?ei(e):`Bấm 1 lá để chọn`);let n=document.querySelector(`.draft-hand-meta__info em`);n&&(n.textContent=e?`Đã chọn. Bấm lại lá đó để hủy chọn.`:`Bấm để chọn, giữ 0.5s để xem lớn.`);let r=document.querySelector(`.draft-center-wait-banner`);r&&(r.style.display=On()?``:`none`),Gi()}function Ma(){let e=document.querySelector(`.draft-pick-fly-layer`);return e||(e=document.createElement(`div`),e.className=`draft-pick-fly-layer`,document.body.appendChild(e)),e}function Na(e){return Math.max(.85,Math.min(1.2,e))}function Pa(e){return sc()?e===Z||e===Q:e===Z||e===Q?!0:O||$?Oi().some(t=>t.id===e):!1}function Fa(e,t,n,r,i){let a=Ma(),{cardW:o,cardH:s}=Ni(),c=i?.flyWidth??o,l=i?.flyHeight??s,u=e.left+e.width/2,d=e.top+e.height/2,f=t.left+t.width/2,p=t.top+t.height/2,m=i?.scaleStart??1,ee=i?.rotateStart??0,h=i?.rotateEnd??0,g=document.createElement(`div`);return g.className=`draft-pick-fly-card`,i?.direction===`to-pool`&&g.classList.add(`draft-pick-fly-card--to-pool`),g.style.left=`${u-c/2}px`,g.style.top=`${d-l/2}px`,g.style.width=`${c}px`,g.style.height=`${l}px`,g.style.setProperty(`--fly-dx`,`${f-u}px`),g.style.setProperty(`--fly-dy`,`${p-d}px`),g.style.setProperty(`--fly-scale-start`,String(m)),g.style.setProperty(`--fly-scale-end`,String(r)),g.style.setProperty(`--fly-rotate-start`,`${ee}deg`),g.style.setProperty(`--fly-rotate-end`,`${h}deg`),g.innerHTML=n,a.appendChild(g),g.offsetHeight,g.classList.add(`draft-pick-fly-card--animating`),new Promise(e=>{let t=!1,n=()=>{t||(t=!0,g.remove(),a.childElementCount===0&&a.remove(),e())};g.addEventListener(`animationend`,n,{once:!0}),window.setTimeout(n,Zs+100)})}function Ia(e){return Qt(this,void 0,void 0,function*(){if(!ki(e)){Bi(e);return}let t=zi(e),n=t?.querySelector(`.hand-card`),r=n?.getBoundingClientRect(),i=n?.outerHTML;if(!r||!i||!n||!t||r.width<=0||r.height<=0){Bi(e);return}Z=e,t.classList.add(`draft-center-card-wrapper--flown-to-hand`),Ba(),za({hiddenPendingMeasure:!0}),yield new Promise(e=>{window.requestAnimationFrame(()=>window.requestAnimationFrame(()=>e()))});let a=Li();if(!a){Bi(e);return}let o=Na(r.width/Ni().cardW);yield Fa(r,a.rect,i,ec,{direction:`to-hand`,scaleStart:o,rotateStart:0,rotateEnd:a.rotate,flyWidth:Ni().cardW,flyHeight:Ni().cardH}),za()})}function La(e){return Qt(this,void 0,void 0,function*(){let t=document.querySelector(`[data-draft-hand-card-id="${e}"]`),n=t?.outerHTML,r=t?Ri(t):null,i=r?.rect??t?.getBoundingClientRect();if(!i||!n||!t||i.width<=0||i.height<=0)return;t.classList.add(`hand-card--picked-pending-hidden`),Q=e,Ba();let a=zi(e),o=(a?.querySelector(`.hand-card`))?.getBoundingClientRect()??a?.getBoundingClientRect();if(!o){Z=null,Q=null,za(),Ba();return}let{cardW:s,cardH:c}=Ni(),l=Na(o.width/s);try{yield Fa(i,o,n,l,{direction:`to-pool`,scaleStart:ec,rotateStart:r?.rotate??0,rotateEnd:0,flyWidth:s,flyHeight:c})}finally{Z=null,Q=null,za(),Ba()}})}function Ra(e,t){return Qt(this,void 0,void 0,function*(){let n=document.querySelector(`[data-draft-hand-card-id="${e}"]`),r=n?Ri(n):null,i=r?.rect??n?.getBoundingClientRect(),a=n?.outerHTML,o=zi(t)?.querySelector(`.hand-card`),s=o?.getBoundingClientRect(),c=o?.outerHTML,l=zi(e)?.querySelector(`.hand-card`),u=l?.getBoundingClientRect(),d=l?.outerHTML;if(!i||!a||!s||!c||!u||!d||!n||i.width<=0||s.width<=0||u.width<=0)return;n.classList.add(`hand-card--picked-pending-hidden`),Z=t,Q=e,Ba(),za({hiddenPendingMeasure:!0}),yield new Promise(e=>{window.requestAnimationFrame(()=>window.requestAnimationFrame(()=>e()))});let f=Li();if(!f){n.classList.remove(`hand-card--picked-pending-hidden`),Z=e,Q=null,Ba(),za();return}let{cardW:p,cardH:m}=Ni(),ee=Na(u.width/p),h=Na(s.width/p);try{yield Promise.all([Fa(i,u,a,ee,{direction:`to-pool`,scaleStart:ec,rotateStart:r?.rotate??0,rotateEnd:0,flyWidth:p,flyHeight:m}),Fa(s,f.rect,c,ec,{scaleStart:h,rotateStart:0,rotateEnd:f.rotate,flyWidth:p,flyHeight:m})])}finally{Q=null,za(),Ba()}})}function za(e){let t=document.querySelector(`.player-hand__cards--draft`);t&&(t.className=`player-hand__cards player-hand__cards--draft player-hand__cards--picked player-hand__cards--picked-count-${ji()}`,t.innerHTML=Hi(e))}function Ba(){document.querySelectorAll(`.draft-center-card-wrapper`).forEach(e=>{let t=e.querySelector(`.draft-center-card[data-draft-card-id]`),n=t?.dataset.draftCardId;if(!n)return;e.classList.remove(`draft-center-card-wrapper--selected`),e.classList.toggle(`draft-center-card-wrapper--flown-to-hand`,Pa(n)),t.style.removeProperty(`z-index`),t.style.removeProperty(`isolation`);let r=t.querySelector(`.hand-card`);r?.classList.remove(`hand-card--draft-selected`),r?.style.removeProperty(`z-index`),r?.style.removeProperty(`position`);let i=e.querySelector(`.draft-center-btn`);i&&(i.textContent=`CHỌN`,i.classList.remove(`daily-draft-card--selected`),i.style.removeProperty(`z-index`),i.style.removeProperty(`isolation`))})}function Va(e,t,n){return Qt(this,void 0,void 0,function*(){Ys=!0;let r=!1;try{t?e?e!==t&&(yield Ra(e,t),r=Z===t):(yield Ia(t),r=Z===t):e&&(yield La(e),r=!0),r&&za(),ja(),b()&&oe(n)}finally{Ys=!1,Gi(),Yi()}})}function Ha(e){if(!T||Ys||O||sc()||k||A||L&&(L=!1,P||F||I))return;let t=Z,n=D===e?null:e;v(`cardSelect`),D=n,P=null,F=null,I=null,n&&!t&&(Z=n,Ba(),za({hiddenPendingMeasure:!0}),Gi()),Va(t,n,e)}function Ua(){if(!T||Ys||O||!(Z||D))return;let e=D??Z;if(e){if(b()){let e=Gs??Y??gn();e?.length&&!O&&!$&&(wn(e,null),J(),nc=!1,Qa()),se();return}ka(e)}}function Wa(e){if(!(T||R||w)){if(L){L=!1;return}v(`cardSelect`),j=j===e?null:e,M=null,P=null,F=null,I=null,J()}}function Ga(){T||(j=null,M=null,P=null,F=null,I=null,G())}function Ka(e){let t=Math.max(0,e),n=Math.floor(t/60),r=t%60;return`${n}:${r<10?`0${r}`:`${r}`}`}function qa(){br!==null&&(window.clearInterval(br),br=null)}function Ja(){qa(),!b()&&(R||T||(br=window.setInterval(()=>{if(--yr,yr<=0){yr=0,qa(),uo();return}G()},1e3)))}function Ya(){rr!==null&&(window.clearTimeout(rr),rr=null)}function Xa(){ir!==null&&(window.clearTimeout(ir),ir=null)}function Za(e,t,n,r,i){e.forEach((a,o)=>{let s=a.getBoundingClientRect(),c=s.left+s.width*.5,l=s.top+s.height*.5,u=o-(e.length-1)/2,d=t-c+u*5,f=n-l+Math.abs(u)*3,p=r-c+u*2,m=i-l+u*2,ee=d+(p-d)*.34,h=Math.min(f,m)-150-Math.abs(u)*7,g=d+(p-d)*.72,te=Math.min(f,m)-185-Math.abs(u)*5;a.style.setProperty(`--gather-x`,`${d}px`),a.style.setProperty(`--gather-y`,`${f}px`),a.style.setProperty(`--gather-r`,`${u*4}deg`),a.style.setProperty(`--arc1-x`,`${ee}px`),a.style.setProperty(`--arc1-y`,`${h}px`),a.style.setProperty(`--arc2-x`,`${g}px`),a.style.setProperty(`--arc2-y`,`${te}px`),a.style.setProperty(`--deck-in-x`,`${p}px`),a.style.setProperty(`--deck-in-y`,`${m}px`),a.style.setProperty(`--deck-r`,`${-6+u*3}deg`)})}function Qa(){v(`returnDeck`),window.requestAnimationFrame(()=>{window.requestAnimationFrame(()=>{var e;let t=document.querySelector(`.draft-center-overlay--passing:not(.draft-center-overlay--returning)`)??document.querySelector(`.draft-center-overlay:not(.draft-center-overlay--returning)`),n=document.querySelector(`.deck-card-stack`);if(!t||!n)return;let r=Array.from(t.querySelectorAll(`.draft-center-card-wrapper:not(.draft-center-card-wrapper--flown-to-hand)`));if(r.length===0)return;t.classList.add(`draft-center-overlay--passing`);let i=t.getBoundingClientRect(),a=n.getBoundingClientRect();Za(r,i.left+i.width*.5,i.top+i.height*.38,a.left+a.width*.34,a.top+a.height*.54),(e=n.closest(`.deck-pile-panel`))==null||e.classList.add(`deck-receiving`),t.classList.add(`pass-active`)})})}function $a(){v(`returnDeck`),window.requestAnimationFrame(()=>{window.requestAnimationFrame(()=>{var e;let t=document.querySelector(`.draft-center-overlay--returning`),n=document.querySelector(`.deck-card-stack`);if(!t||!n)return;let r=Array.from(t.querySelectorAll(`.draft-center-card-wrapper--return`)),i=t.getBoundingClientRect(),a=n.getBoundingClientRect();Za(r,i.left+i.width*.5,i.top+i.height*.38,a.left+a.width*.34,a.top+a.height*.54),(e=n.closest(`.deck-pile-panel`))==null||e.classList.add(`deck-receiving`),t.classList.add(`pass-active`)})})}function eo(){w=!1,ir=null,lc(),X=0;let e=document.querySelector(`.player-hand`);e?.classList.remove(`player-hand--dealing`,`is-dealing`,`deal-active`);let t=e?.querySelector(`.player-hand__meta`);t&&(t.textContent=aa()?`Đang chia bài...`:`Còn ${oa()} • bấm 1 lá để chọn`);let n=e?.querySelector(`.draft-hand-meta__info em`);n&&(n.textContent=`Nếu không chọn, hết giờ sẽ chọn ngẫu nhiên.`),Ta(),Yi()}function to(){w=!1,Us=null,lc(),X=0;let e=document.querySelector(`.player-hand`);e?.classList.remove(`player-hand--dealing`,`is-dealing`,`deal-active`);let t=e?.querySelector(`.player-hand__meta`);t&&(t.textContent=aa()?`Đang chia bài...`:`Còn ${oa()} • bấm 1 lá để chọn`);let n=e?.querySelector(`.draft-hand-meta__info em`);n&&(n.textContent=`Bấm để chọn, giữ 0.5s để xem lớn.`),ja(),Gi(),Yi()}function no(){let e=Tn();e&&(C=[...e]),T=!1,R=!1,O=!1,w=!0,ic=!0,v(`deal`),J(),zs=fc(),window.requestAnimationFrame(()=>{document.querySelector(`.player-hand:not(.player-hand--draft)`)?.classList.add(`planning-deal-active`)}),window.setTimeout(()=>{w=!1;let e=document.querySelector(`.player-hand`);e?.classList.remove(`player-hand--dealing`,`is-dealing`,`deal-active`,`planning-deal-active`);let t=e?.querySelector(`.player-hand__meta`);t&&(t.textContent=`Giữ 0.5s để xem lớn`)},1760)}function ro(){wa(),Xa(),Ki(),w=!0,D=null,G(),uc(),ir=window.setTimeout(()=>{eo()},qs)}function ao(){Xa(),ir=window.setTimeout(()=>{w=!1,ir=null;let e=document.querySelector(`.player-hand`);e?.classList.remove(`player-hand--dealing`,`is-dealing`,`deal-active`);let t=e?.querySelector(`.player-hand__meta`);t&&(t.textContent=`Giữ 0.5s để xem lớn`),Ja(),!T&&!R&&(Mr(),window.setTimeout(()=>{jr()},250))},1320)}function oo(){Ya(),Xa(),Lr(),qa(),kr(),un(),x>=4?(!tr&&er>0&&(Qn-=er*10,tr=!0),Zn+=1,x=0,fr=Jn(),pr=Yn(),ar=ln(Kn),$n={coin:0,stamina:0},S={coin:0,stamina:0},er=0,tr=!1):x+=1,R=!1,z=null,B=0,V=!1,nr=!1,yr=15,j=null,M=null,P=null,F=null,I=null,hr=null,L=!1}function so(e){return e?e.replaySteps.reduce((e,t)=>({coin:e.coin,stamina:e.stamina+(t.eventStaminaDelta??0)}),{coin:0,stamina:0}):{coin:0,stamina:0}}function co(e){let t=so(e);return Math.abs(Math.min(0,t.stamina))}function lo(){if(!z||nr)return;let e=so(z);Qn+=z.finalVP,S={coin:S.coin+e.coin,stamina:S.stamina+e.stamina},nr=!0}function uo(){W(),Xo(),kr(),j=null,M=null,P=null,F=null,I=null,L=!1,z=Hr(),B=0,V=!1,R=!0,Vr(),qa(),Lr(),xr=window.setInterval(()=>{if(z){if(B>=z.replaySteps.length-1){B=z.replaySteps.length-1,V=!0,lo(),Lr(),G(),Ya(),rr=window.setTimeout(()=>{oo()},1800);return}B+=1,Vr(),G()}},850),G()}function fo(){W(),Xo(),kr(),qa(),Lr(),j=null,M=null,P=null,F=null,I=null,L=!1,z=Hr(),B=0,V=!1,R=!0,Ws=!0,Vr(),xr=window.setInterval(()=>{if(z){if(B>=z.replaySteps.length-1){B=z.replaySteps.length-1,V=!0,Lr(),J();return}B+=1,Vr(),J()}},850),J()}function po(){kr(),R=!1,z=null,B=0,V=!1,nr=!1,yr=15,Ya(),Xa(),w=!1,Lr(),j=null,M=null,P=null,F=null,I=null,L=!1,G(),Ja()}function mo(){let e=Ur(),t=d.roomState?.phase===`lobby`||d.roomState?.phase===`cinematic`,n=Bn()??(z?So():Qn),r=jn();return`
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

      ${z?`
            <button
              class="score-breakdown__timer score-breakdown__timer--reset"
              onclick="event.stopPropagation(); resetSimulation()"
              title="Prototype: mở khóa để test lại lượt"
            >
              ↺ Test lại
            </button>
          `:T?`
              <div
                class="score-breakdown__timer ${ca()?`score-breakdown__timer--danger`:``}"
                title="Thời gian chọn bài trong phase chia bài."
              >
                <span>DRAFT</span>
                <strong>${oa()}</strong>
              </div>
            `:`
              <div
                class="score-breakdown__timer ${yr<=10?`score-breakdown__timer--danger`:``}"
                title="Đồng hồ đếm ngược. Hết giờ hệ thống tự mô phỏng."
              >
                <span>TIME</span>
                <strong>${Ka(yr)}</strong>
              </div>
            `}
    </section>
  `}function ho(){if(R||z||pn())return``;let e=Kr();return`
    <div class="resource-orbs" aria-label="Tài nguyên hiện tại">
      <div class="resource-orb resource-orb--coin ${_r===`coin`?`resource-orb--effect-pulse`:``}" title="Xu hiện có">
        <div class="resource-orb__frame">
          <div class="resource-orb__icon resource-orb__icon--coin">💰</div>
          <div class="resource-orb__value">${e.coin}</div>
        </div>
        <div class="resource-orb__label">TIỀN</div>
      </div>

      <div class="resource-orb resource-orb--stamina ${_r===`stamina`?`resource-orb--effect-pulse`:``}" title="Thể lực hiện có">
        <div class="resource-orb__frame">
          <div class="resource-orb__icon resource-orb__icon--stamina">🏃</div>
          <div class="resource-orb__value">${e.stamina}</div>
        </div>
        <div class="resource-orb__label">THỂ LỰC</div>
      </div>
    </div>
  `}function go(){if(!pn())return``;let e=mn(),t=d.playerId;return`
    <section class="final-ranking-panel">
      <div class="final-ranking-panel__header">
        <span>KẾT THÚC PHASE</span>
        <h2>Bảng xếp hạng cuối cùng</h2>
        <p>Hết 5 ngày. BXH sẽ tự đóng sau ${d.roomState?.timer??10}s để qua Phase ${Zn+1}.</p>
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

      ${_o(`travel-export-panel--final`)}

      <div class="final-ranking-panel__footer">
        ${Zn>=3?`Đã kết thúc Phase 3. Đây là kết quả cuối của game.`:`Đang chuẩn bị chuyển sang Phase ${Zn+1}...`}
      </div>
    </section>
  `}function _o(e=``){return`
    <div class="flow-export travel-export-panel ${e}">
      <span>Xuất lịch trình</span>
      <p>Xuất board hiện tại thành lịch trình du lịch để lưu hoặc chia sẻ.</p>
      <div class="flow-export__actions">
        <button onclick="event.stopPropagation(); downloadTravelCertificateHtml()">Certificate</button>
        <button onclick="event.stopPropagation(); copyTravelTimeline()">Copy text</button>
      </div>
    </div>
  `}function vo(e){return e>0?`+${e} VP`:e<0?`${e} VP`:`0 VP`}function yo(){return z?z.replaySteps.slice(0,B+1).reduce((e,t)=>e+t.vpDelta,0):0}function bo(){return z&&nr?Qn-z.finalVP:Qn}function xo(){return z?bo()+(V?z.finalVP:yo()):Qn}function So(){return z?V?Qn:bo():Qn}function Co(){if(!z)return``;let e=z,t=Rr(),n=Math.max(1,e.replaySteps.length),r=Math.min(B+1,n),i=V?e.finalVP:yo(),a=B===n-1?460:B===n-2?180:0,o=223+B*366+a,s=e=>e===`storm`?`⛈`:e===`traffic`?`🚦`:e===`distance`?`🧭`:e===`promo`?`🏷`:`✦`,c=e=>e.eventText?e.eventText:e.eventType===`storm`?`Mưa giông`:e.eventType===`traffic`?`Kẹt xe`:e.eventType===`distance`?`Xa tuyến`:e.eventType===`promo`?`Ưu đãi`:``;return`
    <section class="ticket-scan-overlay" onclick="event.stopPropagation()">
      <div class="ticket-scan-overlay__scrim"></div>

      <div class="ticket-scan-overlay__header">
        <span>ĐANG QUÉT TÍNH ĐIỂM</span>
        <strong>${fn()} • ${dn()}</strong>
        <em>${t?`Đang tính: ${t.timeLabel}`:`Đang chuẩn bị...`}</em>
      </div>

      <div class="ticket-scan-strip">
        <div class="ticket-scan-strip__backdrop"></div>

        <div
          class="ticket-scan-track"
          style="transform: translateX(calc(50% - ${o}px)); --scan-index: ${B};"
        >
          ${e.replaySteps.map((t,r)=>{let i=r===n-1,a=!V&&i&&r===B,o=!V&&r===B&&!a,l=V||r<B||a,u=!V&&r>B,d=c(t),f=!!(t.eventType||t.eventText);return`
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

                ${r<e.replaySteps.length-1?`<div class="score-ticket-connector ${r<B?`is-passed`:``}"></div>`:``}
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
          <strong>${vo(i)}</strong>
        </div>

        <div>
          <span>Tổng phase</span>
          <strong>${So()} VP</strong>
        </div>

        ${V?`
              <div class="ticket-scan-overlay__complete">
                <span>Hoàn tất</span>
                <strong>${bo()} → ${xo()} VP</strong>
              </div>
            `:``}
      </div>
    </section>
  `}function wo(e,t){if(!z)return null;let n=z.replaySteps.findIndex(n=>n.rowIndex===e&&n.dayIndex===t);return n<0||n>B?null:z.replaySteps[n]??null}function To(e,t){if(!z||t!==x)return``;let n=Rr(),r=n?.rowIndex===e&&n?.dayIndex===t,i=z.replaySteps.findIndex(n=>n.rowIndex===e&&n.dayIndex===t),a=i>=0?z.replaySteps[i]:null,o=i>=0&&i<B,s=a?.eventType&&i<=B?`board-cell--event-${a.eventType}`:``;return r?`board-cell--replay-current ${s}`.trim():o?`board-cell--replay-done ${s}`.trim():`board-cell--replay-pending`}var Eo=!1,Do=``;function Oo(){if(b()){let e=Mn();return Math.max(0,e?.coinDebt??0)}return Math.max(0,er)}function ko(){Oo()<=0||(Eo=!0,Do=``,J())}function Ao(){Eo=!1,Do=``,J()}function jo(){if(Oo()<=0){Ao();return}if(b()){ue(),Ao();return}let e=Kr(),t=Math.min(e.coin,er);if(t<=0){Do=`Bạn chưa có xu để trả nợ lúc này.`,J();return}if(er=Math.max(0,er-t),S=Object.assign(Object.assign({},S),{coin:S.coin-t}),Do=er>0?`Đã trả ${t} xu. Hiện còn nợ ${er} xu.`:`Đã trả hết nợ (${t} xu).`,v(`eventPromo`),er<=0){Ao();return}J()}function Mo(){return`
    <svg class="player-effect-seal__icon-svg" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path class="player-effect-seal__icon-solid" d="M30.8 10.2c.8-1.5 2.9-1.5 3.7 0l2.2 4.1c.3.5.8.9 1.4 1l4.8 1c1.8.4 2.3 2.6.9 3.7l-3.3 2.7c-.5.4-.8 1-.8 1.6l.1 1.8c4.4 1.8 7.5 5.9 7.5 10.7c0 6.4-5.1 11.5-11.5 11.5h-7.6c-6.8 0-12.4-5.5-12.4-12.3c0-4.8 2.8-8.9 6.9-10.8l.1-.9c.1-.7-.2-1.3-.7-1.8l-3-2.5c-1.4-1.2-.8-3.4 1-3.8l4.4-.9c.6-.1 1.1-.5 1.4-1l2.3-4.1Z"/>
      <path class="player-effect-seal__icon-cut" d="M34.8 29.6l-3.2 5l3.5 3.2l-2.5 4.6l4.1 3.6"/>
      <text class="player-effect-seal__icon-mark" x="31.9" y="38.6" text-anchor="middle">$</text>
    </svg>
  `}function No(){if(!Eo)return``;let e=Oo(),t=Kr().coin,n=e*10;return`
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
                <span class="player-effect-seal__glyph player-effect-seal__glyph--debt" aria-hidden="true">${Mo()}</span>
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

          ${Do?`<div class="effect-token-modal__notice">${Do}</div>`:``}
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
  `}function Po(){let e=[],t=Oo();return t>0&&e.push(`
      <button
        type="button"
        class="player-effect-seal player-effect-seal--debt"
        onclick="event.stopPropagation(); window.openDebtTokenModal()"
        aria-label="Token nợ: ${t} xu"
      >
        <span class="player-effect-seal__surface">
          <span class="player-effect-seal__ring"></span>

          <span class="player-effect-seal__glyph player-effect-seal__glyph--debt" aria-hidden="true">${Mo()}</span>
        </span>

        <span class="player-effect-seal__count">${t}</span>
        <span class="player-effect-seal__hover-label">TOKEN NỢ</span>
      </button>
    `),e.length?`
    <div class="player-effect-dock">
      ${e.join(``)}
    </div>
  `:``}function Fo(){b()||ar.length;let e=(b()?Tn():null)?.length??C.length,t=!!(Z||D)&&!Ys&&!O&&!sc()&&!A,n=T?`
      <button
        type="button"
        class="deck-pile-panel__draft-confirm"
        onclick="event.stopPropagation(); confirmDraftPick()"
        ${t?``:`disabled`}
      >
        Kết thúc lượt
      </button>
    `:``,r=Po(),i=Ji(),a=T||r.length>0?`
      <div class="deck-pile-panel__header">
        <div class="deck-pile-panel__header-left">${i}${r}</div>
        <div class="deck-pile-panel__header-right">${n}</div>
      </div>
    `:``;return`
    <section
      class="deck-pile-panel${T?` deck-pile-panel--draft`:``}"
      data-discard-drop-zone="true"
      title="Kéo thả lá bài trên tay vào đây để discard và nhận lại Xu/Thể lực bằng chi phí của lá."
    >
      ${a}

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
          <strong>${Gn().length}</strong>
        </div>
      </div>
    </section>
  `}function Io(){let e=hi(P)??F;return`
    <main class="arena ${pn()?`arena--gameover`:``} ${R?`arena--scanning`:``}">
      <div class="arena__top arena__top--with-score">
        <div class="arena__title-block">
          <div class="blue-line"></div>

          <div>
            <h1>${An()}</h1>
          </div>
        </div>

        ${mo()}
      </div>


      ${ho()}

      <div class="arena__main">
        <div class="board-block">
          <div class="days-header">
            ${Re.map((e,t)=>`<div class="day-pill ${t===x?`day-pill--current`:``} ${t<x?`day-pill--done`:``}">NGÀY ${e}</div>`).join(``)}
          </div>

          <section class="board-grid">
            ${ze.map((e,t)=>`
                  <div class="time-label">${e}</div>

                  ${Re.map((e,n)=>{let r=gi(t,n),i=n===x,a=!T&&!R&&!w&&i&&j!==null&&r===null;return r?`
                        <div
                          class="board-cell board-cell--occupied board-cell--clickable ${To(t,n)} ${Fr(t,n)?`board-cell--just-placed`:``}"
                          data-board-drop-cell="true"
                          data-row-index="${t}"
                          data-col-index="${n}"
                          onclick="event.stopPropagation(); handleBoardCellClick(${t}, ${n})"
                          title="Ô đã có bài - bấm để xem lớn"
                        >
                          ${Ci(r,wo(t,n))}
                            ${Si(t,n)}
                        </div>
                      `:`
                          <div
                            class="board-cell board-cell--empty ${To(t,n)} ${R?`board-cell--locked-mode`:``} ${!i&&!R?`board-cell--not-current-day`:``} ${a?`board-cell--placeable`:``}"
                            data-board-drop-cell="true"
                            data-row-index="${t}"
                            data-col-index="${n}"
                            onclick="event.stopPropagation(); handleBoardCellClick(${t}, ${n})"
                            title="${i?a?`Thả lá đang kéo vào ô ngày hiện tại`:`Chỉ xếp bài cho ngày hiện tại`:`Không phải ngày hiện tại`}"
                          >
                            <span class="empty-plus">+</span>
                            ${Si(t,n)}
                          </div>
                        `}).join(``)}
                `).join(``)}
          </section>
          ${la()}${ua()}
        </div>

        ${pn()?go():T?``:Co()}

        ${R?``:`
              <section
          class="player-hand ${T?`player-hand--draft`:``} ${!T&&w?`player-hand--dealing is-dealing`:``}"
          onclick="${T?``:`clearSelectedHandCard()`}"
        >
          <div class="player-hand__top">
            <div class="player-hand__title">
              <span class="hand-badge">${T?`DRAFT`:`HAND`}</span>
              <h2>
                ${T?`Chọn bài ngày ${Re[x]}`:`Bài ngày ${Re[x]}`}
              </h2>
            </div>

            <div class="player-hand__meta ${T&&ca()?`player-hand__meta--danger`:``}">
              ${T?aa()?`Đang chia bài...`:`Còn ${or}s • ${O?`Đang chuyền bài...`:`bấm 1 lá để chọn`}`:w?`Đang chia bài...`:`Giữ 0.5s để xem lớn`}
            </div>
          </div>

          ${T?Ei():``}

          <div class="player-hand__cards ${T?`player-hand__cards--draft player-hand__cards--picked player-hand__cards--picked-count-${ji()}`:``}">
            ${T?Hi():C.map((e,t)=>wi(e,t)).join(``)}
          </div>
        </section>
            `}
      </div>

      ${e?Ti(e):``}
    </main>
  `}function W(){vr!==null&&(window.clearTimeout(vr),vr=null)}var Lo=-1,Ro=-1;function zo(e,t,n){let r=document.querySelector(e);if(!r)return;let i=document.createElement(`div`);i.className=`floating-text floating-text--${n}`,i.textContent=`${t>0?`+`:``}${t}`,r.appendChild(i),r.classList.remove(`resource-pulse`),r.clientWidth,r.classList.add(`resource-pulse`),setTimeout(()=>i.remove(),1200)}function G(){let e=document.querySelector(`.arena`);e&&(e.outerHTML=Io(),sc()&&window.requestAnimationFrame(()=>{window.requestAnimationFrame(()=>{cc()})}),requestAnimationFrame(()=>{let e=Kr();Lo!==-1&&e.coin!==Lo&&zo(`.resource-orb--coin .resource-orb__frame`,e.coin-Lo,`coin`),Ro!==-1&&e.stamina!==Ro&&zo(`.resource-orb--stamina .resource-orb__frame`,e.stamina-Ro,`stamina`),Lo=e.coin,Ro=e.stamina}))}function Bo(e,t,n){if(R||w||n!==x||!ai(t,n))return;let r=C.findIndex(t=>t.id===e);if(r===-1)return;let i=C[r];if(b()){v(`cardPlace`);let e=yi(i);e&&bi({rowIndex:t,colIndex:n,type:e.type,value:e.value}),ce({cardId:i.id,rowIndex:t,colIndex:n,tag:i.tag,icon:i.icon,vp:i.vp,coin:i.coin,stamina:i.stamina,name:i.name}),j=null,M=null,P=null,F=null,I=null,L=!1,e&&G();return}let a=Kr(),o=Math.max(0,i.coin-a.coin),s=Math.max(0,i.stamina-a.stamina);v(`cardPlace`),C.splice(r,1),xi(i,t,n)||(H()[t][n]=i,li({rowIndex:t,colIndex:n,card:i,coinDebt:o,staminaDebt:s})),ce({cardId:i.id,rowIndex:t,colIndex:n,tag:i.tag,icon:i.icon,vp:i.vp,coin:i.coin,stamina:i.stamina,image:i.image,name:i.name}),Nr(i),j=null,M=null,P=null,F=null,I=null,L=!1,hr={rowIndex:t,colIndex:n},G(),window.setTimeout(()=>{hr?.rowIndex===t&&hr?.colIndex===n&&(hr=null,G())},420)}function Vo(e,t){j&&Bo(j,e,t)}function Ho(){if(R||!I)return;let{rowIndex:e,colIndex:t}=I;if(t!==x)return;let n=H()[e]?.[t];if(!(!n||ri(n)||ii(n))){if(b()){de({rowIndex:e,colIndex:t}),P=null,F=null,I=null,hr=null,j=null,L=!1;return}for(H()[e][t]=null,fi(e,t,n),C.unshift(n);C.length>5;){let e=C.pop();e&&ar.unshift(e)}P=null,F=null,I=null,hr=null,j=null,L=!1,G()}}function Uo(e){if(!N||N.isDragging)return;W(),P=null,F=null,I=null,L=!1;let{source:t}=N,n=t.getBoundingClientRect(),r=t.cloneNode(!0);r.classList.add(`hand-card--drag-clone`),r.classList.remove(`hand-card--selected`),r.style.width=`${n.width}px`,r.style.height=`${n.height}px`,r.style.left=`${n.left}px`,r.style.top=`${n.top}px`,r.style.transform=`none`,r.style.pointerEvents=`none`,document.body.appendChild(r),t.classList.add(`hand-card--drag-source-hidden`),N.clone=r,N.offsetX=e.clientX-n.left,N.offsetY=e.clientY-n.top,N.isDragging=!0,M=N.id,j=N.id,Wo(e)}function Wo(e){N?.clone&&(N.clone.style.left=`${e.clientX-N.offsetX}px`,N.clone.style.top=`${e.clientY-N.offsetY}px`)}function Go(e){return document.elementFromPoint(e.clientX,e.clientY)?.closest(`[data-board-drop-cell='true']`)}function Ko(e){return document.elementFromPoint(e.clientX,e.clientY)?.closest(`[data-discard-drop-zone='true']`)}function qo(){document.querySelectorAll(`.deck-pile-panel--discard-hover`).forEach(e=>{e.classList.remove(`deck-pile-panel--discard-hover`),delete e.dataset.discardCoin,delete e.dataset.discardStamina})}function Jo(){return!T&&!R&&!w}function Yo(e){if(!Jo())return;let t=C.findIndex(t=>t.id===e);if(t===-1)return;let n=C[t];if(v(`returnDeck`),b()){let e=d.roomState,t=d.playerId;if(e&&t){let r=e.self.hand.findIndex(e=>e.id===n.id);r>=0&&e.self.hand.splice(r,1);let i=e.players[t];i&&(i.coin+=n.coin,i.stamina+=n.stamina),C=[...e.self.hand]}le({cardId:n.id,coin:n.coin,stamina:n.stamina,name:n.name}),j=null,M=null,P=null,F=null,I=null,L=!1,J();return}C.splice(t,1),$n={coin:$n.coin+n.coin,stamina:$n.stamina+n.stamina},j=null,M=null,P=null,F=null,I=null,L=!1,G()}function Xo(){var e;ns(),qo(),N?.source&&N.source.classList.remove(`hand-card--drag-source-hidden`),(e=N?.clone)==null||e.remove(),N=null,M=null,document.querySelectorAll(`.board-cell--placeable`).forEach(e=>e.classList.remove(`board-cell--placeable`))}function Zo(e){if(!N)return;let t=e.clientX-N.startX,n=e.clientY-N.startY,r=Math.hypot(t,n);if(!N.isDragging&&r>=8&&(W(),Uo(e)),!N?.isDragging)return;e.preventDefault(),Wo(e),ns(),qo();let i=Ko(e);if(i&&Jo()){let e=hi(M);i.classList.add(`deck-pile-panel--discard-hover`),i.dataset.discardCoin=String(e?.coin??0),i.dataset.discardStamina=String(e?.stamina??0);return}let a=Go(e);if(!a)return;let o=Number(a.dataset.rowIndex),s=Number(a.dataset.colIndex),c=hi(M);Number.isInteger(o)&&Number.isInteger(s)&&ai(o,s)&&c?a.classList.add(`board-cell--drag-hover`):a.classList.add(`board-cell--drag-invalid`)}function Qo(e){document.removeEventListener(`pointermove`,Zo),document.removeEventListener(`pointerup`,Qo),document.removeEventListener(`pointercancel`,$o);let t=N,n=t?.isDragging===!0;if(W(),t){if(n){let n=Go(e),r=Ko(e),i=Number(n?.dataset.rowIndex),a=Number(n?.dataset.colIndex),o=t.id;Xo(),L=!0,window.setTimeout(()=>{L=!1},0);let s=hi(o);if(r&&s&&Jo()){Yo(o);return}if(n&&Number.isInteger(i)&&Number.isInteger(a)&&ai(i,a)&&s){Bo(o,i,a);return}n&&Number.isInteger(i)&&Number.isInteger(a)?es(i,a):es(),j=null,G();return}Xo()}}function $o(){document.removeEventListener(`pointermove`,Zo),document.removeEventListener(`pointerup`,Qo),document.removeEventListener(`pointercancel`,$o),W(),Xo(),j=null,L=!1,G()}function es(e,t){v(`reject`);let n=e!==void 0&&t!==void 0?document.querySelector(`[data-row-index="${e}"][data-col-index="${t}"]`):document.querySelector(`.arena`);n?.classList.add(`resource-rejected-feedback`),window.setTimeout(()=>{n?.classList.remove(`resource-rejected-feedback`)},380)}function ts(e){return e.dataTransfer?.getData(`text/plain`)||M}function ns(){document.querySelectorAll(`.board-cell--drag-hover, .board-cell--drag-invalid`).forEach(e=>{e.classList.remove(`board-cell--drag-hover`),e.classList.remove(`board-cell--drag-invalid`)})}window.startDragHandCard=(e,t)=>{var n;W(),M=t,j=t,P=null,F=null,I=null,L=!0,(n=e.dataTransfer)==null||n.setData(`text/plain`,t),e.dataTransfer&&(e.dataTransfer.effectAllowed=`move`)},window.endDragHandCard=()=>{W(),ns(),M=null,window.setTimeout(()=>{L=!1},0)},window.handleBoardCellDragOver=(e,t,n)=>{!M||H()[t][n]!==null||(e.dataTransfer&&(e.dataTransfer.dropEffect=`move`),e.currentTarget?.classList.add(`board-cell--drag-hover`))},window.handleBoardCellDragLeave=e=>{e.currentTarget?.classList.remove(`board-cell--drag-hover`)},window.dropHandCardOnBoard=(e,t,n)=>{W(),ns();let r=ts(e);if(M=null,!r)return;let i=hi(r);if(!ai(t,n)||!i){es(t,n);return}Bo(r,t,n)},window.startHandPointerDrag=(e,t)=>{if(w||R||e.button!==0||!hi(t))return;Xo();let n=e.currentTarget;n&&(N={id:t,source:n,clone:null,startX:e.clientX,startY:e.clientY,offsetX:0,offsetY:0,isDragging:!1},document.addEventListener(`pointermove`,Zo),document.addEventListener(`pointerup`,Qo),document.addEventListener(`pointercancel`,$o),document.querySelectorAll(`.board-cell`).forEach(e=>{let t=parseInt(e.getAttribute(`data-row-index`)||`-1`),n=parseInt(e.getAttribute(`data-col-index`)||`-1`);t>=0&&n>=0&&ai(t,n)&&e.classList.add(`board-cell--placeable`)}))},window.openDebtTokenModal=()=>{ko()},window.closeDebtTokenModal=()=>{Ao()},window.payCoinDebtFromModal=()=>{jo()},window.selectDraftCard=Ha,window.confirmDraftPick=Ua,globalThis.confirmDraftPick=Ua,window.toggleDraftPoolCollapse=na,globalThis.toggleDraftPoolCollapse=na,window.startHoldHandCard=e=>{O||w||(W(),vr=window.setTimeout(()=>{P=e,F=null,I=null,L=!0,W(),G()},500))},window.cancelHoldHandCard=()=>{W()},window.clearSelectedHandCard=()=>{W(),j!==null&&(j=null,G())},window.handleBoardCellClick=(e,t)=>{W();let n=gi(e,t);if(n){if(ri(n)){if(!T&&!w&&t===x&&j){Vo(e,t);return}di(e,t,n);return}Xo(),P=null,F=n,I={rowIndex:e,colIndex:t},j=null,L=!1,G();return}!T&&!w&&t===x&&Vo(e,t)},window.focusBoardCard=(e,t)=>{let n=gi(e,t);n&&(P=null,F=n,I={rowIndex:e,colIndex:t},j=null,L=!1,G())},window.runSimulation=()=>{uo()},window.resetSimulation=()=>{po()},window.returnFocusedBoardCardToHand=()=>{Ho()},window.closeFocusedHandCard=()=>{W(),P=null,F=null,I=null,M=null,L=!1,G()};function rs(e){let t={p1:1,p2:3,p3:3,p4:3};return[...nn,...rn].find(t=>t.id===e)??{id:e,rank:t[e],name:e.toUpperCase(),score:0,coin:3,stamina:2,usedSlots:0}}function is(){let e=d.playerId;return!e||!d.roomState?[]:qn.filter(t=>t===e?!1:d.roomState?.players[t]?.isConnected===!0).map(e=>{let t=rs(e),n=d.roomState?.players[e];return Object.assign(Object.assign({},t),{name:n?.name??t.name,score:n?.score??t.score,coin:n?.coin??t.coin,stamina:n?.stamina??t.stamina,usedSlots:n?.usedSlots??t.usedSlots,active:!1})})}function as(){return b()?is().slice(0,2):Gr()}function os(){return b()?is().slice(2):[rn[0]]}function ss(){let e=d.roomState;return e?qn.map(t=>{let n=e.players[t];return{playerId:t,name:n?.name??t.toUpperCase(),score:n?.score??0,coin:n?.coin??3,stamina:n?.stamina??2,usedSlots:n?.usedSlots??0,isConnected:n?.isConnected??!1,hasJoined:n?.hasJoined??!1}}).filter(e=>e.hasJoined||e.isConnected).sort((e,t)=>t.score===e.score?t.usedSlots===e.usedSlots?e.playerId.localeCompare(t.playerId):t.usedSlots-e.usedSlots:t.score-e.score):[]}function cs(){if(!Sr||!b())return``;let e=ss(),t=d.playerId;return`
    <div class="mid-ranking-backdrop" onclick="event.stopPropagation(); closeMidGameRanking()">
      <section class="mid-ranking-modal" onclick="event.stopPropagation()">
        <div class="mid-ranking-modal__header">
          <div>
            <span>BẢNG XẾP HẠNG GIỮA TRẬN</span>
            <h2>${jn()}</h2>
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
  `}var ls=`assets/sounds/in-game-background.mp3`,us=`travelDeck.inGameMusicMuted`,ds=`travelDeck.inGameMusicVolume`,fs=.5,ps=null,ms=localStorage.getItem(us),hs=Number(localStorage.getItem(ds)),K=ms===`true`,q=hs;(!Number.isFinite(q)||q<=0)&&(q=fs,localStorage.setItem(ds,String(q)),ms===null&&localStorage.setItem(us,`false`));function gs(e){return Math.max(0,Math.min(1,e))}function _s(){if(!ps){let e=new Audio(ls);e.loop=!0,e.preload=`auto`,e.volume=gs(q),e.muted=K,ps=e}return ps}function vs(){return b()&&d.roomState?.phase!==`lobby`}function ys(){ve(),document.querySelectorAll(`audio, video`).forEach(e=>{if(e===ps)return;let t=e;try{t.pause(),t.muted=!0,(t.id===`hub-hero-video`||t.classList.contains(`hub-hero__video`))&&(t.currentTime=0)}catch{}})}function bs(){let e=_s();if(e.volume=gs(q),e.muted=K,!vs()){e.pause();return}if(ys(),K||q<=0){e.pause();return}e.play().catch(()=>{})}function xs(){let e=document.querySelector(`[data-in-game-music-toggle]`),t=document.querySelector(`[data-in-game-music-value]`),n=document.querySelector(`[data-in-game-music-slider]`);e&&(e.classList.toggle(`is-muted`,K||q<=0),e.textContent=K||q<=0?`🔇`:`🔊`,e.title=K?`Bật nhạc nền`:`Tắt nhạc nền`),t&&(t.textContent=`${Math.round(gs(q)*100)}%`),n&&(n.value=String(Math.round(gs(q)*100)))}function Ss(){K=!K,localStorage.setItem(us,String(K)),!K&&q<=0&&(q=fs,localStorage.setItem(ds,String(q))),bs(),xs()}function Cs(e){let t=typeof e==`number`?e:Number(e);Number.isFinite(t)&&(q=gs(t>1?t/100:t),K=q<=0,localStorage.setItem(ds,String(q)),localStorage.setItem(us,String(K)),bs(),xs())}function ws(){let e=Math.round(gs(q)*100),t=K||e<=0;return`
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
  `}function Ts(){let e=()=>{bs()};document.addEventListener(`pointerdown`,e,{passive:!0}),document.addEventListener(`keydown`,e)}window.toggleInGameBackgroundMusic=Ss,window.setInGameBackgroundMusicVolume=Cs;function Es(){return!b()||d.roomState?.phase===`lobby`?``:`
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

        ${ws()}

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
  `}function Ds(e){return Array.from({length:Math.max(0,e)},()=>`<section class="side-player side-player--empty-spacer" aria-hidden="true"></section>`).join(``)}var Os=`dashboard`,ks=null;function As(e){if(e!==`dashboard`&&ys(),!document.startViewTransition){Os=e,J();return}document.startViewTransition(()=>{Os=e,J()})}var js=!1;window.gotoMapSelection=()=>{if(js)return;if(!n.user){window.focusHubAuthPanel(),gc(`Đăng nhập hoặc đăng ký để bắt đầu hành trình.`);return}js=!0;let e=document.createElement(`video`);e.src=`./assets/chuyencanh.mp4`,e.muted=!0,e.playsInline=!0,e.style.cssText=[`position:fixed`,`inset:0`,`width:100%`,`height:100%`,`object-fit:cover`,`z-index:9999`,`pointer-events:auto`,`opacity:0`,`transition:opacity 0.4s ease`].join(`;`),document.body.appendChild(e),e.playbackRate=1.75,e.play().catch(()=>{e.muted=!0,e.playbackRate=1.75,e.play()}),requestAnimationFrame(()=>{requestAnimationFrame(()=>{e.style.opacity=`1`})});let t=!1;e.addEventListener(`timeupdate`,()=>{!t&&e.currentTime>=3.5&&(t=!0,js=!1,ks=e,document.body.removeChild(e),e.style.cssText=[`position:absolute`,`inset:0`,`width:100%`,`height:100%`,`object-fit:cover`,`z-index:0`,`pointer-events:none`,`opacity:1`].join(`;`),Os=`map_selection`,J(),requestAnimationFrame(()=>{document.querySelectorAll(`.map-card-col`).forEach((e,t)=>{setTimeout(()=>e.classList.add(`map-card-col--slide-in`),200+t*140)})})),e.duration&&e.currentTime>=e.duration-.5&&(e.currentTime=5)})},window.gotoOnlineLobby=()=>{if(!n.user){window.focusHubAuthPanel(),gc(`Đăng nhập hoặc đăng ký để bắt đầu hành trình.`);return}As(`lobby`)},window.gotoDashboard=()=>{ks&&=(ks.pause(),ks.remove(),null),As(`dashboard`)},window.switchHubAuthTab=e=>{document.querySelectorAll(`[data-hub-auth-tab]`).forEach(t=>{t.classList.toggle(`is-active`,t.dataset.hubAuthTab===e)}),document.querySelectorAll(`[data-hub-auth-panel]`).forEach(t=>{t.classList.toggle(`is-active`,t.dataset.hubAuthPanel===e)})},window.focusHubAuthPanel=()=>{let e=document.getElementById(`hub-auth`);if(!e){Os=`dashboard`,J(),window.requestAnimationFrame(()=>{window.focusHubAuthPanel()});return}e.scrollIntoView({behavior:`smooth`,block:`start`}),e.classList.remove(`hub-auth--pulse`),window.requestAnimationFrame(()=>{e.classList.add(`hub-auth--pulse`)}),e.querySelector(`input`)?.focus()},window.startOfflineGame=()=>{alert(`Chế độ chơi offline (Bot) đang được phát triển!`)};function Ms(){return`<div class="saigon-collage-bg" aria-hidden="true"></div>`}var Ns=null,Ps=!1;function Fs(){console.log(`TRIGGERING CINEMATIC TRANSITION!`),Ps=!0;let e=document.createElement(`div`);e.id=`cinematic-blocker`,e.style.cssText=`position:fixed;inset:0;z-index:99999999;cursor:wait;`,e.addEventListener(`mousedown`,e=>{e.preventDefault(),e.stopPropagation()}),e.addEventListener(`click`,e=>{e.preventDefault(),e.stopPropagation()}),e.addEventListener(`touchstart`,e=>{e.preventDefault(),e.stopPropagation()},{passive:!1}),document.body.appendChild(e);let t=document.querySelector(`.online-lobby-card`);t&&t.classList.add(`is-exiting`);let n=document.getElementById(`cinematic-transition-video`),r=document.getElementById(`white-flash-overlay`);if(!n||!r){console.warn(`Missing video or overlay for cinematic transition.`),Ps=!1,J();return}setTimeout(()=>{n.style.display=`block`,n.style.pointerEvents=`none`,n.currentTime=0,n.play().catch(e=>{console.warn(`Video play failed with sound, attempting muted.`,e),n.muted=!0,n.play().catch(e=>{console.error(`Video play failed completely.`,e)})}),n.onpause=()=>{Ps&&(console.warn(`Video paused unexpectedly, resuming...`),n.play().catch(e=>console.error(e)))};let e=()=>{if(!Ps)return;Ps=!1,r.style.display=`block`,r.style.opacity=`1`,n.style.display=`none`,n.ontimeupdate=null;let e=document.getElementById(`cinematic-blocker`);e&&e.remove(),J();let t=document.querySelector(`.game-shell`);t&&t.classList.add(`is-zooming-in`),setTimeout(()=>{r.style.opacity=`0`,setTimeout(()=>{r.style.display=`none`,t&&t.classList.remove(`is-zooming-in`)},1500)},50)};n.onended=e,n.ontimeupdate=()=>{n.duration&&n.currentTime>=n.duration-.2&&e()},setTimeout(()=>{Ps&&(console.warn(`Cinematic transition video timeout fallback.`),e())},2e4)},400)}function Is(){let e=document.querySelector(`.game-shell`);e&&delete e.dataset.saigonHover}function Ls(){if(!n.isReady)return we(!0);if(!b())return!n.user||Os===`dashboard`?(Os=`dashboard`,we()):Os===`map_selection`?pe():Fn();if(d.roomState?.phase===`lobby`)return In();let e=as(),t=os();return`
    <div class="game-shell">
      ${Ms()}
      ${Es()}
      ${cs()}
      ${No()}

      <aside class="players-column players-column--left">
        ${e.map(ha).join(``)}
        ${Ds(2-e.length)}
      </aside>

      ${Io()}

      <aside class="players-column players-column--right">
        ${t.map(ha).join(``)}
        ${Ds(1-t.length)}
        ${Fo()}
      </aside>
    </div>
  `}window.rerenderGameShell=J;function Rs(){!b()||d.roomState?.phase===`lobby`?$t.style.setProperty(`background`,`url('./assets/backgrounds/lobby-background.jpg') center/cover no-repeat #0c0b11`,`important`):$t.style.removeProperty(`background`)}function J(){if(ys(),$t.innerHTML=Ls(),Rs(),Is(),bs(),ye(),Os===`map_selection`&&ks){let e=document.querySelector(`.map-selection-screen`);e&&e.firstChild&&e.insertBefore(ks,e.firstChild)}sc()&&window.requestAnimationFrame(()=>{window.requestAnimationFrame(()=>{cc()})})}var zs=``,Bs=null,Vs=0,Hs=``,Us=null,Ws=!1,Y=null,Gs=null,Ks=null,qs=7450,Js=!1,X=0,Ys=!1,Z=null,Q=null,Xs=0,Zs=750,Qs=1500,$s=1350,ec=.84,tc=!1,nc=!1,$=!1,rc=null,ic=!1,ac=null,oc=0;function sc(){return Js||w||Date.now()<X}function cc(){let e=document.querySelector(`.draft-center-overlay`);if(!e)return!1;e.classList.remove(`draft-center-overlay--dealing`);let t=e.querySelectorAll(`.draft-center-card-wrapper`);return t.forEach(e=>{let t=e;t.classList.remove(`draft-center-card-wrapper--flown-to-hand`),t.style.animation=`none`}),e.offsetWidth,t.forEach(e=>{e.style.removeProperty(`animation`)}),e.classList.add(`draft-center-overlay--dealing`),!0}function lc(){var e;oc+=1,ac!==null&&(window.clearTimeout(ac),ac=null),Js=!1,(e=document.querySelector(`.draft-center-overlay`))==null||e.classList.remove(`draft-center-overlay--dealing`)}function uc(e=qs){ac!==null&&(window.clearTimeout(ac),ac=null);let t=++oc;Js=!0,X=Date.now()+e,v(`deal`);let n=()=>{t===oc&&cc()};window.requestAnimationFrame(()=>{window.requestAnimationFrame(n)}),ac=window.setTimeout(()=>{var e;t===oc&&(ac=null,Js=!1,(e=document.querySelector(`.draft-center-overlay`))==null||e.classList.remove(`draft-center-overlay--dealing`))},e)}function dc(){Us!==null&&(window.clearTimeout(Us),Us=null),rc!==null&&(window.clearTimeout(rc),rc=null),lc()}function fc(){let e=d.roomState;if(!e)return`offline`;let t=e.self,n=qn.map(t=>{let n=e.players[t],r=n.board.map(e=>e.map(e=>e?`${e.cardId}:${e.tag}:${e.icon}:${e.vp}`:`-`).join(`,`)).join(`|`);return[t,n.name,n.score,n.coin,n.stamina,n.usedSlots,n.isConnected?`1`:`0`,n.isReady?`1`:`0`,r].join(`~`)}).join(`||`);return[e.phase,e.phaseNumber??1,e.dayIndex,e.draftRound,t.draftPool.map(e=>e.id).join(`,`),t.pickedDraftCards.map(e=>e.id).join(`,`),t.hand.map(e=>e.id).join(`,`),n].join(`##`)}function pc(){let e=d.roomState,t=document.querySelector(`.score-breakdown__timer`),n=t?.querySelector(`strong`);if(!(!e||!t||!n)){if(e.phase===`draft`){n.textContent=oa(),t.classList.toggle(`score-breakdown__timer--danger`,!aa()&&or<=3),sa(),Yi();return}if(e.phase===`planning`){n.textContent=Ka(e.timer),t.classList.toggle(`score-breakdown__timer--danger`,e.timer<=10);return}e.phase===`gameover`&&(n.textContent=`${e.timer}s`,t.classList.toggle(`score-breakdown__timer--danger`,e.timer<=3))}}function mc(){let e=fc(),t=d.roomState?.phase??null;if(e!==zs){if(console.log(`Signature changed:`,zs,`=>`,e),zs=e,Ns===`lobby`&&t===`cinematic`){Ns=t,Fs();return}Ns=t;let n=(sc()||Ys)&&!tc&&!nc,r=Sn()&&document.querySelector(`.draft-center-overlay--passing.pass-active`),i=A&&document.querySelector(`.draft-center-overlay--collapsing.pass-active, .draft-center-overlay--expanding.pass-active`);Ps||(n?(ja(),pc()):(r||i)&&!nc&&!tc?(pc(),Yi()):J()),tc&&(tc=!1,uc()),nc&&(nc=!1,$?$a():Qa());return}pc()}J(),zs=fc(),Ns=d.roomState?.phase??null;function hc(){let e=0,t=0,n=null,r=null,i=!1,a=!1;function o(){W(),n=null,r=null,i=!1}document.addEventListener(`pointerdown`,o=>{let s=o.target;if(!s)return;let c=s.closest(`[data-draft-card-id]`),l=s.closest(`[data-hand-card-id]`),u=null,d=null;T&&c?(u=c.dataset.draftCardId??null,d=`draft`):!T&&!R&&l&&(u=l.dataset.handCardId??null,d=`hand`),!(!u||!d)&&(n=u,r=d,i=!1,e=o.clientX,t=o.clientY,W(),d===`draft`&&!O&&(a=!0,Ha(u)),vr=window.setTimeout(()=>{n&&(i=!0,P=n,F=null,I=null,L=!0,J())},500))},!0),document.addEventListener(`pointermove`,r=>{!n||vr===null||Math.hypot(r.clientX-e,r.clientY-t)>8&&o()},!0),document.addEventListener(`pointerup`,a=>{let s=n,c=r,l=i,u=Math.hypot(a.clientX-e,a.clientY-t);o(),c===`draft`&&s&&!l&&u<=8&&T&&(a.preventDefault(),a.stopPropagation())},!0),document.addEventListener(`pointercancel`,()=>{o()},!0),document.addEventListener(`click`,e=>{let t=e.target;if(!t)return;let n=t.closest(`[data-draft-card-id]`);if(n&&T){if(e.preventDefault(),e.stopPropagation(),a){a=!1;return}let t=n.dataset.draftCardId;t&&Ha(t);return}let r=t.closest(`[data-hand-card-id]`);if(r&&!T){e.preventDefault(),e.stopPropagation();let t=r.dataset.handCardId;t&&Wa(t)}},!0)}hc(),_c(),Pt(),Ts(),h(()=>{Wn(),mc()}),window.createOnlineRoom=(e=`An`)=>{g(e)},window.joinOnlineRoom=(e,t=`Player`)=>{te(e,t)},window.startOnlineGame=()=>{ae()},window.selectDraftCard=Ha,window.selectHandCard=Wa,window.clearSelectedHandCard=Ga;function gc(e,t=!1){let n=document.querySelector(`#hub-auth-status`)??document.querySelector(`#auth-status`);n&&(n.textContent=e,n.classList.toggle(`hub-auth__status--error`,t),n.classList.toggle(`hub-auth__status--success`,!!e&&!t),n.classList.toggle(`auth-card__status--error`,t),n.classList.toggle(`auth-card__status--success`,!!e&&!t))}function _c(){document.addEventListener(`submit`,e=>{let t=e.target;if(t){if(t.id===`auth-login-form`||t.id===`hub-auth-login-form`){e.preventDefault(),e.stopPropagation(),window.loginFromAuthScreen();return}(t.id===`auth-register-form`||t.id===`hub-auth-register-form`)&&(e.preventDefault(),e.stopPropagation(),window.registerFromAuthScreen())}},!0)}window.loginFromAuthScreen=()=>Qt(void 0,void 0,void 0,function*(){let e=document.querySelector(`#hub-auth-login-username`)??document.querySelector(`#auth-login-username`),t=document.querySelector(`#hub-auth-login-password`)??document.querySelector(`#auth-login-password`);gc(`Đang đăng nhập...`);try{yield o({username:e?.value.trim()??``,password:t?.value??``}),gc(`Đăng nhập thành công.`),J()}catch(e){let t=e instanceof Error?e.message:`Đăng nhập thất bại.`;gc(t,!0),alert(t)}}),window.registerFromAuthScreen=()=>Qt(void 0,void 0,void 0,function*(){let e=document.querySelector(`#hub-auth-register-display-name`)??document.querySelector(`#auth-register-display-name`),t=document.querySelector(`#hub-auth-register-username`)??document.querySelector(`#auth-register-username`),n=document.querySelector(`#hub-auth-register-password`)??document.querySelector(`#auth-register-password`);gc(`Đang tạo tài khoản...`);try{yield s({displayName:e?.value.trim()||void 0,username:t?.value.trim()??``,password:n?.value??``}),gc(`Tạo tài khoản thành công.`),J()}catch(e){let t=e instanceof Error?e.message:`Đăng ký thất bại.`;gc(t,!0),alert(t)}}),window.logoutFromAuthScreen=()=>{c(),d.roomId=null,d.playerId=null,d.roomState=null,Os=`dashboard`,J()},window.createRoomFromLobby=()=>{ys(),g(document.querySelector(`#lobby-create-name`)?.value.trim()||n.user?.displayName||n.user?.username||`An`)},window.joinRoomFromLobby=()=>{ys();let e=document.querySelector(`#lobby-join-name`),t=document.querySelector(`#lobby-room-code`),n=e?.value.trim()||`Player`,r=t?.value.trim().toUpperCase();if(!r){alert(`Nhập room code trước.`);return}te(r,n)},window.reconnectSavedRoomFromLobby=()=>{ys();let e=m();e&&ne(e.roomId,e.playerId,e.playerName)},window.clearSavedRoomFromLobby=()=>{ee(),J()},window.toggleReadyFromLobby=()=>{let e=Mn();if(!e||!d.playerId||!d.roomState)return;let t=!e.isReady;d.roomState.players[d.playerId].isReady=t,J(),re(t)},window.leaveRoomFromLobby=()=>{ie(),J()},window.copyRoomCodeFromLobby=()=>Qt(void 0,void 0,void 0,function*(){let e=d.roomId;if(e)try{yield navigator.clipboard.writeText(e),alert(`Đã copy room code: ${e}`)}catch{prompt(`Copy room code:`,e)}}),window.openMidGameRanking=()=>{Sr=!0,J()},window.closeMidGameRanking=()=>{Sr=!1,J()},window.downloadTravelCertificateHtml=()=>{qt()},window.downloadTravelTimelineTxt=()=>{Xt(`txt`)},window.downloadTravelTimelineJson=()=>{Xt(`json`)},window.copyTravelTimeline=()=>{Zt()},window.debugOnlineBoards=()=>{let e=d.roomState;if(!e)return console.log(`No online room state.`),null;let t={},n=[`p1`,`p2`,`p3`,`p4`];for(let r of n){let n=e.players[r],i=[];for(let e=0;e<n.board.length;e+=1){let t=n.board[e];for(let n=0;n<t.length;n+=1){let r=t[n];r&&i.push({rowIndex:e,colIndex:n,cardId:r.cardId,tag:r.tag,icon:r.icon,vp:r.vp})}}t[r]={name:n.name,connected:n.isConnected,usedSlots:n.usedSlots,filledCells:i}}return console.table(n.map(e=>({playerId:e,name:t[e].name,connected:t[e].connected,usedSlots:t[e].usedSlots,filled:t[e].filledCells.length}))),console.log(t),t},window.onlineClientState=d,window.debugOnlineScores=()=>{let e=d.roomState;if(!e)return console.log(`No online room state.`),null;let t=qn.map(t=>{let n=e.players[t];return{playerId:t,name:n.name,score:n.score,coin:n.coin,stamina:n.stamina,usedSlots:n.usedSlots,connected:n.isConnected,ready:n.isReady,joined:n.hasJoined}});return console.table(t),t},globalThis.createOnlineRoom=window.createOnlineRoom,globalThis.joinOnlineRoom=window.joinOnlineRoom,globalThis.startOnlineGame=window.startOnlineGame,globalThis.selectDraftCard=window.selectDraftCard,globalThis.selectHandCard=window.selectHandCard,globalThis.clearSelectedHandCard=window.clearSelectedHandCard,globalThis.loginFromAuthScreen=window.loginFromAuthScreen,globalThis.registerFromAuthScreen=window.registerFromAuthScreen,globalThis.logoutFromAuthScreen=window.logoutFromAuthScreen,globalThis.forceLogoutAuth=window.logoutFromAuthScreen,globalThis.createRoomFromLobby=window.createRoomFromLobby,globalThis.joinRoomFromLobby=window.joinRoomFromLobby,globalThis.reconnectSavedRoomFromLobby=window.reconnectSavedRoomFromLobby,globalThis.clearSavedRoomFromLobby=window.clearSavedRoomFromLobby,globalThis.toggleReadyFromLobby=window.toggleReadyFromLobby,globalThis.copyRoomCodeFromLobby=window.copyRoomCodeFromLobby,globalThis.leaveRoomFromLobby=window.leaveRoomFromLobby,globalThis.onlineClientState=d,globalThis.openMidGameRanking=window.openMidGameRanking,globalThis.closeMidGameRanking=window.closeMidGameRanking,globalThis.downloadTravelCertificateHtml=window.downloadTravelCertificateHtml,globalThis.toggleInGameBackgroundMusic=window.toggleInGameBackgroundMusic,globalThis.setInGameBackgroundMusicVolume=window.setInGameBackgroundMusicVolume,globalThis.downloadTravelTimelineTxt=window.downloadTravelTimelineTxt,globalThis.downloadTravelTimelineJson=window.downloadTravelTimelineJson,globalThis.copyTravelTimeline=window.copyTravelTimeline,globalThis.playGameSound=v,globalThis.debugOnlineBoards=window.debugOnlineBoards,globalThis.selectDraftCard=window.selectDraftCard,document.addEventListener(`visibilitychange`,xn),window.addEventListener(`focus`,xn),J();