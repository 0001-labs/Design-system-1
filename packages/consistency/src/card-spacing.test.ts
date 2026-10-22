// @vitest-environment happy-dom
import { expect, it } from 'vite-plus/test';
import { readContentElement, writeContentElement } from './elements';
import { CompositionHistory } from './model';
it('preserves valid card gaps alongside size, colour and text', () => {
  const card = { kind: 'card' as const, label: 'Label', title: 'Title', body: 'Body', width: 300, height: 280, tone: 'pink', gaps: { label: 0, title: 40, footer: 20 } };
  expect(readContentElement(writeContentElement(card))).toEqual(card);
});
it('rejects unknown, negative and nonfinite card gap values', () => {
  const source = '```c9y-card\n{"label":"L","title":"T","body":"B","gaps":{"label":-20,"title":20,"other":40,"footer":"20"}}\n```';
  expect(readContentElement(source)).toMatchObject({ gaps: { title: 20 } });
});
it('records static gap and card growth as one undoable composition change', () => {
  const history = new CompositionHistory();
  history.commit({ cardGaps: { bookshop: { title: 40 } }, sizes: { bookshop: { width: 260, height: 340 } } });
  expect(history.value.cardGaps.bookshop.title).toBe(40); history.undo();
  expect(history.value.cardGaps.bookshop).toBeUndefined(); expect(history.value.sizes.bookshop).toBeUndefined();
  history.redo(); expect(history.value.sizes.bookshop.height).toBe(340);
});
