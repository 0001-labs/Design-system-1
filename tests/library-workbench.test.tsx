// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vite-plus/test';
import { RouterProvider } from '../app/src/router';
import { SystemWorkbench } from '../app/src/SystemWorkbench';
import { LAYERS } from '../shared/component-directory';
it('uses the public catalogue and examples, preserving saved CSS until an edit', async () => {
  const container = document.createElement('div'); document.body.append(container);
  const root = createRoot(container); const dirty = vi.fn();
  // The open component is the address's ?component=, read through the app's router, as in the app.
  window.history.replaceState({}, '', '/app/');
  act(() => root.render(<RouterProvider><SystemWorkbench initialCss=":root { --brand: pink; }" initialConfig={{ schema: 1, custom: 'preserved' }} onDirty={dirty} /></RouterProvider>));
  // The catalogue is Design system 1's sidebar: a group row per layer, a row per component.
  const sidebar = container.querySelector('ds-sidebar')!;
  await sidebar.updateComplete;
  const entries = LAYERS.flatMap(layer => layer.entries);
  expect(sidebar.items.filter(item => item.depth === 1)).toHaveLength(entries.length);
  expect(sidebar.items.filter(item => item.depth === 0)).toHaveLength(LAYERS.length);
  expect(container.querySelector('iframe')?.getAttribute('src')).toBe('/examples/button/');
  expect(dirty).not.toHaveBeenCalled();
  expect(container.querySelector<HTMLTextAreaElement>('[data-testid="live-css-source"]')?.value).toContain('--brand: pink');
  const avatar = [...sidebar.shadowRoot!.querySelectorAll<HTMLButtonElement>('button[data-item]')].find(button => button.textContent?.startsWith('Avatar'))!;
  act(() => { avatar.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true })); });
  expect(container.querySelector('iframe')?.getAttribute('src')).toBe('/examples/avatar/');
  expect(new URLSearchParams(window.location.search).get('component')).toBe('/2-core/avatar/');
  act(() => root.unmount()); container.remove();
});
