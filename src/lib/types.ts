export interface Card {
  id: string;
  no: number;
  nameJp: string;
  nameEn: string;
  set: string;
  lang: string;
  condition: string;
  priceJp: number | null;
  priceEn: number | null;
  category: string;
  notes: string | null;
  imageUrl: string;
  foil: boolean;
  isLand: boolean;
  priceOverride?: string;
  setLabelOverride?: string;
  foilOverride?: boolean;
  landOverride?: boolean;
  imageData?: string;
}

export interface RowLabel {
  row: number;
  text: string;
  visible: boolean;
}

export interface SheetConfig {
  sheetName: string;
  title: string;
  cards: Card[];
  sortedOrder: number[];
  rowLabels: RowLabel[];
  showCardNames: boolean;
  logoGg?: string;
  logoMtg?: string;
  ctaMain: string;
  ctaSub: string;
  footerText: string;
  updatedAtText: string;
}

export const DEFAULT_TITLE = "MTG 買取表";
export const DEFAULT_CTA_MAIN = "高価買取中";
export const DEFAULT_CTA_SUB = "店頭でそのまま査定できます";
export const DEFAULT_FOOTER =
  "* 掲載価格は参考価格です。在庫状況やカード状態により変動します。";
export const DEFAULT_UPDATED_AT_TEXT = "";

export const GRID_COLS = 9;
export const GRID_ROWS = 4;
export const GRID_TOTAL = GRID_COLS * GRID_ROWS;

export const SUPPORTED_FILE_EXTENSIONS = [".xlsx", ".csv"] as const;

export const LAND_KEYWORDS = [
  "Land",
  "LAND",
  "land",
  "土地",
  "デュアルランド",
  "フェッチランド",
  "Dual Land",
  "Fetch Land",
];

export const HIGH_END_SHEET_NAMES = [
  "High End",
  "High-End",
  "ハイエンド",
  "ハイエンド買取",
];

export const HIGH_END_CATEGORY_NAMES = [
  "High End",
  "High-End",
  "ハイエンド",
];

export const DUAL_LAND_CATEGORY_NAMES = [
  "Dual Land",
  "Dual Lands",
  "デュアルランド",
];

export const EDH_FEATURED_CATEGORY_NAMES = [
  "EDH Foil",
  "Commander Foil",
  "EDHホイル",
  "統率者foil",
];

export const CATEGORY_ORDER: Record<string, string[]> = {
  "High End": ["P9", "High End", "Dual Land"],
  "High-End": ["P9", "High End", "Dual Land"],
  "ハイエンド": ["P9", "ハイエンド", "デュアルランド"],
  "ハイエンド買取": ["P9", "ハイエンド", "デュアルランド"],
  EDH: ["EDH Foil", "EDH"],
  "モダン・レガシー": ["モダン", "レガシー", "フェッチランド"],
  Standard: ["Standard"],
  スタンダード: ["スタンダード"],
};

