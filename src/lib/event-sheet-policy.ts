import { Card, GRID_TOTAL, RowLabel, SheetConfig } from "./types";
import { getSortedCards } from "./sort-engine";

export interface SheetAppearanceSettings {
  title: string;
  titleSubtitle?: string;
  showTitleSubtitle?: boolean;
  ctaMain: string;
  ctaSub: string;
  footerText: string;
  updatedAtText: string;
  showCardNames: boolean;
  showExpansionName: boolean;
  showRarityBadge: boolean;
  showCondition: boolean;
  logoGg?: string;
  logoMtg?: string;
  logoGgHeight?: number;
  logoMtgHeight?: number;
  rowLabels: RowLabel[];
}

export type GridSlot =
  | { kind: "card"; card: Card; originalIndex: number }
  | { kind: "mtg-card-back" }
  | { kind: "empty" };

export function shouldShowConditionForSheetIndex(sheetIndex: number): boolean {
  return sheetIndex < 2;
}

export function isDualLandSheetName(sheetName: string): boolean {
  const normalized = sheetName.normalize("NFKC").toLowerCase();
  return normalized.includes("dual land") || normalized.includes("デュアルランド");
}

export function buildGridSlots(config: SheetConfig): GridSlot[] {
  const cards = getSortedCards(config);
  const useBrandBacks = isDualLandSheetName(config.sheetName);

  return Array.from({ length: GRID_TOTAL }, (_, index): GridSlot => {
    if (index < cards.length) {
      return {
        kind: "card",
        card: cards[index],
        originalIndex: config.sortedOrder[index],
      };
    }

    return useBrandBacks ? { kind: "mtg-card-back" } : { kind: "empty" };
  });
}

export function applyAppearanceToAllSheets(
  sheets: SheetConfig[],
  settings: SheetAppearanceSettings
): SheetConfig[] {
  return sheets.map((sheet, sheetIndex) => ({
    ...sheet,
    ...settings,
    rowLabels: settings.rowLabels.map((label) => ({ ...label })),
    showCondition: shouldShowConditionForSheetIndex(sheetIndex),
  }));
}
