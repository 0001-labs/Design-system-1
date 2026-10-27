import { expect, it, vi } from 'vite-plus/test';
import { consistencyPreview } from '../src/consistency';
import { BUSINESS_BYTES, DOCUMENT_POLICY, EDIT_BYTES, FACE_HOSTS, FILE_POLICY, NATIVE_PAGE_BYTES, apiRoute } from '../src/consistency-sites';
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
  expect(await (await call('10VNDG/pages', { headers })).json()).toEqual({ path: '/api/consistency/sites/10VNDG/api/pages', method: 'GET' });
  expect(await (await call('10VNDG/page?path=%2Fen%2F&other=1', { headers })).json()).toEqual({ path: '/api/consistency/sites/10VNDG/api/page?path=%2Fen%2F', method: 'GET' });
  expect((await call('10VNDG/edit', edit({ origin: 'https://c9y.site' }))).status).toBe(403);
  expect((await call('10VNDG/edit', edit({ origin: 'https://evil.test' }))).status).toBe(403);
  expect((await call('10VNDG/edit', edit({ type: 'text/plain' }))).status).toBe(403);
  expect((await call('10VNDG/edit', edit({ body: 'x'.repeat(EDIT_BYTES + 1) }))).status).toBe(413);
  expect(workspace.fetch).toHaveBeenCalledTimes(2);
  const saved = await call('10VNDG/edit', edit());
  expect(await saved.json()).toEqual({ path: '/api/consistency/sites/10VNDG/api/edit', method: 'POST' });
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
  // A library that pins a Google face draws it in the frame: its stylesheet from one host, its files from the other, and nothing else off this origin.
  const directive = (policy: string, name: string) => policy.split(';').map(part => part.trim()).find(part => part.startsWith(`${name} `))!;
  for (const policy of [DOCUMENT_POLICY, FILE_POLICY]) {
    expect(directive(policy, 'style-src')).toBe(`style-src ${policy === DOCUMENT_POLICY ? "'self' " : ''}'unsafe-inline' ${FACE_HOSTS.styles}`);
    expect(directive(policy, 'font-src')).toBe(`font-src 'self' data: ${FACE_HOSTS.fonts}`);
    expect(directive(policy, 'default-src')).toBe("default-src 'none'"); expect(policy).not.toMatch(/script-src|connect-src|allow-scripts/);
    expect(policy.match(/https:\/\/[\w.-]+/g)).toEqual([FACE_HOSTS.styles, FACE_HOSTS.fonts]);
  }
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

const write = (method: string, body: string, init: { origin?: string; type?: string } = {}) => ({ method, headers: { ...headers, origin: init.origin ?? origin, 'Content-Type': init.type ?? 'application/json' }, body });
const id = '0f0e0d0c-0b0a-4908-8706-050403020100';

it('keeps site composition behind the same identity, origin, path and size checks', async () => {
  const { call, workspace } = setup();
  const route = '10VNDG/api/composition?path=%2Fen%2F';
  expect((await call(route)).status).toBe(401);
  expect((await setup('other').call(route, { headers })).status).toBe(403);
  expect((await call('10VNDG/api/composition', { headers })).status).toBe(400);
  expect((await call('10VNDG/api/composition?path=//evil.test/', { headers })).status).toBe(400);
  expect((await call(route, write('POST', '{}'))).status).toBe(405);
  expect((await call(route, write('PUT', '{}', { origin: 'https://evil.test' }))).status).toBe(403);
  expect((await call(route, write('PUT', '{}', { type: 'text/plain' }))).status).toBe(403);
  expect((await call(route, write('PUT', 'x'.repeat(EDIT_BYTES + 1)))).status).toBe(413);
  expect(workspace.fetch).not.toHaveBeenCalled();
  expect(await (await call(route, { headers })).json()).toEqual({ path: '/api/consistency/sites/10VNDG/api/composition?path=%2Fen%2F', method: 'GET' });
  const body = JSON.stringify({ build: 'current', base: 'structure', revision: 4, document: { schema: 1, nodes: {}, order: {} } });
  const saved = await call(route, write('PUT', body));
  expect(saved.status).toBe(200);
  expect(await workspace.fetch.mock.calls[1]![0].text()).toBe(body);
  expect(workspace.fetch.mock.calls[1]![0].headers.get('X-C9y-Actor')).toBe('owner');
  expect(saved.headers.get('cache-control')).toBe('private, no-store');
});

