import { describe, expect, it } from 'vite-plus/test';
import { CompositionHistory, dimensionValue, initialComposition, limits } from './model';
describe('composition edits', () => {
  it('keeps bounds in whole squares and limits', () => {
    expect(dimensionValue('width', 639)).toBe(640);
    expect(dimensionValue('width', 20)).toBe(280);
    expect(dimensionValue('padding', 900)).toBe(80);
    expect(dimensionValue('gap', NaN)).toBe(40);
    expect(dimensionValue('gap', 840)).toBe(840);
    expect(dimensionValue('gap', 100000)).toBe(limits.gap[1]);
    expect(dimensionValue('gap', -20)).toBe(limits.gap[0]);
  });
  it('undoes a committed drag and resets redo on a new edit', () => {
    const h = new CompositionHistory(); h.commit({ gap: 80 }); h.undo();
    expect(h.value.gap).toBe(40); expect(h.canRedo).toBe(true);
    h.redo(); expect(h.value.gap).toBe(80);
    h.undo(); h.commit({ width: 400 }); expect(h.canRedo).toBe(false);
  });
  it('restores text, bounds and wrapping together', () => {
    const h = new CompositionHistory(); h.commit({ text: 'Changed', wrap: false, padding: 0 });
    h.commit(initialComposition); h.undo();
    expect(h.value).toMatchObject({ text: 'Changed', wrap: false, padding: 0 });
    h.undo(); expect(h.value).toEqual(initialComposition);
  });
  it('ignores no-op commits', () => {
    const h = new CompositionHistory(); h.commit({ gap: 40 }); expect(h.canUndo).toBe(false);
  });
});
it('vertical and horizontal spacer centres follow one physical pointer unit without floating labels', async () => {
 const { pointerGain } = await import('./model');
 for (const scale of [1, 1.5, 2]) {
  for (const axis of ['vertical', 'horizontal']) {
   const pointerDelta = 25;
   const physicalGapChange = pointerDelta * pointerGain('gap', scale) * scale;
   expect(physicalGapChange / 2, axis).toBeCloseTo(pointerDelta);
   expect(pointerDelta * pointerGain('padding', scale) * scale / 2).toBeCloseTo(pointerDelta);
  }
  expect(pointerGain('width', scale) * scale).toBe(1);
 }
});
it('deletes disjoint selected blocks as one undoable edit and preserves untouched source', async () => {
 const { removeSourceRanges } = await import('./model');
 const source = '# Heading\n\nFirst\n\n```ts\nconst keep = true;\n```\n\nLast';
 const first = source.indexOf('First'), code = source.indexOf('```ts'), last = source.indexOf('Last');
 const text = removeSourceRanges(source, [{ start: first, end: code }, { start: last, end: source.length }]);
 expect(text).toBe('# Heading\n\n```ts\nconst keep = true;\n```');
 const history = new CompositionHistory(); history.commit({ text, hidden: ['bookshop'] }); history.undo();
 expect(history.value.text).toBe(initialComposition.text); expect(history.value.hidden).toEqual([]);
});
it('keeps readable content when bounds are too narrow for requested padding', async () => {
 const { compositionBounds, compositionRange } = await import('./model');
 expect(compositionBounds(280,80)).toEqual({width:280,padding:20});
 expect(compositionBounds(240,80,false,240)).toEqual({width:240,padding:0});
 expect(compositionRange('width',640,80)[0]).toBe(400);
 expect(compositionRange('padding',280,80)[1]).toBe(20);
 expect(compositionBounds(301,31,false)).toEqual({width:301,padding:30.5});
 const history = new CompositionHistory();history.commit({width:280,padding:80,sizes:{bookshop:{width:80,height:80}}});
 expect(history.value.padding).toBe(20);expect(history.value.sizes.bookshop.width).toBe(240);
});
