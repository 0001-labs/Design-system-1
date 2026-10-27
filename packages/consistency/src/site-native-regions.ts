import { parseBlocks } from '../../../website/src/vendor/aa/aa';
import { NativeContentSurface } from './native-content-surface';
import type { EditorMedia } from './media';
import type { SiteCompositionState, SiteInsertion } from './site-composition-state';

/** Authored regions run the same Aa adapters and composition layers as the editor document. */
export class SiteNativeRegions {
  get pending() { return [...this.regions.values()].some(region => region.pending); }
  private regions = new Map<string, NativeContentSurface>();
  constructor(private state: SiteCompositionState, private options: { enabled(): boolean; select(id: string): void; media: EditorMedia; imageURL(source: string): string; error(message: string): void }) {}
  has(id: string) { return this.regions.has(id); }
  focus(id: string) { this.regions.get(id)?.host.focus(); }
  update(insertion: SiteInsertion, element: HTMLElement) {
    let region = this.regions.get(insertion.id);
    if (!region) {
      const tokens = getComputedStyle(document.documentElement);
      for (const key of tokens) if (/^--(?:ds-|one-|typeface-|sf$|u$)/.test(key)) element.style.setProperty(key, tokens.getPropertyValue(key));
      region = new NativeContentSurface(element, insertion.id, {
        ...this.options,
        read: () => this.state.document.insertions?.find(item => item.id === insertion.id) as {source:string;gaps?:Record<string,number>} ?? {source:''},
        commit: value => this.state.commit({ ...this.state.document, insertions: this.state.document.insertions?.map(item => item.id === insertion.id ? {...item,...value} : item) }),
        undo: () => { const changed=this.state.canUndo;this.state.undo();return changed; },
        redo: () => { const changed=this.state.canRedo;this.state.redo();return changed; },
      });
      this.regions.set(insertion.id, region);
    }
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
