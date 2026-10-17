// ds-kbd.ts
// A keyboard shortcut's hint: the shortcut written as the platform writes it
// (⇧⌘D on Apple platforms, Ctrl+Shift+D elsewhere), drawn by 1-root/kbd.css,
// the same class a page without scripts puts on a native <kbd>.

import { LitElement, html, unsafeCSS } from "lit";
import { define } from "../0-face/define";
import { shortcutLabel, type KeyPlatform } from "../0-face/keys";
import metrics from "../1-root/component-metrics.css?inline";
import kbd from "../1-root/kbd.css?inline";
import styles from "./styles/ds-kbd.css?inline";

/**
 * @element ds-kbd
 * @prop {string} shortcut - The shortcut, written once for every platform:
 *   `mod+shift+d`, `mod+enter`, `escape`, `?`. Unset, the slotted words show
 *   as written.
 * @prop {boolean} plain - The words alone in the title grey, with no fill, as
 *   a menu entry writes its shortcut.
 * @prop {"apple" | "other"} platform - Write it for this platform rather than
 *   the device's own (a help page showing both).
 *
 * @slot - Words of the page's own, when there is no `shortcut`.
 *
 * @example
 * <ds-kbd shortcut="mod+k"></ds-kbd>
 */
export class Kbd extends LitElement {
  static properties = {
    shortcut: { type: String },
    plain: { type: Boolean, reflect: true },
    platform: { type: String },
  };

  static styles = [unsafeCSS(metrics), unsafeCSS(kbd), unsafeCSS(styles)];

  declare shortcut: string | undefined;
  declare plain: boolean;
  declare platform: KeyPlatform | undefined;

  private readonly relabel = () => this.requestUpdate();

  constructor() {
    super();
    this.plain = false;
  }

  connectedCallback() {
    super.connectedCallback();
    // Ctrl, Shift and the other words follow the page's language.
    window.addEventListener("language-changed", this.relabel);
    window.addEventListener("translations-loaded", this.relabel);
  }

  disconnectedCallback() {
    window.removeEventListener("language-changed", this.relabel);
    window.removeEventListener("translations-loaded", this.relabel);
    super.disconnectedCallback();
  }

  /** The words the hint shows: the shortcut's label, or empty when it shows its slot. */
  get label(): string {
    if (!this.shortcut) return "";
    try {
      return shortcutLabel(this.shortcut, this.platform ? { platform: this.platform } : undefined);
    } catch {
      return this.shortcut;
    }
  }

  render() {
    const label = this.label;
    return html`<kbd part="kbd" class=${this.plain ? "ds-kbd ds-kbd--plain" : "ds-kbd"}>${label || html`<slot></slot>`}</kbd>`;
  }
}

define("ds-kbd", Kbd);
declare global { interface HTMLElementTagNameMap { "ds-kbd": Kbd } }
