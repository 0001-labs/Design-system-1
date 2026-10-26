import { expect, it, vi } from 'vite-plus/test';
import { consistencyPreview } from '../src/consistency';
import type { ReportsEnv } from '../src/reports';
const origin = 'https://editor.c9y.site';
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
  expect(send).toHaveBeenCalledTimes(2); expect(new URL(assets.mock.calls[0]![0].url).pathname).toBe('/private-consistency/index.html');
});
it('opens the app at consistency.site and leads the former editor address to the lab', async () => {
  const { env, assets, send } = setup();
  expect((await consistencyPreview(new Request('https://consistency.site/', { headers }), env, send)).status).toBe(200);
  expect(new URL(assets.mock.calls[0]![0].url).pathname).toBe('/private-consistency/home.html');
  const moved = await consistencyPreview(new Request('https://neweditor.c9y.site/private-consistency/guide/?a=1', { headers }), env, send);
  expect(moved.status).toBe(301); expect(moved.headers.get('location')).toBe('https://editor.c9y.site/private-consistency/guide/?a=1'); expect(assets).toHaveBeenCalledTimes(1);
});
it.each(['https://designsystem1.com', 'https://worker.workers.dev', 'https://adoption.designsystem1.com', 'http://editor.c9y.site'])('blocks alternate origin %s', async host => {
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
it('renames the owner\'s workspace from the app\'s own origin only', async () => {
  const url = 'https://c9y.site/api/consistency/profile';
  const { env } = setup();
  const calls: string[] = [];
  const send = vi.fn(async (_url: string, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body)); calls.push(body.path);
    if (body.path === 'users:setCompanyName') return Response.json({ status: 'success', value: null });
    return Response.json({ status: 'success', value: { _id: 'owner', email: 'jaa90@icloud.com', emailVerified: true } });
  });
  const put = (body: unknown, from = 'https://c9y.site') => consistencyPreview(new Request(url, { method: 'PUT', headers: { ...headers, Origin: from, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }), env, send as unknown as typeof fetch);
  const saved = await put({ companyName: ' 0001 ' });
  expect(saved.status).toBe(200); expect(await saved.json()).toEqual({ companyName: '0001' });
  expect(calls.at(-1)).toBe('users:setCompanyName');
  calls.length = 0;
  expect((await put({ companyName: '0001' }, 'https://evil.test')).status).toBe(403);
  expect((await put({ companyName: '  ' })).status).toBe(400);
  expect((await put({ companyName: 'x'.repeat(81) })).status).toBe(400);
  expect(calls).toEqual([]);
});

it('domains: only the owner, same-origin writes, and only the domain routes reach the platform',async()=>{
 const {env,send}=setup();const workspace={fetch:vi.fn(async(request:Request)=>Response.json({path:new URL(request.url).pathname,method:request.method}))};
 const bound={...env,CONSISTENCY_WORKSPACE:workspace} as unknown as Parameters<typeof consistencyPreview>[1];
 const base='https://c9y.site/api/consistency/domains';
 const call=(path:string,init:RequestInit={})=>consistencyPreview(new Request(base+path,init),bound,send);
 expect((await call('')).status).toBe(401);
 expect((await call('',{method:'POST',headers:{origin:'https://c9y.site','Content-Type':'application/json'},body:'{}'})).status).toBe(401);
 expect(workspace.fetch).not.toHaveBeenCalled();
 expect((await call('',{headers})).status).toBe(200);
 const json={...headers,'Content-Type':'application/json'};
 expect((await call('',{method:'POST',headers:{...json,origin:'https://evil.test'},body:'{}'})).status).toBe(403);
 expect((await call('',{method:'POST',headers:{...headers,origin:'https://c9y.site','Content-Type':'text/plain'},body:'{}'})).status).toBe(403);
 expect((await call('',{method:'POST',headers:{...json,origin:'https://c9y.site'},body:'x'.repeat(2001)})).status).toBe(413);
 expect((await call('/www.example.com',{method:'DELETE',headers:{...headers,origin:'https://evil.test'}})).status).toBe(403);
 expect((await call('',{method:'DELETE',headers:{...headers,origin:'https://c9y.site'}})).status).toBe(405);
 expect((await call('/www.example.com/check',{method:'GET',headers})).status).toBe(405);
 expect((await call('/WWW.example.com',{method:'DELETE',headers:{...headers,origin:'https://c9y.site'}})).status).toBe(404);
 expect(workspace.fetch).toHaveBeenCalledTimes(1);
 expect(await (await call('',{method:'POST',headers:{...json,origin:'https://c9y.site'},body:'{"site":"flavo","host":"a.com"}'})).json()).toEqual({path:'/api/consistency/domains',method:'POST'});
 expect(await (await call('/www.example.com/check',{method:'POST',headers:{...headers,origin:'https://c9y.site'}})).json()).toEqual({path:'/api/consistency/domains/www.example.com/check',method:'POST'});
 expect(await (await call('/www.example.com',{method:'DELETE',headers:{...headers,origin:'https://c9y.site'}})).json()).toEqual({path:'/api/consistency/domains/www.example.com',method:'DELETE'});
 const other=setup('other');
 expect((await consistencyPreview(new Request(base,{headers}),{...other.env,CONSISTENCY_WORKSPACE:workspace} as unknown as Parameters<typeof consistencyPreview>[1],other.send)).status).toBe(403);
 expect(workspace.fetch).toHaveBeenCalledTimes(4);
});

it('takes anyone signed in with a verified address at consistency.site alone, naming them to the platform itself', async () => {
  const person = (email: string, verified = true) => vi.fn(async () => Response.json({ status: 'success', value: { _id: 'client', email, emailVerified: verified } })) as unknown as typeof fetch;
  const { env } = setup();
  const workspace = { fetch: vi.fn(async (request: Request) => Response.json({ actor: request.headers.get('X-C9y-Actor'), workspace: request.headers.get('X-C9y-Workspace') })) };
  const bound = { ...env, CONSISTENCY_WORKSPACE: workspace } as unknown as Parameters<typeof consistencyPreview>[1];
  const ask = (url: string, send: typeof fetch, extra: Record<string, string> = {}) => consistencyPreview(new Request(url, { headers: { ...headers, ...extra } }), bound, send);
  // The browser cannot name someone else, and the workspace it names is passed on only as a code.
  const asked = await ask('https://consistency.site/api/consistency/sites', person(' Ada@Example.com '), { 'X-C9y-Actor': 'owner', 'X-C9y-Workspace': '12ABCD' });
  expect(await asked.json()).toEqual({ actor: 'member ada@example.com', workspace: '12ABCD' });
  expect(await (await ask('https://consistency.site/api/consistency/workspaces', person('ada@example.com'), { 'X-C9y-Workspace': '../x' })).json()).toEqual({ actor: 'member ada@example.com', workspace: null });
  expect(await (await ask('https://consistency.site/api/consistency/sites', setup().send)).json()).toEqual({ actor: 'owner', workspace: null });
  // Unverified, or on the lab or c9y.site, they are refused before the platform.
  const calls = workspace.fetch.mock.calls.length;
  expect((await ask('https://consistency.site/api/consistency/sites', person('ada@example.com', false))).status).toBe(403);
  expect((await ask('https://c9y.site/api/consistency/sites', person('ada@example.com'))).status).toBe(403);
  expect((await ask('https://editor.c9y.site/api/consistency/pages', person('ada@example.com'))).status).toBe(403);
  expect(workspace.fetch.mock.calls.length).toBe(calls);
});

it('passes members\' workspace routes on by their methods, writes same-origin JSON only', async () => {
  const { env, send } = setup();
  const workspace = { fetch: vi.fn(async (request: Request) => Response.json({ path: new URL(request.url).pathname, method: request.method })) };
  const bound = { ...env, CONSISTENCY_WORKSPACE: workspace } as unknown as Parameters<typeof consistencyPreview>[1];
  const base = 'https://consistency.site/api/consistency/workspaces/12ABCD';
  const call = (path: string, init: RequestInit = {}) => consistencyPreview(new Request(base + path, { ...init, headers: { ...headers, ...(init.headers as Record<string, string>) } }), bound, send);
  const json = { origin: 'https://consistency.site', 'Content-Type': 'application/json' };
  expect((await call('/members')).status).toBe(200);
  expect((await call('/members', { method: 'POST', headers: json, body: '{"email":"bo@example.com"}' })).status).toBe(200);
  expect((await call('/members', { method: 'POST', headers: { ...json, origin: 'https://evil.test' }, body: '{}' })).status).toBe(403);
  expect((await call('/members/bo%40example.com', { method: 'DELETE', headers: { origin: 'https://consistency.site' } })).status).toBe(200);
  expect((await call('', { method: 'PUT', headers: json, body: '{"name":"Raft"}' })).status).toBe(200);
  expect((await call('', { method: 'DELETE', headers: json })).status).toBe(405);
  expect((await call('/members', { method: 'PUT', headers: json, body: '{}' })).status).toBe(405);
  expect((await consistencyPreview(new Request('https://consistency.site/api/consistency/workspaces/nope', { headers }), bound, send)).status).toBe(404);
});

it('keeps a member\'s session at consistency.site and opens the app for them, unmarked', async () => {
  const { env, assets } = setup();
  const send = vi.fn(async () => Response.json({ status: 'success', value: { _id: 'client', email: 'ada@example.com', emailVerified: true } })) as unknown as typeof fetch;
  const session = await consistencyPreview(new Request('https://consistency.site/api/dashboard/session', { method: 'POST', headers: { origin: 'https://consistency.site', authorization: 'Bearer client-token' } }), env, send);
  expect(session.status).toBe(204); expect(session.headers.get('set-cookie')).toContain('__Host-ds1-dashboard=client-token');
  expect((await consistencyPreview(new Request('https://consistency.site/api/dashboard/session', { method: 'POST', headers: { origin: 'https://evil.test', authorization: 'Bearer client-token' } }), env, send)).status).toBe(403);
  assets.mockImplementation(async () => new Response('<!doctype html><html lang="en"></html>', { headers: { 'Content-Type': 'text/html' } }));
  const home = await consistencyPreview(new Request('https://consistency.site/', { headers }), env, send);
  expect(home.status).toBe(200); expect(await home.text()).not.toContain('data-ds-owner');
  expect(new URL(assets.mock.calls[0]![0].url).pathname).toBe('/private-consistency/home.html');
});
