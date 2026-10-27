// @vitest-environment happy-dom
import { expect, test } from 'vite-plus/test';
import { canStartMarquee, selectionRect, intersects, paintCompositionSelection } from './marquee';
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

test('a selected element is one face unless it holds selectable units', () => {
 const root = document.createElement('div');
 // A template's words: a selectable heading whose plain editor block is its own text, and a button alike.
 root.innerHTML = '<section data-selectable="section"><h2 data-selectable="heading"><span class="aa aa-plain"><div class="aa-block">Café</div></span></h2><p data-selectable="paragraph"><span class="aa aa-plain"><div class="aa-block">Open daily</div></span></p><ds-button data-selectable="button"><span class="aa aa-plain"><div class="aa-block">Book</div></span></ds-button></section>'
  + '<div data-selectable="group-intro"><aa-editor><div class="aa-block" data-selectable="text:intro:0">A paragraph</div><div class="aa-block" data-selectable="text:intro:1"><br></div><div class="aa-block"><div class="aa-columns"><div class="aa-column"><div class="aa-block">Left</div></div></div></div></aa-editor></div>'
  + '<div data-selectable="region"><aa-editor><div class="aa-block">Native words</div><div class="aa-block">More</div></aa-editor></div>';
 const faces = () => [...root.querySelectorAll('[data-selection-face]')].map(e => e.dataset.selectable ?? e.textContent?.trim());
 paintCompositionSelection(root, new Set(['heading']));
 expect(faces()).toEqual(['heading']);
 expect(root.querySelector('[data-selectable="heading"]')!.hasAttribute('data-selected')).toBe(true);
 paintCompositionSelection(root, new Set(['button']));
 expect(faces()).toEqual(['button']);
 // A section holds selectable units: they are painted, never the section itself or the space between them.
 paintCompositionSelection(root, new Set(['section']));
 expect(faces()).toEqual(['heading', 'paragraph', 'button']);
 // The lab's group holds an Aa editor: its blocks with words are the faces, not the group, empty lines or a block of columns.
 paintCompositionSelection(root, new Set(['group-intro']));
 expect(faces()).toEqual(['text:intro:0', 'Left']);
 // An element holding an Aa editor whose blocks are not selectable still paints the blocks.
 paintCompositionSelection(root, new Set(['region']));
 expect(faces()).toEqual(['Native words', 'More']);
 paintCompositionSelection(root, new Set());
 expect(faces()).toEqual([]);
 expect(root.querySelectorAll('[data-selected],[data-composition-selected]').length).toBe(0);
});
