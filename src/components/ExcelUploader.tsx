"use client";

import { useCallback, useState } from "react";

interface Props {
  onUpload: (file: File) => void;
  loading: boolean;
}

const COPY = {
  loadingTitle: "\u0045\u0078\u0063\u0065\u006c\u0020\u002f\u0020\u0043\u0053\u0056\u0020\u3092\u8aad\u307f\u8fbc\u307f\u4e2d\u002e\u002e\u002e",
  loadingBody:
    "\u30c7\u30fc\u30bf\u3092\u89e3\u6790\u3057\u3066\u7de8\u96c6\u7528\u306e\u30b7\u30fc\u30c8\u3092\u4f5c\u6210\u3057\u3066\u3044\u307e\u3059\u3002",
  title:
    "\u0045\u0078\u0063\u0065\u006c\u0020\u002f\u0020\u0043\u0053\u0056\u0020\u3092\u8aad\u307f\u8fbc\u3080",
  body:
    "\u30c9\u30e9\u30c3\u30b0\u0026\u30c9\u30ed\u30c3\u30d7\u3001\u307e\u305f\u306f\u30af\u30ea\u30c3\u30af\u3057\u3066\u0020\u0060\u002e\u0078\u006c\u0073\u0078\u0060\u0020\u002f\u0020\u0060\u002e\u0063\u0073\u0076\u0060\u0020\u3092\u9078\u629e\u3057\u3066\u304f\u3060\u3055\u3044\u3002",
  badge:
    "\u0060\u002e\u0078\u006c\u0073\u0078\u0060\u0020\u002f\u0020\u0060\u002e\u0063\u0073\u0076\u0060\u0020\u306b\u5bfe\u5fdc",
};

function isSupportedFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return lower.endsWith(".xlsx") || lower.endsWith(".csv");
}

export default function ExcelUploader({ onUpload, loading }: Props) {
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
      className={`group cursor-pointer rounded-[24px] border-2 border-dashed p-12 text-center transition-all ${
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
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-stone-200 bg-white shadow-sm transition group-hover:scale-105">
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
            <p className="text-xl font-black tracking-tight text-stone-900">
              {COPY.title}
            </p>
            <p className="text-sm text-stone-600">{COPY.body}</p>
          </div>

          <div className="rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-semibold tracking-[0.18em] text-stone-500">
            {COPY.badge}
          </div>
        </div>
      )}
    </div>
  );
}
