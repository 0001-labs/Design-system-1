import { html, unsafeCSS, type CSSResultGroup } from "lit";
import { live } from "lit/directives/live.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { styleMap } from "lit/directives/style-map.js";
import { define } from "../0-face/define";
import { Input } from "./ds-input";
import styles from "./styles/ds-textarea.css?inline";

/** Multiline text shares values, labels, validation and forms with ds-input. */
export class Textarea extends Input {
  static properties = {
    rows: { type: Number },
    maxRows: { type: Number, attribute: "max-rows" },
    autoGrow: { type: Boolean, attribute: "auto-grow", reflect: true },
    wrap: { type: String },
  };
  static styles: CSSResultGroup = [Input.styles, unsafeCSS(styles)];
  declare rows: number;
  declare maxRows: number;
  declare autoGrow: boolean;
  declare wrap: "soft" | "hard" | "off";
  private resizeFrame = 0;
  private measuredWidth = 0;
  private resizeObserver?: ResizeObserver;
  private readonly fontsChanged = () => this.resizeToContent();
  protected get isMultiline(): boolean {
    return true;
  }

  constructor() {
    super();
    this.variant = "field";
    this.rows = 3;
    this.maxRows = 10;
    this.autoGrow = false;
    this.wrap = "soft";
  }

  connectedCallback(): void {
    super.connectedCallback();
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver((entries) => {
        if (this.clientWidth !== this.measuredWidth || entries.some(entry => entry.target !== this)) {
          this.measuredWidth = this.clientWidth;
          this.resizeToContent();
        }
      });
      this.resizeObserver.observe(this);
      const metric = this.shadowRoot?.querySelector(".row-metric");
      if (metric) this.resizeObserver.observe(metric);
    }
    document.fonts?.addEventListener("loadingdone", this.fontsChanged);
  }

  firstUpdated(): void {
    super.firstUpdated();
    // A fixed-width field can change scale without changing its width. Measure
    // one shared row separately from the content height that we set ourselves.
    const metric = this.shadowRoot?.querySelector(".row-metric");
    if (metric) this.resizeObserver?.observe(metric);
  }

  disconnectedCallback(): void {
    this.resizeObserver?.disconnect();
    document.fonts?.removeEventListener("loadingdone", this.fontsChanged);
    cancelAnimationFrame(this.resizeFrame);
    super.disconnectedCallback();
  }

  updated(changed: Map<string, unknown>): void {
    super.updated(changed);
    this.resizeToContent();
  }

  /** Grow on the row grid, bounded by maxRows; the remainder scrolls. */
  private resizeToContent(): void {
    cancelAnimationFrame(this.resizeFrame);
    const control = this.input;
    if (!control) return;
    if (!this.autoGrow) {
      control.style.height = "";
      control.style.overflowY = "";
      return;
    }
    this.resizeFrame = requestAnimationFrame(() => {
      if (!this.isConnected) return;
      const computed = getComputedStyle(control);
      const row =
        parseFloat(computed.getPropertyValue("--ds-row-height")) ||
        20 * (parseFloat(computed.getPropertyValue("--ds-sf")) || 1);
      const minimum = Math.max(1, Math.floor(this.rows || 1)) * row;
      const maximum = Math.max(minimum, Math.floor(this.maxRows || this.rows || 1) * row);
      control.style.height = "0px";
      const border = parseFloat(computed.borderTopWidth) + parseFloat(computed.borderBottomWidth);
      const needed = Math.ceil((control.scrollHeight + border) / row) * row;
      control.style.height = `${Math.max(minimum, Math.min(maximum, needed))}px`;
      control.style.overflowY = needed > maximum ? "auto" : "hidden";
    });
  }

  protected renderControl(hasError: boolean, description: string) {
    return html`<span class="row-metric" aria-hidden="true"></span><textarea
      id="input"
      part="input"
      aria-label=${ifDefined(this.accessibleLabel())}
      aria-invalid=${ifDefined(this.ariaInvalid || (hasError ? "true" : undefined))}
      aria-describedby=${ifDefined([description ? "description" : "", hasError ? "error" : ""].filter(Boolean).join(" ") || undefined)}
      inputmode=${ifDefined(this.inputMode || undefined)}
      enterkeyhint=${ifDefined(this.enterKeyHint || undefined)}
      spellcheck=${ifDefined(this.spellcheckHint || undefined)}
      .name=${this.name}
      .value=${live(this.value)}
      .placeholder=${this._placeholder || this.placeholder}
      ?disabled=${this.disabled || this._formDisabled}
      ?readonly=${this.readonly}
      ?required=${this.required}
      ?autofocus=${this.autofocus}
      autocomplete=${this.autocomplete}
      minlength=${ifDefined(this.minlength || undefined)}
      maxlength=${ifDefined(this.maxlength >= 0 ? this.maxlength : undefined)}
      rows=${Math.max(1, Math.floor(this.rows || 1))}
      wrap=${this.wrap || "soft"}
      style=${styleMap({ "--ds-textarea-rows": String(Math.max(1, Math.floor(this.rows || 1))) })}
      class=${hasError ? "has-error" : ""}
      @input=${this._handleInput}
      @change=${this.handleChange}
      @focus=${this._handleFocus}
      @blur=${this._handleBlur}
    ></textarea>`;
  }
}
define("ds-textarea", Textarea);
declare global {
  interface HTMLElementTagNameMap {
    "ds-textarea": Textarea;
  }
}
