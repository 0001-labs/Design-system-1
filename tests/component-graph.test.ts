import { resolve } from 'node:path';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { expect, test } from 'vite-plus/test';
// Plain modules, read by Sync 1 through sync.exports.mjs; tests/tsconfig.json reads their JavaScript.
import { componentGraph } from '../scripts/component-graph.mjs';
import exported from '../sync.exports.mjs';

const ds1 = resolve('DS1');

test('a selection carries everything it imports, with its React adapter and the shared tokens', () => {
  const { files } = componentGraph(ds1, ['button', 'panel', 'input']);
  for (const file of ['2-core/button-split.ts', 'react/button-split.ts', '2-core/ds-text.ts', 'react/button.ts', '0-face/translations/en.json', 'x-icon/password-see.svg', '1-root/component-tokens.css', '1-root/controls.css', '1-root/text.css']) {
    expect(files.has(file)).toBe(true);
  }
  expect(files.get('1-root/component-metrics.css')).toBe(readFileSync(resolve('DS1/1-root/component-metrics.css'), 'utf8'));
  expect(files.get('components.ts')).toContain("export * from './2-core/ds-button';");
  expect(componentGraph(ds1, ['panel']).files.has('2-core/ds-button.ts')).toBe(false);
});

test('selecting the input brings its stylesheet and React binding, multiline fields included', () => {
  const { files } = componentGraph(ds1, ['input']);
  for (const file of ['2-core/ds-input.ts', '2-core/styles/ds-input.css', 'react/input.ts']) expect(files.has(file)).toBe(true);
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

test('shortcut hints and overlays carry their adapters, keys, the overlay sheet and the swipe', () => {
  const { files } = componentGraph(ds1, ['kbd', 'overlay']);
  for (const file of ['2-core/ds-kbd.ts', 'react/kbd.ts', '0-face/keys.ts', '1-root/kbd.css', '4-page/ds-overlay.ts', 'react/overlay.ts', '0-face/overlay-swipe.ts', '1-root/overlay.css']) expect(files.has(file), file).toBe(true);
});

test('a carousel carries its page dots, its React adapter, the shared script and the sheet that draws them', () => {
  const { files } = componentGraph(ds1, ['carousel']);
  for (const file of ['3-unit/ds-carousel.ts', '2-core/ds-progress.ts', 'react/carousel.ts', '0-face/carousel.ts', '1-root/carousel.css', '2-core/ds-icon.ts']) expect(files.has(file)).toBe(true);
  const dots = componentGraph(ds1, ['progress']).files;
  expect(dots.has('0-face/carousel.ts')).toBe(true);
  expect(dots.has('react/carousel.ts')).toBe(false);
  expect(componentGraph(ds1, ['text']).files.has('1-root/carousel.css')).toBe(true);
});

test('stats and progress carry their React adapters, the figure words and the classes that draw them', () => {
  const { files } = componentGraph(ds1, ['stat', 'progress']);
  for (const file of ['2-core/ds-stat.ts', '2-core/ds-progress.ts', '2-core/figures.ts', '0-face/format.ts', 'react/stat.ts', 'react/progress.ts', '1-root/figures.css', '1-root/progress.css', '2-core/ds-icon.ts']) expect(files.has(file), file).toBe(true);
  expect(componentGraph(ds1, ['text']).files.has('1-root/figures.css')).toBe(true);
  expect(componentGraph(ds1, ['progress']).files.has('react/stat.ts')).toBe(false);
});

test('every component resolves everything it imports, so any selection can be copied', () => {
  const names = ['2-core', '3-unit', '4-page'].flatMap(layer =>
    readdirSync(resolve(ds1, layer)).flatMap(file => /^ds-([a-z-]+)\.ts$/.exec(file)?.[1] ?? []));
  expect(names).toContain('notice');
  for (const name of names) expect(() => componentGraph(ds1, [name]), name).not.toThrow();
  const { files } = componentGraph(ds1, ['notice']);
  for (const file of ['2-core/ds-notice.ts', '0-face/i18n.ts', '1-root/notice.css', '2-core/ds-icon.ts']) expect(files.has(file)).toBe(true);
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

test('the site chrome carries its React adapters, the drawer script and the sheets that draw it', () => {
  const { files } = componentGraph(ds1, ['header', 'footer', 'document', 'page']);
  for (const file of ['4-page/ds-header.ts', '4-page/ds-footer.ts', '4-page/ds-document.ts', 'react/header.ts', 'react/footer.ts', 'react/document.ts', '0-face/attach-overlay.ts', '0-face/header.ts', '1-root/header.css', '1-root/overlay.css', '1-root/footer.css', '1-root/document.css', '1-root/prose.css', '2-core/ds-cycle.ts', '0-face/translations/en.json']) expect(files.has(file), file).toBe(true);
  // The page's drawer is the header's: selecting the page alone brings the script.
  expect(componentGraph(ds1, ['page']).files.has('0-face/attach-overlay.ts')).toBe(true);
});

test('unknown and malformed names are refused', () => {
  expect(() => componentGraph(ds1, ['nothing'])).toThrow(/Unknown component/);
  // A folded component's old name says what it became.
  expect(() => componentGraph(ds1, ['dialog'])).toThrow(/dialog is now overlay/);
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
