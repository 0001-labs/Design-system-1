/**
 * Flavo's own pages under the app's shared Pages place (Joachim, 26 October 2026: every page and its address is under
 * Pages), ported from the old CMS's page table and editor (`src/components/Cms.ts`, deleted 26 October 2026). There
 * are no Indhold or Projekter menus any more: the content pages and the project pages (under `/projekter/`) of the
 * business store (`catalogue:pages`) are rows of Pages, beside the pages of the site engine, each with its address.
 *
 * `flavoPageSource` is what the app's Pages place merges in for Flavo (the platform names the source `flavo` on its
 * Pages place): `list()` the pages, each with its address, its title and whether it is hidden, and `editor(path)` the
 * element that edits one, kept per page so words typed survive choosing another row. The editor is the page's title,
 * its words, the order and removal of its pictures and whether it is shown, saved with Gem side; a failed save keeps
 * what was typed and says why. A page's address is not changed here. New pictures are not uploaded from the app
 * (the upload ticket is for the site's own origin). A save tells the Pages place (`consistency-page-saved`), which
 * reads its rows again.
 */
import { LitElement, html, nothing } from "lit";
import { changed, failure, mediaUrl, moveItem, pageFields, pageRowsOf, sortedPages, type ContentPage, type FlavoPageRow, type FlavoPlaceContext } from "./core";

/** The event the shared Pages place reads its rows again on. */
export const PAGE_SAVED = "consistency-page-saved";

/** What Flavo gives the app's shared Pages place. */
export interface FlavoPageSource {
  /** Flavo's pages, each with its address. */
  list(): Promise<FlavoPageRow[]>;
  /** The element that edits the page at this address, as last listed; none for an address not listed. */
  editor(path: string): HTMLElement | null;
}

export function flavoPageSource(context: FlavoPlaceContext): FlavoPageSource {
  const pages = new Map<string, ContentPage>();
  const editors = new Map<string, FlavoPageEditor>();
  return {
    async list() {
      const answer = (await context.transport("catalogue:pages", {})) as ContentPage[];
      const listed = sortedPages(Array.isArray(answer) ? answer : []);
      pages.clear();
      for (const page of listed) pages.set(page.path, page);
      for (const [path, editor] of editors) {
        const page = pages.get(path);
        if (page) editor.adopt(page);
        else editors.delete(path);
      }
      return pageRowsOf(listed);
    },
    editor(path) {
      const page = pages.get(path);
      if (!page) return null;
      let editor = editors.get(path);
      if (!editor) editors.set(path, (editor = Object.assign(new FlavoPageEditor(), { context, page })));
      return editor;
    },
  };
}

/** One of Flavo's pages, edited in the middle of Pages. */
export class FlavoPageEditor extends LitElement {
  static properties = { saved: { state: true }, data: { state: true }, busy: { state: true }, error: { state: true } };
  context!: FlavoPlaceContext;
  declare saved: ContentPage;
  declare data: ContentPage;
  declare busy: boolean;
  declare error: string;

  constructor() { super(); this.busy = false; this.error = ""; }
  protected createRenderRoot() { return this; }

  /** The page to edit, as first listed. */
  set page(page: ContentPage) { this.saved = page; this.data = page; }
  get page() { return this.saved; }
  /** Whether words typed are not saved yet. */
  get dirty() { return Boolean(this.data) && changed(this.data, this.saved); }

  /** The page as listed again: taken unless words typed are waiting or being saved. */
  adopt(page: ContentPage) {
    if (this.busy || this.dirty || !changed(page, this.saved)) return;
    this.saved = page; this.data = page;
  }

  private change(next: Partial<ContentPage>) { this.data = { ...this.data, ...next }; this.error = ""; }

  private async save() {
    const data = this.data;
    if (!data._id || this.busy) return;
    if (!data.title.trim()) { this.error = "Skriv en titel."; return; }
    this.busy = true; this.error = "";
    try {
      await this.context.transport("catalogue:savePage", { id: data._id, data: pageFields(data) });
      this.saved = data;
      this.context.say("Siden er gemt.");
      this.dispatchEvent(new CustomEvent(PAGE_SAVED, { detail: { path: data.path }, bubbles: true, composed: true }));
    } catch (error) {
      this.error = failure(error);
    } finally { this.busy = false; }
  }

  render() {
    const data = this.data;
    if (!data) return nothing;
    const origin = this.context.origin;
    const files = data.imageFiles ?? [];
    const gallery = (urls: string[], key: "images" | "imageFiles", src: (value: string) => string) => html`<div class="flavo-gallery">${urls.map((value, index) => html`<figure class="flavo-gallery__item">
      <img src=${src(value)} alt=${`Billede ${index + 1}`} loading="lazy">
      <div class="place-actions">
        <ds-button icon aria-label="Flyt billede tilbage" ?disabled=${!index} @click=${() => this.change({ [key]: moveItem(urls, index, -1) })}>←</ds-button>
        <ds-button icon aria-label="Flyt billede frem" ?disabled=${index === urls.length - 1} @click=${() => this.change({ [key]: moveItem(urls, index, 1) })}>→</ds-button>
        <ds-button icon aria-label="Fjern billede" @click=${() => this.change({ [key]: urls.filter((_, at) => at !== index) })}>×</ds-button>
      </div></figure>`)}</div>`;
    return html`<div class="flavo-place flavo-page-editor">
      <div class="place-pages-head"><ds-text class="place-pages-title" literal strong text=${data.title || this.saved.title}></ds-text>
        <a class="ds-link" href=${mediaUrl(origin, data.path)} target="_blank" rel="noreferrer">${data.path}</a></div>
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
      ${this.error ? html`<ds-message role="alert" tone="danger" literal text=${this.error}></ds-message>` : nothing}
      <div class="place-actions">
        <ds-button primary data-save ?disabled=${this.busy || !data._id || !this.dirty} @click=${() => void this.save()}>${this.busy ? "Gemmer…" : "Gem side"}</ds-button>
        ${this.dirty && !this.busy ? html`<ds-button secondary @click=${() => { this.data = this.saved; this.error = ""; }}>Fortryd</ds-button>` : nothing}
      </div>
    </div>`;
  }
}
if (!customElements.get("flavo-page-editor")) customElements.define("flavo-page-editor", FlavoPageEditor);
