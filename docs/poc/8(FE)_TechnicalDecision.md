## 1. Tech Stack Thực Tế

Kiến trúc tuân theo sơ đồ phân chia ba panel: **Build pipeline (Makefile)**, **Client (Trình duyệt)**, và **Server (Deno)**, với **Logic dùng chung (`src/`)** là nhân domain.

| Tầng | Công nghệ | Vai trò trong Frontend | Lý do chọn | Ánh xạ trong sơ đồ |
|---|---|---|---|---|
| **Runtime** | Browser (DOM API) | Môi trường thực thi trực tiếp `client.js` và render `index.html`, `client.css` | Môi trường đích bắt buộc của Web App; hỗ trợ native HTML5 Drag and Drop API cho cơ chế xếp thẻ | Ô Client / Browser |
| **Ngôn ngữ** | TypeScript & Less | Định nghĩa logic điều khiển UI an toàn (TS); hệ thống biến và lồng ghép cho giao diện (Less) | Bắt lỗi tương tác DOM từ lúc code; quản lý màu sắc thẻ bài (Đà Lạt, Sài Gòn) dễ dàng nhờ biến Less | Build Pipeline `tsc` & `lessc`; Panel Logic dùng chung |
| **Giao diện & Cấu trúc** | HTML5 & CSS Grid | Xây dựng khung lưới lịch trình 3x5 và quản lý layout tổng thể | CSS Grid ánh xạ hoàn hảo 1:1 với logic ma trận 3 ngày × 5 slot thời gian trong `board.ts` | Tệp `index.html` và `client.css` |
| **Transport** | WebSocket (Browser API) | Kênh real-time kết nối lên server để truyền nhận hành động người chơi | Cần gửi tọa độ thẻ bài (drag-drop) lập tức không cần tải lại trang; nhận broadcast tức thời từ đối thủ | Mũi tên WS giữa `multi.ts` và Server |
| **Trạng thái UI** | Vanilla TS (`app.ts`) | Quản lý DOM state: cập nhật thanh năng lượng, số Xu, vẽ lại lưới 3x5 khi thẻ được thả | Giữ bundle size cực nhỏ, không có overhead của Virtual DOM (như React/Vue) cho một game ưu tiên tốc độ | Ô App (`app.ts`) |
| **Domain Logic** | Tái sử dụng `src/` | Chạy bộ luật (`rules.ts`, `score.ts`) trực tiếp trên trình duyệt để tính điểm tạm thời (Optimistic UI) | Tính điểm và báo lỗi sai luật ngay khi người chơi đang cầm thẻ kéo thả, không cần đợi server phản hồi | Panel Logic dùng chung (`Client` -> `Rules`) |
| **Build Tool** | Rollup | Nén các module thành một tệp thực thi duy nhất (`client.js`) | Hỗ trợ Tree-shaking cực tốt, loại bỏ code dư thừa để tối ưu tốc độ tải file trên di động | Node `rollup` trong Build Pipeline |
| **Offline / PWA** | Service Worker (Cache API) | Lưu đệm `index.html`, `client.js`, `client.css` và hình ảnh trong `img/` | Đảm bảo người chơi mở được game ngay cả khi mất mạng (đang đi xe khách, leo núi); giảm tải băng thông | Node `sw.js` -> Cache Storage |

---

## 2. Vai Trò Của Developer Frontend Theo Module

Mỗi file trong panel **Client (Browser)** và **Build Pipeline** sở hữu một mối quan tâm frontend riêng biệt.

