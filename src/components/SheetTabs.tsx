"use client";

import { SheetConfig } from "@/lib/types";

interface Props {
  sheets: SheetConfig[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

export default function SheetTabs({ sheets, activeIndex, onSelect }: Props) {
  // A single sheet needs no switcher; the row would only take space.
  if (sheets.length < 2) return null;

  return (
    <div className="overflow-x-auto">
      <div role="tablist" aria-label="シート" className="flex min-w-max gap-8">
        {sheets.map((sheet, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              key={`${sheet.sheetName}-${index}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelect(index)}
              className={`ui-link flex items-baseline gap-2 text-[15px] ${
                isActive ? "text-ink" : "text-ink-3 hover:text-ink"
              }`}
            >
              <span>{sheet.sheetName}</span>
              <span className="text-[11px] tabular-nums text-ink-3">{sheet.cards.length}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
