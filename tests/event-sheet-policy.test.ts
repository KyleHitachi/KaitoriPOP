import test from "node:test";
import assert from "node:assert/strict";
import { renderBuylistHtml } from "../src/lib/html-renderer";
import {
  applyAppearanceToAllSheets,
  SheetAppearanceSettings,
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
    notes: "通常版",
    imageUrl: "https://example.com/card.jpg",
    foil: false,
    isLand: true,
  };
}

function buildConfig(sheetName: string, cards: Card[]): SheetConfig {
  return {
    sheetName,
    title: "MTG 買取表",
    titleSubtitle: "モダン・レガシー",
    showTitleSubtitle: true,
    cards,
    sortedOrder: cards.map((_, index) => index),
    excelOrder: cards.map((_, index) => index),
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

test("dual-land HTML fills its ten unused slots with the standard MTG card back", () => {
  const config = buildConfig(
    "02_Dual Lands",
    Array.from({ length: 26 }, (_, index) => buildCard(index))
  );

  const html = renderBuylistHtml(config);
  const mtgBackCount = (
    html.match(/<div class="cell cell-mtg-card-back">/g) ?? []
  ).length;

  assert.equal(mtgBackCount, 10);
  assert.match(html, /src="\/mtg-card-back\.png"/);
  assert.match(html, /alt="MAGIC: THE GATHERING card back"/);
  assert.doesNotMatch(html, /GOOD GAME/);
  assert.doesNotMatch(html, /<div class="cell cell-empty"><\/div>/);
});

test("non-dual HTML leaves unused slots empty", () => {
  const config = buildConfig("03_HOB・SOA Silver", [buildCard(0)]);

  const html = renderBuylistHtml(config);

  assert.equal(
    (html.match(/<div class="cell cell-mtg-card-back">/g) ?? []).length,
    0
  );
  assert.equal(
    (html.match(/<div class="cell cell-empty"><\/div>/g) ?? []).length,
    35
  );
});

test("bulk appearance applies to every sheet while preserving sheet data and the first-two condition rule", () => {
  const sheets = [
    buildConfig("01_再録禁止HighEnd", [buildCard(0)]),
    buildConfig("02_Dual Lands", [buildCard(1)]),
    buildConfig("03_HOB・SOA Silver", [buildCard(2)]),
  ];
  const settings: SheetAppearanceSettings = {
    title: "コマンドフェスト横浜限定買取表",
    titleSubtitle: "モダン・レガシー",
    showTitleSubtitle: false,
    ctaMain: "イベント限定高価買取",
    ctaSub: "ストアクレジット発行で15%UP",
    footerText: "* 掲載価格は参考価格です。",
    updatedAtText: "2026.08.29",
    showCardNames: false,
    showExpansionName: true,
    showRarityBadge: false,
    showCondition: false,
    logoGgHeight: 96,
    logoMtgHeight: 64,
    rowLabels: [],
  };

  const updated = applyAppearanceToAllSheets(sheets, settings);

  assert.deepEqual(updated.map((sheet) => sheet.title), [
    settings.title,
    settings.title,
    settings.title,
  ]);
  assert.deepEqual(updated.map((sheet) => sheet.showCondition), [true, true, false]);
  assert.deepEqual(updated.map((sheet) => sheet.cards[0].id), [
    "card-0",
    "card-1",
    "card-2",
  ]);
  assert.deepEqual(updated.map((sheet) => sheet.sortMode), [
    "price-desc",
    "price-desc",
    "price-desc",
  ]);
});
