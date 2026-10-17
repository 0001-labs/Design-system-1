/**
 * The toasts' queue: Sonner's `toast()` calls and the observer that carries
 * them to whatever draws the stack, with no framework.
 *
 * BASED ON SONNER, the React toast library by Emil Kowalski
 * (https://sonner.emilkowal.ski, https://github.com/emilkowalski/sonner, MIT
 * licence). The calls, their options and their ids are Sonner's, so Sonner's
 * documentation describes them.
 *
 * Two toasters draw what it sends, in the same look: `<ds-toast>`
 * (`2-core/ds-toast.ts`, Lit) and the page toaster (`0-face/toaster.ts`, no
 * framework). A page shows one stack whichever it loads: a `<ds-toast>` in the
 * page takes every toast, the page toaster draws only when there is none, and
 * `toast()` with no toaster listening adds a `<ds-toast>` when the element is
 * registered and the page toaster otherwise.
 *
 * The queue lives on `globalThis`, so two copies of this module (a product
 * that vendors Design system 1 in two folders) still feed one stack.
 *
 * Where it departs from Sonner: an error is announced assertively unless it
 * says `important: false`.
 */

export type ToastId = string | number;
export type ToastType = "default" | "success" | "info" | "warning" | "error" | "loading";
export type ToastPosition = "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
/**
 * A button in a toast. Clicking it closes the toast unless `onClick` calls
 * `preventDefault()`, as in Sonner. With `href` it is a link instead (not in
 * Sonner), which still closes the toast as the page follows it.
 */
export interface ToastButton { label: string; onClick?: (event: MouseEvent) => void; href?: string }
export interface ToastOptions {
  /** Reuse an id to update a toast in place, as Sonner does. */
  id?: ToastId;
  description?: string;
  /** Milliseconds; `Infinity` keeps the toast until it is dismissed. */
  duration?: number;
  /** A Design system 1 icon name, replacing the type's icon. */
  icon?: string;
  action?: ToastButton;
  cancel?: ToastButton;
  /** False keeps the toast from being swiped or closed by a person. */
  dismissible?: boolean;
  closeButton?: boolean;
  /** Announced assertively instead of politely. Errors are, unless this is false. */
  important?: boolean;
  onDismiss?: (toast: ToastData) => void;
  onAutoClose?: (toast: ToastData) => void;
}
export interface ToastData extends ToastOptions { id: ToastId; title: string; type: ToastType }
type Message<T> = string | ((value: T) => string);
export interface ToastPromiseMessages<T> extends ToastOptions {
  loading: string;
  success: Message<T>;
  error: Message<unknown>;
  finally?: () => void;
}

/** What a toaster hears: a toast to show or update, or a dismissal (every toast when the id is undefined). */
export type ToastSignal = { toast: ToastData } | { dismiss: ToastId | undefined };
type Listener = (signal: ToastSignal) => void;

/** Sonner's constants, shared by both toasters; its gap and offset are rounded to squares in the stylesheet. */
export const TOAST_DURATION = 4000;
export const VISIBLE_TOASTS = 3;
export const TIME_BEFORE_UNMOUNT = 200;
export const SWIPE_THRESHOLD = 45;
export const SWIPE_VELOCITY = 0.11;
/** The Design system 1 icon each type shows. */
export const TOAST_ICONS: Partial<Record<ToastType, string>> = { success: "check", info: "notifications", warning: "warning", error: "warning" };

interface Queue {
  /** `<ds-toast>` elements: when one listens, it takes every toast. */
  toasters: Set<Listener>;
  /** The page toaster, which draws only while no `<ds-toast>` listens. */
  fallbacks: Set<Listener>;
  lastId: number;
  mountFallback?: () => void;
}

const QUEUE = Symbol.for("design-system-1.toasts");

function queue(): Queue {
  const scope = globalThis as unknown as Record<symbol, Queue | undefined>;
  return (scope[QUEUE] ??= { toasters: new Set(), fallbacks: new Set(), lastId: 0 });
}

/**
 * Listen for toasts. A `<ds-toast>` listens as a toaster; the page toaster
 * listens as the fallback, hearing new toasts only while no toaster listens.
 * Returns the function that stops listening.
 */
export function listenForToasts(listener: Listener, { fallback = false }: { fallback?: boolean } = {}): () => void {
  const listeners = fallback ? queue().fallbacks : queue().toasters;
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/**
 * Whether a toast shown now is drawn: a toaster listens, the page toaster is
 * loaded, or `<ds-toast>` is registered (and so is added to the page).
 */
export function toasterListening(): boolean {
  const state = queue();
  return state.toasters.size > 0 || state.fallbacks.size > 0 || !!state.mountFallback || (typeof customElements !== "undefined" && !!customElements.get("ds-toast"));
}

/** How the page toaster mounts itself when a toast arrives and nothing draws it. */
export function setFallbackToaster(mount: () => void): void {
  queue().mountFallback = mount;
}

function show(title: string, type: ToastType, options: ToastOptions = {}): ToastId {
  const state = queue();
  const id = options.id ?? ++state.lastId;
  if (!state.toasters.size && typeof document !== "undefined" && document.body) {
    if (typeof customElements !== "undefined" && customElements.get("ds-toast")) document.body.appendChild(document.createElement("ds-toast"));
    else if (!state.fallbacks.size) state.mountFallback?.();
  }
  const important = options.important ?? (type === "error" ? true : undefined);
  const data: ToastData = { ...options, ...(important === undefined ? {} : { important }), id, title, type };
  // A copy: a listener may add or remove listeners while it hears the toast.
  for (const listener of Array.from(state.toasters.size ? state.toasters : state.fallbacks)) listener({ toast: data });
  return id;
}

/** Show a toast, as Sonner's `toast()`. Returns its id. */
export const toast = Object.assign(
  (title: string, options?: ToastOptions): ToastId => show(title, "default", options),
  {
    message: (title: string, options?: ToastOptions): ToastId => show(title, "default", options),
    success: (title: string, options?: ToastOptions): ToastId => show(title, "success", options),
    info: (title: string, options?: ToastOptions): ToastId => show(title, "info", options),
    warning: (title: string, options?: ToastOptions): ToastId => show(title, "warning", options),
    error: (title: string, options?: ToastOptions): ToastId => show(title, "error", options),
    loading: (title: string, options?: ToastOptions): ToastId => show(title, "loading", options),
    /** A loading toast that becomes a success or an error when the promise settles. */
    promise<T>(promise: Promise<T> | (() => Promise<T>), messages: ToastPromiseMessages<T>): ToastId {
      const { loading, success, error, finally: done, ...options } = messages;
      const id = show(loading, "loading", options);
      Promise.resolve(typeof promise === "function" ? promise() : promise)
        .then(
          value => { show(typeof success === "function" ? success(value) : success, "success", { ...options, id }); },
          reason => { show(typeof error === "function" ? error(reason) : error, "error", { ...options, id }); },
        )
        .finally(() => done?.());
      return id;
    },
    /** Dismiss one toast, or every toast without an id. */
    dismiss(id?: ToastId): ToastId | undefined {
      const state = queue();
      for (const listener of [...state.toasters, ...state.fallbacks]) listener({ dismiss: id });
      return id;
    },
  },
);