it('protects native page documents and forwards only bounded authenticated writes', async () => {
  const { call, workspace } = setup();
  const route = '10VNDG/api/native-page?path=%2Fshop';
  expect((await call(route)).status).toBe(401);
  expect((await setup('other').call(route, { headers })).status).toBe(403);
  for (const query of ['', '?path=//evil.test/', '?path=%2Fshop%00'])
    expect((await call('10VNDG/api/native-page' + query, { headers })).status).toBe(400);
  expect((await call(route, write('POST', '{}'))).status).toBe(405);
  expect((await call(route, write('PUT', '{}', { origin: 'https://evil.test' }))).status).toBe(403);
  expect((await call(route, write('PUT', '{}', { type: 'text/plain' }))).status).toBe(403);
  expect((await call(route, write('PUT', 'x'.repeat(NATIVE_PAGE_BYTES + 1)))).status).toBe(413);
  expect(workspace.fetch).not.toHaveBeenCalled();
  expect(await (await call(route, { headers })).json()).toEqual({ path: '/api/consistency/sites/10VNDG/api/native-page?path=%2Fshop', method: 'GET' });
  const body = JSON.stringify({ build: 'current', base: 'structure', revision: 4, document: { schema: 1, kind: 'native-page', blocks: [] }, padding: 'x'.repeat(EDIT_BYTES) });
  const saved = await call(route, write('PUT', body));
  expect(saved.status).toBe(200);
  const forwarded = workspace.fetch.mock.calls[1]![0];
  expect(await forwarded.text()).toBe(body);
  expect(forwarded.headers.get('X-C9y-Actor')).toBe('owner');
  expect(saved.headers.get('cache-control')).toBe('private, no-store');
  expect((await call('10VNDG/api/native-page/history?path=%2Fshop', { headers })).status).toBe(404);
});

it('passes on exactly the platform\'s allowlist of a site\'s API, each route by its own methods', async () => {
  for (const [route, method] of [['me', 'GET'], ['history', 'GET'], ['detached', 'GET'], ['reset', 'POST'], ['emails', 'GET'], ['emails/templates', 'GET'], ['emails/a_b-1', 'GET'], ['bookings', 'GET'], [`bookings/${id}`, 'GET'], [`bookings/${id}/cancel`, 'POST'], ['booking-offers', 'PUT'], ['booking-settings', 'GET'], ['giftcards', 'POST'], [`giftcards/${id}/pdf`, 'GET'], [`giftcards/${id}/void`, 'POST'], [`giftcards/${id}/resend`, 'POST'], ['business', 'POST'],
    ['orders', 'GET'], ['orders/config', 'GET'], [`orders/${id}`, 'GET'], [`orders/${id}/confirm`, 'POST'], [`orders/${id}/cancel`, 'POST'], [`orders/${id}/mark-paid`, 'POST'],
    [`orders/${id}/invoice`, 'POST'], [`orders/${id}/fulfil`, 'POST'], [`orders/${id}/note`, 'PUT'], ['order-settings', 'GET'], ['order-settings', 'PUT']])
    expect(apiRoute(route!)?.methods, `${method} ${route}`).toContain(method);
  const { call, workspace } = setup();
  // The site's library, its theme: read, set and taken away, each the platform's own route.
  for (const method of ['GET', 'PUT', 'DELETE']) expect(apiRoute('library')?.methods, `${method} library`).toContain(method);
  expect(apiRoute('library')?.methods).not.toContain('POST'); expect(apiRoute('library/x')).toBeNull(); expect(apiRoute('libraries')).toBeNull();
  for (const route of ['editors', 'report', 'code', 'verify', 'sign-out', 'analytics', 'flags', 'pages/', 'bookings/nope', `giftcards/${id}/refund`, 'emails/a/b', 'library/x', 'libraries',
    'orders/Rb42Xq', `orders/${id}/pay`, `orders/${id}/expire`, `orders/${id}/note/x`, 'orders/config/x', 'order-settings/x', 'design', 'design/x'])
    expect((await call(`10VNDG/api/${route}`, { headers })).status, route).toBe(404);
  expect((await call('10VNDG/api/pages', write('POST', '{}'))).status).toBe(405);
  expect((await call('10VNDG/api/booking-offers', write('POST', '{}'))).status).toBe(405);
  expect((await call(`10VNDG/api/bookings/${id}`, { method: 'DELETE', headers: { ...headers, origin } })).status).toBe(405);
  expect((await call('10VNDG/api/business', { headers })).status).toBe(405);
  expect((await call('10VNDG/api/orders', write('POST', '{}'))).status).toBe(405);
  expect((await call(`10VNDG/api/orders/${id}/confirm`, { headers })).status).toBe(405);
  expect((await call(`10VNDG/api/orders/${id}/note`, write('POST', '{}'))).status).toBe(405);
  expect((await call('10VNDG/api/order-settings', write('POST', '{}'))).status).toBe(405);
  expect((await call('10VNDG/api/design', write('PUT', '{}'))).status).toBe(404);
  expect((await call('10VNDG/api/library', write('POST', '{}'))).status).toBe(405);
  expect((await call('10VNDG/places', write('POST', '{}'))).status).toBe(405);
  expect(workspace.fetch).not.toHaveBeenCalled();
});

