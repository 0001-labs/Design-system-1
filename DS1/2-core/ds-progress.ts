// ds-progress.ts
// Progress, as HTML's <progress> names it: how much of a range a value fills,
// one square high, as a bar half a square high or the range in squares (past
// the end it is "over", filled whole in the danger colour); or, with `steps`,
// a numbered sequence of steps one square high, those before the current one
// done; or, with `dots`, a dot for each slide or page, one square each.
// Drawn by 1-root/progress.css, the same classes a page without scripts
// writes.

import { LitElement, html, nothing, unsafeCSS, type PropertyValues } from "lit";
import { getText } from "../0-face/i18n";
import { define } from "../0-face/define";
import { CutFades } from "../0-face/cut-fade";
import { formatNumber } from "../0-face/format";
import { dotForKey, dotState } from "../0-face/carousel";
import { figureFormat, meterAria, type FigureFormat, type MeterAria } from "./figures";
import "./ds-icon";
import metrics from "../1-root/component-metrics.css?inline";
import progress from "../1-root/progress.css?inline";
import styles from "./styles/ds-progress.css?inline";

/** The most squares a range is drawn in. */
const MOST_SQUARES = 100;

/** Where a step stands: before the current one, the current one, after it, or stopped. */
export type StepState = "done" | "current" | "upcoming" | "failed";
const STATES: readonly StepState[] = ["done", "current", "upcoming", "failed"];

/** A step: its name (a translation key, or literal words), and optionally its own state and where it goes. */
export type Step = string | { label: string; state?: StepState; href?: string };

/** The words assistive technology reads after a step's name for its state; aria-current says the current one. */
const STATE_WORDS: Partial<Record<StepState, string>> = { done: "Done", failed: "Failed" };

/** Each step's state: its own if it names one, else done before `current`, current at it and upcoming after. */
export function stepStates(steps: readonly Step[], current: number): StepState[] {
  return steps.map((step, index) => {
    const own = typeof step === "object" && step ? step.state : undefined;
    if (own && STATES.includes(own)) return own;
    const number = index + 1;
    return number < current ? "done" : number === current ? "current" : "upcoming";
  });
}

/** Detail of `select`. Cancel the event to keep the current dot where it is. */
export interface ProgressSelectDetail {
  /** The dot picked, from 0. */
  index: number;
  /** The dot that was current. */
  previous: number;
}

/** What the element draws: a bar or squares, a sequence of steps, or dots. */
export type ProgressMode = "meter" | "steps" | "dots";

/**
 * @element ds-progress
 *
 * A value against its range (the default):
 * @prop {number} value - The value. Past `max`, it is over.
 * @prop {number} min - The start of the range, 0 by default.
 * @prop {number} max - The end of the range, 1 by default.
 * @prop {number} squares - Draw the range in this many squares, one square each, instead of a bar.
 * @prop {boolean} over - Show it as over whatever the value, where the page decides it.
 * @prop {string} valuetext - What the value says (`aria-valuetext`), in place of "7 of 10".
 * @prop {"number" | "compact" | "percent" | "money"} format - How the value and the range are written in the words.
 * @prop {string} currency - The ISO 4217 code for money.
 * @prop {boolean} minor - The money is counted in the currency's minor unit.
 * @prop {boolean} whole - Money in whole units only.
 * @prop {number} digits - Decimals in the words.
 *
 * A sequence of steps:
 * @prop {Step[]} steps - The steps in order: names, or `{ label, state, href }`. As an attribute, a JSON array.
 * @prop {number} current - The number of the current step, counted from 1. Past the last, every step is done; 0, none has started.
 * @prop {boolean} vertical - One step to a row, with each step's `step-N` slot under it.
 * @slot step-N - In a vertical sequence, what belongs under step N (counted from 1): a line of text, a form.
 *
 * Dots:
 * @prop {number} dots - A dot for each of this many pages.
 * @prop {number} active - The current dot, from 0.
 * @prop {boolean} end - Draw the last dot as an end marker (a ring in the text colour) unless it is current.
 * @prop {string} dotLabel - Each dot's name, with `{index}` for its number from 1: the shared words' "Slide {index}" by default.
 * @fires select - A person picked a dot, by a click or a key. `detail` is `{ index, previous }`. Cancelable.
 *
 * @prop {string} label - The element's name for assistive technology: a translation key, or literal words
 *   (the dots' group is the shared word "Slides" by default).
 * @prop {boolean} literal - Show `label`, `valuetext`, the step names and `dotLabel` as written, never looked up.
 *
 * A value is `role="meter"` on the element with `aria-valuenow` (kept inside
 * the range, as ARIA requires), `-min`, `-max` and `-valuetext` ("12 of 10,
 * over by 2"). Steps are an ordered list; the current one carries
 * `aria-current="step"`, a done or failed one says so in hidden words, and a
 * step with `href` is a link reached with Tab. Dots are a group of buttons,
 * only the current one in the tab order; the arrow keys, Home and End move
 * to the others and pick them.
 *
 * @example
 * <ds-progress label="Spent" value="7400" max="10000" format="money" currency="DKK"></ds-progress>
 * <ds-progress label="Seats" value="7" max="10" squares="10"></ds-progress>
 * <ds-progress current="2" steps='["Apply", "Approval", "Connect payouts"]' label="Getting started" literal></ds-progress>
 * <ds-progress dots="5" active="1"></ds-progress>
 */
