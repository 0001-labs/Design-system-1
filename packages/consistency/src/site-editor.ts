/**
 * A Consistency site, opened in the editor: one of its pages, as its visitors see it, in a frame the work's
 * width, and its words edited where they stand with Aa's plain editor, each save a Team CMS edit on the live
 * site (through the owner gateway, `/api/consistency/sites/<id>/…`).
 *
 * The frame is the gateway's `document` route on this origin, sandboxed with `allow-same-origin` and nothing
 * else, by the frame and by the page's own policy: the site's scripts never run, and its forms never send, while
 * the editor reaches into the document to make a field editable (the platform's `canvas.ts` says why). A press
 * on a word edits it; a link to one of the site's pages is followed and the editor follows it, saving a word
 * being edited first; Mod+press follows a link that is a word; nothing else happens.
 *
 * Over the word stands Design system 1's context bar with the field's name, Save and Cancel. Escape cancels,
 * Mod+Enter saves, and so does Enter in one line of words. Other copies of the same words show them as typed,
 * drawn by Team CMS's own Markdown, and a save puts the HTML the site rendered in every copy.
 *
 * Only words: the page's layout and spacing cannot be published to a site yet, so the composition tools are not
 * here at all, and the page's title, description and share image stay in each site's own editor.
 */
import { LitElement, html, nothing } from 'lit';
import '../../../DS1/1-root/context.css';
import '../../../DS1/1-root/row.css';
import '../../../DS1/2-core/ds-button';
import '../../../DS1/2-core/ds-empty';
import '../../../DS1/2-core/ds-message';
import '../../../DS1/3-unit/ds-select';
import { toast } from '../../../DS1/0-face/feedback';
import { createPlainEditor } from '../../../website/src/vendor/aa/aa';
import { MARKDOWN_LIMIT, renderMarkdown } from './vendor/cms/markdown';
import { placeBar } from './vendor/cms/placing';
import { editKey, failureWords, fieldName, firstPage, isPlainField, isWordsField, pageGroups, pressAction, siteAddress, type PageDetail, type SiteField, type SitePage, type SiteSummary } from './site-editing';
import './site-editor.css';

/** The outlines the editor draws in the framed page: the words that can be edited, and the ones being edited. */
const FRAME_STYLE = `
[data-cms-words] { cursor: text; outline: 1px solid transparent; outline-offset: 2px; border-radius: 2px; }
[data-cms-words]:hover { outline-color: var(--ds-accent-color, Highlight); }
[data-cms-words][data-cms-open] { outline: 2px solid var(--ds-focus-ring, Highlight); }
[data-cms-words][data-cms-open] > .aa-block { outline: none; white-space: pre-wrap; }
a, button, [role='button'] { cursor: default; }
`;

class ApiError extends Error { constructor(readonly status: number, readonly code?: string) { super(failureWords(status, code)); } }

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { credentials: 'same-origin', cache: 'no-store', ...init });
  let body: unknown = null;
  try { body = await response.json(); } catch { /* the status says enough */ }
  if (!response.ok) throw new ApiError(response.status, body && typeof body === 'object' && 'error' in body && typeof body.error === 'string' ? body.error : undefined);
  return body as T;
}

/** A press's place as a caret in a document, where the browser can say. */
function caretAt(doc: Document, x: number, y: number): Range | null {
  const position = (doc as Document & { caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null }).caretPositionFromPoint?.(x, y);
  if (position) { const range = doc.createRange(); range.setStart(position.offsetNode, position.offset); return range; }
  return doc.caretRangeFromPoint?.(x, y) ?? null;
}

const putBack = (element: Element, name: string, value: string | null) => { if (value === null) element.removeAttribute(name); else element.setAttribute(name, value); };

interface Editing {
  field: SiteField; host: HTMLElement; copies: HTMLElement[]; before: string[];
  marks: { classes: string[]; hadClass: boolean; role: string | null; multiline: string | null };
  plain: ReturnType<typeof createPlainEditor>; markdown: string; bar: HTMLElement; save: HTMLButtonElement; busy: boolean; stop: () => void;
}

