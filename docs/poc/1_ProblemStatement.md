## 1. Vấn đề cần giải quyết (Problem Statement)

### 1.1. Thực trạng thị trường ứng dụng hỗ trợ du lịch
Hiện nay, thị trường phần mềm hỗ trợ du lịch đang ở trạng thái bão hòa với hàng ngàn ứng dụng, được chia làm hai nhóm tính năng chính:

- **Nhóm Giao dịch & Tiện ích (OTAs & Navigation):** Các ứng dụng như Traveloka, Booking.com hay Google Maps giải quyết rất tốt bài toán đơn lẻ như đặt phòng, mua vé,tìm đường từ điểm A đến điểm B .
- **Nhóm Tổng hợp thông tin (Aggregators & Reviews):** Các nền tảng như TripAdvisor hay các blog du lịch cung cấp kho dữ liệu khổng lồ về các địa điểm tham quan, quán ăn, và đánh giá của người dùng hoặc tính toán và gợi ý lịch trình cho khách hàng.

### 1.2. Khoảng trống của thị trường
Mặc dù có vô vàn công cụ du lịch và hàng ngàn tựa game trên thị trường, nhưng đang tồn tại một sự thiếu sót lớn sự giao thoa giữa Công cụ thực dụng và Trải nghiệm giải trí. Cụ thể:

- **Sự thiếu tính kích thích, thụ động và rập khuôn của các công cụ hỗ trợ lên lịch trình hay lên Lịch trình Tự động:** Các ứng dụng du lịch hiện tại biến việc lên lịch trình thành một việc mệt mỏi, nơi người dùng phải tự làm tính toán để cân đối ngân sách, khoảng cách và thời gian. Mặc dù hiện nay, nhiều ứng dụng đã tích hợp AI hoặc tính năng tự động gợi ý lịch trình và chi phí. Tuy nhiên, chúng lại rơi vào một điểm yếu chí mạng: Biến người dùng thành người tiếp nhận thụ động. Các lịch trình tạo sẵn thường mang tính rập khuôn, cứng nhắc. Việc phó mặc hoàn toàn cho hệ thống vô tình tước đoạt đi niềm vui tìm tòi, sự hào hứng và tính cá nhân hóa. Người dùng không có sự gắn kết cảm xúc hay cảm giác sở hữu đối với một lịch trình do máy tự động tạo ra.
- **Sự vắng bóng của mô hình "Play to Plan":** Trái ngược với sự khô khan của app du lịch, các tựa game mô phỏng/chiến thuật mang lại sự tương tác và hứng thú cực cao, nhưng lại hoàn toàn ảo, chơi xong không đọng lại giá trị thực tiễn nào. Thị trường đang vắng bóng một sản phẩm giao thoa giữa cả hai làm cầu nối: Vừa trao quyền để người dùng tự tay nhào nặn chuyến đi thông qua các quyết định chiến thuật giải trí, vừa tạo ra được một kết quả có thể ứng dụng ngay vào đời thực.
- **Thiếu môi trường thử và sai trực quan trước chuyến đi:** Kể cả khi dùng app tự động lên lịch, du khách vẫn không thể hình dung được mức độ hợp lý của nó cho đến khi thực sự trải nghiệm. Không có một hệ thống nào cho phép người dùng đi thử lịch trình đó, đưa ra các biến số ngẫu nhiên (kẹt xe, thời tiết) để chấm điểm và cảnh báo mức độ rủi ro một cách sinh động, trực quan trước khi dùng lịch trình đó cho việc du lịch thực tế.

### 1.3. Ý nghĩa
Việc phát triển một tựa game chiến thuật lồng ghép dữ liệu du lịch thực tế mang lại bước đột phá lớn, định nghĩa lại cách người dùng chuẩn bị cho một chuyến đi:

- **Mô hình Chơi Game Ảo – Lịch Trình Thật:** Đây là giá trị cốt lõi của dự án. Người dùng sử dụng hệ thống với tâm thế tận hưởng một Board Game chiến thuật (mua bán thẻ bài, xếp sa bàn lưới, đua top điểm). Tuy nhiên, ngay khi ván game kết thúc, Bàn cờ mà họ vừa tối ưu hóa đó chính là một **Lịch trình du lịch có tính khả thi cao**, đã tối ưu hóa về ngân sách, sức khỏe và trình tự di chuyển để ứng dụng trực tiếp vào đời thực.
- **Kênh quảng bá và kích cầu du lịch tương tác cao:** Trò chơi biến mỗi địa danh, mỗi món ăn bản địa thành một Thẻ bài có các thông tin và thông số riêng. Nhờ đó, game vô tình trở thành một nền tảng quảng bá văn hóa nước nhà một cách tự nhiên.Thay vì tiếp nhận thông tin thụ động, trò chơi buộc người dùng nghiên cứu sâu các thuộc tính, đặc điểm của từng địa danh được số hóa dưới dạng **Thẻ bài** để xây dựng chiến thuật. Việc lồng ghép ẩm thực, văn hóa vào cơ chế tính điểm giúp người chơi ghi nhớ và nảy sinh nhu cầu khám phá thực tế một cách tự nhiên, biến trò chơi thành công cụ kích cầu du lịch chiều sâu.
