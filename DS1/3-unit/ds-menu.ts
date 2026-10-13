import { LitElement, html, unsafeCSS } from "lit";
import { define } from "../0-face/define";
import styles from "./styles/ds-menu.css?inline";

const ITEM = '[role="option"], [role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"]';
const openMenus = new WeakMap<Document, Set<Menu>>();

/** Shared option/action face and navigation. Floating menus use the native
 * popover layer; suggestions can keep focus on a light-DOM writing field. */
export class Menu extends LitElement {
  static styles = unsafeCSS(styles);
  static properties = {
    compact: { type: Boolean, reflect: true },
    floating: { type: Boolean, reflect: true },
    open: { type: Boolean, reflect: true },
    columns: { type: Number, reflect: true },
    anchor: { attribute: false },
    controller: { attribute: false },
    activeId: { type: String, attribute: "active-id" },
  };
  declare compact: boolean;
  declare floating: boolean;
  declare open: boolean;
  declare columns: number;
  declare anchor: HTMLElement | null;
  declare controller: HTMLElement | null;
  declare activeId: string;
  private listeningTo: HTMLElement | null = null;
  private shown = false;
  private observer?: ResizeObserver;
  private opener: HTMLElement | null = null;
  private observedAnchor: HTMLElement | null = null;
  private restoreFocus = true;
  private heldFocus = false;
  private focusVersion = 0;

