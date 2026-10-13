import { LitElement, html, unsafeCSS } from "lit";
import { define } from "../0-face/define";
import down from "../x-icon/down.svg?raw";
import styles from "./styles/ds-select.css?inline";

/** Native selection, labels and forms; one shared face and scale. */
export class Select extends LitElement {
  static styles = [unsafeCSS(styles), unsafeCSS(`:host { --ds-select-arrow: url("data:image/svg+xml,${encodeURIComponent(down)}"); }`)];
  private listbox = false;
  private disabled = false;
  private observer = new MutationObserver(() => this.syncRows());
  private control() {
    const select = this.querySelector("select");
    return select?.parentElement === this ? select : null;
  }
  private syncRows() {
    const select = this.control();
    this.style.setProperty("--ds-select-rows", String(select ? select.size || (select.multiple ? 4 : 1) : 1));
    this.listbox = Boolean(select && (select.multiple || select.size > 1));
    this.disabled = Boolean(select?.matches(":disabled"));
    this.requestUpdate();
  }
  private observeControl() {
    this.observer.disconnect();
    const select = this.control();
    if (select) this.observer.observe(select, { attributes: true, attributeFilter: ["size", "multiple", "disabled"] });
    for (let parent = this.parentElement; parent; parent = parent.parentElement) {
      if (parent.localName === "fieldset") this.observer.observe(parent, { attributes: true, attributeFilter: ["disabled"] });
    }
    this.syncRows();
  }
  connectedCallback() { super.connectedCallback(); this.observeControl(); }
  disconnectedCallback() { this.observer.disconnect(); super.disconnectedCallback(); }
  focus(options?: FocusOptions) { this.control()?.focus(options); }
  render() { return html`<slot @slotchange=${this.observeControl}></slot><span aria-hidden="true" ?hidden=${this.listbox} class=${this.disabled ? "disabled" : ""}></span>`; }
}

define("ds-select", Select);
declare global { interface HTMLElementTagNameMap { "ds-select": Select } }
