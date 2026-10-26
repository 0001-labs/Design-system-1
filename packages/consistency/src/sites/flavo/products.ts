/**
 * Produkter and Udlejning, Flavo's catalogue in Consistency's app, ported from the old CMS's product table and editor
 * (`src/components/Cms.ts`, deleted 26 October 2026): the products (Produkter, every type, with a type Select) or the
 * rental products alone (Udlejning), newest first, searched and filtered by category and visibility. The Notion
 * connection stands under the title, with Synkronisér nu.
 *
 * Pressing a product opens it in a non-modal drawer beside the list: whether it shows on the site (a Select, saved
 * the moment it is chosen; a refusal puts it back), then Oplysninger (type, homepage slot, title, address, category,
 * material, description, price and quantity), Billeder (the order and removal of its pictures) and Internt lager
 * (box, location, notes and lending, staff only). Gem produkt saves the fields; a failed save keeps what was typed
 * and says why. Closing with unsaved changes asks first, in place.
 *
 * New pictures are not uploaded from the app: the business store's upload ticket is for the site's own origin, which
 * the app's gateway does not pass. Notion's fields (title, category, material, price, quantity, stock pictures) are
 * edited in Notion.
 */
import { LitElement, html, nothing } from "lit";
import {
  allPages, categories, changed, failure, filterProducts, kindWords, mediaUrl, moveItem, newProduct, notionWords, numberOf, price, productFields,
  productProblem, withKind, type FlavoPlaceContext, type NotionStatus, type Product, type ProductFilter,
} from "./core";
import { KeepCurrent } from "./keep";

type Tab = "details" | "images" | "inventory";
interface Inventory { box: string; location: string; notes: string; lending: string }
const INVENTORY: [keyof Inventory, string][] = [["box", "Kasse"], ["location", "Placering"], ["notes", "Noter"], ["lending", "Udlån"]];
const NOTION = "https://www.notion.so/2e0aad1dc6ea8119b988d69723eef74a";

/** The product open in the drawer: as saved, as being edited, and what is happening to it. */
interface Editing {
  saved: Product;
  data: Product;
  tab: Tab;
  busy: boolean;
  error: string;
  /** The drawer was asked to close with unsaved changes. */
  leaving: boolean;
  publishing: boolean;
  inventory: Inventory | null;
  inventorySaved: Inventory | null;
  inventoryBusy: boolean;
  inventoryError: string;
  /** The price and quantity as typed; read as numbers when saved. */
  price: string;
  quantity: string;
}
const typed = (value: number | null) => (value === null ? "" : String(value));

export class FlavoPlaceProducts extends LitElement {
  static properties = {
    products: { state: true }, error: { state: true }, filter: { state: true }, notion: { state: true }, syncing: { state: true },
    editing: { state: true }, rowError: { state: true },
  };
  context!: FlavoPlaceContext;
  /** `rentals`: Udlejning, the rental products alone. */
  rentals = false;
  declare products: Product[] | null;
  declare error: string;
  declare filter: ProductFilter;
  declare notion: NotionStatus | null;
  declare syncing: boolean;
  declare editing: Editing | null;
  declare rowError: string;
  private readonly current = new KeepCurrent(this, () => this.read());

  constructor() {
    super();
    this.products = null; this.error = ""; this.notion = null; this.syncing = false; this.editing = null; this.rowError = "";
    this.filter = { search: "", category: "", visibility: "all", kind: "all" };
  }
  protected createRenderRoot() { return this; }
  private get transport() { return this.context.transport; }
  private get heading() { return this.rentals ? "Udlejning" : "Produkter"; }

