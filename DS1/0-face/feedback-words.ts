/**
 * The words the feedback module shows by default (OK, Cancel, Close, Copied,
 * Could not copy, Notifications), without importing the language runtime.
 *
 * - Where the page loads the language module (`./i18n.ts`, Sync 1's
 *   `languages` export), it registers its `translate()` here when it loads,
 *   and the words are the shared words in the page's language once
 *   `configureI18n({ sharedWords: true })` turns them on.
 * - Where it does not, they read English, and no language module, no
 *   translation file and no request comes with them.
 * - `setFeedbackWords()` gives the module words of the product's own: a table
 *   of the words it changes, or a function that translates each key.
 */

export type FeedbackWord = "OK" | "Cancel" | "Close" | "Copied" | "Could not copy" | "Notifications";
/** A table of the words to change, or a function that gives each word in the page's language. */
export type FeedbackWords = Partial<Record<FeedbackWord, string>> | ((word: FeedbackWord) => string);

/** Where the language module leaves its `translate()`; on `globalThis`, so every copy of either module finds it. */
const TRANSLATOR = Symbol.for("design-system-1.translate");

let words: FeedbackWords | null = null;

/** Give the feedback module's default words, or `null` to go back to the language module's (or English). */
export function setFeedbackWords(next: FeedbackWords | null): void {
  words = next;
}

/** A default word in the page's language. */
export function feedbackWord(word: FeedbackWord): string {
  if (typeof words === "function") return words(word);
  const own = words?.[word];
  if (own !== undefined) return own;
  const translate = (globalThis as unknown as Record<symbol, unknown>)[TRANSLATOR];
  return typeof translate === "function" ? String(translate(word)) : word;
}
