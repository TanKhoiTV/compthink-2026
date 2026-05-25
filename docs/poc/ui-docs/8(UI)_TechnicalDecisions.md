# Technical Decisions

---
# 1. Realized Tech Stack

## Design System

Hệ thống giao diện được xây dựng dựa trên phong cách thiết kế earthy travel kết hợp giữa:
- Du lịch khám phá
- bBoard game chiến thuật
- Trải nghiệm lập kế hoạch hành trình

Design system tập trung vào:
- Tính trực quan
- Khả năng đọc thông tin nhanh
- Bố cục rõ ràng
- Tính đồng nhất giữa các màn hình

### Bảng màu chính
- Dark Brown `#2A1B12`
- Coffee Brown `#5B3A29`
- Warm Sand `#A67C52`
- Light Beige `#D9C2A3`
- Soft White `#F4EFE6`

---

## Typography System

Hệ thống typography sử dụng:

### Be Vietnam Pro

Dùng cho:
- Heading
- Tiêu đề card
- Thông tin gameplay quan trọng

### Inter

Dùng cho:
- Nội dung văn bản
- Mô tả thẻ
- Label giao diện
- Thông báo hệ thống

---

## Layout Structure

Giao diện được thiết kế theo dạng:
- Dashboard game layout
- Board game structure
- Panel-based UI

Màn hình gameplay chính gồm:
- Khu vực bàn cờ lịch trình
- Bảng tài nguyên
- Danh sách thẻ
- Popup sự kiện
- Khu vực mô phỏng kết quả

Layout ưu tiên:
- Hiển thị thông tin rõ ràng
- Hạn chế rối mắt
- Giữ bố cục nhất quán

---

## Card-Based Interface

Toàn bộ hệ thống sử dụng thiết kế card-based nhằm đồng bộ với gameplay sử dụng Thẻ Địa Điểm.

Card UI bao gồm:
- Hình ảnh địa điểm
- Tag hoạt động
- Điểm VP
- Tài nguyên yêu cầu
- Hiệu ứng đặc biệt

---

## Animation & Motion Style

Animation được sử dụng cho:
- Hover card
- Popup
- Cập nhật tài nguyên
- Hiệu ứng gameplay
- Sự kiện ngẫu nhiên

Phong cách animation ưu tiên:
- Nhanh
- Gọn
- Không gây rối giao diện

---

## Responsive Design

Responsive system bao gồm:
- Grid layout linh hoạt
- Responsive typography
- Adaptive panel arrangement
- Dynamic scaling

Điều này đảm bảo giao diện vẫn rõ ràng trên nhiều kích thước màn hình

---

## UI Design Tools

### Figma

Figma được sử dụng để:
- Thiết kế wireframe
- Xây dựng prototype
- Thiết kế component
- Xây dựng design system

Quá trình thiết kế tập trung vào:
- Visual hierarchy
- Consistency
- Readability
- Phong cách giao diện đồng nhất

---

# 2. Architecture Decision Records

## Decision 1 — Sử dụng giao diện dạng Card-Based
### Lý do

Gameplay xoay quanh việc sử dụng Thẻ Địa Điểm. Thiết kế card-based giúp:
- Đồng bộ giữa gameplay và giao diện
- Dễ phân nhóm thông tin
- Tăng khả năng đọc nhanh
- Tạo cảm giác giống board game thực tế

---

## Decision 2 — Sử dụng Earthy Travel Theme
### Lý do

Gameplay tập trung vào:
- Du lịch
- Khám phá
- Lập kế hoạch hành trình

Tone màu nâu – beige giúp:
- Tạo cảm giác thư giãn
- Gợi hình ảnh bản đồ và nhật ký du lịch
- Tăng tính immersion
- Và tạo bản sắc riêng cho hệ thống

---

## Decision 3 — Thiết kế Layout theo Board Game Structure
### Lý do

Gameplay yêu cầu:

- Hiển thị nhiều thông tin cùng lúc
- Quản lý tài nguyên
- Theo dõi combo
- Thao tác trên bàn cờ

Layout dạng board game giúp:
- Chia hierarchy rõ ràng
- Giảm rối mắt
- Giữ bố cục ổn định

---

## Decision 4 — Sử dụng Motion-Based Visual Feedback
### Lý do

Gameplay có nhiều thành phần động như:
- Card
- Popup
- Hiệu ứng gameplay
- Cập nhật tài nguyên

Animation giúp:
- Tăng tính trực quan
- Tạo cảm giác hiện đại
- Làm giao diện sinh động hơn

---


## Decision 5 — Sử dụng Consistent Visual Hierarchy
### Lý do

Gameplay có nhiều thông tin hiển thị đồng thời như:
- Tài nguyên
- Combo
- Card effect
- Điểm VP

Visual hierarchy giúp:
- Người dùng dễ theo dõi thông tin
- Giảm overload giao diện
- Tăng độ rõ ràng khi chơi game
