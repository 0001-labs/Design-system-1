import { LitElement, html } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
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
import '../../../DS1/2-core/ds-input';
import '../../../DS1/2-core/ds-message';
import '../../../DS1/2-core/ds-empty';
import './domains';
import { MEMBERS_CHANGE, personInitial, type Member } from './members';
import '../../../DS1/3-unit/ds-avatar-group';
import '../../../DS1/4-page/ds-overlay';
import { activeWorkspace, canManage, draftWords, readWorkspaces, setActiveWorkspace, storeWorkspaces, storedWorkspaces, workspaceHeaders, type WorkspaceSummary } from './workspace-choice';
import { ConsistencySiteEditor } from './site-editor';
import type { SiteSummary } from './site-editing';
import { PLACES, shownPlaces, sitePlaces, type SitePlace } from './places/index';
import { OPEN_PAGE } from './places/pages';
import type { SidebarItem } from '../../../DS1/3-unit/ds-sidebar';
import './home.css';

/**
 * Consistency's app, at consistency.site (c9y.site's home leads there): the workspace's sites as cards, each opened
 * here in the editor, and Settings; pressing the workspace shows the sites again. Each client has a workspace of its
 * own (`workspace-choice.ts`): the owner moves between all of them from the workspace's menu, and the people invited
 * to one see only theirs. The address is consistency.site and
 * nothing more (Joachim, 26 October 2026): where the app stands is its own state, kept in the history so Back and
 * Forward still move between places. Sites are known by their IDv1 codes. A site once opened stays open, hidden
 * while another is shown, so going back to it is instant: no reload and no sign-in again. With a site open, the
 * sidebar is that site's: its name at the top (pressing it shows the site itself; its menu switches to another or
 * to all sites) and the site's places under it, the menus the platform says it has and the app has an element for
 * (`places/`). There is no list of pages: the owner moves between pages by the site's own links.
 */

/** What the app shows: the sites, one site (by its IDv1 code) on its canvas or at one of its places, or Settings at one of its tabs. */
export type Place = { page: 'sites' } | { page: 'site'; code: string; place?: string } | { page: 'settings'; tab: SettingsTab };
export type SettingsTab = 'members' | 'domains' | 'account';
const TABS: SettingsTab[] = ['members', 'domains', 'account'];
const SITE_CODE = /^\d{2}[A-Za-z]{4}$/;
const PLACE_ID = /^[a-z][a-z0-9-]{0,31}$/;
/** A place as the history keeps it, or the sites for anything else. */
export function placeFrom(state: unknown): Place {
  const place = state as Partial<Place> | null;
  if (place?.page === 'settings') { const tab = (place as { tab?: unknown }).tab; return { page: 'settings', tab: TABS.includes(tab as SettingsTab) ? tab as SettingsTab : 'domains' }; }
  if (place?.page === 'site' && typeof (place as { code?: unknown }).code === 'string' && SITE_CODE.test((place as { code: string }).code)) {
    const at = (place as { place?: unknown }).place;
    return typeof at === 'string' && PLACE_ID.test(at) ? { page: 'site', code: (place as { code: string }).code, place: at } : { page: 'site', code: (place as { code: string }).code };
  }
  return { page: 'sites' };
}
/**
 * Where the app opens: a site named in the address once (`?open=12ABCD`, from a site's own /edit) or an older address
 * (`#settings/account`), both taken off at once; otherwise the place the history kept, else the sites.
 */
export function openingPlace(search: string, hash: string, state: unknown): Place {
  const open = new URLSearchParams(search).get('open');
  if (open && SITE_CODE.test(open)) return { page: 'site', code: open };
  if (hash === '#domains' || hash === '#settings' || hash === '#settings/domains') return { page: 'settings', tab: 'domains' };
  if (hash === '#settings/account') return { page: 'settings', tab: 'account' };
  return placeFrom(state);
}

