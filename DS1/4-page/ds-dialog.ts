import { LitElement, css, html } from "lit";
import { define } from "../0-face/define";
import "../2-core/ds-button";
import "../2-core/ds-icon";
import "./styles/ds-dialog.css";
import dialogStyles from "./styles/ds-dialog.css?inline";

export type DialogCloseReason = "escape" | "backdrop" | "outside" | "button" | "native";
const openDialogs = new WeakMap<Document, Set<Dialog>>();
type SavedStyle = { style: CSSStyleDeclaration; name: string; value: string; priority: string; locked: string };
const scrollStyles = new WeakMap<Document, { declarations: SavedStyle[]; x: number; y: number }>();

/** One owner per declaration, including mixed modal and stationary panels. */
function syncScroll(document: Document) {
  const stack = [...(openDialogs.get(document) ?? [])];
  const holding = stack.some(dialog => !dialog.nonModal || dialog.holdScroll);
  const fixed = stack.some(dialog => !dialog.nonModal);
  let saved = scrollStyles.get(document);
  if (!holding && !saved) return;
  if (!saved) {
    saved = { declarations: [], x: document.defaultView?.scrollX ?? 0, y: document.defaultView?.scrollY ?? 0 };
    scrollStyles.set(document, saved);
  }
  const root = document.documentElement.style, body = document.body.style;
  const desired: [CSSStyleDeclaration, string, string][] = holding ? [
    [root, "overflow", "hidden"], [root, "overscroll-behavior", "none"],
    [body, "overscroll-behavior", "none"], [body, "touch-action", "none"],
  ] : [];
  if (fixed) desired.push([body, "position", "fixed"], [body, "top", `${-saved.y}px`], [body, "left", `${-saved.x}px`], [body, "width", "100%"]);
  const wasFixed = saved.declarations.some(entry => entry.name === "position");
  for (const entry of [...saved.declarations]) {
    if (desired.some(([style, name]) => style === entry.style && name === entry.name)) continue;
    if (entry.style.getPropertyValue(entry.name) === entry.locked && entry.style.getPropertyPriority(entry.name) === "important") {
      if (entry.value) entry.style.setProperty(entry.name, entry.value, entry.priority);
      else entry.style.removeProperty(entry.name);
    }
    saved.declarations.splice(saved.declarations.indexOf(entry), 1);
  }
  for (const [style, name, locked] of desired) {
    if (saved.declarations.some(entry => entry.style === style && entry.name === name)) continue;
    saved.declarations.push({ style, name, locked, value: style.getPropertyValue(name), priority: style.getPropertyPriority(name) });
    style.setProperty(name, locked, "important");
  }
  if ((!holding || (wasFixed && !fixed)) && document.defaultView && (document.defaultView.scrollX !== saved.x || document.defaultView.scrollY !== saved.y)) {
    document.defaultView.scrollTo(saved.x, saved.y);
  }
  if (!holding) scrollStyles.delete(document);
}

const styledRoots = new WeakSet<ShadowRoot>();
function styleRoot(root: Node) {
  if (!(root instanceof ShadowRoot) || styledRoots.has(root)) return;
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(dialogStyles);
  root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
  styledRoots.add(root);
}

/** A native light-DOM dialog keeps forms and accessible ID references together.
 * The browser owns the top layer, inert background and modal focus navigation.
 * Listen to ds-close-request and preventDefault to control whether it closes.
 */
export class Dialog extends LitElement {
  static properties = {
    open: { type: Boolean, reflect: true },
    nonModal: { type: Boolean, attribute: "non-modal", reflect: true },
    closeOnOutside: { type: Boolean, attribute: "close-on-outside" },
    blockOutside: { type: Boolean, attribute: "block-outside" },
    holdScroll: { type: Boolean, attribute: "hold-scroll" },
    closeOnEscape: { type: Boolean, attribute: "close-on-escape" },
    closeOnBackdrop: { type: Boolean, attribute: "close-on-backdrop" },
  };
  static styles = css`:host { display: contents; }`;
  declare open: boolean;
  declare nonModal: boolean;
  declare closeOnOutside: boolean;
  declare blockOutside: boolean;
  declare holdScroll: boolean;
  declare closeOnEscape: boolean;
  declare closeOnBackdrop: boolean;
  private dialog: HTMLDialogElement | null = null;
  private opener: HTMLElement | null = null;
  private pointerStartedOutside = false;
  private pendingOpen: Promise<void> | null = null;
  private outsidePress: boolean | null = null;
  private observer = new MutationObserver(() => this.bindDialog());

