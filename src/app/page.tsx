"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SheetConfig, Card, GRID_TOTAL, ImageStatus } from "@/lib/types";
import {
  PREVIEW_CANVAS_HEIGHT,
  PREVIEW_CANVAS_WIDTH,
} from "@/lib/layout-tokens";
import ExcelUploader from "@/components/ExcelUploader";
import SheetTabs from "@/components/SheetTabs";
import BuylistPreview from "@/components/BuylistPreview";
import CardEditor from "@/components/CardEditor";
import SettingsPanel from "@/components/SettingsPanel";
import OverflowCardList from "@/components/OverflowCardList";
import { swapInOverflowCard } from "@/lib/overflow";
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

const COPY = {
  initialNotice:
    "\u0045\u0078\u0063\u0065\u006c\u0020\u002f\u0020\u0043\u0053\u0056\u0020\u3092\u30a2\u30c3\u30d7\u30ed\u30fc\u30c9\u3059\u308b\u3068\u8cb7\u53d6\u8868\u306e\u4f5c\u6210\u3092\u59cb\u3081\u3089\u308c\u307e\u3059\u3002",
  parseProgress:
    "\u3092\u8aad\u307f\u8fbc\u3093\u3067\u30b7\u30fc\u30c8\u3092\u6e96\u5099\u3057\u3066\u3044\u307e\u3059\u002e\u002e\u002e",
  parseSuccess:
    "\u4ef6\u306e\u30b7\u30fc\u30c8\u3092\u8aad\u307f\u8fbc\u307f\u307e\u3057\u305f\u3002\u30d7\u30ec\u30d3\u30e5\u30fc\u3092\u78ba\u8a8d\u3057\u3066\u3001\u5fc5\u8981\u306a\u3089\u4e26\u3073\u66ff\u3048\u3066\u304b\u3089\u66f8\u304d\u51fa\u3057\u3066\u304f\u3060\u3055\u3044\u3002",
  parseWarningPrefix: "\u6ce8\u610f\u003a\u0020",
  parseFallbackError:
    "\u30d5\u30a1\u30a4\u30eb\u306e\u8aad\u307f\u8fbc\u307f\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002",
  imageProgress:
    "\u306e\u30ab\u30fc\u30c9\u753b\u50cf\u3092\u53d6\u5f97\u3057\u3066\u3044\u307e\u3059\u002e\u002e\u002e",
  imageSuccess:
    "\u753b\u50cf\u306e\u53d6\u5f97\u304c\u5b8c\u4e86\u3057\u307e\u3057\u305f\u3002\u53d6\u5f97\u3067\u304d\u305f\u30ab\u30fc\u30c9\u304b\u3089\u9806\u306b\u30d7\u30ec\u30d3\u30e5\u30fc\u3078\u53cd\u6620\u3057\u3066\u3044\u307e\u3059\u3002",
  imageError:
    "\u753b\u50cf\u306e\u53d6\u5f97\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002\u30ec\u30a4\u30a2\u30a6\u30c8\u7de8\u96c6\u306f\u7d9a\u3051\u3089\u308c\u307e\u3059\u304c\u3001\u66f8\u304d\u51fa\u3057\u753b\u50cf\u306b\u4e00\u90e8\u53cd\u6620\u3055\u308c\u306a\u3044\u53ef\u80fd\u6027\u304c\u3042\u308a\u307e\u3059\u3002",
  pngProgress:
    "\u306e\u0020\u0050\u004e\u0047\u0020\u3092\u751f\u6210\u3057\u3066\u3044\u307e\u3059\u002e\u002e\u002e",
  pngFallbackError:
    "\u0050\u004e\u0047\u0020\u306e\u751f\u6210\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002",
  pngSuccessSuffix:
    "\u0020\u3092\u66f8\u304d\u51fa\u3057\u307e\u3057\u305f\u3002",
  cardUpdated:
    "\u30ab\u30fc\u30c9\u8a2d\u5b9a\u3092\u66f4\u65b0\u3057\u307e\u3057\u305f\u3002",
  reorderUpdated:
    "\u30ab\u30fc\u30c9\u306e\u4e26\u3073\u9806\u3092\u66f4\u65b0\u3057\u307e\u3057\u305f\u3002",
  appTitle: "\u0054\u0043\u0047\u0020\u8cb7\u53d6\u8868\u30b8\u30a7\u30cd\u30ec\u30fc\u30bf\u30fc",
  appSubtitle:
    "\u0045\u0078\u0063\u0065\u006c\u0020\u002f\u0020\u0043\u0053\u0056\u0020\u3092\u8aad\u307f\u8fbc\u3093\u3067\u3001\u30ec\u30a4\u30a2\u30a6\u30c8\u3092\u8abf\u6574\u3057\u3001\u305d\u306e\u307e\u307e\u0020\u0050\u004e\u0047\u0020\u306b\u66f8\u304d\u51fa\u305b\u307e\u3059\u3002",
  sheets: "\u30b7\u30fc\u30c8\u6570",
  cards: "\u30ab\u30fc\u30c9\u6570",
  images: "\u753b\u50cf",
  activeSheet: "\u5bfe\u8c61\u30b7\u30fc\u30c8",
  guide: "\u4f7f\u3044\u65b9",
  guideTitle: "\u0033\u30b9\u30c6\u30c3\u30d7\u3067\u4f5c\u6210",
  guideStep1: "\u0031\u002e\u0020\u0045\u0078\u0063\u0065\u006c\u0020\u002f\u0020\u0043\u0053\u0056\u0020\u3092\u30a2\u30c3\u30d7\u30ed\u30fc\u30c9",
  guideStep1Body:
    "\u30b7\u30fc\u30c8\u3054\u3068\u306b\u5185\u5bb9\u3092\u8aad\u307f\u53d6\u308a\u3001\u8cb7\u53d6\u8868\u30bf\u30d6\u3092\u81ea\u52d5\u3067\u4f5c\u6210\u3057\u307e\u3059\u3002",
  guideStep2: "\u0032\u002e\u0020\u30d7\u30ec\u30d3\u30e5\u30fc\u3092\u8abf\u6574",
  guideStep2Body:
    "\u30c9\u30e9\u30c3\u30b0\u3067\u4e26\u3073\u66ff\u3048\u3001\u5fc5\u8981\u306a\u30ab\u30fc\u30c9\u3060\u3051\u4fa1\u683c\u3084\u30bb\u30c3\u30c8\u8868\u8a18\u3092\u4e0a\u66f8\u304d\u3067\u304d\u307e\u3059\u3002",
  guideStep3: "\u0033\u002e\u0020\u0050\u004e\u0047\u0020\u3092\u66f8\u304d\u51fa\u3057",
  guideStep3Body:
    "\u5fc5\u8981\u306a\u3089\u753b\u50cf\u3092\u53d6\u5f97\u3057\u3066\u3001\u305d\u306e\u307e\u307e\u5b8c\u6210\u7248\u306e\u0020\u0050\u004e\u0047\u0020\u3092\u751f\u6210\u3057\u307e\u3059\u3002",
  tipsLabel: "\u304a\u3059\u3059\u3081\u003a",
  tipsBody:
    "\u30b7\u30fc\u30c8\u540d\u306f\u77ed\u3081\u3001\u0031\u30b7\u30fc\u30c8\u6700\u5927\u0033\u0036\u679a\u3001\u4fa1\u683c\u78ba\u8a8d\u5f8c\u306b\u66f8\u304d\u51fa\u3059\u3068\u5b89\u5b9a\u3057\u307e\u3059\u3002",
  sampleCsv: "\u30b5\u30f3\u30d7\u30ebCSV",
  trySample: "サンプルCSVで試す",
  openSettings: "\u8a2d\u5b9a\u3092\u958b\u304f",
  closeSettings: "\u8a2d\u5b9a\u3092\u9589\u3058\u308b",
  fetchImages: "\u753b\u50cf\u3092\u53d6\u5f97",
  fetching: "\u53d6\u5f97\u4e2d\u002e\u002e\u002e",
  exportPng: "\u0050\u004e\u0047\u3092\u66f8\u304d\u51fa\u3057",
  generating: "\u751f\u6210\u4e2d\u002e\u002e\u002e",
  helper:
    "\u30c9\u30e9\u30c3\u30b0\u3067\u4e26\u3073\u66ff\u3048\u3001\u30ab\u30fc\u30c9\u3092\u30af\u30ea\u30c3\u30af\u3057\u3066\u500b\u5225\u8a2d\u5b9a\u3001\u53f3\u5074\u306e\u8a2d\u5b9a\u3067\u30bf\u30a4\u30c8\u30eb\u3084\u30ed\u30b4\u3092\u8abf\u6574\u3067\u304d\u307e\u3059\u3002",
  sampleError: "サンプルCSVの読み込みに失敗しました。",
  workflowLoad: "読込",
  workflowImages: "画像",
  workflowAdjust: "調整",
  workflowExport: "出力",
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

  const applySavedWork = useCallback((work: SavedWork, message: string) => {
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
        setSheets((current) =>
          current.map((sheet, index) => (index === activeSheet ? finalConfig : sheet))
        );
      }

      const [fileName] = buildUniqueFileNames([config.sheetName], ".png");
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
      sheets.map((sheet) => sheet.sheetName),
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
      };
      setSheets(nextSheets);
      setNotice({
        tone: "info",
        message: COPY.reorderUpdated,
      });
    },
    [activeSheet, sheets]
  );

  const handleConfigUpdate = useCallback(
    (updates: Partial<SheetConfig>) => {
      const nextSheets = [...sheets];
      nextSheets[activeSheet] = { ...nextSheets[activeSheet], ...updates };
      setSheets(nextSheets);
    },
    [activeSheet, sheets]
  );

  const currentConfig = sheets[activeSheet];
  const totalCards = useMemo(
    () => sheets.reduce((count, sheet) => count + sheet.cards.length, 0),
    [sheets]
  );
  const imageCounts = useMemo(
    () => countImageStatuses(currentConfig?.cards ?? []),
    [currentConfig]
  );
  const fetchedImageCount = imageCounts.ok;
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
        tone: "success" as NoticeTone,
        label: "カード枚数",
        value: `${currentConfig.cards.length}/${GRID_TOTAL}`,
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

  useEffect(() => {
    const viewportNode = previewViewportRef.current;
    const canvasNode = previewCanvasRef.current;
    if (!viewportNode || !canvasNode) return;

    const updatePreviewMetrics = () => {
      const nextScale = Math.min(viewportNode.clientWidth / PREVIEW_CANVAS_WIDTH, 1);
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
  }, [hasSheets, showSettings, currentConfig]);

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

            {hasSheets && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
                <div className="text-[11px] font-semibold tracking-[0.2em] text-stone-500">
                  {COPY.sheets}
                </div>
                <div className="mt-1 text-xl font-black text-stone-900">{sheets.length}</div>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
                <div className="text-[11px] font-semibold tracking-[0.2em] text-stone-500">
                  {COPY.cards}
                </div>
                <div className="mt-1 text-xl font-black text-stone-900">{totalCards}</div>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
                <div className="text-[11px] font-semibold tracking-[0.2em] text-stone-500">
                  {COPY.images}
                </div>
                <div className="mt-1 text-xl font-black text-stone-900">
                  {fetchedImageCount}/{currentConfig?.cards.length ?? 0}
                </div>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
                <div className="text-[11px] font-semibold tracking-[0.2em] text-stone-500">
                  {COPY.activeSheet}
                </div>
                <div className="mt-1 truncate text-base font-black text-stone-900">
                  {currentConfig?.sheetName}
                </div>
              </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-6 py-6">
        {notice && (
          <div
            className={`mb-5 rounded-2xl border px-4 py-3 text-sm font-medium shadow-sm ${buildNoticeClasses(
              notice.tone
            )}`}
          >
            {notice.message}
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
                <button
                  type="button"
                  onClick={handleLoadSample}
                  disabled={loading}
                  className="mt-3 inline-flex rounded-full bg-amber-400 px-4 py-2 text-xs font-black text-stone-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {COPY.trySample}
                </button>
                <a
                  href="/sample-buylist.csv"
                  download="sample-buylist.csv"
                  className="ml-2 mt-3 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/15"
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
              <div className="mr-2 font-black tracking-[0.14em] text-stone-500">
                {COPY.checksTitle}
              </div>
              {outputChecks.map((check) => (
                <div
                  key={check.label}
                  className={`rounded-full border px-3 py-1.5 ${buildCheckToneClasses(
                    check.tone
                  )}`}
                >
                  <span className="font-black">{check.label}: </span>
                  <span className="font-medium">{check.value}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-4 xl:flex-row">
              <div className="min-w-0 flex-1 space-y-4">
                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
                  >
                    {showSettings ? COPY.closeSettings : COPY.openSettings}
                  </button>
                  <button
                    onClick={handleDownloadImages}
                    disabled={loading}
                    className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? COPY.fetching : COPY.fetchImages}
                  </button>
                  <button
                    onClick={handleGeneratePng}
                    disabled={generating}
                    className="inline-flex items-center gap-2 rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {generating && (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    )}
                    {generating ? COPY.generating : COPY.exportPng}
                  </button>
                  {sheets.length > 1 && (
                    <button
                      onClick={handleExportAllSheets}
                      disabled={generating}
                      className="rounded-xl border border-red-700 px-4 py-2 text-sm font-semibold text-red-800 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      全シートを書き出し（zip）
                    </button>
                  )}
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
                  <div className="ml-auto text-xs text-stone-500">
                    {COPY.activeSheet}:{" "}
                    <span className="font-semibold text-stone-700">
                      {currentConfig.sheetName}
                    </span>
                  </div>
                </div>

                <div
                  ref={previewViewportRef}
                  className="overflow-auto rounded-[28px] border border-stone-300/70 bg-[#eee7d8] p-4 shadow-[0_24px_80px_rgba(66,39,9,0.14)]"
                >
                  <div
                    className="origin-top-left overflow-hidden rounded-[24px] border border-[#c8b482]/80 bg-[#f1eadc] shadow-[0_24px_80px_rgba(66,39,9,0.14)]"
                    style={{
                      width: `${Math.round(PREVIEW_CANVAS_WIDTH * previewScale)}px`,
                      height: `${Math.round(previewCanvasHeight * previewScale)}px`,
                    }}
                  >
                    <div
                      ref={previewCanvasRef}
                      data-buylist-preview
                      style={{
                        width: `${PREVIEW_CANVAS_WIDTH}px`,
                        transform: `scale(${previewScale})`,
                        transformOrigin: "top left",
                      }}
                    >
                      <BuylistPreview
                        config={currentConfig}
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
