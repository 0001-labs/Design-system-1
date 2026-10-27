/**
 * The site's authored page stays in a script-free, same-origin sandbox. Aa edits its words in place;
 * the composition controller supplies direct spacing, sizing, ordering and bounded content insertion.
 * Both save automatically and drain pending edits before navigation. Layout writes carry the published
 * build, source fingerprint and revision, so a stale editor cannot overwrite a newer page.
 */
import { LitElement, html, nothing } from 'lit';
import '../../../DS1/1-root/context.css';
import '../../../DS1/1-root/row.css';
import '../../../DS1/2-core/ds-button';
import '../../../DS1/2-core/ds-empty';
import '../../../DS1/2-core/ds-message';
import '../../../DS1/3-unit/ds-select';
import { createPlainEditor } from '../../../website/src/vendor/aa/aa';
import { MARKDOWN_LIMIT, renderMarkdown } from './vendor/site-engine/markdown';
import { placeBar } from './vendor/site-engine/placing';
import { editKey, failureWords, fieldName, firstPage, isPlainField, isWordsField, pageGroups, pressAction, siteAddress, siteOrigins, type PageDetail, type SiteField, type SitePage, type SiteSummary } from './site-editing';
import './site-editor.css';
import { SiteCompositionController } from './site-composition';
import type { SiteCompositionSnapshot } from './site-composition-state';
import { NativeSiteController, type NativePageSnapshot } from './native-site';

