import type { TravelCardData } from "../types.js";

export type CreateInitialDeckParams = {
  cards: TravelCardData[];
  fallbackCards: TravelCardData[];
  handSize: number;
};

export type DrawDailyHandFromDeckParams = {
  deck: TravelCardData[];
  handSize: number;
  shuffleCards: (cards: TravelCardData[]) => TravelCardData[];
};

export type DrawDailyHandFromDeckResult = {
  deck: TravelCardData[];
  hand: TravelCardData[];
};

export type ReturnUnplayedHandToDeckParams = {
  deck: TravelCardData[];
  playerHand: TravelCardData[];
  shuffleCards: (cards: TravelCardData[]) => TravelCardData[];
};

export type ReturnUnplayedHandToDeckResult = {
  deck: TravelCardData[];
  playerHand: TravelCardData[];
};

export function createInitialDeck({
  cards,
  fallbackCards,
  handSize,
}: CreateInitialDeckParams): TravelCardData[] {
  if (cards.length >= handSize) {
    return cards;
  }

  return [
    ...cards,
    ...fallbackCards.slice(0, handSize - cards.length),
  ];
}

export function shuffleCards(cards: TravelCardData[]): TravelCardData[] {
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
