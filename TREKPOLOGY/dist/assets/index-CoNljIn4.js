(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=function(e,t,n,r){function i(e){return e instanceof n?e:new n(function(t){t(e)})}return new(n||=Promise)(function(n,a){function o(e){try{c(r.next(e))}catch(e){a(e)}}function s(e){try{c(r.throw(e))}catch(e){a(e)}}function c(e){e.done?n(e.value):i(e.value).then(o,s)}c((r=r.apply(e,t||[])).next())})},t=`travel_board_auth_user`,n={isReady:!1,user:null};function r(){try{let e=localStorage.getItem(t);if(!e)return null;let n=JSON.parse(e);return!n||!n.username?null:n}catch{return null}}function i(e){localStorage.setItem(t,JSON.stringify(e))}function a(e,t){let n=e.trim();return{id:n.toLowerCase(),username:n,displayName:t?.trim()||n}}function o(t){return e(this,void 0,void 0,function*(){let e=t.username.trim();if(!e)throw Error(`Nhập username trước.`);if(!t.password)throw Error(`Nhập password trước.`);let r=a(e);return n.user=r,n.isReady=!0,i(r),r})}function s(t){return e(this,void 0,void 0,function*(){let e=t.username.trim();if(!e)throw Error(`Nhập username trước.`);if(!t.password||t.password.length<6)throw Error(`Password cần ít nhất 6 ký tự.`);let r=a(e,t.displayName);return n.user=r,n.isReady=!0,i(r),r})}function c(){n.user=null,n.isReady=!0,d.roomId=null,d.playerId=null,d.roomState=null,localStorage.removeItem(t),h()}var l=io(`http://localhost:3001`),u=`travel_board_online_session`,d={roomId:null,playerId:null,roomState:null};function f(){localStorage.removeItem(u)}f();function p(e){!d.roomId||!d.playerId||(localStorage.removeItem(u),sessionStorage.setItem(u,JSON.stringify({roomId:d.roomId,playerId:d.playerId,playerName:e??d.roomState?.players[d.playerId]?.name??`Player`})))}function m(){let e=sessionStorage.getItem(u);if(!e)return null;try{return JSON.parse(e)}catch{return sessionStorage.removeItem(u),null}}function h(){sessionStorage.removeItem(u),localStorage.removeItem(u),d.roomId=null,d.playerId=null,d.roomState=null}function g(e){n.user=r(),n.isReady=!0,window.setTimeout(e,0),l.on(`connect`,()=>{let e=m();!e||d.roomState||l.emit(`room:reconnect`,e)}),l.on(`room:joined`,t=>{d.roomId=t.roomId,d.playerId=t.playerId,d.roomState=t.state,p(t.state.players[t.playerId]?.name),console.log(`Joined room:`,t.roomId,`as`,t.playerId),e()}),l.on(`room:state`,t=>{d.roomState=t,e()}),l.on(`game:error`,e=>{alert(e.message)}),l.on(`connect_error`,()=>{console.warn(`Không kết nối được socket server. Kiểm tra server port 3001.`)}),l.on(`room:left`,()=>{h(),e()})}function ee(e){l.connected||l.connect(),l.emit(`room:create`,{playerName:e})}function te(e,t){l.connected||l.connect(),l.emit(`room:join`,{roomId:e,playerName:t})}function ne(e,t,n){l.emit(`room:reconnect`,{roomId:e,playerId:t,playerName:n})}function re(e){!d.roomId||!d.playerId||l.emit(`room:setReady`,{roomId:d.roomId,playerId:d.playerId,isReady:e})}function ie(){if(!d.roomId||!d.playerId){h();return}l.emit(`room:leave`,{roomId:d.roomId,playerId:d.playerId}),h()}function ae(){!d.roomId||!d.playerId||l.emit(`game:start`,{roomId:d.roomId,playerId:d.playerId})}function oe(e){!d.roomId||!d.playerId||l.emit(`draft:selectCard`,{roomId:d.roomId,playerId:d.playerId,cardId:e})}function se(e){!d.roomId||!d.playerId||l.emit(`planning:placeCard`,Object.assign({roomId:d.roomId,playerId:d.playerId},e))}function ce(e){!d.roomId||!d.playerId||l.emit(`planning:discardCard`,Object.assign({roomId:d.roomId,playerId:d.playerId},e))}function le(e){!d.roomId||!d.playerId||l.emit(`planning:payDebt`,Object.assign({roomId:d.roomId,playerId:d.playerId},e))}function ue(e){!d.roomId||!d.playerId||l.emit(`planning:returnBoardCard`,Object.assign({roomId:d.roomId,playerId:d.playerId},e))}var de=function(e,t,n,r){function i(e){return e instanceof n?e:new n(function(t){t(e)})}return new(n||=Promise)(function(n,a){function o(e){try{c(r.next(e))}catch(e){a(e)}}function s(e){try{c(r.throw(e))}catch(e){a(e)}}function c(e){e.done?n(e.value):i(e.value).then(o,s)}c((r=r.apply(e,t||[])).next())})},fe=`./assets/videos/one-minute-in-vietnam.mp4`;function pe(){let e=document.getElementById(`hub-hero-media`),t=document.getElementById(`hub-hero-video`),n=document.getElementById(`hub-hero-video-hitarea`),r=document.getElementById(`hub-hero-video-mute`);if(!e||!t||!n||!r)return;t.playsInline=!0,t.volume=.85;let i=()=>{if(e.classList.toggle(`hub-hero__media--paused`,t.paused),r.classList.toggle(`hub-hero__video-mute--muted`,t.muted),r.classList.toggle(`hub-hero__video-mute--unmuted`,!t.muted),r.setAttribute(`aria-label`,t.muted?`Bật tiếng video`:`Tắt tiếng video`),r.setAttribute(`aria-pressed`,t.muted?`true`:`false`),t.paused){n.setAttribute(`aria-label`,`Tiếp tục video`);return}n.setAttribute(`aria-label`,`Tạm dừng video`)},a=()=>de(this,void 0,void 0,function*(){t.muted=!1;try{yield t.play(),i();return}catch{t.muted=!0;try{yield t.play()}catch{}i()}});r.addEventListener(`click`,e=>{e.preventDefault(),e.stopPropagation(),t.muted=!t.muted,t.paused||t.play(),i()}),n.addEventListener(`click`,e=>{e.preventDefault(),e.stopPropagation(),t.paused?t.play():t.pause(),i()}),t.addEventListener(`play`,i),t.addEventListener(`pause`,i),t.addEventListener(`volumechange`,i),a(),t.readyState<HTMLMediaElement.HAVE_CURRENT_DATA&&t.addEventListener(`loadeddata`,()=>{a()},{once:!0})}function me(){return`
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
        <source src="${fe}" type="video/mp4" />
      </video>
      <div class="hub-hero__scrim" aria-hidden="true"></div>
      <button
        type="button"
        class="hub-hero__hitarea"
        id="hub-hero-video-hitarea"
        aria-label="Điều khiển video nền"
      ></button>
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
  `}function he(){return`
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
  `}function ge(){return`
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
  `}function _e(e,t){return e?`
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
    `}function ve(e=!1){let t=n.user,r=!!t,i=t?.displayName||t?.username||`Nhà Lữ Hành`;return`
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
        ${_e(r,i)}
      </header>

      <!-- Body: 2 cột -->
      <div class="hub-body">

        <!-- Cột trái: Hero -->
        <div class="hub-hero">
          ${me()}

          <div class="hub-hero__overlay">
            <div class="hub-hero__content">
              <p class="hero-eyebrow">GAME THẺ BÀI CHIẾN LƯỢC</p>
              <h1 class="hero-title">Khám Phá<br/>Việt Nam</h1>
              <p class="hero-sub">Xây dựng hành trình, thu thập địa điểm,<br/>trở thành nhà lữ hành xuất sắc nhất.</p>
              <button class="btn-play" onclick="window.gotoOnlineLobby()">
                ▶ &nbsp;BẮT ĐẦU HÀNH TRÌNH
              </button>
              ${r?``:`<p class="hero-auth-hint">Đăng nhập ở panel bên phải để vào phòng online.</p>`}
            </div>
          </div>
        </div>

        <!-- Cột phải: Auth hoặc Góc Khám Phá -->
        <aside class="hub-side">
          <div class="hub-side__inner">
            ${r?ge():he()}
          </div>
        </aside>

      </div>
    </div>
  `}var _={has_effect:!1,effect_type:`NONE`,effect_value:0},ye=[{card_id:`SG_FOOD_001`,name:`Cà Phê Bệt Nhà Thờ Đức Bà`,description:`Trải nghiệm vỉa hè chuẩn Sài Gòn. Thức uống siêu rẻ nhưng bạn phải đánh cược với thời tiết nắng mưa bất chợt.`,image_url:`assets/cards/saigon/food/sg_food_001.jpg`,phase_pool:`SAIGON`,tags:[`FOOD`,`OUTDOOR`],cost:{xu:1,la:0},base_vp:5,location:{lat:10.7798,lng:106.699,is_virtual:!1,label:`Quận 1 - Công viên 30/4`},on_play_effect:_,rarity:`COMMON`,icon:`☕`},{card_id:`SG_FOOD_002`,name:`Bánh Tráng Nướng Hồ Con Rùa`,description:`Pizza Việt Nam giòn rụm bên hồ nước. Tụ điểm hóng gió lý tưởng nhưng khói bụi giao thông là điều không thể tránh khỏi.`,image_url:`assets/cards/saigon/food/sg_food_002.jpg`,phase_pool:`SAIGON`,tags:[`FOOD`,`OUTDOOR`],cost:{xu:1,la:0},base_vp:5,location:{lat:10.7828,lng:106.6955,is_virtual:!1,label:`Quận 3 - Vòng xoay Công trường Quốc Tế`},on_play_effect:_,rarity:`COMMON`,icon:`🍕`},{card_id:`SG_FOOD_003`,name:`Cà Phê Vợt Cheo Leo`,description:`Hương vị thời gian đọng lại trong quán cà phê vợt lâu đời nhất thành phố. Yên bình, rẻ và an toàn tuyệt đối.`,image_url:`assets/cards/saigon/food/sg_food_003.jpg`,phase_pool:`SAIGON`,tags:[`FOOD`,`INDOOR`],cost:{xu:1,la:0},base_vp:8,location:{lat:10.7685,lng:106.678,is_virtual:!1,label:`Quận 3 - Giáp ranh Quận 10`},on_play_effect:_,rarity:`COMMON`,icon:`☕`},{card_id:`SG_FOOD_004`,name:`Phá Lấu Bò Cô Oanh`,description:`Chén phá lấu đỏ au, thơm lừng nước cốt dừa ăn kèm bánh mì nóng giòn. Ngồi ghế súp vỉa hè ngắm xe cộ qua lại đúng chất dân chơi Quận 4.`,image_url:`assets/cards/saigon/food/sg_food_004.jpg`,phase_pool:`SAIGON`,tags:[`FOOD`,`OUTDOOR`],cost:{xu:1,la:0},base_vp:5,location:{lat:10.7598,lng:106.7015,is_virtual:!1,label:`Quận 4 - Đường Tôn Đản`},on_play_effect:_,rarity:`COMMON`,icon:`🍲`},{card_id:`SG_FOOD_005`,name:`Súp Cua Chợ Tân Định`,description:`Chén súp nóng hổi, đặc ruột cạnh ngôi chợ hồng biểu tượng. Cứu đói nhanh gọn cho hành trình dài.`,image_url:`assets/cards/saigon/food/sg_food_005.jpg`,phase_pool:`SAIGON`,tags:[`FOOD`,`OUTDOOR`],cost:{xu:1,la:0},base_vp:5,location:{lat:10.7895,lng:106.6881,is_virtual:!1,label:`Quận 1 - Chợ Tân Định`},on_play_effect:_,rarity:`COMMON`,icon:`🥣`},{card_id:`SG_FOOD_006`,name:`Bánh Mì Huỳnh Hoa`,description:`Ổ bánh mì nặng trịch pate, ăn một nửa cũng đủ no. Đổi lại, bạn phải kiên nhẫn xếp hàng mua mang đi.`,image_url:`assets/cards/saigon/food/sg_food_006.jpg`,phase_pool:`SAIGON`,tags:[`FOOD`,`OUTDOOR`],cost:{xu:2,la:0},base_vp:10,location:{lat:10.7715,lng:106.6931,is_virtual:!1,label:`Quận 1 - Đường Lê Thị Riêng`},on_play_effect:_,rarity:`UNCOMMON`,icon:`🥖`},{card_id:`SG_FOOD_007`,name:`Phố Ẩm Thực Hồ Thị Kỷ`,description:`Thiên đường ăn vặt và mùi hoa tươi đan xen. Ăn no căng bụng nhưng rã rời đôi chân vì chen lấn.`,image_url:`assets/cards/saigon/food/sg_food_007.jpg`,phase_pool:`SAIGON`,tags:[`FOOD`,`OUTDOOR`],cost:{xu:2,la:1},base_vp:15,location:{lat:10.7671,lng:106.6773,is_virtual:!1,label:`Quận 10 - Chợ Hoa`},on_play_effect:_,rarity:`UNCOMMON`,icon:`🍢`},{card_id:`SG_FOOD_008`,name:`Cà Phê Chung Cư 42 Nguyễn Huệ`,description:`Trạm nghỉ chân hoài cổ nhìn ra phố đi bộ hiện đại. Nơi trú mưa hoàn hảo giữa lịch trình cạn kiệt.`,image_url:`assets/cards/saigon/food/sg_food_008.jpg`,phase_pool:`SAIGON`,tags:[`FOOD`,`INDOOR`],cost:{xu:2,la:0},base_vp:12,location:{lat:10.7743,lng:106.7031,is_virtual:!1,label:`Quận 1 - Phố đi bộ Nguyễn Huệ`},on_play_effect:_,rarity:`UNCOMMON`,icon:`☕`},{card_id:`SG_FOOD_009`,name:`Phố Sủi Cảo Hà Tôn Quyền`,description:`Tiếng gọi món rôm rả cả góc phố người Hoa. Nằm xa trung tâm nên hãy cẩn thận bẫy khoảng cách di chuyển.`,image_url:`assets/cards/saigon/food/sg_food_009.jpg`,phase_pool:`SAIGON`,tags:[`FOOD`,`OUTDOOR`],cost:{xu:2,la:0},base_vp:12,location:{lat:10.7592,lng:106.6558,is_virtual:!1,label:`Quận 11 - Khu Chợ Lớn`},on_play_effect:_,rarity:`UNCOMMON`,icon:`🥟`},{card_id:`SG_FOOD_010`,name:`Cơm Tấm Ba Ghiền`,description:`Miếng sườn nướng than to bằng cái đĩa. Trải nghiệm no nê.`,image_url:`assets/cards/saigon/food/sg_food_010.jpg`,phase_pool:`SAIGON`,tags:[`FOOD`,`INDOOR`],cost:{xu:2,la:1},base_vp:15,location:{lat:10.7951,lng:106.6781,is_virtual:!1,label:`Phú Nhuận - Cư xá Nguyễn Văn Trỗi`},on_play_effect:_,rarity:`UNCOMMON`,icon:`🍚`},{card_id:`SG_FOOD_011`,name:`Phố Ốc Vĩnh Khánh`,description:`Mùi bơ tỏi và mỡ hành nức mũi. Đại diện xuất sắc nhất cho văn hóa ăn ốc của giới trẻ thành phố.`,image_url:`assets/cards/saigon/food/sg_food_011.jpg`,phase_pool:`SAIGON`,tags:[`FOOD`,`OUTDOOR`],cost:{xu:2,la:0},base_vp:12,location:{lat:10.7601,lng:106.7029,is_virtual:!1,label:`Quận 4 - Bờ kè`},on_play_effect:_,rarity:`UNCOMMON`,icon:`🐚`},{card_id:`SG_FOOD_012`,name:`Bánh Xèo Đinh Công Tráng`,description:`Tiệm bánh xèo miền Nam truyền thống ẩn trong hẻm. Vừa giòn.`,image_url:`assets/cards/saigon/food/sg_food_012.jpg`,phase_pool:`SAIGON`,tags:[`FOOD`,`INDOOR`],cost:{xu:2,la:0},base_vp:10,location:{lat:10.7901,lng:106.689,is_virtual:!1,label:`Quận 1 - Gần chợ Tân Định`},on_play_effect:_,rarity:`UNCOMMON`,icon:`🥞`},{card_id:`SG_FOOD_013`,name:`Chè Hà Ký Chợ Lớn`,description:`Chè trứng gà trà, chè mè đen trứ danh. Điểm chốt ngọt ngào sau chuyến khám phá văn hóa phố Tàu.`,image_url:`assets/cards/saigon/food/sg_food_013.jpg`,phase_pool:`SAIGON`,tags:[`FOOD`,`INDOOR`],cost:{xu:2,la:0},base_vp:10,location:{lat:10.7516,lng:106.6622,is_virtual:!1,label:`Quận 5 - Châu Văn Liêm`},on_play_effect:_,rarity:`UNCOMMON`,icon:`🍧`},{card_id:`SG_FOOD_014`,name:`Phở Hòa Pasteur`,description:`Biểu tượng Phở miền Nam nổi tiếng với khách quốc tế. Không gian lịch sự, giá cao nhưng trải nghiệm tròn trịa.`,image_url:`assets/cards/saigon/food/sg_food_014.jpg`,phase_pool:`SAIGON`,tags:[`FOOD`,`INDOOR`],cost:{xu:3,la:0},base_vp:15,location:{lat:10.7892,lng:106.6896,is_virtual:!1,label:`Quận 3 - Đường Pasteur`},on_play_effect:_,rarity:`EPIC`,icon:`🍜`},{card_id:`SG_FOOD_015`,name:`Lẩu Cá Kèo Bà Huyện Thanh Quan`,description:`Nồi lẩu chua lá giang sôi sùng sục cùng cá kèo tươi rói. Biểu tượng nhậu lai rai cực kỳ bén mồi của người miền Nam.`,image_url:`assets/cards/saigon/food/sg_food_015.jpg`,phase_pool:`SAIGON`,tags:[`FOOD`,`INDOOR`],cost:{xu:3,la:0},base_vp:18,location:{lat:10.7785,lng:106.6858,is_virtual:!1,label:`Quận 3 - Bà Huyện Thanh Quan`},on_play_effect:_,rarity:`EPIC`,icon:`🍲`},{card_id:`SG_FOOD_017`,name:`Dimsum Tiến Phát`,description:`Bữa sáng xa xỉ kiểu Quảng Đông. Đánh đổi số tiền lớn để thu về lượng điểm khổng lồ ngay từ lúc bình minh.`,image_url:`assets/cards/saigon/food/sg_food_017.jpg`,phase_pool:`SAIGON`,tags:[`FOOD`,`INDOOR`],cost:{xu:4,la:0},base_vp:25,location:{lat:10.7538,lng:106.6631,is_virtual:!1,label:`Quận 5 - Khu Chợ Lớn`},on_play_effect:_,rarity:`EPIC`,icon:`🥟`},{card_id:`SG_FOOD_018`,name:`Nhà Hàng Chay Hum`,description:`Không gian thiền tịnh, thức ăn thanh lọc. Mọi muộn phiền tan biến, cơ thể bạn được hồi phục sinh lực hoàn toàn.`,image_url:`assets/cards/saigon/food/sg_food_018.jpg`,phase_pool:`SAIGON`,tags:[`FOOD`,`INDOOR`],cost:{xu:4,la:0},base_vp:15,location:{lat:10.7811,lng:106.6914,is_virtual:!1,label:`Quận 3 - Võ Văn Tần`},on_play_effect:{has_effect:!0,effect_type:`RECOVER_LA`,effect_value:1},rarity:`EPIC`,icon:`🥗`},{card_id:`SG_FOOD_019`,name:`Ăn Tối Du Thuyền Sông Sài Gòn`,description:`Thưởng thức bít tết và rượu vang trôi dọc dòng sông rực sáng ánh đèn. Trải nghiệm đắt đỏ nhưng xứng đáng từng đồng.`,image_url:`assets/cards/saigon/food/sg_food_019.jpg`,phase_pool:`SAIGON`,tags:[`FOOD`,`ACTION`],cost:{xu:5,la:0},base_vp:35,location:{lat:10.763,lng:106.7071,is_virtual:!1,label:`Quận 4 - Bến cảng Nhà Rồng`},on_play_effect:_,rarity:`LEGENDARY`,icon:`⛴️`},{card_id:`SG_FOOD_020`,name:`Tầng 79 Landmark 81`,description:`Bữa ăn trên đỉnh bầu trời Sài Gòn. Bạn đốt ngót nghét 60% ngân sách khởi điểm để giáng đòn chí mạng về điểm số.`,image_url:`assets/cards/saigon/food/sg_food_020.jpg`,phase_pool:`SAIGON`,tags:[`FOOD`,`INDOOR`],cost:{xu:6,la:0},base_vp:45,location:{lat:10.795,lng:106.7218,is_virtual:!1,label:`Bình Thạnh - Vinhomes Central Park`},on_play_effect:_,rarity:`LEGENDARY`,icon:`🏙️`},{card_id:`SG_FOOD_021`,name:`Cơm Quê Dượng Bầu`,description:`Mâm cơm quê mộc mạc với trứng chiên, canh chua nhưng được phục vụ trong không gian sang trọng bậc nhất. Trải nghiệm tìm về tuổi thơ nhưng với một cái giá của người trưởng thành.`,image_url:`assets/cards/saigon/food/sg_food_021.jpg`,phase_pool:`SAIGON`,tags:[`FOOD`,`INDOOR`],cost:{xu:5,la:0},base_vp:35,location:{lat:10.7725,lng:106.6901,is_virtual:!1,label:`Khu vực trung tâm`},on_play_effect:_,rarity:`LEGENDARY`,icon:`🍚`}];function be(e){return e.includes(`FOOD`)?`FOOD`:e.includes(`CULTURE`)?`CULTURE`:e.includes(`ACTION`)?`ACTION`:e.includes(`UTILITY`)?`UTILITY`:e[0]??`FOOD`}function xe(e){switch(e){case`FOOD`:return`Ẩm thực`;case`CULTURE`:return`Văn hóa`;case`ACTION`:return`Khám phá`;case`UTILITY`:return`Tiện ích`;case`OUTDOOR`:return`Ngoài trời`;case`INDOOR`:return`Trong nhà`;default:return`Khác`}}function Se(e){switch(e){case`COMMON`:return`★`;case`UNCOMMON`:return`★★`;case`EPIC`:return`★★★★`;case`LEGENDARY`:return`★★★★★`;default:return`★`}}function Ce(e){switch(e){case`COMMON`:return`common`;case`UNCOMMON`:return`uncommon`;case`EPIC`:return`epic`;case`LEGENDARY`:return`legendary`;default:return`common`}}function we(e){if(e.on_play_effect.has_effect){if(e.on_play_effect.effect_type===`RECOVER_LA`)return`Khi đặt xuống: hồi ${e.on_play_effect.effect_value} thể lực`;if(e.on_play_effect.effect_type===`RECOVER_XU`)return`Khi đặt xuống: hồi ${e.on_play_effect.effect_value} xu`;if(e.on_play_effect.effect_type===`GAIN_VP`)return`Khi đặt xuống: +${e.on_play_effect.effect_value} VP`}return e.tags.includes(`FOOD`)?`Nếu có 2 lá Ẩm thực: +5 VP`:e.tags.includes(`CULTURE`)?`Nếu có 2 lá Văn hóa: +8 VP`:e.tags.includes(`ACTION`)?`Nếu đặt sau lá Khám phá: +10 VP`:`Không có hiệu ứng đặc biệt`}function Te(e){let t=e.trim(),n={"Cà Phê Bệt Nhà Thờ Đức Bà":`Cà Phê Bệt`,"Bánh Tráng Nướng Hồ Con Rùa":`Bánh Tráng`,"Cà Phê Vợt Cheo Leo":`Cà Phê Vợt`,"Phá Lấu Bò Cô Oanh":`Phá Lấu`,"Súp Cua Chợ Tân Định":`Súp Cua`,"Bánh Mì Huỳnh Hoa":`Bánh Mì`,"Phố Ẩm Thực Hồ Thị Kỷ":`Hồ Thị Kỷ`,"Cà Phê Chung Cư 42 Nguyễn Huệ":`Cà Phê 42`,"Phố Sủi Cảo Hà Tôn Quyền":`Sủi Cảo`,"Cơm Tấm Ba Ghiền":`Cơm Tấm`,"Phố Ốc Vĩnh Khánh":`Ốc Vĩnh Khánh`,"Bánh Xèo Đinh Công Tráng":`Bánh Xèo`,"Chè Hà Ký Chợ Lớn":`Chè Hà Ký`,"Phở Hòa Pasteur":`Phở Hòa`,"Lẩu Cá Kèo Bà Huyện Thanh Quan":`Lẩu Cá Kèo`,"Dimsum Tiến Phát":`Dimsum`,"Nhà Hàng Chay Hum":`Chay Hum`,"Ăn Tối Du Thuyền Sông Sài Gòn":`Du Thuyền Tối`,"Tầng 79 Landmark 81":`Landmark 81`,"Cơm Quê Dượng Bầu":`Dượng Bầu`,"Du Thuyền Hạ Long":`Du Thuyền`,"Chợ Đêm Đà Lạt":`Chợ Đêm`};if(n[t])return n[t];if(t.length<=14)return t;let r=t.split(/\s+/);return r.length<=3?t:r.slice(0,3).join(` `)}function Ee(e){let t=e.trim(),n={"Quận 1 - Công viên 30/4":`Q.1`,"Quận 3 - Vòng xoay Công trường Quốc Tế":`Q.3`,"Quận 3 - Giáp ranh Quận 10":`Q.3`,"Quận 4 - Đường Tôn Đản":`Q.4`,"Quận 1 - Chợ Tân Định":`Q.1`,"Quận 1 - Đường Lê Thị Riêng":`Q.1`,"Quận 10 - Chợ Hoa":`Q.10`,"Quận 1 - Phố đi bộ Nguyễn Huệ":`Q.1`,"Quận 11 - Khu Chợ Lớn":`Q.11`,"Phú Nhuận - Cư xá Nguyễn Văn Trỗi":`Phú Nhuận`,"Quận 4 - Bờ kè":`Q.4`,"Quận 1 - Gần chợ Tân Định":`Q.1`,"Quận 5 - Châu Văn Liêm":`Q.5`,"Quận 3 - Đường Pasteur":`Q.3`,"Quận 3 - Bà Huyện Thanh Quan":`Q.3`,"Quận 5 - Khu Chợ Lớn":`Q.5`,"Quận 3 - Võ Văn Tần":`Q.3`,"Quận 4 - Bến cảng Nhà Rồng":`Q.4`,"Bình Thạnh - Vinhomes Central Park":`Bình Thạnh`,"Khu vực trung tâm":`Trung tâm`,"Sài Gòn":`Sài Gòn`,"Hà Nội":`Hà Nội`,"Đà Lạt":`Đà Lạt`,"Đà Nẵng":`Đà Nẵng`,"Quảng Ninh":`Quảng Ninh`};if(n[t])return n[t];if(t.length<=12)return t;if(t.includes(`Quận`)){let e=t.match(/Quận\s*\d+/i);if(e)return e[0].replace(`Quận`,`Q.`)}return t.slice(0,12).trim()+`...`}function De(e){let t=be(e.tags),n=e.location.label??e.phase_pool;return{id:e.card_id,name:e.name,shortName:Te(e.name),city:n,shortCity:Ee(n),image:e.image_url,rarity:Ce(e.rarity),rarityLabel:Se(e.rarity),vp:e.base_vp,coin:e.cost.xu,stamina:e.cost.la,tag:t.toLowerCase(),tagLabel:xe(t),tags:e.tags,onPlayEffect:e.on_play_effect,icon:e.icon,description:e.description,bonusText:we(e)}}var v=[1,2,3,4,5],Oe=[`Sáng`,`Trưa`,`Chiều`,`Tối`,`Khuya`];function ke(){return Oe.map(()=>v.map(()=>null))}function Ae(e,t){let n=[];for(let r=0;r<Oe.length;r+=1){let i=e[r]?.[t]??null;i&&n.push(i)}return n}function je(e,t,n){return e[t]?.[n]??null}function Me(e){return e.tags&&e.tags.length>0?e.tags.map(e=>e.toUpperCase()):[e.tag.toUpperCase()]}function Ne(e,t){return e.filter(e=>Me(e).includes(t)).length}function Pe(){return 1}function Fe(e,t=Pe()){return e[t]}function Ie({placedCards:e,getBoardDisplayName:t}){let n=e.reduce((e,t)=>e+t.vp,0),r=e.reduce((e,t)=>e+t.coin,0),i=e.reduce((e,t)=>e+t.stamina,0),a=[],o=0,s=Ze(e,`FOOD`),c=Ze(e,`CULTURE`),l=Ze(e,`ACTION`);s>=2&&(o+=5,a.push(`Combo Ẩm thực x${s}: +5 VP`)),c>=2&&(o+=8,a.push(`Combo Văn hóa x${c}: +8 VP`)),l>=2&&(o+=10,a.push(`Chuỗi Khám phá x${l}: +10 VP`));for(let n of e){let e=n.onPlayEffect;e?.has_effect&&e.effect_type===`GAIN_VP`&&(o+=e.effect_value,a.push(`${t(n)}: +${e.effect_value} VP`))}return a.length===0&&a.push(`Chưa có bonus nào được kích hoạt`),{baseVP:n,bonusVP:o,totalVP:n+o,spentCoin:r,spentStamina:i,usedSlots:e.length,lines:a}}function Le(e){return e?.boardTokenType??null}function Re(e){return Le(e)===`debt`}function ze(e){return Le(e)===`lock`}function Be(e){return e?.debtAmount??0}function Ve({boardSlots:e,currentDayIndex:t,dayLabel:n,rows:r,getCardTagKeys:i,countCardsWithTag:a,getCurrentDayPlacedCards:o}){let s=[],c=t,l={dayIndex:c,label:n,vp:0,steps:0},u=o(c),d=null;for(let t=0;t<r.length;t+=1){let o=e[t]?.[c]??null,f=r[t];if(!o){s.push({id:`empty_${c}_${t}`,dayIndex:c,rowIndex:t,dayLabel:n,timeLabel:f,title:`Không có hoạt động`,subtitle:`Không có hoạt động, xem như thời gian nghỉ / di chuyển.`,vpDelta:0,coinDelta:0,staminaDelta:0,isEmpty:!0});continue}if(Re(o)){l.vp+=-20,l.steps+=1,s.push({id:o.id,dayIndex:c,rowIndex:t,dayLabel:n,timeLabel:f,title:`Token nợ`,subtitle:`Nợ tiền ${Be(o)} xu`,vpDelta:-20,coinDelta:0,staminaDelta:0,isDebtPenalty:!0,isBoardToken:!0});continue}if(ze(o)){s.push({id:o.id,dayIndex:c,rowIndex:t,dayLabel:n,timeLabel:f,title:`Bị khóa`,subtitle:`Kiệt sức, không thể xếp hoạt động.`,vpDelta:0,coinDelta:0,staminaDelta:0,isBoardToken:!0});continue}let p=i(o),m=``;p.includes(`FOOD`)&&a(u,`FOOD`)>=2?m=`Combo Ẩm thực đang kích hoạt`:p.includes(`CULTURE`)&&a(u,`CULTURE`)>=2?m=`Combo Văn hóa đang kích hoạt`:p.includes(`ACTION`)&&a(u,`ACTION`)>=2&&(m=`Chuỗi Khám phá đang kích hoạt`);let h=We(o,c,t),g=(d?qe(d,o,c,t):null)??h,ee=g?.vpDelta??0,te=g?.staminaDelta??0,ne=o.vp+ee;l.vp+=ne,l.steps+=1,s.push({id:o.id,dayIndex:c,rowIndex:t,dayLabel:n,timeLabel:f,title:o.name,subtitle:`${o.city} • ${o.tagLabel}`,vpDelta:ne,coinDelta:-o.coin,staminaDelta:-o.stamina+te,comboText:m,eventText:g?.text,eventType:g?.type,eventVpDelta:ee,eventStaminaDelta:te,distanceKm:g?.distanceKm,isBadEvent:g?.isBad===!0}),d=o}return{steps:s,daySummaries:[l]}}function He({boardSlots:e,currentDayIndex:t,dayLabel:n,rows:r,getBoardDisplayName:i,getCardTagKeys:a,countCardsWithTag:o,getCurrentDayPlacedCards:s}){let c=Ie({placedCards:s(),getBoardDisplayName:i}),l=[],u=[],{steps:d,daySummaries:f}=Ve({boardSlots:e,currentDayIndex:t,dayLabel:n,rows:r,getCardTagKeys:a,countCardsWithTag:o,getCurrentDayPlacedCards:s}),p=d.reduce((e,t)=>t.isDebtPenalty?e+Math.abs(t.vpDelta):e,0),m=d.reduce((e,t)=>t.eventType===`promo`||t.eventType===`storm`?e+(t.eventVpDelta??0):e,0),h=d.reduce((e,t)=>t.eventType===`distance`?e+Math.abs(t.eventVpDelta??0):e,0);c.usedSlots===0&&l.push(`Chưa có thẻ nào trên lịch trình.`),c.usedSlots>0&&c.bonusVP===0&&l.push(`Lịch trình chưa kích hoạt combo nào.`);for(let n=0;n<e.length;n+=1)e[n].filter((e,n)=>n===t).filter(e=>e!==null).length>=4&&l.push(`${r[n]} có lịch dày, nên chừa ô nghỉ/di chuyển.`);l.length===0&&l.push(`Lịch trình hiện tại ổn để mô phỏng MVP.`);for(let e of d)e.eventText&&u.push(`${e.timeLabel}: ${e.eventText}`);u.length===0&&u.push(`Không có event phát sinh trong ngày này.`);let g=d.reduce((e,t)=>e+t.vpDelta,0)+c.bonusVP;return Object.assign(Object.assign({},c),{debtPenalty:p,eventModifier:m,distancePenalty:h,finalVP:g,warnings:l,events:u,replaySteps:d,daySummaries:f,lines:[...c.lines,`Debt penalty: -${p} VP`,`Event modifier: ${m>=0?`+`:``}${m} VP`,`Distance penalty: -${h} VP`,`Final VP: ${g}`]})}function Ue(e){let t=2166136261;for(let n=0;n<e.length;n+=1)t^=e.charCodeAt(n),t=Math.imul(t,16777619);return(t>>>0)/4294967295}function We(e,t,n){if(Ue(`${e.id}|${t}|${n}|scan-event`)>=.15)return null;let r=Ue(`${e.id}|${t}|${n}|event-type`);return r<1/3?{type:`promo`,text:`Khuyến mãi: +10 VP`,vpDelta:10,staminaDelta:0,isBad:!1}:r<2/3?{type:`traffic`,text:`Kẹt xe: -8 thể lực`,vpDelta:0,staminaDelta:-8,isBad:!0}:{type:`storm`,text:`Mưa giông: -10 VP`,vpDelta:-10,staminaDelta:0,isBad:!0}}function Ge(e){let t=e;return typeof t.lat==`number`&&typeof t.lng==`number`?{lat:t.lat,lng:t.lng}:t.location&&typeof t.location==`object`&&typeof t.location.lat==`number`&&typeof t.location.lng==`number`?{lat:t.location.lat,lng:t.location.lng}:null}function Ke(e,t,n,r){let i=Ge(e),a=Ge(t);return i&&a?Je(i,a):e.city===t.city?4+Math.round(Ue(`${e.id}|${t.id}|same-city|${n}|${r}`)*12):22+Math.round(Ue(`${e.id}|${t.id}|distance`)*18)}function qe(e,t,n,r){let i=Ke(e,t,n,r);return i<=20?null:{type:`distance`,text:`Khoảng cách > 20km`,vpDelta:-30,staminaDelta:0,distanceKm:i,isBad:!0}}function Je(e,t){let n=Ye(t.lat-e.lat),r=Ye(t.lng-e.lng),i=Ye(e.lat),a=Ye(t.lat),o=Math.sin(n/2)**2+Math.cos(i)*Math.cos(a)*Math.sin(r/2)**2;return Math.round(6371*2*Math.atan2(Math.sqrt(o),Math.sqrt(1-o)))}function Ye(e){return e*Math.PI/180}function Xe(e){return e.tags&&e.tags.length>0?e.tags.map(e=>e.toUpperCase()):[e.tag.toUpperCase()]}function Ze(e,t){return e.filter(e=>Xe(e).includes(t)).length}function Qe({cards:e,fallbackCards:t,handSize:n}){return e.length>=n?e:[...e,...t.slice(0,n-e.length)]}function $e(e){let t=[...e];for(let e=t.length-1;e>0;--e){let n=Math.floor(Math.random()*(e+1)),r=t[e];t[e]=t[n],t[n]=r}return t}function et({deck:e,playerHand:t,shuffleCards:n}){return t.length===0?{deck:e,playerHand:t}:{deck:n([...e,...t]),playerHand:[]}}function tt({totals:e,startingCoin:t,startingStamina:n}){return{coin:Math.max(0,t-e.coin),stamina:Math.max(0,n-e.stamina)}}function nt({card:e,remaining:t}){let n=Math.max(0,e.coin-t.coin),r=Math.max(0,e.stamina-t.stamina);return{canAfford:n===0&&r===0,missingCoin:n,missingStamina:r}}function rt(e){let t=[];return e.missingCoin>0&&t.push(`thiếu ${e.missingCoin} xu`),e.missingStamina>0&&t.push(`thiếu ${e.missingStamina} thể lực`),t.length===0?`Đủ tài nguyên để đặt lá này`:`Không đủ tài nguyên: ${t.join(`, `)}`}var it={deal:`assets/sounds/card-deal.mp3`,returnDeck:`assets/sounds/card-return-deck.mp3`,cardSelect:`assets/sounds/card-select.mp3`,cardPlace:`assets/sounds/card-place.mp3`,button:`assets/sounds/ui-click.mp3`,scanCell:`assets/sounds/scan-cell.mp3`,scanBad:`assets/sounds/scan-bad.mp3`,eventTraffic:`assets/sounds/event-traffic.mp3`,eventDistance:`assets/sounds/event-distance.mp3`,eventStorm:`assets/sounds/event-storm.mp3`,eventPromo:`assets/sounds/event-promo.mp3`},at=null,ot=!1,st=0,ct=0,lt=0,ut=0,dt={},ft={},pt={};function mt(){let e=window.AudioContext??window.webkitAudioContext;return e?(at||=new e,at):null}function y(e){if(!dt[e]){let t=new Audio(it[e]);t.preload=`auto`,t.crossOrigin=`anonymous`,t.volume={deal:.78,returnDeck:.68,cardSelect:.82,cardPlace:.76,button:.6,scanCell:.62,scanBad:.72,eventTraffic:.62,eventDistance:.72,eventStorm:.7,eventPromo:.74}[e],t.playbackRate={deal:1.08,returnDeck:1,cardSelect:1.08,cardPlace:.95,button:1.05,scanCell:1.14,scanBad:.96,eventTraffic:1.06,eventDistance:1.02,eventStorm:1,eventPromo:1.08}[e],dt[e]=t}return dt[e]}function ht(){let e=mt();e?.state===`suspended`&&e.resume(),y(`deal`).load(),y(`returnDeck`).load(),y(`cardSelect`).load(),y(`cardPlace`).load(),y(`button`).load(),y(`scanCell`).load(),y(`scanBad`).load(),y(`eventTraffic`).load(),y(`eventDistance`).load(),y(`eventStorm`).load(),y(`eventPromo`).load(),ot=!0}function b(e,t){var n;if(!ot)return;t?.exclusive&&((n=ft[e])==null||n.pause(),ft[e]=void 0,pt[e]!==void 0&&(window.clearTimeout(pt[e]),pt[e]=void 0));let r=y(e),i=r.cloneNode(!0);i.volume=t?.volume??r.volume,i.playbackRate=t?.playbackRate??r.playbackRate,i.currentTime=t?.startTime??0,t?.exclusive&&(ft[e]=i),i.play().catch(()=>{}),t?.durationMs!==void 0&&(pt[e]=window.setTimeout(()=>{i.pause(),ft[e]=void 0,pt[e]=void 0},t.durationMs))}function gt(e,t){let n=e.createGain();return n.gain.setValueAtTime(Math.max(1e-4,t),e.currentTime),n.connect(e.destination),n}function _t(e,t,n=1){let r=e.sampleRate,i=Math.max(1,Math.floor(r*t)),a=e.createBuffer(1,i,r),o=a.getChannelData(0),s=0,c=0;for(let e=0;e<i;e+=1){let t=e/i,r=Math.min(1,t/.045),a=(1-t)**2.05,l=Math.random()*2-1;s=(s+.035*l)/1.035,Math.random()>.985?c=(Math.random()*2-1)*.65*n:c*=.82,o[e]=(l*.55+s*5.8+c*.42)*r*a}return a}function vt(e){let t=mt();if(!t||!ot)return;let n=e.duration??.11,r=e.startDelay??0,i=e.volume??.06,a=t.currentTime+r,o=t.createBufferSource(),s=t.createBiquadFilter(),c=t.createBiquadFilter(),l=t.createBiquadFilter(),u=gt(t,i),d=t.createStereoPanner?.call(t);o.buffer=_t(t,n,e.roughness??1),o.playbackRate.setValueAtTime(e.playbackRate??1,a),s.type=`highpass`,s.frequency.setValueAtTime(e.highpass??240,a),s.Q.setValueAtTime(.55,a),l.type=`bandpass`,l.frequency.setValueAtTime(e.bandpass??1800,a),l.Q.setValueAtTime(.85,a),c.type=`lowpass`,c.frequency.setValueAtTime(e.lowpass??4200,a),c.Q.setValueAtTime(.6,a),u.gain.setValueAtTime(1e-4,a),u.gain.linearRampToValueAtTime(i,a+n*.12),u.gain.exponentialRampToValueAtTime(1e-4,a+n),o.connect(s),s.connect(l),l.connect(c),d?(d.pan.setValueAtTime(e.pan??0,a),c.connect(d),d.connect(u)):c.connect(u),o.start(a),o.stop(a+n+.02)}function yt(e=0,t=.05){vt({duration:.045,volume:t,startDelay:e,highpass:55,bandpass:260,lowpass:900,playbackRate:.72,roughness:.55})}function x(e){let t=performance.now();if(e===`button`){if(t-st<35)return;st=t,b(`button`,{volume:.72,playbackRate:1.06,startTime:0,durationMs:260,exclusive:!0});return}if(e===`cardSelect`){if(t-ct<80)return;ct=t,b(`cardSelect`,{volume:.84,playbackRate:1.06,startTime:.02});return}if(e===`cardPlace`){b(`cardPlace`,{volume:.86,playbackRate:.98,startTime:.01,durationMs:420,exclusive:!0});return}if(e===`deal`){if(t-lt<430)return;lt=t,b(`deal`,{volume:.82,playbackRate:1.12,startTime:.08});return}if(e===`returnDeck`){if(t-ut<850)return;ut=t,b(`returnDeck`,{volume:.72,playbackRate:1.02,startTime:.02,durationMs:520,exclusive:!0});return}if(e===`scanCell`){b(`scanCell`,{volume:.62,playbackRate:1.14,startTime:0,durationMs:260,exclusive:!0});return}if(e===`scanBad`){b(`scanBad`,{volume:.76,playbackRate:.96,startTime:0,durationMs:420,exclusive:!0});return}if(e===`eventTraffic`){b(`eventTraffic`,{volume:.62,playbackRate:1.06,startTime:0,durationMs:980,exclusive:!0});return}if(e===`eventDistance`){b(`eventDistance`,{volume:.72,playbackRate:1.02,startTime:0,durationMs:650,exclusive:!0});return}if(e===`eventStorm`){b(`eventStorm`,{volume:.7,playbackRate:1,startTime:0,durationMs:1120,exclusive:!0});return}if(e===`eventPromo`){b(`eventPromo`,{volume:.74,playbackRate:1.08,startTime:0,durationMs:820,exclusive:!0});return}e===`reject`&&(vt({duration:.06,volume:.055,highpass:90,bandpass:420,lowpass:1100,playbackRate:.7,roughness:.8}),yt(.05,.045))}function bt(){document.addEventListener(`pointerdown`,e=>{ht();let t=e.target;if(!t)return;let n=!!t.closest(`[data-hand-card-id], [data-draft-card-id], .hand-card, .daily-draft-card`),r=t.closest(`.board-mini`);if(!n){if(r){x(`cardSelect`);return}x(`button`)}},!0)}var xt=function(e,t,n,r){function i(e){return e instanceof n?e:new n(function(t){t(e)})}return new(n||=Promise)(function(n,a){function o(e){try{c(r.next(e))}catch(e){a(e)}}function s(e){try{c(r.throw(e))}catch(e){a(e)}}function c(e){e.done?n(e.value):i(e.value).then(o,s)}c((r=r.apply(e,t||[])).next())})},St=`travel_board_certificate_history`;function Ct(e){return e.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu,`-`).replace(/^-+|-+$/g,``).slice(0,64)||`lich-trinh`}function wt(){let e=q(),t=rr(),n=or(),r=new Date().toISOString(),i=v.map((t,n)=>({day:t,label:`Ngày ${t}`,slots:Oe.map((t,r)=>{let i=e[r]?.[n]??null;return{timeLabel:t,card:i?{id:i.id,name:i.name,city:i.city,tag:i.tag,tagLabel:i.tagLabel,vp:i.vp,coin:i.coin,stamina:i.stamina,description:i.description}:null}})}));return{version:1,createdAt:r,playerName:sn(),phaseNumber:T,currentDay:v[E],score:{baseVP:t.baseVP,bonusVP:t.bonusVP,totalVP:U?.finalVP??t.totalVP,accumulatedVP:D},resources:{spentCoin:t.spentCoin,spentStamina:t.spentStamina,remainingCoin:n.coin,remainingStamina:n.stamina,usedSlots:t.usedSlots},timeline:i}}function Tt(){return`${St}:${d.roomId??`local`}:${d.playerId??`p1`}`}function Et(){try{let e=localStorage.getItem(Tt());if(!e)return[];let t=JSON.parse(e);return Array.isArray(t)?t:[]}catch{return[]}}function Dt(e){localStorage.setItem(Tt(),JSON.stringify(e))}function Ot(e){if(e.length===0)return`Chưa có dữ liệu`;let t=new Map;for(let n of e){let e=n.tag||`unknown`,r=t.get(e)??{label:n.tagLabel||n.tag||`Khác`,count:0};r.count+=1,t.set(e,r)}let n=[...t.values()].sort((e,t)=>t.count-e.count);return n.length>=2&&n[0].count===n[1].count?`Kết hợp`:n[0]?.label??`Kết hợp`}function kt(e=T){let t=q(),n=v.map((e,n)=>({day:e,label:`Ngày ${e}`,slots:Oe.map((e,r)=>{let i=t[r]?.[n]??null;return{timeLabel:e,card:i?{id:i.id,name:i.name,city:i.city,tag:i.tag,tagLabel:i.tagLabel,vp:i.vp,coin:i.coin,stamina:i.stamina,description:i.description}:null}})})),r=[];for(let e of n)for(let t of e.slots)t.card&&r.push(t.card);let i=n.filter(e=>e.slots.some(e=>e.card!==null)).length,a=r.length;return{phaseNumber:e,phaseScore:r.reduce((e,t)=>e+t.vp,0),completedDays:i,completedSlots:a,styleLabel:Ot(r),days:n,updatedAt:new Date().toISOString()}}function At(){if(!C()||!d.roomState||d.roomState.phase===`lobby`||d.roomState.phase===`draft`)return;let e=kt(T);if(e.completedSlots<=0)return;let t=Et().filter(t=>t.phaseNumber!==e.phaseNumber);t.push(e),t.sort((e,t)=>e.phaseNumber-t.phaseNumber),Dt(t)}function jt(){At();let e=Et(),t=kt(T),n=e.filter(e=>e.phaseNumber!==t.phaseNumber);t.completedSlots>0&&n.push(t),n.sort((e,t)=>e.phaseNumber-t.phaseNumber);let r=[1,2,3].map(e=>n.find(t=>t.phaseNumber===e)??{phaseNumber:e,phaseScore:0,completedDays:0,completedSlots:0,styleLabel:`Chưa hoàn thành`,days:v.map(e=>({day:e,label:`Ngày ${e}`,slots:Oe.map(e=>({timeLabel:e,card:null}))})),updatedAt:new Date().toISOString()}),i=r.reduce((e,t)=>e+t.phaseScore,0),a=r.filter(e=>e.completedSlots>0).length,o=r.reduce((e,t)=>e+t.completedSlots,0),s=r.reduce((e,t)=>e+t.completedDays,0);return{version:1,exportedAt:new Date().toISOString(),playerName:sn(),roomId:d.roomId??`LOCAL`,totalScore:i,completedPhaseCount:a,completedDays:s,completedSlots:o,phases:r}}function Mt(){let e=jt(),t=JSON.stringify(e).replace(/</g,`\\u003c`);return`<!doctype html>
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
</html>`}function Nt(){Ft(`${Ct(`${jt().playerName}-chung-nhan-hanh-trinh-3-phase`)}.html`,Mt(),`text/html;charset=utf-8`)}function Pt(){let e=wt(),t=[];t.push(`LỮ KHÁCH BÀN CỜ - LỊCH TRÌNH DU LỊCH`),t.push(`Người chơi: ${e.playerName}`),t.push(`Phase: ${e.phaseNumber}`),t.push(`Ngày xuất: ${new Date(e.createdAt).toLocaleString(`vi-VN`)}`),t.push(``),t.push(`TỔNG KẾT`),t.push(`- Điểm ngày: ${e.score.totalVP} VP`),t.push(`- Tổng phase hiện tại: ${e.score.accumulatedVP} VP`),t.push(`- Xu đã dùng: ${e.resources.spentCoin}`),t.push(`- Thể lực đã dùng: ${e.resources.spentStamina}`),t.push(`- Slot đã dùng: ${e.resources.usedSlots}/25`),t.push(``);for(let n of e.timeline)if(n.slots.some(e=>e.card!==null)){t.push(n.label.toUpperCase());for(let e of n.slots){if(!e.card){t.push(`- ${e.timeLabel}: Nghỉ / Di chuyển`);continue}t.push(`- ${e.timeLabel}: ${e.card.name} (${e.card.city||`Không rõ khu vực`})`),t.push(`  Tag: ${e.card.tagLabel||e.card.tag} • VP: ${e.card.vp} • Xu: ${e.card.coin} • Thể lực: ${e.card.stamina}`),e.card.description&&t.push(`  Ghi chú: ${e.card.description}`)}t.push(``)}return t.join(`
`)}function Ft(e,t,n){let r=new Blob([t],{type:n}),i=URL.createObjectURL(r),a=document.createElement(`a`);a.href=i,a.download=e,document.body.appendChild(a),a.click(),a.remove(),URL.revokeObjectURL(i)}function It(e){let t=wt(),n=Ct(`${t.playerName}-phase-${t.phaseNumber}-lich-trinh`);if(e===`json`){Ft(`${n}.json`,JSON.stringify(t,null,2),`application/json;charset=utf-8`);return}Ft(`${n}.txt`,Pt(),`text/plain;charset=utf-8`)}function Lt(){return xt(this,void 0,void 0,function*(){let e=Pt();try{yield navigator.clipboard.writeText(e),alert(`Đã copy lịch trình vào clipboard.`)}catch{prompt(`Copy lịch trình:`,e)}})}var Rt=function(e,t,n,r){function i(e){return e instanceof n?e:new n(function(t){t(e)})}return new(n||=Promise)(function(n,a){function o(e){try{c(r.next(e))}catch(e){a(e)}}function s(e){try{c(r.throw(e))}catch(e){a(e)}}function c(e){e.done?n(e.value):i(e.value).then(o,s)}c((r=r.apply(e,t||[])).next())})},zt=document.getElementById(`app`),Bt=[{id:`p2`,rank:3,name:`Cường`,score:180,coin:890,stamina:20,usedSlots:3},{id:`p1`,rank:1,name:`An`,score:0,coin:3,stamina:2,usedSlots:0,active:!0}],Vt=[{id:`p3`,rank:3,name:`Minh`,score:190,coin:720,stamina:15,usedSlots:3},{id:`p4`,rank:3,name:`Khánh`,score:240,coin:720,stamina:15,usedSlots:3}],S={coffee:`https://images.unsplash.com/photo-1517701550927-30cf4ba1f0d5?auto=format&fit=crop&w=1000&q=80`,bridge:`https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=80`,sea:`https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80`,food:`https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1000&q=80`,market:`https://images.unsplash.com/photo-1563492065599-3520f775eeed?auto=format&fit=crop&w=1000&q=80`,night:`https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1000&q=80`,temple:`https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1000&q=80`},Ht=[{id:`fallback_coffee`,name:`Cà Phê Trứng`,shortName:`Cà Phê Trứng`,city:`Hà Nội`,shortCity:`Hà Nội`,image:S.coffee,rarity:`uncommon`,rarityLabel:`★★`,vp:12,coin:30,stamina:5,tag:`food`,tagLabel:`Ẩm thực`,icon:`☕`,description:`Một ly cà phê trứng béo mịn, rất hợp để mở đầu hành trình khám phá phố cổ Hà Nội.`,bonusText:`Nếu có 2 tag Ẩm thực: +5 VP`},{id:`fallback_bridge`,name:`Cầu Vàng`,shortName:`Cầu Vàng`,city:`Đà Nẵng`,shortCity:`Đà Nẵng`,image:S.bridge,rarity:`epic`,rarityLabel:`★★★★`,vp:45,coin:150,stamina:35,tag:`culture`,tagLabel:`Văn hóa`,icon:`🏛️`,description:`Băng qua cây cầu trên mây với khung cảnh ngoạn mục, một điểm đến có giá trị cao.`,bonusText:`Nếu có 3 tag Văn hóa: +15 VP`},{id:`fallback_cruise`,name:`Du Thuyền Hạ Long`,shortName:`Du Thuyền`,city:`Quảng Ninh`,shortCity:`Quảng Ninh`,image:S.sea,rarity:`legendary`,rarityLabel:`★★★★★`,vp:85,coin:400,stamina:60,tag:`nature`,tagLabel:`Thiên nhiên`,icon:`⛵`,description:`Khám phá vịnh Hạ Long giữa những dãy núi đá vôi kỳ vĩ, điểm cao nhưng tốn tài nguyên.`,bonusText:`Nếu có 4 lá khác nhau: +30 VP`},{id:`fallback_banhmi`,name:`Bánh Mì Huỳnh Hoa`,shortName:`Bánh Mì`,city:`Sài Gòn`,shortCity:`Sài Gòn`,image:S.food,rarity:`common`,rarityLabel:`★`,vp:14,coin:28,stamina:4,tag:`food`,tagLabel:`Ẩm thực`,icon:`🥖`,description:`Một món ăn đường phố nổi tiếng, rẻ, dễ ghép combo với các điểm ẩm thực khác.`,bonusText:`Nếu đi cùng 1 lá Ẩm thực khác: +4 VP`},{id:`fallback_night_market`,name:`Chợ Đêm Đà Lạt`,shortName:`Chợ Đêm`,city:`Đà Lạt`,shortCity:`Đà Lạt`,image:S.night,rarity:`common`,rarityLabel:`★`,vp:15,coin:32,stamina:6,tag:`night`,tagLabel:`Buổi tối`,icon:`🌙`,description:`Không khí nhộn nhịp về đêm, phù hợp nối chuỗi lịch trình tối và tạo điểm ổn định.`,bonusText:`Nếu đi sau 1 lá buổi Tối: +6 VP`}];function Ut(e){return e.image&&e.image.trim().length>0?e:Object.assign(Object.assign({},e),{image:S.food})}function Wt(){return Qe({cards:ye.map(De).map(Ut),fallbackCards:Ht,handSize:5})}function Gt(e){return $e(e)}function Kt(){let e=et({deck:An,playerHand:k,shuffleCards:Gt});An=e.deck,k=e.playerHand}function qt(){return`Ngày ${v[E]}`}function Jt(){return`Phase ${T}`}function C(){return!!(d.roomId&&d.playerId&&d.roomState)}function Yt(){return d.roomState?.phase===`gameover`}function Xt(){let e=d.roomState;return e?w.map(t=>{let n=e.players[t];return{playerId:t,name:n.name,score:n.score,coin:n.coin,stamina:n.stamina,usedSlots:n.usedSlots,isConnected:n.isConnected}}).sort((e,t)=>t.score===e.score?t.coin===e.coin?t.stamina-e.stamina:t.coin-e.coin:t.score-e.score):[]}function Zt(){return d.roomState?.self??null}function Qt(){return Zt()?.draftPool??null}function $t(){return C()?Q??Qt():null}function en(e){return(e??[]).map(e=>e.id).join(`,`)}function tn(){let e=Qt();Q=e?[...e]:null,ia=null}function nn(){return Zt()?.hand??null}function rn(){return Zt()?.selectedDraftCardId??null}function an(){return rn()??M}function on(e){return!e||!d.roomState?null:d.roomState.players[e]??null}function sn(){return on(d.playerId??`p1`)?.name??`Player`}function cn(){return`${Jt()} • ${qt()}`.toUpperCase()}function ln(){let e=d.playerId;return!e||!d.roomState?null:d.roomState.players[e]??null}function un(){let e=d.roomState;return e?w.map(t=>e.players[t]).filter(e=>e.isConnected):[]}function dn(){let e=d.roomState;if(!e||e.phase!==`lobby`||d.playerId!==`p1`)return!1;let t=un();return t.length>0&&t.every(e=>e.isReady)}function fn(){let e=m();return`
    <main class="online-entry-screen">
      <section class="online-entry-card">
        <div class="online-entry-card__brand">
          <span>LỮ KHÁCH BẠN CỜ</span>
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
  `}function pn(){let e=d.roomState,t=ln(),n=d.playerId===`p1`,r=dn();if(!e||e.phase!==`lobby`)return``;let i=w.map(t=>{let n=e.players[t],r=t===d.playerId,i=n.isConnected?`is-connected`:n.hasJoined?`is-offline`:`is-empty`,a=n.isConnected?n.isReady?`READY`:`WAIT`:n.hasJoined?`OFFLINE`:`-`,o=n.isConnected||n.hasJoined?n.name:`Đang chờ...`;return`
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
  `}function mn(e){return on(e)?.board??null}function hn(){return d.playerId??`p1`}function gn(e){return!e||!d.roomState?null:d.roomState.players[e]?.score??null}function _n(){return gn(d.playerId??`p1`)}function vn(e){let t=Zt();return[...Q??[],...ia??[],...t?.draftPool??[],...t?.pickedDraftCards??[],...t?.hand??[],...k,...Cn].find(t=>t.id===e)??null}function yn(e){let t=vn(e.cardId);if(t&&!e.type)return t;if(e.type===`debt`)return Object.assign(Object.assign({},br({rowIndex:0,colIndex:0,amount:e.debtAmount??0,sourceCardName:e.sourceCardName??e.name??`Lá đã vay`,lockedReason:e.lockedReason})),{id:e.cardId});if(e.type===`lock`)return Object.assign(Object.assign({},xr({rowIndex:0,colIndex:0,sourceCardName:e.sourceCardName??e.name??`Lá đã vay thể lực`})),{id:e.cardId});let n=e.name??e.cardId,r=e.tag||`food`;return{id:e.cardId,name:n,shortName:n,city:``,shortCity:``,image:e.image??S.food,rarity:`common`,rarityLabel:`★`,vp:e.vp,coin:e.coin??0,stamina:e.stamina??0,tag:r,tagLabel:r,tags:[r.toUpperCase()],icon:e.icon,description:``,bonusText:``}}function bn(e){let t=mn(e);return t?t.map(e=>e.map(e=>e?yn(e):null)):null}function xn(){let e=d.roomState;if(!e)return;T=e.phaseNumber??T,E=Math.max(0,Math.min(4,e.dayIndex));let t=e.players[d.playerId??`p1`];t&&(D=t.score),At(),j=e.phase===`draft`,H=e.phase===`simulation`||e.phase===`result`||e.phase===`gameover`,K=e.phase===`result`||e.phase===`gameover`,Pn=e.draftRound,Mn=e.timer,W=e.timer,C()&&(Hr(),Xr(),Kn());let n=e.self.draftPool??[],r=en(n),i=en(Q),a=Q!==null;if(C()){let t=e.phase===`draft`&&ea!==`draft`,o=e.phase===`draft`&&ea===`draft`&&r!==na;t?(ua(),tn(),aa=!0,oa=!1,A=!0,N=!1,la=!1,x(`deal`),Z=window.setTimeout(()=>{ri()},1320)):o&&a&&i!==r?(ua(),ia=[...n],aa=!1,oa=!0,A=!1,N=!0,Z=window.setTimeout(()=>{ia&&=(Q=[...ia],null),N=!1,A=!0,aa=!0,Z=null,M=e.self.selectedDraftCardId,X(),ei(),Z=window.setTimeout(()=>{ri()},1320)},1500)):e.phase===`draft`&&!a&&tn(),e.phase===`planning`&&ea===`draft`&&Q!==null&&Q.length>0&&!sa&&ca===null&&(ua(),sa=!0,j=!0,H=!1,N=!0,A=!1,oa=!0,aa=!1,ca=window.setTimeout(()=>{sa=!1,N=!1,Q=null,ia=null,ca=null,$i=``,ii()},1550)),e.phase!==`draft`&&!sa&&(ua(),Q=null,ia=null,aa=!1,oa=!1,A=!1,N=!1),ea=e.phase,ta=e.draftRound,na=r}if(C()&&e.phase===`planning`&&ea===`draft`&&!sa&&!la){ii();return}if(e.phase===`planning`&&!sa){let e=nn();e&&(k=[...e])}if(e.phase===`draft`&&(k=[],M=e.self.selectedDraftCardId,Gr()),e.phase===`simulation`||e.phase===`result`){if(C()&&!ra){ui();return}U||(U=nr(),G=0)}else U=null,G=0,K=!1,ra=!1,Dn=!1}function Sn(e=E){return Ae(q(),e)}var Cn=Wt(),w=[`p1`,`p2`,`p3`,`p4`];function wn(){return{p1:ke(),p2:ke(),p3:ke(),p4:ke()}}function Tn(){if(C()){let e=bn(hn());if(e)return e}return Fn.p1}var T=1,E=0,D=0,En={coin:0,stamina:0},O={coin:0,stamina:0},Dn=!1,On=null,kn=null,An=Gt(Cn),k=[],A=!1,j=!0,jn=[],M=null,Mn=10,Nn=null,N=!1,Pn=1,Fn=wn(),In=null,P=null,F=null,I=null,L=null,R=null,z=null,B=null,Ln=null,V=!1,H=!1,U=null,W=15,Rn=null,G=0,zn=null,K=!1,Bn=!1;function q(){return Tn()}function Vn(){return w.filter(e=>e!==`p1`)}function Hn(e,t=E){for(let n=0;n<e.length;n+=1)if(e[n]?.[t]===null)return{rowIndex:n,colIndex:t};for(let t=0;t<e.length;t+=1)for(let n=0;n<e[t].length;n+=1)if(e[t][n]===null)return{rowIndex:t,colIndex:n};return null}function Un(e,t,n){return Object.assign(Object.assign({},e),{id:`${e.id}_${t}_${E}_${n}_${Date.now()}`})}function Wn(e,t,n){let r=Fn[e],i=Hn(r,E);i&&(r[i.rowIndex][i.colIndex]=Un(t,e,n))}function Gn(e){let t=0,n=Fn[e];for(let e=0;e<n.length;e+=1)n[e]?.[E]!==null&&(t+=1);return t}function Kn(){In!==null&&(window.clearInterval(In),In=null)}function qn(e){C()||Vn().forEach((t,n)=>{Gn(t)>=3||Wn(t,e,n)})}function Jn(e){let t=0;for(let n of Fn[e])for(let e of n)e&&(t+=1);return t}function Yn(e,t){return L!==null&&L.rowIndex===e&&L.colIndex===t}function Xn(){return Ie({placedCards:Sn(),getBoardDisplayName:mr})}function Zn(){zn!==null&&(window.clearInterval(zn),zn=null)}function Qn(){return!U||U.replaySteps.length===0?null:U.replaySteps[Math.min(G,U.replaySteps.length-1)]}function $n(e){if(!e)return!1;let t=e;return t.isBadEvent===!0||t.isNegativeEvent===!0||t.eventType===`traffic`||t.eventType===`storm`||t.eventType===`distance`}function er(e){return e?.eventType?e.eventType===`promo`?`eventPromo`:e.eventType===`traffic`?`eventTraffic`:e.eventType===`storm`?`eventStorm`:e.eventType===`distance`?`eventDistance`:null:null}function tr(){let e=Qn();e&&x(er(e)??($n(e)?`scanBad`:`scanCell`))}function nr(){return He({boardSlots:q(),currentDayIndex:E,dayLabel:qt(),rows:Oe,getBoardDisplayName:mr,getCardTagKeys:Me,countCardsWithTag:Ne,getCurrentDayPlacedCards:Sn})}function rr(){return U?{baseVP:U.baseVP,bonusVP:U.bonusVP,totalVP:U.finalVP,spentCoin:U.spentCoin,spentStamina:U.spentStamina+si(U),usedSlots:U.usedSlots,lines:U.lines}:Xn()}function ir(){let e=U?rr():Xn();return{vp:D,coin:e.spentCoin,stamina:e.spentStamina,usedSlots:e.usedSlots}}function ar(){let e=ir();return Bt.map(t=>{if(!t.active)return Object.assign(Object.assign({},t),{usedSlots:t.id?Jn(t.id):t.usedSlots});let n=or();return Object.assign(Object.assign({},t),{score:e.vp,coin:Math.max(0,n.coin),stamina:Math.max(0,n.stamina),usedSlots:e.usedSlots})})}function or(){if(C()){let e=ln();if(e)return{coin:e.coin,stamina:e.stamina}}let e=tt({totals:ir(),startingCoin:3,startingStamina:2});return{coin:e.coin+En.coin+O.coin,stamina:e.stamina+En.stamina+O.stamina}}function sr(e){return nt({card:e,remaining:or()})}function cr(e){return rt(sr(e))}function lr(e,t,n,r){let i=e.trim().length;return i>=r?`${t} ${t}--xs`:i>=n?`${t} ${t}--sm`:t}function ur(e){return lr(e,`hand-card__name`,16,23)}function dr(e){return lr(e,`hand-card__city`,18,28)}function fr(e){return lr(e,`board-mini__name`,12,18)}function pr(e){return lr(e,`board-mini__city`,12,21)}function mr(e){return e.shortName?.trim()||e.name}function hr(e){return e.shortCity?.trim()||e.city}function gr(e){return e?.boardTokenType??null}function _r(e){return gr(e)===`debt`}function vr(e){return gr(e)===`lock`}function yr(e,t){let n=q()[e]?.[t]??null;return n===null||_r(n)}function br(e){return{id:`debt_token_${e.rowIndex}_${e.colIndex}_${Date.now()}`,name:e.lockedReason?`Nợ + Kiệt sức`:`Token Nợ`,shortName:e.lockedReason?`Nợ + Kiệt sức`:`Token Nợ`,city:`Trả ${e.amount} xu`,shortCity:`Trả ${e.amount} xu`,image:S.food,rarity:`common`,rarityLabel:`!`,vp:0,coin:0,stamina:0,tag:`utility`,tagLabel:`Nợ`,tags:[`UTILITY`],icon:`💸`,description:`Bấm để trả ${e.amount} xu. Nếu không trả trước khi hết ngày sẽ bị -20 VP.`,bonusText:`Không trả nợ: -20 VP`,boardTokenType:`debt`,debtAmount:e.amount,lockedReason:e.lockedReason,sourceCardName:e.sourceCardName}}function xr(e){return{id:`exhaust_lock_${e.rowIndex}_${e.colIndex}_${Date.now()}`,name:`Bị khóa`,shortName:`Bị khóa`,city:`Kiệt sức`,shortCity:`Kiệt sức`,image:S.food,rarity:`common`,rarityLabel:`!`,vp:0,coin:0,stamina:0,tag:`utility`,tagLabel:`Khóa`,tags:[`UTILITY`],icon:`🔒`,description:`Ô này bị khóa vì đã vay thể lực ở ${e.sourceCardName}.`,bonusText:`Không thể xếp bài vào ô này.`,boardTokenType:`lock`,lockedReason:`Kiệt sức`,sourceCardName:e.sourceCardName}}function Sr(e){let t=E+1;if(!(t>=5)&&q()[e.rowIndex]?.[t]===null){if(e.coinDebt>0){q()[e.rowIndex][t]=br({rowIndex:e.rowIndex,colIndex:t,amount:e.coinDebt,sourceCardName:e.card.name,lockedReason:e.staminaDebt>0?`Kiệt sức`:void 0});return}e.staminaDebt>0&&(q()[e.rowIndex][t]=xr({rowIndex:e.rowIndex,colIndex:t,sourceCardName:e.card.name}))}}function Cr(e,t,n){let r=n.debtAmount??0,i=or();if(!(r<=0)){if(i.coin<r){alert(`Không đủ xu để trả nợ. Cần ${r} xu.`);return}O=Object.assign(Object.assign({},O),{coin:O.coin-r}),q()[e][t]=null,x(`eventPromo`),Y()}}function wr(e,t,n){if(t!==E){z=n,B={rowIndex:e,colIndex:t},Y();return}if(C()){le({rowIndex:e,colIndex:t});return}Cr(e,t,n)}function Tr(e,t,n){let r=t+1;if(r>=5)return;let i=q()[e]?.[r]??null;i&&(i.boardTokenType===`debt`||i.boardTokenType===`lock`)&&i.sourceCardName===n.name&&(q()[e][r]=null)}function Er(e){return lr(e,`focused-card__name`,18,25)}function Dr(e){return lr(e,`focused-card__city`,18,28)}function Or(e){if(!e)return null;if(C()){let t=Qt()?.find(t=>t.id===e)??null;if(t)return t;let n=nn()?.find(t=>t.id===e)??null;if(n)return n}if(j){let t=Vr()?.pool.find(t=>t.id===e)??null;if(t)return t}return k.find(t=>t.id===e)??null}function kr(e,t){return je(q(),e,t)}function Ar(e){let t=Sn(),n=Me(e);return n.includes(`FOOD`)&&Ne(t,`FOOD`)>=2||n.includes(`CULTURE`)&&Ne(t,`CULTURE`)>=2||n.includes(`ACTION`)&&Ne(t,`ACTION`)>=2?!0:e.onPlayEffect?.has_effect===!0&&e.onPlayEffect.effect_type===`GAIN_VP`}function jr(e,t){let n=mr(e),r=hr(e),i=fr(n);pr(r);let a=Ar(e),o=e;if(o.boardTokenType===`debt`)return`
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
        style="background-image: url('${e.image}'), url('${S.food}')"
      ></div>

      <div class="board-mini__tag board-mini__tag--${e.tag}">
        ${e.tagLabel}
      </div>

      <div class="board-mini__info">
        <h3 class="${i}">${n}</h3>
        <div class="board-mini__vp">★ ${e.vp}</div>
      </div>
    </article>
  `}function Mr(e,t){let n=j&&e.id===an(),r=!j&&e.id===P,i=n||r,a=sr(e).canAfford?cr(e):`Thiếu tài nguyên: đặt lá này sẽ tạo nợ / kiệt sức.`;return`
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
          <h3 class="${ur(e.name)}">${e.name}</h3>
          <div class="${dr(e.city)}">📍 ${e.city}</div>
        </div>

        <div class="hand-card__vp">${e.vp}</div>
      </div>

      <div class="hand-card__image" style="background-image: url('${e.image}'), url('${S.food}')">
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
  `}function Nr(e){let t=Er(e.name),n=Dr(e.city);return`
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

        <div class="focused-card__image" style="background-image: url('${e.image}'), url('${S.food}')">
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

        ${B?`
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
  `}function Pr(){let e=Vr()?.pool??[],t=Ur();return`
    <div class="draft-hand-meta">
      <div class="draft-hand-meta__info">
        <span>Vòng ${Pn}/5</span>
        <strong>${t?mr(t):`Bấm 1 lá để chọn`}</strong>
        <em>
          ${A?`Đang phát bài vào tay...`:N?`Đang chuyền bài còn lại vào lượt kế tiếp...`:t?`Đã chọn. Hết giờ mới chuyền bài.`:e.length>0?`Bấm để chọn, giữ 0.5s để xem lớn.`:`Đang chuẩn bị bài...`}
        </em>
      </div>

      <div class="draft-hand-meta__wait">
        <span>Chờ hết giờ</span>
      </div>
    </div>
  `}function Fr(){let e=C()?$t():null,t=Vr(),n=e??t?.pool??[];return n.length===0?`<div class="draft-hand-empty">Đang chuẩn bị bài...</div>`:n.map((e,t)=>Wr(e,t)).join(``)}function Ir(e){return(jn[{p1:1,p2:0,p3:2,p4:3}[e]]?.picked??[]).map(e=>e.icon)}function Lr(e){return!!(e&&e!==`p1`&&j)}function Rr(e){let t=mn(e);if(!t)return Array.from({length:25}).map(()=>`<div class="opponent-cell">+</div>`).join(``);let n=[];for(let e of t)for(let t of e){if(!t){n.push(`<div class="opponent-cell">+</div>`);continue}n.push(`
        <div
          class="opponent-cell opponent-cell--filled opponent-cell--${t.tag}"
          title="${t.cardId} • ${t.tag} • ${t.vp} VP"
        >
          ${t.icon}
        </div>
      `)}return n.join(``)}function zr(e){if(!e)return Array.from({length:25}).map(()=>`<div class="opponent-cell">+</div>`).join(``);if(d.roomState)return Rr(e);let t=Fn[e],n=Lr(e)?Ir(e):[],r=[],i=0;for(let e of t)for(let t of e){let e=n[i]??``;if(!t){r.push(`
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
      `),i+=1}return r.join(``)}function Br(e){let t=on(e.id),n=t?Object.assign(Object.assign({},e),{name:t.name,score:t.score,coin:t.coin,stamina:t.stamina,usedSlots:t.usedSlots}):e,r=t?.isConnected===!1?` side-player--offline`:``;return`
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
        ${zr(n.id)}
      </div>
    </section>
  `}function Vr(){return Fe(jn,Pe())}function Hr(){Nn!==null&&(window.clearInterval(Nn),Nn=null)}function Ur(){if(C()){let e=$t(),t=an();return!e||!t?null:e.find(e=>e.id===t)??null}let e=Vr();return!e||!M?null:e.pool.find(e=>e.id===M)??null}function Wr(e,t){let n=e.id===an();return`
    <article
      class="daily-draft-card daily-draft-card--${t+1} draft-deal-slot ${n?`daily-draft-card--selected`:``}"
      data-draft-card-id="${e.id}"
      title="${e.name} - ${e.city}"
    >
      ${Mr(e,t)}
    </article>
  `}function Gr(){let e=an();Array.from(document.querySelectorAll(`[data-draft-card-id]`)).forEach(t=>{let n=t.dataset.draftCardId===e,r=t.querySelector(`.hand-card`);t.classList.toggle(`daily-draft-card--selected`,n),r?.classList.toggle(`hand-card--draft-selected`,n),n?(t.style.setProperty(`z-index`,`99999`,`important`),t.style.setProperty(`isolation`,`isolate`,`important`)):(t.style.removeProperty(`z-index`),t.style.removeProperty(`isolation`)),r&&(n?(r.style.setProperty(`z-index`,`99999`,`important`),r.style.setProperty(`position`,`relative`,`important`)):(r.style.removeProperty(`z-index`),r.style.removeProperty(`position`)))});let t=Ur(),n=document.querySelector(`.draft-hand-meta__info strong`);n&&(n.textContent=t?mr(t):`Bấm 1 lá để chọn`);let r=document.querySelector(`.draft-hand-meta__info em`);r&&(r.textContent=t?`Đã chọn. Bấm lại lá đó để hủy chọn.`:`Bấm để chọn, giữ 0.5s để xem lớn.`)}function Kr(e){if(!j||N||V&&(V=!1,R||z||B))return;let t=M===e?null:e;if(x(`cardSelect`),M=t,R=null,z=null,B=null,C()){oe(e),Gr();return}X()}function qr(e){if(!(j||H||A)){if(V){V=!1;return}x(`cardSelect`),P=P===e?null:e,F=null,R=null,z=null,B=null,X()}}function Jr(){j||(P=null,F=null,R=null,z=null,B=null,Y())}function Yr(e){let t=Math.max(0,e),n=Math.floor(t/60),r=t%60;return`${n}:${r<10?`0${r}`:`${r}`}`}function Xr(){Rn!==null&&(window.clearInterval(Rn),Rn=null)}function Zr(){Xr(),!C()&&(H||j||(Rn=window.setInterval(()=>{if(--W,W<=0){W=0,Xr(),li();return}Y()},1e3)))}function Qr(){On!==null&&(window.clearTimeout(On),On=null)}function $r(){kn!==null&&(window.clearTimeout(kn),kn=null)}function ei(){x(`deal`),window.requestAnimationFrame(()=>{window.requestAnimationFrame(()=>{document.querySelector(`.player-hand--draft.player-hand--dealing`)?.classList.add(`deal-active`)})})}function ti(){if(!C()||!j||!A)return;let e=document.querySelector(`.player-hand--draft.player-hand--dealing`);!e||e.classList.contains(`deal-active`)||e.classList.add(`deal-active`)}function ni(){x(`returnDeck`),window.requestAnimationFrame(()=>{window.requestAnimationFrame(()=>{var e;let t=document.querySelector(`.player-hand__cards.is-passing`),n=document.querySelector(`.deck-card-stack`);if(!t||!n)return;let r=Array.from(t.querySelectorAll(`.draft-deal-slot:not(.daily-draft-card--selected)`)),i=t.getBoundingClientRect(),a=n.getBoundingClientRect(),o=i.left+i.width*.5,s=i.top+i.height*.38,c=a.left+a.width*.34,l=a.top+a.height*.54;r.forEach((e,t)=>{let n=e.getBoundingClientRect(),i=n.left+n.width*.5,a=n.top+n.height*.5,u=t-(r.length-1)/2,d=o-i+u*5,f=s-a+Math.abs(u)*3,p=c-i+u*2,m=l-a+u*2,h=d+(p-d)*.34,g=Math.min(f,m)-150-Math.abs(u)*7,ee=d+(p-d)*.72,te=Math.min(f,m)-185-Math.abs(u)*5;e.style.setProperty(`--gather-x`,`${d}px`),e.style.setProperty(`--gather-y`,`${f}px`),e.style.setProperty(`--gather-r`,`${u*4}deg`),e.style.setProperty(`--arc1-x`,`${h}px`),e.style.setProperty(`--arc1-y`,`${g}px`),e.style.setProperty(`--arc2-x`,`${ee}px`),e.style.setProperty(`--arc2-y`,`${te}px`),e.style.setProperty(`--deck-in-x`,`${p}px`),e.style.setProperty(`--deck-in-y`,`${m}px`),e.style.setProperty(`--deck-r`,`${-6+u*3}deg`)}),(e=n.closest(`.deck-pile-panel`))==null||e.classList.add(`deck-receiving`),t.classList.add(`pass-active`)})})}function ri(){A=!1,Z=null;let e=document.querySelector(`.player-hand`);e?.classList.remove(`player-hand--dealing`,`is-dealing`,`deal-active`);let t=e?.querySelector(`.player-hand__meta`);t&&(t.textContent=`Còn ${Mn}s • bấm 1 lá để chọn`);let n=e?.querySelector(`.draft-hand-meta__info em`);n&&(n.textContent=`Bấm để chọn, giữ 0.5s để xem lớn.`),Gr()}function ii(){let e=nn();e&&(k=[...e]),j=!1,H=!1,N=!1,A=!0,la=!0,x(`deal`),X(),$i=da(),window.requestAnimationFrame(()=>{document.querySelector(`.player-hand:not(.player-hand--draft)`)?.classList.add(`planning-deal-active`)}),window.setTimeout(()=>{A=!1;let e=document.querySelector(`.player-hand`);e?.classList.remove(`player-hand--dealing`,`is-dealing`,`deal-active`,`planning-deal-active`);let t=e?.querySelector(`.player-hand__meta`);t&&(t.textContent=`Giữ 0.5s để xem lớn`)},1760)}function ai(){Qr(),$r(),Zn(),Xr(),Kn(),Kt(),E>=4?(T+=1,E=0,Fn=wn(),An=Gt(Cn),En={coin:0,stamina:0},O={coin:0,stamina:0}):E+=1,H=!1,U=null,G=0,K=!1,Dn=!1,W=15,P=null,F=null,R=null,z=null,B=null,L=null,V=!1}function oi(e){return e?e.replaySteps.reduce((e,t)=>({coin:e.coin,stamina:e.stamina+(t.eventStaminaDelta??0)}),{coin:0,stamina:0}):{coin:0,stamina:0}}function si(e){let t=oi(e);return Math.abs(Math.min(0,t.stamina))}function ci(){if(!U||Dn)return;let e=oi(U);D+=U.finalVP,O={coin:O.coin+e.coin,stamina:O.stamina+e.stamina},Dn=!0}function li(){J(),Ii(),Kn(),P=null,F=null,R=null,z=null,B=null,V=!1,U=nr(),G=0,K=!1,H=!0,tr(),Xr(),Zn(),zn=window.setInterval(()=>{if(U){if(G>=U.replaySteps.length-1){G=U.replaySteps.length-1,K=!0,ci(),Zn(),Y(),Qr(),On=window.setTimeout(()=>{ai()},1800);return}G+=1,tr(),Y()}},850),Y()}function ui(){J(),Ii(),Kn(),Xr(),Zn(),P=null,F=null,R=null,z=null,B=null,V=!1,U=nr(),G=0,K=!1,H=!0,ra=!0,tr(),zn=window.setInterval(()=>{if(U){if(G>=U.replaySteps.length-1){G=U.replaySteps.length-1,K=!0,Zn(),X();return}G+=1,tr(),X()}},850),X()}function di(){Kn(),H=!1,U=null,G=0,K=!1,Dn=!1,W=15,Qr(),$r(),A=!1,Zn(),P=null,F=null,R=null,z=null,B=null,V=!1,Y(),Zr()}function fi(){let e=rr(),t=d.roomState?.phase===`lobby`,n=_n()??(U?bi():D),r=cn();return`
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

      ${U?`
            <button
              class="score-breakdown__timer score-breakdown__timer--reset"
              onclick="event.stopPropagation(); resetSimulation()"
              title="Prototype: mở khóa để test lại lượt"
            >
              ↺ Test lại
            </button>
          `:j?`
              <div
                class="score-breakdown__timer ${Mn<=3?`score-breakdown__timer--danger`:``}"
                title="Thời gian chọn bài trong phase chia bài."
              >
                <span>DRAFT</span>
                <strong>${Mn}s</strong>
              </div>
            `:`
              <div
                class="score-breakdown__timer ${W<=10?`score-breakdown__timer--danger`:``}"
                title="Đồng hồ đếm ngược. Hết giờ hệ thống tự mô phỏng."
              >
                <span>TIME</span>
                <strong>${Yr(W)}</strong>
              </div>
            `}
    </section>
  `}function pi(){if(H||U||Yt())return``;let e=or();return`
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
  `}function mi(){if(!Yt())return``;let e=Xt(),t=d.playerId;return`
    <section class="final-ranking-panel">
      <div class="final-ranking-panel__header">
        <span>KẾT THÚC PHASE</span>
        <h2>Bảng xếp hạng cuối cùng</h2>
        <p>Hết 5 ngày. BXH sẽ tự đóng sau ${d.roomState?.timer??10}s để qua Phase ${T+1}.</p>
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

      ${hi(`travel-export-panel--final`)}

      <div class="final-ranking-panel__footer">
        ${T>=3?`Đã kết thúc Phase 3. Đây là kết quả cuối của game.`:`Đang chuẩn bị chuyển sang Phase ${T+1}...`}
      </div>
    </section>
  `}function hi(e=``){return`
    <div class="flow-export travel-export-panel ${e}">
      <span>Xuất lịch trình</span>
      <p>Xuất board hiện tại thành lịch trình du lịch để lưu hoặc chia sẻ.</p>
      <div class="flow-export__actions">
        <button onclick="event.stopPropagation(); downloadTravelCertificateHtml()">Certificate</button>
        <button onclick="event.stopPropagation(); copyTravelTimeline()">Copy text</button>
      </div>
    </div>
  `}function gi(e){return e>0?`+${e} VP`:e<0?`${e} VP`:`0 VP`}function _i(){return U?U.replaySteps.slice(0,G+1).reduce((e,t)=>e+t.vpDelta,0):0}function vi(){return U&&Dn?D-U.finalVP:D}function yi(){return U?vi()+(K?U.finalVP:_i()):D}function bi(){return U?K?D:vi():D}function xi(){if(!U)return``;let e=U,t=Qn(),n=e.replaySteps.length,r=e.daySummaries[0];return`
    <section class="simulation-flowchart simulation-flowchart--single-day">
      <div class="simulation-flowchart__header">
        <div>
          <span>FLOW CHART MÔ PHỎNG 1 NGÀY</span>
          <h3>
            ${t?`${Jt()} • ${t.dayLabel} đang chạy qua ${t.timeLabel}`:`Đang chuẩn bị mô phỏng`}
          </h3>
        </div>

        <div class="simulation-flowchart__progress">
          <strong>${Math.min(G+1,n)}</strong>
          <span>/ ${n}</span>
        </div>
      </div>

      <div class="simulation-flowchart__main">
        <div class="simulation-flowchart__days">
          <div class="flow-day is-active">
            <span>${r?.label??qt()}</span>
            <strong>${r?.vp??0} VP</strong>
          </div>
        </div>

        <div class="simulation-flowchart__path">
          ${e.replaySteps.map((e,t)=>`
                <div class="flow-node ${t===G?`is-active`:``} ${t<G?`is-done`:``} ${t>G?`is-future`:``} ${e.isEmpty?`is-empty`:``} ${e.eventType?`flow-node--event-${e.eventType}`:``}">
                  <div class="flow-node__time">${e.timeLabel}</div>

                  <div class="flow-node__card">
                    <h4>${e.title}</h4>
                    <p>${e.subtitle}</p>

                    <div class="flow-node__meta">
                      <span class="${e.vpDelta>=0?`is-positive`:`is-negative`}">
                        ${e.vpDelta>=0?`+`:``}${e.vpDelta} VP
                      </span>
                      <span>${e.coinDelta} Xu</span>
                      <span>${e.staminaDelta} Lực</span>
                    </div>

                    ${e.eventText?`<div class="flow-node__event-badge">${e.eventText}</div>`:``}

                    ${e.comboText?`<div class="flow-node__badge">Combo</div>`:``}
                  </div>
                </div>
              `).join(``)}
        </div>

        <div class="simulation-flowchart__side">
          <div class="flow-current">
            <span>Bước hiện tại</span>
            <strong>${t?`${t.dayLabel} • ${t.timeLabel}`:`-`}</strong>
            <p>${t?t.title:`Đang chuẩn bị...`}</p>
          </div>

          <div class="flow-total">
            <span>Điểm ngày</span>
            <strong>
              ${gi(K?e.finalVP:e.replaySteps.slice(0,G+1).reduce((e,t)=>e+t.vpDelta,0))}
            </strong>
          </div>

          <div class="flow-total flow-total--phase">
            <span>Tổng phase</span>
            <strong>${bi()} VP</strong>
          </div>

          ${K?`
                <div class="flow-final">
                  <span>Đã cập nhật điểm</span>
                  <strong>${vi()} → ${yi()} VP</strong>
                  <p>Điểm ngày: ${gi(e.finalVP)}. Nếu âm, tổng phase đã bị trừ trực tiếp.</p>
                </div>

${hi()}
              `:``}
        </div>
      </div>
    </section>
  `}function Si(e,t){if(!U)return null;let n=U.replaySteps.findIndex(n=>n.rowIndex===e&&n.dayIndex===t);return n<0||n>G?null:U.replaySteps[n]??null}function Ci(e,t){if(!U||t!==E)return``;let n=Qn(),r=n?.rowIndex===e&&n?.dayIndex===t,i=U.replaySteps.findIndex(n=>n.rowIndex===e&&n.dayIndex===t),a=i>=0?U.replaySteps[i]:null,o=i>=0&&i<G,s=a?.eventType&&i<=G?`board-cell--event-${a.eventType}`:``;return r?`board-cell--replay-current ${s}`.trim():o?`board-cell--replay-done ${s}`.trim():`board-cell--replay-pending`}function wi(){return`
    <section
      class="deck-pile-panel"
      data-discard-drop-zone="true"
      title="Kéo thả lá bài trên tay vào đây để discard và nhận lại Xu/Thể lực bằng chi phí của lá."
    >
      <div class="deck-pile-panel__top">
        <div>
          <span>DECK</span>
          <h3>Bộ bài hành trình</h3>
        </div>

        <strong>${C()?0:An.length}</strong>
      </div>

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
          <strong>${(C()?nn():null)?.length??k.length}</strong>
        </div>

        <div>
          <span>Đã xếp ngày</span>
          <strong>${Sn().length}</strong>
        </div>
      </div>

      <p>Kéo lá bài trên tay vào deck để discard, nhận lại Xu và Thể lực bằng chi phí của lá.</p>
    </section>
  `}function Ti(){let e=Or(R)??z;return`
    <main class="arena ${Yt()?`arena--gameover`:``}">
      <div class="arena__top arena__top--with-score">
        <div class="arena__title-block">
          <div class="blue-line"></div>

          <div>
            <h1>${sn()}</h1>
          </div>
        </div>

        ${fi()}
      </div>

      ${pi()}

      <div class="arena__main">
        <div class="board-block">
          <div class="days-header">
            ${v.map((e,t)=>`<div class="day-pill ${t===E?`day-pill--current`:``} ${t<E?`day-pill--done`:``}">NGÀY ${e}</div>`).join(``)}
          </div>

          <section class="board-grid">
            ${Oe.map((e,t)=>`
                  <div class="time-label">${e}</div>

                  ${v.map((e,n)=>{let r=kr(t,n),i=n===E,a=!j&&!H&&!A&&i&&P!==null&&r===null;return r?`
                        <div
                          class="board-cell board-cell--occupied board-cell--clickable ${Ci(t,n)} ${Yn(t,n)?`board-cell--just-placed`:``}"
                          data-board-drop-cell="true"
                          data-row-index="${t}"
                          data-col-index="${n}"
                          onclick="event.stopPropagation(); handleBoardCellClick(${t}, ${n})"
                          title="Ô đã có bài - bấm để xem lớn"
                        >
                          ${jr(r,Si(t,n))}
                        </div>
                      `:`
                          <div
                            class="board-cell board-cell--empty ${Ci(t,n)} ${H?`board-cell--locked-mode`:``} ${!i&&!H?`board-cell--not-current-day`:``} ${a?`board-cell--placeable`:``}"
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

        ${Yt()?mi():j?``:xi()}

        ${H?``:`
              <section
          class="player-hand ${A?`player-hand--dealing is-dealing`:``} ${j?`player-hand--draft`:``}"
          onclick="${j?``:`clearSelectedHandCard()`}"
        >
          <div class="player-hand__top">
            <div class="player-hand__title">
              <span class="hand-badge">${j?`DRAFT`:`HAND`}</span>
              <h2>
                ${j?`Chọn bài ngày ${v[E]}`:`Bài ngày ${v[E]}`}
              </h2>
            </div>

            <div class="player-hand__meta ${j&&Mn<=3?`player-hand__meta--danger`:``}">
              ${j?A?`Đang phát bài...`:`Còn ${Mn}s • ${N?`Đang chuyền bài...`:`bấm 1 lá để chọn`}`:A?`Đang chia bài...`:`Giữ 0.5s để xem lớn`}
            </div>
          </div>

          ${j?Pr():``}

          <div class="player-hand__cards ${j&&N?`is-passing`:``}">
            ${j?Fr():k.map((e,t)=>Mr(e,t)).join(``)}
          </div>
        </section>
            `}
      </div>

      ${e?Nr(e):``}
    </main>
  `}function J(){Ln!==null&&(window.clearTimeout(Ln),Ln=null)}function Y(){let e=document.querySelector(`.arena`);e&&(e.outerHTML=Ti())}function Ei(e,t,n){if(H||A||n!==E||!yr(t,n))return;let r=k.findIndex(t=>t.id===e);if(r===-1)return;let i=k[r];if(C()){x(`cardPlace`),se({cardId:i.id,rowIndex:t,colIndex:n,tag:i.tag,icon:i.icon,vp:i.vp,coin:i.coin,stamina:i.stamina,name:i.name}),P=null,F=null,R=null,z=null,B=null,V=!1;return}let a=or(),o=Math.max(0,i.coin-a.coin),s=Math.max(0,i.stamina-a.stamina);x(`cardPlace`),k.splice(r,1),q()[t][n]=i,Sr({rowIndex:t,card:i,coinDebt:o,staminaDebt:s}),se({cardId:i.id,rowIndex:t,colIndex:n,tag:i.tag,icon:i.icon,vp:i.vp,coin:i.coin,stamina:i.stamina,image:i.image,name:i.name}),qn(i),P=null,F=null,R=null,z=null,B=null,V=!1,L={rowIndex:t,colIndex:n},Y(),window.setTimeout(()=>{L?.rowIndex===t&&L?.colIndex===n&&(L=null,Y())},420)}function Di(e,t){P&&Ei(P,e,t)}function Oi(){if(H||!B)return;let{rowIndex:e,colIndex:t}=B;if(t!==E)return;let n=q()[e]?.[t];if(!(!n||_r(n)||vr(n))){if(C()){ue({rowIndex:e,colIndex:t}),R=null,z=null,B=null,L=null,P=null,V=!1;return}for(q()[e][t]=null,Tr(e,t,n),k.unshift(n);k.length>5;){let e=k.pop();e&&An.unshift(e)}R=null,z=null,B=null,L=null,P=null,V=!1,Y()}}function ki(e){if(!I||I.isDragging)return;J(),R=null,z=null,B=null,V=!1;let{source:t}=I,n=t.getBoundingClientRect(),r=t.cloneNode(!0);r.classList.add(`hand-card--drag-clone`),r.classList.remove(`hand-card--selected`),r.style.width=`${n.width}px`,r.style.height=`${n.height}px`,r.style.left=`${n.left}px`,r.style.top=`${n.top}px`,r.style.transform=`none`,r.style.pointerEvents=`none`,document.body.appendChild(r),t.classList.add(`hand-card--drag-source-hidden`),I.clone=r,I.offsetX=e.clientX-n.left,I.offsetY=e.clientY-n.top,I.isDragging=!0,F=I.id,P=I.id,Ai(e)}function Ai(e){I?.clone&&(I.clone.style.left=`${e.clientX-I.offsetX}px`,I.clone.style.top=`${e.clientY-I.offsetY}px`)}function ji(e){return document.elementFromPoint(e.clientX,e.clientY)?.closest(`[data-board-drop-cell='true']`)}function Mi(e){return document.elementFromPoint(e.clientX,e.clientY)?.closest(`[data-discard-drop-zone='true']`)}function Ni(){document.querySelectorAll(`.deck-pile-panel--discard-hover`).forEach(e=>{e.classList.remove(`deck-pile-panel--discard-hover`),delete e.dataset.discardCoin,delete e.dataset.discardStamina})}function Pi(){return!j&&!H&&!A}function Fi(e){if(!Pi())return;let t=k.findIndex(t=>t.id===e);if(t===-1)return;let n=k[t];if(x(`returnDeck`),C()){let e=d.roomState,t=d.playerId;if(e&&t){let r=e.self.hand.findIndex(e=>e.id===n.id);r>=0&&e.self.hand.splice(r,1);let i=e.players[t];i&&(i.coin+=n.coin,i.stamina+=n.stamina),k=[...e.self.hand]}ce({cardId:n.id,coin:n.coin,stamina:n.stamina,name:n.name}),P=null,F=null,R=null,z=null,B=null,V=!1,X();return}k.splice(t,1),En={coin:En.coin+n.coin,stamina:En.stamina+n.stamina},P=null,F=null,R=null,z=null,B=null,V=!1,Y()}function Ii(){var e;Hi(),Ni(),I?.source&&I.source.classList.remove(`hand-card--drag-source-hidden`),(e=I?.clone)==null||e.remove(),I=null,F=null}function Li(e){if(!I)return;let t=e.clientX-I.startX,n=e.clientY-I.startY,r=Math.hypot(t,n);if(!I.isDragging&&r>=8&&(J(),ki(e)),!I?.isDragging)return;e.preventDefault(),Ai(e),Hi(),Ni();let i=Mi(e);if(i&&Pi()){let e=Or(F);i.classList.add(`deck-pile-panel--discard-hover`),i.dataset.discardCoin=String(e?.coin??0),i.dataset.discardStamina=String(e?.stamina??0);return}let a=ji(e);if(!a)return;let o=Number(a.dataset.rowIndex),s=Number(a.dataset.colIndex),c=Or(F);Number.isInteger(o)&&Number.isInteger(s)&&yr(o,s)&&c?a.classList.add(`board-cell--drag-hover`):a.classList.add(`board-cell--drag-invalid`)}function Ri(e){document.removeEventListener(`pointermove`,Li),document.removeEventListener(`pointerup`,Ri),document.removeEventListener(`pointercancel`,zi);let t=I,n=t?.isDragging===!0;if(J(),t){if(n){let n=ji(e),r=Mi(e),i=Number(n?.dataset.rowIndex),a=Number(n?.dataset.colIndex),o=t.id;Ii(),V=!0,window.setTimeout(()=>{V=!1},0);let s=Or(o);if(r&&s&&Pi()){Fi(o);return}if(n&&Number.isInteger(i)&&Number.isInteger(a)&&q()[i]?.[a]===null&&s){Ei(o,i,a);return}n&&Number.isInteger(i)&&Number.isInteger(a)?Bi(i,a):Bi(),P=null,Y();return}Ii()}}function zi(){document.removeEventListener(`pointermove`,Li),document.removeEventListener(`pointerup`,Ri),document.removeEventListener(`pointercancel`,zi),J(),Ii(),P=null,V=!1,Y()}function Bi(e,t){x(`reject`);let n=e!==void 0&&t!==void 0?document.querySelector(`[data-row-index="${e}"][data-col-index="${t}"]`):document.querySelector(`.arena`);n?.classList.add(`resource-rejected-feedback`),window.setTimeout(()=>{n?.classList.remove(`resource-rejected-feedback`)},380)}function Vi(e){return e.dataTransfer?.getData(`text/plain`)||F}function Hi(){document.querySelectorAll(`.board-cell--drag-hover, .board-cell--drag-invalid`).forEach(e=>{e.classList.remove(`board-cell--drag-hover`),e.classList.remove(`board-cell--drag-invalid`)})}window.startDragHandCard=(e,t)=>{var n;J(),F=t,P=t,R=null,z=null,B=null,V=!0,(n=e.dataTransfer)==null||n.setData(`text/plain`,t),e.dataTransfer&&(e.dataTransfer.effectAllowed=`move`)},window.endDragHandCard=()=>{J(),Hi(),F=null,window.setTimeout(()=>{V=!1},0)},window.handleBoardCellDragOver=(e,t,n)=>{!F||q()[t][n]!==null||(e.dataTransfer&&(e.dataTransfer.dropEffect=`move`),e.currentTarget?.classList.add(`board-cell--drag-hover`))},window.handleBoardCellDragLeave=e=>{e.currentTarget?.classList.remove(`board-cell--drag-hover`)},window.dropHandCardOnBoard=(e,t,n)=>{J(),Hi();let r=Vi(e);if(F=null,!r)return;let i=Or(r);if(!yr(t,n)||!i){Bi(t,n);return}Ei(r,t,n)},window.startHandPointerDrag=(e,t)=>{if(A||H||e.button!==0||!Or(t))return;Ii();let n=e.currentTarget;n&&(I={id:t,source:n,clone:null,startX:e.clientX,startY:e.clientY,offsetX:0,offsetY:0,isDragging:!1},document.addEventListener(`pointermove`,Li),document.addEventListener(`pointerup`,Ri),document.addEventListener(`pointercancel`,zi))},window.selectDraftCard=Kr,window.confirmDraftPick=()=>{},window.startHoldHandCard=e=>{N||A||(J(),Ln=window.setTimeout(()=>{R=e,z=null,B=null,V=!0,J(),Y()},500))},window.cancelHoldHandCard=()=>{J()},window.clearSelectedHandCard=()=>{J(),P!==null&&(P=null,Y())},window.handleBoardCellClick=(e,t)=>{J();let n=kr(e,t);if(n){if(_r(n)){if(!j&&!A&&t===E&&P){Di(e,t);return}wr(e,t,n);return}Ii(),R=null,z=n,B={rowIndex:e,colIndex:t},P=null,V=!1,Y();return}!j&&!A&&t===E&&Di(e,t)},window.focusBoardCard=(e,t)=>{let n=kr(e,t);n&&(R=null,z=n,B={rowIndex:e,colIndex:t},P=null,V=!1,Y())},window.runSimulation=()=>{li()},window.resetSimulation=()=>{di()},window.returnFocusedBoardCardToHand=()=>{Oi()},window.closeFocusedHandCard=()=>{J(),R=null,z=null,B=null,F=null,V=!1,Y()};function Ui(e){let t={p1:1,p2:3,p3:3,p4:3};return[...Bt,...Vt].find(t=>t.id===e)??{id:e,rank:t[e],name:e.toUpperCase(),score:0,coin:3,stamina:2,usedSlots:0}}function Wi(){let e=d.playerId;return!e||!d.roomState?[]:w.filter(t=>t===e?!1:d.roomState?.players[t]?.isConnected===!0).map(e=>{let t=Ui(e),n=d.roomState?.players[e];return Object.assign(Object.assign({},t),{name:n?.name??t.name,score:n?.score??t.score,coin:n?.coin??t.coin,stamina:n?.stamina??t.stamina,usedSlots:n?.usedSlots??t.usedSlots,active:!1})})}function Gi(){return C()?Wi().slice(0,2):ar()}function Ki(){return C()?Wi().slice(2):[Vt[0]]}function qi(){let e=d.roomState;return e?w.map(t=>{let n=e.players[t];return{playerId:t,name:n?.name??t.toUpperCase(),score:n?.score??0,coin:n?.coin??3,stamina:n?.stamina??2,usedSlots:n?.usedSlots??0,isConnected:n?.isConnected??!1,hasJoined:n?.hasJoined??!1}}).filter(e=>e.hasJoined||e.isConnected).sort((e,t)=>t.score===e.score?t.usedSlots===e.usedSlots?e.playerId.localeCompare(t.playerId):t.usedSlots-e.usedSlots:t.score-e.score):[]}function Ji(){if(!Bn||!C())return``;let e=qi(),t=d.playerId;return`
    <div class="mid-ranking-backdrop" onclick="event.stopPropagation(); closeMidGameRanking()">
      <section class="mid-ranking-modal" onclick="event.stopPropagation()">
        <div class="mid-ranking-modal__header">
          <div>
            <span>BẢNG XẾP HẠNG GIỮA TRẬN</span>
            <h2>${cn()}</h2>
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
  `}function Yi(){return!C()||d.roomState?.phase===`lobby`?``:`
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
  `}function Xi(e){return Array.from({length:Math.max(0,e)},()=>`<section class="side-player side-player--empty-spacer" aria-hidden="true"></section>`).join(``)}var Zi=`dashboard`;window.gotoOnlineLobby=()=>{if(!n.user){window.focusHubAuthPanel(),$(`Đăng nhập hoặc đăng ký để bắt đầu hành trình.`);return}Zi=`lobby`,window.rerenderGameShell()},window.gotoDashboard=()=>{Zi=`dashboard`,window.rerenderGameShell()},window.switchHubAuthTab=e=>{document.querySelectorAll(`[data-hub-auth-tab]`).forEach(t=>{t.classList.toggle(`is-active`,t.dataset.hubAuthTab===e)}),document.querySelectorAll(`[data-hub-auth-panel]`).forEach(t=>{t.classList.toggle(`is-active`,t.dataset.hubAuthPanel===e)})},window.focusHubAuthPanel=()=>{let e=document.getElementById(`hub-auth`);if(!e){Zi=`dashboard`,X(),window.requestAnimationFrame(()=>{window.focusHubAuthPanel()});return}e.scrollIntoView({behavior:`smooth`,block:`start`}),e.classList.remove(`hub-auth--pulse`),window.requestAnimationFrame(()=>{e.classList.add(`hub-auth--pulse`)}),e.querySelector(`input`)?.focus()},window.startOfflineGame=()=>{alert(`Chế độ chơi offline (Bot) đang được phát triển!`)};function Qi(){if(!n.isReady)return ve(!0);if(!C())return!n.user||Zi===`dashboard`?(Zi=`dashboard`,ve()):fn();if(d.roomState?.phase===`lobby`)return pn();let e=Gi(),t=Ki();return`
    <div class="game-shell">
      ${Yi()}
      ${Ji()}

      <aside class="players-column players-column--left">
        ${e.map(Br).join(``)}
        ${Xi(2-e.length)}
      </aside>

      ${Ti()}

      <aside class="players-column players-column--right">
        ${t.map(Br).join(``)}
        ${Xi(1-t.length)}
        ${wi()}
      </aside>
    </div>
  `}window.rerenderGameShell=X;function X(){zt.innerHTML=Qi(),pe()}var $i=``,ea=null,ta=0,na=``,Z=null,ra=!1,Q=null,ia=null,aa=!1,oa=!1,sa=!1,ca=null,la=!1;function ua(){Z!==null&&(window.clearTimeout(Z),Z=null),ca!==null&&(window.clearTimeout(ca),ca=null)}function da(){let e=d.roomState;if(!e)return`offline`;let t=e.self,n=w.map(t=>{let n=e.players[t],r=n.board.map(e=>e.map(e=>e?`${e.cardId}:${e.tag}:${e.icon}:${e.vp}`:`-`).join(`,`)).join(`|`);return[t,n.name,n.score,n.coin,n.stamina,n.usedSlots,n.isConnected?`1`:`0`,n.isReady?`1`:`0`,r].join(`~`)}).join(`||`);return[e.phase,e.phaseNumber??1,e.dayIndex,e.draftRound,t.draftPool.map(e=>e.id).join(`,`),t.pickedDraftCards.map(e=>e.id).join(`,`),t.hand.map(e=>e.id).join(`,`),n].join(`##`)}function fa(){let e=d.roomState,t=document.querySelector(`.score-breakdown__timer`),n=t?.querySelector(`strong`);if(!(!e||!t||!n)){if(e.phase===`draft`){n.textContent=`${e.timer}s`,t.classList.toggle(`score-breakdown__timer--danger`,e.timer<=3);return}if(e.phase===`planning`){n.textContent=Yr(e.timer),t.classList.toggle(`score-breakdown__timer--danger`,e.timer<=10);return}e.phase===`gameover`&&(n.textContent=`${e.timer}s`,t.classList.toggle(`score-breakdown__timer--danger`,e.timer<=3))}}function pa(){let e=da();if(e!==$i){$i=e,X(),aa&&(aa=!1,ei(),window.setTimeout(()=>{ti()},80)),oa&&(oa=!1,ni());return}fa()}X(),$i=da();function ma(){let e=0,t=0,n=null,r=null,i=!1,a=!1;function o(){J(),n=null,r=null,i=!1}document.addEventListener(`pointerdown`,o=>{let s=o.target;if(!s)return;let c=s.closest(`[data-draft-card-id]`),l=s.closest(`[data-hand-card-id]`),u=null,d=null;j&&c?(u=c.dataset.draftCardId??null,d=`draft`):!j&&!H&&l&&(u=l.dataset.handCardId??null,d=`hand`),!(!u||!d)&&(n=u,r=d,i=!1,e=o.clientX,t=o.clientY,J(),d===`draft`&&!N&&(a=!0,Kr(u)),Ln=window.setTimeout(()=>{n&&(i=!0,R=n,z=null,B=null,V=!0,X())},500))},!0),document.addEventListener(`pointermove`,r=>{!n||Ln===null||Math.hypot(r.clientX-e,r.clientY-t)>8&&o()},!0),document.addEventListener(`pointerup`,a=>{let s=n,c=r,l=i,u=Math.hypot(a.clientX-e,a.clientY-t);o(),c===`draft`&&s&&!l&&u<=8&&j&&(a.preventDefault(),a.stopPropagation())},!0),document.addEventListener(`pointercancel`,()=>{o()},!0),document.addEventListener(`click`,e=>{let t=e.target;if(!t)return;let n=t.closest(`[data-draft-card-id]`);if(n&&j){if(e.preventDefault(),e.stopPropagation(),a){a=!1;return}let t=n.dataset.draftCardId;t&&Kr(t);return}let r=t.closest(`[data-hand-card-id]`);if(r&&!j){e.preventDefault(),e.stopPropagation();let t=r.dataset.handCardId;t&&qr(t)}},!0)}ma(),ha(),bt(),g(()=>{xn(),pa()}),window.createOnlineRoom=(e=`An`)=>{ee(e)},window.joinOnlineRoom=(e,t=`Player`)=>{te(e,t)},window.startOnlineGame=()=>{ae()},window.selectDraftCard=Kr,window.selectHandCard=qr,window.clearSelectedHandCard=Jr;function $(e,t=!1){let n=document.querySelector(`#hub-auth-status`)??document.querySelector(`#auth-status`);n&&(n.textContent=e,n.classList.toggle(`hub-auth__status--error`,t),n.classList.toggle(`hub-auth__status--success`,!!e&&!t),n.classList.toggle(`auth-card__status--error`,t),n.classList.toggle(`auth-card__status--success`,!!e&&!t))}function ha(){document.addEventListener(`submit`,e=>{let t=e.target;if(t){if(t.id===`auth-login-form`||t.id===`hub-auth-login-form`){e.preventDefault(),e.stopPropagation(),window.loginFromAuthScreen();return}(t.id===`auth-register-form`||t.id===`hub-auth-register-form`)&&(e.preventDefault(),e.stopPropagation(),window.registerFromAuthScreen())}},!0)}window.loginFromAuthScreen=()=>Rt(void 0,void 0,void 0,function*(){let e=document.querySelector(`#hub-auth-login-username`)??document.querySelector(`#auth-login-username`),t=document.querySelector(`#hub-auth-login-password`)??document.querySelector(`#auth-login-password`);$(`Đang đăng nhập...`);try{yield o({username:e?.value.trim()??``,password:t?.value??``}),$(`Đăng nhập thành công.`),X()}catch(e){let t=e instanceof Error?e.message:`Đăng nhập thất bại.`;$(t,!0),alert(t)}}),window.registerFromAuthScreen=()=>Rt(void 0,void 0,void 0,function*(){let e=document.querySelector(`#hub-auth-register-display-name`)??document.querySelector(`#auth-register-display-name`),t=document.querySelector(`#hub-auth-register-username`)??document.querySelector(`#auth-register-username`),n=document.querySelector(`#hub-auth-register-password`)??document.querySelector(`#auth-register-password`);$(`Đang tạo tài khoản...`);try{yield s({displayName:e?.value.trim()||void 0,username:t?.value.trim()??``,password:n?.value??``}),$(`Tạo tài khoản thành công.`),X()}catch(e){let t=e instanceof Error?e.message:`Đăng ký thất bại.`;$(t,!0),alert(t)}}),window.logoutFromAuthScreen=()=>{c(),d.roomId=null,d.playerId=null,d.roomState=null,Zi=`dashboard`,X()},window.createRoomFromLobby=()=>{ee(document.querySelector(`#lobby-create-name`)?.value.trim()||n.user?.displayName||n.user?.username||`An`)},window.joinRoomFromLobby=()=>{let e=document.querySelector(`#lobby-join-name`),t=document.querySelector(`#lobby-room-code`),n=e?.value.trim()||`Player`,r=t?.value.trim().toUpperCase();if(!r){alert(`Nhập room code trước.`);return}te(r,n)},window.reconnectSavedRoomFromLobby=()=>{let e=m();e&&ne(e.roomId,e.playerId,e.playerName)},window.clearSavedRoomFromLobby=()=>{h(),X()},window.toggleReadyFromLobby=()=>{let e=ln();if(!e||!d.playerId||!d.roomState)return;let t=!e.isReady;d.roomState.players[d.playerId].isReady=t,X(),re(t)},window.leaveRoomFromLobby=()=>{ie(),X()},window.copyRoomCodeFromLobby=()=>Rt(void 0,void 0,void 0,function*(){let e=d.roomId;if(e)try{yield navigator.clipboard.writeText(e),alert(`Đã copy room code: ${e}`)}catch{prompt(`Copy room code:`,e)}}),window.openMidGameRanking=()=>{Bn=!0,X()},window.closeMidGameRanking=()=>{Bn=!1,X()},window.downloadTravelCertificateHtml=()=>{Nt()},window.downloadTravelTimelineTxt=()=>{It(`txt`)},window.downloadTravelTimelineJson=()=>{It(`json`)},window.copyTravelTimeline=()=>{Lt()},window.debugOnlineBoards=()=>{let e=d.roomState;if(!e)return console.log(`No online room state.`),null;let t={},n=[`p1`,`p2`,`p3`,`p4`];for(let r of n){let n=e.players[r],i=[];for(let e=0;e<n.board.length;e+=1){let t=n.board[e];for(let n=0;n<t.length;n+=1){let r=t[n];r&&i.push({rowIndex:e,colIndex:n,cardId:r.cardId,tag:r.tag,icon:r.icon,vp:r.vp})}}t[r]={name:n.name,connected:n.isConnected,usedSlots:n.usedSlots,filledCells:i}}return console.table(n.map(e=>({playerId:e,name:t[e].name,connected:t[e].connected,usedSlots:t[e].usedSlots,filled:t[e].filledCells.length}))),console.log(t),t},window.onlineClientState=d,window.debugOnlineScores=()=>{let e=d.roomState;if(!e)return console.log(`No online room state.`),null;let t=w.map(t=>{let n=e.players[t];return{playerId:t,name:n.name,score:n.score,coin:n.coin,stamina:n.stamina,usedSlots:n.usedSlots,connected:n.isConnected,ready:n.isReady,joined:n.hasJoined}});return console.table(t),t},globalThis.createOnlineRoom=window.createOnlineRoom,globalThis.joinOnlineRoom=window.joinOnlineRoom,globalThis.startOnlineGame=window.startOnlineGame,globalThis.selectDraftCard=window.selectDraftCard,globalThis.selectHandCard=window.selectHandCard,globalThis.clearSelectedHandCard=window.clearSelectedHandCard,globalThis.loginFromAuthScreen=window.loginFromAuthScreen,globalThis.registerFromAuthScreen=window.registerFromAuthScreen,globalThis.logoutFromAuthScreen=window.logoutFromAuthScreen,globalThis.forceLogoutAuth=window.logoutFromAuthScreen,globalThis.createRoomFromLobby=window.createRoomFromLobby,globalThis.joinRoomFromLobby=window.joinRoomFromLobby,globalThis.reconnectSavedRoomFromLobby=window.reconnectSavedRoomFromLobby,globalThis.clearSavedRoomFromLobby=window.clearSavedRoomFromLobby,globalThis.toggleReadyFromLobby=window.toggleReadyFromLobby,globalThis.copyRoomCodeFromLobby=window.copyRoomCodeFromLobby,globalThis.leaveRoomFromLobby=window.leaveRoomFromLobby,globalThis.onlineClientState=d,globalThis.openMidGameRanking=window.openMidGameRanking,globalThis.closeMidGameRanking=window.closeMidGameRanking,globalThis.downloadTravelCertificateHtml=window.downloadTravelCertificateHtml,globalThis.downloadTravelTimelineTxt=window.downloadTravelTimelineTxt,globalThis.downloadTravelTimelineJson=window.downloadTravelTimelineJson,globalThis.copyTravelTimeline=window.copyTravelTimeline,globalThis.playGameSound=x,globalThis.debugOnlineBoards=window.debugOnlineBoards,globalThis.selectDraftCard=window.selectDraftCard,X();