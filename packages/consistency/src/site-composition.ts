import { EditorSurface, createSurfaceElement } from './editor-surface';
import { TextSpacingLayer, type SpacingTarget } from './text-spacing';
import { bindResizeEdges, cardMinimumWidth, cardMinimumHeight, type ElementSize } from './resize';
import { canStartMarquee } from './marquee';
import { createSurfaceContext, appendSurfaceOptions } from './surface-context';
import { siteSurfacePatch, sitePagePatch, SITE_SURFACE_ATTRIBUTES, SITE_SURFACE_CLASSES, SITE_SURFACE_STYLES, SITE_PAGE_STYLES, type SiteDesignPatch } from '../../../shared/consistency-site-design';
import { createButtonActionControls } from './button-action';
import { readAction } from '../../../shared/consistency-content';
import { PAGE_TONES } from './page-context';
import { SiteNativeRegions } from './site-native-regions';
import { CardSpacingLayer } from './card-spacing';
import { StatSpacingLayer } from './stat-spacing';
import { CompositionSettle } from './settle';
import { blockReorders } from './c9y-constraints';
import { reorder } from './vendor/drag/util';
import type { SortableController } from './vendor/drag/sortable';
import { createPlainEditor, sidePlacement } from '../../../website/src/vendor/aa/aa';
import { renderMarkdown } from './vendor/site-engine/markdown';
import { SiteCompositionState, siteMeasureRange, type CompositionSave, type SiteCompositionNode, type SiteCompositionSnapshot, type SiteInsertion, type SiteNodeProperty, type SiteNodeStyle } from './site-composition-state';
import surfaceStyles from './editor-surface.css?inline';
import spacingStyles from './text-spacing.css?inline';
import resizeStyles from './resize.css?inline';
import aaStyles from '../../../website/src/vendor/aa/aa.css?inline';
import elementsStyles from './elements.css?inline';
import insertionStyles from './insertions.css?inline';
import carouselStyles from './carousel.css?inline';
import columnStyles from './column-spacing.css?inline';
import cardStyles from './card-spacing.css?inline';
import statStyles from './stat-spacing.css?inline';
import './site-composition.css';


type Space = { id: string; property: SiteNodeProperty; before?: string; target: SpacingTarget };
const measureProperties: SiteNodeProperty[] = ['gap', 'padding', 'width', 'height', 'marginTop', 'marginBottom'];
const cssProperty = (property: string) => property.replace(/[A-Z]/g, letter => '-' + letter.toLowerCase());

/** The actual editor surface over a site's authored document. Only this adapter knows its storage. */
export class SiteCompositionController {
  readonly state: SiteCompositionState;
  private readonly doc: Document;
  private readonly view: Window;
  private readonly baseNodes = new Map<string, SiteCompositionNode>();
  private readonly nodes = new Map<string, SiteCompositionNode>();
  private readonly elements = new Map<string, HTMLElement>();
  private readonly defaultGaps = new Map<string, Record<string,number>>();
  private readonly originals = new Map<string, { style: string; hidden: boolean }>();
  private readonly originalDesign = new Map<string, { attributes: Record<string,string|null>; classes: Record<string,boolean> }>();
  private readonly originalOrder = new Map<string, Node[]>();
  private readonly annotations = new Map<HTMLElement, Record<string, string | null>>();
  private readonly overlay: HTMLElement;
  private readonly surface: EditorSurface;
  private readonly spacing: TextSpacingLayer;
  private readonly settle = new CompositionSettle();
  private readonly resize: ResizeObserver;
  private readonly spaces = new Map<string, Space>();
  private readonly resizers = new Map<string, { edges: HTMLElement[]; dispose: () => void }>();
  private readonly regions: SiteNativeRegions;
  private readonly cards: CardSpacingLayer;
  private readonly stats: StatSpacingLayer;
  private readonly sortItems = new Map<string, () => void>();
  private readonly sortParents = new Map<string, string>();
  private readonly sortContainers = new Map<string, () => void>();
  private readonly disposers: Array<() => void> = [];
  private readonly notice = document.createElement('div');
  private sort: SortableController;
  private menu?: ReturnType<typeof createSurfaceContext>;
  private menuDispose?: () => void;
  private selection = new Set<string>();
  private selected = '';
  private carried?: { id: string; from: string; ids: string[]; rects: DOMRect[]; x: number; y: number };
  private beside?: { id: string; at: 'start' | 'end' };
  private readonly sideLine: HTMLElement;
  private busy = false;
  private disposed = false;
  private contentError = '';
  private frameRequest = 0;
  private insertionEditor?: { id: string; editor: ReturnType<typeof createPlainEditor> };

