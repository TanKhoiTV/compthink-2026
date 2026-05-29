export type Tag = 'FOOD' | 'CULTURE' | 'ACTION' | 'UTILITY' | 'TRANSIT' | 'REST' | 'OUTDOOR' | 'INDOOR';
export type TimeSlot = 'early_morning' | 'morning' | 'afternoon' | 'evening' | 'night';
export type GamePhase = 'lobby' | 'draft' | 'placement' | 'scoring' | 'finished';

export type Coordinates = {
  lat: number;
  lng: number;
};

export type Rarity = 'common' | 'uncommon' | 'epic' | 'legendary';

export type TravelCard = {
  card_id: string;
  name: string;
  description?: string;
  phase_pool?: string;
  tags: Tag[];
  cost: number;
  stamina: number;
  victory_point: number;
  image: string;
  icon?: string;
  rarity?: Rarity;
  on_play_effect: string;
  coordinates: Coordinates;
  is_virtual?: boolean;
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
    mode: 'store' | 'rest';
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
