import { LitElement, html, unsafeCSS } from "lit";
import { styleMap } from "lit/directives/style-map.js";
import { define } from "../0-face/define";
import styles from "./styles/ds-grid.css?inline";

export type GridPattern = "grid" | "lines" | "columns" | "dots" | "none";
const patterns = new Set<GridPattern>(["grid", "lines", "columns", "dots", "none"]);

/** Decorative paper or an alignment overlay; never arranges or captures content. */
export class Grid extends LitElement {
  static properties = {
    align: { type: String, reflect: true },
    pattern: { type: String, reflect: true },
    size: { type: Number },
    rowSize: { type: Number, attribute: "row-size" },
    color: { type: String },
    paper: { type: String },
    contained: { type: Boolean, reflect: true },
  };
  declare align: "left" | "center" | "right";
  declare pattern: GridPattern;
  declare size: number;
  declare rowSize: number | undefined;
  declare color: string;
  declare paper: string;
  declare contained: boolean;
  static styles = unsafeCSS(styles);

  constructor() {
    super();
    this.align = "center";
    this.pattern = "grid";
    this.size = 20;
    this.rowSize = undefined;
    this.color = "";
    this.paper = "";
    this.contained = false;
  }

  render() {
    const size = Number.isFinite(this.size) && this.size > 0 ? this.size : 20;
    const row = Number.isFinite(this.rowSize) && this.rowSize! > 0 ? this.rowSize! : size;
    return html`<div aria-hidden="true" class="paper" data-pattern=${patterns.has(this.pattern) ? this.pattern : "grid"}
      style=${styleMap({
        "--pitch-x": `${size}px`,
        "--pitch-y": `${row}px`,
        "--ink": this.color || "var(--ds-grid-color, color-mix(in srgb, var(--ds-text-color, var(--text-color, currentColor)) 12%, transparent))",
        "--paper": this.paper || "var(--ds-grid-paper, transparent)",
      })}></div>`;
  }
}

define("ds-grid", Grid);
declare global { interface HTMLElementTagNameMap { "ds-grid": Grid } }
