import { html, nothing } from 'lit';
import { AppElement, defineElement } from '../../../app/src/lib/element';
import type { AdoptionReport } from '../../../shared/component-adoption';
import '../../../app/src/screens/ComponentMatrix';
import '../../../app/src/screens/ComponentGlossary';

/** The document reads through its existing server-checked owner cookie, without booting the app. */
export class AdoptionDocument extends AppElement {
  static properties = { report: { state: true }, error: { state: true } };
  declare report: AdoptionReport | null;
  declare error: string;
  #request?: AbortController;
  constructor() { super(); this.report = null; this.error = ''; }
  override connectedCallback() { super.connectedCallback(); void this.load(); window.addEventListener('ds1:access-invalidated', this.clear); window.addEventListener('ds1-navigation-auth', this.auth); }
  override disconnectedCallback() { this.#request?.abort(); window.removeEventListener('ds1:access-invalidated', this.clear); window.removeEventListener('ds1-navigation-auth', this.auth); super.disconnectedCallback(); }
  auth = (event: Event) => { const detail = (event as CustomEvent).detail; if (detail.loading) return; if (!detail.authenticated || !detail.owner) this.clear(); else if (this.#request?.signal.aborted) void this.load(); };
  clear = () => { this.#request?.abort(); this.report = null; this.error = 'Sign in with the owner account to view adoption.'; };
  async load() {
    this.#request?.abort();
    const request = this.#request = new AbortController();
    this.report = null; this.error = '';
    try {
      const response = await fetch('/api/reports/components', { credentials: 'same-origin', cache: 'no-store', signal: request.signal });
      const report = await response.json();
      if (!response.ok) throw new Error(report.error || 'The report could not be loaded.');
      if (report.schema !== 1 || !Array.isArray(report.apps) || !Array.isArray(report.columns)) throw new Error('The report format is not supported.');
      if (!request.signal.aborted) this.report = report;
    } catch (error) { if (!request.signal.aborted) this.error = error instanceof Error ? error.message : 'The report could not be loaded.'; }
  }
  override render() {
    return html`<div class="adoption adoption-document not-content" data-ds-not-prose>
      ${this.error ? html`<p role="alert">${this.error}</p><ds-button @click=${() => void this.load()}>Try again</ds-button>`
        : this.report ? html`<ds1-component-matrix .report=${this.report}></ds1-component-matrix><ds1-icon-matrix .report=${this.report}></ds1-icon-matrix>`
        : html`<p role="status">Reading the source snapshot…</p>`}
      ${this.report ? html`<section id="glossary"><h2>Component glossary</h2><ds1-component-glossary document></ds1-component-glossary></section>` : nothing}
    </div>`;
  }
}
defineElement('ds1-adoption-document', AdoptionDocument);