  /** The catalogue and the Notion connection; a product being edited keeps what was typed. */
  private async read(): Promise<boolean> {
    const [products, notion] = await Promise.allSettled([
      allPages<Product>(this.transport, "catalogue:staffList"),
      this.transport("notionSync:status", {}) as Promise<NotionStatus>,
    ]);
    if (notion.status === "fulfilled") this.notion = notion.value;
    if (products.status === "rejected") { this.error = failure(products.reason); return false; }
    this.error = "";
    this.products = products.value;
    const open = this.editing;
    if (open?.saved._id && !open.busy && !open.publishing) {
      const fresh = products.value.find(product => product._id === open.saved._id);
      if (fresh && !changed(open.data, open.saved) && open.price === typed(open.saved.price) && open.quantity === typed(open.saved.quantity)) this.editing = { ...open, saved: fresh, data: fresh, price: typed(fresh.price), quantity: typed(fresh.quantity) };
      else if (fresh) this.editing = { ...open, saved: fresh, data: { ...open.data, published: fresh.published } };
    }
    return true;
  }

  private async sync() {
    this.syncing = true;
    try {
      await this.transport("notionSync:requestSync", {});
      this.context.say("Synkronisering er bestilt.");
      void this.current.run();
    } catch (error) {
      this.context.say(failure(error), "error");
    } finally { this.syncing = false; }
  }

  private open(product: Product) {
    this.editing = { saved: product, data: product, tab: "details", busy: false, error: "", leaving: false, publishing: false, inventory: null, inventorySaved: null, inventoryBusy: false, inventoryError: "", price: typed(product.price), quantity: typed(product.quantity) };
    if (product._id && !product.notionManaged) void this.readInventory(product._id);
  }
  private create() { this.open(newProduct()); }
  private set(next: Partial<Editing>) { if (this.editing) this.editing = { ...this.editing, ...next }; }
  private change(next: Partial<Product>) { if (this.editing) this.set({ data: { ...this.editing.data, ...next }, error: "", leaving: false }); }
  private get dirty() {
    const editing = this.editing;
    return !!editing && (changed(editing.data, editing.saved) || editing.price !== typed(editing.saved.price) || editing.quantity !== typed(editing.saved.quantity)
      || (!!editing.inventory && changed(editing.inventory, editing.inventorySaved)));
  }
  /** Close asked for: at once when nothing is unsaved, else asked about in place. */
  private closeRequest(event?: Event) {
    if (this.dirty && !this.editing?.leaving) { event?.preventDefault(); this.set({ leaving: true }); return; }
    this.editing = null;
  }

  private async readInventory(productId: string) {
    try {
      const row = (await this.transport("catalogue:inventory", { productId })) as Inventory | null;
      const inventory = { box: row?.box ?? "", location: row?.location ?? "", notes: row?.notes ?? "", lending: row?.lending ?? "" };
      if (this.editing?.saved._id === productId) this.set({ inventory, inventorySaved: inventory });
    } catch (error) {
      if (this.editing?.saved._id === productId) this.set({ inventoryError: failure(error) });
    }
  }

  /** Shown on the site or not, saved the moment it is chosen; a refusal puts the choice back and says why. */
  private async publish(published: boolean) {
    const editing = this.editing;
    if (!editing?.saved._id || editing.publishing || editing.saved.published === published) return;
    const id = editing.saved._id;
    this.set({ publishing: true, error: "", saved: { ...editing.saved, published }, data: { ...editing.data, published } });
    try {
      await this.transport("catalogue:setPublished", { id, published });
      this.products = this.products?.map(product => (product._id === id ? { ...product, published } : product)) ?? null;
      this.context.say(published ? "Produktet er udgivet." : "Produktet er en kladde.");
      if (this.editing?.saved._id === id) this.set({ publishing: false });
    } catch (error) {
      if (this.editing?.saved._id === id) this.set({ publishing: false, error: failure(error), saved: { ...this.editing.saved, published: !published }, data: { ...this.editing.data, published: !published } });
    }
  }

