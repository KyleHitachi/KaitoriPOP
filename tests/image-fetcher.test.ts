import test from "node:test";
import assert from "node:assert/strict";
import {
  hasRealImageUrl,
  mapWithConcurrency,
  needsScryfallApiThrottle,
} from "../src/lib/image-fetcher";

test("only api.scryfall.com is throttled; the image CDN is not", () => {
  assert.equal(needsScryfallApiThrottle("api.scryfall.com"), true);
  assert.equal(needsScryfallApiThrottle("cards.scryfall.io"), false);
  assert.equal(needsScryfallApiThrottle("example.org"), false);
});

test("blank and example.com image URLs count as no image", () => {
  assert.equal(hasRealImageUrl(""), false);
  assert.equal(hasRealImageUrl("  "), false);
  assert.equal(hasRealImageUrl("https://example.com/card.png"), false);
  assert.equal(hasRealImageUrl("https://cards.scryfall.io/large/front/a.jpg"), true);
});

test("mapWithConcurrency keeps order and caps parallel work", async () => {
  let running = 0;
  let peak = 0;
  const results = await mapWithConcurrency([5, 1, 4, 2, 3, 0], 3, async (delay, index) => {
    running++;
    peak = Math.max(peak, running);
    await new Promise((resolve) => setTimeout(resolve, delay * 5));
    running--;
    return index * 10;
  });

  assert.deepEqual(results, [0, 10, 20, 30, 40, 50]);
  assert.equal(peak, 3);
});

test("mapWithConcurrency handles an empty list", async () => {
  assert.deepEqual(await mapWithConcurrency([], 4, async () => 1), []);
});
