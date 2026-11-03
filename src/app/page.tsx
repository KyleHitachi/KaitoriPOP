"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SheetConfig, Card, GRID_TOTAL, ImageStatus, SortMode } from "@/lib/types";
import {
  PREVIEW_CANVAS_HEIGHT,
} from "@/lib/layout-tokens";
import ExcelUploader from "@/components/ExcelUploader";
import SheetTabs from "@/components/SheetTabs";
import BuylistPreview from "@/components/BuylistPreview";
import CardEditor from "@/components/CardEditor";
import SettingsPanel from "@/components/SettingsPanel";
import { applySortMode } from "@/lib/sort-engine";
import {
  SheetAppearanceSettings,
  applyAppearanceToAllSheets,
} from "@/lib/event-sheet-policy";
import OverflowCardList from "@/components/OverflowCardList";
import { swapInOverflowCard } from "@/lib/overflow";
import { EditHistory } from "@/lib/edit-history";
import {
  OUTPUT_SIZES,
  OUTPUT_SIZE_ORDER,
  OutputSizeId,
  resolveOutputSize,
} from "@/lib/output-sizes";
import {
  SavedWork,
  buildSavedWork,
  buildWorkFileName,
  clearCurrentWork,
  loadCurrentWork,
  parseWorkFileText,
  saveCurrentWork,
} from "@/lib/work-storage";
import { ZipEntry, buildUniqueFileNames, createZip } from "@/lib/zip";

type NoticeTone = "info" | "success" | "error";
type PreviewZoom = "fit" | 0.5 | 0.75 | 1;

interface Notice {
  tone: NoticeTone;
  message: string;
}

const SORT_MODE_OPTIONS: {
  value: Exclude<SortMode, "custom">;
  label: string;
  title: string;
}[] = [
  { value: "auto", label: "自動", title: "カテゴリ・カード名ごとに価格順でまとめます" },
  { value: "price-desc", label: "価格順", title: "価格が高い順に並べます" },
  { value: "excel", label: "Excel順", title: "取り込んだ表の行の順に並べます" },
];

const SORT_MODE_NOTICES: Record<Exclude<SortMode, "custom">, string> = {
  auto: "自動の並び順（カテゴリ別）に切り替えました。",
  "price-desc": "価格が高い順に切り替えました。",
  excel: "Excelの並び順に切り替えました。",
};

const COPY = {
  initialNotice:
    "Excel / CSV をアップロードすると買取表の作成を始められます。",
  parseProgress:
    "を読み込んでシートを準備しています...",
  parseSuccess:
    "件のシートを読み込みました。プレビューを確認して、必要なら並び替えてから書き出してください。",
  parseWarningPrefix: "注意: ",
  parseFallbackError:
    "ファイルの読み込みに失敗しました。",
  imageProgress:
    "のカード画像を取得しています...",
  imageSuccess:
    "画像の確認が完了しました。すべてのカード画像を書き出しに使えます。",
  imageError:
    "画像の取得に失敗しました。レイアウト編集は続けられますが、書き出し画像に一部反映されない可能性があります。",
  pngProgress:
    "の PNG を生成しています...",
  pngFallbackError:
    "PNG の生成に失敗しました。",
  pngSuccessSuffix:
    " を書き出しました。",
  cardUpdated:
    "カード設定を更新しました。",
  reorderUpdated:
    "カードの並び順を更新しました。",
  appTitle: "TCG 買取表ジェネレーター",
  appSubtitle:
    "Excel / CSV を読み込んで、レイアウトを調整し、そのまま PNG に書き出せます。",
  guide: "使い方",
  guideTitle: "3ステップで作成",
  guideStep1: "1. Excel / CSV をアップロード",
  guideStep1Body:
    "シートごとに内容を読み取り、買取表タブを自動で作成します。",
  guideStep2: "2. プレビューを調整",
  guideStep2Body:
    "ドラッグで並び替え、必要なカードだけ価格やセット表記を上書きできます。",
  guideStep3: "3. PNG を書き出し",
  guideStep3Body:
    "カード画像は書き出し時に自動で取得され、そのまま完成版の PNG になります。",
  tipsLabel: "おすすめ:",
  tipsBody:
    "シート名は短め、1シート最大36枚、価格確認後に書き出すと安定します。",
  sampleCsv: "サンプルCSVをダウンロード",
  openSettings: "設定を開く",
  closeSettings: "設定を閉じる",
  fetching: "取得中...",
  exportPng: "PNGを書き出し",
  generating: "生成中...",
  helper:
    "ドラッグで並び替え、カードをクリックして個別設定。キーボードでは Tab でカードを選び、Enter で編集、Alt+矢印で移動、Ctrl+Z で元に戻せます。",
  sampleError: "サンプルCSVの読み込みに失敗しました。",
  checksTitle: "出力前チェック",
  zoomFit: "全体",
  zoom50: "50%",
  zoom75: "75%",
  zoom100: "100%",
  darkMode: "ダーク",
  lightMode: "ライト",
};

