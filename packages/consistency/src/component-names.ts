import './component-names.css';
const componentNames: Record<string, string> = { 'DS-CARD': 'Card', 'DS-BUTTON': 'Button', 'DS-STAT': 'Stat', 'DS-TAG': 'Tag', 'DS-IMAGE': 'Image', 'DS-TABLE': 'Table', 'DS-LIST': 'List', 'DS-ACCORDION': 'Accordion', 'DS-METER': 'Meter', 'DS-PROGRESS': 'Progress', 'DS-CHART': 'Chart', 'DS-BENTO': 'Bento', 'DS-TABS': 'Tabs' };
const selector = [...Object.keys(componentNames).map(name => name.toLowerCase()), '.aa-block', '.aa-atom', '.consistency-carousel-frame'].join(',');
/** Names come from the rendered unit, not its stored example or source text. */
export function componentName(element: HTMLElement): string | null {
 if (element.closest('.consistency-carousel-tools,.consistency-button-action,ds-context')) return null;
 if (element.classList.contains('consistency-carousel-frame')) return 'Carousel';
 if (componentNames[element.tagName]) return componentNames[element.tagName];
 if (element.classList.contains('aa-atom')) {
  if (element.querySelector('ds-card,ds-button')) return null;
  const atom = element.dataset.atom;
  return ({ image: 'Image', columns: 'Columns', tabs: 'Tabs', diagram: 'Diagram', equation: 'Equation', 'equation-block': 'Equation', toc: 'Table of contents' } as Record<string, string>)[atom ?? ''] ?? (element.classList.contains('aa-columns') ? 'Columns' : null);
 }
 if (!element.classList.contains('aa-block') || element.closest('.aa-plain') || element.querySelector(':scope > .aa-atom')) return null;
 const kind = element.dataset.kind;
 if (kind === 'heading') return `Heading ${element.dataset.level ?? ''}`.trim();
 if (kind === 'table') return 'Table';
 if (kind === 'bullet') return element.hasAttribute('data-checked') ? 'Checklist item' : 'List item';
 if (kind === 'number' || kind === 'ordered' || kind === 'numbered') return 'List item';
 if (kind === 'quote') return 'Quote';
 if (kind === 'code') return 'Code';
 if (kind === 'divider') return 'Divider';
 return element.textContent?.trim() ? 'Text' : null;
}
export interface VisibleBox { left: number; top: number; width: number; height: number }
/** The overlay never reaches beyond the visible canvas, even for a wide page. */
export function visibleComponentBox(rect: Pick<DOMRect, 'left' | 'top' | 'right' | 'bottom'>, clips: readonly Pick<DOMRect, 'left' | 'top' | 'right' | 'bottom'>[]): VisibleBox | null {
 const left = Math.max(rect.left, ...clips.map(clip => clip.left)), top = Math.max(rect.top, ...clips.map(clip => clip.top));
 const right = Math.min(rect.right, ...clips.map(clip => clip.right)), bottom = Math.min(rect.bottom, ...clips.map(clip => clip.bottom));
 return right > left && bottom > top ? { left, top, width: right - left, height: bottom - top } : null;
}
/** An external presentation layer; no authored nodes, source or history change. */
export class ComponentNamesLayer {
 private overlay: HTMLElement;
 private observer: MutationObserver;
 private resize = new ResizeObserver(() => this.schedule());
 private observed = new Set<HTMLElement>();
 private frame = 0;
 private destroyed = false;
 constructor(private root: HTMLElement, private state: { enabled: () => boolean }) {
  const doc = root.ownerDocument;
  this.overlay = doc.createElement('div'); this.overlay.className = 'consistency-component-names'; this.overlay.setAttribute('aria-hidden', 'true'); this.overlay.hidden = true; this.overlay.inert = true; doc.body.append(this.overlay);
  this.observer = new MutationObserver(() => this.schedule()); this.observer.observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['style', 'class', 'hidden', 'data-kind', 'data-level', 'data-atom'] });
  doc.addEventListener('scroll', this.schedule, true); doc.defaultView?.addEventListener('resize', this.schedule);
 }
 private schedule = () => { if (!this.destroyed && !this.frame && this.state.enabled()) this.frame = requestAnimationFrame(() => { this.frame = 0; this.refresh(); }); };
 refresh() {
  if (this.destroyed) return;
  const sheet = this.root.querySelector<HTMLElement>('.consistency-sheet'), stage = sheet?.closest<HTMLElement>('.consistency-stage');
  const enabled = this.state.enabled() && !!sheet && !!stage; this.overlay.hidden = !enabled;
  if (!enabled || !sheet || !stage) { this.overlay.replaceChildren(); return; }
  const win = this.root.ownerDocument.defaultView!;
  const clips = [sheet.getBoundingClientRect(), stage.getBoundingClientRect(), { left: 0, top: 0, right: win.innerWidth, bottom: win.innerHeight }];
  const targets = Array.from(sheet.querySelectorAll<HTMLElement>(selector)).filter(element => componentName(element) && !element.closest('[hidden]'));
  const present = new Set(targets);
  for (const old of this.observed) if (!present.has(old)) { this.resize.unobserve(old); this.observed.delete(old); }
  for (const target of targets) if (!this.observed.has(target)) { this.observed.add(target); this.resize.observe(target); }
  const boxes: HTMLElement[] = []; let moving = false;
  for (const target of targets) {
   const name = componentName(target)!, rect = visibleComponentBox(target.getBoundingClientRect(), clips); if (!rect) continue;
   const box = this.root.ownerDocument.createElement('div'); box.className = 'consistency-component-name'; box.dataset.componentName = name;
   Object.assign(box.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
   const label = this.root.ownerDocument.createElement('span'); label.textContent = name; box.append(label); boxes.push(box);
   moving ||= target.getAnimations?.().some(animation => animation.playState === 'running') ?? false;
  }
  this.overlay.replaceChildren(...boxes);
  if (moving) this.schedule();
 }
 destroy() {
  this.destroyed = true; if (this.frame) cancelAnimationFrame(this.frame); this.observer.disconnect(); this.resize.disconnect(); this.observed.clear();
  this.root.ownerDocument.removeEventListener('scroll', this.schedule, true); this.root.ownerDocument.defaultView?.removeEventListener('resize', this.schedule); this.overlay.remove();
 }
}
