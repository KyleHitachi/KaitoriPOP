"use client";

import { SheetConfig } from "@/lib/types";

interface Props {
  sheets: SheetConfig[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

export default function SheetTabs({ sheets, activeIndex, onSelect }: Props) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white p-2 shadow-sm">
      <div className="flex min-w-max gap-2">
        {sheets.map((sheet, index) => (
          <button
            key={sheet.sheetName}
            onClick={() => onSelect(index)}
            className={`rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
              index === activeIndex
                ? "bg-stone-900 text-white shadow-sm"
                : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
            }`}
          >
            <div>{sheet.sheetName}</div>
            <div
              className={`mt-1 text-xs ${
                index === activeIndex ? "text-stone-300" : "text-stone-400"
              }`}
            >
              {sheet.cards.length} cards
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
