import * as XLSX from "xlsx";
import {
  Card,
  SheetConfig,
  LAND_KEYWORDS,
  DEFAULT_TITLE,
  DEFAULT_TITLE_SUBTITLE,
  DEFAULT_CTA_MAIN,
  DEFAULT_CTA_SUB,
  DEFAULT_FOOTER,
  DEFAULT_UPDATED_AT_TEXT,
  GRID_TOTAL,
} from "./types";
import { resolveSpecialFoilBadge } from "./foil-badge";

export interface ParseWarning {
  sheetName: string;
  message: string;
}

export interface ParseResult {
  sheets: SheetConfig[];
  warnings: ParseWarning[];
}

type CardField =
  | "no"
  | "nameJp"
  | "nameEn"
  | "set"
  | "rarity"
  | "lang"
  | "condition"
  | "priceJp"
  | "priceEn"
  | "category"
  | "notes"
  | "imageUrl";

const HEADER_ALIASES: Record<CardField, string[]> = {
  no: ["No", "NO", "\u756a\u53f7"],
  nameJp: [
    "\u65e5\u672c\u8a9e\u540d",
    "\u65e5\u672c\u8a9e\u30ab\u30fc\u30c9\u540d",
    "\u30ab\u30fc\u30c9\u540d",
    "JP\u540d",
    "\u5546\u54c1\u540d",
  ],
  nameEn: ["\u82f1\u8a9e\u540d", "English Name", "EN\u540d", "\u82f1\u540d"],
  set: ["\u30bb\u30c3\u30c8", "Set", "Edition"],
  rarity: ["\u30ec\u30a2\u30ea\u30c6\u30a3", "\u30ec\u30a2\u30ea\u30c6\u30a3\u30fc", "Rarity"],
  lang: ["\u8a00\u8a9e", "Language", "Lang"],
  condition: ["\u72b6\u614b", "Condition", "SP"],
  priceJp: [
    "JP\u4fa1\u683c",
    "\u65e5\u672c\u8a9e\u4fa1\u683c",
    "\u4fa1\u683cJP",
    "Price JP",
    "\u8cb7\u53d6\u4fa1\u683cJP",
    "NF",
    "Non Foil",
    "Non-Foil",
    "\u30ce\u30f3\u30d5\u30a9\u30a4\u30eb",
  ],
  priceEn: [
    "EN\u4fa1\u683c",
    "\u82f1\u8a9e\u4fa1\u683c",
    "\u4fa1\u683cEN",
    "Price EN",
    "\u8cb7\u53d6\u4fa1\u683cEN",
    "RF",
    "Rainbow Foil",
    "\u30ec\u30a4\u30f3\u30dc\u30fc\u30d5\u30a9\u30a4\u30eb",
    "CF",
    "Cold Foil",
    "\u30b3\u30fc\u30eb\u30c9\u30d5\u30a9\u30a4\u30eb",
  ],
  category: ["\u30ab\u30c6\u30b4\u30ea", "\u30ab\u30c6\u30b4\u30ea\u30fc", "Category"],
  notes: ["\u5099\u8003", "\u30e1\u30e2", "Notes", "Note"],
  imageUrl: ["\u753b\u50cfURL", "Image URL", "ImageURL"],
};

const WARNING_TRUNCATED =
  "\u30ab\u30fc\u30c9\u304c\u0033\u0036\u679a\u3092\u8d85\u3048\u305f\u305f\u3081\u3001\u4fa1\u683c\u304c\u9ad8\u3044\u0033\u0036\u679a\u306e\u307f\u8aad\u307f\u8fbc\u307f\u307e\u3057\u305f\u3002";

function decodeCsvText(buffer: ArrayBuffer, encoding: string): string {
  return new TextDecoder(encoding as "utf-8", { fatal: false }).decode(
    new Uint8Array(buffer)
  );
}

function getWorkbookRows(workbook: XLSX.WorkBook): unknown[][] {
  const firstSheetName = workbook.SheetNames[0];
  const firstSheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_json(firstSheet, {
    header: 1,
    defval: null,
    blankrows: true,
  }) as unknown[][];
}