it('asks the owner first for the API and the places too', async () => {
  const { call, workspace } = setup();
  expect((await call('10VNDG/api/bookings')).status).toBe(401);
  expect((await call('10VNDG/places')).status).toBe(401);
  expect((await call('10VNDG/api/business', { ...write('POST', '{}'), headers: { origin, 'Content-Type': 'application/json' } })).status).toBe(401);
  expect((await setup('other').call('10VNDG/places', { headers })).status).toBe(403);
  expect(workspace.fetch).not.toHaveBeenCalled();
});

it('passes a route\'s query string on, and the places, to the platform', async () => {
  const { call } = setup();
  expect(await (await call('10VNDG/api/bookings?from=2026-10-01&status=confirmed', { headers })).json()).toEqual({ path: '/api/consistency/sites/10VNDG/api/bookings?from=2026-10-01&status=confirmed', method: 'GET' });
  expect(await (await call('10VNDG/api/history?path=%2F&key=0123456789ab', { headers })).json()).toEqual({ path: '/api/consistency/sites/10VNDG/api/history?path=%2F&key=0123456789ab', method: 'GET' });
  expect(await (await call('10VNDG/api/page?path=%2F&other=1', { headers })).json()).toEqual({ path: '/api/consistency/sites/10VNDG/api/page?path=%2F', method: 'GET' });
  expect((await call('10VNDG/api/page', { headers })).status).toBe(400);
  expect((await call(`10VNDG/api/pages?${'q=x&'.repeat(600)}`, { headers })).status).toBe(400);
  expect(await (await call('10VNDG/places', { headers })).json()).toEqual({ path: '/api/consistency/sites/10VNDG/places', method: 'GET' });
});

it('takes a write to the API as same-origin JSON within its bound: the engine\'s 64 KiB, Flavo\'s business 1 MB', async () => {
  const { call, workspace } = setup();
  expect((await call('10VNDG/api/reset', write('POST', '{}', { origin: 'https://evil.test' }))).status).toBe(403);
  expect((await call('10VNDG/api/booking-settings', write('PUT', '{}', { type: 'text/plain' }))).status).toBe(403);
  expect((await call(`10VNDG/api/giftcards/${id}/void`, write('POST', 'x'.repeat(EDIT_BYTES + 1)))).status).toBe(413);
  expect((await call('10VNDG/api/business', write('POST', 'x'.repeat(BUSINESS_BYTES + 1)))).status).toBe(413);
  expect(workspace.fetch).not.toHaveBeenCalled();
  const business = await call('10VNDG/api/business', write('POST', JSON.stringify({ operation: 'catalogue:staffList', args: { pad: 'y'.repeat(EDIT_BYTES) } })));
  expect(await business.json()).toEqual({ path: '/api/consistency/sites/10VNDG/api/business', method: 'POST' });
  const library = await call('10VNDG/api/library', write('PUT', '{"id":"12ABCD","version":"3"}'));
  expect(await library.json()).toEqual({ path: '/api/consistency/sites/10VNDG/api/library', method: 'PUT' });
  expect(await workspace.fetch.mock.calls[1]![0].text()).toBe('{"id":"12ABCD","version":"3"}');
  const gone = await call('10VNDG/api/library', { method: 'DELETE', headers: { ...headers, origin, 'Content-Type': 'application/json' } });
  expect(await gone.json()).toEqual({ path: '/api/consistency/sites/10VNDG/api/library', method: 'DELETE' });
  expect(await (await call('10VNDG/api/library', { headers })).json()).toEqual({ path: '/api/consistency/sites/10VNDG/api/library', method: 'GET' });
  const put = await call('10VNDG/api/booking-settings', write('PUT', '{"who":"owner"}'));
  expect(await put.json()).toEqual({ path: '/api/consistency/sites/10VNDG/api/booking-settings', method: 'PUT' });
  expect(await workspace.fetch.mock.calls[4]![0].text()).toBe('{"who":"owner"}');
  expect(put.headers.get('x-content-type-options')).toBe('nosniff');
});
