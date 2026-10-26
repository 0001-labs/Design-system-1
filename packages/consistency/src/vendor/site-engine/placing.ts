/**
 * Where the bar over a word being edited stands. The word is in the framed
 * page and the bar in the app over the frame, so its place is worked out from
 * the frame's rectangle in the window and the word's rectangle in the frame:
 * half a square above the word with its start at the word's, below the word
 * when there is no room above, held inside the frame, and away when the word
 * has scrolled out of sight. Edit text over a button on the page stands the
 * same way, over the button. Nothing here touches the DOM, so the tests read
 * it directly.
 */

export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** The bar's place in the window (for `position: fixed`), or null while the word is out of sight. */
export function placeBar(frame: Box, word: { left: number; top: number; bottom: number }, bar: { width: number; height: number }, gap: number): { left: number; top: number } | null {
  if (word.bottom < 0 || word.top > frame.height) return null;
  const above = word.top - gap - bar.height;
  const below = word.bottom + gap;
  // Above when it fits, below when that fits, else at the frame's top over a word taller than the frame.
  const top = above >= 0 ? above : below + bar.height <= frame.height ? below : 0;
  const left = Math.min(Math.max(word.left, 0), Math.max(0, frame.width - bar.width));
  return { left: frame.left + left, top: frame.top + top };
}