  /** The fields, saved as one; a refusal keeps what was typed and says why. */
  private async save() {
    const editing = this.editing;
    if (!editing || editing.busy) return;
    const price = numberOf(editing.price), quantity = numberOf(editing.quantity, true);
    const problem = price === undefined ? "Prisen er et tal i kroner." : quantity === undefined ? "Antallet er et helt tal." : productProblem(editing.data);
    if (problem || price === undefined || quantity === undefined) { this.set({ error: problem, tab: "details" }); return; }
    const data = { ...editing.data, price, quantity };
    this.set({ busy: true, error: "" });
    try {
      const fields = productFields(data);
      const id = (await this.transport("catalogue:save", { id: editing.data._id, data: fields })) as string;
      const saved = { ...data, ...fields, _id: id ?? data._id };
      if (this.editing?.saved.sourceId === editing.saved.sourceId) this.set({ busy: false, saved, data: saved, leaving: false, price: typed(saved.price), quantity: typed(saved.quantity) });
      this.context.say("Produktet er gemt.");
      void this.current.run();
    } catch (error) {
      if (this.editing?.saved.sourceId === editing.saved.sourceId) this.set({ busy: false, error: failure(error) });
    }
  }

  private async saveInventory() {
    const editing = this.editing;
    if (!editing?.saved._id || !editing.inventory || editing.inventoryBusy) return;
    const productId = editing.saved._id, data = editing.inventory;
    this.set({ inventoryBusy: true, inventoryError: "" });
    try {
      await this.transport("catalogue:saveInventory", { productId, data });
      if (this.editing?.saved._id === productId) this.set({ inventoryBusy: false, inventorySaved: data });
      this.context.say("Interne oplysninger er gemt.");
    } catch (error) {
      if (this.editing?.saved._id === productId) this.set({ inventoryBusy: false, inventoryError: failure(error) });
    }
  }

  render() {
    const products = this.products;
    const kind = this.rentals ? "rental" : this.filter.kind;
    const shown = products ? filterProducts(products, { ...this.filter, kind }) : [];
    const counted = products ? filterProducts(products, { search: "", category: "", visibility: "all", kind: this.rentals ? "rental" : "all" }).length : null;
    const select = (label: string, value: string, options: [string, string][], pick: (value: string) => void) =>
      html`<ds-select><select aria-label=${label} .value=${value} @change=${(event: Event) => pick((event.target as HTMLSelectElement).value)}>
        ${options.map(([id, words]) => html`<option value=${id} ?selected=${value === id}>${words}</option>`)}</select></ds-select>`;
    return html`<section class="place flavo-place" aria-label=${this.heading}>
      <div class="place-head">
        <ds-text class="place-title" role="heading" aria-level="1" literal size="display" text=${this.heading}></ds-text>
        ${counted === null ? nothing : html`<span class="place-muted">${counted}</span>`}
      </div>
      <div class="place-line flavo-notion" role="status">
        <a class="ds-link" href=${NOTION} target="_blank" rel="noreferrer">Lager i Notion</a>
        <span class="place-muted">${notionWords(this.notion)}</span>
        <ds-button secondary ?disabled=${!this.notion?.configured || this.notion.status === "running" || this.syncing} @click=${() => void this.sync()}>Synkronisér nu</ds-button>
      </div>
      <div class="place-tools">
        <span class="place-filters">
          <ds-input class="place-search" type="search" aria-label="Søg i produkter" placeholder="Søg" autocomplete="off" .value=${this.filter.search}
            @input-change=${(event: CustomEvent<{ value: string }>) => { this.filter = { ...this.filter, search: event.detail.value }; }}></ds-input>
          ${select("Kategori", this.filter.category, [["", "Alle kategorier"], ...Object.entries(categories)], category => { this.filter = { ...this.filter, category }; })}
          ${select("Visning", this.filter.visibility, [["all", "Alle udgivelsesstatusser"], ["published", "Udgivet"], ["draft", "Kladde"]], visibility => { this.filter = { ...this.filter, visibility: visibility as ProductFilter["visibility"] }; })}
          ${this.rentals ? nothing : select("Produkttype", this.filter.kind, [["all", "Alle produkttyper"], ["sale", "Vaser"], ["rental", "Udlejning"], ["poster", "Plakater"]], value => { this.filter = { ...this.filter, kind: value as ProductFilter["kind"] }; })}
        </span>
        <ds-button primary @click=${() => this.create()}>Nyt produkt</ds-button>
      </div>
      ${this.error ? html`<ds-message role="alert" tone="danger" literal text=${this.error}></ds-message>` : nothing}
      ${products === null ? (this.error ? nothing : html`<ds-text tone="muted" literal text="Henter produkter…"></ds-text>`)
        : shown.length ? html`<ds-list class="flavo-products">${shown.map(product => this.row(product))}</ds-list>`
          : html`<ds-empty literal heading="Ingen produkter matcher dine filtre."></ds-empty>`}
      ${this.drawer()}
    </section>`;
  }

