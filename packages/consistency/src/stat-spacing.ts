import { bindSpacingHandle } from '../../app/src/2-core/spacing-handle';
import { CompositionSettle } from './settle';
import './stat-spacing.css';
export const statGapId = (stat: string, key: 'label' | 'figure') => `stat:${stat}:${key}`;
/** Separate text groups use the same direct spacing gesture as cards. */
export class StatSpacingLayer {
  private bindings = new Map<HTMLElement, { handles: HTMLElement[]; dispose: () => void }>();
  private observer: MutationObserver;
  private frame = 0;
  private resize = new ResizeObserver(() => this.schedule());
  private settle = new CompositionSettle();
  private active?: HTMLElement;
  constructor(private root: HTMLElement, private state: { enabled: () => boolean; value: (id: string) => number; commit: (id: string, value: number) => void }) {
    this.observer = new MutationObserver(records => { if (records.some(record => !(record.target instanceof Element ? record.target : record.target.parentElement)?.closest('.consistency-stat-gap,.consistency-card-gap,.consistency-resize-edge'))) this.schedule(); });
    this.observer.observe(root, { childList: true, subtree: true });
  }
  private schedule() { if (!this.frame) this.frame = requestAnimationFrame(() => { this.frame = 0; this.refresh(); }); }
  refresh() {
    for (const [stat, binding] of this.bindings) if (!stat.isConnected) { binding.dispose(); this.bindings.delete(stat); }
    for (const stat of this.root.querySelectorAll<HTMLElement>('.consistency-sheet ds-stat[data-selectable]')) {
      if (!stat.shadowRoot?.querySelector('.ds-stat')) { void (stat as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete.then(() => this.schedule()); continue; }
      if (!this.bindings.has(stat)) this.bind(stat);
      for (const handle of this.bindings.get(stat)!.handles) {
        handle.hidden = !this.state.enabled(); handle.tabIndex = this.state.enabled() ? 0 : -1;
        if (this.active !== stat) { const key = handle.dataset.statGap as 'label' | 'figure', value = this.state.value(statGapId(stat.dataset.selectable!, key)); stat.style.setProperty(`--ds-stat-${key}-gap`, `calc(${value}px * var(--sf))`); this.position(stat, handle, value); }
      }
    }
  }
  private scale(stat: HTMLElement) { return Number.parseFloat(getComputedStyle(stat).getPropertyValue('--sf')) || 1; }
  private position(stat: HTMLElement, handle: HTMLElement, value: number) {
    const part = stat.shadowRoot?.querySelector<HTMLElement>(`.ds-stat__${handle.dataset.statGap}`); if (!part) return;
    const statRect = stat.getBoundingClientRect(), rect = part.getBoundingClientRect(), scale = this.scale(stat);
    handle.style.top = `${rect.bottom - statRect.top + value * scale / 2}px`; handle.style.height = `${Math.max(20, value) * scale}px`; handle.textContent = String(Math.round(value)); handle.setAttribute('aria-valuenow', String(Math.round(value)));
  }
  private bind(stat: HTMLElement) {
    stat.classList.add('consistency-stat-spacing'); this.resize.observe(stat);
    for (const part of stat.shadowRoot!.querySelectorAll('.ds-stat__label,.ds-stat__figure,.ds-stat__caption')) this.resize.observe(part);
    const handles: HTMLElement[] = [], disposers: (() => void)[] = [];
    for (const key of ['label', 'figure'] as const) {
      const part = stat.shadowRoot?.querySelector<HTMLElement>(`.ds-stat__${key}`); if (!part || part.hidden) continue;
      const id = statGapId(stat.dataset.selectable!, key), handle = stat.ownerDocument.createElement('span'); handle.className = 'consistency-stat-gap'; handle.dataset.statGap = key; handle.contentEditable = 'false'; handle.setAttribute('data-aa-interactive', ''); handle.setAttribute('role', 'slider'); handle.setAttribute('aria-label', `Stat ${key} gap`); handle.setAttribute('aria-orientation', 'vertical'); handle.setAttribute('aria-valuemin', '0'); handle.setAttribute('aria-valuemax', '2000'); stat.append(handle); handles.push(handle);
      let original = 0;
      const paint = (value: number) => { stat.style.setProperty(`--ds-stat-${key}-gap`, `calc(${value}px * var(--sf))`); for (const other of handles) this.position(stat, other, other === handle ? value : this.state.value(statGapId(stat.dataset.selectable!, other.dataset.statGap as 'label' | 'figure'))); };
      disposers.push(bindSpacingHandle(handle, () => ({ value: this.state.value(id), min: 0, max: 2000, step: 20, shiftStep: 100, axis: 'vertical', gain: 2 / this.scale(stat), disabled: !this.state.enabled(),
        onPointerStart: () => { (stat.ownerDocument.activeElement as HTMLElement | null)?.blur?.(); },
        onStart: () => { original = this.state.value(id); this.active = stat; this.settle.cancel(); handle.setAttribute('data-spacing-active', ''); stat.setAttribute('data-resizing', ''); },
        onPreview: paint,
        onCommit: value => { void this.settle.run(Array.from(this.root.querySelectorAll<HTMLElement>('.consistency-sheet aa-editor>.aa-block,.consistency-sheet ds-stat,.consistency-sheet ds-card,.consistency-sheet ds-button,.consistency-sheet .consistency-gap')), async () => { paint(value); this.state.commit(id, value); await new Promise<void>(resolve => requestAnimationFrame(() => resolve())); }); },
        onEnd: cancelled => { if (cancelled) paint(original); this.active = undefined; handle.removeAttribute('data-spacing-active'); stat.removeAttribute('data-resizing'); },
      })));
    }
    this.bindings.set(stat, { handles, dispose: () => { this.resize.unobserve(stat); for (const part of stat.shadowRoot?.querySelectorAll('.ds-stat__label,.ds-stat__figure,.ds-stat__caption') ?? []) this.resize.unobserve(part); disposers.forEach(dispose => dispose()); handles.forEach(handle => handle.remove()); stat.classList.remove('consistency-stat-spacing'); } });
  }
  destroy() { if (this.frame) cancelAnimationFrame(this.frame); this.resize.disconnect(); this.observer.disconnect(); this.settle.cancel(); this.bindings.forEach(binding => binding.dispose()); this.bindings.clear(); }
}
