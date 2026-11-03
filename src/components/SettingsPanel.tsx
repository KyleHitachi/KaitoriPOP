"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { SheetConfig } from "@/lib/types";
import type { SheetAppearanceSettings } from "@/lib/event-sheet-policy";
import { THEMES, THEME_ORDER, ThemeId, resolveTheme } from "@/lib/themes";

interface Props {
  config: SheetConfig;
  onChange: (updates: Partial<SheetConfig>) => void;
  onApplyToAll: (settings: SheetAppearanceSettings) => void;
}

interface SheetPreset {
  id: string;
  name: string;
  createdAt: string;
  settings: SheetAppearanceSettings;
}

const PRESET_STORAGE_KEY = "kaitori-pop-sheet-presets";

// Switching games swaps texts that still hold the previous game's default,
// and leaves anything the user typed alone.
function buildThemeChange(config: SheetConfig, nextId: ThemeId): Partial<SheetConfig> {
  const current = resolveTheme(config.theme);
  const next = THEMES[nextId];
  const updates: Partial<SheetConfig> = { theme: nextId };
  if (config.title === current.defaultTitle) updates.title = next.defaultTitle;
  if ((config.titleSubtitle ?? "") === current.defaultSubtitle) {
    updates.titleSubtitle = next.defaultSubtitle;
  }
  if (current.game !== next.game) updates.showRarityBadge = next.game === "lorcana";
  return updates;
}

function buildTodayUpdatedAtText(): string {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `更新日 ${today.getFullYear()}.${month}.${day}`;
}
const LOGO_MAX_SOURCE_SIZE = 180_000;
const LOGO_MAX_DIMENSION = 900;

function extractPresetSettings(config: SheetConfig): SheetAppearanceSettings {
  return {
    theme: config.theme,
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
      className="group/section border-t border-line py-6"
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
    >
      <summary className="flex cursor-pointer list-none items-baseline justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-[15px]">{title}</span>
          <span className="text-xs text-ink-3">{summary}</span>
        </span>
        <span aria-hidden="true" className="text-lg font-light leading-none text-ink-2">
          {isOpen ? "−" : "+"}
        </span>
      </summary>
      <div className="mt-6 space-y-6">{children}</div>
    </details>
  );
}

