import { LitElement, html, unsafeCSS } from "lit";
import { define } from "../0-face/define";
import "../2-core/ds-button";
import "../2-core/ds-file-picker";
import "../2-core/ds-icon";
import styles from "./styles/ds-menu.css?inline";

const ITEM = '[role="option"], [role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"]';
export type MenuCloseReason = "escape" | "outside" | "select" | "back" | "parent";
export type MenuTriggerMode = "click" | "context" | "submenu";
export type MenuAnchor = HTMLElement | Pick<DOMRectReadOnly, "left" | "top" | "right" | "bottom" | "width" | "height">;

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
    placement: { type: String },
    trigger: { attribute: false },
    triggerMode: { type: String, attribute: "trigger-mode", reflect: true },
    hover: { type: Boolean, reflect: true },
    controller: { attribute: false },
    activeId: { type: String, attribute: "active-id" },
  };
  declare compact: boolean;
  declare floating: boolean;
  declare open: boolean;
  declare columns: number;
  declare anchor: MenuAnchor | null;
  declare placement: "top" | "bottom" | "right" | "left";
  declare triggerMode: MenuTriggerMode;
  declare trigger: HTMLElement | null;
  declare hover: boolean;
  declare controller: HTMLElement | null;
  declare activeId: string;
  private listeningTo: HTMLElement | null = null;
  private listeningTrigger: HTMLElement | null = null;
  private triggerAttributes = new Map<string, string | null>();
  private openingEdge: "first" | "last" = "first";
  private search = "";
  private searchAt = 0;
  private focusOnOpen = true;
  private hoverTimer?: ReturnType<typeof setTimeout>;
  private shown = false;
  private observer?: ResizeObserver;
  private opener: HTMLElement | null = null;
  private observedAnchor: HTMLElement | null = null;
  private restoreFocus = true;
  private heldFocus = false;
  private focusVersion = 0;
  private contextPoint: MenuAnchor | null = null;
  private pressTimer?: ReturnType<typeof setTimeout>;
  private pressPoint?: { x: number; y: number };
  private suppressClick = false;
  private suppressClickTimer?: ReturnType<typeof setTimeout>;
  private invokingControl: HTMLElement | null = null;
  private get parentMenu(): Menu | null { return this.parentElement?.closest<Menu>("ds-menu") ?? null; }
  private get rootMenu(): Menu { return this.parentMenu?.rootMenu ?? this; }

  constructor() {
    super();
    this.compact = false; this.floating = false; this.open = false;
    this.placement = "bottom"; this.triggerMode = "click";
    this.columns = 1; this.anchor = null; this.trigger = null; this.hover = false; this.controller = null; this.activeId = "";
    this.addEventListener("keydown", this.onKeyDown);
    this.addEventListener("pointerdown", this.retainController);
    this.addEventListener("pointerover", this.onPointerChoice);
    this.addEventListener("pointerenter", this.onHoverEnter);
    this.addEventListener("pointerleave", this.onHoverLeave);
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
    this.bindTrigger(null);
    clearTimeout(this.hoverTimer); this.cancelPress(); clearTimeout(this.suppressClickTimer);
    this.hide(true);
    super.disconnectedCallback();
  }
  updated() {
    this.bindTrigger(this.trigger);
    if (this.trigger) {
      this.trigger.setAttribute("aria-haspopup", this.getAttribute("role") === "menu" ? "menu" : "listbox");
      this.trigger.setAttribute("aria-expanded", String(this.open));
      if (this.id) this.trigger.setAttribute("aria-controls", this.id);
    }
    this.style.setProperty("--ds-menu-columns", String(Math.max(1, Math.floor(this.columns || 1))));
    this.toggleAttribute("data-grid", this.columns > 1);
    if (this.listeningTo !== this.controller) {
      this.listeningTo?.removeEventListener("keydown", this.onControllerKey);
      this.listeningTo = this.controller;
      this.listeningTo?.addEventListener("keydown", this.onControllerKey);
    }
    if (this.floating && this.open) this.show(); else this.hide(true);
    this.syncTabStops();
    const element = this.anchor instanceof HTMLElement ? this.anchor : null;
    if (this.observer && this.observedAnchor !== element) {
      if (this.observedAnchor) this.observer.unobserve(this.observedAnchor);
      if (element) this.observer.observe(element);
      this.observedAnchor = element;
    }
    this.place();
    this.scrollActive();
  }
  /** Prepare a newly inserted menu before gesture-time focus. */
  renderNow() { this.performUpdate(); }
  private bindTrigger(trigger: HTMLElement | null) {
    if (this.listeningTrigger === trigger) return;
    for (const [name, value] of this.triggerAttributes) {
      if (value === null) this.listeningTrigger?.removeAttribute(name); else this.listeningTrigger?.setAttribute(name, value);
    }
    this.triggerAttributes.clear();
    this.listeningTrigger?.removeEventListener("click", this.onTriggerClick);
    this.listeningTrigger?.removeEventListener("click", this.suppressTriggerClick, true);
    this.listeningTrigger?.removeEventListener("contextmenu", this.onTriggerContext);
    this.listeningTrigger?.removeEventListener("pointerdown", this.onTriggerPress);
    this.listeningTrigger?.removeEventListener("pointermove", this.onTriggerMove);
    this.listeningTrigger?.removeEventListener("pointerup", this.cancelPress);
    this.listeningTrigger?.removeEventListener("pointercancel", this.cancelPress);
    this.listeningTrigger?.removeEventListener("keydown", this.onTriggerKey);
    this.listeningTrigger?.removeEventListener("pointerenter", this.onHoverEnter);
    this.listeningTrigger?.removeEventListener("pointerleave", this.onHoverLeave);
    this.listeningTrigger = trigger;
    if (trigger) for (const name of ["aria-haspopup", "aria-expanded", "aria-controls"]) this.triggerAttributes.set(name, trigger.getAttribute(name));
    trigger?.addEventListener("click", this.onTriggerClick);
    trigger?.addEventListener("click", this.suppressTriggerClick, true);
    trigger?.addEventListener("contextmenu", this.onTriggerContext);
    trigger?.addEventListener("pointerdown", this.onTriggerPress);
    trigger?.addEventListener("pointermove", this.onTriggerMove);
    trigger?.addEventListener("pointerup", this.cancelPress);
    trigger?.addEventListener("pointercancel", this.cancelPress);
    trigger?.addEventListener("keydown", this.onTriggerKey);
    trigger?.addEventListener("pointerenter", this.onHoverEnter);
    trigger?.addEventListener("pointerleave", this.onHoverLeave);
  }
  private toggleFromTrigger(open: boolean) {
    if (!this.trigger || !this.enabled(this.trigger)) return;
    const event = new CustomEvent("ds-menu-toggle", {detail: {open}, bubbles: true, composed: true, cancelable: true});
    if (this.dispatchEvent(event)) this.open = open;
  }
  /** Open a context menu from an actual viewport point or the trigger's keyboard position. */
  openAt(point: { x: number; y: number }, invokingControl = this.trigger) {
    if (this.trigger && !this.enabled(this.trigger)) return;
    this.contextPoint = { left: point.x, right: point.x, top: point.y, bottom: point.y, width: 0, height: 0 };
    this.invokingControl = invokingControl;
    this.focusOnOpen = true; this.openingEdge = "first";
    this.toggleFromTrigger(true);
    if (this.open) this.place();
  }
  /** A selected action dismisses its whole branch. Products can decline it. */
  select() { this.rootMenu.requestClose("select"); }
  private onTriggerContext = (event: MouseEvent) => {
    if (this.triggerMode !== "context" || event.defaultPrevented || !this.trigger || !this.enabled(this.trigger)) return;
    event.preventDefault(); this.cancelPress();
    this.openAt({ x: event.clientX, y: event.clientY });
  };
  private cancelPress = () => {
    clearTimeout(this.pressTimer); this.pressTimer = undefined; this.pressPoint = undefined;
    this.ownerDocument.removeEventListener("pointermove", this.onTriggerMove);
    this.ownerDocument.removeEventListener("pointerup", this.cancelPress);
    this.ownerDocument.removeEventListener("pointercancel", this.cancelPress);
    if (this.suppressClick) {
      clearTimeout(this.suppressClickTimer);
      this.suppressClickTimer = setTimeout(() => { this.suppressClick = false; }, 1000);
    }
  };
  private onTriggerPress = (event: PointerEvent) => {
    if (event.defaultPrevented || this.triggerMode !== "context" || event.pointerType !== "touch" || event.button !== 0 || !this.trigger || !this.enabled(this.trigger)) return;
    this.cancelPress(); this.suppressClick = false; clearTimeout(this.suppressClickTimer);
    const point = { x: event.clientX, y: event.clientY }; this.pressPoint = point;
    this.ownerDocument.addEventListener("pointermove", this.onTriggerMove);
    this.ownerDocument.addEventListener("pointerup", this.cancelPress);
    this.ownerDocument.addEventListener("pointercancel", this.cancelPress);
    this.pressTimer = setTimeout(() => {
      this.pressTimer = undefined; this.pressPoint = undefined; this.suppressClick = true;
      this.openAt(point);
    }, 600);
  };
  private onTriggerMove = (event: PointerEvent) => {
    if (this.pressPoint && Math.hypot(event.clientX - this.pressPoint.x, event.clientY - this.pressPoint.y) > 10) this.cancelPress();
  };
  private suppressTriggerClick = (event: MouseEvent) => {
    if (this.suppressClick) { this.suppressClick = false; event.preventDefault(); event.stopImmediatePropagation(); }
  };
  private onTriggerClick = (event: MouseEvent) => {
    if (this.triggerMode === "context" || event.defaultPrevented) return;
    if (this.hover && this.trigger?.matches("a[href]")) return;
    this.focusOnOpen = true;
    this.openingEdge = "first";
    this.toggleFromTrigger(this.triggerMode === "submenu" || !this.open);
  };
  private onTriggerKey = (event: KeyboardEvent) => {
    if (event.defaultPrevented || event.isComposing || event.altKey || event.metaKey || event.ctrlKey || (event.shiftKey && !(this.triggerMode === "context" && event.key === "F10")) || !this.trigger || !this.enabled(this.trigger)) return;
    if (this.triggerMode === "context") {
      if (event.key !== "ContextMenu" && !(event.key === "F10" && event.shiftKey)) return;
      event.preventDefault(); event.stopPropagation();
      const box = this.trigger.getBoundingClientRect(); this.openAt({ x: box.left, y: box.bottom }); return;
    }
    if (this.triggerMode === "submenu") {
      const forward = this.ownerDocument.defaultView?.getComputedStyle(this).direction === "rtl" ? "ArrowLeft" : "ArrowRight";
      if (event.key !== forward && event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault(); event.stopPropagation(); this.focusOnOpen = true;
      if (this.open) this.initialChoice()?.focus(); else this.toggleFromTrigger(true); return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    this.focusOnOpen = true;
    this.openingEdge = event.key === "ArrowUp" ? "last" : "first";
    if (this.open) this.initialChoice()?.focus(); else this.toggleFromTrigger(true);
  };
  private onHoverEnter = (event: PointerEvent) => {
    if ((!this.hover && this.triggerMode !== "submenu") || event.pointerType === "touch") return;
    clearTimeout(this.hoverTimer);
    if (!this.open) { this.focusOnOpen = false; this.toggleFromTrigger(true); }
  };
  private onHoverLeave = (event: PointerEvent) => {
    if ((!this.hover && this.triggerMode !== "submenu") || event.pointerType === "touch") return;
    if (event.relatedTarget instanceof Node && (this.contains(event.relatedTarget) || this.trigger?.contains(event.relatedTarget))) return;
    clearTimeout(this.hoverTimer);
    // The half-square gap stays traversable without an invisible product overlay.
    this.hoverTimer = setTimeout(() => {
      if (this.open && !this.contains(this.ownerDocument.activeElement)) this.requestClose("outside");
    }, 180);
  };
  private initialChoice() {
    const items = this.items();
    return items.find(item => item.getAttribute("aria-selected") === "true" || item.getAttribute("aria-checked") === "true") ?? (this.openingEdge === "last" ? items.at(-1) : items[0]);
  }
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
    this.opener = this.invokingControl ?? this.controller ?? this.trigger ?? (this.anchor instanceof HTMLElement ? this.anchor : null) ?? (openingFocus instanceof HTMLElement ? openingFocus : null);
    this.search = "";
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
      this.observedAnchor = this.anchor instanceof HTMLElement ? this.anchor : null;
      if (this.observedAnchor) this.observer.observe(this.observedAnchor);
    }
    this.ownerDocument.addEventListener("pointerdown", this.onOutside, true);
    this.ownerDocument.addEventListener("focusin", this.onOutside);
    this.ownerDocument.addEventListener("keydown", this.onEscape, true);
    this.ownerDocument.addEventListener("scroll", this.place, true);
    this.ownerDocument.defaultView?.addEventListener("resize", this.place);
    this.ownerDocument.defaultView?.visualViewport?.addEventListener("resize", this.place);
    this.ownerDocument.defaultView?.visualViewport?.addEventListener("scroll", this.place);
    if (!this.controller && this.focusOnOpen) {
      // Native frames must be distributed through newly inserted Lit slots first.
      const version = ++this.focusVersion;
      void Promise.all(Array.from(this.querySelectorAll<LitElement>("ds-button, ds-file-picker"), element => element.updateComplete)).then(() => {
        const active = this.ownerDocument.activeElement;
        if (this.shown && this.isConnected && version === this.focusVersion && !this.controller &&
            (active === openingFocus || active === this.opener || active === this.ownerDocument.body || active === this)) {
          const choice = this.initialChoice();
          choice?.focus({ preventScroll: true });
          if (choice) this.scrollChoice(choice);
        }
      });
    }
  }
  private hide(restore: boolean) {
    if (!this.shown) return;
    this.shown = false;
    for (const child of this.querySelectorAll<Menu>("ds-menu")) if (child.open) child.requestClose("parent");
    clearTimeout(this.hoverTimer);
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
    const focusEvent = new CustomEvent("ds-menu-close-focus", { bubbles: true, composed: true, cancelable: true });
    const mayRestore = this.dispatchEvent(focusEvent);
    if (mayRestore && restore && this.restoreFocus && (within || (this.heldFocus && active === this.ownerDocument.body)) && this.opener?.isConnected) this.opener.focus({preventScroll: true});
    this.opener = null; this.invokingControl = null;
    this.heldFocus = false;
  }
  requestClose(reason: MenuCloseReason) {
    this.restoreFocus = reason !== "outside" && reason !== "parent";
    for (const child of this.querySelectorAll<Menu>("ds-menu")) child.restoreFocus = false;
    const event = new CustomEvent("ds-menu-close", {detail: {reason}, bubbles: true, composed: true, cancelable: true});
    if (this.dispatchEvent(event)) this.open = false;
  }
  private onEscape = (event: KeyboardEvent) => {
    if (this.isTop() && event.key === "Escape" && !event.defaultPrevented && !event.isComposing) {
      event.preventDefault(); event.stopPropagation(); this.requestClose("escape");
    }
  };
  private onOutside = (event: Event) => {
    const top = [...(openMenus.get(this.ownerDocument) ?? [])].at(-1);
    if (top !== this && (!top || !this.contains(top))) return;
    const path = event.composedPath();
    if (!path.includes(this) && !(this.anchor instanceof HTMLElement && !this.controller && path.includes(this.anchor)) && !(this.trigger && path.includes(this.trigger)) && !(this.controller && path.includes(this.controller))) this.requestClose("outside");
  };
  private onPointerChoice = (event: PointerEvent) => {
    if (this.controller || this.getAttribute("role") !== "menu" || event.pointerType === "touch") return;
    const item = event.composedPath().find(node => node instanceof HTMLElement && node.matches(ITEM)) as HTMLElement | undefined;
    if (item && item.closest("ds-menu") === this && this.enabled(item)) item.focus({ preventScroll: true });
  };
  private retainController = (event: PointerEvent) => {
    if (this.controller && event.button === 0 && event.composedPath().some(node => node instanceof HTMLElement && node.matches(ITEM))) event.preventDefault();
  };
  place = () => {
    const anchor = this.triggerMode === "context" ? this.contextPoint ?? this.anchor : this.anchor;
    if (!this.shown || !anchor) return;
    const rect = anchor instanceof HTMLElement ? anchor.getBoundingClientRect() : anchor, view = this.ownerDocument.defaultView!;
    const viewport = view.visualViewport;
    const left = viewport?.offsetLeft ?? 0, top = viewport?.offsetTop ?? 0;
    const width = viewport?.width ?? view.innerWidth, height = viewport?.height ?? view.innerHeight;
    const gap = parseFloat(view.getComputedStyle(this).scrollPaddingTop) || 10, unit = gap * 2;
    const room = Math.max(0, width - 2 * gap);
    this.style.maxWidth = `${room}px`;
    this.style.setProperty("--ds-menu-anchor-width", `${Math.min(room, Math.max(4 * unit, rect.width))}px`);
    if (this.placement === "right" || this.placement === "left" || this.triggerMode === "submenu") {
      this.style.setProperty("--ds-menu-available-height", `${Math.max(0, height - 2 * gap)}px`);
      const box = this.getBoundingClientRect();
      const preferLeft = this.placement === "left" || view.getComputedStyle(this).direction === "rtl";
      const toRight = left + width - rect.right, toLeft = rect.left - left;
      const useLeft = preferLeft ? toLeft >= box.width || toLeft > toRight : toRight < box.width && toLeft > toRight;
      this.style.left = `${Math.max(left + gap, Math.min(useLeft ? rect.left - box.width : rect.right, left + width - gap - box.width))}px`;
      this.style.top = `${Math.max(top + gap, Math.min(rect.top, top + height - gap - box.height))}px`;
      return;
    }
    const below = top + height - rect.bottom - 2 * gap, above = rect.top - top - 2 * gap;
    const frame = this.shadowRoot?.querySelector<HTMLElement>(".frame");
    const needed = Math.min(frame?.scrollHeight ?? this.scrollHeight, 8 * unit);
    const up = this.placement === "top" ? above >= needed || above >= below : below < needed && above > below;
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
    this.scrollChoice(item);
  }
  private scrollChoice(item: HTMLElement) {
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
      default:
        if (external || event.key.length !== 1 || event.key === " ") return;
        const now = Date.now();
        this.search = (now - this.searchAt < 700 ? this.search : "") + event.key.toLocaleLowerCase();
        this.searchAt = now;
        const repeated = [...this.search].every(char => char === this.search[0]);
        const query = repeated ? this.search[0]! : this.search;
        const start = repeated ? current + 1 : Math.max(0, current);
        next = -1;
        for (let offset = 0; offset < items.length; offset++) {
          const index = (start + offset + items.length) % items.length;
          const item = items[index]!;
          if (this.enabled(item) && (item.getAttribute("data-text-value") ?? item.getAttribute("aria-label") ?? item.textContent ?? "").trim().toLocaleLowerCase().startsWith(query)) { next = index; break; }
        }
        break;
    }
    if (next < 0) return;
    event.preventDefault();
    const item = items[next]!;
    if (external) this.activate(item); else { item.focus({preventScroll: true}); this.scrollChoice(item); }
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
    if (event.composedPath().some(node => node instanceof HTMLElement && (node.isContentEditable || node.matches('input:not([type="file"][role="menuitem"]), textarea, select, [role="textbox"], [role="combobox"]')))) return;
    if (event.composedPath().find(node => node instanceof Menu) !== this) return;
    const back = this.ownerDocument.defaultView?.getComputedStyle(this).direction === "rtl" ? "ArrowRight" : "ArrowLeft";
    if (this.parentMenu && event.key === back && !event.defaultPrevented && !event.isComposing) {
      event.preventDefault(); event.stopPropagation(); this.requestClose("back"); return;
    }
    this.navigate(event, false);
  };
  render() { return html`<div class="frame"><slot @slotchange=${this.onChoicesChanged}></slot></div>`; }
}
define("ds-menu", Menu);
declare global { interface HTMLElementTagNameMap { "ds-menu": Menu } }
