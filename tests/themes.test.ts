import test from "node:test";
import assert from "node:assert/strict";
import { detectGame, resolveTheme, THEMES } from "../src/lib/themes";
import { renderBuylistHtml } from "../src/lib/html-renderer";
import { parseExcel } from "../src/lib/excel-parser";
import { Card } from "../src/lib/types";
import * as XLSX from "xlsx";

function card(overrides: Partial<Card>): Card {
  return {
    id: "c",
    no: 1,
    nameJp: "",
    nameEn: "Card",
    set: "SET",
    rarity: "",
    lang: "EN",
    condition: "NM",
    priceJp: 1000,
    priceEn: null,
    category: "",
    notes: null,
    imageUrl: "",
    foil: false,
    isLand: false,
    ...overrides,
  };
}

test("detectGame recognises FaB price columns, Lorcana rarities, else MTG", () => {
  assert.equal(detectGame("Sheet1", [card({ priceJpLabel: "RF" })]), "fab");
  assert.equal(detectGame("Sheet1", [card({ rarity: "Enchanted" })]), "lorcana");
  assert.equal(detectGame("ロルカナ", [card({})]), "lorcana");
  assert.equal(detectGame("Sheet1", [card({ category: "モダン" })]), "mtg");
});

test("boards without a theme keep the classic look", () => {
  assert.equal(resolveTheme(undefined).id, "classic");
});

test("imported sheets get the detected game's official theme and titles", () => {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([
      ["No", "日本語名", "英語名", "セット", "言語", "状態", "JP価格", "EN価格", "カテゴリ"],
      [1, "カード", "Card", "SET", "EN", "NM", "RF  11000", "CF  17500", ""],
    ]),
    "Sheet1"
  );
  const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
  const sheet = parseExcel(buffer).sheets[0];

  assert.equal(sheet.theme, "fab");
  assert.equal(sheet.title, THEMES.fab.defaultTitle);
});

test("the renderer applies theme variables, fonts and the title highlight", () => {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([
      ["No", "日本語名", "英語名", "セット", "言語", "状態", "JP価格", "EN価格", "カテゴリ"],
      [1, "カード", "Card", "SET", "EN", "NM", 1000, null, "Lorcana"],
    ]),
    "Sheet1"
  );
  const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
  const sheet = parseExcel(buffer).sheets[0];
  const html = renderBuylistHtml(sheet);

  assert.equal(sheet.theme, "lorcana");
  assert.match(html, /--accent: #B97F2C;/);
  assert.match(html, /fonts\.googleapis\.com\/css2\?family=Barlow\+Condensed/);
  assert.match(html, /<span class="title-highlight">ロルカナ<\/span> 買取表/);

  const classic = renderBuylistHtml({ ...sheet, theme: undefined });
  assert.doesNotMatch(classic, /fonts\.googleapis/);
});

test("official themes keep prices over the card with a cleaner finish; classic is unchanged", () => {
  const cards = [card({ id: "a", condition: "SP", set: "LEA" })];
  const base = {
    sheetName: "Sheet1",
    title: "MTG 買取表",
    cards,
    sortedOrder: [0],
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

  for (const theme of ["mtg", "fab", "lorcana"] as const) {
    assert.equal(THEMES[theme].layout, "editorial");
    const html = renderBuylistHtml({ ...base, theme });
    assert.match(html, /data-layout="editorial"/);
    assert.match(html, /<div class="band-meta"><span class="band-left"><span class="band-cond">SP<\/span><\/span><span class="band-set">EN \/ LEA<\/span><\/div>/);
    // Foil becomes a tag beside the condition instead of a badge on the art.
    const foilHtml = renderBuylistHtml({ ...base, theme, cards: [{ ...cards[0], foil: true }] });
    assert.match(foilHtml, /<span class="band-tag"[^>]*>FOIL<\/span>/);
    assert.doesNotMatch(foilHtml, /class="badge-stack"/);
    // Prices stay over the card; the condition moves off the card name.
    assert.match(html, /<div class="bot">/);
    assert.doesNotMatch(html, /class="condition-chip"/);
    // Empty logo slots are left out instead of showing placeholders.
    assert.doesNotMatch(html, /logo-placeholder">ロゴ/);
  }

  const classic = renderBuylistHtml(base);
  assert.match(classic, /data-layout="classic"/);
  assert.match(classic, /<div class="bot">/);
  assert.match(classic, /class="condition-chip"/);
});