  private row(product: Product) {
    return html`<ds-row interactive class="flavo-product" data-product=${product.sourceId} ?open=${this.editing?.saved.sourceId === product.sourceId} @ds-row-press=${() => this.open(product)}>
      <span class="ds-row__name">${product.title || "Uden titel"}</span>
      <span class="place-muted flavo-product__kind">${kindWords(product)}</span>
      <span class="place-muted flavo-product__category">${categories[product.category] ?? product.category}</span>
      <span class="place-muted flavo-product__quantity">${product.quantity ?? "Skal bekræftes"}</span>
      <ds-tag class="flavo-product__status">${product.published ? "Udgivet" : "Kladde"}</ds-tag>
      <span class="ds-row__value">${price(product.price)}</span>
    </ds-row>`;
  }

  private drawer() {
    const editing = this.editing;
    return html`<ds-overlay type="drawer" non-modal .holdScroll=${false} .blockOutside=${false} ?open=${!!editing} @ds-close-request=${(event: Event) => this.closeRequest(event)}>
      <dialog class="place-drawer flavo-drawer" aria-labelledby="flavo-product-title">${editing ? this.editor(editing) : nothing}</dialog>
    </ds-overlay>`;
  }

  private editor(editing: Editing) {
    const { data, saved } = editing;
    const notion = !!data.notionManaged;
    const tabs: [Tab, string][] = [["details", "Oplysninger"], ["images", "Billeder"], ["inventory", "Internt lager"]];
    return html`<div data-ds-overlay="header"><h2 data-ds-overlay="title" id="flavo-product-title">${data.title || "Nyt produkt"}</h2>
        ${notion ? html`<p data-ds-overlay="description">Lageroplysninger og billeder kommer fra <a class="ds-link" href=${`https://www.notion.so/${data.sourceId.replaceAll("-", "")}`} target="_blank" rel="noreferrer">Notion</a>. Beskrivelse, adresse og synlighed redigeres her.</p>` : nothing}</div>
      ${saved._id ? html`<div class="place-field">
        <ds-text tone="muted" literal text="Vis på hjemmesiden"></ds-text>
        <ds-select class="flavo-publish"><select aria-label="Vis på hjemmesiden" ?disabled=${editing.publishing} .value=${saved.published ? "published" : "draft"}
          @change=${(event: Event) => void this.publish((event.target as HTMLSelectElement).value === "published")}>
          <option value="published" ?selected=${saved.published}>Udgivet</option><option value="draft" ?selected=${!saved.published}>Kladde</option></select></ds-select>
      </div>` : nothing}
      <ds-tabs text class="place-tabs" aria-label="Produktredigering">${tabs.map(([id, label]) => html`<ds-button control="host" role="tab" ?active=${editing.tab === id} aria-selected=${String(editing.tab === id)}
        tabindex=${editing.tab === id ? 0 : -1} @click=${() => this.set({ tab: id })}>${label}</ds-button>`)}</ds-tabs>
      ${editing.tab === "details" ? this.details(editing, !!saved._id, notion) : editing.tab === "images" ? this.images(data, notion) : this.inventory(editing, notion)}
      ${editing.error ? html`<ds-message role="alert" tone="danger" literal text=${editing.error}></ds-message>` : nothing}
      ${editing.leaving ? html`<div class="place-confirm" role="group" aria-label="Ændringer, der ikke er gemt">
          <ds-text wrap literal text="Du har ændringer, der ikke er gemt. Vil du forlade produktet?"></ds-text>
          <div class="place-actions"><ds-button primary danger @click=${() => { this.editing = null; }}>Kassér ændringer</ds-button>
          <ds-button secondary @click=${() => this.set({ leaving: false })}>Bliv</ds-button></div></div>` : nothing}
      <div data-ds-overlay="footer" class="place-actions">
        ${editing.tab === "inventory" ? nothing : html`<ds-button primary data-save ?disabled=${editing.busy} @click=${() => void this.save()}>${editing.busy ? "Gemmer…" : "Gem produkt"}</ds-button>`}
        <ds-button secondary @click=${() => this.closeRequest()}>Luk</ds-button>
      </div>`;
  }

