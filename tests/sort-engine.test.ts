import test from "node:test";
import assert from "node:assert/strict";
import { sortSheet } from "../src/lib/sort-engine";
import { SheetConfig, Card } from "../src/lib/types";

function buildCard(overrides: Partial<Card>): Card {
  return {
    id: overrides.id ?? "card-id",
    no: overrides.no ?? 1,
    nameJp: overrides.nameJp ?? "カード",
    nameEn: overrides.nameEn ?? "Card",
    set: overrides.set ?? "SET",
    rarity: overrides.rarity ?? "",
    lang: overrides.lang ?? "EN",
    condition: overrides.condition ?? "NM",
    priceJp: overrides.priceJp ?? null,
    priceEn: overrides.priceEn ?? null,
    category: overrides.category ?? "Standard",
    notes: overrides.notes ?? null,
    imageUrl: overrides.imageUrl ?? "",
    foil: overrides.foil ?? false,
    isLand: overrides.isLand ?? false,
    priceOverride: overrides.priceOverride,
    setLabelOverride: overrides.setLabelOverride,
    rarityOverride: overrides.rarityOverride,
    foilOverride: overrides.foilOverride,
    landOverride: overrides.landOverride,
    imageData: overrides.imageData,
  };
}

function buildConfig(cards: Card[], sheetName = "High End"): SheetConfig {
  return {
    sheetName,
    title: "MTG 買取表",
    cards,
    sortedOrder: cards.map((_, index) => index),
    rowLabels: [],
    showCardNames: false,
    showExpansionName: true,
    showRarityBadge: false,
    showCondition: true,
    ctaMain: "高価買取中",
    ctaSub: "店頭でそのまま査定できます",
    footerText: "* 掲載価格は参考価格です。",
    updatedAtText: "",
  };
}

test("sortSheet keeps P9 row first for high-end sheets", () => {
  const config = buildConfig([
    buildCard({
      id: "dual",
      no: 2,
      nameEn: "Underground Sea",
      category: "Dual Land",
      priceEn: 200000,
      isLand: true,
    }),
    buildCard({
      id: "p9",
      no: 1,
      nameEn: "Black Lotus",
      category: "P9",
      priceEn: 2500000,
    }),
    buildCard({
      id: "high",
      no: 3,
      nameEn: "Force of Will",
      category: "High End",
      priceEn: 30000,
    }),
  ]);

  const sorted = sortSheet(config);
  const sortedIds = sorted.sortedOrder.map((index) => config.cards[index].id);

  assert.deepEqual(sortedIds, ["p9", "high", "dual"]);
  assert.equal(sorted.rowLabels[0]?.text, "POWER 9");
});

test("sortSheet uses normalized category matching", () => {
  const config = buildConfig(
    [
      buildCard({
        id: "featured",
        no: 1,
        category: "edh foil",
        nameEn: "Mana Crypt",
        priceEn: 18000,
      }),
      buildCard({
        id: "rest",
        no: 2,
        category: "EDH",
        nameEn: "Sol Ring",
        priceEn: 500,
      }),
    ],
    "EDH"
  );

  const sorted = sortSheet(config);
  const sortedIds = sorted.sortedOrder.map((index) => config.cards[index].id);

  assert.deepEqual(sortedIds, ["featured", "rest"]);
});

test("sortSheet preserves duplicate collector numbers using id-based mapping", () => {
  const config = buildConfig(
    [
      buildCard({ id: "a", no: 10, nameEn: "Card A", category: "Standard", priceEn: 1000 }),
      buildCard({ id: "b", no: 10, nameEn: "Card B", category: "Standard", priceEn: 2000 }),
    ],
    "Standard"
  );

  const sorted = sortSheet(config);
  const sortedIds = sorted.sortedOrder.map((index) => config.cards[index].id);

  assert.deepEqual(sortedIds, ["b", "a"]);
});
