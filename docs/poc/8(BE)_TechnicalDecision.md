
## 1. Tech Stack Thực Tế

Kiến trúc tuân theo sơ đồ phân chia ba panel: **Build pipeline (Makefile)**, **Client (Trình duyệt)**, và **Server (Deno)**, với **Logic dùng chung (`src/`)** là nhân domain.

| Tầng | Công nghệ | Vai trò trong Backend | Lý do chọn |
|---|---|---|---|
| **Runtime** | Deno | Chạy `server.ts` — điểm vào HTTP + WebSocket listener | TypeScript gốc, sandbox bảo mật tích hợp, không có `node_modules` cồng kềnh | Ô Server (Deno) |
| **Ngôn ngữ** | TypeScript | Định nghĩa kiểu dùng chung giữa client + server; an toàn tại compile-time cho trạng thái game | Một ngôn ngữ cho toàn stack; logic dùng chung trong `src/` biên dịch cho cả hai target | 
| **Transport** | WebSocket (Deno gốc) | Kênh real-time hai chiều từ `multi.ts` (client) đến `server.ts` | Giai đoạn Bốc Bài truyền bài, tung xúc xắc, cập nhật VP cần push dưới 100ms; HTTP polling quá chậm |
| **Messaging** | JSON-RPC 2.0 | Giao thức request/response có kiểu qua WS — `player.ts` xử lý một luồng RPC per socket | Stateless, có thể versioning, dễ mock trong unit test; tránh overhead giao thức binary tùy chỉnh | 
| **State Machine** | `game.ts` (FSM tùy chỉnh) | State machine phòng — theo dõi pha (Bốc Bài → Lắp Ráp Lưới → Mô Phỏng → Tính Điểm), chỉ số ngày, tài nguyên người chơi | Vòng lặp game có trình tự pha nghiêm ngặt (3 ngày × 4 pha) ánh xạ tự nhiên sang FSM transitions; ngăn nhảy trạng thái trái phép | 
| **Triển khai** | Docker (`Dockerfile`) | Đóng gói Deno runtime + các tài nguyên đã biên dịch vào một container image có thể tái tạo | Loại bỏ drift môi trường; cho phép mở rộng ngang cho các triển khai multi-room | 

---

## 2. Vai Trò Của Developer Backend Theo Module

Mỗi file trong panel **Server (Deno)** và **Logic dùng chung** sở hữu một mối quan tâm backend riêng biệt.

| File / Module | Trách nhiệm Developer Backend | Hàm / Phương thức chính | Giao tiếp với |
|---|---|---|---|
| `server.ts` | Khởi động HTTP + WS server; định tuyến WS upgrade handshake; endpoint health check | `Deno.serve()`, `Deno.upgradeWebSocket(req)`, các handler `onopen/onmessage/onclose` | `game.ts` (tạo phòng), `player.ts` (một per socket) |
| `game.ts` | Sở hữu FSM phòng: chuyển đổi pha, tick timer, broadcast snapshot trạng thái đến tất cả người chơi trong phòng | `createRoom()`, `transition(event)`, `broadcastSnapshot()`, `resolveDay()` | `player.ts` (nhận hành động), `board.ts` (thay đổi lưới), `score.ts` (tổng kết cuối) |
| `player.ts` | Dispatcher JSON-RPC per socket; xác thực và chuyển tiếp hành động người chơi; quản lý trạng thái tài nguyên per-player (Xu, Stamina, Debt) | `dispatch(method, params)`, `validateResources()`, `applyDebt()`, `applyStaminaLock()` | `game.ts` (phát hành động đã xác thực), `rules.ts` (kiểm tra ràng buộc) |

---

## 3. Bản Ghi Quyết Định Kiến Trúc (ADR)

Mỗi ADR ghi lại một quyết định backend quan trọng: vấn đề gì đã thúc đẩy, các lựa chọn nào đã được xem xét, điều gì được chọn và những đánh đổi.

---

### ADR-001 · Sử Dụng Deno Thay Vì Node.js Làm Server Runtime 

**Bối cảnh**

Game server cần chạy TypeScript gốc, expose cả endpoint HTTP và WebSocket, và có thể triển khai trong Docker container. Node.js yêu cầu bước build (`tsc`) và công cụ type-stripping riêng. Team muốn giữ runtime stack tối thiểu.

**Các Lựa Chọn Đã Xem Xét**

| Lựa chọn | Ưu điểm | Nhược điểm |
|---|---|---|
| Node.js + ts-node | Ecosystem lớn, được biết đến rộng rãi; ts-node cho TS gần native | Phụ thuộc thêm; ts-node có các edge case về hiệu suất đã biết; tsconfig phân kỳ giữa client và server |
| **Deno** ✓ | TypeScript first-class, sandbox bảo mật tích hợp, `Deno.upgradeWebSocket(req)` tích hợp, binary đơn | Ecosystem nhỏ hơn; một số npm package cần compat shim |
| Bun | Khởi động nhanh, tương thích node | Kém trưởng thành hơn; WS API thay đổi giữa các release; kích thước Docker image lớn hơn |

**Quyết định:** Sử dụng Deno làm runtime server chính.

**Lý do:** Hỗ trợ TypeScript first-class của Deno loại bỏ nhu cầu về một tiến trình `tsc` watch riêng ở phía server. WS upgrade tích hợp trong `Deno.serve()` ánh xạ trực tiếp vào thiết kế `server.ts`. Sandbox bảo mật ngăn rò rỉ file system vô tình từ các lỗi logic game.

**Hệ quả:** Không có sự không khớp tsconfig giữa client và server. Một số npm package (đặc biệt ORM) cần chỉ định `npm:` rõ ràng. Team phải được đào tạo về Deno permission flags cho entrypoint Dockerfile.

