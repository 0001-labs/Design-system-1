import { LitElement, html, nothing, unsafeCSS, type PropertyValues } from "lit";
import { styleMap } from "lit/directives/style-map.js";
import { keyed } from "lit/directives/keyed.js";
import { define } from "../0-face/define";
import "./ds-icon";
import styles from "./styles/ds-avatar.css?inline";

/** Saved identity colours are hex; their ink must stay legible in either theme. */
export function avatarInk(color: string): string | undefined {
  const match = /^#([a-f\d]{6}|[a-f\d]{3})$/i.exec(color);
  if (!match) return undefined;
  const hex = match[1].length === 3 ? [...match[1]].map((c) => c + c).join("") : match[1];
  const rgb = [0, 2, 4]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((n) => (n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4));
  const luminance = rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  return luminance > 0.22 ? "var(--ds-black)" : "var(--ds-white)";
}

/** A person's or workspace's mark. Identity selection and actions belong to the app. */
export class Avatar extends LitElement {
  static properties = {
    label: { type: String },
    initial: { type: String },
    src: { type: String },
    icon: { type: String },
    color: { type: String },
    shape: { type: String, reflect: true },
    size: { type: String, reflect: true },
    fit: { type: String, reflect: true },
    mask: { type: Boolean, reflect: true },
    outlined: { type: Boolean, reflect: true },
    pending: { type: Boolean, reflect: true },
    plain: { type: Boolean, reflect: true },
    loaded: { state: true },
    failed: { state: true },
  };
  declare label: string;
  declare initial: string;
  declare src: string;
  declare icon: string;
  declare color: string;
  declare shape: "circle" | "square" | "rounded";
  declare size: "default" | "compact" | "large";
  declare fit: "cover" | "contain";
  declare mask: boolean;
  declare outlined: boolean;
  declare pending: boolean;
  declare plain: boolean;
  declare private loaded: boolean;
  declare private failed: boolean;
  static styles = unsafeCSS(styles);
  constructor() {
    super();
    this.label = "";
    this.initial = "?";
    this.src = "";
    this.icon = "";
    this.color = "";
    this.shape = "circle";
    this.size = "default";
    this.fit = "cover";
    this.mask = this.outlined = this.pending = this.plain = this.loaded = this.failed = false;
  }
  protected willUpdate(changed: PropertyValues<this>) {
    if (changed.has("src")) {
      this.loaded = false;
      this.failed = false;
    }
  }
  render() {
    const src = this.src;
    const fallback = this.icon
      ? html`<ds-icon type=${this.icon} aria-hidden="true"></ds-icon>`
      : html`<span
          class="initial"
          ?data-pair=${[...this.initial].length > 1}
          style=${styleMap({ "--initial-count": String([...this.initial].length || 1) })}
          >${this.initial}</span
        >`;
    return html`<span
      class="frame"
      style=${styleMap({ backgroundColor: !this.pending && !this.plain ? this.color || undefined : undefined, color: !this.pending ? avatarInk(this.color) : undefined })}
      role=${this.label ? "img" : nothing}
      aria-label=${this.label || nothing}
      aria-hidden=${this.label ? nothing : "true"}
    >
      ${!this.loaded || this.failed ? fallback : nothing}
      ${
        src && !this.failed
          ? keyed(
              src,
              html`<img
                src=${src}
                alt=""
                aria-hidden="true"
                draggable="false"
                ?data-visible=${this.loaded && !this.mask}
                @load=${() => {
                  if (this.src === src) this.loaded = true;
                }}
                @error=${() => {
                  if (this.src === src) {
                    this.failed = true;
                    this.loaded = false;
                  }
                }}
              />`,
            )
          : nothing
      }
      ${this.mask && this.loaded && !this.failed ? html`<span class="mask" style=${styleMap({ maskImage: `url(${JSON.stringify(src)})` })}></span>` : nothing}
    </span>`;
  }
}
define("ds-avatar", Avatar);
declare global {
  interface HTMLElementTagNameMap {
    "ds-avatar": Avatar;
  }
}
