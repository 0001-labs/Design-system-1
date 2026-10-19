import { LitElement, html, unsafeCSS } from "lit";
import "../2-core/ds-text";
import "../2-core/ds-icon";
import "../2-core/ds-button";
import { define } from "../0-face/define";
import styles from "./styles/ds-accordion.css?inline";

/**
 * Native accordion using <details>/<summary> (no JS toggle logic): the
 * summary one square high at the start, the library's chevron-down at its
 * end (turned over when open), the details from the square below.
 *
 * Usage (with translation text):
 * <ds-accordion summary="How it began" details="Designed in Hokkaido"></ds-accordion>
 *
 * Usage (with text someone wrote, shown as it stands and never translated):
 * <ds-accordion literal summary="Ideas for spring" details="Plant the bulbs"></ds-accordion>
 *
 * Usage (with slotted details content):
 * <ds-accordion summary="How it began">
 *   <div slot="details">Rich HTML content here</div>
 * </ds-accordion>
 */
export class Accordion extends LitElement {
  static properties = {
    summary: { type: String },
    details: { type: String },
    literal: { type: Boolean, reflect: true },
    open: { type: Boolean, reflect: true },
    control: { type: String, reflect: true },
    _hasSlottedContent: { type: Boolean, state: true },
  };

  declare summary: string;
  declare details: string;
  /** The summary and details are what someone wrote, not translation keys. */
  declare literal: boolean;
  declare open: boolean;
  declare control: string;
  declare _hasSlottedContent: boolean;

  constructor() {
    super();
    this.summary = "";
    this.details = "";
    this.literal = false;
    this.open = false;
    this.control = "native";
    this._hasSlottedContent = false;
    this.addEventListener("click", event => {
      if (this.control !== "slotted") return;
      const trigger = this.querySelector<HTMLButtonElement>(':scope > [slot="trigger"] > button');
      if (!trigger || trigger.disabled || event.defaultPrevented || !event.composedPath().includes(trigger)) return;
      const request = new CustomEvent("ds-accordion-toggle", {detail: {open: !this.open}, bubbles: true, composed: true, cancelable: true});
      if (this.dispatchEvent(request)) this.open = !this.open;
    });
  }

  private syncFrame = () => {
    if (this.control !== "slotted") return;
    const trigger = this.querySelector<HTMLButtonElement>(':scope > [slot="trigger"] > button');
    const content = this.querySelector<HTMLElement>(':scope > [slot="details"]');
    if (trigger) trigger.setAttribute("aria-expanded", String(this.open));
    if (content) {
      if (!this.open && content.contains(this.ownerDocument.activeElement)) trigger?.focus({preventScroll: true});
      content.hidden = !this.open;
    }
  };
  updated() { this.syncFrame(); }

  static styles = unsafeCSS(styles);

  private _handleSlotChange(e: Event) {
    const slot = e.target as HTMLSlotElement;
    const assignedNodes = slot.assignedNodes({ flatten: true });
    // Filter out empty text nodes (whitespace only)
    const hasContent = assignedNodes.some(
      (node) =>
        node.nodeType === Node.ELEMENT_NODE ||
        (node.nodeType === Node.TEXT_NODE && node.textContent?.trim())
    );
    this._hasSlottedContent = hasContent;
  }

  render() {
    if (this.control === "slotted") return html`<div class="header"><slot name="trigger" @slotchange=${this.syncFrame}></slot><slot name="actions"></slot></div><slot name="details" @slotchange=${this.syncFrame}></slot>`;
    return html`
      <details ?open=${this.open}>
        <summary>
          <span class="summaryRow">
            <ds-text class="summaryText" .text=${this.summary} ?literal=${this.literal}></ds-text>
            <ds-icon class="chevron" type="chevron-down" size="large" aria-hidden="true"></ds-icon>
          </span>
        </summary>

        <div class="detailsBody">
          <slot name="details" @slotchange=${this._handleSlotChange}></slot>
          ${!this._hasSlottedContent
            ? html`<ds-text
                class="detailsText"
                .text=${this.details}
                ?literal=${this.literal}
              ></ds-text>`
            : ""}
        </div>
      </details>
    `;
  }
}

define("ds-accordion", Accordion);

declare global {
  interface HTMLElementTagNameMap {
    "ds-accordion": Accordion;
  }
}
