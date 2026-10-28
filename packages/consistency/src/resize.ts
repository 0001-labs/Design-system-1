import { bindSpacingHandle } from '../../app/src/2-core/spacing-handle';
import { readPicture, writePicture } from '../../../website/src/vendor/aa/aa';
import './resize.css';
import { CompositionSettle } from './settle';
export type ElementSize = { width: number; height: number };
export function resizeValue(value: number, min = 80, max = 2000) { return Math.min(max, Math.max(min, Math.round(value / 20) * 20)); }
export function cardMinimumHeight(target: HTMLElement, scale = 1, snap = true): number {
  const surface = target.shadowRoot?.querySelector<HTMLElement>('.ds-card'); if (!surface) return 80;
  const style = getComputedStyle(surface);
  const content = ['label', 'title', 'body'].reduce((sum, name) => {
    const part = surface.querySelector<HTMLElement>(`.ds-card__${name}`);
    if (!part || part.hidden) return sum;
    const partStyle = getComputedStyle(part);
    return sum + part.getBoundingClientRect().height + (Number.parseFloat(partStyle.marginTop) || 0) + (Number.parseFloat(partStyle.marginBottom) || 0);
  }, 0);
  const media = surface.querySelector<HTMLElement>('.ds-card__media');
  const mediaContent = media && !media.hidden ? Math.max(0, ...Array.from(target.querySelectorAll<HTMLElement>('[slot="media"]')).map(node => node.getBoundingClientRect().height)) + (Number.parseFloat(getComputedStyle(media).paddingTop) || 0) : 0;
  const minimum = (content + Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom) + mediaContent) / scale;
  return snap ? Math.ceil(minimum / 20) * 20 : minimum;
}
export function cardMinimumWidth(target: HTMLElement, scale = 1): number {
  const canvas = target.ownerDocument.createElement('canvas'), context = canvas.getContext('2d'); let widest = 0;
  for (const field of target.querySelectorAll<HTMLElement>('[slot="label"],[slot="title"],p,ds-tag')) { if (!context) break; const style = getComputedStyle(field.slot ? target.shadowRoot?.querySelector<HTMLElement>(`.ds-card__${field.slot}`) ?? field : field); context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`; for (const word of (field.textContent ?? '').split(/\s+/)) if (!/^(https?:\/\/|www\.)/i.test(word)) widest = Math.max(widest, context.measureText(word).width); }
  const surface = target.shadowRoot?.querySelector<HTMLElement>('.ds-card');
  const style = surface ? getComputedStyle(surface) : undefined;
  const inset = Math.max(20, (Number.parseFloat(style?.paddingLeft ?? '') || 20) / scale) + Math.max(20, (Number.parseFloat(style?.paddingRight ?? '') || 20) / scale);
  return Math.max(240, Math.ceil((widest / scale + inset) / 20) * 20);
}
/** Invisible edge targets share App's pointer, cancellation and keyboard lifecycle. */
export class ResizingLayer {
  private bindings = new Map<HTMLElement, { dispose: () => void; edges: HTMLElement[] }>();
  private observer: MutationObserver;
  private active = false;
  private pending = new WeakSet<HTMLElement>();
  private settle = new CompositionSettle();

  constructor(private root: HTMLElement, private options: { enabled: () => boolean; consistency?: () => boolean; size: (key: string) => ElementSize | undefined; commit: (key: string, size: ElementSize) => void }) {
    this.observer = new MutationObserver(records => { if (records.some(record => !(record.target.nodeType === 1 ? record.target as Element : record.target.parentElement)?.closest('.consistency-resize-edge,.consistency-card-gap'))) this.refresh(); }); this.observer.observe(root, { childList: true, subtree: true });
  }
  refresh() {
    if (this.active) return;
    for (const [target, binding] of this.bindings) if (!target.isConnected) { binding.dispose(); this.bindings.delete(target); }
    for (const target of this.root.querySelectorAll<HTMLElement>('.consistency-sheet ds-card, .consistency-sheet .aa-atom[data-atom="image"]:has(>img), .consistency-sheet .consistency-carousel-frame')) {
      if (target.closest('.aa-command-preview')) continue;
      const card = target.tagName === 'DS-CARD', carousel = target.classList.contains('consistency-carousel-frame'); const key = target.dataset.selectable;
      if (card && target.hasAttribute('data-card-spacing-preview')) continue;
      if (card && key && !target.closest('.aa-atom')) {
        const size = this.options.size(key); if (size) { target.style.width = `calc(${size.width}px * var(--sf))`; target.style.height = `calc(${size.height}px * var(--sf))`; target.style.flex = 'none'; }
        else { target.style.removeProperty('width'); target.style.removeProperty('height'); target.style.removeProperty('flex'); }
      }
      if (card && key && !target.closest('.aa-atom') && target.parentElement?.classList.contains('consistency-projects')) { const property = target === target.parentElement.firstElementChild ? '--resize-first' : '--resize-last'; const saved = this.options.size(key); if (saved) target.parentElement.style.setProperty(property, `calc(${saved.width}px * var(--sf))`); else target.parentElement.style.removeProperty(property); }
      if (!this.bindings.has(target) && card && !target.shadowRoot?.querySelector('.ds-card')) { if (!this.pending.has(target)) { this.pending.add(target); void (target as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete.then(() => { this.pending.delete(target); this.refresh(); }); } continue; }
      // A linked size is the requested design size. Each instance still needs
      // enough layout room for its own independent words at the applied width.
      if (card) target.style.minWidth = `calc(${cardMinimumWidth(target, this.scaleOf(target))}px * var(--sf))`;
      if (card) target.style.minHeight = `calc(${cardMinimumHeight(target, Number.parseFloat(getComputedStyle(target).getPropertyValue('--sf')) || 1)}px * var(--sf))`;
      if (!this.bindings.has(target)) this.bind(target, card, carousel);
      for (const edge of this.bindings.get(target)!.edges) { edge.hidden = !this.options.enabled(); edge.tabIndex = this.options.enabled() ? 0 : -1; }
    }
    if (this.options.consistency?.()) {
      const cards = this.peers();
      const minimum = Math.max(80, ...cards.map(card => cardMinimumHeight(card, this.scaleOf(card))));
      for (const card of cards) card.style.minHeight = `calc(${minimum}px * var(--sf))`;
    }
  }
  private scaleOf(target: HTMLElement) { return Number.parseFloat(getComputedStyle(target).getPropertyValue('--sf')) || 1; }
  private peers(target?: HTMLElement) { return target && !this.options.consistency?.() ? [target] : Array.from(this.root.querySelectorAll<HTMLElement>('.consistency-sheet ds-card')).filter(card => !card.hidden && !card.closest('.aa-command-preview')); }
  private bind(target: HTMLElement, card: boolean, carousel = false) {
    target.classList.add('consistency-resizable');
    const box = card || carousel;
    const name = carousel ? 'Carousel' : card ? 'Card' : 'Image';
    const scale = () => Number.parseFloat(getComputedStyle(target).getPropertyValue('--sf')) || 1;
    const maxWidth = () => Math.max(box ? minWidth : 80, ((target.closest<HTMLElement>('.aa-column')?.closest<HTMLElement>('.aa-columns') ?? target.closest<HTMLElement>('.aa-block') ?? target.parentElement)?.clientWidth ?? 2000) / scale());
    const minimumWidth = () => card ? Math.max(...this.peers(target).map(peer => cardMinimumWidth(peer, this.scaleOf(peer)))) : carousel ? 160 : 80;
    const minimumHeight = () => card ? Math.max(...this.peers(target).map(peer => cardMinimumHeight(peer, this.scaleOf(peer)))) : carousel ? 160 : 80;
    let minWidth = minimumWidth();
    let originals: { node: HTMLElement; css: string }[] = [];
    const begin = () => { this.active = true; originals = [...new Set([...(card ? this.peers(target) : [target]), ...(card ? this.peers(target) : [target]).map(peer => peer.parentElement!).filter(Boolean)])].map(node => ({ node, css: node.style.cssText })); for (const peer of card ? this.peers(target) : [target]) peer.setAttribute('data-resizing', ''); };
    const end = (cancelled: boolean) => { if (cancelled) for (const item of originals) item.node.style.cssText = item.css; for (const peer of card ? this.peers(target) : [target]) peer.removeAttribute('data-resizing'); originals = []; this.active = false; };
    const size = (): ElementSize => { const rect = target.getBoundingClientRect(); const scale = Number.parseFloat(getComputedStyle(target).getPropertyValue('--sf')) || 1; return { width: rect.width / scale, height: rect.height / scale }; };
    const paintSize = (dimensions: ElementSize) => {
      if (card) {
        const peers = this.peers(target);
        const width = Math.max(dimensions.width, minimumWidth());
        for (const peer of peers) {
          peer.style.width = `calc(${width}px * var(--sf))`; peer.style.flex = 'none';
          if (peer.parentElement?.classList.contains('consistency-projects')) peer.parentElement.style.setProperty(peer === peer.parentElement.firstElementChild ? '--resize-first' : '--resize-last', `calc(${width}px * var(--sf))`);
        }
        const minHeight = minimumHeight(), height = Math.max(dimensions.height, minHeight);
        for (const peer of peers) { peer.style.minHeight = `calc(${minHeight}px * var(--sf))`; peer.style.height = `calc(${height}px * var(--sf))`; }
      } else if (carousel) { target.style.width = `calc(${dimensions.width}px * var(--sf))`; target.style.height = `calc(${dimensions.height}px * var(--sf))`; target.style.setProperty('--consistency-carousel-height', `calc(${dimensions.height}px * var(--sf))`);
      } else { target.style.width = `calc(${dimensions.width}px * var(--sf))`; target.style.maxWidth = 'none'; target.style.height = 'auto'; target.style.flex = 'none'; }
    };
    const save = (dimensions: ElementSize) => {
      const atom = target.closest<HTMLElement>('.aa-atom');
      if (atom && box) atom.dispatchEvent(new CustomEvent('consistency-resize', { detail: dimensions }));
      else if (atom) { const picture = readPicture(atom.dataset.source ?? ''); atom.dataset.width = String(dimensions.width / 20); atom.style.setProperty('--aa-picture-width', String(dimensions.width / 20)); atom.dispatchEvent(new CustomEvent('aa-atom-source', { bubbles: true, detail: { source: writePicture(picture.alt, picture.src, dimensions.width / 20) } })); }
      else if (target.dataset.selectable) this.options.commit(target.dataset.selectable, dimensions);
    };
    this.bindings.set(target, bindResizeEdges(target, {
      enabled: this.options.enabled, host: target, box, card, carousel, name, scale, size, minimumWidth, minimumHeight, maxWidth,
      begin, end, paintSize, save, cancelSettle: () => this.settle.cancel(),
      settle: update => this.settle.run(Array.from(this.root.querySelectorAll<HTMLElement>('.consistency-sheet aa-editor > .aa-block,.consistency-sheet ds-card,.consistency-sheet ds-button,.consistency-sheet ds-stat,.consistency-sheet .consistency-gap,.consistency-sheet .consistency-carousel-frame')), update),
    }));
  }
  destroy() { this.settle.cancel(); this.observer.disconnect(); for (const binding of this.bindings.values()) binding.dispose(); this.bindings.clear(); }
}


export interface ResizeTargetOptions {
  enabled: () => boolean; host: HTMLElement; box: boolean; card?: boolean; carousel?: boolean; name: string;
  axes?: Array<'width' | 'height'>;
  scale: () => number; size: () => ElementSize; minimumWidth: () => number; minimumHeight: () => number; maxWidth: () => number;
  begin: () => void; end: (cancelled: boolean) => void; paintSize: (size: ElementSize) => void; save: (size: ElementSize) => void;
  cancelSettle: () => void; settle: (update: () => Promise<unknown>) => Promise<unknown>;
}
/** Canonical edge and corner gestures. The adapter supplies only document measures and persistence. */
export function bindResizeEdges(target: HTMLElement, options: ResizeTargetOptions): { edges: HTMLElement[]; dispose: () => void } {
  const { host, box, card, carousel, name, scale, size, minimumWidth, minimumHeight, maxWidth, begin, end, paintSize, save } = options;
  let minWidth = minimumWidth();
  const disposers: (() => void)[] = [], edges: HTMLElement[] = [];
    for (const axis of options.axes ?? (box ? ['width', 'height'] as const : ['width'] as const)) {
      const edge = target.ownerDocument.createElement('span'); edge.className = `consistency-resize-edge consistency-resize-${axis}`; edge.contentEditable = 'false'; edge.setAttribute('data-aa-interactive', ''); edge.setAttribute('role', 'slider'); edge.setAttribute('aria-label', `${name} ${axis}`); edge.setAttribute('aria-orientation', axis === 'width' ? 'horizontal' : 'vertical'); edge.setAttribute('aria-valuemin', carousel ? '160' : '80'); edge.setAttribute('aria-valuemax', carousel && axis === 'height' ? '1200' : '2000'); host.append(edge); edges.push(edge);
      const measure = target.ownerDocument.createElement('span'); measure.style.pointerEvents = 'none'; measure.setAttribute('aria-hidden', 'true'); edge.append(measure);
            const paint = (value: number) => {
        if (box) paintSize({ ...size(), [axis]: Math.max(value, axis === 'width' ? minimumWidth() : minimumHeight()) });
        else paintSize({ ...size(), width: value });
        measure.textContent = String(Math.round(size()[axis])); edge.setAttribute('aria-valuenow', String(Math.round(size()[axis]))); edge.setAttribute('aria-valuetext', `${Math.round(size()[axis])} pixels`);
      };
      disposers.push(bindSpacingHandle(edge, () => ({ value: size()[axis], min: box ? axis === 'width' ? minWidth : minimumHeight() : 80, max: axis === 'width' ? maxWidth() : carousel ? 1200 : 2000, step: 20, shiftStep: 100, axis: axis === 'width' ? 'horizontal' : 'vertical', gain: 1 / (Number.parseFloat(getComputedStyle(target).getPropertyValue('--sf')) || 1), disabled: !options.enabled(),
        onPointerStart: () => { (target.ownerDocument.activeElement as HTMLElement | null)?.blur?.(); },
        onStart: () => { edge.setAttribute('data-resize-active', ''); options.cancelSettle(); if (box) minWidth = minimumWidth(); begin(); },
        onPreview: paint,
        onCommit: value => {
          const dimensions = { ...size(), [axis]: Math.max(resizeValue(value), box ? axis === 'width' ? minWidth : minimumHeight() : 80) };
          void options.settle(async () => {
          paint(dimensions[axis]); dimensions.height = size().height;
          save(dimensions);
          await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
          });
        },
        onEnd: cancelled => { edge.removeAttribute('data-resize-active'); end(cancelled); },
      })));
      measure.textContent = String(Math.round(size()[axis])); edge.setAttribute('aria-valuenow', String(Math.round(size()[axis])));
    }
    if (options.axes && !options.axes.includes('width')) return { edges, dispose: () => { disposers.forEach(dispose => dispose()); edges.forEach(edge => edge.remove()); } };
    const corner = target.ownerDocument.createElement('span'); corner.className = 'consistency-resize-edge consistency-resize-corner'; corner.contentEditable = 'false'; corner.setAttribute('data-aa-interactive', ''); corner.setAttribute('role', 'button'); corner.setAttribute('aria-label', `${name} size`); host.append(corner); edges.push(corner);
    let cancelCorner: (() => void) | undefined;
    const cornerDown = (event: PointerEvent) => {
      if (!options.enabled() || event.button !== 0 || !event.isPrimary) return;
      event.preventDefault(); event.stopPropagation(); (target.ownerDocument.activeElement as HTMLElement | null)?.blur?.(); corner.setAttribute('data-resize-active', ''); options.cancelSettle(); if (box) minWidth = minimumWidth();
      const start = size(); let current = start; let moved = false; const win = target.ownerDocument.defaultView!;
      begin();
      const move = (next: PointerEvent) => { if (next.pointerId !== event.pointerId) return; if (!options.enabled()) return finish(true); const dx = (next.clientX - event.clientX) / scale(), dy = (next.clientY - event.clientY) / scale(); if (!moved && Math.hypot(dx, dy) < 3) return; moved = true; const delta = Math.abs(dx) >= Math.abs(dy) ? dx : dy * start.width / start.height; current = { width: Math.max(box ? minWidth : 80, Math.min(maxWidth(), start.width + (box ? dx : delta))), height: box ? Math.max(minimumHeight(), Math.min(carousel ? 1200 : 2000, start.height + dy)) : start.height }; paintSize(current); current = size(); corner.textContent = `${Math.round(current.width)} × ${Math.round(current.height)}`; };
      const finish = (cancelled: boolean) => { win.removeEventListener('pointermove', move); win.removeEventListener('pointerup', up); win.removeEventListener('pointercancel', cancel); win.removeEventListener('keydown', escape); win.removeEventListener('blur', cancel); cancelCorner = undefined; corner.removeAttribute('data-resize-active'); if (!moved) { end(false); return; } if (cancelled) { end(true); return; } end(false); void options.settle(async () => { current = { width: Math.max(box ? minWidth : 80, resizeValue(current.width)), height: resizeValue(current.height) }; paintSize(current); current = size(); save(current); await new Promise<void>(resolve => requestAnimationFrame(() => resolve())); }); };
      const up = (next: PointerEvent) => { if (next.pointerId === event.pointerId) finish(false); }; const cancel = () => finish(true); const escape = (key: KeyboardEvent) => { if (key.key === 'Escape') { key.preventDefault(); key.stopPropagation(); finish(true); } };
      win.addEventListener('pointermove', move); win.addEventListener('pointerup', up); win.addEventListener('pointercancel', cancel); win.addEventListener('keydown', escape); win.addEventListener('blur', cancel); cancelCorner = cancel;
    };
    const cornerKey = (event: KeyboardEvent) => { if (!options.enabled() || !['ArrowRight','ArrowLeft','ArrowDown','ArrowUp'].includes(event.key)) return; event.preventDefault(); event.stopPropagation(); const start = size(), delta = (event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1) * (event.shiftKey ? 100 : 20); const next = { width: Math.max(box ? minWidth : 80, Math.min(maxWidth(), resizeValue(start.width + delta))), height: box ? resizeValue(start.height + delta) : start.height }; paintSize(next); save(size()); };
    const measureCorner = () => { const dimensions = size(); corner.textContent = `${Math.round(dimensions.width)} × ${Math.round(dimensions.height)}`; };
    corner.addEventListener('pointerenter', measureCorner); corner.addEventListener('focus', measureCorner);
    corner.addEventListener('pointerdown', cornerDown); corner.addEventListener('keydown', cornerKey); disposers.push(() => { cancelCorner?.(); corner.removeEventListener('pointerenter', measureCorner); corner.removeEventListener('focus', measureCorner); corner.removeEventListener('pointerdown', cornerDown); corner.removeEventListener('keydown', cornerKey); });
  return { edges, dispose: () => { disposers.forEach(dispose => dispose()); edges.forEach(edge => edge.remove()); } };
}
