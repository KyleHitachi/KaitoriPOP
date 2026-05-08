"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { SheetConfig } from "@/lib/types";

interface Props {
  config: SheetConfig;
  onChange: (updates: Partial<SheetConfig>) => void;
}

function Section({
  title,
  summary,
  children,
  defaultOpen = true,
}: {
  title: string;
  summary: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <details
      className="border-t border-stone-200 py-4 first:border-t-0 first:pt-0"
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
    >
      <summary className="cursor-pointer list-none">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-black text-stone-900">{title}</div>
            <p className="mt-1 text-xs leading-relaxed text-stone-500">{summary}</p>
          </div>
          <span className="rounded-full border border-stone-200 px-2 py-1 text-[10px] font-bold text-stone-500">
            開閉
          </span>
        </div>
      </summary>
      <div className="mt-4 space-y-4">{children}</div>
    </details>
  );
}

export default function SettingsPanel({ config, onChange }: Props) {
  const rowLabelsByRow = new Map(
    config.rowLabels.map((label) => [label.row, label] as const)
  );

  return (
    <div className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-[0_24px_80px_rgba(66,39,9,0.08)]">
      <div className="mb-5">
        <div className="text-[11px] font-semibold tracking-[0.22em] text-amber-700">
          表示設定
        </div>
        <h3 className="mt-2 text-xl font-black text-stone-900">シート設定</h3>
        <p className="mt-1 text-sm text-stone-500">
          現在のシートの見た目をカテゴリごとに調整できます。
        </p>
      </div>

      <Section title="基本情報" summary="タイトル、CTA、更新日の表示を調整します。">
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            タイトル
          </label>
          <input
            type="text"
            value={config.title}
            onChange={(event) => onChange({ title: event.target.value })}
            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm text-stone-800 shadow-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            CTA メイン
          </label>
          <input
            type="text"
            value={config.ctaMain}
            onChange={(event) => onChange({ ctaMain: event.target.value })}
            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm text-stone-800 shadow-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            CTA サブ
          </label>
          <input
            type="text"
            value={config.ctaSub}
            onChange={(event) => onChange({ ctaSub: event.target.value })}
            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm text-stone-800 shadow-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            更新日付
          </label>
          <input
            type="text"
            value={config.updatedAtText}
            onChange={(event) => onChange({ updatedAtText: event.target.value })}
            placeholder="例: 更新日 2026.03.24 / 3月24日更新"
            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm text-stone-800 shadow-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
          />
          <p className="mt-1 text-xs text-stone-500">
            画像全体の右下に共通表示されます。自由入力です。
          </p>
        </div>
      </Section>

      <Section title="カード表示" summary="カード名や補足テキストの見え方を調整します。">
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            フッターテキスト
          </label>
          <textarea
            value={config.footerText}
            onChange={(event) => onChange({ footerText: event.target.value })}
            rows={3}
            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm text-stone-800 shadow-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
          />
        </div>

        <label className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4">
          <input
            type="checkbox"
            checked={config.showCardNames}
            onChange={(event) =>
              onChange({ showCardNames: event.target.checked })
            }
            className="mt-1"
          />
          <span>
            <span className="block text-sm font-medium text-stone-700">
              カード名を表示する
            </span>
            <span className="mt-1 block text-xs text-stone-500">
              必要なときだけカード下部に英名と日本語名を表示します。
            </span>
          </span>
        </label>
      </Section>

      <Section title="ロゴ" summary="左上に表示する店舗ロゴやMTGロゴを差し替えます。" defaultOpen={false}>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-xs font-medium text-stone-600">
            GG ロゴ
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () =>
                  onChange({ logoGg: reader.result as string });
                reader.readAsDataURL(file);
              }}
              className="mt-2 block w-full text-xs file:mr-2 file:rounded-lg file:border-0 file:bg-stone-100 file:px-3 file:py-2 file:font-medium file:text-stone-700"
            />
          </label>
          <label className="block text-xs font-medium text-stone-600">
            MTG ロゴ
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () =>
                  onChange({ logoMtg: reader.result as string });
                reader.readAsDataURL(file);
              }}
              className="mt-2 block w-full text-xs file:mr-2 file:rounded-lg file:border-0 file:bg-stone-100 file:px-3 file:py-2 file:font-medium file:text-stone-700"
            />
          </label>
        </div>
      </Section>

      <Section title="行ラベル" summary="カテゴリ見出しを行ごとに追加できます。" defaultOpen={false}>
        <div className="space-y-2">
          {[0, 1, 2, 3].map((row) => {
            const label = rowLabelsByRow.get(row);

            return (
              <div key={row} className="flex items-center gap-2">
                <span className="w-12 text-xs font-medium text-stone-500">
                  {row + 1}行目
                </span>
                <input
                  type="text"
                  value={label?.text || ""}
                  onChange={(event) => {
                    const nextText = event.target.value;
                    const otherLabels = config.rowLabels.filter(
                      (item) => item.row !== row
                    );
                    if (!nextText) {
                      onChange({ rowLabels: otherLabels });
                      return;
                    }
                    onChange({
                      rowLabels: [
                        ...otherLabels,
                        { row, text: nextText, visible: label?.visible ?? true },
                      ],
                    });
                  }}
                  placeholder="ラベルを入力"
                  className="min-w-0 flex-1 rounded-lg border border-stone-300 px-2 py-2 text-sm text-stone-800 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                />
                <label className="flex items-center gap-1 text-xs text-stone-500">
                  <input
                    type="checkbox"
                    checked={label?.visible ?? false}
                    onChange={(event) => {
                      const otherLabels = config.rowLabels.filter(
                        (item) => item.row !== row
                      );
                      const nextLabel = {
                        row,
                        text: label?.text || `${row + 1}行目`,
                        visible: event.target.checked,
                      };
                      onChange({ rowLabels: [...otherLabels, nextLabel] });
                    }}
                  />
                  表示
                </label>
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}
