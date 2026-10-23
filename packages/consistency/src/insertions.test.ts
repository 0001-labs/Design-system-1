// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vite-plus/test';
vi.hoisted(() => { globalThis.fetch = async () => new Response('{}'); });
import { createEditor } from '../../../website/src/vendor/aa/aa';
import { PAGE_INSERTIONS } from '../../../shared/consistency-insertions';
import { pageAtoms, pageCommands } from './insertions';
import { contentElementAtoms } from './elements';
afterEach(() => document.body.replaceChildren());
it('keeps the approved additions as page content only', () => {
 expect(PAGE_INSERTIONS.map(entry => entry.label)).toEqual(['List', 'Tabs', 'Table', 'Carousel', 'Image', 'Link', 'Icon']);
});
it.each(PAGE_INSERTIONS)('inserts $label through the existing picker and retains Aa undo', async entry => {
 const host = document.createElement('div'); document.body.append(host);
 const editor = createEditor(host, { value: '/'+entry.label, atoms: [...pageAtoms(() => true), ...contentElementAtoms(() => true)], commands: pageCommands, blockCommands: pageCommands });
 editor.focus(); editor.selectRange(editor.value.length); host.dispatchEvent(new Event('aa-change')); document.dispatchEvent(new Event('selectionchange')); await new Promise(resolve => setTimeout(resolve, 0));
 const choice = Array.from(document.querySelectorAll<HTMLButtonElement>('.aa-menu button')).find(button => button.getAttribute('aria-label') === entry.label);
 expect(choice, entry.id).toBeDefined(); choice!.click(); expect(editor.value).toBe(entry.source);
 expect(host.querySelector('ds-overlay,dialog')).toBeNull(); expect(host.textContent).not.toMatch(/Edit (list|tabs|table|carousel|image|link|icon)/i);
 editor.undo(); expect(editor.value).toBe('/'+entry.label); editor.destroy();
});
it('changes an icon in place and rejects unknown names', () => {
 const host = document.createElement('span'); document.body.append(host); const atom = pageAtoms(() => true)[1]!;
 const cleanup = atom.draw!(host, ':icon[star]'), changed = vi.fn(); host.addEventListener('aa-atom-source', changed);
 host.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
 const input = host.querySelector('input')!; expect(input).not.toBeNull(); expect(document.querySelector('dialog, ds-overlay, button')).toBeNull();
 input.value = 'not-an-existing-icon'; input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); expect(changed).not.toHaveBeenCalled(); expect(input.getAttribute('aria-invalid')).toBe('true');
 input.value = 'check'; input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); expect(changed.mock.calls[0][0].detail.source).toBe(':icon[check]'); cleanup?.();
});
it('keeps read-only icons and image placeholders inert to edits', () => {
 for (const atom of pageAtoms(() => false)) {
  const host = document.createElement('span'); document.body.append(host); const cleanup = atom.draw!(host, atom.insert!.source);
  host.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' })); host.dispatchEvent(new MouseEvent('dblclick'));
  expect(host.querySelector('input:not([type=file])')).toBeNull(); expect(host.tabIndex).toBe(-1); cleanup?.();
 }
});
