import { LitElement, html, unsafeCSS } from "lit";
import { define } from "../0-face/define";
import styles from "./styles/ds-switch.css?inline";

/** The shared switch face. The slotted button retains native activation and refs. */
export class Switch extends LitElement {
  static styles = unsafeCSS(styles);
  focus(options?: FocusOptions) { this.querySelector<HTMLButtonElement>(":scope > button")?.focus(options); }
  render() { return html`<slot></slot>`; }
}

define("ds-switch", Switch);
declare global { interface HTMLElementTagNameMap { "ds-switch": Switch } }
