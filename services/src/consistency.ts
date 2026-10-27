/** Private editor preview. Every preview file is authorized before reaching Assets. */
import { dashboard, ownerSessionCookie, sessionRequest } from './dashboard';
import { authorizeReport, isStudioOwner, signedIn, type ReportsEnv } from './reports';
import { hasOwnerSignIn, ownerRoutes, ownerSignOut, systemOwner, type OwnerEnv } from './consistency-owner';
import { personHeaders, sitesApi, type Person } from './consistency-sites';
import { isLegalPath, legalPage } from './consistency-legal';

export const CONSISTENCY_HOST = 'c9y.site';
/** The owner's editor lab: the page editor alone, at its root, behind the verified owner session. */
export const EDITOR_HOST = 'editor.c9y.site';
/** The lab's first address, which now leads to EDITOR_HOST. */
const FORMER_EDITOR_HOST = 'neweditor.c9y.site';
/**
 * Consistency's product address, all of it this Worker's: its app for anyone signed in, at the front page and the
 * addresses below; the landing for everyone else; the legal pages; the film kit; and the way to the front page from
 * every other address (the legacy app's pages among them).
 */
export const APP_HOST = 'consistency.site';
/**
 * Where the landing lives: the platform site `consistency` (Consistency/site), edited there like every platform
 * site. consistency.site asks it without the visitor's cookies, so what it shows is the published page every
 * visitor sees.
 */
export const LANDING_ORIGIN = 'https://consistency.c9y.site';
/** The legacy Pages build, which still holds the film kit (`vp run film:kit`, dist/kit) Visual's films load. */
export const FILM_KIT_ORIGIN = 'https://consistency.pages.dev';
const FILM_KIT_PREFIX = '/kit/';
export const isConsistencyHost = (host:string) => [CONSISTENCY_HOST, APP_HOST, EDITOR_HOST, FORMER_EDITOR_HOST].includes(host);
/** The addresses the app answers on consistency.site, besides its front page. */
export function isAppPath(path: string): boolean {
  return /^\/(?:auth|private-consistency)(?:\/|$)/.test(path) || path.startsWith('/api/consistency/') || path === '/api/dashboard/session' || path === '/app/signin' || /^\/app\/assets\//.test(path) || path === '/icons/design-system-1.svg';
}
export interface WorkspaceEnv extends OwnerEnv { CONSISTENCY_WORKSPACE?: Fetcher }
const prefix = '/private-consistency/';
/** Normalize only for interception. Assets must never decode a private path on another host. */
export function isPrivatePreviewPath(path: string): boolean {
  let decoded = path;
  for (let count = 0; count < 4; count++) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch { break; }
  }
  const canonical = new URL(decoded.replace(/\\/g, '/').replace(/^\/+/, '/'), 'https://private.invalid').pathname.toLowerCase();
  return canonical.startsWith('/private-consistency');
}
const security = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow', 'Referrer-Policy': 'same-origin', 'X-Content-Type-Options': 'nosniff', Vary: 'Cookie, Authorization' };
/**
 * Who asks in Consistency's app: the owner, who sees every workspace, or, at consistency.site alone, anyone signed in
 * with a verified address, who sees the workspaces they were invited to (the platform decides which). The lab and
 * c9y.site stay the owner's.
 */
export async function authorizePerson(request: Request, env: ReportsEnv & WorkspaceEnv, send: typeof fetch): Promise<Person | Response> {
  if (await systemOwner(request, env)) return { owner: true };
  const identity = await signedIn(sessionRequest(request), env, send);
  if (identity instanceof Response) return identity;
  if (isStudioOwner(identity, env)) return { owner: true };
  const email = identity.email?.trim().toLowerCase();
  if (new URL(request.url).hostname !== APP_HOST || identity.emailVerified !== true || !email) return Response.json({ error: 'This is private to the studio owner.' }, { status: 403 });
  return { owner: false, email };
}
/** The landing's own addresses on consistency.site: its pages (home and examples), its assets and its pictures. */
export function isLandingPath(path: string): boolean {
  return path === '/' || path === '/index.html' || path === '/icon.svg' || path.startsWith('/_landing/') || path.startsWith('/sites/') || path === '/examples' || path.startsWith('/examples/');
}
/**
 * The landing, as the platform serves it at LANDING_ORIGIN: asked for with the visitor's Accept alone, never
 * their cookies, a redirect of its own brought back to consistency.site, and no cookie of the platform's set here.
 */
