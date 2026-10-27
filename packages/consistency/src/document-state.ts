/** Revisioned persistence shared by native pages and the source-page adapter. */
export interface DocumentSnapshot<Document> { build: string; base: string; revision: number; document: Document }
export type DocumentSave<Document, Snapshot extends DocumentSnapshot<Document>> = (value: DocumentSnapshot<Document>) => Promise<Snapshot>;
const copy = <T>(value: T): T => structuredClone(value);
const canonical = (value: unknown): unknown => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonical(entry)])) : value;
const equal = (a: unknown, b: unknown) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));

/** One request at a time. A response acknowledges only its own snapshot, never newer edits. */
export class DocumentState<Document, Snapshot extends DocumentSnapshot<Document>> {
  document: Document;
  private accepted: Document;
  private past: Document[] = [];
  private future: Document[] = [];
  private timer?: ReturnType<typeof setTimeout>;
  private saving: Promise<boolean> | null = null;
  private disposed = false;
  error = '';
  constructor(public snapshot: Snapshot, private save: DocumentSave<Document, Snapshot>, private changed: () => void) { this.document = copy(snapshot.document); this.accepted = copy(snapshot.document); }
  get dirty() { return !equal(this.document, this.accepted); }
  get busy() { return this.saving !== null; }
  get canUndo() { return this.past.length > 0; }
  get canRedo() { return this.future.length > 0; }
  commit(document: Document) {
    if (this.disposed || equal(document, this.document)) return;
    this.past.push(copy(this.document)); this.past = this.past.slice(-100); this.future = [];
    this.document = copy(document); this.queue();
  }
  undo() { if (this.disposed) return; const next = this.past.pop(); if (!next) return; this.future.push(copy(this.document)); this.document = next; this.queue(); }
  redo() { if (this.disposed) return; const next = this.future.pop(); if (!next) return; this.past.push(copy(this.document)); this.document = next; this.queue(); }
  private queue() { this.error = ''; clearTimeout(this.timer); this.changed(); this.timer = setTimeout(() => void this.flush(), 400); }
  flush(): Promise<boolean> {
    clearTimeout(this.timer);
    if (this.saving) return this.saving;
    if (!this.dirty || this.disposed) return Promise.resolve(!this.dirty);
    // Install the lock before calling a transport, which may throw synchronously.
    let complete!: (saved: boolean) => void;
    const pending = new Promise<boolean>(resolve => { complete = resolve; });
    this.saving = pending;
    void this.drain().then(complete);
    this.changed();
    return pending;
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
