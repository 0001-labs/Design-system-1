import { createSurfaceElement } from './editor-surface';
import '../../../DS1/2-core/ds-button';

export function composedParent(node: Node): Node | null {
  return node.parentNode ?? (node.nodeType === 11 ? (node as ShadowRoot).host : null);
}
export function composedContains(parent: Node, child: Node | null): boolean {
  for (let node = child; node; node = composedParent(node)) if (node === parent) return true;
  return false;
}
/** Resolve the authored control, including a DS1 button's nested shadow label. */
export function editableControl(node: Node | null, root: HTMLElement): HTMLElement | undefined {
  let found: HTMLElement | undefined;
  for (let current = node; current && current !== root; current = composedParent(current)) {
    if (current.nodeType !== 1) continue;
    const element = current as HTMLElement;
    if (element.matches('[data-editor-chrome]')) return;
    if (element.localName === 'ds-button' && composedContains(root, element)) return element;
    if (!found && element.matches('a[href],button,ds-link[href],[role="button"]')) found = element;
  }
  return found && composedContains(root, found) ? found : undefined;
}

/** One transient editing action; the site's actual control keeps its normal press. */
export class ControlEdit {
  private readonly action = createSurfaceElement(document, 'ds-button');
  private target?: HTMLElement;
  private timer?: ReturnType<typeof setTimeout>;
  private readonly view: Window;
  private readonly resize: ResizeObserver;
  private readonly changes: MutationObserver;
  constructor(private frame: HTMLIFrameElement, private root: HTMLElement,
    private enabled: () => boolean, private edit: (target: HTMLElement) => void) {
    this.view = root.ownerDocument.defaultView!;
    this.action.textContent = 'Edit';
    this.action.setAttribute('secondary', '');
    this.action.setAttribute('data-editor-chrome', '');
    this.action.className = 'consistency-control-edit';
    this.action.style.cssText = 'position:fixed;z-index:2147482100;--sf:1;--ds-sf:1';
    this.action.hidden = true;
    document.body.append(this.action);
    this.action.addEventListener('pointerenter', this.keep);
    this.action.addEventListener('pointerleave', this.leave);
    this.action.addEventListener('focusin', this.keep);
    this.action.addEventListener('focusout', this.leave);
    this.action.addEventListener('click', this.activate);
    root.ownerDocument.addEventListener('pointerover', this.over);
    root.ownerDocument.addEventListener('pointerout', this.leave);
    root.ownerDocument.addEventListener('focusin', this.over);
    root.ownerDocument.addEventListener('keydown', this.key, true);
    root.ownerDocument.addEventListener('click', this.hide, true);
    this.resize = new ResizeObserver(() => { if (!this.enabled()) this.hide(); else this.place(); });
    this.resize.observe(frame);
    this.resize.observe(this.action);
    // An inline link otherwise inherits Aa's writing surface. WebKit selects its
    // text before a press can follow it; only its Edit action enters that text.
    this.changes = new MutationObserver(this.protectLinks);
    this.changes.observe(root, { childList: true, subtree: true });
    this.protectLinks();
    this.view.addEventListener('scroll', this.hide, true);
    this.view.addEventListener('resize', this.hide);
    window.addEventListener('scroll', this.hide, true);
    window.addEventListener('resize', this.hide);
  }
  private keep = () => clearTimeout(this.timer);
  private protectLinks = () => {
    for (const link of this.root.querySelectorAll<HTMLElement>('aa-editor a.aa-link[href]')) {
      if (!link.hasAttribute('data-c9y-control-editing')) link.contentEditable = 'false';
    }
  };
  private leave = () => { this.keep(); this.timer = setTimeout(this.hide, 180); };
  private over = (event: Event) => {
    const target = editableControl(event.composedPath()[0] as Node, this.root);
    if (!target || !this.enabled() || target.hasAttribute('data-c9y-control-editing')) { this.leave(); return; }
    this.keep();
    if(this.target!==target){if(this.target)this.resize.unobserve(this.target);this.target=target;this.resize.observe(target);}
    this.action.hidden = false; this.place();
  };
  private place = () => {
    if(this.action.hidden)return;
    if(!this.target?.isConnected){this.hide();return;}
    const box=this.target.getBoundingClientRect(),frame=this.frame.getBoundingClientRect(),action=this.action.getBoundingClientRect();
    const width=action.width||40,height=action.height||20;
    this.action.style.left=`${Math.max(0,Math.min(innerWidth-width,frame.left+box.left+(box.width-width)/2))}px`;
    this.action.style.top=`${Math.max(0,frame.top+box.top-height-2)}px`;
  };
  private activate = (event: Event) => {
    event.preventDefault(); event.stopPropagation();
    const target = this.target; this.hide();
    if (target?.isConnected && this.enabled()) this.edit(target);
  };
  private key = (event: KeyboardEvent) => {
    if (event.key === 'Escape') this.hide();
    if (event.key !== 'F2') return;
    const target = editableControl(event.composedPath()[0] as Node, this.root);
    if (target && this.enabled()) { event.preventDefault(); event.stopPropagation(); this.hide(); this.edit(target); }
  };
  hide = () => { this.keep(); if(this.target)this.resize.unobserve(this.target); this.action.hidden = true; this.target = undefined; };
  destroy() {
    this.hide(); this.action.remove();
    const doc = this.root.ownerDocument;
    doc.removeEventListener('pointerover', this.over); doc.removeEventListener('pointerout', this.leave);
    doc.removeEventListener('focusin', this.over); doc.removeEventListener('keydown', this.key, true);
    doc.removeEventListener('click', this.hide, true); this.resize.disconnect(); this.changes.disconnect();
    this.view.removeEventListener('scroll', this.hide, true); this.view.removeEventListener('resize', this.hide);
    window.removeEventListener('scroll', this.hide, true); window.removeEventListener('resize', this.hide);
  }
}
