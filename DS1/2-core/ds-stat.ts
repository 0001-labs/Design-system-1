// ds-stat.ts
// A figure with its label and a line for its change or caption, written in
// the current language through 0-face/format.ts. Drawn by 1-root/figures.css,
// the same classes a page without scripts writes.

import { LitElement, html, nothing, unsafeCSS } from "lit";
import { getText } from "../0-face/i18n";
import { define } from "../0-face/define";
import { CutFades } from "../0-face/cut-fade";
import { figureCells, figureFormat, formatFigure, type FigureFormat, type FigureOptions } from "./figures";
import "./ds-icon";
import metrics from "../1-root/component-metrics.css?inline";
import figures from "../1-root/figures.css?inline";
import styles from "./styles/ds-stat.css?inline";

export type StatTone = "danger" | "warning";
const TONES: readonly StatTone[] = ["danger", "warning"];

/**
 * @element ds-stat
 * @prop {string} label - What the figure is: a translation key, or literal words.
 * @prop {number} value - The figure, written as `format` says in the current language.
 * @prop {string} figure - Words in place of the value ("Incomplete"): a key, or literal words.
 * @prop {"number" | "compact" | "percent" | "money"} format - How the value is written. Number by default.
 * @prop {string} currency - The ISO 4217 code for money.
 * @prop {boolean} minor - The money is counted in the currency's minor unit (cents).
 * @prop {boolean} whole - Money in whole units only.
 * @prop {number} digits - Decimals, at least and at most.
 * @prop {number} change - A change, written with its sign and an up or down icon before the caption.
 * @prop {"number" | "compact" | "percent" | "money"} changeFormat - How the change is written (`change-format`). The value's format by default; `percent` reads a fraction.
 * @prop {"danger" | "warning"} changeTone - The change in that colour (`change-tone`), where the page knows which way is bad.
 * @prop {string} caption - A line under the figure: a key, or literal words.
 * @prop {string} icon - An icon from the library on its own square before the label.
 * @prop {"danger" | "warning"} tone - The figure in that colour.
 * @prop {boolean} cells - Draw each digit in a cell of one width, for a face whose digits differ in width.
 * @prop {boolean} literal - Show `label`, `figure` and `caption` as written, never looked up.
 *
 * @slot label - The label, as inline content.
 * @slot figure - The figure, when the page writes it itself.
 * @slot - Anything that belongs between the figure and the caption, such as a `ds-meter`.
 * @slot caption - The caption, as inline content.
 *
 * @example
 * <ds-stat label="Revenue" value="1234.5" format="money" currency="EUR" change="0.12" change-format="percent" caption="Since last month"></ds-stat>
 */
export class Stat extends LitElement {
  static properties = {
    label: { type: String },
    value: { type: Number },
    figure: { type: String },
    format: { type: String, reflect: true },
    currency: { type: String },
    minor: { type: Boolean },
    whole: { type: Boolean },
    digits: { type: Number },
    change: { type: Number },
    changeFormat: { type: String, attribute: "change-format" },
    changeTone: { type: String, attribute: "change-tone", reflect: true },
    caption: { type: String },
    icon: { type: String },
    tone: { type: String, reflect: true },
    cells: { type: Boolean, reflect: true },
    literal: { type: Boolean, reflect: true },
  };

  static styles = [unsafeCSS(metrics), unsafeCSS(figures), unsafeCSS(styles)];
  /** Words cut short fade over their last square, never an ellipsis: marks them `data-cut="end"` while they do not fit. */
  private cuts = new CutFades(this, { selector: ".ds-stat__figure" });

  declare label: string | undefined;
  declare value: number | undefined;
  declare figure: string | undefined;
  declare format: FigureFormat;
  declare currency: string | undefined;
  declare minor: boolean;
  declare whole: boolean;
  declare digits: number | undefined;
  declare change: number | undefined;
  declare changeFormat: FigureFormat | undefined;
  declare changeTone: StatTone | undefined;
  declare caption: string | undefined;
  declare icon: string | undefined;
  declare tone: StatTone | undefined;
  declare cells: boolean;
  declare literal: boolean;

