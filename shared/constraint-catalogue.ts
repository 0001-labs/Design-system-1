import { constraints } from '../DS1/0-face/constraints';

/** Permanent catalogue identities. Never renumber or reuse an ID when a rule is retired. */
export const CONSTRAINT_IDENTITIES: Record<string, { id: string; tag: string }> = {
  'select.hug': { id: 'C001', tag: 'Hug sizing' },
  'button.visible-label': { id: 'C002', tag: 'Readable actions' },
  'text.whole-words': { id: 'C003', tag: 'Whole words' },
  'color.text-contrast': { id: 'C004', tag: 'Text contrast' },
  'card.media-level': { id: 'C005', tag: 'Media alignment' },
  'card.media-corners': { id: 'C006', tag: 'Media corners' },
  'page.window-width': { id: 'C007', tag: 'Window fit' },
  'carousel.sideways-scroll': { id: 'C008', tag: 'Sideways movement' },
  'page.fault-lines': { id: 'C009', tag: 'Fault lines' },
};
export const CONSTRAINT_CATALOGUE = constraints.map(({ code, rule, why, components, check }) => ({
  ...CONSTRAINT_IDENTITIES[code], code, rule, why, components, check,
}));
/** Foundation rules documented separately from the measurable component checks. */
export const FOUNDATION_CONSTRAINTS = [
  { id: 'F001', tag: 'Grid', code: 'foundation.squares', rule: 'Use 20px squares multiplied by the device scale. Widths and heights use whole squares; gaps use whole or half squares. Lines stay one pixel.', anchor: 'on-the-squares' },
  { id: 'F002', tag: 'Separation', code: 'foundation.collisions', rule: 'Pieces never overlap. Rows meet edge to edge; movable pieces follow the pointer and settle on free whole squares.', anchor: 'nothing-collides' },
  { id: 'F003', tag: 'Baseline', code: 'foundation.sixteen', rule: 'Words, icons and controls occupy the lower sixteen pixels of each square, with four above. Wrapping prose uses 20px lines.', anchor: 'the-sixteen' },
  { id: 'F004', tag: 'Rows', code: 'foundation.list', rule: 'Lists use one-square rows, icons in the first sixteen and words on the next square. Numbers align at the end; colour communicates state.', anchor: 'a-list-on-the-grid' },
  { id: 'F005', tag: 'Type metrics', code: 'foundation.face', rule: 'Correct added fonts at their font-face definition: match the baseline and capitals once, without per-component offsets.', anchor: 'a-face-you-add' },
];
export type ExampleCheck = { code: string; width: number; theme: string; measured: number; status: 'pass' | 'fail' | 'review' | 'absent'; findings: { message: string; element: string; review: boolean }[] };
export type ExampleResult = { id: string; checks: ExampleCheck[]; errors: string[]; preview?: string };
export type ExampleReport = { schema: 1; generatedAt: string; revision: string; sourceDirty?: boolean; widths: number[]; themes: string[]; examples: ExampleResult[] };
/** A check is one applicable rule at one width/theme. Review and absent are never called passes. */
export function exampleScore(result: ExampleResult) {
  const applicable = result.checks.filter(check => check.status !== 'absent');
  return { passed: applicable.filter(check => check.status === 'pass').length, total: applicable.length,
    failed: applicable.filter(check => check.status === 'fail').length, review: applicable.filter(check => check.status === 'review').length };
}
