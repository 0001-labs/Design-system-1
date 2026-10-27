import { describe, expect, it, vi } from 'vite-plus/test';
import { systemSite, SYSTEM_HOST } from '../src/system-site';
import type { ReportsEnv } from '../src/reports';
const origin = `https://${SYSTEM_HOST}`;
function setup() {
  const values = new Map<string, string>();
  const put = vi.fn(async (key: string, value: string) => values.set(key, value));
  const assets = vi.fn(async (_request: Request) => new Response('Application'));
  const env = { LIBRARIES: { get: async (key: string) => values.has(key) ? { json: async () => JSON.parse(values.get(key)!) } : null, put }, REPORTS_AUTH_URL: 'https://example.convex.cloud', REPORTS_OWNER_ID: 'owner', ASSETS: { fetch: assets } } as unknown as ReportsEnv & { ASSETS: Fetcher };
  const send = vi.fn(async () => Response.json({ status: 'success', value: { _id: 'owner', email: 'jaa90@icloud.com', emailVerified: true } }));
  const request = (path: string, init: RequestInit = {}) => new Request(origin + path, { ...init, headers: { cookie: '__Host-ds1-dashboard=token', ...init.headers } });
  return { env, send, put, assets, request };
}
describe('System site', () => {
  it('gates every page, preview and report before assets or settings can be read', async () => {
    for (const path of ['/', '/examples', '/constraints', '/architecture', '/adoption', '/api/system/examples', '/api/system/checks', '/system-previews/shop.png']) {
      const { env, send, assets } = setup();
      const response = await systemSite(new Request(origin + path), env, send);
      expect([401, 302]).toContain(response.status); expect(assets).not.toHaveBeenCalled();
    }
  });
  it('rejects a non-owner and an unverified owner', async () => {
    const { env, send, request, assets } = setup();
    for (const value of [{ _id: 'other', email: 'jaa90@icloud.com', emailVerified: true }, { _id: 'owner', email: 'jaa90@icloud.com', emailVerified: false }]) {
      send.mockResolvedValue(Response.json({ status: 'success', value }));
      expect((await systemSite(request('/examples'), env, send)).status).toBe(403);
    }
    expect(assets).not.toHaveBeenCalled();
  });
  it('serves the verified owner the app and report with private caching', async () => {
    const { env, send, request, assets } = setup();
    for (const [path, target] of [['/examples', '/app/'], ['/api/system/checks', '/system-data/examples.json']]) {
      const response = await systemSite(request(path!), env, send);
      expect(response.status).toBe(200); expect(response.headers.get('cache-control')).toBe('private, no-store');
      expect(new URL(assets.mock.lastCall![0]!.url).pathname).toBe(target);
    }
  });
  it('requires a same-origin owner write, validates IDs and shares the saved example state', async () => {
    const { env, send, request, put } = setup();
    const write = (id: string, from = origin) => systemSite(request('/api/system/examples', { method: 'PUT', headers: { origin: from, 'content-type': 'application/json' }, body: JSON.stringify({ id, enabled: false }) }), env, send);
    expect((await write('shop', 'https://other.example')).status).toBe(403);
    expect((await write('../secret')).status).toBe(400);
    expect(put).not.toHaveBeenCalled();
    expect((await write('shop')).status).toBe(200);
    const rows = await (await systemSite(request('/api/system/examples'), env, send)).json() as { id: string; enabled: boolean }[];
    expect(rows.find(row => row.id === 'shop')?.enabled).toBe(false);
    expect(put).toHaveBeenCalledWith('docs/examples/shop.json', JSON.stringify({ enabled: false }));
  });
  it('does not expose other private applications or asset paths on the host', async () => {
    const { env, send, request, assets } = setup();
    for (const path of ['/private-consistency/', '/private-app/', '/system-data/examples.json', '/api/libraries']) expect((await systemSite(request(path), env, send)).status).toBe(404);
    expect(assets).not.toHaveBeenCalled();
  });
});
