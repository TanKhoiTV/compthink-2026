# 4. Các nhóm người dùng & Use Case

## 4.1. Danh sách các nhóm người dùng và Use Case tương ứng

### 4.1.1. Người dùng chính (Customer / Player)

- **Tìm kiếm và nhận đề xuất hành trình du lịch:** Người dùng nhập các tiêu chí như địa điểm, ngân sách, thời gian và sở thích cá nhân. Từ đó, hệ thống trả về danh sách địa điểm hoặc lộ trình phù hợp.
- **Tham gia trò chơi và thực hiện nhiệm vụ:** Đây là use case quan trọng nhất đối với Customer vì nó thể hiện khác biệt cốt lõi giữa ứng dụng này và một ứng dụng gợi ý du lịch thông thường. Người dùng không chỉ xem danh sách địa điểm mà còn bước vào một “run” hoặc một chuỗi nhiệm vụ, đưa ra lựa chọn tại các sự kiện, hoàn thành check-in bằng vị trí hoặc hình ảnh, sử dụng vật phẩm, nhận điểm thưởng, voucher hoặc thành tựu. Nếu use case này hoạt động không tốt, trải nghiệm sẽ bị giảm xuống thành một công cụ lập lịch trình thụ động, làm mất bản sắc “Travel Planning Game” của sản phẩm.
- **Quản lý tài khoản và hành trang:** Sau mỗi chuyến đi hoặc mỗi chuỗi nhiệm vụ, người dùng cần xem lại lịch sử, phần thưởng, vật phẩm, voucher và thông tin cá nhân. Use case này hỗ trợ tính liên tục của trải nghiệm, đặc biệt khi ứng dụng có cơ chế tích lũy điểm, thành tựu hoặc tài sản ảo qua nhiều lần sử dụng.
- **Đánh giá và chia sẻ trải nghiệm:** Người dùng có thể đóng góp đánh giá, hình ảnh hoặc phản hồi sau khi hoàn thành một địa điểm hoặc một hành trình. Use case này giúp tăng giá trị cộng đồng, nhưng cũng kéo theo yêu cầu kiểm duyệt nội dung để hạn chế spam, nội dung độc hại hoặc đánh giá không xác thực.
### 4.1.2. Quản trị viên (Moderator)

- **Tinh chỉnh nội dung game:** Moderator có thể thêm, sửa hoặc xóa các địa điểm, sự kiện, nhiệm vụ và phần thưởng. Nội dung game phải được cập nhật thường xuyên để tránh nhàm chán và để đảm bảo nhiệm vụ vẫn phù hợp với thực tế.
- **Quản lý session của người chơi:** Mỗi session lưu trạng thái tiến trình của người chơi, bao gồm lựa chọn đã thực hiện, tài nguyên, nhiệm vụ đã hoàn thành và phần thưởng đã nhận. Nếu session bị lỗi, người chơi có thể mất tiến trình, sai lệch trạng thái hoặc bị khai thác để gian lận. Vì vậy, hệ thống cần cơ chế phân quyền rõ ràng, ghi log thao tác và hạn chế chỉnh sửa trực tiếp vào session đang hoạt động.
- **Quản lý người dùng:** Moderator cần khả năng xem, khóa hoặc xử lý tài khoản trong các trường hợp vi phạm, gian lận hoặc có yêu cầu hỗ trợ.
### 4.1.3. Bảo trì viên (Maintainer)

- **Giám sát hệ thống:** Maintainer theo dõi trạng thái server, API, database, log và các chỉ số vận hành. Việc giám sát cần diễn ra thường xuyên để phát hiện lỗi sớm.
- **Xử lý lỗi hệ thống:** Khi server, API hoặc database gặp lỗi, các tính năng như tải dữ liệu địa điểm, đồng bộ phần thưởng, quản lý tài khoản hoặc cập nhật nội dung đều có thể bị ảnh hưởng. Do đó, hệ thống cần có log đủ chi tiết, cơ chế cảnh báo và quy trình xử lý lỗi rõ ràng.
- **Cập nhật hệ thống:** Maintainer triển khai tính năng mới, sửa lỗi và rollback khi bản cập nhật gây lỗi. Với một ứng dụng có logic game và dữ liệu địa điểm thay đổi liên tục, việc cập nhật phải tránh làm hỏng trạng thái người chơi hoặc schema dữ liệu hiện có.
- **Quản lý dữ liệu:** Bao gồm backup, restore và bảo vệ dữ liệu. Đây là use case quan trọng vì hệ thống có thể lưu lịch sử chuyến đi, trạng thái nhiệm vụ, tài khoản, vật phẩm và phần thưởng của người dùng.
### 4.1.4. Kiểm duyệt viên (Examiner)

