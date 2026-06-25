import type { TravelCardData } from "../types.js";

export type DraftPlayerState = {
  name: string;
  pool: TravelCardData[];
  picked: TravelCardData[];
};

export type DraftPickResult = {
  playerIndex: number;
  pickedCard: TravelCardData;
};

export type CreateDailyDraftPlayersParams = {
  deck: TravelCardData[];
  initialDeck: TravelCardData[];
  // poolSize dùng cho số lá phát ban đầu. Game hiện phát 7 lá rồi pick 5.
  handSize: number;
  playerCount: number;
  shuffleCards: (cards: TravelCardData[]) => TravelCardData[];
};

export type CreateDailyDraftPlayersResult = {
  deck: TravelCardData[];
  draftPlayers: DraftPlayerState[];
};

export function getDraftPlayerNames(): string[] {
  return ["Cường", "An", "Minh", "Khánh"];
}

export function getActiveDraftPlayerIndex(): number {
  return 1; // An
}

export function getCurrentDraftPlayer(
  draftPlayers: DraftPlayerState[],
  activeIndex = getActiveDraftPlayerIndex(),
): DraftPlayerState | undefined {
  return draftPlayers[activeIndex];
}

export function pickRandomCard(cards: TravelCardData[]): TravelCardData | null {
  if (cards.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * cards.length);
  return cards[randomIndex];
}

export function rotateDraftPoolsClockwise(
  draftPlayers: DraftPlayerState[],
): DraftPlayerState[] {
  const oldPools = draftPlayers.map((player) => [...player.pool]);

  return draftPlayers.map((player, index) => {
    const sourceIndex = (index - 1 + draftPlayers.length) % draftPlayers.length;

    return {
      ...player,
      pool: oldPools[sourceIndex],
    };
  });
}

function getPrimaryDraftTag(card: TravelCardData): string {
  const rawId = String(card.id ?? (card as { card_id?: string }).card_id ?? "")
    .toUpperCase();

  if (rawId.includes("_CULT_") || rawId.startsWith("SG_CULT")) return "CULTURE";
  if (rawId.includes("_ACT_") || rawId.startsWith("SG_ACT")) return "ACTION";
  if (rawId.includes("_UTIL_") || rawId.startsWith("SG_UTIL")) return "UTILITY";
  if (rawId.includes("_FOOD_") || rawId.startsWith("SG_FOOD")) return "FOOD";

  const tags = (card.tags ?? []).map((tag) => String(tag).toUpperCase());

  if (tags.includes("CULTURE")) return "CULTURE";
  if (tags.includes("ACTION")) return "ACTION";
  if (tags.includes("UTILITY")) return "UTILITY";
  if (tags.includes("FOOD")) return "FOOD";

  const fallbackTag = String(card.tag ?? "").toUpperCase();

  if (fallbackTag === "CULTURE") return "CULTURE";
  if (fallbackTag === "ACTION") return "ACTION";
  if (fallbackTag === "UTILITY") return "UTILITY";
  if (fallbackTag === "FOOD") return "FOOD";

  return "UNKNOWN";
}

function shuffleGeneric<T>(items: T[]): T[] {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const temp = shuffled[index];
    shuffled[index] = shuffled[randomIndex];
    shuffled[randomIndex] = temp;
  }

  return shuffled;
}

function createBalancedRandomDeck(
  cards: TravelCardData[],
  shuffleCards: (cards: TravelCardData[]) => TravelCardData[],
): TravelCardData[] {
  const buckets = new Map<string, TravelCardData[]>();

  for (const card of cards) {
    const tag = getPrimaryDraftTag(card);
    const bucket = buckets.get(tag) ?? [];

    bucket.push(card);
    buckets.set(tag, bucket);
  }

  for (const [tag, bucket] of buckets.entries()) {
    buckets.set(tag, shuffleCards(bucket));
  }

  const balancedDeck: TravelCardData[] = [];
  const preferredOrder = ["FOOD", "CULTURE", "ACTION", "UTILITY", "UNKNOWN"];

  while (preferredOrder.some((tag) => (buckets.get(tag)?.length ?? 0) > 0)) {
    const roundOrder = shuffleGeneric(preferredOrder);

    for (const tag of roundOrder) {
      const nextCard = buckets.get(tag)?.shift();

      if (nextCard) {
        balancedDeck.push(nextCard);
      }
    }
  }

  return balancedDeck;
}

export function createDailyDraftPlayers({
  deck,
  handSize,
  playerCount,
  shuffleCards,
}: CreateDailyDraftPlayersParams): CreateDailyDraftPlayersResult {
  /*
    Không tự bơm lại initialDeck nữa.

    Bản cũ làm thế này khi deck không đủ bài:
      shuffleCards([...deck, ...initialDeck])

    Điều đó khiến các thẻ đã dùng lại xuất hiện như "bản copy/fake".
    Bản này chỉ chia đúng số thẻ thật còn lại trong deck.
    Nếu deck gần hết, một vài pool sẽ ít hơn handSize thay vì tạo bản sao.
  */
  const requiredCards = playerCount * handSize;
  const draftDeck = createBalancedRandomDeck(deck, shuffleCards);
  const dailyCards = draftDeck.slice(
    0,
    Math.min(requiredCards, draftDeck.length),
  );
  const nextDeck = draftDeck.slice(dailyCards.length);
  const names = getDraftPlayerNames();

  return {
    deck: nextDeck,
    draftPlayers: names.map((name, index) => {
      const start = index * handSize;

      return {
        name,
        pool: dailyCards.slice(start, start + handSize),
        picked: [],
      };
    }),
  };
}
