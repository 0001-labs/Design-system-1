import { LitElement, html, unsafeCSS } from "lit";
import styles from "./styles/ds-list.css?inline";
import { define } from "../0-face/define";

/**
 * A vertical stack of rows.
 *
 * @element ds-list
 * @attr columns - Lay the items out in this many equal columns.
 */
export class List extends LitElement {
  static properties = {
    columns: { type: Number, reflect: true },
  };

  declare columns: number | undefined;

  static styles = unsafeCSS(styles);

  updated(): void {
    if (typeof this.columns === "number" && Number.isInteger(this.columns) && this.columns > 0) this.style.setProperty("--ds-list-columns", String(this.columns));
    else this.style.removeProperty("--ds-list-columns");
  }

  render() {
    return html`<slot></slot>`;
  }
}

define("ds-list", List);

declare global {
  interface HTMLElementTagNameMap {
    "ds-list": List;
  }
}
