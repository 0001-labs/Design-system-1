/**
 * Toast: short messages that stack in a corner of the page and leave on their own.
 *
 * BASED ON SONNER. This component is a Lit port of Sonner, the React toast
 * library by Emil Kowalski (https://sonner.emilkowal.ski,
 * https://github.com/emilkowalski/sonner, MIT licence). Its API and behaviour
 * follow Sonner's, so Sonner's documentation describes how it works:
 *
 * - `toast()`, `toast.success()`, `.info()`, `.warning()`, `.error()`,
 *   `.loading()`, `.message()`, `.promise()` and `.dismiss()` are Sonner's calls,
 *   with Sonner's options (`id`, `description`, `duration`, `action`, `cancel`,
 *   `dismissible`, `closeButton`, `important`, `onDismiss`, `onAutoClose`).
 * - `<ds-toast>` is Sonner's `<Toaster />`, with its `position`, `expand`,
 *   `visible-toasts`, `duration`, `close-button` and `rich-colors`;
 *   `contained` draws it inside its positioned parent instead of the window.
 * - A toast stays 4 seconds; its timer pauses while the stack is hovered,
 *   focused, held or the tab is hidden. Three show at once, stacked behind
 *   one another and spread out on hover. A swipe towards the edge dismisses one,
 *   Alt+T reaches them from the keyboard, and they come and go with Sonner's
 *   400ms slide and fade.
 *
 * Where it departs from Sonner, it follows Design system 1: a toast is drawn as
 * the system's label, an ink chip one control high per line in the tooltip's
 * colours, with no line or shadow, its actions underlined words; the pile
 * advances one square per toast, one square from the edge. Only `transform`
 * and `opacity` animate (a toast stacked behind takes the front one's height at
 * once instead of animating it). `toast()` also adds a `<ds-toast>` to the page
 * when there is none, and moving the element keeps its toasts and their time.
 */
import { LitElement, html, nothing, unsafeCSS } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { define } from "../0-face/define";
import "./ds-icon";
import styles from "./styles/ds-toast.css?inline";

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
  /** Announced assertively instead of politely. */
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

/* Sonner's state: one observer that every toaster listens to. */
type Signal = { toast: ToastData } | { dismiss: ToastId | undefined };
const listeners = new Set<(signal: Signal) => void>();
let lastId = 0;

function show(title: string, type: ToastType, options: ToastOptions = {}): ToastId {
  const id = options.id ?? ++lastId;
  if (!listeners.size && typeof document !== "undefined" && document.body) document.body.append(document.createElement("ds-toast"));
  for (const listener of listeners) listener({ toast: { ...options, id, title, type } });
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
      for (const listener of listeners) listener({ dismiss: id });
      return id;
    },
  },
);

/* Sonner's constants, with its gap and offset rounded to Design system 1's squares in CSS. */
const DURATION = 4000;
const VISIBLE_TOASTS = 3;
const TIME_BEFORE_UNMOUNT = 200;
const SWIPE_THRESHOLD = 45;
const SWIPE_VELOCITY = 0.11;
const ICONS: Partial<Record<ToastType, string>> = { success: "check", info: "notifications", warning: "warning", error: "warning" };

interface Item { data: ToastData; mounted: boolean; removed: boolean; swipeOut: boolean; index: number; offset: number }
interface Timer { remaining: number; started: number; handle?: ReturnType<typeof setTimeout> }

/** The region that shows the toasts, Sonner's `<Toaster />`. Put one in the page. */
export class Toaster extends LitElement {
  static properties = {
    position: { type: String, reflect: true },
    expand: { type: Boolean, reflect: true },
    visibleToasts: { type: Number, attribute: "visible-toasts" },
    duration: { type: Number },
    closeButton: { type: Boolean, attribute: "close-button" },
    richColors: { type: Boolean, attribute: "rich-colors", reflect: true },
    contained: { type: Boolean, reflect: true },
    label: { type: String },
    closeLabel: { type: String, attribute: "close-label" },
    _items: { state: true },
    _hovered: { state: true },
    _focused: { state: true },
  };
  static styles = unsafeCSS(styles);

