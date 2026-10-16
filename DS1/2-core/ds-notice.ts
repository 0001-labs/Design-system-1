// ds-notice.ts
// An inline notice in the flow of the page: a tone, a title and/or text,
// actions and an optional dismiss. Drawn by 1-root/notice.css, the same
// classes a page without scripts writes.

import { LitElement, html, nothing, unsafeCSS, type PropertyValues } from "lit";
import { getText } from "../0-face/i18n";
import { define } from "../0-face/define";
import "./ds-icon";
import metrics from "../1-root/component-metrics.css?inline";
import controls from "../1-root/controls.css?inline";
import styles from "./styles/ds-notice.css?inline";

export type NoticeTone = "neutral" | "success" | "warning" | "danger";
const TONES: readonly NoticeTone[] = ["neutral", "success", "warning", "danger"];
/** The icon each tone's mark carries unless `icon` names another. */
export const NOTICE_ICONS: Readonly<Record<NoticeTone, string>> = {
  neutral: "info",
  success: "check",
  warning: "warning",
  danger: "warning",
};

/** Detail of `ds-notice-dismiss`. Cancel the event to keep the notice and remove it yourself. */
export interface NoticeDismissDetail { tone: NoticeTone }

/**
 * @element ds-notice
 * @prop {"neutral" | "success" | "warning" | "danger"} tone - The mark's colour
 *   and icon; danger also turns the words into the danger colour. Neutral by default.
 * @prop {string} heading - A title: a translation key, or literal words.
 * @prop {string} text - The text: a translation key, or literal words.
 * @prop {boolean} literal - Show `heading` and `text` as written, never looked up.
 * @prop {string} icon - An icon from the library in place of the tone's own.
 * @prop {boolean} dismissible - Show a close button at the end of the first line.
 *
 * @slot - The text, when it needs more than words: a link, a strong word.
 * @slot heading - The title, as inline content.
 * @slot icon - An icon of the page's own inside the mark.
 * @slot actions - Buttons or links on the row under the words.
 *
 * @fires ds-notice-dismiss - The close button was pressed. Cancelable: unless
 *   it is cancelled, the notice hides itself.
 *
 * The element is a live region: `role="status"`, or `role="alert"` for danger,
 * unless the page gives it a role of its own.
 *
 * @example
 * <ds-notice tone="danger" heading="Couldn't save" dismissible>
 *   Your changes are kept on this device.
 *   <ds-button slot="actions" secondary>Try again</ds-button>
 * </ds-notice>
 */
export class Notice extends LitElement {
  static properties = {
    tone: { type: String, reflect: true },
    heading: { type: String },
    text: { type: String },
    literal: { type: Boolean, reflect: true },
    icon: { type: String },
    dismissible: { type: Boolean, reflect: true },
  };

  static styles = [unsafeCSS(metrics), unsafeCSS(controls), unsafeCSS(styles)];

  declare tone: NoticeTone;
  declare heading: string | undefined;
  declare text: string | undefined;
  declare literal: boolean;
  declare icon: string | undefined;
  declare dismissible: boolean;

  /** The role this element last set, so a role the page wrote is left alone. */
  private ownRole: string | null = null;
  private readonly relabel = () => this.requestUpdate();

  constructor() {
    super();
    this.tone = "neutral";
    this.literal = false;
    this.dismissible = false;
  }

  /** The tone in effect: an unknown value reads as neutral. */
  get resolvedTone(): NoticeTone {
    return TONES.includes(this.tone) ? this.tone : "neutral";
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("language-changed", this.relabel);
    window.addEventListener("translations-loaded", this.relabel);
    this.syncRole();
  }

  disconnectedCallback() {
    window.removeEventListener("language-changed", this.relabel);
    window.removeEventListener("translations-loaded", this.relabel);
    super.disconnectedCallback();
  }

  protected willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (changed.has("tone")) this.syncRole();
  }

  private syncRole() {
    if (!this.isConnected) return;
    const current = this.getAttribute("role");
    if (current !== null && current !== this.ownRole) return;
    this.ownRole = this.resolvedTone === "danger" ? "alert" : "status";
    if (current !== this.ownRole) this.setAttribute("role", this.ownRole);
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

  /** Ask to close: hides the notice unless a listener cancels `ds-notice-dismiss`. */
  dismiss(): boolean {
    const event = new CustomEvent<NoticeDismissDetail>("ds-notice-dismiss", {
      bubbles: true, composed: true, cancelable: true, detail: { tone: this.resolvedTone },
    });
    if (!this.dispatchEvent(event)) return false;
    this.hidden = true;
    return true;
  }

  render() {
    const tone = this.resolvedTone;
    const heading = this.words(this.heading);
    const text = this.words(this.text);
    const hasHeading = Boolean(heading) || this.slotted("heading");
    const slottedText = this.slotted("");
    const hasText = Boolean(text) || slottedText;
    const hasActions = this.slotted("actions");
    const changed = () => this.requestUpdate();
    return html`<div class="ds-notice${tone === "neutral" ? "" : ` ds-notice--${tone}`}" part="notice">
      <span class="ds-notice__mark" part="mark" aria-hidden="true">
        <slot name="icon" @slotchange=${changed}><ds-icon size="large" .type=${this.icon || NOTICE_ICONS[tone]}></ds-icon></slot>
      </span>
      <div class="ds-notice__title" part="title" ?hidden=${!hasHeading}><slot name="heading" @slotchange=${changed}>${heading}</slot></div>
      <div class="ds-notice__text" part="text" ?hidden=${!hasText}><slot @slotchange=${changed}></slot>${slottedText ? nothing : text}</div>
      <div class="ds-notice__actions" part="actions" ?hidden=${!hasActions}><slot name="actions" @slotchange=${changed}></slot></div>
      ${this.dismissible
        ? html`<button class="ds-button ds-button--icon ds-notice__dismiss" part="dismiss" type="button" aria-label=${getText("Close") || "Close"} @click=${() => this.dismiss()}>
            <ds-icon type="close" aria-hidden="true"></ds-icon>
          </button>`
        : nothing}
    </div>`;
  }
}

define("ds-notice", Notice);

declare global {
  interface HTMLElementTagNameMap {
    "ds-notice": Notice;
  }
}
