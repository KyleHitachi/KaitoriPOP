import test from "node:test";
import assert from "node:assert/strict";
import { buildUniqueFileNames, crc32, createZip } from "../src/lib/zip";

test("crc32 matches the standard check value", () => {
  assert.equal(crc32(new TextEncoder().encode("123456789")), 0xcbf43926);
});

// Reads the central directory the way unzip tools do, so the test does not
// depend on an external unzip (Git Bash's ignores the UTF-8 name flag).
function readZip(zip: Uint8Array): { name: string; utf8: boolean; data: Uint8Array }[] {
  const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  const endOffset = zip.length - 22;
  assert.equal(view.getUint32(endOffset, true), 0x06054b50);
  const count = view.getUint16(endOffset + 10, true);
  let position = view.getUint32(endOffset + 16, true);
  const decoder = new TextDecoder();
  const entries = [];

  for (let i = 0; i < count; i++) {
    assert.equal(view.getUint32(position, true), 0x02014b50);
    const flags = view.getUint16(position + 8, true);
    const crc = view.getUint32(position + 16, true);
    const size = view.getUint32(position + 20, true);
    const nameLength = view.getUint16(position + 28, true);
    const localOffset = view.getUint32(position + 42, true);
    const name = decoder.decode(zip.subarray(position + 46, position + 46 + nameLength));

    assert.equal(view.getUint32(localOffset, true), 0x04034b50);
    const localNameLength = view.getUint16(localOffset + 26, true);
    const dataStart = localOffset + 30 + localNameLength;
    const data = zip.subarray(dataStart, dataStart + size);
    assert.equal(crc32(data), crc);

    entries.push({ name, utf8: (flags & 0x0800) !== 0, data });
    position += 46 + nameLength;
  }
  return entries;
}

test("createZip stores entries with UTF-8 names and valid CRCs", () => {
  const first = new Uint8Array([137, 80, 78, 71, 1, 2, 3]);
  const second = new TextEncoder().encode("second file");
  const entries = readZip(
    createZip([
      { name: "ハイエンド.png", data: first },
      { name: "EDH.png", data: second },
    ])
  );

  assert.deepEqual(
    entries.map((entry) => [entry.name, entry.utf8]),
    [
      ["ハイエンド.png", true],
      ["EDH.png", true],
    ]
  );
  assert.deepEqual(entries[0].data, first);
  assert.deepEqual(entries[1].data, second);
});

test("buildUniqueFileNames strips invalid characters and numbers duplicates", () => {
  assert.deepEqual(
    buildUniqueFileNames(["High/End", "EDH", "edh", "", "EDH"], ".png"),
    ["High_End.png", "EDH.png", "edh-2.png", "sheet.png", "EDH-3.png"]
  );
});
