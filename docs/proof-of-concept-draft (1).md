### 5.3 User Experience (UX Flow) — Quy trình vận hành hệ thống

#### A. Giai đoạn Drafting (Daily Drafting Phase)
* **Mô tả:**
  * **Cơ chế phát thẻ:** Mỗi ngày, hệ thống cấp 5 thẻ cho người chơi. Thực hiện 3 lượt chọn: giữ 1 thẻ và chuyển các thẻ còn lại cho đối thủ. Các thẻ dư sau lượt 3 sẽ bị xóa khỏi bộ nhớ đệm.
  * **Cơ chế Vay nợ (Debt Mechanism):** Khi thiếu Xu, người chơi vẫn có thể lấy thẻ nhưng hệ thống sẽ gán "Token Nợ". Token này dùng để khấu trừ điểm (Penalty) ở bước tính toán cuối cùng.
  * **Cơ chế Kiệt sức (Exhaustion):** Nếu sử dụng thẻ khi cạn Thể lực, hệ thống tự động khóa (Lock) một ô thời gian ngẫu nhiên của ngày kế tiếp, vô hiệu hóa thao tác tại ô đó.
  * **Quy đổi tài nguyên (Discard):** Người chơi có quyền hủy thẻ để lấy lại một lượng Xu/Thể lực nhất định. Ô trống sau khi hủy thẻ được tính là "Thời gian nghỉ", giúp ngắt các ràng buộc về phạt khoảng cách.

#### B. Giai đoạn Lên lịch trình (Planning Phase)
* **Mô tả:**
  * **Phân bổ Grid:** Người dùng thực hiện Drag & Drop thẻ bài vào các slot Sáng - Chiều - Tối trên Grid 3x5. 
  * **Chốt ngày (End of Day):** Sau khi xác nhận lịch trình trong ngày, các thẻ chưa sử dụng trong kho sẽ bị hủy để giải phóng bộ nhớ cho ngày làm việc tiếp theo.

#### C. Giai đoạn Simulation & Scoring
* **Mô tả:** Sau khi kết thúc Ngày 3, hệ thống sẽ khóa toàn bộ Grid và thực hiện chuỗi thuật toán tính điểm tự động gồm 5 bước:
  * **Bước 1 (Check Nợ):** Kiểm tra số lượng Token Nợ và thực hiện trừ điểm tương ứng.
  * **Bước 2 (Random Events):** Chạy xác suất 15% kích hoạt sự kiện ngẫu nhiên dựa trên Tag của thẻ (thời tiết, giao diện, sức khỏe). Các sự kiện này áp dụng trực tiếp hệ số nhân/chia (Modifiers) vào điểm của ô đó.
  * **Bước 3 (Check Combo):** Duyệt Grid theo trục ngang/dọc để tìm các Tag khớp với bộ quy tắc Combo và cộng điểm thưởng.
  * **Bước 4 (Check Distance):** Tính toán khoảng cách (Lat/Lng) giữa các thẻ liền kề. Nếu vượt quá 20km/di chuyển, hệ thống áp dụng điểm phạt. Nếu có ô trống ở giữa, thuật toán sẽ bỏ qua bước kiểm tra này.
  * **Bước 5 (Final VP):** Tổng hợp Điểm gốc, Bonus Combo và các khoản Penalty để xuất kết quả cuối cùng.

#### D. Chuyển đổi Phase (Campaign Progression)
* **Mô tả:** Hệ thống hỗ trợ mở rộng bản đồ sau khi hoàn thành Phase 1 (Sài Gòn):
  * **Nhánh Đà Lạt:** Yêu cầu trả phí bằng Thể lực, tập trung vào các thẻ Outdoor.
  * **Nhánh Đà Nẵng:** Yêu cầu trả phí bằng Xu (vé máy bay), tập trung vào các thẻ Culture.

#### E. Xuất dữ liệu (Real-world Export)
* **Mô tả logic:** Hệ thống chuyển đổi toàn bộ Grid thành định dạng Timeline báo cáo.
  * **Nội dung Export:** Danh sách địa điểm cụ thể, tổng quãng đường di chuyển và dự toán chi phí. File này giúp người dùng có thể sử dụng như một lịch trình du lịch thực tế.