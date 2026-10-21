// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from 'vite-plus/test';
const mocks = vi.hoisted(() => ({ library: vi.fn<(...args: any[]) => any>() }));
vi.mock('./lib/backend', async () => {
  const { signal } = await import('@lit-labs/signals');
  return {
    authState: signal({ isAuthenticated: false, isLoading: false }),
    authToken: signal(null),
    LiveQuery: class {
      constructor(host: { addController(controller: unknown): void }, private ref: unknown, private args: () => unknown) { host.addController(this); }
      get value() { return mocks.library(this.ref, this.args()); }
    },
  };
});
import type { Signal } from '@lit-labs/signals';
import { authState } from './lib/backend';
import './AppShell';
import type { AppShell } from './AppShell';
import { href, navigate } from './router';

const session = authState as unknown as Signal.State<{ isAuthenticated: boolean; isLoading: boolean }>;
const settle = async () => { for (let tick = 0; tick < 5; tick++) await new Promise(resolve => setTimeout(resolve, 0)); };
function mount() {
  const shell = document.createElement('ds1-shell') as AppShell;
  shell.content = 'Page';
  document.body.append(shell);
  return shell;
}
afterEach(() => { vi.unstubAllGlobals(); document.body.replaceChildren(); session.set({ isAuthenticated: false, isLoading: false }); navigate('/libraries'); });

test('top navigation omits Docs while the account link follows authentication', async () => {
  navigate('/libraries');
  const shell = mount();
  for (const [isAuthenticated, isLoading] of [[false, true], [false, false], [true, true], [true, false], [false, false]]) {
    session.set({ isAuthenticated, isLoading });
    await settle();
    expect(Array.from(shell.querySelectorAll('nav a'), a => a.textContent)).toEqual([]);
    expect(shell.querySelector('.site-account')?.getAttribute('href')).toBe(href(isAuthenticated ? '/profile' : '/libraries'));
    expect(shell.querySelector('.site-account')?.textContent).toBe(isLoading || isAuthenticated ? 'Account' : 'Sign in');
    expect(shell.querySelector('nav')?.textContent).not.toContain('Editor');
  }
  expect(shell.querySelector('.app-content')?.textContent).toBe('Page');
});

test('only the authenticated route library supplies its name and real published version, clearing on exit', async () => {
  const report = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => {});
  document.documentElement.setAttribute('data-docs-embed', '');
  try {
    navigate('/l/library-one?component=/2-core/input/');
    session.set({ isAuthenticated: true, isLoading: false });
    mocks.library.mockReturnValue({ name: 'Example library', publishedVersion: 7 });
    const shell = mount();
    await settle();
    expect(shell.querySelector('.site-brand')?.textContent).toBe('Design system 1');
    expect(report).toHaveBeenLastCalledWith({ type: 'ds1:library-navigation', libraryId: 'library-one', library: { id: 'library-one', name: 'Example library', publishedVersion: 7, component: '/2-core/input/' } }, window.location.origin);
    mocks.library.mockReturnValue({ name: 'Renamed library', publishedVersion: null });
    shell.requestUpdate();
    await settle();
    expect(report).toHaveBeenLastCalledWith({ type: 'ds1:library-navigation', libraryId: 'library-one', library: { id: 'library-one', name: 'Renamed library', publishedVersion: null, component: '/2-core/input/' } }, window.location.origin);
    for (const state of [{ path: '/libraries', authenticated: true, loading: false }, { path: '/l/library-one', authenticated: false, loading: false }, { path: '/l/library-one', authenticated: true, loading: true }]) {
      navigate(state.path);
      session.set({ isAuthenticated: state.authenticated, isLoading: state.loading });
      await settle();
      expect(shell.querySelector('.site-brand')?.textContent).toBe('Design system 1');
      expect(mocks.library.mock.calls.at(-1)?.[1]).toBe('skip');
      expect(report).toHaveBeenLastCalledWith({ type: 'ds1:library-navigation', libraryId: state.path === '/libraries' ? null : 'library-one', library: null }, window.location.origin);
    }
  } finally {
    document.documentElement.removeAttribute('data-docs-embed');
    mocks.library.mockReset();
    report.mockRestore();
  }
});
