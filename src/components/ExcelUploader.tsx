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
    "ファイルを選ぶ",
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
      className={`group cursor-pointer border px-8 py-14 transition-colors duration-300 sm:px-12 sm:py-20 ${
        dragOver ? "border-ink bg-surface" : "border-line hover:border-ink"
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
        <div className="flex items-center gap-6">
          <div className="h-10 w-10 shrink-0 animate-spin rounded-full border border-ink border-t-transparent" />
          <div>
            <p className="text-2xl font-light">{COPY.loadingTitle}</p>
            <p className="mt-2 text-[13px] text-ink-2">{COPY.loadingBody}</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div className="flex items-start gap-6">
            <svg
              className="mt-1 h-9 w-9 shrink-0 text-ink transition-transform duration-300 group-hover:-translate-y-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 16V4m0 0l-5 5m5-5l5 5M4 20h16" />
            </svg>
            <div>
              <p className="text-2xl font-light tracking-[-0.01em] sm:text-[28px]">{COPY.title}</p>
              <p className="mt-3 text-[13px] text-ink-2">
                Excel・CSV をここにドロップ、またはクリックして選択（XLSX・CSV 対応）
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onLoadSample && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onLoadSample();
                }}
                className="ui-btn"
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
