// @vitest-environment happy-dom
import { expect, test } from 'vite-plus/test';
import { canStartMarquee, selectionRect, intersects } from './marquee';
test('marquee works in every direction and excludes merely touching edges', () => {
 const rect = selectionRect(100, 100, 10, 20);
 expect(rect).toEqual({ left: 10, top: 20, right: 100, bottom: 100 });
 expect(intersects(rect, { left: 50, top: 50, right: 120, bottom: 120 })).toBe(true);
 expect(intersects(rect, { left: 100, top: 50, right: 120, bottom: 120 })).toBe(false);
});
test('marquee never takes text selection or control drags', () => {
 for (const tag of ['aa-editor', 'ds-card', 'ds-button', 'input']) {
  const el = document.createElement(tag); const child = document.createElement('span'); el.append(child);
  expect(canStartMarquee(child)).toBe(false);
 }
 expect(canStartMarquee(document.createElement('section'))).toBe(true);
});
