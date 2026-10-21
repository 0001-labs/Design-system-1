import { LitElement } from "lit";
import { SignalWatcher } from "@lit-labs/signals";

/**
 * The app's own elements: Lit in the light DOM, so the app's stylesheets reach
 * them as they reach any markup, and signals read while rendering update them.
 * Each host stands out of the layout (`display: contents`) unless it is the box
 * itself, so the page keeps the boxes it had.
 */
export class AppElement extends SignalWatcher(LitElement) {
  /** True when the host is the box itself and carries the layout. */
  static box = false;

  protected override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!(this.constructor as typeof AppElement).box) this.style.display = "contents";
  }

  /** A bubbling, composed event from this element. */
  protected emit<T>(type: string, detail?: T) {
    return this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true, cancelable: true }));
  }
}

/** Defines an element once, so a module loaded twice in tests or development does not throw. */
export function defineElement(name: string, element: CustomElementConstructor) {
  if (!customElements.get(name)) customElements.define(name, element);
}