- **Đánh giá tuân thủ quyền riêng tư và thu thập dữ liệu:** Ứng dụng cần giải thích rõ lý do xin quyền vị trí, camera hoặc dữ liệu liên quan đến hoạt động người dùng. Việc xin quyền phải minh bạch, đúng ngữ cảnh và không gây cảm giác bị ép buộc. Nếu luồng xin quyền không rõ ràng, người dùng có thể từ chối cấp quyền, làm gián đoạn các tính năng cốt lõi như check-in hoặc xác thực nhiệm vụ.
- **Kiểm định phân loại độ tuổi và an toàn cho trẻ em:** Do ứng dụng có yếu tố game, huy hiệu và phần thưởng, sản phẩm có thể thu hút người dùng nhỏ tuổi. Vì vậy, hệ thống cần tránh đề xuất địa điểm không phù hợp, hạn chế chia sẻ dữ liệu nhạy cảm và có cơ chế bảo vệ nhóm người dùng dễ bị tổn thương.
- **Rà soát bản quyền và sở hữu trí tuệ:** Examiner cần kiểm tra tài nguyên hình ảnh, icon, vector art, tên thương hiệu và nội dung địa điểm để tránh sử dụng sai giấy phép hoặc vi phạm nhãn hiệu.
- **Kiểm định tuân thủ luật bảo vệ dữ liệu:** Hệ thống cần hỗ trợ các nguyên tắc như chỉ thu thập dữ liệu cần thiết, cho phép người dùng xóa tài khoản/dữ liệu, và ưu tiên xử lý dữ liệu theo hướng bảo vệ quyền riêng tư.
### 4.1.5. Nhà cung cấp dữ liệu (Data Provider)

- **Cung cấp bản đồ nền và định tuyến:** Hệ thống cần dữ liệu bản đồ, khoảng cách, thời gian di chuyển và tuyến đường để tạo lịch trình hợp lý, tránh đề xuất các địa điểm quá xa hoặc khó di chuyển trong cùng một khoảng thời gian.
- **Cung cấp dữ liệu địa điểm để sinh nhiệm vụ:** Trong mô hình Travel Planning Game, các địa điểm như quán ăn, bảo tàng, công viên, chợ hoặc danh lam thắng cảnh đóng vai trò như “event node” để hệ thống sinh nhiệm vụ. Nếu dữ liệu địa điểm sai, đã đóng cửa hoặc thiếu thông tin, nhiệm vụ sẽ mất tính thực tế và làm giảm niềm tin của người dùng.
- **Xác thực vị trí:** Khi người dùng check-in, hệ thống cần đối chiếu tọa độ thiết bị với tọa độ nhiệm vụ. Use case này hỗ trợ chống gian lận, nhưng cần có dung sai hợp lý vì GPS có thể sai lệch trong môi trường đô thị dày đặc hoặc khu vực tín hiệu yếu.
- **Cung cấp ngữ cảnh thời gian thực:** Dữ liệu thời tiết hoặc giao thông có thể được dùng để điều chỉnh nhiệm vụ, ví dụ giảm ưu tiên nhiệm vụ ngoài trời khi trời mưa hoặc thay đổi độ khó khi giao thông xấu.
### 4.1.6. Phân tích viên (Analyst)

