/**
 * Pages, one of an open site's places in Consistency's app, ported from the sites' own editor (deleted 26 October
 * 2026), in three columns two squares apart: on the left a list sixteen squares wide, a row per page across its
 * languages (its short title, its address in the code face and how many of its words are edited), with the
 * languages as text tabs above it; in the middle, at most thirty-two squares wide, the chosen page, its title with
 * Edit, and under it its details; on the right, sixteen squares wide, its share image.
 *
 * The details are the page's search and sharing in the chosen language: its title and description, each edited in
 * place with Aa's plain editor and saved (`POST edit`) on Enter or on leaving it, Escape putting back the words saved
 * last and a failed save putting them back too, with the failure beside them; each with its length against what
 * search shows. Then its address, its languages, how many of its words are edited and its last edit. The share image
 * is shown as a link preview shows it, following the words as they are typed, and changed from the site's pictures
 * in a non-modal drawer, saved on choosing. Under the list, the edits whose words are no longer on the site.
 *
 * Choosing a row only changes the other two columns; Edit, double-pressing a row or Enter opens the page on the
 * site's canvas: the place sends `consistency-open-page` `{ path }`, which the app answers. The pages are read on
 * entry, on coming back to the place and when the window has the focus again, drawn first from the last read.
 */
import { LitElement, html, nothing } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import '../../../../DS1/3-unit/ds-list';
import '../../../../DS1/3-unit/ds-row';
import '../../../../DS1/3-unit/ds-tabs';
import '../../../../DS1/3-unit/ds-table';
import '../../../../DS1/4-page/ds-overlay';
import '../../../../DS1/2-core/ds-button';
import '../../../../DS1/2-core/ds-text';
import '../../../../DS1/2-core/ds-message';
import '../../../../DS1/2-core/ds-empty';
import { toast } from '../../../../DS1/0-face/feedback';
import { createPlainEditor } from '../../../../website/src/vendor/aa/aa';
import { MARKDOWN_LIMIT, plainText } from '../vendor/site-engine/markdown';
import type { SiteSummary } from '../site-editing';
import { siteApi } from './api';
import { kept, readWhenShown } from './fresh';
import {
  chosenRow, DESCRIPTION_LIMIT, groupPages, languagesOf, lengthNote, pageRows, pickerImages, shareCard, shareFields, siteFile, TITLE_LIMIT, when,
  type DetachedEdit, type Language, type PageField, type PageFields, type PageRow, type PageSummary,
} from './pages-group';
import './places.css';

interface PagesAnswer { pages?: PageSummary[]; images?: string[] }
interface Saved { html: string; edit?: { markdown: string; editor: string; at: number } }
/** A plain editor standing in a line of the details, for one field of one page. */
interface Words { host: HTMLElement; plain: ReturnType<typeof createPlainEditor>; path: string; key: string; field: PageField; accepted: string; value: string; saving: boolean }

/** The event a place sends to have the app show one of the site's pages on its canvas. */
export const OPEN_PAGE = 'consistency-open-page';

export class ConsistencyPlacePages extends LitElement {
  static properties = {
    pages: { state: true }, images: { state: true }, detached: { state: true }, problem: { state: true },
    language: { state: true }, chosenBase: { state: true }, details: { state: true }, detailProblem: { state: true },
    failure: { state: true }, picking: { state: true }, pickProblem: { state: true },
  };
  declare pages: PageSummary[] | null;
  declare images: string[];
  declare detached: DetachedEdit[];
  declare problem: string;
  declare language: string | null;
  declare chosenBase: string | null;
  /** Each page's fields as last read, by path. */
  declare details: Map<string, PageFields>;
  declare detailProblem: string;
  /** A save that failed: which field, and the words saying why. */
  declare failure: { key: string; words: string } | null;
  /** The share image field being chosen for, while the drawer is open. */
  declare picking: { path: string; field: PageField } | null;
  declare pickProblem: string;
  site!: SiteSummary;
  /** The words being typed in each field, by `path key`, for the counts and the share card. */
  private readonly typed = new Map<string, string>();
  private readonly editors = new Map<HTMLElement, Words>();
  private stop: (() => void) | null = null;
  private reading = 0;

