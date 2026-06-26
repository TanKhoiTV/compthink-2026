import type { TravelCardData } from "../types.js";

export function makeCard(
	overrides: Partial<TravelCardData> = {},
): TravelCardData {
	return {
		id: "test-card-1",
		name: "Test Card",
		city: "Test City",
		image: "test",
		rarity: "common",
		rarityLabel: "Common",
		vp: 0,
		coin: 0,
		stamina: 0,
		tag: "FOOD",
		tagLabel: "Food",
		icon: "food",
		description: "A test card",
		bonusText: "",
		...overrides,
	};
}

export const mockGetBoardDisplayName = (card: TravelCardData) => card.name;
