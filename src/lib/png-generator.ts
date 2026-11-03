import { readFile } from "node:fs/promises";
import path from "node:path";

type Browser = Awaited<ReturnType<typeof import("playwright")["chromium"]["launch"]>>;

let browserInstance: Browser | null = null;
const MTG_CARD_BACK_SRC = "/mtg-card-back.png";

// setContent has no origin, so app-relative assets are inlined.
async function inlineLocalAssets(html: string): Promise<string> {
  if (!html.includes(MTG_CARD_BACK_SRC)) return html;
  const cardBack = await readFile(path.join(process.cwd(), "public", "mtg-card-back.png"));
  const dataUrl = `data:image/png;base64,${cardBack.toString("base64")}`;
  return html.split(`src="${MTG_CARD_BACK_SRC}"`).join(`src="${dataUrl}"`);
}

async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.isConnected()) {
    const { chromium } = await import("playwright");
    browserInstance = await chromium.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }

  return browserInstance;
}

export async function generatePng(html: string, width = 1920): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage({
    viewport: { width, height: 1200 },
    deviceScaleFactor: 2,
  });

  try {
    await page.setContent(await inlineLocalAssets(html), { waitUntil: "domcontentloaded" });

    await page
      .waitForFunction(
        () =>
          document.documentElement.classList.contains("wf-active") ||
          document.documentElement.classList.contains("wf-inactive"),
        null,
        { timeout: 8500 }
      )
      .catch(() => undefined);

    await page.evaluate(() => document.fonts?.ready).catch(() => undefined);

    await page.evaluate(() =>
      Promise.all(
        Array.from(document.images)
          .filter((img) => !img.complete)
          .map(
            (img) =>
              new Promise<void>((resolve) => {
                img.onload = () => resolve();
                img.onerror = () => resolve();
              })
          )
      )
    );

    await page.evaluate(() =>
      (window as Window & { __fitPanel?: () => void }).__fitPanel?.()
    );

    const screenshot = await page.screenshot({
      fullPage: true,
      type: "png",
    });

    return Buffer.from(screenshot);
  } finally {
    await page.close();
  }
}

export async function closeBrowser(): Promise<void> {
  if (!browserInstance) return;
  await browserInstance.close();
  browserInstance = null;
}