// Asks the server to fetch (and cache) card images and records only each
// card's status; the image bytes never travel to the browser.
async function ensureSheetImages(
  config: SheetConfig,
  retryFailed = false
): Promise<SheetConfig> {
  const targets = config.cards
    .map((card, index) => ({ card, index }))
    .filter(
      ({ card }) =>
        !card.imageData &&
        (card.imageStatus === undefined || (retryFailed && card.imageStatus === "failed"))
    );
  if (targets.length === 0) return config;

  const response = await fetch("/api/download-images", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ urls: targets.map(({ card }) => card.imageUrl) }),
  });
  if (!response.ok) throw new Error(COPY.imageError);

  const data: { statuses: ImageStatus[] } = await response.json();
  const cards = [...config.cards];
  targets.forEach(({ card, index }, targetIndex) => {
    cards[index] = { ...card, imageStatus: data.statuses[targetIndex] };
  });
  return { ...config, cards };
}

function countImageStatuses(cards: Card[]) {
  const counts = { ok: 0, failed: 0, none: 0, unchecked: 0 };
  for (const card of cards) {
    if (card.imageData || card.imageStatus === "ok") counts.ok++;
    else if (card.imageStatus === "failed") counts.failed++;
    else if (card.imageStatus === "none") counts.none++;
    else counts.unchecked++;
  }
  return counts;
}