export class ConsistencySiteEditor extends LitElement {
  static properties = { pages: { state: true }, path: { state: true }, problem: { state: true }, unsupported: { state: true } };
  declare pages: SitePage[] | null;
  declare path: string | null;
  declare problem: string;
  declare unsupported: boolean;
  site!: SiteSummary;
  private fields = new Map<string, SiteField>();
  private editing: Editing | null = null;
  private opening = 0;
  private readonly frame = Object.assign(document.createElement('iframe'), { className: 'consistency-site-frame' });
  private detach: (() => void) | null = null;

  constructor() {
    super();
    this.pages = null; this.path = null; this.problem = ''; this.unsupported = false;
    // Scripts never run in the page and its forms never send: only the editor reaches into it.
    this.frame.setAttribute('sandbox', 'allow-same-origin');
    this.frame.addEventListener('load', () => this.wire());
  }
  createRenderRoot() { return this; }

  connectedCallback() {
    super.connectedCallback();
    if (!this.pages && !this.unsupported) void this.load();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.finish(null);
    this.detach?.();
  }

  private get origin() { return new URL(this.site.url).origin; }

  private async load() {
    try {
      const { pages } = await request<{ pages: SitePage[] }>(siteAddress.pages(this.site.code));
      this.pages = pages;
      const first = firstPage(pages);
      if (first) await this.open(first);
    } catch (error) {
      if (error instanceof ApiError && error.code === 'not-editable') this.unsupported = true;
      else this.problem = (error as Error).message;
    }
  }

  /** Opens one of the site's pages, settling the words being edited first. */
  async open(path: string): Promise<boolean> {
    if (!(await this.flush())) return false;
    const ticket = ++this.opening;
    try {
      const page = await request<PageDetail>(siteAddress.page(this.site.code, path));
      if (ticket !== this.opening) return false;
      this.fields = new Map(page.fields.map(field => [field.key, field]));
      this.path = page.path;
      this.problem = '';
      this.frame.title = `${page.title || page.path}, to edit`;
      this.frame.src = siteAddress.document(this.site.code, page.path);
      return true;
    } catch (error) {
      if (ticket === this.opening) this.problem = (error as Error).message;
      return false;
    }
  }

  /** Settles the words being edited: saved, or unchanged. False while they could not be saved. */
  flush(): Promise<boolean> { return this.editing ? this.commit() : Promise.resolve(true); }

  /** The framed page, made ready to edit once it has loaded. */
  private wire() {
    this.detach?.();
    this.detach = null;
    const doc = this.frame.contentDocument;
    // A page that left for the site's own address cannot be edited from here: back to the page being edited.
    if (!doc || !this.path || !doc.location.pathname.endsWith('/document')) { if (this.path) this.frame.src = siteAddress.document(this.site.code, this.path); return; }
    const dark = document.documentElement.classList.contains('dark-theme') || (!document.documentElement.classList.contains('light-theme') && matchMedia('(prefers-color-scheme: dark)').matches);
    // The page's own head script set its theme before; the editor sets it now, as the editor's.
    doc.documentElement.classList.add(dark ? 'dark-theme' : 'light-theme');
    doc.documentElement.dataset.theme = dark ? 'dark' : 'light';
    doc.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    const style = doc.createElement('style');
    style.textContent = FRAME_STYLE;
    doc.head.append(style);
    for (const element of doc.querySelectorAll<HTMLElement>('[data-cms]')) {
      const field = this.fields.get(element.getAttribute('data-cms') ?? '');
      if (field && isWordsField(field)) element.setAttribute('data-cms-words', '');
    }
    const press = (event: MouseEvent) => this.press(event, doc);
    const key = (event: KeyboardEvent) => this.key(event);
    const hold = (event: Event) => event.preventDefault();
    doc.addEventListener('click', press, true);
    doc.addEventListener('auxclick', hold, true);
    doc.addEventListener('submit', hold, true);
    doc.addEventListener('keydown', key, true);
    this.detach = () => {
      doc.removeEventListener('click', press, true); doc.removeEventListener('auxclick', hold, true);
      doc.removeEventListener('submit', hold, true); doc.removeEventListener('keydown', key, true);
    };
  }

