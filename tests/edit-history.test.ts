import test from "node:test";
import assert from "node:assert/strict";
import { EditHistory } from "../src/lib/edit-history";

test("undo and redo walk back and forth through recorded states", () => {
  const history = new EditHistory<string>(50, 0);
  history.record("a", 1000);
  history.record("b", 2000);

  assert.equal(history.undo("c"), "b");
  assert.equal(history.undo("b"), "a");
  assert.equal(history.undo("a"), null);
  assert.equal(history.redo("a"), "b");
  assert.equal(history.redo("b"), "c");
  assert.equal(history.canRedo, false);
});

test("changes inside the merge window share one undo step", () => {
  const history = new EditHistory<string>(50, 800);
  history.record("T", 1000);
  history.record("Ti", 1200);
  history.record("Tit", 1400);

  assert.equal(history.undo("Titl"), "T");
  assert.equal(history.canUndo, false);
});

test("a new change after undo drops the redo branch", () => {
  const history = new EditHistory<number>(50, 0);
  history.record(1, 1000);
  assert.equal(history.undo(2), 1);
  history.record(1, 3000);

  assert.equal(history.canRedo, false);
});

test("history keeps at most the configured number of steps", () => {
  const history = new EditHistory<number>(3, 0);
  for (let value = 0; value < 5; value++) history.record(value, value * 1000);

  assert.equal(history.undo(5), 4);
  assert.equal(history.undo(4), 3);
  assert.equal(history.undo(3), 2);
  assert.equal(history.undo(2), null);
});
