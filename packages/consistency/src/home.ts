import { LitElement, html } from 'lit';
import '../../../DS1/4-page/ds-page';
import '../../../DS1/3-unit/ds-sidebar';
import '../../../DS1/3-unit/ds-tabs';
import '../../../DS1/3-unit/ds-list';
import '../../../DS1/3-unit/ds-row';
import '../../../DS1/2-core/ds-button';
import '../../../DS1/2-core/ds-card';
import '../../../DS1/2-core/ds-text';
import '../../../DS1/2-core/ds-avatar';
import '../../../DS1/2-core/ds-icon';
import '../../../DS1/3-unit/ds-select';
import '../../../DS1/2-core/ds-message';
import '../../../DS1/2-core/ds-empty';
import './domains';
import { ConsistencySiteEditor } from './site-editor';
import type { SiteSummary } from './site-editing';
import './home.css';

/**
 * Consistency's app, at consistency.site (and c9y.site's home, which leads there): the workspace's sites as cards,
 * each opened here in the editor (`#sites/<id>`), and Settings; pressing the workspace shows the sites again. A site once opened stays open,
 * hidden while another is shown, so going back to it is instant: no reload and no sign-in again.
 */

/** What the app shows, from the address's hash: the sites, one site in the editor, or Settings at one of its tabs. */
export type Place = { page: 'sites' } | { page: 'site'; id: string } | { page: 'settings'; tab: SettingsTab };
export type SettingsTab = 'domains' | 'account';
export function placeOf(hash: string): Place {
  if (hash === '#domains' || hash === '#settings' || hash === '#settings/domains') return { page: 'settings', tab: 'domains' };
  if (hash === '#settings/account') return { page: 'settings', tab: 'account' };
  const site = /^#sites\/([a-z0-9](?:[a-z0-9-]{0,46}[a-z0-9])?)$/.exec(hash);
  if (site) return { page: 'site', id: site[1]! };
  return { page: 'sites' };
}
export const siteHash = (id: string) => `#sites/${id}`;

// The sites as last read, so the sidebar and the cards are drawn at once and the registry only confirms them.
const SITES_KEY = 'consistency-home-sites';
function storedSites(): SiteSummary[] {
  try {
    const value = JSON.parse(localStorage.getItem(SITES_KEY) ?? '[]') as unknown;
    return Array.isArray(value) ? value.filter((site): site is SiteSummary => !!site && typeof site.id === 'string' && typeof site.name === 'string' && typeof site.url === 'string') : [];
  } catch { return []; }
}
/** A site's own address, for its card: its host without the editor's path. */
export const siteHost = (site: SiteSummary) => { try { return new URL(site.url).host; } catch { return ''; } };

// The workspace's name as last read, so the header draws it at once and the profile only confirms it.
const WORKSPACE_KEY = 'consistency-home-workspace';
function storedWorkspace(): string { try { return localStorage.getItem(WORKSPACE_KEY) ?? ''; } catch { return ''; } }
/** The avatar's letter: a name's first letter, a number's first figure after its leading zeros (0001 is 1). */
export function workspaceInitial(name: string): string { return (name.trim().replace(/^0+(?=.)/, '')[0] ?? '?').toUpperCase(); }

/** Consistency's app: the owner's sites, each in the editor, and Settings. */
export class ConsistencyHome extends LitElement {
  static properties = { error: { state: true }, workspace: { state: true }, place: { state: true }, sites: { state: true } };
  declare place: Place;
  declare error: string;
  declare workspace: string;
  declare sites: SiteSummary[];
  /** Every site opened so far, kept alive while hidden. */
  private readonly editors = new Map<string, ConsistencySiteEditor>();
  private readonly onHash = () => void this.go(placeOf(location.hash));
  constructor() { super(); this.error = ''; this.workspace = storedWorkspace(); this.sites = storedSites(); this.place = placeOf(location.hash); }
  protected createRenderRoot() { return this; }

  connectedCallback() { super.connectedCallback(); addEventListener('hashchange', this.onHash); void this.readWorkspace(); void this.readSites(); }

  /** Moves to a place, first saving a word being edited on the site being left; a failed save stays put. */
  private async go(next: Place) {
    const leaving = this.place.page === 'site' && (next.page !== 'site' || next.id !== this.place.id) ? this.editors.get(this.place.id) : undefined;
    if (leaving && !(await leaving.flush())) { history.replaceState(null, '', siteHash((this.place as { id: string }).id)); return; }
    this.place = next;
  }

  /** The workspace's sites from the registry: their names and their own addresses. */
  private async readSites() {
    const response = await fetch('/api/consistency/sites', { cache: 'no-store' }).catch(() => null);
    const body = response?.ok ? await response.json().catch(() => null) as { sites?: SiteSummary[] } | null : null;
    if (!Array.isArray(body?.sites)) return;
    this.sites = body.sites;
    try { localStorage.setItem(SITES_KEY, JSON.stringify(this.sites)); } catch { /* read again next visit */ }
  }

  /** The editor for a site, made once and kept. */
  private editorFor(site: SiteSummary): ConsistencySiteEditor {
    let editor = this.editors.get(site.id);
    if (!editor) { editor = new ConsistencySiteEditor(); editor.site = site; this.editors.set(site.id, editor); }
    return editor;
  }