  private field(label: string, input: unknown) {
    return html`<div class="place-field"><ds-text tone="muted" literal text=${label}></ds-text>${input}</div>`;
  }
  private text(label: string, value: string, set: (value: string) => void, options: { disabled?: boolean; multiline?: boolean; numeric?: boolean } = {}) {
    return this.field(label, html`<ds-input variant="field" aria-label=${label} ?disabled=${!!options.disabled} ?multiline=${!!options.multiline} rows=${options.multiline ? 5 : 1}
      inputmode=${options.numeric ? "decimal" : "text"} .value=${value} @input-change=${(event: CustomEvent<{ value: string }>) => set(event.detail.value)}></ds-input>`);
  }

  private details(editing: Editing, saved: boolean, notion: boolean) {
    const data = editing.data;
    const kind = data.productType ?? "rental";
    return html`<div class="flavo-form">
      ${this.field("Produkttype", html`<ds-select><select aria-label="Produkttype" ?disabled=${saved} .value=${kind} @change=${(event: Event) => { if (this.editing) this.set({ data: withKind(this.editing.data, (event.target as HTMLSelectElement).value) }); }}>
        <option value="rental" ?selected=${kind === "rental"}>Udlejning · Events</option><option value="sale" ?selected=${kind === "sale"}>Salg · Vaser</option><option value="poster" ?selected=${kind === "poster"}>Salg · Plakater</option></select></ds-select>`)}
      ${data.productType === "sale" ? this.field("Placering på forsiden", html`<ds-select><select aria-label="Placering på forsiden" .value=${String(data.homepageSlot ?? "")} @change=${(event: Event) => { const value = (event.target as HTMLSelectElement).value; this.change({ homepageSlot: value ? (Number(value) as 1 | 2) : null }); }}>
        <option value="" ?selected=${!data.homepageSlot}>Ikke på forsiden</option><option value="1" ?selected=${data.homepageSlot === 1}>Venstre · 1</option><option value="2" ?selected=${data.homepageSlot === 2}>Højre · 2</option></select></ds-select>`) : nothing}
      ${this.text("Titel", data.title, title => this.change({ title }), { disabled: notion })}
      ${this.text("Adresse", data.slug, slug => this.change({ slug }))}
      ${this.field("Kategori", html`<ds-select><select aria-label="Kategori" ?disabled=${notion} .value=${data.category} @change=${(event: Event) => this.change({ category: (event.target as HTMLSelectElement).value })}>
        ${Object.entries(categories).map(([id, words]) => html`<option value=${id} ?selected=${data.category === id}>${words}</option>`)}</select></ds-select>`)}
      ${this.text("Materiale", data.material, material => this.change({ material }), { disabled: notion })}
      ${this.text("Beskrivelse", data.description, description => this.change({ description }), { multiline: true })}
      ${this.text("Pris i DKK (tom = forespørgsel)", editing.price, price => this.set({ price, error: "", leaving: false }), { disabled: notion, numeric: true })}
      ${this.text("Antal (tom = ukendt)", editing.quantity, quantity => this.set({ quantity, error: "", leaving: false }), { disabled: notion, numeric: true })}
      ${saved ? nothing : this.field("Vis på hjemmesiden", html`<ds-select><select aria-label="Vis på hjemmesiden" .value=${data.published ? "published" : "draft"} @change=${(event: Event) => this.change({ published: (event.target as HTMLSelectElement).value === "published" })}>
        <option value="published" ?selected=${data.published}>Udgivet</option><option value="draft" ?selected=${!data.published}>Kladde</option></select></ds-select>`)}
    </div>`;
  }

