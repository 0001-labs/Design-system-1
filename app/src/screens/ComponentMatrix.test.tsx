// @vitest-environment happy-dom
import { afterEach, beforeEach, expect, it, vi } from 'vite-plus/test';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { AdoptionReport, ComponentCell } from '../../../shared/component-adoption';
vi.mock('@convex-dev/auth/react', () => ({ useAuthToken: () => null, useAuthActions: () => ({ signOut: vi.fn() }) }));
import { ComponentMatrix } from './ComponentAdoption';

const cell = (shared: number, local: number): ComponentCell => ({
  shared, styled: 0, local, unverified: 0, snapshot: 'none', current: null, issues: [],
  sites: [...Array(shared).fill({ file: 'src/a.tsx', line: 1, tag: 'ds-button', kind: 'shared' }), ...Array(local).fill({ file: 'src/a.tsx', line: 2, tag: 'button', kind: 'local' })],
});
const report: AdoptionReport = {
  schema: 1, generatedAt: new Date().toISOString(), sourceCommit: '0123456789abcdef', sourceDirty: false, method: [],
  columns: [{ id: 'button', name: 'Button', group: 'Core' }, { id: 'input', name: 'Input', group: 'Core' }],
  apps: [{ id: 'fixture', name: 'Fixture', status: 'scanned', commit: 'abcdef0123', dirty: false, files: 1, scope: ['src'], snapshotCommit: null, otherCustomElements: {}, cells: { button: cell(1, 2), input: cell(0, 0) } }],
};
let root: Root;
let host: HTMLDivElement;
beforeEach(() => { vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true); host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals(); });

it('chooses the count with the shared split button and shows unused columns with the shared checkbox', async () => {
  await act(async () => root.render(createElement(ComponentMatrix, { report })));
  const views = host.querySelector<HTMLElement & { value: string; updateComplete: Promise<unknown> }>('ds-button[split].adoption-views')!;
  expect(views.getAttribute('aria-label')).toBe('Count to show');
  await views.updateComplete;
  const segments = () => [...views.shadowRoot!.querySelectorAll<HTMLButtonElement>('button')];
  expect(segments().map(segment => (segment.querySelector('ds-text') as HTMLElement & { text: string }).text)).toEqual(['All uses', 'DS1 components', 'DS1 styles', 'Local', 'Needs review']);
  expect(segments().map(segment => segment.getAttribute('aria-pressed'))).toEqual(['true', 'false', 'false', 'false', 'false']);
  const total = () => host.querySelector('tbody td.adoption-total')!.textContent;
  expect(total()).toBe('3');
  await act(async () => { segments()[3]!.click(); await views.updateComplete; });
  expect(views.value).toBe('local');
  expect(segments()[3]!.getAttribute('aria-pressed')).toBe('true');
  expect(total()).toBe('2');

  const columns = () => [...host.querySelectorAll('.adoption-column-names th span')].map(name => name.textContent);
  expect(columns()).toEqual(['Button']);
  const unused = host.querySelector<HTMLInputElement>('.adoption-controls ds-checkbox > input[type="checkbox"]')!;
  expect(unused.closest('label')!.textContent).toContain('Show unused components');
  await act(async () => unused.click());
  expect(unused.checked).toBe(true);
  expect(columns()).toEqual(['Button', 'Input']);
});
