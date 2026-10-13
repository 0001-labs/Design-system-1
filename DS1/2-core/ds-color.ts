import { LitElement, html, css } from "lit";
import { define } from "../0-face/define";
import "./styles/ds-color.css";
import styles from "./styles/ds-color.css?inline";

const styledRoots = new WeakSet<ShadowRoot>();

/** A native colour input owns the platform picker, labels, forms and reset. */
export class ColorInput extends LitElement {
  static styles = css`
    :host { display: inline-flex; flex: 0 0 auto; width: calc(2 * var(--ds-unit)); height: var(--ds-unit); }
    :host([hidden]) { display: none !important; }
  `;
  connectedCallback() {
    super.connectedCallback();
    const root = this.getRootNode();
    if (root instanceof ShadowRoot && !styledRoots.has(root)) {
      const sheet = new CSSStyleSheet(); sheet.replaceSync(styles);
      root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
      styledRoots.add(root);
    }
  }
  focus(options?: FocusOptions) { this.querySelector("input")?.focus(options); }
  render() { return html`<slot></slot>`; }
}
define("ds-color", ColorInput);
declare global { interface HTMLElementTagNameMap { "ds-color": ColorInput } }
