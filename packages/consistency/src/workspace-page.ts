import { LitElement, html } from 'lit';
import { ConsistencyPageEditor } from './page-editor';
import { validateWorkspacePage, type WorkspacePage } from '../../../shared/consistency-workspace-page';
import type { NativePageSnapshot } from './native-site';
import { libraryTokens } from './libraries';
import { fontTokens, loadPageFonts, readPageFonts } from './fonts';

/** Workspace persistence owns its revision; this host owns no alternative block editor or history. */
export class WorkspacePageEditor extends LitElement {
  private value?: WorkspacePage;
  private readonly pageEditor = new ConsistencyPageEditor();
  private ready: Promise<boolean> = Promise.resolve(false);
  constructor() {
    super();
    this.pageEditor.addEventListener('page-ready', (event: Event) => {
      const frame = (event as CustomEvent<{frame: HTMLIFrameElement}>).detail.frame;
      if (this.value && frame.contentDocument) loadPageFonts(readPageFonts(this.value.fonts), frame.contentDocument);
    });
  }
  createRenderRoot() { return this; }
  loadDocument(value: unknown) {
    if (this.isConnected) throw new Error('Load the page before mounting its editor.');
    this.value = validateWorkspacePage(value);
  }
  connectedCallback() { super.connectedCallback(); void this.mountPage(); }
  disconnectedCallback() {
    if (this.value) this.value = this.readDocument() as unknown as WorkspacePage;
    super.disconnectedCallback();
  }
  private async mountPage() {
    await this.updateComplete;
    if (!this.isConnected || !this.value) return;
    const snapshot: NativePageSnapshot = {kind:'native',path:'/',build:'workspace',base:'workspace',revision:0,document:this.value.page,images:[],collections:{}};
    const tokens = {...libraryTokens(this.value.library), ...fontTokens(readPageFonts(this.value.fonts))};
    const styles = `:root{${Object.entries(tokens).map(([key,value]) => `${key}:${value}`).join(';')}}`;
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
