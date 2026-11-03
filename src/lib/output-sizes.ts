import { GRID_TOTAL } from "./types";

export type OutputSizeId =
  | "monitor"
  | "sns-landscape"
  | "square"
  | "portrait"
  | "a4-landscape"
  | "a4-portrait";

export interface OutputSize {
  id: OutputSizeId;
  label: string;
  // Canvas size in CSS px; the PNG is rendered at 2x.
  width: number;
  // null keeps the canvas as tall as its content (the original layout).
  height: number | null;
  // Columns are picked so 36 cards come close to the canvas ratio; any
  // remaining mismatch is absorbed by scaling the board down to fit.
  cols: number;
  fileSuffix: string;
}

export const OUTPUT_SIZES: Record<OutputSizeId, OutputSize> = {
  monitor: {
    id: "monitor",
    label: "横長（高さ自動）",
    width: 1920,
    height: null,
    cols: 9,
    fileSuffix: "",
  },
  // The fixed landscape canvas the shop posts and shows; the board's own
  // height is about 1,345 px, so it sits centred with a thin margin.
  "sns-landscape": {
    id: "sns-landscape",
    label: "横長（1920×1355 固定）",
    width: 1920,
    height: 1355,
    cols: 9,
    fileSuffix: "",
  },
  square: {
    id: "square",
    label: "正方形（SNS 1:1）",
    // 1920 keeps 8 columns as wide as the monitor board's cards, so the
    // price text fits; the PNG is 3840 x 3840.
    width: 1920,
    height: 1920,
    cols: 8,
    fileSuffix: "_square",
  },
  portrait: {
    id: "portrait",
    label: "縦長（SNS 4:5）",
    width: 1440,
    height: 1800,
    cols: 6,
    fileSuffix: "_portrait",
  },
  "a4-landscape": {
    id: "a4-landscape",
    label: "A4 横（印刷）",
    width: 1920,
    height: Math.round(1920 / Math.SQRT2),
    cols: 9,
    fileSuffix: "_A4-landscape",
  },
  "a4-portrait": {
    id: "a4-portrait",
    label: "A4 縦（印刷）",
    width: 1440,
    height: Math.round(1440 * Math.SQRT2),
    cols: 6,
    fileSuffix: "_A4-portrait",
  },
};

export const OUTPUT_SIZE_ORDER: OutputSizeId[] = [
  "sns-landscape",
  "monitor",
  "square",
  "portrait",
  "a4-landscape",
  "a4-portrait",
];

// Size given to newly imported sheets; sheets without one stay "monitor".
export const DEFAULT_IMPORT_OUTPUT_SIZE: OutputSizeId = "sns-landscape";

export function resolveOutputSize(id: OutputSizeId | undefined): OutputSize {
  return OUTPUT_SIZES[id ?? "monitor"] ?? OUTPUT_SIZES.monitor;
}

export function getGridRows(size: OutputSize): number {
  return Math.ceil(GRID_TOTAL / size.cols);
}
