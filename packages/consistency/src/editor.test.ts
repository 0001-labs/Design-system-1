// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from 'vite-plus/test';
vi.hoisted(() => { globalThis.fetch = async () => new Response('{}'); });
import { ConsistencyEditor } from './index';
afterEach(() => document.body.replaceChildren());
const pointer = (target: EventTarget, type: string, y = 0) => target.dispatchEvent(new PointerEvent(type, { pointerId: 1, isPrimary: true, button: 0, clientY: y, bubbles: true }));
test('ghost gap previews, cancels, commits once, then undoes', async () => {
  const editor = new ConsistencyEditor(); document.body.append(editor); await editor.updateComplete;
  const handle = editor.querySelector('[data-handle="gap"]')!;
  pointer(handle, 'pointerdown'); pointer(window, 'pointermove', 25);
  expect(editor.preview['intro-actions']).toBe(90); expect(editor.history.value.gaps['intro-actions']).toBe(40);
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  expect(editor.preview).toEqual({}); expect(editor.history.canUndo).toBe(false);
  pointer(handle, 'pointerdown'); pointer(window, 'pointermove', 25); pointer(window, 'pointerup', 25);
  expect(editor.history.value.gaps['intro-actions']).toBe(100);
  editor.history.undo(); expect(editor.history.value.gaps['intro-actions']).toBe(40);
});
test('ghost width supports keyboard commit and constraints', async () => {
  const editor = new ConsistencyEditor(); document.body.append(editor); await editor.updateComplete;
  const handle = editor.querySelector('[data-handle="width"]')!;
  handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
  expect(editor.preview.width).toBe(660); expect(editor.history.value.width).toBe(640);
  handle.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight' }));
  expect(editor.history.value.width).toBe(660);
});

test('Aa enables normal editing and AI while measurements stay passive', async () => {
 const editor = new ConsistencyEditor(); document.body.append(editor); await editor.updateComplete;
 expect((editor.querySelector('aa-editor') as any).options).toMatchObject({ prompt: expect.any(Function), correcting: false });
 expect(editor.querySelectorAll('.ghost-measure button').length).toBe(0);
 expect(editor.querySelectorAll('[role="slider"][tabindex="0"]').length).toBeGreaterThan(3);
});

test('lower editorial groups edit and undo through the same document history', async () => {
 const editor = new ConsistencyEditor(); document.body.append(editor); await editor.updateComplete;
 const lower = editor.querySelector('[aria-label="Contact section text"]') as any;
 expect(lower).not.toBeNull(); expect(lower.options.prompt).toEqual(expect.any(Function));
 lower.value = 'A new invitation'; lower.dispatchEvent(new Event('input', { bubbles: true }));
 expect(editor.history.value.sections.contact).toBe('A new invitation');
 editor.history.undo(); expect(editor.history.value.sections.contact).toContain('Have something in mind');
});

