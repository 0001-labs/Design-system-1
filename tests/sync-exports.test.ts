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
  for (const file of ['one.css', 'grid.css', 'component-tokens.css', 'component-metrics.css', 'component-appearance.css']) expect(copy).toHaveProperty([file]);
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

test('the feedback export carries the module with everything it imports, by its paths in DS1', () => {
  const copy = files('feedback');
  for (const file of ['0-face/feedback.ts', '0-face/toaster.ts', '0-face/toast-queue.ts', '0-face/dialogs.ts', '0-face/copy-text.ts', '0-face/i18n.ts', '0-face/shared-words.ts', '0-face/translations/da.json', '2-core/styles/ds-toast.css', '1-root/component-metrics.css', 'x-icon/check.svg', 'x-icon/close.svg']) expect(copy).toHaveProperty([file]);
  // No Lit and no component comes with it.
  expect(Object.keys(copy).some((file) => /^2-core\/ds-|^3-unit|^4-page/.test(file))).toBe(false);
  expect(Object.values(copy).some((content) => /from\s+["']lit/.test(String(content)))).toBe(false);
});