// Each workspace's sites as last read, so the sidebar and the cards are drawn at once and the registry only confirms them.
const SITES_KEY = (workspace: string) => `consistency-home-sites:${workspace}`;
function storedSites(workspace: string): SiteSummary[] {
  if (!workspace) return [];
  try {
    const value = JSON.parse(localStorage.getItem(SITES_KEY(workspace)) ?? '[]') as unknown;
    return Array.isArray(value) ? value.filter((site): site is SiteSummary => !!site && typeof site.code === 'string' && typeof site.name === 'string' && typeof site.url === 'string') : [];
  } catch { return []; }
}
// Each site's places as last read, so its sidebar draws at once and the platform only confirms them.
const PLACES_KEY = (code: string) => `consistency-site-places:${code}`;
function storedPlaces(code: string): SitePlace[] | undefined {
  try {
    const value = JSON.parse(localStorage.getItem(PLACES_KEY(code)) ?? 'null') as unknown;
    return Array.isArray(value) ? value.filter((place): place is SitePlace => !!place && typeof place.id === 'string' && typeof place.label === 'string') : undefined;
  } catch { return undefined; }
}

/** A site's own address, for its card: its host without the editor's path. */
export const siteHost = (site: SiteSummary) => { try { return new URL(site.url).host; } catch { return ''; } };
/** A site's card label: a domain of its own after a globe, else its built-in colour address, else its host. */
const siteLabel = (site: SiteSummary) => site.domain
  ? html`<span slot="label" class="home-site-domain"><ds-icon type="globe" size="large" role="img" aria-label="Connected domain"></ds-icon>${site.domain}</span>`
  : html`<span slot="label">${site.address ?? siteHost(site)}</span>`;

// Each workspace's people as last read, so the cards' avatars are drawn at once and the platform only confirms them.
const PEOPLE_KEY = (workspace: string) => `consistency-people:${workspace}`;
function storedPeople(workspace: string): Member[] {
  if (!workspace) return [];
  try {
    const value = JSON.parse(localStorage.getItem(PEOPLE_KEY(workspace)) ?? '[]') as unknown;
    return Array.isArray(value) ? value.filter((person): person is Member => !!person && typeof person.email === 'string') : [];
  } catch { return []; }
}
/** How many people a card shows before the rest are a count. */
const PEOPLE_SHOWN = 3;

/** The avatar's letter: a name's first letter, a number's first figure after its leading zeros (0001 is 1). */
export function workspaceInitial(name: string): string { return (name.trim().replace(/^0+(?=.)/, '')[0] ?? '?').toUpperCase(); }

/** Consistency's app: a workspace's sites, each in the editor, and Settings. */
export class ConsistencyHome extends LitElement {
  static properties = { error: { state: true }, workspaces: { state: true }, workspace: { state: true }, place: { state: true }, sites: { state: true }, naming: { state: true }, unread: { state: true }, people: { state: true }, peopleOpen: { state: true } };
  /** The places the app can show, by id (`places/index.ts`), here too for a place defined outside the app's modules. */
  static readonly places = PLACES;
  declare place: Place;
  declare error: string;
  /** Every workspace the person may open, as last read. */
  declare workspaces: WorkspaceSummary[];
  /** The workspace the app is in, by its code. */
  declare workspace: string;
  declare sites: SiteSummary[];
  /** True once the workspaces have been read and the person has none: invited nowhere yet. */
  declare unread: boolean;
  /** The workspace's people, as stored or read. */
  declare people: Member[];
  /** Whether the people panel stands at the side. */
  declare peopleOpen: boolean;
  /** The workspace's name as typed in Account, while it is being saved or has failed. */
  declare naming: { value: string; busy: boolean; error: string } | null;
  /** Every site opened so far, kept alive while hidden. */
  private readonly editors = new Map<string, ConsistencySiteEditor>();
  /** Each site's places, as stored or read, by site code. */
  private readonly places = new Map<string, SitePlace[]>();
  /** The sites whose places have been asked of the platform in this visit. */
  private readonly placesAsked = new Set<string>();
  /** Every place opened so far, by site code and place id, kept alive while hidden. */
  private readonly placeElements = new Map<string, HTMLElement>();
  /** Back and Forward: the place the history kept, after the word being edited is saved. */
  private readonly onPop = (event: PopStateEvent) => void this.move(placeFrom(event.state), 'none');
  /** An older address with a place in its hash, followed inside the app and then taken off. */
  private readonly onHash = () => {
    if (!location.hash) return;
    const next = openingPlace('', location.hash, null);
    history.replaceState(this.place, '', location.pathname);
    this.go(next);
  };
  constructor() {
    super(); this.error = ''; this.naming = null; this.unread = false;
    this.workspaces = storedWorkspaces();
    this.workspace = this.workspaces.some(each => each.code === activeWorkspace()) ? activeWorkspace() : this.workspaces[0]?.code ?? '';
    setActiveWorkspace(this.workspace);
    this.sites = storedSites(this.workspace);
    this.people = storedPeople(this.workspace);
    this.peopleOpen = false;
    this.place = openingPlace(location.search, location.hash, history.state);
    // The address stays the app's own: what opened it is kept as history state instead.
    history.replaceState(this.place, '', location.pathname);
  }
  protected createRenderRoot() { return this; }

