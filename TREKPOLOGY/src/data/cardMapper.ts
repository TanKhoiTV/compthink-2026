import type { CardRarity, CardTag, GameCardData } from "../types.js";

export type TravelCardUIData = {
  id: string;
  name: string;
  shortName?: string;
  city: string;
  shortCity?: string;
  image: string;
  rarity: "common" | "uncommon" | "epic" | "legendary";
  rarityLabel: string;
  vp: number;
  coin: number;
  stamina: number;
  tag: string;
  tagLabel: string;
  tags: CardTag[];
  onPlayEffect: GameCardData["on_play_effect"];
  icon: string;
  description: string;
  bonusText: string;
};

function getMainTag(tags: CardTag[]) {
  if (tags.includes("FOOD")) return "FOOD";
  if (tags.includes("CULTURE")) return "CULTURE";
  if (tags.includes("ACTION")) return "ACTION";
  if (tags.includes("UTILITY")) return "UTILITY";
  return tags[0] ?? "FOOD";
}

function getTagLabel(tag: CardTag) {
  switch (tag) {
    case "FOOD":
      return "Ẩm thực";
    case "CULTURE":
      return "Văn hóa";
    case "ACTION":
      return "Khám phá";
    case "UTILITY":
      return "Tiện ích";
    case "OUTDOOR":
      return "Ngoài trời";
    case "INDOOR":
      return "Trong nhà";
    default:
      return "Khác";
  }
}

function getRarityLabel(rarity: CardRarity) {
  switch (rarity) {
    case "COMMON":
      return "★";
    case "UNCOMMON":
      return "★★";
    case "EPIC":
      return "★★★★";
    case "LEGENDARY":
      return "★★★★★";
    default:
      return "★";
  }
}

function getUiRarity(rarity: CardRarity): TravelCardUIData["rarity"] {
  switch (rarity) {
    case "COMMON":
      return "common";
    case "UNCOMMON":
      return "uncommon";
    case "EPIC":
      return "epic";
    case "LEGENDARY":
      return "legendary";
    default:
      return "common";
  }
}

function getBonusText(card: GameCardData) {
  if (card.on_play_effect.has_effect) {
    if (card.on_play_effect.effect_type === "RECOVER_LA") {
      return `Khi đặt xuống: hồi ${card.on_play_effect.effect_value} thể lực`;
    }

    if (card.on_play_effect.effect_type === "RECOVER_XU") {
      return `Khi đặt xuống: hồi ${card.on_play_effect.effect_value} xu`;
    }

    if (card.on_play_effect.effect_type === "GAIN_VP") {
      return `Khi đặt xuống: +${card.on_play_effect.effect_value} VP`;
    }
  }

  if (card.tags.includes("FOOD")) {
    return "Nếu có 2 lá Ẩm thực: +5 VP";
  }

  if (card.tags.includes("CULTURE")) {
    return "Nếu có 2 lá Văn hóa: +8 VP";
  }

  if (card.tags.includes("ACTION")) {
    return "Nếu đặt sau lá Khám phá: +10 VP";
  }

  return "Không có hiệu ứng đặc biệt";
}

