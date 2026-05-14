## 5.1 Overview — System Topology, Frontend–Backend Boundary

Hệ thống được thiết kế theo kiến trúc **Stateful Real-time PWA**, tối ưu hóa cho trải nghiệm di động và khả năng chơi offline. Kiến trúc này không chia cắt cứng nhắc giữa các tầng mà kết nối chặt chẽ thông qua một lõi logic dùng chung (Shared Logic), đảm bảo tính đồng nhất giữa trải nghiệm người dùng và quy tắc nghiệp vụ của máy chủ.

---

### A. System Topology (Sơ đồ cấu trúc hệ thống)

Tổ chức hệ thống được phân tách thành 3 phân vùng (Panels) chức năng chính, xoay quanh một lõi domain tập trung:



1.  **Build Pipeline (Hạ tầng sản xuất - Makefile):**
    * **Nhiệm vụ:** Chuyển đổi mã nguồn (`.ts`, `.less`) thành các tài nguyên phân phối (`.js`, `.css`).
    * **Thành phần:** `tsc` (kiểm lỗi), `lessc` (định dạng), `rollup` (đóng gói), và `sw.js` (quản lý PWA).
2.  **Server Side (Hệ thống máy chủ - Deno):**
    * **Nhiệm vụ:** Quản lý quyền lực (Authority), trạng thái phòng chơi (Room State), và kết nối đa người chơi.
    * **Thành phần:** `server.ts` (entry point), `game.ts` (FSM điều khiển vòng lặp), và `player.ts` (xử lý phiên người chơi).
3.  **Client Side (Giao diện người dùng - Browser):**
    * **Nhiệm vụ:** Render giao diện đồ họa, xử lý tương tác trực tiếp và phản hồi tức thời (Optimistic UI).
    * **Thành phần:** `index.html` (Entry Point), `app.ts` (Main UI Controller), và `multi.ts` (Network Interface).
4.  **Shared Logic (Nhân Domain - `src/`):**
    * **Nhiệm vụ:** Chứa bộ luật chơi (`rules.ts`, `score.ts`). Đây là thành phần duy nhất chạy song song ở cả Client và Server để đảm bảo tính nhất quán.

---

### B. Frontend–Backend Boundary (Ranh giới Client – Server)

Ranh giới giữa Frontend và Backend hoạt động theo cơ chế **State Synchronization (Đồng bộ trạng thái)** thay vì các Request/Response tĩnh thông thường.



#### 1. Giao thức kết nối (The Bridge)
* **Kênh truyền dẫn:** **WebSocket** (Full-duplex) đảm bảo độ trễ thấp (<100ms) cho các pha hành động thời gian thực.
* **Định dạng thông điệp:** **JSON-RPC 2.0**. Các hành động như "thả thẻ" hoặc "kết thúc pha" được đóng gói thành các lời gọi hàm từ xa có cấu trúc rõ ràng.

#### 2. Phân chia trách nhiệm (Responsibility Split)
Hệ thống vận hành theo nguyên lý **"Optimistic Client — Authoritative Server"**:

| Đặc điểm | Phía Client (Frontend) | Phía Server (Backend) |
| :--- | :--- | :--- |
| **Vai trò chính** | **Trải nghiệm & Tương tác (UX)** | **Quyền quyết định & Sự thật (Authority)** |
| **Xử lý Logic** | Dự đoán kết quả (Preview) dựa trên Shared Logic để phản hồi UI tức thì. | Tái kiểm tra (Validate) mọi hành động gửi lên để ngăn chặn gian lận. |
| **Trạng thái** | Chỉ lưu giữ trạng thái cục bộ của 1 người dùng. | Quản lý trạng thái tổng thể của cả phòng chơi (Room FSM). |
| **Lưu trữ** | Caching tài nguyên qua Service Worker. | Lưu trữ trạng thái trận đấu trong bộ nhớ Deno (In-memory). |

---

### C. Luồng tương tác xuyên biên giới (Interaction Flow)

Để minh họa ranh giới này, xét quy trình khi một người chơi thực hiện nước đi:
1.  **Tại Client:** `app.ts` gọi `rules.ts` (Shared) để kiểm tra hợp lệ ngay lập tức và hiển thị điểm dự kiến (0ms delay).
2.  **Qua Boundary:** `multi.ts` gửi gói tin JSON-RPC `place_tile` qua WebSocket.
3.  **Tại Server:** `player.ts` tiếp nhận, `game.ts` gọi chính `rules.ts` (Shared) đó để xác thực lần cuối.
4.  **Đồng bộ:** Nếu hợp lệ, Server cập nhật trạng thái chung và broadcast snapshot mới nhất cho tất cả người chơi để đồng bộ hóa giao diện.

Kiến trúc này giúp dự án đạt được sự cân bằng giữa tốc độ phản hồi của ứng dụng Offline và tính bảo mật, đồng bộ của ứng dụng Online.