function scoreWorkbook(workbook: XLSX.WorkBook): number {
  const rows = getWorkbookRows(workbook);
  const headerInfo = findHeaderRow(rows);
  if (headerInfo) {
    return 1000 + rows.length;
  }
  return rows.length;
}

function readWorkbook(buffer: ArrayBuffer, fileName?: string): XLSX.WorkBook {
  if (fileName?.toLowerCase().endsWith(".csv")) {
    const candidates = ["utf-8", "shift_jis"]
      .map((encoding) => {
        try {
          const text = decodeCsvText(buffer, encoding);
          const workbook = XLSX.read(text, { type: "string" });
          return { workbook, score: scoreWorkbook(workbook) };
        } catch {
          return null;
        }
      })
      .filter((candidate): candidate is { workbook: XLSX.WorkBook; score: number } => Boolean(candidate))
      .sort((left, right) => right.score - left.score);

    if (candidates.length > 0) {
      return candidates[0].workbook;
    }
  }

  return XLSX.read(buffer, { type: "array", codepage: 932 });
}

function normalize(value: unknown): string {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, "")
    .toLowerCase();
}

function containsGenericFoil(value: string | null | undefined): boolean {
  const normalized = String(value ?? "")
    .normalize("NFKC")
    .toLowerCase();

  return normalized.includes("foil") || normalized.includes("フォイル");
}

function isFoil(values: string[]): boolean {
  return values.some(containsGenericFoil);
}

function isLandCard(category: string): boolean {
  return LAND_KEYWORDS.some((keyword) => category.includes(keyword));
}

interface ParsedPriceCell {
  price: number | null;
  label?: string;
}

function normalizePriceLabel(value: string): string | undefined {
  const normalized = value.normalize("NFKC").trim().toUpperCase();
  if (normalized === "NF" || normalized === "RF" || normalized === "CF") {
    return normalized;
  }
  return undefined;
}

function inferPriceLabelFromHeader(value: unknown): string | undefined {
  return normalizePriceLabel(String(value ?? ""));
}

function parsePrice(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;

  const normalized =
    typeof value === "string" ? value.replace(/[,\s円¥]/g, "") : String(value);
  const parsed = Number(normalized);

  return Number.isNaN(parsed) ? null : parsed;
}

function parsePriceCell(
  value: unknown,
  fallbackLabel?: string
): ParsedPriceCell {
  const text = String(value ?? "").normalize("NFKC").trim();
  if (!text) return { price: null };

  const labeledPrice = text.match(/^(NF|RF|CF)\s*[:：]?\s*([0-9,]+)$/i);
  if (labeledPrice) {
    return {
      price: parsePrice(labeledPrice[2]),
      label: normalizePriceLabel(labeledPrice[1]),
    };
  }

  return {
    price: parsePrice(text),
    label: parsePrice(text) === null ? undefined : fallbackLabel,
  };
}

function isLikelyLanguage(value: unknown): boolean {
  return /^(jp|en|jp\/en|en\/jp|japanese|english|日本語|英語)$/i.test(
    String(value ?? "").trim()
  );
}

function hasFixedColumnRarity(values: unknown[]): boolean {
  if (values.length < 12) return false;
  return !isLikelyLanguage(values[4]) && isLikelyLanguage(values[5]);
}

function findAliasField(header: string): CardField | null {
  const normalizedHeader = normalize(header);

  for (const [field, aliases] of Object.entries(HEADER_ALIASES) as [
    CardField,
    string[],
  ][]) {
    if (aliases.some((alias) => normalize(alias) === normalizedHeader)) {
      return field;
    }
  }

  return null;
}

function isNumberCell(value: unknown): boolean {
  if (value === null || value === undefined || value === "") return false;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0;
}

function inferNoColumn(
  rows: unknown[][],
  headerRowIndex: number,
  columnMap: Partial<Record<CardField, number>>
): void {
  if (columnMap.no !== undefined) return;

  const headerRow = rows[headerRowIndex] ?? [];
  if (normalize(headerRow[0]) !== "") return;

  const dataRows = rows.slice(headerRowIndex + 1, headerRowIndex + 4);
  if (dataRows.some((row) => isNumberCell(row?.[0]))) {
    columnMap.no = 0;
  }
}