test('spacer midpoint follows pointer movement and compensates for device scale', async () => {
 const editor = new ConsistencyEditor(); editor.style.setProperty('--sf', '2'); document.body.append(editor); await editor.updateComplete;
 const gap = editor.querySelector('[data-handle="gap"]')!;
 pointer(gap, 'pointerdown'); pointer(window, 'pointermove', 25);
 expect(editor.preview['intro-actions']).toBe(65);
 pointer(window, 'pointercancel'); expect(editor.history.value.gaps['intro-actions']).toBe(40);
});
test('spacing edits are independent and disabled layers cannot react', async () => {
 const editor = new ConsistencyEditor(); document.body.append(editor); await editor.updateComplete;
 const first = editor.querySelector('[data-gap="intro-actions"]')!;
 first.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' })); first.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp' }));
 expect(editor.history.value.gaps['intro-actions']).toBe(60); expect(editor.history.value.gaps['work-cards']).toBe(40);
 (editor.querySelector('[role="switch"][aria-label="Spacing"]') as HTMLElement).click(); await editor.updateComplete;
 expect(first.hasAttribute('hidden')).toBe(true);
 first.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' })); first.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp' }));
 expect(editor.history.value.gaps['intro-actions']).toBe(60);
 expect(editor.layers.boundaries).toBe(true);
});
test('marquee selects intersecting content, Escape clears, toggle disables it', async () => {
 const editor = new ConsistencyEditor(); document.body.append(editor); await editor.updateComplete;
 const item = editor.querySelector('[data-selectable="bookshop"]') as HTMLElement;
 item.getBoundingClientRect = () => ({ left: 10, top: 10, right: 80, bottom: 80 }) as DOMRect;
 const stage = editor.querySelector('.consistency-stage')!;
 pointer(stage, 'pointerdown');
 window.dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, clientX: 90, clientY: 90 }));
 expect(editor.selection.has('bookshop')).toBe(true);
 pointer(window, 'pointerup', 90);
 window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); expect(editor.selection.size).toBe(0);
 (editor.querySelector('[role="switch"][aria-label="Marquee"]') as HTMLElement).click(); await editor.updateComplete;
 pointer(stage, 'pointerdown'); window.dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, clientX: 90, clientY: 90 }));
 expect(editor.selection.size).toBe(0);
});
test('reorder starts on, can be disabled, commits one order change and preserves text, gaps and selection on undo', async () => {
 const editor = new ConsistencyEditor(); document.body.append(editor); await editor.updateComplete;
 const first = editor.querySelector('[data-sort-group="intro"]') as HTMLElement;
 expect(first.tabIndex).toBe(0);
 (editor.querySelector('[role="switch"][aria-label="Reorder"]') as HTMLElement).click(); await editor.updateComplete;
 expect(first.tabIndex).toBe(-1);
 (editor.querySelector('[role="switch"][aria-label="Reorder"]') as HTMLElement).click(); await editor.updateComplete;
 expect(first.tabIndex).toBe(0);
 editor.selection = new Set(['group-intro']); await editor.updateComplete;
 const down = Array.from(editor.querySelectorAll('ds-button')).find(button => button.textContent === 'Move down') as HTMLElement;
 down.click(); await editor.updateComplete;
 expect(editor.history.value.order).toEqual(['work', 'intro', 'approach', 'contact']);
 expect(Array.from(editor.querySelectorAll<HTMLElement>('[data-sort-group]')).map(el => el.dataset.sortGroup)).toEqual(editor.history.value.order);
 expect(editor.history.value.text).toContain('A place'); expect(editor.history.value.gaps['work-cards']).toBe(40);
 expect(editor.selection.has('group-intro')).toBe(true);
 editor.history.undo(); editor.revision++; await editor.updateComplete;
 expect(editor.history.value.order[0]).toBe('intro'); expect(editor.history.canUndo).toBe(false);
});
test('repeated layer toggles keep one keyboard commit per input and cancel an active preview', async () => {
 const editor = new ConsistencyEditor(); document.body.append(editor); await editor.updateComplete;
 const toggle = editor.querySelector('[role="switch"][aria-label="Spacing"]') as HTMLElement;
 for (let index = 0; index < 4; index++) { toggle.click(); await editor.updateComplete; }
 const handle = editor.querySelector('[data-gap="intro-actions"]')!;
 handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' })); handle.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp' }));
 expect(editor.history.value.gaps['intro-actions']).toBe(60);
 editor.history.undo(); expect(editor.history.canUndo).toBe(false);
 pointer(handle, 'pointerdown'); pointer(window, 'pointermove', 25);
 toggle.click(); await editor.updateComplete;
 expect(editor.preview).toEqual({}); pointer(window, 'pointerup', 25);
 expect(editor.history.value.gaps['intro-actions']).toBe(40);
});
test('shared Drag keyboard cancellation never changes the composition', async () => {
 const editor = new ConsistencyEditor(); document.body.append(editor); await editor.updateComplete;
 (editor.querySelector('[role="switch"][aria-label="Reorder"]') as HTMLElement).click(); await editor.updateComplete;
 const groups = Array.from(editor.querySelectorAll<HTMLElement>('[data-sort-group]'));
 groups.forEach((group, index) => { group.getBoundingClientRect = () => ({ left: 20, top: 20 + index * 480, right: 660, bottom: 460 + index * 480, width: 640, height: 440, x: 20, y: 20 + index * 480, toJSON() {} }); });
 groups[0].dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
 window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
 window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
 await new Promise(resolve => setTimeout(resolve, 260));
 expect(editor.history.value.order).toEqual(['intro', 'work', 'approach', 'contact']);
 expect(editor.history.canUndo).toBe(false);
});

