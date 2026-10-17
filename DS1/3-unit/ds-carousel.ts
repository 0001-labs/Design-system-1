// ds-carousel.ts
// Slides side by side that snap sideways, one to a stop, tied to a row of
// page dots and optional previous and next buttons. Drawn by
// 1-root/carousel.css, the same classes a page without scripts writes, and
// moved by the helpers it shares with 0-face/carousel.ts.

import { LitElement, html, nothing, unsafeCSS, type PropertyValues } from "lit";
import { getText } from "../0-face/i18n";
import { define } from "../0-face/define";
import { nearestSlide, scrollToSlide } from "../0-face/carousel";
import "../2-core/ds-icon";
import "../2-core/ds-pagedots";
import type { PagedotsSelectDetail } from "../2-core/ds-pagedots";
import metrics from "../1-root/component-metrics.css?inline";
import controls from "../1-root/controls.css?inline";
import carousel from "../1-root/carousel.css?inline";
import styles from "./styles/ds-carousel.css?inline";

/** Detail of `change`: the slide now in view and the one before it. */
export interface CarouselChangeDetail {
  index: number;
  previous: number;
}

/** A whole number of squares, or `undefined` for a value that is not one. */
const squares = (value: number | undefined, least: number) =>
  typeof value === "number" && Number.isFinite(value) && value >= least ? Math.floor(value) : undefined;

/**
 * @element ds-carousel
 * @prop {string} label - The region's name: a translation key, or literal
 *   words. Name what the slides show ("Colours", "What people say").
 * @prop {boolean} literal - Show `label` as written, never looked up.
 * @prop {number} current - The slide in view, from 0. Setting it scrolls there.
 * @prop {boolean} buttons - Show previous and next buttons beside the dots.
 * @prop {boolean} noDots - Leave the dots out (`no-dots`).
 * @prop {boolean} end - Draw the last dot as an end marker.
 * @prop {number} slideWidth - Each slide's width in whole squares
 *   (`slide-width`); the carousel's own width when not set.
 * @prop {number} gap - Squares between slides; one by default.
 *
 * @slot - The slides, one element each.
 *
 * @fires change - A person moved to another slide: by swiping, scrolling, a
 *   dot or a button. `detail` is `{ index, previous }`. Setting `current` or
 *   calling `goTo()` does not fire it.
 *
 * The element is a region described as a carousel, named by `label`; each
 * slide is a group labelled "2 of 5" unless the page labels it, and the
 * current slide is announced politely when it changes. There is no autoplay.
 *
 * @example
 * <ds-carousel label="Colours" slide-width="12" buttons>
 *   <figure>…</figure>
 *   <figure>…</figure>
 * </ds-carousel>
 */
export class Carousel extends LitElement {
  static properties = {
    label: { type: String },
    literal: { type: Boolean, reflect: true },
    current: { type: Number, reflect: true },
    buttons: { type: Boolean, reflect: true },
    noDots: { type: Boolean, reflect: true, attribute: "no-dots" },
    end: { type: Boolean, reflect: true },
    slideWidth: { type: Number, attribute: "slide-width" },
    gap: { type: Number },
    count: { state: true },
    announcement: { state: true },
  };

  static styles = [unsafeCSS(metrics), unsafeCSS(controls), unsafeCSS(carousel), unsafeCSS(styles)];

  declare label: string | undefined;
  declare literal: boolean;
  declare current: number;
  declare buttons: boolean;
  declare noDots: boolean;
  declare end: boolean;
  declare slideWidth: number | undefined;
  declare gap: number | undefined;
  declare count: number;
  declare announcement: string;

  /** Attributes this element wrote, so what the page wrote is left alone. */
  private readonly own = new Map<Element, Set<string>>();
  /** A slide asked for by `current`, a dot or a button, kept until its scroll stops. */
  private pending: number | undefined;
  private settle: ReturnType<typeof setTimeout> | undefined;
  private frame = 0;
  /** `current` changed from inside: the track is already there or on its way. */
  private moving = false;
  private readonly relabel = () => { this.labelSlides(); this.requestUpdate(); };

  constructor() {
    super();
    this.literal = false;
    this.current = 0;
    this.buttons = false;
    this.noDots = false;
    this.end = false;
    this.count = 0;
    this.announcement = "";
  }

  /** The slides: the elements given to the carousel. */
  get slides(): HTMLElement[] {
    return [...this.children].filter((child): child is HTMLElement => child instanceof HTMLElement && !child.hasAttribute("slot"));
  }

  private get track(): HTMLElement | null {
    return this.renderRoot.querySelector<HTMLElement>(".ds-carousel__track");
  }

  /** The slide in view, inside the count. */
  private get index(): number {
    const current = Number.isFinite(this.current) ? Math.floor(this.current) : 0;
    return Math.max(0, Math.min(this.count - 1, current));
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("language-changed", this.relabel);
    window.addEventListener("translations-loaded", this.relabel);
  }

  disconnectedCallback() {
    window.removeEventListener("language-changed", this.relabel);
    window.removeEventListener("translations-loaded", this.relabel);
    cancelAnimationFrame(this.frame);
    clearTimeout(this.settle);
    super.disconnectedCallback();
  }

  private words(value: string | undefined, fallback: string, params?: Record<string, number>): string {
    const text = value && this.literal ? value : getText(value || fallback, params) || value || fallback;
    return params ? text.replace(/\{\{?(\w+)\}?\}/g, (whole, name: string) => (name in params ? String(params[name]) : whole)) : text;
  }