  /** A place asks to show one of the site's pages on its canvas (Pages' Edit): the canvas is shown, opened on it. */
  private readonly onOpenPage = (event: Event) => {
    const path = (event as CustomEvent<{ path?: unknown }>).detail?.path;
    if (this.place.page !== 'site' || typeof path !== 'string') return;
    const { code } = this.place;
    this.go({ page: 'site', code });
    void this.editors.get(code)?.open(path);
  };

  /** The people panel or Members read the people again or changed them: the cards follow. */
  private readonly onMembers = (event: Event) => {
    const { workspace, members } = (event as CustomEvent<{ workspace: string; members: Member[] }>).detail;
    if (workspace === this.workspace) this.keepPeople(members);
  };

  connectedCallback() { super.connectedCallback(); addEventListener('popstate', this.onPop); addEventListener('hashchange', this.onHash); this.addEventListener(OPEN_PAGE, this.onOpenPage); this.addEventListener(MEMBERS_CHANGE, this.onMembers); void this.readWorkspaces(); }

  /** Goes to a place inside the app, the address unchanged. */
  go(next: Place) { void this.move(next, 'push'); }

  /** Moves to a place, first saving a word being edited on the site being left; a failed save stays put. */
  private async move(next: Place, record: 'push' | 'none') {
    const current = this.place;
    // The site's canvas is left for another site, one of its places, or anywhere else.
    const leaving = current.page === 'site' && !this.placeOf(current) && (next.page !== 'site' || next.code !== current.code || this.placeOf(next)) ? this.editors.get(current.code) : undefined;
    if (leaving && !(await leaving.flush())) { if (record === 'none') history.pushState(current, '', location.pathname); return; }
    if (record === 'push' && JSON.stringify(next) !== JSON.stringify(current)) history.pushState(next, '', location.pathname);
    this.place = next;
  }

  /**
   * The workspaces the person may open, then the sites of the one the app is in: the one chosen last, else the one
   * holding a site asked for by its code, else the first.
   */
  private async readWorkspaces() {
    const read = await readWorkspaces();
    if (!read) { if (this.workspace) void this.readSites(); return; }
    this.workspaces = read.workspaces;
    storeWorkspaces(read.workspaces);
    this.unread = !read.workspaces.length;
    const asked = this.place.page === 'site' ? (this.place as { code: string }).code : '';
    const holding = asked ? read.workspaces.find(each => each.siteCodes.includes(asked)) : undefined;
    const next = holding?.code ?? (read.workspaces.some(each => each.code === this.workspace) ? this.workspace : read.workspaces[0]?.code ?? '');
    if (next !== this.workspace) this.choose(next);
    else void this.readSites();
  }