test('rich Aa options are stable per editor with isolated local comments and no automatic correction', async () => {
 const editor = new ConsistencyEditor(); document.body.append(editor); await editor.updateComplete;
 const editors = Array.from(editor.querySelectorAll<any>('aa-editor'));
 expect(editors).toHaveLength(4);
 const options = editors.map(element => element.options);
 expect(new Set(options.map(option => option.comments)).size).toBe(4);
 for (const element of editors) { expect(element.hasAttribute('toolbar')).toBe(true); expect(element.options.correcting).toBe(false); expect(element.options.onFiles).toEqual(expect.any(Function)); expect(element.options.drawEquation).toEqual(expect.any(Function)); }
 editor.revision++; await editor.updateComplete;
 editors.forEach((element, index) => expect(element.options).toBe(options[index]));
});
test('Production defaults on, toggles gap-label policy and keeps active drags identifiable outside their surface', async () => {
 const editor = new ConsistencyEditor(); document.body.append(editor); await editor.updateComplete;
 const production = editor.querySelector('[role="switch"][aria-label="Production"]') as HTMLElement;
 expect(production.getAttribute('aria-checked')).toBe('true');
 expect(editor.querySelector('.consistency-shell')?.classList.contains('production-on')).toBe(true);
 const gap = editor.querySelector('[data-gap="intro-actions"]') as HTMLElement;
 pointer(gap, 'pointerdown'); pointer(window, 'pointermove', 25);
 expect(gap.hasAttribute('data-spacing-active')).toBe(true);
 pointer(window, 'pointerup', 25); expect(gap.hasAttribute('data-spacing-active')).toBe(false);
 production.click(); await editor.updateComplete;
 expect(editor.layers.production).toBe(false); expect(editor.layers.spacing).toBe(true); expect(editor.layers.boundaries).toBe(true);
 expect(editor.querySelector('.consistency-shell')?.classList.contains('production-on')).toBe(false);
});
test('Reorder and Place independently control every Aa instance without disabling normal editing', async () => {
 const editor = new ConsistencyEditor(); document.body.append(editor); await editor.updateComplete;
 const editors = Array.from(editor.querySelectorAll<any>('aa-editor'));
 for (const text of editors) { expect(text.options.reordering).toBe(true); expect(text.options.placing).toBe(true); expect(text.editor.reordering).toBe(true); expect(text.editor.placing).toBe(true); }
 (editor.querySelector('[role="switch"][aria-label="Reorder"]') as HTMLElement).click(); await editor.updateComplete;
 for (const text of editors) { expect(text.editor.reordering).toBe(false); expect(text.editor.placing).toBe(true); expect(text.options.menus).toBe(true); expect(text.editor.readOnly).toBe(false); }
 (editor.querySelector('[role="switch"][aria-label="Place"]') as HTMLElement).click(); await editor.updateComplete;
 for (const text of editors) expect(text.editor.placing).toBe(false);
 (editor.querySelector('[role="switch"][aria-label="Reorder"]') as HTMLElement).click(); await editor.updateComplete;
 for (const text of editors) { expect(text.editor.reordering).toBe(true); expect(text.editor.placing).toBe(false); }
});
test('library preset selector applies shared DS1 component roles only to the composition', async () => {
 const editor = new ConsistencyEditor(); document.body.append(editor); await editor.updateComplete;
 const select = editor.querySelector('[aria-label="Library preset"]') as HTMLSelectElement;
 expect(Array.from(select.options, option => option.value)).toEqual(['original', 'blue', 'ink', 'soft', 'bold', 'editorial']); expect(editor.library).toBe('original');
 select.value = 'blue'; select.dispatchEvent(new Event('change', { bubbles: true })); await editor.updateComplete;
 const sheet = editor.querySelector('.consistency-sheet') as HTMLElement;
 expect(sheet.dataset.consistencyLibrary).toBe('blue'); expect(sheet.style.getPropertyValue('--ds-button-background-color-primary')).toBe('var(--ds-sharp-blue)');
 expect((editor.querySelector('.consistency-inspector') as HTMLElement).style.getPropertyValue('--ds-button-background-color-primary')).toBe('');
 select.value = 'original'; select.dispatchEvent(new Event('change', { bubbles: true })); await editor.updateComplete;
 expect(sheet.style.getPropertyValue('--ds-button-background-color-primary')).toBe('');
});
