// ds-bento.ts
// Tiles of different sizes, half a square apart: in columns that share the
// width (a tile `data-span` columns wide, `data-rows` rows high), or with
// `squares`, each placed on whole squares by its `data-place`, its surface
// reaching towards the tiles beside it. The tiles are cards (`ds-card`) or
// any box. Drawn as 1-root/bento.css draws `.ds-bento`, and placed by the
// helpers it shares with 0-face/bento.ts.

import { LitElement, html, unsafeCSS } from "lit";
import { define } from "../0-face/define";
import { placeBento } from "../0-face/bento";
import metrics from "../1-root/component-metrics.css?inline";
import styles from "./styles/ds-bento.css?inline";

export class Bento extends LitElement {
  static properties = {
    columns: { type: Number, reflect: true },
    squares: { type: Boolean, reflect: true },
    fit: { type: Boolean, reflect: true },
    layout: { type: String, reflect: true },
  };

  /** The number of columns (flow, three by default), or the squares across (`squares`, 48 by default). */
  declare columns: number | undefined;
  /** Places every tile on whole squares by its `data-place`. */
  declare squares: boolean;
  /** With `squares`, lets the columns share a measure other than the squares. */
  declare fit: boolean;
  /** Takes each tile's `data-place-<layout>` where it has one (say `phone`). */
  declare layout: string | undefined;

  static styles = [unsafeCSS(metrics), unsafeCSS(styles)];

  private observer?: MutationObserver;

  constructor() {
    super();
    this.squares = false;
    this.fit = false;
  }

  connectedCallback() {
    super.connectedCallback();
    this.observer = new MutationObserver(() => this.place());
    this.observer.observe(this, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-place", "hidden"], attributeOldValue: false });
  }

  disconnectedCallback() {
    this.observer?.disconnect();
    super.disconnectedCallback();
  }

  protected updated() {
    if (this.columns) this.style.setProperty("--ds-bento-columns", String(this.columns));
    else this.style.removeProperty("--ds-bento-columns");
    this.place();
  }

  private place() {
    if (this.squares) placeBento(this);
  }

  render() {
    return html`<slot @slotchange=${() => this.place()}></slot>`;
  }
}

define("ds-bento", Bento);

declare global {
  interface HTMLElementTagNameMap {
    "ds-bento": Bento;
  }
}
