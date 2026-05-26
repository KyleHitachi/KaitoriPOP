"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  SheetConfig,
  Card,
  GRID_TOTAL,
  DEFAULT_TITLE_SUBTITLE,
} from "@/lib/types";
import {
  CTA_BORDER_WIDTH,
  CTA_MIN_WIDTH,
  CTA_RADIUS,
  KICKER_FONT_STACK,
  PREVIEW_CANVAS_HEIGHT,
  PREVIEW_CANVAS_WIDTH,
  TITLE_BAR_HEIGHT,
  TITLE_BAR_WIDTH,
  TITLE_FONT_SIZE,
  TITLE_FONT_STACK,
  TITLE_KICKER_SIZE,
  TITLE_RULE_HEIGHT,
  TITLE_RULE_WIDTH,
  TITLE_SHELL_WIDTH,
  TITLE_SUBTITLE_SIZE,
  TITLE_TRACKING,
} from "@/lib/layout-tokens";
import ExcelUploader from "@/components/ExcelUploader";
import SheetTabs from "@/components/SheetTabs";
import CardGrid from "@/components/CardGrid";
import CardEditor from "@/components/CardEditor";
import SettingsPanel from "@/components/SettingsPanel";

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

function renderPreviewTitle(title: string) {
  if (!title.startsWith("MTG")) return title;

  return (
    <>
      <span className="text-[#b82020]">MTG</span>
      <span>{title.slice(3)}</span>
    </>
  );
}

