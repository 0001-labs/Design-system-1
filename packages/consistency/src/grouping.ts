import { visibleComponentBox } from './component-names';
import './grouping.css';
const selector = '.consistency-story-section,.consistency-projects,.consistency-statistics,.consistency-sample-actions,.aa-columns,.aa-column,ds-card,ds-stat,.consistency-carousel-frame';
/** Describe real layout containers, never arbitrary DOM wrappers or text blocks. */
export function groupingName(element: HTMLElement): string {
 if (element.matches('.consistency-story-section')) {
  const group = element.closest('[data-sort-group]');
  const heading = element.querySelector<HTMLElement>('.aa-block[data-kind="heading"]')?.textContent?.trim().replace(/^#{1,6}\s*/, '');
  return `Section · ${heading || group?.getAttribute('aria-label') || 'Content'} — moves together`;
 }
 if (element.matches('.consistency-projects')) return 'Cards · laid out together';
 if (element.matches('.consistency-statistics')) return 'Stats · laid out together';
 if (element.matches('.consistency-sample-actions')) return 'Actions · laid out together';
 if (element.matches('.aa-columns')) return 'Columns · share available width';
 if (element.matches('.aa-column')) return 'Column · content flows together';
 if (element.matches('ds-card')) return 'Card · content stays together';
 if (element.matches('ds-stat')) return 'Stat · label, value and caption';
 return 'Carousel · slides move together';
}
/** A read-only overlay outside the authored page, independent of selection. */
export class GroupingLayer {
 private overlay: HTMLElement;
 private observer: MutationObserver;
 private resize = new ResizeObserver(() => this.schedule());
 private observed = new Set<HTMLElement>();
 private frame = 0;
 private destroyed = false;
 constructor(private root: HTMLElement, private enabled: () => boolean) {
  const doc = root.ownerDocument;
  this.overlay = doc.createElement('div'); this.overlay.className = 'consistency-grouping'; this.overlay.hidden = true; this.overlay.inert = true; this.overlay.setAttribute('aria-hidden', 'true'); doc.body.append(this.overlay);
  this.observer = new MutationObserver(this.schedule);
  this.observer.observe(root, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['style', 'class', 'hidden'] });
  doc.addEventListener('scroll', this.schedule, true); doc.defaultView?.addEventListener('resize', this.schedule);
 }
 private schedule = () => { if (!this.destroyed && this.enabled() && !this.frame) this.frame = requestAnimationFrame(() => { this.frame = 0; this.refresh(); }); };
 refresh() {
  if (this.destroyed) return;
  const sheet = this.root.querySelector<HTMLElement>('.consistency-sheet'), stage = sheet?.closest<HTMLElement>('.consistency-stage');
  this.overlay.hidden = !this.enabled() || !sheet || !stage;
  if (this.overlay.hidden || !sheet || !stage) { this.overlay.replaceChildren(); this.resize.disconnect(); this.observed.clear(); return; }
  const win = this.root.ownerDocument.defaultView!;
  const clips = [sheet.getBoundingClientRect(), stage.getBoundingClientRect(), { left: 0, top: 0, right: win.innerWidth, bottom: win.innerHeight }];
  const targets = Array.from(sheet.querySelectorAll<HTMLElement>(selector)).filter(el => !el.closest('[hidden]'));
  const present = new Set(targets);
  for (const old of this.observed) if (!present.has(old)) { this.resize.unobserve(old); this.observed.delete(old); }
  for (const target of targets) if (!this.observed.has(target)) { this.resize.observe(target); this.observed.add(target); }
  // Read all layout before painting; overlays cannot change authored geometry.
  const records = targets.map(target => ({ target, box: visibleComponentBox(target.getBoundingClientRect(), clips), name: groupingName(target) }));
  const boxes: HTMLElement[] = [];
  // Both diagnostic layers can be on: reserve component labels before placing group names.
  const occupied = Array.from(this.root.ownerDocument.querySelectorAll<HTMLElement>('.consistency-component-names:not([hidden]) .consistency-component-name > span')).map(label => label.getBoundingClientRect()).map(({top,bottom,left,right}) => ({top,bottom,left,right}));
  const scale = parseFloat(getComputedStyle(sheet).getPropertyValue('--sf')) || 1;
  this.overlay.style.setProperty('--sf', String(scale));
  const unit = 20 * scale;
  for (const {target, box, name} of records) {
   if (!box) continue;
   const el = this.root.ownerDocument.createElement('div'); el.className = 'consistency-group-box'; el.dataset.groupName = name;
   Object.assign(el.style, { left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px` });
   let depth = 0;
   for (let parent = target.parentElement; parent && parent !== sheet; parent = parent.parentElement) if (parent.matches(selector)) depth++;
   el.dataset.depth = String(depth);
   // Reserve whole rows for nested labels so container names never cover each other.
   let y = box.top;
   while (occupied.some(r => y < r.bottom && y + unit > r.top && box.left < r.right && box.left + box.width > r.left)) y += unit;
   if (y + unit <= box.top + box.height) {
    const label = this.root.ownerDocument.createElement('span'); label.textContent = name; label.style.top = `${y-box.top}px`; el.append(label);
    occupied.push({top:y,bottom:y+unit,left:box.left,right:box.left+box.width});
   }
   boxes.push(el);
  }
  this.overlay.replaceChildren(...boxes);
  if (this.root.getAnimations({subtree:true}).some(animation => animation.playState === 'running')) this.schedule();
 }
 destroy() { this.destroyed = true; cancelAnimationFrame(this.frame); this.observer.disconnect(); this.resize.disconnect(); this.root.ownerDocument.removeEventListener('scroll',this.schedule,true); this.root.ownerDocument.defaultView?.removeEventListener('resize',this.schedule); this.overlay.remove(); }
}
