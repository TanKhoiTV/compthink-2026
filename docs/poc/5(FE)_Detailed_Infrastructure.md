### 1. Build Pipeline (Dây chuyền sản xuất)

| Module | Loại | Sở hữu | KHÔNG sở hữu |
| :--- | :--- | :--- | :--- |
| `tsc` | **Trình biên dịch** | Chuyển đổi TS -> JS, Kiểm tra lỗi kiểu dữ liệu (Type checking) | Đóng gói tệp cuối, Quản lý tài nguyên tĩnh |
| `lessc` | **Trình tiền xử lý** | Chuyển đổi Less -> CSS, Xử lý biến và hàm giao diện | Thực thi logic game, Đóng gói tệp JS |
| `build/` | **Kho lưu trữ** | Lưu trữ các tệp .js và .css đã biên dịch xong | Mã nguồn gốc (src), Tệp đóng gói hoàn chỉnh |
| `rollup` | **Trình đóng gói** | Gom tệp, loại bỏ code thừa, nén thành `client.js` | Kiểm tra lỗi Type, Biên dịch CSS |
| `sw.js` | **Trình trung gian** | Chiến lược lưu đệm (Caching), hỗ trợ chơi Offline | Render giao diện, Logic phía Server |

### 2. Client / Browser (Tầng người dùng)

| Module | Loại | Sở hữu | KHÔNG sở hữu |
| :--- | :--- | :--- | :--- |
| `index.html` | **Điểm nhập** | Cấu trúc DOM, Khai báo nạp tài nguyên hệ thống | Logic xử lý, Các quy tắc định dạng Style |
| `client.js` | **Tệp đóng gói** | Mã thực thi JS tổng hợp, Hành vi runtime của game | Tệp nguồn .ts, Định dạng giao diện |
| `client.css` | **Tệp định dạng** | Các quy tắc CSS, Bố cục (Layout), Hiệu ứng chuyển động | Logic thành phần, Quản lý tài nguyên ảnh |
| `app.ts` | **Bộ điều phối UI** | Quản lý trạng thái View, Xử lý sự kiện (Event), DOM | Đồng bộ đa người chơi, Bộ luật chung |
| `multi.ts` | **Giao diện mạng** | Vòng đời WebSocket, Gửi nhận tin nhắn RPC | Cơ chế gameplay, Render đồ họa cục bộ |
| `img/` | **Tài nguyên tĩnh** | Hình ảnh icon, Ảnh nền, Tài nguyên đồ họa | Mã nguồn thực thi, Dữ liệu trạng thái |
