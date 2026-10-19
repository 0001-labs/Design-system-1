/** Owner dashboard: the public sign-in shell contains no report data. */
import { authorizeReport, type ReportsEnv } from './reports';

export const DASHBOARD_HOST = 'dash.designsystem1.com';
/** The owner's icon builder: the same gate and session as the dashboard, on its own host. */
export const ICON_HOST = 'icon.designsystem1.com';
const COOKIE = '__Host-ds1-dashboard';
const security = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow', 'Referrer-Policy': 'same-origin', Vary: 'Cookie, Authorization' };
const expired = `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;

function sessionRequest(request: Request): Request {
  if (request.headers.has('authorization')) return request;
  const token = request.headers.get('cookie')?.split(';').map(value => value.trim()).find(value => value.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  const headers = new Headers(request.headers);
  if (token && /^[A-Za-z0-9._~-]{1,8192}$/.test(token)) headers.set('authorization', `Bearer ${token}`);
  return new Request(request, { headers });
}

export async function dashboard(request: Request, env: ReportsEnv & { ASSETS: Fetcher }, send: typeof fetch = fetch): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname === '/api/dashboard/session') {
    if (request.headers.get('origin') !== url.origin) return new Response(null, { status: 403, headers: security });
    if (request.method === 'DELETE') return new Response(null, { status: 204, headers: { ...security, 'Set-Cookie': expired } });
    if (request.method !== 'POST') return new Response(null, { status: 405, headers: { ...security, Allow: 'POST, DELETE' } });
    const denied = await authorizeReport(request, env, send);
    if (denied) return denied;
    const token = request.headers.get('authorization')!.slice(7);
    if (!/^[A-Za-z0-9._~-]{1,8192}$/.test(token)) return new Response(null, { status: 401, headers: security });
    return new Response(null, { status: 204, headers: { ...security, 'Set-Cookie': `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=3600` } });
  }
  if (!['GET', 'HEAD'].includes(request.method)) return new Response(null, { status: 404, headers: security });
  if (url.pathname.startsWith('/app/assets/') || url.pathname === '/icons/design-system-1.svg') return env.ASSETS.fetch(request);
  const privateApp = url.pathname === '/private-app/' || /^\/private-app\/[a-zA-Z0-9._-]+$/.test(url.pathname);
  if (!privateApp && !['/', '/app/', '/app/signin', '/app/reports/components'].includes(url.pathname)) return new Response(null, { status: 404, headers: security });
  if (url.pathname !== '/app/signin') {
    // Revalidate the token with Convex on every HTML request; cookies confer no authority alone.
    const denied = await authorizeReport(sessionRequest(request), env, send);
    if (denied) {
      if (denied.status === 401) return new Response(null, { status: 302, headers: { ...security, Location: privateApp ? '/app/signin?next=%2Fprivate-app%2F' : '/app/signin', 'Set-Cookie': expired } });
      return denied;
    }
  }
  if (!privateApp) url.pathname = '/app/';
  const original = await env.ASSETS.fetch(new Request(url, request));
  const response = new Response(original.body, original);
  for (const [name, value] of Object.entries(security)) response.headers.set(name, value);
  return response;
}
