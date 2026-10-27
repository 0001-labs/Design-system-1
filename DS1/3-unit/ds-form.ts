import { define } from "../0-face/define";
// ds-form.ts
// Form component for handling form submissions and validation

import { LitElement, html, css } from "lit";

export interface FormData {
  [key: string]: string | number | boolean | null;
}

export interface FormValidationResult {
  valid: boolean;
  errors: { [key: string]: string };
}

/** Inputs Enter does not submit from: it presses or toggles them instead. */
const IMPLICIT_SUBMIT_SKIPS = new Set(["button", "submit", "reset", "image", "checkbox", "radio", "file", "color", "range"]);

export class Form extends LitElement {
  static properties = {
    action: { type: String },
    method: { type: String },
    name: { type: String },
    novalidate: { type: Boolean, reflect: true },
    autocomplete: { type: String },
    _isSubmitting: { type: Boolean, state: true },
  };

  declare action: string;
  declare method: "get" | "post";
  declare name: string;
  declare novalidate: boolean;
  declare autocomplete: "on" | "off";
  declare _isSubmitting: boolean;

  constructor() {
    super();
    this.action = "";
    this.method = "post";
    this.name = "";
    this.novalidate = false;
    this.autocomplete = "on";
    this._isSubmitting = false;
  }

  static styles = css`
    :host {
      display: block;
      width: 100%;
    }

    :host([hidden]) {
      display: none !important;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: calc(var(--05) * var(--sf, 1));
      width: 100%;
    }

    ::slotted(*) {
      width: 100%;
    }

    :host([disabled]) {
      opacity: 0.6;
      pointer-events: none;
    }
  `;

  /**
   * Get all form data as an object
   */
  getFormData(): FormData {
    const data: FormData = {};
    const slot = this.shadowRoot?.querySelector("slot");
    const elements = slot?.assignedElements({ flatten: true }) || [];

    for (const element of elements) {
      this._collectFormData(element as HTMLElement, data);
    }

    return data;
  }

  private _collectFormData(element: HTMLElement, data: FormData): void {
    // Check if element has name and value properties
    const name = element.getAttribute("name") || (element as any).name;
    if (name) {
      const value = (element as any).value;
      if (value !== undefined) {
        // Handle checkboxes and radio buttons
        if (
          element instanceof HTMLInputElement &&
          (element.type === "checkbox" || element.type === "radio")
        ) {
          if (element.type === "checkbox") {
            data[name] = element.checked;
          } else if (element.type === "radio" && element.checked) {
            data[name] = value;
          }
        } else {
          data[name] = value;
        }
      }
    }

    // Recursively check children
    const children =
      element.shadowRoot?.querySelectorAll("*") || element.querySelectorAll("*");
    children.forEach((child) => {
      this._collectFormData(child as HTMLElement, data);
    });
  }

  /**
   * Validate the form
   */
  validate(): FormValidationResult {
    const result: FormValidationResult = {
      valid: true,
      errors: {},
    };

    if (this.novalidate) {
      return result;
    }

    const slot = this.shadowRoot?.querySelector("slot");
    const elements = slot?.assignedElements({ flatten: true }) || [];

    for (const element of elements) {
      this._validateElement(element as HTMLElement, result);
    }

    return result;
  }

  private _validateElement(
    element: HTMLElement,
    result: FormValidationResult
  ): void {
    const name = element.getAttribute("name") || (element as any).name;

    // Check for custom validation on ds-input elements
    if (element.tagName.toLowerCase() === "ds-input") {
      const input = element as any;
      if (input.required && !input.value) {
        result.valid = false;
        result.errors[name || "unknown"] = "This field is required";
      }
    }

    // Check native form elements
    if (
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement ||
      element instanceof HTMLSelectElement
    ) {
      if (!element.checkValidity()) {
        result.valid = false;
        result.errors[name || "unknown"] = element.validationMessage;
      }
    }

    // Recursively check children
    const children =
      element.shadowRoot?.querySelectorAll("*") || element.querySelectorAll("*");
    children.forEach((child) => {
      this._validateElement(child as HTMLElement, result);
    });
  }

