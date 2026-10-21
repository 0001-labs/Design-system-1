// ds-footer.ts
// A site footer: the brand, columns of links or contact lines, round marks
// stacked at the row's end, the language and theme, the copyright and the
// policies under it. Drawn by 1-root/footer.css, the same classes a page without
// scripts writes.

import { LitElement, html, nothing, unsafeCSS } from "lit";
import { getText } from "../0-face/i18n";
import { define } from "../0-face/define";
import { CutFades } from "../0-face/cut-fade";
import "../2-core/ds-cycle";
import metrics from "../1-root/component-metrics.css?inline";
import controls from "../1-root/controls.css?inline";
import styles from "./styles/ds-footer.css?inline";

/**
 * A line in a footer column: a link, or, without `href`, words alone (an
 * address, a registration number). In a column with words alone its links
 * are underlined, so they can be told from the words around them.
 */
export interface FooterLink {
  /** The words: a translation key, or as written with the footer's `literal`. */
  label: string;
  /** Where it leads. Without it the line is words alone. */
  href?: string;
  /** Opens elsewhere: in a new tab, with no referrer. */
  external?: boolean;
  /** The page being read: `aria-current="page"`. */
  current?: boolean;
  /**
   * The link drawn as a mark, its label its accessible name: the icon file's
   * address (`icons/instagram.svg`, as Sync 1's `icons` export copies it). A
   * column's icon links stand first, in a row of their own, or stacked as
   * round marks with the column's `icons: "stack"`.
   */
  icon?: string;
}

/** How a column's icon links stand: in a row first (`row`), or stacked as round marks (`stack`). */
export type FooterIcons = "row" | "stack";

/** A footer column: a heading and its lines. */
export interface FooterColumn {
  heading?: string;
  /** The heading as a link: where it leads. */
  href?: string;
  links: FooterLink[];
  /** The column's width in whole squares: eight by default. */
  width?: number;
  /**
   * `stack` draws its icon links as round marks one control high, one a line,
   * the column one square wide at the end of the row; the heading then names
   * the marks for assistive technology. `row` (the default) stands them first,
   * in a row of their own.
   */
  icons?: FooterIcons;
}

/** The settings a footer offers, each a `ds-cycle` of that type. */
export type FooterPreference = "language" | "theme" | "shape";
const PREFERENCES: readonly FooterPreference[] = ["language", "theme", "shape"];
/** What an empty `preferences` offers: the shape only when it is named. */
const DEFAULT_PREFERENCES: readonly FooterPreference[] = ["language", "theme"];

/** A column's width in whole squares, from its `width`: eight when it is missing or not a positive number. */
export function footerColumnWidth(width: unknown): number {
  const squares = Math.round(Number(width));
  return Number.isFinite(squares) && squares >= 1 ? squares : 8;
}

/** The preferences named by an attribute: language and theme when it is present but empty. */
export function footerPreferences(value: string | null | undefined): FooterPreference[] {
  if (value == null || value === "false") return [];
  const named = value.split(/[\s,]+/).filter(Boolean);
  if (!named.length || named.includes("true")) return [...DEFAULT_PREFERENCES];
  return PREFERENCES.filter(name => named.includes(name));
}

/**
 * @element ds-footer
 * @prop {string} brand - The site's name, a link home: a translation key, or
 *   the words as they stand with `literal`. The `brand` slot takes its place.
 * @prop {string} href - Where the brand links. `/` by default.
 * @prop {string} tagline - A line about the site under the brand.
 * @prop {FooterColumn[]} columns - The columns of links or lines, eight squares each
 *   unless a column names its `width`.
 * @prop {string} label - The columns' accessible name, as a navigation; without it they are plain lists.
 * @prop {string} owner - Who holds the copyright: the brand by default.
 * @prop {number} year - The copyright's year: this year by default.
 * @prop {FooterLink[]} policies - Links under the copyright (privacy, terms), each
 *   drawn as a secondary button.
 * @prop {string} preferences - `language`, `theme`, `shape` or several, as `ds-cycle`
 *   buttons at the end of the last row; present but empty, both.
 * @prop {boolean} literal - Show the words as written, never looked up.
 *
 * @slot brand - The brand, when it is more than words: a logo, a link of the page's own.
 * @slot preferences - Controls of the page's own beside or in place of the cycles.
 * @slot legal - The last line, in place of the copyright.
 *
 * @example
 * <ds-footer brand="Name" tagline="What it does" preferences literal
 *   columns='[{"heading":"Product","links":[{"label":"Download","href":"/download"}]}]'>
 * </ds-footer>
 */
export class Footer extends LitElement {
  static properties = {
    brand: { type: String },
    href: { type: String },
    tagline: { type: String },
    columns: { type: Array },
    label: { type: String },
    owner: { type: String },
    year: { type: Number },
    policies: { type: Array },
    preferences: { type: String },
    literal: { type: Boolean, reflect: true },
  };

  static styles = [unsafeCSS(metrics), unsafeCSS(controls), unsafeCSS(styles)];
  /** Words cut short fade over their last square, never an ellipsis: marks them `data-cut="end"` while they do not fit. */
  protected readonly cuts = new CutFades(this, { selector: ".ds-footer__links > li > *, .ds-footer__heading > a" });

