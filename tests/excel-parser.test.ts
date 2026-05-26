import test from "node:test";
import assert from "node:assert/strict";
import * as XLSX from "xlsx";
import { parseExcel } from "../src/lib/excel-parser";

function buildWorkbook(rows: unknown[][], sheetName = "High End"): ArrayBuffer {
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  return XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}

function encodeUtf8(text: string): ArrayBuffer {
  const bytes = new TextEncoder().encode(text);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

test("parseExcel reads header-based rows and keeps Japanese values", () => {
  const buffer = buildWorkbook([
    ["No", "日本語名", "英語名", "セット", "言語", "状態", "JP価格", "EN価格", "カテゴリ", "備考", "画像URL"],
    [1, "意志の力", "Force of Will", "ALL", "JP/EN", "NM", "24,000円", "30,000", "ハイエンド", "", "https://example.com/fow.jpg"],
  ]);

  const result = parseExcel(buffer);

  assert.equal(result.sheets.length, 1);
  assert.equal(result.warnings.length, 0);
  assert.equal(result.sheets[0].cards.length, 1);
  assert.equal(result.sheets[0].cards[0].nameJp, "意志の力");
  assert.equal(result.sheets[0].cards[0].priceJp, 24000);
  assert.equal(result.sheets[0].cards[0].priceEn, 30000);
  assert.equal(result.sheets[0].showCardNames, false);
  assert.equal(result.sheets[0].showExpansionName, true);
  assert.equal(result.sheets[0].showRarityBadge, false);
  assert.equal(result.sheets[0].showCondition, true);
});

test("parseExcel reads Lorcana rarity from header-based rows", () => {
  const buffer = buildWorkbook([
    [
      "No",
      "日本語名",
      "英語名",
      "セット",
      "レアリティ",
      "言語",
      "状態",
      "JP価格",
      "EN価格",
      "カテゴリ",
      "備考",
      "画像URL",
    ],
    [
      1,
      "ミッキーマウス",
      "Mickey Mouse",
      "TFC",
      "エンチャンテッド",
      "JP",
      "NM",
      150000,
      null,
      "Lorcana",
      "",
      "https://example.com/mickey.jpg",
    ],
  ]);

  const result = parseExcel(buffer);

  assert.equal(result.sheets[0].cards[0].rarity, "エンチャンテッド");
  assert.equal(result.sheets[0].cards[0].set, "TFC");
  assert.equal(result.sheets[0].cards[0].condition, "NM");
});

test("parseExcel detects silver scroll foil from notes", () => {
  const buffer = buildWorkbook(
    [
      [
        "No",
        "日本語名",
        "英語名",
        "セット",
        "言語",
        "状態",
        "JP価格",
        "EN価格",
        "カテゴリ",
        "備考",
        "画像URL",
      ],
      [
        1,
        "特殊カード",
        "Special Card",
        "SET",
        "JP",
        "NM",
        12000,
        null,
        "MTG",
        "シルバースクロールFoil",
        "",
      ],
    ],
    "MTG"
  );

  const result = parseExcel(buffer);
  const card = result.sheets[0].cards[0];

  assert.equal(card.foil, true);
  assert.equal(card.foilLabel, "シルバースクロールFoil");
});

test("parseExcel detects surge and galaxy foil from notes", () => {
  const buffer = buildWorkbook(
    [
      [
        "No",
        "日本語名",
        "英語名",
        "セット",
        "言語",
        "状態",
        "JP価格",
        "EN価格",
        "カテゴリ",
        "備考",
        "画像URL",
      ],
      [
        1,
        "サージカード",
        "Surge Card",
        "SET",
        "JP",
        "NM",
        12000,
        null,
        "MTG",
        "サージFoil",
        "",
      ],
      [
        2,
        "ギャラクシーカード",
        "Galaxy Card",
        "SET",
        "JP",
        "NM",
        11000,
        null,
        "MTG",
        "Galaxy Foil",
        "",
      ],
    ],
    "MTG"
  );

  const result = parseExcel(buffer);
  const cardsByName = new Map(
    result.sheets[0].cards.map((card) => [card.nameEn, card])
  );

  assert.equal(cardsByName.get("Surge Card")?.foil, true);
  assert.equal(cardsByName.get("Surge Card")?.foilLabel, "サージFoil");
  assert.equal(cardsByName.get("Galaxy Card")?.foil, true);
  assert.equal(cardsByName.get("Galaxy Card")?.foilLabel, "ギャラクシーFoil");
});

test("parseExcel detects generic foil from lowercase category", () => {
  const buffer = buildWorkbook(
    [
      [
        "No",
        "商品名",
        "英語名",
        "セット",
        "言語",
        "状態",
        "JP価格",
        "EN価格",
        "カテゴリ",
        "備考",
        "画像URL",
      ],
      [
        1,
        "ディアブロ- 従順なワタリガラス【UC】",
        "",
        "6",
        "JP",
        "NM",
        2000,
        null,
        "foil",
        "",
        "https://example.com/diablo.png",
      ],
    ],
    "Lorcana"
  );

  const result = parseExcel(buffer);
  const card = result.sheets[0].cards[0];

  assert.equal(card.foil, true);
  assert.equal(card.foilLabel, undefined);
});

test("parseExcel reads FAB NF, RF, and CF price variants", () => {
  const buffer = buildWorkbook(
    [
      [
        "No",
        "商品名",
        "英語名",
        "セット",
        "言語",
        "状態",
        "NF",
        "RF",
        "カテゴリ",
        "備考",
        "画像URL",
      ],
      [
        1,
        "フィエンダルの心臓",
        "Heart of Fyendal",
        "ANQ",
        "JP",
        "",
        7000,
        "",
        "",
        "",
        "https://example.com/nf.webp",
      ],
      [
        2,
        "トロパル＝ダニの財宝",
        "Riches of Tropal-Dhani",
        "SEA",
        "JP",
        "",
        "",
        50000,
        "",
        "",
        "https://example.com/rf.webp",
      ],
      [
        3,
        "公正の守護",
        "Balance of Justice",
        "HVY",
        "JP",
        "",
        "RF  11000",
        "CF  17500",
        "",
        "",
        "https://example.com/cf.webp",
      ],
    ],
    "FAB"
  );

  const result = parseExcel(buffer, "fab.csv");
  const cardsByName = new Map(
    result.sheets[0].cards.map((card) => [card.nameEn, card])
  );
  const nf = cardsByName.get("Heart of Fyendal");
  const rf = cardsByName.get("Riches of Tropal-Dhani");
  const cf = cardsByName.get("Balance of Justice");

  assert.equal(nf?.priceJp, 7000);
  assert.equal(nf?.priceJpLabel, "NF");
  assert.equal(nf?.foil, false);
  assert.equal(rf?.priceEn, 50000);
  assert.equal(rf?.priceEnLabel, "RF");
  assert.equal(rf?.foil, true);
  assert.equal(rf?.foilLabel, "RF");
  assert.equal(cf?.priceJp, 11000);
  assert.equal(cf?.priceJpLabel, "RF");
  assert.equal(cf?.priceEn, 17500);
  assert.equal(cf?.priceEnLabel, "CF");
  assert.equal(cf?.foil, true);
  assert.equal(cf?.foilLabel, "CF");
});

test("parseExcel reads UTF-8 csv files without dropping the first row", () => {
  const buffer = encodeUtf8(
    [
      "No,日本語名,英語名,セット,言語,状態,JP価格,EN価格,カテゴリ,備考,画像URL",
      "1,Black Lotus,Black Lotus,LEA,EN,SP,2400000,2600000,P9,,https://example.com/black-lotus.jpg",
      "2,意志の力,Force of Will,ALL,JP/EN,NM,24000,30000,ハイエンド,,https://example.com/fow.jpg",
    ].join("\n")
  );

  const result = parseExcel(buffer, "sample-buylist.csv");

  assert.equal(result.sheets.length, 1);
  assert.equal(result.sheets[0].cards.length, 2);
  assert.equal(result.sheets[0].cards[0].no, 1);
  assert.equal(result.sheets[0].cards[0].nameEn, "Black Lotus");
  assert.equal(result.sheets[0].cards[1].nameJp, "意志の力");
});

test("parseExcel warns when more than 36 cards are provided", () => {
  const rows: unknown[][] = [
    ["No", "日本語名", "英語名", "セット", "言語", "状態", "JP価格", "EN価格", "カテゴリ", "備考", "画像URL"],
  ];

  for (let index = 1; index <= 40; index++) {
    rows.push([
      index,
      `カード${index}`,
      `Card ${index}`,
      "SET",
      "EN",
      "NM",
      1000 + index,
      null,
      "Standard",
      "",
      "",
    ]);
  }

  const result = parseExcel(buildWorkbook(rows, "Standard"));

  assert.equal(result.sheets[0].cards.length, 36);
  assert.equal(result.warnings.length, 1);
  assert.match(result.warnings[0].message, /36/);
});

test("parseExcel keeps the highest priced 36 cards when truncating", () => {
  const rows: unknown[][] = [
    ["No", "日本語名", "英語名", "セット", "言語", "状態", "JP価格", "EN価格", "カテゴリ"],
  ];

  for (let index = 1; index <= 37; index++) {
    rows.push([
      index,
      `カード${index}`,
      `Card ${index}`,
      "SET",
      "JP",
      "NM",
      index === 37 ? 999999 : index,
      null,
      "Lorcana",
    ]);
  }

  const result = parseExcel(buildWorkbook(rows, "Lorcana"));
  const cardNames = result.sheets[0].cards.map((card) => card.nameEn);

  assert.equal(result.sheets[0].cards.length, 36);
  assert.equal(cardNames[0], "Card 37");
  assert.equal(cardNames.includes("Card 1"), false);
});

test("parseExcel falls back to fixed-column parsing for legacy format", () => {
  const buffer = buildWorkbook(
    [
      ["legacy format"],
      ["generated by old export"],
      [1, "湿地の干潟", "Marsh Flats", "ZEN", "JP", "SP", "2200", "", "フェッチランド", "", "https://example.com/marsh-flats.jpg"],
    ],
    "モダン・レガシー"
  );

  const result = parseExcel(buffer);
  const card = result.sheets[0].cards[0];

  assert.equal(card.nameEn, "Marsh Flats");
  assert.equal(card.set, "ZEN");
  assert.equal(card.isLand, true);
});

test("parseExcel fixed-column fallback supports a rarity column", () => {
  const buffer = buildWorkbook(
    [
      ["legacy format"],
      ["generated by lorcana export"],
      [
        1,
        "エルサ",
        "Elsa",
        "ROF",
        "Legendary",
        "JP",
        "NM",
        "45000",
        "",
        "Lorcana",
        "",
        "https://example.com/elsa.jpg",
      ],
    ],
    "Lorcana"
  );

  const result = parseExcel(buffer);
  const card = result.sheets[0].cards[0];

  assert.equal(card.rarity, "Legendary");
  assert.equal(card.lang, "JP");
  assert.equal(card.condition, "NM");
  assert.equal(card.priceJp, 45000);
});

test("parseExcel fixed-column fallback keeps legacy rows with trailing blanks aligned", () => {
  const buffer = buildWorkbook(
    [
      ["legacy format"],
      ["generated by old export"],
      [
        1,
        "旧形式カード",
        "Legacy Card",
        "SET",
        "JP",
        "NM",
        "1200",
        "",
        "Standard",
        "",
        "https://example.com/legacy.jpg",
        "",
      ],
    ],
    "Legacy"
  );

  const result = parseExcel(buffer);
  const card = result.sheets[0].cards[0];

  assert.equal(card.rarity, "");
  assert.equal(card.lang, "JP");
  assert.equal(card.condition, "NM");
  assert.equal(card.priceJp, 1200);
  assert.equal(card.category, "Standard");
  assert.equal(card.imageUrl, "https://example.com/legacy.jpg");
});

test("parseExcel initializes display order by highest price first", () => {
  const buffer = buildWorkbook([
    ["No", "日本語名", "英語名", "セット", "言語", "状態", "JP価格", "EN価格", "カテゴリ"],
    [1, "低価格", "Low", "SET", "JP", "NM", 1000, null, "Lorcana"],
    [2, "高価格", "High", "SET", "JP", "NM", 9000, null, "Lorcana"],
    [3, "中価格", "Mid", "SET", "JP", "NM", 3000, null, "Lorcana"],
  ]);

  const result = parseExcel(buffer);
  const sortedNames = result.sheets[0].sortedOrder.map(
    (index) => result.sheets[0].cards[index].nameEn
  );

  assert.deepEqual(sortedNames, ["High", "Mid", "Low"]);
  assert.deepEqual(
    result.sheets[0].cards.map((card) => card.nameEn),
    ["High", "Mid", "Low"]
  );
});
