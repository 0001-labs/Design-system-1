import { PointerActivity } from './pointer-activity';
import { ContextActivity } from './context-activity';
import { beginMarquee, canStartMarquee, paintCompositionSelection } from './marquee';
import { createSortable, type SortableOptions } from './vendor/drag/sortable';
import { MovementLedger, type C9yFinding } from './c9y-constraints';

/** Custom elements are constructed in the editor's registered realm, then adopted into a sandbox page. */
export function createSurfaceElement<K extends keyof HTMLElementTagNameMap>(doc: Document, name: K): HTMLElementTagNameMap[K];
export function createSurfaceElement(doc: Document, name: string): HTMLElement;
export function createSurfaceElement(doc: Document, name: string): HTMLElement {
  return doc !== document && customElements.get(name) ? doc.adoptNode(document.createElement(name)) : doc.createElement(name);
}

/** The editor's interaction surface. Document adapters own content, never gestures or selection history. */
export class EditorSurface {
  private pointer: PointerActivity;
  private contexts: ContextActivity;
  private cancelSelection?: () => void;
  private paused = false;
  private imageFaces = new Map<HTMLElement, HTMLElement>();
  constructor(readonly root: HTMLElement, private options: {
    selection: () => Set<string>;
    select: (selection: Set<string>) => void;
    marquee: () => boolean;
    reorder: () => boolean;
    beforeMarquee?: () => void;
    contextChanged?: (active: boolean) => void;
    contextRoot?: HTMLElement;
    /** A C9Y constraint broke as it was drawn: show it, so whoever edits sees what moved. */
    constraintBroken?: (finding: C9yFinding) => void;
  }) {
    root.setAttribute('data-editor-surface', '');
    root.ownerDocument.addEventListener('dragstart', this.nativeDrag, true);
    root.ownerDocument.addEventListener('selectstart', this.selectText, true);
    root.ownerDocument.addEventListener('keydown', this.selectAll, true);
    this.pointer = new PointerActivity(root);
    this.contexts = new ContextActivity(root, active => {
      this.paused = active; root.classList.toggle('context-active', active); options.contextChanged?.(active);
    }, options.contextRoot);
  }
  private nativeDrag = (event: DragEvent) => event.preventDefault();
  get contextActive() { return this.paused; }
  private textInput(event: Event) {
    let element = event.composedPath().find(node => (node as Node).nodeType === 1) as HTMLElement | undefined;
    // Selection events can be retargeted to a component's host rather than its editable label.
    while (element?.shadowRoot?.activeElement) element = element.shadowRoot.activeElement as HTMLElement;
    return !!element && (element.isContentEditable || !!element.closest('input,textarea'));
  }
  private onCanvas(event: Event) {
    const target = event.target as Node;
    return this.root.contains(target) || target === this.root.ownerDocument.body || target === this.root.ownerDocument.documentElement;
  }
  private selectText = (event: Event) => { if (this.onCanvas(event) && !this.textInput(event)) event.preventDefault(); };
  private selectAll = (event: KeyboardEvent) => {
    if (!(event.metaKey || event.ctrlKey) || event.altKey || event.key.toLowerCase() !== 'a' || this.textInput(event)) return;
    if (this.onCanvas(event)) {
      event.preventDefault();
      this.root.ownerDocument.getSelection()?.removeAllRanges();
    }
  };
  paintSelection(selection = this.options.selection()) {
    paintCompositionSelection(this.root, selection);
    const replaced = new Set(this.root.querySelectorAll<HTMLElement>('img[data-selection-face],video[data-selection-face],canvas[data-selection-face]'));
    for (const [element, face] of this.imageFaces) if (!replaced.has(element)) { face.remove(); this.imageFaces.delete(element); }
    for (const element of replaced) {
      let face = this.imageFaces.get(element);
      if (!face) { face = this.root.ownerDocument.createElement('span'); face.className = 'consistency-selection-face'; face.setAttribute('data-editor-chrome',''); face.setAttribute('aria-hidden','true'); this.root.append(face); this.imageFaces.set(element,face); }
      const box = element.getBoundingClientRect();
      Object.assign(face.style,{left:`${box.left}px`,top:`${box.top}px`,width:`${box.width}px`,height:`${box.height}px`,borderRadius:this.root.ownerDocument.defaultView!.getComputedStyle(element).borderRadius});
    }
  }
  cancelMarquee() { this.cancelSelection?.(); this.cancelSelection = undefined; }
  startMarquee(event: PointerEvent) {
    const target = event.target as Element;
    if (event.isPrimary && event.button === 0 && !event.shiftKey && !event.metaKey && !event.ctrlKey && !event.altKey && target.closest('aa-editor,ds-card,ds-button,button,input,textarea,select,a,summary,[contenteditable]') && !target.closest('[role="slider"],.consistency-resize-edge')) {
      this.options.select(new Set()); this.paintSelection();
    }
    if (!this.options.marquee() || this.paused || !event.isPrimary || event.button !== 0 || !canStartMarquee(target) || (this.options.reorder() && !event.shiftKey && target.closest('[data-sort-group]'))) return;
    event.preventDefault(); this.cancelMarquee(); this.options.beforeMarquee?.();
    (this.root.ownerDocument.activeElement as HTMLElement | null)?.blur?.();
    this.root.ownerDocument.getSelection()?.removeAllRanges();
    this.cancelSelection = beginMarquee(this.root, event, new Set(this.options.selection()), selection => {
      this.options.select(selection); this.cancelSelection = undefined;
    }, selection => this.paintSelection(selection));
  }
  sortable(options: SortableOptions) {
    return createSortable({
      lockAxis: 'y', inheritProperties: ['--sf', '--ds-sf', '--u'],
      outOfTheWay: { duration: 180, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
      drop: { minDuration: 150, maxDuration: 200, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
      ...options,
      onDragStart: start => { this.cancelMarquee(); options.onDragStart?.(start); },
      onMovement: movement => { this.ledger.record(movement); options.onMovement?.(movement); },
    });
  }
  /** drag.one-movement as it is drawn: the blocks that moved again after release are outlined for a moment. */
  private ledger = new MovementLedger(finding => {
    console.warn(`C9Y constraint ${finding.code}: ${finding.message}`, finding.elements);
    for (const element of finding.elements) {
      element.setAttribute('data-c9y-broken', finding.code);
      setTimeout(() => element.removeAttribute('data-c9y-broken'), 2000);
    }
    this.options.constraintBroken?.(finding);
  });
  destroy() { this.root.ownerDocument.removeEventListener('dragstart', this.nativeDrag, true); this.root.ownerDocument.removeEventListener('selectstart', this.selectText, true); this.root.ownerDocument.removeEventListener('keydown', this.selectAll, true); for (const face of this.imageFaces.values()) face.remove(); this.imageFaces.clear(); this.cancelMarquee(); this.pointer.destroy(); this.contexts.destroy(); this.root.removeAttribute('data-editor-surface'); this.root.classList.remove('context-active'); }
}
