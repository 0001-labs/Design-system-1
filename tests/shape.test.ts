// @vitest-environment happy-dom
import { beforeEach, expect, it } from 'vite-plus/test';
import { readFileSync } from 'node:fs';
import { footerPreferences } from '../DS1/4-page/ds-footer';

const bootstrap = readFileSync('DS1/0-face/theme-bootstrap.js', 'utf8');
function run() {
  delete (window as { DS_ONE_SHAPE?: unknown }).DS_ONE_SHAPE;
  delete (window as { DS_ONE_THEME?: unknown }).DS_ONE_THEME;
  new Function(bootstrap)();
}
beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-ds-shape');
  delete window.DS_ONE_PREFERENCES;
});

it('leaves the components their own corners until a shape is chosen', () => {
  run();
  expect(document.documentElement.hasAttribute('data-ds-shape')).toBe(false);
  expect(window.DS_ONE_SHAPE!.shape()).toBeNull();
});

it('puts a stored shape on the root before the first paint', () => {
  localStorage.setItem('ds-one:shape', 'circular');
  run();
  expect(document.documentElement.getAttribute('data-ds-shape')).toBe('circular');
});

it('stores a chosen shape, marks the root and says so', () => {
  run();
  let told = '';
  window.addEventListener('shape-changed', event => { told = (event as CustomEvent).detail.shape; }, { once: true });
  window.DS_ONE_SHAPE!.set('square');
  expect(document.documentElement.getAttribute('data-ds-shape')).toBe('square');
  expect(localStorage.getItem('ds-one:shape')).toBe('square');
  expect(told).toBe('square');
  window.DS_ONE_SHAPE!.set('oval' as never);
  expect(document.documentElement.getAttribute('data-ds-shape')).toBe('square');
});

it('takes the product’s default shape for a visitor who has chosen none', () => {
  window.DS_ONE_PREFERENCES = { shapeDefault: 'rounded' };
  run();
  expect(document.documentElement.getAttribute('data-ds-shape')).toBe('rounded');
});

it('offers the shape in a footer only when it is named', () => {
  expect(footerPreferences('')).toEqual(['language', 'theme']);
  expect(footerPreferences('theme shape')).toEqual(['theme', 'shape']);
});
