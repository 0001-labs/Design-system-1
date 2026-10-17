/**
 * Copy text to the clipboard and say so in a toast, for pages with or
 * without a framework.
 *
 * It writes with the Clipboard API, and where that is missing or refused (a
 * page served over plain HTTP, an older browser) it copies from a hidden field
 * instead. The toast is the shared word "Copied" in the page's language,
 * shown by `<ds-toast>` where the page has one and by the page toaster
 * otherwise; a failure says "Could not copy".
 *
 * It is small on its own: the page toaster (`./toaster.ts`) loads only when a
 * toast is shown and nothing in the page draws toasts yet, so a page that
 * copies with `toast: false`, or has `<ds-toast>`, never loads it. Import it
 * from here, not from `./feedback.ts`, where the page needs nothing else.
 */
import { feedbackWord } from "./feedback-words";
import { toast, toasterListening } from "./toast-queue";

export interface CopyTextOptions {
  /** The toast's words when it is copied; `false` shows no toast at all. "Copied" by default. */
  toast?: string | false;
}

/** The open modal dialog, if any: the rest of the page is inert, so the hidden field goes in it. */
function modalDialog(): HTMLDialogElement | null {
  try {
    return document.querySelector<HTMLDialogElement>("dialog:modal");
  } catch {
    return null;
  }
}

/** The fallback: select the text in a hidden field and copy the selection. */
function copyFromField(text: string): boolean {
  if (typeof document === "undefined" || !document.body) return false;
  const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const selection = document.getSelection();
  const ranges = selection ? Array.from({ length: selection.rangeCount }, (_, index) => selection.getRangeAt(index)) : [];
  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  field.setAttribute("aria-hidden", "true");
  field.tabIndex = -1;
  field.style.cssText = "position:fixed;top:0;left:0;width:1px;height:1px;margin:0;padding:0;border:0;opacity:0;pointer-events:none";
  (modalDialog() ?? document.body).appendChild(field);
  field.focus({ preventScroll: true });
  field.select();
  field.setSelectionRange(0, text.length);
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }
  field.remove();
  active?.focus({ preventScroll: true });
  if (selection) {
    selection.removeAllRanges();
    for (const range of ranges) selection.addRange(range);
  }
  return copied;
}

/**
 * Copy `text` and confirm it with a toast. Resolves to whether it was copied.
 * Call it from the click or key press that asks for it: browsers allow writing
 * to the clipboard only then.
 */
export async function copyText(text: string, options: CopyTextOptions = {}): Promise<boolean> {
  let copied = false;
  const clipboard = typeof navigator === "undefined" ? undefined : navigator.clipboard;
  if (clipboard?.writeText) {
    try {
      await clipboard.writeText(text);
      copied = true;
    } catch {
      copied = false;
    }
  }
  if (!copied) copied = copyFromField(text);
  if (options.toast !== false) await say(copied, copied ? options.toast ?? feedbackWord("Copied") : feedbackWord("Could not copy"));
  return copied;
}

/** The toast, with the page toaster loaded first where nothing in the page draws toasts yet. */
async function say(copied: boolean, words: string): Promise<void> {
  if (!toasterListening()) {
    try {
      (await import("./load-toaster")).pageToaster();
    } catch {
      // No toaster could load: the copy itself still answers.
    }
  }
  if (copied) toast.success(words);
  else toast.error(words);
}
