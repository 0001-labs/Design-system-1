/**
 * The page toaster as copyText loads it, when it shows a toast and nothing in
 * the page draws toasts yet. Its own module, so a bundler splits the toaster
 * off for a page that imports copyText alone (`./copy-text.ts`), and keeps it
 * where the page imports it anyway (`./feedback.ts`) without a warning.
 */
export { pageToaster } from "./toaster";
