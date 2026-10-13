// ds-button.ts
// Core button component

import { html, unsafeCSS } from "lit";
import "./ds-text";
import { Control } from "../0-face/control";
import { define } from "../0-face/define";
import hostStyles from "./styles/ds-button-host.css?inline";
import styles from "./styles/ds-button.css?inline";

export class Button extends Control {
  static properties = {
    primary: { type: Boolean, reflect: true },
    secondary: { type: Boolean, reflect: true },
    control: { type: String, reflect: true, noAccessor: true },
    active: { type: Boolean, reflect: true },
    choice: { type: Boolean, reflect: true },
    icon: { type: Boolean, reflect: true },
    wide: { type: Boolean, reflect: true },
    danger: { type: Boolean, reflect: true },
    blank: { type: Boolean, reflect: true },
    language: { type: String },
    text: { type: String },
    href: { type: String },
    _loading: { type: Boolean, state: true },
  };

  // Public properties
  declare primary: boolean;
  declare secondary: boolean;
  declare active: boolean;
  declare choice: boolean;
  declare icon: boolean;
  declare wide: boolean;
  declare danger: boolean;
  private _control = "native";
  get control(): string { return this._control; }
  set control(value: string) {
    const old = this._control;
    this._control = value;
    this.syncControl();
    this.requestUpdate("control", old);
  }
  protected get hostControl(): boolean { return this.control === "host"; }
  declare blank: boolean;
  declare language: string;
  declare text: string;
  declare href: string;

  // Private state
  declare _loading: boolean;

  constructor() {
    super();
    this.active = false;
    this.choice = false;
    this.icon = false;
    this.wide = false;
    this.danger = false;
    this.primary = false; // Default to no-background (no attribute)
    this.secondary = false;
    this.disabled = false;
    this.blank = false;
    this.language = "en-US";
    this.text = "";
    this.href = "";
    this._loading = false;
  }

  static styles = [unsafeCSS(styles), unsafeCSS(hostStyles)];

  /**
   * A button holding only an icon — every close button — says so on its host,
   * so its styles can make it a 16-unit square with the icon filling it.
   */
  _reflectIcon() {
    if (this.control !== "native") return;
    const only = this.firstElementChild;
    const icon = !this.text && this.childElementCount === 1 && only?.localName === 'ds-icon' && !(this.textContent ?? '').trim();
    this.toggleAttribute('icon', !!icon);
  }

  private syncSlottedControl() {
    if (this.control !== "slotted") return;
    const button = this.querySelector<HTMLButtonElement>(":scope > button");
    if (button) button.disabled = this.disabled;
  }

  updated() {
    this.syncSlottedControl();
  }

  focus(options?: FocusOptions) {
    if (this.control === "slotted") this.querySelector<HTMLButtonElement>(":scope > button")?.focus(options);
    else if (this.hostControl) super.focus(options);
    else this.shadowRoot?.querySelector("button")?.focus(options);
  }

  connectedCallback() {
    super.connectedCallback();
    this._reflectIcon();
    this.syncSlottedControl();
  }

  render() {
    const hasTextProps = this.text;
    if (this.control === "slotted") return html`<slot @slotchange=${this.syncSlottedControl}></slot>`;
    if (this.hostControl) return html`<slot name="icon"></slot><slot></slot><slot name="trailing"></slot>`;

    return html`
      <button
        ?primary=${this.primary}
        ?secondary=${this.secondary}
        ?disabled=${this.disabled}
        @click=${this._handleClick}
      >
        ${hasTextProps
          ? html`<ds-text .text=${this.text}></ds-text>`
          : html`<slot @slotchange=${this._reflectIcon}></slot>`}
      </button>
    `;
  }

  private _handleClick(e: Event) {
    // Prevent any action if disabled and stop event propagation
    if (this.disabled) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // If href is provided, navigate to the URL and do not bubble further
    if (this.href) {
      e.preventDefault();
      e.stopPropagation();
      if (this.blank) {
        window.open(this.href, "_blank", "noopener,noreferrer");
      } else {
        window.location.href = this.href;
      }
      return;
    }

    // Otherwise, rely on the native 'click' event bubbling from the inner
    // <button> through the shadow boundary to consumers of <ds-button>.
    // Do not re-dispatch a synthetic 'click' here to avoid duplicate events.
  }
}

define("ds-button", Button);

declare global {
  interface HTMLElementTagNameMap {
    "ds-button": Button;
  }
}
