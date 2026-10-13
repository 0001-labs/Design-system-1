import { LitElement, html, unsafeCSS } from "lit";
import { define } from "../0-face/define";
import down from "../x-icon/down.svg?raw";
import styles from "./styles/ds-select.css?inline";

/** Native selection, labels and forms; one shared face and scale. */
export class Select extends LitElement {
  static styles = [unsafeCSS(styles), unsafeCSS(`:host { --ds-select-arrow: url("data:image/svg+xml,${encodeURIComponent(down)}"); }`)];
  private observer = new MutationObserver(() => this.syncRows());
  private syncRows() {
    const select = this.querySelector<HTMLSelectElement>(":scope > select");
    this.style.setProperty("--ds-select-rows", String(select ? select.size || (select.multiple ? 4 : 1) : 1));
  }
  private observeControl() {
    this.observer.disconnect();
    const select = this.querySelector<HTMLSelectElement>(":scope > select");
    if (select) this.observer.observe(select, { attributes: true, attributeFilter: ["size", "multiple"] });
    this.syncRows();
  }
  connectedCallback() { super.connectedCallback(); this.observeControl(); }
  disconnectedCallback() { this.observer.disconnect(); super.disconnectedCallback(); }
  focus(options?: FocusOptions) { this.querySelector<HTMLSelectElement>(":scope > select")?.focus(options); }
  render() { return html`<slot @slotchange=${this.observeControl}></slot><span aria-hidden="true"></span>`; }
}

define("ds-select", Select);
declare global { interface HTMLElementTagNameMap { "ds-select": Select } }
