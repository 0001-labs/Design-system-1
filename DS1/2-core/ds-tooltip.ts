import { LitElement, html, unsafeCSS } from "lit";
import { translate } from "../0-face/i18n";
import { define } from "../0-face/define";
import styles from "./styles/ds-tooltip.css?inline";

let nextDescription = 0;

/** A translated or literal label for one slotted control. */
export class Tooltip extends LitElement {
  static properties = {
    text: { type: String },
    defaultValue: { type: String, attribute: "default-value" },
    literal: { type: Boolean },
    placement: { type: String, reflect: true },
    _visible: { state: true },
  };

  declare text: string;
  declare defaultValue: string;
  declare literal: boolean;
  declare placement: "top" | "bottom";
  declare private _visible: boolean;
  private hovered = false;
  private focused = false;
  private trigger?: HTMLElement;
  private description?: HTMLSpanElement;

  constructor() {
    super();
    this.text = "";
    this.defaultValue = "";
    this.literal = false;
    this.placement = "top";
    this._visible = false;
    this.addEventListener("mouseenter", () => { this.hovered = true; this._visible = true; });
    this.addEventListener("mouseleave", () => { this.hovered = false; this._visible = this.focused; });
    this.addEventListener("focusin", () => { this.focused = true; this._visible = true; });
    this.addEventListener("focusout", event => {
      if (event.relatedTarget instanceof Node && this.contains(event.relatedTarget)) return;
      this.focused = false;
      this._visible = this.hovered;
    });
    this.addEventListener("keydown", event => {
      if (event.key === "Escape") this._visible = false;
    });
  }

  static styles = unsafeCSS(styles);

  private languageChanged = () => this.requestUpdate();

  connectedCallback(): void {
    super.connectedCallback();
    this.requestUpdate();
    window.addEventListener("language-changed", this.languageChanged);
    window.addEventListener("translations-loaded", this.languageChanged);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener("language-changed", this.languageChanged);
    window.removeEventListener("translations-loaded", this.languageChanged);
    this.releaseDescription();
    this.hovered = this.focused = this._visible = false;
  }

  private get label(): string {
    if (this.literal) return this.text || this.defaultValue;
    if (!this.text) return this.defaultValue;
    const translated = translate(this.text);
    return translated !== this.text ? translated : this.defaultValue || this.text;
  }

  private releaseDescription(): void {
    if (!this.trigger || !this.description) return;
    const ids = (this.trigger.getAttribute("aria-describedby") || "").split(/\s+/)
      .filter(id => id && id !== this.description!.id);
    if (ids.length) this.trigger.setAttribute("aria-describedby", ids.join(" "));
    else this.trigger.removeAttribute("aria-describedby");
    this.trigger = undefined;
  }

  // ID references cannot cross a shadow boundary. Keep a hidden description
  // beside the consumer's children, never replacing or moving those children.
  private describe = (): void => {
    const trigger = this.querySelector<HTMLElement>("button, a[href], input, select, textarea, [tabindex], [role=button], [role=tab]")
      ?? [...this.children].find(child => child !== this.description) as HTMLElement | undefined;
    this.releaseDescription();
    if (!trigger || !this.label) return;
    if (!this.description) {
      this.description = document.createElement("span");
      this.description.id = `ds-tooltip-${++nextDescription}`;
      this.description.slot = "description";
      this.description.hidden = true;
    }
    this.description.textContent = this.label;
    if (!this.description.isConnected) this.append(this.description);
    this.trigger = trigger;
    const ids = (trigger.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean);
    trigger.setAttribute("aria-describedby", [...ids, this.description.id].join(" "));
  };

  updated(): void {
    this.describe();
    if (this._visible) this.place();
  }

  /**
   * Keeps the bubble inside the window, as the page's tooltips do (0-face/tooltips.ts): four
   * pixels from its edges, and below the control when there is no room above (or above when
   * `placement="bottom"` has no room below). A tooltip at a frame's edge is never cut short.
   */
  private place(): void {
    const bubble = this.shadowRoot?.querySelector<HTMLElement>(".bubble");
    if (!bubble || bubble.hidden) return;
    const edge = 4 * (parseFloat(getComputedStyle(this).getPropertyValue("--ds-sf")) || 1);
    bubble.style.removeProperty("--ds-tooltip-shift");
    bubble.dataset.side = this.placement === "bottom" ? "bottom" : "top";
    let box = bubble.getBoundingClientRect();
    if (bubble.dataset.side === "top" && box.top < edge) bubble.dataset.side = "bottom";
    else if (bubble.dataset.side === "bottom" && box.bottom > innerHeight - edge) bubble.dataset.side = "top";
    box = bubble.getBoundingClientRect();
    const shift = box.left < edge ? edge - box.left : box.right > innerWidth - edge ? innerWidth - edge - box.right : 0;
    if (shift) bubble.style.setProperty("--ds-tooltip-shift", `${shift}px`);
  }

  render() {
    return html`<slot @slotchange=${this.describe}></slot>
      <span class="bubble" role="tooltip" aria-hidden="true" ?hidden=${!this._visible || !this.label}>${this.label}</span>`;
  }
}

define("ds-tooltip", Tooltip);

declare global {
  interface HTMLElementTagNameMap { "ds-tooltip": Tooltip; }
}