export default function SettingsPanel({ config, onChange, onApplyToAll }: Props) {
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

  const applyPresetToAll = () => {
    const preset = presets.find((item) => item.id === selectedPresetId);
    if (!preset) {
      setPresetMessage("全シートへ反映するプリセットを選択してください。");
      return;
    }

    onApplyToAll({
      ...preset.settings,
      rowLabels: preset.settings.rowLabels.map((label) => ({ ...label })),
    });
    setPresetName(preset.name);
    setPresetMessage("プリセットを全シートへ反映しました。状態表記は先頭2シートだけ表示します。");
  };

  const deletePreset = () => {
    const nextPresets = presets.filter((item) => item.id !== selectedPresetId);
    writePresets(nextPresets);
    setPresets(nextPresets);
    setSelectedPresetId("");
    setPresetMessage("プリセットを削除しました。");
  };

  return (
    <div className="border-t border-ink xl:border-t-0 xl:border-l xl:border-line xl:pl-8">
      <div className="pb-8 pt-6 xl:pt-1">
        <div className="ui-eyebrow">Settings</div>
        <h3 className="mt-3 text-2xl font-light tracking-[-0.01em]">シート設定</h3>
        <p className="mt-2 text-xs leading-relaxed text-ink-2">
          現在のシートの見た目を調整します。
        </p>
      </div>

      <Section title="基本情報" summary="タイトル、CTA、更新日の表示">
        <div>
          <span className="ui-label">TCG・デザイン</span>
          <div className="mt-3 flex flex-wrap gap-2">
            {THEME_ORDER.map((themeId) => {
              const theme = THEMES[themeId];
              const isActive = resolveTheme(config.theme).id === themeId;
              return (
                <button
                  key={themeId}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => onChange(buildThemeChange(config, themeId))}
                  className={`ui-btn ui-btn-sm ${isActive ? "ui-btn-primary" : ""}`}
                >
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      background: `linear-gradient(135deg, ${theme.vars["--panel-bg"] ?? "#f1eadc"} 50%, ${theme.vars["--accent"] ?? "#b82020"} 50%)`,
                      boxShadow: "0 0 0 1px rgba(128, 128, 128, 0.35)",
                    }}
                  />
                  {theme.label}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-ink-2">
            各ゲームの公式サイトの配色・書体に合わせます。タイトルとサブタイトルは、初期値のままなら一緒に切り替わります。
          </p>
        </div>

        <label className="block">
          <span className="ui-label">タイトル</span>
          <input
            type="text"
            value={config.title}
            onChange={(event) => onChange({ title: event.target.value })}
            className="ui-input"
          />
        </label>

        <div>
          <div className="flex items-center justify-between gap-3">
            <span className="ui-label">サブタイトル</span>
            <label className="inline-flex items-center gap-2 text-xs text-ink-2">
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
            aria-label="サブタイトル"
            value={config.titleSubtitle ?? ""}
            onChange={(event) => onChange({ titleSubtitle: event.target.value })}
            placeholder="例: モダン・レガシー"
            disabled={!(config.showTitleSubtitle ?? true)}
            className="ui-input"
          />
        </div>

        <label className="block">
          <span className="ui-label">CTA メイン</span>
          <input
            type="text"
            value={config.ctaMain}
            onChange={(event) => onChange({ ctaMain: event.target.value })}
            className="ui-input"
          />
        </label>

        <label className="block">
          <span className="ui-label">CTA サブ</span>
          <input
            type="text"
            value={config.ctaSub}
            onChange={(event) => onChange({ ctaSub: event.target.value })}
            className="ui-input"
          />
        </label>

        <div>
          <span className="ui-label">更新日付</span>
          <div className="flex items-end gap-3">
            <input
              type="text"
              aria-label="更新日付"
              value={config.updatedAtText}
              onChange={(event) => onChange({ updatedAtText: event.target.value })}
              placeholder="例: 更新日 2026.03.24"
              className="ui-input flex-1"
            />
            <button
              type="button"
              onClick={() => onChange({ updatedAtText: buildTodayUpdatedAtText() })}
              className="ui-btn ui-btn-sm mb-1"
            >
              今日の日付
            </button>
          </div>
          <p className="mt-2 text-xs text-ink-2">画像全体の右下に共通表示されます。自由入力です。</p>
        </div>
      </Section>

      <Section title="カード表示" summary="カード名や補足テキストの見え方">
        <label className="block">
          <span className="ui-label">フッターテキスト</span>
          <textarea
            value={config.footerText}
            onChange={(event) => onChange({ footerText: event.target.value })}
            rows={3}
            className="ui-input"
          />
        </label>

        <div className="border-t border-line">
          {[
            {
              key: "showCardNames" as const,
              label: "カード名を表示",
              note: "必要なときだけカード下部に英名と日本語名を表示します。",
            },
            {
              key: "showExpansionName" as const,
              label: "エキスパンション名を表示",
              note: "カード左下のセット/エキスパンション表示を切り替えます。",
            },
            {
              key: "showRarityBadge" as const,
              label: "レアリティバッジを表示",
              note: "ロルカナ用のレアリティ列をFoil風バッジで表示します。",
            },
            {
              key: "showCondition" as const,
              label: "状態表記を表示",
              note: "カード左上のNM/SPなどの状態チップを切り替えます。",
            },
          ].map((option) => (
            <label
              key={option.key}
              className="flex cursor-pointer items-start gap-3 border-b border-line py-3.5"
            >
              <input
                type="checkbox"
                checked={config[option.key]}
                onChange={(event) =>
                  onChange({ [option.key]: event.target.checked } as Partial<SheetConfig>)
                }
                className="mt-1"
              />
              <span>
                <span className="block text-[13px]">{option.label}</span>
                <span className="mt-1 block text-xs leading-relaxed text-ink-2">
                  {option.note}
                </span>
              </span>
            </label>
          ))}
        </div>
      </Section>

      <Section title="ロゴ" summary="左上のロゴとゲームのロゴを差し替え" defaultOpen={false}>
        {[
          {
            label: "ロゴ",
            height: logoGgHeight,
            min: 48,
            max: 140,
            update: updateLogoGgHeight,
            onFile: (logoGg: string) => onChange({ logoGg }),
          },
          {
            label: "ゲームロゴ",
            height: logoMtgHeight,
            min: 36,
            max: 120,
            update: updateLogoMtgHeight,
            onFile: (logoMtg: string) => onChange({ logoMtg }),
          },
        ].map((logo) => (
          <div key={logo.label}>
            <span className="ui-label">{logo.label}</span>
            <input
              type="file"
              accept="image/*"
              aria-label={`${logo.label}の画像`}
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                logo.onFile(await readLogoFile(file));
              }}
              className="mt-2 block w-full text-xs text-ink-2"
            />
            <div className="mt-3 flex items-center gap-3">
              <span className="w-14 shrink-0 text-xs text-ink-2">表示高さ</span>
              <input
                type="range"
                min={logo.min}
                max={logo.max}
                step={2}
                value={logo.height}
                aria-label={`${logo.label}の表示高さ`}
                onChange={(event) => logo.update(event.target.value)}
                onInput={(event) => logo.update(event.currentTarget.value)}
                className="min-w-0 flex-1"
              />
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={logo.height}
                aria-label={`${logo.label}の表示高さ（px）`}
                onChange={(event) => logo.update(event.target.value)}
                className="ui-input w-12 py-1 text-right text-xs tabular-nums"
              />
              <span className="text-xs text-ink-3">px</span>
            </div>
          </div>
        ))}
      </Section>

      <Section title="行ラベル" summary="行ごとのカテゴリ見出し" defaultOpen={false}>
        <div className="space-y-1">
          {[0, 1, 2, 3].map((row) => {
            const label = rowLabelsByRow.get(row);

            return (
              <div key={row} className="flex items-center gap-3">
                <span className="w-10 shrink-0 text-xs tabular-nums text-ink-3">
                  {String(row + 1).padStart(2, "0")}
                </span>
                <input
                  type="text"
                  aria-label={`${row + 1}行目のラベル`}
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
                  className="ui-input flex-1"
                />
                <label className="flex items-center gap-1.5 text-xs text-ink-2">
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

      <Section
        title="プリセット"
        summary="見た目の設定を保存して別シートへ"
        defaultOpen={false}
      >
        <div>
          <span className="ui-label">保存名</span>
          <div className="flex items-end gap-3">
            <input
              type="text"
              aria-label="プリセットの保存名"
              value={presetName}
              onChange={(event) => setPresetName(event.target.value)}
              placeholder="例: ロルカナ標準"
              className="ui-input flex-1"
            />
            <button type="button" onClick={savePreset} className="ui-btn ui-btn-sm ui-btn-primary mb-1">
              保存
            </button>
          </div>
        </div>

        <div>
          <span className="ui-label">保存済み</span>
          <select
            aria-label="プリセットを選択"
            value={selectedPresetId}
            onChange={(event) => setSelectedPresetId(event.target.value)}
            className="ui-select mt-2 w-full"
          >
            <option value="">プリセットを選択</option>
            {presets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={applyPreset}
              disabled={!selectedPresetId}
              className="ui-btn ui-btn-sm"
            >
              このシートに反映
            </button>
            <button
              type="button"
              onClick={applyPresetToAll}
              disabled={!selectedPresetId}
              className="ui-btn ui-btn-sm"
            >
              全シートへ反映
            </button>
            <button
              type="button"
              onClick={deletePreset}
              disabled={!selectedPresetId}
              className="ui-link ml-auto text-xs text-danger"
            >
              削除
            </button>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-ink-2">
            カード、価格、並び順は保存せず、買取表の見た目だけをコピーします。
          </p>
        </div>

        {presetMessage && (
          <p role="status" className="flex items-center gap-2 text-xs">
            <span className="ui-dot text-ok" />
            {presetMessage}
          </p>
        )}
      </Section>
    </div>
  );
}
