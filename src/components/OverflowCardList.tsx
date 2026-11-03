"use client";

import { Card } from "@/lib/types";
import { getCardPrice } from "@/lib/overflow";

interface Props {
  cards: Card[];
  onSwapIn: (overflowIndex: number) => void;
}

function formatCardPrice(card: Card): string {
  if (card.priceOverride) return card.priceOverride;
  const price = getCardPrice(card);
  return price > 0 ? `${price.toLocaleString("ja-JP")}円` : "-";
}

export default function OverflowCardList({ cards, onSwapIn }: Props) {
  if (cards.length === 0) return null;

  return (
    <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="text-sm font-black text-stone-900">
          掲載外のカード（{cards.length}枚）
        </div>
        <div className="text-xs text-stone-500">
          「掲載する」を押すと、買取表でいちばん安いカードと入れ替わります。
        </div>
      </div>
      <div className="mt-3 max-h-[320px] overflow-y-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-stone-500">
            <tr>
              <th className="py-1.5 pr-3 font-semibold">カード名</th>
              <th className="py-1.5 pr-3 font-semibold">セット</th>
              <th className="py-1.5 pr-3 font-semibold">カテゴリ</th>
              <th className="py-1.5 pr-3 text-right font-semibold">価格</th>
              <th className="py-1.5" />
            </tr>
          </thead>
          <tbody>
            {cards.map((card, index) => (
              <tr key={card.id} className="border-t border-stone-200 text-stone-700">
                <td className="py-1.5 pr-3">
                  <div className="font-semibold text-stone-900">{card.nameJp || card.nameEn}</div>
                  {card.nameJp && card.nameEn && card.nameEn !== card.nameJp && (
                    <div className="text-stone-500">{card.nameEn}</div>
                  )}
                </td>
                <td className="py-1.5 pr-3">{card.set}</td>
                <td className="py-1.5 pr-3">{card.category}</td>
                <td className="py-1.5 pr-3 text-right font-semibold tabular-nums">
                  {formatCardPrice(card)}
                </td>
                <td className="py-1.5 text-right">
                  <button
                    type="button"
                    onClick={() => onSwapIn(index)}
                    className="whitespace-nowrap rounded-lg border border-stone-300 px-3 py-1 font-bold text-stone-700 transition hover:bg-stone-50"
                  >
                    掲載する
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
