import { LitElement, html, unsafeCSS } from "lit";
import { define } from "../0-face/define";
import check from "../x-icon/check.svg?raw";
import styles from "./styles/ds-checkbox.css?inline";

/** A shared checkbox face around a native input, including forms, labels and reset. */
export class Checkbox extends LitElement {
  static styles = [unsafeCSS(styles), unsafeCSS(`:host { --ds-checkbox-mark: url("data:image/svg+xml,${encodeURIComponent(check)}"); }`)];
  focus(options?: FocusOptions) { this.querySelector<HTMLInputElement>(":scope > input")?.focus(options); }
  render() { return html`<slot></slot>`; }
}

define("ds-checkbox", Checkbox);
declare global { interface HTMLElementTagNameMap { "ds-checkbox": Checkbox } }
