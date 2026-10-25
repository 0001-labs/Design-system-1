import { LitElement, html } from 'lit';
import '../../../DS1/4-page/ds-page';
import '../../../DS1/3-unit/ds-sidebar';
import '../../../DS1/3-unit/ds-tabs';
import '../../../DS1/3-unit/ds-list';
import '../../../DS1/3-unit/ds-row';
import '../../../DS1/2-core/ds-button';
import '../../../DS1/2-core/ds-card';
import '../../../DS1/2-core/ds-text';
import './home.css';

/** The owner's sites. Each opens in its editor, `/team/`: the site beside its sidebar, ready to edit. */
export const PROJECTS = [
  { id: 'flavo', name: 'Flavo', url: 'https://flavo.c9y.site/team/' },
  { id: 'cph-raft', name: 'CPH Raft', url: 'https://cphraft.c9y.site/team/' },
  { id: 'soendergaarden', name: 'Søndergården', url: 'https://soendergaarden.c9y.site/team/' },
] as const;

type View = 'grid' | 'list';
const VIEW_KEY = 'consistency-home-view';
function storedView(): View { try { return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'grid'; } catch { return 'grid'; } }

/** The home at c9y.site: the owner's projects, nothing else to choose yet. */
export class ConsistencyHome extends LitElement {
  static properties = { view: { state: true }, error: { state: true } };
  declare view: View;
  declare error: string;
  constructor() { super(); this.view = storedView(); this.error = ''; }
  protected createRenderRoot() { return this; }

  private setView(view: View) { this.view = view; try { localStorage.setItem(VIEW_KEY, view); } catch { /* the choice lasts this visit */ } }

  private async signOut() {
    this.error = '';
    const response = await fetch('/api/dashboard/session', { method: 'DELETE' }).catch(() => null);
    if (response?.ok) location.href = '/app/signin';
    else this.error = 'Could not sign out. Try again.';
  }

  render() {
    const host = (url: string) => new URL(url).host;
    return html`<ds-page layout="sidebar" fill drawer>
      <nav slot="nav" class="home-nav" aria-label="Consistency">
        <ds-sidebar narrow label="Places" .items=${[{ id: 'projects', label: 'Projects', href: '/', current: true }]}></ds-sidebar>
        <ds-sidebar narrow label="Settings" .items=${[{ id: 'account', label: 'Account', disabled: true }, { id: 'sign-out', label: 'Sign out' }]}
          @sidebar-activate=${(event: CustomEvent<{ id: string }>) => { if (event.detail.id === 'sign-out') void this.signOut(); }}>
          <ds-text slot="header" literal tone="muted" text="Settings"></ds-text>
        </ds-sidebar>
        ${this.error ? html`<ds-text role="alert" literal tone="danger" wrap text=${this.error}></ds-text>` : ''}
      </nav>
      <div slot="header" class="home-bar">
        <ds-button primary disabled>New</ds-button>
        <ds-tabs role="group" aria-label="View">
          <ds-button ?active=${this.view === 'grid'} ?primary=${this.view === 'grid'} ?secondary=${this.view !== 'grid'} aria-pressed=${String(this.view === 'grid')} @click=${() => this.setView('grid')}>Grid</ds-button>
          <ds-button ?active=${this.view === 'list'} ?primary=${this.view === 'list'} ?secondary=${this.view !== 'list'} aria-pressed=${String(this.view === 'list')} @click=${() => this.setView('list')}>List</ds-button>
        </ds-tabs>
      </div>
      ${this.view === 'grid'
        ? html`<div class="home-grid">${PROJECTS.map(project => html`<ds-card href=${project.url} width="12" height="8"><span slot="label">${host(project.url)}</span><span slot="title">${project.name}</span></ds-card>`)}</div>`
        : html`<ds-list aria-label="Projects">${PROJECTS.map(project => html`<ds-row href=${project.url}><span class="ds-row__name">${project.name}</span><span class="ds-row__value">${host(project.url)}</span></ds-row>`)}</ds-list>`}
    </ds-page>`;
  }
}
if (!customElements.get('consistency-home')) customElements.define('consistency-home', ConsistencyHome);