  declare brand: string | undefined;
  declare href: string;
  declare tagline: string | undefined;
  declare columns: FooterColumn[];
  declare label: string | undefined;
  declare owner: string | undefined;
  declare year: number | undefined;
  declare policies: FooterLink[];
  declare preferences: string | null | undefined;
  declare literal: boolean;

  private readonly relabel = () => this.requestUpdate();

  constructor() {
    super();
    this.href = "/";
    this.columns = [];
    this.policies = [];
    this.literal = false;
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

  private slotted(name: string): boolean {
    return [...this.children].some(node => node.getAttribute("slot") === name);
  }

  private iconLink(link: FooterLink) {
    return html`<li><a href=${link.href} aria-label=${this.words(link.label)} aria-current=${link.current ? "page" : nothing}
      target=${link.external ? "_blank" : nothing} rel=${link.external ? "noopener noreferrer" : nothing}><span class="ds-icon" aria-hidden="true" style=${`--ds-icon: url("${link.icon}")`}></span></a></li>`;
  }

  private anchor(link: FooterLink, className?: string) {
    return html`<a class=${className ?? nothing} href=${link.href!} aria-current=${link.current ? "page" : nothing}
      target=${link.external ? "_blank" : nothing} rel=${link.external ? "noopener noreferrer" : nothing}>${this.words(link.label)}</a>`;
  }

  private link(link: FooterLink) {
    return html`<li>${link.href ? this.anchor(link) : html`<span>${this.words(link.label)}</span>`}</li>`;
  }

  private column(column: FooterColumn) {
    const stack = column.icons === "stack";
    const icons = column.links.filter(link => link.icon && link.href);
    const lines = column.links.filter(link => !(link.icon && link.href));
    const width = footerColumnWidth(column.width);
    const heading = column.heading ? this.words(column.heading) : "";
    if (stack) {
      return html`<div class="ds-footer__column ds-footer__column--stack" part="column">
        <ul class="ds-footer__icons" part="icons" aria-label=${heading || nothing}>${icons.map(link => this.iconLink(link))}</ul>
        ${lines.length ? html`<ul class="ds-footer__links">${lines.map(link => this.link(link))}</ul>` : nothing}
      </div>`;
    }
    return html`<div class="ds-footer__column" part="column" style=${width === 8 ? nothing : `--ds-footer-column-width: ${width}`}>
      ${heading
        ? html`<h2 class="ds-footer__heading" part="heading">${column.href ? html`<a href=${column.href}>${heading}</a>` : heading}</h2>`
        : nothing}
      ${icons.length ? html`<ul class="ds-footer__icons" part="icons">${icons.map(link => this.iconLink(link))}</ul>` : nothing}
      <ul class="ds-footer__links">${lines.map(link => this.link(link))}</ul>
    </div>`;
  }

  render() {
    const columns = (Array.isArray(this.columns) ? this.columns : []).filter(column => column && Array.isArray(column.links));
    const preferences = footerPreferences(this.preferences);
    const hasPreferences = preferences.length > 0 || this.slotted("preferences");
    const owner = this.owner ? this.words(this.owner) : this.words(this.brand);
    const year = Number.isFinite(this.year) ? this.year : new Date().getFullYear();
    const brandSlotted = this.slotted("brand");
    const hasBrand = brandSlotted || Boolean(this.brand) || Boolean(this.tagline);
    const policies = (Array.isArray(this.policies) ? this.policies : []).filter(link => link && link.href);
    const list = columns.map(column => this.column(column));
    return html`<footer class="ds-footer" part="footer">
      <div class="ds-footer__brand" part="brand" ?hidden=${!hasBrand}>
        <slot name="brand" @slotchange=${this.relabel}>${this.brand ? html`<a class="ds-footer__mark" href=${this.href || "/"}>${this.words(this.brand)}</a>` : nothing}</slot>
        ${this.tagline ? html`<p class="ds-footer__tagline" part="tagline">${this.words(this.tagline)}</p>` : nothing}
      </div>
      ${columns.length
        ? this.label
          ? html`<nav class="ds-footer__columns" part="columns" aria-label=${this.words(this.label)}>${list}</nav>`
          : html`<div class="ds-footer__columns" part="columns">${list}</div>`
        : nothing}
      <div class="ds-footer__base" part="base">
        <p class="ds-footer__legal" part="legal"><slot name="legal" @slotchange=${this.relabel}>${owner ? `© ${year} ${owner}` : `© ${year}`}</slot></p>
        ${policies.length
          ? html`<ul class="ds-footer__policies" part="policies">${policies.map(link => html`<li>${this.anchor(link, "ds-button ds-button--secondary")}</li>`)}</ul>`
          : nothing}
        <div class="ds-footer__preferences" part="preferences" ?hidden=${!hasPreferences}>
          ${preferences.map(type => html`<ds-cycle type=${type} label=${type === "shape" ? "Shape" : nothing}></ds-cycle>`)}
          <slot name="preferences" @slotchange=${this.relabel}></slot>
        </div>
      </div>
    </footer>`;
  }
}

define("ds-footer", Footer);

declare global {
  interface HTMLElementTagNameMap {
    "ds-footer": Footer;
  }
}
