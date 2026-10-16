/**
 * Feedback without Lit: toasts, dialogs that answer with a promise, and
 * copying text, from one import and with no framework. Use it in place of the
 * browser's `alert()`, `confirm()` and `prompt()`, and of a page's own toasts
 * and copy buttons.
 *
 *   import { toast, confirm, prompt, alert, copyText } from "…/0-face/feedback";
 *
 *   toast.success("Saved");
 *   if (await confirm({ title: "Delete this track?", confirm: "Delete", danger: true })) remove();
 *   const name = await prompt({ title: "Rename", value: track.name });
 *   await copyText(link);
 *
 * - `toast()` is Sonner's, as in `<ds-toast>` (based on Sonner, MIT licence):
 *   the same calls, options and stack, drawn by the page toaster
 *   (`./toaster.ts`) on a page without Lit and by `<ds-toast>` where the page
 *   has one. `configureToaster()` takes Sonner's `<Toaster />` props.
 * - `alert()`, `confirm()` and `prompt()` are drawn on the native
 *   `dialog.ds-dialog` frame from `1-root/controls.css`, which the page loads.
 * - Default words are the shared words in the page's language, through the
 *   language module (`./i18n.ts`): turn them on with
 *   `configureI18n({ sharedWords: true })`; without it they read English.
 */
export { configureToaster, pageToaster, toast } from "./toaster";
export type { ToasterOptions } from "./toaster";
export type { ToastButton, ToastData, ToastId, ToastOptions, ToastPosition, ToastPromiseMessages, ToastType } from "./toast-queue";
export { alert, confirm, prompt } from "./dialogs";
export type { AlertOptions, ConfirmOptions, PromptOptions } from "./dialogs";
export { copyText } from "./copy-text";
export type { CopyTextOptions } from "./copy-text";
