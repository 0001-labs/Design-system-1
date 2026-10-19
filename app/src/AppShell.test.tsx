// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from 'vite-plus/test';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
const location = vi.hoisted(() => ({ path: '/libraries', search: new URLSearchParams() }));
const libraryQuery = vi.hoisted(() => vi.fn<(...args: any[]) => any>());
const session = vi.hoisted(() => ({ isAuthenticated: false, isLoading: false }));
vi.mock('convex/react', () => ({ useConvexAuth: () => session, useQuery: libraryQuery }));
vi.mock('./router', async (importOriginal) => ({ ...(await importOriginal<typeof import('./router')>()), useLocation: () => location, Link: ({ to, children, ...props }: any) => createElement('a', { href: to, ...props }, children) }));
import { AppShell } from './AppShell';
afterEach(() => vi.unstubAllGlobals());
test('top navigation omits Docs while the account link follows authentication', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  try {
    for (const [isAuthenticated, isLoading] of [[false, true], [false, false], [true, true], [true, false], [false, false]]) {
      Object.assign(session, { isAuthenticated, isLoading });
      await act(async () => root.render(createElement(AppShell, null, 'Page')));
      expect(Array.from(host.querySelectorAll('nav a'), a => a.textContent)).toEqual([]);
      expect(host.querySelector('.site-account')?.getAttribute('href')).toBe('/libraries');
      expect(host.querySelector('.site-account')?.textContent).toBe(isLoading || isAuthenticated ? 'Account' : 'Sign in');
      expect(host.querySelector('nav')?.textContent).not.toContain('Editor');
    }
  } finally { await act(async () => root.unmount()); host.remove(); }
});


test('only the authenticated route library supplies its name and real published version, clearing on exit', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const host = document.createElement('div');
  const root = createRoot(host);
  const report = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => {});
  document.documentElement.setAttribute('data-docs-embed', '');
  try {
    location.path = '/l/library-one';
    location.search = new URLSearchParams('component=/2-core/input/');
    Object.assign(session, { isAuthenticated: true, isLoading: false });
    libraryQuery.mockReturnValue({ name: 'Example library', publishedVersion: 7 });
    await act(async () => root.render(createElement(AppShell, null, 'Editor')));
    expect(host.querySelector('.site-brand')?.textContent).toBe('Example library');
    expect(report).toHaveBeenLastCalledWith({ type: 'ds1:library-navigation', libraryId: 'library-one', library: { id: 'library-one', name: 'Example library', publishedVersion: 7, component: '/2-core/input/' } }, window.location.origin);
    libraryQuery.mockReturnValue({ name: 'Renamed library', publishedVersion: null });
    await act(async () => root.render(createElement(AppShell, null, 'Editor')));
    expect(host.querySelector('.site-brand')?.textContent).toBe('Renamed library');
    for (const state of [{ path: '/libraries', authenticated: true, loading: false }, { path: '/l/library-one', authenticated: false, loading: false }, { path: '/l/library-one', authenticated: true, loading: true }]) {
      location.path = state.path;
      Object.assign(session, { isAuthenticated: state.authenticated, isLoading: state.loading });
      await act(async () => root.render(createElement(AppShell, null, 'Page')));
      expect(host.querySelector('.site-brand')?.textContent).toBe('Design system 1');
      expect(libraryQuery.mock.calls.at(-1)?.[1]).toBe('skip');
      expect(report).toHaveBeenLastCalledWith({ type: 'ds1:library-navigation', libraryId: state.path === '/libraries' ? null : 'library-one', library: null }, window.location.origin);
    }
  } finally {
    await act(async () => root.unmount());
    document.documentElement.removeAttribute('data-docs-embed');
    location.path = '/libraries';
    libraryQuery.mockReset();
    report.mockRestore();
  }
});