function renderPreviewSubtitle(subtitle: string) {
  return subtitle.split(/([・/／])/).map((part, index) => {
    const isSeparator = /[・/／]/.test(part);
    const colorClass = isSeparator
      ? "text-[#8a6b2f]"
      : index % 4 === 0
        ? "text-[#b82020]"
        : "text-[#8a6b2f]";

    return (
      <span key={`${part}-${index}`} className={colorClass}>
        {part}
      </span>
    );
  });
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
  const previewViewportRef = useRef<HTMLDivElement | null>(null);
  const previewCanvasRef = useRef<HTMLDivElement | null>(null);

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
      const response = await fetch("/api/download-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cards: config.cards }),
      });

      if (!response.ok) throw new Error(COPY.imageError);

      const data = await response.json();
      const nextSheets = [...sheets];
      nextSheets[activeSheet] = { ...config, cards: data.cards };
      setSheets(nextSheets);
      setNotice({
        tone: "success",
        message: COPY.imageSuccess,
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
      const needsImageFetch = config.cards.some((card) => !card.imageData);
      let finalConfig = config;

      if (needsImageFetch) {
        const downloadResponse = await fetch("/api/download-images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cards: config.cards }),
        });

        if (!downloadResponse.ok) throw new Error(COPY.imageError);

        const downloadData = await downloadResponse.json();
        finalConfig = { ...config, cards: downloadData.cards };

        const nextSheets = [...sheets];
        nextSheets[activeSheet] = finalConfig;
        setSheets(nextSheets);
      }

      const response = await fetch("/api/generate-png", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: finalConfig }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || COPY.pngFallbackError);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${config.sheetName}.png`;
      link.click();
      URL.revokeObjectURL(url);

      setNotice({
        tone: "success",
        message: `${config.sheetName}.png${COPY.pngSuccessSuffix}`,
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
  const titleSubtitle =
    currentConfig && (currentConfig.showTitleSubtitle ?? true)
      ? currentConfig.titleSubtitle ?? DEFAULT_TITLE_SUBTITLE
      : "";
  const logoGgHeight = currentConfig?.logoGgHeight ?? 96;
  const logoMtgHeight = currentConfig?.logoMtgHeight ?? 64;
  const totalCards = useMemo(
    () => sheets.reduce((count, sheet) => count + sheet.cards.length, 0),
    [sheets]
  );
  const fetchedImageCount = useMemo(
    () => currentConfig?.cards.filter((card) => Boolean(card.imageData)).length ?? 0,
    [currentConfig]
  );
  const hasSheets = sheets.length > 0;
  const missingImageCount = currentConfig
    ? currentConfig.cards.length - fetchedImageCount
    : 0;
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
  const outputChecks = useMemo(() => {
    if (!currentConfig) return [];

    return [
      {
        tone: "success" as NoticeTone,
        label: "カード枚数",
        value: `${currentConfig.cards.length}/${GRID_TOTAL}`,
      },
      {
        tone: missingImageCount === 0 ? "success" as NoticeTone : "info" as NoticeTone,
        label: "画像",
        value:
          missingImageCount === 0
            ? "取得済み"
            : `${missingImageCount}枚未取得。PNG出力時に自動取得します。`,
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
    ];
  }, [currentConfig, missingImageCount, missingPriceCount]);

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
            <button
              type="button"
              aria-pressed={isDarkMode}
              onClick={() => setIsDarkMode((value) => !value)}
              className="self-start rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-bold text-stone-700 shadow-sm transition hover:bg-stone-50 lg:self-end"
            >
              {isDarkMode ? COPY.lightMode : COPY.darkMode}
            </button>

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
                      className="relative"
                      style={{
                        width: `${PREVIEW_CANVAS_WIDTH}px`,
                        transform: `scale(${previewScale})`,
                        transformOrigin: "top left",
                        backgroundImage:
                          "linear-gradient(135deg, rgba(121,96,53,0.05) 0 1px, transparent 1px 52px), linear-gradient(90deg, rgba(255,255,255,0.45), transparent 42%, rgba(153,118,54,0.08)), linear-gradient(180deg, #f4efe4 0%, #e7dfce 100%)",
                        backgroundSize: "52px 52px, 100% 100%, 100% 100%",
                      }}
                    >
                      <div className="flex items-center justify-between gap-6 border-b border-[#c5a64a]/70 bg-gradient-to-r from-[#fffaf0]/96 via-[#f3ead8]/96 to-[#fffaf0]/96 px-9 pb-[10px] pt-[12px] shadow-[0_12px_26px_rgba(83,58,20,0.12)]">
                        <div className="flex shrink-0 items-center gap-4">
                          {currentConfig.logoGg ? (
                            <img
                              src={currentConfig.logoGg}
                              alt="ロゴ"
                              style={{ height: `${logoGgHeight}px` }}
                            />
                          ) : (
                            <div
                              className="flex items-center justify-center rounded-[8px] border border-[#b9953b]/55 bg-[#fff8e6] font-black text-[#4b3211]"
                              style={{
                                width: `${logoGgHeight}px`,
                                height: `${logoGgHeight}px`,
                                fontSize: `${Math.max(18, Math.round(logoGgHeight * 0.27))}px`,
                              }}
                            >
                              ロゴ
                            </div>
                          )}
                          {currentConfig.logoMtg ? (
                            <img
                              src={currentConfig.logoMtg}
                              alt="タイトルロゴ"
                              style={{ height: `${logoMtgHeight}px` }}
                            />
                          ) : (
                            <div
                              className="flex items-center justify-center rounded-[8px] border border-[#b9953b]/55 bg-[#fff8e6] font-black text-[#4b3211]"
                              style={{
                                width: `${Math.round(logoMtgHeight * 2.25)}px`,
                                height: `${logoMtgHeight}px`,
                                fontSize: `${Math.max(16, Math.round(logoMtgHeight * 0.34))}px`,
                              }}
                            >
                              タイトル
                            </div>
                          )}
                        </div>

                        <div className="flex flex-1 justify-center">
                          <div
                            className="flex w-full items-start gap-4"
                            style={{ maxWidth: `${TITLE_SHELL_WIDTH}px` }}
                          >
                            <div
                              className="mt-[6px] rounded-full bg-[#b82020]"
                              style={{
                                width: `${TITLE_BAR_WIDTH}px`,
                                height: `${TITLE_BAR_HEIGHT}px`,
                              }}
                            />
                            <div className="min-w-0 text-left">
                              <div
                                className="mb-[6px] font-semibold uppercase tracking-[0.34em] text-[#8a6b2f]"
                                style={{
                                  fontFamily: KICKER_FONT_STACK,
                                  fontSize: `${TITLE_KICKER_SIZE}px`,
                                }}
                              >
                                BUYLIST BOARD
                              </div>
                              <div className="flex items-end gap-5">
                                <div
                                  className="whitespace-nowrap font-bold leading-none text-[#22201d]"
                                  style={{
                                    fontFamily: TITLE_FONT_STACK,
                                    fontSize: `${TITLE_FONT_SIZE}px`,
                                    letterSpacing: TITLE_TRACKING,
                                  }}
                                >
                                  {renderPreviewTitle(currentConfig.title)}
                                </div>
                                {titleSubtitle && (
                                  <div
                                    className="mb-[11px] whitespace-nowrap border-l-[3px] border-[#b82020] pl-4 font-black tracking-[0.16em]"
                                    style={{
                                      fontFamily: KICKER_FONT_STACK,
                                      fontSize: `${TITLE_SUBTITLE_SIZE}px`,
                                    }}
                                  >
                                    {renderPreviewSubtitle(titleSubtitle)}
                                  </div>
                                )}
                              </div>
                              <div
                                className="mt-3 rounded-full bg-[#b82020]"
                                style={{
                                  width: `${TITLE_RULE_WIDTH}px`,
                                  height: `${TITLE_RULE_HEIGHT}px`,
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        <div
                          className="shrink-0 bg-[#1e1b18] px-7 py-[14px] text-center shadow-[0_8px_22px_rgba(62,42,14,0.22)]"
                          style={{
                            minWidth: `${CTA_MIN_WIDTH}px`,
                            borderRadius: `${CTA_RADIUS}px`,
                            borderStyle: "solid",
                            borderWidth: `${CTA_BORDER_WIDTH}px`,
                            borderColor: "#c5a64a",
                          }}
                        >
                          <div className="text-[24px] font-black tracking-[0.04em] text-[#f1d27a]">
                            {currentConfig.ctaMain}
                          </div>
                          <div className="mt-1 text-[16px] font-medium text-white/90">
                            {currentConfig.ctaSub}
                          </div>
                        </div>
                      </div>
                      <CardGrid
                        config={currentConfig}
                        previewScale={previewScale}
                        onCardClick={setEditingCardIndex}
                        onReorder={handleReorder}
                      />

                      <div className="px-9 pb-4 pt-1 text-center">
                        <p className="text-[11px] font-bold text-[#3f3931]">
                          {currentConfig.footerText}
                        </p>
                      </div>

                      {currentConfig.updatedAtText && (
                        <div className="absolute bottom-4 right-9 max-w-[420px] truncate rounded-[6px] border border-white/25 bg-black/60 px-4 py-2 text-[22px] font-semibold text-white/95 shadow-[0_6px_18px_rgba(0,0,0,0.22)] backdrop-blur-[1px]">
                          {currentConfig.updatedAtText}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

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
