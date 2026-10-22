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

it('edits the rendered card fields directly and commits safely through Aa', () => {
  const atom = contentElementAtoms(() => true)[1], host = document.createElement('span'); document.body.append(host);
  const cleanup = atom.draw!(host, atom.insert!.source), change = vi.fn(); host.addEventListener('aa-atom-source', change);
  expect(host.querySelector('ds-input')).toBeNull();
  const title = host.querySelector<HTMLElement>('[slot="title"] .aa-block')!;
  title.textContent = '<script>bad()</script>';
  title.dispatchEvent(new Event('input', { bubbles: true }));
  title.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
  expect(change).toHaveBeenCalledTimes(1);
  expect(readContentElement(change.mock.calls[0][0].detail.source)).toMatchObject({ title: '<script>bad()</script>' });
  expect(host.querySelector('script')).toBeNull(); cleanup?.();
});

it('changes card appearance from its context menu without a second text editor', () => {
  const atom = contentElementAtoms(() => true)[1], host = document.createElement('span'); document.body.append(host);
  const cleanup = atom.draw!(host, atom.insert!.source), change = vi.fn(); host.addEventListener('aa-atom-source', change);
  host.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
  const menu = document.querySelector('ds-context')!;
  expect(menu.querySelector('ds-input, input, textarea, [contenteditable]')).toBeNull();
  Array.from(menu.querySelectorAll('button')).find(button => button.textContent === 'Sharp blue')!.click();
  expect(readContentElement(change.mock.calls.at(-1)![0].detail.source)).toMatchObject({ tone: 'sharp-blue', variant: 'filled' });
  cleanup?.();
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

it('keeps button destinations in source and rejects unsafe destinations', () => {
  for (const action of [{ kind: 'link' as const, target: 'https://example.com' }, { kind: 'page' as const, target: '/about' }]) {
    const value: ContentElement = { kind: 'button', label: 'Read more', secondary: false, action };
    expect(readContentElement(writeContentElement(value))).toEqual(value);
  }
  const unsafe = readContentElement('```c9y-button\n{"label":"Go","secondary":false,"action":{"kind":"link","target":"javascript:alert(1)"}}\n```');
  expect(unsafe).toEqual({ kind: 'button', label: 'Go', secondary: false });
});
