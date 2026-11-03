import { SheetConfig } from "./types";

export const WORK_FILE_VERSION = 1;

export interface SavedWork {
  version: typeof WORK_FILE_VERSION;
  savedAt: string;
  activeSheet: number;
  sheets: SheetConfig[];
}

const DB_NAME = "kaitori-pop";
const STORE_NAME = "work";
const CURRENT_KEY = "current";

export function buildSavedWork(sheets: SheetConfig[], activeSheet: number): SavedWork {
  return {
    version: WORK_FILE_VERSION,
    savedAt: new Date().toISOString(),
    activeSheet,
    sheets,
  };
}

function isSheetConfig(value: unknown): value is SheetConfig {
  if (!value || typeof value !== "object") return false;
  const sheet = value as Partial<SheetConfig>;
  return (
    typeof sheet.sheetName === "string" &&
    Array.isArray(sheet.cards) &&
    Array.isArray(sheet.sortedOrder) &&
    Array.isArray(sheet.rowLabels)
  );
}

// Returns null for anything that is not a work file this version can open.
export function parseSavedWork(value: unknown): SavedWork | null {
  if (!value || typeof value !== "object") return null;
  const work = value as Partial<SavedWork>;
  if (work.version !== WORK_FILE_VERSION) return null;
  if (!Array.isArray(work.sheets) || work.sheets.length === 0) return null;
  if (!work.sheets.every(isSheetConfig)) return null;

  const activeSheet =
    typeof work.activeSheet === "number" &&
    work.activeSheet >= 0 &&
    work.activeSheet < work.sheets.length
      ? work.activeSheet
      : 0;

  return {
    version: WORK_FILE_VERSION,
    savedAt: typeof work.savedAt === "string" ? work.savedAt : "",
    activeSheet,
    sheets: work.sheets,
  };
}

export function parseWorkFileText(text: string): SavedWork | null {
  try {
    return parseSavedWork(JSON.parse(text));
  } catch {
    return null;
  }
}

export function buildWorkFileName(work: SavedWork): string {
  const date = work.savedAt.slice(0, 10).replace(/-/g, "");
  const sheetName = work.sheets[work.activeSheet]?.sheetName ?? "buylist";
  return `kaitori-pop-${sheetName}-${date}.json`;
}

// IndexedDB rather than localStorage: fetched card images make a sheet
// several MB, which is past localStorage's quota.
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function runTransaction<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDatabase();
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, mode);
      const request = action(transaction.objectStore(STORE_NAME));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    db.close();
  }
}

export async function saveCurrentWork(work: SavedWork): Promise<void> {
  await runTransaction("readwrite", (store) => store.put(work, CURRENT_KEY));
}

export async function loadCurrentWork(): Promise<SavedWork | null> {
  const value = await runTransaction("readonly", (store) => store.get(CURRENT_KEY));
  return parseSavedWork(value);
}

export async function clearCurrentWork(): Promise<void> {
  await runTransaction("readwrite", (store) => store.delete(CURRENT_KEY));
}
