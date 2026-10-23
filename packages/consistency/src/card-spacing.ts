import { bindSpacingHandle } from '../../app/src/2-core/spacing-handle';
import { readContentElement } from './elements';
import { CompositionSettle } from './settle';
import { cardMinimumHeight } from './resize';
import './card-spacing.css';
type GapKey = 'label' | 'title' | 'footer';
export class CardSpacingLayer {
  private cards = new Map<HTMLElement, { handles: HTMLElement[]; dispose: () => void }>();
  private observer: MutationObserver;
  private frame = 0;
  private resize = new ResizeObserver(() => this.schedule());
  private schedule() { if (!this.frame) this.frame = requestAnimationFrame(() => { this.frame = 0; this.refresh(); }); }
  private settle = new CompositionSettle();
  constructor(private root: HTMLElement, private options: { enabled: () => boolean; consistency: () => boolean; gaps: (id: string) => Record<string, number>; commit: (id: string, key: string, value: number, height: number) => void }) {
    this.observer = new MutationObserver(records => { if (records.some(record => !(record.target instanceof Element ? record.target : record.target.parentElement)?.closest('.consistency-card-gap,.consistency-resize-edge'))) this.refresh(); }); this.observer.observe(root, { childList: true, subtree: true });
  }
  refresh() {
    for (const [card, binding] of this.cards) if (!card.isConnected) { binding.dispose(); this.cards.delete(card); }
    for (const card of this.root.querySelectorAll<HTMLElement>('.consistency-sheet ds-card')) {
      if (!card.shadowRoot?.querySelector('.ds-card')) { void (card as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete.then(() => this.refresh()); continue; }
      if (!this.cards.has(card)) this.bind(card);
      const atom = card.closest<HTMLElement>('.aa-atom'), value = atom ? readContentElement(atom.dataset.source ?? '') : null;
      const gaps = value?.kind === 'card' ? value.gaps ?? {} : this.options.gaps(card.dataset.selectable ?? '');
      if (!card.hasAttribute('data-card-spacing-preview')) for (const key of ['label', 'title', 'footer']) card.style.setProperty(`--ds-card-${key}-gap`, `calc(${gaps[key] ?? (key === 'footer' ? 20 : 0)}px * var(--sf))`);
      for (const handle of this.cards.get(card)!.handles) { handle.hidden = !this.options.enabled(); handle.tabIndex = this.options.enabled() ? 0 : -1; if (!card.hasAttribute('data-card-spacing-preview')) this.position(card, handle); }
    }
  }
  private scale(card: HTMLElement) { return Number.parseFloat(getComputedStyle(card).getPropertyValue('--sf')) || 1; }
  private value(card: HTMLElement, key: string) { const atom = card.closest<HTMLElement>('.aa-atom'), value = atom ? readContentElement(atom.dataset.source ?? '') : null; return value?.kind === 'card' ? value.gaps?.[key] ?? (key === 'footer' ? 20 : 0) : this.options.gaps(card.dataset.selectable ?? '')[key] ?? (key === 'footer' ? 20 : 0); }
  private upper(card: HTMLElement, key: string) { return key === 'footer' ? card.querySelector<HTMLElement>('p:has(+ds-tag)') : card.shadowRoot?.querySelector<HTMLElement>(`.ds-card__${key}`); }
  private position(card: HTMLElement, handle: HTMLElement, value = this.value(card, handle.dataset.gap!)) {
    const upper = this.upper(card, handle.dataset.gap!); if (!upper) return;
    const rect = card.getBoundingClientRect(), upperRect = upper.getBoundingClientRect(), scale = this.scale(card), physical = value * scale;
    handle.style.top = `${upperRect.bottom - rect.top + physical / 2}px`; handle.style.left = `${20 * scale}px`; handle.style.width = `${Math.max(0, rect.width - 40 * scale)}px`; handle.style.height = `${Math.max(20 * scale, physical)}px`; handle.textContent = String(Math.round(value)); handle.setAttribute('aria-valuenow', String(Math.round(value)));
  }
  private bind(card: HTMLElement) {
    card.classList.add('consistency-card-spacing'); this.resize.observe(card); for (const part of card.shadowRoot?.querySelectorAll('.ds-card__label,.ds-card__title,.ds-card__body') ?? []) this.resize.observe(part); const handles: HTMLElement[] = [], disposers: (() => void)[] = [];
    for (const key of ['label', 'title', 'footer'] as GapKey[]) {
      if (!this.upper(card, key)) continue;
      const handle = card.ownerDocument.createElement('span'); handle.className = 'consistency-card-gap'; handle.dataset.gap = key; handle.contentEditable = 'false'; handle.setAttribute('data-aa-interactive', ''); handle.setAttribute('role', 'slider'); handle.setAttribute('aria-label', `Card ${key} gap`); handle.setAttribute('aria-orientation', 'vertical'); handle.setAttribute('aria-valuemin', '0'); handle.setAttribute('aria-valuemax', '2000'); card.append(handle); handles.push(handle);
      let peers: HTMLElement[] = [], originals: { card: HTMLElement; css: string; height: number }[] = [];
      const paint = (value: number) => {
        // Preview the linked design in one frame, without changing authored content/history.
        for (const peer of peers) peer.style.setProperty(`--ds-card-${key}-gap`, `calc(${value}px * var(--sf))`);
        const minimum = Math.max(...peers.map(peer => cardMinimumHeight(peer, this.scale(peer), false)));
        const height = Math.max(minimum, ...originals.map(item => item.height));
        for (const peer of peers) {
          peer.style.minHeight = `calc(${minimum}px * var(--sf))`;
          peer.style.height = `calc(${height}px * var(--sf))`;
          for (const other of this.cards.get(peer)?.handles ?? []) this.position(peer, other, other.dataset.gap === key ? value : this.value(peer, other.dataset.gap!));
        }
      };
      disposers.push(bindSpacingHandle(handle, () => ({ value: this.value(card, key), min: 0, max: 2000, step: 20, shiftStep: 100, axis: 'vertical', gain: 2 / this.scale(card), disabled: !this.options.enabled(),
        onPointerStart: () => { (card.ownerDocument.activeElement as HTMLElement | null)?.blur?.(); },
        onStart: () => {
          handle.setAttribute('data-spacing-active', ''); this.settle.cancel();
          peers = this.options.consistency() ? Array.from(this.cards.keys()).filter(peer => !peer.hidden && !peer.closest('.aa-command-preview')) : [card];
          originals = peers.map(peer => ({ card: peer, css: peer.style.cssText, height: peer.getBoundingClientRect().height / this.scale(peer) }));
          for (const peer of peers) { peer.setAttribute('data-card-spacing-preview', ''); peer.setAttribute('data-resizing', ''); }
        },
        onPreview: paint,
        onCommit: value => { void this.settle.run(Array.from(this.root.querySelectorAll<HTMLElement>('.consistency-sheet aa-editor>.aa-block,.consistency-sheet ds-card,.consistency-sheet ds-button,.consistency-sheet .consistency-gap')), async () => { paint(value); const height = Math.ceil(card.getBoundingClientRect().height / this.scale(card) / 20) * 20; for (const peer of peers) peer.style.height = `calc(${height}px * var(--sf))`; const atom = card.closest<HTMLElement>('.aa-atom'); if (atom) atom.dispatchEvent(new CustomEvent('consistency-card-gap', { detail: { key, value, height } })); else if (card.dataset.selectable) this.options.commit(card.dataset.selectable, key, value, height); await new Promise<void>(resolve => requestAnimationFrame(() => resolve())); }); },
        onEnd: cancelled => {
          if (cancelled) for (const item of originals) item.card.style.cssText = item.css;
          for (const peer of peers) { peer.removeAttribute('data-card-spacing-preview'); peer.removeAttribute('data-resizing'); }
          handle.removeAttribute('data-spacing-active');
          if (cancelled) this.schedule();
          peers = []; originals = [];
        },
      })));
    }
    this.cards.set(card, { handles, dispose: () => { this.resize.unobserve(card); for (const part of card.shadowRoot?.querySelectorAll('.ds-card__label,.ds-card__title,.ds-card__body') ?? []) this.resize.unobserve(part); disposers.forEach(dispose => dispose()); handles.forEach(handle => handle.remove()); card.classList.remove('consistency-card-spacing'); } });
  }
  destroy() { if (this.frame) cancelAnimationFrame(this.frame); this.resize.disconnect(); this.observer.disconnect(); this.settle.cancel(); this.cards.forEach(binding => binding.dispose()); this.cards.clear(); }
}
