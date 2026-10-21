// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from 'vite-plus/test';
import { getFunctionName } from 'convex/server';
const mocks = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock('./lib/backend', async () => {
  const { signal } = await import('@lit-labs/signals');
  const { getFunctionName } = await import('convex/server');
  return {
    authState: signal({ isAuthenticated: true, isLoading: false }),
    authToken: signal('test-session'),
    mutation: (...args: unknown[]) => mocks.create(...args),
    LiveQuery: class {
      constructor(host: { addController(controller: unknown): void }, private ref: any, private args: () => unknown) { host.addController(this); }
      get value() {
        if (this.args() === 'skip') return undefined;
        return getFunctionName(this.ref) === 'users:profile' ? { companyName: 'Example' } : [{ _id: 'one', name: 'Library one', publishedVersion: 2 }];
      }
    },
  };
});
import type { Signal } from '@lit-labs/signals';
import { authState } from './lib/backend';
import './NavigationAuth';

void getFunctionName;
const session = authState as unknown as Signal.State<{ isAuthenticated: boolean; isLoading: boolean }>;
const settle = async () => { for (let tick = 0; tick < 8; tick++) await new Promise(resolve => setTimeout(resolve, 0)); };
const mount = async () => { const element = document.createElement('ds1-navigation-auth'); document.body.append(element); await settle(); return element; };
afterEach(() => { document.body.replaceChildren(); session.set({ isAuthenticated: true, isLoading: false }); vi.unstubAllGlobals(); mocks.create.mockReset(); });

test('workspace creation accepts only the parent and ignores duplicate or signed-out requests', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 403 })));
  const sent = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => {});
  let finish!: (result: any) => void;
  mocks.create.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const request = (origin = location.origin, source: MessageEventSource | null = window.parent) => window.dispatchEvent(new MessageEvent('message', { origin, source, data: { type: 'ds1:create-library' } }));
  try {
    await mount();
    expect(sent.mock.calls.at(-1)?.[0]).toMatchObject({ companyName: 'Example', libraries: [{ id: 'one', name: 'Library one', publishedVersion: 2 }] });
    request('https://elsewhere.example'); request(location.origin, null);
    await settle();
    expect(mocks.create).not.toHaveBeenCalled();
    request(); request();
    await settle();
    expect(mocks.create).toHaveBeenCalledOnce();
    finish({ _id: 'new-library' });
    await settle();
    expect(sent).toHaveBeenCalledWith({ type: 'ds1:library-created', id: 'new-library' }, location.origin);
    session.set({ isAuthenticated: false, isLoading: false });
    await settle();
    expect(sent.mock.calls.at(-1)?.[0]).toMatchObject({ authenticated: false, companyName: '', libraries: [] });
    request();
    await settle();
    expect(mocks.create).toHaveBeenCalledOnce();
  } finally { sent.mockRestore(); }
});

test('the bridge exposes App only after server authorization and clears it on sign-out', async () => {
  const components = [{ name: 'Keyboard shortcut', href: '/libraries/workspace/?internal=keyboard-shortcut', layer: 2 }];
  vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url) => url === '/api/app-navigation' ? Response.json({ components }) : new Response(null, { status: 204 })));
  const sent = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => {});
  try {
    await mount();
    expect(sent.mock.calls.at(-1)?.[0]).toMatchObject({ authenticated: true, appComponents: components });
    expect(fetch).toHaveBeenCalledWith('/api/app-navigation', expect.objectContaining({ headers: { Authorization: 'Bearer test-session' }, cache: 'no-store' }));
    expect(fetch).toHaveBeenCalledTimes(1);
    session.set({ isAuthenticated: false, isLoading: false });
    await settle();
    expect(sent.mock.calls.at(-1)?.[0]).toMatchObject({ authenticated: false, appComponents: [] });
    expect(fetch).toHaveBeenCalledWith('/api/dashboard/session', expect.objectContaining({ method: 'DELETE' }));
  } finally { sent.mockRestore(); }
});

test('private links stay hidden when the owner document session cannot be established', async () => {
  vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => new Response(null, { status: 403 })));
  const sent = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => {});
  try {
    await mount();
    expect(sent.mock.calls.at(-1)?.[0]).toMatchObject({ authenticated: true, appComponents: [] });
  } finally { sent.mockRestore(); }
});

test('restoring authentication does not delete an existing document session', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 403 })));
  session.set({ isAuthenticated: false, isLoading: true });
  const sent = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => {});
  try {
    await mount();
    expect(fetch).not.toHaveBeenCalled();
    expect(sent.mock.calls.at(-1)?.[0]).toMatchObject({ loading: true });
  } finally { sent.mockRestore(); }
});
