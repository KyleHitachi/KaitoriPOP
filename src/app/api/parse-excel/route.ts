import { NextRequest, NextResponse } from "next/server";
import { parseExcel } from "@/lib/excel-parser";
import { sortSheet } from "@/lib/sort-engine";

export const runtime = "nodejs";

const ERRORS = {
  noFile:
    "\u30d5\u30a1\u30a4\u30eb\u304c\u9078\u629e\u3055\u308c\u3066\u3044\u307e\u305b\u3093\u3002",
  unsupported:
    "\u0060\u002e\u0078\u006c\u0073\u0078\u0060\u0020\u307e\u305f\u306f\u0020\u0060\u002e\u0063\u0073\u0076\u0060\u0020\u30d5\u30a1\u30a4\u30eb\u3092\u9078\u629e\u3057\u3066\u304f\u3060\u3055\u3044\u3002",
  tooLarge:
    "\u30d5\u30a1\u30a4\u30eb\u30b5\u30a4\u30ba\u304c\u5927\u304d\u3059\u304e\u307e\u3059\u3002\u0031\u0030\u004d\u0042\u0020\u4ee5\u4e0b\u306b\u3057\u3066\u304f\u3060\u3055\u3044\u3002",
  parseFailed:
    "\u30d5\u30a1\u30a4\u30eb\u306e\u89e3\u6790\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002\u5217\u69cb\u6210\u3068\u6587\u5b57\u30b3\u30fc\u30c9\u3092\u78ba\u8a8d\u3057\u3066\u304f\u3060\u3055\u3044\u3002",
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const fileName = file?.name.toLowerCase() ?? "";
    const isSupported = fileName.endsWith(".xlsx") || fileName.endsWith(".csv");

    if (!file) {
      return NextResponse.json({ error: ERRORS.noFile }, { status: 400 });
    }

    if (!isSupported) {
      return NextResponse.json({ error: ERRORS.unsupported }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: ERRORS.tooLarge }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const parseResult = parseExcel(buffer, file.name);
    const sortedSheets = parseResult.sheets.map((config) => sortSheet(config));

    return NextResponse.json({
      sheets: sortedSheets,
      warnings: parseResult.warnings,
    });
  } catch (error) {
    console.error("Excel parse error:", error);
    return NextResponse.json({ error: ERRORS.parseFailed }, { status: 500 });
  }
}