  constructor() {
    super();
    this.open = false;
    this.nonModal = false;
    this.closeOnOutside = false;
    this.blockOutside = false;
    this.holdScroll = false;
    this.closeOnEscape = true;
    this.closeOnBackdrop = true;
  }

  connectedCallback() {
    super.connectedCallback();
    styleRoot(this.getRootNode());
    this.observer.observe(this, { childList: true });
    this.bindDialog();
  }

  disconnectedCallback() {
    this.observer.disconnect();
    this.detachDialog();
    super.disconnectedCallback();
  }

  protected updated() { this.syncOpen(); }

  private bindDialog = () => {
    const dialog = this.querySelector<HTMLDialogElement>(":scope > dialog");
    if (dialog === this.dialog) { this.syncOpen(); return; }
    this.detachDialog();
    this.dialog = dialog;
    dialog?.addEventListener("cancel", this.onCancel);
    dialog?.addEventListener("close", this.onNativeClose);
    dialog?.addEventListener("pointerdown", this.onPointerDown);
    dialog?.addEventListener("click", this.onClick);
    this.syncOpen();
  };

  private detachDialog() {
    const dialog = this.dialog;
    dialog?.removeEventListener("cancel", this.onCancel);
    dialog?.removeEventListener("close", this.onNativeClose);
    dialog?.removeEventListener("pointerdown", this.onPointerDown);
    dialog?.removeEventListener("click", this.onClick);
    if (dialog?.open) dialog.close();
    this.release();
    this.dialog = null;
  }

  private syncOpen() {
    const dialog = this.dialog;
    if (!dialog || !this.isConnected) return;
    if (this.open && !dialog.open) {
      if (this.pendingOpen) return;
      // Let slotted Lit fields/buttons render before the browser chooses focus.
      // Otherwise their empty shadow roots can make the dialog itself receive it.
      const updates = [...dialog.querySelectorAll("*")].map(element => (element as LitElement).updateComplete);
      this.pendingOpen = Promise.all(updates).then(() => {
        this.pendingOpen = null;
        if (this.dialog !== dialog || !this.open || !this.isConnected) { this.syncOpen(); return; }
        this.showDialog(dialog);
      });
    } else if (!this.open) {
      if (dialog.open) dialog.close();
      this.release();
    }
  }

  /** Resolve only after native opening and the children's first render. */
  async show() {
    this.open = true;
    await this.updateComplete;
    await this.pendingOpen;
  }

  close() { this.open = false; this.syncOpen(); }

  private showDialog(dialog: HTMLDialogElement) {
    if (dialog.open) return;
    let active = this.ownerDocument.activeElement;
    while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
    this.opener ??= active instanceof HTMLElement ? active : null;
    const document = this.ownerDocument;
    let stack = openDialogs.get(document);
    if (!stack) openDialogs.set(document, stack = new Set());
    stack.add(this);
    syncScroll(document);
    try { if (this.nonModal) dialog.show(); else dialog.showModal(); }
    catch (error) { stack.delete(this); syncScroll(document); throw error; }
    document.addEventListener("keydown", this.onDocumentKey, true);
    document.addEventListener("pointerdown", this.onOutsidePress, true);
    document.addEventListener("click", this.onOutsideClick, true);
    document.addEventListener("wheel", this.onScrollGesture, { passive: false });
    document.addEventListener("touchmove", this.onScrollGesture, { passive: false });
  }