  declare position: ToastPosition;
  declare expand: boolean;
  declare visibleToasts: number;
  declare duration: number;
  declare closeButton: boolean;
  declare richColors: boolean;
  /** Draw within the nearest positioned ancestor instead of the window. */
  declare contained: boolean;
  /** The region's accessible name; products pass their own words. */
  declare label: string;
  declare closeLabel: string;
  declare private _items: Item[];
  declare private _hovered: boolean;
  declare private _focused: boolean;
  private heights = new Map<ToastId, number>();
  private timers = new Map<ToastId, Timer>();
  private interacting = false;
  private swipe?: { id: ToastId; start: number; time: number; amount: number };
  private resizes = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(() => this.measure());

  constructor() {
    super();
    this.position = "bottom-right";
    this.expand = false;
    this.visibleToasts = VISIBLE_TOASTS;
    this.duration = DURATION;
    this.closeButton = false;
    this.richColors = false;
    this.contained = false;
    this.label = "Notifications";
    this.closeLabel = "Close toast";
    this._items = [];
    this._hovered = false;
    this._focused = false;
  }

  connectedCallback(): void {
    super.connectedCallback();
    listeners.add(this.receive);
    document.addEventListener("keydown", this.hotkey);
    document.addEventListener("visibilitychange", this.syncTimers);
    // Moved to another parent: carry on with the time each toast had left.
    this.requestUpdate();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    listeners.delete(this.receive);
    document.removeEventListener("keydown", this.hotkey);
    document.removeEventListener("visibilitychange", this.syncTimers);
    const now = Date.now();
    for (const timer of this.timers.values()) {
      if (timer.handle === undefined) continue;
      clearTimeout(timer.handle);
      timer.handle = undefined;
      timer.remaining -= now - timer.started;
    }
    this.resizes?.disconnect();
  }

  private get live(): Item[] { return this._items.filter(item => !item.removed); }
  private get expanded(): boolean { return this.expand || ((this._hovered || this._focused) && this.live.length > 0); }
  private get paused(): boolean { return this._hovered || this._focused || this.interacting || document.hidden; }

  private receive = (signal: Signal) => {
    if ("dismiss" in signal) {
      for (const item of this.live) if (signal.dismiss === undefined || item.data.id === signal.dismiss) this.removeToast(item.data.id);
      return;
    }
    const data = signal.toast;
    const current = this.live.find(item => item.data.id === data.id);
    if (current) {
      // An update keeps what it does not change and starts its time again, as in Sonner.
      this._items = this._items.map(item => item === current ? { ...item, data: { ...item.data, ...data } } : item);
      this.clearTimer(data.id);
      return;
    }
    this._items = [{ data, mounted: false, removed: false, swipeOut: false, index: 0, offset: 0 }, ...this._items.filter(item => item.data.id !== data.id)];
  };

  private removeToast(id: ToastId, how: "dismiss" | "auto" | "swipe" = "dismiss") {
    const item = this.live.find(entry => entry.data.id === id);
    if (!item) return;
    this.clearTimer(id);
    this.heights.delete(id);
    (how === "auto" ? item.data.onAutoClose : item.data.onDismiss)?.(item.data);
    const removed = { ...item, removed: true, swipeOut: how === "swipe" };
    this._items = this._items.map(entry => entry === item ? removed : entry);
    setTimeout(() => { this._items = this._items.filter(entry => entry !== removed); }, TIME_BEFORE_UNMOUNT);
  }

  private clearTimer(id: ToastId) {
    clearTimeout(this.timers.get(id)?.handle);
    this.timers.delete(id);
  }

