import { LitElement, html } from 'lit';
import { WorkspacePageEditor } from './workspace-page';
import {migrateWorkspacePage} from '../../../shared/consistency-workspace-migration';
import { DocumentState } from './document-state';
import { SITE_TEMPLATES, templateDocument } from './templates';
import '../../../DS1/2-core/ds-input';
import '../../../DS1/3-unit/ds-form';
import '../../../DS1/3-unit/ds-row';

export interface DraftSiteSummary { id: string; name: string; revision: number; updatedAt: number }
export interface DraftSite extends DraftSiteSummary { document: Record<string, unknown> }
export async function draftSiteApi<T>(workspace: string, id = '', init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/consistency/draft-sites${id ? `/${id}` : ''}`, { cache: 'no-store', ...init, headers: { 'X-C9y-Workspace': workspace, 'Content-Type': 'application/json', ...init?.headers } });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error === 'site-limit' ? 'This workspace has reached its site limit.' : body?.error === 'revision-conflict' ? 'This site changed in another tab. Your edits are still here. Save a copy to keep them.' : response.status === 401 || response.status === 403 ? 'Your session or permission changed. Sign in again in another tab, then try again.' : 'The site could not be saved. Try again.');
  return body as T;
}

/** A saved private site draft, using the production editor without the lab inspector. */
export class DraftSiteEditor extends LitElement {
  static properties = { problem: { state: true } };
  workspace = '';
  site!: DraftSiteSummary;
  declare problem: string;
  private editor?: WorkspacePageEditor;
  private state?: DocumentState<{ name: string; page: Record<string, unknown> }, { build: string; base: string; revision: number; document: { name: string; page: Record<string, unknown> } }>;
  private readonly unload = (event: BeforeUnloadEvent) => { if (this.state?.dirty || this.state?.busy) { event.preventDefault(); event.returnValue = ''; } };
  constructor() { super(); this.problem = ''; }
  createRenderRoot() { return this; }
  connectedCallback() { super.connectedCallback(); addEventListener('beforeunload', this.unload); void this.load(); }
  private async load() {
    try {
      const draft = await draftSiteApi<DraftSite>(this.workspace, this.site.id);
      if (!this.isConnected) return;
      this.state = new DocumentState({ build: 'draft', base: this.site.id, revision: draft.revision, document: { name: draft.name, page: draft.document } }, async value => {
        const saved = await draftSiteApi<DraftSite>(this.workspace, this.site.id, { method: 'PUT', body: JSON.stringify({ name: value.document.name, document: value.document.page, revision: value.revision }) });
        this.site = saved;
        this.dispatchEvent(new CustomEvent('draft-site-saved', { detail: saved, bubbles: true }));
        return { ...value, revision: saved.revision, document: { name: saved.name, page: saved.document } };
      }, () => this.requestUpdate());
      const editor=new WorkspacePageEditor();editor.loadDocument(migrateWorkspacePage(draft.document));this.editor=editor;editor.addEventListener('consistency-change',()=>this.changed());
      this.requestUpdate();
    } catch (error) { this.problem = (error as Error).message; }
  }
  private readDocument(): Record<string, unknown> {
    return this.editor?.readDocument()??this.state!.document.page;
  }
  private changed() { if (this.state) this.state.commit({ name: this.state.document.name, page: this.readDocument() }); }
  async flush() { return await this.editor?.flush() !== false && await this.state?.flush() !== false; }
  private async saveCopy() {
    if (!this.state || !this.editor) return;
    try {
      const saved = await draftSiteApi<DraftSite>(this.workspace, crypto.randomUUID(), { method: 'PUT', body: JSON.stringify({ name: `${this.state.document.name.slice(0, 75)} copy`, document: this.readDocument(), revision: 0 }) });
      this.state.discard();
      this.dispatchEvent(new CustomEvent('draft-site-copy', { detail: saved, bubbles: true }));
    } catch (error) { this.problem = (error as Error).message; }
  }
  render() {
    return html`${this.problem || this.state?.error ? html`<div class="draft-site-error">
      <ds-text role="alert" literal tone="danger" wrap .text=${this.problem || this.state!.error}></ds-text><ds-button @click=${() => this.state ? void this.flush() : void this.load()}>Try again</ds-button>${this.state ? html`<ds-button @click=${() => void this.saveCopy()}>Save a copy</ds-button>` : ''}
    </div>` : ''}${this.editor ?? html`<ds-text literal text="Opening site…"></ds-text>`}`;
  }
  disconnectedCallback() { super.disconnectedCallback(); this.state?.destroy(); removeEventListener('beforeunload', this.unload); }
}
customElements.define('consistency-draft-site', DraftSiteEditor);

/** Template selection → name and editable preview → durable site. Creation retries keep the same id. */
export class NewSite extends LitElement {
  static properties = { selected: { state: true }, search: { state: true }, name: { state: true }, busy: { state: true }, problem: { state: true } };
  workspace = '';
  declare selected: string;
  declare search: string;
  declare name: string;
  declare busy: boolean;
  declare problem: string;
  private creationId = crypto.randomUUID();
  private previews = new Map<string, WorkspacePageEditor>();
  constructor() { super(); this.selected = ''; this.search = ''; this.name = ''; this.busy = false; this.problem = ''; }
  createRenderRoot() { return this; }
  private choose(id: string) {
    this.selected = id; this.problem = ''; this.name = id === 'blank' ? 'Untitled site' : SITE_TEMPLATES.find(template => template.id === id)!.label;
    if (!this.previews.has(id)) {
      const editor=new WorkspacePageEditor();editor.loadDocument(templateDocument(id));this.previews.set(id,editor);
    }
  }
  private async create() {
    if (this.busy || !this.name.trim() || !this.selected) return;
    this.busy = true; this.problem = '';
    try {
      const editor = this.previews.get(this.selected)!;
      if (!await editor.flush()) throw new Error('The preview is still opening. Try again.');
      const saved = await draftSiteApi<DraftSite>(this.workspace, this.creationId, { method: 'PUT', body: JSON.stringify({ name: this.name.trim(), document: editor.readDocument(), revision: 0 }) });
      this.dispatchEvent(new CustomEvent('site-created', { detail: saved, bubbles: true }));
    } catch (error) { this.problem = (error as Error).message; }
    finally { this.busy = false; }
  }
  render() {
    const search = this.search.trim().toLowerCase();
    const templates = SITE_TEMPLATES.filter(template => `${template.label} ${template.description}`.toLowerCase().includes(search));
    return html`<div class="new-site">
      <ds-row auto><ds-button ?disabled=${this.busy} @click=${() => this.selected ? this.selected = '' : this.dispatchEvent(new Event('site-create-close', { bubbles: true }))}>Back</ds-button><ds-text literal size="display" role="heading" aria-level="1" text=${this.selected ? 'Add new site' : 'Choose a template'}></ds-text></ds-row>
      ${this.selected ? html`<ds-row auto class="new-site-name"><ds-input label="Site name" maxlength="80" .value=${this.name} @input=${(event: Event) => this.name = (event.target as HTMLElement & { value: string }).value}></ds-input><ds-button primary ?disabled=${this.busy || !this.name.trim()} @click=${() => void this.create()}>${this.busy ? 'Creating site…' : 'Create site'}</ds-button><ds-text literal tone="muted" wrap text="Your site starts as a private draft."></ds-text></ds-row>
      ${this.problem ? html`<ds-text role="alert" literal tone="danger" wrap .text=${this.problem}></ds-text>` : ''}
      ${this.previews.get(this.selected)}` : html`
      <ds-input label="Find a template" type="search" .value=${this.search} @input=${(event: Event) => this.search = (event.target as HTMLElement & { value: string }).value}></ds-input>
      <div class="template-grid">${templates.map(template => html`<ds-card interactive width="16" data-template=${template.id} @ds-card-press=${() => this.choose(template.id)}><span slot="label">${template.id === 'blank' ? 'Start fresh' : 'Design system 1'}</span><span slot="title">${template.label}</span><p>${template.description}</p></ds-card>`)}</div>
      ${!templates.length ? html`<ds-empty literal heading="No templates found" text="Try another word."></ds-empty>` : ''}`}
    </div>`;
  }
}
customElements.define('consistency-new-site', NewSite);
