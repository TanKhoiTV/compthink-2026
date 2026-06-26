export type PlayerId = "p1" | "p2" | "p3" | "p4";

export type GamePhase = "lobby" | "cinematic" | "draft" | "planning" | "simulation" | "result" | "gameover";

export type PublicBoardCell = {
  cardId: string;
  name: string;
  tag: string;
  tags?: string[];
  icon: string;
  vp: number;
  coin: number;
  stamina: number;
  image?: string;
  type?: "card" | "debt" | "lock";
  debtAmount?: number;
  lockedReason?: string;
  sourceCardName?: string;
} | null;

export type ServerTravelCardData = {
  id: string;
  name: string;
  city: string;
  image: string;
  rarity: "common" | "uncommon" | "epic" | "legendary";
  rarityLabel: string;
  vp: number;
  coin: number;
  stamina: number;
  tag: string;
  tagLabel: string;
  tags?: string[];
  icon: string;
  description: string;
  bonusText: string;
  shortName?: string;
  shortCity?: string;
};

export type PlayerPublicState = {
  id: PlayerId;
  name: string;
  score: number;
  coin: number;
  stamina: number;
  usedSlots: number;
  coinDebt: number;
  isConnected: boolean;
  isReady: boolean;
  hasJoined: boolean;
  isBot?: boolean;
  planningConfirmed?: boolean;
  board: PublicBoardCell[][];
};

export type PlayerPrivateState = PlayerPublicState & {
  draftPool: ServerTravelCardData[];
  pickedDraftCards: ServerTravelCardData[];
  hand: ServerTravelCardData[];
  selectedDraftCardId: string | null;
  draftPickConfirmed?: boolean;
  planningConfirmed?: boolean;
};

export type RoomState = {
  roomId: string;
  phase: GamePhase;
  phaseNumber: number;
  dayIndex: number;
  draftRound: number;
  timer: number;
  draftTimerHold: number;
  deck: ServerTravelCardData[];
  players: Record<PlayerId, PlayerPrivateState>;
  isTutorial?: boolean;
  /** Tutorial: đóng băng phase chấm điểm trong lúc giới thiệu sự kiện. */
  tutorialPaused?: boolean;
  /** Đã lưu kết quả ván vào DB chưa (tránh ghi trùng khi tick lại). */
  dbSaved?: boolean;
};

export type PlayerViewState = Omit<RoomState, "deck" | "players"> & {
  selfPlayerId: PlayerId;
  players: Record<PlayerId, PlayerPublicState>;
  self: {
    draftPool: ServerTravelCardData[];
    pickedDraftCards: ServerTravelCardData[];
    hand: ServerTravelCardData[];
    selectedDraftCardId: string | null;
  };
};

export type ClientToServerEvents = {
  // --- 2 DÒNG MATCHMAKING ---
  "matchmaking:find": (payload: { playerName: string }) => void;
  "matchmaking:cancel": () => void;

  // --- CÁC SỰ KIỆN GỐC ---
  "room:create": (payload: { playerName: string; isTutorial?: boolean }) => void;
  "room:join": (payload: { roomId: string; playerName: string }) => void;

  "tutorial:pauseReplay": (payload: { roomId: string }) => void;
  "tutorial:resumeReplay": (payload: { roomId: string }) => void;

  "game:start": (payload: {
    roomId: string;
    playerId: PlayerId;
  }) => void;

  "room:reconnect": (payload: {
    roomId: string;
    playerId: PlayerId;
    playerName: string;
  }) => void;

  "room:setReady": (payload: {
    roomId: string;
    playerId: PlayerId;
    isReady: boolean;
  }) => void;

  "room:leave": (payload: {
    roomId: string;
    playerId: PlayerId;
  }) => void;

  "draft:selectCard": (payload: {
    roomId: string;
    playerId: PlayerId;
    cardId: string;
  }) => void;

  "draft:confirmPick": (payload: {
    roomId: string;
    playerId: PlayerId;
  }) => void;

  "planning:placeCard": (payload: {
    roomId: string;
    playerId: PlayerId;
    cardId: string;
    rowIndex: number;
    colIndex: number;
    tag?: string;
    icon?: string;
    vp?: number;
    coin?: number;
    stamina?: number;
    image?: string;
    name?: string;
  }) => void;

  "planning:discardCard": (payload: {
    roomId: string;
    playerId: PlayerId;
    cardId: string;
    coin?: number;
    stamina?: number;
    name?: string;
  }) => void;

  "planning:payDebt": (payload: {
    roomId: string;
    playerId: PlayerId;
    amount?: number;
    rowIndex?: number;
    colIndex?: number;
  }) => void;

  "planning:returnBoardCard": (payload: {
    roomId: string;
    playerId: PlayerId;
    rowIndex: number;
    colIndex: number;
  }) => void;

  "planning:confirm": (payload: {
    roomId: string;
    playerId: PlayerId;
  }) => void;
};

export type ServerToClientEvents = {
  "room:state": (state: PlayerViewState) => void;
  "room:joined": (payload: {
    roomId: string;
    playerId: PlayerId;
    state: PlayerViewState;
  }) => void;
  "game:error": (payload: { message: string }) => void;
  "room:left": () => void;
  // Cập nhật số người đang chờ trong hàng đợi tìm trận (cho màn "đang tìm trận").
  "matchmaking:status": (payload: { count: number; target: number }) => void;
};
