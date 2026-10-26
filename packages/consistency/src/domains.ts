import { LitElement, html } from 'lit';
import '../../../DS1/3-unit/ds-list';
import '../../../DS1/3-unit/ds-row';
import '../../../DS1/3-unit/ds-select';
import '../../../DS1/2-core/ds-button';
import '../../../DS1/2-core/ds-input';
import '../../../DS1/2-core/ds-message';
import '../../../DS1/2-core/ds-tag';
import '../../../DS1/2-core/ds-text';
import '../../../DS1/2-core/ds-icon';
import { workspaceHeaders } from './workspace-choice';

/**
 * Settings → Domains: a workspace's own domains on its sites, on a plan that has them; on Free, its sites stay on
 * their built-in colour addresses and the page says so. The platform asks Cloudflare whether a domain points here
 * and has its certificate; this page only shows what it says and keeps waiting domains current on its own, with no
 * button to check again.
 */
export type DomainState = 'pending' | 'active' | 'failed';
export interface Domain { host: string; state: DomainState; detail: string | null; managed: boolean; checkedAt: number | null }
/** A site by its IDv1 code, how the app names it. */
export interface DomainSite { code: string; name: string; domains: Domain[] }
/** `allowed`: whether the workspace's plan connects domains of its own. */
export interface DomainsAnswer { target: string; ready: boolean; allowed: boolean; sites: DomainSite[] }

const API = '/api/consistency/domains';
/** How often a waiting domain is asked about while the page is open and visible. */
export const CHECK_EVERY = 30_000;

const MESSAGES: Record<string, string> = {
  'bad-host': 'That is not a domain name.',
  'platform-host': 'c9y.site addresses already belong to the site.',
  'host-taken': 'That domain is already connected, here or on another Cloudflare account.',
  'unknown-site': 'That site is not active.',
  'domain-limit': 'All 100 domains are in use.',
  'domains-unavailable': 'Connecting domains is not set up yet.',
  'plan-has-no-domains': 'Your own domain comes with Plus.',
  'cloudflare-refused': 'Cloudflare refused that domain.',
  'cloudflare-unavailable': 'Cloudflare did not answer. Try again.',
};
/** Words for a refusal the platform names; never the server's raw text. */
export const messageFor = (code: unknown, fallback: string) => (typeof code === 'string' && MESSAGES[code]) || fallback;

const STATE_WORDS: Record<DomainState, string> = { active: 'Connected', pending: 'Waiting', failed: 'Failed' };
/** A bare domain (example.com) can only hold the CNAME where the DNS host flattens it at the root. */
export const isApex = (host: string) => host.split('.').length === 2;

export class ConsistencyDomains extends LitElement {
  static properties = { answer: { state: true }, site: { state: true }, host: { state: true }, error: { state: true }, busy: { state: true } };
  declare answer: DomainsAnswer | null;
  declare site: string;
  declare host: string;
  declare error: string;
  declare busy: boolean;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private checking = false;
  private readonly onVisible = () => { if (document.visibilityState === 'visible') void this.load(); };

