import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'vite-plus/test';
import { named } from '../DS1/1-root/palette';

const root = join(import.meta.dirname, '../DS1/1-root');
const read = (file: string) => readFileSync(join(root, file), 'utf8');
const text = read('text.css');
const tokens = read('component-tokens.css');
const rule = (css: string, selector: string) => {
  const start = css.indexOf(`${selector} {`);
  expect(start, selector).toBeGreaterThanOrEqual(0);
  return css.slice(start, css.indexOf('}', start));
};
const token = (name: string) => new RegExp(`${name}:\\s*([^;]+);`).exec(tokens)?.[1]?.trim();
const hex = (name: string) => named.find(([colour]) => colour === name)?.[1];

function luminance(value: string) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(value.slice(i, i + 2), 16) / 255).map(c => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}
const contrast = (a: string, b: string) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light! + 0.05) / (dark! + 0.05);
};

test('the text classes stand on one-square lines, and a display title on two', () => {
  expect(rule(text, '.ds-text')).toContain('line-height: var(--ds-unit)');
  expect(rule(text, '.ds-text--display')).toContain('line-height: calc(2 * var(--ds-unit))');
  expect(rule(text, '.ds-text--display')).toContain('font-size: var(--ds-type-size-display)');
  expect(read('component-metrics.css')).toContain('--ds-type-size-display: calc(var(--ds-display-text-size, 20px) * var(--ds-sf, 1))');
  expect(rule(text, '.ds-text--small')).toContain('var(--ds-type-size-small)');
  expect(rule(text, '.ds-text--heading')).toContain('var(--ds-type-size-heading)');
});

test('the text classes have the muted, title and danger tones', () => {
  expect(rule(text, '.ds-text--muted')).toContain('var(--ds-text-color-muted)');
  expect(rule(text, '.ds-text--title')).toContain('var(--ds-title-color)');
  expect(rule(text, '.ds-text--danger')).toContain('var(--ds-danger-color)');
});

test('every length in the text classes is a token or follows the scale', () => {
  const lengths = text.replace(/\/\*[\s\S]*?\*\//g, '').match(/-?\d+(?:\.\d+)?px/g) ?? [];
  expect(lengths).toEqual(['-0.4px']);
  expect(text).toContain('calc(var(--ds-display-text-tracking, -0.4px) * var(--ds-sf, 1))');
});

test('one.css and controls.css share one definition of the text classes', () => {
  for (const file of ['one.css', 'controls.css']) {
    const css = read(file);
    expect(css, file).toMatch(/^@import "\.\/text\.css";$/m);
    expect(css.replace(/\/\*[\s\S]*?\*\//g, ''), file).not.toMatch(/\.ds-text[\s{.-]/);
  }
});

test('the danger colour comes from the palette and reads as text on light and dark paper', () => {
  expect(token('--ds-danger-color')).toBe('light-dark(var(--ds-red-for-blood), var(--ds-tuned-red))');
  const light = token('--ds-red-for-blood')!, dark = token('--ds-tuned-red')!;
  expect(light).toBe(hex('Red for blood'));
  expect(dark).toBe(hex('Tuned red'));
  for (const paper of ['#ffffff', '#f4f4f4']) expect(contrast(light, paper), paper).toBeGreaterThanOrEqual(4.5);
  for (const paper of ['#2a2a2a', '#2c2c2c']) expect(contrast(dark, paper), paper).toBeGreaterThanOrEqual(4.5);
});
