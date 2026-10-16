import { LitElement, html, unsafeCSS } from "lit";
import { define } from "../0-face/define";
import { bindSpacingHandle, type SpacingOptions } from "./spacing-handle";
import styles from "./styles/ds-spacing-handle.css?inline";
export { bindSpacingHandle, type SpacingOptions };
/** @internal Built-in editor control, excluded from public catalogues.
 * Supply options with controlled value and callbacks. React uses the same
 * controller and face on a native slider target for SSR and native focus. */
export class SpacingHandle extends LitElement {
  static properties = { options: { attribute: false }, label: { type: String } };
  static styles = unsafeCSS(styles);
  options: SpacingOptions = { value: 0, onCommit: () => {} };
  label = "Spacing";
  private dispose?: () => void;
  updated() {
    if (!this.dispose) this.dispose = bindSpacingHandle(this.renderRoot.querySelector<HTMLElement>(".ds-spacing-control")!, () => this.options);
  }
  disconnectedCallback() { this.dispose?.(); this.dispose = undefined; super.disconnectedCallback(); }
  connectedCallback() { super.connectedCallback(); this.requestUpdate(); }
  render() { const o = this.options; return html`<span class="ds-spacing-control" role="slider" tabindex=${o.disabled ? -1 : 0} aria-label=${this.label} aria-orientation=${o.axis ?? "horizontal"} aria-valuemin=${o.min ?? 0} aria-valuemax=${o.max ?? 1000000} aria-valuenow=${o.value} aria-disabled=${!!o.disabled}><span class="ds-spacing-label">${o.value}</span></span>`; }
}
define("ds-spacing-handle", SpacingHandle);
