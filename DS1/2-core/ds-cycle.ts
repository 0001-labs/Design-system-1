import { LitElement, html, unsafeCSS } from "lit";
import { define } from "../0-face/define";
import {
  translate,
  currentLanguage,
  getAvailableLanguagesSync,
  getLanguageDisplayName,
  setLanguage,
} from "../0-face/i18n";
import type { LanguageCode } from "../0-face/i18n";
import { LANGUAGE_METADATA, isLanguage, normalizeLanguage } from "../0-face/languages";
import { currentThemeMode, setThemeMode, THEME_MODES } from "../0-face/theme";
import type { ThemeMode } from "../0-face/theme";
import { getShape, setShape, SHAPES, type Shape } from "../0-face/shape";
import { savePreferences } from "../0-face/preferences";
import "./ds-button";
import "./ds-icon";
import "./ds-text";
import styles from "./styles/ds-cycle.css?inline";

// Accent color utilities
const saveAccentColor = (color: string) => {
  localStorage.setItem("accentColor", color);
};

const getAccentColor = (): string => {
  return localStorage.getItem("accentColor") || "--sharp-blue"; // Default color if none set
};

const applyAccentColor = () => {
  const color = getAccentColor();
  document.documentElement.style.setProperty("--accent-color", `var(${color})`);
};

// App width utilities removed

// The settings a cycle knows by name. Any other cycle steps through its own
// `values` and reports each step as a `change` event.
/**
 * A language's name in the language itself (`Dansk`, `日本語`): from the
 * language list, else from the browser, else the code.
 */
export function nativeLanguageName(code: string): string {
  if (!code) return "";
  if (isLanguage(code)) return LANGUAGE_METADATA[code].nativeLabel;
  const member = normalizeLanguage(code, null);
  if (member) return LANGUAGE_METADATA[member].nativeLabel;
  return getLanguageDisplayName(code, { locale: code });
}

const SETTINGS = new Set(["language", "theme", "shape", "accent-color"]);

// Use a regular class with proper TypeScript type declarations and JSDoc comments
export class Cycle extends LitElement {
  static formAssociated = true;
  // Define reactive properties using Lit's property system
  static get properties() {
    return {
      type: { type: String, reflect: true },
      // Compatibility attribute; every language picker now uses the normal button.
      chip: { type: Boolean, reflect: true },
      values: { type: Array },
      value: { type: String },
      label: { type: String, reflect: true },
      currentValue: { type: String, state: true }, // Make this a private state property
      translationsReady: { type: Boolean, state: true }, // Track if translations are loaded
      disabled: { type: Boolean, reflect: true },
      _fieldsetDisabled: { state: true },
      variant: { type: String },
      // The same two words a button takes: `primary` is a chip in the accent,
      // `secondary` a grey one. Neither given, the type decides (below), and
      // the choice is written back onto the host so a page sheet can read it.
      primary: { type: Boolean, reflect: true },
      secondary: { type: Boolean, reflect: true },
    };
  }

  static styles = unsafeCSS(styles);

  // Add runtime properties using the any type
  // These are just for TypeScript and don't create shadowing fields
  declare type: string;
  declare chip: boolean;
  declare values: string[];
  declare value: string;
  /**
   * The setting's name, a translation key: the button is announced as
   * "Size: 40" while its face shows the value alone.
   */
  declare label: string;
  declare currentValue: string;
  declare translationsReady: boolean;
  declare disabled: boolean;
  declare protected _fieldsetDisabled: boolean;
  declare variant: string;
  declare primary: boolean;
  declare secondary: boolean;

  // Store bound event handlers for proper cleanup
  private boundHandlers: {
    translationsLoaded: EventListener;
    languageChanged: EventListener;
    handleLanguageChanged: EventListener;
    handleThemeChanged: EventListener;
    handleAccentColorChanged: EventListener;
  };

  constructor() {
    super();
    if (typeof this.attachInternals === "function") this.attachInternals();
    this._fieldsetDisabled = false;
    this.variant = "";

    // Initialize properties with default values
    this.type = "";
    this.chip = false;
    this.values = [];
    this.value = "";
    this.label = "";
    this.currentValue = "";
    this.translationsReady = false;
    this.disabled = false;
    this.primary = false;
    this.secondary = false;

    // Bind event handlers to this instance for proper cleanup
    this.boundHandlers = {
      translationsLoaded: this.handleTranslationsLoaded.bind(this),
      languageChanged: this.handleLanguageChanged.bind(this),
      handleLanguageChanged: this.handleLanguageChanged.bind(this),
      handleThemeChanged: this.handleThemeChanged.bind(this),
      handleAccentColorChanged: this.handleAccentColorChanged.bind(this),
    };
  }

