import test from "node:test";
import assert from "node:assert/strict";
import { getGridRows, OUTPUT_SIZES, resolveOutputSize } from "../src/lib/output-sizes";
import { renderBuylistHtml } from "../src/lib/html-renderer";
import { parseExcel } from "../src/lib/excel-parser";
import * as XLSX from "xlsx";

function buildSheet() {
  const rows: unknown[][] = [["No", "日本語名", "英語名", "セット", "言語", "状態", "JP価格", "EN価格", "カテゴリ"]];
  for (let index = 1; index <= 36; index++) {
    rows.push([index, `カード${index}`, `Card ${index}`, "SET", "EN", "NM", 1000 + index, null, "Standard"]);
  }
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), "Standard");
  return parseExcel(XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer).sheets[0];
}

function countRows(html: string): number {
  return (html.match(/<div class="row /g) ?? []).length;
}

test("every size fits all 36 cards", () => {
  for (const size of Object.values(OUTPUT_SIZES)) {
    assert.ok(size.cols * getGridRows(size) >= 36, size.id);
  }
});

test("A4 sizes keep the paper ratio", () => {
  const landscape = OUTPUT_SIZES["a4-landscape"];
  const portrait = OUTPUT_SIZES["a4-portrait"];
  assert.ok(Math.abs(landscape.width / (landscape.height ?? 0) - Math.SQRT2) < 0.002);
  assert.ok(Math.abs((portrait.height ?? 0) / portrait.width - Math.SQRT2) < 0.002);
});

test("the monitor board keeps its original layout without a page wrapper", () => {
  const html = renderBuylistHtml(buildSheet());
  assert.equal(resolveOutputSize(undefined).id, "monitor");
  assert.doesNotMatch(html, /<div class="page"/);
  assert.equal(countRows(html), 4);
});

test("fixed sizes wrap the board in a canvas of that size with their columns", () => {
  const html = renderBuylistHtml({ ...buildSheet(), outputSize: "square" });
  assert.match(html, /<div class="page" style="width:1920px;height:1920px">/);
  assert.equal(countRows(html), 5);
  assert.match(html, /max-width: calc\(\(1920px - 56px - 56px\) \/ 8\)/);
});
