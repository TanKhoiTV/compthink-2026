export type PlayerId = "p1" | "p2" | "p3" | "p4";

/*
  Raw card data trong src/data/cards.*.
  cardMapper.ts đang đọc schema này:
  card_id, image_url, phase_pool, cost, base_vp, location, on_play_effect...
*/
export type CardRarity = "COMMON" | "UNCOMMON" | "EPIC" | "LEGENDARY";

export type CardTag =
  | "FOOD"
  | "CULTURE"
  | "ACTION"
  | "UTILITY"
  | "OUTDOOR"
  | "INDOOR"
  | "NATURE"
  | "NIGHT"
  | string;

export type CardEffectType =
  | "NONE"
  | "RECOVER_LA"
  | "RECOVER_XU"
  | "GAIN_VP"
  | string;

export type GameCardEffect = {
  has_effect: boolean;
  effect_type: CardEffectType;
  effect_value: number;
};

export type GameCardCost = {
  xu: number;
  la: number;
};

export type GameCardLocation = {
  lat: number;
  lng: number;
  is_virtual: boolean;
  label: string;
};

export type PhasePool = "SAIGON" | "HANOI" | "DANANG" | "DALAT" | string;

export type GameCardData = {
  card_id: string;
  name: string;
  description: string;
  image_url: string;
  phase_pool: PhasePool;
  tags: CardTag[];
  cost: GameCardCost;
  base_vp: number;
  location: GameCardLocation;
  on_play_effect: GameCardEffect;
  rarity: CardRarity;
  icon: string;
};

/*
  Data đã qua cardMapper.ts, dùng để render trong app.ts.
  tags/onPlayEffect để optional vì fallbackHandCards trong app.ts không có 2 field này.
*/
export type UiCardRarity = "common" | "uncommon" | "epic" | "legendary";

export type TravelCardData = {
  id: string;
  name: string;
  shortName?: string;
  city: string;
  shortCity?: string;
  image: string;
  rarity: UiCardRarity;
  rarityLabel: string;
  vp: number;
  coin: number;
  stamina: number;
  tag: string;
  tagLabel: string;

  /*
    Dùng string[] để app.ts có thể tạo fallback tags bằng normalizedTag.toUpperCase().
    Các hàm game vẫn đọc được vì tag key cuối cùng cũng là string.
  */
  tags?: string[];

  /*
    Card data thật có effect, fallback card có thể không có.
    app.ts cũng đang dùng optional chaining: card.onPlayEffect?.
  */
  onPlayEffect?: GameCardEffect;

  icon: string;
  description: string;
  bonusText: string;
};

export type Player = {
  id: PlayerId;
  rank: number;
  name: string;
  score: number;
  coin: number;
  stamina: number;
  usedSlots: number;
  active?: boolean;
};

export type HandPointerDragState = {
  id: string;
  source: HTMLElement;
  clone: HTMLElement | null;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  isDragging: boolean;
};
