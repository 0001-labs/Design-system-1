import { LitElement, html, unsafeCSS } from "lit";
import styles from "./styles/ds-tabs.css?inline";
import { define } from "../0-face/define";

/**
 * A run of choices of which one is current: the panel's tabs, a subtab bar,
 * a segmented option group. The choices are `ds-button`s; the current one is
 * `active`.
 *
 * The element is a `tablist` unless it says otherwise, and its buttons take the
 * tab look. An option group that is not a set of tabs takes `role="group"`, its
 * buttons `aria-pressed`, and they take DS one's button looks: grey, and the
 * accent for the chosen one.
 *
 * @element ds-tabs
 * @attr fill - Share the width equally between the choices.
 *
 * @example
 * <ds-tabs role="group" fill>
 *   <ds-button active aria-pressed="true">Left</ds-button>
 *   <ds-button aria-pressed="false">Right</ds-button>
 * </ds-tabs>
 *
 * <ds-tabs aria-label="Build">
 *   <ds-button role="tab" active aria-selected="true">Blocks</ds-button>
 *   <ds-button role="tab" aria-selected="false">Patterns</ds-button>
 * </ds-tabs>
 */
export class Tabs extends LitElement {
  static properties = {
    fill: { type: Boolean, reflect: true },
  };

  declare fill: boolean;

  constructor() {
    super();
    this.fill = false;
  }

  static styles = unsafeCSS(styles);

  connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "tablist");
  }

  render() {
    return html`<slot></slot>`;
  }
}

define("ds-tabs", Tabs);

declare global {
  interface HTMLElementTagNameMap {
    "ds-tabs": Tabs;
  }
}
