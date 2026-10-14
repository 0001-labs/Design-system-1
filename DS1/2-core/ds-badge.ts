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
  private observer?: ResizeObserver;
  private contentObserver?: MutationObserver;
  private measureFrame = 0;

  constructor() { super(); this.icon = ""; this.iconOnly = false; }

  connectedCallback() {
    super.connectedCallback();
    this.updateComplete.then(() => {
      if (!this.isConnected) return;
      this.contentObserver?.disconnect();
      this.contentObserver = new MutationObserver(this.scheduleMeasure);
      this.contentObserver.observe(this, {childList: true, subtree: true, characterData: true});
      if (typeof ResizeObserver !== "undefined") {
        this.observer?.disconnect();
        this.observer = new ResizeObserver(this.scheduleMeasure);
        this.observer.observe(this);
        this.observer.observe(this.shadowRoot!.querySelector(".label")!);
      }
      document.fonts?.ready.then(this.scheduleMeasure);
      document.fonts?.addEventListener("loadingdone", this.scheduleMeasure);
      this.scheduleMeasure();
    });
  }

  disconnectedCallback() {
    this.observer?.disconnect();
    this.contentObserver?.disconnect();
    document.fonts?.removeEventListener("loadingdone", this.scheduleMeasure);
    cancelAnimationFrame(this.measureFrame);
    this.measureFrame = 0;
    super.disconnectedCallback();
  }

  updated() { this.scheduleMeasure(); }
  private scheduleMeasure = () => {
    if (!this.isConnected || this.measureFrame) return;
    this.measureFrame = requestAnimationFrame(() => {
      this.measureFrame = 0;
      const frame = this.shadowRoot!.querySelector<HTMLElement>(".frame")!;
      if (this.iconOnly && this.icon) { frame.style.removeProperty("width"); return; }
      const unit = frame.getBoundingClientRect().height;
      if (!unit) return;
      const label = this.shadowRoot!.querySelector<HTMLElement>(".label")!;
      const icon = this.shadowRoot!.querySelector("ds-icon");
      const styles = getComputedStyle(frame);
      const natural = label.scrollWidth + parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight)
        + (icon ? icon.getBoundingClientRect().width + parseFloat(styles.columnGap) : 0);
      const width = `${Math.max(1, Math.ceil(natural / unit)) * unit}px`;
      if (frame.style.width !== width) frame.style.width = width;
    });
  };

  render() {
    const iconOnly = this.iconOnly && !!this.icon;
    return html`<span class=${iconOnly ? "frame icon-only" : "frame"} part="frame">
      ${this.icon ? html`<ds-icon .type=${this.icon} aria-hidden="true"></ds-icon>` : null}
      <span class="label"><slot @slotchange=${this.scheduleMeasure}></slot></span>
    </span>`;
  }
}
define("ds-badge", Badge);
declare global { interface HTMLElementTagNameMap { "ds-badge": Badge } }