export async function landing(request: Request, send: typeof fetch = fetch): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'HEAD') return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
  const url = new URL(request.url);
  const upstream = await send(new URL(url.pathname + url.search, LANDING_ORIGIN).toString(), { method: request.method, headers: { Accept: request.headers.get('Accept') ?? '*/*' }, redirect: 'manual' });
  const response = new Response(upstream.body, upstream);
  const location = upstream.headers.get('Location');
  if (location) {
    const moved = new URL(location, LANDING_ORIGIN);
    if (moved.origin === LANDING_ORIGIN) response.headers.set('Location', url.origin + moved.pathname + moved.search);
  }
  response.headers.delete('Set-Cookie');
  return response;
}
/** The headers a kit's file goes out with (Film kit's serve.ts): any origin may read it, a revision never changes, latest.json is checked every load. */
function filmKitHeaders(path: string): Record<string, string> {
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS', 'Cross-Origin-Resource-Policy': 'cross-origin', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': path.endsWith('/latest.json') ? 'no-cache' : 'public, max-age=31536000, immutable' };
}
/**
 * The film kit at /kit/*, which Visual's films load from consistency.site (Visual/scenes/kits/hosts.js), passed on
 * from the legacy Pages build at FILM_KIT_ORIGIN with the kit's own headers, until the kit is rebuilt elsewhere.
 * Nothing in it is private: a kit is the app's own code on made-up records. Asked plainly, so the answer is the
 * file or nothing.
 */
export async function filmKit(request: Request, send: typeof fetch = fetch): Promise<Response> {
  const url = new URL(request.url);
  const headers = filmKitHeaders(url.pathname);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', { status: 405, headers });
  const missing = () => new Response('Not found', { status: 404, headers: { ...headers, 'Cache-Control': 'no-store' } });
  // No listings and no way out of the folder.
  if (url.pathname.endsWith('/') || url.pathname.includes('/.') || url.pathname.includes('..')) return missing();
  const upstream = await send(new URL(url.pathname, FILM_KIT_ORIGIN).toString(), { method: request.method, redirect: 'manual' });
  if (!upstream.ok) return missing();
  const response = new Response(upstream.body, upstream);
  for (const [name, value] of Object.entries(headers)) response.headers.set(name, value);
  response.headers.delete('Set-Cookie');
  return response;
}
/**
 * An address of consistency.site that is not the app's: the landing's, a legal page, the film kit, or the way to
 * the front page (the legacy app's pages, a site's /team and /edit among them). Nothing else is served, so a method
 * other than GET and HEAD finds nothing there.
 */
