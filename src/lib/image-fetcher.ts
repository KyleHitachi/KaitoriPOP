import { Card, ImageStatus } from "./types";

const API_REQUEST_DELAY_MS = 500;
const CACHE_TTL_MS = 60 * 60 * 1000;
const DOWNLOAD_CONCURRENCY = 6;
const RETRY_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

const imageCache = new Map<string, { data: string; expiresAt: number }>();
const inFlight = new Map<string, Promise<string | null>>();
let apiQueue = Promise.resolve();
let lastApiRequestAt = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isPrivateHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  if (["localhost", "127.0.0.1", "::1"].includes(normalized)) return true;
  if (/^10\./.test(normalized)) return true;
  if (/^192\.168\./.test(normalized)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(normalized)) return true;
  return false;
}

// Scryfall rate-limits only api.scryfall.com (e.g. /cards/named?format=image
// redirects). Its image origins at *.scryfall.io have no rate limit, so they
// download in parallel like any other host.
export function needsScryfallApiThrottle(hostname: string): boolean {
  return hostname.toLowerCase() === "api.scryfall.com";
}

// URLs that are known to have no real image; the renderer shows a placeholder.
export function hasRealImageUrl(url: string): boolean {
  const trimmed = url.trim();
  return trimmed !== "" && !/^https?:\/\/example\.com\//i.test(trimmed);
}

function parseRetryAfter(value: string | null): number | null {
  if (!value) return null;

  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);

  const date = Date.parse(value);
  if (Number.isNaN(date)) return null;
  return Math.max(0, date - Date.now());
}

async function runWithApiThrottle<T>(task: () => Promise<T>): Promise<T> {
  const run = apiQueue
    .catch(() => undefined)
    .then(async () => {
      const elapsed = Date.now() - lastApiRequestAt;
      if (elapsed < API_REQUEST_DELAY_MS) {
        await sleep(API_REQUEST_DELAY_MS - elapsed);
      }
      lastApiRequestAt = Date.now();
      return task();
    });

  apiQueue = run.then(() => undefined, () => undefined);
  return run;
}

export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  task: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;

  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await task(items[index], index);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(Math.max(limit, 1), items.length) }, worker)
  );
  return results;
}

async function downloadImageUncached(url: string): Promise<string | null> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  if (!["http:", "https:"].includes(parsed.protocol)) return null;
  if (isPrivateHostname(parsed.hostname)) return null;

  const fetchImage = async (): Promise<string | null> => {
    const response = await fetch(url, {
      headers: {
        Accept: "image/avif,image/webp,image/png,image/jpeg,image/*,*/*;q=0.8",
        "User-Agent": "KaitoriPOP/0.1 (local buylist image renderer)",
      },
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      const retryAfter = parseRetryAfter(response.headers.get("retry-after"));
      if (retryAfter !== null) await sleep(retryAfter);
      if (RETRY_STATUSES.has(response.status)) {
        throw new Error(`Retryable image response ${response.status}`);
      }
      console.warn(`Image download returned ${response.status}: ${url}`);
      return null;
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/jpeg";
    return `data:${contentType};base64,${Buffer.from(buffer).toString("base64")}`;
  };

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      if (attempt > 0) await sleep(1500 * attempt);
      return needsScryfallApiThrottle(parsed.hostname)
        ? await runWithApiThrottle(fetchImage)
        : await fetchImage();
    } catch (error) {
      if (attempt === 2) console.error(`Failed to download: ${url}`, error);
    }
  }

  return null;
}

export async function downloadImage(url: string): Promise<string | null> {
  const trimmedUrl = url.trim();
  const cached = imageCache.get(trimmedUrl);
  if (cached && cached.expiresAt > Date.now()) return cached.data;
  if (cached) imageCache.delete(trimmedUrl);

  // The same card often appears on several sheets; share one download.
  const pending = inFlight.get(trimmedUrl);
  if (pending) return pending;

  const promise = downloadImageUncached(trimmedUrl)
    .then((data) => {
      if (data) {
        imageCache.set(trimmedUrl, { data, expiresAt: Date.now() + CACHE_TTL_MS });
      }
      return data;
    })
    .finally(() => inFlight.delete(trimmedUrl));
  inFlight.set(trimmedUrl, promise);
  return promise;
}

export async function checkImageUrls(urls: string[]): Promise<ImageStatus[]> {
  return mapWithConcurrency(urls, DOWNLOAD_CONCURRENCY, async (url) => {
    if (!hasRealImageUrl(url)) return "none";
    return (await downloadImage(url)) ? "ok" : "failed";
  });
}

// Embeds card images for the PNG renderer. The browser never receives the
// image bytes; it only keeps each card's status.
export async function embedCardImages(cards: Card[]): Promise<Card[]> {
  return mapWithConcurrency(cards, DOWNLOAD_CONCURRENCY, async (card) => {
    if (card.imageData || !hasRealImageUrl(card.imageUrl)) return card;
    const imageData = await downloadImage(card.imageUrl);
    return imageData ? { ...card, imageData } : card;
  });
}
