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
import { currentThemeMode, setThemeMode, THEME_MODES } from "../0-face/theme";
import type { ThemeMode } from "../0-face/theme";
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

// Notes style medium utilities
const saveNotesStyleMedium = (style: string) => {
  localStorage.setItem("notesStyleMedium", style);
};

const getNotesStyleMedium = (): string => {
  return localStorage.getItem("notesStyleMedium") || "note"; // Default to note
};

// Note behavior utilities
const savePageStyle = (style: string) => {
  localStorage.setItem("pageStyle", style);
};

const getPageStyle = (): string => {
  return localStorage.getItem("pageStyle") || "note"; // Default to note
};

// App width utilities removed

// The settings a cycle knows by name. Any other cycle steps through its own
// `values` and reports each step as a `change` event.
const SETTINGS = new Set(["language", "theme", "accent-color", "notes-style-medium", "page-style", "icon-only"]);

// Use a regular class with proper TypeScript type declarations and JSDoc comments
export class Cycle extends LitElement {
  static formAssociated = true;
  // Define reactive properties using Lit's property system
  static get properties() {
    return {
      type: { type: String },
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
    handleNoteBehaviorChanged: EventListener;
  };

  constructor() {
    super();
    if (typeof this.attachInternals === "function") this.attachInternals();
    this._fieldsetDisabled = false;
    this.variant = "";

    // Initialize properties with default values
    this.type = "";
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
      handleNoteBehaviorChanged: this.handleNoteBehaviorChanged.bind(this),
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
    window.addEventListener(
      "accent-color-changed",
      this.boundHandlers.handleAccentColorChanged
    );
    window.addEventListener(
      "page-style-changed",
      this.boundHandlers.handleNoteBehaviorChanged
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
    } else if (this.type === "notes-style-medium") {
      // Set up notes style medium cycling
      this.values = ["default", "big", "gallery"];

      // Set initial value based on current notes style medium
      const currentNotesStyle = getNotesStyleMedium();
      this.currentValue = currentNotesStyle;

      // Check if this should be disabled based on note behavior
      const currentPageStyle = getPageStyle();
      this.disabled = currentPageStyle === "note";
    } else if (this.type === "page-style") {
      // Set up page style cycling
      this.values = ["note", "page"];

      // Set initial value based on current page style
      const currentPageStyle = getPageStyle();
      this.currentValue = currentPageStyle;
    } else if (this.type === "icon-only") {
      // Set up icon-only cycling (no label)
      this.values = ["note", "page"];

      // Set initial value
      this.currentValue = this.values[0];
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
    } else if (this.type === "accent-color") {
      // Get current accent color
      const currentAccentColor = getAccentColor();
      this.currentValue = currentAccentColor;

      // Apply the accent color to ensure it's active
      applyAccentColor();
    } else if (this.type === "notes-style-medium") {
      // Get current notes style medium
      const currentNotesStyle = getNotesStyleMedium();
      this.currentValue = currentNotesStyle;

      // Check if this should be disabled based on note behavior
      const currentPageStyle = getPageStyle();
      this.disabled = currentPageStyle === "note";
    } else if (this.type === "page-style") {
      // Get current page style
      const currentPageStyle = getPageStyle();
      this.currentValue = currentPageStyle;
    } else if (this.type === "icon-only") {
      // Get current page style for icon-only
      const currentPageStyle = getPageStyle();
      this.currentValue = currentPageStyle;
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
    window.removeEventListener(
      "accent-color-changed",
      this.boundHandlers.handleAccentColorChanged
    );
    window.removeEventListener(
      "page-style-changed",
      this.boundHandlers.handleNoteBehaviorChanged
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
    } else if (this.type === "notes-style-medium") {
      // Cycle through notes style medium options
      const currentIndex = this.values.indexOf(this.currentValue);
      const nextIndex = (currentIndex + 1) % this.values.length;
      const newStyle = this.values[nextIndex];

      // Update current value
      this.currentValue = newStyle;

      // Save the new notes style medium
      saveNotesStyleMedium(newStyle);

      // Save preferences
      savePreferences({ notesStyleMedium: newStyle });

      // Dispatch notes style medium change event
      window.dispatchEvent(
        new CustomEvent("notes-style-medium-changed", {
          detail: { style: newStyle },
        })
      );
    } else if (this.type === "page-style") {
      // Cycle through note behavior options
      const currentIndex = this.values.indexOf(this.currentValue);
      const nextIndex = (currentIndex + 1) % this.values.length;
      const newBehavior = this.values[nextIndex];

      // Update current value
      this.currentValue = newBehavior;

      // Save the new note behavior
      savePageStyle(newBehavior);

      // Save preferences
      savePreferences({ pageStyle: newBehavior });

      // Dispatch note behavior change event
      window.dispatchEvent(
        new CustomEvent("page-style-changed", {
          detail: { behavior: newBehavior },
        })
      );
    } else if (this.type === "icon-only") {
      // Cycle through icon-only options (note/page)
      const currentIndex = this.values.indexOf(this.currentValue);
      const nextIndex = (currentIndex + 1) % this.values.length;
      const newIconOnlyValue = this.values[nextIndex];

      // Update current value
      this.currentValue = newIconOnlyValue;

      // Save the new page style
      savePageStyle(newIconOnlyValue);

      // Save preferences
      savePreferences({ pageStyle: newIconOnlyValue });

      // Dispatch page style change event
      window.dispatchEvent(
        new CustomEvent("page-style-changed", {
          detail: { behavior: newIconOnlyValue },
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

  getValueDisplay(value: string): string | any {
    if (this.type === "language") {
      return getLanguageDisplayName(value, {
        locale: currentLanguage.value,
      });
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
    } else if (this.type === "notes-style-medium") {
      // Return SVG icon for notes style medium
      return this.getNotesStyleIcon(value);
    } else if (this.type === "page-style") {
      // Return translated text for note behavior
      if (this.translationsReady) {
        const translatedText = translate(value === "note" ? "Note" : "Page");
        if (
          translatedText &&
          translatedText !== (value === "note" ? "Note" : "Page")
        ) {
          return translatedText;
        }
      }
      return value;
    } else if (this.type === "icon-only") {
      // Return SVG icon for icon-only type (note/page icons)
      if (value === "note") {
        return html`<ds-icon type="note"></ds-icon>`;
      } else if (value === "page") {
        return html`<ds-icon type="page"></ds-icon>`;
      }
      return html`<span>${value}</span>`;
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

  getNotesStyleIcon(style: string) {
    if (style === "page") {
      return html`<ds-icon type="page"></ds-icon>`;
    } else if (style === "note") {
      return html`<ds-icon type="note"></ds-icon>`;
    } else if (style === "default") {
      return html`<ds-icon type="default"></ds-icon>`;
    } else if (style === "big") {
      return html`<ds-icon type="big"></ds-icon>`;
    } else if (style === "gallery") {
      return html`<ds-icon type="gallery"></ds-icon>`;
    }
    return html`<span>${style}</span>`;
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
    if (this.type === "language") return getLanguageDisplayName(value, { locale: currentLanguage.value });
    if (this.type === "theme") return translate(value === "light" ? "Light" : value === "dark" ? "Dark" : "System");
    if (this.type === "accent-color") return translate(this.getColorKey(value));
    if (this.type === "page-style" || this.type === "icon-only") return translate(value === "note" ? "Note" : "Page");
    return value;
  }

  /** "Size: 40" when the cycle has a label, so the control is named while its face shows the value alone. */
  accessibleLabel(): string {
    return this.label ? `${translate(this.label)}: ${this.valueText()}` : "";
  }

  render() {
    return html`
      <div class="cycle">
        <ds-button fit
          .label=${this.accessibleLabel()}
          ?primary=${this.primary && !this.secondary}
          ?secondary=${this.secondary}
          ?disabled=${this.disabled || this._fieldsetDisabled}
          @click=${this.handleButtonClick}
        >
          ${this.type === "notes-style-medium" || this.type === "icon-only"
            ? html`<span
                style="display: inline-flex; align-items: center; gap: var(--025)"
                >${this.getValueDisplay(this.currentValue)}</span
              >`
            : this.type === "language"
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
                  : this.type === "page-style"
                    ? html`<ds-text
                        text=${this.currentValue === "note" ? "Note" : "Page"}
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

  private handleNoteBehaviorChanged() {
    this.setupInitialValue();
  }
}

define("ds-cycle", Cycle);

declare global {
  interface HTMLElementTagNameMap {
    "ds-cycle": Cycle;
  }
}
