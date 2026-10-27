import { html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { AppElement, defineElement } from '../lib/element';
import { authState } from '../lib/backend';
import { OwnerSession } from './AdoptionDashboard';
import { CONSTRAINT_CATALOGUE, FOUNDATION_CONSTRAINTS, exampleScore, type ExampleReport, type ExampleResult } from '../../../shared/constraint-catalogue';
import { DOC_EXAMPLES } from '../../../shared/doc-examples';
import '../../../DS1/4-page/ds-page';
import '../../../DS1/3-unit/ds-sidebar';
import '../../../DS1/3-unit/ds-bento';
import '../../../DS1/2-core/ds-card';
import '../../../DS1/2-core/ds-switch';
import '../../../DS1/2-core/ds-tag';
import '../../../DS1/2-core/ds-input';
import '../../../DS1/2-core/ds-cycle';
import '../../../website/src/lib/adoption-document';
import '../../../website/src/lib/architecture-document';
import '../../../website/src/vendor/aa/aa.css';
import './system-site.css';

type Example = typeof DOC_EXAMPLES[number] & { enabled: boolean };
const sections = ['Adoption', 'Architecture', 'Examples', 'Constraints'];
const source = (file: string) => `https://github.com/0001-labs/Design-system-1/blob/main/${file}`;

export class SystemSite extends AppElement {
  static properties = { examples: { state: true }, report: { state: true }, error: { state: true }, search: { state: true }, selected: { state: true }, busy: { state: true } };
  declare examples: Example[] | null;
  declare report: ExampleReport | null;
  declare error: string;
  declare search: string;
  declare selected: string | null;
  declare busy: Set<string>;
  #session = new OwnerSession(this, 'System · Design system 1');
  #request?: AbortController;
  #loaded = false;
  #timer?: ReturnType<typeof setInterval>;
  section = sections.find(name => location.pathname.replace(/\/$/, '') === `/${name.toLowerCase()}`) ?? 'Adoption';
  constructor() { super(); this.examples = null; this.report = null; this.error = ''; this.search = ''; this.selected = new URLSearchParams(location.search).get('example'); this.busy = new Set(); }
  override connectedCallback() { super.connectedCallback(); window.addEventListener('focus', this.refresh); window.addEventListener('online', this.refresh); this.#timer = setInterval(this.refresh, 60_000); }
  override disconnectedCallback() { this.#request?.abort(); clearInterval(this.#timer); window.removeEventListener('focus', this.refresh); window.removeEventListener('online', this.refresh); super.disconnectedCallback(); }
  override updated() {
    if (this.#session.ready && !this.#loaded && this.section === 'Examples') { this.#loaded = true; void this.load(); }
    if (!authState.get().isAuthenticated) { this.#request?.abort(); this.examples = null; this.report = null; this.#loaded = false; }
  }
  refresh = () => { if (document.visibilityState === 'visible' && this.#session.ready && this.section === 'Examples' && !this.busy.size) void this.load(); };
  async load() {
    this.#request?.abort(); const request = this.#request = new AbortController();
    try {
      const responses = await Promise.all(['/api/system/examples', '/api/system/checks'].map(path => fetch(path, { cache: 'no-store', signal: request.signal })));
      if (responses[0]!.status === 401 || responses[0]!.status === 403) { this.examples = null; this.report = null; throw new Error('Sign in with the owner account to open Examples.'); }
      if (!responses[0]!.ok) throw new Error('Examples could not be loaded. They will be checked again automatically.');
      const examples = await responses[0]!.json() as Example[];
      const report = responses[1]!.ok ? await responses[1]!.json() as ExampleReport : null;
      if (request.signal.aborted) return;
      this.examples = examples.map(example => this.busy.has(example.id) ? this.examples?.find(previous => previous.id === example.id) ?? example : example);
      this.report = report?.schema === 1 ? report : null; this.error = '';
    } catch (error) { if (!request.signal.aborted) this.error = (error as Error).message; }
  }
  async toggle(example: Example) {
    if (this.busy.has(example.id)) return;
    this.busy = new Set([...this.busy, example.id]); this.error = '';
    try {
      const response = await fetch('/api/system/examples', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: example.id, enabled: !example.enabled }) });
      if (!response.ok) throw new Error(`${example.label} could not be changed. Its previous setting is kept.`);
      this.examples = this.examples!.map(item => item.id === example.id ? { ...item, enabled: !example.enabled } : item);
    } catch (error) { this.error = (error as Error).message; }
    finally { this.busy = new Set([...this.busy].filter(id => id !== example.id)); }
  }
  constraints() {
    const matches = (entry: { id?: string; code: string; tag?: string; rule: string }) => `${entry.id} ${entry.code} ${entry.tag} ${entry.rule}`.toLowerCase().includes(this.search.toLowerCase());
    return html`<div class="system-constraints">
      <ds-input type="search" label="Find a constraint" placeholder="Find by ID, tag or rule" .value=${this.search} @input=${(event: Event) => { this.search = (event.target as HTMLInputElement).value; }}></ds-input>
      <ds-text literal tone="muted" wrap>${CONSTRAINT_CATALOGUE.length} measured rules · ${FOUNDATION_CONSTRAINTS.length} foundation rules</ds-text>
      ${CONSTRAINT_CATALOGUE.filter(matches).map(rule => html`<section class="system-rule" id=${rule.id}>
        <div class="system-line"><a class="ds-link" href=${`#${rule.id}`}>${rule.id}</a><ds-tag>${rule.tag}</ds-tag><code>${rule.code}</code></div>
        <div data-ds-prose><p>${rule.rule}${rule.why ? ` ${rule.why}` : ''}</p></div>
        <div class="system-line">${rule.components.map(tag => html`<ds-tag>${tag}</ds-tag>`)}<a class="ds-link" href=${source('DS1/0-face/constraints.ts')} target="_blank" rel="noopener">Core rule</a><a class="ds-link" href=${source(rule.check.file)} target="_blank" rel="noopener">Source test</a></div>
        <ds-text literal tone="muted" wrap>${rule.check.test}</ds-text>
      </section>`)}
      ${FOUNDATION_CONSTRAINTS.filter(matches).map(rule => html`<section class="system-rule" id=${rule.id}>
        <div class="system-line"><a class="ds-link" href=${`#${rule.id}`}>${rule.id}</a><ds-tag>${rule.tag}</ds-tag><code>${rule.code}</code><ds-tag>Manual review</ds-tag></div>
        <div data-ds-prose><p>${rule.rule}</p></div><a class="ds-link" href=${`https://designsystem1.com/1-root/constraints/#${rule.anchor}`}>Explanation and examples</a>
      </section>`)}
      ${![...CONSTRAINT_CATALOGUE, ...FOUNDATION_CONSTRAINTS].some(matches) ? html`<ds-text literal>No constraints match.</ds-text>` : nothing}
    </div>`;
  }
  results(result: ExampleResult) {
    const score = exampleScore(result);
    return html`<section class="system-results" aria-label="Constraint results">
      <div class="system-line"><ds-text literal size="heading">${this.examples?.find(item => item.id === result.id)?.label}</ds-text><ds-button @click=${() => { this.selected = null; history.replaceState(null, '', '/examples'); }}>Close</ds-button></div>
      <ds-text literal wrap>${score.passed}/${score.total} applicable rule checks passed. ${score.failed} failed; ${score.review} need visual review.</ds-text>
      <div data-ds-prose><p>Each check is one rule at one width and theme. Rules with no matching elements are excluded. Foundation rules and unmeasurable content need manual review. This snapshot covers the rendered initial state, not every interaction.</p></div>
      ${result.errors.map(error => html`<ds-text literal tone="danger" wrap>${error}</ds-text>`)}
      <div class="ds-table-scroll"><table class="ds-table"><thead><tr><th>Rule</th><th>Width</th><th>Theme</th><th>Result</th><th>Measured</th></tr></thead><tbody>
      ${result.checks.map(check => html`<tr><td><a class="ds-link" href=${`/constraints#${CONSTRAINT_CATALOGUE.find(rule => rule.code === check.code)?.id ?? ''}`}>${CONSTRAINT_CATALOGUE.find(rule => rule.code === check.code)?.id} ${check.code}</a></td><td>${check.width}px</td><td>${check.theme}</td><td>${check.status === 'absent' ? 'Not applicable' : check.status}</td><td>${check.measured}</td></tr>
      ${check.findings.map(finding => html`<tr><td colspan="5"><ds-text literal wrap tone=${finding.review ? 'muted' : 'danger'}>${finding.element}: ${finding.message}</ds-text></td></tr>`)}`)}
      </tbody></table></div>
    </section>`;
  }
  catalogue() {
    const selected = this.report?.examples.find(result => result.id === this.selected);
    return html`
      <ds-text literal tone="muted" wrap>Switches publish examples in the documentation gallery. Direct preview links stay available.</ds-text>
      ${this.error ? html`<ds-text literal tone="danger" wrap role="alert">${this.error}</ds-text>` : nothing}
      ${this.report ? html`<ds-text literal tone="muted" wrap>Checked ${this.report.generatedAt.replace('T', ' ').replace(/\.\d+Z$/, ' UTC')} · ${this.report.revision.slice(0, 8)}${this.report.sourceDirty ? ' working copy' : ''} · ${this.report.widths.join(', ')}px · ${this.report.themes.join(' and ')}</ds-text>` : html`<ds-text literal tone="muted">No constraint snapshot is available yet.</ds-text>`}
      ${selected ? this.results(selected) : nothing}
      ${!this.examples ? html`<ds-text literal role="status">Loading examples…</ds-text>` : html`<ds-bento class="system-examples">${repeat(this.examples, item => item.id, example => {
        const result = this.report?.examples.find(item => item.id === example.id); const score = result && exampleScore(result);
        return html`<ds-card variant="outlined" padding="small" data-example=${example.id}>
          <div class="system-line"><ds-text literal strong wrap>${example.label}</ds-text><ds-switch compact monochrome><button type="button" role="switch" aria-checked=${example.enabled} aria-label=${`Publish ${example.label}`} ?disabled=${this.busy.has(example.id)} @click=${() => void this.toggle(example)}>${example.enabled ? 'On' : 'Off'}</button></ds-switch></div>
          <a class="system-preview" href=${`https://designsystem1.com${example.href}`} target="_blank" rel="noopener" aria-label=${`Open ${example.label}`}>${result?.preview ? html`<img src=${result.preview} alt=${`${example.label} preview`} loading="lazy" width="800" height="500">` : html`<ds-text literal>Open preview</ds-text>`}</a>
          <div class="system-line"><ds-button ?disabled=${!result} @click=${() => { this.selected = example.id; history.replaceState(null, '', `/examples?example=${example.id}`); this.updateComplete.then(() => this.querySelector('.system-results')?.scrollIntoView({ block: 'start' })); }}>${score && score.total ? `${score.passed}/${score.total}` : 'Not tested'}</ds-button><ds-text literal tone="muted">${result?.errors.length ? 'Incomplete' : 'Constraint checks'}</ds-text></div>
        </ds-card>`;
      })}</ds-bento>`}`;
  }
  override render() {
    const { isLoading, isAuthenticated } = authState.get();
    if (isLoading) return html`<ds-text literal>Checking your session…</ds-text>`;
    if (!isAuthenticated) return html`<div class="app-shell"><ds1-sign-in private-title="System · Design system 1" .redirectTo=${'/signin'}></ds1-sign-in></div>`;
    if (this.#session.error) return html`<div class="system-site"><ds-text literal tone="danger" role="alert">${this.#session.error}</ds-text><ds-button @click=${this.#session.leave}>Sign out</ds-button></div>`;
    if (!this.#session.ready) return html`<ds-text literal>Checking access…</ds-text>`;
    return html`<ds-page layout="sidebar" class="system-site">
      <div slot="nav" class="system-navigation"><ds-text literal strong>Design system 1</ds-text><ds-text literal tone="muted">System</ds-text>
        <ds-sidebar label="System" .items=${sections.map(name => ({ id: name, label: name, href: `/${name.toLowerCase()}`, current: name === this.section }))}></ds-sidebar>
        <ds-button href="https://designsystem1.com/">Documentation</ds-button><ds-cycle type="theme"></ds-cycle><ds-button @click=${this.#session.leave}>Sign out</ds-button>
      </div>
      <div class="system-content"><ds-text literal size="display" role="heading" aria-level="1">${this.section}</ds-text>
        ${this.section === 'Examples' ? this.catalogue() : this.section === 'Constraints' ? this.constraints() : this.section === 'Architecture' ? html`<ds1-architecture-document></ds1-architecture-document>` : html`<ds1-adoption-document></ds1-adoption-document>`}
      </div>
    </ds-page>`;
  }
}
defineElement('ds1-system-site', SystemSite);