/** The outlines the editor draws in the framed page: the words that can be edited, and the ones being edited. */
const FRAME_STYLE = `
[data-cms-words] { cursor: text; outline: 1px solid transparent; outline-offset: 2px; border-radius: 2px; }
[data-cms-words]:hover { background: color-mix(in srgb, var(--ds-text-color, #171717) 6%, transparent); }
[data-cms-words][data-cms-open] { outline: none; }
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

/** An answer the platform may not have: a 404 or a site that is not editable here is null; any other failure is still thrown. */
function optional<T>(answer: PromiseSettledResult<T>): T | null {
  if (answer.status === 'fulfilled') return answer.value;
  if (answer.reason instanceof ApiError && (answer.reason.status === 404 || answer.reason.code === 'not-editable')) return null;
  throw answer.reason;
}
/** An answer the page cannot open without: its failure is thrown. */
function required<T>(answer: PromiseSettledResult<T>): T { if (answer.status === 'fulfilled') return answer.value; throw answer.reason; }

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
  plain: ReturnType<typeof createPlainEditor>; markdown: string; bar: HTMLElement; status: HTMLElement; retry: HTMLButtonElement; saving: Promise<boolean> | null; cancelRequested?: boolean; timer?: ReturnType<typeof setTimeout>; stop: () => void;
}

export class ConsistencySiteEditor extends LitElement {
  static properties = { pages: { state: true }, path: { state: true }, problem: { state: true }, notice: { state: true }, unsupported: { state: true } };
  declare pages: SitePage[] | null;
  declare path: string | null;
  declare problem: string;
  declare notice: string;
  declare unsupported: boolean;
  site!: SiteSummary;
  /** Whether the bar (the page picker, Open the page and the note) stands over the site; Consistency's app has none. */
  picker = true;
  private fields = new Map<string, SiteField>();
  private composition: SiteCompositionController | NativeSiteController | null = null;
  private compositionSnapshot: SiteCompositionSnapshot | null = null;
  private nativeSnapshot: NativePageSnapshot | null = null;
  private images: string[] = [];
  private readonly beforeUnload = (event: BeforeUnloadEvent) => { if (this.composition?.pending || this.editing && (this.editing.saving || this.editing.markdown !== this.editing.field.markdown)) { event.preventDefault(); event.returnValue = ''; } };
  private editing: Editing | null = null;
  private opening = 0;
  /** What the site's pages answered last: native, or the site engine's HTML. Set once per editor, since a site is. */
  private kind: 'native' | 'html' | null = null;
  private compositionRetry = 0;
  private readonly frame = Object.assign(document.createElement('iframe'), { className: 'consistency-site-frame' });
  private detach: (() => void) | null = null;

  constructor() {
    super();
    this.pages = null; this.path = null; this.problem = ''; this.notice = ''; this.unsupported = false;
    // Scripts never run in the page and its forms never send: only the editor reaches into it.
    this.frame.setAttribute('sandbox', 'allow-same-origin');
    this.frame.addEventListener('load', () => this.wire());
  }
  createRenderRoot() { return this; }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('beforeunload', this.beforeUnload);
    if (!this.pages && !this.unsupported) void this.load();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.finish(null);
    this.composition?.destroy(); this.composition = null;
    window.removeEventListener('beforeunload', this.beforeUnload);
    this.detach?.();
  }
  /** Tells what lists the site's pages beside the editor that they, or the page open, have changed. */
  protected updated(changed: Map<string, unknown>) {
    if (changed.has('pages') || changed.has('path')) this.dispatchEvent(new Event('consistency-site-change', { bubbles: true }));
  }

  private get origin() { return new URL(this.site.url).origin; }
  /** Every address the site's links may stand on: the platform writes them absolute on its first platform host, whichever the owner opens it by. */
  private get origins() { return siteOrigins(this.site); }

  private async load() {
    try {
      const { pages, images } = await request<{ pages: SitePage[]; images?: string[] }>(siteAddress.pages(this.site.code));
      this.pages = pages; this.images = images ?? [];
      const first = firstPage(pages);
      if (first) await this.open(first);
    } catch (error) {
      if (error instanceof ApiError && error.code === 'not-editable') this.unsupported = true;
      else this.problem = (error as Error).message;
    }
  }

  /** Opens one of the site's pages, settling the words being edited first. */
  async open(path: string, retry = false): Promise<boolean> {
    if (!retry) this.compositionRetry = 0;
    if (!(await this.flush())) return false;
    const ticket = ++this.opening;
    try {
      // Each is a trip to the platform, so they are asked together: the native page, which needs no HTML manifest or
      // field discovery, and the page and its composition, which a native page has none of. A site that answered
      // native is asked for the native page alone, and for the other two only when that answer is not a native page.
      const probe = request<NativePageSnapshot | { kind: 'html'; path: string }>(siteAddress.nativePage(this.site.code, path));
      const source = () => [request<PageDetail>(siteAddress.page(this.site.code, path)), request<SiteCompositionSnapshot>(siteAddress.composition(this.site.code, path))] as const;
      let nativeAnswer: PromiseSettledResult<NativePageSnapshot | { kind: 'html'; path: string }>;
      let sourceAnswers: readonly [PromiseSettledResult<PageDetail>, PromiseSettledResult<SiteCompositionSnapshot>] | null = null;
      if (this.kind === 'native') [nativeAnswer] = await Promise.allSettled([probe]);
      else { const answers = await Promise.allSettled([probe, ...source()]); nativeAnswer = answers[0]; sourceAnswers = [answers[1], answers[2]]; }
      if (ticket !== this.opening) return false;
      const native = optional(nativeAnswer);
      if (native?.kind === 'native') {
        this.kind = 'native';
        if (!(await this.flush()) || ticket !== this.opening) return false;
        this.composition?.destroy(); this.composition = null;
        this.compositionSnapshot = null; this.nativeSnapshot = native;
        this.notice = ''; this.fields.clear(); this.path = native.path; this.problem = '';
        this.frame.title = `${native.document.title || native.path}, to edit`;
        this.frame.src = siteAddress.document(this.site.code,native.path);
        return true;
      }
      this.kind = 'html';
      if (!sourceAnswers) { sourceAnswers = await Promise.allSettled(source()); if (ticket !== this.opening) return false; }
      const page = required(sourceAnswers[0]);
      const composition = optional(sourceAnswers[1]);
      if (!(await this.flush()) || ticket !== this.opening) return false;
      this.composition?.destroy(); this.composition = null; this.compositionSnapshot = composition; this.nativeSnapshot = null;
      this.notice = composition?.stale ? 'The page structure changed. Earlier layout edits are kept in history.' : '';
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
  async flush(): Promise<boolean> { if (this.editing && !(await this.commit(true))) return false; return this.composition ? this.composition.flush() : true; }

  /** The framed page, made ready to edit once it has loaded. */
  private wire() {
    this.detach?.();
    this.detach = null;
    const doc = this.frame.contentDocument;
    // A page that left for the site's own address cannot be edited from here: back to the page being edited.
    if (!doc || !this.path || !doc.location.pathname.endsWith('/document')) { if (this.path) this.frame.src = siteAddress.document(this.site.code, this.path); return; }
    const snapshot = this.nativeSnapshot ?? this.compositionSnapshot;
    const base = doc.documentElement.getAttribute(this.nativeSnapshot ? 'data-c9y-native-base' : 'data-c9y-composition-base');
    if (base && snapshot && base !== snapshot.base) {
      this.frame.hidden = true;
      if (this.compositionRetry++ < 1) void this.open(this.path, true);
      else this.problem = 'This page is being published. Open it again in a moment.';
      return;
    }
    this.frame.hidden = false;
    if (this.nativeSnapshot) {
      const path = this.path;
      this.composition?.destroy();
      this.composition = new NativeSiteController(this.frame,this.nativeSnapshot,payload => request<NativePageSnapshot>(siteAddress.nativePage(this.site.code,path), {method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}),()=>void this.open(path));
      const press = (event: MouseEvent) => {
        const target = event.target as Element;
        if (event.defaultPrevented || target.closest('aa-editor,[contenteditable],[data-editor-chrome]')) return;
        const link = target.closest<HTMLAnchorElement>('a[href]');
        if (!link && target.closest('summary')) return;
        event.preventDefault();
        const action = pressAction({inEditing:false,field:false,link:link?{href:new URL(link.getAttribute('href') ?? '',this.origin).href}:null,mod:event.metaKey||event.ctrlKey},{origins:this.origins,paths:(this.pages??[]).map(page=>page.path)});
        if (action.do === 'go') void this.go(action.path);
      };
      const hold = (event: Event) => event.preventDefault();
      doc.addEventListener('click',press,true);doc.addEventListener('auxclick',hold,true);doc.addEventListener('submit',hold,true);
      this.detach=()=>{doc.removeEventListener('click',press,true);doc.removeEventListener('auxclick',hold,true);doc.removeEventListener('submit',hold,true);};
      return;
    }
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
    if (this.compositionSnapshot) {
      const path = this.path;
      this.composition?.destroy();
      this.composition = new SiteCompositionController(this.frame, this.compositionSnapshot, payload => request<SiteCompositionSnapshot>(siteAddress.composition(this.site.code, path), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }), () => this.editing ? this.commit(true) : Promise.resolve(true), this.compositionSnapshot.images ?? this.images, () => void this.open(path));
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
    if (target.closest('[data-c9y-node^="new_"]') && target.closest('[contenteditable]')) return;
    const words = target.closest<HTMLElement>('[data-cms-words]');
    const link = target.closest<HTMLAnchorElement>('a[href]');
    const action = pressAction({ inEditing: Boolean(this.editing?.host.contains(target)), field: Boolean(words), link: link ? { href: link.href } : null, mod: event.metaKey || event.ctrlKey }, { origins: this.origins, paths: (this.pages ?? []).map(page => page.path) });
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
    if (action === 'cancel') void this.cancelEdit();
    else void this.commit(true);
  }

  private async go(path: string) {
    const select = this.querySelector('select');
    if (await this.open(path) && select) select.value = path;
  }

  /** Makes a field's element editable where it stands, the caret where it was pressed; the words being edited are saved first. */
  private async edit(host: HTMLElement, point: { x: number; y: number }) {
    const field = this.fields.get(host.getAttribute('data-cms') ?? '');
    if (!field || !isWordsField(field) || this.editing?.host === host) return;
    if (this.editing && !(await this.commit(true))) return;
    const doc = host.ownerDocument, view = doc.defaultView;
    if (!view || !host.isConnected) return;
    const copies = [...doc.querySelectorAll<HTMLElement>(`[data-cms="${CSS.escape(field.key)}"]`)];
    const before = copies.map(element => element.innerHTML);
    const marks = { classes: ['aa', 'aa-plain'].filter(name => host.classList.contains(name)), hadClass: host.hasAttribute('class'), role: host.getAttribute('role'), multiline: host.getAttribute('aria-multiline') };
    for (const element of copies) element.setAttribute('data-cms-open', '');

    const status = Object.assign(document.createElement('span'), { className: 'consistency-site-save-status', textContent: '' });
    status.setAttribute('role', 'status');
    const retry = Object.assign(document.createElement('button'), { type: 'button', textContent: 'Try again', hidden: true, onclick: () => void this.commit() });
    const label = Object.assign(document.createElement('span'), { className: 'ds-context__label', textContent: fieldName(field) });
    const bar = document.createElement('div');
    bar.className = 'ds-context ds-context--bar consistency-site-bar-over';
    bar.setAttribute('role', 'toolbar');
    bar.setAttribute('aria-label', `${fieldName(field)}, being edited`);
    // The bar never takes the focus from the words.
    bar.addEventListener('mousedown', event => event.preventDefault());
    bar.addEventListener('keydown', event => { if (event.key === 'Escape') void this.cancelEdit(); });
    bar.append(label, status, retry);
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
      clearTimeout(state.timer);
      status.textContent = markdown.length > MARKDOWN_LIMIT ? failureWords(413) : markdown === field.markdown ? '' : 'Unsaved';
      retry.hidden = true;
      if (markdown !== field.markdown && markdown.length <= MARKDOWN_LIMIT) state.timer = setTimeout(() => void this.commit(), 700);
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
    this.editing = { field, host, copies, before, marks, plain, markdown: field.markdown, bar, status, retry, saving: null, stop };
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

  private async cancelEdit() {
    const state = this.editing;
    if (!state) return;
    clearTimeout(state.timer);
    state.cancelRequested = true;
    if (state.saving) await state.saving;
    if (this.editing === state) this.finish(null);
  }

  /** Ends the editing: the editor off the element, and every copy with the site's HTML, or as it was. */
  private finish(drawn: string | null) {
    const state = this.editing;
    if (!state) return;
    this.editing = null;
    clearTimeout(state.timer);
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

  /** Serializes automatic edits, retaining newer typing and failed drafts. Navigation drains the latest value. */
  private textDrain: Promise<boolean> | null = null;
  private async commit(finish = false): Promise<boolean> {
    const state = this.editing;
    if (!state) return true;
    if (!this.textDrain) this.textDrain = this.saveWords().finally(() => { this.textDrain = null; });
    const saved = await this.textDrain;
    if (saved && finish && this.editing === state) this.finish(null);
    return saved;
  }
  private async saveWords(): Promise<boolean> {
    const state = this.editing;
    if (!state) return true;
    clearTimeout(state.timer);
    if (state.saving && !(await state.saving)) return false;
    if (this.editing !== state) return true;
    while (state.markdown !== state.field.markdown && !state.cancelRequested) {
      const markdown = state.markdown;
      if (markdown.length > MARKDOWN_LIMIT) { state.status.textContent = failureWords(413); return false; }
      state.status.textContent = 'Saving…'; state.retry.hidden = true;
      state.saving = (async () => {
        try {
          const answer = await request<{ html: string; edit: { markdown: string } }>(siteAddress.edit(this.site.code), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: this.path, key: state.field.key, markdown }) });
          state.field.markdown = answer.edit?.markdown ?? markdown;
          state.field.edited = true;
          // Escape now restores the last accepted value, including while later typing is still unsaved.
          state.before = state.before.map(() => answer.html);
          if (this.editing === state) {
            state.status.textContent = state.markdown === state.field.markdown ? 'Saved' : 'Unsaved';
            for (const element of state.copies) if (element !== state.host) element.innerHTML = renderMarkdown(state.markdown);
          }
          return true;
        } catch (error) {
          clearTimeout(state.timer);
          state.status.textContent = (error as Error).message;
          state.retry.hidden = false;
          return false;
        } finally { state.saving = null; }
      })();
      if (!(await state.saving)) return false;
      if (this.editing !== state) return true;
    }
    return true;
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
    // In Consistency's app the site stands alone: its pages are reached by its own links, with no bar over it.
    return html`
      ${this.picker ? html`<div class="consistency-site-bar">
        ${this.pages?.length ? html`<ds-select><select aria-label="Page" .value=${this.path ?? ''} @change=${this.choose}>
          ${pageGroups(this.pages).map(group => html`<optgroup label=${group.lang}>${group.pages.map(page => html`<option value=${page.path} ?selected=${page.path === this.path} data-details=${page.path}>${page.title || page.path}</option>`)}</optgroup>`)}
        </select></ds-select>` : nothing}
        <ds-button href=${live} blank secondary>Open the page</ds-button>
        <span class="ds-text ds-text--muted">Changes save to the site.</span>
      </div>` : nothing}
      ${this.notice ? html`<ds-message literal text=${this.notice}></ds-message>` : nothing}
      ${this.problem ? html`<ds-message tone="danger" literal text=${this.problem}></ds-message>` : nothing}
      ${this.pages && !this.pages.length ? html`<ds-empty literal heading="No pages" text="This site has no pages with words to edit yet."></ds-empty>` : nothing}
      <div class="consistency-site-stage" ?hidden=${!this.path}>${this.frame}</div>`;
  }
}
customElements.define('consistency-site-editor', ConsistencySiteEditor);
declare global { interface HTMLElementTagNameMap { 'consistency-site-editor': ConsistencySiteEditor } }
