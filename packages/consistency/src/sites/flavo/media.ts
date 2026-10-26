/**
 * Medier, the catalogue's pictures in Consistency's app, ported from the old CMS's media grid (`src/components/Cms.ts`,
 * deleted 26 October 2026): every product's pictures, searched by the product's title. A picture's order and removal
 * are its product's, under Produkter. A picture is read from the site's own address; an unpublished product's private
 * pictures need a Flavo session there and are left empty.
 */
import { LitElement, html, nothing } from "lit";
import { allPages, failure, mediaOf, mediaUrl, type FlavoPlaceContext, type Product } from "./core";
import { KeepCurrent } from "./keep";

export class FlavoPlaceMedia extends LitElement {
  static properties = { products: { state: true }, error: { state: true }, search: { state: true } };
  context!: FlavoPlaceContext;
  declare products: Product[] | null;
  declare error: string;
  declare search: string;
  private readonly keep = new KeepCurrent(this, () => this.read());

  constructor() { super(); this.products = null; this.error = ""; this.search = ""; }
  protected createRenderRoot() { return this; }

  private async read(): Promise<boolean> {
    try {
      this.products = await allPages<Product>(this.context.transport, "catalogue:staffList");
      this.error = "";
      return true;
    } catch (error) {
      this.error = failure(error);
      return false;
    }
  }

  render() {
    const images = this.products ? mediaOf(this.products, this.search) : [];
    const count = this.products ? mediaOf(this.products).length : null;
    return html`<section class="place flavo-place" aria-label="Medier">
      <div class="place-head">
        <ds-text class="place-title" role="heading" aria-level="1" literal size="display" text="Medier"></ds-text>
        ${count === null ? nothing : html`<span class="place-muted">${count}</span>`}
      </div>
      <div class="place-tools"><span class="place-filters"><ds-input class="place-search" type="search" aria-label="Søg i medier" placeholder="Søg efter produkt" autocomplete="off"
        .value=${this.search} @input-change=${(event: CustomEvent<{ value: string }>) => { this.search = event.detail.value; }}></ds-input></span></div>
      ${this.error ? html`<ds-message role="alert" tone="danger" literal text=${this.error}></ds-message>` : nothing}
      ${this.products === null ? (this.error ? nothing : html`<ds-text tone="muted" literal text="Henter medier…"></ds-text>`)
        : images.length ? html`<div class="flavo-media">${images.map(image => html`<figure class="flavo-media__item" data-image=${image.key}>
            <img src=${mediaUrl(this.context.origin, image.url)} alt=${image.product.title} loading="lazy">
            <figcaption>${image.product.title}</figcaption></figure>`)}</div>`
          : html`<ds-empty literal heading="Ingen billeder fundet."></ds-empty>`}
    </section>`;
  }
}
if (!customElements.get("flavo-place-media")) customElements.define("flavo-place-media", FlavoPlaceMedia);
