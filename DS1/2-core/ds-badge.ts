import { LitElement, html, unsafeCSS } from "lit";
import { define } from "../0-face/define";
import { CutFades } from "../0-face/cut-fade";
import "./ds-icon";
import styles from "./styles/ds-badge.css?inline";

/**
 * A noninteractive status label. Products own its words and status meaning.
 * Words that do not fit fade out over their last square, never an ellipsis.
 */
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
  /** Marks the words `data-cut="end"` while they are wider than the badge. */
  protected readonly cuts = new CutFades(this, { selector: ".frame:not(.icon-only) .label" });

  constructor() { super(); this.icon = ""; this.iconOnly = false; }

  connectedCallback() {
    super.connectedCallback();
    void this.updateComplete.then(() => {
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
      void document.fonts?.ready.then(this.scheduleMeasure);
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
      frame.style.removeProperty("width");
      if (this.iconOnly && this.icon) return;
      const unit = frame.getBoundingClientRect().height;
      if (!unit) return;
      // Unset, the frame hugs its icon, words and padding at their fractional
      // width, as the native class's max-content does; round that up to whole
      // squares. (A label's scrollWidth is a whole pixel rounded to nearest:
      // "Done" at 32.3px read as 32 and was cut short in a 40px badge.)
      const natural = frame.getBoundingClientRect().width;
      frame.style.width = `${Math.max(1, Math.ceil(natural / unit)) * unit}px`;
      this.cuts.measure();
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
