// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
vi.mock('@convex-dev/auth/react', () => ({ useAuthToken: () => 'valid-session', useAuthActions: () => ({ signOut: vi.fn() }) }));
vi.mock('convex/react', () => ({ useConvexAuth: () => ({ isLoading: false, isAuthenticated: true }) }));
vi.mock('../../../DS1/0-face/i18n', () => ({ getText: (value: string) => value, currentLanguage: { value: 'en', subscribe: () => () => {} } }));
vi.mock('./SignIn', () => ({ SignIn: () => null }));
import { FontWorkspace } from './FontWorkspace';
let root: Root;
let host: HTMLDivElement;
const settle = () => act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); });
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('FontFace', class { family: string; constructor(family: string) { this.family = family; } async load() { return this; } });
  Object.defineProperty(document, 'fonts', { configurable: true, value: new Set() });
  vi.stubGlobal('fetch', vi.fn(async (path: string) => path === '/api/fonts' ? Response.json({ fonts: [
    { id: 'supernatural', name: 'Supernatural', detail: 'In development', available: false },
    { id: 'olivetti', name: 'Olivetti Dot', detail: 'Regular', available: true },
  ] }) : new Response(new Uint8Array([1, 2, 3]))));
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals(); });
describe('font workspace', () => {
  it('shows an honest empty state, loads an authorised face and preserves words through size cycles', async () => {
    await act(async () => root.render(createElement(FontWorkspace))); await settle();
    expect(host.textContent).toContain('Supernatural starts with your handwriting.');
    expect(host.querySelector('textarea')).toBeNull();
    const list = host.querySelector('ds-page[layout="sidebar"] > ds-sidebar[slot="nav"]')!;
    expect(list).not.toBeNull();
    expect(['divided', 'fill'].every(name => list.parentElement!.hasAttribute(name))).toBe(true);
    const rows = () => [...list.shadowRoot!.querySelectorAll<HTMLButtonElement>('button[data-item]')];
    expect(rows().map(row => row.textContent?.trim())).toEqual(['Supernatural', 'Olivetti Dot']);
    expect(rows()[0]!.getAttribute('aria-current')).toBe('page');
    await act(async () => rows()[1]!.click()); await settle();
    expect(rows()[1]!.getAttribute('aria-current')).toBe('page');
    const specimen = host.querySelector('textarea')!;
    expect(specimen).not.toBeNull();
    const words = specimen.value;
    // Size is Design system 1's cycle: its face is a shared button inside the cycle's shadow root.
    const cycle = host.querySelector<HTMLElement & { updateComplete: Promise<unknown> }>('ds-cycle[data-setting="size"]')!;
    await cycle.updateComplete;
    const face = cycle.shadowRoot!.querySelector<HTMLElement & { updateComplete: Promise<unknown> }>('ds-button')!;
    await face.updateComplete;
    for (const size of [60, 80, 100, 120, 20, 40]) {
      await act(async () => { face.shadowRoot!.querySelector('button')!.click(); await cycle.updateComplete; });
      expect(specimen.style.fontSize).toContain(`${size}px`);
      expect(specimen.value).toBe(words);
    }
    expect(fetch).toHaveBeenCalledWith('/api/fonts/file/olivetti', expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer valid-session' }) }));
  });
  it('does not render the font workspace when the server denies access', async () => {
    vi.mocked(fetch).mockImplementation(async () => Response.json({ error: 'This font workspace is private.' }, { status: 403 }));
    await act(async () => root.render(createElement(FontWorkspace))); await settle();
    expect(host.textContent).toContain('This font workspace is private.');
    expect(host.querySelector('.font-workspace')).toBeNull();
    expect(host.querySelector('input[type="file"]')).toBeNull();
  });
});