| File / Module | Trách nhiệm Developer Frontend | Hàm / Khái niệm chính | Giao tiếp với |
|---|---|---|---|
| `app.ts` | Main Controller: Gắn sự kiện (event listener) cho các thao tác click, drag-drop; cập nhật thanh trạng thái Xu/Stamina; render thẻ bài | `initGame()`, `onDragStart()`, `onDrop()`, `updateUI()` | `multi.ts` (truyền hành động), DOM (vẽ UI), `rules.ts` (kiểm tra luật cục bộ) |
| `multi.ts` | Network Interface: Quản lý vòng đời WebSocket ở phía client; chuyển đổi hành động UI thành JSON-RPC messages; nhận lệnh vẽ lại từ server | `connectWS()`, `sendAction(method, params)`, `onServerMessage()` | `app.ts` (kích hoạt render lại UI), `server.ts` (gửi request) |
| `client.css` (từ `less`) | Styling Engine: Xác định vị trí các slot lưới 3x5; tạo animation tráo bài; định nghĩa class màu sắc cho các thẻ khu vực | `display: grid`, CSS Variables (`--dalat-color`), `@keyframes` | DOM elements (áp dụng styles) |
| `sw.js` | Cache Middleware: Chặn (intercept) các request mạng; nạp trước (pre-cache) tài nguyên tĩnh lúc khởi động | `self.addEventListener('install')`, `caches.match(request)` | Browser Cache, Network (để fetch file ảnh) |
| `rollup.config.js` | Bundler Config: Định nghĩa điểm vào (`app.ts`), cấu hình output (`client.js`), tích hợp plugin giải quyết dependency | `input`, `output.file`, `plugins: [typescript()]` | File source (`src/`), Thư mục đích (`build/`) |

---

## 3. Bản Ghi Quyết Định Kiến Trúc (ADR)

### ADR-001 · Sử Dụng Vanilla TypeScript Thay Vì Framework (React/Vue)

**Bối cảnh**
Game yêu cầu các tương tác kéo thả (Drag and Drop) phức tạp, hiệu năng cao trên lưới 3x5. Kích thước file tải xuống (bundle size) cần cực kỳ tối ưu vì target là người dùng di động, PWA, có thể sử dụng mạng 3G/4G yếu.

**Các Lựa Chọn Đã Xem Xét**
| Lựa chọn | Ưu điểm | Nhược điểm |
|---|---|---|
| React.js | Hệ sinh thái lớn; quản lý state dễ dàng với Hooks | Overhead Virtual DOM; cần thêm thư viện dnd (drag-drop) cồng kềnh; bundle size lớn |
| Vue.js | Nhẹ hơn React một chút; dễ học | Vẫn phụ thuộc vào engine của framework; khó can thiệp sâu vào DOM native |
| **Vanilla TS (`app.ts`)** ✓ | Không có dependency; tận dụng tối đa HTML5 Drag and Drop API; tốc độ thực thi nhanh nhất | Phải tự viết logic cập nhật DOM thủ công; nguy cơ code rối nếu không module hóa tốt |

**Quyết định:** Viết logic UI hoàn toàn bằng Vanilla TypeScript, không dùng Framework UI.

**Lý do:** Bản chất của game là thao tác trực tiếp lên tọa độ lưới. Việc sử dụng HTML5 Drag/Drop native nhanh và nhẹ hơn nhiều so với việc wrap qua Virtual DOM. Bundle size sẽ giảm được hàng trăm KB, giúp game tải gần như lập tức.

**Hệ quả:** Developer phải tự quản lý việc đồng bộ giữa State (dữ liệu) và View (DOM). Mọi thay đổi dữ liệu phải đi kèm hàm `updateUI()` thủ công.

---

### ADR-002 · Xử Lý Giao Diện Bằng CSS Preprocessor (Less) Kết Hợp CSS Grid

**Bối cảnh**
Giao diện yêu cầu một bàn cờ thời gian 3x5, các thẻ bài có màu sắc riêng theo khu vực, và cần khả năng bảo trì cao khi thêm các vùng du lịch mới.

**Các Lựa Chọn Đã Xem Xét**
| Lựa chọn | Ưu điểm | Nhược điểm |
|---|---|---|
| CSS thuần + Flexbox | Trình duyệt hiểu ngay, không cần build | Khó làm lưới 2 chiều (3x5); code lặp lại nhiều ở phần định nghĩa màu sắc thẻ |
| Tailwind CSS | Viết CSS cực nhanh, file nhỏ | HTML DOM trở nên khổng lồ vì class name; khó debug trên công cụ DevTools |
| **Less + CSS Grid** ✓ | Dùng biến Less để quản lý theme; CSS Grid giải quyết ma trận 3x5 chỉ với 2 dòng code | Phải thêm node `lessc` vào pipeline build |

**Quyết định:** Sử dụng Less để biên dịch ra CSS, và dùng CSS Grid làm layout chính cho board game.