  formDisabledCallback(disabled: boolean) { this._fieldsetDisabled = disabled; }

  focus(options?: FocusOptions) { this.shadowRoot?.querySelector<HTMLElement>("ds-button, button")?.focus(options); }

  connectedCallback() {
    super.connectedCallback();

    // Add event listeners
    window.addEventListener(
      "translations-loaded",
      this.boundHandlers.translationsLoaded
    );
    window.addEventListener(
      "language-changed",
      this.boundHandlers.languageChanged
    );
    window.addEventListener(
      "theme-changed",
      this.boundHandlers.handleThemeChanged
    );
    window.addEventListener("shape-changed", this.onShapeChanged);
    window.addEventListener(
      "accent-color-changed",
      this.boundHandlers.handleAccentColorChanged
    );

    // Initialize the component
    this.initializeValues();
  }

  // Synchronous: nothing here waits, and a thrown error should surface where it happens.
  initializeValues(): void {
    if (this.type === "language") {
      // Dynamically get available languages from translation data
      const availableLanguages = getAvailableLanguagesSync();
      this.values = availableLanguages;
      this.currentValue = currentLanguage.value;
    } else if (this.type === "theme") {
      // Light, dark and the system's, the stored choice
      this.values = [...THEME_MODES];
      this.currentValue = currentThemeMode.get();
    } else if (this.type === "shape") {
      // Square, rounded and circular, the stored choice
      this.values = [...SHAPES];
      this.currentValue = getShape();
    } else if (this.type === "accent-color") {
      // Set up accent color cycling
      this.values = [
        "--apple-green",
        "--every-green",
        "--zenith-blue",
        "--sharp-blue",
        "--pink",
        "--tuned-red",
        "--orange",
        "--yellow",
      ];

      // Set initial value based on current accent color
      const currentAccentColor = getAccentColor();
      this.currentValue = currentAccentColor;

      // Apply the accent color to ensure it's active
      applyAccentColor();
    }

    // Request update to re-render with new values
    this.requestUpdate();
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    super.attributeChangedCallback(name, oldValue, newValue);

    if (name === "type" && oldValue !== newValue) {
      // Type changed, reinitialize values
      this.initializeValues();
    }
  }

  setupInitialValue(): void {
    if (this.type === "language") {
      // Get current language
      const currentLang = currentLanguage.value;
      this.currentValue = currentLang;
    } else if (this.type === "theme") {
      // The stored choice, which may be the system's
      this.currentValue = currentThemeMode.get();
    } else if (this.type === "shape") {
      this.currentValue = getShape();
    } else if (this.type === "accent-color") {
      // Get current accent color
      const currentAccentColor = getAccentColor();
      this.currentValue = currentAccentColor;

      // Apply the accent color to ensure it's active
      applyAccentColor();
    }

    this.requestUpdate();
  }

  handleSettingsChanges() {
    // Handle any settings changes that might affect this component
    this.setupInitialValue();
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    // Remove event listeners
    window.removeEventListener(
      "translations-loaded",
      this.boundHandlers.translationsLoaded
    );
    window.removeEventListener(
      "language-changed",
      this.boundHandlers.languageChanged
    );
    window.removeEventListener(
      "theme-changed",
      this.boundHandlers.handleThemeChanged
    );
    window.removeEventListener("shape-changed", this.onShapeChanged);
    window.removeEventListener(
      "accent-color-changed",
      this.boundHandlers.handleAccentColorChanged
    );
  }

