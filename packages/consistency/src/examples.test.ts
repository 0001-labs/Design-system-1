// @vitest-environment happy-dom
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, it } from 'vite-plus/test';
import { EXAMPLE_PAGES, exampleComposition } from './examples';
import { initialComposition } from './model';
import { parseBlocks } from '../../../website/src/vendor/aa/aa';
it('offers the studio and ten DS1 pages as editable compositions', () => {
 expect(EXAMPLE_PAGES.map(page => page.id)).toEqual(['studio', 'shop', 'product', 'planner', 'finance', 'travel', 'booking', 'cafe', 'magazine', 'bike', 'financial']);
 expect(exampleComposition('studio')).toEqual(initialComposition);
 for (const page of EXAMPLE_PAGES.slice(1)) {
  expect(existsSync(resolve(page.sourcePath))).toBe(true);
  if (page.id !== 'financial') expect(readFileSync(resolve(page.sourcePath), 'utf8')).toContain(`${page.id}:`);
  expect(page.sourceUrl).toBe(`https://designsystem1.com/examples/layouts/${page.id}/`);
  expect(page.composition.order[0]).toBe('intro');
  expect(parseBlocks(page.composition.text).length).toBeGreaterThan(1);
  for (const id of page.composition.order.slice(1)) expect(page.composition.sections[id]).toBeTruthy();
  const all = page.composition.text + Object.values(page.composition.sections).join('\n');
  expect(all).not.toMatch(/<script|iframe|data-add=|fetch\(/);
  expect(all).toContain('```c9y-button');
  for (const match of all.matchAll(/https:\/\/designsystem1.com\/examples\/images\/([^\s"()]+)/g)) expect(existsSync(resolve('website/public/examples/images', match[1]))).toBe(true);
 }
});
it('keeps sourced headings in the DS1 example source and independent mutable drafts', () => {
 const source = readFileSync(resolve('website/src/lib/product-examples.ts'), 'utf8');
 for (const heading of ['A room is never really finished.', 'A good week starts here.', 'Nothing between you and the next track.', 'A little closer to the mountains.']) expect(source).toContain(heading);
 for (const [id, heading] of [['travel', 'Slow mornings by still water.'], ['booking', 'Get more from every work trip'], ['cafe', 'Something warm, something sweet.'], ['magazine', 'Getting there is the point.'], ['bike', 'Hills, flattened.']]) {
  const page = EXAMPLE_PAGES.find(page => page.id === id)!;
  expect(readFileSync(resolve(page.sourcePath), 'utf8')).toContain(heading);
  expect(page.composition.text + Object.values(page.composition.sections).join('\n')).toContain(heading);
 }
 const first = exampleComposition('shop'), second = exampleComposition('shop');
 first.sections.collection = 'Changed'; first.order.pop(); first.gaps.example = 100;
 expect(second.sections.collection).toContain('The everyday collection'); expect(second.order).toHaveLength(3); expect(second.gaps.example).toBeUndefined();
 expect(exampleComposition('unknown')).toEqual(initialComposition);
});