  /**
   * Reset the form
   */
  reset(): void {
    const slot = this.shadowRoot?.querySelector("slot");
    const elements = slot?.assignedElements({ flatten: true }) || [];

    for (const element of elements) {
      this._resetElement(element as HTMLElement);
    }

    this.dispatchEvent(new CustomEvent("form-reset", { bubbles: true }));
  }

  private _resetElement(element: HTMLElement): void {
    if (
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement ||
      element instanceof HTMLSelectElement
    ) {
      if (element instanceof HTMLInputElement && element.type === "checkbox") {
        element.checked = false;
      } else {
        element.value = "";
      }
    }

    // Handle ds-input elements
    if (element.tagName.toLowerCase() === "ds-input") {
      (element as any).value = "";
    }

    // Recursively reset children
    const children =
      element.shadowRoot?.querySelectorAll("*") || element.querySelectorAll("*");
    children.forEach((child) => {
      this._resetElement(child as HTMLElement);
    });
  }

  /**
   * Submit the form
   */
  async submit(): Promise<void> {
    if (this._isSubmitting) return;

    const validationResult = this.validate();
    if (!validationResult.valid) {
      this.dispatchEvent(
        new CustomEvent("form-invalid", {
          detail: validationResult.errors,
          bubbles: true,
        })
      );
      return;
    }

    this._isSubmitting = true;
    // Whatever throws on the way (reading the fields, a listener), the form can submit again.
    try {
      const formData = this.getFormData();

      this.dispatchEvent(
        new CustomEvent("form-submit", {
          detail: { data: formData },
          bubbles: true,
        })
      );

      // If action is provided, submit to the server
      if (this.action) {
        try {
          const response = await fetch(this.action, {
            method: this.method.toUpperCase(),
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
          });

          this.dispatchEvent(
            new CustomEvent("form-response", {
              detail: { response, data: formData },
              bubbles: true,
            })
          );
        } catch (error) {
          this.dispatchEvent(
            new CustomEvent("form-error", {
              detail: { error, data: formData },
              bubbles: true,
            })
          );
        }
      }
    } finally {
      this._isSubmitting = false;
    }
  }

  private _handleSubmit(e: Event): void {
    e.preventDefault();
    // submit() reports a failed request itself, as form-error.
    void this.submit();
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener("click", this._handleButtonClick);
    this.addEventListener("keydown", this._handleKeydown);
  }

  disconnectedCallback(): void {
    this.removeEventListener("click", this._handleButtonClick);
    this.removeEventListener("keydown", this._handleKeydown);
    super.disconnectedCallback();
  }

  /**
   * The form is drawn in this element's shadow, so a submit or reset button
   * put inside it belongs to no form of its own. Its click does what it would
   * in a form: a native button (bare or in `ds-button control="slotted"`), or
   * `<ds-button type="submit">`. A button in a real <form> is left to that form.
   */
  private _handleButtonClick = (e: Event): void => {
    if (e.defaultPrevented) return;
    const control = (e.target as Element | null)?.closest?.("button, input, ds-button[type]");
    if (!control || !this.contains(control)) return;
    let type: string | null;
    if (control instanceof HTMLButtonElement || control instanceof HTMLInputElement) {
      if (control.form || control.disabled) return;
      type = control.type;
    } else {
      if (control.hasAttribute("disabled") || control.hasAttribute("href")) return;
      type = control.getAttribute("type");
    }
    if (type === "submit") void this.submit();
    else if (type === "reset") this.reset();
  };

  private _handleKeydown = (e: KeyboardEvent): void => {
    if (e.key !== "Enter" || e.shiftKey || e.defaultPrevented) return;
    // Enter submits from a field, as in a form: on a button it presses that
    // button, and in a textarea (a multiline ds-input's too) it starts a line.
    const origin = e.composedPath()[0];
    if (!(origin instanceof HTMLInputElement) || origin.form || IMPLICIT_SUBMIT_SKIPS.has(origin.type)) return;
    e.preventDefault();
    void this.submit();
  };

  render() {
    return html`
      <form
        .action=${this.action}
        .method=${this.method}
        .name=${this.name}
        ?novalidate=${this.novalidate}
        autocomplete=${this.autocomplete}
        @submit=${this._handleSubmit}
      >
        <slot></slot>
      </form>
    `;
  }
}

define("ds-form", Form);

declare global {
  interface HTMLElementTagNameMap {
    "ds-form": Form;
  }
}