  /** Moves the app into another workspace: its sites as last read at once, confirmed by the registry. */
  private choose(code: string) {
    setActiveWorkspace(code);
    this.workspace = code;
    this.sites = storedSites(code);
    this.people = storedPeople(code);
    this.peopleOpen = false;
    this.naming = null;
    void this.readSites();
  }

  /** The workspace's people from the platform, for the cards' avatars. */
  private async readPeople() {
    const workspace = this.workspace;
    if (!workspace) return;
    const response = await fetch(`/api/consistency/workspaces/${workspace}/members`, { cache: 'no-store' }).catch(() => null);
    const body = response?.ok ? await response.json().catch(() => null) as { members?: Member[] } | null : null;
    if (Array.isArray(body?.members) && workspace === this.workspace) this.keepPeople(body.members);
  }

  private keepPeople(members: Member[]) {
    this.people = members;
    try { localStorage.setItem(PEOPLE_KEY(this.workspace), JSON.stringify(members)); } catch { /* read again next visit */ }
  }

  /** The workspace's sites from the registry: their names and their own addresses. */
  private async readSites() {
    const workspace = this.workspace;
    if (!workspace) { this.sites = []; return; }
    void this.readPeople();
    const response = await fetch('/api/consistency/sites', { cache: 'no-store', headers: workspaceHeaders() }).catch(() => null);
    const body = response?.ok ? await response.json().catch(() => null) as { sites?: SiteSummary[] } | null : null;
    if (!Array.isArray(body?.sites) || workspace !== this.workspace) return;
    this.sites = body.sites;
    try { localStorage.setItem(SITES_KEY(workspace), JSON.stringify(this.sites)); } catch { /* read again next visit */ }
  }

  /** The editor for a site, made once and kept. */
  private editorFor(site: SiteSummary): ConsistencySiteEditor {
    let editor = this.editors.get(site.code);
    if (!editor) { editor = new ConsistencySiteEditor(); editor.site = site; editor.picker = false; this.editors.set(site.code, editor); }
    return editor;
  }

  /** A site's places, drawn at once from the last visit; asked of the platform once a visit, which confirms them. */
  private placesFor(code: string): SitePlace[] {
    if (!this.places.has(code)) { const stored = storedPlaces(code); if (stored) this.places.set(code, stored); }
    if (!this.placesAsked.has(code)) {
      this.placesAsked.add(code);
      void sitePlaces(code).then(places => {
        if (JSON.stringify(places) !== JSON.stringify(this.places.get(code))) { this.places.set(code, places); this.requestUpdate(); }
        try { localStorage.setItem(PLACES_KEY(code), JSON.stringify(places)); } catch { /* read again next visit */ }
      }, () => { /* kept as stored; asked again next visit */ });
    }
    return this.places.get(code) ?? [];
  }

  /** The place of a site being shown, when it is one the site has and the app can show; the canvas otherwise. */
  private placeOf(place: Place): string | undefined {
    if (place.page !== 'site' || !place.place || !PLACES.has(place.place)) return undefined;
    return (this.places.get(place.code) ?? storedPlaces(place.code))?.some(each => each.id === place.place) ? place.place : undefined;
  }

  /** Shows the site's canvas or the place being shown in the stage and hides the others, never taking them out of the page. */
  protected updated() {
    const stage = this.querySelector<HTMLElement>('.home-stage');
    if (!stage) return;
    const current = this.place.page === 'site' ? this.sites.find(site => site.code === (this.place as { code: string }).code) : undefined;
    const at = current ? this.placeOf(this.place) : undefined;
    const key = current && at ? `${current.code}:${at}` : '';
    if (current) { const editor = this.editorFor(current); if (editor.parentElement !== stage) stage.append(editor); }
    if (current && at && !this.placeElements.has(key)) this.placeElements.set(key, PLACES.get(at)!(current));
    const shown = key ? this.placeElements.get(key) : undefined;
    if (shown && shown.parentElement !== stage) stage.append(shown);
    for (const [code, editor] of this.editors) editor.hidden = code !== current?.code || Boolean(at);
    for (const [each, element] of this.placeElements) element.hidden = each !== key;
  }
  disconnectedCallback() { super.disconnectedCallback(); removeEventListener('popstate', this.onPop); removeEventListener('hashchange', this.onHash); this.removeEventListener(OPEN_PAGE, this.onOpenPage); this.removeEventListener(MEMBERS_CHANGE, this.onMembers); }

