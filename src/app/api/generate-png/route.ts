import { NextRequest, NextResponse } from "next/server";
import { SheetConfig } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body: { config: SheetConfig } = await request.json();
    const { config } = body;

    const [{ renderBuylistHtml }, { generatePng }] = await Promise.all([
      import("@/lib/html-renderer"),
      import("@/lib/png-generator"),
    ]);

    const html = renderBuylistHtml(config);
    const pngBuffer = await generatePng(html);

    return new NextResponse(new Uint8Array(pngBuffer), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(config.sheetName)}.png"`,
      },
    });
  } catch (error) {
    console.error("PNG generation error:", error);
    const detail =
      error instanceof Error ? error.message : "Failed to generate PNG";
    const message = /Executable doesn't exist|browserType\.launch|playwright/i.test(
      detail
    )
      ? "PNG の生成に失敗しました。Playwright の Chromium が見つかりません。`npx playwright install chromium` を実行してから再試行してください。"
      : `PNG の生成に失敗しました。${detail}`;
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
