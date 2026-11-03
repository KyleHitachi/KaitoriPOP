"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/lib/types";

interface Props {
  card: Card;
  onSave: (updates: Partial<Card>) => void;
  onClose: () => void;
}

function formatPrice(price: number | null): string {
  if (price === null) return "-";
  return `${price.toLocaleString("ja-JP")}円`;
}

function buildOverrideState(value: boolean | undefined): string {
  if (value === undefined) return "元データを使用";
  return value ? "強制オン" : "強制オフ";
}

export default function CardEditor({ card, onSave, onClose }: Props) {
  const [priceOverride, setPriceOverride] = useState(card.priceOverride || "");
  const [setLabelOverride, setSetLabelOverride] = useState(
    card.setLabelOverride || ""
  );
  const [rarityOverride, setRarityOverride] = useState(
    card.rarityOverride || ""
  );
  const [foilOverride, setFoilOverride] = useState<boolean | undefined>(
    card.foilOverride
  );
  const [landOverride, setLandOverride] = useState<boolean | undefined>(
    card.landOverride
  );

  useEffect(() => {
    setPriceOverride(card.priceOverride || "");
    setSetLabelOverride(card.setLabelOverride || "");
    setRarityOverride(card.rarityOverride || "");
    setFoilOverride(card.foilOverride);
    setLandOverride(card.landOverride);
  }, [card]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const metaItems = useMemo(
    () => [
      { label: "セット", value: card.set || "-" },
      { label: "レアリティ", value: card.rarity || "-" },
      { label: "言語", value: card.lang || "-" },
      { label: "状態", value: card.condition || "-" },
      { label: "JP価格", value: formatPrice(card.priceJp) },
      { label: "EN価格", value: formatPrice(card.priceEn) },
    ],
    [card]
  );

  const handleSave = () => {
    onSave({
      priceOverride: priceOverride || undefined,
      setLabelOverride: setLabelOverride || undefined,
      rarityOverride: rarityOverride || undefined,
      foilOverride,
      landOverride,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-auto bg-paper text-ink shadow-[0_30px_80px_rgba(0,0,0,0.18)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="grid gap-0 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="border-b border-line bg-surface p-8 lg:border-b-0 lg:border-r">
            <div className="ui-eyebrow">Card</div>

            <h3 className="mt-4 text-2xl font-light leading-snug">{card.nameJp}</h3>
            <p className="mt-2 text-[13px] text-ink-2">
              {card.nameEn || "英語名なし"}
            </p>

            <div className="mt-8 border-t border-line pt-4">
              <div className="ui-eyebrow">
                現在の適用内容
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-line px-3 py-1 text-xs text-ink-2">
                  価格: {priceOverride ? "上書きあり" : "元データ"}
                </span>
                <span className="rounded-full border border-line px-3 py-1 text-xs text-ink-2">
                  セット表記: {setLabelOverride ? "上書きあり" : "自動"}
                </span>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-4 text-[13px]">
              {metaItems.map((item) => (
                <div key={item.label} className="border-t border-line pt-3">
                  <div className="text-[11px] text-ink-2">{item.label}</div>
                  <div className="mt-1 tabular-nums">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-8">
            <div className="mb-5">
              <div className="ui-eyebrow">Override</div>
              <h4 className="mt-3 text-xl font-light">このカードを微調整</h4>
              <p className="mt-2 text-xs leading-relaxed text-ink-2">
                空欄なら元データのまま使います。Foil と Land の判定も必要ならここで上書きできます。
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="ui-label">
                  価格の上書き
                </label>
                <input
                  type="text"
                  value={priceOverride}
                  onChange={(event) => setPriceOverride(event.target.value)}
                  placeholder="例: 18,000円"
                  className="ui-input"
                />
                <p className="mt-2 text-xs text-ink-2">
                  元価格: JP {formatPrice(card.priceJp)} / EN {formatPrice(card.priceEn)}
                </p>
              </div>

              <div>
                <label className="ui-label">
                  セット表記の上書き
                </label>
                <input
                  type="text"
                  value={setLabelOverride}
                  onChange={(event) => setSetLabelOverride(event.target.value)}
                  placeholder="例: IT / LEG"
                  className="ui-input"
                />
              </div>

              <div>
                <label className="ui-label">
                  レアリティ表示の上書き
                </label>
                <input
                  type="text"
                  value={rarityOverride}
                  onChange={(event) => setRarityOverride(event.target.value)}
                  placeholder="例: エンチャンテッド / Legendary"
                  className="ui-input"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="border-t border-line pt-4">
                  <div className="mb-2 text-[13px]">
                    Foil 判定
                  </div>
                  <div className="text-xs text-ink-2">
                    元データ: {card.foil ? "オン" : "オフ"} / 現在:{" "}
                    {buildOverrideState(foilOverride)}
                  </div>
                  <button
                    onClick={() => {
                      if (foilOverride === undefined) {
                        setFoilOverride(!card.foil);
                        return;
                      }
                      setFoilOverride(foilOverride ? false : undefined);
                    }}
                    type="button"
                    className="ui-btn ui-btn-sm mt-4 w-full"
                  >
                    {foilOverride === undefined
                      ? "元データを使用中"
                      : foilOverride
                        ? "強制オン"
                        : "強制オフ"}
                  </button>
                </div>

                <div className="border-t border-line pt-4">
                  <div className="mb-2 text-[13px]">
                    Land 判定
                  </div>
                  <div className="text-xs text-ink-2">
                    元データ: {card.isLand ? "オン" : "オフ"} / 現在:{" "}
                    {buildOverrideState(landOverride)}
                  </div>
                  <button
                    onClick={() => {
                      if (landOverride === undefined) {
                        setLandOverride(!card.isLand);
                        return;
                      }
                      setLandOverride(landOverride ? false : undefined);
                    }}
                    type="button"
                    className="ui-btn ui-btn-sm mt-4 w-full"
                  >
                    {landOverride === undefined
                      ? "元データを使用中"
                      : landOverride
                        ? "強制オン"
                        : "強制オフ"}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-10 flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="ui-btn"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="ui-btn ui-btn-primary"
              >
                保存する
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
