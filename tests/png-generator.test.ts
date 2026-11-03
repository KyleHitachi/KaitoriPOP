import test, { after } from "node:test";
import assert from "node:assert/strict";
import { closeBrowser, generatePng } from "../src/lib/png-generator";

after(async () => {
  await closeBrowser();
});

test("generatePng always exports the SNS canvas at 3840 by 2710", async () => {
  const png = await generatePng(`<!doctype html>
    <html><head><style>*{margin:0}body{background:#fff}</style></head>
    <body><main style="width:1920px;height:200px">test</main></body></html>`);

  assert.equal(png.readUInt32BE(16), 3840);
  assert.equal(png.readUInt32BE(20), 2710);
});
