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
    <section className="mt-12">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-3">
          <span className="text-lg font-light">掲載外のカード</span>
          <span className="text-xs tabular-nums text-ink-3">{cards.length}</span>
        </div>
        <div className="text-xs text-ink-2">
          「掲載する」を押すと、買取表でいちばん安いカードと入れ替わります。
        </div>
      </div>
      <div className="mt-4 max-h-[360px] overflow-y-auto border-t border-ink">
        <table className="w-full text-left text-[13px]">
          <thead className="text-[11px] text-ink-2">
            <tr>
              <th className="py-2.5 pr-3 font-normal">カード名</th>
              <th className="py-2.5 pr-3 font-normal">セット</th>
              <th className="py-2.5 pr-3 font-normal">カテゴリ</th>
              <th className="py-2.5 pr-3 text-right font-normal">価格</th>
              <th className="py-2.5" />
            </tr>
          </thead>
          <tbody>
            {cards.map((card, index) => (
              <tr key={card.id} className="border-t border-line text-ink-2">
                <td className="py-2.5 pr-3">
                  <div className="text-ink">{card.nameJp || card.nameEn}</div>
                  {card.nameJp && card.nameEn && card.nameEn !== card.nameJp && (
                    <div className="text-xs text-ink-3">{card.nameEn}</div>
                  )}
                </td>
                <td className="py-2.5 pr-3">{card.set}</td>
                <td className="py-2.5 pr-3">{card.category}</td>
                <td className="py-2.5 pr-3 text-right tabular-nums text-ink">
                  {formatCardPrice(card)}
                </td>
                <td className="py-2.5 text-right">
                  <button
                    type="button"
                    onClick={() => onSwapIn(index)}
                    className="ui-btn ui-btn-sm"
                  >
                    掲載する
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
