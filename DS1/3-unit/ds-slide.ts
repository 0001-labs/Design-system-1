// ds-slide.ts
// A strip of things of any width, several in view, that slides sideways and
// stops with an item at its start; it can run on to the window's edges, loop
// without an end and, when asked, move on by itself. Drawn by
// 1-root/slide.css, the same classes a page without scripts writes, and moved
// by the helpers it shares with 0-face/slide.ts.

import { LitElement, html, nothing, unsafeCSS, type PropertyValues } from "lit";
import { getText } from "../0-face/i18n";
import { define } from "../0-face/define";
import { COPY, autoplayInterval, startSlide, type SlideHandle } from "../0-face/slide";
import { prefersReducedMotion } from "../0-face/carousel";
import "../2-core/ds-icon";
import metrics from "../1-root/component-metrics.css?inline";
import controls from "../1-root/controls.css?inline";
import slide from "../1-root/slide.css?inline";
import styles from "./styles/ds-slide.css?inline";

/** A whole number of squares, or `undefined` for a value that is not one. */
const squares = (value: number | undefined) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.floor(value) : undefined;

/**
 * @element ds-slide
 * @prop {string} label - The region's name: a translation key, or literal
 *   words. Name what the items show ("Work", "Templates").
 * @prop {boolean} literal - Show `label` as written, never looked up.
 * @prop {string} bleed - `none` (the default) keeps the strip in its box;
 *   `end` runs it on to the window's end edge, the first item still on the
 *   box's start; `both` runs it to both edges.
 * @prop {boolean} loop - Hold the items three times over, so the strip has no
 *   end. The copies are hidden from assistive technology and never focused.
 * @prop {string} autoplay - Move on an item at a time by itself: empty for
 *   every five seconds, or a number of milliseconds. Held while a person is
 *   in the strip or cannot see it, never under reduced motion, and always
 *   with a pause button.
 * @prop {boolean} buttons - Show previous and next buttons below the strip.
 * @prop {number} gap - Squares between items; one by default.
 * @prop {boolean} free - Slide freely, without stopping at items.
 *
 * @slot - The items, one element each, any width.
 *
 * The element is a region named by `label`; the items are a list. Options
 * are read when the element connects; change them by putting a new element
 * in its place.
 *
 * @example
 * <ds-slide label="Work" bleed="end" buttons>
 *   <ds-card href="/one" width="14" height="22">…</ds-card>
 *   <ds-card href="/two" width="28" height="22">…</ds-card>
 * </ds-slide>
 */
export class Slide extends LitElement {
  static properties = {
    label: { type: String },
    literal: { type: Boolean, reflect: true },
    bleed: { type: String, reflect: true },
    loop: { type: Boolean, reflect: true },
    autoplay: { type: String, reflect: true },
    buttons: { type: Boolean, reflect: true },
    gap: { type: Number },
    free: { type: Boolean, reflect: true },
    paused: { state: true },
  };

  static styles = [unsafeCSS(metrics), unsafeCSS(controls), unsafeCSS(slide), unsafeCSS(styles)];

  declare label: string | undefined;
  declare literal: boolean;
  declare bleed: "none" | "end" | "both";
  declare loop: boolean;
  declare autoplay: string | null;
  declare buttons: boolean;
  declare gap: number | undefined;
  declare free: boolean;
  declare paused: boolean;

  private handle: SlideHandle | null = null;
  private readonly relabel = () => { this.labelItems(); this.requestUpdate(); };

  constructor() {
    super();
    this.literal = false;
    this.bleed = "none";
    this.loop = false;
    this.autoplay = null;
    this.buttons = false;
    this.free = false;
    this.paused = false;
  }

  /** The items: the elements given to the slide, without a loop's copies. */
  get items(): HTMLElement[] {
    return [...this.children].filter((child): child is HTMLElement => child instanceof HTMLElement && !child.hasAttribute("slot") && !child.hasAttribute(COPY));
  }

  private get every(): number {
    return autoplayInterval(this.autoplay);
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("language-changed", this.relabel);
    window.addEventListener("translations-loaded", this.relabel);
  }

  disconnectedCallback() {
    window.removeEventListener("language-changed", this.relabel);
    window.removeEventListener("translations-loaded", this.relabel);
    this.handle?.stop();
    this.handle = null;
    super.disconnectedCallback();
  }

  private words(value: string | undefined, fallback: string): string {
    return value && this.literal ? value : getText(value || fallback) || value || fallback;
  }

  private labelItems() {
    for (const item of this.items) if (!item.hasAttribute("role")) item.setAttribute("role", "listitem");
  }

  protected willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (!this.hasAttribute("role")) this.setAttribute("role", "region");
    if (!this.hasAttribute("aria-labelledby") && this.label) this.setAttribute("aria-label", this.words(this.label, this.label));
    const gap = squares(this.gap);
    if (gap !== undefined) this.style.setProperty("--ds-slide-gap", `calc(var(--ds-unit) * ${gap})`);
    else this.style.removeProperty("--ds-slide-gap");
  }

  protected firstUpdated() {
    this.labelItems();
    const track = this.renderRoot.querySelector<HTMLElement>(".ds-slide__track");
    const block = this.renderRoot.querySelector<HTMLElement>(".ds-slide");
    if (!track || !block) return;
    this.handle = startSlide(this, track, this, {
      bleed: this.bleed === "end" || this.bleed === "both" ? this.bleed : "none",
      loop: this.loop,
      autoplay: this.every,
    });
  }

  /** Moves an item on, as the next button does. */
  next(): void {
    this.handle?.step(1);
  }

  /** Moves an item back, as the previous button does. */
  previous(): void {
    this.handle?.step(-1);
  }

  private toggle() {
    this.paused = !this.paused;
    this.handle?.pause(this.paused);
  }

  render() {
    const moving = this.every > 0 && !prefersReducedMotion();
    const button = (which: "previous" | "next") => html`<button
      class="ds-button ds-button--icon ds-slide__${which}"
      part=${which}
      type="button"
      aria-label=${this.words(undefined, which === "previous" ? "Previous slide" : "Next slide")}
      @click=${() => (which === "previous" ? this.previous() : this.next())}
    ><ds-icon type=${which === "previous" ? "left" : "right"} aria-hidden="true"></ds-icon></button>`;
    const bleed = this.bleed === "end" || this.bleed === "both" ? this.bleed : nothing;
    return html`<div class="ds-slide" part="slide" data-bleed=${bleed} data-snap=${this.free ? "none" : nothing}>
      <div class="ds-slide__track" part="track" role="list"><slot @slotchange=${() => this.labelItems()}></slot></div>
      ${this.buttons || moving
        ? html`<div class="ds-slide__controls" part="controls">
            ${moving
              ? html`<button
                  class="ds-button ds-button--icon ds-slide__pause"
                  part="pause"
                  type="button"
                  aria-pressed=${String(this.paused)}
                  aria-label=${this.words(undefined, this.paused ? "Play" : "Pause")}
                  @click=${this.toggle}
                ><ds-icon type=${this.paused ? "play-alt" : "pause"} aria-hidden="true"></ds-icon></button>`
              : nothing}
            ${this.buttons ? html`${button("previous")}${button("next")}` : nothing}
          </div>`
        : nothing}
    </div>`;
  }
}

define("ds-slide", Slide);

declare global {
  interface HTMLElementTagNameMap {
    "ds-slide": Slide;
  }
}