export class Progress extends LitElement {
  static properties = {
    value: { type: Number },
    min: { type: Number },
    max: { type: Number },
    squares: { type: Number },
    over: { type: Boolean, reflect: true },
    valuetext: { type: String },
    format: { type: String },
    currency: { type: String },
    minor: { type: Boolean },
    whole: { type: Boolean },
    digits: { type: Number },
    steps: { type: Array },
    current: { type: Number },
    vertical: { type: Boolean, reflect: true },
    dots: { type: Number, reflect: true },
    active: { type: Number, reflect: true },
    end: { type: Boolean, reflect: true },
    dotLabel: { type: String, attribute: "dot-label" },
    label: { type: String },
    literal: { type: Boolean, reflect: true },
  };

  static styles = [unsafeCSS(metrics), unsafeCSS(progress), unsafeCSS(styles)];
  /** Words cut short fade over their last square, never an ellipsis: marks them `data-cut="end"` while they do not fit. */
  private cuts = new CutFades(this, { selector: ".ds-progress__label" });

  declare value: number;
  declare min: number;
  declare max: number;
  declare squares: number | undefined;
  declare over: boolean;
  declare valuetext: string | undefined;
  declare format: FigureFormat;
  declare currency: string | undefined;
  declare minor: boolean;
  declare whole: boolean;
  declare digits: number | undefined;
  declare steps: Step[] | undefined;
  declare current: number;
  declare vertical: boolean;
  declare dots: number | undefined;
  declare active: number;
  declare end: boolean;
  declare dotLabel: string | undefined;
  declare label: string | undefined;
  declare literal: boolean;

