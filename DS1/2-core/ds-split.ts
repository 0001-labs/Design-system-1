import { LitElement, html, nothing, unsafeCSS } from "lit";
import { define } from "../0-face/define";
import { getText } from "../0-face/i18n";
import "./ds-icon";
import "./ds-text";
import styles from "./styles/ds-split.css?inline";

export interface SplitSegment<T extends string = string> {
  value: T;
  label: string;
  icon?: string;
  disabled?: boolean;
}

/** A compact group of choices or repeated actions, sharing outside corners.
 * `change` requests a choice; preventDefault keeps the current value. `press`
 * reports every activation in actions mode. Neither mode submits a form.
 */
export class Split extends LitElement {
  static formAssociated = true;
  static properties = {
    options: { type: String },
    segments: { attribute: false },
    value: { type: String, reflect: true },
    disabled: { type: Boolean, reflect: true },
    actions: { type: Boolean, reflect: true },
    literal: { type: Boolean, reflect: true },
    compact: { type: Boolean, reflect: true },
    _fieldsetDisabled: { state: true },
  };

  declare options: string;
  declare segments: ReadonlyArray<SplitSegment> | undefined;
  declare value: string;
  declare disabled: boolean;
  declare actions: boolean;
  declare literal: boolean;
  declare compact: boolean;
  declare private _fieldsetDisabled: boolean;

  constructor() {
    super();
    // Association supplies native disabled-fieldset behavior, without adding
    // a form value or making an action button into a submitter.
    if (typeof this.attachInternals === "function") this.attachInternals();
    this.options = "";
    this.value = "";
    this.disabled = false;
    this.actions = false;
    this.literal = false;
    this.compact = false;
    this._fieldsetDisabled = false;
  }

  static styles = unsafeCSS(styles);
  private languageChanged = () => this.requestUpdate();

  connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "group");
    window.addEventListener("language-changed", this.languageChanged);
    window.addEventListener("translations-loaded", this.languageChanged);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("language-changed", this.languageChanged);
    window.removeEventListener("translations-loaded", this.languageChanged);
  }

  formDisabledCallback(disabled: boolean) { this._fieldsetDisabled = disabled; }

  /** String convenience for HTML: day:Day,back:@left:Back. Use segments for
   * labels containing commas/colons, translated product labels or disabling
   * individual actions. An explicit empty array renders no choices.
   */
  private get choices(): ReadonlyArray<SplitSegment> {
    return this.segments ?? this.options.split(",").map(part => part.trim()).filter(Boolean).map(part => {
      const colon = part.indexOf(":");
      if (colon < 0) return { value: part.toLowerCase(), label: part };
      const value = part.slice(0, colon).trim();
      const label = part.slice(colon + 1).trim();
      if (!label.startsWith("@")) return { value, label };
      const end = label.indexOf(":");
      return { value, icon: label.slice(1, end < 0 ? undefined : end).trim(), label: end < 0 ? value : label.slice(end + 1).trim() };
    });
  }

  private press(segment: SplitSegment) {
    if (this.disabled || this._fieldsetDisabled || segment.disabled) return;
    if (this.actions) {
      this.dispatchEvent(new CustomEvent("press", { detail: { value: segment.value }, bubbles: true, composed: true }));
    } else if (segment.value !== this.value) {
      const accepted = this.dispatchEvent(new CustomEvent("change", {
        detail: { value: segment.value }, bubbles: true, composed: true, cancelable: true,
      }));
      if (accepted) this.value = segment.value;
    }
  }

  focus(options?: FocusOptions) {
    const buttons = [...this.renderRoot.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")];
    (buttons.find(button => button.getAttribute("aria-pressed") === "true") ?? buttons[0])?.focus(options);
  }

  render() {
    return html`${this.choices.map(segment => html`<button
      type="button" part="segment" value=${segment.value}
      aria-pressed=${this.actions ? nothing : String(segment.value === this.value)}
      aria-label=${segment.icon ? (this.literal ? segment.label : getText(segment.label)) : nothing}
      ?data-icon=${!!segment.icon}
      ?data-short=${segment.label.length === 1}
      ?disabled=${this.disabled || this._fieldsetDisabled || segment.disabled}
      @click=${() => this.press(segment)}
    >${segment.icon
      ? html`<ds-icon type=${segment.icon} aria-hidden="true"></ds-icon>`
      : html`<ds-text .text=${segment.label} .literal=${this.literal}></ds-text>`}</button>`)}`;
  }
}

define("ds-split", Split);
declare global { interface HTMLElementTagNameMap { "ds-split": Split } }
