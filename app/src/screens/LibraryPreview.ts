import { html } from "lit";
import { styleMap } from "lit/directives/style-map.js";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { LiveQuery } from "../lib/backend";
import { AppElement, defineElement } from "../lib/element";
import { previewColours } from "../lib/libraryPreview";
import { libraryTemplate } from "../lib/libraryTemplate";

/** A library's colours on a small page, or Design system 1's own without `libraryId`. */
export class LibraryPreview extends AppElement {
  static properties = { libraryId: { attribute: false } };
  declare libraryId: Id<"libraries"> | undefined;
  #library = new LiveQuery(this, api.libraries.get, () => this.libraryId ? { id: this.libraryId } : "skip");
  #style: { css: string | undefined; style: Record<string, string> } | null = null;

  #styleFor(css: string | undefined) {
    if (this.#style && this.#style.css === css) return this.#style.style;
    const style = css ? Object.fromEntries(Object.entries(previewColours(css, libraryTemplate))
      .filter(([, value]) => CSS.supports("color", value))
      .map(([role, value]) => [`--preview-${role}`, value])) : {};
    this.#style = { css, style };
    return style;
  }

  override render() {
    const library = this.#library.value;
    const css = this.libraryId ? library?.draftCss : libraryTemplate;
    return html`<div class="library-specimen" style=${styleMap(this.#styleFor(css))} aria-hidden="true" ?data-loading=${Boolean(this.libraryId && !library)}>
      <div class="library-specimen__page">
        <div class="library-specimen__heading"><span>Aa</span><span class="library-specimen__mark"></span></div>
        <span class="library-specimen__line"></span>
        <span class="library-specimen__line library-specimen__line--short"></span>
        <span class="library-specimen__button">Button <span>→</span></span>
      </div>
      <div class="library-specimen__palette">
        ${["accent", "paper", "ink", "surface"].map(role => html`<span style=${`background: var(--preview-${role})`}></span>`)}
      </div>
    </div>`;
  }
}
defineElement("ds1-library-preview", LibraryPreview);