  constructor(private readonly frame: HTMLIFrameElement, snapshot: SiteCompositionSnapshot, save: CompositionSave, private readonly beforeEdit: () => Promise<boolean>, private readonly images: string[] = [], private readonly reopen?: () => void) {
    this.doc = frame.contentDocument!; this.view = this.doc.defaultView!;
    this.state = new SiteCompositionState(snapshot, save, () => this.changed());
    for (const node of snapshot.nodes) { this.nodes.set(node.id, structuredClone(node)); this.baseNodes.set(node.id, structuredClone(node)); }
    for (const source of this.doc.querySelectorAll<HTMLElement>('[data-c9y-node]')) if (customElements.get(source.localName) && !source.shadowRoot) { const replacement = createSurfaceElement(this.doc, source.localName); for (const attr of source.attributes) replacement.setAttribute(attr.name, attr.value); replacement.append(...source.childNodes); source.replaceWith(replacement); }
    for (const element of this.doc.querySelectorAll<HTMLElement>('[data-c9y-node]')) {
      const id = element.dataset.c9yNode!; if (!this.nodes.has(id)) continue;
      this.elements.set(id, element);
      const beforeDesign = element.getAttribute('data-c9y-original-design');
      this.originalDesign.set(id,beforeDesign ? JSON.parse(beforeDesign) : {attributes:Object.fromEntries(SITE_SURFACE_ATTRIBUTES.map(key=>[key,element.getAttribute(key)])),classes:Object.fromEntries(SITE_SURFACE_CLASSES.map(key=>[key,element.classList.contains(key)]))});
      this.originals.set(id, { style: element.getAttribute('data-c9y-original-style') ?? element.getAttribute('style') ?? '', hidden: element.hasAttribute('data-c9y-original-hidden') });
      this.originalOrder.set(id, [...element.childNodes]);
      this.annotate(element, 'data-selectable', id);
      if (this.nodes.get(id)!.capabilities.includes('reorder')) this.annotate(element, 'data-sort-group', id);
    }
    this.overlay = this.doc.createElement('div');
    this.overlay.className = 'consistency-shell production-on consistency-text-bounds consistency-site-guides'; this.overlay.setAttribute('data-editor-chrome', '');
    const tokens = getComputedStyle(document.documentElement);
    for (const name of ['--ds-pink','--ds-text-color','--ds-paper','--ds-radius','--ds-type-size-small','--ds-typeface-regular']) this.overlay.style.setProperty(name, tokens.getPropertyValue(name));
    this.overlay.style.setProperty('--sf', '1'); this.overlay.style.setProperty('--u', '20px'); this.overlay.style.setProperty('--ds-unit', '20px');
    this.doc.body.append(this.overlay);
    this.sideLine = this.doc.createElement('div'); this.sideLine.className = 'aa-drop-line aa-drop-side'; this.sideLine.hidden = true; this.overlay.append(this.sideLine);
    const style = this.doc.createElement('style'); style.textContent = surfaceStyles + spacingStyles + resizeStyles + aaStyles + elementsStyles + insertionStyles + carouselStyles + columnStyles + cardStyles + statStyles + '\n.consistency-site-guides{position:fixed;inset:0;pointer-events:none;z-index:2147482000;overflow:visible}.consistency-site-guides [hidden]{display:none!important}.consistency-site-guides .ghost-surface,.consistency-site-guides .consistency-resize-edge{pointer-events:auto}.consistency-site-guides .ghost-measure{font-family:var(--ds-typeface-regular);font-size:10px;line-height:20px}.consistency-site-guides .ghost-surface{min-height:0}.consistency-site-guides .consistency-resize-edge{position:absolute}.consistency-site-region{position:relative;min-width:0}.consistency-site-region>aa-editor{display:block;min-width:0}';
    this.doc.head.append(style); this.disposers.push(() => style.remove());
    this.doc.body.style.setProperty('--consistency-selection-color',tokens.getPropertyValue('--ds-text-color'));
    this.annotate(this.doc.body, 'class', `${this.doc.body.className} consistency-sheet production-on`);
    for (const name of ['--ds-pink','--ds-text-color']) if (!this.view.getComputedStyle(this.doc.body).getPropertyValue(name)) this.doc.body.style.setProperty(name,tokens.getPropertyValue(name));
    this.regions = new SiteNativeRegions(this.state, { enabled: () => this.active() && !this.surface.contextActive, select: () => {}, media: { chooseImage: anchor => this.chooseImage(anchor) }, imageURL: source => source.startsWith('/') && this.images.includes(source) ? new URL(this.frame.src).pathname.replace(/\/document$/, '/files') + source : source, error: message => { this.contentError = message; this.showStatus(); } });
    this.cards = new CardSpacingLayer(this.doc.body, { accept: card => !card.closest('aa-editor'), enabled: () => this.active() && !this.surface.contextActive, consistency: () => false, gaps: id => this.sourceGaps(id), commit: (id,key,value,height) => this.state.patch(id,{height,design:{...this.state.document.nodes[id]?.design,gaps:{...this.state.document.nodes[id]?.design?.gaps,[key]:value}}}) });
    this.stats = new StatSpacingLayer(this.doc.body, { enabled: () => this.active() && !this.surface.contextActive, value: key => { const [,id,part] = key.split(':'); return this.sourceGaps(id)[part] ?? 0; }, commit: (key,value) => { const [,id,part] = key.split(':'); this.state.patch(id,{design:{...this.state.document.nodes[id]?.design,gaps:{...this.state.document.nodes[id]?.design?.gaps,[part]:value}}}); } });
    this.surface = new EditorSurface(this.doc.body, { selection: () => this.selection, select: selection => this.selectMany(selection), marquee: () => this.active(), reorder: () => this.active(), beforeMarquee: () => this.settle.cancel(), contextRoot: document.body, constraintBroken: finding => { this.contentError = `${finding.message} (${finding.code})`; this.showStatus(); }, contextChanged: active => { this.overlay.classList.toggle('context-active', active); this.spacing?.refresh(); this.draw(); } });
    this.spacing = new TextSpacingLayer(this.doc.body, {
      targets: () => this.spacingTargets(), enabled: () => this.active() && !this.surface.contextActive,
      value: (key, fallback) => { const space = this.spaces.get(key); return space ? this.state.document.nodes[space.id]?.[space.property] as number ?? fallback : fallback; },
      select: key => { const space = this.spaces.get(key); if (space) this.selected = space.id; },
      preview: (key, value) => { const space = this.spaces.get(key); if (space) { this.apply(this.elements.get(space.id)!, space.property, value); if (space.before) this.apply(this.elements.get(space.before)!, 'marginBottom', 0); this.schedule(); } },
      commit: (key, value) => { const space = this.spaces.get(key); if (space) { const nodes = { ...this.state.document.nodes, [space.id]: { ...this.state.document.nodes[space.id], [space.property]: value } }; if (space.before) nodes[space.before] = { ...nodes[space.before], marginBottom: 0 }; this.state.commit({ ...this.state.document, nodes }); } },
      cancel: () => { this.busy = false; this.paint(); }, started: () => { this.busy = true; this.settle.cancel(); }, ended: () => { this.busy = false; this.paint(); this.schedule(); },
    });
    this.sort = this.surface.sortable({ lockAxis: undefined, onDragStart: ({ draggableId }) => { this.busy = true; this.selectMany(new Set([draggableId])); const node=this.nodes.get(draggableId), parent=node?.parent ? this.nodes.get(node.parent) : undefined; const owner=parent?.kind==='column'&&parent.parent?this.nodes.get(parent.parent):parent; const ids=(owner?.children ?? []).flatMap(id=>this.nodes.get(id)?.kind==='columns'?this.nodes.get(id)!.children:[id]).filter(id=>this.nodes.get(id)?.capabilities.includes('place')); const from=parent?.kind==='column'&&parent.children.length===1?parent.id:draggableId; this.carried={id:draggableId,from,ids,rects:ids.map(id=>this.elements.get(id)!.getBoundingClientRect()),x:this.view.scrollX,y:this.view.scrollY}; }, prepareDrop: result => {
      this.busy = false; const node = this.nodes.get(result.draggableId), parent = node?.parent ? this.nodes.get(node.parent) : undefined;
      if (result.reason === 'DROP' && this.beside) this.placeBeside(result.draggableId,this.beside.id,this.beside.at);
      else if (result.reason === 'DROP' && result.destination && parent && result.destination.droppableId === parent.id) this.moveTo(node!.id, result.destination.index);
      this.carried=undefined; this.beside=undefined; this.sideLine.hidden=true;
      return this.elements.get(result.draggableId) ?? null;
    }, onDragEnd: () => { this.busy = false; this.carried=undefined; this.beside=undefined; this.sideLine.hidden=true; if (!this.disposed) { this.paint(); this.schedule(); } } });
    this.notice.className = 'consistency-site-save-notice'; this.notice.setAttribute('role', 'status'); this.notice.hidden = true; this.frame.parentElement?.append(this.notice);
    this.doc.addEventListener('pointermove', this.dragSide, true); this.doc.body.addEventListener('pointerdown', this.down); this.doc.addEventListener('click', this.click, true); this.doc.addEventListener('contextmenu', this.context, true); this.doc.addEventListener('keydown', this.key, true); document.addEventListener('keydown', this.key);
    this.view.addEventListener('scroll', this.schedule, true); this.view.addEventListener('resize', this.schedule); window.addEventListener('resize', this.schedule);
    this.resize = new ResizeObserver(this.schedule); this.resize.observe(this.doc.documentElement); this.resize.observe(frame);
    this.changed();
  }
  private annotate(element: HTMLElement, name: string, value: string) { let record = this.annotations.get(element); if (!record) { record = {}; this.annotations.set(element, record); } if (!(name in record)) record[name] = element.getAttribute(name); element.setAttribute(name, value); }
  private active() { return !this.disposed && !this.frame.closest('[hidden]') && this.frame.getBoundingClientRect().width > 0; }
  private scale(element: HTMLElement) { return Number.parseFloat(this.view.getComputedStyle(element).getPropertyValue('--sf')) || 1; }
  private apply(element: HTMLElement, property: SiteNodeProperty, value: number) { element.style.setProperty(cssProperty(property), `calc(${value}px * var(--sf, 1))`, 'important'); if (property === 'width') { element.style.setProperty('max-width', '100%', 'important'); element.style.setProperty('box-sizing', 'border-box', 'important'); } }
  private selectMany(selection: Set<string>) { this.selection = selection; this.selected = [...selection][0] ?? ''; this.surface?.paintSelection(); }
  private select(id: string) { if (this.selected !== id) { this.sort?.cancel(); this.finishInsertion(); } this.selectMany(new Set(this.nodes.has(id) ? [id] : [])); }
  private down = (event: PointerEvent) => {
    if (this.menu?.open) { this.menu.requestClose('outside'); this.menu.remove(); }
    const target=event.target as Element, field=target.closest<HTMLElement>('[data-cms-words]');
    if (field && !event.shiftKey) {
      // A normal press belongs to the site's text editor. Capturing it for a
      // marquee would retarget the following click, including protected fields.
      if (this.selection.has(field.dataset.c9yNode!) && !target.closest('[contenteditable]') && event.isPrimary && event.button===0 && !event.metaKey && !event.ctrlKey && !event.altKey) event.preventDefault();
      else this.selectMany(new Set());
      return;
    }
    this.surface.startMarquee(event);
  };
  private click = (event: MouseEvent) => {
    const target = event.target as Element;
    if (event.defaultPrevented || target.closest('[data-editor-chrome],aa-editor,[data-cms-words],a,button,input,textarea,select,[contenteditable]')) return;
    const element = target.closest<HTMLElement>('[data-c9y-node]'); if (!element) return;
    const id = element.dataset.c9yNode!;
    if (id.startsWith('new_') && this.state.document.insertions?.some(item => item.id === id && !['image','region'].includes(item.kind))) { event.preventDefault(); void this.editInsertion(id); return; }
    if (event.shiftKey || this.selection.size > 1) return;
    void this.beforeEdit().then(ok => { if (ok && !this.disposed) this.select(id); });
  };
  private context = (event: MouseEvent) => {
    const target = event.target as Element; if (target.closest('aa-editor,[contenteditable],[data-editor-chrome]')) return;
    const element = target.closest<HTMLElement>('[data-c9y-node]'); if (!element) return;
    event.preventDefault(); event.stopPropagation();
    void this.beforeEdit().then(ok => { if (ok && !this.disposed) { if (!this.selection.has(element.dataset.c9yNode!)) this.select(element.dataset.c9yNode!); const frame = this.frame.getBoundingClientRect(); this.openMenu(frame.left + event.clientX, frame.top + event.clientY); } });
  };
  private key = (event: KeyboardEvent) => {
    if (!this.active() || event.defaultPrevented || (event.target as Element)?.closest?.('aa-editor,input,textarea,select,[contenteditable]')) return;
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); event.stopPropagation(); this.finishInsertion(); event.shiftKey ? this.state.redo() : this.state.undo(); return; }
    if (event.key === 'Escape') { this.surface.cancelMarquee(); this.selectMany(new Set()); this.menu?.remove(); return; }
    if (['Delete','Backspace'].includes(event.key) && this.selection.size && !event.metaKey && !event.ctrlKey && !event.altKey) { event.preventDefault(); this.removeSelection(); }
    if (event.altKey && ['ArrowUp','ArrowDown'].includes(event.key)) { event.preventDefault(); this.move(event.key === 'ArrowUp' ? -1 : 1); }
    if (event.key === 'ContextMenu' || event.shiftKey && event.key === 'F10') { event.preventDefault(); const box = this.elements.get(this.selected)?.getBoundingClientRect(), frame = this.frame.getBoundingClientRect(); this.openMenu(frame.left + (box?.left ?? 0), frame.top + (box?.bottom ?? 0)); }
  };
  private spacingTargets(): SpacingTarget[] {
    this.spaces.clear(); const targets: SpacingTarget[] = [];
    const add = (key: string, id: string, property: SiteNodeProperty, target: SpacingTarget, before?: string) => { this.spaces.set(key, { id, property, before, target }); targets.push(target); };
    for (const node of this.nodes.values()) {
      const element = this.elements.get(node.id); if (!element || element.hidden || !element.getClientRects().length || this.regions.has(node.id)) continue;
      const scale = this.scale(element), style = this.view.getComputedStyle(element);
      if (node.capabilities.includes('padding')) {
        const key = `${node.id}:padding`, value = Number.parseFloat(style.paddingLeft) / scale || 0;
        add(key, node.id, 'padding', { id: key, element, host: this.overlay, label: `${node.label} padding`, kind: 'padding', axis: 'horizontal', fallback: value, range: siteMeasureRange('padding', element.clientWidth / scale, element.clientWidth / scale), rect: () => { const box = element.getBoundingClientRect(); return { left: box.left, top: box.top, width: Number.parseFloat(this.view.getComputedStyle(element).paddingLeft) || 0, height: box.height }; } });
      }
      const children = node.children.map(id => this.elements.get(id)).filter((child): child is HTMLElement => !!child && !child.hidden && child.parentElement === element && child.getClientRects().length > 0);
      const layoutGap = /^(inline-)?(flex|grid)$/.test(style.display) && node.capabilities.includes('gap');
      for (let index = 1; index < children.length; index++) {
        const previous = children[index - 1], next = children[index], nextId = next.dataset.c9yNode!, beforeId = previous.dataset.c9yNode!;
        const a = previous.getBoundingClientRect(), b = next.getBoundingClientRect(), horizontal = b.left >= a.right - 1 && b.top < a.bottom;
        const nextStyle=this.view.getComputedStyle(next), previousStyle=this.view.getComputedStyle(previous);
        if (!layoutGap && ([nextStyle,previousStyle].some(style=>['absolute','fixed'].includes(style.position)||!['block','flow-root','flex','grid','table','list-item'].includes(style.display)) || horizontal || !this.nodes.get(nextId)?.capabilities.includes('marginTop') || !this.nodes.get(beforeId)?.capabilities.includes('marginBottom'))) continue;
        const id = layoutGap ? node.id : nextId, property = layoutGap ? 'gap' : 'marginTop', key = `${id}:gap:${nextId}`;
        const fallback = Math.max(0, horizontal ? b.left - a.right : b.top - a.bottom) / scale;
        add(key, id, property, { id: key, element, host: this.overlay, label: `${this.nodes.get(id)?.label ?? node.label} gap`, fallback, axis: horizontal ? 'horizontal' : 'vertical', rect: () => { const a = previous.getBoundingClientRect(), b = next.getBoundingClientRect(); return horizontal ? { left: a.right, top: Math.max(a.top,b.top), width: Math.max(0,b.left-a.right), height: Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top) } : { left: Math.max(a.left,b.left), top: a.bottom, width: Math.min(a.right,b.right)-Math.max(a.left,b.left), height: Math.max(0,b.top-a.bottom) }; } }, layoutGap ? undefined : beforeId);
      }
    }
    return targets;
  }
  private bindResizing() {
    for (const [id, binding] of this.resizers) if (!this.elements.has(id)) { binding.dispose(); this.resizers.delete(id); }
    for (const node of this.nodes.values()) {
      const target = this.elements.get(node.id); if (!target || !node.capabilities.includes('width') || ['body','main'].includes(node.tag) || this.resizers.has(node.id)) continue;
      const display=this.view.getComputedStyle(target).display; if (display==='contents' || display==='inline' && !['img','video','canvas','svg'].includes(node.tag)) continue;
      const size = (): ElementSize => { const box = target.getBoundingClientRect(), scale = this.scale(target); return { width: box.width / scale, height: box.height / scale }; };
      const height = node.capabilities.includes('height'); let before = '';
      const available=()=>{const parent=target.parentElement,style=parent?this.view.getComputedStyle(parent):undefined;return Math.max(20,Math.floor(((parent?.clientWidth ?? 2000)-(Number.parseFloat(style?.paddingLeft ?? '')||0)-(Number.parseFloat(style?.paddingRight ?? '')||0))/this.scale(target)/20)*20);};
      const binding = bindResizeEdges(target, { host: this.overlay, enabled: () => this.active() && !target.hidden && !this.surface.contextActive, name: node.label, box: height,
        scale: () => this.scale(target), size, minimumWidth: () => Math.min(available(),node.kind==='card'?cardMinimumWidth(target,this.scale(target)):node.kind==='image'?80:200), minimumHeight: () => node.kind==='card'?cardMinimumHeight(target,this.scale(target)):80, maxWidth: available,
        begin: () => { this.busy = true; before = target.style.cssText; target.setAttribute('data-resizing', ''); }, end: cancelled => { if (cancelled) target.style.cssText = before; target.removeAttribute('data-resizing'); this.busy = false; this.schedule(); },
        paintSize: dimensions => { this.apply(target, 'width', dimensions.width); if (height) this.apply(target, 'height', dimensions.height); this.schedule(); },
        save: dimensions => this.state.patch(node.id, { width: dimensions.width, ...(height ? { height: dimensions.height } : {}) }), cancelSettle: () => this.settle.cancel(), settle: update => this.settle.run([...this.elements.values()], update),
      });
      for (const edge of binding.edges) { edge.setAttribute('data-editor-chrome',''); edge.dataset.resizeNode = node.id; }
      this.resizers.set(node.id, binding);
    }
  }
  private draw() {
    if (this.disposed) return;
    this.overlay.hidden = !this.active();
    for (const [id, binding] of this.resizers) {
      const target = this.elements.get(id); if (!target) continue; const box = target.getBoundingClientRect(), scale = this.scale(target);
      for (const edge of binding.edges) {
        edge.hidden = !this.active() || target.hidden || !target.getClientRects().length || this.surface.contextActive; edge.tabIndex = edge.hidden ? -1 : 0;
        const corner = edge.classList.contains('consistency-resize-corner'), height = edge.classList.contains('consistency-resize-height');
        Object.assign(edge.style, { left: `${corner ? box.right - 20 * scale : height ? box.left : box.right - 6 * scale}px`, top: `${corner ? box.bottom - 20 * scale : height ? box.bottom - 6 * scale : box.top}px`, right:'auto', bottom:'auto', width: `${corner ? 20 * scale : height ? box.width : 6 * scale}px`, height: `${corner ? 20 * scale : height ? 6 * scale : box.height}px` });
      }
    }
    this.surface.paintSelection();
  }
  private schedule = () => { if (!this.frameRequest && !this.disposed) this.frameRequest = this.view.requestAnimationFrame(() => { this.frameRequest = 0; this.spacing.refresh(); this.regions.refresh(); this.cards.refresh(); this.stats.refresh(); this.draw(); }); };
  private changed() { if (this.disposed) return; this.syncGraph(); this.syncInsertions(); this.syncGraph(); this.paint(); this.bindSort(); this.bindResizing(); this.spacing.refresh(); this.regions.refresh(); this.cards.refresh(); this.stats.refresh(); this.draw(); this.showStatus(); }
  private showStatus() {
    this.notice.replaceChildren(); const error=this.state.error || this.contentError; this.notice.hidden = !error;
    if (!error) return;
    const words = document.createElement('span'); words.textContent = error; this.notice.append(words);
    if (!this.state.error) { const dismiss=document.createElement('ds-button');dismiss.textContent='Dismiss';dismiss.onclick=()=>{this.contentError='';this.showStatus();};this.notice.append(dismiss);return; }
    const retry = document.createElement('ds-button'); retry.textContent = 'Try again'; retry.onclick = () => void this.state.flush(); this.notice.append(retry);
    const discard = document.createElement('ds-button'); discard.textContent = 'Discard changes'; discard.onclick = () => { if (discard.textContent !== 'Confirm discard') { discard.textContent = 'Confirm discard'; return; } this.state.discard(); this.reopen?.(); }; this.notice.append(discard);
  }
  private paint() {
    if (this.busy) return;
    for (const [id, element] of this.elements) {
      const original = this.originals.get(id); if (!original) continue;
      const baseline = this.doc.createElement('div'); baseline.setAttribute('style', original.style); const patch = this.state.document.nodes[id] ?? {};
      const owned=(key:string)=> /^(?:padding(?:-|$)|margin-(?:top|bottom)$|(?:row-|column-)?gap$|width$|height$|max-width$|box-sizing$|display$)/.test(key);
      for (const property of new Set([...Array.from(element.style),...Array.from(baseline.style),...measureProperties.map(cssProperty),'max-width','box-sizing','display'].filter(owned))) { const value = baseline.style.getPropertyValue(property); if (value) element.style.setProperty(property,value,baseline.style.getPropertyPriority(property)); else element.style.removeProperty(property); }
      for (const property of measureProperties) if (patch[property] !== undefined) this.apply(element,property,patch[property]!);
      element.hidden = patch.hidden === undefined ? original.hidden : patch.hidden;
      if (patch.hidden) element.style.setProperty('display','none','important');
      const kind = this.nodes.get(id)?.kind;
      if (['card','stat','button'].includes(kind ?? '')) {
        const before = this.originalDesign.get(id);
        if (before) { for (const [key,value] of Object.entries(before.attributes)) { if (value === null) element.removeAttribute(key); else element.setAttribute(key,value); } for (const [key,value] of Object.entries(before.classes)) element.classList.toggle(key,value); }
        for (const key of SITE_SURFACE_STYLES) { const value=baseline.style.getPropertyValue(key); if(value)element.style.setProperty(key,value,baseline.style.getPropertyPriority(key));else element.style.removeProperty(key); }
        if (patch.design) this.paintDesign(element,siteSurfacePatch(kind!,element.localName,patch.design));
      }
      if (kind === 'root') { for (const key of SITE_PAGE_STYLES) { const value=baseline.style.getPropertyValue(key);if(value)element.style.setProperty(key,value,baseline.style.getPropertyPriority(key));else element.style.removeProperty(key); } this.paintDesign(element,sitePagePatch(this.state.document.pageTone ?? '')); }

    }
    for (const [id, node] of this.nodes) {
      const target = this.elements.get(id); if (!target || this.regions.has(id)) continue;
      const desired: Node[] = [], ordered = node.children.map(child => this.elements.get(child)).filter((child): child is HTMLElement => !!child);
      let next = 0;
      for (const original of this.originalOrder.get(id) ?? []) {
        const childId = original.nodeType === 1 ? (original as HTMLElement).dataset.c9yNode : undefined;
        if (childId && this.elements.has(childId)) { if (next < ordered.length) desired.push(ordered[next++]); }
        else if (original.parentNode === target && !(original.nodeType === 1 && (original as Element).hasAttribute('data-editor-chrome'))) desired.push(original);
      }
      desired.push(...ordered.slice(next));
      for (let at = 0; at < desired.length; at++) if (target.childNodes[at] !== desired[at]) target.insertBefore(desired[at], target.childNodes[at] ?? null);
    }
    for (const [id, element] of this.elements) if (!this.nodes.has(id)) { element.remove(); this.elements.delete(id); this.originals.delete(id); this.originalOrder.delete(id); }

  }
  private sourceGaps(id: string) {
    if (!this.defaultGaps.has(id)) { const node=this.nodes.get(id), element=this.elements.get(id); const style=element?this.view.getComputedStyle(element):undefined; this.defaultGaps.set(id,Object.fromEntries((node?.kind==='stat'?['label','figure']:['label','title','footer']).map(key=>[key,Number.isFinite(Number.parseFloat(style?.getPropertyValue(`--ds-${node?.kind}-${key}-gap`) ?? '')) ? Number.parseFloat(style!.getPropertyValue(`--ds-${node?.kind}-${key}-gap`)) / (element?this.scale(element):1) : key==='footer'?20:0]))); }
    return {...this.defaultGaps.get(id),...this.state.document.nodes[id]?.design?.gaps};
  }
  private paintDesign(element: HTMLElement, patch: SiteDesignPatch) {
    for (const [key,value] of Object.entries(patch.attributes)) { if(value===null)element.removeAttribute(key);else element.setAttribute(key,value); }
    for (const [key,value] of Object.entries(patch.classes)) element.classList.toggle(key,value);
    for (const [key,value] of Object.entries(patch.styles)) element.style.setProperty(key,value,'important');
  }
  private syncGraph() {
    const next = new Map([...this.baseNodes].filter(([,node]) => !node.id.startsWith('new_')).map(([id,node]) => [id,structuredClone(node)]));
    for (const group of this.state.document.groups ?? []) {
      let element = this.elements.get(group.id);
      if (!element) { element = this.doc.createElement('div'); element.dataset.c9yNode = group.id; element.dataset.c9yLayout = group.kind; this.elements.set(group.id,element); this.originalOrder.set(group.id,[]); }
      const style = group.kind === 'columns' ? 'display:flex;flex-wrap:wrap;gap:calc(20px * var(--sf,1));align-items:flex-start' : group.kind === 'column' ? 'flex:1 1 calc(200px * var(--sf,1));min-width:min(100%,calc(200px * var(--sf,1)));max-width:100%' : '';
      if (!this.originals.has(group.id)) element.style.cssText=style;
      this.originals.set(group.id,{style,hidden:false});
      next.set(group.id,{id:group.id,tag:'div',kind:group.kind==='flow'?'group':group.kind,parent:null,children:[],label:group.kind==='column'?'Column':group.kind==='columns'?'Columns':'Group',capabilities:['width','padding','gap','marginTop','marginBottom','hide','insert','place']});
      this.annotate(element,'data-selectable',group.id);
    }
    for (const insertion of this.state.document.insertions ?? []) {
      const element = this.elements.get(insertion.id); if (!element) continue;
      next.set(insertion.id,{id:insertion.id,tag:element.localName,kind:insertion.kind==='region'?'region':insertion.kind==='image'?'image':'text',parent:insertion.parent,children:[],label:insertion.kind==='region'?'Content':insertion.kind,capabilities:['width','padding','marginTop','marginBottom','hide','place']});
      const parent = next.get(insertion.parent); if (parent && !parent.children.includes(insertion.id)) { const before = insertion.before ? parent.children.indexOf(insertion.before) : -1; parent.children.splice(before < 0 ? parent.children.length : before,0,insertion.id); }
    }
    for (const [id,order] of Object.entries(this.state.document.order)) if (next.has(id)) next.get(id)!.children = order.filter(child => next.has(child));
    // The stored adjacency is authoritative, including reparented source nodes.
    const assigned = new Map<string,string>();
    for (const [id,order] of Object.entries(this.state.document.order)) for (const child of order) assigned.set(child,id);
    for (const [id,node] of next) { node.children = node.children.filter(child => next.has(child) && (!assigned.has(child) || assigned.get(child) === id)); for (const child of node.children) next.get(child)!.parent = id; }
    for (const node of next.values()) { const siblings = node.parent ? next.get(node.parent)?.children.length ?? 0 : 0; node.capabilities = node.capabilities.filter(cap => cap !== 'reorder'); if (blockReorders(node.capabilities, siblings, this.baseNodes.get(node.id)?.capabilities.includes('reorder'))) node.capabilities.push('reorder'); }
    this.nodes.clear(); for (const [id,node] of next) this.nodes.set(id,node);
  }

  private bindSort() {
    if (!this.sort) return;
    for (const [id, dispose] of this.sortItems) if (!this.elements.has(id) || !this.nodes.get(id)?.capabilities.some(cap=>cap==='place'||cap==='reorder') || this.sortParents.get(id) !== this.nodes.get(id)?.parent) { dispose(); this.sortItems.delete(id); }
    for (const [id, dispose] of this.sortContainers) if (!this.elements.has(id) || (this.nodes.get(id)?.children.length ?? 0) < 1) { dispose(); this.sortContainers.delete(id); }
    for (const node of this.nodes.values()) {
      const element = this.elements.get(node.id); if (!element) continue;
      if (node.children.length > 0 && !this.sortContainers.has(node.id)) this.sortContainers.set(node.id,this.sort.container({element,id:node.id,type:node.id,axis:node.kind==='columns'?'horizontal':'vertical',label:node.label}));
      if (node.parent && node.capabilities.some(cap=>cap==='place'||cap==='reorder') && !this.sortItems.has(node.id)) { this.annotate(element,'data-sort-group',node.id); this.sortParents.set(node.id,node.parent); this.sortItems.set(node.id,this.sort.item({element,id:node.id,type:node.parent,label:node.label,canDrag:({target}) => this.active() && !this.surface.contextActive && !this.doc.body.hasAttribute('data-pointer-additive') && !!target && canStartMarquee(target) && !target.closest('[data-editor-chrome]') && (!target.closest('[data-cms-words]') || this.selection.has(node.id))})); }
    }
  }
  private dragSide = (event: PointerEvent) => {
    if (!this.carried) return;
    const {id,from,ids,rects,x,y}=this.carried, dx=this.view.scrollX-x, dy=this.view.scrollY-y;
    const hit=sidePlacement(rects,ids.indexOf(from),{x:event.clientX+dx,y:event.clientY+dy},20*this.scale(this.elements.get(id)!));
    this.beside=hit?{id:ids[hit.index],at:hit.at}:undefined; this.sideLine.hidden=!hit;
    if(hit) Object.assign(this.sideLine.style,{left:`${(hit.at==='start'?hit.rect.left:hit.rect.right)-dx}px`,top:`${hit.rect.top-dy}px`,height:`${hit.rect.bottom-hit.rect.top}px`});
  };
  private placeBeside(id: string, target: string, at: 'start'|'end') {
    const source=this.nodes.get(id), beside=this.nodes.get(target); if(!source?.parent||!beside?.parent||!source.capabilities.includes('place')||!beside.capabilities.includes('place'))return;
    if (beside.kind==='column' && this.nodes.get(beside.parent)?.kind==='columns') {
      const columns=this.nodes.get(beside.parent)!, parent=this.nodes.get(source.parent)!;
      const existing=source.kind==='column'&&source.parent===columns.id?source:parent.kind==='column'&&parent.parent===columns.id&&parent.children.length===1?parent:undefined;
      if (existing) {
        if(existing.id===target)return;
        const order=columns.children.filter(child=>child!==existing.id), index=order.indexOf(target)+(at==='end'?1:0); order.splice(index,0,existing.id);
        this.state.commit({...this.state.document,order:{...this.state.document.order,[columns.id]:order}});return;
      }
      const column=`new_${crypto.randomUUID().replaceAll('-','').slice(0,16)}`, order=[...columns.children];order.splice(order.indexOf(target)+(at==='end'?1:0),0,column);
      this.state.commit({...this.state.document,groups:[...(this.state.document.groups??[]),{id:column,kind:'column'}],order:{...this.state.document.order,[parent.id]:parent.children.filter(child=>child!==id),[columns.id]:order,[column]:[id]}});return;
    }
    if(source.parent!==beside.parent)return;
    const make=()=>`new_${crypto.randomUUID().replaceAll('-','').slice(0,16)}`, group=make(), first=make(), second=make(), parent=this.nodes.get(source.parent)!;
    const children=parent.children.filter(child=>child!==id).map(child=>child===target?group:child);
    this.state.commit({...this.state.document,groups:[...(this.state.document.groups??[]),{id:group,kind:'columns'},{id:first,kind:'column'},{id:second,kind:'column'}],order:{...this.state.document.order,[parent.id]:children,[group]:[first,second],[first]:[at==='start'?id:target],[second]:[at==='start'?target:id]}});
  }
  private moveTo(id: string, index: number) { const node = this.nodes.get(id), parent = node?.parent ? this.nodes.get(node.parent) : undefined; if (!node || !parent) return; const order = this.state.document.order[parent.id] ?? parent.children, start = order.indexOf(id); if (start < 0 || index < 0 || index >= order.length) return; this.state.commit({...this.state.document,order:{...this.state.document.order,[parent.id]:reorder({list:order,startIndex:start,finishIndex:index})}}); }
  private move(delta: number) { const node = this.nodes.get(this.selected), parent = node?.parent ? this.nodes.get(node.parent) : undefined; if (node && parent) this.moveTo(node.id,(this.state.document.order[parent.id] ?? parent.children).indexOf(node.id)+delta); }
  private removeSelection() { const insertions=this.regions.withoutBlocks(this.selection); const nodes = {...this.state.document.nodes}; for (const id of this.selection) if (this.nodes.get(id)?.capabilities.includes('hide')) nodes[id]={...nodes[id],hidden:true}; this.state.commit({...this.state.document,nodes,insertions}); this.selectMany(new Set()); }
  private openMenu(x: number,y: number) {
    this.menuDispose?.(); this.menuDispose=undefined; this.menu?.remove(); const node = this.nodes.get(this.selected); if (!node) return;
    const menu = this.menu = createSurfaceContext(`${node.label} content`,this.elements.get(node.id));
    const action = (label: string, run: () => void) => { const option=document.createElement('button'); option.type='button'; option.setAttribute('role','menuitem'); option.textContent=label; option.onclick=()=>{menu.remove();run();}; menu.append(option); };
    if (node.capabilities.includes('design') && ['card','stat','button'].includes(node.kind ?? '')) appendSurfaceOptions(menu,node.kind as 'card'|'stat'|'button',patch=>this.state.patch(node.id,{design:{...this.state.document.nodes[node.id]?.design,...patch}}));
    if (node.kind === 'button' && node.capabilities.includes('design') && ['a','ds-button'].includes(node.tag)) {
      const patch=this.state.document.nodes[node.id]?.design, href=this.elements.get(node.id)?.getAttribute('href');
      const initial=patch && 'action' in patch ? patch.action ?? undefined : readAction({kind:href?.startsWith('/')?'page':'link',target:href});
      const action=createButtonActionControls(document,initial,()=>this.active(),action=>this.state.patch(node.id,{design:{...this.state.document.nodes[node.id]?.design,action:action ?? null}}));
      action.element.setAttribute('data-keep-open',''); menu.append(action.element); this.menuDispose=action.dispose;
    }
    if (node.kind === 'root') for (const tone of PAGE_TONES) action(tone ? tone.replaceAll('-',' ').replace(/^./,value=>value.toUpperCase()) : 'Default colour',()=>this.state.commit({...this.state.document,pageTone:tone}));
    if (node.capabilities.includes('insert')) action('Add content',()=>this.insertRegion());
    if (node.capabilities.includes('reorder')) { action('Move up',()=>this.move(-1)); action('Move down',()=>this.move(1)); }
    if ([...this.selection].some(id=>this.nodes.get(id)?.capabilities.includes('hide'))) action('Remove',()=>this.removeSelection());
    for (const [id,patch] of Object.entries(this.state.document.nodes)) if(patch.hidden&&this.nodes.has(id)) action(`Show ${this.nodes.get(id)!.label}`,()=>{this.state.patch(id,{hidden:false});this.select(id);});
    if(this.state.canUndo) action('Undo',()=>this.state.undo()); if(this.state.canRedo) action('Redo',()=>this.state.redo());
    document.body.append(menu); menu.openOver({left:x,right:x,top:y,bottom:y,width:0,height:0});
  }
  private insertRegion() { const parent=this.nodes.get(this.selected); if(!parent?.capabilities.includes('insert'))return; const id=`new_${crypto.randomUUID().replaceAll('-','').slice(0,16)}`; const item:SiteInsertion={id,parent:parent.id,kind:'region',source:''}; const order=this.state.document.order[parent.id]; this.state.commit({...this.state.document,...(order?{order:{...this.state.document.order,[parent.id]:[...order,id]}}:{}),insertions:[...(this.state.document.insertions??[]),item]}); this.select(id); this.regions.focus(id); }
  private syncInsertions() {
    const insertions=this.state.document.insertions??[];
    for(const [id,element] of this.elements) if(id.startsWith('new_')&&!insertions.some(item=>item.id===id)&&!this.state.document.groups?.some(group=>group.id===id)&&!element.hasAttribute('data-c9y-layout')) { this.regions.remove(id);element.remove();this.elements.delete(id);this.nodes.delete(id);this.originals.delete(id);this.originalOrder.delete(id);for(const parent of this.nodes.values())parent.children=parent.children.filter(child=>child!==id); }
    for(const insertion of insertions) {
      let element=this.elements.get(insertion.id);const parent=this.elements.get(insertion.parent);if(!parent)continue;
      if(!element){element=this.doc.createElement(insertion.kind==='region'?'div':insertion.kind==='heading'?'h2':insertion.kind==='image'?'img':insertion.kind==='link'||insertion.kind==='button'?'a':'p');element.dataset.c9yNode=insertion.id;parent.insertBefore(element,insertion.before?this.elements.get(insertion.before)??null:null);this.elements.set(insertion.id,element);this.originals.set(insertion.id,{style:'',hidden:false});this.originalOrder.set(insertion.id,[]);this.nodes.set(insertion.id,{id:insertion.id,tag:element.localName,parent:insertion.parent,children:[],label:insertion.kind==='region'?'Content':insertion.kind[0].toUpperCase()+insertion.kind.slice(1),capabilities:['width','hide','reorder']});this.annotate(element,'data-selectable',insertion.id);const meta=this.nodes.get(insertion.parent);if(meta&&!meta.children.includes(insertion.id))meta.children.push(insertion.id);}
      if(insertion.kind==='region'){this.regions.update(insertion,element);continue;}
      if(this.insertionEditor?.id===insertion.id)continue;
      if(insertion.kind==='image'){element.setAttribute('src',new URL(this.frame.src).pathname.replace(/\/document$/,'/files')+(insertion.src??''));element.setAttribute('alt',insertion.alt??'');}
      else{if(insertion.kind==='text')element.innerHTML=renderMarkdown(insertion.text??'');else element.textContent=insertion.text??'';if(insertion.href)element.setAttribute('href',insertion.href);if(insertion.kind==='button')element.classList.add('ds-button');}
    }
  }
  private chooseImage(anchor: HTMLElement): Promise<{src:string;alt:string}|null> {
    return new Promise(resolve => {
      this.menu?.remove(); const menu = this.menu = createSurfaceContext('Choose an image',anchor); let completed = false;
      const finish = (value: {src:string;alt:string}|null) => { if (completed) return; completed=true; menu.remove(); resolve(value); };
      menu.addEventListener('ds-menu-close',()=>finish(null));
      for (const src of this.images) { const row=document.createElement('button'); row.type='button'; row.setAttribute('role','menuitem'); row.textContent=src.split('/').pop() ?? src; row.onclick=()=>finish({src,alt:row.textContent ?? ''}); menu.append(row); }
      if (!this.images.length) { const text=document.createElement('span'); text.textContent='This site has no images yet.'; menu.append(text); }
      const box=anchor.getBoundingClientRect(), frame=this.frame.getBoundingClientRect(); document.body.append(menu); menu.openOver({left:frame.left+box.left,right:frame.left+box.right,top:frame.top+box.top,bottom:frame.top+box.bottom,width:box.width,height:box.height});
    });
  }
  private async editInsertion(id: string) { if(!(await this.beforeEdit())||this.disposed)return;this.select(id);const item=this.state.document.insertions?.find(item=>item.id===id),element=this.elements.get(id);if(!item||!element)return;const editor=createPlainEditor(element,{value:item.text??'',onChange:text=>this.state.commit({...this.state.document,insertions:this.state.document.insertions?.map(each=>each.id===id?{...each,text}:each)})});this.insertionEditor={id,editor};editor.focus(); }
  private finishInsertion(){const current=this.insertionEditor;if(!current)return;this.insertionEditor=undefined;current.editor.destroy();this.syncInsertions();}
  get pending() { return this.state.dirty || this.state.busy || this.regions.pending; }
  async flush(){(this.doc.activeElement as HTMLElement | null)?.blur?.();this.surface.cancelMarquee();this.sort.cancel();this.finishInsertion();return this.state.flush();}
  destroy(){this.disposed=true;this.finishInsertion();this.state.destroy();this.surface.destroy();this.spacing.destroy();this.regions.destroy();this.cards.destroy();this.stats.destroy();this.sort.destroy();for(const binding of this.resizers.values())binding.dispose();this.settle.cancel();this.resize.disconnect();this.menuDispose?.();this.menu?.remove();this.notice.remove();this.overlay.remove();this.view.cancelAnimationFrame(this.frameRequest);this.disposers.forEach(dispose=>dispose());this.doc.removeEventListener('pointermove',this.dragSide,true);this.doc.body.removeEventListener('pointerdown',this.down);this.doc.removeEventListener('click',this.click,true);this.doc.removeEventListener('contextmenu',this.context,true);this.doc.removeEventListener('keydown',this.key,true);document.removeEventListener('keydown',this.key);this.view.removeEventListener('scroll',this.schedule,true);this.view.removeEventListener('resize',this.schedule);window.removeEventListener('resize',this.schedule);for(const [element,attributes]of this.annotations)for(const [name,value]of Object.entries(attributes)){if(value===null)element.removeAttribute(name);else element.setAttribute(name,value);} }
}
