import { bindSpacingHandle } from '../../app/src/2-core/spacing-handle';
import { readPicture, writePicture } from '../../../website/src/vendor/aa/aa';
import './resize.css';
import { CompositionSettle } from './settle';
export type ElementSize = { width: number; height: number };
export function resizeValue(value: number, min = 80, max = 2000) { return Math.min(max, Math.max(min, Math.round(value / 20) * 20)); }
export function cardMinimumHeight(target: HTMLElement, scale = 1): number {
  const surface = target.shadowRoot?.querySelector<HTMLElement>('.ds-card'); if (!surface) return 80;
  const style = getComputedStyle(surface);
  const content = ['label', 'title', 'body'].reduce((sum, name) => { const part = surface.querySelector<HTMLElement>(`.ds-card__${name}`); return sum + (part && !part.hidden ? part.getBoundingClientRect().height : 0); }, 0);
  return Math.ceil((content + Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom) + 20 * scale) / scale / 20) * 20;
}
function cardMinimumWidth(target: HTMLElement, scale = 1): number {
  const canvas = target.ownerDocument.createElement('canvas'), context = canvas.getContext('2d'); let widest = 0;
  for (const field of target.querySelectorAll<HTMLElement>('[slot="label"],[slot="title"],p,ds-tag')) { if (!context) break; const style = getComputedStyle(field.slot ? target.shadowRoot?.querySelector<HTMLElement>(`.ds-card__${field.slot}`) ?? field : field); context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`; for (const word of (field.textContent ?? '').split(/\s+/)) widest = Math.max(widest, context.measureText(word).width); }
  return Math.ceil((widest / scale + 40) / 20) * 20;
}
/** Invisible edge targets share App's pointer, cancellation and keyboard lifecycle. */
export class ResizingLayer {
  private bindings = new Map<HTMLElement, { dispose: () => void; edges: HTMLElement[] }>();
  private observer: MutationObserver;
  private pending = new WeakSet<HTMLElement>();
  private settle = new CompositionSettle();

  constructor(private root: HTMLElement, private options: { enabled: () => boolean; size: (key: string) => ElementSize | undefined; commit: (key: string, size: ElementSize) => void }) {
    this.observer = new MutationObserver(records => { if (records.some(record => !(record.target instanceof Element ? record.target : record.target.parentElement)?.closest('.consistency-resize-edge'))) this.refresh(); }); this.observer.observe(root, { childList: true, subtree: true });
  }
  refresh() {
    for (const [target, binding] of this.bindings) if (!target.isConnected) { binding.dispose(); this.bindings.delete(target); }
    for (const target of this.root.querySelectorAll<HTMLElement>('.consistency-sheet ds-card, .consistency-sheet .aa-atom[data-atom="image"]:has(>img)')) {
      if (target.closest('.aa-command-preview')) continue;
      const card = target.tagName === 'DS-CARD'; const key = target.dataset.selectable;
      if (card && key && !target.closest('.aa-atom')) {
        const size = this.options.size(key); if (size) { target.style.width = `calc(${size.width}px * var(--sf))`; target.style.height = `calc(${size.height}px * var(--sf))`; target.style.flex = 'none'; }
        else { target.style.removeProperty('width'); target.style.removeProperty('height'); target.style.removeProperty('flex'); }
      }
      if (card && key && !target.closest('.aa-atom') && target.parentElement?.classList.contains('consistency-projects')) { const property = target === target.parentElement.firstElementChild ? '--resize-first' : '--resize-last'; const saved = this.options.size(key); if (saved) target.parentElement.style.setProperty(property, `calc(${saved.width}px * var(--sf))`); else target.parentElement.style.removeProperty(property); }
      if (!this.bindings.has(target) && card && !target.shadowRoot?.querySelector('.ds-card')) { if (!this.pending.has(target)) { this.pending.add(target); void (target as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete.then(() => { this.pending.delete(target); this.refresh(); }); } continue; }
      if (!this.bindings.has(target)) this.bind(target, card);
      for (const edge of this.bindings.get(target)!.edges) { edge.hidden = !this.options.enabled(); edge.tabIndex = this.options.enabled() ? 0 : -1; }
    }
  }
  private bind(target: HTMLElement, card: boolean) {
    target.classList.add('consistency-resizable');
    const scale = () => Number.parseFloat(getComputedStyle(target).getPropertyValue('--sf')) || 1;
    const maxWidth = () => Math.max(card ? minWidth : 80, ((target.closest<HTMLElement>('.aa-block') ?? target.parentElement)?.clientWidth ?? 2000) / scale());
    let minWidth = card ? cardMinimumWidth(target, scale()) : 80;
    const disposers: (() => void)[] = [], edges: HTMLElement[] = [];
    const size = (): ElementSize => { const rect = target.getBoundingClientRect(); const scale = Number.parseFloat(getComputedStyle(target).getPropertyValue('--sf')) || 1; return { width: rect.width / scale, height: rect.height / scale }; };
    const paintSize = (dimensions: ElementSize) => {
      target.style.width = `calc(${dimensions.width}px * var(--sf))`; target.style.flex = 'none';
      if (card) { target.style.height = `calc(${Math.max(dimensions.height, cardMinimumHeight(target, scale()))}px * var(--sf))`; }
      else { target.style.maxWidth = 'none'; target.style.height = 'auto'; }
      if (target.parentElement?.classList.contains('consistency-projects')) target.parentElement.style.setProperty(target === target.parentElement.firstElementChild ? '--resize-first' : '--resize-last', `calc(${dimensions.width}px * var(--sf))`);
    };
    const save = (dimensions: ElementSize) => {
      const atom = target.closest<HTMLElement>('.aa-atom');
      if (atom && card) atom.dispatchEvent(new CustomEvent('consistency-resize', { detail: dimensions }));
      else if (atom) { const picture = readPicture(atom.dataset.source ?? ''); atom.dataset.width = String(dimensions.width / 20); atom.style.setProperty('--aa-picture-width', String(dimensions.width / 20)); atom.dispatchEvent(new CustomEvent('aa-atom-source', { bubbles: true, detail: { source: writePicture(picture.alt, picture.src, dimensions.width / 20) } })); }
      else if (target.dataset.selectable) this.options.commit(target.dataset.selectable, dimensions);
    };
    for (const axis of card ? ['width', 'height'] as const : ['width'] as const) {
      const edge = target.ownerDocument.createElement('span'); edge.className = `consistency-resize-edge consistency-resize-${axis}`; edge.contentEditable = 'false'; edge.setAttribute('data-aa-interactive', ''); edge.setAttribute('role', 'slider'); edge.setAttribute('aria-label', `${card ? 'Card' : 'Image'} ${axis}`); edge.setAttribute('aria-orientation', axis === 'width' ? 'horizontal' : 'vertical'); edge.setAttribute('aria-valuemin', '80'); edge.setAttribute('aria-valuemax', '2000'); target.append(edge); edges.push(edge);
      let original: ElementSize | undefined;
      const paint = (value: number) => {
        if (card) value = Math.max(value, axis === 'width' ? minWidth : cardMinimumHeight(target, scale()));
        target.style[axis] = `calc(${value}px * var(--sf))`; if (!card) { target.style.maxWidth = 'none'; target.style.height = 'auto'; }
        if (card && axis === 'width') { const minHeight = cardMinimumHeight(target, scale()); if (size().height < minHeight) target.style.height = `calc(${minHeight}px * var(--sf))`; }
        target.style.flex = 'none'; if (axis === 'width' && target.parentElement?.classList.contains('consistency-projects')) target.parentElement.style.setProperty(target === target.parentElement.firstElementChild ? '--resize-first' : '--resize-last', `calc(${value}px * var(--sf))`); edge.textContent = String(Math.round(value)); edge.setAttribute('aria-valuenow', String(Math.round(value))); edge.setAttribute('aria-valuetext', `${Math.round(value)} pixels`);
      };
      disposers.push(bindSpacingHandle(edge, () => ({ value: size()[axis], min: card ? axis === 'width' ? minWidth : cardMinimumHeight(target, scale()) : 80, max: axis === 'width' ? maxWidth() : 2000, step: 20, shiftStep: 100, axis: axis === 'width' ? 'horizontal' : 'vertical', gain: 1 / (Number.parseFloat(getComputedStyle(target).getPropertyValue('--sf')) || 1), disabled: !this.options.enabled(),
        onStart: () => { this.settle.cancel(); if (card) minWidth = cardMinimumWidth(target, scale()); original = size(); target.setAttribute('data-resizing', ''); },
        onPreview: paint,
        onCommit: value => {
          const dimensions = { ...size(), [axis]: Math.max(resizeValue(value), card ? axis === 'width' ? minWidth : cardMinimumHeight(target, scale()) : 80) };
          void this.settle.run(Array.from(this.root.querySelectorAll<HTMLElement>('.consistency-sheet aa-editor > .aa-block, .consistency-sheet ds-card, .consistency-sheet ds-button, .consistency-sheet ds-stat, .consistency-sheet .consistency-gap')), async () => {
          paint(dimensions[axis]); dimensions.height = size().height;
          save(dimensions);
          await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
          });
        },
        onEnd: cancelled => { if (cancelled && original) paintSize(original); original = undefined; target.removeAttribute('data-resizing'); },
      })));
      edge.textContent = String(Math.round(size()[axis])); edge.setAttribute('aria-valuenow', String(Math.round(size()[axis])));
    }
    const corner = target.ownerDocument.createElement('span'); corner.className = 'consistency-resize-edge consistency-resize-corner'; corner.contentEditable = 'false'; corner.setAttribute('data-aa-interactive', ''); corner.setAttribute('role', 'button'); corner.setAttribute('aria-label', `${card ? 'Card' : 'Image'} size`); target.append(corner); edges.push(corner);
    let cancelCorner: (() => void) | undefined;
    const cornerDown = (event: PointerEvent) => {
      if (!this.options.enabled() || event.button !== 0 || !event.isPrimary) return;
      event.preventDefault(); event.stopPropagation(); this.settle.cancel(); if (card) minWidth = cardMinimumWidth(target, scale());
      const start = size(); let current = start; let moved = false; const win = target.ownerDocument.defaultView!;
      target.setAttribute('data-resizing', '');
      const move = (next: PointerEvent) => { if (next.pointerId !== event.pointerId) return; if (!this.options.enabled()) return finish(true); const dx = (next.clientX - event.clientX) / scale(), dy = (next.clientY - event.clientY) / scale(); if (!moved && Math.hypot(dx, dy) < 3) return; moved = true; const delta = Math.abs(dx) >= Math.abs(dy) ? dx : dy * start.width / start.height; current = { width: Math.max(card ? minWidth : 80, Math.min(maxWidth(), start.width + (card ? dx : delta))), height: card ? Math.max(80, Math.min(2000, start.height + dy)) : start.height }; paintSize(current); current = size(); corner.textContent = `${Math.round(current.width)} × ${Math.round(current.height)}`; };
      const finish = (cancelled: boolean) => { win.removeEventListener('pointermove', move); win.removeEventListener('pointerup', up); win.removeEventListener('pointercancel', cancel); win.removeEventListener('keydown', escape); win.removeEventListener('blur', cancel); cancelCorner = undefined; target.removeAttribute('data-resizing'); if (!moved) return; if (cancelled) { paintSize(start); return; } void this.settle.run(Array.from(this.root.querySelectorAll<HTMLElement>('.consistency-sheet aa-editor > .aa-block,.consistency-sheet ds-card,.consistency-sheet ds-button,.consistency-sheet ds-stat,.consistency-sheet .consistency-gap')), async () => { current = { width: Math.max(card ? minWidth : 80, resizeValue(current.width)), height: resizeValue(current.height) }; paintSize(current); current = size(); save(current); await new Promise<void>(resolve => requestAnimationFrame(() => resolve())); }); };
      const up = (next: PointerEvent) => { if (next.pointerId === event.pointerId) finish(false); }; const cancel = () => finish(true); const escape = (key: KeyboardEvent) => { if (key.key === 'Escape') { key.preventDefault(); key.stopPropagation(); finish(true); } };
      win.addEventListener('pointermove', move); win.addEventListener('pointerup', up); win.addEventListener('pointercancel', cancel); win.addEventListener('keydown', escape); win.addEventListener('blur', cancel); cancelCorner = cancel;
    };
    const cornerKey = (event: KeyboardEvent) => { if (!this.options.enabled() || !['ArrowRight','ArrowLeft','ArrowDown','ArrowUp'].includes(event.key)) return; event.preventDefault(); event.stopPropagation(); const start = size(), delta = (event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1) * (event.shiftKey ? 100 : 20); const next = { width: Math.max(card ? minWidth : 80, Math.min(maxWidth(), resizeValue(start.width + delta))), height: card ? resizeValue(start.height + delta) : start.height }; paintSize(next); save(size()); };
    corner.addEventListener('pointerdown', cornerDown); corner.addEventListener('keydown', cornerKey); disposers.push(() => { cancelCorner?.(); corner.removeEventListener('pointerdown', cornerDown); corner.removeEventListener('keydown', cornerKey); });
    this.bindings.set(target, { edges, dispose: () => { disposers.forEach(dispose => dispose()); edges.forEach(edge => edge.remove()); target.classList.remove('consistency-resizable'); } });
  }
  destroy() { this.settle.cancel(); this.observer.disconnect(); for (const binding of this.bindings.values()) binding.dispose(); this.bindings.clear(); }
}
