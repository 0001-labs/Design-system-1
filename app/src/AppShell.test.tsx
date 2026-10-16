// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from 'vite-plus/test';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
const session = vi.hoisted(() => ({ isAuthenticated: false, isLoading: false }));
vi.mock('convex/react', () => ({ useConvexAuth: () => session }));
vi.mock('./router', () => ({ useLocation: () => ({ path: '/libraries' }), Link: ({ to, children, ...props }: any) => createElement('a', { href: to, ...props }, children) }));
import { AppShell } from './AppShell';
afterEach(() => vi.unstubAllGlobals());
test('public navigation stays Docs-only while the account link follows authentication', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  try {
    for (const [isAuthenticated, isLoading] of [[false, true], [false, false], [true, true], [true, false], [false, false]]) {
      Object.assign(session, { isAuthenticated, isLoading });
      await act(async () => root.render(createElement(AppShell, null, 'Page')));
      expect(Array.from(host.querySelectorAll('nav a'), a => a.textContent)).toEqual(['Docs']);
      expect(host.querySelector('.site-account')?.getAttribute('href')).toBe('/libraries');
      expect(host.querySelector('.site-account')?.textContent).toBe(isLoading || isAuthenticated ? 'Account' : 'Sign in');
      expect(host.querySelector('nav')?.textContent).not.toContain('Editor');
    }
  } finally { await act(async () => root.unmount()); host.remove(); }
});
