## 8.1. Công nghệ thực hiện

### 8.1.x. Data Development

Các công nghệ được chọn đóng vai trò then chốt trong việc xử lý pipeline dữ liệu của trò chơi.

- Pocketbase (Backend & Database)
    - Đóng vai trò là trung tâm lưu trữ (Storage) và cung cấp các Endpoint (IF-3) để nhận dữ liệu từ Client. Hỗ trợ Flexible JSON field để lưu trữ cấu trúc thẻ bài đa dạng mà không cần schema cứng nhắc.

- Dexie.js
    - Quản lý cơ sở dữ liệu phía Client, hỗ trợ cơ chế lưu trữ tạm thời và hàng đợi sự kiện (Event Queue) giúp game vận hành mượt mà trong điều kiện mạng yếu.

- Python (Pandas)
    - Công cụ chính để xử lý dữ liệu sau khi xuất file từ hệ thống. Dùng để tính toán các chỉ số KPIs như tỷ lệ chọn thẻ (Pick rate), ảnh hưởng của hình phạt di chuyển đến kết quả ván đấu.

## 8.2. Architechture Decision Records

### 8.2.x. Data Development

|Quyết định|Các phương án đã cân nhắc|Lý do lựa chọn|
|:---:|:---:|:---:|
|Gửi DL theo Batch|Gửi real-time từng click hoặc gửi một lần khi kết thúc game|Đảm bảo tính thời điểm để phân tích đối kháng nhưng không gây quá tải cho endpoint IF-3|
|Flexible JSON Field|Thiết kế bảng SQL cứng nhắc cho từng loại thẻ (Ẩm thực, Vận động...)|Cho phép mở rộng danh mục thẻ và các thuộc tính sự kiện mới (như sự kiện ngẫu nhiên "Chặt chém") mà không cần migrate database|
|Append-only cho Event API|Full-access (CRUD) cho người dùng|Ngăn chặn gian lận (người chơi tự xóa các sự kiện bị phạt VP hoặc nợ Token) và bảo mật dữ liệu chiến thuật của đối thủ.|
|Xuất DL thủ công|Xây dựng hệ thống Live-dashboard tự động hoàn toàn.|Tiết kiệm tài nguyên phát triển backend, tập trung vào việc xử lý insight sâu bằng công cụ ngoại vi (Python) cho đồ án.|