  private press(event: MouseEvent, doc: Document) {
    const target = event.target instanceof doc.defaultView!.Element ? event.target : (event.target as Node).parentElement;
    if (!target) { event.preventDefault(); return; }
    const words = target.closest<HTMLElement>('[data-cms-words]');
    const link = target.closest<HTMLAnchorElement>('a[href]');
    const action = pressAction({ inEditing: Boolean(this.editing?.host.contains(target)), field: Boolean(words), link: link ? { href: link.href } : null, mod: event.metaKey || event.ctrlKey }, { origin: this.origin, paths: (this.pages ?? []).map(page => page.path) });
    // The frame never goes anywhere on its own; the editor decides. A question's own disclosure still opens, so its answer can be edited.
    if (!(action.do === 'stop' && !link && target.closest('summary'))) event.preventDefault();
    if (action.do === 'go') void this.go(action.path);
    else if (action.do === 'edit' && words) void this.edit(words, { x: event.clientX, y: event.clientY });
  }

  private key(event: KeyboardEvent) {
    const state = this.editing;
    if (!state) return;
    const action = editKey(event, isPlainField(state.field));
    if (!action) return;
    event.preventDefault();
    event.stopPropagation();
    if (action === 'cancel') this.finish(null);
    else void this.commit();
  }

  private async go(path: string) {
    const select = this.querySelector('select');
    if (await this.open(path) && select) select.value = path;
  }

