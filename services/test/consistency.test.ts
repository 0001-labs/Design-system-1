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

it('gates site-draft creation with identity, same-origin JSON, size and captured workspace', async () => {
 const { env, send } = setup();
 const workspace = { fetch: vi.fn(async (_request: Request) => Response.json({ sites: [] })) };
 const bound = { ...env, CONSISTENCY_WORKSPACE: workspace } as unknown as Parameters<typeof consistencyPreview>[1];
 const url = 'https://consistency.site/api/consistency/draft-sites/12345678-1234-4234-8234-123456789abc';
 const call = (origin: string, body: string) => consistencyPreview(new Request(url, { method: 'PUT', headers: { ...headers, Origin: origin, 'Content-Type': 'application/json', 'X-C9y-Workspace': '01STDO', 'X-C9y-Draft-Room': 'unlimited' }, body }), bound, send);
 expect((await consistencyPreview(new Request(url), bound, send)).status).toBe(401);
 expect((await call('https://other.test', '{}')).status).toBe(403);
 expect((await call('https://consistency.site', 'x'.repeat(800001))).status).toBe(413);
 expect(workspace.fetch).not.toHaveBeenCalled();
 expect((await call('https://consistency.site', '{}')).status).toBe(200);
 const forwarded = workspace.fetch.mock.calls[0]![0] as unknown as Request;
 expect(forwarded.headers.get('X-C9y-Workspace')).toBe('01STDO');
 expect(forwarded.headers.get('X-C9y-Draft-Room')).toBeNull();
});

