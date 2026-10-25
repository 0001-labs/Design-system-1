import { expect, it, vi } from 'vite-plus/test';
import { consistencyPreview } from '../src/consistency';
import type { ReportsEnv } from '../src/reports';
const origin = 'https://neweditor.c9y.site';
function setup(id = 'owner', verified = true) {
  const assets = vi.fn(async (_request: Request) => new Response('private bytes'));
  const env = { REPORTS_OWNER_ID: 'owner', REPORTS_AUTH_URL: 'https://example.convex.cloud', ASSETS: { fetch: assets } } as unknown as ReportsEnv & { ASSETS: Fetcher };
  const send = vi.fn(async () => Response.json({ status: 'success', value: { _id: id, email: 'jaa90@icloud.com', emailVerified: verified } }));
  return { assets, env, send };
}
const headers = { cookie: '__Host-ds1-dashboard=valid-token' };
it.each(['/', '/private-consistency/index.html', '/private-consistency/assets/editor.js'])('gates anonymous files %s', async path => {
  const { env, assets, send } = setup();
  const result = await consistencyPreview(new Request(origin + path), env, send);
  expect(result.status).toBe(302); expect(result.headers.get('location')).toBe('/app/signin'); expect(assets).not.toHaveBeenCalled();
});
it.each([['other', true], ['owner', false]] as const)('denies unauthorized identity %s %s', async (id, verified) => {
  const { env, assets, send } = setup(id, verified);
  expect((await consistencyPreview(new Request(origin, { headers }), env, send)).status).toBe(403); expect(assets).not.toHaveBeenCalled();
});
it('revalidates owner on every HTML and asset and maps root', async () => {
  const { env, assets, send } = setup();
  for (const path of ['/', '/private-consistency/assets/editor.js']) {
    const result = await consistencyPreview(new Request(origin + path, { headers }), env, send);
    expect(result.status).toBe(200); expect(result.headers.get('cache-control')).toBe('private, no-store');
  }
  expect(send).toHaveBeenCalledTimes(2); expect(new URL(assets.mock.calls[0]![0].url).pathname).toBe('/private-consistency/home.html');
});
it.each(['https://designsystem1.com', 'https://worker.workers.dev', 'https://adoption.designsystem1.com', 'http://neweditor.c9y.site'])('blocks alternate origin %s', async host => {
  const { env, assets, send } = setup();
  expect((await consistencyPreview(new Request(host + '/private-consistency/index.html', { headers }), env, send)).status).toBe(404); expect(assets).not.toHaveBeenCalled();
});
it('serves sign-in shell/assets and creates only a same-origin host-only owner session', async () => {
  const { env, assets, send } = setup();
  for (const path of ['/app/signin', '/app/assets/login.js']) expect((await consistencyPreview(new Request(origin + path), env, send)).status).toBe(200);
  expect(send).not.toHaveBeenCalled();
  expect((await consistencyPreview(new Request(origin + '/app/libraries'), env, send)).status).toBe(404);
  const result = await consistencyPreview(new Request(origin + '/api/dashboard/session', { method: 'POST', headers: { origin, authorization: 'Bearer valid-token' } }), env, send);
  expect(result.status).toBe(204); expect(result.headers.get('set-cookie')).toContain('Path=/; HttpOnly; Secure; SameSite=Strict'); expect(result.headers.get('set-cookie')).not.toContain('Domain='); expect(assets).toHaveBeenCalledTimes(2);
  expect((await consistencyPreview(new Request(origin + '/api/dashboard/session', { method: 'POST', headers: { origin: 'https://evil.test', authorization: 'Bearer valid-token' } }), env, send)).status).toBe(403);
});

