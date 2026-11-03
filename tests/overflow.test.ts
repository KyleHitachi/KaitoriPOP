import test from "node:test";
import assert from "node:assert/strict";
import { swapInOverflowCard } from "../src/lib/overflow";
import { Card, GRID_TOTAL, SheetConfig } from "../src/lib/types";

function buildCard(id: string, price: number): Card {
  return {
    id,
    no: 1,
    nameJp: id,
    nameEn: id,
    set: "SET",
    rarity: "",
    lang: "EN",
    condition: "NM",
    priceJp: price,
    priceEn: null,
    category: "Standard",
    notes: null,
    imageUrl: "",
    foil: false,
    isLand: false,
  };
}

function buildConfig(cards: Card[], overflowCards: Card[]): SheetConfig {
  return {
    sheetName: "Standard",
    title: "MTG 買取表",
    cards,
    overflowCards,
    sortedOrder: cards.map((_, index) => index).reverse(),
    rowLabels: [],
    showCardNames: false,
    showExpansionName: true,
    showRarityBadge: false,
    showCondition: true,
    ctaMain: "",
    ctaSub: "",
    footerText: "",
    updatedAtText: "",
  };
}

test("swapping into a full board replaces the cheapest card in its slot", () => {
  const board = Array.from({ length: GRID_TOTAL }, (_, index) =>
    buildCard(`board-${index}`, 10000 - index * 100)
  );
  const config = buildConfig(board, [buildCard("over-a", 500), buildCard("over-b", 400)]);

  const result = swapInOverflowCard(config, 1);

  assert.ok(result);
  assert.equal(result.swappedIn.id, "over-b");
  assert.equal(result.swappedOut?.id, `board-${GRID_TOTAL - 1}`);
  assert.equal(result.config.cards.length, GRID_TOTAL);
  assert.equal(result.config.cards[GRID_TOTAL - 1].id, "over-b");
  assert.deepEqual(result.config.sortedOrder, config.sortedOrder);
  assert.deepEqual(
    result.config.overflowCards?.map((card) => card.id),
    [`board-${GRID_TOTAL - 1}`, "over-a"]
  );
});

test("swapping into a board with free slots appends without removing", () => {
  const config = buildConfig([buildCard("board", 1000)], [buildCard("over", 500)]);

  const result = swapInOverflowCard(config, 0);

  assert.ok(result);
  assert.equal(result.swappedOut, null);
  assert.deepEqual(result.config.cards.map((card) => card.id), ["board", "over"]);
  assert.deepEqual(result.config.sortedOrder, [0, 1]);
  assert.deepEqual(result.config.overflowCards, []);
});

test("swapping an unknown overflow index does nothing", () => {
  assert.equal(swapInOverflowCard(buildConfig([], []), 0), null);
});
