import { LitElement, html, unsafeCSS } from "lit";
import { define } from "../0-face/define";
import { CutFades } from "../0-face/cut-fade";
import "./ds-button";
import "./ds-icon";
import styles from "./styles/ds-token.css?inline";

/** A removable value. Products own its identity and decide whether to remove it. */
export class Token extends LitElement {
  static formAssociated = true;
  static properties = {
    value: { type: String }, label: { type: String }, detail: { type: String },
    removeLabel: { type: String, attribute: "remove-label" },
    disabled: { type: Boolean, reflect: true }, fieldDisabled: { state: true },
  };
  static styles = unsafeCSS(styles);
  /** Words cut short fade over their last square, never an ellipsis: marks them `data-cut="end"` while they do not fit. */
  protected readonly cuts = new CutFades(this, { selector: ".copy > span, small" });
  declare value: string; declare label: string; declare detail: string;
  declare removeLabel: string; declare disabled: boolean; declare fieldDisabled: boolean;
  private fieldsetDisabled = false;
  constructor() {
    super(); this.attachInternals?.(); this.value = ""; this.label = ""; this.detail = "";
    this.removeLabel = ""; this.disabled = false; this.fieldDisabled = false;
  }
  formDisabledCallback(disabled: boolean) {
    this.fieldsetDisabled = disabled;
    // Attribute reflection can call this during Lit's update. Render once the
    // effective native state has settled, including re-enabling this token.
    queueMicrotask(() => { if (this.isConnected) this.requestUpdate(); });
  }
  get blocked() { return this.disabled || this.fieldDisabled || this.fieldsetDisabled; }
  requestRemove() {
    if (!this.blocked) this.dispatchEvent(new CustomEvent("ds-token-remove", {
      detail: { value: this.value }, bubbles: true, composed: true, cancelable: true,
    }));
  }
  render() {
    return html`<span class="frame" part="frame"><slot name="leading"></slot><span class="copy"><span>${this.label}<slot></slot></span>${this.detail ? html`<small>${this.detail}</small>` : null}</span>${this.removeLabel ? html`<ds-button control="slotted" icon .disabled=${this.blocked}><button type="button" aria-label=${this.removeLabel} ?disabled=${this.blocked} @click=${() => this.requestRemove()}><ds-icon type="close"></ds-icon></button></ds-button>` : null}</span>`;
  }
}
define("ds-token", Token);
declare global { interface HTMLElementTagNameMap { "ds-token": Token } }
