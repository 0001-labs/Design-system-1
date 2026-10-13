import { LitElement, html, unsafeCSS } from "lit";
import styles from "./styles/ds-panel.css?inline";
import { define } from "../0-face/define";

/**
 * A panel of chrome on Design system 1 paper: a header, a body that scrolls, a footer.
 *
 * Content goes to the default slot; `slot="header"` and `slot="footer"` pin to
 * the top and bottom.
 *
 * @element ds-panel
 *
 * @example
 * <ds-panel>
 *   <ds-row slot="header" fill>…</ds-row>
 *   …
 *   <ds-row slot="footer">…</ds-row>
 * </ds-panel>
 */
export class Panel extends LitElement {
  static styles = unsafeCSS(styles);

  render() {
    return html`
      <slot name="header" part="header"></slot>
      <div class="body" part="body"><slot></slot></div>
      <slot name="footer" part="footer"></slot>
    `;
  }
}

define("ds-panel", Panel);

declare global {
  interface HTMLElementTagNameMap {
    "ds-panel": Panel;
  }
}