  /** Sonner's timers: each toast keeps its remaining time while the stack is paused. */
  private syncTimers = () => {
    const now = Date.now();
    for (const item of this.live) {
      const { id, type } = item.data;
      const duration = item.data.duration ?? this.duration;
      if (type === "loading" || duration === Infinity) { this.clearTimer(id); continue; }
      let timer = this.timers.get(id);
      if (!timer) { timer = { remaining: duration, started: now }; this.timers.set(id, timer); }
      if (this.paused && timer.handle !== undefined) {
        clearTimeout(timer.handle);
        timer.handle = undefined;
        timer.remaining -= now - timer.started;
      } else if (!this.paused && timer.handle === undefined) {
        timer.started = now;
        timer.handle = setTimeout(() => this.removeToast(id, "auto"), Math.max(0, timer.remaining));
      }
    }
  };

  private hotkey = (event: KeyboardEvent) => {
    const list = this.renderRoot.querySelector("ol");
    if (event.altKey && event.code === "KeyT" && this.live.length) {
      this._focused = true;
      list?.focus();
    } else if (event.key === "Escape" && this._focused) {
      this._focused = false;
    }
  };

  private onFocusOut = (event: FocusEvent) => {
    if (!(event.relatedTarget instanceof Node && this.renderRoot.contains(event.relatedTarget))) this._focused = false;
  };

  private measure() {
    let changed = false;
    for (const body of this.renderRoot.querySelectorAll<HTMLElement>(".body")) {
      const id = this._items.find(item => String(item.data.id) === body.dataset.id && !item.removed)?.data.id;
      if (id === undefined) continue;
      const toast = body.parentElement!;
      const height = body.offsetHeight + toast.offsetHeight - toast.clientHeight;
      if (this.heights.get(id) !== height) { this.heights.set(id, height); changed = true; }
    }
    if (changed) this.requestUpdate();
  }

  protected updated(): void {
    for (const body of this.renderRoot.querySelectorAll<HTMLElement>(".body")) this.resizes?.observe(body);
    this.measure();
    if (!this.live.length) { this._hovered = false; this._focused = false; }
    this.syncTimers();
    if (this._items.some(item => !item.mounted)) {
      // Mount on the next frame so the toast slides in from its edge.
      const frame = typeof requestAnimationFrame === "function" ? requestAnimationFrame : (callback: () => void) => setTimeout(callback, 16);
      frame(() => { this._items = this._items.map(item => item.mounted ? item : { ...item, mounted: true }); });
    }
  }

  private onPointerDown(event: PointerEvent, item: Item) {
    if (item.data.dismissible === false || item.data.type === "loading") return;
    if ((event.composedPath()[0] as Element | undefined)?.closest?.("button, a")) return;
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    this.swipe = { id: item.data.id, start: event.clientY, time: Date.now(), amount: 0 };
    this.interacting = true;
    this.syncTimers();
  }

  private onPointerMove = (event: PointerEvent) => {
    if (!this.swipe) return;
    const toward = this.position.startsWith("top") ? -1 : 1;
    // Only towards the edge the toast came from.
    this.swipe.amount = Math.max(0, (event.clientY - this.swipe.start) * toward);
    const element = event.currentTarget as HTMLElement;
    element.dataset.swiping = "true";
    element.style.setProperty("--swipe", `${this.swipe.amount * toward}px`);
  };

  private onPointerUp = (event: PointerEvent) => {
    const swipe = this.swipe;
    if (!swipe) return;
    this.swipe = undefined;
    this.interacting = false;
    const element = event.currentTarget as HTMLElement;
    delete element.dataset.swiping;
    const velocity = swipe.amount / Math.max(1, Date.now() - swipe.time);
    if (swipe.amount >= SWIPE_THRESHOLD || velocity > SWIPE_VELOCITY) this.removeToast(swipe.id, "swipe");
    else element.style.setProperty("--swipe", "0px");
    this.syncTimers();
  };

  private press(event: MouseEvent, item: Item, button: ToastButton) {
    button.onClick?.(event);
    if (button.href) this.removeToast(item.data.id);
    else if (!event.defaultPrevented) this.removeToast(item.data.id);
  }

