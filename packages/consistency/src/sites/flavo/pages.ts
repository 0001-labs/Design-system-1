/**
 * Indhold and Projekter, Flavo's content pages in Consistency's app, ported from the old CMS's page table and editor
 * (`src/components/Cms.ts`, deleted 26 October 2026): Indhold is the site's pages, Projekter those under
 * `/projekter/`, searched by title and address, each with whether it is shown.
 *
 * Pressing a page opens it in a non-modal drawer: its title, its words, the order and removal of its pictures and
 * whether it is shown, saved with Gem side; a failed save keeps what was typed and says why, and closing with unsaved
 * changes asks first, in place. A page's address is not changed here. New pictures are not uploaded from the app (the
 * upload ticket is for the site's own origin).
 */
import { LitElement, html, nothing } from "lit";
import { changed, failure, mediaUrl, moveItem, pageFields, pagesOf, type ContentPage, type FlavoPlaceContext } from "./core";
import { KeepCurrent } from "./keep";

interface Editing { saved: ContentPage; data: ContentPage; busy: boolean; error: string; leaving: boolean }

export class FlavoPlacePages extends LitElement {
  static properties = { pages: { state: true }, error: { state: true }, search: { state: true }, editing: { state: true } };
  context!: FlavoPlaceContext;
  /** Projekter: the pages under `/projekter/`; else Indhold. */
  projects = false;
  declare pages: ContentPage[] | null;
  declare error: string;
  declare search: string;
  declare editing: Editing | null;
  private readonly current = new KeepCurrent(this, () => this.read());

  constructor() { super(); this.pages = null; this.error = ""; this.search = ""; this.editing = null; }
  protected createRenderRoot() { return this; }
  private get heading() { return this.projects ? "Projekter" : "Indhold"; }

  private async read(): Promise<boolean> {
    try {
      const pages = (await this.context.transport("catalogue:pages", {})) as ContentPage[];
      this.pages = Array.isArray(pages) ? pages : [];
      this.error = "";
      const open = this.editing;
      const fresh = open && !open.busy && !changed(open.data, open.saved) ? this.pages.find(page => page.path === open.saved.path) : undefined;
      if (open && fresh) this.editing = { ...open, saved: fresh, data: fresh };
      return true;
    } catch (error) {
      this.error = failure(error);
      return false;
    }
  }

  private set(next: Partial<Editing>) { if (this.editing) this.editing = { ...this.editing, ...next }; }
  private change(next: Partial<ContentPage>) { if (this.editing) this.set({ data: { ...this.editing.data, ...next }, error: "", leaving: false }); }
  private closeRequest(event?: Event) {
    const editing = this.editing;
    if (editing && changed(editing.data, editing.saved) && !editing.leaving) { event?.preventDefault(); this.set({ leaving: true }); return; }
    this.editing = null;
  }

  private async save() {
    const editing = this.editing;
    if (!editing?.data._id || editing.busy) return;
    if (!editing.data.title.trim()) { this.set({ error: "Skriv en titel." }); return; }
    this.set({ busy: true, error: "" });
    try {
      await this.context.transport("catalogue:savePage", { id: editing.data._id, data: pageFields(editing.data) });
      if (this.editing?.saved.path === editing.saved.path) this.set({ busy: false, saved: editing.data, leaving: false });
      this.context.say("Siden er gemt.");
      void this.current.run();
    } catch (error) {
      if (this.editing?.saved.path === editing.saved.path) this.set({ busy: false, error: failure(error) });
    }
  }

  render() {
    const shown = this.pages ? pagesOf(this.pages, this.projects, this.search) : [];
    const count = this.pages ? pagesOf(this.pages, this.projects).length : null;
    return html`<section class="place flavo-place" aria-label=${this.heading}>
      <div class="place-head">
        <ds-text class="place-title" role="heading" aria-level="1" literal size="display" text=${this.heading}></ds-text>
        ${count === null ? nothing : html`<span class="place-muted">${count}</span>`}
      </div>
      <div class="place-tools"><span class="place-filters"><ds-input class="place-search" type="search" aria-label="Søg i indhold" placeholder="Søg i indhold" autocomplete="off"
        .value=${this.search} @input-change=${(event: CustomEvent<{ value: string }>) => { this.search = event.detail.value; }}></ds-input></span></div>
      ${this.error ? html`<ds-message role="alert" tone="danger" literal text=${this.error}></ds-message>` : nothing}
      ${this.pages === null ? (this.error ? nothing : html`<ds-text tone="muted" literal text="Henter sider…"></ds-text>`)
        : shown.length ? html`<ds-list class="flavo-pages">${shown.map(page => html`<ds-row interactive class="flavo-page" data-page=${page.path} ?open=${this.editing?.saved.path === page.path}
            @ds-row-press=${() => { this.editing = { saved: page, data: page, busy: false, error: "", leaving: false }; }}>
            <span class="ds-row__name">${page.title}</span><code class="place-code">${page.path}</code>
            <ds-tag>${page.published ? "Offentlig" : "Skjult"}</ds-tag></ds-row>`)}</ds-list>`
          : html`<ds-empty literal heading="Ingen sider fundet."></ds-empty>`}
      <ds-overlay type="drawer" non-modal .holdScroll=${false} .blockOutside=${false} ?open=${!!this.editing} @ds-close-request=${(event: Event) => this.closeRequest(event)}>
        <dialog class="place-drawer flavo-drawer" aria-labelledby="flavo-page-title">${this.editing ? this.editor(this.editing) : nothing}</dialog>
      </ds-overlay>
    </section>`;
  }