// consistency.site, off the legacy Pages project: the landing, the legal pages, the film kit, and the way home.
const site = 'https://consistency.site';
/** Answers the platform's landing and the legacy kit by their origins; anything else is a Convex identity answer. */
function upstreams(answer: (url: string, init?: RequestInit) => Response | undefined) {
  return vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input);
    return answer(url, init) ?? Response.json({ status: 'success', value: { _id: 'owner', email: 'jaa90@icloud.com', emailVerified: true } });
  }) as unknown as typeof fetch & ReturnType<typeof vi.fn>;
}
it('draws the landing for anyone signed out, asked of the platform without cookies and without its cookies', async () => {
  const { env, assets } = setup();
  const send = upstreams(url => url.startsWith('https://consistency.c9y.site/') ? new Response('<!doctype html><html><body>Landing</body></html>', { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Set-Cookie': 'c9y=1; Path=/', 'Cache-Control': 'public, max-age=0' } }) : undefined);
  const home = await consistencyPreview(new Request(`${site}/?ref=1`, { headers: { cookie: 'tracker=1', Accept: 'text/html' } }), env, send);
  expect(home.status).toBe(200); expect(await home.text()).toContain('Landing');
  expect(home.headers.get('set-cookie')).toBeNull(); expect(home.headers.get('content-type')).toBe('text/html; charset=utf-8');
  expect(send).toHaveBeenCalledTimes(1);
  const [url, init] = send.mock.calls[0]! as [string, RequestInit];
  expect(url).toBe('https://consistency.c9y.site/?ref=1'); expect(init.redirect).toBe('manual');
  expect(Object.keys(init.headers as Record<string, string>)).toEqual(['Accept']); expect((init.headers as Record<string, string>).Accept).toBe('text/html');
  expect(assets).not.toHaveBeenCalled();
  // The landing's other addresses are the platform's too, signed in or not, and never the app's.
  for (const path of ['/index.html', '/icon.svg', '/_landing/style.css', '/sites/flavo.png', '/examples', '/examples/shop/']) {
    await consistencyPreview(new Request(site + path, { headers }), env, send);
    expect(send.mock.calls.at(-1)![0]).toBe('https://consistency.c9y.site' + path);
  }
  expect(assets).not.toHaveBeenCalled();
  expect((await consistencyPreview(new Request(`${site}/examples`, { method: 'POST' }), env, send)).status).toBe(405);
});
it('brings the landing\'s own redirects back to consistency.site and leaves others alone', async () => {
  const { env } = setup();
  const send = upstreams(url => url.includes('/examples?') ? new Response(null, { status: 302, headers: { Location: 'https://consistency.c9y.site/examples/?a=1', 'Set-Cookie': 'x=1' } }) : url.includes('/examples/away') ? new Response(null, { status: 302, headers: { Location: 'https://elsewhere.example/' } }) : undefined);
  const moved = await consistencyPreview(new Request(`${site}/examples?a=1`), env, send);
  expect(moved.status).toBe(302); expect(moved.headers.get('location')).toBe('https://consistency.site/examples/?a=1'); expect(moved.headers.get('set-cookie')).toBeNull();
  expect((await consistencyPreview(new Request(`${site}/examples/away`), env, send)).headers.get('location')).toBe('https://elsewhere.example/');
});
it('answers the legal pages itself', async () => {
  const { env, assets } = setup();
  const send = upstreams(() => undefined);
  for (const [path, title] of [['/privacy', 'Privacy Policy'], ['/terms', 'Terms of Use'], ['/cookies', 'Cookie Policy'], ['/acceptable-use', 'Acceptable Use Policy'], ['/tokushoho', '特定商取引法に基づく表記']]) {
    const page = await consistencyPreview(new Request(site + path), env, send);
    expect(page.status).toBe(200); expect(page.headers.get('content-type')).toBe('text/html; charset=utf-8'); expect(page.headers.get('cache-control')).toBe('public, max-age=3600');
    expect(await page.text()).toContain(`<title>${title} · Consistency</title>`);
  }
  expect(await (await consistencyPreview(new Request(`${site}/privacy`, { method: 'HEAD' }), env, send)).text()).toBe('');
  expect((await consistencyPreview(new Request(`${site}/privacy`, { method: 'POST' }), env, send)).status).toBe(405);
  expect(send).not.toHaveBeenCalled(); expect(assets).not.toHaveBeenCalled();
});
it('leads every other address of consistency.site to the front page, and finds nothing there for other methods', async () => {
  const { env, assets } = setup();
  const send = upstreams(() => undefined);
  for (const path of ['/team', '/team/', '/edit', '/edit/home', '/login', '/admin', '/flags', '/api/legacy/sites', '/some-page?x=1', '/app/libraries', '/api/dashboard/other']) {
    const answer = await consistencyPreview(new Request(site + path, { headers }), env, send);
    expect([path, answer.status]).toEqual([path, 302]); expect(answer.headers.get('location')).toBe('/');
  }
  expect((await consistencyPreview(new Request(`${site}/login`, { method: 'POST', headers }), env, send)).status).toBe(404);
  expect(send).not.toHaveBeenCalled(); expect(assets).not.toHaveBeenCalled();
});
it('passes the film kit on from the legacy build with the kit\'s own headers, for Visual\'s films', async () => {
  const { env, assets } = setup();
  const send = upstreams(url => url === 'https://consistency.pages.dev/kit/latest.json' ? Response.json({ revision: 'r1' }, { headers: { 'Set-Cookie': 'x=1' } }) : url === 'https://consistency.pages.dev/kit/r1/kit.js' ? new Response('kit', { headers: { 'Content-Type': 'text/javascript' } }) : url.startsWith('https://consistency.pages.dev/') ? new Response('nope', { status: 404 }) : undefined);
  const latest = await consistencyPreview(new Request(`${site}/kit/latest.json?v=2`, { headers: { Origin: 'https://visual.example' } }), env, send);
  expect(latest.status).toBe(200); expect(await latest.json()).toEqual({ revision: 'r1' });
  expect(latest.headers.get('access-control-allow-origin')).toBe('*'); expect(latest.headers.get('cache-control')).toBe('no-cache'); expect(latest.headers.get('cross-origin-resource-policy')).toBe('cross-origin'); expect(latest.headers.get('set-cookie')).toBeNull();
  expect(send.mock.calls[0]![0]).toBe('https://consistency.pages.dev/kit/latest.json');
  const file = await consistencyPreview(new Request(`${site}/kit/r1/kit.js`), env, send);
  expect(file.status).toBe(200); expect(file.headers.get('cache-control')).toBe('public, max-age=31536000, immutable'); expect(file.headers.get('content-type')).toBe('text/javascript');
  expect((await consistencyPreview(new Request(`${site}/kit/r1/kit.js`, { method: 'OPTIONS' }), env, send)).status).toBe(204);
  const missing = await consistencyPreview(new Request(`${site}/kit/r2/kit.js`), env, send);
  expect(missing.status).toBe(404); expect(missing.headers.get('cache-control')).toBe('no-store');
  const calls = send.mock.calls.length;
  for (const path of ['/kit/', '/kit/r1/', '/kit/.env', '/kit/r1/.hidden/kit.js']) expect((await consistencyPreview(new Request(site + path), env, send)).status).toBe(404);
  expect(send.mock.calls.length).toBe(calls);
  expect((await consistencyPreview(new Request(`${site}/kit/r1/kit.js`, { method: 'POST' }), env, send)).status).toBe(405);
  expect(assets).not.toHaveBeenCalled();
});
it('keeps the app\'s own addresses on consistency.site as they were', async () => {
  const { env, assets } = setup();
  const send = upstreams(() => undefined);
  const elsewhere = () => send.mock.calls.filter(([url]) => !String(url).startsWith('https://example.convex.cloud/')).length;
  for (const path of ['/app/signin', '/app/assets/login.js', '/icons/design-system-1.svg']) expect((await consistencyPreview(new Request(site + path), env, send)).status).toBe(200);
  expect(assets).toHaveBeenCalledTimes(3);
  // consistency.site asks the owner's System sign-in quietly first (consistency-owner.ts).
  const gated = await consistencyPreview(new Request(`${site}/private-consistency/index.html`), env, send);
  expect(gated.status).toBe(302); expect(gated.headers.get('location')).toBe('/auth/start?silent=1');
  const home = await consistencyPreview(new Request(`${site}/`, { headers }), env, send);
  expect(home.status).toBe(200); expect(new URL(assets.mock.calls.at(-1)![0].url).pathname).toBe('/private-consistency/home.html');
  expect((await consistencyPreview(new Request(`${site}/api/consistency/profile`), env, send)).status).toBe(401);
  expect((await consistencyPreview(new Request(`${site}/api/dashboard/session`, { method: 'POST', headers: { origin: site, authorization: 'Bearer valid-token' } }), env, send)).status).toBe(204);
  expect(elsewhere()).toBe(0);
});