it('marks only authenticated preview HTML, preserving public shell, assets and HEAD', async () => {
  const { env, assets, send } = setup();
  assets.mockImplementation(async request => new Response(request.method === 'HEAD' ? null : '<!doctype html><html lang="en"><body>Preview</body></html>', { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': '70', ETag: 'old' } }));
  const anonymous = await consistencyPreview(new Request(origin), env, send);
  expect(await anonymous.text()).not.toContain('data-ds-owner');
  const shell = await consistencyPreview(new Request(origin + '/app/signin'), env, send);
  expect(await shell.text()).not.toContain('data-ds-owner');
  const marked = await consistencyPreview(new Request(origin, { headers }), env, send);
  expect(await marked.text()).toContain('<html data-ds-owner lang="en">');
  expect(marked.headers.has('content-length')).toBe(false); expect(marked.headers.has('etag')).toBe(false);
  const head = await consistencyPreview(new Request(origin, { method: 'HEAD', headers }), env, send);
  expect(await head.text()).toBe(''); expect(head.headers.get('etag')).toBe('old');
  assets.mockImplementation(async () => new Response('const html = "<html>";', { headers: { 'Content-Type': 'text/javascript' } }));
  const script = await consistencyPreview(new Request(origin + '/private-consistency/assets/editor.js', { headers }), env, send);
  expect(await script.text()).toBe('const html = "<html>";');
});

it.each(['/app/assets/%2f..%2f..%2fprivate-consistency/index.html', '/app/assets/nested/editor.js'])('rejects noncanonical public asset paths %s', async path => {
  const { env, assets, send } = setup();
  expect((await consistencyPreview(new Request(origin + path), env, send)).status).toBe(404);
  expect(assets).not.toHaveBeenCalled();
});

it('protects workspace reads and writes and forwards only bounded same-origin owner requests',async()=>{
 const {env,send}=setup(); const workspace={fetch:vi.fn(async()=>Response.json({pages:[]}))};const bound={...env,CONSISTENCY_WORKSPACE:workspace} as unknown as Parameters<typeof consistencyPreview>[1];
 const url='https://c9y.site/api/consistency/pages';
 expect((await consistencyPreview(new Request(url),bound,send)).status).toBe(401);
 expect(workspace.fetch).not.toHaveBeenCalled();
 expect((await consistencyPreview(new Request(url,{headers}),bound,send)).status).toBe(200);
 const write=(origin:string,body:string)=>new Request(url+'/home',{method:'PUT',headers:{...headers,origin,'Content-Type':'application/json'},body});
 expect((await consistencyPreview(write('https://evil.test','{}'),bound,send)).status).toBe(403);
 expect((await consistencyPreview(write('https://c9y.site','x'.repeat(800001)),bound,send)).status).toBe(413);
 expect(workspace.fetch).toHaveBeenCalledTimes(1);
 expect((await consistencyPreview(write('https://c9y.site','{}'),bound,send)).status).toBe(200);
});
it('denies a non-owner workspace account before invoking storage',async()=>{
 const {env,send}=setup('other');const workspace={fetch:vi.fn()};
 const response=await consistencyPreview(new Request('https://c9y.site/api/consistency/pages',{headers}),{...env,CONSISTENCY_WORKSPACE:workspace} as unknown as Parameters<typeof consistencyPreview>[1],send);
 expect(response.status).toBe(403);expect(workspace.fetch).not.toHaveBeenCalled();
});
it('gives the owner their company name for the home, and nobody else anything', async () => {
  const url = 'https://c9y.site/api/consistency/profile';
  const answers = (id: string, companyName: string) => vi.fn(async (_url: string, init?: RequestInit) => JSON.parse(String(init?.body)).path === 'users:profile'
    ? Response.json({ status: 'success', value: { companyName } })
    : Response.json({ status: 'success', value: { _id: id, email: 'jaa90@icloud.com', emailVerified: true } }));
  const { env } = setup();
  const owner = answers('owner', '0001');
  const read = await consistencyPreview(new Request(url, { headers }), env, owner as unknown as typeof fetch);
  expect(read.status).toBe(200); expect(await read.json()).toEqual({ companyName: '0001' });
  expect(owner.mock.calls.every(([, init]) => new Headers(init?.headers).get('authorization') === 'Bearer valid-token')).toBe(true);
  expect((await consistencyPreview(new Request(url), env, owner as unknown as typeof fetch)).status).toBe(401);
  const other = answers('other', 'Elsewhere');
  expect((await consistencyPreview(new Request(url, { headers }), env, other as unknown as typeof fetch)).status).toBe(403);
  expect(other.mock.calls.some(([, init]) => JSON.parse(String(init?.body)).path === 'users:profile')).toBe(false);
  expect((await consistencyPreview(new Request(url, { method: 'POST', headers }), env, owner as unknown as typeof fetch)).status).toBe(405);
});