  /** The workspace the app is in, as last read. */
  private get current(): WorkspaceSummary | undefined { return this.workspaces.find(each => each.code === this.workspace); }

  /** Renames the workspace, for its admins and the owner: saved on Enter or on leaving the field; a failure keeps the words typed. */
  private async rename() {
    const naming = this.naming;
    const current = this.current;
    if (!naming || naming.busy || !current) return;
    const value = naming.value.trim();
    if (!value || value === current.name) { this.naming = null; return; }
    this.naming = { ...naming, busy: true, error: '' };
    const response = await fetch(`/api/consistency/workspaces/${current.code}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: value }) }).catch(() => null);
    const body = response?.ok ? await response.json().catch(() => null) as { name?: unknown } | null : null;
    if (typeof body?.name !== 'string') { this.naming = { value, busy: false, error: 'The name could not be saved. Try again.' }; return; }
    const name = body.name;
    this.workspaces = this.workspaces.map(each => each.code === current.code ? { ...each, name } : each);
    storeWorkspaces(this.workspaces);
    this.naming = null;
  }

  private async signOut() {
    this.error = '';
    const response = await fetch('/api/dashboard/session', { method: 'DELETE' }).catch(() => null);
    // consistency.site's front page is the landing; the other addresses sign in again there.
    if (response?.ok) location.href = location.hostname === 'consistency.site' ? '/' : '/app/signin';
    else this.error = 'Could not sign out. Try again.';
  }

  render() {
    const current = this.current;
    const name = current?.name || 'Workspace';
    const settings = this.place.page === 'settings';
    const open = this.place.page === 'site' ? (this.place as { code: string }).code : '';
    const site = open ? this.sites.find(item => item.code === open) : undefined;
    const others = this.workspaces.filter(each => each.code !== this.workspace);
    const drafts = draftWords(current);
    return html`<ds-page layout="sidebar" fill drawer>
      ${site ? this.siteNav(site) : html`<nav slot="nav" class="home-nav" aria-label="Consistency">
        <div class="home-workspace" aria-label="Workspace">
          <ds-button id="home-workspace" class="home-workspace-name" label=${`Workspace: ${name}`} @click=${() => this.go({ page: 'sites' })}>
            <ds-avatar initial=${workspaceInitial(name)} outlined plain aria-hidden="true"></ds-avatar>${name}<ds-icon type="chevron-down"></ds-icon>
          </ds-button>
          ${others.length ? html`<ds-select for="home-workspace" hover aria-label="Workspace">
            ${others.map(each => html`<ds-button menu-item data-workspace=${each.code} @click=${() => { this.choose(each.code); this.go({ page: 'sites' }); }}>${each.name}</ds-button>`)}
          </ds-select>` : ''}
          <ds-button id="home-notifications" icon label="Notifications"><ds-icon type="notifications"></ds-icon></ds-button>
          <ds-select for="home-notifications" aria-label="Notifications" role="dialog">
            <ds-text data-ds-menu-label tone="muted" literal text="No notifications yet"></ds-text>
          </ds-select>
        </div>
        <!-- The workspace's own Settings at the sidebar's foot: each workspace has its people, domains and account. -->
        <ds-sidebar class="home-foot" label="Workspace" .items=${[{ id: 'settings', label: 'Settings', current: settings }]}
          @sidebar-activate=${() => this.go({ page: 'settings', tab: 'domains' })}></ds-sidebar>
      </nav>`}
      <div class=${open ? 'home-main home-main--site' : 'home-main'}>
        ${open ? '' : html`<ds-text class="home-title" role="heading" aria-level="1" literal size="display" text=${settings ? 'Settings' : 'Sites'}></ds-text>`}
        ${!open && !settings && drafts ? html`<ds-text class="home-drafts" tone="muted" literal text=${drafts}></ds-text>` : ''}
        ${this.place.page === 'settings' ? this.settings(this.place.tab, current) : open ? (this.sites.some(site => site.code === open) ? '' : html`<ds-empty literal heading="This site is not in your workspace"></ds-empty>`) : this.unread ? html`<ds-empty literal heading="You are not in a workspace yet" text="Ask whoever invited you to Consistency to invite this address."></ds-empty>` : this.siteCards()}
        <div class="home-stage" ?hidden=${!open}></div>
      </div>
    </ds-page>
    ${this.peoplePanel(current)}`;
  }

  /** An open site's sidebar: its name, which shows the site and whose menu goes to another, and its places. */
  private siteNav(site: SiteSummary) {
    const current = this.placeOf(this.place);
    const items = shownPlaces(this.placesFor(site.code)).map(place => ({ id: place.id, label: place.label, current: place.id === current }));
    const others = this.sites.filter(item => item.code !== site.code);
    return html`<nav slot="nav" class="home-nav" aria-label=${site.name}>
      <div class="home-workspace" aria-label="Site">
        <ds-button id="home-site" class="home-workspace-name" label=${`Site: ${site.name}`} @click=${() => this.go({ page: 'site', code: site.code })}>${site.name}<ds-icon type="chevron-down"></ds-icon></ds-button>
        <ds-select for="home-site" hover aria-label="Sites">
          ${others.map(item => html`<ds-button menu-item @click=${() => this.go({ page: 'site', code: item.code })}>${item.name}</ds-button>`)}
          ${others.length ? html`<hr>` : ''}
          <ds-button menu-item @click=${() => this.go({ page: 'sites' })}>All sites</ds-button>
        </ds-select>
      </div>
      ${items.length ? html`<ds-sidebar class="home-places" label=${site.name} .items=${items}
        @sidebar-activate=${(event: CustomEvent<{ id: string }>) => this.go({ page: 'site', code: site.code, place: event.detail.id })}></ds-sidebar>` : ''}
    </nav>`;
  }

  /**
   * The workspace's sites as cards, each opening in the editor here: its address, a draft's mark before its name
   * (a site on its built-in address alone, as Free's are), and on its foot the people who edit it, the workspace's;
   * pressing them opens the people panel, never the site.
   */
  private siteCards() {
    return html`<div class="home-grid">${this.sites.map(site => html`<ds-card interactive data-site=${site.code} width="12" height="8" @ds-card-press=${() => this.go({ page: 'site', code: site.code })}>${siteLabel(site)}<span slot="title" class="home-site-title">${site.domain ? '' : html`<ds-icon type="arrange-draft" size="large" role="img" aria-label="Draft"></ds-icon>`}${site.name}</span>${this.peopleButton()}</ds-card>`)}</div>`;
  }

  /** The workspace's people as overlapping avatars, the invited ones pending, and a plus for those who may invite. */
  private peopleButton() {
    const current = this.current;
    const manage = canManage(current);
    const shown = this.people.slice(0, PEOPLE_SHOWN);
    const rest = this.people.length - shown.length;
    if (!shown.length && !manage) return '';
    const stop = (event: Event) => event.stopPropagation();
    const label = `People in ${current?.name ?? 'the workspace'}`;
    return html`<button slot="media" type="button" class="home-site-people" aria-label=${label} data-tooltip=${label}
      @click=${(event: Event) => { stop(event); this.peopleOpen = true; }} @keydown=${stop}>
      <ds-avatar-group>${shown.map(person => html`<ds-avatar initial=${personInitial(person.email)} outlined ?pending=${person.status === 'invited'}></ds-avatar>`)}${rest > 0 ? html`<ds-avatar initial=${`+${rest}`} outlined></ds-avatar>` : ''}${manage ? html`<ds-avatar icon="plus" outlined></ds-avatar>` : ''}</ds-avatar-group>
    </button>`;
  }

  /** The workspace's people in a panel at the side, the page still live beside it; admins and the owner invite more. */
  private peoplePanel(current: WorkspaceSummary | undefined) {
    return html`<ds-overlay class="home-people" type="drawer" side="end" non-modal .open=${this.peopleOpen} @ds-close-request=${() => { this.peopleOpen = false; }}>
      <dialog aria-labelledby="home-people-title">
        <header data-ds-overlay="header"><span id="home-people-title" data-ds-overlay="title">${current ? `People in ${current.name}` : 'People'}</span></header>
        <ds-button data-ds-overlay="close" data-ds-overlay-dismiss icon label="Close"><ds-icon type="close"></ds-icon></ds-button>
        ${this.peopleOpen && current ? html`<consistency-members .workspace=${current.code} .manage=${canManage(current)}></consistency-members>` : ''}
      </dialog>
    </ds-overlay>`;
  }

  /** Settings as Money draws it: text tabs under the title, each tab its own address. People is for the workspace's admins and the owner. */
  private settings(asked: SettingsTab, current: WorkspaceSummary | undefined) {
    const manage = canManage(current);
    const tabs: { id: SettingsTab; label: string }[] = [...(manage ? [{ id: 'members' as const, label: 'People' }] : []), { id: 'domains', label: 'Domains' }, { id: 'account', label: 'Account' }];
    const tab = tabs.some(item => item.id === asked) ? asked : 'domains';
    const name = current?.name ?? '';
    return html`<div class="home-settings">
      <ds-tabs text class="home-settings-tabs" aria-label="Settings">${tabs.map(item => html`<ds-button control="host" role="tab" ?active=${tab === item.id} aria-selected=${String(tab === item.id)} tabindex=${tab === item.id ? 0 : -1}
        @click=${() => this.go({ page: 'settings', tab: item.id })}>${item.label}</ds-button>`)}</ds-tabs>
      ${tab === 'members' ? html`<consistency-members .workspace=${this.workspace}></consistency-members>` : tab === 'domains' ? html`${keyed(this.workspace, html`<consistency-domains></consistency-domains>`)}` : html`<section class="home-account" aria-label="Account">
        <ds-list aria-label="Account"><ds-row><span class="ds-row__name">Workspace</span><span class="ds-row__value">
          <ds-input class="home-workspace-field" aria-label="Workspace" maxlength="80" autocomplete="organization" ?disabled=${(this.naming?.busy ?? false) || !manage}
            placeholder="My company" .value=${this.naming?.value ?? name}
            @input-change=${(event: CustomEvent<{ value: string }>) => { this.naming = { value: event.detail.value, busy: false, error: '' }; }}
            @input-blur=${() => void this.rename()}
            @keydown=${(event: KeyboardEvent) => { if (event.key === 'Enter') void this.rename(); if (event.key === 'Escape') this.naming = null; }}></ds-input>
        </span></ds-row></ds-list>
        ${this.naming?.error ? html`<ds-message role="alert" tone="danger" literal text=${this.naming.error}></ds-message>` : ''}
        <div class="home-sign-out"><ds-button secondary @click=${() => void this.signOut()}>Sign out</ds-button></div>
        ${this.error ? html`<ds-message role="alert" tone="danger" literal text=${this.error}></ds-message>` : ''}
      </section>`}
    </div>`;
  }
}
if (!customElements.get('consistency-home')) customElements.define('consistency-home', ConsistencyHome);
