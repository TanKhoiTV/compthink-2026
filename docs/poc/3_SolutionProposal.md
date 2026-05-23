## 3. Đề xuất giải pháp

Giải pháp trọng tâm của dự án là xây dựng hệ thống là một nền tảng game chiến thuật (Strategy Board Game) giả lập. Giải pháp này không chỉ đóng vai trò là một trò chơi giải trí mà còn là công cụ để **Tối ưu hóa Lịch trình** dựa trên dữ liệu thực tế.

Cấu trúc giải pháp được chia thành 3 phân hệ logic chính:

### 3.1. Phân hệ Quản lý Tài nguyên & Kinh tế (Resource Management Module)
Hệ thống thiết lập một môi trường quản lý tài nguyên nhằm thử thách khả năng ra quyết định của người chơi:
- **Hệ thống Tài nguyên Kép:** Người chơi phải cân đối giữa Xu (Ngân sách) và Lá (Thể lực). Mọi thẻ bài địa điểm đều yêu cầu mức chi trả khác nhau cho hai loại tài nguyên này.
- **Ràng buộc Sức chứa:** Túi đồ của người chơi có giới hạn vật lý. Điều này buộc người chơi phải thực hiện các phép tính toán chi phí cơ hội: Mua thẻ giá trị cao ngay lập tức hay tích trữ tài nguyên cho vòng sau.
- **Cơ chế Đánh đổi:** Hệ thống tích hợp tính năng "Vay nợ" hoặc "Vắt kiệt thể lực". Người chơi có thể vượt rào tài nguyên để lấy thẻ quan trọng, nhưng hệ thống sẽ tự động gán các "Debuff"như trừ điểm hoặc khóa các ô thời gian ở ngày tiếp theo (giả lập trạng thái kiệt sức/ thiếu tiền).

### 3.2. Phân hệ Sa bàn & Quy hoạch Không gian
Hệ thống sử dụng một ma trận lưới 3x5 đại diện cho 5 ngày du lịch, mỗi ngày gồm 3 khung giờ (Sáng, Chiều, Tối).
- **Cấu trúc Ma trận:** Người chơi thực hiện thao tác kéo-thả (Drag & Drop) để lắp ghép các thẻ bài vào lưới.
- **Thuật toán Duyệt mảng & Liên kết:** Hệ thống tự động quét các ô theo trục dọc và ngang để phát hiện các nhóm thẻ có cùng thuộc tính (Tags). Khi người dùng thiết lập được các chuỗi địa điểm cùng bộ, hệ thống sẽ kích hoạt Hệ số nhân điểm thưởng, khuyến khích tư duy quy hoạch theo cụm.
- **Chiến thuật Khoảng đệm:** Khác với các app tự động, giải pháp cho phép người chơi chủ động để trống các ô thời gian. Thuật toán sẽ nhận diện các ô trống này là Thời gian di chuyển/Nghỉ ngơi, giúp hóa giải các hình phạt về khoảng cách địa lý giữa hai địa điểm nằm xa nhau trên bản đồ.

### 3.3. Mô phỏng & Kiểm chứng Logic
- **Kiểm chứng Khoảng cách :** Sử dụng công thức để tính toán khoảng cách thực tế giữa các tọa độ của các thẻ bài:
    
  Nếu người chơi xếp hai địa điểm có khoảng cách vật lý quá xa trong hai khung giờ liên tiếp, hệ thống sẽ tự động giáng hình phạt trừ điểm ,mô phỏng sự lãng phí thời gian và mệt mỏi khi di chuyển.
- **Xác suất Sự kiện ngẫu nhiên:** Hệ thống tích hợp cơ chế tạo sự kiện ngẫu nhiên dựa trên các tag của thẻ bài , mô phỏng các sự kiện ngoài đời thật Cơ chế này buộc người chơi phải có các phương án dự phòng.
- **Chuyển đổi Kết quả:** Sau khi hoàn thành phần chơi, bàn chơi sẽ được hệ thống xuất ra dưới dạng một **Bản kế hoạch du lịch thực tế**. Đây là bước chuyển đổi cốt lõi từ "Game ảo" sang "Ứng dụng thật", giúp người dùng sở hữu một lịch trình đã được kiểm chứng về mặt logic và kinh tế.

### Ưu điểm
- **Sự chủ động :** Thay vì nhận một lịch trình áp đặt từ AI, người chơi được trực tiếp nhào nặn chuyến đi của mình thông qua tư duy chiến thuật, tạo ra sự gắn kết với kế hoạch đã lập.
- **Môi trường Sandbox an toàn:** Người dùng có thể thử nghiệm những lịch trình rủi ro cao và nhìn thấy kết quả mô phỏng ngay lập tức mà không phải đánh đổi bằng tiền bạc hay sức khỏe ngoài đời thực.
- **Tính trực quan:** Việc số hóa các địa danh thành thẻ bài với thông số cụ thể giúp người dùng dễ dàng so sánh, lựa chọn và ghi nhớ thông tin văn hóa một cách tự nhiên thông qua quá trình chơi.