  constructor(site?: SiteSummary) {
    super();
    if (site) this.site = site;
    this.pages = null; this.images = []; this.detached = []; this.problem = ''; this.language = null; this.chosenBase = null;
    this.details = new Map(); this.detailProblem = ''; this.failure = null; this.picking = null; this.pickProblem = '';
  }
  protected createRenderRoot() { return this; }

  private get key() { return `consistency-place-pages:${this.site.code}`; }

  connectedCallback() {
    super.connectedCallback();
    if (!this.pages) {
      const last = kept.read<PagesAnswer>(this.key);
      if (Array.isArray(last?.pages)) { this.pages = last.pages; this.images = last.images ?? []; }
    }
    this.stop = readWhenShown(this, () => void this.read());
    void this.read();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.stop?.(); this.stop = null;
    for (const words of this.editors.values()) words.plain.destroy();
    this.editors.clear();
  }

  /** The pages and the edits no longer on the site, then the chosen page's fields, again. */
  async read() {
    const ticket = ++this.reading;
    const [answer, detached] = await Promise.all([
      siteApi<PagesAnswer>(this.site.code, 'pages').catch((error: Error) => error),
      siteApi<{ edits?: DetachedEdit[] }>(this.site.code, 'detached').catch(() => null),
    ]);
    if (ticket !== this.reading) return;
    if (answer instanceof Error) { this.problem = answer.message; return; }
    this.problem = '';
    this.pages = Array.isArray(answer.pages) ? answer.pages : [];
    this.images = Array.isArray(answer.images) ? answer.images : [];
    if (detached) this.detached = Array.isArray(detached.edits) ? detached.edits : [];
    kept.write(this.key, { pages: this.pages, images: this.images });
    const row = this.chosen;
    if (row) void this.readPage(row.path);
  }

  /** One page's fields; a field being typed in keeps its words. */
  private async readPage(path: string) {
    try {
      const detail = await siteApi<PageFields>(this.site.code, `page?path=${encodeURIComponent(path)}`);
      this.details = new Map(this.details).set(path, detail);
      if (this.chosen?.path === path) this.detailProblem = '';
    } catch (error) {
      if (this.chosen?.path === path) this.detailProblem = (error as Error).message;
    }
  }

  private get languages(): Language[] { return languagesOf(this.pages ?? []); }
  private get currentLanguage(): Language | null { const all = this.languages; return all.find(each => each.code === this.language) ?? all[0] ?? null; }
  private get rows(): PageRow[] { return pageRows(groupPages(this.pages ?? [], this.languages), this.currentLanguage); }
  private get chosen(): PageRow | null { return chosenRow(this.rows, this.chosenBase); }

  private choose(row: PageRow) {
    if (row.base === this.chosen?.base) return;
    this.chosenBase = row.base;
    this.detailProblem = '';
    if (!this.details.has(row.path)) void this.readPage(row.path);
  }
  private chooseLanguage(code: string) {
    this.language = code;
    const row = this.chosen;
    if (row && !this.details.has(row.path)) void this.readPage(row.path);
  }

  /** Shows the page on the site's canvas, where its words are edited. */
  private edit(row: PageRow | null) {
    if (row) this.dispatchEvent(new CustomEvent(OPEN_PAGE, { detail: { path: row.path }, bubbles: true, composed: true }));
  }

  private rowKey(event: KeyboardEvent, row: PageRow, index: number) {
    if (event.key === 'Enter') { event.preventDefault(); this.edit(row); return; }
    const next = event.key === 'ArrowDown' ? index + 1 : event.key === 'ArrowUp' ? index - 1 : null;
    const rows = this.rows;
    if (next === null || !rows[next]) return;
    event.preventDefault();
    this.choose(rows[next]!);
    this.querySelectorAll<HTMLElement>('.place-pages-list > ds-row')[next]?.focus();
  }

  /** Saves one field of the page, as the canvas saves its words; whether it was saved. */
  private async save(path: string, field: PageField, markdown: string): Promise<boolean> {
    try {
      const saved = await siteApi<Saved>(this.site.code, 'edit', { method: 'POST', json: { path, key: field.key, markdown } });
      field.markdown = saved.edit?.markdown ?? markdown;
      field.edited = true;
      if (saved.edit) field.lastEdit = { editor: saved.edit.editor, at: saved.edit.at };
      if (this.failure?.key === field.key) this.failure = null;
      this.requestUpdate();
      toast('Saved', { duration: 2000 });
      void this.read();
      return true;
    } catch (error) {
      this.failure = { key: field.key, words: `${field.kind === 'image' ? 'The share image' : field.tag === 'title' ? 'The title' : 'The description'} was not saved. ${(error as Error).message}` };
      return false;
    }
  }

