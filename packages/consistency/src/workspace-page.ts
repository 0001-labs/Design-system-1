import { LitElement, html } from 'lit';
import { ConsistencyPageEditor } from './page-editor';
import { validateWorkspacePage, type WorkspacePage } from '../../../shared/consistency-workspace-page';
import type { NativePageSnapshot } from './native-site';
import { libraryTokens } from './libraries';
import { templatePage } from './templates';
import { editableControl } from './control-edit';
import { fontTokens, loadPageFonts, readPageFonts } from './fonts';

/** Workspace persistence owns its revision; this host owns no alternative block editor or history. */
export class WorkspacePageEditor extends LitElement {
  private value?: WorkspacePage;
  private readonly pageEditor = new ConsistencyPageEditor();
  private ready: Promise<boolean> = Promise.resolve(false);
  private detachNavigation?: () => void;
  constructor() {
    super();
    this.pageEditor.addEventListener('page-ready', (event: Event) => {
      const frame = (event as CustomEvent<{frame: HTMLIFrameElement}>).detail.frame;
      if (this.value && frame.contentDocument) loadPageFonts(readPageFonts(this.value.fonts), frame.contentDocument);
      this.detachNavigation?.();
      const doc = frame.contentDocument;
      if (!doc) return;
      const press = (event: MouseEvent) => {
        if (event.defaultPrevented) return;
        const link = event.composedPath().find(node => (node as Element)?.nodeType === 1 && (node as Element).matches('a[href],ds-button[href],ds-link[href]')) as Element | undefined;
        if (!link) return;
        // A srcdoc anchor otherwise resolves against the editor URL and loads the shell inside itself.
        event.preventDefault();
        const control = editableControl(event.composedPath()[0] as Node, doc.body);
        if (link.matches('[disabled],[aria-disabled="true"]') || control?.matches('[disabled],[aria-disabled="true"]')) return;
        if (control?.hasAttribute('data-c9y-control-editing') && !event.metaKey && !event.ctrlKey) return;
        const href = link.getAttribute('href') ?? '';
        if (!href.startsWith('#')) {
          const base = new URL(templatePage(this.value?.example ?? '')?.href ?? '/', 'https://designsystem1.com');
          let destination: URL;
          try { destination = new URL(href, base); } catch { return; }
          if (['https:', 'http:', 'mailto:', 'tel:'].includes(destination.protocol) && destination.origin !== location.origin)
            window.open(destination.href, '_blank', 'noopener,noreferrer');
          return;
        }
        let id = href.slice(1);
        try { id = decodeURIComponent(id); } catch { return; }
        if (id) doc.getElementById(id)?.scrollIntoView();
        else frame.contentWindow?.scrollTo(0, 0);
      };
      const hold = (event: Event) => event.preventDefault();
      doc.addEventListener('click', press, true);
      doc.addEventListener('auxclick', hold, true);
      doc.addEventListener('submit', hold, true);
      this.detachNavigation = () => { doc.removeEventListener('click', press, true); doc.removeEventListener('auxclick', hold, true); doc.removeEventListener('submit', hold, true); };
    });
  }
  createRenderRoot() { return this; }
  loadDocument(value: unknown) {
    if (this.isConnected) throw new Error('Load the page before mounting its editor.');
    this.value = validateWorkspacePage(value);this.setAttribute('example',this.value.example);
  }
  connectedCallback() { super.connectedCallback(); void this.mountPage(); }
  disconnectedCallback() {
    this.detachNavigation?.();
    if (this.value) this.value = this.readDocument() as unknown as WorkspacePage;
    super.disconnectedCallback();
  }
  private async mountPage() {
    await this.updateComplete;
    if (!this.isConnected || !this.value) return;
    const snapshot: NativePageSnapshot = {kind:'native',path:'/',build:'workspace',base:'workspace',revision:0,document:this.value.page,images:[],collections:{},components:templatePage(this.value.example)?.components};
    const tokens = {...libraryTokens(this.value.library), ...fontTokens(readPageFonts(this.value.fonts))};
    const styles = `${templatePage(this.value.example)?.library??''}\n:root{${Object.entries(tokens).map(([key,value]) => `${key}:${value}`).join(';')}}`;
    this.ready = this.pageEditor.open(snapshot, async value => ({...snapshot,...value,revision:value.revision+1}), {styles});
  }
  readDocument(): Record<string, unknown> {
    if (!this.value) throw new Error('No page is open.');
    let page = this.value.page;
    try { page = this.pageEditor.readDocument(); } catch { /* Before the first canvas mounts, retain the loaded page. */ }
    return {...this.value,page};
  }
  async flush() { await this.updateComplete; await this.ready; return this.pageEditor.flush(); }
  render() { return html`${this.pageEditor}`; }
}
customElements.define('consistency-workspace-page', WorkspacePageEditor);
