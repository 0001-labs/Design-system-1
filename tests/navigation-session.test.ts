// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from 'vite-plus/test';
import { clearNavigationCache, readNavigationCache, saveNavigationCache, NAVIGATION_MAX_AGE, type NavigationSummary } from '../shared/navigation-cache';
import { connectNavigationSession } from '../website/src/lib/navigation-session';
const key = '__convexAuthJWT_test';
const summary: NavigationSummary = { type: 'ds1:navigation-auth', authenticated: true, loading: false, owner: true, appComponents: [{ name: 'IndexedDB', layer: 1, href: '/libraries/workspace/?internal=indexeddb' }], companyName: 'Example', libraries: [], librariesLoaded: true, creating: false, creationError: null };
const active: ReturnType<typeof connectNavigationSession>[] = [];
function page() {
  const frame = document.createElement('iframe');
  const publish = vi.fn();
  const session = connectNavigationSession(frame, publish);
  active.push(session);
  return { frame, publish, session };
}
afterEach(() => { active.splice(0).forEach(session => session.dispose()); localStorage.clear(); clearNavigationCache(); vi.restoreAllMocks(); });

test('page changes reuse a session-bound result without loading the auth app or sliding expiry', async () => {
  localStorage.setItem(key, 'session-a');
  const expires = await saveNavigationCache(key, 'session-a', summary);
  for (let index = 0; index < 3; index++) {
    const { frame, publish, session } = page();
    await session.ready;
    expect(frame.hasAttribute('src')).toBe(false);
    expect(publish).toHaveBeenCalledWith(summary);
    expect((await readNavigationCache())?.expires).toBe(expires);
    session.dispose();
  }
  expect(sessionStorage.getItem('ds1:navigation-summary:v1')).not.toContain('session-a');
});

test('expiry and a changed or removed session start a fresh check', async () => {
  localStorage.setItem(key, 'session-a');
  await saveNavigationCache(key, 'session-a', summary);
  localStorage.setItem(key, 'session-b');
  expect(await readNavigationCache()).toBeNull();
  const changed = page(); await changed.session.ready;
  expect(changed.frame.getAttribute('src')).toBe('/app/navigation-auth');
  localStorage.removeItem(key); expect(await readNavigationCache()).toBeNull();
  localStorage.setItem(key, 'session-a');
  vi.spyOn(Date, 'now').mockReturnValue(Date.now() + NAVIGATION_MAX_AGE + 1);
  const expired = page(); await expired.session.ready;
  expect(expired.frame.getAttribute('src')).toBe('/app/navigation-auth');
});

test('access rejection discards cached owner state immediately and starts the bridge', async () => {
  localStorage.setItem(key, 'session-a'); await saveNavigationCache(key, 'session-a', summary);
  const { frame, publish, session } = page(); await session.ready;
  window.dispatchEvent(new Event('ds1:access-invalidated'));
  expect(publish.mock.calls.at(-1)?.[0]).toMatchObject({ owner: false, appComponents: [] });
  expect(await readNavigationCache()).toBeNull();
  expect(frame.getAttribute('src')).toBe('/app/navigation-auth');
});

test('an in-flight cache write cannot restore cleared access', async () => {
  localStorage.setItem(key, 'session-a');
  const pending = saveNavigationCache(key, 'session-a', summary);
  clearNavigationCache(); await pending;
  expect(await readNavigationCache()).toBeNull();
});

test('signed-out pages can reuse a result but signing in invalidates it', async () => {
  await saveNavigationCache(key, null, { ...summary, authenticated: false, owner: false, appComponents: [], librariesLoaded: false });
  expect((await readNavigationCache())?.summary.authenticated).toBe(false);
  localStorage.setItem(key, 'session-a');
  expect(await readNavigationCache()).toBeNull();
});

test('token refresh keeps the running bridge alive until its new owner check finishes', async () => {
  const { frame, publish, session } = page();
  await session.ready;
  session.receive(summary);
  const reload = vi.spyOn(frame, 'src', 'set');
  localStorage.setItem(key, 'refreshed-session');
  window.dispatchEvent(new StorageEvent('storage', { storageArea: localStorage, key, oldValue: 'previous-session', newValue: 'refreshed-session' }));
  expect(publish.mock.calls.at(-1)?.[0]).toMatchObject({ owner: false });
  // Convex refreshes on connection. Reloading here starts another refresh and
  // interrupts the bridge before it can report the server's owner decision.
  expect(reload).not.toHaveBeenCalled();
  session.receive(summary);
  expect(publish.mock.calls.at(-1)?.[0]).toMatchObject({ authenticated: true, owner: true });
});
