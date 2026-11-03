import { NextRequest, NextResponse } from "next/server";
import { checkImageUrls } from "@/lib/image-fetcher";

export const runtime = "nodejs";

// Warms the server-side image cache and reports per-URL status. Image bytes
// stay on the server; generate-png embeds them from the cache.
export async function POST(request: NextRequest) {
  try {
    const body: { urls?: unknown } = await request.json();
    const urls = Array.isArray(body.urls) ? body.urls.map((url) => String(url ?? "")) : [];
    return NextResponse.json({ statuses: await checkImageUrls(urls) });
  } catch (error) {
    console.error("Image download error:", error);
    return NextResponse.json(
      { error: "Failed to download images" },
      { status: 500 }
    );
  }
}