function getShortName(name: string) {
  const trimmed = name.trim();

  const manualShortNames: Record<string, string> = {
    "Cà Phê Bệt Nhà Thờ Đức Bà": "Cà Phê Bệt",
    "Bánh Tráng Nướng Hồ Con Rùa": "Bánh Tráng",
    "Cà Phê Vợt Cheo Leo": "Cà Phê Vợt",
    "Phá Lấu Bò Cô Oanh": "Phá Lấu",
    "Súp Cua Chợ Tân Định": "Súp Cua",
    "Bánh Mì Huỳnh Hoa": "Bánh Mì",
    "Phố Ẩm Thực Hồ Thị Kỷ": "Hồ Thị Kỷ",
    "Cà Phê Chung Cư 42 Nguyễn Huệ": "Cà Phê 42",
    "Phố Sủi Cảo Hà Tôn Quyền": "Sủi Cảo",
    "Cơm Tấm Ba Ghiền": "Cơm Tấm",
    "Phố Ốc Vĩnh Khánh": "Ốc Vĩnh Khánh",
    "Bánh Xèo Đinh Công Tráng": "Bánh Xèo",
    "Chè Hà Ký Chợ Lớn": "Chè Hà Ký",
    "Phở Hòa Pasteur": "Phở Hòa",
    "Lẩu Cá Kèo Bà Huyện Thanh Quan": "Lẩu Cá Kèo",
    "Dimsum Tiến Phát": "Dimsum",
    "Nhà Hàng Chay Hum": "Chay Hum",
    "Ăn Tối Du Thuyền Sông Sài Gòn": "Du Thuyền Tối",
    "Tầng 79 Landmark 81": "Landmark 81",
    "Cơm Quê Dượng Bầu": "Dượng Bầu",

    // Các tên dùng trong demo / phase khác nếu có
    "Du Thuyền Hạ Long": "Du Thuyền",
    "Chợ Đêm Đà Lạt": "Chợ Đêm",
  };

  if (manualShortNames[trimmed]) {
    return manualShortNames[trimmed];
  }

  if (trimmed.length <= 14) {
    return trimmed;
  }

  const words = trimmed.split(/\s+/);

  if (words.length <= 3) {
    return trimmed;
  }

  return words.slice(0, 3).join(" ");
}

function getShortCity(city: string) {
  const trimmed = city.trim();

  const manualShortCities: Record<string, string> = {
    "Quận 1 - Công viên 30/4": "Q.1",
    "Quận 3 - Vòng xoay Công trường Quốc Tế": "Q.3",
    "Quận 3 - Giáp ranh Quận 10": "Q.3",
    "Quận 4 - Đường Tôn Đản": "Q.4",
    "Quận 1 - Chợ Tân Định": "Q.1",
    "Quận 1 - Đường Lê Thị Riêng": "Q.1",
    "Quận 10 - Chợ Hoa": "Q.10",
    "Quận 1 - Phố đi bộ Nguyễn Huệ": "Q.1",
    "Quận 11 - Khu Chợ Lớn": "Q.11",
    "Phú Nhuận - Cư xá Nguyễn Văn Trỗi": "Phú Nhuận",
    "Quận 4 - Bờ kè": "Q.4",
    "Quận 1 - Gần chợ Tân Định": "Q.1",
    "Quận 5 - Châu Văn Liêm": "Q.5",
    "Quận 3 - Đường Pasteur": "Q.3",
    "Quận 3 - Bà Huyện Thanh Quan": "Q.3",
    "Quận 5 - Khu Chợ Lớn": "Q.5",
    "Quận 3 - Võ Văn Tần": "Q.3",
    "Quận 4 - Bến cảng Nhà Rồng": "Q.4",
    "Bình Thạnh - Vinhomes Central Park": "Bình Thạnh",
    "Khu vực trung tâm": "Trung tâm",

    // Các city demo / phase khác nếu có
    "Sài Gòn": "Sài Gòn",
    "Hà Nội": "Hà Nội",
    "Đà Lạt": "Đà Lạt",
    "Đà Nẵng": "Đà Nẵng",
    "Quảng Ninh": "Quảng Ninh",
  };

  if (manualShortCities[trimmed]) {
    return manualShortCities[trimmed];
  }

  if (trimmed.length <= 12) {
    return trimmed;
  }

  if (trimmed.includes("Quận")) {
    const match = trimmed.match(/Quận\s*\d+/i);

    if (match) {
      return match[0].replace("Quận", "Q.");
    }
  }

  return trimmed.slice(0, 12).trim() + "...";
}

export function mapGameCardToTravelCard(card: GameCardData): TravelCardUIData {
  const mainTag = getMainTag(card.tags);
  const city = card.location.label ?? card.phase_pool;

  return {
    id: card.card_id,
    name: card.name,
    shortName: getShortName(card.name),
    city,
    shortCity: getShortCity(city),
    image: card.image_url,
    rarity: getUiRarity(card.rarity),
    rarityLabel: getRarityLabel(card.rarity),
    vp: card.base_vp,
    coin: card.cost.xu,
    stamina: card.cost.la,
    tag: mainTag.toLowerCase(),
    tagLabel: getTagLabel(mainTag),
    tags: card.tags,
    onPlayEffect: card.on_play_effect,
    icon: card.icon,
    description: card.description,
    bonusText: getBonusText(card),
  };
}
