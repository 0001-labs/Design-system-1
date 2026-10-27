import { measures } from './measures';

/** Shared geometry belongs to the foundation, not to a design library's appearance.
 * These are unscaled inputs; device scaling and resolved component metrics stay shared.
 * Rendered constraints still check layout, contrast, labels and font alignment.
 */
export const FOUNDATION_TOKENS: Readonly<Record<string, string>> = {
  '--ds-1': `${measures.square}px`,
  '--one-unit': `${measures.square}px`,
  '--ds-control-size': `${measures.control}px`,
  '--one-control-height': `${measures.control}px`,
  '--ds-row-size': `${measures.row}px`,
  '--ds-text-leading': `${measures.leading}px`,
  '--ds-08': 'calc(var(--ds-1) * 0.8)',
  '--ds-unit': 'calc(var(--ds-1, 20px) * var(--ds-sf, 1))',
  '--ds-control-height': 'calc(var(--ds-control-size, var(--ds-08, 16px)) * var(--ds-sf, 1))',
  '--ds-row-height': 'calc(var(--ds-row-size, var(--ds-1, 20px)) * var(--ds-sf, 1))',
  '--ds-type-lineheight-default': 'calc(var(--ds-text-leading, 16px) * var(--ds-sf, 1))',
};

/** A design can repeat a foundation default, but changing it requires a foundation release. */
export function foundationTokenIssue(name: string, value: string): string | undefined {
  const expected = FOUNDATION_TOKENS[name];
  if (!expected) return;
  if (value.replace(/\s/g, '') === expected.replace(/\s/g, '')) return;
  // The published compatibility bridge derives these inputs from protected library tokens.
  if ((name === '--ds-1' && value.trim() === 'var(--one-unit)') ||
      (name === '--ds-control-size' && value.trim() === 'var(--one-control-height)')) return;
  const literal = /^([0-9]+(?:\.[0-9]+)?)px$/i.exec(value.trim());
  if (literal && Number(literal[1]) === Number.parseFloat(expected)) return;
  return `${name} belongs to the shared foundation and must stay ${expected}. Change colours, fonts and appearance within its constraints.`;
}
