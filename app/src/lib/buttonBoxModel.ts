import type { BoxModelConfig } from '../BoxModel';
import { libraryTokenValues, setLibraryToken } from './libraryTokens';
export type ButtonBox = BoxModelConfig & { gap: number };
export const defaultButtonBox: ButtonBox = { paddingX: 4, paddingY: 0, radius: 4, gap: 4, borderTop: 0, borderRight: 0, borderBottom: 0, borderLeft: 0, marginTop: 0, marginRight: 0, marginBottom: 0, marginLeft: 0 };
const scaled = (value: number | undefined) => `calc(${value ?? 0}px * var(--ds-sf, 1))`;
/** An opt-in rule for the shared button; no unrelated component rules are rebuilt. */
export function writeButtonBox(css: string, box: ButtonBox, mode: 'single' | 'split' = 'single'): string {
  const start = mode === 'single' ? '/* ds1:button-box:start */' : '/* ds1:button-split-box:start */';
  const end = mode === 'single' ? '/* ds1:button-box:end */' : '/* ds1:button-split-box:end */';
  const selector = mode === 'single' ? 'ds-button:not([split])' : 'ds-button[split]';
  const a = css.indexOf(start); const b = a < 0 ? -1 : css.indexOf(end, a);
  let base = a >= 0 && b >= 0 ? css.slice(0, a) + css.slice(b + end.length) : css;
  // Libraries made in the earlier native-element editor retain those consumers.
  const tokens = libraryTokenValues(base);
  for (const [name, value] of [['--one-button-padding-inline', box.paddingX], ['--one-button-padding-block', box.paddingY], ['--one-radius', box.radius]] as const) {
    if (mode === 'single' && tokens.has(name)) base = setLibraryToken(base, name, `${value}px`);
  }
  const margin = [box.marginTop, box.marginRight, box.marginBottom, box.marginLeft].map(scaled).join(' ');
  const border = [box.borderTop, box.borderRight, box.borderBottom, box.borderLeft].map(scaled).join(' ');
  const padding = `${scaled(box.paddingY)} ${scaled(box.paddingX)}`;
  return `${base.trimEnd()}\n\n${start}\n${selector} {\n  margin: ${margin};\n  ${mode === 'split' ? 'height: auto;' : ''}\n  --ds-button-padding: ${padding};\n  --ds-button-height: auto;\n  --ds-button-gap: ${scaled(box.gap)};\n  --ds-radius: ${scaled(box.radius)};\n}\n${selector}::part(${mode === 'single' ? 'control' : 'segment'}) {\n  padding: ${padding};\n  gap: ${scaled(box.gap)};\n  border-style: solid;\n  border-width: ${border};\n  border-color: var(--ds-border-color);\n  ${mode === 'single' ? `border-radius: ${scaled(box.radius)};` : ''}\n  height: auto;\n  min-height: var(--ds-control-height);\n  max-height: none;\n}\n${mode === 'single' && tokens.has('--one-button-padding-inline') ? `button { border-style: solid; border-width: ${[box.borderTop, box.borderRight, box.borderBottom, box.borderLeft].map(n => `${n ?? 0}px`).join(' ')}; margin: ${[box.marginTop, box.marginRight, box.marginBottom, box.marginLeft].map(n => `${n ?? 0}px`).join(' ')}; }\n` : ''}${end}\n`;
}
