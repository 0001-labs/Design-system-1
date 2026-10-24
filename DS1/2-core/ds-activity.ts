import { LitElement, html, unsafeCSS } from "lit";
import { define } from "../0-face/define";
import metrics from "../1-root/component-metrics.css?inline";
import styles from "./styles/ds-activity.css?inline";

// Each frame is a small arrangement of squares, not a measure of completion.
const patterns = [
  [5, 6, 9, 10], [1, 5, 6, 9], [1, 2, 6, 10], [2, 6, 7, 10],
  [5, 6, 9, 10], [6, 9, 10, 14], [5, 9, 13, 14], [5, 8, 9, 13],
];

/**
 * A working mark on the sixteen: four-pixel cells rearrange inside a control
 * square. Set active only while work is running; the default slot names the
 * actual operation. Reduced motion keeps the resting arrangement. Decorative
 * marks use aria-hidden and put their status in a separate live region.
 */
export class Activity extends LitElement {
  static properties = { active: { type: Boolean, reflect: true } };
  static styles = [unsafeCSS(metrics), unsafeCSS(styles)];
  declare active: boolean;
  constructor() { super(); this.active = false; }
  render() {
    return html`<span class="mark" aria-hidden="true">
      ${patterns.map((cells, frame) => html`<span class="frame" style=${`animation-delay: -${frame * 200}ms`}>
        ${Array.from({ length: 16 }, (_, cell) => html`<i class=${cells.includes(cell) ? "ink" : ""}></i>`)}
      </span>`)}
    </span><span class="words"><slot></slot></span>`;
  }
}
define("ds-activity", Activity);
declare global { interface HTMLElementTagNameMap { "ds-activity": Activity } }
