import { html, unsafeCSS } from "lit";
import {
  currentLanguage,
  getAvailableLanguagesSync,
  getLanguageDisplayName,
  translate,
} from "../0-face/i18n";
import { LANGUAGE_METADATA, isLanguage, normalizeLanguage } from "../0-face/languages";
import { Cycle } from "./ds-cycle";
import { define } from "../0-face/define";
import styles from "./styles/ds-language.css?inline";

/**
 * A language's name in the language itself (`Dansk`, `日本語`): from the
 * language list, else from the browser, else the code.
 */
export function nativeLanguageName(code: string): string {
  if (!code) {
    return "";
  }
  if (isLanguage(code)) {
    return LANGUAGE_METADATA[code].nativeLabel;
  }
  const member = normalizeLanguage(code, null);
  if (member) {
    return LANGUAGE_METADATA[member].nativeLabel;
  }
  return getLanguageDisplayName(code, { locale: code });
}

/**
 * The language picker: ds-cycle's language cycle, showing each language by
 * its own name. A press moves to the next of the product's languages
 * (`configureI18n({ languages })`), sets it and remembers it; when something
 * else changes the language, the picker follows.
 *
 * One square high and eight wide, an item drawn as every item is; `compact`
 * makes it four squares wide.
 *
 * @element ds-language
 * @attr {boolean} compact - Four squares wide instead of eight
 * @attr {string} variant - `primary` paints it in the accent colour
 *
 * @example
 * <ds-language></ds-language>
 */
export class LanguagePicker extends Cycle {
  static get properties() { return { ...Cycle.properties, chip: { type: Boolean, reflect: true } }; }
  declare chip: boolean;
  static styles = unsafeCSS(styles);

  constructor() {
    super();
    this.type = "language";
    this.chip = false;
  }

  // The product's languages can change after the picker is drawn
  async setupInitialValue() {
    this.values = getAvailableLanguagesSync();
    await super.setupInitialValue();
  }

  getValueDisplay(value: string): string {
    return nativeLanguageName(value);
  }

  focus(options?: FocusOptions) { this.shadowRoot?.querySelector("button")?.focus(options); }

  render() {
    const code = this.currentValue || currentLanguage.value;
    const name = nativeLanguageName(code);
    const button = html`<button
      type="button"
      lang=${code}
      aria-label=${`${translate("Language")}: ${name}`}
      ?disabled=${this.disabled || this._fieldsetDisabled}
      @click=${(event: Event) => this.handleButtonClick(event)}
    >
      ${name}
    </button>`;
    return this.chip ? html`<ds-button fit control="slotted"
      ?primary=${this.primary && !this.secondary} ?secondary=${this.secondary}
      ?disabled=${this.disabled || this._fieldsetDisabled}>${button}</ds-button>` : button;
  }
}

define("ds-language", LanguagePicker);

declare global {
  interface HTMLElementTagNameMap {
    "ds-language": LanguagePicker;
  }
}