async function consistencySite(request: Request, send: typeof fetch): Promise<Response> {
  const url = new URL(request.url);
  if (isLandingPath(url.pathname)) return landing(request, send);
  if (isLegalPath(url.pathname)) return legalPage(request);
  if (url.pathname.startsWith(FILM_KIT_PREFIX)) return filmKit(request, send);
  if (request.method !== 'GET' && request.method !== 'HEAD') return new Response(null, { status: 404, headers: security });
  return new Response(null, { status: 302, headers: { Location: '/', 'Cache-Control': 'no-store' } });
}
function protect(response: Response): Response {
  const result = new Response(response.body, response);
  for (const [key, value] of Object.entries(security)) result.headers.set(key, value);
  return result;
}
export async function consistencyPreview(request: Request, env: ReportsEnv & WorkspaceEnv & { ASSETS: Fetcher }, send: typeof fetch = fetch): Promise<Response> {
  const url = new URL(request.url);
  if (!isConsistencyHost(url.hostname) || url.protocol !== 'https:') return new Response(null, { status: 404, headers: security });
  if (url.hostname === FORMER_EDITOR_HOST) return new Response(null, { status: 301, headers: { ...security, Location: `https://${EDITOR_HOST}${url.pathname}${url.search}` } });
  // c9y.site is where customers' sites live; its home is the app at consistency.site now.
  if (url.hostname === CONSISTENCY_HOST && url.pathname === '/' && ['GET', 'HEAD'].includes(request.method)) return new Response(null, { status: 302, headers: { ...security, Location: `https://${APP_HOST}/` } });
  if (url.hostname === APP_HOST && url.pathname !== '/' && !isAppPath(url.pathname)) return consistencySite(request, send);
  const signingIn = await ownerRoutes(request, env);
  if (signingIn) return protect(signingIn);
  // Signing out ends the System session behind the owner's token too, on every Consistency site.
  if (url.pathname === '/api/dashboard/session' && request.method === 'DELETE') {
    const cleared = await ownerSignOut(request, env).then(value => ({ value }), () => null);
    if (!cleared) return protect(Response.json({ error: 'Could not sign out. Try again.' }, { status: 503 }));
    const response = protect(await dashboard(request, env, send));
    if (cleared.value) response.headers.append('Set-Cookie', cleared.value);
    return response;
  }
  // At consistency.site anyone signed in with a verified address keeps a session; the platform decides what they open.
  if (url.hostname === APP_HOST && url.pathname === '/api/dashboard/session' && request.method === 'POST') {
    if (request.headers.get('origin') !== url.origin) return protect(new Response(null, { status: 403 }));
    const person = await authorizePerson(request, env, send);
    if (person instanceof Response) return protect(person);
    const session = ownerSessionCookie(request);
    if (!session) return protect(new Response(null, { status: 401 }));
    return protect(new Response(null, { status: 204, headers: { 'Set-Cookie': session } }));
  }
  if (url.pathname === '/api/dashboard/session' || url.pathname === '/app/signin' || /^\/app\/assets\/[A-Za-z0-9][A-Za-z0-9._-]*$/.test(url.pathname) || url.pathname === '/icons/design-system-1.svg') return protect(await dashboard(request, env, send));
  if (url.pathname.startsWith('/api/consistency/draft-sites') || url.pathname.startsWith('/api/consistency/pages') || url.pathname === '/api/consistency/sites' || url.pathname === '/api/consistency/workspaces' || url.pathname.startsWith('/api/consistency/workspaces/')) return protect(await workspaceApi(request,env,send));
  // A site's words, edited in the editor as the person asking; its page and files for the editor's sandboxed frame.
  if (url.pathname.startsWith('/api/consistency/sites/')) return protect(await sitesApi(request, env, asking => authorizePerson(asking, env, send)));
  if (url.pathname === '/api/consistency/domains' || url.pathname.startsWith('/api/consistency/domains/')) return protect(await domainsApi(request, env, send));
  if (url.pathname === '/api/consistency/profile') return protect(await profileApi(request, env, send));
  if (!['GET', 'HEAD'].includes(request.method)) return new Response(null, { status: 404, headers: security });
  if (url.pathname !== '/' && !url.pathname.startsWith(prefix)) return new Response(null, { status: 404, headers: security });
  const person = await authorizePerson(request, env, send);
  const denied = person instanceof Response ? person : null;
  // Signed out, consistency.site's front page is the landing.
  if (denied && url.hostname === APP_HOST && url.pathname === '/') return landing(request, send);
  if (denied) {
    // Where the owner signs in through System, ask it quietly first: signed in there, signed in here.
    if (denied.status === 401) return new Response(null, { status: 302, headers: { ...security, Location: hasOwnerSignIn(url) ? '/auth/start?silent=1' : '/app/signin', 'Set-Cookie': '__Host-ds1-dashboard=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0' } });
    return protect(denied);
  }
  // c9y.site's home lists the sites; the editor lab opens on the page editor itself.
  if (url.pathname === '/') url.pathname = url.hostname === EDITOR_HOST ? `${prefix}index.html` : `${prefix}home.html`;
  const original = await env.ASSETS.fetch(new Request(url, request));
  // This marker enables owner-only diagnostics; it grants no server access. Only
  // trusted built HTML is rewritten, after the authority has validated the owner.
  if (!(person as Person).owner) return protect(original);
  if (request.method === 'GET' && original.ok && original.headers.get('Content-Type')?.split(';')[0]?.trim().toLowerCase() === 'text/html') {
    const html = (await original.text()).replace(/<html(?=[\s>])/i, '<html data-ds-owner');
    const marked = new Response(html, original);
    for (const header of ['Content-Length', 'Content-Encoding', 'ETag']) marked.headers.delete(header);
    return protect(marked);
  }
  return protect(original);
}

