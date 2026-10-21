// @vitest-environment happy-dom
import { expect, it, vi } from 'vite-plus/test';
import '../app/src/SystemWorkbench';
import type { SystemWorkbench } from '../app/src/SystemWorkbench';
import type { Sidebar } from '../DS1/3-unit/ds-sidebar';
import { LAYERS } from '../shared/component-directory';

const settle = async () => { for (let tick = 0; tick < 5; tick++) await new Promise(resolve => setTimeout(resolve, 0)); };

it('uses the public catalogue and examples, preserving saved CSS until an edit', async () => {
  // The open component is the address's ?component=, read through the app's router, as in the app.
  window.history.replaceState({}, '', '/app/');
  window.dispatchEvent(new PopStateEvent('popstate'));
  const dirty = vi.fn();
  const workbench = document.createElement('ds1-system-workbench') as SystemWorkbench;
  workbench.initialCss = ':root { --brand: pink; }';
  workbench.initialConfig = { schema: 1, custom: 'preserved' };
  workbench.addEventListener('workbench-dirty', dirty);
  document.body.append(workbench);
  await settle();
  // The catalogue is Design system 1's sidebar: a group row per layer, a row per component.
  const sidebar = workbench.querySelector<Sidebar>('ds-sidebar')!;
  await sidebar.updateComplete;
  const entries = LAYERS.flatMap(layer => layer.entries);
  expect(sidebar.items.filter(item => item.depth === 1)).toHaveLength(entries.length);
  expect(sidebar.items.filter(item => item.depth === 0)).toHaveLength(LAYERS.length);
  expect(workbench.querySelector('iframe')?.getAttribute('src')).toBe('/examples/button/');
  expect(dirty).not.toHaveBeenCalled();
  expect(workbench.querySelector('[data-testid="live-css-source"]')).toBeNull();
  const toggle = [...workbench.querySelectorAll('button')].find(button => button.textContent === 'Show stylesheet')!;
  toggle.click();
  await settle();
  expect(workbench.querySelector('[data-testid="live-css-source"]')?.textContent).toContain('--brand: pink');
  expect(sidebar.items.some(item => item.label === 'Keyboard shortcut')).toBe(false);
  const avatar = [...sidebar.shadowRoot!.querySelectorAll<HTMLButtonElement>('button[data-item]')].find(button => button.textContent?.trim() === 'Avatar')!;
  avatar.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
  await settle();
  expect(workbench.querySelector('iframe')?.getAttribute('src')).toBe('/examples/avatar-borderless/');
  expect(new URLSearchParams(window.location.search).get('component')).toBe('/2-core/avatar/');
  workbench.remove();
});
