import test from "node:test";
import assert from "node:assert/strict";
import { parseExcel } from "../src/lib/excel-parser";
import {
  buildSavedWork,
  buildWorkFileName,
  parseWorkFileText,
} from "../src/lib/work-storage";
import * as XLSX from "xlsx";

function buildSheets() {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([
      ["No", "日本語名", "英語名", "セット", "言語", "状態", "JP価格", "EN価格", "カテゴリ"],
      [1, "高価格", "High", "SET", "JP", "NM", 9000, null, "Standard"],
      [2, "低価格", "Low", "SET", "JP", "NM", 1000, null, "Standard"],
    ]),
    "Standard"
  );
  const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
  return parseExcel(buffer).sheets;
}

test("work files round-trip sheets, edits and the active sheet", () => {
  const sheets = buildSheets();
  sheets[0] = {
    ...sheets[0],
    title: "手直ししたタイトル",
    sortedOrder: [...sheets[0].sortedOrder].reverse(),
    cards: sheets[0].cards.map((card, index) =>
      index === 0 ? { ...card, priceOverride: "応相談" } : card
    ),
  };

  const work = buildSavedWork(sheets, 0);
  const restored = parseWorkFileText(JSON.stringify(work));

  assert.ok(restored);
  // JSON drops undefined optional fields, which the app treats the same as absent.
  assert.deepEqual(restored.sheets, JSON.parse(JSON.stringify(sheets)));
  assert.equal(restored.activeSheet, 0);
  assert.match(buildWorkFileName(work), /^kaitori-pop-Standard-\d{8}\.json$/);
});

test("work files reject other JSON and fix an out-of-range active sheet", () => {
  assert.equal(parseWorkFileText("not json"), null);
  assert.equal(parseWorkFileText(JSON.stringify({ sheets: [] })), null);
  assert.equal(
    parseWorkFileText(JSON.stringify({ version: 1, savedAt: "", activeSheet: 0, sheets: [] })),
    null
  );

  const work = { ...buildSavedWork(buildSheets(), 0), activeSheet: 5 };
  assert.equal(parseWorkFileText(JSON.stringify(work))?.activeSheet, 0);
});
