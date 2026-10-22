// @vitest-environment happy-dom
import { expect, it } from 'vite-plus/test';
import { statGapId } from './stat-spacing';
import { CompositionHistory } from './model';
it('keeps each stat text boundary independent in normal composition history', () => {
 const label = statGapId('starting-point', 'label'), figure = statGapId('starting-point', 'figure');
 const history = new CompositionHistory(); history.commit({ gaps: { ...history.value.gaps, [label]: 20, [figure]: 40 } });
 expect(history.value.gaps[label]).toBe(20); expect(history.value.gaps[figure]).toBe(40);
 expect(history.value.gaps[statGapId('next-version', 'label')]).toBeUndefined();
 history.undo(); expect(history.value.gaps[label]).toBeUndefined(); history.redo(); expect(history.value.gaps[figure]).toBe(40);
});
