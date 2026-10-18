// ds-card.ts
// A card: one thing on a fill of its own, its name, a title, writing and a
// picture that can run off its foot. Drawn by 1-root/card.css, the same
// classes a page without scripts writes.

import { LitElement, html, nothing, unsafeCSS, type PropertyValues } from "lit";
import { define } from "../0-face/define";
import metrics from "../1-root/component-metrics.css?inline";
import card from "../1-root/card.css?inline";
import styles from "./styles/ds-card.css?inline";

/** A whole number of squares, or `undefined` for a value that is not one. */
const squares = (value: number | undefined) =>
  typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : undefined;

const PADDING: Record<string, string> = {
  none: "0px",
  small: "calc(var(--ds-unit) / 2)",
  medium: "var(--ds-unit)",
  large: "calc(var(--ds-unit) * 2)",
};

type Slot = "label" | "title" | "media";

/**
 * @element ds-card
 * @prop {string} href - A destination: the whole card becomes one link.
 * @prop {boolean} interactive - The whole card is one button-like press
 *   target that fires `ds-card-press`; use `href` for a destination.
 * @prop {string} tone - A palette colour for the fill (`sharp-blue`,
 *   `apple-green`, `pink`…), drawn as its pastel and dim in dark mode, or
 *   `ink` for the ink with the paper's words. The quiet fill by default.
 * @prop {string} variant - `filled` (the default) or `outlined`, a 1px line
 *   and no fill.
 * @prop {number} width - The card's width in whole squares.
 * @prop {number} height - The card's height in whole squares.
 * @prop {string} padding - `none`, `small` (half a square), `medium` (one,
 *   the default) or `large` (two).
 * @prop {string} media - Where the picture stands: `start` (the default),
 *   `center`, or `bleed` to run on past the padding to the end edge.
 * @prop {boolean} disabled - Neither pressed nor followed.
 *
 * @slot label - The thing's name, muted, on one square.
 * @slot title - The title, display size, a square and a half a line.
 * @slot - Writing, one square a line.
 * @slot media - A picture of it, a square below the words; it may run off
 *   the card's foot and end edge and is cut there.
 *
 * @fires ds-card-press - An `interactive` card was pressed (click, Enter or Space).
 *
 * @example
 * <ds-card href="/lists" tone="sharp-blue" width="14" height="22" media="center">
 *   <span slot="label">Lists</span>
 *   <span slot="title">Lists on one grid</span>
 *   <img slot="media" src="lists.webp" alt="A list on a phone" />
 * </ds-card>
 */
export class Card extends LitElement {
  static properties = {
    href: { type: String, reflect: true },
    interactive: { type: Boolean, reflect: true },
    tone: { type: String, reflect: true },
    variant: { type: String, reflect: true },
    width: { type: Number, reflect: true },
    height: { type: Number, reflect: true },
    padding: { type: String, reflect: true },
    media: { type: String, reflect: true },
    disabled: { type: Boolean, reflect: true },
    filled: { state: true },
  };

  static styles = [unsafeCSS(metrics), unsafeCSS(card), unsafeCSS(styles)];

  declare href: string | undefined;
  declare interactive: boolean;
  declare tone: string | undefined;
  declare variant: "filled" | "outlined";
  declare width: number | undefined;
  declare height: number | undefined;
  declare padding: "none" | "small" | "medium" | "large";
  declare media: "start" | "center" | "bleed";
  declare disabled: boolean;
  /** The named slots that hold something. */
  declare filled: Set<Slot>;

  constructor() {
    super();
    this.interactive = false;
    this.variant = "filled";
    this.padding = "medium";
    this.media = "start";
    this.disabled = false;
    this.filled = new Set();
  }

  protected willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (!this.hasUpdated) this.filled = this.read();
    const width = squares(this.width);
    const height = squares(this.height);
    if (width) this.style.setProperty("--ds-card-width", `calc(var(--ds-unit) * ${width})`);
    else this.style.removeProperty("--ds-card-width");
    if (height) this.style.setProperty("--ds-card-height", `calc(var(--ds-unit) * ${height})`);
    else this.style.removeProperty("--ds-card-height");
    this.style.setProperty("--ds-card-padding", PADDING[this.padding] ?? PADDING.medium);
  }

  /** The named slots the card's children fill, read from the children so the first paint already has them. */
  private read(): Set<Slot> {
    const filled = new Set<Slot>();
    for (const child of this.children) {
      const name = child.getAttribute("slot");
      if (name === "label" || name === "title" || name === "media") filled.add(name);
    }
    return filled;
  }

  private readonly changed = () => {
    const next = this.read();
    if ([...next].join() !== [...this.filled].join()) this.filled = next;
  };

  private press(event: Event) {
    if (!this.interactive || this.disabled) return;
    if (event instanceof KeyboardEvent) {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
    }
    this.dispatchEvent(new CustomEvent("ds-card-press", { bubbles: true, composed: true }));
  }

  render() {
    const tone = this.tone || nothing;
    const media = this.media === "center" || this.media === "bleed" ? ` ds-card__media--${this.media}` : "";
    const parts = html`
      <span class="ds-card__label" part="label" ?hidden=${!this.filled.has("label")}><slot name="label" @slotchange=${this.changed}></slot></span>
      <span class="ds-card__title" part="title" ?hidden=${!this.filled.has("title")}><slot name="title" @slotchange=${this.changed}></slot></span>
      <div class="ds-card__body" part="body"><slot></slot></div>
      <div class="ds-card__media${media}" part="media" ?hidden=${!this.filled.has("media")}><slot name="media" @slotchange=${this.changed}></slot></div>`;
    const className = `ds-card${this.variant === "outlined" ? " ds-card--outlined" : ""}`;
    if (this.href && !this.disabled) {
      return html`<a class=${className} part="card" href=${this.href} data-tone=${tone}>${parts}</a>`;
    }
    if (this.interactive) {
      return html`<div
        class=${className}
        part="card"
        role="button"
        tabindex=${this.disabled ? -1 : 0}
        aria-disabled=${this.disabled ? "true" : nothing}
        data-interactive
        data-tone=${tone}
        @click=${this.press}
        @keydown=${this.press}
      >${parts}</div>`;
    }
    return html`<div class=${className} part="card" data-tone=${tone}>${parts}</div>`;
  }
}

define("ds-card", Card);

declare global {
  interface HTMLElementTagNameMap {
    "ds-card": Card;
  }
}