async function requestSheetPng(config: SheetConfig): Promise<Blob> {
  const response = await fetch("/api/generate-png", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ config }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || COPY.pngFallbackError);
  }

  return response.blob();
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function formatSavedAt(savedAt: string): string {
  const date = new Date(savedAt);
  if (Number.isNaN(date.getTime())) return "日時不明";
  return date.toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildNoticeClasses(tone: NoticeTone): string {
  if (tone === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-900";
  }
  if (tone === "error") {
    return "border-red-200 bg-red-50 text-red-900";
  }
  return "border-amber-200 bg-amber-50 text-amber-900";
}

function buildCheckToneClasses(tone: NoticeTone): string {
  if (tone === "success") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (tone === "error") return "border-red-200 bg-red-50 text-red-900";
  return "border-amber-200 bg-amber-50 text-amber-900";
}

export default function Home() {
  const [sheets, setSheets] = useState<SheetConfig[]>([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [loading, setLoading] = useState(false);
  const [editingCardIndex, setEditingCardIndex] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [fitPreviewScale, setFitPreviewScale] = useState(1);
  const [previewZoom, setPreviewZoom] = useState<PreviewZoom>("fit");
  const [previewCanvasHeight, setPreviewCanvasHeight] = useState(
    PREVIEW_CANVAS_HEIGHT
  );
  const [notice, setNotice] = useState<Notice | null>({
    tone: "info",
    message: COPY.initialNotice,
  });
  const [workRestored, setWorkRestored] = useState(false);
  const previewViewportRef = useRef<HTMLDivElement | null>(null);
  const previewCanvasRef = useRef<HTMLDivElement | null>(null);
  const workFileInputRef = useRef<HTMLInputElement | null>(null);
  const historyRef = useRef(new EditHistory<SheetConfig[]>());
  const previousSheetsRef = useRef<SheetConfig[]>(sheets);
  // How the next sheets change is treated: a user edit ("record"), a
  // background update or undo/redo itself ("skip"), or a new board ("reset").
  const historyModeRef = useRef<"record" | "skip" | "reset">("record");
  const [, setHistoryVersion] = useState(0);

  const previewScale = previewZoom === "fit" ? fitPreviewScale : previewZoom;

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("kaitori-pop-theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
      return;
    }
    if (savedTheme === "light") {
      setIsDarkMode(false);
      return;
    }
    setIsDarkMode(window.matchMedia("(prefers-color-scheme: dark)").matches);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      "kaitori-pop-theme",
      isDarkMode ? "dark" : "light"
    );
  }, [isDarkMode]);

  // Success and progress notes clear themselves; errors stay until closed.
  useEffect(() => {
    if (!notice || notice.tone === "error" || generating || loading) return;
    const timer = window.setTimeout(() => setNotice(null), 6000);
    return () => window.clearTimeout(timer);
  }, [notice, generating, loading]);

  useEffect(() => {
    const previous = previousSheetsRef.current;
    previousSheetsRef.current = sheets;
    if (previous === sheets) return;

    const mode = historyModeRef.current;
    historyModeRef.current = "record";
    if (mode === "reset" || previous.length === 0 || sheets.length === 0) {
      historyRef.current.clear();
    } else if (mode === "record") {
      historyRef.current.record(previous);
    }
    setHistoryVersion((version) => version + 1);
  }, [sheets]);

  const handleUndo = useCallback(() => {
    const previous = historyRef.current.undo(sheets);
    if (!previous) return;
    historyModeRef.current = "skip";
    setSheets(previous);
    setActiveSheet((index) => Math.min(index, previous.length - 1));
    setNotice({ tone: "info", message: "1つ前の状態に戻しました。" });
  }, [sheets]);

  const handleRedo = useCallback(() => {
    const next = historyRef.current.redo(sheets);
    if (!next) return;
    historyModeRef.current = "skip";
    setSheets(next);
    setActiveSheet((index) => Math.min(index, next.length - 1));
    setNotice({ tone: "info", message: "取り消した操作をやり直しました。" });
  }, [sheets]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
      const target = event.target as HTMLElement | null;
      // Text fields keep their own native undo.
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;

      const key = event.key.toLowerCase();
      if (key === "z" && !event.shiftKey) {
        event.preventDefault();
        handleUndo();
      } else if ((key === "z" && event.shiftKey) || key === "y") {
        event.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleRedo, handleUndo]);

  const applySavedWork = useCallback((work: SavedWork, message: string) => {
    historyModeRef.current = "reset";
    setSheets(work.sheets);
    setActiveSheet(work.activeSheet);
    setShowSettings(true);
    setNotice({ tone: "success", message });
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCurrentWork()
      .then((work) => {
        if (cancelled || !work) return;
        applySavedWork(
          work,
          `前回の作業（${formatSavedAt(work.savedAt)} 保存）を復元しました。`
        );
      })
      .catch((error) => console.warn("Work restore failed:", error))
      .finally(() => {
        if (!cancelled) setWorkRestored(true);
      });
    return () => {
      cancelled = true;
    };
  }, [applySavedWork]);

  // Autosave every edit so a reload or a closed tab does not lose the board.
  useEffect(() => {
    if (!workRestored || sheets.length === 0) return;
    const timer = window.setTimeout(() => {
      saveCurrentWork(buildSavedWork(sheets, activeSheet)).catch((error) =>
        console.warn("Work autosave failed:", error)
      );
    }, 500);
    return () => window.clearTimeout(timer);
  }, [activeSheet, sheets, workRestored]);

  const handleSaveWorkFile = useCallback(() => {
    if (sheets.length === 0) return;
    const work = buildSavedWork(sheets, activeSheet);
    const blob = new Blob([JSON.stringify(work)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = buildWorkFileName(work);
    link.click();
    URL.revokeObjectURL(url);
    setNotice({ tone: "success", message: `${link.download} を保存しました。` });
  }, [activeSheet, sheets]);

  const handleOpenWorkFile = useCallback(
    async (file: File) => {
      const work = parseWorkFileText(await file.text());
      if (!work) {
        setNotice({
          tone: "error",
          message: `${file.name} は KaitoriPOP の作業ファイルとして読み込めませんでした。`,
        });
        return;
      }
      applySavedWork(work, `${file.name} を開きました。`);
    },
    [applySavedWork]
  );

  const handleStartOver = useCallback(() => {
    if (!window.confirm("いまの作業を閉じて、最初の読み込み画面に戻りますか？（保存していない変更は消えます）")) {
      return;
    }
    setSheets([]);
    setActiveSheet(0);
    setEditingCardIndex(null);
    setNotice({ tone: "info", message: COPY.initialNotice });
    clearCurrentWork().catch((error) => console.warn("Work clear failed:", error));
  }, []);

  const handleUpload = useCallback(async (file: File) => {
    setLoading(true);
    setNotice({
      tone: "info",
      message: `${file.name}${COPY.parseProgress}`,
    });

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/parse-excel", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || COPY.parseFallbackError);
      }

      const data = await response.json();
      const warningMessage =
        Array.isArray(data.warnings) && data.warnings.length > 0
          ? ` ${COPY.parseWarningPrefix}${data.warnings
              .map((warning: { sheetName: string; message: string }) => `${warning.sheetName}: ${warning.message}`)
              .join(" / ")}`
          : "";
      historyModeRef.current = "reset";
      setSheets(data.sheets);
      setActiveSheet(0);
      setShowSettings(data.sheets.length > 0);
      setNotice({
        tone: "success",
        message: `${data.sheets.length}${COPY.parseSuccess}${warningMessage}`,
      });
    } catch (error) {
      console.error("Upload error:", error);
      setNotice({
        tone: "error",
        message:
          error instanceof Error ? error.message : COPY.parseFallbackError,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLoadSample = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/sample-buylist.csv");
      if (!response.ok) throw new Error(COPY.sampleError);
      const blob = await response.blob();
      const file = new File([blob], "sample-buylist.csv", { type: "text/csv" });
      await handleUpload(file);
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : COPY.sampleError,
      });
      setLoading(false);
    }
  }, [handleUpload]);

  const handleDownloadImages = useCallback(async () => {
    if (sheets.length === 0) return;

    const config = sheets[activeSheet];
    setLoading(true);
    setNotice({
      tone: "info",
      message: `${config.sheetName}${COPY.imageProgress}`,
    });

    try {
      const checked = await ensureSheetImages(config, true);
      historyModeRef.current = "skip";
      setSheets((current) =>
        current.map((sheet, index) => (index === activeSheet ? checked : sheet))
      );
      const counts = countImageStatuses(checked.cards);
      setNotice({
        tone: counts.failed > 0 ? "error" : "success",
        message:
          counts.failed > 0 || counts.none > 0
            ? `画像を確認しました（取得 ${counts.ok}枚・失敗 ${counts.failed}枚・URLなし ${counts.none}枚）。失敗とURLなしは仮画像で書き出されます。`
            : COPY.imageSuccess,
      });
    } catch (error) {
      console.error("Image download error:", error);
      setNotice({
        tone: "error",
        message: COPY.imageError,
      });
    } finally {
      setLoading(false);
    }
  }, [activeSheet, sheets]);

  const handleGeneratePng = useCallback(async () => {
    if (sheets.length === 0) return;

    const config = sheets[activeSheet];
    setGenerating(true);
    setNotice({
      tone: "info",
      message: `${config.sheetName}${COPY.pngProgress}`,
    });

    try {
      const finalConfig = await ensureSheetImages(config);
      if (finalConfig !== config) {
        historyModeRef.current = "skip";
        setSheets((current) =>
          current.map((sheet, index) => (index === activeSheet ? finalConfig : sheet))
        );
      }

      const [fileName] = buildUniqueFileNames(
        [`${config.sheetName}${resolveOutputSize(config.outputSize).fileSuffix}`],
        ".png"
      );
      downloadBlob(await requestSheetPng(finalConfig), fileName);

      setNotice({
        tone: "success",
        message: `${fileName}${COPY.pngSuccessSuffix}`,
      });
    } catch (error) {
      console.error("PNG generation error:", error);
      setNotice({
        tone: "error",
        message:
          error instanceof Error ? error.message : COPY.pngFallbackError,
      });
    } finally {
      setGenerating(false);
    }
  }, [activeSheet, sheets]);

  const handleExportAllSheets = useCallback(async () => {
    if (sheets.length === 0) return;

    setGenerating(true);
    const fileNames = buildUniqueFileNames(
      sheets.map(
        (sheet) => `${sheet.sheetName}${resolveOutputSize(sheet.outputSize).fileSuffix}`
      ),
      ".png"
    );
    const entries: ZipEntry[] = [];

    try {
      for (let index = 0; index < sheets.length; index++) {
        const config = sheets[index];
        setNotice({
          tone: "info",
          message: `全シートを書き出し中（${index + 1}/${sheets.length}）：${config.sheetName}`,
        });

        const finalConfig = await ensureSheetImages(config);
        if (finalConfig !== config) {
          // Keep the checked statuses so later exports skip those cards.
          historyModeRef.current = "skip";
          setSheets((current) =>
            current.map((sheet, sheetIndex) => (sheetIndex === index ? finalConfig : sheet))
          );
        }

        const png = await requestSheetPng(finalConfig);
        entries.push({
          name: fileNames[index],
          data: new Uint8Array(await png.arrayBuffer()),
        });
      }

      const zip = createZip(entries);
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const zipName = `kaitori-pop-${date}.zip`;
      downloadBlob(new Blob([zip], { type: "application/zip" }), zipName);
      setNotice({
        tone: "success",
        message: `${sheets.length}シート分の PNG を ${zipName} にまとめて書き出しました。`,
      });
    } catch (error) {
      console.error("Export all sheets error:", error);
      const failedSheet = sheets[entries.length]?.sheetName;
      const detail = error instanceof Error ? error.message : COPY.pngFallbackError;
      setNotice({
        tone: "error",
        message: failedSheet ? `${failedSheet} で止まりました。${detail}` : detail,
      });
    } finally {
      setGenerating(false);
    }
  }, [sheets]);

  const handleCardUpdate = useCallback(
    (cardIndex: number, updates: Partial<Card>) => {
      const nextSheets = [...sheets];
      const nextConfig = { ...nextSheets[activeSheet] };
      const nextCards = [...nextConfig.cards];
      nextCards[cardIndex] = { ...nextCards[cardIndex], ...updates };
      nextConfig.cards = nextCards;
      nextSheets[activeSheet] = nextConfig;
      setSheets(nextSheets);
      setNotice({
        tone: "success",
        message: COPY.cardUpdated,
      });
    },
    [activeSheet, sheets]
  );

  const handleSwapInOverflow = useCallback(
    (overflowIndex: number) => {
      const result = swapInOverflowCard(sheets[activeSheet], overflowIndex);
      if (!result) return;

      setSheets((current) =>
        current.map((sheet, index) => (index === activeSheet ? result.config : sheet))
      );
      const inName = result.swappedIn.nameJp || result.swappedIn.nameEn;
      const outName = result.swappedOut
        ? result.swappedOut.nameJp || result.swappedOut.nameEn
        : null;
      setNotice({
        tone: "success",
        message: outName
          ? `${inName} を掲載し、${outName} を掲載外に回しました。`
          : `${inName} を掲載しました。`,
      });
    },
    [activeSheet, sheets]
  );

  const handleReorder = useCallback(
    (newSortedOrder: number[]) => {
      const nextSheets = [...sheets];
      nextSheets[activeSheet] = {
        ...nextSheets[activeSheet],
        sortedOrder: newSortedOrder,
        sortMode: "custom",
      };
      setSheets(nextSheets);
      setNotice({
        tone: "info",
        message: COPY.reorderUpdated,
      });
    },
    [activeSheet, sheets]
  );

  const handleSortModeChange = useCallback(
    (mode: Exclude<SortMode, "custom">) => {
      const nextSheets = [...sheets];
      nextSheets[activeSheet] = applySortMode(nextSheets[activeSheet], mode);
      setSheets(nextSheets);
      setNotice({ tone: "info", message: SORT_MODE_NOTICES[mode] });
    },
    [activeSheet, sheets]
  );

  const handleApplyPresetToAll = useCallback((settings: SheetAppearanceSettings) => {
    setSheets((current) => applyAppearanceToAllSheets(current, settings));
    setNotice({ tone: "success", message: "プリセットを全シートへ反映しました。" });
  }, []);

  const handleConfigUpdate = useCallback(
    (updates: Partial<SheetConfig>) => {
      const nextSheets = [...sheets];
      nextSheets[activeSheet] = { ...nextSheets[activeSheet], ...updates };
      setSheets(nextSheets);
    },
    [activeSheet, sheets]
  );

  const currentConfig = sheets[activeSheet];
  const canvasWidth = resolveOutputSize(currentConfig?.outputSize).width;
  const imageCounts = useMemo(
    () => countImageStatuses(currentConfig?.cards ?? []),
    [currentConfig]
  );
  const hasSheets = sheets.length > 0;
  const missingPriceCount = useMemo(
    () =>
      currentConfig?.cards.filter(
        (card) =>
          !card.priceOverride &&
          card.priceJp === null &&
          card.priceEn === null
      ).length ?? 0,
    [currentConfig]
  );
  const overflowCount = currentConfig?.overflowCards?.length ?? 0;
  const outputChecks = useMemo(() => {
    if (!currentConfig) return [];

    return [
      {
        tone: (currentConfig.cards.length < GRID_TOTAL ? "info" : "success") as NoticeTone,
        label: "カード枚数",
        value: `${currentConfig.cards.length}/${GRID_TOTAL}（空き${GRID_TOTAL - currentConfig.cards.length}枠）`,
      },
      {
        tone: (imageCounts.failed > 0
          ? "error"
          : imageCounts.unchecked > 0 || imageCounts.none > 0
            ? "info"
            : "success") as NoticeTone,
        label: "画像",
        value:
          imageCounts.failed > 0
            ? `${imageCounts.failed}枚の取得に失敗。PNGでは仮画像になります。`
            : imageCounts.unchecked > 0
              ? `${imageCounts.unchecked}枚未確認。PNG出力時に自動取得します。`
              : imageCounts.none > 0
                ? `${imageCounts.none}枚は画像URLがなく仮画像になります。`
                : "取得済み",
      },
      {
        tone: missingPriceCount === 0 ? "success" as NoticeTone : "error" as NoticeTone,
        label: "価格",
        value:
          missingPriceCount === 0
            ? "入力済み"
            : `${missingPriceCount}枚に価格がありません。`,
      },
      {
        tone: currentConfig.title.length <= 12 ? "success" as NoticeTone : "info" as NoticeTone,
        label: "タイトル",
        value:
          currentConfig.title.length <= 12
            ? "収まりやすい長さです"
            : "長めです。書き出し前に見切れを確認してください。",
      },
      {
        tone:
          currentConfig.updatedAtText.length <= 24
            ? "success" as NoticeTone
            : "info" as NoticeTone,
        label: "更新日",
        value:
          currentConfig.updatedAtText.length <= 24
            ? "収まりやすい長さです"
            : "長めです。右下表示の見切れを確認してください。",
      },
      ...(overflowCount > 0
        ? [
            {
              tone: "info" as NoticeTone,
              label: "掲載外",
              value: `${overflowCount}枚。プレビュー下の一覧から入れ替えできます。`,
            },
          ]
        : []),
    ];
  }, [currentConfig, imageCounts, missingPriceCount, overflowCount]);
  const issueChecks = outputChecks.filter((check) => check.tone !== "success");
  const okChecks = outputChecks.filter((check) => check.tone === "success");

  useEffect(() => {
    const viewportNode = previewViewportRef.current;
    const canvasNode = previewCanvasRef.current;
    if (!viewportNode || !canvasNode) return;

    const updatePreviewMetrics = () => {
      // clientWidth includes the viewport's padding; fit to the inner box so
      // the right-hand column is not clipped behind a horizontal scrollbar.
      const viewportStyle = window.getComputedStyle(viewportNode);
      const innerWidth =
        viewportNode.clientWidth -
        parseFloat(viewportStyle.paddingLeft) -
        parseFloat(viewportStyle.paddingRight) -
        2;
      const nextScale = Math.min(innerWidth / canvasWidth, 1);
      setFitPreviewScale(nextScale);
      setPreviewCanvasHeight(
        Math.max(canvasNode.scrollHeight, canvasNode.offsetHeight, PREVIEW_CANVAS_HEIGHT)
      );
    };

    updatePreviewMetrics();

    const viewportObserver = new ResizeObserver(updatePreviewMetrics);
    const canvasObserver = new ResizeObserver(updatePreviewMetrics);
    viewportObserver.observe(viewportNode);
    canvasObserver.observe(canvasNode);

    return () => {
      viewportObserver.disconnect();
      canvasObserver.disconnect();
    };
  }, [canvasWidth, hasSheets, showSettings, currentConfig]);

  return (
    <div
      className={`min-h-screen bg-[radial-gradient(circle_at_top,_#fff8ec,_#f3efe7_45%,_#ebe5d8_100%)] ${
        isDarkMode ? "app-dark" : ""
      }`}
    >
      <header className="app-header border-b border-stone-200/80 bg-white/85 px-6 py-5 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-800">
              Buylist Studio
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-stone-900">
                {COPY.appTitle}
              </h1>
              <p className="text-sm text-stone-600">{COPY.appSubtitle}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:items-end">
            <div className="flex flex-wrap gap-2 lg:justify-end">
              {hasSheets && (
                <button
                  type="button"
                  onClick={handleSaveWorkFile}
                  className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-bold text-stone-700 shadow-sm transition hover:bg-stone-50"
                >
                  作業を保存
                </button>
              )}
              <button
                type="button"
                onClick={() => workFileInputRef.current?.click()}
                className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-bold text-stone-700 shadow-sm transition hover:bg-stone-50"
              >
                作業を開く
              </button>
              <input
                ref={workFileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (file) void handleOpenWorkFile(file);
                }}
              />
              {hasSheets && (
                <button
                  type="button"
                  onClick={handleStartOver}
                  className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-bold text-stone-700 shadow-sm transition hover:bg-stone-50"
                >
                  最初から
                </button>
              )}
              <button
                type="button"
                aria-pressed={isDarkMode}
                onClick={() => setIsDarkMode((value) => !value)}
                className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-bold text-stone-700 shadow-sm transition hover:bg-stone-50"
              >
                {isDarkMode ? COPY.lightMode : COPY.darkMode}
              </button>
            </div>

          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-6 py-6">
        {notice && (
          <div
            role={notice.tone === "error" ? "alert" : "status"}
            className={`mb-5 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-medium shadow-sm ${buildNoticeClasses(
              notice.tone
            )}`}
          >
            <div className="min-w-0 flex-1">{notice.message}</div>
            <button
              type="button"
              aria-label="お知らせを閉じる"
              onClick={() => setNotice(null)}
              className="-my-1 shrink-0 rounded-lg px-2 py-1 text-base leading-none opacity-60 transition hover:opacity-100"
            >
              ×
            </button>
          </div>
        )}

        {!hasSheets ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="rounded-[28px] border border-stone-200 bg-white/90 p-4 shadow-[0_24px_80px_rgba(66,39,9,0.08)] sm:p-6">
              <ExcelUploader
                onUpload={handleUpload}
                onLoadSample={handleLoadSample}
                loading={loading}
              />
            </div>

            <div className="rounded-[28px] border border-stone-200 bg-stone-950 p-6 text-stone-100 shadow-[0_24px_80px_rgba(24,18,8,0.28)]">
              <div className="text-[11px] font-semibold tracking-[0.25em] text-amber-300">
                {COPY.guide}
              </div>
              <h2 className="mt-3 text-2xl font-black">{COPY.guideTitle}</h2>
              <div className="mt-5 space-y-4 text-sm text-stone-300">
                <div>
                  <div className="font-semibold text-white">{COPY.guideStep1}</div>
                  <div className="mt-1">{COPY.guideStep1Body}</div>
                </div>
                <div>
                  <div className="font-semibold text-white">{COPY.guideStep2}</div>
                  <div className="mt-1">{COPY.guideStep2Body}</div>
                </div>
                <div>
                  <div className="font-semibold text-white">{COPY.guideStep3}</div>
                  <div className="mt-1">{COPY.guideStep3Body}</div>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-stone-300">
                {COPY.tipsLabel}
                <div className="mt-2">{COPY.tipsBody}</div>
                <a
                  href="/sample-buylist.csv"
                  download="sample-buylist.csv"
                  className="mt-3 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/15"
                >
                  {COPY.sampleCsv}
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <SheetTabs
              sheets={sheets}
              activeIndex={activeSheet}
              onSelect={setActiveSheet}
            />

            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-xs shadow-sm">
              <div className="mr-1 font-black tracking-[0.14em] text-stone-500">
                {COPY.checksTitle}
              </div>
              {issueChecks.map((check) => (
                <div
                  key={check.label}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 ${buildCheckToneClasses(
                    check.tone
                  )}`}
                >
                  <span>
                    <span className="font-black">{check.label}: </span>
                    <span className="font-medium">{check.value}</span>
                  </span>
                  {check.label === "画像" && (
                    <button
                      type="button"
                      onClick={handleDownloadImages}
                      disabled={loading}
                      className="rounded-full border border-current px-2 py-0.5 font-bold opacity-80 transition hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {loading ? COPY.fetching : "再確認"}
                    </button>
                  )}
                </div>
              ))}
              {okChecks.length > 0 && (
                <div className="px-1 font-medium text-emerald-700">
                  ✓ 問題なし：{okChecks.map((check) => check.label).join("・")}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4 xl:flex-row">
              <div className="min-w-0 flex-1 space-y-4">
                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1 rounded-xl border border-stone-200 bg-stone-50 p-1">
                    {[
                      { label: COPY.zoomFit, value: "fit" as PreviewZoom },
                      { label: COPY.zoom50, value: 0.5 as PreviewZoom },
                      { label: COPY.zoom75, value: 0.75 as PreviewZoom },
                      { label: COPY.zoom100, value: 1 as PreviewZoom },
                    ].map((option) => (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() => setPreviewZoom(option.value)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                          previewZoom === option.value
                            ? "bg-stone-900 text-white"
                            : "text-stone-600 hover:bg-white"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <div
                    role="group"
                    aria-label="並び順"
                    className="flex items-center gap-1 rounded-xl border border-stone-200 bg-stone-50 p-1"
                  >
                    <span className="px-2 text-[11px] font-black text-stone-500">並び順</span>
                    {SORT_MODE_OPTIONS.map((option) => {
                      const isActive = (currentConfig.sortMode ?? "auto") === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          aria-pressed={isActive}
                          title={option.title}
                          onClick={() => handleSortModeChange(option.value)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                            isActive ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-white"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                    {currentConfig.sortMode === "custom" && (
                      <span className="rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-900">
                        手動調整
                      </span>
                    )}
                  </div>
                  <label className="flex items-center gap-2 text-xs font-bold text-stone-600">
                    出力サイズ
                    <select
                      value={resolveOutputSize(currentConfig.outputSize).id}
                      onChange={(event) =>
                        handleConfigUpdate({ outputSize: event.target.value as OutputSizeId })
                      }
                      className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700"
                    >
                      {OUTPUT_SIZE_ORDER.map((sizeId) => (
                        <option key={sizeId} value={sizeId}>
                          {OUTPUT_SIZES[sizeId].label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleUndo}
                      disabled={!historyRef.current.canUndo}
                      title="元に戻す（Ctrl+Z）"
                      className="rounded-xl border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ↶ 元に戻す
                    </button>
                    <button
                      type="button"
                      onClick={handleRedo}
                      disabled={!historyRef.current.canRedo}
                      title="やり直す（Ctrl+Shift+Z）"
                      className="rounded-xl border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ↷ やり直す
                    </button>
                  </div>
                  <div className="ml-auto flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowSettings(!showSettings)}
                      aria-pressed={showSettings}
                      className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
                    >
                      {showSettings ? COPY.closeSettings : COPY.openSettings}
                    </button>
                    {sheets.length > 1 && (
                      <button
                        type="button"
                        onClick={handleExportAllSheets}
                        disabled={generating}
                        className="rounded-xl border border-red-700 px-4 py-2 text-sm font-semibold text-red-800 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        全シートを書き出し（zip）
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleGeneratePng}
                      disabled={generating}
                      className="inline-flex items-center gap-2 rounded-xl bg-red-700 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {generating && (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      )}
                      {generating ? COPY.generating : COPY.exportPng}
                    </button>
                  </div>
                </div>

                <div
                  ref={previewViewportRef}
                  className="overflow-auto rounded-[28px] border border-stone-300/70 bg-[#eee7d8] p-4 shadow-[0_24px_80px_rgba(66,39,9,0.14)]"
                >
                  <div
                    className="origin-top-left overflow-hidden rounded-[24px] border border-[#c8b482]/80 bg-[#f1eadc] shadow-[0_24px_80px_rgba(66,39,9,0.14)]"
                    style={{
                      width: `${Math.round(canvasWidth * previewScale)}px`,
                      height: `${Math.round(previewCanvasHeight * previewScale)}px`,
                    }}
                  >
                    <div
                      ref={previewCanvasRef}
                      data-buylist-preview
                      style={{
                        width: `${canvasWidth}px`,
                        transform: `scale(${previewScale})`,
                        transformOrigin: "top left",
                      }}
                    >
                      <BuylistPreview
                        config={currentConfig}
                        scale={previewScale}
                        onCardClick={setEditingCardIndex}
                        onReorder={handleReorder}
                      />
                    </div>
                  </div>
                </div>

                <OverflowCardList
                  cards={currentConfig.overflowCards ?? []}
                  onSwapIn={handleSwapInOverflow}
                />

                <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-xs text-stone-500 shadow-sm">
                  {COPY.helper}
                </div>
              </div>

              {showSettings && (
                <div className="w-full xl:w-[360px] xl:flex-shrink-0">
                  <div className="settings-scroll-panel xl:sticky xl:top-6 xl:max-h-[calc(100vh-3rem)] xl:overflow-y-auto xl:pr-2">
                    <SettingsPanel
                      config={currentConfig}
                      onChange={handleConfigUpdate}
                      onApplyToAll={handleApplyPresetToAll}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {editingCardIndex !== null && currentConfig && (
        <CardEditor
          card={currentConfig.cards[editingCardIndex]}
          onSave={(updates) => handleCardUpdate(editingCardIndex, updates)}
          onClose={() => setEditingCardIndex(null)}
        />
      )}
    </div>
  );
}
