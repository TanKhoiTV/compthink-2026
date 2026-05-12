# 5. Kiểm soát dữ liệu

Xác định chiến lược để quản lý dữ liệu để đảm bảo tính toàn vẹn của logic game và hiệu suất hệ thống.

- Dữ liệu lưu trữ tạm thời
    - Công cụ: Sử dụng Dexie.js (IndexedDB) tại trình duyệt làm hàng đợi sự kiện.
    - Mục đích: Lưu trữ các hành vi người chơi (chọn thẻ, vay mượn) khi đang diễn ra ván đấu để đảm bảo trải nghiệm không bị ngắt quãng nếu mạng chập chờn. Dữ liệu sẽ được giải phóng ngay sau khi đồng bộ thành công lên server.

- Dữ liệu lưu trữ lâu dài
    - Công cụ: Lưu trữ tập trung tại PocketBase (SQLite).
    - Đối tượng: Hồ sơ người chơi, lịch sử các ván đấu (match logs), thông tin nợ tồn đọng cuối phase, và điểm hạnh phúc (VP) cuối cùng.
    - Dữ liệu phân tích: Toàn bộ lịch trình 3x5 đã hoàn thành để phục vụ việc tính toán các chỉ số như tỷ lệ hoàn thành (Completion Rate).

- Chiến lược lưu trữ (Storage Strategy)
    - Cơ chế Batching: Sự kiện không gửi lẻ tẻ mà được gom thành lô (Batch) gửi mỗi khi kết thúc một Phase chơi hoặc khi đạt đủ số lượng sự kiện quy định để tối ưu băng thông.
    - Manual Export: Thay vì tự động hóa hoàn toàn, hệ thống ưu tiên quy trình xuất dữ liệu thủ công (CSV/JSON) từ Admin PocketBase để xử lý ngoại vi, đảm bảo tính ổn định cho backend.

- Biện pháp bảo mật (Security Measures)
    - Phân quyền Append-only: Thiết lập quyền API là "Create Only". Người chơi chỉ có thể đẩy dữ liệu hành vi của mình lên hệ thống và không có quyền truy vấn hoặc sửa xóa dữ liệu của người khác (đặc biệt là đối thủ).
    - Xác thực: Mọi yêu cầu gửi dữ liệu phải đi kèm JWT token để định danh đúng người chơi và ván đấu.
