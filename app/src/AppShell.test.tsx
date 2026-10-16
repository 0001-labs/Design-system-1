// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from 'vite-plus/test';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
const session = vi.hoisted(() => ({ isAuthenticated: false, isLoading: false }));
vi.mock('convex/react', () => ({ useConvexAuth: () => session }));
vi.mock('./router', () => ({ useLocation: () => ({ path: '/libraries' }), Link: ({ to, children, ...props }: any) => createElement('a', { href: to, ...props }, children) }));
import { AppShell } from './AppShell';
afterEach(() => vi.unstubAllGlobals());
test('My libraries is shown only after authentication resolves successfully', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  try {
    for (const [isAuthenticated, isLoading, visible] of [[false, true, false], [false, false, false], [true, true, false], [true, false, true], [false, false, false]]) {
      Object.assign(session, { isAuthenticated, isLoading });
      await act(async () => root.render(createElement(AppShell, null, 'Page')));
      expect(host.querySelector('nav')?.textContent?.includes('My libraries')).toBe(visible);
      expect(host.querySelector('nav')?.textContent).not.toContain('Editor');
    }
  } finally { await act(async () => root.unmount()); host.remove(); }
});
