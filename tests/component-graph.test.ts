import { resolve } from 'node:path';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { expect, test } from 'vite-plus/test';
// @ts-expect-error A plain module, read by Sync 1 through sync.exports.mjs.
import { componentGraph } from '../scripts/component-graph.mjs';
// @ts-expect-error The same.
import exported from '../sync.exports.mjs';

const ds1 = resolve('DS1');

test('a selection carries everything it imports, with its React adapter and the shared tokens', () => {
  const { files } = componentGraph(ds1, ['button', 'panel', 'input', 'split']);
  for (const file of ['2-core/ds-split.ts', 'react/split.ts', '2-core/ds-text.ts', 'react/button.ts', '0-face/translations/en.json', 'x-icon/password-see.svg', '1-root/component-tokens.css', '1-root/controls.css', '1-root/text.css']) {
    expect(files.has(file)).toBe(true);
  }
  expect(files.get('1-root/component-metrics.css')).toBe(readFileSync(resolve('DS1/1-root/component-metrics.css'), 'utf8'));
  expect(files.get('components.ts')).toContain("export * from './2-core/ds-button';");
  expect(componentGraph(ds1, ['panel']).files.has('2-core/ds-button.ts')).toBe(false);
});

test('selecting multiline fields includes the shared input base and React binding', () => {
  const { files } = componentGraph(ds1, ['textarea']);
  for (const file of ['2-core/ds-textarea.ts', '2-core/ds-input.ts', '2-core/styles/ds-textarea.css', 'react/input.ts']) expect(files.has(file)).toBe(true);
});

test('selecting the page carries its React adapter, so a product needs no JSX typing of its own', () => {
  const { files } = componentGraph(ds1, ['page']);
  for (const file of ['4-page/ds-page.ts', '4-page/styles/ds-page.css', 'react/page.ts']) expect(files.has(file)).toBe(true);
});

test('empty states and notices carry their React adapters and the classes that draw them', () => {
  const { files } = componentGraph(ds1, ['empty', 'notice']);
  for (const file of ['2-core/ds-empty.ts', '2-core/ds-notice.ts', 'react/empty.ts', 'react/notice.ts', '1-root/empty.css', '1-root/notice.css', '2-core/ds-icon.ts']) expect(files.has(file)).toBe(true);
  // controls.css travels with every selection, so its native classes do too.
  expect(componentGraph(ds1, ['text']).files.has('1-root/notice.css')).toBe(true);
  expect(componentGraph(ds1, ['text']).files.has('react/notice.ts')).toBe(false);
});

test('a carousel carries its page dots, its React adapter, the shared script and the sheet that draws them', () => {
  const { files } = componentGraph(ds1, ['carousel']);
  for (const file of ['3-unit/ds-carousel.ts', '2-core/ds-pagedots.ts', 'react/carousel.ts', '0-face/carousel.ts', '1-root/carousel.css', '2-core/ds-icon.ts']) expect(files.has(file)).toBe(true);
  const dots = componentGraph(ds1, ['pagedots']).files;
  expect(dots.has('0-face/carousel.ts')).toBe(true);
  expect(dots.has('react/carousel.ts')).toBe(false);
  expect(componentGraph(ds1, ['text']).files.has('1-root/carousel.css')).toBe(true);
});

test('every component resolves everything it imports, so any selection can be copied', () => {
  const names = ['2-core', '3-unit', '4-page'].flatMap(layer =>
    readdirSync(resolve(ds1, layer)).flatMap(file => /^ds-([a-z-]+)\.ts$/.exec(file)?.[1] ?? []));
  expect(names).toContain('banner');
  for (const name of names) expect(() => componentGraph(ds1, [name]), name).not.toThrow();
  const { files } = componentGraph(ds1, ['banner']);
  for (const file of ['2-core/ds-banner.ts', '0-face/i18n.ts', '2-core/ds-text.ts', '2-core/ds-button.ts', '2-core/ds-icon.ts']) expect(files.has(file)).toBe(true);
});

test('a specifier written with .js reads its TypeScript source, and a real script keeps its own', () => {
  const root = mkdtempSync(resolve(tmpdir(), 'ds1-graph-'));
  mkdirSync(resolve(root, '2-core'));
  mkdirSync(resolve(root, '0-face'));
  mkdirSync(resolve(root, '1-root'));
  writeFileSync(resolve(root, '2-core/ds-probe.ts'), 'import { a } from "../0-face/words.js";\nimport "../0-face/boot.js";\n');
  writeFileSync(resolve(root, '0-face/words.ts'), 'export const a = 1;\n');
  writeFileSync(resolve(root, '0-face/boot.js'), 'window.booted = true;\n');
  writeFileSync(resolve(root, '1-root/component-tokens.css'), '');
  writeFileSync(resolve(root, '1-root/controls.css'), '');
  const { files } = componentGraph(root, ['probe']);
  expect(files.has('0-face/words.ts')).toBe(true);
  expect(files.has('0-face/boot.js')).toBe(true);
});

test('unknown and malformed names are refused', () => {
  expect(() => componentGraph(ds1, ['nothing'])).toThrow(/Unknown component/);
  expect(() => componentGraph(ds1, ['../x'])).toThrow(/Invalid component/);
});

test('the components export records its files for the adoption report', () => {
  const git = () => 'a'.repeat(40);
  const files = exported.exports.components.files({ source: resolve('.'), options: { components: ['text'] }, git });
  const manifest = JSON.parse(files.get('components-manifest.json'));
  expect(manifest.components).toEqual(['text']);
  expect(manifest.commit).toBe('a'.repeat(40));
  expect(Object.keys(manifest.files)).toContain('2-core/ds-text.ts');
  expect(Object.keys(manifest.files)).not.toContain('components-manifest.json');
});
