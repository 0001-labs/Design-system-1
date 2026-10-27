import { AaEditorElement, defineAaEditor, parseBlocks } from '../../../website/src/vendor/aa/aa';
import { createSurfaceElement } from './editor-surface';
import { createPreviewEditorOptions } from './aa';
import { TextSpacingLayer } from './text-spacing';
import { ColumnSpacingLayer } from './column-spacing';
import { CardSpacingLayer } from './card-spacing';
import { ResizingLayer } from './resize';
import type { EditorMedia } from './media';
import type { SiteCompositionState, SiteInsertion } from './site-composition-state';
defineAaEditor();

/** Authored regions run the same Aa adapters and composition layers as the editor document. */
export class SiteNativeRegions {
  private dirtyFields = new Set<string>();
  get pending() { return this.dirtyFields.size > 0; }
  private regions = new Map<string, { host: AaEditorElement; refresh(): void; destroy(): void }>();
  constructor(private state: SiteCompositionState, private options: { enabled(): boolean; select(id: string): void; media: EditorMedia; imageURL(source: string): string; error(message: string): void }) {}
  has(id: string) { return this.regions.has(id); }
  focus(id: string) { this.regions.get(id)?.host.focus(); }
  update(insertion: SiteInsertion, element: HTMLElement) {
    let region = this.regions.get(insertion.id);
    if (!region) {
      const host = createSurfaceElement(element.ownerDocument, 'aa-editor') as AaEditorElement;
      host.dataset.editorKey = insertion.id; host.setAttribute('aria-label', 'Page content');
      element.classList.add('consistency-site-region', 'consistency-sheet', 'consistency-text-bounds', 'production-on');
      const tokens = getComputedStyle(document.documentElement);
      for (const key of tokens) if (/^--(?:ds-|one-|typeface-|sf$|u$)/.test(key)) element.style.setProperty(key, tokens.getPropertyValue(key));
      element.style.setProperty('--sf', getComputedStyle(element).getPropertyValue('--sf') || '1');
      element.style.setProperty('--u', 'calc(20px * var(--sf,1))');
      const options = createPreviewEditorOptions(() => host, this.options.error, this.options.media);
      host.options = { ...options, atoms: options.atoms?.filter(atom => atom.name !== 'diagram'), comments: undefined, value: insertion.source ?? '', reordering: true, placing: true };
      host.value = insertion.source ?? '';
      const save = () => this.state.commit({ ...this.state.document, insertions: this.state.document.insertions?.map(item => item.id === insertion.id ? { ...item, source: host.value } : item) });
      const input = (event: Event) => { const target = event.target as Element; if (target === host) this.dirtyFields.delete(insertion.id); else if (target.closest?.('.consistency-content-element')) this.dirtyFields.add(insertion.id); save(); };
      host.addEventListener('input', input);
      let preview: Record<string, number> = {};
      const value = (key: string, fallback: number) => preview[key] ?? this.state.document.insertions?.find(item => item.id === insertion.id)?.gaps?.[key] ?? fallback;
      const commit = (key: string, amount: number) => { preview = {}; this.state.commit({ ...this.state.document, insertions: this.state.document.insertions?.map(item => item.id === insertion.id ? { ...item, gaps: { ...item.gaps, [key]: amount } } : item) }); };
      let historyEditor: AaEditorElement['editor'];
      const refresh = () => { if (host.editor && host.editor !== historyEditor) { historyEditor=host.editor; host.editor.setHistoryProvider({ undo: () => { const changed = this.state.canUndo; this.state.undo(); return changed; }, redo: () => { const changed = this.state.canRedo; this.state.redo(); return changed; } }); } spacing.refresh(); columns.refresh(); cards.refresh(); resizing.refresh(); mapImages(); };
      const controls = { enabled: this.options.enabled, value, select: this.options.select, preview: (key: string, amount: number) => { preview[key] = amount; refresh(); }, commit, cancel: () => { preview = {}; refresh(); } };
      // Query the owning document so a region root can itself be the canonical sheet.
      const stage = element.ownerDocument.createElement('div'); stage.className = 'consistency-native-editor-stage';
      element.replaceChildren(stage); stage.append(host);
      // Spacing bounds and native atoms share their own root; authored page styles remain outside it.
      stage.className = 'consistency-sheet consistency-text-bounds';
      const spacing = new TextSpacingLayer(element, controls);
      const columns = new ColumnSpacingLayer(element, controls);
      const cards = new CardSpacingLayer(element, { enabled: this.options.enabled, consistency: () => false, gaps: () => ({}), commit: () => {} });
      const resizing = new ResizingLayer(element, { enabled: this.options.enabled, consistency: () => false, size: () => undefined, commit: () => {} });
      const mapImages = () => {
        for (const image of host.querySelectorAll<HTMLImageElement>('img')) {
          const source = image.getAttribute('src') ?? '';
          const resolved = this.options.imageURL(source);
          if (resolved !== source) image.src = resolved;
        }
        for (const [index, block] of [...host.querySelectorAll<HTMLElement>(':scope > .aa-block')].entries()) block.dataset.selectable = `text:${insertion.id}:${index}`;
      };
      const observer = new MutationObserver(() => { mapImages(); }); observer.observe(host, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
      region = { host, refresh, destroy: () => { observer.disconnect(); spacing.destroy(); columns.destroy(); cards.destroy(); resizing.destroy(); host.removeEventListener('input', input); this.dirtyFields.delete(insertion.id); host.remove(); } };
      this.regions.set(insertion.id, region); queueMicrotask(refresh);
    }
    if (region.host.value !== (insertion.source ?? '')) region.host.value = insertion.source ?? '';
    region.refresh();
  }
  withoutBlocks(selection: Set<string>): SiteInsertion[] | undefined {
    const insertions = this.state.document.insertions?.map(item => {
      if (item.kind !== 'region') return item;
      const blocks = parseBlocks(item.source ?? '');
      const keep = blocks.filter((_, index) => !selection.has(`text:${item.id}:${index}`));
      if (keep.length === blocks.length) return item;
      return { ...item, source: keep.map(block => block.source).join('\n\n') };
    });
    return insertions;
  }
  refresh() { for (const region of this.regions.values()) region.refresh(); }
  remove(id: string) { this.regions.get(id)?.destroy(); this.regions.delete(id); }
  destroy() { for (const region of this.regions.values()) region.destroy(); this.regions.clear(); }
}
