import { LitElement, html, unsafeCSS } from "lit";
import { define } from "../0-face/define";
import styles from "./styles/ds-loading.css?inline";
/** @internal Automatic pending-state feedback, not user-insertable content.
 * Label must describe the current operation. The containing app controls mounting.
 * --ds-loading-width/fill/duration preserve the surrounding brand. */
export class LoadingIndicator extends LitElement {
  static properties = { label: { type: String }, variant: { type: String } };
  static styles = unsafeCSS(styles);
  label = "Loading";
  variant = "bar";
  render() { return html`<span class="ds-loading" data-variant=${this.variant} role="status" aria-label=${this.label} aria-busy="true"><span class="ds-loading__fill" aria-hidden="true"></span></span>`; }
}
define("ds-loading", LoadingIndicator);
