# Proof of Concept

_(Title, authors, date, organization, version)_

_Draft (version 0.1)_

---

## 1. Problem Statement
What exists, what's broken or missing, why it matters.

## 2. Constraints & Assumptions
What is out of scope. What you're assuming to be true. What external dependencies you're taking for granted.

## 3. Solution Proposal 
The software you want to build, and why it addresses the problem.

## 4. Target Audience & Use Cases
Who uses it. Identified use cases. Which subset is the MVP target.

## 5. Architecture

### 5.1 Overview — system topology, frontend–backend boundary

### 5.2 Detailed Infrastructure — modules/services, their responsibilities, and interactions

### 5.3 User Experience & Data Flow — app logic from the user's perspective, what they input and what they get at each stage

#### A. Giai đoạn Khởi tạo & Đồng bộ (Bootstrap Flow)
* **Trải nghiệm người dùng (UX):** Người dùng mở ứng dụng lần đầu (PWA). Hệ thống hiển thị màn hình chờ (Splash Screen) kèm thanh tiến trình trong khi tải dữ liệu thế giới game.
* **Luồng dữ liệu (Data Flow):**
  * Client gửi mã phiên bản hiện tại lên Server qua interface **IF-4**.
  * Server trả về gói dữ liệu JSON (**IF-1**) chứa toàn bộ danh sách Thẻ địa điểm, Quests, và sự kiện ngẫu nhiên.
  * Dữ liệu được lưu trữ trực tiếp vào **IndexedDB** qua thư viện Dexie.js để sẵn sàng chạy offline.

#### B. Giai đoạn Chọn bài (Drafting Phase)
* **Trải nghiệm người dùng (UX):** Hệ thống phát 5 thẻ bài cho mỗi người chơi. Người dùng chạm để chọn 1 thẻ giữ lại và "úp bài" để tráo 4 thẻ còn lại cho đối thủ.
* **Luồng dữ liệu (Data Flow):**
  * Thao tác chọn thẻ kích hoạt **State Manager (Svelte stores)** cập nhật trạng thái "Hand" của người chơi.
  * Các sự kiện chọn bài được ghi nhận vào **Analytics Queue (IF-2)** để phân tích hành vi người dùng sau này.

#### C. Giai đoạn Lên lịch trình (Grid Placement Phase)
* **Trải nghiệm người dùng (UX):** Người dùng kéo-thả các thẻ vào lưới 3x5 tương ứng với 3 ngày và 5 nhịp thời gian (Sáng, Trưa, Chiều, Tối, Khuya).
* **Luồng dữ liệu (Data Flow):**
  * **Logic validation:** Khi thẻ được đặt vào ô, hệ thống truy xuất tọa độ từ **IndexedDB** để so sánh với thẻ liền trước.
  * Nếu khoảng cách vượt ngưỡng (>10km hoặc >30km), **Game Logic** sẽ tính toán hình phạt trừ điểm VP và hiển thị cảnh báo đỏ trên UI.
  * **Resource Manager:** Hệ thống kiểm tra Xu và Thể lực hiện có. Nếu người dùng chọn "Vay", logic **Scoring** sẽ ghi nhận các Token Nợ hoặc trạng thái "Khóa ô" (Freeze) vào trạng thái bộ nhớ cục bộ.

#### D. Giai đoạn Mô phỏng & Sự kiện (Simulation & Event Flow)
* **Trải nghiệm người dùng (UX):** Người dùng kích hoạt chạy mô phỏng. Hệ thống duyệt qua từng ô thẻ, đổ xúc xắc và hiển thị các sự kiện ngẫu nhiên (Mưa giông, Kẹt xe...) bằng các hiệu ứng hình ảnh kịch tính.
* **Luồng dữ liệu (Data Flow):**
  * **Quest/Event FSM (Finite State Machine)** chạy vòng lặp duyệt thẻ. Với mỗi thẻ, FSM đối chiếu thuộc tính (Tag) để xác định xác suất kích hoạt sự kiện phù hợp.
  * Kết quả cuối cùng (Tổng Điểm Hạnh Phúc - VP) được **Scoring Module** tính toán và cập nhật lại vào **State Manager** để hiển thị màn hình tổng kết.

#### E. Giai đoạn Đồng bộ & Phân tích (Background Sync)
* **Trải nghiệm người dùng (UX) - Input/Output:**
  * **Input:** Người chơi bấm nút "Hoàn tất" hoặc "Xem bảng xếp hạng" tại màn hình Tổng kết cuối Phase.
  * **Output:** Giao diện không bị gián đoạn. Trong lúc chờ, màn hình sẽ hiển thị một icon xoay vòng (Loading spinner) tinh tế ở góc dưới với dòng chữ *"Đang lưu lịch trình..."*. Ngay sau khi lưu xong, giao diện sẽ bung hoạt ảnh pháo hoa chúc mừng và mở khóa bản đồ du lịch tiếp theo.
* **Luồng dữ liệu (Data Flow):**
  * Sau khi kết thúc một hành trình (Run), các dữ liệu về tỷ lệ hoàn thành nhiệm vụ, các điểm tham quan phổ biến và độ khó thực tế sẽ được **Tracking Agent** tự động đóng gói. Dữ liệu này được đẩy lên **Backend API (IF-3)** ngay khi có kết nối mạng mà không làm gián đoạn trò chơi.

### 5.4 Data Control — what is stored long-term vs. temporarily, storage strategy, security measures

## 6. Feasibility & Risks
What could go wrong technically. What you're uncertain about. Why you believe this is still buildable.

## 7. Roadmap

### 7.1 MVP — core functionalities, success criteria

### 7.2 Final Release — additional functionalities, stretch goals

## 8. Technical Decisions

### 8.1 Realized Tech Stack — technologies chosen and their roles

### 8.2 Architecture Decision Records — key decisions, the options considered, and the rationale