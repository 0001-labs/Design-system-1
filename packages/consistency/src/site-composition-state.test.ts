import { describe, expect, it, vi } from 'vite-plus/test';
import { SiteCompositionState, siteMeasureRange, siteMeasureValue, type SiteCompositionSnapshot } from './site-composition-state';
const start = (): SiteCompositionSnapshot => ({ path: '/', build: 'b1', base: 'base1', revision: 0, document: { schema: 1, nodes: {}, order: {} }, nodes: [] });
const deferred = <T>() => { let resolve!: (value: T) => void; let reject!: (error: unknown) => void; const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
describe('site composition persistence', () => {
  it('drains newer typing once with concurrent navigation and timer flushes', async () => {
    const first = deferred<SiteCompositionSnapshot>(), second = deferred<SiteCompositionSnapshot>();
    const save = vi.fn().mockImplementationOnce(() => first.promise).mockImplementationOnce(() => second.promise);
    const state = new SiteCompositionState(start(), save, () => {});
    state.patch('n1', { padding: 20 }); const a = state.flush();
    state.patch('n1', { padding: 40 }); const b = state.flush();
    expect(a).toBe(b); expect(save).toHaveBeenCalledTimes(1);
    first.resolve({ ...start(), revision: 1, document: save.mock.calls[0][0].document });
    await Promise.resolve(); await Promise.resolve();
    expect(save).toHaveBeenCalledTimes(2); expect(save.mock.calls[1][0].revision).toBe(1); expect(save.mock.calls[1][0].document.nodes.n1.padding).toBe(40);
    second.resolve({ ...start(), revision: 2, document: save.mock.calls[1][0].document });
    expect(await a).toBe(true); expect(await b).toBe(true); expect(state.dirty).toBe(false); state.destroy();
  });
  it('retains failed edits and retries without adding a history entry', async () => {
    const save = vi.fn().mockRejectedValueOnce(new Error('Offline')).mockImplementation(async value => ({ ...start(), revision: 1, document: value.document }));
    const state = new SiteCompositionState(start(), save, () => {}); state.patch('n1', { gap: 40 });
    expect(await state.flush()).toBe(false); expect(state.error).toBe('Offline'); expect(state.document.nodes.n1.gap).toBe(40); expect(state.dirty).toBe(true);
    expect(await state.flush()).toBe(true); state.undo(); expect(state.document.nodes).toEqual({}); state.redo(); expect(state.document.nodes.n1.gap).toBe(40); state.destroy();
  });
  it('stops queued automatic retries after an in-flight save fails', async () => {
    vi.useFakeTimers();
    const pending = deferred<SiteCompositionSnapshot>(), save = vi.fn(() => pending.promise);
    const state = new SiteCompositionState(start(), save, () => {});
    try {
      state.patch('n1', { padding: 20 }); const saving = state.flush(); state.patch('n1', { padding: 60 });
      pending.reject(new Error('Page changed')); expect(await saving).toBe(false);
      await vi.advanceTimersByTimeAsync(1000);
      expect(save).toHaveBeenCalledTimes(1); expect(state.dirty).toBe(true); expect(state.error).toBe('Page changed');
    } finally { state.destroy(); vi.useRealTimers(); }
  });
  it('accepts normalized save documents without an endless write loop', async () => {
    const save = vi.fn().mockImplementation(async value => ({ ...start(), revision: 1, document: { schema: 1, nodes: value.document.nodes, order: {}, insertions: [] } }));
    const state = new SiteCompositionState(start(), save, () => {}); state.patch('n1', { width: 400 });
    expect(await state.flush()).toBe(true); expect(save).toHaveBeenCalledTimes(1); expect(state.dirty).toBe(false); state.destroy();
  });
  it('does not discard newer changes when a write fails', async () => {
    const pending = deferred<SiteCompositionSnapshot>(); const state = new SiteCompositionState(start(), () => pending.promise, () => {});
    state.patch('n1', { padding: 20 }); const saving = state.flush(); state.patch('n1', { padding: 60 }); pending.reject(new Error('Offline'));
    expect(await saving).toBe(false); expect(state.document.nodes.n1.padding).toBe(60); state.destroy();
  });
});


describe('scaled site geometry', () => {
  it('keeps width writes integral and inside a fractional or narrow container', () => {
    expect(siteMeasureRange('width', 399.75, 280)).toEqual([200, 380]);
    expect(siteMeasureRange('width', 179.5, 120)).toEqual([160, 160]);
    expect(siteMeasureValue(1000, siteMeasureRange('width', 179.5, 120))).toBe(160);
  });
  it('snaps typed arithmetic and never submits a non-finite measure', () => {
    expect(siteMeasureValue(100 / 3, [0, 2000])).toBe(40);
    expect(siteMeasureValue(Number.NaN, [0, 2000])).toBeNull();
    expect(siteMeasureValue(Infinity, [0, 2000])).toBeNull();
    expect(siteMeasureRange('padding', 300, 179.5)).toEqual([0, 0]);
  });
});