function findHeaderRow(rows: unknown[][]): {
  headerRowIndex: number;
  columnMap: Partial<Record<CardField, number>>;
} | null {
  for (let rowIndex = 0; rowIndex < Math.min(rows.length, 5); rowIndex++) {
    const row = rows[rowIndex] ?? [];
    const columnMap: Partial<Record<CardField, number>> = {};

    row.forEach((cell, columnIndex) => {
      const field = findAliasField(String(cell ?? ""));
      if (field && columnMap[field] === undefined) {
        columnMap[field] = columnIndex;
      }
    });

    inferNoColumn(rows, rowIndex, columnMap);

    if (
      columnMap.no !== undefined &&
      columnMap.nameJp !== undefined &&
      columnMap.set !== undefined &&
      columnMap.condition !== undefined &&
      columnMap.priceJp !== undefined &&
      columnMap.category !== undefined
    ) {
      return { headerRowIndex: rowIndex, columnMap };
    }
  }

  return null;
}

function valueAt(row: unknown[], columnIndex: number | undefined): unknown {
  if (columnIndex === undefined) return null;
  return row[columnIndex];
}

function buildCard(
  values: {
    no: number;
    nameJp: string;
    nameEn: string;
    set: string;
    rarity: string;
    lang: string;
    condition: string;
    priceJp: number | null;
    priceEn: number | null;
    priceJpLabel?: string;
    priceEnLabel?: string;
    category: string;
    notes: string | null;
    imageUrl: string;
  },
  sheetName: string,
  index: number
): Card {
  const foilBadge = resolveSpecialFoilBadge([
    values.priceEnLabel ?? "",
    values.priceJpLabel ?? "",
    values.nameJp,
    values.nameEn,
    values.category,
    values.notes ?? "",
  ]);

  return {
    id: `${sheetName}-${values.no}-${index}`,
    no: values.no,
    nameJp: values.nameJp,
    nameEn: values.nameEn,
    set: values.set,
    rarity: values.rarity,
    lang: values.lang,
    condition: values.condition,
    priceJp: values.priceJp,
    priceEn: values.priceEn,
    priceJpLabel: values.priceJpLabel,
    priceEnLabel: values.priceEnLabel,
    category: values.category,
    notes: values.notes,
    imageUrl: values.imageUrl,
    foil:
      isFoil([
        values.nameJp,
        values.nameEn,
        values.category,
        values.notes ?? "",
      ]) ||
      Boolean(
        foilBadge
      ),
    foilLabel: foilBadge?.label,
    isLand: isLandCard(values.category),
  };
}

function buildCardsFromHeaderRows(
  rows: unknown[][],
  sheetName: string
): Card[] | null {
  const headerInfo = findHeaderRow(rows);
  if (!headerInfo) return null;

  const cards: Card[] = [];
  const headerRow = rows[headerInfo.headerRowIndex] ?? [];
  const priceJpHeaderLabel = inferPriceLabelFromHeader(
    valueAt(headerRow, headerInfo.columnMap.priceJp)
  );
  const priceEnHeaderLabel = inferPriceLabelFromHeader(
    valueAt(headerRow, headerInfo.columnMap.priceEn)
  );

  for (const row of rows.slice(headerInfo.headerRowIndex + 1)) {
    const no = Number(valueAt(row, headerInfo.columnMap.no));
    if (Number.isNaN(no) || no === 0) continue;
    const priceJp = parsePriceCell(
      valueAt(row, headerInfo.columnMap.priceJp),
      priceJpHeaderLabel
    );
    const priceEn = parsePriceCell(
      valueAt(row, headerInfo.columnMap.priceEn),
      priceEnHeaderLabel
    );

    cards.push(
      buildCard(
        {
          no,
          nameJp: String(valueAt(row, headerInfo.columnMap.nameJp) ?? ""),
          nameEn: String(valueAt(row, headerInfo.columnMap.nameEn) ?? ""),
          set: String(valueAt(row, headerInfo.columnMap.set) ?? ""),
          rarity: String(valueAt(row, headerInfo.columnMap.rarity) ?? ""),
          lang: String(valueAt(row, headerInfo.columnMap.lang) ?? "EN"),
          condition: String(valueAt(row, headerInfo.columnMap.condition) ?? "NM"),
          priceJp: priceJp.price,
          priceEn: priceEn.price,
          priceJpLabel: priceJp.label,
          priceEnLabel: priceEn.label,
          category: String(valueAt(row, headerInfo.columnMap.category) ?? ""),
          notes: valueAt(row, headerInfo.columnMap.notes)
            ? String(valueAt(row, headerInfo.columnMap.notes))
            : null,
          imageUrl: String(valueAt(row, headerInfo.columnMap.imageUrl) ?? ""),
        },
        sheetName,
        cards.length
      )
    );
  }

  return cards;
}