  /** Shows the site being edited in the stage and hides the others there, never taking them out of the page. */
  protected updated() {
    const stage = this.querySelector<HTMLElement>('.home-stage');
    if (!stage) return;
    const current = this.place.page === 'site' ? this.sites.find(site => site.id === (this.place as { id: string }).id) : undefined;
    if (current) { const editor = this.editorFor(current); if (editor.parentElement !== stage) stage.append(editor); }
    for (const [id, editor] of this.editors) editor.hidden = id !== current?.id;
  }
  disconnectedCallback() { super.disconnectedCallback(); removeEventListener('hashchange', this.onHash); }

  /** The company name on the owner's own account (Account in the docs sets it). */
  private async readWorkspace() {
    const response = await fetch('/api/consistency/profile', { cache: 'no-store' }).catch(() => null);
    const body = response?.ok ? await response.json().catch(() => null) as { companyName?: unknown } | null : null;
    if (typeof body?.companyName !== 'string') return;
    this.workspace = body.companyName.trim();
    try { localStorage.setItem(WORKSPACE_KEY, this.workspace); } catch { /* read again next visit */ }
  }

  private async signOut() {
    this.error = '';
    const response = await fetch('/api/dashboard/session', { method: 'DELETE' }).catch(() => null);
    // consistency.site's front page is the landing; the other addresses sign in again there.
    if (response?.ok) location.href = location.hostname === 'consistency.site' ? '/' : '/app/signin';
    else this.error = 'Could not sign out. Try again.';
  }

  render() {
    const name = this.workspace || 'My company';
    const settings = this.place.page === 'settings';
    const open = this.place.page === 'site' ? (this.place as { id: string }).id : '';
    return html`<ds-page layout="sidebar" fill drawer>
      <nav slot="nav" class="home-nav" aria-label="Consistency">
        <div class="home-workspace" aria-label="Workspace">
          <ds-button id="home-workspace" class="home-workspace-name" href="#" label=${`Workspace: ${name}`}>
            <ds-avatar initial=${workspaceInitial(name)} outlined plain aria-hidden="true"></ds-avatar>${name}<ds-icon type="chevron-down"></ds-icon>
          </ds-button>
          <ds-select for="home-workspace" hover aria-label="Workspace">
            <ds-button menu-item href="#settings/domains">Settings</ds-button>
          </ds-select>
          <ds-button id="home-notifications" icon label="Notifications"><ds-icon type="notifications"></ds-icon></ds-button>
          <ds-select for="home-notifications" aria-label="Notifications" role="dialog">
            <ds-text data-ds-menu-label tone="muted" literal text="No notifications yet"></ds-text>
          </ds-select>
        </div>
      </nav>
      <div class=${open ? 'home-main home-main--site' : 'home-main'}>
        ${open ? '' : html`<ds-text class="home-title" role="heading" aria-level="1" literal size="display" text=${settings ? 'Settings' : 'Sites'}></ds-text>`}
        ${this.place.page === 'settings' ? this.settings(this.place.tab, name) : open ? (this.sites.some(site => site.id === open) ? '' : html`<ds-empty literal heading="This site is not in your workspace"></ds-empty>`) : this.siteCards()}
        <div class="home-stage" ?hidden=${!open}></div>
      </div>
    </ds-page>`;
  }

  /** The owner's sites as cards, each opening in the editor here. */
  private siteCards() {
    return html`<div class="home-grid">${this.sites.map(site => html`<ds-card href=${siteHash(site.id)} width="12" height="8"><span slot="label">${siteHost(site)}</span><span slot="title">${site.name}</span></ds-card>`)}</div>`;
  }

  /** Settings as Money draws it: text tabs under the title, each tab its own address. */
  private settings(tab: SettingsTab, name: string) {
    const tabs: { id: SettingsTab; label: string }[] = [{ id: 'domains', label: 'Domains' }, { id: 'account', label: 'Account' }];
    return html`<div class="home-settings">
      <ds-tabs text class="home-settings-tabs" aria-label="Settings">${tabs.map(item => html`<ds-button control="host" role="tab" ?active=${tab === item.id} aria-selected=${String(tab === item.id)} tabindex=${tab === item.id ? 0 : -1}
        @click=${() => { location.hash = `#settings/${item.id}`; }}>${item.label}</ds-button>`)}</ds-tabs>
      ${tab === 'domains' ? html`<consistency-domains></consistency-domains>` : html`<section class="home-account" aria-label="Account">
        <ds-list aria-label="Account"><ds-row><span class="ds-row__name">Workspace</span><span class="ds-row__value">${name}</span></ds-row></ds-list>
        <div class="home-sign-out"><ds-button secondary @click=${() => void this.signOut()}>Sign out</ds-button></div>
        ${this.error ? html`<ds-message role="alert" tone="danger" literal text=${this.error}></ds-message>` : ''}
      </section>`}
    </div>`;
  }
}
if (!customElements.get('consistency-home')) customElements.define('consistency-home', ConsistencyHome);
