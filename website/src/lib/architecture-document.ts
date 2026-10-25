import { html } from 'lit';
import { AppElement, defineElement } from '../../../app/src/lib/element';
import { createEditor } from '../vendor/aa/aa.js';
import { defineAaDiagram, diagramAtom } from '../vendor/aa/diagram.js';

defineAaDiagram();

/**
 * The architecture document, read through the owner cookie as Adoption is. It lives in private
 * storage, published from its Ezo note, and Aa draws it read-only with its diagrams.
 */
export class ArchitectureDocument extends AppElement {
  static properties = { error: { state: true }, loaded: { state: true } };
  declare error: string;
  declare loaded: boolean;
  #request?: AbortController;
  #editor?: { destroy?: () => void };
  constructor() { super(); this.error = ''; this.loaded = false; }
  override connectedCallback() { super.connectedCallback(); void this.load(); window.addEventListener('ds1:access-invalidated', this.clear); window.addEventListener('ds1-navigation-auth', this.auth); }
  override disconnectedCallback() { this.#request?.abort(); this.#editor?.destroy?.(); window.removeEventListener('ds1:access-invalidated', this.clear); window.removeEventListener('ds1-navigation-auth', this.auth); super.disconnectedCallback(); }
  auth = (event: Event) => { const detail = (event as CustomEvent).detail; if (detail.loading) return; if (!detail.authenticated || !detail.owner) this.clear(); else if (this.#request?.signal.aborted) void this.load(); };
  clear = () => { this.#request?.abort(); this.#editor?.destroy?.(); this.#editor = undefined; this.loaded = false; this.error = 'Sign in with the owner account to view the architecture.'; };
  async load() {
    this.#request?.abort();
    const request = this.#request = new AbortController();
    this.error = ''; this.loaded = false;
    try {
      const response = await fetch('/api/reports/architecture', { credentials: 'same-origin', cache: 'no-store', signal: request.signal });
      if (!response.ok) throw new Error((await response.json().catch(() => null))?.error || 'The architecture could not be loaded.');
      const text = await response.text();
      if (request.signal.aborted) return;
      this.loaded = true;
      await this.updateComplete;
      const host = this.querySelector<HTMLElement>('[data-architecture]');
      if (!host) return;
      this.#editor?.destroy?.();
      this.#editor = createEditor(host, { value: text, readOnly: true, toolbar: false, menus: false, atoms: [diagramAtom] });
    } catch (error) { if (!request.signal.aborted) this.error = error instanceof Error ? error.message : 'The architecture could not be loaded.'; }
  }
  override render() {
    return html`<div class="architecture-document not-content" data-ds-not-prose>
      ${this.error ? html`<p role="alert">${this.error}</p><ds-button @click=${() => void this.load()}>Try again</ds-button>`
        : this.loaded ? html`<div data-architecture></div>`
        : html`<p role="status">Reading the architecture…</p>`}
    </div>`;
  }
}
defineElement('ds1-architecture-document', ArchitectureDocument);