  private release() {
    const document = this.ownerDocument;
    const stack = openDialogs.get(document);
    const entries = stack ? [...stack] : [];
    const wasTop = entries[entries.length - 1] === this;
    if (!stack?.delete(this)) return;
    syncScroll(document);
    document.removeEventListener("keydown", this.onDocumentKey, true);
    document.removeEventListener("pointerdown", this.onOutsidePress, true);
    document.removeEventListener("click", this.onOutsideClick, true);
    document.removeEventListener("wheel", this.onScrollGesture);
    document.removeEventListener("touchmove", this.onScrollGesture);
    this.outsidePress = null;
    // Modeless content must not steal focus from a control already used outside it.
    let active = document.activeElement;
    while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
    if (wasTop && (!this.nonModal || active === document.body || active === this.dialog || (active && this.dialog?.contains(active))) && this.opener?.isConnected) this.opener.focus({ preventScroll: true });
    this.opener = null;
  }

  requestClose(reason: DialogCloseReason = "button") {
    if (!this.open) return;
    const event = new CustomEvent("ds-close-request", { detail: { reason }, bubbles: true, composed: true, cancelable: true });
    if (this.dispatchEvent(event)) this.close();
  }

  private isTop() {
    const stack = [...(openDialogs.get(this.ownerDocument) ?? [])];
    return stack[stack.length - 1] === this;
  }

  private onDocumentKey = (event: KeyboardEvent) => {
    if (!this.nonModal || !this.isTop() || event.defaultPrevented) return;
    if (event.key === "Escape" && this.closeOnEscape) {
      event.preventDefault(); event.stopImmediatePropagation(); this.requestClose("escape");
    } else if (this.holdScroll && !event.composedPath().some(node => node instanceof HTMLElement && (node.isContentEditable || node.matches("input, textarea, select"))) && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) event.preventDefault();
  };
  private onScrollGesture = (event: Event) => {
    if (this.nonModal && this.holdScroll && this.isTop() && !event.composedPath().includes(this)) event.preventDefault();
  };
  private onOutsidePress = (event: Event) => {
    if (!this.nonModal || !this.isTop()) return;
    this.outsidePress = !event.composedPath().includes(this);
    if (this.outsidePress && this.blockOutside) { event.preventDefault(); event.stopImmediatePropagation(); }
  };
  private onOutsideClick = (event: Event) => {
    if (!this.nonModal || !this.isTop() || event.composedPath().includes(this)) return;
    if (this.blockOutside) { event.preventDefault(); event.stopImmediatePropagation(); }
    if (this.closeOnOutside && this.outsidePress !== false) this.requestClose("outside");
    this.outsidePress = null;
  };

  private onCancel = (event: Event) => {
    event.preventDefault();
    if (this.closeOnEscape) this.requestClose("escape");
  };

  private onNativeClose = () => {
    if (!this.open || this.dialog?.open || this.pendingOpen) return;
    this.requestClose("native");
    this.syncOpen();
  };

  private outside(event: MouseEvent) {
    const dialog = this.dialog;
    if (!dialog || event.target !== dialog) return false;
    const rect = dialog.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
  }
  private onPointerDown = (event: PointerEvent) => {
    this.pointerStartedOutside = event.button === 0 && this.outside(event);
  };
  private onClick = (event: MouseEvent) => {
    if (event.defaultPrevented) { this.pointerStartedOutside = false; return; }
    const dismiss = event.composedPath().find(node => node instanceof HTMLElement && node.hasAttribute("data-ds-dialog-dismiss")) as HTMLElement | undefined;
    if (dismiss?.closest("dialog") === this.dialog) this.requestClose("button");
    else if (this.closeOnBackdrop && this.pointerStartedOutside && this.outside(event)) this.requestClose("backdrop");
    this.pointerStartedOutside = false;
  };

  render() { return html`<slot @slotchange=${this.bindDialog}></slot>`; }
}

define("ds-dialog", Dialog);
declare global { interface HTMLElementTagNameMap { "ds-dialog": Dialog } }
