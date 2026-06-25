export type Tag =
	| "FOOD"
	| "CULTURE"
	| "ACTION"
	| "UTILITY"
	| "TRANSIT"
	| "REST"
	| "OUTDOOR"
	| "INDOOR";
export type TimeSlot =
	| "early_morning"
	| "morning"
	| "afternoon"
	| "evening"
	| "night";
export type GamePhase =
	| "lobby"
	| "draft"
	| "placement"
	| "scoring"
	| "finished";

export type Coordinates = {
	lat: number;
	lng: number;
};

export type Rarity = "common" | "uncommon" | "epic" | "legendary";

export type CardEffectType =
	| "NONE"
	| "RECOVER_XU"
	| "RECOVER_LA"
	| "GAIN_VP"
	| "DEDUCT_LA"
	| "IGNORE_DISTANCE_NEXT"
	| "DISCOUNT_XU_NEXT"
	| "DOUBLE_VP_NEXT";

export type GameCardEffect = {
	has_effect: boolean;
	effect_type: CardEffectType;
	effect_value: number;
};

export type TravelCard = {
	id: string;
	name: string;
	description?: string;
	phase_pool?: string;
	tags: Tag[];
	tag: Tag;
	coin: number;
	stamina: number;
	vp: number;
	image: string;
	icon?: string;
	rarity?: Rarity;
	// backward-compat alias fields (server code references old names)
	card_id: string; // same as id
	cost: number; // same as coin
	on_play_effect: string; // derived from onPlayEffect
	victory_point: number; // same as vp
	city: string;
	onPlayEffect?: GameCardEffect;
	coordinates: Coordinates;
	is_virtual?: boolean;
	// Board token fields (lock/debt pseudo-cards placed on the board)
	boardTokenType?: "debt" | "lock";
	lockedReason?: string;
	sourceCardName?: string;
	debtAmount?: number;
	bonusText?: string;
	shortName?: string;
	shortCity?: string;
	tagLabel?: string;
	rarityLabel?: string;
};

export type GridPosition = {
	day: number;
	slot: TimeSlot;
};

export type BoardCell = GridPosition & {
	card_id?: string;
	skipped?: boolean;
	locked?: boolean;
};

export type PlayerResources = {
	xu: number;
	stamina: number;
	debtToken: number;
	vp: number;
};

export type PlayerState = {
	playerId: string;
	name: string;
	board: BoardCell[];
	hand: string[];
	chosen: string[];
	storage: string[];
	draftChoice?: {
		cardId: string;
		mode: "store" | "rest";
	};
	resources: PlayerResources;
	ready: boolean;
};

export type RoomSnapshot = {
	roomId: string;
	phase: GamePhase;
	day: number;
	pickIndex: number;
	maxPlayers: number;
	players: PlayerState[];
	winnerId?: string;
	timeline?: ItineraryEntry[];
	log: string[];
};

export type ItineraryEntry = {
	day: number;
	slot: TimeSlot;
	title: string;
	coordinates: Coordinates;
	estimatedCost: number;
	note: string;
};

export type ValidationResult = {
	ok: boolean;
	reason?: string;
};