---

### ADR-002 · Sử Dụng WebSocket + JSON-RPC 2.0 Cho Messaging Client–Server 

**Bối cảnh**

Pha Bốc Bài yêu cầu đồng thời lật bài và truyền bài giữa hai người chơi với độ trễ dưới 200 ms. Pha Mô Phỏng cần server push sự kiện tung xúc xắc đến tất cả clients mà không cần client polling.

**Các Lựa Chọn Đã Xem Xét**

| Lựa chọn | Ưu điểm | Nhược điểm |
|---|---|---|
| REST (HTTP polling) | Đơn giản; không có connection state | Độ trễ cao cho game event; không thể push từ server; lãng phí băng thông |
| Server-Sent Events (SSE) | Server push; không cần giao thức đặc biệt | Chỉ một chiều; hành động client vẫn cần REST; hai kết nối per player |
| WebSocket + raw JSON | Độ trễ thấp, hai chiều | Không có request/response chuẩn hóa; client phải tự implement correlation ID |
| **WebSocket + JSON-RPC 2.0** ✓ | Độ trễ thấp + method call có cấu trúc với `id` correlation; dễ unit-test | Thêm một ít byte envelope per message so với giao thức binary |

**Quyết định:** WebSocket transport với JSON-RPC 2.0 message framing.

**Lý do:** JSON-RPC 2.0 xử lý cả pattern request/response (method call với `id`) lẫn server-push (notification không có `id`). Giao thức dễ đọc, dễ mock trong test, và chỉ thêm < 50 byte overhead per message — chấp nhận được với throughput của game này.

**Hệ quả:** Mỗi instance `player.ts` duy trì một JSON-RPC dispatcher. Developers phải đảm bảo notification broadcasts (`game.broadcastSnapshot()`) không bao giờ vô tình có `id` request, vì clients sẽ xử lý chúng như RPC response.

---

### ADR-003 · Implement Game Loop Như Một Finite State Machine Tường Minh Trong `game.ts` 

**Bối cảnh**

Game có vòng lặp có thứ tự nghiêm ngặt: Pha Bốc Bài → Lắp Ráp Lưới → Mô Phỏng (tung xúc xắc) → Tính Điểm, lặp lại qua 3 ngày, sau đó chuyển pha (Sài Gòn → Đà Nẵng hoặc Đà Lạt → thành phố cuối). Xử lý điều này với các biến boolean ad-hoc có nguy cơ tạo ra các tổ hợp trạng thái không hợp lệ.

**Các Lựa Chọn Đã Xem Xét**

| Lựa chọn | Ưu điểm | Nhược điểm |
|---|---|---|
| Biến flag ad-hoc | Nhanh để prototype | Bùng nổ tổ hợp trạng thái không hợp lệ; khó kiểm tra |
| XState (thư viện) | Đã được kiểm chứng, có thể trực quan hóa | Thêm dependency; quá mức cần thiết cho vòng lặp theo lượt xác định; cần compat layer cho Deno |
| **FSM tùy chỉnh trong `game.ts`** ✓ | Không phụ thuộc; state là enum tường minh; `transition()` là hàm thuần có thể test độc lập | Phải duy trì bảng transition thủ công |

**Quyết định:** Implement một FSM tùy chỉnh bên trong `game.ts` với enum `GamePhase` tường minh và hàm `transition(event)`.

**Lý do:** Vòng lặp game có một tập hợp trạng thái nhỏ, hữu hạn (≈8) và một bảng transition được định nghĩa rõ ràng. FSM tùy chỉnh là < 150 dòng và có thể unit-test bằng cách đưa các event vào `transition()`. Nó ngăn đặt tile trong Simulation và thực thi giới hạn 3 ngày trước khi chuyển pha.

**Hệ quả:** Mỗi cơ chế game mới phải cập nhật bảng transition FSM — ma sát có chủ đích ngăn rò rỉ trạng thái vô tình. `player.ts` và `score.ts` phải query `game.ts` về pha hiện tại trước khi thực thi bất kỳ logic nào.

---

### ADR-004 · Sử Dụng Docker Để Đóng Gói Server Thay Vì VM Trần 

**Bối cảnh**

Deno server phải có thể triển khai lên hạ tầng cloud. Team đã xem xét ba mô hình triển khai cho lần ra mắt đầu tiên.

**Các Lựa Chọn Đã Xem Xét**

| Lựa chọn | Ưu điểm | Nhược điểm |
|---|---|---|
| Bare metal / VM có cài Deno | Đơn giản, không overhead container | Environment drift giữa dev và prod; khó mở rộng ngang |
| **Docker container (`Dockerfile` trong repo)** ✓ | Có thể tái tạo; portable; dễ mở rộng ngang | Yêu cầu Docker daemon trên host; bước build image trong CI |
| Serverless (ví dụ Deno Deploy) | Không cần ops; tự động mở rộng | Model persistence WebSocket khác; room state không thể giữ trong bộ nhớ qua các lần gọi mà không cần external store |

**Quyết định:** Đóng gói server dưới dạng Docker image sử dụng `Dockerfile` trong panel Server.

**Lý do:** WebSocket session là stateful — FSM `game.ts` của phòng sống trong bộ nhớ server suốt phiên. Serverless functions không thể giữ in-memory state qua các lần gọi mà không có external store (Redis, v.v.), điều này thêm độ trễ và chi phí ở giai đoạn MVP.

**Hệ quả:** Mở rộng ngang yêu cầu sticky sessions (định tuyến mỗi WebSocket theo room ID đến cùng container) hoặc migrate room state sang external store. Đây là nút thắt cổ chai mở rộng chính cần xem xét lại nếu số lượng phòng đồng thời vượt quá khả năng của một container.

---
