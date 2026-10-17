// ds-steps.ts
// A numbered sequence of steps, one square high: those before the current
// one done, the current one marked with aria-current="step", the rest still
// to come. Drawn by 1-root/figures.css, the same classes a page without
// scripts writes on an <ol>.

import { LitElement, html, nothing, unsafeCSS } from "lit";
import { getText } from "../0-face/i18n";
import { define } from "../0-face/define";
import { formatNumber } from "../0-face/format";
import "./ds-icon";
import metrics from "../1-root/component-metrics.css?inline";
import figures from "../1-root/figures.css?inline";
import styles from "./styles/ds-steps.css?inline";

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

/**
 * @element ds-steps
 * @prop {Step[]} steps - The steps in order: names, or `{ label, state, href }`. As an attribute, a JSON array.
 * @prop {number} current - The number of the current step, counted from 1. Past the last, every step is done; 0, none has started.
 * @prop {boolean} vertical - One step to a row, with each step's `step-N` slot under it.
 * @prop {string} label - The sequence's name for assistive technology: a translation key, or literal words.
 * @prop {boolean} literal - Show the names and `label` as written, never looked up.
 *
 * @slot step-N - In a vertical sequence, what belongs under step N (counted from 1): a line of text, a form.
 *
 * The steps are an ordered list. The current one carries `aria-current="step"`;
 * a done or failed step says so in hidden words ("Done", "Failed", the
 * shared words). A step with `href` is a link around its mark and name, so it
 * is reached with Tab; the others are not focusable.
 *
 * @example
 * <ds-steps current="2" steps='["Apply", "Approval", "Connect payouts", "Start earning"]' label="Getting started" literal></ds-steps>
 */
export class Steps extends LitElement {
  static properties = {
    steps: { type: Array },
    current: { type: Number },
    vertical: { type: Boolean, reflect: true },
    label: { type: String },
    literal: { type: Boolean, reflect: true },
  };

  static styles = [unsafeCSS(metrics), unsafeCSS(figures), unsafeCSS(styles)];

  declare steps: Step[];
  declare current: number;
  declare vertical: boolean;
  declare label: string | undefined;
  declare literal: boolean;

  private readonly relabel = () => this.requestUpdate();

  constructor() {
    super();
    this.steps = [];
    this.current = 1;
    this.vertical = false;
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

  /** Each step's state, as drawn. */
  get states(): StepState[] {
    return stepStates(Array.isArray(this.steps) ? this.steps : [], Number(this.current));
  }

  private slotted(name: string): boolean {
    return [...this.children].some(node => node.getAttribute("slot") === name);
  }

  render() {
    const steps = Array.isArray(this.steps) ? this.steps : [];
    const states = this.states;
    const label = this.words(this.label);
    const changed = () => this.requestUpdate();
    return html`<ol class="ds-steps${this.vertical ? " ds-steps--vertical" : ""}" part="steps" aria-label=${label || nothing}>
      ${steps.map((step, index) => {
        const state = states[index]!;
        const name = this.words(typeof step === "string" ? step : step?.label);
        const href = typeof step === "object" && step ? step.href : undefined;
        const number = index + 1;
        const said = STATE_WORDS[state];
        const mark = state === "done" || state === "failed"
          ? html`<ds-icon size="small" type=${state === "done" ? "check" : "warning"}></ds-icon>`
          : formatNumber(number);
        const face = html`<span class="ds-steps__mark" part="mark" aria-hidden="true">${mark}</span><span class="ds-steps__label" part="label">${name}</span>${said
          ? html`<span class="ds-steps__state"> ${getText(said) || said}</span>`
          : nothing}`;
        return html`<li class="ds-steps__step${state === "upcoming" ? "" : ` ds-steps__step--${state}`}" part="step" data-state=${state} aria-current=${state === "current" ? "step" : nothing}>
          ${href ? html`<a class="ds-steps__link" part="link" href=${href}>${face}</a>` : face}
          ${this.vertical
            ? html`<div class="ds-steps__body" part="body" ?hidden=${!this.slotted(`step-${number}`)}><slot name=${`step-${number}`} @slotchange=${changed}></slot></div>`
            : nothing}
        </li>`;
      })}
    </ol>`;
  }
}

define("ds-steps", Steps);

declare global {
  interface HTMLElementTagNameMap {
    "ds-steps": Steps;
  }
}