  constructor() {
    super();
    this.compact = false; this.floating = false; this.open = false;
    this.columns = 1; this.anchor = null; this.controller = null; this.activeId = "";
    this.addEventListener("keydown", this.onKeyDown);
    this.addEventListener("pointerdown", this.retainController);
    this.addEventListener("focusin", () => { this.heldFocus = true; this.syncTabStops(); });
    this.addEventListener("focusout", event => {
      if (event.relatedTarget instanceof Node && !this.contains(event.relatedTarget)) this.heldFocus = false;
    });
  }
  connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "listbox");
    this.requestUpdate();
  }
  disconnectedCallback() {
    this.listeningTo?.removeEventListener("keydown", this.onControllerKey);
    this.listeningTo = null;
    this.hide(true);
    super.disconnectedCallback();
  }
  updated() {
    this.style.setProperty("--ds-menu-columns", String(Math.max(1, Math.floor(this.columns || 1))));
    this.toggleAttribute("data-grid", this.columns > 1);
    if (this.listeningTo !== this.controller) {
      this.listeningTo?.removeEventListener("keydown", this.onControllerKey);
      this.listeningTo = this.controller;
      this.listeningTo?.addEventListener("keydown", this.onControllerKey);
    }
    if (this.floating && this.open) this.show(); else this.hide(true);
    this.syncTabStops();
    if (this.observer && this.observedAnchor !== this.anchor) {
      if (this.observedAnchor) this.observer.unobserve(this.observedAnchor);
      if (this.anchor) this.observer.observe(this.anchor);
      this.observedAnchor = this.anchor;
    }
    this.place();
    this.scrollActive();
  }
  /** Prepare a newly inserted menu before gesture-time focus. */
  renderNow() { this.performUpdate(); }
  private items(includeDisabled = false): HTMLElement[] {
    return Array.from(this.querySelectorAll<HTMLElement>(ITEM)).filter(item =>
      (includeDisabled || this.enabled(item)) &&
      !item.closest('[hidden], [inert]') && item.closest("ds-menu") === this,
    );
  }
  private enabled(item: HTMLElement) {
    return !item.matches(":disabled") && !item.hasAttribute("disabled") && item.getAttribute("aria-disabled") !== "true";
  }
  private syncTabStops() {
    if (!this.floating) return;
    const items = this.items(true);
    const current = this.controller ? null : items.find(item => item === this.ownerDocument.activeElement) ?? items.find(item => this.enabled(item));
    for (const item of items) item.tabIndex = item === current ? 0 : -1;
  }
  private onChoicesChanged = () => { this.syncTabStops(); this.place(); this.scrollActive(); };
  private isTop() { return [...(openMenus.get(this.ownerDocument) ?? [])].at(-1) === this; }
  private show() {
    if (this.shown || !this.isConnected) return;
    this.shown = true;
    const openingFocus = this.ownerDocument.activeElement;
    this.opener = this.controller ?? this.anchor ?? (openingFocus instanceof HTMLElement ? openingFocus : null);
    this.restoreFocus = true;
    this.heldFocus = false;
    let stack = openMenus.get(this.ownerDocument);
    if (!stack) openMenus.set(this.ownerDocument, stack = new Set());
    stack.add(this);
    this.popover = "manual";
    this.showPopover?.();
    if (typeof ResizeObserver !== "undefined") {
      this.observer = new ResizeObserver(this.place);
      this.observer.observe(this);
      if (this.anchor) this.observer.observe(this.anchor);
      this.observedAnchor = this.anchor;
    }
    this.ownerDocument.addEventListener("pointerdown", this.onOutside, true);
    this.ownerDocument.addEventListener("focusin", this.onOutside);
    this.ownerDocument.addEventListener("keydown", this.onEscape, true);
    this.ownerDocument.addEventListener("scroll", this.place, true);
    this.ownerDocument.defaultView?.addEventListener("resize", this.place);
    this.ownerDocument.defaultView?.visualViewport?.addEventListener("resize", this.place);
    this.ownerDocument.defaultView?.visualViewport?.addEventListener("scroll", this.place);
    if (!this.controller) {
      // Native frames must be distributed through newly inserted Lit slots first.
      const version = ++this.focusVersion;
      void Promise.all(Array.from(this.querySelectorAll<LitElement>("ds-button"), element => element.updateComplete)).then(() => {
        const active = this.ownerDocument.activeElement;
        if (this.shown && this.isConnected && version === this.focusVersion && !this.controller &&
            (active === openingFocus || active === this.opener || active === this.ownerDocument.body || active === this)) {
          this.items()[0]?.focus({ preventScroll: true });
        }
      });
    }
  }
  private hide(restore: boolean) {
    if (!this.shown) return;
    this.shown = false;
    this.focusVersion++;
    const active = this.ownerDocument.activeElement;
    const within = active instanceof Node && this.contains(active);
    // Removal closes a native popover before disconnectedCallback runs.
    if (this.isConnected && this.matches(":popover-open")) this.hidePopover?.();
    openMenus.get(this.ownerDocument)?.delete(this);
    this.observer?.disconnect(); this.observer = undefined; this.observedAnchor = null;
    this.ownerDocument.removeEventListener("pointerdown", this.onOutside, true);
    this.ownerDocument.removeEventListener("focusin", this.onOutside);
    this.ownerDocument.removeEventListener("keydown", this.onEscape, true);
    this.ownerDocument.removeEventListener("scroll", this.place, true);
    this.ownerDocument.defaultView?.removeEventListener("resize", this.place);
    this.ownerDocument.defaultView?.visualViewport?.removeEventListener("resize", this.place);
    this.ownerDocument.defaultView?.visualViewport?.removeEventListener("scroll", this.place);
    if (restore && this.restoreFocus && (within || (this.heldFocus && active === this.ownerDocument.body)) && this.opener?.isConnected) this.opener.focus({preventScroll: true});
    this.opener = null;
    this.heldFocus = false;
  }
  requestClose(reason: "escape" | "outside") {
    this.restoreFocus = reason !== "outside";
    const event = new CustomEvent("ds-menu-close", {detail: {reason}, bubbles: true, composed: true, cancelable: true});
    if (this.dispatchEvent(event)) this.open = false;
  }
  private onEscape = (event: KeyboardEvent) => {
    if (this.isTop() && event.key === "Escape" && !event.defaultPrevented && !event.isComposing) {
      event.preventDefault(); event.stopPropagation(); this.requestClose("escape");
    }
  };
  private onOutside = (event: Event) => {
    if (!this.isTop()) return;
    const path = event.composedPath();
    if (!path.includes(this) && !(this.anchor && !this.controller && path.includes(this.anchor)) && !(this.controller && path.includes(this.controller))) this.requestClose("outside");
  };
  private retainController = (event: PointerEvent) => {
    if (this.controller && event.button === 0 && event.composedPath().some(node => node instanceof HTMLElement && node.matches(ITEM))) event.preventDefault();
  };
  place = () => {
    if (!this.shown || !this.anchor) return;
    const rect = this.anchor.getBoundingClientRect(), view = this.ownerDocument.defaultView!;
    const viewport = view.visualViewport;
    const left = viewport?.offsetLeft ?? 0, top = viewport?.offsetTop ?? 0;
    const width = viewport?.width ?? view.innerWidth, height = viewport?.height ?? view.innerHeight;
    const gap = parseFloat(view.getComputedStyle(this).scrollPaddingTop) || 10, unit = gap * 2;
    const room = Math.max(0, width - 2 * gap);
    this.style.maxWidth = `${room}px`;
    if (this.columns <= 1) this.style.width = `${Math.min(room, Math.max(4 * unit, rect.width))}px`;
    else this.style.removeProperty("width");
    const below = top + height - rect.bottom - 2 * gap, above = rect.top - top - 2 * gap;
    const frame = this.shadowRoot?.querySelector<HTMLElement>(".frame");
    const up = below < Math.min(frame?.scrollHeight ?? this.scrollHeight, 8 * unit) && above > below;
    this.style.setProperty("--ds-menu-available-height", `${Math.max(0, Math.min(height - 2 * gap, up ? above : below))}px`);
    const box = this.getBoundingClientRect();
    this.style.left = `${Math.max(left + gap, Math.min(rect.left, left + width - gap - box.width))}px`;
    this.style.top = `${Math.max(top + gap, up ? rect.top - gap - box.height : rect.bottom + gap)}px`;
  };
  private activate(item: HTMLElement) {
    const event = new CustomEvent("ds-menu-active", {detail: {id: item.id}, bubbles: true, composed: true, cancelable: true});
    if (this.dispatchEvent(event)) this.activeId = item.id;
  }
  private scrollActive() {
    if (!this.controller || !this.shown) return;
    const item = this.items().find(item => item.id === this.activeId);
    if (!item) return;
    // Scroll the accepted choice, never a controlled request the owner declined.
    const scroller = this.shadowRoot?.querySelector<HTMLElement>(".frame");
    if (!scroller) return;
    const box = item.getBoundingClientRect(), frame = scroller.getBoundingClientRect();
    if (box.top < frame.top) scroller.scrollTop -= frame.top - box.top;
    else if (box.bottom > frame.bottom) scroller.scrollTop += box.bottom - frame.bottom;
  }
  private navigate(event: KeyboardEvent, external: boolean) {
    if (event.defaultPrevented || event.isComposing || event.altKey || event.metaKey || event.ctrlKey || event.shiftKey) return;
    if (external && (!this.open || !this.floating || !this.isTop())) return;
    const items = this.items(true); if (!items.some(item => this.enabled(item))) return;
    const current = external ? items.findIndex(item => item.id === this.activeId) : items.findIndex(item => event.composedPath().includes(item));
    const columns = Math.max(1, Math.floor(this.columns || 1));
    let next: number;
    switch (event.key) {
      case "ArrowDown": next = this.step(items, current, columns, 1); break;
      case "ArrowUp": next = this.step(items, current, columns, -1); break;
      case "ArrowRight": if (columns === 1 || external) return; next = this.step(items, current, 1, 1); break;
      case "ArrowLeft": if (columns === 1 || external) return; next = this.step(items, current, 1, -1); break;
      case "Home": if (external) return; next = items.findIndex(item => this.enabled(item)); break;
      case "End": if (external) return; next = this.lastEnabled(items); break;
      case "Enter":
        if (external && current >= 0 && this.enabled(items[current]!)) { event.preventDefault(); items[current]!.click(); }
        return;
      default: return;
    }
    if (next < 0) return;
    event.preventDefault();
    const item = items[next]!;
    if (external) this.activate(item); else item.focus();
  }
  private lastEnabled(items: HTMLElement[]) { return items.reduce((last, item, index) => this.enabled(item) ? index : last, -1); }
  private step(items: HTMLElement[], current: number, columns: number, direction: number) {
    if (current < 0) return direction > 0 ? items.findIndex(item => this.enabled(item)) : this.lastEnabled(items);
    const rows = Math.ceil(items.length / columns), column = current % columns;
    for (let offset = 1; offset <= rows; offset++) {
      const row = (Math.floor(current / columns) + direction * offset + rows * offset) % rows;
      const next = Math.min(row * columns + column, items.length - 1);
      if (this.enabled(items[next]!)) return next;
    }
    return current;
  }
  private onControllerKey = (event: KeyboardEvent) => this.navigate(event, true);
  private onKeyDown = (event: KeyboardEvent) => {
    if (event.composedPath().some(node => node instanceof HTMLElement && (node.isContentEditable || node.matches('input, textarea, select, [role="textbox"], [role="combobox"]')))) return;
    if (event.composedPath().find(node => node instanceof Menu) !== this) return;
    this.navigate(event, false);
  };
  render() { return html`<div class="frame"><slot @slotchange=${this.onChoicesChanged}></slot></div>`; }
}
define("ds-menu", Menu);
declare global { interface HTMLElementTagNameMap { "ds-menu": Menu } }
