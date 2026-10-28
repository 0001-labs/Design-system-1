import { LitElement, html } from 'lit';
import { nativePageStyles, renderNativePage, type NativePageDocument } from '../../../shared/consistency-native-page';
import { NativeSiteController, type NativePageSnapshot, type NativePageSave } from './native-site';
import baseStyles from '../../../DS1/1-root/one.css?inline';
import './site-editor.css';

/**
 * A host-independent page document editor. The host supplies a
 * snapshot, its trusted page shell and the persistence transport; blocks and gestures never vary
 * by host. The shell is build-owned, never accepted from a saved document.
 */
export class ConsistencyPageEditor extends LitElement {
  private controller?: NativeSiteController;
  private snapshot?: NativePageSnapshot;
  private save?: NativePageSave;
  private source = '';
  private generation = 0;
  private ready: Promise<boolean> = Promise.resolve(false);
  private settle?: (ready: boolean) => void;
  private readonly frame = Object.assign(document.createElement('iframe'), { className: 'consistency-site-frame', title: 'Page to edit' });
  private readonly unloading = (event: BeforeUnloadEvent) => { if (this.pending) { event.preventDefault(); event.returnValue = ''; } };
  constructor() {
    super();
    this.frame.setAttribute('sandbox', 'allow-same-origin');
    this.frame.addEventListener('load', () => this.mount());
  }
  createRenderRoot() { return this; }
  connectedCallback() { super.connectedCallback(); addEventListener('beforeunload', this.unloading); }
  disconnectedCallback() { super.disconnectedCallback(); this.destroy(); removeEventListener('beforeunload', this.unloading); }
  destroy() { this.controller?.destroy(); this.controller = undefined; this.settle?.(false); }
  /** Call after flushing the previous document. A supplied URL is the authenticated, script-free site canvas. */
  open(snapshot: NativePageSnapshot, save: NativePageSave, source?: { url: string } | { styles: string }) {
    this.controller?.destroy(); this.controller = undefined; this.settle?.(false);
    this.snapshot = structuredClone(snapshot); this.save = save; this.generation++;
    this.ready = new Promise(resolve => { this.settle = resolve; });
    this.source = source && 'url' in source ? source.url : '';
    if (this.source) { this.frame.removeAttribute('srcdoc'); this.frame.src = this.source; }
    else {
      this.frame.removeAttribute('src');
      const page = renderNativePage(snapshot.document, { images: snapshot.images, collections: snapshot.collections, editor: true });
      this.frame.srcdoc = `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>${baseStyles}\n${nativePageStyles}\n${source && 'styles' in source ? source.styles : ''}\nhtml{--sf:1;--ds-sf:1}body{margin:0}</style></head><body>${page}</body></html>`;
    }
    this.requestUpdate();
    return this.ready;
  }
  private mount() {
    if (!this.snapshot || !this.save || !this.isConnected) return;
    const root = this.frame.contentDocument?.querySelector('[data-c9y-native-root]');
    if (!root) { this.settle?.(false); return; }
    const base = this.frame.contentDocument?.documentElement.getAttribute('data-c9y-native-base');
    if (base && base !== this.snapshot.base) { this.settle?.(false); this.dispatchEvent(new CustomEvent('page-reopen', { bubbles: true })); return; }
    const snapshot = this.snapshot, save = this.save, generation = this.generation;
    this.controller?.destroy();
    this.controller = new NativeSiteController(this.frame, snapshot, async value => {
      const accepted = await save(value);
      if (generation === this.generation) this.snapshot = accepted;
      return accepted;
    }, () => this.dispatchEvent(new CustomEvent('page-reopen', { bubbles: true })), {
      changed: () => this.dispatchEvent(new CustomEvent('consistency-change', { bubbles: true })),
      imageURL: this.source ? undefined : source => source,
    });
    this.settle?.(true); this.settle = undefined;
    this.dispatchEvent(new CustomEvent('page-ready', { detail: { frame: this.frame }, bubbles: true }));
  }
  get pending() { return this.controller?.pending ?? false; }
  readDocument(): NativePageDocument { if (!this.snapshot) throw new Error('No page is open.'); return structuredClone(this.controller?.state.document ?? this.snapshot.document); }
  async flush() {
    await this.ready;
    // A rejected canvas has no editable controller or local changes; let the host reopen it.
    return this.controller ? this.controller.flush() : true;
  }
  render() { return html`<div class="consistency-site-stage">${this.frame}</div>`; }
}
customElements.define('consistency-page-editor', ConsistencyPageEditor);
