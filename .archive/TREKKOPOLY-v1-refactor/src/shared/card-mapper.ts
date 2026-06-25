/**
 * Card data mapping utilities.
 * Centralizes all GameCardData → TravelCard UI field transformations
 * (short names, labels, bonus text, rarity) so every module shares one source.
 *
 * Ported from Trekkopoly/src/data/cardMapper.ts.
 */

// ── Main tag detection ─────────────────────────────────────────────────────

export function getMainTag(tags: readonly string[]): string {
	if (tags.includes("FOOD")) return "FOOD";
	if (tags.includes("CULTURE")) return "CULTURE";
	if (tags.includes("ACTION")) return "ACTION";
	if (tags.includes("UTILITY")) return "UTILITY";
	return tags[0] ?? "FOOD";
}

// ── Tag label ───────────────────────────────────────────────────────────────

const TAG_LABELS: Record<string, string> = {
	FOOD: "Ẩm thực",
	CULTURE: "Văn hóa",
	ACTION: "Khám phá",
	UTILITY: "Tiện ích",
	OUTDOOR: "Ngoài trời",
	INDOOR: "Trong nhà",
};

export function getTagLabel(tag: string): string {
	return TAG_LABELS[tag] ?? "Khác";
}

// ── Rarity label ────────────────────────────────────────────────────────────

export function getRarityLabel(rarity: string | undefined): string {
	switch (rarity) {
		case "common":
		case "COMMON":
			return "★";
		case "uncommon":
		case "UNCOMMON":
			return "★★";
		case "epic":
		case "EPIC":
			return "★★★★";
		case "legendary":
		case "LEGENDARY":
			return "★★★★★";
		default:
			return "★";
	}
}

// ── Short name ──────────────────────────────────────────────────────────────

const MANUAL_SHORT_NAMES: Record<string, string> = {
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
	"Harpers-Bazaar Tầng 79 Landmark 81": "Landmark 81",
	"Cơm Quê Dượng Bầu": "Dượng Bầu",
	// Legacy / alternate phase entries
	"Du Thuyền Hạ Long": "Du Thuyền",
	"Chợ Đêm Đà Lạt": "Chợ Đêm",
};

export function getShortName(name: string): string {
	const trimmed = name.trim();

	if (MANUAL_SHORT_NAMES[trimmed]) {
		return MANUAL_SHORT_NAMES[trimmed];
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

// ── Short city ──────────────────────────────────────────────────────────────

const MANUAL_SHORT_CITIES: Record<string, string> = {
	"Sài Gòn": "Sài Gòn",
	"Hà Nội": "Hà Nội",
	"Đà Lạt": "Đà Lạt",
	"Đà Nẵng": "Đà Nẵng",
	"Quảng Ninh": "Quảng Ninh",
};

export function getShortCity(city: string): string {
	const trimmed = city.trim();

	if (MANUAL_SHORT_CITIES[trimmed]) {
		return MANUAL_SHORT_CITIES[trimmed];
	}

	if (trimmed.length <= 12) {
		return trimmed;
	}

	return trimmed.slice(0, 12).trim() + "…";
}

// ── Bonus text ──────────────────────────────────────────────────────────────

export interface BonusTextCard {
	tags?: readonly string[];
	onPlayEffect?: {
		has_effect: boolean;
		effect_type: string;
		effect_value: number;
	} | null;
}

export function getBonusText(card: BonusTextCard): string {
	const effect = card.onPlayEffect;
	if (effect && effect.has_effect) {
		switch (effect.effect_type) {
			case "RECOVER_LA":
				return `Khi đặt xuống: hồi ${effect.effect_value} thể lực`;
			case "RECOVER_XU":
				return `Khi đặt xuống: hồi ${effect.effect_value} xu`;
			case "GAIN_VP":
				return `Khi đặt xuống: +${effect.effect_value} VP`;
		}
	}

	const tags = card.tags ?? [];
	if (tags.includes("FOOD")) return "Nếu có 2 lá Ẩm thực: +5 VP";
	if (tags.includes("CULTURE")) return "Nếu có 2 lá Văn hóa: +8 VP";
	if (tags.includes("ACTION")) return "Nếu đặt sau lá Khám phá: +10 VP";
	return "Không có hiệu ứng đặc biệt";
}
