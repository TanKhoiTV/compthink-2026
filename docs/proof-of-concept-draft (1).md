### 5.3 User Experience (UX Flow) — App logic from the user's perspective

#### A. Giai đoạn Chờ & Nhập cuộc (Lobby & Matchmaking)
* **Trải nghiệm người dùng (UX):** * Người chơi tham gia vào phòng chờ (Room). Giao diện hiển thị trạng thái "Đang chờ đối thủ...". 
  * Khi tất cả người chơi đã sẵn sàng, màn hình chuyển cảnh mượt mà vào Phase 1 (Bản đồ Sài Gòn).
  * Thanh HUD tài nguyên xuất hiện rõ ràng ở góc trên với: **15 Xu Vàng** và **20 Thể lực**.

#### B. Giai đoạn Chọn bài xoay vòng (Drafting Phase)
* **Trải nghiệm người dùng (UX):** * **Xem bài:** Hệ thống phát 5 thẻ bài lật ngửa. Người chơi chạm/di chuột vào từng thẻ để soi các chỉ số: Tag, Điểm Hạnh phúc (VP), và Chi phí (Xu/Stamina).
  * **Chọn & Chuyền:** Người chơi kéo 1 thẻ xuống khu vực lưu trữ cá nhân (thẻ sẽ tự động úp xuống để giữ bí mật). 
  * **Hiệu ứng chuyển cảnh:** Ngay sau khi chốt, 4 thẻ còn lại sẽ có hoạt ảnh bay vụt ra khỏi màn hình để chuyển sang cho đối thủ. Quá trình lặp lại cho đến khi mỗi người cầm đủ 5 thẻ trên tay.

#### C. Giai đoạn Lắp ghép Sa bàn (Grid Placement Phase)
* **Trải nghiệm người dùng (UX):** Người chơi kéo thả 5 thẻ vào lưới sa bàn 3x5 (3 Ngày x 5 Mốc thời gian). Các phản hồi trực quan bao gồm:
  * **Cập nhật HUD:** Khi đặt thẻ, số Xu/Thể lực trên thanh tài nguyên lập tức tụt xuống tương ứng với giá trị thẻ.
  * **Dây nối khoảng cách (Báo động đỏ):** Khi rê thẻ lơ lửng trên một ô, nếu cách địa điểm trước đó >10km, một sợi dây nối màu đỏ rực kèm dấu chấm than sẽ hiện ra để cảnh báo người chơi sẽ bị trừ điểm VP.
  * **Trạng thái Nợ/Khóa ô:** * Nếu thiếu tiền, màn hình chớp đỏ và hiện icon **"Giấy nợ (-50 VP)"**. 
    * Nếu thiếu thể lực, một **Ổ khóa sắt (Freeze)** sẽ rơi xuống khóa các ô thời gian của ngày tiếp theo.
  * **Tương tác Giải vây:** Người chơi có thể kéo một thẻ "Tiện ích" thả đè lên icon Giấy nợ để kích hoạt hiệu ứng "xé giấy", xóa bỏ hình phạt VP.

#### D. Giai đoạn Mô phỏng & Sự kiện (Simulation & Event Flow)
* **Trải nghiệm người dùng (UX):** Sau khi bấm "Chạy Lịch Trình", thanh quét (Scanner) ánh sáng sẽ rà qua từng ô thẻ:
  * **Hiệu ứng Mưa Giông:** Màn hình tối sầm, sấm sét nổ. Điểm VP trên thẻ dính Tag "Outdoor" bị giảm 50% ngay lập tức.
  * **Hiệu ứng Kẹt Xe:** Nếu người chơi đang cạn kiệt sức lực, thẻ bài tại trung tâm sẽ bị rung lắc mạnh và **vỡ nát (Shattered)**, bốc hơi khỏi bàn cờ (0 VP).
  * **Hiệu ứng Flash Sale:** Tiền vàng rơi lấp lánh, thẻ được nhân 1.5 lần điểm kèm hiệu ứng rực rỡ.

#### E. Tổng kết & So sánh (End-round & Side-by-side Rendering)
* **Trải nghiệm người dùng (UX):** * **Bảng điểm cá nhân:** Hiển thị chi tiết tổng điểm gốc, các điểm phạt nợ và điểm chung cuộc.
  * **So sánh Multiplayer (Side-by-side):** Sau khi tất cả đã xong, giao diện mở rộng để hiển thị sa bàn của đối thủ ngay cạnh sa bàn của người chơi. 
  * Người chơi có thể quan sát lộ trình và "nhân phẩm" của đối thủ trước khi quyết định chi tài nguyên để di chuyển sang bản đồ tiếp theo (Đà Lạt hoặc Đà Nẵng).