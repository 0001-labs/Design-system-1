// ds-empty.ts
// An empty state: a place with nothing in it yet, and what to do about it.
// Drawn by 1-root/empty.css, the same classes a page without scripts writes.

import { LitElement, html, nothing, unsafeCSS } from "lit";
import { getText } from "../0-face/i18n";
import { define } from "../0-face/define";
import "./ds-icon";
import metrics from "../1-root/component-metrics.css?inline";
import empty from "../1-root/empty.css?inline";
import styles from "./styles/ds-empty.css?inline";

/** The shared words' title for an empty place, in the current language. */
export const EMPTY_HEADING = "Nothing here yet";

/**
 * @element ds-empty
 * @prop {string} heading - The title: a translation key, or the words as they
 *   stand with `literal`. Unset, the shared words' "Nothing here yet".
 * @prop {string} text - The line under it: a translation key, or literal words.
 * @prop {boolean} literal - Show `heading` and `text` as written, never looked up.
 * @prop {string} icon - An icon from the library on the square above the title.
 * @prop {boolean} centered - Centre the words in the space the element stands in.
 * @prop {number} level - Make the title a heading of this level (1–6).
 * @prop {string} tone - `done`: empty because everything is finished; the
 *   check (or `icon`) on a mark in the success green, the title in that green.
 *
 * @slot - The text, when it needs more than words: a link, a strong word.
 * @slot heading - The title, as inline content.
 * @slot icon - An icon of the page's own, in place of `icon`.
 * @slot actions - The buttons or links that fill the place, on one row.
 *
 * @example
 * <ds-empty icon="search" heading="No results" text="Try another word.">
 *   <ds-button slot="actions" secondary>Clear the search</ds-button>
 * </ds-empty>
 */
export class Empty extends LitElement {
  static properties = {
    heading: { type: String },
    text: { type: String },
    literal: { type: Boolean, reflect: true },
    icon: { type: String },
    centered: { type: Boolean, reflect: true },
    level: { type: Number },
    tone: { type: String, reflect: true },
  };

  static styles = [unsafeCSS(metrics), unsafeCSS(empty), unsafeCSS(styles)];

  declare heading: string | undefined;
  declare text: string | undefined;
  declare literal: boolean;
  declare icon: string | undefined;
  declare centered: boolean;
  declare level: number | undefined;
  declare tone: "done" | undefined;

  private readonly relabel = () => this.requestUpdate();

  constructor() {
    super();
    this.literal = false;
    this.centered = false;
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("language-changed", this.relabel);
    window.addEventListener("translations-loaded", this.relabel);
  }

  disconnectedCallback() {
    window.removeEventListener("language-changed", this.relabel);
    window.removeEventListener("translations-loaded", this.relabel);
    super.disconnectedCallback();
  }

  private words(value: string | undefined): string {
    if (!value) return "";
    return this.literal ? value : getText(value) || value;
  }

  /**
   * Whether light-DOM content fills a slot: elements, or text that is not
   * blank. The blank text between slotted children still counts as assigned
   * to the default slot and hides its fallback, so `text` is drawn beside the
   * slot rather than inside it.
   */
  private slotted(name: string): boolean {
    return [...this.childNodes].some(node => name
      ? node instanceof Element && node.getAttribute("slot") === name
      : node instanceof Element ? !node.hasAttribute("slot") : node.nodeType === Node.TEXT_NODE && Boolean(node.textContent?.trim()));
  }

  render() {
    const heading = this.heading ? this.words(this.heading) : getText(EMPTY_HEADING) || EMPTY_HEADING;
    const text = this.words(this.text);
    const done = this.tone === "done";
    const icon = this.icon || (done ? "check" : "");
    const hasIcon = Boolean(icon) || this.slotted("icon");
    const slottedText = this.slotted("");
    const hasText = Boolean(text) || slottedText;
    const hasActions = this.slotted("actions");
    const level = this.level && this.level >= 1 && this.level <= 6 ? Math.round(this.level) : undefined;
    const changed = () => this.requestUpdate();
    return html`<div class="ds-empty${this.centered ? " ds-empty--centered" : ""}${done ? " ds-empty--done" : ""}" part="empty">
      <div class="ds-empty__icon" part="icon" aria-hidden="true" ?hidden=${!hasIcon}>
        <slot name="icon" @slotchange=${changed}>${icon ? html`<ds-icon size=${done ? "small" : "large"} .type=${icon}></ds-icon>` : nothing}</slot>
      </div>
      <div class="ds-empty__title" part="title" role=${level ? "heading" : nothing} aria-level=${level ?? nothing}>
        <slot name="heading" @slotchange=${changed}>${heading}</slot>
      </div>
      <div class="ds-empty__text" part="text" ?hidden=${!hasText}><slot @slotchange=${changed}></slot>${slottedText ? nothing : text}</div>
      <div class="ds-empty__actions" part="actions" ?hidden=${!hasActions}><slot name="actions" @slotchange=${changed}></slot></div>
    </div>`;
  }
}

define("ds-empty", Empty);

declare global {
  interface HTMLElementTagNameMap {
    "ds-empty": Empty;
  }
}