  /** Makes a field's element editable where it stands, the caret where it was pressed; the words being edited are saved first. */
  private async edit(host: HTMLElement, point: { x: number; y: number }) {
    const field = this.fields.get(host.getAttribute('data-cms') ?? '');
    if (!field || !isWordsField(field) || this.editing?.host === host) return;
    if (this.editing && !(await this.commit())) return;
    const doc = host.ownerDocument, view = doc.defaultView;
    if (!view || !host.isConnected) return;
    const copies = [...doc.querySelectorAll<HTMLElement>(`[data-cms="${CSS.escape(field.key)}"]`)];
    const before = copies.map(element => element.innerHTML);
    const marks = { classes: ['aa', 'aa-plain'].filter(name => host.classList.contains(name)), hadClass: host.hasAttribute('class'), role: host.getAttribute('role'), multiline: host.getAttribute('aria-multiline') };
    for (const element of copies) element.setAttribute('data-cms-open', '');

    const save = Object.assign(document.createElement('button'), { type: 'button', textContent: 'Save', disabled: true, onclick: () => void this.commit() });
    const cancel = Object.assign(document.createElement('button'), { type: 'button', textContent: 'Cancel', onclick: () => this.finish(null) });
    const label = Object.assign(document.createElement('span'), { className: 'ds-context__label', textContent: fieldName(field) });
    const bar = document.createElement('div');
    bar.className = 'ds-context ds-context--bar consistency-site-bar-over';
    bar.setAttribute('role', 'toolbar');
    bar.setAttribute('aria-label', `${fieldName(field)}, being edited`);
    // The bar never takes the focus from the words.
    bar.addEventListener('mousedown', event => event.preventDefault());
    bar.addEventListener('keydown', event => { if (event.key === 'Escape') this.finish(null); });
    bar.append(label, save, cancel);
    document.body.append(bar);

    const gap = this.square() / 2;
    const place = () => {
      const box = this.frame.getBoundingClientRect();
      const spot = placeBar({ left: box.left + this.frame.clientLeft, top: box.top + this.frame.clientTop, width: this.frame.clientWidth, height: this.frame.clientHeight }, host.getBoundingClientRect(), { width: bar.offsetWidth, height: bar.offsetHeight }, gap);
      bar.style.visibility = spot ? '' : 'hidden';
      if (spot) Object.assign(bar.style, { left: `${spot.left}px`, top: `${spot.top}px` });
    };
    const typed = (markdown: string) => {
      const state = this.editing;
      if (!state || state.host !== host) return;
      state.markdown = markdown;
      save.disabled = markdown === field.markdown || markdown.length > MARKDOWN_LIMIT;
      const drawn = renderMarkdown(markdown);
      for (const element of copies) if (element !== host) element.innerHTML = drawn;
      place();
    };
    const plain = createPlainEditor(host, { value: field.markdown, onChange: typed });
    const block = host.firstElementChild instanceof view.HTMLElement ? host.firstElementChild : null;
    // Words that run in a line stay in it.
    if (block && view.getComputedStyle(host).display === 'inline') block.style.display = 'inline';
    const watch = new ResizeObserver(place);
    watch.observe(host);
    doc.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    const stop = () => { watch.disconnect(); doc.removeEventListener('scroll', place, true); window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); };
    this.editing = { field, host, copies, before, marks, plain, markdown: field.markdown, bar, save, busy: false, stop };
    place();
    plain.focus();
    const selection = view.getSelection();
    if (block && selection) {
      const pressed = caretAt(doc, point.x, point.y);
      const range = pressed && block.contains(pressed.startContainer) ? pressed : doc.createRange();
      if (range !== pressed) { range.selectNodeContents(block); range.collapse(false); }
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  /** Ends the editing: the editor off the element, and every copy with the site's HTML, or as it was. */
  private finish(drawn: string | null) {
    const state = this.editing;
    if (!state) return;
    this.editing = null;
    state.stop();
    state.bar.remove();
    state.plain.destroy();
    const { host, marks } = state;
    for (const name of ['aa', 'aa-plain']) if (!marks.classes.includes(name)) host.classList.remove(name);
    if (!marks.hadClass && !host.classList.length) host.removeAttribute('class');
    putBack(host, 'role', marks.role);
    putBack(host, 'aria-multiline', marks.multiline);
    state.copies.forEach((element, index) => { element.removeAttribute('data-cms-open'); element.innerHTML = drawn ?? state.before[index] ?? element.innerHTML; });
  }

  /** Saves the words being edited as a Team CMS edit; whether the editing has ended, saved or unchanged. */
  private async commit(): Promise<boolean> {
    const state = this.editing;
    if (!state) return true;
    if (state.busy) return false;
    const { field, markdown } = state;
    if (markdown === field.markdown) { this.finish(null); return true; }
    if (markdown.length > MARKDOWN_LIMIT) { toast.error(failureWords(413)); return false; }
    state.busy = true; state.save.disabled = true;
    try {
      const answer = await request<{ html: string; edit: { markdown: string } }>(siteAddress.edit(this.site.code), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: this.path, key: field.key, markdown }) });
      field.markdown = answer.edit?.markdown ?? markdown;
      field.edited = true;
      if (this.editing === state) this.finish(answer.html);
      toast('Saved', { duration: 2000 });
      return true;
    } catch (error) {
      toast.error((error as Error).message);
      state.busy = false; state.save.disabled = false;
      if (this.editing === state) state.plain.focus();
      return false;
    }
  }

  /** One square of Design system 1 in this window, in pixels. */
  private square(): number {
    const probe = document.createElement('span');
    probe.style.cssText = 'position:absolute;visibility:hidden;width:var(--ds-unit)';
    document.body.append(probe);
    const width = probe.getBoundingClientRect().width;
    probe.remove();
    return width || 20;
  }

  private choose = (event: Event) => {
    const select = event.target as HTMLSelectElement;
    const previous = this.path;
    void this.open(select.value).then(opened => { if (!opened && previous) select.value = previous; });
  };

  render() {
    if (this.unsupported) return html`<ds-empty literal heading=${this.site.name} text="This site keeps its words in its own editor."><ds-button slot="actions" href=${this.site.url} blank secondary>Open its editor</ds-button></ds-empty>`;
    const live = this.path ? new URL(this.path, this.origin).href : this.site.url;
    return html`
      <div class="consistency-site-bar">
        ${this.pages?.length ? html`<ds-select><select aria-label="Page" .value=${this.path ?? ''} @change=${this.choose}>
          ${pageGroups(this.pages).map(group => html`<optgroup label=${group.lang}>${group.pages.map(page => html`<option value=${page.path} ?selected=${page.path === this.path} data-details=${page.path}>${page.title || page.path}</option>`)}</optgroup>`)}
        </select></ds-select>` : nothing}
        <ds-button href=${live} blank secondary>Open the page</ds-button>
        <span class="ds-text ds-text--muted">Words save to the live site. Layout can’t be published yet.</span>
      </div>
      ${this.problem ? html`<ds-message tone="danger" literal text=${this.problem}></ds-message>` : nothing}
      ${this.pages && !this.pages.length ? html`<ds-empty literal heading="No pages" text="This site has no pages with words to edit yet."></ds-empty>` : nothing}
      <div class="consistency-site-stage" ?hidden=${!this.path}>${this.frame}</div>`;
  }
}
customElements.define('consistency-site-editor', ConsistencySiteEditor);
declare global { interface HTMLElementTagNameMap { 'consistency-site-editor': ConsistencySiteEditor } }
