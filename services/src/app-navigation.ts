import { ownerSessionCookie } from './dashboard';
import { authorizeReport, type ReportsEnv } from './reports';

/** Navigation is private data; client-provided email addresses grant no access. */
export async function appNavigation(request: Request, env: ReportsEnv, send: typeof fetch = fetch): Promise<Response> {
  const headers = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow', Vary: 'Authorization' };
  if (!['GET', 'POST'].includes(request.method)) return new Response(null, { status: 405, headers: { ...headers, Allow: 'GET, POST' } });
  if (request.method === 'POST' && request.headers.get('origin') !== new URL(request.url).origin) return new Response(null, {status:403,headers});
  const denied = await authorizeReport(request, env, send);
  if (denied) return denied;
  const cookie = request.method === 'POST' ? ownerSessionCookie(request) : null;
  if (request.method === 'POST' && !cookie) return new Response(null, {status:401,headers});
  return Response.json({ components: [
    { name: 'IndexedDB', layer: 1, href: '/libraries/workspace/?internal=indexeddb' },
    { name: 'Keyboard shortcut', layer: 2, href: '/libraries/workspace/?internal=keyboard-shortcut' },
    { name: 'Spacing handle', layer: 2, href: '/libraries/workspace/?internal=spacing-handle' },
    { name: 'Loading indicator', layer: 2, href: '/libraries/workspace/?internal=loading-indicator' },
  ] }, { headers: { ...headers, ...(cookie ? {'Set-Cookie': cookie} : {}) } });
}
