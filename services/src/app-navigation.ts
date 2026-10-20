import { authorizeReport, type ReportsEnv } from './reports';

/** Navigation is private data; client-provided email addresses grant no access. */
export async function appNavigation(request: Request, env: ReportsEnv, send: typeof fetch = fetch): Promise<Response> {
  const headers = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow', Vary: 'Authorization' };
  if (request.method !== 'GET') return new Response(null, { status: 405, headers: { ...headers, Allow: 'GET' } });
  const denied = await authorizeReport(request, env, send);
  if (denied) return denied;
  return Response.json({ components: [
    { name: 'Keyboard shortcut', layer: 2, href: '/libraries/workspace/?internal=keyboard-shortcut' },
    { name: 'Spacing handle', layer: 2, href: '/libraries/workspace/?internal=spacing-handle' },
    { name: 'Loading indicator', layer: 2, href: '/libraries/workspace/?internal=loading-indicator' },
  ] }, { headers });
}
