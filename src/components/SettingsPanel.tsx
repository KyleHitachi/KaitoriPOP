"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { RowLabel, SheetConfig } from "@/lib/types";

interface Props {
  config: SheetConfig;
  onChange: (updates: Partial<SheetConfig>) => void;
}

interface SheetPresetSettings {
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

interface SheetPreset {
  id: string;
  name: string;
  createdAt: string;
  settings: SheetPresetSettings;
}

const PRESET_STORAGE_KEY = "kaitori-pop-sheet-presets";
const LOGO_MAX_SOURCE_SIZE = 180_000;
const LOGO_MAX_DIMENSION = 900;

function extractPresetSettings(config: SheetConfig): SheetPresetSettings {
  return {
    title: config.title,
    titleSubtitle: config.titleSubtitle,
    showTitleSubtitle: config.showTitleSubtitle,
    ctaMain: config.ctaMain,
    ctaSub: config.ctaSub,
    footerText: config.footerText,
    updatedAtText: config.updatedAtText,
    showCardNames: config.showCardNames,
    showExpansionName: config.showExpansionName,
    showRarityBadge: config.showRarityBadge,
    showCondition: config.showCondition,
    logoGg: config.logoGg,
    logoMtg: config.logoMtg,
    logoGgHeight: config.logoGgHeight,
    logoMtgHeight: config.logoMtgHeight,
    rowLabels: config.rowLabels,
  };
}

function readPresets(): SheetPreset[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(PRESET_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePresets(presets: SheetPreset[]): void {
  window.localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

async function compactLogoDataUrl(dataUrl?: string): Promise<string | undefined> {
  if (!dataUrl || dataUrl.length <= LOGO_MAX_SOURCE_SIZE) return dataUrl;
  if (typeof document === "undefined") return dataUrl;

  try {
    const image = await loadImage(dataUrl);
    const scale = Math.min(
      1,
      LOGO_MAX_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight)
    );
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return dataUrl;

    context.clearRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    const webpBlob = await canvasToBlob(canvas, "image/webp", 0.86);
    const pngBlob = await canvasToBlob(canvas, "image/png");
    const candidates = [webpBlob, pngBlob].filter(
      (blob): blob is Blob => Boolean(blob)
    );
    if (candidates.length === 0) return dataUrl;

    const smallest = candidates.sort((left, right) => left.size - right.size)[0];
    const compacted = await blobToDataUrl(smallest);
    return compacted.length < dataUrl.length ? compacted : dataUrl;
  } catch {
    return dataUrl;
  }
}

async function compactPreset(preset: SheetPreset): Promise<SheetPreset> {
  return {
    ...preset,
    settings: {
      ...preset.settings,
      logoGg: await compactLogoDataUrl(preset.settings.logoGg),
      logoMtg: await compactLogoDataUrl(preset.settings.logoMtg),
    },
  };
}

async function readLogoFile(file: File): Promise<string> {
  return compactLogoDataUrl(await blobToDataUrl(file)).then((value) => value ?? "");
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
  const [presets, setPresets] = useState<SheetPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [presetName, setPresetName] = useState("");
  const [presetMessage, setPresetMessage] = useState<string | null>(null);
  const rowLabelsByRow = new Map(
    config.rowLabels.map((label) => [label.row, label] as const)
  );
  const logoGgHeight = config.logoGgHeight ?? 96;
  const logoMtgHeight = config.logoMtgHeight ?? 64;
  const clampNumber = (value: string, min: number, max: number) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return min;
    return Math.min(max, Math.max(min, parsed));
  };
  const updateLogoGgHeight = (value: string) =>
    onChange({ logoGgHeight: clampNumber(value, 48, 140) });
  const updateLogoMtgHeight = (value: string) =>
    onChange({ logoMtgHeight: clampNumber(value, 36, 120) });

  useEffect(() => {
    setPresets(readPresets());
  }, []);

  useEffect(() => {
    if (!presetName && config.title) {
      setPresetName(config.title);
    }
  }, [config.title, presetName]);

  const savePreset = async () => {
    const name = presetName.trim() || config.title || config.sheetName;
    const nextPreset = await compactPreset({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      createdAt: new Date().toISOString(),
      settings: extractPresetSettings(config),
    });
    const nextPresets = await Promise.all([
      nextPreset,
      ...presets.filter((preset) => preset.name !== name),
    ].slice(0, 12).map(compactPreset));

    try {
      writePresets(nextPresets);
      setPresets(nextPresets);
      setSelectedPresetId(nextPreset.id);
      setPresetMessage("プリセットを保存しました。");
    } catch {
      try {
        const fallbackPresets = nextPresets.slice(0, 6);
        writePresets(fallbackPresets);
        setPresets(fallbackPresets);
        setSelectedPresetId(nextPreset.id);
        setPresetMessage("プリセットを保存しました。古いプリセットは容量調整のため一部整理しました。");
      } catch {
        setPresetMessage("保存に失敗しました。ブラウザの保存容量を確認してください。");
      }
    }
  };

  const applyPreset = () => {
    const preset = presets.find((item) => item.id === selectedPresetId);
    if (!preset) {
      setPresetMessage("呼び出すプリセットを選択してください。");
      return;
    }

    onChange({
      ...preset.settings,
      rowLabels: preset.settings.rowLabels.map((label) => ({ ...label })),
    });
    setPresetName(preset.name);
    setPresetMessage("プリセットを反映しました。");
  };

  const deletePreset = () => {
    const nextPresets = presets.filter((item) => item.id !== selectedPresetId);
    writePresets(nextPresets);
    setPresets(nextPresets);
    setSelectedPresetId("");
    setPresetMessage("プリセットを削除しました。");
  };

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

      <Section
        title="プリセット"
        summary="タイトル、文言、ロゴ、表示設定を保存して別シートへ呼び出せます。"
      >
        <div className="settings-preset-card rounded-2xl border border-amber-200 bg-white p-4 shadow-sm">
          <label className="settings-preset-label mb-1 block text-sm font-bold text-stone-800">
            保存名
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={presetName}
              onChange={(event) => setPresetName(event.target.value)}
              placeholder="例: ロルカナ標準"
              className="min-w-0 flex-1 rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 shadow-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
            />
            <button
              type="button"
              onClick={savePreset}
              className="shrink-0 rounded-xl bg-stone-900 px-4 py-2 text-sm font-black text-white transition hover:bg-stone-800"
            >
              保存
            </button>
          </div>

          <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
            <select
              value={selectedPresetId}
              onChange={(event) => setSelectedPresetId(event.target.value)}
              className="min-w-0 rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 shadow-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
            >
              <option value="">プリセットを選択</option>
              {presets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={applyPreset}
              className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
            >
              呼び出し
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="settings-preset-help text-xs leading-relaxed text-stone-700">
              カード、価格、並び順は保存せず、買取表の見た目だけをコピーします。
            </p>
            <button
              type="button"
              onClick={deletePreset}
              disabled={!selectedPresetId}
              className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              削除
            </button>
          </div>

          {presetMessage && (
            <div className="settings-preset-message mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-900">
              {presetMessage}
            </div>
          )}
        </div>
      </Section>

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
          <div className="mb-1 flex items-center justify-between gap-3">
            <label className="block text-sm font-medium text-stone-700">
              サブタイトル
            </label>
            <label className="inline-flex items-center gap-2 text-xs font-bold text-stone-600">
              <input
                type="checkbox"
                checked={config.showTitleSubtitle ?? true}
                onChange={(event) =>
                  onChange({ showTitleSubtitle: event.target.checked })
                }
              />
              表示
            </label>
          </div>
          <input
            type="text"
            value={config.titleSubtitle ?? ""}
            onChange={(event) => onChange({ titleSubtitle: event.target.value })}
            placeholder="例: モダン・レガシー"
            disabled={!(config.showTitleSubtitle ?? true)}
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
        <label className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4">
          <input
            type="checkbox"
            checked={config.showExpansionName}
            onChange={(event) =>
              onChange({ showExpansionName: event.target.checked })
            }
            className="mt-1"
          />
          <span>
            <span className="block text-sm font-medium text-stone-700">
              エキスパンション名を表示
            </span>
            <span className="mt-1 block text-xs text-stone-500">
              カード左下のセット/エキスパンション表示を切り替えます。
            </span>
          </span>
        </label>
        <label className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4">
          <input
            type="checkbox"
            checked={config.showRarityBadge}
            onChange={(event) =>
              onChange({ showRarityBadge: event.target.checked })
            }
            className="mt-1"
          />
          <span>
            <span className="block text-sm font-medium text-stone-700">
              レアリティバッジを表示
            </span>
            <span className="mt-1 block text-xs text-stone-500">
              ロルカナ用のレアリティ列をFoil風バッジで表示します。MTGではオフにできます。
            </span>
          </span>
        </label>
        <label className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4">
          <input
            type="checkbox"
            checked={config.showCondition}
            onChange={(event) =>
              onChange({ showCondition: event.target.checked })
            }
            className="mt-1"
          />
          <span>
            <span className="block text-sm font-medium text-stone-700">
              状態表記を表示
            </span>
            <span className="mt-1 block text-xs text-stone-500">
              カード左上のNM/SPなどの状態チップを切り替えます。
            </span>
          </span>
        </label>
      </Section>

      <Section title="ロゴ" summary="左上に表示するロゴとタイトルロゴを差し替えます。" defaultOpen={false}>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-xs font-medium text-stone-600">
            ロゴ
            <input
              type="file"
              accept="image/*"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const logoGg = await readLogoFile(file);
                onChange({ logoGg });
              }}
              className="mt-2 block w-full text-xs file:mr-2 file:rounded-lg file:border-0 file:bg-stone-100 file:px-3 file:py-2 file:font-medium file:text-stone-700"
            />
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-[11px] text-stone-500">
                <span>表示高さ</span>
                <span>{logoGgHeight}px</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={48}
                  max={140}
                  step={2}
                  value={logoGgHeight}
                  onChange={(event) =>
                    updateLogoGgHeight(event.target.value)
                  }
                  onInput={(event) =>
                    updateLogoGgHeight(event.currentTarget.value)
                  }
                  className="min-w-0 flex-1 accent-amber-600"
                />
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={logoGgHeight}
                  onChange={(event) =>
                    updateLogoGgHeight(event.target.value)
                  }
                  className="w-16 rounded-lg border border-stone-300 px-2 py-1 text-xs text-stone-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                />
              </div>
            </div>
          </label>
          <label className="block text-xs font-medium text-stone-600">
            タイトルロゴ
            <input
              type="file"
              accept="image/*"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const logoMtg = await readLogoFile(file);
                onChange({ logoMtg });
              }}
              className="mt-2 block w-full text-xs file:mr-2 file:rounded-lg file:border-0 file:bg-stone-100 file:px-3 file:py-2 file:font-medium file:text-stone-700"
            />
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-[11px] text-stone-500">
                <span>表示高さ</span>
                <span>{logoMtgHeight}px</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={36}
                  max={120}
                  step={2}
                  value={logoMtgHeight}
                  onChange={(event) =>
                    updateLogoMtgHeight(event.target.value)
                  }
                  onInput={(event) =>
                    updateLogoMtgHeight(event.currentTarget.value)
                  }
                  className="min-w-0 flex-1 accent-amber-600"
                />
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={logoMtgHeight}
                  onChange={(event) =>
                    updateLogoMtgHeight(event.target.value)
                  }
                  className="w-16 rounded-lg border border-stone-300 px-2 py-1 text-xs text-stone-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                />
              </div>
            </div>
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
