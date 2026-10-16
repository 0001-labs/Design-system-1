// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vite-plus/test';
import { SystemWorkbench } from '../app/src/SystemWorkbench';
import { LAYERS } from '../shared/component-directory';
it('uses the public catalogue and examples, preserving saved CSS until an edit', () => {
  const container = document.createElement('div'); document.body.append(container);
  const root = createRoot(container); const dirty = vi.fn();
  act(() => root.render(<SystemWorkbench initialCss=":root { --brand: pink; }" initialConfig={{ schema: 1, custom: 'preserved' }} onDirty={dirty} />));
  const buttons = [...container.querySelectorAll('nav button')];
  expect(buttons).toHaveLength(LAYERS.flatMap(layer => layer.entries).length);
  expect(container.querySelector('iframe')?.getAttribute('src')).toBe('/examples/button/');
  expect(dirty).not.toHaveBeenCalled();
  expect(container.querySelector<HTMLTextAreaElement>('[data-testid="live-css-source"]')?.value).toContain('--brand: pink');
  const avatar = buttons.find(button => button.textContent?.startsWith('Avatar'))!;
  act(() => avatar.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  expect(container.querySelector('iframe')?.getAttribute('src')).toBe('/examples/avatar/');
  act(() => root.unmount()); container.remove();
});
