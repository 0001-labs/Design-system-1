/** A site's composition is its own revisioned document; pointer previews never enter this history. */
export type SiteNodeStyle = { gap?: number; padding?: number; width?: number; hidden?: boolean };
export type SiteNodeProperty = 'gap' | 'padding' | 'width';
export interface SiteInsertion { id: string; parent: string; before?: string; kind: 'text' | 'heading' | 'image' | 'link' | 'button'; text?: string; href?: string; src?: string; alt?: string }
export interface SiteCompositionDocument { schema: 1; nodes: Record<string, SiteNodeStyle>; order: Record<string, string[]>; insertions?: SiteInsertion[] }
/** Logical measures stay on whole squares even when CSS scaling leaves fractional physical bounds. */
export function siteMeasureRange(property: SiteNodeProperty, available: number, width: number): [number, number] {
  if (property === 'gap') return [0, 2000];
  const finite = (value: number, fallback: number) => Number.isFinite(value) && value > 0 ? value : fallback;
  if (property === 'width') { const maximum = Math.max(1, Math.floor(Math.min(10000, finite(available, 200)) / 20) * 20); return [Math.min(200, maximum), maximum]; }
  return [0, Math.max(0, Math.min(2000, Math.floor((finite(width, 200) - 200) / 40) * 20))];
}
export function siteMeasureValue(value: number, range: [number, number]): number | null {
  return Number.isFinite(value) ? Math.max(range[0], Math.min(range[1], Math.round(value / 20) * 20)) : null;
}

export interface SiteCompositionNode { id: string; tag: string; parent: string | null; children: string[]; label: string; capabilities: Array<SiteNodeProperty | 'hide' | 'reorder' | 'insert'> }
export interface SiteCompositionSnapshot { path: string; build: string; base: string; revision: number; document: SiteCompositionDocument; nodes: SiteCompositionNode[]; images?: string[]; stale?: boolean }
export type CompositionSave = (value: { build: string; base: string; revision: number; document: SiteCompositionDocument }) => Promise<SiteCompositionSnapshot>;
const copy = <T>(value: T): T => structuredClone(value);
const canonical = (value: unknown): unknown => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonical(entry)])) : value;
const equal = (a: unknown, b: unknown) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));

/** One request at a time. A response acknowledges only its own snapshot, never newer edits. */
export class SiteCompositionState {
  document: SiteCompositionDocument;
  private accepted: SiteCompositionDocument;
  private past: SiteCompositionDocument[] = [];
  private future: SiteCompositionDocument[] = [];
  private timer?: ReturnType<typeof setTimeout>;
  private saving: Promise<boolean> | null = null;
  private disposed = false;
  error = '';
  constructor(public snapshot: SiteCompositionSnapshot, private save: CompositionSave, private changed: () => void) { this.document = copy(snapshot.document); this.accepted = copy(snapshot.document); }
  get dirty() { return !equal(this.document, this.accepted); }
  get busy() { return this.saving !== null; }
  get canUndo() { return this.past.length > 0; }
  get canRedo() { return this.future.length > 0; }
  commit(document: SiteCompositionDocument) {
    if (equal(document, this.document)) return;
    this.past.push(copy(this.document)); this.past = this.past.slice(-100); this.future = [];
    this.document = copy(document); this.queue();
  }
  patch(id: string, patch: SiteNodeStyle) { this.commit({ ...this.document, nodes: { ...this.document.nodes, [id]: { ...this.document.nodes[id], ...patch } } }); }
  undo() { const next = this.past.pop(); if (!next) return; this.future.push(copy(this.document)); this.document = next; this.queue(); }
  redo() { const next = this.future.pop(); if (!next) return; this.past.push(copy(this.document)); this.document = next; this.queue(); }
  private queue() { this.error = ''; clearTimeout(this.timer); this.changed(); this.timer = setTimeout(() => void this.flush(), 400); }
  flush(): Promise<boolean> {
    clearTimeout(this.timer);
    if (this.saving) return this.saving;
    if (!this.dirty || this.disposed) return Promise.resolve(!this.dirty);
    this.saving = this.drain();
    this.changed();
    return this.saving;
  }
  private async drain(): Promise<boolean> {
    try {
      while (this.dirty && !this.disposed) {
        const document = copy(this.document);
        this.error = '';
        try {
          const saved = await this.save({ build: this.snapshot.build, base: this.snapshot.base, revision: this.snapshot.revision, document });
          this.snapshot = saved; this.accepted = copy(saved.document);
          if (equal(this.document, document)) this.document = copy(saved.document);
          this.changed();
        } catch (error) { clearTimeout(this.timer); this.error = error instanceof Error ? error.message : 'Could not save. Try again.'; return false; }
      }
      return !this.dirty;
    } finally { this.saving = null; this.changed(); }
  }
  discard() { clearTimeout(this.timer); this.document = copy(this.accepted); this.error = ''; this.past = []; this.future = []; this.changed(); }
  destroy() { this.disposed = true; clearTimeout(this.timer); }
}