  private renderButton(item: Item, button: ToastButton, kind: "cancel" | "action") {
    const press = (event: MouseEvent) => this.press(event, item, button);
    return button.href
      ? html`<a class=${`button ${kind}`} href=${button.href} @click=${press}>${button.label}</a>`
      : html`<button class=${`button ${kind}`} type="button" @click=${press}>${button.label}</button>`;
  }

  private renderIcon(data: ToastData) {
    if (data.type === "loading") return html`<span class="icon" aria-hidden="true"><span class="spinner"></span></span>`;
    const icon = data.icon ?? ICONS[data.type];
    return icon ? html`<span class="icon" aria-hidden="true"><ds-icon .type=${icon}></ds-icon></span>` : nothing;
  }

  private renderToast(item: Item, count: number, frontHeight: number) {
    const { data } = item;
    const dismissible = data.dismissible !== false;
    const closeButton = (data.closeButton ?? this.closeButton) && dismissible;
    return html`<li
      class="toast"
      role="status"
      tabindex="0"
      aria-live=${data.important ? "assertive" : "polite"}
      aria-atomic="true"
      data-type=${data.type}
      data-front=${String(item.index === 0)}
      data-mounted=${String(item.mounted)}
      data-removed=${String(item.removed)}
      data-swipe-out=${String(item.swipeOut)}
      data-visible=${String(item.index < this.visibleToasts)}
      style=${`--index: ${item.index}; --offset: ${item.offset}px; --front-height: ${frontHeight}px; z-index: ${count - item.index}`}
      @pointerdown=${(event: PointerEvent) => this.onPointerDown(event, item)}
      @pointermove=${this.onPointerMove}
      @pointerup=${this.onPointerUp}
      @pointercancel=${this.onPointerUp}
    >
      <div class="body" data-id=${String(data.id)}>
        ${this.renderIcon(data)}
        <div class="content">
          <div class="title">${data.title}</div>
          ${data.description ? html`<div class="description">${data.description}</div>` : nothing}
        </div>
        ${data.cancel ? this.renderButton(item, data.cancel, "cancel") : nothing}
        ${data.action ? this.renderButton(item, data.action, "action") : nothing}
        ${closeButton ? html`<button class="close" type="button" aria-label=${this.closeLabel} @click=${() => this.removeToast(data.id)}><ds-icon type="close"></ds-icon></button>` : nothing}
      </div>
    </li>`;
  }

  render() {
    // Index and offset count live toasts only; one leaving keeps where it was.
    let offset = 0;
    this.live.forEach((item, index) => {
      item.index = index;
      item.offset = offset;
      offset += this.heights.get(item.data.id) ?? 0;
    });
    const live = this.live;
    const frontHeight = live.length ? this.heights.get(live[0]!.data.id) ?? 0 : 0;
    const gaps = Math.max(0, live.length - 1);
    const [y, x] = this.position.split("-") as ["top" | "bottom", "left" | "center" | "right"];
    return html`<section aria-label=${`${this.label} alt+T`} aria-live="polite" aria-relevant="additions text" aria-atomic="false">
      <ol
        tabindex="-1"
        data-y=${y}
        data-x=${x}
        data-expanded=${String(this.expanded)}
        style=${`--height: ${this.expanded ? offset : frontHeight}px; --gaps: ${this.expanded ? gaps : 0}`}
        @pointerenter=${() => { this._hovered = true; }}
        @pointerleave=${() => { if (!this.interacting) this._hovered = false; }}
        @focusin=${() => { this._focused = true; }}
        @focusout=${this.onFocusOut}
      >
        ${repeat(this._items, item => item.data.id, item => this.renderToast(item, this._items.length, frontHeight))}
      </ol>
    </section>`;
  }
}

define("ds-toast", Toaster);

declare global {
  interface HTMLElementTagNameMap { "ds-toast": Toaster }
}
