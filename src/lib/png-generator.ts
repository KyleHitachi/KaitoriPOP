import { EXPORT_CANVAS_HEIGHT, EXPORT_CANVAS_WIDTH } from "./layout-tokens";
import { readFile } from "node:fs/promises";
import path from "node:path";

type Browser = Awaited<ReturnType<typeof import("playwright")["chromium"]["launch"]>>;

let browserInstance: Browser | null = null;
const MTG_CARD_BACK_SRC = "/mtg-card-back.png";

async function inlineLocalAssets(html: string): Promise<string> {
  if (!html.includes(MTG_CARD_BACK_SRC)) return html;

  const cardBack = await readFile(
    path.join(process.cwd(), "public", "mtg-card-back.png")
  );
  const dataUrl = `data:image/png;base64,${cardBack.toString("base64")}`;
  return html.split(MTG_CARD_BACK_SRC).join(dataUrl);
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

export async function generatePng(html: string): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage({
    viewport: { width: EXPORT_CANVAS_WIDTH, height: EXPORT_CANVAS_HEIGHT },
    deviceScaleFactor: 2,
  });

  try {
    await page.setContent(await inlineLocalAssets(html), {
      waitUntil: "domcontentloaded",
    });

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

    const screenshot = await page.screenshot({
      type: "png",
      clip: {
        x: 0,
        y: 0,
        width: EXPORT_CANVAS_WIDTH,
        height: EXPORT_CANVAS_HEIGHT,
      },
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
