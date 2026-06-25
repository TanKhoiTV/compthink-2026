import type { TravelCard } from "./types.ts"

export type CreateInitialDeckParams = {
  cards: TravelCard[];
  fallbackCards: TravelCard[];
  handSize: number;
};

export type DrawDailyHandFromDeckParams = {
  deck: TravelCard[];
  handSize: number;
  shuffleCards: (cards: TravelCard[]) => TravelCard[];
};

export type DrawDailyHandFromDeckResult = {
  deck: TravelCard[];
  hand: TravelCard[];
};

export type ReturnUnplayedHandToDeckParams = {
  deck: TravelCard[];
  playerHand: TravelCard[];
  shuffleCards: (cards: TravelCard[]) => TravelCard[];
};

export type ReturnUnplayedHandToDeckResult = {
  deck: TravelCard[];
  playerHand: TravelCard[];
};

export function createInitialDeck({
  cards,
  fallbackCards,
  handSize,
}: CreateInitialDeckParams): TravelCard[] {
  if (cards.length >= handSize) {
    return cards;
  }

  return [
    ...cards,
    ...fallbackCards.slice(0, handSize - cards.length),
  ];
}

export function shuffleCards(cards: TravelCard[]): TravelCard[] {
  const shuffled = [...cards];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const temp = shuffled[index];
    shuffled[index] = shuffled[randomIndex];
    shuffled[randomIndex] = temp;
  }

  return shuffled;
}

export function drawDailyHandFromDeck({
  deck,
  handSize,
  shuffleCards,
}: DrawDailyHandFromDeckParams): DrawDailyHandFromDeckResult {
  const shuffledDeck = shuffleCards(deck);
  const hand = shuffledDeck.slice(0, handSize);

  return {
    deck: shuffledDeck.slice(handSize),
    hand,
  };
}

export function returnUnplayedHandToDeck({
  deck,
  playerHand,
  shuffleCards,
}: ReturnUnplayedHandToDeckParams): ReturnUnplayedHandToDeckResult {
  if (playerHand.length === 0) {
    return {
      deck,
      playerHand,
    };
  }

  return {
    deck: shuffleCards([...deck, ...playerHand]),
    playerHand: [],
  };
}
