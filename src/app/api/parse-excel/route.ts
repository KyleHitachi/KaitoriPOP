import { NextRequest, NextResponse } from "next/server";
import { parseExcel } from "@/lib/excel-parser";

export const runtime = "nodejs";

const ERRORS = {
  noFile:
    "ファイルが選択されていません。",
  unsupported:
    "`.xlsx` または `.csv` ファイルを選択してください。",
  tooLarge:
    "ファイルサイズが大きすぎます。10MB 以下にしてください。",
  parseFailed:
    "ファイルの解析に失敗しました。列構成と文字コードを確認してください。",
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

    return NextResponse.json({
      sheets: parseResult.sheets,
      warnings: parseResult.warnings,
    });
  } catch (error) {
    console.error("Excel parse error:", error);
    return NextResponse.json({ error: ERRORS.parseFailed }, { status: 500 });
  }
}
