/** Debounce and flush policy for draft autosave. */
export const AUTOSAVE_DEBOUNCE_MS = 1200;

/**
 * Hard checkpoint while the user keeps editing.
 *
 * A long spacing-handle drag emits changes continuously, so a pure debounce
 * would never fire until the drag ended.
 */
export const AUTOSAVE_MAX_WAIT_MS = 8000;

export type SaveState = "saved" | "dirty" | "saving" | "conflict" | "offline" | "error";

export interface PendingDraft {
  css: string;
  config: string;
  baseRev: number;
  savedAt: number;
}

export function localDraftKey(libraryId: string): string {
  return `ds1.draft.${libraryId}`;
}

/**
 * Keep unsaved work on the device when the network is gone.
 *
 * Storage can throw — Safari private mode, quota — and losing the ability to
 * cache offline must never take the editor down with it.
 */
export function stashLocalDraft(libraryId: string, draft: PendingDraft): void {
  try {
    localStorage.setItem(localDraftKey(libraryId), JSON.stringify(draft));
  } catch {
    /* best effort */
  }
}

export function readLocalDraft(libraryId: string): PendingDraft | null {
  try {
    const raw = localStorage.getItem(localDraftKey(libraryId));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<PendingDraft>;
    if (typeof parsed.css !== "string" || typeof parsed.baseRev !== "number") return null;

    return {
      css: parsed.css,
      config: typeof parsed.config === "string" ? parsed.config : "{}",
      baseRev: parsed.baseRev,
      savedAt: typeof parsed.savedAt === "number" ? parsed.savedAt : 0,
    };
  } catch {
    return null;
  }
}

export function clearLocalDraft(libraryId: string): void {
  try {
    localStorage.removeItem(localDraftKey(libraryId));
  } catch {
    /* best effort */
  }
}

/** Retry backoff for a failed save: 1s, 2s, 4s … capped at 30s. */
export function backoffMs(attempt: number): number {
  return Math.min(30_000, 1000 * 2 ** Math.max(0, attempt - 1));
}
