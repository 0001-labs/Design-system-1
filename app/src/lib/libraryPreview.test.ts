import { expect, test } from 'vite-plus/test';
import { previewColours } from './libraryPreview';
const defaults = ':root { --ds-accent-color: var(--ds-green); --ds-green: #99ff73; --ds-paper: light-dark(#fff, #222); --ds-text-color: #222; --ds-fill: #eee; }';
test('preview resolves saved palette references and last root overrides', () => {
  const css = ':root { --ds-accent-color: var(--brand); --brand: #f00; } :root { --brand: #146abc; }';
  expect(previewColours(css, defaults)).toEqual({accent:'#146abc', paper:'light-dark(#fff, #222)', ink:'#222', surface:'#eee'});
});
test('legacy accents work and cyclic references cannot hang rendering', () => {
  expect(previewColours(':root { --one-accent-color: #123456; }', defaults).accent).toBe('#123456');
  expect(previewColours(':root { --ds-accent-color: var(--a); --a: var(--b); --b: var(--a); }', defaults).accent).toBe('');
});
