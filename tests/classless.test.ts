import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'vite-plus/test';

const css = readFileSync(join(import.meta.dirname, '../DS1/1-root/one.semantic.css'), 'utf8');
const code = css.replace(/\/\*[\s\S]*?\*\//g, '');
const rootStart = code.indexOf(':root {');
const rootBlock = code.slice(rootStart, code.indexOf('\n}', rootStart));
const rules = code.slice(code.indexOf('\n}', rootStart));
const token = (name: string) => new RegExp(`${name}:\\s*([^;]+);`).exec(rootBlock)?.[1]?.trim();

test('the classless sheet imports nothing and names Design system 1\'s typefaces', () => {
  expect(code).not.toMatch(/@import|url\(|googleapis/);
  expect(code).not.toMatch(/Arial|Helvetica|Georgia|Times New Roman|Courier/);
  for (const name of ['--one-font', '--one-font-medium', '--one-font-display']) expect(token(name), name).toMatch(/^"Inter Arrows", "GT-America-Standard-(?:Regular|Medium)"|^"Inter Arrows", "GT America"/);
  expect(token('--one-font-mono')).toMatch(/^"Inter Arrows", "Iosevka"/);
});

test('its measures are Design system 1\'s: the square, 14 on one-square lines, the control height and 4px corners', () => {
  expect(token('--one-unit')).toBe('20px');
  expect(token('--one-font-size')).toBe('14px');
  expect(token('--one-font-size-small')).toBe('10px');
  expect(token('--one-display-size')).toBe('20px');
  expect(token('--one-line-height')).toBe('20px');
  expect(token('--one-control-height')).toBe('16px');
  expect(token('--one-radius')).toBe('4px');
  expect(token('--one-page-width')).toBe('calc(32 * var(--one-unit))');
  for (const name of ['--one-section-padding-block', '--one-section-padding-inline', '--one-section-gap', '--one-blockquote-padding-inline']) expect(token(name), name).toBe('20px');
  for (const name of ['--one-table-cell-padding-block', '--one-table-cell-padding-inline']) expect(token(name), name).toBe('10px');
});

test('every length in its rules follows the device scale, except hairlines', () => {
  expect(rules).not.toMatch(/\d(?:rem|em|vw)\b|clamp\(/);
  for (const [, property, value] of rules.matchAll(/([a-z-]+):\s*([^;{}]+);/g)) {
    if (!/\dpx\b/.test(value!) || value!.includes('var(--sf, 1)')) continue;
    expect(['box-shadow', 'outline', 'outline-offset', 'text-decoration-thickness'], `${property}: ${value}`).toContain(property);
  }
  expect(rules).toContain('line-height: calc(var(--one-line-height) * var(--sf, 1))');
  expect(rules).toContain('line-height: calc(var(--one-line-height) * 2 * var(--sf, 1))');
});

test('the workbench still finds each element\'s rule', () => {
  // The anchors App.tsx's componentCssTargets reveals in the editor.
  for (const anchor of ['a {', '  button,', ':where(code, kbd) {', 'details {', ':where(h1, h2, h3, h4, h5, h6) {', 'hr {', '  input:not(', 'p + p {', 'progress {', 'section {', '  select,', 'table {', 'textarea {']) expect(css, anchor).toContain(anchor);
  expect(css).toMatch(/^body\s*\{[^}]*\}/m);
  for (const name of ['--one-accent-color', '--one-radius', '--one-unit', '--one-page-width', '--one-font', '--one-button-padding-inline', '--one-input-gap', '--one-section-gap', '--one-code-padding-inline']) expect(token(name), name).toBeTruthy();
});
