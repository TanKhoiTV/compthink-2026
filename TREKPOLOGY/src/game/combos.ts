/*
  Combo bonus theo NGÀY — NGUỒN CHUNG cho cả client (scoring.ts) lẫn server
  (timerEngine.ts). Sửa ở đây là cả 2 nơi khớp nhau, tránh lệch điểm.

  Đầu vào: cột 5 ô của một ngày (index = khung giờ: 0=Sáng..4=Khuya), ô rỗng = null.
  Mỗi ô có `tags` (đã UPPERCASE, gồm cả tag chính + phụ, vd ["FOOD","OUTDOOR"]),
  `coin`, `stamina`.
*/

export type ComboCard = {
  tags: string[];
  coin: number;
  stamina: number;
};

export type ComboResult = {
  bonus: number;
  lines: string[];
};

const ROW_LABELS = ["Sáng", "Trưa", "Chiều", "Tối", "Khuya"];

// Tag-pair: [tagA, tagB, VP, nhãn]
const TAG_PAIRS: [string, string, number, string][] = [
  ["FOOD", "CULTURE", 7, "Ẩm thực + Văn hóa"],
  ["ACTION", "OUTDOOR", 8, "Khám phá Tự nhiên"],
  ["UTILITY", "INDOOR", 5, "Nghỉ ngơi Thông minh"],
  ["FOOD", "ACTION", 6, "Ẩm thực Năng động"],
  ["CULTURE", "ACTION", 9, "Văn hóa + Khám phá"],
  ["UTILITY", "CULTURE", 4, "Tiện nghi Đầy đủ"],
];

/** Tính tổng combo bonus + danh sách dòng mô tả cho 1 ngày. */
export function computeDayCombos(dayCells: (ComboCard | null)[]): ComboResult {
  const placed = dayCells.filter((c): c is ComboCard => c != null);
  if (placed.length === 0) return { bonus: 0, lines: [] };

  const has = (tag: string) => placed.filter((c) => c.tags.includes(tag));
  const count = (tag: string) => has(tag).length;

  let bonus = 0;
  const lines: string[] = [];
  const add = (vp: number, label: string) => {
    bonus += vp;
    lines.push(`${label}: +${vp} VP`);
  };

  // ── Theme (chủ đề chính) ──────────────────────────────
  const food = count("FOOD");
  const culture = count("CULTURE");
  const action = count("ACTION");
  if (food >= 2) add(5, `Combo Ẩm thực x${food}`);
  if (culture >= 2) add(8, `Combo Văn hóa x${culture}`);
  if (action >= 2) add(10, `Chuỗi Khám phá x${action}`);

  // ── Secondary tags (Trong nhà / Ngoài trời) ───────────
  const indoor = count("INDOOR");
  const outdoor = count("OUTDOOR");
  if (indoor >= 2) add(5, `Trong Nhà x${indoor}`);
  if (outdoor >= 2) add(6, `Ngoài Trời x${outdoor}`);
  if (indoor >= 1 && outdoor >= 1) add(4, "Cân Bằng (trong + ngoài)");

  // ── Tag-pair (ghép cặp chủ đề) ────────────────────────
  for (const [a, b, vp, label] of TAG_PAIRS) {
    if (count(a) >= 1 && count(b) >= 1) add(vp, label);
  }

  // ── Slot & Rhythm (vị trí khung giờ) ──────────────────
  if (dayCells[0]) add(3, "Bình Minh (có lịch sáng)");
  if (dayCells[4]) add(5, "Cú Đêm (có lịch khuya)");
  if (placed.length >= 4) add(7, "Tận Dụng (4+ khung giờ)");

  // ── Risk / Reward (tài nguyên) ────────────────────────
  const totalCoin = placed.reduce((s, c) => s + (c.coin ?? 0), 0);
  const totalStamina = placed.reduce((s, c) => s + (c.stamina ?? 0), 0);
  if (totalCoin <= 2) add(6, "Tiết Kiệm (ít Xu)");
  if (totalStamina <= 1) add(5, "Khỏe Khoắn (ít Thể lực)");
  if (totalCoin + totalStamina >= 8) add(12, "Liều Mạng (chi đậm)");

  return { bonus, lines };
}

export { ROW_LABELS };
