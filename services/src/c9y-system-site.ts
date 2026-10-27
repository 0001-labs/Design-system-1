/**
 * C9Y System at system.consistency.site: the static build in `website/dist/private-c9y-system/`, for the System
 * owner alone. The owner signs in through System's One key as client `c9y-system` (`consistency-owner.ts`); no
 * other person is let in, unlike consistency.site's members. Every answer is private, uncached and unindexed.
 */
import { ownerRoutes, ownerSignOut, systemOwner, type OwnerEnv } from './consistency-owner';

export const C9Y_SYSTEM_HOST = 'system.consistency.site';
const base = '/private-c9y-system/';
const security = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow', 'Referrer-Policy': 'same-origin', 'X-Content-Type-Options': 'nosniff', Vary: 'Cookie' };
/** The page's own addresses; each serves the one built page, which routes itself. */
const isPage = (path: string) => /^\/(?:map|components|sites)?$/.test(path) || /^\/(?:components|sites)\/[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(path);
const isAsset = (path: string) => /^\/private-c9y-system\/assets\/(?:[A-Za-z0-9_-][A-Za-z0-9._-]*\/)*[A-Za-z0-9_-][A-Za-z0-9._-]*$/.test(path);

const answer = (status: number, extra: Record<string, string> = {}, body: string | null = null) => new Response(body, { status, headers: { ...security, ...extra } });
function protect(response: Response): Response {
  const result = new Response(response.body, response);
  for (const [key, value] of Object.entries(security)) result.headers.set(key, value);
  return result;
}

/** Whether a path reaches the private build, however it is encoded; only this host may answer it. */
export function isC9ySystemPath(path: string): boolean {
  let decoded = path;
  for (let count = 0; count < 4; count++) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch { break; }
  }
  const canonical = new URL(decoded.replace(/\\/g, '/').replace(/^\/+/, '/'), 'https://private.invalid').pathname.toLowerCase();
  return canonical.startsWith(base.slice(0, -1));
}

export async function c9ySystemSite(request: Request, env: OwnerEnv & { ASSETS: Fetcher }): Promise<Response> {
  const url = new URL(request.url);
  if (url.hostname !== C9Y_SYSTEM_HOST || url.protocol !== 'https:') return answer(404);
  const signingIn = await ownerRoutes(request, env);
  if (signingIn) return protect(signingIn);
  // System refused out loud (the owner cancelled): no sign-in page here, so say so instead of asking again.
  if (url.pathname === '/app/signin') return answer(401, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Sign in to System to open C9Y System.');
  // Signing out ends the System session behind the owner's token, on every Consistency site.
  if (url.pathname === '/auth/sign-out') {
    if (request.method !== 'POST') return answer(405, { Allow: 'POST' });
    if (request.headers.get('Origin') !== url.origin) return answer(403);
    const cleared = await ownerSignOut(request, env).then(value => ({ value }), () => null);
    if (!cleared) return answer(503);
    const response = answer(204);
    if (cleared.value) response.headers.append('Set-Cookie', cleared.value);
    return response;
  }
  if (!['GET', 'HEAD'].includes(request.method)) return answer(404);
  const path = url.pathname.length > 1 ? url.pathname.replace(/\/$/, '') : url.pathname;
  const page = isPage(path);
  if (!page && !isAsset(url.pathname)) return answer(404);
  if (!(await systemOwner(request, env))) {
    // Ask System quietly first: signed in there, signed in here, back on the same page.
    return page ? answer(302, { Location: `/auth/start?silent=1&next=${encodeURIComponent(path)}` }) : answer(404);
  }
  // The build's directory, not its index.html: Assets answers `…/index.html` with a redirect to the directory.
  if (page) url.pathname = base;
  return protect(await env.ASSETS.fetch(new Request(url, request)));
}
