// ds-banner.ts
// A banner across the top of its positioning context, with an optional
// action and an optional dismiss. For a message in the flow of the page, use
// ds-notice.

import { LitElement, html, nothing, unsafeCSS } from "lit";
import { getText } from "../0-face/i18n.js";
import "./ds-text.js";
import "./ds-button.js";
import "./ds-icon.js";
import styles from "./styles/ds-banner.css?inline";

/** Detail of `ds-banner-action`: the destination the action follows, if it has one. */
export interface BannerActionDetail { action: string; href: string | null }

declare global {
  interface CustomElementRegistry {
    define(name: string, constructor: typeof LitElement): void;
  }
  var customElements: CustomElementRegistry;
}

export class Banner extends LitElement {
  static properties = {
    text: { type: String },
    action: { type: String },
    href: { type: String },
    mailto: { type: String },
    subject: { type: String },
    describe: { type: String },
    appVersion: { type: String, attribute: "app-version" },
    variant: { type: String },
    version: { type: String },
    dismissible: { type: Boolean, reflect: true },
    _showVersion: { type: Boolean, state: true },
  };

  text: string = "";
  action: string = "";
  href: string = "";
  mailto: string = "";
  subject: string = "";
  describe: string = "";
  appVersion: string = "";
  variant: string = "warning"; // warning, info, success, error
  version: string = "";
  /** Show a close button at the end. Pressing it fires `ds-banner-dismiss`. */
  dismissible: boolean = false;
  _showVersion: boolean = false;

  private _boundUpdate = () => this.requestUpdate();

  connectedCallback() {
    super.connectedCallback();
    // Listen for translations and language changes to rebuild mailto URL
    window.addEventListener("translations-loaded", this._boundUpdate);
    window.addEventListener("language-changed", this._boundUpdate);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("translations-loaded", this._boundUpdate);
    window.removeEventListener("language-changed", this._boundUpdate);
  }

  static styles = unsafeCSS(styles);

  private _toggleVersion() {
    if (this.version) {
      this._showVersion = !this._showVersion;
    }
  }

  private _getMailtoHref(): string {
    // If a direct href is provided, use it
    if (this.href && this.href !== "#") return this.href;

    // If mailto is provided, build internationalized URL
    if (this.mailto) {
      try {
        const subject = this.subject
          ? getText(this.subject) || this.subject
          : "Issue report";
        const describe = this.describe
          ? getText(this.describe) || this.describe
          : "Describe the issue:";
        const appVersionLabel = this.appVersion
          ? getText(this.appVersion) || this.appVersion
          : "App version:";

        const body = `${describe}\n\n\n${appVersionLabel} ${this.version || ""}`;

        return `mailto:${this.mailto}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      } catch (error) {
        // Fallback if translations fail
        return `mailto:${this.mailto}?subject=Issue%20report&body=Describe%20the%20issue%3A%0A%0A%0AApp%20version%3A%20${this.version || ""}`;
      }
    }

    return "#";
  }

  /**
   * The action was pressed. `ds-banner-action` bubbles and is cancelable:
   * cancelling it keeps a link from being followed. An action with no
   * destination is a button, and the event is all it does.
   */
  private _onAction(event: Event, href: string | null) {
    const action = new CustomEvent<BannerActionDetail>("ds-banner-action", {
      bubbles: true, composed: true, cancelable: true, detail: { action: this.action, href },
    });
    if (!this.dispatchEvent(action)) event.preventDefault();
  }

  /** Ask to close: hides the banner unless a listener cancels `ds-banner-dismiss`. */
  dismiss(): boolean {
    const event = new CustomEvent("ds-banner-dismiss", { bubbles: true, composed: true, cancelable: true });
    if (!this.dispatchEvent(event)) return false;
    this.hidden = true;
    return true;
  }

  render() {
    const mailtoHref = this._getMailtoHref();
    const destination = mailtoHref !== "#" ? mailtoHref : null;

    return html`
      <div class="text-wrapper" @click=${this._toggleVersion}>
        ${this._showVersion && this.version
          ? html`<ds-text text=${this.version}></ds-text>`
          : html`<ds-text text=${this.text}><slot></slot></ds-text>`}
      </div>
      ${this.action
        ? html`
            <div class="action-wrapper">
              ${destination
                ? html`<a href=${destination} @click=${(event: Event) => this._onAction(event, destination)}>
                    <ds-text text=${this.action}></ds-text>
                  </a>`
                : html`<button type="button" @click=${(event: Event) => this._onAction(event, null)}>
                    <ds-text text=${this.action}></ds-text>
                  </button>`}
            </div>
          `
        : ""}
      ${this.dismissible
        ? html`<button class="dismiss" type="button" aria-label=${getText("Close") || "Close"} @click=${() => this.dismiss()}>
            <ds-icon type="close" aria-hidden="true"></ds-icon>
          </button>`
        : nothing}
    `;
  }
}

customElements.define("ds-banner", Banner);

declare global {
  interface HTMLElementTagNameMap {
    "ds-banner": Banner;
  }
}
