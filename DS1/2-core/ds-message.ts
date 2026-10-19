// ds-message.ts
// An inline notice in the flow of the page: a tone, a title and/or text,
// actions and an optional dismiss; with `banner`, a strip across the top of
// its positioning context instead. Drawn by 1-root/notice.css, the same
// classes a page without scripts writes.

import { LitElement, html, nothing, unsafeCSS, type PropertyValues } from "lit";
import { getText } from "../0-face/i18n";
import { define } from "../0-face/define";
import "./ds-icon";
import "./ds-toast";
import type { ToastPosition } from "../0-face/toast-queue";
export { toast as message } from "../0-face/toast-queue";
export type { ToastOptions as MessageOptions, ToastId as MessageId } from "../0-face/toast-queue";
export type MessageForm = "inline" | "banner" | "toast" | "assistant";
import metrics from "../1-root/component-metrics.css?inline";
import controls from "../1-root/controls.css?inline";
import styles from "./styles/ds-notice.css?inline";

export type MessageTone = "neutral" | "success" | "warning" | "danger";
const TONES: readonly MessageTone[] = ["neutral", "success", "warning", "danger"];
/** The icon each tone's mark carries unless `icon` names another. */
export const MESSAGE_ICONS: Readonly<Record<MessageTone, string>> = {
  neutral: "info",
  success: "check",
  warning: "warning",
  danger: "warning",
};

/** Detail of `ds-message-dismiss`. Cancel the event to keep the notice and remove it yourself. */
export interface MessageDismissDetail { tone: MessageTone }

/**
 * @element ds-message
 * @prop {"neutral" | "success" | "warning" | "danger"} tone - The mark's colour
 *   and icon; danger also turns the words into the danger colour. Neutral by default.
 * @prop {string} heading - A title: a translation key, or literal words.
 * @prop {string} text - The text: a translation key, or literal words.
 * @prop {boolean} literal - Show `heading` and `text` as written, never looked up.
 * @prop {string} icon - An icon from the library in place of the tone's own.
 * @prop {boolean} dismissible - Show a close button at the end of the first line.
 * @prop {boolean} banner - A strip one square high across the top of its
 *   positioning context, filled in the tone's colour, its words, actions and
 *   close button on one line; it reserves no room in the flow.
 *
 * @slot - The text, when it needs more than words: a link, a strong word.
 * @slot heading - The title, as inline content.
 * @slot icon - An icon of the page's own inside the mark.
 * @slot actions - Buttons or links on the row under the words.
 *
 * @fires ds-message-dismiss - The close button was pressed. Cancelable: unless
 *   it is cancelled, the notice hides itself.
 *
 * The element is a live region: `role="status"`, or `role="alert"` for danger,
 * unless the page gives it a role of its own.
 *
 * @example
 * <ds-message tone="danger" heading="Couldn't save" dismissible>
 *   Your changes are kept on this device.
 *   <ds-button slot="actions" secondary>Try again</ds-button>
 * </ds-message>
 */
export class Message extends LitElement {
  static properties = {
    expand: { type: Boolean },
    visibleToasts: { type: Number, attribute: "visible-toasts" },
    richColors: { type: Boolean, attribute: "rich-colors" },
    contained: { type: Boolean },
    label: { type: String },
    closeLabel: { type: String, attribute: "close-label" },
    form: { type: String, reflect: true },
    position: { type: String },
    duration: { type: Number },
    closeButton: { type: Boolean, attribute: "close-button" },
    tone: { type: String, reflect: true },
    heading: { type: String },
    text: { type: String },
    literal: { type: Boolean, reflect: true },
    icon: { type: String },
    dismissible: { type: Boolean, reflect: true },
    banner: { type: Boolean, reflect: true },
  };

  static styles = [unsafeCSS(metrics), unsafeCSS(controls), unsafeCSS(styles)];

  declare expand: boolean;
  declare visibleToasts: number;
  declare richColors: boolean;
  declare contained: boolean;
  declare label: string;
  declare closeLabel: string;
  declare form: MessageForm;
  declare position: ToastPosition;
  declare duration: number;
  declare closeButton: boolean;
  protected dismissEvent = "ds-message-dismiss";

  declare tone: MessageTone;
  declare heading: string | undefined;
  declare text: string | undefined;
  declare literal: boolean;
  declare icon: string | undefined;
  declare dismissible: boolean;
  declare banner: boolean;

  /** The role this element last set, so a role the page wrote is left alone. */
  private ownRole: string | null = null;
  private readonly relabel = () => this.requestUpdate();

  constructor() {
    super();
    this.expand = false;
    this.visibleToasts = 3;
    this.richColors = false;
    this.contained = false;
    this.label = "Messages";
    this.closeLabel = "Close";
    this.form = "inline";
    this.position = "bottom-right";
    this.duration = Infinity;
    this.closeButton = true;
    this.tone = "neutral";
    this.literal = false;
    this.dismissible = false;
    this.banner = false;
  }

  /** The tone in effect: an unknown value reads as neutral. */
  get resolvedTone(): MessageTone {
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
    if (changed.has("tone") || changed.has("form")) this.syncRole();
  }

  private syncRole() {
    if (!this.isConnected) return;
    const current = this.getAttribute("role");
    if (current !== null && current !== this.ownRole) return;
    this.ownRole = this.form === "toast" ? "presentation" : this.resolvedTone === "danger" ? "alert" : "status";
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

  /** Ask to close: hides the notice unless a listener cancels `ds-message-dismiss`. */
  dismiss(): boolean {
    const event = new CustomEvent<MessageDismissDetail>(this.dismissEvent, {
      bubbles: true, composed: true, cancelable: true, detail: { tone: this.resolvedTone },
    });
    if (!this.dispatchEvent(event)) return false;
    this.hidden = true;
    return true;
  }

  render() {
    if (this.form === "toast") return html`<ds-toast .expand=${this.expand} .visibleToasts=${this.visibleToasts} .richColors=${this.richColors} .contained=${this.contained} .label=${this.label} .closeLabel=${this.closeLabel} .position=${this.position} .duration=${this.duration} .closeButton=${this.closeButton}></ds-toast>`;
    const tone = this.resolvedTone;
    const heading = this.words(this.heading);
    const text = this.words(this.text);
    const hasHeading = Boolean(heading) || this.slotted("heading");
    const slottedText = this.slotted("");
    const hasText = Boolean(text) || slottedText;
    const hasActions = this.slotted("actions");
    const changed = () => this.requestUpdate();
    return html`<div class="ds-notice${tone === "neutral" ? "" : ` ds-notice--${tone}`}${(this.banner || this.form === "banner") ? " ds-notice--banner" : ""}" part="message notice">
      <span class="ds-notice__mark" part="mark" aria-hidden="true">
        <slot name="icon" @slotchange=${changed}><ds-icon size="large" .type=${this.icon || MESSAGE_ICONS[tone]}></ds-icon></slot>
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

define("ds-message", Message);

declare global {
  interface HTMLElementTagNameMap {
    "ds-message": Message;
  }
}
