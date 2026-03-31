type Browser = Awaited<ReturnType<typeof import("playwright")["chromium"]["launch"]>>;

let browserInstance: Browser | null = null;

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
    viewport: { width: 1920, height: 1200 },
    deviceScaleFactor: 2,
  });

  try {
    await page.setContent(html, { waitUntil: "domcontentloaded" });

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