  /** Writes an attribute the page has not written, and remembers it as this element's. */
  private write(element: Element, name: string, value: string) {
    const mine = this.own.get(element) ?? new Set<string>();
    if (element.hasAttribute(name) && !mine.has(name)) return;
    mine.add(name);
    this.own.set(element, mine);
    if (element.getAttribute(name) !== value) element.setAttribute(name, value);
  }

  private labelSlides() {
    const slides = this.slides;
    const labelled = (slide: Element) => slide.hasAttribute("aria-labelledby");
    slides.forEach((slide, index) => {
      this.write(slide, "role", "group");
      this.write(slide, "aria-roledescription", this.words(undefined, "Slide"));
      if (!labelled(slide)) this.write(slide, "aria-label", this.words(undefined, "{index} of {count}", { index: index + 1, count: slides.length }));
    });
    this.count = slides.length;
  }

  protected willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    // The slides are counted before the first paint, so `current` can start on any of them.
    if (!this.hasUpdated) this.labelSlides();
    this.write(this, "role", "region");
    this.write(this, "aria-roledescription", this.words(undefined, "Carousel"));
    if (!this.hasAttribute("aria-labelledby")) this.write(this, "aria-label", this.words(this.label, "Carousel"));
    const width = squares(this.slideWidth, 1);
    const gap = squares(this.gap, 0);
    if (width) this.style.setProperty("--ds-carousel-slide", `calc(var(--ds-unit) * ${width})`);
    else this.style.removeProperty("--ds-carousel-slide");
    if (gap !== undefined) this.style.setProperty("--ds-carousel-gap", `calc(var(--ds-unit) * ${gap})`);
    else this.style.removeProperty("--ds-carousel-gap");
  }

  protected updated(changed: PropertyValues<this>) {
    super.updated(changed);
    if (changed.has("current")) {
      if (this.moving) { this.moving = false; return; }
      // The page set `current`: go there, at once on the first paint and smoothly after.
      this.travel(this.index, changed.get("current") !== undefined);
    } else if (changed.has("count") && !changed.get("count") && this.index > 0) {
      // The slides arrived after the first paint: stand on the current one.
      this.travel(this.index, false);
    }
  }

  /** Goes to a slide: smoothly, unless the reader asks for reduced motion. Fires no `change`. */
  goTo(index: number): void {
    this.current = index;
  }

  /** Goes to the next slide, as the next button does. */
  next(): void {
    this.move(this.index + 1);
  }

  /** Goes to the previous slide, as the previous button does. */
  previous(): void {
    this.move(this.index - 1);
  }

  private travel(index: number, smooth: boolean) {
    const track = this.track;
    const slide = this.slides[index];
    if (!track || !slide || !scrollToSlide(track, slide, smooth)) return;
    this.pending = index;
    clearTimeout(this.settle);
    this.settle = setTimeout(() => { this.pending = undefined; }, 600);
  }

  /** A person moved to `index`: show it, say it, and fire `change`. */
  private show(index: number) {
    const target = Math.max(0, Math.min(this.count - 1, index));
    const previous = this.index;
    if (target === previous || this.count === 0) return;
    this.moving = true;
    this.current = target;
    this.announcement = this.words(undefined, "{index} of {count}", { index: target + 1, count: this.count });
    this.dispatchEvent(new CustomEvent<CarouselChangeDetail>("change", { bubbles: true, composed: true, detail: { index: target, previous } }));
  }

  private move(index: number) {
    const target = Math.max(0, Math.min(this.count - 1, index));
    this.travel(target, true);
    this.show(target);
  }

  private readonly scrolled = () => {
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => {
      if (this.pending !== undefined) {
        // A scroll asked for by a dot or a button: wait for it to stop before following the track again.
        clearTimeout(this.settle);
        this.settle = setTimeout(() => { this.pending = undefined; }, 150);
        return;
      }
      const track = this.track;
      if (track) this.show(nearestSlide(track, this.slides, this.index));
    });
  };

  private readonly ended = () => { this.pending = undefined; };

  private readonly picked = (event: CustomEvent<PagedotsSelectDetail>) => {
    // The dots are this carousel's own; their pick becomes its change.
    event.stopPropagation();
    event.preventDefault();
    this.move(event.detail.index);
  };

  render() {
    const index = this.index;
    const button = (which: "previous" | "next") => html`<button
      class="ds-button ds-button--icon ds-carousel__${which}"
      part=${which}
      type="button"
      aria-label=${this.words(undefined, which === "previous" ? "Previous slide" : "Next slide")}
      ?disabled=${which === "previous" ? index <= 0 : index >= this.count - 1}
      @click=${() => (which === "previous" ? this.previous() : this.next())}
    ><ds-icon type=${which === "previous" ? "left" : "right"} aria-hidden="true"></ds-icon></button>`;
    const controls = this.buttons || !this.noDots;
    return html`<div class="ds-carousel" part="carousel">
      <div class="ds-carousel__track" part="track" @scroll=${this.scrolled} @scrollend=${this.ended}>
        <slot @slotchange=${() => this.labelSlides()}></slot>
      </div>
      ${controls && this.count > 1
        ? html`<div class="ds-carousel__controls" part="controls">
            ${this.buttons ? button("previous") : nothing}
            ${this.noDots ? nothing : html`<ds-pagedots part="dots" .count=${this.count} .active=${index} ?end=${this.end} @select=${this.picked}></ds-pagedots>`}
            ${this.buttons ? button("next") : nothing}
          </div>`
        : nothing}
      <span class="ds-carousel__status" part="status" aria-live="polite" aria-atomic="true">${this.announcement}</span>
    </div>`;
  }
}

define("ds-carousel", Carousel);

declare global {
  interface HTMLElementTagNameMap {
    "ds-carousel": Carousel;
  }
}
