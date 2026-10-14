import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { expect, test } from 'vite-plus/test';
// @ts-expect-error A plain module, read by Sync 1 through sync.exports.mjs.
import { componentGraph } from '../scripts/component-graph.mjs';
// @ts-expect-error The same.
import exported from '../sync.exports.mjs';

const ds1 = resolve('DS1');

test('a selection carries everything it imports, with its React adapter and the shared tokens', () => {
  const { files } = componentGraph(ds1, ['button', 'panel', 'input', 'split']);
  for (const file of ['2-core/ds-split.ts', 'react/split.ts', '2-core/ds-text.ts', 'react/button.ts', '0-face/translations/en.json', 'x-icon/password-see.svg', '1-root/component-tokens.css', '1-root/controls.css']) {
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
