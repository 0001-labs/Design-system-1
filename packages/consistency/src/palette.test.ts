// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vite-plus/test';
vi.hoisted(() => { globalThis.fetch = async () => new Response('{}'); });
import { COMPONENT_PALETTE, paletteInsertion, defaultPaletteContent, readPaletteContent, writePaletteContent } from '../../../shared/consistency-palette';
import { paletteAtoms } from './palette';
import { GridLineChart } from '../../../DS1/2-core/ds-chart';
// Canvas is exercised by the real-browser palette contract; Happy DOM has no 2D context.
vi.spyOn(GridLineChart.prototype as unknown as { initialize(): void }, 'initialize').mockImplementation(() => {});
import { createPreviewEditorOptions } from './aa';
import { createEditor } from '../../../website/src/vendor/aa/aa';
afterEach(() => document.body.replaceChildren());
const atoms = paletteAtoms(() => true, () => null);
it('makes every public visual component available to both existing context and slash pickers', () => {
  const options = createPreviewEditorOptions(() => null, () => {});
  for (const entry of COMPONENT_PALETTE) {
    const matches = options.atoms!.filter(atom => atom.insert?.label === entry.label);
    expect(matches, entry.id).toHaveLength(1);
    expect(matches[0]!.insert!.source).toBe(paletteInsertion(entry));
  }
  expect(COMPONENT_PALETTE).toHaveLength(42);
  expect(COMPONENT_PALETTE.some(entry => ['loading', 'spacing-handle', 'kbd'].includes(entry.id))).toBe(false);
});
it.each(COMPONENT_PALETTE.filter(entry => !['button', 'card', 'carousel'].includes(entry.id)))('draws and round-trips $name, retaining standard Aa insertion and undo', async entry => {
  const source = paletteInsertion(entry), host = document.createElement('div'); document.body.append(host);
  const editor = createEditor(host, { value: '/'+entry.label, atoms });
  editor.focus(); editor.selectRange(editor.value.length); host.dispatchEvent(new Event('aa-change')); document.dispatchEvent(new Event('selectionchange'));
  await new Promise(resolve => setTimeout(resolve, 0));
  const choice = Array.from(document.querySelectorAll<HTMLButtonElement>('.aa-menu button')).find(button => button.dataset.command === `insert-consistency-${entry.id}`);
  expect(choice, entry.id).toBeDefined(); choice!.click();
  expect(editor.value).toContain(source);
  expect(host.querySelector('.consistency-palette-face > '+entry.tag), entry.id).not.toBeNull();
  expect(readPaletteContent(source)).toEqual(defaultPaletteContent(entry));
  editor.undo(); expect(editor.value).toBe('/'+entry.label); editor.redo(); expect(editor.value).toContain(source);
  editor.destroy();
});
it('edits content as data, commits one Aa change, and rejects invalid values', async () => {
  const entry = COMPONENT_PALETTE.find(entry => entry.id === 'link')!, atom = atoms.find(atom => atom.name === 'consistency-link')!;
  const host = document.createElement('span'); document.body.append(host); const cleanup = atom.draw!(host, paletteInsertion(entry));
  const changed = vi.fn(); host.addEventListener('aa-atom-source', changed);
  host.querySelector<HTMLElement>('.consistency-palette-edit')!.click();
  const overlay = document.querySelector('ds-overlay')!;
  const label = overlay.querySelector<HTMLElementTagNameMap['ds-input']>('ds-input[aria-label="Label"]')!;
  const destination = overlay.querySelector<HTMLElementTagNameMap['ds-input']>('ds-input[aria-label="Destination"]')!;
  const save = Array.from(overlay.querySelectorAll('ds-button')).find(button => button.textContent === 'Save')!;
  label.value = '<script>bad()</script> ```'; destination.value = 'javascript:alert(1)'; save.click(); expect(changed).not.toHaveBeenCalled();
  destination.value = '/about'; save.click(); expect(changed).toHaveBeenCalledTimes(1);
  expect(readPaletteContent(changed.mock.calls[0][0].detail.source)?.values).toEqual({ label: '<script>bad()</script> ```', href: '/about' });
  expect(document.querySelector('script')).toBeNull(); cleanup?.();
});
it('does not execute authored markup, properties, tags or destinations', () => {
  const entry = COMPONENT_PALETTE.find(entry => entry.id === 'tag')!;
  const value = { ...defaultPaletteContent(entry), values: { label: '<img onerror=alert(1)>' } };
  const atom = atoms.find(atom => atom.name === 'consistency-tag')!, host = document.createElement('span'); document.body.append(host);
  const cleanup = atom.draw!(host, writePaletteContent(value)); expect(host.querySelector('img')).toBeNull(); expect(host.textContent).toContain('<img'); cleanup?.();
  expect(readPaletteContent(writePaletteContent({ ...value, component: 'script' }))).toBeNull();
  expect(readPaletteContent(writePaletteContent({ ...value, values: { ...value.values, onclick: 'bad()' } }))).toBeNull();
});
it('honours read-only mode for keyboard edits, deletion and context actions', () => {
  const entry = COMPONENT_PALETTE.find(entry => entry.id === 'message')!, host = document.createElement('span'); document.body.append(host);
  const atom = paletteAtoms(() => false, () => null).find(atom => atom.name === 'consistency-message')!;
  const cleanup = atom.draw!(host, paletteInsertion(entry)), change = vi.fn(); host.addEventListener('aa-atom-source', change);
  host.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' })); host.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete' })); host.dispatchEvent(new MouseEvent('contextmenu'));
  expect(change).not.toHaveBeenCalled(); expect(document.querySelector('ds-overlay')).toBeNull(); expect(document.querySelector('ds-context')).toBeNull(); expect(host.tabIndex).toBe(-1); cleanup?.();
});