**Lý do:** CSS Grid (`grid-template-columns: repeat(5, 1fr)`) sinh ra là để làm lưới 3x5. Kết hợp với biến của Less, việc thay đổi theme màu sắc hoặc kích thước toàn bộ game chỉ cần sửa ở 1 nơi duy nhất thay vì tìm-thay-thế hàng loạt class.

**Hệ quả:** Dây chuyền `Makefile` cần thêm bước gọi `lessc`. Không dùng trực tiếp file `.css` trong thư mục source mà phải làm việc qua `client.css` ở thư mục `build/`.

---

### ADR-003 · Triển Khai Optimistic UI Cho Phép Tương Tác Không Độ Trễ

**Bối cảnh**
Game chơi qua mạng (WebSocket). Khi người chơi kéo thẻ thả vào lưới, nếu phải đợi server xác nhận "hợp lệ" rồi mới vẽ vào lưới thì sẽ bị khựng (lag), gây trải nghiệm thao tác kém mượt mà.

**Các Lựa Chọn Đã Xem Xét**
| Lựa chọn | Ưu điểm | Nhược điểm |
|---|---|---|
| Đợi Server Authority | Code dễ viết, không bao giờ sai lệch trạng thái | Trải nghiệm cực tệ nếu ping cao (>100ms), thẻ bị giật ngược lại |
| Client Authority | Trải nghiệm mượt mà lập tức | Nguy cơ hack/cheat game quá cao (client tự cho mình thêm Xu) |
| **Optimistic UI (Chạy `rules.ts` tại Client)** ✓ | Mượt như game offline; bảo mật tuyệt đối nhờ server tái xác thực | Phải share chung mã nguồn `src/` giữa client và server |

**Quyết định:** Import thư mục `src/` (`rules.ts`, `score.ts`) vào `app.ts`. Tính toán điểm tạm thời và check luật trực tiếp ngay khi thả thẻ bài. Giả định thành công, sau đó gửi sự kiện lên server qua `multi.ts`.

**Lý do:** Vừa mượt (do xử lý tức thời ở Browser) vừa an toàn (do server vẫn cầm trịch kết quả cuối). Vì dùng chung logic TypeScript, client không bao giờ báo hợp lệ cho một nước đi mà server sẽ từ chối.

**Hệ quả:** Rollup phải gom mã nguồn thư mục `src/` vào `client.js`. Client phải chuẩn bị cơ chế "rollback" (hủy thao tác, giật thẻ bài về vị trí cũ) nếu lỡ nhận được báo lỗi từ Server do mạng bất đồng bộ.

---

### ADR-004 · Tối Ưu Tải Trạng Thái Bằng Service Worker (`sw.js`) & Cache Storage

**Bối cảnh**
Là game du lịch, người chơi có thể mở game khi đang di chuyển trên tàu xe, nơi kết nối mạng chập chờn. Việc phải fetch lại đống ảnh thẻ bài `img/` liên tục sẽ làm nghẽn game.

**Các Lựa Chọn Đã Xem Xét**
| Lựa chọn | Ưu điểm | Nhược điểm |
|---|---|---|
| LocalStorage | Dễ implement (set/get) | Giới hạn dung lượng nhỏ (~5MB); chỉ lưu được text, không lưu được file ảnh tốt |
| Không làm offline | Đơn giản hóa kiến trúc Client | Mất điểm trải nghiệm UX; không đáp ứng tiêu chuẩn PWA |
| **Service Worker + Cache Storage API** ✓ | Lưu trữ toàn bộ asset lớn; tự động chặn fetch request để trả về file cục bộ | Vòng đời (Lifecycle) phức tạp; cần chiến lược xóa cache khi game cập nhật version mới |

**Quyết định:** Sử dụng Service Worker (`sw.js`) để cache `index.html`, `client.js`, `client.css` và toàn bộ thư mục `img/`.

**Lý do:** Chiến lược "Cache-First" sẽ giúp game load mất < 1 giây ở các lần mở sau, giảm tải server. Đặc biệt quan trọng cho các file ảnh tĩnh không bao giờ thay đổi (như mặt thẻ bài).

**Hệ quả:** Developer phải xử lý cẩn thận phiên bản (versioning) trong `sw.js`. Nếu build bản cập nhật mới (ví dụ sửa lỗi tính điểm) mà không đổi key cache, người chơi sẽ kẹt ở phiên bản lỗi vĩnh viễn dù đã có mạng.
