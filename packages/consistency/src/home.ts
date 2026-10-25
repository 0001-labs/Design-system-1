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
import './domains';
import './home.css';

/** The owner's sites. Each opens in its editor, `/team/`: the site beside its sidebar, ready to edit. */
export const SITES = [
  { id: 'flavo', name: 'Flavo', url: 'https://flavo.c9y.site/team/' },
  { id: 'cph-raft', name: 'CPH Raft', url: 'https://cphraft.c9y.site/team/' },
  { id: 'soendergaarden', name: 'Søndergården', url: 'https://soendergaarden.c9y.site/team/' },
] as const;

/** What the home shows, from the address's hash: the sites, or Settings at one of its tabs (`#settings/domains`, `#settings/account`). */
export type Place = { page: 'sites' } | { page: 'settings'; tab: SettingsTab };
export type SettingsTab = 'domains' | 'account';
export function placeOf(hash: string): Place {
  if (hash === '#domains' || hash === '#settings' || hash === '#settings/domains') return { page: 'settings', tab: 'domains' };
  if (hash === '#settings/account') return { page: 'settings', tab: 'account' };
  return { page: 'sites' };
}

// The workspace's name as last read, so the header draws it at once and the profile only confirms it.
const WORKSPACE_KEY = 'consistency-home-workspace';
function storedWorkspace(): string { try { return localStorage.getItem(WORKSPACE_KEY) ?? ''; } catch { return ''; } }
/** The avatar's letter: a name's first letter, a number's first figure after its leading zeros (0001 is 1). */
export function workspaceInitial(name: string): string { return (name.trim().replace(/^0+(?=.)/, '')[0] ?? '?').toUpperCase(); }

/** The home at c9y.site: the owner's sites, and Settings. */
export class ConsistencyHome extends LitElement {
  static properties = { error: { state: true }, workspace: { state: true }, place: { state: true } };
  declare place: Place;
  private readonly onHash = () => { this.place = placeOf(location.hash); };
  declare error: string;
  declare workspace: string;
  constructor() { super(); this.error = ''; this.workspace = storedWorkspace(); this.place = placeOf(location.hash); }
  protected createRenderRoot() { return this; }

  connectedCallback() { super.connectedCallback(); addEventListener('hashchange', this.onHash); void this.readWorkspace(); }
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
    if (response?.ok) location.href = '/app/signin';
    else this.error = 'Could not sign out. Try again.';
  }

  render() {
    const name = this.workspace || 'My company';
    const settings = this.place.page === 'settings';
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
      <div class="home-main">
        <ds-text class="home-title" role="heading" aria-level="1" literal size="display" text=${settings ? 'Settings' : 'Sites'}></ds-text>
        ${this.place.page === 'settings' ? this.settings(this.place.tab, name) : this.sites()}
      </div>
    </ds-page>`;
  }

  /** The owner's sites as cards, each opening its editor. */
  private sites() {
    return html`<div class="home-grid">${SITES.map(site => html`<ds-card href=${site.url} width="12" height="8"><span slot="label">${new URL(site.url).host}</span><span slot="title">${site.name}</span></ds-card>`)}</div>`;
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
