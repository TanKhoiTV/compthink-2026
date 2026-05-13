## 2. Giới hạn & Giả định (Constraints & Assumptions)

### 2.1. Giới hạn của dự án

- **Về mô hình vận hành:** Trò chơi là một hệ thống Mô phỏng khép kín, loại bỏ hoàn toàn sự phụ thuộc vào các API. Việc tính toán khoảng cách và logic di chuyển được thực hiện thông qua **Tọa độ mô phỏng** lưu trữ tĩnh trong thẻ bài. Điều này giúp hệ thống hoạt động ổn định, bảo mật quyền riêng tư tuyệt đối và cho phép người dùng trải nghiệm ở bất cứ đâu.
- **Về phạm vi nội dung & Dữ liệu (Content Scope):** Trong giai đoạn POC, hệ thống chỉ tập trung vào dữ liệu của Phase 1 Sài Gòn
- **Về chế độ kết nối (Connectivity & Multiplayer):** Hệ thống không tích hợp giao thức truyền tải thời gian thực (như WebSockets) cho chế độ nhiều người chơi trực tuyến để tránh phức tạp hóa. Trò chơi ưu tiên chế độ **Chơi đơn (Campaign)** và **Đối kháng cục bộ (Hotseat/Local Co-op)** .
- **Về môi trường thực thi (Platform):** Dự án triển khai trên nền tảng Web theo hướng **Mobile-first PWA**. Việc đóng gói thành ứng dụng Native (Android/iOS) qua App Store/Play Store nằm ngoài phạm vi.

### 2.2. Các giả định cốt lõi
Sự vận hành của mô hình "Play to Plan" dựa trên các giả định nền tảng sau:

- **Hành vi & Nhận thức người dùng:** Giả định người chơi hứng thú và sẵn lòng tham gia vào các thử thách quản lý tài nguyên (Xu, Thể lực) để tối ưu hóa điểm số. Như một phần của thử thách trí tuệ từ đó gián tiếp tạo ra một lịch trình du lịch cá nhân hóa.
- **Dữ liệu:** Giả định bộ dữ liệu về tọa độ (Lat/Lng) tĩnh và các đặc tính văn hóa của thẻ bài là chính xác so với thực địa, đảm bảo kết quả lịch trình xuất ra sau ván game mang giá trị ứng dụng cao.
- **Hiệu suất:** Giả định framework Frontend được chọn có khả năng xử lý mượt mà các trạng thái phức tạp của sa bàn lịch trình cùng các hiệu ứng tương tác kéo thả trên các thiết bị di động tầm trung.

### 2.3. Các phụ thuộc bên ngoài 
- **Nền tảng lưu trữ :** Hệ thống phụ thuộc vào sự ổn định của nền tảng Backend trong việc cung cấp dữ liệu thẻ bài và lưu trữ tiến trình người chơi.
- **Thư viện Thuật toán & Giao diện:** Sử dụng các mã nguồn mở để đảm bảo tính chuẩn xác trong đo đạc khoảng cách giữa các tọa độ ảo, cũng như các thư viện hỗ trợ Drag & Drop trên Web để hiện thực hóa trải nghiệm xếp sa bàn lịch trình.
