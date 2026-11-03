import test from "node:test";
import assert from "node:assert/strict";
import { renderBuylistHtml } from "../src/lib/html-renderer";
import {
  SheetAppearanceSettings,
  applyAppearanceToAllSheets,
} from "../src/lib/event-sheet-policy";
import { Card, SheetConfig } from "../src/lib/types";

function buildCard(index: number): Card {
  return {
    id: `card-${index}`,
    no: index + 1,
    nameJp: `カード${index + 1}`,
    nameEn: `Card ${index + 1}`,
    set: "3ED",
    rarity: "",
    lang: "EN",
    condition: "SP",
    priceJp: null,
    priceEn: 1000 + index * 100,
    category: "Dual Land",
    notes: null,
    imageUrl: "",
    foil: false,
    isLand: true,
  };
}

function buildConfig(sheetName: string, cards: Card[]): SheetConfig {
  return {
    sheetName,
    title: "MTG 買取表",
    cards,
    sortedOrder: cards.map((_, index) => index),
    sortMode: "price-desc",
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

function count(html: string, pattern: RegExp): number {
  return (html.match(pattern) ?? []).length;
}

test("dual-land boards fill unused slots with the MTG card back", () => {
  const config = buildConfig(
    "02_Dual Lands",
    Array.from({ length: 26 }, (_, index) => buildCard(index))
  );

  const html = renderBuylistHtml(config);

  assert.equal(count(html, /<div class="cell cell-mtg-card-back">/g), 10);
  assert.match(html, /src="\/mtg-card-back\.png"/);
  assert.equal(count(html, /<div class="cell cell-empty"><\/div>/g), 0);
});

test("dual-land card backs fill every slot of a larger grid", () => {
  const config = {
    ...buildConfig("02_Dual Lands", [buildCard(0)]),
    outputSize: "square" as const,
  };

  const html = renderBuylistHtml(config);

  // 8 columns x 5 rows = 40 slots.
  assert.equal(count(html, /<div class="cell cell-mtg-card-back">/g), 39);
});

test("other boards leave unused slots empty", () => {
  const html = renderBuylistHtml(buildConfig("03_HOB・SOA Silver", [buildCard(0)]));

  assert.equal(count(html, /<div class="cell cell-mtg-card-back">/g), 0);
  assert.equal(count(html, /<div class="cell cell-empty"><\/div>/g), 35);
});

test("applying a preset to all sheets keeps sheet data and the first-two condition rule", () => {
  const sheets = [
    buildConfig("01_再録禁止HighEnd", [buildCard(0)]),
    buildConfig("02_Dual Lands", [buildCard(1)]),
    buildConfig("03_HOB・SOA Silver", [buildCard(2)]),
  ];
  const settings: SheetAppearanceSettings = {
    title: "イベント限定買取表",
    showTitleSubtitle: false,
    ctaMain: "イベント限定高価買取",
    ctaSub: "ストアクレジットで15%UP",
    footerText: "* 掲載価格は参考価格です。",
    updatedAtText: "2026.08.29",
    showCardNames: false,
    showExpansionName: true,
    showRarityBadge: false,
    showCondition: false,
    rowLabels: [],
  };

  const updated = applyAppearanceToAllSheets(sheets, settings);

  assert.deepEqual(updated.map((sheet) => sheet.title), Array(3).fill(settings.title));
  assert.deepEqual(updated.map((sheet) => sheet.showCondition), [true, true, false]);
  assert.deepEqual(updated.map((sheet) => sheet.cards[0].id), ["card-0", "card-1", "card-2"]);
  assert.deepEqual(updated.map((sheet) => sheet.sortMode), Array(3).fill("price-desc"));
});
