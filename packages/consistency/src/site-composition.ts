import { bindSpacingHandle } from '../../app/src/2-core/spacing-handle';
import { createSortable, type SortableController } from './vendor/drag/sortable';
import { reorder } from './vendor/drag/util';
import { CompositionSettle } from './settle';
import { Context } from '../../../DS1/3-unit/ds-context';
import '../../../DS1/2-core/ds-button';
import '../../../DS1/2-core/ds-number';
import '../../../DS1/2-core/ds-input';
import { createPlainEditor } from '../../../website/src/vendor/aa/aa';
import { renderMarkdown } from './vendor/site-engine/markdown';
import { SiteCompositionState, siteMeasureRange, siteMeasureValue, type CompositionSave, type SiteCompositionNode, type SiteCompositionSnapshot, type SiteInsertion, type SiteNodeProperty } from './site-composition-state';
import './site-composition.css';

/** The same direct geometry engine as the composition workspace, applied to the site's authored page. */
export class SiteCompositionController {
  readonly state: SiteCompositionState;
  private readonly doc: Document;
  private readonly view: Window & typeof globalThis;
  private readonly nodes = new Map<string, SiteCompositionNode>();
  private readonly elements = new Map<string, HTMLElement>();
  private readonly originals = new Map<string, { style: string; hidden: boolean }>();
  private readonly originalOrder = new Map<string, Node[]>();
  private selected = '';
  private readonly overlay = document.createElement('div');
  private readonly bar = document.createElement('div');
  private readonly status = document.createElement('span');
  private readonly label = document.createElement('span');
  private readonly handles = new Map<SiteNodeProperty, HTMLElement>();
  private readonly numbers = new Map<SiteNodeProperty, HTMLElement & { value: number; min: number; max: number }>();
  private readonly buttons = new Map<string, HTMLElement>();
  private readonly linkField = document.createElement('ds-input') as HTMLElement & { value: string };
  private readonly altField = document.createElement('ds-input') as HTMLElement & { value: string };
  private readonly disposers: Array<() => void> = [];
  private readonly resize: ResizeObserver;
  private readonly settle = new CompositionSettle();
  private sort?: SortableController;
  private readonly sortItems = new Map<string, () => void>();
  private readonly sortContainers = new Map<string, () => void>();
  private menu?: Context;
  private busy = false;
  private hideAsked = false;
  private discardAsked = false;
  private disposed = false;
  private drawFrame = 0;
  private insertionEditor?: { id: string; editor: ReturnType<typeof createPlainEditor>; timer?: ReturnType<typeof setTimeout> };