  private editor(editing: Editing) {
    const { data } = editing;
    const origin = this.context.origin;
    const files = data.imageFiles ?? [];
    const gallery = (urls: string[], key: "images" | "imageFiles", src: (value: string) => string) => html`<div class="flavo-gallery">${urls.map((value, index) => html`<figure class="flavo-gallery__item">
      <img src=${src(value)} alt=${`Billede ${index + 1}`} loading="lazy">
      <div class="place-actions">
        <ds-button icon aria-label="Flyt billede tilbage" ?disabled=${!index} @click=${() => this.change({ [key]: moveItem(urls, index, -1) })}>←</ds-button>
        <ds-button icon aria-label="Flyt billede frem" ?disabled=${index === urls.length - 1} @click=${() => this.change({ [key]: moveItem(urls, index, 1) })}>→</ds-button>
        <ds-button icon aria-label="Fjern billede" @click=${() => this.change({ [key]: urls.filter((_, at) => at !== index) })}>×</ds-button>
      </div></figure>`)}</div>`;
    return html`<div data-ds-overlay="header"><h2 data-ds-overlay="title" id="flavo-page-title">${data.title}</h2>
        <p data-ds-overlay="description"><a class="ds-link" href=${mediaUrl(origin, data.path)} target="_blank" rel="noreferrer">${data.path}</a></p></div>
      <div class="flavo-form">
        <div class="place-field"><ds-text tone="muted" literal text="Titel"></ds-text>
          <ds-input variant="field" aria-label="Titel" .value=${data.title} @input-change=${(event: CustomEvent<{ value: string }>) => this.change({ title: event.detail.value })}></ds-input></div>
        <div class="place-field"><ds-text tone="muted" literal text="Indhold"></ds-text>
          <ds-input variant="field" aria-label="Indhold" multiline rows="12" .value=${data.text} @input-change=${(event: CustomEvent<{ value: string }>) => this.change({ text: event.detail.value })}></ds-input></div>
        ${data.images.length ? gallery(data.images, "images", url => mediaUrl(origin, url)) : nothing}
        ${files.length ? gallery(files, "imageFiles", id => mediaUrl(origin, `/media/uploads/${encodeURIComponent(id)}`)) : nothing}
        <ds-message class="flavo-uploads" tone="neutral" literal text="Nye billeder uploades ikke herfra endnu. Rækkefølgen og fjernede billeder gemmes med Gem side."></ds-message>
        <label class="place-check"><ds-checkbox><input type="checkbox" .checked=${data.published} @change=${(event: Event) => this.change({ published: (event.target as HTMLInputElement).checked })}></ds-checkbox>Vis siden</label>
      </div>
      ${editing.error ? html`<ds-message role="alert" tone="danger" literal text=${editing.error}></ds-message>` : nothing}
      ${editing.leaving ? html`<div class="place-confirm" role="group" aria-label="Ændringer, der ikke er gemt">
          <ds-text wrap literal text="Du har ændringer, der ikke er gemt. Vil du forlade siden?"></ds-text>
          <div class="place-actions"><ds-button primary danger @click=${() => { this.editing = null; }}>Kassér ændringer</ds-button>
          <ds-button secondary @click=${() => this.set({ leaving: false })}>Bliv</ds-button></div></div>` : nothing}
      <div data-ds-overlay="footer" class="place-actions">
        <ds-button primary data-save ?disabled=${editing.busy || !data._id} @click=${() => void this.save()}>${editing.busy ? "Gemmer…" : "Gem side"}</ds-button>
        <ds-button secondary @click=${() => this.closeRequest()}>Luk</ds-button>
      </div>`;
  }
}
if (!customElements.get("flavo-place-pages")) customElements.define("flavo-place-pages", FlavoPlacePages);
