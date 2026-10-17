// ds-pagedots.ts
// A dot for each slide or page, one square each: the ones passed, the current
// one, the next and the rest, and an optional end marker. Pressing a dot or
// moving with the arrow keys, Home and End fires `select`. Drawn by
// 1-root/carousel.css, the same classes a page without scripts writes.

import { LitElement, html, unsafeCSS, type PropertyValues } from "lit";
import { getText } from "../0-face/i18n";
import { define } from "../0-face/define";
import { dotForKey, dotState } from "../0-face/carousel";
import metrics from "../1-root/component-metrics.css?inline";
import carousel from "../1-root/carousel.css?inline";
import styles from "./styles/ds-pagedots.css?inline";

/** Detail of `select`. Cancel the event to keep the current dot where it is. */
export interface PagedotsSelectDetail {
  /** The dot picked, from 0. */
  index: number;
  /** The dot that was current. */
  previous: number;
}

/**
 * @element ds-pagedots
 * @prop {number} count - How many dots. Three by default.
 * @prop {number} active - The current dot, from 0.
 * @prop {boolean} end - Draw the last dot as an end marker (a ring in the
 *   text colour) unless it is current: a way on to something else.
 * @prop {string} label - The group's name: a translation key, or literal
 *   words. The shared word "Slides" by default.
 * @prop {string} dotLabel - Each dot's name, with `{index}` for its number
 *   from 1: the shared words' "Slide {index}" by default.
 * @prop {boolean} literal - Show `label` and `dotLabel` as written, never looked up.
 *
 * @fires select - A person picked a dot, by a click or a key. `detail` is
 *   `{ index, previous }`. Cancelable: unless it is cancelled, the dot becomes
 *   current.
 *
 * The element is a group of buttons. Only the current dot is in the tab
 * order; the arrow keys (following the reading direction), Home and End move
 * to the others and pick them.
 *
 * @example
 * <ds-pagedots count="5" active="1"></ds-pagedots>
 */
export class Pagedots extends LitElement {
  static properties = {
    count: { type: Number, reflect: true },
    active: { type: Number, reflect: true },
    end: { type: Boolean, reflect: true },
    label: { type: String },
    dotLabel: { type: String, attribute: "dot-label" },
    literal: { type: Boolean, reflect: true },
  };

  static styles = [unsafeCSS(metrics), unsafeCSS(carousel), unsafeCSS(styles)];

  declare count: number;
  declare active: number;
  declare end: boolean;
  declare label: string | undefined;
  declare dotLabel: string | undefined;
  declare literal: boolean;

  /** The role this element last set, so a role the page wrote is left alone. */
  private ownRole: string | null = null;
  private focusAfterUpdate = false;
  private readonly relabel = () => this.requestUpdate();

  constructor() {
    super();
    this.count = 3;
    this.active = 0;
    this.end = false;
    this.literal = false;
  }

  /** The number of dots drawn: a whole number, never below zero. */
  get dots(): number {
    return Number.isFinite(this.count) ? Math.max(0, Math.floor(this.count)) : 0;
  }

  /** The current dot, inside the count. */
  get current(): number {
    const active = Number.isFinite(this.active) ? Math.floor(this.active) : 0;
    return Math.max(0, Math.min(this.dots - 1, active));
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("language-changed", this.relabel);
    window.addEventListener("translations-loaded", this.relabel);
    const role = this.getAttribute("role");
    if (role === null || role === this.ownRole) {
      this.ownRole = "group";
      this.setAttribute("role", "group");
    }
  }

  disconnectedCallback() {
    window.removeEventListener("language-changed", this.relabel);
    window.removeEventListener("translations-loaded", this.relabel);
    super.disconnectedCallback();
  }

  private words(value: string | undefined, fallback: string, params?: Record<string, number>): string {
    const text = value && this.literal ? value : getText(value || fallback, params) || value || fallback;
    return params ? text.replace(/\{\{?(\w+)\}?\}/g, (whole, name: string) => (name in params ? String(params[name]) : whole)) : text;
  }

  protected willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (!this.hasAttribute("aria-labelledby")) this.setAttribute("aria-label", this.words(this.label, "Slides"));
  }

  protected updated(changed: PropertyValues<this>) {
    super.updated(changed);
    if (!this.focusAfterUpdate) return;
    this.focusAfterUpdate = false;
    this.renderRoot.querySelector<HTMLButtonElement>('[aria-current="true"]')?.focus();
  }

  /** Pick a dot as a person would: fires `select` and, unless it is cancelled, makes it current. */
  select(index: number): boolean {
    if (this.dots === 0) return false;
    const target = Math.max(0, Math.min(this.dots - 1, Math.floor(index)));
    const event = new CustomEvent<PagedotsSelectDetail>("select", {
      bubbles: true, composed: true, cancelable: true, detail: { index: target, previous: this.current },
    });
    if (!this.dispatchEvent(event)) return false;
    this.active = target;
    return true;
  }

  private keydown(event: KeyboardEvent, index: number) {
    const to = dotForKey(event.key, index, this.dots, getComputedStyle(this).direction === "rtl");
    if (to === undefined) return;
    event.preventDefault();
    if (this.select(to)) {
      this.focusAfterUpdate = true;
      return;
    }
    // A cancelled pick leaves the current dot as it is; focus still follows the key.
    this.renderRoot.querySelectorAll<HTMLButtonElement>(".ds-pagedots__dot")[to]?.focus();
  }

  render() {
    const current = this.current;
    return html`<div class="ds-pagedots" part="dots">
      ${Array.from({ length: this.dots }, (_, index) => {
        const state = dotState(index, current, this.dots, this.end);
        return html`<button
          class="ds-pagedots__dot"
          part="dot"
          type="button"
          data-state=${state}
          aria-label=${this.words(this.dotLabel, "Slide {index}", { index: index + 1 })}
          aria-current=${state === "current" ? "true" : "false"}
          tabindex=${state === "current" ? 0 : -1}
          @click=${() => this.select(index)}
          @keydown=${(event: KeyboardEvent) => this.keydown(event, index)}
        ></button>`;
      })}
    </div>`;
  }
}

define("ds-pagedots", Pagedots);

declare global {
  interface HTMLElementTagNameMap {
    "ds-pagedots": Pagedots;
  }
}
