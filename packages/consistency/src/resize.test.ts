// @vitest-environment happy-dom
import { expect, it } from 'vite-plus/test';
import { resizeValue } from './resize';
it('snaps released sizes to squares within logical bounds', () => {
  expect(resizeValue(303)).toBe(300); expect(resizeValue(317)).toBe(320);
  expect(resizeValue(23)).toBe(80); expect(resizeValue(3000)).toBe(2000);
});