/**
 * The owner's company name for the home's workspace header, read from their own account's profile; `PUT
 * { companyName }` from the app's own origin renames it (Settings → Account), as Account in the docs does.
 */
async function profileApi(request: Request, env: ReportsEnv, send: typeof fetch): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'PUT') return Response.json({ error: 'Method not allowed' }, { status: 405, headers: { Allow: 'GET, PUT' } });
  const write = request.method === 'PUT';
  if (write && (request.headers.get('Origin') !== new URL(request.url).origin || request.headers.get('Content-Type')?.split(';')[0] !== 'application/json')) return Response.json({ error: 'Forbidden' }, { status: 403 });
  let companyName = '';
  if (write) {
    const body = await request.text().then(text => text.length <= 1_000 ? JSON.parse(text) as { companyName?: unknown } : null).catch(() => null);
    companyName = typeof body?.companyName === 'string' ? body.companyName.trim() : '';
    if (!companyName || companyName.length > 80) return Response.json({ error: 'Use a name between 1 and 80 characters.' }, { status: 400 });
  }
  const session = sessionRequest(new Request(request.url, { headers: request.headers }));
  const denied = await authorizeReport(session, env, send);
  if (denied) return denied;
  try {
    if (write) {
      const saved = await send(`${env.REPORTS_AUTH_URL}/api/mutation`, {
        method: 'POST', headers: { authorization: session.headers.get('authorization')!, 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: 'users:setCompanyName', args: [{ companyName }], format: 'convex_encoded_json' }),
        signal: AbortSignal.timeout(8_000), redirect: 'manual',
      });
      const answer = saved.ok ? await saved.json() as { status?: string } : null;
      if (answer?.status !== 'success') return Response.json({ error: 'The name could not be saved.' }, { status: 503 });
      return Response.json({ companyName }, { headers: { 'Cache-Control': 'no-store' } });
    }
    const response = await send(`${env.REPORTS_AUTH_URL}/api/query`, {
      method: 'POST', headers: { authorization: session.headers.get('authorization')!, 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: 'users:profile', args: [{}], format: 'convex_encoded_json' }),
      signal: AbortSignal.timeout(8_000), redirect: 'manual',
    });
    const answer = response.ok ? await response.json() as { status?: string; value?: { companyName?: unknown } | null } : null;
    if (answer?.status !== 'success') return Response.json({ error: 'The profile could not be read.' }, { status: 503 });
    companyName = typeof answer.value?.companyName === 'string' ? answer.value.companyName.slice(0, 80) : '';
    return Response.json({ companyName }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return Response.json({ error: 'The profile could not be read.' }, { status: 503 }); }
}

/**
 * The workspace's own routes: its sites and its composition drafts, and the workspaces themselves (`workspaces`,
 * `workspaces/<code>` to rename, `workspaces/<code>/members[/<address>]`). The platform decides what each person may do.
 */
