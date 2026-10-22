/** Private editor preview. Every preview file is authorized before reaching Assets. */
import { dashboard, sessionRequest } from './dashboard';
import { authorizeReport, type ReportsEnv } from './reports';

export const CONSISTENCY_HOST = 'neweditor.c9y.site';
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
function protect(response: Response): Response {
  const result = new Response(response.body, response);
  for (const [key, value] of Object.entries(security)) result.headers.set(key, value);
  return result;
}
export async function consistencyPreview(request: Request, env: ReportsEnv & { ASSETS: Fetcher }, send: typeof fetch = fetch): Promise<Response> {
  const url = new URL(request.url);
  if (url.hostname !== CONSISTENCY_HOST || url.protocol !== 'https:') return new Response(null, { status: 404, headers: security });
  if (url.pathname === '/api/dashboard/session' || url.pathname === '/app/signin' || /^\/app\/assets\/[A-Za-z0-9][A-Za-z0-9._-]*$/.test(url.pathname) || url.pathname === '/icons/design-system-1.svg') return protect(await dashboard(request, env, send));
  if (!['GET', 'HEAD'].includes(request.method)) return new Response(null, { status: 404, headers: security });
  if (url.pathname !== '/' && !url.pathname.startsWith(prefix)) return new Response(null, { status: 404, headers: security });
  const denied = await authorizeReport(sessionRequest(request), env, send);
  if (denied) {
    if (denied.status === 401) return new Response(null, { status: 302, headers: { ...security, Location: '/app/signin', 'Set-Cookie': '__Host-ds1-dashboard=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0' } });
    return protect(denied);
  }
  if (url.pathname === '/') url.pathname = `${prefix}index.html`;
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
