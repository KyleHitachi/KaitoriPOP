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
  assert.match(html, /--accent: #D89E47;/);
  assert.match(html, /fonts\.googleapis\.com\/css2\?family=Barlow\+Condensed/);
  assert.match(html, /<span class="title-highlight">ロルカナ<\/span> 買取表/);

  const classic = renderBuylistHtml({ ...sheet, theme: undefined });
  assert.doesNotMatch(classic, /fonts\.googleapis/);
});
