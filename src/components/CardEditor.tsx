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
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-[28px] border border-stone-200 bg-white shadow-[0_30px_100px_rgba(0,0,0,0.28)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="grid gap-0 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="border-b border-stone-200 bg-[linear-gradient(180deg,_#191611,_#2c2216)] p-6 text-white lg:border-b-0 lg:border-r">
            <div className="mb-4 inline-flex rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-[11px] font-semibold tracking-[0.22em] text-amber-200">
              カード編集
            </div>

            <h3 className="text-2xl font-black leading-tight">{card.nameJp}</h3>
            <p className="mt-2 text-sm text-stone-300">
              {card.nameEn || "英語名なし"}
            </p>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs font-semibold tracking-[0.2em] text-stone-400">
                現在の適用内容
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                  価格: {priceOverride ? "上書きあり" : "元データ"}
                </span>
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                  セット表記: {setLabelOverride ? "上書きあり" : "自動"}
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
              {metaItems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/10 bg-white/5 p-3"
                >
                  <div className="text-[10px] font-semibold tracking-[0.18em] text-stone-400">
                    {item.label}
                  </div>
                  <div className="mt-1 font-semibold text-stone-100">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6">
            <div className="mb-5">
              <div className="text-[11px] font-semibold tracking-[0.2em] text-amber-700">
                上書き設定
              </div>
              <h4 className="mt-2 text-xl font-black text-stone-900">
                このカードを微調整
              </h4>
              <p className="mt-1 text-sm text-stone-500">
                空欄なら元データのまま使います。Foil と Land の判定も必要ならここで上書きできます。
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  価格の上書き
                </label>
                <input
                  type="text"
                  value={priceOverride}
                  onChange={(event) => setPriceOverride(event.target.value)}
                  placeholder="例: 18,000円"
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm text-stone-800 shadow-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                />
                <p className="mt-1 text-xs text-stone-500">
                  元価格: JP {formatPrice(card.priceJp)} / EN {formatPrice(card.priceEn)}
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  セット表記の上書き
                </label>
                <input
                  type="text"
                  value={setLabelOverride}
                  onChange={(event) => setSetLabelOverride(event.target.value)}
                  placeholder="例: IT / LEG"
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm text-stone-800 shadow-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  レアリティ表示の上書き
                </label>
                <input
                  type="text"
                  value={rarityOverride}
                  onChange={(event) => setRarityOverride(event.target.value)}
                  placeholder="例: エンチャンテッド / Legendary"
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm text-stone-800 shadow-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <div className="mb-2 text-sm font-semibold text-stone-800">
                    Foil 判定
                  </div>
                  <div className="text-xs text-stone-500">
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
                    className="mt-3 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
                  >
                    {foilOverride === undefined
                      ? "元データを使用中"
                      : foilOverride
                        ? "強制オン"
                        : "強制オフ"}
                  </button>
                </div>

                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <div className="mb-2 text-sm font-semibold text-stone-800">
                    Land 判定
                  </div>
                  <div className="text-xs text-stone-500">
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
                    className="mt-3 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
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

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-stone-200 pt-5 sm:flex-row sm:justify-end">
              <button
                onClick={onClose}
                className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleSave}
                className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
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
