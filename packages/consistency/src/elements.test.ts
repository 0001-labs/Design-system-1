// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { contentElementAtoms, readContentElement, writeContentElement, type ContentElement } from './elements';
afterEach(() => document.body.replaceChildren());
it('round-trips component Markdown with quotes, newlines and closing fences', () => {
  const values: ContentElement[] = [{ kind: 'button', label: '<img onerror=x> ``` "\nButton', secondary: true }, { kind: 'card', label: 'Label', title: 'Title', body: 'Words\nwith ``` and "quotes"' }];
  for (const value of values) expect(readContentElement(writeContentElement(value))).toEqual(value);
  expect(readContentElement('```c9y-card\n{"label":"x","title":3}\n```')).toBeNull();
});
it('offers slash insertions with real DS1 faces and read-only permissions', () => {
  for (const atom of contentElementAtoms(() => false)) {
    expect(atom.insert?.label).toMatch(/Button|Card/);
    expect(readContentElement(atom.insert!.source)?.kind).toBe(atom.fence!.slice(4));
    const host = document.createElement('span'); document.body.append(host);
    atom.draw!(host, atom.insert!.source);
    const face = host.querySelector(atom.fence === 'c9y-button' ? 'ds-button' : 'ds-card');
    expect(face).not.toBeNull(); expect(face!.inert).toBe(true);
    host.click(); expect(document.querySelector('ds-overlay')).toBeNull(); expect(host.tabIndex).toBe(-1);
  }
});
it('requests deletion through Aa atom-source for standard history', () => {
  const atom = contentElementAtoms(() => true)[0], host = document.createElement('span'); document.body.append(host);
  const cleanup = atom.draw!(host, atom.insert!.source), change = vi.fn(); host.addEventListener('aa-atom-source', change);
  host.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }));
  expect(change.mock.calls[0][0].detail).toEqual({ source: '' }); cleanup?.();
});

it('saves settings as one source request and escapes unsafe text in the DS1 face', async () => {
  const atom = contentElementAtoms(() => true)[1], host = document.createElement('span'); document.body.append(host);
  const cleanup = atom.draw!(host, atom.insert!.source), change = vi.fn(); host.addEventListener('aa-atom-source', change);
  host.click();
  const panel = document.querySelector('ds-overlay')!;
  const fields = panel.querySelectorAll('ds-input');
  fields[0].value = 'New label'; fields[1].value = '<script>bad()</script>'; fields[2].value = 'New body';
  const apply = Array.from(panel.querySelectorAll('ds-button')).find(button => button.textContent === 'Apply')!;
  apply.click();
  expect(change).toHaveBeenCalledTimes(1);
  expect(readContentElement(change.mock.calls[0][0].detail.source)).toEqual({ kind: 'card', label: 'New label', title: '<script>bad()</script>', body: 'New body' });
  expect(host.querySelector('script')).toBeNull(); cleanup?.();
});

it.each(['button', 'card'])('inserts /%s through Aa slash menu and undoes through its standard history', async kind => {
  const { createEditor } = await import('../../../website/src/vendor/aa/aa');
  const host = document.createElement('div'); document.body.append(host);
  const editor = createEditor(host, { value: '/' + kind, atoms: contentElementAtoms(() => true) });
  editor.focus(); editor.selectRange(kind.length + 1);
  host.dispatchEvent(new Event('aa-change'));
  document.dispatchEvent(new Event('selectionchange'));
  await new Promise(resolve => setTimeout(resolve, 0));
  const choice = Array.from(document.querySelectorAll<HTMLButtonElement>('.aa-menu button')).find(button => button.textContent?.includes(kind === 'button' ? 'Button' : 'Card'));
  expect(choice).toBeDefined(); choice!.click();
  expect(editor.value).toContain('```c9y-' + kind); expect(host.querySelector('ds-' + kind)).not.toBeNull();
  editor.undo(); expect(editor.value).toBe('/' + kind); editor.destroy();
});

it('previews the selected library with real components and follows library changes', async () => {
  const owner = document.createElement('section'); owner.dataset.consistencyLibrary = 'blue';
  const host = document.createElement('div'), preview = document.createElement('div'); owner.append(host); document.body.append(owner, preview);
  const atom = contentElementAtoms(() => true, () => host)[0];
  const cleanup = atom.insert!.preview!(preview, { input: 'keyboard' });
  expect(preview.querySelector('ds-button[primary]')).not.toBeNull();
  expect(preview.dataset.consistencyLibrary).toBe('blue');
  await preview.querySelector('ds-icon')!.updateComplete; expect(preview.querySelector('ds-icon[type="cursor"]')).not.toBeNull();
  owner.dataset.consistencyLibrary = 'ink'; await new Promise(resolve => setTimeout(resolve, 0));
  expect(preview.dataset.consistencyLibrary).toBe('ink'); expect(preview.style.colorScheme).toBe('dark');
  cleanup?.(); expect(preview.children).toHaveLength(0);
});
