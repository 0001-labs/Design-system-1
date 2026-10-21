import { LitElement, html, unsafeCSS } from "lit";
import { define } from "../0-face/define";
import { CutFades } from "../0-face/cut-fade";
import styles from "./styles/ds-radio.css?inline";

/** Native radios keep their group, keyboard, labels and form. DS1 owns the face. */
export class Radio extends LitElement {
  static properties = {
    choice: { type: Boolean, reflect: true },
    compact: { type: Boolean, reflect: true },
    preview: { type: Boolean, reflect: true },
    label: { type: String },
  };
  static styles = unsafeCSS(styles);
  /** Words cut short fade over their last square, never an ellipsis: marks them `data-cut="end"` while they do not fit. */
  protected readonly cuts = new CutFades(this, { selector: ".label" });
  declare choice: boolean;
  declare compact: boolean;
  declare preview: boolean;
  declare label: string;
  constructor() { super(); this.choice = false; this.compact = false; this.preview = false; this.label = ""; }
  focus(options?: FocusOptions) { this.querySelector<HTMLInputElement>(":scope > input")?.focus(options); }
  render() {
    return html`<slot></slot>${this.choice ? html`<span class="face" aria-hidden="true">${this.preview ? html`<span class="preview"><slot name="preview"></slot></span>` : null}<span class="label">${this.label}</span></span>` : null}`;
  }
}
define("ds-radio", Radio);
declare global { interface HTMLElementTagNameMap { "ds-radio": Radio } }
