// @vitest-environment happy-dom
import { expect, it } from 'vite-plus/test';
import { EXAMPLE_PAGES, exampleComposition } from './examples';
import { initialComposition } from './model';
it('offers the editor, Studio and every canonical DS1 page as independent authored compositions', () => {
 expect(EXAMPLE_PAGES.slice(0, 2).map(page => page.id)).toEqual(['editor', 'studio']);
 expect(EXAMPLE_PAGES).toHaveLength(32);
 expect(exampleComposition('studio')).toEqual(initialComposition);
 for (const page of EXAMPLE_PAGES.slice(2)) {
  expect(page.composition.sections.__authored).toBe('1');
  expect(page.composition.order).toEqual(['intro']);
  expect(page.composition.text).toBe('');
 }
});
it('keeps independent mutable drafts and the existing introduction fallback', () => {
 const first = exampleComposition('shop'), second = exampleComposition('shop');
 first.sections.changed = 'Changed'; first.order.pop(); first.gaps.example = 100;
 expect(second.sections.changed).toBeUndefined(); expect(second.order).toEqual(['intro']); expect(second.gaps.example).toBeUndefined();
 expect(exampleComposition('unknown')).toEqual(exampleComposition('editor'));
});
