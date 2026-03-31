import { NextRequest, NextResponse } from "next/server";
import { Card } from "@/lib/types";

interface DownloadRequest {
  cards: Card[];
}

export const runtime = "nodejs";

function isPrivateHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  if (["localhost", "127.0.0.1", "::1"].includes(normalized)) return true;
  if (/^10\./.test(normalized)) return true;
  if (/^192\.168\./.test(normalized)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(normalized)) return true;
  return false;
}

async function downloadImage(url: string): Promise<string | null> {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    if (isPrivateHostname(parsed.hostname)) return null;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return null;

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const contentType = response.headers.get("content-type") || "image/jpeg";
    return `data:${contentType};base64,${base64}`;
  } catch {
    console.error(`Failed to download: ${url}`);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: DownloadRequest = await request.json();
    const { cards } = body;

    const concurrency = 6;
    const results: (string | null)[] = new Array(cards.length).fill(null);

    for (let i = 0; i < cards.length; i += concurrency) {
      const batch = cards.slice(i, i + concurrency);
      const promises = batch.map((card, index) =>
        downloadImage(card.imageUrl).then((data) => {
          results[i + index] = data;
        })
      );
      await Promise.all(promises);
    }

    return NextResponse.json({
      cards: cards.map((card, index) => ({
        ...card,
        imageData: results[index] ?? undefined,
      })),
    });
  } catch (error) {
    console.error("Image download error:", error);
    return NextResponse.json(
      { error: "Failed to download images" },
      { status: 500 }
    );
  }
}
