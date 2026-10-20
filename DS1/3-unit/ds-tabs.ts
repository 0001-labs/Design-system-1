import { LitElement, html, unsafeCSS, type PropertyValues } from "lit";
import styles from "./styles/ds-tabs.css?inline";
import { define } from "../0-face/define";

/**
 * A run of choices of which one is current: the panel's tabs, a subtab bar,
 * a segmented option group. The choices are `ds-button`s; the current one is
 * `active`.
 *
 * Three faces, always 4px apart where they stand apart: buttons (the
 * default), each tab muted on no ground and the current one on the fill;
 * `text`, the words alone; and `split`, the tabs joined into one face as the
 * split button draws it, the current one on the accent.
 *
 * The element is a `tablist` unless it says otherwise, and its buttons take the
 * tab look. An option group that is not a set of tabs takes `role="group"`, its
 * buttons `aria-pressed`, and they take DS one's button looks: grey, and the
 * accent for the chosen one.
 *
 * @element ds-tabs
 * @attr fill - Share the width equally between the choices.
 * @attr text - Text tabs: the words alone, no fill, the current one in the ink.
 * @attr split - Split tabs: joined into one face a control high, the current one on the accent.
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
    wrap: { type: Boolean, reflect: true },
    text: { type: Boolean, reflect: true },
    split: { type: Boolean, reflect: true },
  };

  declare fill: boolean;
  declare wrap: boolean;
  declare text: boolean;
  declare split: boolean;

  constructor() {
    super();
    this.fill = false;
    this.wrap = false;
    this.text = false;
    this.split = false;
    this.addEventListener("keydown", this.navigate);
  }

  static styles = unsafeCSS(styles);

  connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "tablist");
  }

  private navigate = (event: KeyboardEvent): void => {
    if (this.getAttribute("role") !== "tablist") return;
    const tabs = [...this.querySelectorAll<HTMLElement>('[role="tab"]')]
      .filter(tab => tab.closest("ds-tabs") === this && !tab.hasAttribute("disabled") && tab.getAttribute("aria-disabled") !== "true");
    const current = tabs.findIndex(tab => tab === event.target);
    if (current < 0 || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const rtl = getComputedStyle(this).direction === "rtl";
    const step = (event.key === "ArrowRight" ? 1 : -1) * (rtl ? -1 : 1);
    const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (current + step + tabs.length) % tabs.length;
    tabs[next].focus();
    tabs[next].click();
  };

  /** Split, each tab knows its place in the run, so only the run's ends are rounded. */
  private syncSegments = (): void => {
    const tabs = [...this.children].filter(child => child.localName === "ds-button");
    tabs.forEach((tab, index) => {
      const place = tabs.length === 1 ? "only" : index === 0 ? "first" : index === tabs.length - 1 ? "last" : "middle";
      if (this.split) tab.setAttribute("segment", place);
      else if (/^(first|middle|last|only)$/.test(tab.getAttribute("segment") ?? "")) tab.removeAttribute("segment");
    });
  };

  protected updated(changed: PropertyValues): void {
    if (changed.has("split")) this.syncSegments();
  }

  render() {
    return html`<slot @slotchange=${this.syncSegments}></slot>`;
  }
}

define("ds-tabs", Tabs);

declare global {
  interface HTMLElementTagNameMap {
    "ds-tabs": Tabs;
  }
}
