import { Card, GRID_TOTAL, SheetConfig } from "./types";

export function getCardPrice(card: Card): number {
  return Math.max(card.priceJp ?? 0, card.priceEn ?? 0);
}

function sortByPriceDescending(cards: Card[]): Card[] {
  return [...cards].sort((left, right) => getCardPrice(right) - getCardPrice(left));
}

export interface OverflowSwapResult {
  config: SheetConfig;
  swappedIn: Card;
  swappedOut: Card | null;
}

// Puts an off-board card on the board. When the board is full it takes the
// slot of the cheapest board card, which moves to the off-board list so the
// swap can be undone from the same list.
export function swapInOverflowCard(
  config: SheetConfig,
  overflowIndex: number
): OverflowSwapResult | null {
  const overflowCards = config.overflowCards ?? [];
  const swappedIn = overflowCards[overflowIndex];
  if (!swappedIn) return null;

  const remainingOverflow = overflowCards.filter((_, index) => index !== overflowIndex);

  if (config.cards.length < GRID_TOTAL) {
    return {
      config: {
        ...config,
        cards: [...config.cards, swappedIn],
        sortedOrder: [...config.sortedOrder, config.cards.length],
        overflowCards: remainingOverflow,
      },
      swappedIn,
      swappedOut: null,
    };
  }

  let cheapestIndex = 0;
  config.cards.forEach((card, index) => {
    if (getCardPrice(card) < getCardPrice(config.cards[cheapestIndex])) {
      cheapestIndex = index;
    }
  });
  const swappedOut = config.cards[cheapestIndex];
  const cards = config.cards.map((card, index) => (index === cheapestIndex ? swappedIn : card));

  return {
    config: {
      ...config,
      cards,
      overflowCards: sortByPriceDescending([...remainingOverflow, swappedOut]),
    },
    swappedIn,
    swappedOut,
  };
}
