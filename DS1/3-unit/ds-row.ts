import { LitElement, html, unsafeCSS } from "lit";
import styles from "./styles/ds-row.css?inline";
import { define } from "../0-face/define";

/**
 * A horizontal run of elements one row (`--ds-row-height`) tall.
 *
 * @element ds-row
 * @attr fill - Spread the children from edge to edge.
 * @attr centered - Centre the children.
 * @attr end - Push the children to the end.
 * @attr auto - Size to the content instead of one row.
 */
export class Row extends LitElement {
  static properties = {
    fill: { type: Boolean, reflect: true },
    centered: { type: Boolean, reflect: true },
    end: { type: Boolean, reflect: true },
    auto: { type: Boolean, reflect: true },
  };

  declare fill: boolean;
  declare centered: boolean;
  declare end: boolean;
  declare auto: boolean;

  constructor() {
    super();
    this.fill = false;
    this.centered = false;
    this.end = false;
    this.auto = false;
  }

  static styles = unsafeCSS(styles);

  render() {
    return html`<slot></slot>`;
  }
}

define("ds-row", Row);

declare global {
  interface HTMLElementTagNameMap {
    "ds-row": Row;
  }
}