  /**
   * Makes the plain editors the details stand in, after each render: one per field line, made again for a new page.
   * A field read again shows the words saved since, unless its words are being typed or saved.
   */
  protected updated() {
    for (const [host, words] of this.editors) if (!host.isConnected) { words.plain.destroy(); this.editors.delete(host); }
    for (const host of this.querySelectorAll<HTMLElement>('.place-details__words')) {
      const path = host.dataset.path!, key = host.dataset.key!;
      const field = this.details.get(path)?.fields.find(each => each.key === key);
      if (!field) continue;
      const words = this.editors.get(host);
      if (!words || words.key !== key || words.path !== path) { words?.plain.destroy(); this.editor(host, path, field); continue; }
      if (words.field === field) continue;
      words.field = field;
      const typing = words.value !== words.accepted || words.saving || host.contains(document.activeElement);
      if (!typing && field.markdown !== words.accepted) this.putBack(words);
    }
  }

  private editor(host: HTMLElement, path: string, field: PageField) {
    const words: Words = { host, path, key: field.key, field, accepted: field.markdown, value: field.markdown, saving: false, plain: null! };
    this.draw(words);
    this.editors.set(host, words);
    host.onkeydown = event => {
      if (event.isComposing) return;
      if (event.key === 'Enter') { event.preventDefault(); event.stopPropagation(); void this.settle(words); }
      else if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); this.putBack(words); }
    };
    host.addEventListener('focusout', event => { if (!host.contains(event.relatedTarget as Node | null)) void this.settle(words); });
  }

  /** Aa's plain editor in the line, with the words saved last. */
  private draw(words: Words) {
    words.host.replaceChildren();
    const id = `${words.path} ${words.key}`;
    words.accepted = words.value = words.field.markdown;
    this.typed.set(id, words.value);
    words.plain = createPlainEditor(words.host, { value: words.value, onChange: value => { words.value = value; this.typed.set(id, value); this.requestUpdate(); } });
  }

  /** The editor's words back to the words saved last. */
  private putBack(words: Words) {
    const focused = words.host.contains(document.activeElement);
    // The words typed are let go first, so the editor leaving the focus saves nothing.
    words.value = words.field.markdown;
    words.plain.destroy();
    this.draw(words);
    if (focused) words.plain.focus();
    this.requestUpdate();
  }

  /** Saves the words typed in a line, unless they are the words saved; a failure puts the saved words back. */
  private async settle(words: Words) {
    if (words.saving || words.value === words.field.markdown) return;
    if (words.value.length > MARKDOWN_LIMIT) { this.failure = { key: words.key, words: 'Too many words for one field.' }; this.putBack(words); return; }
    words.saving = true;
    const value = words.value;
    const saved = await this.save(words.path, words.field, value);
    words.saving = false;
    if (saved) { words.accepted = words.field.markdown; if (words.value === value) words.value = words.accepted; }
    else if (words.host.isConnected) this.putBack(words);
  }

  private async pick(image: string) {
    const picking = this.picking;
    if (!picking) return;
    if (image === picking.field.markdown) { this.picking = null; return; }
    this.pickProblem = '';
    if (await this.save(picking.path, picking.field, image)) this.picking = null;
    else { this.pickProblem = this.failure?.words ?? 'The share image was not changed.'; this.failure = null; }
  }

  render() {
    if (!this.pages) {
      return html`<div class="place place-pages-place">${this.problem
        ? html`<ds-message role="alert" tone="danger" literal heading="The pages could not be read" text=${this.problem}></ds-message>` : nothing}</div>`;
    }
    const languages = this.languages, language = this.currentLanguage, rows = this.rows, chosen = this.chosen;
    if (!rows.length) return html`<div class="place place-pages-place"><ds-empty literal heading="No pages yet" text="Build and deploy the site again."></ds-empty></div>`;
    const detail = chosen ? this.details.get(chosen.path) : undefined;
    return html`<div class="place place-pages">
      <div class="place-pages-side">
        <ds-text class="place-title" role="heading" aria-level="1" literal size="display" text="Pages"></ds-text>
        ${this.problem ? html`<ds-message role="alert" tone="danger" literal heading="The pages could not be read" text=${this.problem}></ds-message>` : nothing}
        ${languages.length > 1 ? html`<ds-tabs text class="place-languages" aria-label="Languages">${languages.map(each => html`<ds-button control="host" role="tab" lang=${each.code}
          ?active=${each.code === language?.code} aria-selected=${String(each.code === language?.code)} tabindex=${each.code === language?.code ? 0 : -1}
          @click=${() => this.chooseLanguage(each.code)}>${each.name}</ds-button>`)}</ds-tabs>` : nothing}
        <ds-list class="place-pages-list" aria-label="Pages">${rows.map((row, index) => html`<ds-row interactive ?current=${row.base === chosen?.base} lang=${row.language.code || nothing} label=${row.title}
          data-path=${row.path} @click=${() => this.choose(row)} @dblclick=${() => this.edit(row)} @keydown=${(event: KeyboardEvent) => this.rowKey(event, row, index)}>
          <span class="ds-row__name">${row.name}</span>
          <ds-text class="place-address" literal tone="muted" text=${row.path}></ds-text>
          ${row.edited ? html`<span class="ds-row__value place-count" title="Words edited">${row.edited}</span>` : nothing}
        </ds-row>`)}</ds-list>
        ${this.detached.length ? html`<section class="place-section" aria-label="Words no longer on the site">
          <ds-text role="heading" aria-level="2" literal strong text="Words no longer on the site"></ds-text>
          <ds-table label="Words no longer on the site" .columns=${['Page', 'Words', 'Edited']}
            .data=${this.detached.map(edit => ({ page: edit.path, words: plainText(edit.markdown), edited: `${edit.editor}, ${when(edit.at)}` }))}></ds-table>
        </section>` : nothing}
      </div>
      ${chosen ? keyed(chosen.path, this.page(chosen, detail)) : nothing}
      ${this.picker()}
    </div>`;
  }

  /** The chosen page's column and its share image's. */
  private page(row: PageRow, detail: PageFields | undefined) {
    const { title, description, image } = detail ? shareFields(detail.fields) : {};
    const typed = (field: PageField | undefined) => (field ? this.typed.get(`${row.path} ${field.key}`) ?? field.markdown : '');
    const card = shareCard(title ? plainText(typed(title)) : detail?.title ?? row.title, description ? plainText(typed(description)) : '', this.site.url);
    const group = groupPages(this.pages ?? [], this.languages).find(each => each.base === row.base);
    const edited = detail?.fields.filter(field => field.edited).length ?? 0;
    const last = detail?.fields.reduce<PageField['lastEdit']>((newest, field) => (field.lastEdit && (!newest || field.lastEdit.at > newest.at) ? field.lastEdit : newest), null) ?? row.lastEdit;
    const line = (label: string, value: unknown, end: unknown = nothing) => html`<div class="place-details__row"><ds-text class="place-details__label" literal tone="muted" text=${label}></ds-text><div class="place-details__value">${value}</div>${end === nothing ? nothing : html`<div class="place-details__end">${end}</div>`}</div>`;
    const words = (field: PageField, limit: number) => {
      const length = lengthNote(plainText(typed(field)), limit);
      return line(field.tag === 'title' ? 'Title' : 'Description', html`<div class="place-details__words" data-path=${row.path} data-key=${field.key} lang=${detail?.lang || nothing}></div>`,
        html`<ds-text class="place-details__count" literal tone=${length.over ? 'warning' : 'muted'} text=${length.words}
          title=${length.over ? `Longer than the ${limit} characters search and shares show` : `Up to ${limit} characters show in search and shares`}></ds-text>`);
    };
    return html`<section class="place-pages-page" aria-label="The chosen page">
        <div class="place-pages-head"><ds-text class="place-pages-title" literal strong text=${row.title}></ds-text><ds-button primary @click=${() => this.edit(row)}>Edit</ds-button></div>
        ${this.detailProblem && !detail ? html`<ds-message role="alert" tone="danger" literal heading="The page's details could not be read" text=${this.detailProblem}></ds-message>` : nothing}
        ${detail ? html`<div class="place-details" aria-live="polite">
          <ds-text class="place-details__heading" role="heading" aria-level="2" literal strong text="Search and sharing"></ds-text>
          ${title ? words(title, TITLE_LIMIT) : line('Title', html`<ds-text literal tone="muted" text="The build gives this page no title."></ds-text>`)}
          ${description ? words(description, DESCRIPTION_LIMIT) : line('Description', html`<ds-text literal tone="muted" text="The build gives this page no description."></ds-text>`)}
          ${this.failure && detail.fields.some(field => field.key === this.failure!.key && field.kind === 'meta') ? html`<ds-message role="alert" tone="danger" literal text=${this.failure.words}></ds-message>` : nothing}
          <ds-text class="place-details__heading" role="heading" aria-level="2" literal strong text="The page"></ds-text>
          ${line('Address', html`<ds-text class="place-address" literal text=${detail.path}></ds-text>`)}
          ${line('Languages', html`<ds-text literal text=${group ? group.pages.map(each => each.language.name).join(', ') : row.language.name}></ds-text>`)}
          ${line('Words edited', edited
            ? html`<ds-text literal text=${`${edited.toLocaleString('en-GB')} in ${row.language.name}${group && group.edited !== edited ? `, ${group.edited.toLocaleString('en-GB')} in every language` : ''}`}></ds-text>`
            : html`<ds-text literal tone="muted" text="None, the built words"></ds-text>`)}
          ${line('Last edit', last ? html`<ds-text literal text=${`${last.editor}, ${when(last.at)}`}></ds-text>` : html`<ds-text literal tone="muted" text="None"></ds-text>`)}
        </div>` : nothing}
      </section>
      <section class="place-pages-share" aria-label="Share image">${detail ? html`
        <ds-text class="place-details__heading" role="heading" aria-level="2" literal strong text="Share image"></ds-text>
        <figure class="place-share">
          ${image ? html`<img class="place-share__image" src=${siteFile(this.site.code, image.markdown)} alt="" decoding="async">` : html`<span class="place-share__image place-share__image--none"><ds-text literal tone="muted" text="No share image"></ds-text></span>`}
          <figcaption class="place-share__words">
            <ds-text class="place-share__host" literal tone="muted" size="small" text=${card.host}></ds-text>
            <ds-text class="place-share__title" literal strong text=${card.title}></ds-text>
            ${card.description ? html`<ds-text class="place-share__description" literal wrap tone="muted" size="small" text=${card.description}></ds-text>` : nothing}
          </figcaption>
        </figure>
        ${this.failure && image && this.failure.key === image.key ? html`<ds-message role="alert" tone="danger" literal text=${this.failure.words}></ds-message>` : nothing}
        ${image ? html`<ds-button secondary @click=${() => { this.pickProblem = ''; this.picking = { path: row.path, field: image }; }}>Change</ds-button>`
          : html`<ds-text literal wrap tone="muted" text="The build gives this page no share image, so there is none to change."></ds-text>`}` : nothing}
      </section>`;
  }

  /** The site's pictures in a drawer beside the page, two to a line; pressing one makes it the share image. */
  private picker() {
    const picking = this.picking;
    const choices = picking ? pickerImages(this.images, picking.field.markdown) : [];
    return html`<ds-overlay type="drawer" .nonModal=${true} .holdScroll=${false} .blockOutside=${false} .open=${!!picking}
      @ds-close-request=${(event: Event) => { if (event.target === event.currentTarget) this.picking = null; }}>
      <dialog class="place-drawer" aria-labelledby="place-picker-title">
        <div data-ds-overlay="header"><h2 data-ds-overlay="title" id="place-picker-title">Share image</h2></div>
        ${choices.length ? html`<div class="place-picker">${choices.map(each => html`<button class="place-picker__image" type="button" title=${each}
          aria-pressed=${String(each === picking?.field.markdown)} @click=${() => void this.pick(each)}><img src=${siteFile(this.site.code, each)} alt=${each} loading="lazy" decoding="async"></button>`)}</div>`
          : html`<ds-text literal wrap tone="muted" text="The build found no pictures on the site to choose from."></ds-text>`}
        ${this.pickProblem ? html`<ds-message role="alert" tone="danger" literal text=${this.pickProblem}></ds-message>` : nothing}
        <div data-ds-overlay="footer"><ds-button secondary data-ds-overlay-dismiss>Close</ds-button></div>
      </dialog>
    </ds-overlay>`;
  }
}
if (!customElements.get('consistency-place-pages')) customElements.define('consistency-place-pages', ConsistencyPlacePages);
