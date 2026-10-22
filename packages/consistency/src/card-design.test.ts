import { expect, test } from 'vite-plus/test';
import { CompositionHistory, initialComposition } from './model';
const card = (label: string, design = {}) => '```c9y-card\n' + JSON.stringify({ label, title: label + ' title', body: label + ' body', ...design }) + '\n```';
const values = (source: string) => [...source.matchAll(/```c9y-card\n([^]*?)\n```/g)].map(match => JSON.parse(match[1]));
test('linked design fans gaps and sizes out once, leaving every card text independent', () => {
 const history = new CompositionHistory({ ...initialComposition, text: card('First') + '\n\n' + card('Second') });
 history.commit({ cardGaps: { bookshop: { label: 40 } }, sizes: { bookshop: { width: 300, height: 400 } } });
 expect(history.value.cardGaps.kitchen).toEqual({ label: 40 });
 expect(history.value.sizes['contact-note']).toEqual({ width: 300, height: 400 });
 expect(values(history.value.text).map(value => [value.label, value.width, value.gaps.label])).toEqual([['First', 300, 40], ['Second', 300, 40]]);
 history.undo(); expect(history.value.text).toBe(card('First') + '\n\n' + card('Second')); expect(history.value.cardGaps).toEqual({});
});
test('inserted colour edit shares colour only and newly inserted card takes established design', () => {
 const history = new CompositionHistory({ ...initialComposition, text: card('First', { width: 300 }) + '\n\n' + card('Second', { width: 200 }) });
 history.commit({ text: card('First', { width: 300, tone: 'pink' }) + '\n\n' + card('Second', { width: 200 }) });
 expect(values(history.value.text).map(value => [value.label, value.tone, value.width])).toEqual([['First', 'pink', 300], ['Second', 'pink', 200]]);
 expect(history.value.cardDesigns.bookshop.tone).toBe('pink');
 history.commit({ text: history.value.text + '\n\n' + card('New') }); expect(values(history.value.text)[2].tone).toBe('pink');
});
test('off keeps design independent and enabling changes no content', () => {
 const history = new CompositionHistory(); history.commit({ consistency: false });
 history.commit({ sizes: { bookshop: { width: 300, height: 400 } } }); expect(history.value.sizes.kitchen).toBeUndefined();
 const before = history.value; history.commit({ consistency: true }); expect(history.value.sizes).toEqual(before.sizes);
 history.commit({ cardGaps: { bookshop: { title: 20 } } }); expect(history.value.cardGaps.kitchen.title).toBe(20); expect(history.value.sizes.kitchen).toBeUndefined();
});
test('editing words alone never spreads the words or unrelated design', () => {
 const history = new CompositionHistory({ ...initialComposition, text: card('First', { tone: 'pink' }) + '\n\n' + card('Second', { tone: 'yellow' }) });
 history.commit({ text: card('First words changed', { tone: 'pink' }) + '\n\n' + card('Second', { tone: 'yellow' }) });
 expect(values(history.value.text)[1]).toMatchObject({ label: 'Second', tone: 'yellow' }); expect(history.value.linkedCardDesign).toBeUndefined();
});
test('a new card with duplicate words still adopts established shared design', () => {
 const history = new CompositionHistory({ ...initialComposition, text: card('Same') });
 history.commit({ cardDesigns: { bookshop: { tone: 'pink' } } });
 history.commit({ text: history.value.text + '\n\n' + card('Same') });
 expect(values(history.value.text).map(value => value.tone)).toEqual(['pink', 'pink']);
});
test('reset clears the established design and page colour for future cards', () => {
 const history = new CompositionHistory();
 history.commit({ cardDesigns: { bookshop: { tone: 'pink' } }, pageTone: 'yellow' });
 expect(history.value.linkedCardDesign?.tone).toBe('pink');
 history.commit(initialComposition);expect(history.value.linkedCardDesign).toBeUndefined();expect(history.value.pageTone).toBe('');
 history.commit({text:card('New after reset')});expect(values(history.value.text)[0].tone).toBeUndefined();
});
