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
 for (const tag of ['aa-editor', 'ds-card', 'ds-button', 'input', 'summary']) {
  const el = document.createElement(tag); const child = document.createElement('span'); el.append(child);
  expect(canStartMarquee(child)).toBe(false);
 }
 expect(canStartMarquee(document.createElement('section'))).toBe(true);
});
test('marquee chooses actual content rather than empty Aa lines or spacing chrome', async () => {
 const { isMarqueeContent } = await import('./marquee');
 const block = document.createElement('div');block.className='aa-block';block.innerHTML='<br>';
 expect(isMarqueeContent(block)).toBe(false);block.textContent='A real paragraph';expect(isMarqueeContent(block)).toBe(true);
 const gap=document.createElement('div');gap.className='consistency-gap';gap.append(block);expect(isMarqueeContent(block)).toBe(false);
 block.remove();block.textContent='';block.innerHTML='<span class="aa-atom"></span>';expect(isMarqueeContent(block)).toBe(true);
});

test('explicit component tools win over background selection and reordering', () => {
 for (const attribute of ['data-aa-interactive', 'data-handle']) {
  const tool=document.createElement('span');tool.setAttribute(attribute,'');expect(canStartMarquee(tool)).toBe(false);
 }
 for (const role of ['slider','button','menu','toolbar']) {
  const tool=document.createElement('div');tool.setAttribute('role',role);const child=document.createElement('span');tool.append(child);expect(canStartMarquee(child)).toBe(false);
 }
 const edge=document.createElement('span');edge.className='consistency-resize-edge';expect(canStartMarquee(edge)).toBe(false);
});
