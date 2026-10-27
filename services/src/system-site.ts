import { dashboard, sessionRequest } from './dashboard';
import { authorizeReport, architectureReport, componentReport, type ReportsEnv } from './reports';
import { listExamples, setExample } from './doc-examples';

export const SYSTEM_HOST = 'system.designsystem1.com';
const security = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow', Vary: 'Cookie, Authorization' };
const pages = new Set(['/', '/adoption', '/architecture', '/examples', '/constraints']);
type Env = ReportsEnv & { ASSETS: Fetcher };

export async function systemSite(request: Request, env: Env, send: typeof fetch = fetch): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, '') || '/';
  if (path === '/api/dashboard/session') return dashboard(request, env, send);
  if (path === '/api/reports/components') return componentReport(sessionRequest(request), env, send);
  if (path === '/api/reports/architecture') return architectureReport(sessionRequest(request), env, send);
  if (path === '/app/signin') return dashboard(request, env, send);
  // Only the existing public sign-in bundle and its public fonts/icon bypass the owner gate.
  if (request.method === 'GET' || request.method === 'HEAD') {
    if (url.pathname.startsWith('/app/assets/') || url.pathname === '/icons/design-system-1.svg') return env.ASSETS.fetch(request);
  }
  if (!pages.has(path) && path !== '/api/system/examples' && path !== '/api/system/checks' && !/^\/system-previews\/[a-z0-9-]+\.png$/.test(path)) return new Response('Not found', { status: 404, headers: security });
  const denied = await authorizeReport(sessionRequest(request.clone()), env, send);
  if (denied) {
    if (denied.status === 401 && pages.has(path)) return new Response(null, { status: 302, headers: { ...security, Location: `/app/signin?next=${encodeURIComponent(path)}` } });
    return denied;
  }
  if (path === '/api/system/examples') {
    if (request.method === 'GET') return Response.json(await listExamples(env), { headers: security });
    if (request.method !== 'PUT') return new Response(null, { status: 405, headers: { ...security, Allow: 'GET, PUT' } });
    if (request.headers.get('origin') !== url.origin) return new Response(null, { status: 403, headers: security });
    if (!request.headers.get('content-type')?.startsWith('application/json')) return new Response(null, { status: 415, headers: security });
    const body = await request.text();
    if (body.length > 1024) return new Response(null, { status: 413, headers: security });
    try { return Response.json(await setExample(env, JSON.parse(body)), { headers: security }); }
    catch { return Response.json({ error: 'The example setting could not be saved.' }, { status: 400, headers: security }); }
  }
  if (!['GET', 'HEAD'].includes(request.method)) return new Response(null, { status: 405, headers: { ...security, Allow: 'GET, HEAD' } });
  url.pathname = path === '/api/system/checks' ? '/system-data/examples.json' : pages.has(path) ? '/app/' : path;
  const original = await env.ASSETS.fetch(new Request(url, request));
  const response = new Response(original.body, original);
  for (const [name, value] of Object.entries(security)) response.headers.set(name, value);
  return response;
}