function buildCardsFromFixedColumns(
  rows: unknown[][],
  sheetName: string
): Card[] {
  const cards: Card[] = [];

  for (const row of rows) {
    const values = row;
    if (values.length < 11) continue;

    const no = Number(values[0]);
    if (Number.isNaN(no) || no === 0) continue;
    const hasRarityColumn = hasFixedColumnRarity(values);
    const priceJp = parsePriceCell(values[hasRarityColumn ? 7 : 6]);
    const priceEn = parsePriceCell(values[hasRarityColumn ? 8 : 7]);

    cards.push(
      buildCard(
        {
          no,
          nameJp: String(values[1] ?? ""),
          nameEn: String(values[2] ?? ""),
          set: String(values[3] ?? ""),
          rarity: hasRarityColumn ? String(values[4] ?? "") : "",
          lang: String(values[hasRarityColumn ? 5 : 4] ?? "EN"),
          condition: String(values[hasRarityColumn ? 6 : 5] ?? "NM"),
          priceJp: priceJp.price,
          priceEn: priceEn.price,
          priceJpLabel: priceJp.label,
          priceEnLabel: priceEn.label,
          category: String(values[hasRarityColumn ? 9 : 8] ?? ""),
          notes: values[hasRarityColumn ? 10 : 9]
            ? String(values[hasRarityColumn ? 10 : 9])
            : null,
          imageUrl: String(values[hasRarityColumn ? 11 : 10] ?? ""),
        },
        sheetName,
        cards.length
      )
    );
  }

  return cards;
}

function getCardSortPrice(card: Card): number {
  return Math.max(card.priceJp ?? 0, card.priceEn ?? 0);
}

function buildPriceDescendingOrder(cards: Card[]): number[] {
  return cards
    .map((card, index) => ({ index, price: getCardSortPrice(card) }))
    .sort((left, right) => right.price - left.price || left.index - right.index)
    .map((item) => item.index);
}

function sortCardsByPriceDescending(cards: Card[]): Card[] {
  return buildPriceDescendingOrder(cards).map((index) => cards[index]);
}

export function parseExcel(buffer: ArrayBuffer, fileName?: string): ParseResult {
  const workbook = readWorkbook(buffer, fileName);
  const sheets: SheetConfig[] = [];
  const warnings: ParseWarning[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const matrixRows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: null,
      blankrows: true,
    }) as unknown[][];

    const cardsFromHeaderRows = buildCardsFromHeaderRows(matrixRows, sheetName);
    const cards =
      cardsFromHeaderRows ??
      buildCardsFromFixedColumns(matrixRows.slice(2), sheetName);

    if (cards.length > GRID_TOTAL) {
      warnings.push({
        sheetName,
        message: WARNING_TRUNCATED,
      });
    }

    const trimmedCards = sortCardsByPriceDescending(cards).slice(0, GRID_TOTAL);

    sheets.push({
      sheetName,
      title: DEFAULT_TITLE,
      titleSubtitle: DEFAULT_TITLE_SUBTITLE,
      showTitleSubtitle: true,
      cards: trimmedCards,
      sortedOrder: trimmedCards.map((_, index) => index),
      rowLabels: [],
      showCardNames: false,
      showExpansionName: true,
      showRarityBadge: false,
      showCondition: true,
      logoGgHeight: 96,
      logoMtgHeight: 64,
      ctaMain: DEFAULT_CTA_MAIN,
      ctaSub: DEFAULT_CTA_SUB,
      footerText: DEFAULT_FOOTER,
      updatedAtText: DEFAULT_UPDATED_AT_TEXT,
    });
  }

  return { sheets, warnings };
}