const WORKSPACE_ROUTE = /^\/api\/consistency\/(?:sites|draft-sites(?:\/[0-9a-f-]{36})?|workspaces(?:\/\d{2}[A-Za-z]{4}(?:\/members(?:\/[^/]{3,254})?)?)?|pages(?:\/[a-zA-Z0-9][a-zA-Z0-9_-]{0,79})?)$/;
async function workspaceApi(request:Request,env:ReportsEnv & WorkspaceEnv,send:typeof fetch):Promise<Response>{
  const url=new URL(request.url);
  if(!WORKSPACE_ROUTE.test(url.pathname))return Response.json({error:'Not found'},{status:404});
  const person=await authorizePerson(new Request(request.url,{headers:request.headers}),env,send);if(person instanceof Response)return person;
  const methods=url.pathname.startsWith('/api/consistency/pages/')||url.pathname.startsWith('/api/consistency/draft-sites/')?['GET','PUT']:/\/members\/[^/]+$/.test(url.pathname)?['DELETE']:url.pathname.endsWith('/members')?['GET','POST']:/\/workspaces\/[^/]+$/.test(url.pathname)?['PUT']:['GET'];
  if(!methods.includes(request.method))return Response.json({error:'Method not allowed'},{status:405,headers:{Allow:methods.join(', ')}});
  if(request.method!=='GET'&&request.headers.get('Origin')!==url.origin)return Response.json({error:'Forbidden'},{status:403});
  if((request.method==='PUT'||request.method==='POST')&&request.headers.get('Content-Type')?.split(';')[0]!=='application/json')return Response.json({error:'Forbidden'},{status:403});
  if(!env.CONSISTENCY_WORKSPACE)return Response.json({error:'Workspace unavailable'},{status:503});
  let body:Uint8Array|undefined;
  if(request.method==='PUT'||request.method==='POST'){
    const reader=request.body?.getReader();const chunks:Uint8Array[]=[];let size=0;
    if(reader)for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>800_000){await reader.cancel();return Response.json({error:'Document too large'},{status:413});}chunks.push(value);}
    body=new Uint8Array(size);let offset=0;for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.length;}
  }
  return env.CONSISTENCY_WORKSPACE.fetch(new Request('https://workspace.internal'+url.pathname,{method:request.method,body,headers:personHeaders(person,request,{'Content-Type':'application/json'})}));
}

/**
 * Settings → Domains: a workspace's own domains on its sites, on a plan that has them. The platform talks to
 * Cloudflare and decides when a domain is connected and who may; this gateway only checks who asks, the origin and the
 * request's shape.
 */
async function domainsApi(request: Request, env: ReportsEnv & WorkspaceEnv, send: typeof fetch): Promise<Response> {
  const url = new URL(request.url);
  const item = /^\/api\/consistency\/domains\/([a-z0-9.-]{1,253})(\/check)?$/.exec(url.pathname);
  if (url.pathname !== '/api/consistency/domains' && !item) return Response.json({ error: 'Not found' }, { status: 404 });
  const person = await authorizePerson(new Request(request.url, { headers: request.headers }), env, send); if (person instanceof Response) return person;
  const allowed = item ? (item[2] ? ['POST'] : ['DELETE']) : ['GET', 'POST'];
  if (!allowed.includes(request.method)) return Response.json({ error: 'Method not allowed' }, { status: 405 });
  const body = request.method === 'POST' && !item ? await request.text() : undefined;
  if (request.method !== 'GET') {
    if (request.headers.get('Origin') !== url.origin) return Response.json({ error: 'Forbidden' }, { status: 403 });
    if (body !== undefined && request.headers.get('Content-Type')?.split(';')[0] !== 'application/json') return Response.json({ error: 'Forbidden' }, { status: 403 });
    if (body !== undefined && body.length > 2_000) return Response.json({ error: 'Too large' }, { status: 413 });
  }
  if (!env.CONSISTENCY_WORKSPACE) return Response.json({ error: 'Workspace unavailable' }, { status: 503 });
  return env.CONSISTENCY_WORKSPACE.fetch(new Request('https://workspace.internal' + url.pathname, { method: request.method, body, headers: personHeaders(person, request, { 'Content-Type': 'application/json' }) }));
}
