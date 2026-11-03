// Undo/redo stack for whole-board snapshots. Changes that arrive in quick
// succession (typing a title, a burst of setting tweaks) share one entry so
// a single undo reverts the whole burst.
export class EditHistory<T> {
  private past: T[] = [];
  private future: T[] = [];
  private lastRecordAt = Number.NEGATIVE_INFINITY;

  constructor(
    private readonly limit = 50,
    private readonly mergeWindowMs = 800
  ) {}

  get canUndo(): boolean {
    return this.past.length > 0;
  }

  get canRedo(): boolean {
    return this.future.length > 0;
  }

  record(previous: T, now = Date.now()): void {
    if (now - this.lastRecordAt > this.mergeWindowMs) {
      this.past.push(previous);
      if (this.past.length > this.limit) this.past.shift();
    }
    this.lastRecordAt = now;
    this.future = [];
  }

  undo(current: T): T | null {
    const previous = this.past.pop();
    if (previous === undefined) return null;
    this.future.push(current);
    this.lastRecordAt = Number.NEGATIVE_INFINITY;
    return previous;
  }

  redo(current: T): T | null {
    const next = this.future.pop();
    if (next === undefined) return null;
    this.past.push(current);
    this.lastRecordAt = Number.NEGATIVE_INFINITY;
    return next;
  }

  clear(): void {
    this.past = [];
    this.future = [];
    this.lastRecordAt = Number.NEGATIVE_INFINITY;
  }
}
