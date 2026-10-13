// ds-input.ts
// Input component for text and other input types

import { LitElement, html, unsafeCSS } from "lit";
import { live } from "lit/directives/live.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { define } from "../0-face/define";
import seeIcon from "../x-icon/ezo-password-visibility-see.svg?url";
import unseeIcon from "../x-icon/ezo-password-visibility-unsee.svg?url";
import { getText, currentLanguage } from "../0-face/i18n";
import "./ds-text";
import styles from "./styles/ds-input.css?inline";

export class Input extends LitElement {
  static formAssociated = true;
  private readonly focusFromLabel = (event: MouseEvent) => {
    if (event.composedPath()[0] === this && !this.disabled && !this._formDisabled) this.focus();
  };
  private internals = typeof this.attachInternals === "function" ? this.attachInternals() : null;
  private initialValue: string | undefined;
  static properties = {
    type: { type: String, reflect: true },
    inputMode: { type: String, attribute: "inputmode" },
    ariaLabel: { type: String, attribute: "aria-label" },
    ariaLabelledBy: { type: String, attribute: "aria-labelledby" },
    ariaDescribedBy: { type: String, attribute: "aria-describedby" },
    spellcheckHint: { type: String, attribute: "spellcheck" },
    ariaInvalid: { type: String, attribute: "aria-invalid" },
    revealable: { type: Boolean, reflect: true },
    quietFocus: { type: Boolean, attribute: "quiet-focus", reflect: true },
    _passwordVisible: { type: Boolean, state: true },
    _formDisabled: { type: Boolean, state: true },
    name: { type: String, reflect: true },
    value: { type: String },
    placeholder: { type: String },
    placeholderKey: { type: String, attribute: "placeholder-key" },
    label: { type: String },
    labelText: { type: String, attribute: "label-text" },
    disabled: { type: Boolean, reflect: true },
    readonly: { type: Boolean, reflect: true },
    required: { type: Boolean, reflect: true },
    autofocus: { type: Boolean },
    autocomplete: { type: String },
    pattern: { type: String },
    minlength: { type: Number },
    maxlength: { type: Number },
    min: { type: String },
    max: { type: String },
    step: { type: String },
    variant: { type: String, reflect: true },
    error: { type: String },
    errorText: { type: String, attribute: "error-text" },
    _focused: { type: Boolean, state: true },
    _placeholder: { type: String, state: true },
    _currentLanguage: { type: String, state: true },
  };

  declare type:
    | "text"
    | "password"
    | "email"
    | "number"
    | "tel"
    | "url"
    | "search"
    | "date"
    | "time"
    | "datetime-local";
  declare inputMode: string;
  declare ariaLabel: string;
  declare ariaLabelledBy: string;
  declare ariaDescribedBy: string;
  declare spellcheckHint: string;
  declare ariaInvalid: string;
  declare revealable: boolean;
  declare quietFocus: boolean;
  declare _passwordVisible: boolean;
  declare _formDisabled: boolean;
  declare name: string;
  declare value: string;
  declare placeholder: string;
  declare placeholderKey: string;
  declare label: string;
  declare labelText: string;
  declare disabled: boolean;
  declare readonly: boolean;
  declare required: boolean;
  declare autofocus: boolean;
  declare autocomplete: string;
  declare pattern: string;
  declare minlength: number;
  declare maxlength: number;
  declare min: string;
  declare max: string;
  declare step: string;
  declare variant: "default" | "filled" | "outlined" | "row" | "field" | "plain";
  declare error: string;
  declare errorText: string;
  declare _focused: boolean;
  declare _placeholder: string;
  declare _currentLanguage: string;
  private boundHandlers: { languageChanged: EventListener };

  constructor() {
    super();
    this.type = "text";
    this.inputMode = "";
    this.ariaLabel = "";
    this.ariaLabelledBy = "";
    this.ariaDescribedBy = "";
    this.spellcheckHint = "";
    this.ariaInvalid = "";
    this.revealable = false;
    this.quietFocus = false;
    this._passwordVisible = false;
    this._formDisabled = false;
    this.name = "";
    this.value = "";
    this.placeholder = "";
    this.placeholderKey = "";
    this.label = "";
    this.labelText = "";
    this.disabled = false;
    this.readonly = false;
    this.required = false;
    this.autofocus = false;
    this.autocomplete = "off";
    this.pattern = "";
    this.minlength = 0;
    this.maxlength = -1;
    this.min = "";
    this.max = "";
    this.step = "";
    this.variant = "default";
    this.error = "";
    this.errorText = "";
    this._focused = false;
    this._placeholder = "";
    this._currentLanguage = currentLanguage.value;

    // Create bound event handlers for proper cleanup
    this.boundHandlers = {
      languageChanged: (() => {
        this._currentLanguage = currentLanguage.value;
        this._loadPlaceholder();
        this.requestUpdate();
      }) as EventListener,
    };
  }

  static styles = unsafeCSS(styles);

