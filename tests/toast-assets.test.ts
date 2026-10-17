import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'vite-plus/test';
import { TOAST_ASSETS, TOAST_ICON_NAMES, minifyStylesheet, resolveStylesheet, toastAssets } from '../scripts/toast-assets.mjs';

const root = join(import.meta.dirname, '..');
const read = (path: string) => readFileSync(join(root, path), 'utf8');

test('the committed toast assets match the stylesheet and icons they come from', () => {
  // Run `vp run generate:toast-assets` after changing ds-toast.css, the sheets it imports or the icons.
  expect(read(TOAST_ASSETS)).toBe(toastAssets(read));
});

test('minifying keeps quoted strings and drops only comments and spare whitespace', () => {
  expect(minifyStylesheet('/* a */\n.x  >  .y {\n  content: "a  ;  }" ;\n  margin: 0 auto;\n}\n\n@media (width > 1px) { .z { top: 0 } }\n')).toBe('.x > .y{content: "a  ;  }";margin: 0 auto}@media (width > 1px){.z{top: 0}}');
});

test('the page toaster and <ds-toast> draw from one stylesheet source', async () => {
  expect(read('DS1/2-core/ds-toast.ts')).toContain('import styles from "./styles/ds-toast.css?inline";');
  const { toastIcons, toastStyles } = await import('../DS1/0-face/generated/toast-assets');
  expect(toastStyles).toBe(minifyStylesheet(resolveStylesheet(read, '2-core/styles/ds-toast.css')));
  // The imports are written in, each once, before the toast's own rules.
  expect(toastStyles).not.toMatch(/@import|\/\*/);
  expect(toastStyles.match(/--ds-corner-size: 0px/g)).toHaveLength(1);
  expect(toastStyles.indexOf('--ds-corner-size')).toBeLessThan(toastStyles.indexOf('}:host{'));
  expect(toastStyles).toContain(':host([rich-colors]) .toast[data-type="success"]{--ds-toast-background: var(--ds-apple-green)}');
  expect(Object.keys(toastIcons)).toEqual(TOAST_ICON_NAMES);
  for (const name of TOAST_ICON_NAMES) expect(toastIcons[name as keyof typeof toastIcons]).toBe(read(`DS1/x-icon/${name}.svg`));
});
