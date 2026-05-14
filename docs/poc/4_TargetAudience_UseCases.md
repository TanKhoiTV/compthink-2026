# 4. Các nhóm người dùng & Use Case

## 4.1. Danh sách các nhóm người dùng và Use Case tương ứng

### 4.1.1. Người dùng chính (Customer / Player)

- **Chơi game để nhận lịch trình du lịch:** Người dùng sẽ tham gia vào một trò chơi mô phỏng việc lập lịch trình du lịch. Bắt đầu màn chơi, người dùng sẽ lựa chọn và sắp xếp các Thẻ Địa Điểm vào Bàn Cờ Lịch Trình theo các mốc thời gian trong ngày. Trong quá trình chơi, người dùng cần quản lý tài nguyên như Xu Vàng và Thể lực, cân nhắc khoảng cách giữa các địa điểm, tận dụng combo và xử lý các sự kiện ngẫu nhiên để đạt được điểm Hạnh Phúc VP cao nhất. Sau khi hoàn thành màn chơi, hệ thống sẽ tổng hợp các thẻ đã được sắp xếp thành một lịch trình du lịch hoàn chỉnh. Người dùng có thể dùng nó làm gợi ý để áp dụng vào chuyến đi ngoài đời.

- **Quản lý tài khoản và hành trang:** Người dùng có thể xem lại lịch sử màn chơi, điểm số, lịch trình đã tạo, thành tựu và các vật phẩm trong game nếu có.

- **Đánh giá và chia sẻ trải nghiệm:** Người dùng có thể chia sẻ lịch trình đã tạo ra sau khi hoàn thành màn chơi, bao gồm điểm VP, các địa điểm đã chọn, combo đạt được và lịch trình theo từng ngày. Use case này giúp tăng tính tương tác cộng đồng và cho phép người chơi tham khảo lịch trình của nhau.

### 4.1.2. Quản trị viên (Moderator)

- **Tinh chỉnh nội dung game:** Moderator có thể thêm, sửa hoặc xóa các địa điểm, thẻ bài,... Nội dung game phải được cập nhật thường xuyên để tránh nhàm chán và để đảm bảo nhiệm vụ vẫn phù hợp với thực tế.

- **Quản lý session của người chơi:** Mỗi session lưu trạng thái tiến trình của người chơi, bao gồm các thẻ đã chọn, tài nguyên hiện có, vị trí thẻ trên bàn cờ lịch trình, điểm VP, combo và lịch trình đầu ra. Nếu session bị lỗi, người chơi có thể mất tiến trình, sai lệch điểm số hoặc tạo ra lịch trình không hợp lệ. Vì vậy, hệ thống cần cơ chế phân quyền rõ ràng, ghi log thao tác và hạn chế chỉnh sửa trực tiếp vào session đang hoạt động.

- **Quản lý người dùng:** Moderator cần khả năng xem, khóa hoặc xử lý tài khoản trong các trường hợp vi phạm, gian lận hoặc có yêu cầu hỗ trợ.

### 4.1.3. Bảo trì viên (Maintainer)

- **Giám sát hệ thống:** Maintainer theo dõi trạng thái server, API, database, log và các chỉ số vận hành. Việc giám sát cần diễn ra thường xuyên để phát hiện lỗi sớm.

- **Xử lý lỗi hệ thống:** Khi server, API hoặc database gặp lỗi, các tính năng như tải dữ liệu địa điểm, đồng bộ điểm số, quản lý tài khoản hoặc cập nhật nội dung đều có thể bị ảnh hưởng. Do đó, hệ thống cần có log đủ chi tiết, cơ chế cảnh báo và quy trình xử lý lỗi rõ ràng.

- **Cập nhật hệ thống:** Maintainer triển khai tính năng mới, sửa lỗi và rollback khi bản cập nhật gây lỗi. Với một ứng dụng có logic game và dữ liệu địa điểm, thẻ bài thay đổi liên tục, việc cập nhật phải tránh làm hỏng trạng thái người chơi hoặc dữ liệu hiện có.

- **Quản lý dữ liệu:** Bao gồm backup, restore và bảo vệ dữ liệu. Đây là use case quan trọng vì hệ thống có thể lưu lịch trạng thái ván chơi, lịch sử điểm số, dữ liệu thẻ bài, lịch trình đã tạo và thông tin tài khoản.

### 4.1.4. Kiểm duyệt viên (Examiner)

- **Đánh giá tuân thủ quyền riêng tư và thu thập dữ liệu:** Ứng dụng cần giải thích rõ lý do xin quyền vị trí hoặc dữ liệu liên quan đến hoạt động người dùng. Việc xin quyền phải minh bạch, đúng ngữ cảnh và không gây cảm giác bị ép buộc.

- **Kiểm định phân loại độ tuổi và an toàn cho trẻ em:** Do ứng dụng có yếu tố game, huy hiệu và phần thưởng, sản phẩm có thể thu hút người dùng nhỏ tuổi. Vì vậy, hệ thống cần tránh đề xuất địa điểm không phù hợp, hạn chế chia sẻ dữ liệu nhạy cảm và có cơ chế bảo vệ nhóm người dùng dễ bị tổn thương.

- **Rà soát bản quyền và sở hữu trí tuệ:** Examiner cần kiểm tra tài nguyên hình ảnh, icon, vector art, tên thương hiệu và nội dung địa điểm để tránh sử dụng sai giấy phép hoặc vi phạm nhãn hiệu.

- **Kiểm định tuân thủ luật bảo vệ dữ liệu:** Hệ thống cần hỗ trợ các nguyên tắc như chỉ thu thập dữ liệu cần thiết, cho phép người dùng xóa tài khoản/dữ liệu, và ưu tiên xử lý dữ liệu theo hướng bảo vệ quyền riêng tư.