  connectedCallback() {
    super.connectedCallback();
    this._currentLanguage = currentLanguage.value;
    this._loadPlaceholder();
    this.addEventListener("click", this.focusFromLabel);

    // Listen for language changes
    window.addEventListener(
      "language-changed",
      this.boundHandlers.languageChanged
    );

    // Also listen for translations loaded event
    window.addEventListener(
      "translations-loaded",
      this.boundHandlers.languageChanged
    );
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("click", this.focusFromLabel);
    window.removeEventListener(
      "language-changed",
      this.boundHandlers.languageChanged
    );
    window.removeEventListener(
      "translations-loaded",
      this.boundHandlers.languageChanged
    );
  }

  firstUpdated(): void { if (this.autofocus) this.focus(); }

  updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);

    if (changedProperties.has("placeholder") || changedProperties.has("placeholderKey")) {
      this._loadPlaceholder();
    }
    if (this.initialValue === undefined) this.initialValue = this.value;
    if (changedProperties.has("type") && this.type !== "password") this._passwordVisible = false;
    this.syncForm();
  }

  private get input(): HTMLInputElement | null { return this.shadowRoot?.querySelector("input") ?? null; }
  get selectionStart(): number | null { return this.input?.selectionStart ?? null; }
  get selectionEnd(): number | null { return this.input?.selectionEnd ?? null; }
  setSelectionRange(start: number, end: number, direction?: "forward" | "backward" | "none"): void { this.input?.setSelectionRange(start, end, direction); }
  get valueAsNumber(): number { return this.input?.valueAsNumber ?? NaN; }
  get labels(): NodeList | undefined { return this.internals?.labels; }
  get form(): HTMLFormElement | null { return this.internals?.form ?? null; }
  get validity(): ValidityState | undefined { return this.input?.validity; }
  get validationMessage(): string { return this.input?.validationMessage ?? ""; }
  get willValidate(): boolean { return this.input?.willValidate ?? false; }

  private syncForm(): void {
    const input = this.input;
    if (!input) return;
    this.internals?.setFormValue(this.disabled || this._formDisabled ? null : this.value);
    const message = this.errorText ? getText(this.errorText) : this.error;
    input.setCustomValidity(message || "");
    this.internals?.setValidity(input.validity, input.validationMessage, input);
  }

  checkValidity(): boolean { this.syncForm(); return this.input?.checkValidity() ?? true; }
  reportValidity(): boolean { this.syncForm(); return this.input?.reportValidity() ?? true; }
  formDisabledCallback(disabled: boolean): void { this._formDisabled = disabled; }
  formResetCallback(): void {
    this.value = this.getAttribute("value") ?? this.initialValue ?? "";
    this._passwordVisible = false;
    this.internals?.setFormValue(this.value);
    this.dispatchEvent(new Event("input-reset", { bubbles: true, composed: true }));
  }
  formStateRestoreCallback(state: string | File | FormData): void {
    if (typeof state === "string") { this.value = state; this.internals?.setFormValue(state); }
  }

  private accessibleLabel(): string | undefined {
    if (this.ariaLabel) return this.ariaLabel;
    const root = this.getRootNode() as Document | ShadowRoot;
    const label = this.ariaLabelledBy.split(/\s+/).filter(Boolean).map(id => {
      const element = root.getElementById?.(id);
      const key = element?.getAttribute("text");
      return key ? getText(key) : element?.textContent?.trim() ?? "";
    }).join(" ").trim();
    if (label) return label;
    return Array.from(this.internals?.labels ?? []).map(label => label.textContent?.trim() ?? "").join(" ").trim() || undefined;
  }

  private togglePassword(): void {
    const input = this.input;
    if (!input || this.disabled || this._formDisabled) return;
    const start = input.selectionStart, end = input.selectionEnd;
    this._passwordVisible = !this._passwordVisible;
    // Change only display. The field's public type stays password for forms and adapters.
    input.type = this._passwordVisible ? "text" : "password";
    if (start !== null && end !== null) input.setSelectionRange(start, end);
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (event.key !== "Enter" || event.isComposing || event.keyCode === 229 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    // Trusted browser events may run a microtask checkpoint between listeners.
    // Wait until the complete dispatch so an outer application handler can cancel.
    setTimeout(() => {
      const form = this.form;
      if (event.defaultPrevented || !form || this.disabled || this._formDisabled) return;
      const controls = Array.from(form.elements);
      const submit = controls.find(element =>
        (element instanceof HTMLButtonElement && element.type === "submit") ||
        (element instanceof HTMLInputElement && element.type === "submit")) as HTMLButtonElement | HTMLInputElement | undefined;
      if (submit) { if (!submit.disabled) submit.click(); return; }
      const blockingTypes = new Set(["text", "search", "url", "tel", "email", "password", "date", "month", "week", "time", "datetime-local", "number"]);
      const fields = controls.filter(element => (element instanceof HTMLInputElement || element instanceof Input) && blockingTypes.has(element.type));
      if (fields.length === 1) form.requestSubmit();
    }, 0);
  }

  private handleChange(event: Event): void {
    event.stopPropagation();
    this.value = (event.target as HTMLInputElement).value;
    this.syncForm();
    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  }

  private _loadPlaceholder() {
    const placeholderText = this.placeholderKey || this.placeholder;
    if (!placeholderText) {
      this._placeholder = "";
      this.requestUpdate();
      return;
    }

    try {
      const translatedText = getText(placeholderText);
      this._placeholder = translatedText || placeholderText;
    } catch (error) {
      // Fallback to original text if translation fails
      this._placeholder = placeholderText;
    }
    this.requestUpdate();
  }

  private _handleInput(e: Event): void {
    const target = e.target as HTMLInputElement;
    this.value = target.value;
    this.syncForm();
    this.dispatchEvent(
      new CustomEvent("input-change", {
        detail: { value: this.value, name: this.name },
        bubbles: true,
        composed: true,
      })
    );
  }

  private _handleFocus(): void {
    this._focused = true;
    this.dispatchEvent(new CustomEvent("input-focus", { bubbles: true }));
  }

  private _handleBlur(): void {
    this._focused = false;
    this.dispatchEvent(new CustomEvent("input-blur", { bubbles: true }));
  }

  /**
   * Focus the input element
   */
  focus(options?: FocusOptions): void { this.input?.focus(options); }

  /**
   * Blur the input element
   */
  blur(): void {
    const input = this.shadowRoot?.querySelector("input");
    input?.blur();
  }

  /**
   * Select all text in the input
   */
  select(): void {
    const input = this.shadowRoot?.querySelector("input");
    input?.select();
  }

  render() {
    const hasError = Boolean(this.error || this.errorText);
    const root = this.getRootNode() as Document | ShadowRoot;
    const description = this.ariaDescribedBy.split(/\s+/).filter(Boolean)
      .map(id => root.getElementById?.(id)?.textContent?.trim() ?? '').filter(Boolean).join(' ');

    return html`
      <div class="input-wrapper">
        ${this.label || this.labelText
          ? html`
              <label for="input">
                ${this.labelText
                  ? html`<ds-text .text=${this.labelText}></ds-text>`
                  : this.label}
              </label>
            `
          : null}

        <div class="input-container">
          <input
            id="input"
            part="input"
            .type=${this.type === "password" && this._passwordVisible ? "text" : this.type}
            aria-label=${ifDefined(this.accessibleLabel())}
            aria-invalid=${ifDefined(this.ariaInvalid || (hasError ? "true" : undefined))}
            aria-describedby=${ifDefined([description ? "description" : "", hasError ? "error" : ""].filter(Boolean).join(" ") || undefined)}
            inputmode=${ifDefined(this.inputMode || undefined)}
            spellcheck=${ifDefined(this.spellcheckHint || undefined)}
            .name=${this.name}
            .value=${live(this.value)}
            .placeholder=${this._placeholder || this.placeholder}
            ?disabled=${this.disabled || this._formDisabled}
            ?readonly=${this.readonly}
            ?required=${this.required}
            ?autofocus=${this.autofocus}
            autocomplete=${this.autocomplete}
            pattern=${ifDefined(this.pattern || undefined)}
            minlength=${ifDefined(this.minlength || undefined)}
            maxlength=${ifDefined(this.maxlength >= 0 ? this.maxlength : undefined)}
            min=${ifDefined(this.min || undefined)}
            max=${ifDefined(this.max || undefined)}
            step=${ifDefined(this.step || undefined)}
            class=${[hasError ? "has-error" : "", this.revealable && this.type === "password" ? "has-reveal" : ""].join(" ")}
            @input=${this._handleInput}
            @change=${this.handleChange}
            @keydown=${this.handleKeyDown}
            @focus=${this._handleFocus}
            @blur=${this._handleBlur}
          />
          ${this.revealable && this.type === "password" ? html`
            <button class="password-visibility" part="reveal" type="button"
              aria-label=${getText(this._passwordVisible ? "Hide password" : "Show password")}
              aria-pressed=${String(this._passwordVisible)}
              ?disabled=${this.disabled || this._formDisabled}
              @pointerdown=${(event: PointerEvent) => event.preventDefault()}
              @keydown=${(event: KeyboardEvent) => { if (event.key === "Enter" || event.key === " ") event.stopPropagation(); }}
              @click=${this.togglePassword}>
              <span aria-hidden="true" style=${`--eye-icon: url("${this._passwordVisible ? unseeIcon : seeIcon}")`}></span>
            </button>
          ` : null}
        </div>

        ${description ? html`<span id="description" hidden>${description}</span>` : null}
        ${hasError
          ? html`
              <div id="error" class="error-message" role="status">
                ${this.errorText
                  ? html`<ds-text .text=${this.errorText}></ds-text>`
                  : this.error}
              </div>
            `
          : null}
      </div>
    `;
  }
}

define("ds-input", Input);

declare global {
  interface HTMLElementTagNameMap {
    "ds-input": Input;
  }
}