- **Phân tích hiệu quả hành trình và cân bằng roguelike:** Analyst theo dõi tỷ lệ hoàn thành nhiệm vụ, địa điểm bị bỏ qua, vật phẩm được sử dụng nhiều và độ khó trung bình của các run. Đây là use case quan trọng nhất vì nó giúp nhóm điều chỉnh nhiệm vụ, phần thưởng và cơ chế game sao cho không quá dễ, không quá khó và vẫn tạo động lực khám phá.
- **Theo dõi tỷ lệ chuyển đổi và hành vi du lịch thực tế:** Dữ liệu check-in, thời gian dừng chân hoặc voucher đã sử dụng có thể cho thấy mức độ ứng dụng tác động đến hành vi du lịch ngoài đời.
- **Phát hiện bất thường và dự báo gian lận:** Analyst có thể xác định các mẫu hành vi bất thường như check-in quá nhanh, di chuyển phi thực tế hoặc nhận thưởng liên tục trong thời gian ngắn.
- **Dự báo xu hướng và đề xuất nội dung mới:** Dựa trên dữ liệu tìm kiếm, đánh giá và lịch sử chơi, Analyst đề xuất chủ đề mới cho các mùa nội dung tiếp theo.
### 4.1.7. Content Manager/Service Provider

- **Quản lý hồ sơ địa điểm và gian hàng:** Content Manager hoặc Service Provider có thể cập nhật thông tin của địa điểm kinh doanh, bao gồm tên địa điểm, hình ảnh, mô tả, giờ mở cửa, dịch vụ nổi bật hoặc các thông tin cần thiết khác. Nhờ đó hệ thống sẽ hiển thị địa điểm một cách chính xác trong bản đồ hoặc danh sách nhiệm vụ của người chơi.
- **Tạo chiến dịch, thiết lập nhiệm vụ và phân bổ voucher:** Đối tác có thể tạo các nhiệm vụ như check-in tại địa điểm, chụp ảnh, trả lời câu hỏi hoặc tham gia một hoạt động cụ thể để người chơi nhận phần thưởng. Đồng thời, đối tác có thể thiết lập voucher, ưu đãi hoặc số lượng phần thưởng tối đa cho từng chiến dịch. Điểu này sẽ tạo động lực để người chơi ghé thăm và tương tác với dịch vụ ngoài đời.
- **Đối soát và thu hồi voucher tại địa điểm thực tế:** Khi người chơi mang voucher hoặc phần thưởng trong ứng dụng đến sử dụng tại cửa hàng, Service Provider cần xác nhận giao dịch đó. Việc xác nhận có thể được thực hiện thông qua quét mã QR, nhập mã voucher hoặc kiểm tra trạng thái phần thưởng trên hệ thống. Từ đó, đảm bảo voucher chỉ được sử dụng một lần, hạn chế gian lận và tạo sự liên kết giữa phần thưởng ảo trong game với giá trị thực tế tại địa điểm kinh doanh.
- **Theo dõi và phân tích hiệu suất chiến dịch:** Sau khi chiến dịch được triển khai, đối tác cần theo dõi hiệu quả của chiến dịch, chẳng hạn số người chơi nhìn thấy nhiệm vụ, số người hoàn thành nhiệm vụ, số voucher đã phát hành và số voucher được sử dụng thực tế. Service Provider có thể sử dụng những thông tin này để đánh giá mức độ hiệu quả của việc tham gia nền tảng, từ đó quyết định có tiếp tục đầu tư, điều chỉnh phần thưởng hoặc thay đổi cách thiết kế nhiệm vụ hay không.
### 4.2. Các Use Cases nên tập trung cho MVP sắp tới
Ta nên ưu tiên các use case trực tiếp thể hiện tính năng quan trọng nhất của ứng dụng: **biến nhu cầu du lịch thành một trải nghiệm nhiệm vụ có tính cá nhân hóa và có phần thưởng**. Do đó, MVP nên tập trung vào các chức năng sau:
- Customer có thể nhập địa điểm, thời gian và sở thích cơ bản.
- Hệ thống tạo danh sách nhiệm vụ/lịch trình dựa trên dữ liệu địa điểm.
- Người dùng tham gia một run đơn giản, hoàn thành nhiệm vụ và nhận điểm/thành tựu.
- Trạng thái run, điểm, nhiệm vụ đã hoàn thành và phần thưởng được lưu ổn định.
- Admin có thể quản lý nội dung nhiệm vụ và kiểm tra session cơ bản.
- Hệ thống có cơ chế xin quyền vị trí/camera minh bạch, đồng thời hạn chế thu thập dữ liệu không cần thiết.
- Dữ liệu POI và bản đồ được lấy từ nguồn bên thứ ba hoặc từ bộ dữ liệu được chuẩn hóa trước.
