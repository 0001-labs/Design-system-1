// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vite-plus/test';
import type { AdoptionReport, ComponentCell } from '../../../shared/component-adoption';
vi.mock('../lib/backend', async () => ({ authToken: (await import('@lit-labs/signals')).signal(null), signOut: vi.fn() }));
import './ComponentAdoption';
import type { ComponentMatrix } from './ComponentAdoption';

const cell = (shared: number, local: number): ComponentCell => ({
  shared, styled: 0, local, unverified: 0, snapshot: 'none', current: null, issues: [],
  sites: [...Array(shared).fill({ file: 'src/a.tsx', line: 1, tag: 'ds-button', kind: 'shared' }), ...Array(local).fill({ file: 'src/a.tsx', line: 2, tag: 'button', kind: 'local' })],
});
const report: AdoptionReport = {
  schema: 1, generatedAt: new Date().toISOString(), sourceCommit: '0123456789abcdef', sourceDirty: false, method: [],
  columns: [{ id: 'button', name: 'Button', group: 'Core' }, { id: 'input', name: 'Input', group: 'Core' }],
  apps: [{ id: 'fixture', name: 'Fixture', status: 'scanned', commit: 'abcdef0123', dirty: false, files: 1, scope: ['src'], snapshotCommit: null, otherCustomElements: {}, cells: { button: cell(1, 2), input: cell(0, 0) } }],
};
const settle = async () => { for (let tick = 0; tick < 5; tick++) await new Promise(resolve => setTimeout(resolve, 0)); };
afterEach(() => document.body.replaceChildren());

it('chooses the count with the shared split button and shows unused columns with the shared checkbox', async () => {
  const host = document.createElement('ds1-component-matrix') as ComponentMatrix;
  host.report = report;
  document.body.append(host);
  await settle();
  const views = host.querySelector<HTMLElement & { value: string; updateComplete: Promise<unknown> }>('ds-button[split].adoption-views')!;
  expect(views.getAttribute('aria-label')).toBe('Count to show');
  await views.updateComplete;
  const segments = () => [...views.shadowRoot!.querySelectorAll<HTMLButtonElement>('button')];
  expect(segments().map(segment => (segment.querySelector('ds-text') as HTMLElement & { text: string }).text)).toEqual(['All uses', 'DS1 components', 'DS1 styles', 'Local', 'Needs review']);
  expect(segments().map(segment => segment.getAttribute('aria-pressed'))).toEqual(['true', 'false', 'false', 'false', 'false']);
  const total = () => host.querySelector('tbody td.adoption-total')!.textContent;
  expect(total()).toBe('3');
  segments()[3]!.click();
  await settle();
  expect(views.value).toBe('local');
  expect(segments()[3]!.getAttribute('aria-pressed')).toBe('true');
  expect(total()).toBe('2');

  const columns = () => [...host.querySelectorAll('.adoption-column-names .adoption-name')].map(name => name.textContent);
  // The whole catalogue shows by default, unused columns included; the checkbox hides them.
  expect(columns()).toEqual(['Button', 'Input']);
  const unused = host.querySelector<HTMLInputElement>('.adoption-controls ds-checkbox > input[type="checkbox"]')!;
  expect(unused.closest('label')!.textContent).toContain('Show unused components');
  expect(unused.checked).toBe(true);
  unused.click();
  await settle();
  expect(unused.checked).toBe(false);
  expect(columns()).toEqual(['Button']);
  unused.click();
  await settle();
  expect(unused.checked).toBe(true);
  expect(columns()).toEqual(['Button', 'Input']);
});