  handleButtonClick(e: Event) {
    e.preventDefault();
    e.stopPropagation();

    // Don't handle clicks if disabled
    if (this.disabled || this._fieldsetDisabled || !this.values.length || this.values.every(value => value === this.currentValue)) {
      return;
    }

    if (this.type === "language") {
      // Cycle through available languages
      const currentIndex = this.values.indexOf(this.currentValue);
      const nextIndex = (currentIndex + 1) % this.values.length;
      const newLanguage = this.values[nextIndex];

      // Update current value
      this.currentValue = newLanguage;

      // Set the new language with view transition like Portfolio
      if ((document as any).startViewTransition) {
        (document as any).startViewTransition(() => {
          setLanguage(newLanguage as LanguageCode);
        });
      } else {
        setLanguage(newLanguage as LanguageCode);
      }

      // Save preferences
      savePreferences({ language: newLanguage as LanguageCode });

    } else if (this.type === "theme") {
      // Cycle through themes
      const currentIndex = this.values.indexOf(this.currentValue);
      const nextIndex = (currentIndex + 1) % this.values.length;
      const newTheme = this.values[nextIndex];

      // Update current value
      this.currentValue = newTheme;

      // Set the new choice using the shared helper
      setThemeMode(newTheme as ThemeMode);

      // Save preferences
      savePreferences({ theme: newTheme as ThemeMode });

      // Theme helper already emits the change event, so no manual dispatch here
    } else if (this.type === "shape") {
      const next = this.values[(this.values.indexOf(this.currentValue) + 1) % this.values.length];
      this.currentValue = next;
      // The runtime stores it, marks the root and emits shape-changed
      setShape(next as Shape);
    } else if (this.type === "accent-color") {
      // Cycle through accent colors
      const currentIndex = this.values.indexOf(this.currentValue);
      const nextIndex = (currentIndex + 1) % this.values.length;
      const newColor = this.values[nextIndex];

      // Update current value
      this.currentValue = newColor;

      // Save the new accent color
      saveAccentColor(newColor);

      // Apply the new accent color
      applyAccentColor();

      // Save preferences
      savePreferences({ accentColor: newColor });

      // Dispatch accent color change event
      window.dispatchEvent(
        new CustomEvent("accent-color-changed", {
          detail: { color: newColor },
        })
      );
    } else if (!SETTINGS.has(this.type)) {
      const next = this.values[(this.values.indexOf(this.currentValue) + 1) % this.values.length];
      this.currentValue = this.value = next;
      this.dispatchEvent(new CustomEvent("change", { detail: { value: next }, bubbles: true, composed: true }));
    }

    // Request update to re-render
    this.requestUpdate();
  }

  /** Another control, or another tab, chose a shape. */
  private onShapeChanged = (): void => {
    if (this.type === "shape") this.setupInitialValue();
  };

  getValueDisplay(value: string): string | any {
    if (this.type === "language") {
      return nativeLanguageName(value);
    } else if (this.type === "shape") {
      // Square, Rounded or Circular, in the shared words
      const word = value.charAt(0).toUpperCase() + value.slice(1);
      const translated = this.translationsReady ? translate(word) : "";
      return translated && translated !== word ? translated : word;
    } else if (this.type === "theme") {
      // Try to get translated theme name
      if (this.translationsReady) {
        const translatedName = translate(value);
        if (translatedName && translatedName !== value) {
          return translatedName;
        }
      }

      // Fall back to the theme value itself
      return value;
    } else if (this.type === "accent-color") {
      // Get color name from CSS variable
      return this.getColorName(value);
    }

    return value;
  }

  getColorKey(colorVar: string): string {
    // Map CSS variables to translation text keys
    const colorMap: { [key: string]: string } = {
      "--tuned-red": "Red",
      "--orange": "Orange",
      "--yellow": "Yellow",
      "--apple-green": "Apple green",
      "--every-green": "Green",
      "--zenith-blue": "Light blue",
      "--sharp-blue": "Blue",
      "--pink": "Pink",
    };

    return colorMap[colorVar] || colorVar.replace("--", "").replace("-", " ");
  }

  getColorName(colorVar: string): string {
    // Map CSS variables to translation text keys
    const colorMap: { [key: string]: string } = {
      "--tuned-red": "Red",
      "--orange": "Orange",
      "--yellow": "Yellow",
      "--apple-green": "Apple green",
      "--every-green": "Green",
      "--zenith-blue": "Light blue",
      "--sharp-blue": "Blue",
      "--pink": "Pink",
    };

    const translationText = colorMap[colorVar];
    if (translationText && this.translationsReady) {
      const translatedName = translate(translationText);
      if (translatedName && translatedName !== translationText) {
        return translatedName;
      }
    }

    // Fallback to simple name conversion
    return colorVar.replace("--", "").replace("-", " ");
  }

