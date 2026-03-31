import {
  Card,
  SheetConfig,
  CATEGORY_ORDER,
  HIGH_END_SHEET_NAMES,
  HIGH_END_CATEGORY_NAMES,
  DUAL_LAND_CATEGORY_NAMES,
  EDH_FEATURED_CATEGORY_NAMES,
} from "./types";

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function maxPrice(card: Card): number {
  return Math.max(card.priceJp ?? 0, card.priceEn ?? 0);
}

function isLand(card: Card): boolean {
  return card.landOverride ?? card.isLand;
}

function matchesAny(value: string, candidates: string[]): boolean {
  const normalizedValue = normalize(value);
  return candidates.some((candidate) => normalize(candidate) === normalizedValue);
}

function getCategoryOrder(sheetName: string, cards: Card[]): string[] {
  const normalizedSheetName = normalize(sheetName);
  const matchedEntry = Object.entries(CATEGORY_ORDER).find(
    ([key]) => normalize(key) === normalizedSheetName
  );

  if (matchedEntry) return matchedEntry[1];

  const seen = new Set<string>();
  const order: string[] = [];
  for (const card of cards) {
    const normalizedCategory = normalize(card.category);
    if (seen.has(normalizedCategory)) continue;
    seen.add(normalizedCategory);
    order.push(card.category);
  }
  return order;
}

function groupByName(cards: Card[]): Card[][] {
  const map = new Map<string, Card[]>();

  for (const card of cards) {
    const key = card.nameEn || card.nameJp || card.id;
    const group = map.get(key) ?? [];
    group.push(card);
    map.set(key, group);
  }

  for (const group of map.values()) {
    group.sort((a, b) => maxPrice(b) - maxPrice(a));
  }

  return Array.from(map.values());
}

function sortGroups(groups: Card[][]): Card[][] {
  return groups.sort((a, b) => maxPrice(b[0]) - maxPrice(a[0]));
}

function flattenGroups(groups: Card[][]): Card[] {
  return groups.flat();
}

function sortWithinCategory(cards: Card[]): Card[] {
  const nonLand = cards.filter((card) => !isLand(card));
  const land = cards.filter((card) => isLand(card));
  const sortedNonLand = flattenGroups(sortGroups(groupByName(nonLand)));

  const landBySet = new Map<string, Card[]>();
  for (const card of land) {
    const setCards = landBySet.get(card.set) ?? [];
    setCards.push(card);
    landBySet.set(card.set, setCards);
  }

  const sortedSets = Array.from(landBySet.entries()).sort(([, a], [, b]) => {
    const topA = [...a].sort((x, y) => maxPrice(y) - maxPrice(x))[0];
    const topB = [...b].sort((x, y) => maxPrice(y) - maxPrice(x))[0];
    return maxPrice(topB) - maxPrice(topA);
  });

  const sortedLand: Card[] = [];
  for (const [, setCards] of sortedSets) {
    sortedLand.push(...flattenGroups(sortGroups(groupByName(setCards))));
  }

  return [...sortedNonLand, ...sortedLand];
}

function sortHighEnd(cards: Card[]): {
  sorted: Card[];
  rowLabels: { row: number; text: string; visible: boolean }[];
} {
  const p9 = cards.filter((card) => normalize(card.category) === "p9");
  const highEnd = cards.filter((card) =>
    matchesAny(card.category, HIGH_END_CATEGORY_NAMES)
  );
  const dualLand = cards.filter((card) =>
    matchesAny(card.category, DUAL_LAND_CATEGORY_NAMES)
  );
  const rest = cards.filter(
    (card) =>
      normalize(card.category) !== "p9" &&
      !matchesAny(card.category, HIGH_END_CATEGORY_NAMES) &&
      !matchesAny(card.category, DUAL_LAND_CATEGORY_NAMES)
  );

  return {
    sorted: [
      ...sortWithinCategory(p9),
      ...sortWithinCategory(highEnd),
      ...sortWithinCategory(dualLand),
      ...sortWithinCategory(rest),
    ],
    rowLabels: [{ row: 0, text: "POWER 9", visible: true }],
  };
}

function sortEDH(cards: Card[]): Card[] {
  const featured = cards.filter((card) =>
    matchesAny(card.category, EDH_FEATURED_CATEGORY_NAMES)
  );
  const rest = cards.filter(
    (card) => !matchesAny(card.category, EDH_FEATURED_CATEGORY_NAMES)
  );
  return [...sortWithinCategory(featured), ...sortWithinCategory(rest)];
}

export function sortSheet(config: SheetConfig): SheetConfig {
  const { sheetName, cards } = config;

  let sortedCards: Card[];
  let rowLabels = config.rowLabels;

  if (matchesAny(sheetName, HIGH_END_SHEET_NAMES)) {
    const result = sortHighEnd(cards);
    sortedCards = result.sorted;
    rowLabels = result.rowLabels;
  } else if (normalize(sheetName) === "edh") {
    sortedCards = sortEDH(cards);
  } else {
    const categoryOrder = getCategoryOrder(sheetName, cards);
    const byCategory = new Map<string, Card[]>();

    for (const card of cards) {
      const key = normalize(card.category);
      const categoryCards = byCategory.get(key) ?? [];
      categoryCards.push(card);
      byCategory.set(key, categoryCards);
    }

    sortedCards = [];
    for (const category of categoryOrder) {
      sortedCards.push(...sortWithinCategory(byCategory.get(normalize(category)) ?? []));
    }

    for (const [category, categoryCards] of byCategory) {
      if (categoryOrder.some((item) => normalize(item) === category)) continue;
      sortedCards.push(...sortWithinCategory(categoryCards));
    }
  }

  const sortedOrder = sortedCards.map((sortedCard) =>
    cards.findIndex((card) => card.id === sortedCard.id)
  );

  return {
    ...config,
    sortedOrder,
    rowLabels,
  };
}

export function getSortedCards(config: SheetConfig): Card[] {
  return config.sortedOrder.map((index) => config.cards[index]).filter(Boolean);
}
