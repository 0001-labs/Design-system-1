// ds-meter.ts
// How much of a range a value fills, one square high: a bar half a square
// high, or the range in squares. Past the end it is "over", filled whole in
// the danger colour. Drawn by 1-root/figures.css, the same classes a page
// without scripts writes.

import { LitElement, html, unsafeCSS, type PropertyValues } from "lit";
import { getText } from "../0-face/i18n";
import { define } from "../0-face/define";
import { figureFormat, meterAria, type FigureFormat, type MeterAria } from "./figures";
import metrics from "../1-root/component-metrics.css?inline";
import figures from "../1-root/figures.css?inline";
import styles from "./styles/ds-meter.css?inline";

/** The most squares a meter draws. */
const MOST_SQUARES = 100;

/**
 * @element ds-meter
 * @prop {number} value - The value. Past `max`, the meter is over.
 * @prop {number} min - The start of the range, 0 by default.
 * @prop {number} max - The end of the range, 1 by default.
 * @prop {number} squares - Draw the range in this many squares, one square each, instead of a bar.
 * @prop {boolean} over - Show the meter as over whatever its value, where the page decides it.
 * @prop {string} label - The meter's name for assistive technology: a translation key, or literal words.
 * @prop {string} valuetext - What the value says (`aria-valuetext`), in place of "7 of 10".
 * @prop {"number" | "compact" | "percent" | "money"} format - How the value and the range are written in the words.
 * @prop {string} currency - The ISO 4217 code for money.
 * @prop {boolean} minor - The money is counted in the currency's minor unit.
 * @prop {boolean} whole - Money in whole units only.
 * @prop {number} digits - Decimals in the words.
 * @prop {boolean} literal - Show `label` and `valuetext` as written, never looked up.
 *
 * The element is `role="meter"` with `aria-valuenow`, `aria-valuemin`,
 * `aria-valuemax` and `aria-valuetext`. `aria-valuenow` stays inside the
 * range, as ARIA requires; the words say when the value is past its end
 * ("12 of 10, over by 2").
 *
 * @example
 * <ds-meter label="Spent" value="7400" max="10000" format="money" currency="DKK"></ds-meter>
 * <ds-meter label="Seats" value="7" max="10" squares="10"></ds-meter>
 */
export class Meter extends LitElement {
  static properties = {
    value: { type: Number },
    min: { type: Number },
    max: { type: Number },
    squares: { type: Number },
    over: { type: Boolean, reflect: true },
    label: { type: String },
    valuetext: { type: String },
    format: { type: String },
    currency: { type: String },
    minor: { type: Boolean },
    whole: { type: Boolean },
    digits: { type: Number },
    literal: { type: Boolean, reflect: true },
  };

  static styles = [unsafeCSS(metrics), unsafeCSS(figures), unsafeCSS(styles)];

  declare value: number;
  declare min: number;
  declare max: number;
  declare squares: number | undefined;
  declare over: boolean;
  declare label: string | undefined;
  declare valuetext: string | undefined;
  declare format: FigureFormat;
  declare currency: string | undefined;
  declare minor: boolean;
  declare whole: boolean;
  declare digits: number | undefined;
  declare literal: boolean;

  private readonly relabel = () => this.requestUpdate();

  constructor() {
    super();
    this.value = 0;
    this.min = 0;
    this.max = 1;
    this.over = false;
    this.format = "number";
    this.minor = false;
    this.whole = false;
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

  /** The values the meter says and draws, in the current language. */
  get aria(): MeterAria {
    return meterAria(this.value, this.min, this.max, {
      over: this.over, format: figureFormat(this.format), currency: this.currency,
      minor: this.minor, whole: this.whole, digits: this.digits,
    });
  }

  /** How many squares the range is drawn in, or 0 for a bar. */
  get squareCount(): number {
    const count = Math.floor(Number(this.squares));
    return Number.isFinite(count) && count > 0 ? Math.min(MOST_SQUARES, count) : 0;
  }

  protected willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    const aria = this.aria;
    const label = this.words(this.label);
    this.setAttribute("role", "meter");
    this.setAttribute("aria-valuenow", String(aria.now));
    this.setAttribute("aria-valuemin", String(aria.min));
    this.setAttribute("aria-valuemax", String(aria.max));
    this.setAttribute("aria-valuetext", this.words(this.valuetext) || aria.text);
    if (label) this.setAttribute("aria-label", label);
    else if (changed.has("label")) this.removeAttribute("aria-label");
    this.toggleAttribute("data-over", aria.over);
  }

  render() {
    const aria = this.aria;
    const count = this.squareCount;
    const over = aria.over ? " ds-meter--over" : "";
    if (count) {
      const on = Math.round(aria.fraction * count);
      return html`<div class="ds-meter ds-meter--squares${over}" part="meter">${Array.from({ length: count }, (_, index) =>
        html`<span class="ds-meter__square${index < on ? " ds-meter__square--on" : ""}" part="square"></span>`)}</div>`;
    }
    return html`<div class="ds-meter${over}" part="meter" style="--ds-meter-value: ${aria.fraction}"><span class="ds-meter__fill" part="fill"></span></div>`;
  }
}

define("ds-meter", Meter);

declare global {
  interface HTMLElementTagNameMap {
    "ds-meter": Meter;
  }
}
