import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'vite-plus/test';
import config from '../sync.exports.mjs';

const root = join(import.meta.dirname, '..');
const read = (path: string) => readFileSync(join(root, path), path.endsWith('.woff2') ? undefined : 'utf8');
type Exported = { files(context: { read: typeof read; options: Record<string, unknown> }): Record<string, unknown> | Map<string, unknown> };
const exports = config.exports as unknown as Record<string, Exported>;
const files = (name: string, options: Record<string, unknown> = {}) => {
  const result = exports[name].files({ read, options });
  return result instanceof Map ? Object.fromEntries(result) : result;
};

test('the root export carries one.css, what it imports and every face it loads', () => {
  const copy = files('root');
  for (const file of ['one.css', 'grid.css', 'text.css', 'component-tokens.css', 'component-metrics.css', 'component-appearance.css']) expect(copy).toHaveProperty([file]);
  for (const [, file] of String(copy['one.css']).matchAll(/@import "\.\/([^"]+)";/g)) expect(copy).toHaveProperty([file!]);
  const faces = [...String(copy['one.css']).matchAll(/url\("\.\/(fonts\/[^"]+)"\)/g)].map((match) => match[1]);
  expect(faces.length).toBeGreaterThan(0);
  for (const face of faces) expect(copy).toHaveProperty([face]);
  expect(copy).not.toHaveProperty(['controls.css']);
});

test('the root export can leave the faces to the product and add controls and page scripts', () => {
  const copy = files('root', { fonts: false, nativeControls: true, modules: ['grid', 'tooltips'] });
  expect(Object.keys(copy).some((file) => file.startsWith('fonts/'))).toBe(false);
  expect(copy).toHaveProperty(['controls.css']);
  expect(copy).toHaveProperty(['table.css']);
  for (const file of ['0-face/grid.ts', '0-face/layout-inspector.ts', '0-face/grid-fit.ts', '0-face/tooltips.ts']) expect(copy).toHaveProperty([file]);
  expect(() => files('root', { modules: ['nothing'] })).toThrow(/Unknown page script/);
});

test('bundled tokens are one stylesheet with no local imports left', () => {
  const copy = files('tokens', { nativeControls: true, bundle: true });
  expect(Object.keys(copy)).toEqual(['bundle.css']);
  const css = String(copy['bundle.css']);
  expect(css).not.toMatch(/@import\s+"\.\//);
  expect(css).toContain('--ds-row-height');
  expect(css).toContain('.ds-button');
  expect(css).toContain('.ds-table');
  expect(css.indexOf('--ds-row-height')).toBeLessThan(css.indexOf('.ds-button {'));
  expect(css).toContain('.ds-text {');
});

test('the prose sheet is copied when a product asks for it', () => {
  expect(files('root')).not.toHaveProperty(['prose.css']);
  expect(files('root', { prose: true, fonts: false })).toHaveProperty(['prose.css']);
  expect(Object.keys(files('root', { styles: ['prose.css', 'component-tokens.css', 'component-metrics.css', 'component-appearance.css'], fonts: false }))).toEqual(['prose.css', 'component-tokens.css', 'component-metrics.css', 'component-appearance.css']);
  expect(Object.keys(files('tokens', { prose: true }))).toContain('prose.css');
  expect(String(files('tokens', { prose: true, bundle: true })['bundle.css'])).toContain('[data-ds-prose] {');
});

test('the classless sheet is copied when a product asks for it, and keeps its palette', () => {
  expect(files('root')).not.toHaveProperty(['one.semantic.css']);
  expect(Object.keys(files('root', { styles: ['one.semantic.css'], fonts: false }))).toEqual(['one.semantic.css']);
  expect(String(files('tokens', { classless: true })['one.semantic.css'])).toContain('--one-apple-green: light-dark(');
  expect(Object.keys(files('root', { classless: true, prose: true, fonts: false }))).toEqual(expect.arrayContaining(['one.css', 'prose.css', 'one.semantic.css']));
});

test('controls.css always arrives with the table and text classes it imports', () => {
  expect(Object.keys(files('tokens', { nativeControls: true }))).toEqual(['component-tokens.css', 'component-metrics.css', 'component-appearance.css', 'table.css', 'text.css', 'controls.css']);
  expect(Object.keys(files('tokens'))).not.toContain('text.css');
  expect(Object.keys(files('root', { styles: ['grid.css'], fonts: false, nativeControls: true }))).toEqual(['grid.css', 'table.css', 'controls.css', 'text.css']);
  expect(Object.keys(files('root', { styles: ['one.css', 'grid.css'], fonts: false }))).toContain('text.css');
});

test('the fonts export offers the root faces by name', () => {
  const copy = files('fonts', { fonts: ['GT-America-Standard-Regular.woff2', 'Iosevka-Regular.woff2'] });
  expect(Object.keys(copy)).toEqual(['GT-America-Standard-Regular.woff2', 'Iosevka-Regular.woff2']);
});

test('the root export can copy only the stylesheets a product loads', () => {
  expect(Object.keys(files('root', { styles: ['grid.css'], fonts: false }))).toEqual(['grid.css']);
  expect(Object.keys(files('root', { styles: [], fonts: false, modules: ['scaling'] }))).toEqual(['0-face/scaling.ts']);
  expect(() => files('root', { styles: ['other.css'] })).toThrow(/Unknown root stylesheet/);
});