  private images(data: Product, notion: boolean) {
    const origin = this.context.origin;
    const thumbs = (urls: string[], key: "images" | "imageFiles", src: (value: string) => string) => html`<div class="flavo-gallery">${urls.map((value, index) => html`<figure class="flavo-gallery__item">
      <img src=${src(value)} alt=${`Billede ${index + 1}`} loading="lazy">
      <div class="place-actions">
        <ds-button icon aria-label="Flyt billede tilbage" ?disabled=${!index} @click=${() => this.change({ [key]: moveItem(urls, index, -1) })}>←</ds-button>
        <ds-button icon aria-label="Flyt billede frem" ?disabled=${index === urls.length - 1} @click=${() => this.change({ [key]: moveItem(urls, index, 1) })}>→</ds-button>
        <ds-button icon aria-label="Fjern billede" @click=${() => this.change({ [key]: urls.filter((_, at) => at !== index) })}>×</ds-button>
      </div></figure>`)}</div>`;
    const files = data.imageFiles ?? [];
    return html`<div class="flavo-form">
      ${notion ? html`<ds-text tone="muted" wrap literal text="Lagerbilleder ændres i Notion. Ekstra billeder til hjemmesiden står nedenfor."></ds-text>
        <div class="flavo-gallery">${(data.sourceImageFiles ?? []).map((id, index) => html`<figure class="flavo-gallery__item"><img src=${mediaUrl(origin, `/media/uploads/${encodeURIComponent(id)}`)} alt=${`${data.title} ${index + 1}`} loading="lazy"></figure>`)}</div>` : nothing}
      ${notion ? nothing : data.images.length ? thumbs(data.images, "images", url => mediaUrl(origin, url)) : nothing}
      ${files.length ? thumbs(files, "imageFiles", id => mediaUrl(origin, `/media/uploads/${encodeURIComponent(id)}`)) : nothing}
      ${!data.images.length && !files.length && !notion ? html`<ds-text tone="muted" literal text="Ingen billeder endnu."></ds-text>` : nothing}
      <ds-message class="flavo-uploads" tone="neutral" literal text="Nye billeder uploades ikke herfra endnu. Rækkefølgen og fjernede billeder gemmes med Gem produkt."></ds-message>
    </div>`;
  }

  private inventory(editing: Editing, notion: boolean) {
    if (notion) return html`<ds-text wrap literal text="Redigér kasse, placering, noter og udlån i Notion."></ds-text>`;
    if (!editing.saved._id) return html`<ds-text wrap literal text="Gem produktet, før du tilføjer lageroplysninger."></ds-text>`;
    const inventory = editing.inventory;
    if (!inventory) return editing.inventoryError ? html`<ds-message role="alert" tone="danger" literal text=${editing.inventoryError}></ds-message>` : html`<ds-text tone="muted" literal text="Henter lageroplysninger…"></ds-text>`;
    return html`<div class="flavo-form">
      <ds-text tone="muted" literal text="Kun synligt for Flavo."></ds-text>
      ${INVENTORY.map(([key, label]) => this.text(label, inventory[key], value => this.set({ inventory: { ...inventory, [key]: value }, leaving: false }), { multiline: true }))}
      ${editing.inventoryError ? html`<ds-message role="alert" tone="danger" literal text=${editing.inventoryError}></ds-message>` : nothing}
      <div class="place-actions"><ds-button secondary data-save-inventory ?disabled=${editing.inventoryBusy} @click=${() => void this.saveInventory()}>Gem lageroplysninger</ds-button></div>
    </div>`;
  }
}
if (!customElements.get("flavo-place-products")) customElements.define("flavo-place-products", FlavoPlaceProducts);
