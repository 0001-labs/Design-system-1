// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vite-plus/test';
vi.mock('../lib/backend', async () => ({ authState: (await import('@lit-labs/signals')).signal({ isAuthenticated: true, isLoading: false }), authToken: (await import('@lit-labs/signals')).signal('token'), signOut: vi.fn(), query: vi.fn() }));
vi.mock('./AdoptionDashboard', () => ({ OwnerSession: class { ready = true; error = ''; leave = vi.fn(); } }));
vi.mock('../../../website/src/lib/adoption-document', () => ({}));
vi.mock('../../../website/src/lib/architecture-document', () => ({}));
import './SystemSite';
import type { SystemSite } from './SystemSite';
const settle = async () => { for (let tick = 0; tick < 8; tick++) await new Promise(done => setTimeout(done, 0)); };
const example = { id: 'shop', label: 'Shop', href: '/examples/layouts/shop/', enabled: true, defaultEnabled: true };
const report = { schema: 1, generatedAt: '2026-10-27T03:00:00.000Z', revision: '12345678', widths: [320], themes: ['light'], examples: [{ id: 'shop', errors: [], checks: [{ code: 'select.hug', width: 320, theme: 'light', measured: 1, status: 'pass', findings: [] }] }] };
afterEach(() => { document.body.replaceChildren(); vi.unstubAllGlobals(); });
it('keeps the accepted switch state on a refused save and prevents duplicate pending writes', async () => {
  let finish: (response: Response) => void = () => {};
  const fetcher = vi.fn((path: string, init?: RequestInit) => init?.method === 'PUT' ? new Promise<Response>(done => { finish = done; }) : Promise.resolve(Response.json(path.endsWith('examples') ? [example] : report)));
  vi.stubGlobal('fetch', fetcher);
  const host = document.createElement('ds1-system-site') as SystemSite; host.section = 'Examples'; document.body.append(host); await settle();
  const control = () => host.querySelector<HTMLButtonElement>('button[role="switch"]')!;
  expect(control().getAttribute('aria-checked')).toBe('true');
  control().click(); await settle(); expect(control().disabled).toBe(true);
  await host.toggle(example); expect(fetcher.mock.calls.filter(([, init]) => init?.method === 'PUT')).toHaveLength(1);
  finish(new Response(null, { status: 500 })); await settle();
  expect(control().getAttribute('aria-checked')).toBe('true'); expect(control().disabled).toBe(false); expect(host.querySelector('[role="alert"]')?.textContent).toContain('previous setting is kept');
  control().click(); await settle(); finish(Response.json({ saved: true })); await settle();
  expect(control().getAttribute('aria-checked')).toBe('false');
});
it('shows measured scores and links results to permanent constraint IDs', async () => {
  vi.stubGlobal('fetch', vi.fn((path: string) => Promise.resolve(Response.json(path.endsWith('examples') ? [example] : report))));
  const host = document.createElement('ds1-system-site') as SystemSite; host.section = 'Examples'; document.body.append(host); await settle();
  expect(host.textContent).toContain('1/1'); host.selected = 'shop'; await settle();
  expect(host.querySelector('a[href="/constraints#C001"]')).not.toBeNull();
});
it('finds constraints by short ID and by tag', async () => {
  const host = document.createElement('ds1-system-site') as SystemSite; host.section = 'Constraints'; document.body.append(host); await settle();
  host.search = 'C004'; await settle(); expect(host.querySelectorAll('.system-rule')).toHaveLength(1); expect(host.textContent).toContain('color.text-contrast');
  host.search = 'Type metrics'; await settle(); expect(host.querySelectorAll('.system-rule')).toHaveLength(1); expect(host.textContent).toContain('F005');
});
