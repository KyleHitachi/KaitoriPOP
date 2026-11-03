"use client";

import { useCallback, useState } from "react";

interface Props {
  onUpload: (file: File) => void;
  onLoadSample?: () => void;
  loading: boolean;
}

const COPY = {
  loadingTitle: "Excel / CSV を読み込み中...",
  loadingBody:
    "データを解析して編集用のシートを作成しています。",
  title:
    "買取表PNGを作成",
  body:
    "Excel / CSV をドラッグ&ドロップ、またはクリックして選択してください。",
  badge:
    "`.xlsx` / `.csv` に対応",
  sample: "サンプルCSVで試す",
};

function isSupportedFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return lower.endsWith(".xlsx") || lower.endsWith(".csv");
}

export default function ExcelUploader({ onUpload, onLoadSample, loading }: Props) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setDragOver(false);
      const file = event.dataTransfer.files[0];
      if (file && isSupportedFile(file.name)) {
        onUpload(file);
      }
    },
    [onUpload]
  );

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        onUpload(file);
      }
    },
    [onUpload]
  );

  return (
    <div
      className={`group cursor-pointer rounded-[24px] border-2 border-dashed p-7 text-center transition-all sm:p-12 ${
        dragOver
          ? "border-amber-500 bg-amber-50 shadow-[0_20px_60px_rgba(120,70,5,0.12)]"
          : "border-stone-300 bg-[linear-gradient(180deg,_#fffdf9,_#f8f4ec)] hover:border-stone-400 hover:shadow-[0_20px_60px_rgba(120,70,5,0.08)]"
      }`}
      onDragOver={(event) => {
        event.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => document.getElementById("file-input")?.click()}
    >
      <input
        id="file-input"
        type="file"
        accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        onChange={handleFileSelect}
      />

      {loading ? (
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-amber-200 bg-white shadow-sm">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-amber-500 border-t-transparent" />
          </div>
          <div>
            <p className="text-lg font-semibold text-stone-800">{COPY.loadingTitle}</p>
            <p className="mt-1 text-sm text-stone-500">{COPY.loadingBody}</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-stone-200 bg-white shadow-sm transition group-hover:scale-105 sm:h-20 sm:w-20">
            <svg
              className="h-10 w-10 text-stone-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          <div className="space-y-2">
            <p className="text-lg font-black tracking-tight text-stone-900 sm:text-xl">
              {COPY.title}
            </p>
            <p className="text-sm text-stone-600">
              Excel・CSVをここにドロップ、またはクリックして選択
            </p>
          </div>

          <div className="flex flex-col items-center gap-2 sm:flex-row">
            <div className="rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-semibold tracking-[0.18em] text-stone-500">
              XLSX / CSV 対応
            </div>
            {onLoadSample && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onLoadSample();
                }}
                className="rounded-full bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-amber-700"
              >
                {COPY.sample}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