  private readonly relabel = () => this.requestUpdate();

  constructor() {
    super();
    this.format = "number";
    this.minor = false;
    this.whole = false;
    this.cells = false;
    this.literal = false;
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("language-changed", this.relabel);
    window.addEventListener("translations-loaded", this.relabel);
    window.addEventListener("translations-ready", this.relabel);
  }

  disconnectedCallback() {
    window.removeEventListener("language-changed", this.relabel);
    window.removeEventListener("translations-loaded", this.relabel);
    window.removeEventListener("translations-ready", this.relabel);
    super.disconnectedCallback();
  }

  private words(value: string | undefined): string {
    if (!value) return "";
    return this.literal ? value : getText(value) || value;
  }

  private options(format: string | undefined): FigureOptions {
    return { format: figureFormat(format), currency: this.currency, minor: this.minor, whole: this.whole, digits: this.digits };
  }

  /** The figure's text as it is drawn: the words given, or the value written in the current language. */
  get text(): string {
    if (this.figure) return this.words(this.figure);
    return typeof this.value === "number" ? formatFigure(this.value, this.options(this.format)) : "";
  }

  /** The change's text with its sign, or empty without a change. */
  get changeText(): string {
    if (typeof this.change !== "number" || !Number.isFinite(this.change)) return "";
    const format = this.changeFormat ?? this.format;
    return formatFigure(this.change, { ...this.options(format), signed: true });
  }

  private slotted(name: string): boolean {
    return [...this.children].some(node => (node.getAttribute("slot") ?? "") === name);
  }

  private drawFigure(text: string) {
    if (!this.cells || !text) return text;
    return html`<span class="hidden-words">${text}</span><span aria-hidden="true">${figureCells(text).map(cell =>
      cell.digit ? html`<span class="ds-stat__digit">${cell.text}</span>` : cell.text)}</span>`;
  }

  render() {
    const changed = () => this.requestUpdate();
    const label = this.words(this.label);
    const caption = this.words(this.caption);
    const change = this.changeText;
    const tone = TONES.includes(this.tone as StatTone) ? this.tone : undefined;
    const changeTone = TONES.includes(this.changeTone as StatTone) ? this.changeTone : undefined;
    const hasLabel = Boolean(label) || this.slotted("label");
    const hasCaption = Boolean(caption) || Boolean(change) || this.slotted("caption");
    const direction = typeof this.change === "number" && this.change !== 0 ? (this.change > 0 ? "up" : "down") : undefined;
    return html`<div class="ds-stat${tone ? ` ds-stat--${tone}` : ""}" part="stat">
      <div class="ds-stat__label" part="label" ?hidden=${!hasLabel}>
        ${this.icon ? html`<span class="ds-stat__icon" part="icon" aria-hidden="true"><ds-icon .type=${this.icon}></ds-icon></span>` : nothing}<slot name="label" @slotchange=${changed}>${label}</slot>
      </div>
      <div class="ds-stat__figure" part="figure"><slot name="figure" @slotchange=${changed}>${this.drawFigure(this.text)}</slot></div>
      <slot></slot>
      <div class="ds-stat__caption" part="caption" ?hidden=${!hasCaption}>
        ${change
          ? html`<span class="ds-stat__change${changeTone ? ` ds-stat__change--${changeTone}` : ""}" part="change">${direction
              ? html`<ds-icon size="small" type=${direction} aria-hidden="true"></ds-icon>`
              : nothing}${change}</span>`
          : nothing}<slot name="caption" @slotchange=${changed}>${caption}</slot>
      </div>
    </div>`;
  }
}

define("ds-stat", Stat);

declare global {
  interface HTMLElementTagNameMap {
    "ds-stat": Stat;
  }
}
