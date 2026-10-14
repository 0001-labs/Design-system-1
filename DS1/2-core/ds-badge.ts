import { LitElement, html, unsafeCSS } from "lit";
import { define } from "../0-face/define";
import "./ds-icon";
import styles from "./styles/ds-badge.css?inline";

/** A noninteractive status label. Products own its words and status meaning. */
export class Badge extends LitElement {
  static properties = {
    icon: { type: String },
    iconOnly: { type: Boolean, attribute: "icon-only", reflect: true },
  };
  static styles = unsafeCSS(styles);
  declare icon: string;
  declare iconOnly: boolean;

  constructor() { super(); this.icon = ""; this.iconOnly = false; }

  render() {
    const iconOnly = this.iconOnly && !!this.icon;
    return html`<span class=${iconOnly ? "frame icon-only" : "frame"} part="frame">
      ${this.icon ? html`<ds-icon .type=${this.icon} aria-hidden="true"></ds-icon>` : null}
      <span class="label"><slot></slot></span>
    </span>`;
  }
}
define("ds-badge", Badge);
declare global { interface HTMLElementTagNameMap { "ds-badge": Badge } }
