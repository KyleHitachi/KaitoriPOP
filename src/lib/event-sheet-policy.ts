import { Card, GRID_TOTAL, RowLabel, SheetConfig } from "./types";
import type { ThemeId } from "./themes";
import { getSortedCards } from "./sort-engine";

export interface SheetAppearanceSettings {
  theme?: ThemeId;
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
  | { kind: "card"; card: Card; sortedIndex: number }
  | { kind: "mtg-card-back" }
  | { kind: "empty" };

// Event workbooks put condition-sensitive sheets first, so only the first two
// sheets show NM/SP chips by default.
export function shouldShowConditionForSheetIndex(sheetIndex: number): boolean {
  return sheetIndex < 2;
}

export function isDualLandSheetName(sheetName: string): boolean {
  const normalized = sheetName.normalize("NFKC").toLowerCase();
  return normalized.includes("dual land") || normalized.includes("デュアルランド");
}

// Dual-land boards rarely fill every slot, so the gaps show MTG card backs
// instead of holes.
export function buildGridSlots(config: SheetConfig, slotCount = GRID_TOTAL): GridSlot[] {
  const cards = getSortedCards(config);
  const useCardBacks = isDualLandSheetName(config.sheetName);

  return Array.from({ length: slotCount }, (_, index): GridSlot => {
    if (index < cards.length) {
      return { kind: "card", card: cards[index], sortedIndex: index };
    }
    return useCardBacks ? { kind: "mtg-card-back" } : { kind: "empty" };
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