  constructor(private readonly frame: HTMLIFrameElement, snapshot: SiteCompositionSnapshot, save: CompositionSave, private readonly beforeEdit: () => Promise<boolean>, private readonly images: string[] = [], private readonly reopen?: () => void) {
    this.doc = frame.contentDocument!; this.view = this.doc.defaultView!;
    this.state = new SiteCompositionState(snapshot, save, () => this.changed());
    for (const node of snapshot.nodes) this.nodes.set(node.id, structuredClone(node));
    for (const element of this.doc.querySelectorAll<HTMLElement>('[data-c9y-node]')) {
      const id = element.dataset.c9yNode!; if (!this.nodes.has(id)) continue;
      this.elements.set(id, element);
      this.originals.set(id, { style: element.getAttribute('data-c9y-original-style') ?? element.getAttribute('style') ?? '', hidden: element.hasAttribute('data-c9y-original-hidden') });
      this.originalOrder.set(id, [...element.childNodes]);
    }
    this.overlay.className = 'consistency-composition-overlay';
    this.bar.className = 'ds-context ds-context--bar consistency-composition-bar';
    this.bar.setAttribute('role', 'toolbar'); this.bar.setAttribute('aria-label', 'Page composition');
    this.label.className = 'ds-context__label'; this.status.setAttribute('role', 'status'); this.status.className = 'consistency-composition-status';
    this.bar.append(this.label);
    for (const [name, action] of [['Move up', () => this.move(-1)], ['Move down', () => this.move(1)], ['Add content', () => this.openMenu()], ['Hide', () => this.hide()], ['Undo', () => this.state.undo()], ['Redo', () => this.state.redo()], ['Try again', () => void this.state.flush()], ['Discard changes', () => { if (!this.discardAsked) { this.discardAsked = true; this.draw(); return; } this.state.discard(); this.reopen?.(); }]] as Array<[string, () => void]>) {
      const button = document.createElement('ds-button'); button.textContent = name; button.setAttribute('aria-label', name); button.addEventListener('click', action); this.buttons.set(name, button); this.bar.append(button);
    }
    this.linkField.setAttribute('aria-label', 'Link address'); this.linkField.setAttribute('placeholder', 'Link address');
    this.altField.setAttribute('aria-label', 'Image description'); this.altField.setAttribute('placeholder', 'Image description');
    for (const [field, property] of [[this.linkField, 'href'], [this.altField, 'alt']] as const) field.addEventListener('input-change', (event: Event) => { const value = (event as CustomEvent<{ value: string }>).detail.value; this.state.commit({ ...this.state.document, insertions: this.state.document.insertions?.map(item => item.id === this.selected ? { ...item, [property]: value } : item) }); });
    this.bar.append(this.linkField, this.altField, this.status); this.overlay.append(this.bar);
    for (const property of ['padding', 'gap', 'width'] as const) this.handle(property);
    document.body.append(this.overlay);
    const style = this.doc.createElement('style'); style.textContent = '[data-c9y-node][data-c9y-selected]{outline:1px solid var(--ds-border-color,#999);outline-offset:-1px}[data-c9y-node][hidden]{display:none!important}'; this.doc.head.append(style); this.disposers.push(() => style.remove());
    this.doc.addEventListener('click', this.click, true); this.doc.addEventListener('contextmenu', this.context, true); this.doc.addEventListener('keydown', this.key, true);
    document.addEventListener('keydown', this.key);
    this.doc.addEventListener('scroll', this.schedule, true); window.addEventListener('resize', this.schedule); window.addEventListener('scroll', this.schedule, true);
    this.resize = new ResizeObserver(this.schedule); this.resize.observe(frame); this.resize.observe(this.doc.documentElement);
    this.disposers.push(() => { this.doc.removeEventListener('click', this.click, true); this.doc.removeEventListener('contextmenu', this.context, true); this.doc.removeEventListener('keydown', this.key, true); document.removeEventListener('keydown', this.key); this.doc.removeEventListener('scroll', this.schedule, true); window.removeEventListener('resize', this.schedule); window.removeEventListener('scroll', this.schedule, true); });
    this.setupSort(); this.changed();
  }
  private get node() { return this.nodes.get(this.selected); }
  private get target() { return this.elements.get(this.selected); }
  private supports(property: SiteNodeProperty) { return !!this.node?.capabilities.includes(property) && (property !== 'gap' || /^(inline-)?(flex|grid)$/.test(this.target ? this.view.getComputedStyle(this.target).display : '')); }
  private gapAxis(): 'horizontal' | 'vertical' { const target = this.target; if (!target) return 'vertical'; const boxes = [...target.children].filter(child => (child as HTMLElement).offsetHeight > 0).map(child => child.getBoundingClientRect()); return boxes.length > 1 && boxes[1].left >= boxes[0].right - 1 ? 'horizontal' : 'vertical'; }
  private active() { return !this.frame.closest('[hidden]') && this.frame.getBoundingClientRect().width > 0; }
  private changed() { if (this.disposed) return; this.syncInsertions(); if (this.selected && !this.nodes.has(this.selected)) this.selected = ''; this.paint(); this.draw(); }
  private schedule = () => { if (!this.drawFrame) this.drawFrame = requestAnimationFrame(() => { this.drawFrame = 0; this.draw(); }); };
  private targetAt(event: Event) { const target = event.target as Element; return target?.closest?.<HTMLElement>('[data-c9y-node]'); }
  private click = (event: MouseEvent) => {
    if (event.defaultPrevented && !(event.target as Element)?.closest?.('[data-c9y-node]')) return;
    const target = event.target as Element;
    if (target.closest?.('[data-cms-words],input,textarea,select,[contenteditable]:not([contenteditable=false])')) { this.select(''); return; }
    const element = this.targetAt(event); if (!element) return;
    const id = element.dataset.c9yNode!;
    if (id.startsWith('new_') && this.state.document.insertions?.some(item => item.id === id && item.kind !== 'image')) { event.preventDefault(); event.stopImmediatePropagation(); void this.editInsertion(id); return; }
    if (target.closest?.('a,button,summary')) return;
    event.preventDefault(); void this.beforeEdit().then(ok => { if (ok) this.select(id); });
  };
  private context = (event: MouseEvent) => { const element = this.targetAt(event); if (!element) return; event.preventDefault(); event.stopPropagation(); void this.beforeEdit().then(ok => { if (ok) { this.select(element.dataset.c9yNode!); this.openMenu(event.clientX + this.frame.getBoundingClientRect().left, event.clientY + this.frame.getBoundingClientRect().top); } }); };
  private key = (event: KeyboardEvent) => {
    if (!this.active() || event.defaultPrevented) return;
    const target = event.target as Element;
    if (target?.closest?.('input,textarea,select,[contenteditable]:not([contenteditable=false])')) return;
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); event.stopPropagation(); if (event.shiftKey) this.state.redo(); else this.state.undo(); return; }
    if (!this.selected) return;
    if (event.key === 'Escape') { this.select(''); return; }
    if (event.altKey && ['ArrowUp', 'ArrowDown'].includes(event.key)) { event.preventDefault(); this.move(event.key === 'ArrowUp' ? -1 : 1); }
    if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) { event.preventDefault(); this.openMenu(); }
  };
  private select(id: string) { if (id !== this.selected && this.sort?.isDragging()) this.sort.cancel(); if (id === this.selected && !this.insertionEditor) { this.draw(); return; } this.finishInsertion(); this.elements.get(this.selected)?.removeAttribute('data-c9y-selected'); this.selected = this.nodes.has(id) ? id : ''; this.target?.setAttribute('data-c9y-selected', ''); this.hideAsked = false; this.draw(); }
  private scale(element: HTMLElement) { return Number.parseFloat(this.view.getComputedStyle(element).getPropertyValue('--sf')) || 1; }
  private value(property: SiteNodeProperty) {
    const target = this.target; if (!target) return 0;
    const saved = this.state.document.nodes[this.selected]?.[property]; if (typeof saved === 'number') return saved;
    const style = this.view.getComputedStyle(target), scale = this.scale(target);
    return property === 'width' ? target.getBoundingClientRect().width / scale : (Number.parseFloat(property === 'padding' ? style.paddingLeft : style.gap) || 0) / scale;
  }
  private range(property: SiteNodeProperty): [number, number] {
    const target = this.target; if (!target) return [0, 2000];
    const available = (target.parentElement?.clientWidth ?? target.clientWidth) / this.scale(target);
    return siteMeasureRange(property, available, target.clientWidth / this.scale(target));
  }
  private preview(property: SiteNodeProperty, value: number) { const target = this.target; if (!target || !Number.isFinite(value)) return; this.apply(target, property, value); const handle = this.handles.get(property)!; handle.firstElementChild!.textContent = String(Math.round(value)); handle.setAttribute('aria-valuenow', String(Math.round(value))); this.schedule(); }
  private apply(target: HTMLElement, property: SiteNodeProperty, value: number) { target.style.setProperty(property, `calc(${value}px * var(--sf, 1))`); if (property === 'width') { target.style.setProperty('max-width', '100%'); target.style.setProperty('box-sizing', 'border-box'); } }
  private handle(property: SiteNodeProperty) {
    const handle = document.createElement('div'); handle.className = 'consistency-composition-handle'; handle.dataset.property = property; handle.setAttribute('role', 'slider'); handle.tabIndex = 0; handle.append(document.createElement('span')); this.overlay.append(handle); this.handles.set(property, handle);
    const number = document.createElement('ds-number') as HTMLElement & { value: number; min: number; max: number }; number.setAttribute('label', property[0].toUpperCase() + property.slice(1)); number.setAttribute('step', '20'); number.setAttribute('big-step', '40'); number.setAttribute('width', '6'); number.setAttribute('unit', 'px');
    number.addEventListener('input', () => this.preview(property, Number(number.value)));
    number.addEventListener('change', () => { const value = siteMeasureValue(Number(number.value), this.range(property)); if (value !== null) this.state.patch(this.selected, { [property]: value }); else { this.paint(); this.draw(); } }); this.bar.append(number); this.numbers.set(property, number);
    let pointer = false;
    this.disposers.push(bindSpacingHandle(handle, () => ({ value: this.value(property), min: this.range(property)[0], max: this.range(property)[1], step: 20, shiftStep: 40, immediateKeyboard: true, axis: property === 'gap' ? this.gapAxis() : 'horizontal', gain: (property === 'gap' ? 2 : 1) / (this.target ? this.scale(this.target) : 1), disabled: !this.supports(property), snapPreview: false,
      onStart: kind => { pointer = kind === 'pointer'; this.busy = true; this.settle.cancel(); handle.setAttribute('data-active', ''); },
      onPreview: value => this.preview(property, value),
      onCommit: value => { const update = async () => { this.state.patch(this.selected, { [property]: value }); }; if (pointer) void this.settle.run([...this.elements.values()], update); else void update(); },
      onEnd: () => { this.busy = false; handle.removeAttribute('data-active'); this.paint(); this.draw(); },
    })));
  }
  private paint() {
    if (this.busy) return;
    for (const [id, target] of this.elements) {
      const original = this.originals.get(id)!;
      const properties = this.state.document.nodes[id] ?? {};
      // Restore only the properties this engine owns; Aa's current editing state stays untouched.
      const source = this.doc.createElement('div'); source.style.cssText = original.style;
      const owned = (property: string) => /^padding(?:-|$)/.test(property) || ['gap', 'row-gap', 'column-gap', 'width', 'max-width', 'box-sizing', 'display'].includes(property);
      for (const property of [...target.style]) if (owned(property)) target.style.removeProperty(property);
      for (const property of [...source.style]) if (owned(property)) target.style.setProperty(property, source.style.getPropertyValue(property), source.style.getPropertyPriority(property));
      for (const property of ['padding', 'gap', 'width'] as const) if (typeof properties[property] === 'number') this.apply(target, property, properties[property]);
      target.hidden = properties.hidden === undefined ? original.hidden : properties.hidden;
    }
    for (const [id, target] of this.elements) {
      const order = this.state.document.order[id];
      const originals = this.originalOrder.get(id) ?? [];
      const eligible = new Set(this.nodes.get(id)?.children ?? []);
      const nodes = (order ?? this.nodes.get(id)?.children ?? []).map(key => this.elements.get(key)).filter((node): node is HTMLElement => !!node && node.parentElement === target);
      if (!nodes.length) continue;
      let index = 0; const desired: Node[] = [];
      for (const original of originals) {
        if (original instanceof this.view.HTMLElement && eligible.has(original.dataset.c9yNode ?? '')) { const node = nodes[index++]; if (node) desired.push(node); }
        else if (original.parentNode === target) desired.push(original);
      }
      for (; index < nodes.length; index++) desired.push(nodes[index]);
      const current = [...target.childNodes];
      // A keystroke must never detach its focused ancestor merely to restate the same order.
      if (desired.length === current.length && desired.every((node, at) => node === current[at])) continue;
      for (let at = 0; at < desired.length; at++) if (target.childNodes[at] !== desired[at]) target.insertBefore(desired[at], target.childNodes[at] ?? null);
    }
  }
  private draw() {
    const node = this.node, target = this.target;
    const show = this.active() && !!node && !!target && !target.hidden;
    this.overlay.hidden = !this.active() || (!show && !this.state.error && !this.state.dirty && !this.state.busy && !this.state.canUndo && !this.state.canRedo);
    this.bar.hidden = !show && !this.state.error && !this.state.dirty && !this.state.busy && !this.state.canUndo && !this.state.canRedo;
    this.label.textContent = node?.label ?? 'Page'; this.status.textContent = this.state.error || (this.state.busy ? 'Saving…' : this.state.dirty ? 'Unsaved' : '');
    this.buttons.get('Try again')!.hidden = !this.state.error;
    const discard = this.buttons.get('Discard changes')!; discard.hidden = !this.state.error; discard.textContent = this.discardAsked ? 'Confirm discard' : 'Discard changes'; discard.setAttribute('aria-label', this.discardAsked ? 'Confirm discard' : 'Discard changes');
    for (const name of ['Move up', 'Move down']) this.buttons.get(name)!.hidden = !show || !node?.capabilities.includes('reorder');
    this.buttons.get('Add content')!.hidden = !show || !node?.capabilities.includes('insert');
    this.buttons.get('Hide')!.hidden = !show || !node?.capabilities.includes('hide'); this.buttons.get('Hide')!.textContent = this.hideAsked ? 'Confirm hide' : 'Hide'; this.buttons.get('Hide')!.setAttribute('aria-label', this.hideAsked ? 'Confirm hide' : 'Hide');
    this.buttons.get('Undo')!.toggleAttribute('disabled', !this.state.canUndo); this.buttons.get('Redo')!.toggleAttribute('disabled', !this.state.canRedo);
    const insertion = this.state.document.insertions?.find(item => item.id === this.selected);
    this.linkField.hidden = !insertion || !['link', 'button'].includes(insertion.kind); this.altField.hidden = insertion?.kind !== 'image';
    if (document.activeElement !== this.linkField) this.linkField.value = insertion?.href ?? '';
    if (document.activeElement !== this.altField) this.altField.value = insertion?.alt ?? '';
    const frame = this.frame.getBoundingClientRect(), box = target?.getBoundingClientRect();
    const top = box ? frame.top + box.top : frame.top, left = box ? Math.max(frame.left, frame.left + box.left) : frame.left;
    this.bar.style.maxWidth = `${frame.width}px`;
    Object.assign(this.bar.style, { left: `${Math.max(frame.left, Math.min(left, frame.right - this.bar.offsetWidth))}px`, top: `${Math.max(frame.top, Math.min(frame.bottom - this.bar.offsetHeight, top - this.bar.offsetHeight - 10))}px`, maxWidth: `${frame.width}px` });
    for (const property of ['padding', 'gap', 'width'] as const) {
      const handle = this.handles.get(property)!, number = this.numbers.get(property)!;
      const visible = show && this.supports(property) && !!box && box.bottom > 0 && box.top < frame.height && box.right > 0 && box.left < frame.width;
      handle.hidden = number.hidden = !visible; if (!visible || !box || !target) continue;
      const label = `${node!.label} ${property}`; const value = this.value(property), [min, max] = this.range(property);
      handle.setAttribute('aria-label', label); handle.setAttribute('aria-valuemin', String(min)); handle.setAttribute('aria-valuemax', String(max)); handle.setAttribute('aria-orientation', property === 'gap' ? this.gapAxis() : 'horizontal');
      if (!this.busy) { handle.setAttribute('aria-valuenow', String(Math.round(value))); handle.firstElementChild!.textContent = String(Math.round(value)); number.value = Math.round(value); }
      number.setAttribute('aria-label', label); number.min = min; number.max = max;
      const scale = this.scale(target), x = frame.left + box.left, y = frame.top + box.top;
      if (property === 'width') Object.assign(handle.style, { left: `${x + box.width - 10}px`, top: `${Math.max(frame.top, y)}px`, width: '20px', height: `${Math.max(0, Math.min(frame.bottom, y + box.height) - Math.max(frame.top, y))}px` });
      if (property === 'padding') Object.assign(handle.style, { left: `${x + value * scale - 10}px`, top: `${Math.max(frame.top, y)}px`, width: '20px', height: `${Math.max(0, Math.min(frame.bottom, y + box.height) - Math.max(frame.top, y))}px` });
      if (property === 'gap') { const children = [...target.children].filter(child => (child as HTMLElement).offsetHeight > 0); const first = children[0]?.getBoundingClientRect(); const next = children[1]?.getBoundingClientRect(); const horizontal = this.gapAxis() === 'horizontal'; const midpoint = first && next ? horizontal ? (first.right + next.left) / 2 : (first.bottom + next.top) / 2 : horizontal ? box.left + box.width / 2 : box.top + box.height / 2; Object.assign(handle.style, horizontal ? { left: `${frame.left + midpoint - 10}px`, top: `${y}px`, width: '20px', height: `${box.height}px`, cursor: 'ew-resize' } : { left: `${x}px`, top: `${frame.top + midpoint - 10}px`, width: `${box.width}px`, height: '20px', cursor: 'ns-resize' }); }
    }
  }
  private move(delta: number) {
    const node = this.node; if (!node?.parent || !node.capabilities.includes('reorder')) return;
    const parent = this.nodes.get(node.parent); if (!parent) return;
    const order = this.state.document.order[parent.id] ?? parent.children; const index = order.indexOf(node.id), next = index + delta;
    if (index < 0 || next < 0 || next >= order.length) return;
    this.state.commit({ ...this.state.document, order: { ...this.state.document.order, [parent.id]: reorder({ list: order, startIndex: index, finishIndex: next }) } });
  }
  private hide() { if (!this.hideAsked) { this.hideAsked = true; this.draw(); return; } const id = this.selected; this.state.patch(id, { hidden: true }); this.select(this.node?.parent ?? ''); }
  private openMenu(x?: number, y?: number) {
    this.menu?.remove(); const node = this.node; if (!node) return;
    const menu = this.menu = new Context(); menu.setAttribute('aria-label', `${node.label} content`);
    const option = (text: string, action: () => void) => { const button = document.createElement('button'); button.setAttribute('role', 'menuitem'); button.textContent = text; button.onclick = () => { action(); menu.remove(); }; menu.append(button); };
    if (node.capabilities.includes('insert')) for (const kind of ['text', 'heading', 'image', 'link', 'button'] as const) if (kind !== 'image' || this.images.length) option(`Add ${kind}`, () => { if (kind === 'image') this.chooseImage(); else this.insert(kind); });
    if (node.capabilities.includes('reorder')) { option('Move up', () => this.move(-1)); option('Move down', () => this.move(1)); }
    if (node.capabilities.includes('hide')) option('Hide', () => this.hide());
    for (const [id, patch] of Object.entries(this.state.document.nodes)) if (patch.hidden && this.nodes.has(id)) option(`Show ${this.nodes.get(id)!.label}`, () => { this.state.patch(id, { hidden: false }); this.select(id); });
    if (this.state.canUndo) option('Undo', () => this.state.undo());
    document.body.append(menu); const box = this.bar.getBoundingClientRect(); menu.openOver({ left: x ?? box.left, right: x ?? box.left, top: y ?? box.bottom, bottom: y ?? box.bottom, width: 0, height: 0 });
  }
  private chooseImage() {
    const menu = this.menu = new Context(); menu.setAttribute('aria-label', 'Site images');
    for (const path of this.images) { const option = document.createElement('button'); option.setAttribute('role', 'menuitem'); option.textContent = path.split('/').pop() ?? path; option.onclick = () => { this.insert('image', path); menu.remove(); }; menu.append(option); }
    document.body.append(menu); const box = this.bar.getBoundingClientRect(); menu.openOver({ left: box.left, right: box.right, top: box.bottom, bottom: box.bottom, width: box.width, height: 0 });
  }
  private insert(kind: SiteInsertion['kind'], image?: string) {
    if (!this.node?.capabilities.includes('insert')) return;
    const id = `new_${crypto.randomUUID().replaceAll('-', '').slice(0, 16)}`;
    const item: SiteInsertion = { id, parent: this.selected, kind, ...(kind === 'image' ? { src: image ?? this.images[0], alt: '' } : { text: kind === 'heading' ? 'Heading' : kind === 'text' ? 'Write here' : kind === 'button' ? 'Button' : 'Link', ...(kind === 'link' || kind === 'button' ? { href: '/' } : {}) }) };
    const order = this.state.document.order[this.selected];
    this.state.commit({ ...this.state.document, ...(kind === 'image' ? { nodes: { ...this.state.document.nodes, [id]: { width: Math.max(80, Math.floor(Math.min(600, (this.target?.clientWidth ?? 400) / (this.target ? this.scale(this.target) : 1)) / 20) * 20) } } } : {}), ...(order ? { order: { ...this.state.document.order, [this.selected]: [...order, id] } } : {}), insertions: [...(this.state.document.insertions ?? []), item] }); this.select(id); if (kind !== 'image') void this.editInsertion(id);
  }
  private syncInsertions() {
    const insertions = this.state.document.insertions ?? [];
    for (const [id, element] of this.elements) if (id.startsWith('new_') && !insertions.some(item => item.id === id)) { element.remove(); this.elements.delete(id); this.nodes.delete(id); this.originals.delete(id); this.originalOrder.delete(id); for (const parent of this.nodes.values()) parent.children = parent.children.filter(child => child !== id); }
    for (const insertion of insertions) {
      let element = this.elements.get(insertion.id); const parent = this.elements.get(insertion.parent); if (!parent) continue;
      if (!element) { element = this.doc.createElement(insertion.kind === 'heading' ? 'h2' : insertion.kind === 'image' ? 'img' : insertion.kind === 'link' || insertion.kind === 'button' ? 'a' : 'p'); element.dataset.c9yNode = insertion.id; parent.insertBefore(element, insertion.before ? this.elements.get(insertion.before) ?? null : null); this.elements.set(insertion.id, element); this.originals.set(insertion.id, { style: '', hidden: false }); this.originalOrder.set(insertion.id, []); this.nodes.set(insertion.id, { id: insertion.id, tag: element.localName, parent: insertion.parent, children: [], label: insertion.kind[0].toUpperCase() + insertion.kind.slice(1), capabilities: ['width', 'hide', 'reorder'] }); const parentNode = this.nodes.get(insertion.parent); if (parentNode && !parentNode.children.includes(insertion.id)) parentNode.children.push(insertion.id); }
      if (this.insertionEditor?.id === insertion.id) continue;
      if (insertion.kind === 'image') { element.setAttribute('src', new URL(this.frame.src).pathname.replace(/\/document$/, '/files') + (insertion.src ?? '')); element.setAttribute('alt', insertion.alt ?? ''); }
      else { if (insertion.kind === 'text') element.innerHTML = renderMarkdown(insertion.text ?? ''); else element.textContent = insertion.text ?? ''; if (insertion.href) element.setAttribute('href', insertion.href); if (insertion.kind === 'button') element.classList.add('ds-button'); }
    }
    for (const node of this.nodes.values()) { const reorderable = !!node.parent && (this.nodes.get(node.parent)?.children.length ?? 0) > 1; node.capabilities = node.capabilities.filter(capability => capability !== 'reorder'); if (reorderable) node.capabilities.push('reorder'); }
    this.bindSort();
  }
  private async editInsertion(id: string) {
    if (!(await this.beforeEdit())) return;
    this.select(id); const item = this.state.document.insertions?.find(item => item.id === id), element = this.elements.get(id); if (!item || !element) return;
    const editor = createPlainEditor(element, { value: item.text ?? '', onChange: text => { this.state.commit({ ...this.state.document, insertions: this.state.document.insertions?.map(each => each.id === id ? { ...each, text } : each) }); } });
    this.insertionEditor = { id, editor }; editor.focus();
  }
  private finishInsertion() { const current = this.insertionEditor; if (!current) return; this.insertionEditor = undefined; current.editor.destroy(); this.syncInsertions(); }
  private setupSort() {
    this.sort = createSortable({ lockAxis: 'y', inheritProperties: ['--sf'], onDragStart: ({ draggableId }) => { this.busy = true; this.select(draggableId); }, prepareDrop: result => {
      this.busy = false; const node = this.nodes.get(result.draggableId), parent = node?.parent ? this.nodes.get(node.parent) : undefined;
      if (result.reason === 'DROP' && result.destination && parent && result.destination.droppableId === parent.id) { const order = this.state.document.order[parent.id] ?? parent.children; const start = order.indexOf(result.draggableId); if (start >= 0) this.state.commit({ ...this.state.document, order: { ...this.state.document.order, [parent.id]: reorder({ list: order, startIndex: start, finishIndex: result.destination.index }) } }); }
      return this.elements.get(result.draggableId) ?? null;
    }, onDragEnd: () => { this.busy = false; if (!this.disposed) { this.paint(); this.schedule(); } }, outOfTheWay: { duration: 180, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }, drop: { minDuration: 150, maxDuration: 200, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' } });
    this.bindSort();
  }
  private bindSort() {
    if (!this.sort) return;
    for (const [id, dispose] of this.sortItems) if (!this.elements.has(id) || !this.nodes.get(id)?.capabilities.includes('reorder')) { dispose(); this.sortItems.delete(id); }
    for (const [id, dispose] of this.sortContainers) if (!this.elements.has(id) || (this.nodes.get(id)?.children.length ?? 0) < 2) { dispose(); this.sortContainers.delete(id); }
    for (const node of this.nodes.values()) { const element = this.elements.get(node.id); if (!element) continue;
      if (node.children.length > 1 && !this.sortContainers.has(node.id)) this.sortContainers.set(node.id, this.sort.container({ element, id: node.id, type: node.id, axis: 'vertical', label: node.label }));
      if (!this.sortItems.has(node.id) && node.capabilities.includes('reorder') && node.parent && this.nodes.get(node.parent)?.children.length! > 1) { element.tabIndex = 0; this.sortItems.set(node.id, this.sort.item({ element, id: node.id, type: node.parent, label: node.label, canDrag: ({ target }) => this.selected === node.id && !this.insertionEditor && !!target && !target.closest('[data-cms-words],a,button,input,textarea,select,[contenteditable]:not([contenteditable=false])') })); }
    }
  }
  async flush() { this.sort?.cancel(); this.finishInsertion(); return this.state.flush(); }
  destroy() { this.disposed = true; this.finishInsertion(); this.state.destroy(); for (const dispose of [...this.sortItems.values(), ...this.sortContainers.values()]) dispose(); this.sort?.destroy(); this.settle.cancel(); this.resize.disconnect(); this.menu?.remove(); this.disposers.forEach(dispose => dispose()); cancelAnimationFrame(this.drawFrame); this.overlay.remove(); }
}
