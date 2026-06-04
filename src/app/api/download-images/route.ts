import { NextRequest, NextResponse } from "next/server";
import { Card } from "@/lib/types";

interface DownloadRequest {
  cards: Card[];
}

export const runtime = "nodejs";

const SCRYFALL_REQUEST_DELAY_MS = 500;
const CACHE_TTL_MS = 60 * 60 * 1000;
const RETRY_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

const imageCache = new Map<string, { data: string; expiresAt: number }>();
let scryfallQueue = Promise.resolve();
let lastScryfallRequestAt = 0;

function isPrivateHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  if (["localhost", "127.0.0.1", "::1"].includes(normalized)) return true;
  if (/^10\./.test(normalized)) return true;
  if (/^192\.168\./.test(normalized)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(normalized)) return true;
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isScryfallHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return (
    normalized === "api.scryfall.com" ||
    normalized.endsWith(".scryfall.com") ||
    normalized.endsWith(".scryfall.io")
  );
}

function parseRetryAfter(value: string | null): number | null {
  if (!value) return null;

  const seconds = Number(value);
  if (Number.isFinite(seconds)) {
    return Math.max(0, seconds * 1000);
  }

  const date = Date.parse(value);
  if (Number.isNaN(date)) return null;

  return Math.max(0, date - Date.now());
}

async function runWithScryfallThrottle<T>(task: () => Promise<T>): Promise<T> {
  const run = scryfallQueue
    .catch(() => undefined)
    .then(async () => {
      const elapsed = Date.now() - lastScryfallRequestAt;
      if (elapsed < SCRYFALL_REQUEST_DELAY_MS) {
        await sleep(SCRYFALL_REQUEST_DELAY_MS - elapsed);
      }

      lastScryfallRequestAt = Date.now();
      return task();
    });

  scryfallQueue = run.then(() => undefined, () => undefined);
  return run;
}

async function downloadImage(url: string): Promise<string | null> {
  const trimmedUrl = url.trim();
  const cached = imageCache.get(trimmedUrl);
  if (cached && cached.expiresAt > Date.now()) return cached.data;
  if (cached) imageCache.delete(trimmedUrl);

  let parsed: URL;

  try {
    parsed = new URL(trimmedUrl);
  } catch {
    return null;
  }

  if (!["http:", "https:"].includes(parsed.protocol)) return null;
  if (isPrivateHostname(parsed.hostname)) return null;

  const fetchImage = async (): Promise<string | null> => {
    const response = await fetch(trimmedUrl, {
      headers: {
        Accept: "image/avif,image/webp,image/png,image/jpeg,image/*,*/*;q=0.8",
        "User-Agent": "KaitoriPOP/0.1 (local buylist image renderer)",
      },
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      const retryAfter = parseRetryAfter(response.headers.get("retry-after"));
      if (retryAfter !== null) {
        await sleep(retryAfter);
      }

      if (RETRY_STATUSES.has(response.status)) {
        throw new Error(`Retryable image response ${response.status}`);
      }

      console.warn(`Image download returned ${response.status}: ${trimmedUrl}`);
      return null;
    }

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const contentType = response.headers.get("content-type") || "image/jpeg";
    return `data:${contentType};base64,${base64}`;
  };

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      if (attempt > 0) {
        await sleep(1500 * attempt);
      }

      const data = isScryfallHostname(parsed.hostname)
        ? await runWithScryfallThrottle(fetchImage)
        : await fetchImage();
      if (data) {
        imageCache.set(trimmedUrl, {
          data,
          expiresAt: Date.now() + CACHE_TTL_MS,
        });
      }
      return data;
    } catch (error) {
      if (attempt === 2) {
        console.error(`Failed to download: ${trimmedUrl}`, error);
      }
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body: DownloadRequest = await request.json();
    const { cards } = body;

    const results: (string | null)[] = new Array(cards.length).fill(null);

    for (let index = 0; index < cards.length; index++) {
      const card = cards[index];
      results[index] = card.imageData ?? await downloadImage(card.imageUrl);
    }

    return NextResponse.json({
      cards: cards.map((card, index) => ({
        ...card,
        imageData: results[index] ?? card.imageData,
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