  /**
   * A cycle without a stated look takes the one its type has always had: the
   * language and theme cycles are grey chips, every other one, the accent
   * colour's included, is in the accent. Written onto the host before the
   * first paint, so the inner button and any page sheet see the same word.
   */
  willUpdate(changed: Map<PropertyKey, unknown>) {
    // A cycle through its own values shows `value` when it is one of them,
    // and otherwise the first.
    if (!SETTINGS.has(this.type) && this.values.length) {
      if (changed.has("value") && this.values.includes(this.value)) this.currentValue = this.value;
      else if (!this.values.includes(this.currentValue)) this.currentValue = this.values.includes(this.value) ? this.value : this.values[0];
    }
    if (changed.has("variant") && this.variant) {
      this.primary = this.variant === "primary";
      this.secondary = this.variant === "secondary";
    }
    if ((!this.hasUpdated || changed.has("type")) && !this.primary && !this.secondary) {
      if (this.type === "language" || this.type === "theme") this.secondary = true;
      else this.primary = true;
    }
  }

  /** The words the face shows for the current value, for the accessible name. */
  valueText(): string {
    const value = this.currentValue;
    if (this.type === "language") return nativeLanguageName(value);
    if (this.type === "theme") return translate(value === "light" ? "Light" : value === "dark" ? "Dark" : "System");
    if (this.type === "accent-color") return translate(this.getColorKey(value));
    return value;
  }

  /** "Size: 40" when the cycle has a label, so the control is named while its face shows the value alone. */
  accessibleLabel(): string {
    if (this.label) return `${translate(this.label)}: ${this.valueText()}`;
    // The language picker is always named: "Language: Dansk".
    return this.type === "language" ? `${translate("Language")}: ${this.valueText()}` : "";
  }

  /**
   * The language picker: a native button carrying the language's code as
   * `lang`, so each name is set in its own typeface. Always uses the normal
   * label-sized button; legacy `chip` and `compact` attributes do not change its width.
   */
  private renderLanguagePicker() {
    const code = this.currentValue || currentLanguage.value;
    const button = html`<button
      type="button"
      lang=${code}
      aria-label=${this.accessibleLabel()}
      ?disabled=${this.disabled || this._fieldsetDisabled}
      @click=${this.handleButtonClick}
    >
      ${nativeLanguageName(code)}
    </button>`;
    return html`<ds-button fit control="slotted"
      ?primary=${this.primary && !this.secondary} ?secondary=${this.secondary}
      ?disabled=${this.disabled || this._fieldsetDisabled}>${button}</ds-button>`;
  }

  render() {
    if (this.type === "language") return this.renderLanguagePicker();
    return html`
      <div class="cycle">
        <ds-button fit
          .label=${this.accessibleLabel()}
          ?primary=${this.primary && !this.secondary}
          ?secondary=${this.secondary}
          ?disabled=${this.disabled || this._fieldsetDisabled}
          @click=${this.handleButtonClick}
        >
          ${this.type === "language"
              ? html`<ds-text
                  literal text=${this.getValueDisplay(this.currentValue)}
                ></ds-text>`
              : this.type === "theme"
                ? html`<ds-text
                    text=${this.currentValue === "light" ? "Light" : this.currentValue === "dark" ? "Dark" : "System"}
                  ></ds-text>`
                : this.type === "accent-color"
                  ? html`<ds-text
                      text=${this.getColorKey(this.currentValue)}
                    ></ds-text>`
                  : html`<ds-text
                        literal text=${this.getValueDisplay(this.currentValue)}
                      ></ds-text>`}
        </ds-button>
      </div>
    `;
  }

  private handleTranslationsLoaded() {
    this.translationsReady = true;

    // Refresh language values if this is a language cycle
    if (this.type === "language") {
      const availableLanguages = getAvailableLanguagesSync();
      this.values = availableLanguages;
    }

    this.setupInitialValue();
  }

  private handleLanguageChanged() {
    this.setupInitialValue();
  }

  private handleThemeChanged() {
    this.setupInitialValue();
  }

  private handleAccentColorChanged() {
    this.setupInitialValue();
  }
}

define("ds-cycle", Cycle);

declare global {
  interface HTMLElementTagNameMap {
    "ds-cycle": Cycle;
  }
}
