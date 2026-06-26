# Đề xuất Combo Bonus

---

## Secondary Tags (INDOOR/OUTDOOR)

`card.tags` là field có sẵn chưa được sử dụng.

| Combo | Điều kiện | VP | Tỉ lệ kích hoạt |
|---|---|---|---|
| Trong Nhà | 2+ INDOOR trong một ngày | +5 | ~50% |
| Ngoài Trời | 2+ OUTDOOR trong một ngày | +6 | ~45% |
| Cân Bằng | 1+ INDOOR và 1+ OUTDOOR trong một ngày | +4 | ~60% |

Card FOOD+OUTDOOR đóng góp cho cả Ẩm Thực lẫn Ngoài Trời.

Về kỹ thuật: mọi card đã có sẵn mảng `tags`. Vòng lặp đếm tag chỉ cần thêm hai dòng.

---

## Slot & Rhythm (vị trí thời gian)

Kiểm tra board occupancy theo rowIndex và colIndex. Không cần logic tag.

| Combo | Điều kiện | VP | Tỉ lệ kích hoạt |
|---|---|---|---|
| Cú Đêm | Ô Khuya (rowIndex=4) có card | +5 | ~75% |
| Bình Minh | Ô Sáng (rowIndex=0) có card | +3 | ~95% |
| Xuyên Khung | Cùng khung giờ có card từ 3 ngày trở lên | +10 | ~85% xuống 30% |
| Tận Dụng | 4/5 ô trong ngày có card | +7 | ~85% xuống 60% |

Khuya là ô hay bị skip nhất khi stamina cạn. Bình Minh gần như free (Sáng gần như luôn có card nên VP thấp). Xuyên Khung thưởng cho việc lên lịch xuyên suốt tuần. Tận Dụng rẻ hơn full board nhưng vẫn gây áp lực quản lý tài nguyên.

---

## Tag-Pair (ghép cặp tag)

Bỏ đếm ngưỡng. Kiểm tra cặp tag riêng biệt nào xuất hiện cùng ngày. Mỗi cặp cần cả hai tag có mặt ít nhất một lần.

| Combo | Cặp | VP | Tỉ lệ kích hoạt |
|---|---|---|---|
| Ẩm Thực + Văn Hóa | (FOOD, CULTURE) | +7 | ~40% |
| Khám Phá Tự Nhiên | (ACTION, OUTDOOR) | +8 | ~35% |
| Nghỉ Ngơi Thông Minh | (UTILITY, INDOOR) | +5 | ~35% |
| Ẩm Thực Năng Động | (FOOD, ACTION) | +6 | ~30% |
| Văn Hóa + Khám Phá | (CULTURE, ACTION) | +9 | ~25% |
| Tiện Nghi Đầy Đủ | (UTILITY, CULTURE) | +4 | ~25% |

Card nhiều tag như FOOD+OUTDOOR kích hoạt (FOOD, CULTURE) nếu có CULTURE, và (ACTION, OUTDOOR) nếu có ACTION. Card nhiều tag thành combo connectors.

Code cũ:

```
tagCounts.get("FOOD") >= 2 → bonus += 5
```

Code mới:

```
for each pair (tagA, tagB) in PAIRS:
  if tagCounts.get(tagA) > 0 and tagCounts.get(tagB) > 0:
    bonus += PAIR_BONUS[pair]
```

---

## Risk/Reward (tài nguyên)

`card.coin` và `card.stamina` làm đầu vào cho mấy combo dựa trên tài nguyên.

| Combo | Điều kiện | VP | Tỉ lệ kích hoạt |
|---|---|---|---|
| Tiết Kiệm | Tổng coin <= 2 trong ngày | +6 | ~35% |
| Khỏe Khoắn | Tổng stamina <= 1 trong ngày | +5 | ~25% |
| Liều Mạng | Tổng coin + stamina >= 8 trong ngày | +12 | ~15-25% |
| Mắc Nợ | Ngày có 1+ debt token | +10 | ~10% |

Tiết Kiệm ép chọn card rẻ (coin 0-2). Card rẻ thường VP thấp, combo bù lại. Liều Mạng càng về cuối càng khó, tới ngày 4 gần như không hit nổi, đó là chủ ý. Mắc Nợ biến debt từ phạt thuần thành một trade.

---

## Effect-Chain (dây chuyền hiệu ứng)

`card.onPlayEffect.effect_type` là cả một hệ thống chưa được dùng đến trong scoring.

Các effect hiện có: GAIN_VP, RECOVER_XU, RECOVER_LA, IGNORE_DISTANCE_NEXT, DISCOUNT_XU_NEXT, DOUBLE_VP_NEXT.

| Combo | Điều kiện | VP | Tỉ lệ kích hoạt |
|---|---|---|---|
| Dây Chuyền | 2+ card có onPlayEffect trong ngày, effect bất kỳ | +8 | ~40% |
| Phục Hồi | 1+ RECOVER effect + 1 board token (debt/lock) cùng ngày | +6 | ~15% |
| Tận Dụng Sức Mạnh | 1+ DOUBLE_VP_NEXT hoặc IGNORE_DISTANCE_NEXT trong ngày | +10 | ~5-10% |
| Kết Hợp Sức Mạnh | 2+ loại effect khác nhau trong ngày | +7 | ~25% |

DOUBLE_VP_NEXT và IGNORE_DISTANCE_NEXT là effect hiếm nhất (5-10% card). Tận Dụng Sức Mạnh trả nhiều nhất cho trigger hiếm nhất. Dây Chuyền dễ nhất, trả mức trung bình.

---

## Scoring impact theo ngày

| Ngày | Fill trung bình | Khoảng combo dương | Khoảng phạt |
|---|---|---|---|
| 1 | 5/5 | +20 đến +35 | 0 đến -4 |
| 2 | 5/5 | +20 đến +35 | 0 đến -4 |
| 3 | 4/5 | +15 đến +28 | -4 đến -9 |
| 4 | 3/5 | +10 đến +20 | -5 đến -9 |
| 5 | 2/5 | +5 đến +12 | -5 đến -9 |

Combo VP giảm tự nhiên theo ngày. Càng ít card, càng ít combo.