### 4.1.5. Nhà cung cấp dữ liệu (Data Provider)

- **Cung cấp dữ liệu bản đồ nền nếu cần:** Bản đồ có thể được dùng để minh họa tuyến du lịch hoặc hỗ trợ hiển thị lịch trình cuối game.

- **Xác thực vị trí:** Khi người dùng check-in, hệ thống cần đối chiếu tọa độ thiết bị với tọa độ địa điểm trên thẻ bài.

- **Cung cấp ngữ cảnh thời gian thực:** Dữ liệu thời tiết hoặc giao thông có thể được dùng để điều chỉnh nhiệm vụ, ví dụ giảm ưu tiên nhiệm vụ ngoài trời khi trời mưa hoặc thay đổi độ khó khi giao thông xấu.

### 4.1.6. Phân tích viên (Analyst)

- **Phân tích cân bằng tài nguyên và độ khó của game:** Analyst theo dõi cách người chơi sử dụng xu vàng, thể lực, cơ chế vay xu và vay thể lực để đánh giá trò chơi có quá dễ, quá khó hoặc gây phạt quá nặng hay không, từ đó điều chỉnh giới hạn tài nguyên, chi phí thẻ, mức phạt nợ và hình phạt khi người chơi vắt kiệt sức.

- **Đánh giá chất lượng lịch trình được tạo ra sau mỗi ván chơi:** Sau khi người chơi hoàn thành game, hệ thống tạo ra một lịch trình du lịch dựa trên các Thẻ địa điểm đã được xếp vào bàn cờ. Analyst cần đánh giá liệu lịch trình này có hợp lý để áp dụng ngoài đời hay không, ví dụ: các địa điểm có quá xa nhau, mốc thời gian có phù hợp, lịch trình có cân bằng giữa ăn uống, tham quan, nghỉ ngơi và giải trí hay không.

- **Phân tích hiệu quả của thẻ, combo và sự kiện ngẫu nhiên:** Analyst theo dõi những nhóm thẻ nào được chọn nhiều, combo nào quá mạnh hoặc quá yếu, sự kiện nào thường gây bất lợi lớn cho người chơi. Từ đó, nhóm có thể đề xuất điều chỉnh điểm VP, hiệu ứng thẻ, xác suất sự kiện và điều kiện kích hoạt để gameplay công bằng và thú vị hơn.

- **Phát hiện chiến thuật lặp lại hoặc mất cân bằng trong cách chơi:** Nếu đa số người chơi luôn chọn cùng một loại thẻ, cùng một tuyến du lịch hoặc cùng một chiến thuật để đạt điểm cao, điều đó cho thấy game có thể đang thiếu đa dạng. Analyst cần phát hiện các mẫu hành vi này để hỗ trợ Game Designer điều chỉnh hệ thống, khuyến khích người chơi thử nhiều cách xây dựng lịch trình khác nhau.

- **Đánh giá khả năng chuyển đổi từ game sang lịch trình thực tế:** Analyst có thể so sánh lịch trình được tạo ra với các tiêu chí cơ bản như khoảng cách di chuyển, độ đa dạng hoạt động, số lượng địa điểm mỗi ngày và mức độ phù hợp cho hoạt động du lịch. Đây là use case quan trọng vì sản phẩm không chỉ là một trò chơi, mà còn phải tạo ra đầu ra có ích cho chuyến đi ngoài đời.

### 4.1.7. Content Manager/Service Provider

- **Quản lý dữ liệu địa điểm và thẻ bài:** Content Manager cập nhật thông tin cho các Thẻ Địa Điểm như tên địa điểm, mô tả, loại hình hoạt động, tag, vị trí, đặc điểm nổi bật và mức độ phù hợp với từng mốc thời gian trong ngày. Use case này rất quan trọng vì mỗi thẻ không chỉ là một thành phần trong game, mà còn đại diện cho một địa điểm thực tế trong lịch trình cuối cùng.

- **Thiết lập chỉ số gameplay cho thẻ địa điểm:** Content Manager phối hợp với Game Designer để gán các chỉ số như điểm VP cơ bản, chi phí xu vàng, mức tiêu hao thể lực, nhóm thẻ và hiệu ứng đặc biệt. Việc thiết lập này ảnh hưởng trực tiếp đến độ cân bằng của trò chơi, vì nếu một nhóm thẻ quá mạnh hoặc quá rẻ, người chơi sẽ có xu hướng lặp lại cùng một chiến thuật thay vì xây dựng lịch trình đa dạng.

- **Quản lý ưu đãi hoặc nội dung đối tác (nếu có):** Service Provider có thể tham gia bằng cách cung cấp thông tin địa điểm, ưu đãi hoặc nội dung quảng bá.

## 4.2. Các Use Cases nên tập trung cho MVP sắp tới

- Customer chơi được một màn game lập lịch trình du lịch ảo.
- Hệ thống có bộ Thẻ Địa Điểm với tag, vị trí, chi phí tài nguyên và điểm VP.
- Người dùng có thể quản lý xu vàng, thể lực và xếp thẻ vào bàn cờ lịch trình.
- Hệ thống có thể tính điểm VP dựa trên combo, tài nguyên, khoảng cách và sự kiện.
- Sau ván chơi, hệ thống tạo được lịch trình du lịch hoàn chỉnh để tham khảo ngoài đời.
- Trạng thái ván chơi, điểm số và lịch trình đầu ra được lưu ổn định.
- Content Manager/Moderator chỉnh được dữ liệu thẻ và chỉ số gameplay cơ bản.
- Analyst có thể theo dõi dữ liệu playtest để cân bằng game và đánh giá chất lượng lịch trình.
