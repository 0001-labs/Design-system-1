import { bindSpacingHandle } from '../../app/src/2-core/spacing-handle';
import { pointerGain } from './model';

/** Composition overlays stay outside Aa's editable block tree. */
export class TextSpacingLayer {
  private handles = new Map<string, { host: HTMLElement; dispose: () => void }>();
  private defaults = new Map<string, number>();
  private observed = new WeakSet<Element>();
  private frame = 0;
  private observer = new MutationObserver(() => this.schedule());
  private resize = new ResizeObserver(() => this.schedule());
  constructor(private root: HTMLElement, private state: {
    value: (id: string, fallback: number) => number;
    enabled: () => boolean;
    select: (id: string) => void;
    preview: (id: string, value: number) => void;
    commit: (id: string, value: number, pointer: boolean) => void;
    cancel: () => void;
  }) {}
  defaultValue(id: string) { return this.defaults.get(id) ?? 20; }
  private schedule() { if (!this.frame) this.frame = requestAnimationFrame(() => { this.frame = 0; this.refresh(); }); }
  refresh() {
    const present = new Set<string>();
    this.root.querySelectorAll<HTMLElement>('aa-editor[data-editor-key]').forEach(editor => {
      if (!this.observed.has(editor)) {
        this.observed.add(editor); this.observer.observe(editor, { childList: true, characterData: true, subtree: true }); this.resize.observe(editor);
      }
      const bounds = editor.parentElement!;
      const blocks = Array.from(editor.querySelectorAll<HTMLElement>(':scope > .aa-block'));
      blocks.slice(1).forEach((block, index) => {
        const id = `${editor.dataset.editorKey}-text-${index + 1}`;
        present.add(id);
        const scale = Number(getComputedStyle(this.root).getPropertyValue('--sf')) || 1;
        if (!this.defaults.has(id)) this.defaults.set(id, Math.round(parseFloat(getComputedStyle(block).marginTop) / scale / 20) * 20 || 20);
        const fallback = this.defaults.get(id)!;
        const value = this.state.value(id, fallback);
        block.style.marginTop = `calc(${value}px * var(--sf))`;
        let handle = this.handles.get(id);
        if (!handle) {
          const host = document.createElement('div');
          host.className = 'consistency-text-gap ghost-surface ghost-surface--gap';
          host.setAttribute('role', 'slider'); host.setAttribute('aria-label', `Adjust ${editor.dataset.editorKey} text gap ${index + 1}`);
          host.setAttribute('aria-orientation', 'vertical'); host.setAttribute('aria-valuemin', '0'); host.setAttribute('aria-valuemax', '2000');
          const measure = document.createElement('span'); measure.className = 'ghost-measure'; measure.setAttribute('aria-hidden', 'true'); host.append(measure);
          host.addEventListener('focus', () => this.state.select(id));
          bounds.append(host);
          let pointer = false;
          const dispose = bindSpacingHandle(host, () => ({
            value: this.state.value(id, fallback), disabled: !this.state.enabled(), min: 0, max: 2000, step: 20, shiftStep: 40,
            axis: 'vertical', snapPreview: false, gain: pointerGain('gap', Number(getComputedStyle(this.root).getPropertyValue('--sf'))),
            onPointerStart: () => { this.state.select(id); (host.ownerDocument.activeElement as HTMLElement | null)?.blur?.(); },
            onStart: kind => { pointer = kind === 'pointer'; host.setAttribute('data-spacing-active', ''); this.state.select(id); },
            onPreview: next => this.state.preview(id, next), onCommit: next => this.state.commit(id, next, pointer),
            onEnd: cancelled => { host.removeAttribute('data-spacing-active'); if (cancelled) this.state.cancel(); },
          }));
          handle = { host, dispose }; this.handles.set(id, handle);
        }
        const rect = bounds.getBoundingClientRect(), next = block.getBoundingClientRect(), previous = blocks[index].getBoundingClientRect();
        Object.assign(handle.host.style, { top: `${previous.bottom - rect.top}px`, left: `${next.left - rect.left}px`, width: `${next.width}px`, height: `${Math.max(0, next.top - previous.bottom)}px` });
        handle.host.hidden = !this.state.enabled(); handle.host.tabIndex = this.state.enabled() ? 0 : -1;
        handle.host.setAttribute('aria-valuenow', String(Math.round(value))); handle.host.setAttribute('aria-valuetext', `${Math.round(value)} pixels`);
        handle.host.firstElementChild!.textContent = String(Math.round(value));
      });
    });
    this.handles.forEach((handle, id) => { if (!present.has(id)) { handle.dispose(); handle.host.remove(); this.handles.delete(id); } });
  }
  destroy() { cancelAnimationFrame(this.frame); this.observer.disconnect(); this.resize.disconnect(); this.handles.forEach(handle => { handle.dispose(); handle.host.remove(); }); this.handles.clear(); }
}
