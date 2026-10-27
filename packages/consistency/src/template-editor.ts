import '../../../DS1/index';
import { createSurfaceElement } from './editor-surface';
import { createPlainEditor } from '../../../website/src/vendor/aa/aa';
import { SiteCompositionController } from './site-composition';
import type { SiteCompositionNode, SiteCompositionDocument } from './site-composition-state';
import { siteTemplate } from './templates';
import baseStyles from '../../../DS1/1-root/one.css?inline';

/** Authored DS1 pages, drawn at reading size in the production editor's script-free frame. */
export class TemplateEditor extends HTMLElement {
  template = 'blank';
  private fields: Record<string, string> = {};
  private editors: Array<{ key: string; initial: string; editor: ReturnType<typeof createPlainEditor> }> = [];
  private controller?: SiteCompositionController;
  private layout: SiteCompositionDocument = { schema: 1, nodes: {}, order: {} };
  private frame = document.createElement('iframe');
  private ready = false;
  private restoring = false;
  set values(value: Record<string, string>) {
    this.fields = { ...value };
    if (this.controller && value.__layout && JSON.stringify(this.controller.state.document) !== value.__layout) {
      this.restoring = true;
      try { this.controller.state.commit(JSON.parse(value.__layout) as SiteCompositionDocument); }
      finally { this.restoring = false; }
    }
    for (const entry of this.editors) { const next = value[entry.key] ?? entry.initial; if (entry.editor.value !== next) entry.editor.value = next; }
  }
  readValues() { return { ...this.fields, __authored: '1', __layout: JSON.stringify(this.controller?.state.document ?? this.layout) }; }
  async flush() { return this.controller ? this.controller.flush() : this.ready; }
  connectedCallback() {
    this.classList.add('consistency-template');
    this.frame.title = `${siteTemplate(this.template)?.label ?? 'Site'} to edit`;
    this.frame.setAttribute('sandbox', 'allow-same-origin');
    this.frame.addEventListener('load', () => void this.mount(), { once: true });
    this.frame.srcdoc = '<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body></body></html>';
    this.append(this.frame);
  }
  private changed() {
    if (this.restoring) return;
    this.dispatchEvent(new CustomEvent('template-change', { detail: this.readValues(), bubbles: true }));
  }
  private async mount() {
    const sample = siteTemplate(this.template); if (!sample || !this.isConnected) return;
    const doc = this.frame.contentDocument!;
    const style = doc.createElement('style');
    style.textContent = baseStyles + '\nhtml{--sf:1;--ds-sf:1}body{margin:0;background:var(--ds-paper);color:var(--ds-text-color);font:14px/20px var(--ds-typeface-regular)}.aa-plain,.aa-plain>.aa-block{font:inherit;color:inherit;line-height:inherit;margin:0;padding:0;min-height:0;outline:none;background:none}.template-text{font:inherit;line-height:inherit}';
    doc.head.append(style);
    const library = doc.createElement('style'); library.textContent = sample.library; doc.head.append(library);
    const fragment = doc.createElement('template'); fragment.innerHTML = sample.html;
    fragment.content.querySelectorAll('script,iframe,object,embed,base').forEach(element => element.remove());
    fragment.content.querySelectorAll<HTMLElement>('*').forEach(element => {
      for (const attribute of [...element.attributes]) if (/^on/i.test(attribute.name)) element.removeAttribute(attribute.name);
      for (const key of ['src', 'poster', 'href']) { const value = element.getAttribute(key); if (value?.startsWith('/')) element.setAttribute(key, `https://designsystem1.com${value}`); }
    });
    doc.body.append(fragment.content);
    // Upgrade in the registered realm; canonical component styles follow the element into the frame.
    for (const source of [...doc.body.querySelectorAll<HTMLElement>('*')]) {
      if (!customElements.get(source.localName)) continue;
      const replacement = createSurfaceElement(doc, source.localName);
      for (const attribute of source.attributes) replacement.setAttribute(attribute.name, attribute.value);
      replacement.append(...source.childNodes); source.replaceWith(replacement);
      Object.assign(replacement, structuredClone(sample.components[replacement.dataset.templateNode!] ?? {}));
    }
    await Promise.all([...doc.querySelectorAll('*')].map(element => (element as HTMLElement & { updateComplete?: Promise<unknown> }).updateComplete));
    if (!this.isConnected) return;
    const nodes: SiteCompositionNode[] = [];
    doc.body.dataset.c9yNode = 'root';
    const placed = [doc.body, ...doc.body.querySelectorAll<HTMLElement>('[data-template-node]')].filter(element => !element.matches('style,script,svg,svg *,option'));
    for (const element of placed) {
      const id = element.dataset.c9yNode = element.dataset.templateNode ?? 'root';
      const kind = element === doc.body ? 'root' : element.matches('ds-card') ? 'card' : element.matches('ds-button,button,a') ? 'button' : element.matches('ds-stat') ? 'stat' : element.matches('ds-carousel') ? 'carousel' : element.matches('img,ds-image') ? 'image' : element.matches('ds-text,h1,h2,h3,h4,p,span') ? 'text' : 'container';
      const caps: SiteCompositionNode['capabilities'] = ['width'];
      if (kind !== 'root') caps.push('marginTop', 'marginBottom', 'hide', 'reorder', 'place');
      if (kind === 'root' || kind === 'container') caps.push('gap', 'padding', 'insert');
      if (kind === 'card' || kind === 'carousel' || kind === 'image') caps.push('height');
      if (kind === 'card' || kind === 'stat' || kind === 'button') caps.push('design');
      nodes.push({ id, kind, tag: element.localName, parent: element === doc.body ? null : element.parentElement?.closest<HTMLElement>('[data-template-node]')?.dataset.templateNode ?? 'root', children: [], label: element.getAttribute('aria-label') ?? element.textContent?.trim().slice(0, 60) ?? element.localName, capabilities: caps });
    }
    for (const node of nodes) if (node.parent) nodes.find(parent => parent.id === node.parent)?.children.push(node.id);
    const stored = this.fields.__layout;
    if (stored) { try { this.layout = JSON.parse(stored) as SiteCompositionDocument; } catch { /* earlier document without geometry */ } }
    this.controller = new SiteCompositionController(this.frame, { path: '/', build: `template-${this.template}`, base: '1', revision: 0, document: this.layout, nodes }, async value => {
      this.layout = structuredClone(value.document); this.changed();
      return { ...value, path: '/', nodes, revision: value.revision + 1 };
    }, async () => true, [], undefined, () => this.changed());
    this.bindText(doc.body, 'page');
    const shadows = (root: ParentNode, prefix: string) => {
      root.querySelectorAll<HTMLElement>('*').forEach((element, index) => {
        if (element.shadowRoot) { const key = element.dataset.templateNode ?? `${prefix}-${index}`; this.bindText(element.shadowRoot, key); shadows(element.shadowRoot, key); }
      });
    };
    shadows(doc.body, 'page');
    doc.addEventListener('click', event => { if ((event.target as Element).closest('a,[href]')) event.preventDefault(); }, true);
    doc.addEventListener('submit', event => event.preventDefault(), true);
    this.ready = true;
    this.dispatchEvent(new Event('template-ready', { bubbles: true }));
  }
  private bindText(root: HTMLElement | ShadowRoot, prefix: string) {
    const doc = root.ownerDocument;
    const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const texts: Text[] = [];
    while (walker.nextNode()) {
      const text = walker.currentNode as Text;
      if (!text.textContent?.trim() || text.parentElement?.closest('style,script,svg,option,textarea,[data-editor-chrome],[contenteditable],.aa-plain')) continue;
      texts.push(text);
    }
    texts.forEach((text, index) => {
      const initial = text.textContent!, key = `template:${prefix}:${index}`;
      const host = doc.createElement('span'); host.className = 'template-text'; text.replaceWith(host);
      const editor = createPlainEditor(host, { value: this.fields[key] ?? initial, onChange: value => { this.fields = { ...this.fields, [key]: value }; this.changed(); } });
      editor.element.setAttribute('aria-label', `Edit ${initial.trim().slice(0, 80)}`);
      this.editors.push({ key, initial, editor });
    });
    if (root instanceof ShadowRoot) { const style = doc.createElement('style'); style.textContent = '.template-text,.aa-plain,.aa-block{font:inherit;color:inherit;line-height:inherit;margin:0;padding:0;min-height:0;outline:none;background:none}'; root.append(style); }
  }
  disconnectedCallback() { this.controller?.destroy(); this.editors.forEach(entry => entry.editor.destroy()); this.editors = []; this.ready = false; this.replaceChildren(); }
}
customElements.define('consistency-template', TemplateEditor);
