/** Private editor preview. Every preview file is authorized before reaching Assets. */
import { dashboard, sessionRequest } from './dashboard';
import { authorizeReport, type ReportsEnv } from './reports';
import { hasOwnerSignIn, ownerRoutes, ownerSignOut, systemOwner, type OwnerEnv } from './consistency-owner';
import { sitesApi } from './consistency-sites';

export const CONSISTENCY_HOST = 'c9y.site';
/** The owner's editor lab: the page editor alone, at its root, behind the verified owner session. */
export const EDITOR_HOST = 'editor.c9y.site';
/** The lab's first address, which now leads to EDITOR_HOST. */
const FORMER_EDITOR_HOST = 'neweditor.c9y.site';
export const isConsistencyHost = (host:string) => [CONSISTENCY_HOST, EDITOR_HOST, FORMER_EDITOR_HOST].includes(host);
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
/** The owner: System's owner session on an address that takes it, else the existing verified owner session. */
export async function authorizeOwner(request: Request, env: ReportsEnv & WorkspaceEnv, send: typeof fetch): Promise<Response | null> {
  if (await systemOwner(request, env)) return null;
  return authorizeReport(sessionRequest(request), env, send);
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
  if (url.pathname === '/api/dashboard/session' || url.pathname === '/app/signin' || /^\/app\/assets\/[A-Za-z0-9][A-Za-z0-9._-]*$/.test(url.pathname) || url.pathname === '/icons/design-system-1.svg') return protect(await dashboard(request, env, send));
  if ((url.pathname.startsWith('/api/consistency/pages') || url.pathname==='/api/consistency/sites')) return protect(await workspaceApi(request,env,send));
  // A site's words, edited in the editor as the owner; its page and files for the editor's sandboxed frame.
  if (url.pathname.startsWith('/api/consistency/sites/')) return protect(await sitesApi(request, env, owner => authorizeOwner(owner, env, send)));
  if (url.pathname === '/api/consistency/domains' || url.pathname.startsWith('/api/consistency/domains/')) return protect(await domainsApi(request, env, send));
  if (url.pathname === '/api/consistency/profile') return protect(await profileApi(request, env, send));
  if (!['GET', 'HEAD'].includes(request.method)) return new Response(null, { status: 404, headers: security });
  if (url.pathname !== '/' && !url.pathname.startsWith(prefix)) return new Response(null, { status: 404, headers: security });
  const denied = await authorizeOwner(request, env, send);
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
  if (request.method === 'GET' && original.ok && original.headers.get('Content-Type')?.split(';')[0]?.trim().toLowerCase() === 'text/html') {
    const html = (await original.text()).replace(/<html(?=[\s>])/i, '<html data-ds-owner');
    const marked = new Response(html, original);
    for (const header of ['Content-Length', 'Content-Encoding', 'ETag']) marked.headers.delete(header);
    return protect(marked);
  }
  return protect(original);
}

/** The owner's company name for the home's workspace header, read from their own account's profile. */
async function profileApi(request: Request, env: ReportsEnv, send: typeof fetch): Promise<Response> {
  if (request.method !== 'GET') return Response.json({ error: 'Method not allowed' }, { status: 405, headers: { Allow: 'GET' } });
  const session = sessionRequest(new Request(request.url, { headers: request.headers }));
  const denied = await authorizeReport(session, env, send);
  if (denied) return denied;
  try {
    const response = await send(`${env.REPORTS_AUTH_URL}/api/query`, {
      method: 'POST', headers: { authorization: session.headers.get('authorization')!, 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: 'users:profile', args: [{}], format: 'convex_encoded_json' }),
      signal: AbortSignal.timeout(8_000), redirect: 'manual',
    });
    const answer = response.ok ? await response.json() as { status?: string; value?: { companyName?: unknown } | null } : null;
    if (answer?.status !== 'success') return Response.json({ error: 'The profile could not be read.' }, { status: 503 });
    const companyName = typeof answer.value?.companyName === 'string' ? answer.value.companyName.slice(0, 80) : '';
    return Response.json({ companyName }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return Response.json({ error: 'The profile could not be read.' }, { status: 503 }); }
}

async function workspaceApi(request:Request,env:ReportsEnv & WorkspaceEnv,send:typeof fetch):Promise<Response>{
  const url=new URL(request.url);
  if(url.pathname!=='/api/consistency/sites'&&!/^\/api\/consistency\/pages(?:\/[a-zA-Z0-9][a-zA-Z0-9_-]{0,79})?$/.test(url.pathname))return Response.json({error:'Not found'},{status:404});
  const denied=await authorizeOwner(new Request(request.url,{headers:request.headers}),env,send);if(denied)return denied;
  if(!['GET','PUT'].includes(request.method))return Response.json({error:'Method not allowed'},{status:405});
  if(request.method==='PUT'&&(request.headers.get('Origin')!==url.origin||request.headers.get('Content-Type')?.split(';')[0]!=='application/json'))return Response.json({error:'Forbidden'},{status:403});
  if(!env.CONSISTENCY_WORKSPACE)return Response.json({error:'Workspace unavailable'},{status:503});
  let body:Uint8Array|undefined;
  if(request.method==='PUT'){
    const reader=request.body?.getReader();const chunks:Uint8Array[]=[];let size=0;
    if(reader)for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>800_000){await reader.cancel();return Response.json({error:'Document too large'},{status:413});}chunks.push(value);}
    body=new Uint8Array(size);let offset=0;for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.length;}
  }
  return env.CONSISTENCY_WORKSPACE.fetch(new Request('https://workspace.internal'+url.pathname,{method:request.method,body,headers:{'Content-Type':'application/json'}}));
}

/**
 * Settings → Domains: the owner connects their own domains to their sites. The platform talks to Cloudflare and
 * decides when a domain is connected; this gateway only checks the owner, the origin and the request's shape.
 */
async function domainsApi(request: Request, env: ReportsEnv & WorkspaceEnv, send: typeof fetch): Promise<Response> {
  const url = new URL(request.url);
  const item = /^\/api\/consistency\/domains\/([a-z0-9.-]{1,253})(\/check)?$/.exec(url.pathname);
  if (url.pathname !== '/api/consistency/domains' && !item) return Response.json({ error: 'Not found' }, { status: 404 });
  const denied = await authorizeOwner(new Request(request.url, { headers: request.headers }), env, send); if (denied) return denied;
  const allowed = item ? (item[2] ? ['POST'] : ['DELETE']) : ['GET', 'POST'];
  if (!allowed.includes(request.method)) return Response.json({ error: 'Method not allowed' }, { status: 405 });
  const body = request.method === 'POST' && !item ? await request.text() : undefined;
  if (request.method !== 'GET') {
    if (request.headers.get('Origin') !== url.origin) return Response.json({ error: 'Forbidden' }, { status: 403 });
    if (body !== undefined && request.headers.get('Content-Type')?.split(';')[0] !== 'application/json') return Response.json({ error: 'Forbidden' }, { status: 403 });
    if (body !== undefined && body.length > 2_000) return Response.json({ error: 'Too large' }, { status: 413 });
  }
  if (!env.CONSISTENCY_WORKSPACE) return Response.json({ error: 'Workspace unavailable' }, { status: 503 });
  return env.CONSISTENCY_WORKSPACE.fetch(new Request('https://workspace.internal' + url.pathname, { method: request.method, body, headers: { 'Content-Type': 'application/json' } }));
}