  constructor() { super(); this.answer = null; this.site = ''; this.host = ''; this.error = ''; this.busy = false; }
  protected createRenderRoot() { return this; }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('visibilitychange', this.onVisible);
    void this.load();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('visibilitychange', this.onVisible);
    clearTimeout(this.timer);
  }

  /** The sites and their domains, then a fresh word from Cloudflare on any still waiting. */
  async load() {
    const response = await fetch(API, { cache: 'no-store', headers: workspaceHeaders() }).catch(() => null);
    const answer = response?.ok ? await response.json().catch(() => null) as DomainsAnswer | null : null;
    if (!answer) { if (!this.answer) this.error = 'Domains could not be read. They will be read again shortly.'; this.schedule(); return; }
    if (this.error.startsWith('Domains could not be read')) this.error = '';
    this.answer = answer;
    if (!answer.sites.some(site => site.code === this.site)) this.site = answer.sites[0]?.code ?? '';
    await this.checkWaiting();
  }

  private waiting(): Domain[] {
    return (this.answer?.sites ?? []).flatMap(site => site.domains).filter(domain => domain.managed && domain.state === 'pending');
  }

  private async checkWaiting() {
    if (this.checking || !this.answer?.ready) return this.schedule();
    this.checking = true;
    try {
      for (const domain of this.waiting()) {
        const response = await fetch(`${API}/${domain.host}/check`, { method: 'POST', headers: workspaceHeaders() }).catch(() => null);
        const next = response?.ok ? await response.json().catch(() => null) as Domain | null : null;
        if (next) this.replace(next);
      }
    } finally { this.checking = false; this.schedule(); }
  }

  private schedule() {
    clearTimeout(this.timer);
    if (!this.isConnected || document.visibilityState !== 'visible') return;
    if (this.answer && !this.waiting().length) return;
    this.timer = setTimeout(() => void (this.answer ? this.checkWaiting() : this.load()), CHECK_EVERY);
  }

  private replace(domain: Domain, siteCode?: string) {
    if (!this.answer) return;
    this.answer = { ...this.answer, sites: this.answer.sites.map(site => {
      const domains = site.domains.filter(item => item.host !== domain.host);
      if (site.code === siteCode || site.domains.some(item => item.host === domain.host)) domains.push(domain);
      return { ...site, domains: domains.sort((a, b) => a.host.localeCompare(b.host)) };
    }) };
  }

  private async connect(event: Event) {
    event.preventDefault();
    if (this.busy || !this.site || !this.host.trim()) return;
    this.busy = true; this.error = '';
    try {
      const response = await fetch(API, { method: 'POST', headers: { ...workspaceHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ site: this.site, host: this.host }) }).catch(() => null);
      const body = response ? await response.json().catch(() => null) as (Domain & { error?: string }) | null : null;
      if (!response?.ok || !body?.host) { this.error = messageFor(body?.error, 'The domain could not be connected. Try again.'); return; }
      this.replace(body, this.site);
      this.host = '';
      this.schedule();
    } finally { this.busy = false; }
  }

  private async disconnect(domain: Domain) {
    this.error = '';
    const response = await fetch(`${API}/${domain.host}`, { method: 'DELETE', headers: workspaceHeaders() }).catch(() => null);
    if (!response?.ok) { this.error = `${domain.host} could not be disconnected. Try again.`; return; }
    if (this.answer) this.answer = { ...this.answer, sites: this.answer.sites.map(site => ({ ...site, domains: site.domains.filter(item => item.host !== domain.host) })) };
  }

  private row(domain: Domain) {
    const id = `domain-more-${domain.host.replace(/[^a-z0-9]/g, '-')}`;
    const target = this.answer?.target ?? 'connect.c9y.site';
    const detail = domain.state === 'active' ? '' : domain.detail ?? '';
    return html`<ds-row class="domain-row" data-state=${domain.state}>
        <span class="ds-row__name">${domain.host}</span>
        <span class="ds-row__value"><ds-tag>${STATE_WORDS[domain.state]}</ds-tag>${domain.managed ? html`<ds-button id=${id} icon label=${`More for ${domain.host}`}><ds-icon type="more"></ds-icon></ds-button>
          <ds-select for=${id} aria-label=${`Actions for ${domain.host}`}><ds-button menu-item role="menuitem" @click=${() => void this.disconnect(domain)}>Disconnect</ds-button></ds-select>` : ''}</span>
      </ds-row>
      ${domain.state === 'active' ? '' : html`<div class="domain-record" role="group" aria-label=${`DNS record for ${domain.host}`}>
        <ds-text literal tone="muted" text="CNAME"></ds-text><ds-text literal text=${domain.host}></ds-text><ds-text literal text=${target}></ds-text>
      </div>`}
      ${detail || (isApex(domain.host) && domain.state !== 'active') ? html`<ds-text class="domain-detail" literal tone=${domain.state === 'failed' ? 'danger' : 'muted'} wrap
        text=${[detail, isApex(domain.host) && domain.state !== 'active' ? `Needs a DNS host that allows a CNAME at the root, or connect www.${domain.host}.` : ''].filter(Boolean).join(' ')}></ds-text>` : ''}`;
  }

  render() {
    const answer = this.answer;
    const sites = answer?.sites ?? [];
    // On Free, each site stays on its built-in colour address; a domain of its own comes with Plus.
    if (answer && answer.allowed === false) return html`<section class="domains" aria-label="Domains">
      <ds-message literal text="Your sites are on their built-in addresses. Your own domain comes with Plus."></ds-message>
      ${sites.filter(site => site.domains.length).map(site => html`<ds-list heading=${site.name}>${site.domains.map(domain => this.row(domain))}</ds-list>`)}
    </section>`;
    return html`<section class="domains" aria-label="Domains">
      ${answer && !answer.ready ? html`<ds-message tone="warning" literal text="Connecting domains is not set up yet."></ds-message>` : ''}
      <form class="domains-connect" @submit=${(event: Event) => void this.connect(event)}>
        <ds-select class="domains-site" aria-label="Site"><select aria-label="Site" .value=${this.site} @change=${(event: Event) => { this.site = (event.target as HTMLSelectElement).value; }}>
          ${sites.map(site => html`<option value=${site.code} ?selected=${site.code === this.site}>${site.name}</option>`)}
        </select></ds-select>
        <ds-input class="domains-host" name="host" aria-label="Domain" placeholder="www.example.com" autocomplete="off" spellcheck="false" .value=${this.host}
          @input-change=${(event: CustomEvent<{ value: string }>) => { this.host = event.detail.value; }}></ds-input>
        <ds-button primary @click=${(event: Event) => void this.connect(event)} ?disabled=${this.busy || !answer?.ready || !this.site || !this.host.trim()}>Connect</ds-button>
      </form>
      ${this.error ? html`<ds-message role="alert" tone="danger" literal text=${this.error}></ds-message>` : ''}
      ${sites.filter(site => site.domains.length).map(site => html`<ds-list heading=${site.name}>
        ${site.domains.map(domain => this.row(domain))}
      </ds-list>`)}
    </section>`;
  }
}
if (!customElements.get('consistency-domains')) customElements.define('consistency-domains', ConsistencyDomains);
