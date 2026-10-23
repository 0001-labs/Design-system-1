import { expect, it } from 'vite-plus/test';
import { applyComponentDecision, componentContext, componentQuestions, type ComponentContext } from './consistency-routing';
import { componentDefaults, writeBasicContentElement } from './consistency-content';
const button = writeBasicContentElement({ ...componentDefaults.button, kind: 'button', label: 'Contact', secondary: false, action: { kind: 'link', target: 'https://example.com/contact' } });
const card = '```c9y-card\n' + JSON.stringify({ label: 'Keep', title: 'Title', body: 'Independent copy', width: 400, height: 200, gaps: { title: 20 }, future: { preserved: true } }) + '\n```';
export function judgment(context: ComponentContext, action: string, target = 'none') {
  const questions = componentQuestions(context);
  const answer = (criteria: Record<string, string>, choice: string) => ({ type: 'choice', choice, confidence: 1, probabilities: Object.fromEntries(Object.keys(criteria).map(key => [key, key === choice ? 1 : 0])) });
  return { answers: { change: { type: 'noul', noul: 1 }, action: answer(questions.action.criteria, target === 'none' ? action : `${action}__${target}`) } };
}
it('inserts a real library component without rewriting surrounding Markdown', () => {
  const context = componentContext({ prompt: 'Add a card', kind: 'writing', document: '# Keep\n\n⟦here⟧\n\nAfter' })!;
  expect(applyComponentDecision(context, judgment(context, 'insert_card'))).toEqual({ insert: writeBasicContentElement(componentDefaults.card) });
});
it('changes only the identified component property and preserves links, future fields and surrounding content', () => {
  const document = '# Keep\n\n' + button + '\n\n' + card + '\n\n⟦here⟧\n\nAfter';
  const context = componentContext({ prompt: 'Fill the card', kind: 'writing', document })!;
  const result = applyComponentDecision(context, judgment(context, 'card_filled', 'component_2'))!;
  expect(result).toHaveProperty('edits');
  const edit = (result as { edits: Array<{ find: string; replace: string }> }).edits[0]!;
  expect(edit.find).toBe(card);
  const output = edit.replace;
  expect(output).toContain('"future":{"preserved":true}');
  expect(output).toContain('"gaps":{"title":20}'); expect(output).toContain('"variant":"filled"');
  expect(output).not.toContain(button); expect(output).not.toContain('# Keep'); expect(output).not.toContain('After');
  expect(output).not.toContain('⟦here⟧');
});
it('refuses a confident operation when the independent change-intent judgment says no', () => {
  const context = componentContext({ prompt: 'Do not change the button', kind: 'writing', text: button })!;
  const result = judgment(context, 'button_secondary', 'component_1');
  result.answers.change.noul = 0.1;
  expect(applyComponentDecision(context, result)).toBeNull();
});
it('rejects ambiguous targets, unsupported operations and cross-kind targets', () => {
  const context = componentContext({ prompt: 'Change this', kind: 'writing', document: button + '\n\n' + card })!;
  expect(applyComponentDecision(context, judgment(context, 'other'))).toBeNull();
  expect(applyComponentDecision(context, judgment(context, 'card_filled', 'none'))).toBeNull();
  expect(applyComponentDecision(context, judgment(context, 'card_filled', 'component_1'))).toBeNull();
  expect(applyComponentDecision(context, judgment(context, 'delete_everything'))).toBeNull();
});
it('does not offer insertion without a unique prompt marker or target syntax inside ordinary code', () => {
  expect(componentContext({ prompt: 'Add card', kind: 'writing', document: 'Before' })).toBeNull();
  expect(componentContext({ prompt: 'Edit', kind: 'writing', document: '````markdown\n' + card + '\n````' })).toBeNull();
  expect(componentContext({ prompt: 'Edit', kind: 'diagram', text: card })).toBeNull();
  const context = componentContext({ prompt: 'Add card', kind: 'writing', document: card + '\n⟦here⟧\n⟦here⟧' })!;
  expect(componentQuestions(context).action.criteria).not.toHaveProperty('insert_card');
});
it('rejects malformed and low-confidence decisions instead of silently choosing', () => {
  const context = componentContext({ prompt: 'Secondary button', kind: 'writing', text: button })!;
  for (const confidence of [0.79, -1, 2, NaN]) {
    const response = judgment(context, 'button_secondary', 'component_1'); response.answers.action.confidence = confidence;
    expect(applyComponentDecision(context, response)).toBeNull();
  }
  const response = judgment(context, 'button_secondary', 'component_1');
  response.answers.action.probabilities.other = 0.8;
  expect(applyComponentDecision(context, response)).toBeNull();
  expect(applyComponentDecision(context, {})).toBeNull();
});
it('preserves a selected component destination when changing its variant', () => {
  const context = componentContext({ prompt: 'Make secondary', kind: 'writing', text: button })!;
  const result = applyComponentDecision(context, judgment(context, 'button_secondary', 'component_1'));
  expect(result).toEqual({ insert: button.replace('"secondary":false', '"secondary":true') });
});

import { PAGE_INSERTIONS } from './consistency-insertions';
it.each(PAGE_INSERTIONS)('routes the approved $label to the same native insertion source', entry => {
 const context = componentContext({ prompt: `Add ${entry.label}`, kind: 'writing', document: 'Before\n\n⟦here⟧\n\nAfter' })!;
 expect(applyComponentDecision(context, judgment(context, `insert_${entry.id}`))).toEqual({ insert: entry.source });
 expect(componentQuestions(context).action.criteria).not.toHaveProperty('insert_context');
});
