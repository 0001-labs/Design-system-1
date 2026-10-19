import { LitElement, html, nothing, unsafeCSS } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { styleMap } from "lit/directives/style-map.js";
import { define } from "../0-face/define";
import styles from "./styles/ds-image.css?inline";

/** Responsive image with native alternative text, optional crop and caption. */
export class Image extends LitElement {
  static properties = {
    src: { type: String }, alt: { type: String }, caption: { type: String },
    srcset: { type: String }, sizes: { type: String },
    width: { type: Number }, height: { type: Number },
    ratio: { type: String }, fit: { type: String }, position: { type: String },
    loading: { type: String },
  };
  static styles = unsafeCSS(styles);
  declare src: string; declare alt: string; declare caption: string;
  declare srcset: string; declare sizes: string;
  declare width?: number; declare height?: number;
  declare ratio: string; declare fit: string; declare position: string;
  declare loading: string;
  constructor() {
    super(); this.src = ""; this.alt = ""; this.caption = "";
    this.srcset = ""; this.sizes = ""; this.ratio = "";
    this.fit = "cover"; this.position = "center"; this.loading = "lazy";
  }
  render() {
    const dimension = (value?: number) => value && Number.isFinite(value) && value > 0 ? value : undefined;
    return html`<figure>
      <div class="media" part="media" style=${styleMap({ aspectRatio: this.ratio || undefined })}>
        <img part="image" src=${ifDefined(this.src || undefined)} alt=${this.alt}
          srcset=${ifDefined(this.srcset || undefined)} sizes=${ifDefined(this.sizes || undefined)}
          width=${ifDefined(dimension(this.width))} height=${ifDefined(dimension(this.height))}
          loading=${this.loading === "eager" ? "eager" : "lazy"} decoding="async"
          style=${styleMap({ height: this.ratio ? "100%" : "auto", objectFit: this.fit === "contain" ? "contain" : "cover", objectPosition: this.position })} />
      </div>
      ${this.caption ? html`<figcaption part="caption">${this.caption}</figcaption>` : nothing}
    </figure>`;
  }
}
define("ds-image", Image);
declare global { interface HTMLElementTagNameMap { "ds-image": Image } }
