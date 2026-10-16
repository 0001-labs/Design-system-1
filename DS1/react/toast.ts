import { createElement, forwardRef, useEffect, type HTMLAttributes } from "react";
import type { Toaster as ToasterElement, ToastId, ToastOptions, ToastPosition, ToastPromiseMessages } from "../2-core/ds-toast";

/**
 * Toast for React, based on Sonner (https://sonner.emilkowal.ski, MIT licence).
 * The same names as Sonner: import `Toaster` and `toast` from this adapter,
 * then one `<Toaster />` in the app and `toast("Saved")` anywhere.
 *
 * SSR-safe: the Lit element is loaded only in the browser, on the first
 * `<Toaster />` or `toast()`. Calls made before it arrives wait for it, and
 * every call still returns its id at once, as Sonner's do.
 */
type Runtime = typeof import("../2-core/ds-toast").toast;
let runtime: Runtime | undefined;
let loading: Promise<void> | undefined;
const waiting: Array<(toast: Runtime) => void> = [];
let lastId = 0;

function load(): void {
  if (runtime || loading || typeof window === "undefined") return;
  loading = import("../2-core/ds-toast").then(module => {
    runtime = module.toast;
    for (const call of waiting.splice(0)) call(runtime);
  }, () => { loading = undefined; });
}

function run(call: (toast: Runtime) => void): void {
  if (runtime) { call(runtime); return; }
  if (typeof window === "undefined") return;
  waiting.push(call);
  load();
}

type Kind = "message" | "success" | "info" | "warning" | "error" | "loading";
function show(kind: Kind | undefined, title: string, options?: ToastOptions): ToastId {
  const id = options?.id ?? `toast-${++lastId}`;
  run(toast => (kind ? toast[kind] : toast)(title, { ...options, id }));
  return id;
}

/** Show a toast, as Sonner's `toast()`. Returns its id. */
export const toast = Object.assign(
  (title: string, options?: ToastOptions): ToastId => show(undefined, title, options),
  {
    message: (title: string, options?: ToastOptions): ToastId => show("message", title, options),
    success: (title: string, options?: ToastOptions): ToastId => show("success", title, options),
    info: (title: string, options?: ToastOptions): ToastId => show("info", title, options),
    warning: (title: string, options?: ToastOptions): ToastId => show("warning", title, options),
    error: (title: string, options?: ToastOptions): ToastId => show("error", title, options),
    loading: (title: string, options?: ToastOptions): ToastId => show("loading", title, options),
    promise<T>(promise: Promise<T> | (() => Promise<T>), messages: ToastPromiseMessages<T>): ToastId {
      const id = messages.id ?? `toast-${++lastId}`;
      run(toast => toast.promise(promise, { ...messages, id }));
      return id;
    },
    dismiss(id?: ToastId): ToastId | undefined {
      run(toast => toast.dismiss(id));
      return id;
    },
  },
);

export type ToasterProps = HTMLAttributes<ToasterElement> & {
  position?: ToastPosition;
  expand?: boolean;
  visibleToasts?: number;
  duration?: number;
  closeButton?: boolean;
  richColors?: boolean;
  contained?: boolean;
  label?: string;
  closeLabel?: string;
};
export const Toaster = forwardRef<ToasterElement, ToasterProps>(function Toaster({ visibleToasts, closeButton, richColors, closeLabel, expand, contained, ...props }, ref) {
  useEffect(load, []);
  return createElement("ds-toast", {
    ...props, ref,
    "visible-toasts": visibleToasts, "close-label": closeLabel,
    expand: expand || undefined, "close-button": closeButton || undefined, "rich-colors": richColors || undefined, contained: contained || undefined,
  });
});
export type { ToastButton, ToastData, ToastId, ToastOptions, ToastPosition, ToastPromiseMessages, ToastType } from "../2-core/ds-toast";