  /** The role this element last set, so a role the page wrote is left alone. */
  private ownRole: string | null = null;
  private focusAfterUpdate = false;
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
    this.current = 1;
    this.vertical = false;
    this.active = 0;
    this.end = false;
    this.literal = false;
  }

  /** What the element draws, from what it was given: steps, dots, or a value against its range. */
  get mode(): ProgressMode {
    if (Array.isArray(this.steps)) return "steps";
    if (this.dots !== undefined && this.dots !== null) return "dots";
    return "meter";
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

  private wordsWith(value: string | undefined, fallback: string, params?: Record<string, number>): string {
    const text = value && this.literal ? value : getText(value || fallback, params) || value || fallback;
    return params ? text.replace(/\{\{?(\w+)\}?\}/g, (whole, name: string) => (name in params ? String(params[name]) : whole)) : text;
  }

  /** Sets a role of this element's own; a role the page wrote stays. */
  private setRole(role: string | null) {
    const written = this.getAttribute("role");
    if (written !== null && written !== this.ownRole) return;
    this.ownRole = role;
    if (role === null) this.removeAttribute("role");
    else if (written !== role) this.setAttribute("role", role);
  }

  // ---- A value against its range ----

  /** The values the element says and draws, in the current language. */
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

  // ---- A sequence ----

  /** Each step's state, as drawn. */
  get states(): StepState[] {
    return stepStates(Array.isArray(this.steps) ? this.steps : [], Number(this.current));
  }

  private slotted(name: string): boolean {
    return [...this.children].some(node => node.getAttribute("slot") === name);
  }

  // ---- Dots ----

  /** The number of dots drawn: a whole number, never below zero. */
  get dotCount(): number {
    return Number.isFinite(this.dots) ? Math.max(0, Math.floor(this.dots as number)) : 0;
  }

  /** The current dot, inside the count. */
  get currentDot(): number {
    const active = Number.isFinite(this.active) ? Math.floor(this.active) : 0;
    return Math.max(0, Math.min(this.dotCount - 1, active));
  }

  /** Pick a dot as a person would: fires `select` and, unless it is cancelled, makes it current. */
  select(index: number): boolean {
    if (this.dotCount === 0) return false;
    const target = Math.max(0, Math.min(this.dotCount - 1, Math.floor(index)));
    const event = new CustomEvent<ProgressSelectDetail>("select", {
      bubbles: true, composed: true, cancelable: true, detail: { index: target, previous: this.currentDot },
    });
    if (!this.dispatchEvent(event)) return false;
    this.active = target;
    return true;
  }

  private dotKeydown(event: KeyboardEvent, index: number) {
    const to = dotForKey(event.key, index, this.dotCount, getComputedStyle(this).direction === "rtl");
    if (to === undefined) return;
    event.preventDefault();
    if (this.select(to)) {
      this.focusAfterUpdate = true;
      return;
    }
    // A cancelled pick leaves the current dot as it is; focus still follows the key.
    this.renderRoot.querySelectorAll<HTMLButtonElement>(".ds-progress__dot")[to]?.focus();
  }

  protected willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    const mode = this.mode;
    if (mode === "meter") {
      const aria = this.aria;
      const label = this.words(this.label);
      this.setRole("meter");
      this.setAttribute("aria-valuenow", String(aria.now));
      this.setAttribute("aria-valuemin", String(aria.min));
      this.setAttribute("aria-valuemax", String(aria.max));
      this.setAttribute("aria-valuetext", this.words(this.valuetext) || aria.text);
      if (label) this.setAttribute("aria-label", label);
      else if (changed.has("label")) this.removeAttribute("aria-label");
      this.toggleAttribute("data-over", aria.over);
      return;
    }
    for (const name of ["aria-valuenow", "aria-valuemin", "aria-valuemax", "aria-valuetext", "data-over"]) this.removeAttribute(name);
    if (mode === "dots") {
      this.setRole("group");
      if (!this.hasAttribute("aria-labelledby")) this.setAttribute("aria-label", this.wordsWith(this.label, "Slides"));
      return;
    }
    // Steps name their list inside; the element itself has no role.
    this.setRole(null);
    if (changed.has("label") || changed.has("steps")) this.removeAttribute("aria-label");
  }

  protected updated(changed: PropertyValues<this>) {
    super.updated(changed);
    if (!this.focusAfterUpdate) return;
    this.focusAfterUpdate = false;
    this.renderRoot.querySelector<HTMLButtonElement>('[aria-current="true"]')?.focus();
  }

  private renderMeter() {
    const aria = this.aria;
    const count = this.squareCount;
    const over = aria.over ? " ds-progress--over" : "";
    if (count) {
      const on = Math.round(aria.fraction * count);
      return html`<div class="ds-progress ds-progress--squares${over}" part="progress">${Array.from({ length: count }, (_, index) =>
        html`<span class="ds-progress__square${index < on ? " ds-progress__square--on" : ""}" part="square"></span>`)}</div>`;
    }
    return html`<div class="ds-progress${over}" part="progress" style="--ds-progress-value: ${aria.fraction}"><span class="ds-progress__fill" part="fill"></span></div>`;
  }

  private renderSteps() {
    const steps = Array.isArray(this.steps) ? this.steps : [];
    const states = this.states;
    const label = this.words(this.label);
    const changed = () => this.requestUpdate();
    return html`<ol class="ds-progress ds-progress--steps${this.vertical ? " ds-progress--vertical" : ""}" part="steps" aria-label=${label || nothing}>
      ${steps.map((step, index) => {
        const state = states[index]!;
        const name = this.words(typeof step === "string" ? step : step?.label);
        const href = typeof step === "object" && step ? step.href : undefined;
        const number = index + 1;
        const said = STATE_WORDS[state];
        const mark = state === "done" || state === "failed"
          ? html`<ds-icon size="small" type=${state === "done" ? "check" : "warning"}></ds-icon>`
          : formatNumber(number);
        const face = html`<span class="ds-progress__mark" part="mark" aria-hidden="true">${mark}</span><span class="ds-progress__label" part="label">${name}</span>${said
          ? html`<span class="ds-progress__state"> ${getText(said) || said}</span>`
          : nothing}`;
        return html`<li class="ds-progress__step${state === "upcoming" ? "" : ` ds-progress__step--${state}`}" part="step" data-state=${state} aria-current=${state === "current" ? "step" : nothing}>
          ${href ? html`<a class="ds-progress__link" part="link" href=${href}>${face}</a>` : face}
          ${this.vertical
            ? html`<div class="ds-progress__body" part="body" ?hidden=${!this.slotted(`step-${number}`)}><slot name=${`step-${number}`} @slotchange=${changed}></slot></div>`
            : nothing}
        </li>`;
      })}
    </ol>`;
  }

  private renderDots() {
    const current = this.currentDot;
    return html`<div class="ds-progress ds-progress--dots" part="dots">
      ${Array.from({ length: this.dotCount }, (_, index) => {
        const state = dotState(index, current, this.dotCount, this.end);
        return html`<button
          class="ds-progress__dot"
          part="dot"
          type="button"
          data-state=${state}
          aria-label=${this.wordsWith(this.dotLabel, "Slide {index}", { index: index + 1 })}
          aria-current=${state === "current" ? "true" : "false"}
          tabindex=${state === "current" ? 0 : -1}
          @click=${() => this.select(index)}
          @keydown=${(event: KeyboardEvent) => this.dotKeydown(event, index)}
        ></button>`;
      })}
    </div>`;
  }

  render() {
    const mode = this.mode;
    return mode === "steps" ? this.renderSteps() : mode === "dots" ? this.renderDots() : this.renderMeter();
  }
}

define("ds-progress", Progress);

declare global {
  interface HTMLElementTagNameMap {
    "ds-progress": Progress;
  }
}
