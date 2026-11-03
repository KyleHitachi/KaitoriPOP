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
      <div role="tablist" aria-label="シート" className="flex min-w-max gap-1.5">
        {sheets.map((sheet, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              key={`${sheet.sheetName}-${index}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelect(index)}
              className={`flex items-baseline gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                isActive
                  ? "border-stone-900 bg-stone-900 text-white shadow-sm"
                  : "border-stone-300 bg-white text-stone-600 hover:border-stone-400 hover:text-stone-900"
              }`}
            >
              <span>{sheet.sheetName}</span>
              <span className={`text-xs ${isActive ? "text-stone-300" : "text-stone-400"}`}>
                {sheet.cards.length}枚
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
