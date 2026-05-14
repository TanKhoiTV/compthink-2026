
## 6. Tính khả thi của dự án và các rào cản/rủi ro có thể gặp phải

### 6.1. Tại sao dự án của nhóm có thể thực hiện được?

Về mặt kỹ thuật, PoC của dự án có tính khả thi vì cơ chế hiện tại được thu hẹp thành một trò chơi lập lịch trình du lịch ảo, thay vì yêu cầu người dùng phải di chuyển ngoài đời, check-in bằng GPS hay cung cấp nhiều thông tin đầu vào ngay từ đầu. Người dùng chủ yếu tương tác với hệ thống thông qua việc lựa chọn Thẻ Địa Điểm, quản lý tài nguyên như Xu Vàng và Thể lực, sắp xếp thẻ vào Bàn Cờ Lịch Trình theo các mốc thời gian, sau đó nhận điểm Hạnh Phúc VP và một lịch trình du lịch hoàn chỉnh sau khi kết thúc ván chơi. Cách tiếp cận này giúp giảm đáng kể độ phức tạp của MVP, vì nhóm có thể tập trung vào vòng lặp gameplay, dữ liệu thẻ và thuật toán tính điểm trước khi mở rộng sang các tính năng ngoài đời như check-in, voucher cho người dùng hoặc dữ liệu thời gian thực.

Kiến trúc PWA cũng phù hợp với phạm vi PoC. Hệ thống có thể tải trước một gói dữ liệu gồm địa điểm, thẻ bài, chỉ số gameplay, combo và sự kiện; sau đó phần lớn logic chơi game được xử lý ở phía client. Điều này giúp trò chơi phản hồi nhanh, không phụ thuộc quá nhiều vào kết nối mạng trong lúc chơi, đồng thời đơn giản hóa vai trò của backend trong giai đoạn đầu. Backend chủ yếu cần phục vụ dữ liệu game, lưu tài khoản hoặc lịch sử chơi nếu có, đồng bộ điểm số và hỗ trợ cập nhật nội dung.

Ngoài ra, các thành phần gameplay có thể được triển khai theo mức độ tăng dần. Ở MVP, nhóm chỉ cần một tập thẻ địa điểm giới hạn, một số loại tài nguyên cơ bản, một bàn cờ lịch trình 3 ngày × 3 mốc thời gian, cơ chế tính điểm VP, kiểm tra khoảng cách và một vài sự kiện ngẫu nhiên đơn giản. Các chức năng nâng cao như leaderboard hoàn chỉnh, chia sẻ lịch trình, quản lý ưu đãi đối tác, dashboard phân tích hoặc cá nhân hóa lịch trình có thể được giữ lại cho các giai đoạn sau.

### 6.2. Rủi ro/rào cản có thể gặp phải và hướng xử lý

| Vấn đề | Mức độ ảnh hưởng | Phân tích | Hướng giảm thiểu |
|---|---:|---|---|
| Gameplay quá phức tạp so với phạm vi MVP | Cao | Cơ chế game gồm nhiều yếu tố như thẻ địa điểm, tài nguyên, combo, khoảng cách, sự kiện ngẫu nhiên và điểm VP. Nếu triển khai tất cả cùng lúc, nhóm dễ bị quá tải và khó kiểm thử. | MVP chỉ nên giữ vòng lặp cốt lõi: chọn thẻ, xếp thẻ, tiêu Xu/Thể lực, tính điểm VP và xuất lịch trình. Các hiệu ứng phức tạp có thể giảm số lượng hoặc để sang giai đoạn sau. |
| Cân bằng tài nguyên và điểm số chưa hợp lý | Cao | Nếu Xu Vàng, Thể lực, chi phí thẻ hoặc điểm VP không cân bằng, người chơi có thể luôn chọn một chiến thuật duy nhất hoặc cảm thấy game quá dễ/quá khó. | Bắt đầu với bộ chỉ số đơn giản; tổ chức playtest; ghi nhận các chỉ số như thẻ được chọn nhiều, điểm trung bình, số lần thiếu tài nguyên và combo phổ biến để điều chỉnh dần. |
| Lịch trình cuối game thiếu tính thực tế | Cao | Đầu ra của sản phẩm không chỉ là điểm số, mà còn là lịch trình có thể tham khảo ngoài đời. Nếu các địa điểm quá xa nhau, sai thời điểm hoặc thiếu cân bằng giữa ăn uống, tham quan và nghỉ ngơi, giá trị du lịch của sản phẩm sẽ giảm. | Dùng tọa độ và tag địa điểm để kiểm tra khoảng cách; đặt giới hạn phạt khi xếp địa điểm quá xa; phân loại thẻ theo mốc thời gian phù hợp; kiểm thử lịch trình bằng một bộ địa điểm thật ở phạm vi nhỏ. |
| Dữ liệu thẻ địa điểm thiếu chính xác | Trung bình - Cao | Mỗi Thẻ Địa Điểm đại diện cho một địa điểm thật. Nếu tên, mô tả, tag, vị trí hoặc loại hình hoạt động sai, cả gameplay và lịch trình đầu ra đều bị ảnh hưởng. | Content Manager nên quản lý bộ dữ liệu địa điểm theo schema thống nhất; MVP chỉ dùng một số thành phố/phase giới hạn; ưu tiên dữ liệu đã được kiểm tra thủ công thay vì mở rộng quá nhanh. |
| Cập nhật dữ liệu game làm hỏng session cũ | Trung bình | Khi thay đổi thông tin thẻ, chỉ số gameplay hoặc combo, các ván chơi cũ có thể không còn tương thích với dữ liệu mới. | Dùng version cho content bundle; lưu `card_id`, `bundle_version` và thông tin cần thiết của session; chỉ áp dụng nội dung mới cho ván chơi mới hoặc có cơ chế migration rõ ràng. |
| Leaderboard hoặc điểm số bị gian lận | Trung bình | Nếu có bảng xếp hạng, người dùng có thể cố tình chỉnh dữ liệu cục bộ hoặc gửi điểm không hợp lệ lên server. | Trong MVP, leaderboard có thể để ở mức thử nghiệm; nếu đồng bộ điểm, server cần kiểm tra lại kết quả dựa trên log hành động hoặc seed ván chơi thay vì tin hoàn toàn vào điểm do client gửi. |
### 6.3. Kết luận

Nhìn chung, PoC có tính khả thi nếu nhóm giữ đúng phạm vi MVP: xây dựng một trò chơi lập lịch trình du lịch ảo với bộ thẻ địa điểm giới hạn, cơ chế tài nguyên đơn giản, bàn cờ lịch trình rõ ràng, hệ thống tính điểm có thể kiểm thử và đầu ra là một lịch trình du lịch hoàn chỉnh.

Các rủi ro lớn nhất của PoC không nằm ở khả năng xây dựng giao diện hay lưu dữ liệu cơ bản, mà nằm ở ba điểm chính: cân bằng gameplay, chất lượng dữ liệu địa điểm và tính thực tế của lịch trình đầu ra. Nếu nhóm kiểm soát tốt ba yếu tố này, MVP có thể chứng minh được giá trị cốt lõi của sản phẩm: biến quá trình lập kế hoạch du lịch thành một trải nghiệm game thú vị, đồng thời tạo ra một lịch trình đủ hữu ích để người dùng tham khảo cho chuyến đi ngoài đời.

