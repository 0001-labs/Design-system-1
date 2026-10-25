import { expect, it, vi } from 'vite-plus/test';
import { consistencyPreview } from '../src/consistency';
import { DOCUMENT_POLICY, EDIT_BYTES, FILE_POLICY } from '../src/consistency-sites';
import type { ReportsEnv } from '../src/reports';

const origin = 'https://editor.c9y.site';
const headers = { cookie: '__Host-ds1-dashboard=valid-token' };
type Env = Parameters<typeof consistencyPreview>[1];

function setup(id = 'owner', answer: (request: Request) => Response = request => Response.json({ path: new URL(request.url).pathname + new URL(request.url).search, method: request.method })) {
  const assets = vi.fn(async () => new Response('private bytes'));
  const workspace = { fetch: vi.fn(async (request: Request) => answer(request)) };
  const env = { REPORTS_OWNER_ID: 'owner', REPORTS_AUTH_URL: 'https://example.convex.cloud', ASSETS: { fetch: assets }, CONSISTENCY_WORKSPACE: workspace } as unknown as ReportsEnv & Env;
  const send = vi.fn(async () => Response.json({ status: 'success', value: { _id: id, email: 'jaa90@icloud.com', emailVerified: true } }));
  const call = (path: string, init: RequestInit = {}) => consistencyPreview(new Request(origin + '/api/consistency/sites/' + path, init), env, send);
  return { workspace, send, call };
}
const edit = (init: { origin?: string; type?: string; body?: string } = {}) => ({ method: 'POST', headers: { ...headers, origin: init.origin ?? origin, 'Content-Type': init.type ?? 'application/json' }, body: init.body ?? '{"path":"/","key":"0123456789ab","markdown":"Hej"}' });

it('asks the owner first, and nothing reaches the platform for anyone else', async () => {
  const { call, workspace } = setup();
  expect((await call('10VNDG/pages')).status).toBe(401);
  expect((await call('10VNDG/edit', { ...edit(), headers: { origin, 'Content-Type': 'application/json' } })).status).toBe(401);
  expect((await call('10VNDG/document?path=/')).status).toBe(401);
  expect((await call('10VNDG/files/assets/site.css')).status).toBe(401);
  const other = setup('other');
  expect((await other.call('10VNDG/pages', { headers })).status).toBe(403);
  expect(workspace.fetch).not.toHaveBeenCalled(); expect(other.workspace.fetch).not.toHaveBeenCalled();
});

it('passes the owner\'s reads and bounded, same-origin JSON writes on to the platform, and only those', async () => {
  const { call, workspace } = setup();
  expect(await (await call('10VNDG/pages', { headers })).json()).toEqual({ path: '/api/consistency/sites/10VNDG/pages', method: 'GET' });
  expect(await (await call('10VNDG/page?path=%2Fen%2F&other=1', { headers })).json()).toEqual({ path: '/api/consistency/sites/10VNDG/page?path=%2Fen%2F', method: 'GET' });
  expect((await call('10VNDG/edit', edit({ origin: 'https://c9y.site' }))).status).toBe(403);
  expect((await call('10VNDG/edit', edit({ origin: 'https://evil.test' }))).status).toBe(403);
  expect((await call('10VNDG/edit', edit({ type: 'text/plain' }))).status).toBe(403);
  expect((await call('10VNDG/edit', edit({ body: 'x'.repeat(EDIT_BYTES + 1) }))).status).toBe(413);
  expect(workspace.fetch).toHaveBeenCalledTimes(2);
  const saved = await call('10VNDG/edit', edit());
  expect(await saved.json()).toEqual({ path: '/api/consistency/sites/10VNDG/edit', method: 'POST' });
  expect(await workspace.fetch.mock.calls[2]![0].text()).toBe('{"path":"/","key":"0123456789ab","markdown":"Hej"}');
  expect(saved.headers.get('cache-control')).toBe('private, no-store');
});

it('refuses other methods, routes, sites and paths before the platform', async () => {
  const { call, workspace } = setup();
  expect((await call('10VNDG/pages', { method: 'POST', headers: { ...headers, origin } })).status).toBe(405);
  expect((await call('10VNDG/edit', { headers })).status).toBe(405);
  expect((await call('10VNDG/files/a.css', { method: 'DELETE', headers: { ...headers, origin } })).status).toBe(405);
  expect((await call('10VNDG/reset', { method: 'POST', headers: { ...headers, origin } })).status).toBe(404);
  expect((await call('10VNDG/editors', { headers })).status).toBe(404);
  expect((await call('Cph_Raft/pages', { headers })).status).toBe(404);
  expect((await call('10VNDG/page', { headers })).status).toBe(400);
  expect((await call('10VNDG/document?path=//evil.test/', { headers })).status).toBe(400);
  expect((await call('10VNDG/document?path=https://evil.test/', { headers })).status).toBe(400);
  expect(workspace.fetch).not.toHaveBeenCalled();
});

it('serves the page sandboxed, with no script source, even opened on its own', async () => {
  const { call } = setup('owner', () => new Response('<!doctype html><html><body><h1 data-cms="k">Hello</h1></body></html>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } }));
  const page = await call('10VNDG/document?path=/', { headers });
  expect(page.status).toBe(200);
  expect(page.headers.get('content-security-policy')).toBe(DOCUMENT_POLICY);
  expect(DOCUMENT_POLICY).toMatch(/^sandbox allow-same-origin;/); expect(DOCUMENT_POLICY).not.toMatch(/allow-scripts|script-src/);
  expect(page.headers.get('x-content-type-options')).toBe('nosniff');
  expect(page.headers.get('cache-control')).toBe('private, no-store');
  const wrong = setup('owner', () => new Response('alert(1)', { headers: { 'Content-Type': 'text/javascript' } }));
  expect((await wrong.call('10VNDG/document?path=/', { headers })).status).toBe(502);
});

it('serves only the files a page draws with, each sandboxed', async () => {
  const typed = (type: string) => setup('owner', () => new Response('bytes', { headers: { 'Content-Type': type } }));
  for (const type of ['text/css; charset=utf-8', 'font/woff2', 'image/svg+xml', 'image/jpeg', 'video/mp4']) {
    const file = await typed(type).call('10VNDG/files/assets/x', { headers });
    expect(file.status).toBe(200); expect(file.headers.get('content-security-policy')).toBe(FILE_POLICY);
  }
  for (const type of ['text/html', 'text/javascript', 'application/json', 'application/octet-stream', '']) expect((await typed(type).call('10VNDG/files/assets/x', { headers })).status).toBe(415);
  const missing = setup('owner', () => Response.json({ error: 'not-found' }, { status: 404 }));
  expect((await missing.call('10VNDG/files/nope.css', { headers })).status).toBe(404);
});
