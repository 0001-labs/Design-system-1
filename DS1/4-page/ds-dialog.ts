import { LitElement, css, html } from "lit";
import { define } from "../0-face/define";
import "../2-core/ds-button";
import "../2-core/ds-icon";
import "./styles/ds-dialog.css";

export type DialogCloseReason = "escape" | "backdrop" | "button" | "native";
const openDialogs = new WeakMap<Document, Set<Dialog>>();
const scrollStyles = new WeakMap<Document, { value: string; priority: string }>();

/** A native light-DOM dialog keeps forms and accessible ID references together.
 * The browser owns the top layer, inert background and modal focus navigation.
 * Listen to ds-close-request and preventDefault to control whether it closes.
 */
export class Dialog extends LitElement {
  static properties = {
    open: { type: Boolean, reflect: true },
    closeOnEscape: { type: Boolean, attribute: "close-on-escape" },
    closeOnBackdrop: { type: Boolean, attribute: "close-on-backdrop" },
  };
  static styles = css`:host { display: contents; }`;
  declare open: boolean;
  declare closeOnEscape: boolean;
  declare closeOnBackdrop: boolean;
  private dialog: HTMLDialogElement | null = null;
  private opener: HTMLElement | null = null;
  private pointerStartedOutside = false;
  private opening = false;
  private observer = new MutationObserver(() => this.bindDialog());

  constructor() {
    super();
    this.open = false;
    this.closeOnEscape = true;
    this.closeOnBackdrop = true;
  }

  connectedCallback() {
    super.connectedCallback();
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
      if (this.opening) return;
      this.opening = true;
      // Let slotted Lit fields/buttons render before the browser chooses focus.
      // Otherwise their empty shadow roots can make the dialog itself receive it.
      const updates = [...dialog.querySelectorAll("*")].map(element => (element as LitElement).updateComplete);
      void Promise.all(updates).then(() => {
        this.opening = false;
        if (this.dialog !== dialog || !this.open || !this.isConnected) { this.syncOpen(); return; }
        this.showDialog(dialog);
      });
    } else if (!this.open) {
      if (dialog.open) dialog.close();
      this.release();
    }
  }

  private showDialog(dialog: HTMLDialogElement) {
    if (dialog.open) return;
    let active = this.ownerDocument.activeElement;
    while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
    this.opener ??= active instanceof HTMLElement ? active : null;
    dialog.showModal();
    const document = this.ownerDocument;
    let stack = openDialogs.get(document);
    if (!stack) openDialogs.set(document, stack = new Set());
    if (stack.size === 0) {
      const style = document.documentElement.style;
      scrollStyles.set(document, { value: style.getPropertyValue("overflow"), priority: style.getPropertyPriority("overflow") });
      style.setProperty("overflow", "hidden", "important");
    }
    stack.add(this);
  }

  private release() {
    const document = this.ownerDocument;
    const stack = openDialogs.get(document);
    const entries = stack ? [...stack] : [];
    const wasTop = entries[entries.length - 1] === this;
    if (!stack?.delete(this)) return;
    if (stack.size === 0) {
      const saved = scrollStyles.get(document);
      const style = document.documentElement.style;
      if (style.getPropertyValue("overflow") === "hidden" && style.getPropertyPriority("overflow") === "important") {
        if (saved?.value) style.setProperty("overflow", saved.value, saved.priority);
        else style.removeProperty("overflow");
      }
      scrollStyles.delete(document);
    }
    if (wasTop && this.opener?.isConnected) this.opener.focus({ preventScroll: true });
    this.opener = null;
  }

  requestClose(reason: DialogCloseReason = "button") {
    if (!this.open) return;
    const event = new CustomEvent("ds-close-request", { detail: { reason }, bubbles: true, composed: true, cancelable: true });
    if (this.dispatchEvent(event)) this.open = false;
  }

  private onCancel = (event: Event) => {
    event.preventDefault();
    if (this.closeOnEscape) this.requestClose("escape");
  };

  private onNativeClose = () => {
    if (!this.open || this.dialog?.open) return;
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
