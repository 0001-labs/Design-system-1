import { bindSpacingHandle } from '../../app/src/2-core/spacing-handle';
import { pointerGain } from './model';

/** A document maps its real spaces to the editor's canonical ghost layer. */
export interface SpacingTarget {
  id: string;
  element: HTMLElement;
  host: HTMLElement;
  label: string;
  fallback: number;
  axis?: 'horizontal' | 'vertical';
  kind?: 'gap' | 'padding';
  range?: [number, number];
  rect: () => { left: number; top: number; width: number; height: number };
}

/** Composition overlays stay outside Aa's editable block tree and authored site content. */
export class TextSpacingLayer {
  private handles = new Map<string, { host: HTMLElement; dispose: () => void }>();
  private targets = new Map<string, SpacingTarget>();
  private defaults = new Map<string, number>();
  private observed = new WeakSet<Element>();
  private frame = 0;
  private active = '';
  private observer = new MutationObserver(() => this.schedule());
  private resize = new ResizeObserver(() => this.schedule());
  private view: Window;
  constructor(private root: HTMLElement, private state: {
    value: (id: string, fallback: number) => number;
    enabled: () => boolean;
    select: (id: string) => void;
    preview: (id: string, value: number) => void;
    commit: (id: string, value: number, pointer: boolean) => void;
    cancel: () => void;
    targets?: () => SpacingTarget[];
    started?: () => void;
    ended?: () => void;
  }) {
    this.view = root.ownerDocument.defaultView!;
    this.view.addEventListener('scroll', this.schedule, true);
    this.view.addEventListener('resize', this.schedule);
  }
  defaultValue(id: string) { return this.defaults.get(id) ?? 20; }
  private schedule = () => { if (!this.frame) this.frame = this.view.requestAnimationFrame(() => { this.frame = 0; this.refresh(); }); };
  private scale(target: SpacingTarget) { return Number.parseFloat(this.view.getComputedStyle(target.element).getPropertyValue('--sf')) || 1; }
  private authoredTargets(): SpacingTarget[] {
    const targets: SpacingTarget[] = [];
    this.root.querySelectorAll<HTMLElement>('aa-editor[data-editor-key]').forEach(editor => {
      if (!this.observed.has(editor)) {
        this.observed.add(editor); this.observer.observe(editor, { childList: true, characterData: true, subtree: true }); this.resize.observe(editor);
      }
      const bounds = editor.parentElement!;
      const containers = [editor, ...editor.querySelectorAll<HTMLElement>('.aa-column,.aa-tab-panel')];
      containers.forEach((container, containerIndex) => {
        const blocks = Array.from(container.querySelectorAll<HTMLElement>(':scope > .aa-block'));
        blocks.slice(1).forEach((block, index) => {
          const id = container === editor ? `${editor.dataset.editorKey}-text-${index + 1}` : `${editor.dataset.editorKey}-nested-${containerIndex}-text-${index + 1}`;
          const scale = Number(this.view.getComputedStyle(editor).getPropertyValue('--sf')) || 1;
          if (!this.defaults.has(id)) { const margin = Number.parseFloat(this.view.getComputedStyle(block).marginTop); this.defaults.set(id, Math.max(0, Math.round((Number.isFinite(margin) ? margin : 20) / scale / 20) * 20)); }
          const fallback = this.defaults.get(id)!;
          block.style.marginTop = `calc(${this.state.value(id, fallback)}px * var(--sf))`;
          targets.push({ id, element: block, host: bounds, fallback, label: `Adjust ${editor.dataset.editorKey}${container === editor ? '' : ` nested ${containerIndex}`} block gap ${index + 1}`, rect: () => {
            const rect = bounds.getBoundingClientRect(), next = block.getBoundingClientRect(), previous = blocks[index].getBoundingClientRect();
            return { top: previous.bottom - rect.top, left: next.left - rect.left, width: next.width, height: Math.max(0, next.top - previous.bottom) };
          } });
        });
      });
    });
    return targets;
  }
  refresh() {
    const entries = this.state.targets?.() ?? this.authoredTargets();
    this.targets = new Map(entries.map(target => [target.id, target]));
    for (const target of entries) {
      const { id } = target;
      if (!this.observed.has(target.element)) { this.observed.add(target.element); this.resize.observe(target.element); }
      let binding = this.handles.get(id);
      if (binding && !binding.host.isConnected) { binding.dispose(); this.handles.delete(id); binding = undefined; }
      if (!binding) {
        const host = this.root.ownerDocument.createElement('div');
        host.className = `consistency-text-gap ghost-surface ghost-surface--${target.kind ?? 'gap'}`;
        host.setAttribute('data-editor-chrome', ''); host.dataset.spacingKey = id;
        host.setAttribute('role', 'slider');
        const measure = this.root.ownerDocument.createElement('span'); measure.className = 'ghost-measure'; measure.setAttribute('aria-hidden', 'true'); host.append(measure);
        host.addEventListener('focus', () => this.state.select(id)); target.host.append(host);
        let pointer = false;
        const dispose = bindSpacingHandle(host, () => {
          const current = this.targets.get(id) ?? target;
          return {
            value: this.state.value(id, current.fallback), disabled: !this.state.enabled() || !this.targets.has(id), min: current.range?.[0] ?? 0, max: current.range?.[1] ?? 2000, step: 20, shiftStep: 40,
            axis: current.axis ?? 'vertical', snapPreview: false, gain: pointerGain(current.kind === 'padding' ? 'padding' : 'gap', this.scale(current)),
            onPointerStart: () => { this.state.select(id); (host.ownerDocument.activeElement as HTMLElement | null)?.blur?.(); },
            onStart: kind => { pointer = kind === 'pointer'; this.active = id; host.setAttribute('data-spacing-active', ''); this.state.started?.(); this.state.select(id); },
            onPreview: next => this.state.preview(id, next), onCommit: next => this.state.commit(id, next, pointer),
            onEnd: cancelled => { host.removeAttribute('data-spacing-active'); this.active = ''; if (cancelled) this.state.cancel(); this.state.ended?.(); this.refresh(); },
          };
        });
        binding = { host, dispose }; this.handles.set(id, binding);
      }
      const value = this.state.value(id, target.fallback), rect = target.rect(), horizontal = target.axis === 'horizontal';
      // Empty space keeps an invisible one-square hit target, as the lab does.
      const zero = Math.max(horizontal ? rect.width : rect.height, 0) < 1;
      Object.assign(binding.host.style, { top: `${rect.top - (zero && !horizontal ? 10 * this.scale(target) : 0)}px`, left: `${rect.left - (zero && horizontal ? 10 * this.scale(target) : 0)}px`, width: `${zero && horizontal ? 20 * this.scale(target) : rect.width}px`, height: `${zero && !horizontal ? 20 * this.scale(target) : rect.height}px`, transform: 'none', cursor: horizontal ? 'ew-resize' : 'ns-resize' });
      binding.host.hidden = !this.state.enabled() && this.active !== id; binding.host.tabIndex = this.state.enabled() ? 0 : -1;
      binding.host.setAttribute('aria-label', target.label); binding.host.setAttribute('aria-orientation', horizontal ? 'horizontal' : 'vertical');
      binding.host.setAttribute('aria-valuemin', String(target.range?.[0] ?? 0)); binding.host.setAttribute('aria-valuemax', String(target.range?.[1] ?? 2000));
      binding.host.setAttribute('aria-valuenow', String(Math.round(value))); binding.host.setAttribute('aria-valuetext', `${Math.round(value)} pixels`);
      binding.host.firstElementChild!.textContent = String(Math.round(value));
    }
    this.handles.forEach((handle, id) => { if (!this.targets.has(id)) { handle.dispose(); handle.host.remove(); this.handles.delete(id); } });
  }
  destroy() { this.view.cancelAnimationFrame(this.frame); this.view.removeEventListener('scroll', this.schedule, true); this.view.removeEventListener('resize', this.schedule); this.observer.disconnect(); this.resize.disconnect(); this.handles.forEach(handle => { handle.dispose(); handle.host.remove(); }); this.handles.clear(); }
}
