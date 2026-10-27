import { expect, it, vi } from 'vite-plus/test';
import { DocumentState, type DocumentSnapshot } from './document-state';

type Page = { blocks: { id: string; source: string }[]; gap: number };
const start = (): DocumentSnapshot<Page> => ({ build: 'build-1', base: 'binding-1', revision: 0, document: { blocks: [{ id: 'intro', source: 'Before' }], gap: 40 } });
const deferred = <T>() => { let resolve!: (value: T) => void; let reject!: (reason: unknown) => void; const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };

it('saves newer native edits with the binding base returned by the preceding save', async () => {
  const first = deferred<DocumentSnapshot<Page>>(), second = deferred<DocumentSnapshot<Page>>();
  const save = vi.fn().mockImplementationOnce(() => first.promise).mockImplementationOnce(() => second.promise);
  const state = new DocumentState<Page, DocumentSnapshot<Page>>(start(), save, () => {});
  try {
    state.commit({ ...state.document, blocks: [{ id: 'intro', source: 'After' }] });
    const pending = state.flush();
    state.commit({ ...state.document, gap: 80 });
    expect(state.flush()).toBe(pending);
    first.resolve({ ...start(), base: 'binding-2', revision: 1, document: save.mock.calls[0]![0].document });
    await Promise.resolve(); await Promise.resolve();
    expect(save).toHaveBeenCalledTimes(2);
    expect(save.mock.calls[1]![0]).toMatchObject({ base: 'binding-2', revision: 1, document: { gap: 80, blocks: [{ id: 'intro', source: 'After' }] } });
    second.resolve({ ...start(), base: 'binding-2', revision: 2, document: save.mock.calls[1]![0].document });
    expect(await pending).toBe(true);
    expect(state.dirty).toBe(false);
    state.undo(); expect(state.document.gap).toBe(40);
    state.undo(); expect(state.document.blocks[0]!.source).toBe('Before');
    state.redo(); expect(state.document.blocks[0]!.source).toBe('After');
  } finally { state.destroy(); }
});

it('retains a whole native draft on a revision conflict and prevents navigation flush', async () => {
  vi.useFakeTimers();
  const save = vi.fn().mockRejectedValue(new Error('Page changed'));
  const snapshot = start(), state = new DocumentState<Page, DocumentSnapshot<Page>>(snapshot, save, () => {});
  try {
    const draft = { ...state.document, gap: 80 };
    state.commit(draft); draft.gap = 120;
    expect(await state.flush()).toBe(false);
    expect(state.document.gap).toBe(80);
    expect(state.error).toBe('Page changed');
    expect(state.dirty).toBe(true);
    await vi.advanceTimersByTimeAsync(2000);
    expect(save).toHaveBeenCalledTimes(1);
    state.discard();
    expect(state.document).toEqual(snapshot.document);
    expect(state.canUndo).toBe(false);
    expect(await state.flush()).toBe(true);
  } finally { state.destroy(); vi.useRealTimers(); }
});

it('releases the save lock when a transport throws before returning a promise', async () => {
  const save = vi.fn().mockImplementationOnce(() => { throw new Error('Unavailable'); })
    .mockImplementation(async value => ({ ...value, revision: 1 }));
  const state = new DocumentState<Page, DocumentSnapshot<Page>>(start(), save, () => {});
  try {
    state.commit({ ...state.document, gap: 80 });
    expect(await state.flush()).toBe(false);
    expect(state.busy).toBe(false);
    expect(await state.flush()).toBe(true);
    expect(state.dirty).toBe(false);
  } finally { state.destroy(); }
});
