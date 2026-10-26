/**
 * c9y.site's owner through System's One key: the same owner session as every Consistency site editor, so
 * signing in here opens them all, and signing out here ends them all. The protocol is the shared CMS's
 * (`system/parts/site-engine/worker/owner.ts` in the studio):
 *
 * - `GET /auth/start` goes to System's `/auth/authorize` for the `c9y` client with a fresh state and an S256
 *   challenge, kept in a ten-minute pending cookie (SameSite=None: System answers by a cross-site POST).
 *   `?silent=1` asks with `prompt=none`; System's quiet no comes back to `GET /auth/callback`, which then
 *   asks out loud, so the owner meets System's sign-in once.
 * - `POST /auth/callback` is taken from System's origin only, with the state, the pending cookie and the
 *   verifier; the delegated token goes in the host-only `__Host-c9y_owner`.
 * - The token is asked of System on every request through `C9Y_IDENTITY` (`ConsistencyIdentity`); nothing
 *   about the owner is kept here. Signing out revokes the System session behind it.
 */
export interface OwnerIdentity {
  redeem(code: string, verifier: string): Promise<{ token: string; expiry: number; owner: string } | null>;
  validate(token: string): Promise<{ expiry: number; owner: string } | null>;
  revoke(token: string): Promise<void>;
}
export interface OwnerEnv { C9Y_IDENTITY?: OwnerIdentity }

export const OWNER_COOKIE = '__Host-c9y_owner';
export const PENDING_COOKIE = '__Host-c9y_pending';
const SYSTEM = 'https://system.0001.dev';
/** The System client each origin signs in as; any other origin has no owner sign-in here. */
const CLIENTS: Record<string, string> = { 'https://c9y.site': 'c9y', 'https://consistency.site': 'c9y-app' };
const PENDING_TTL = 600_000;
const headers = { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'same-origin' };

const cookie = (name: string, value: string, seconds: number, sameSite: 'Lax' | 'None' = 'Lax') => `${name}=${value}; Path=/; Secure; HttpOnly; SameSite=${sameSite}; Max-Age=${Math.max(0, Math.floor(seconds))}`;
const redirect = (to: string, ...cookies: string[]) => {
  const response = new Response(null, { status: 303, headers: { ...headers, Location: to } });
  for (const value of cookies) response.headers.append('Set-Cookie', value);
  return response;
};
const plain = (text: string, status: number) => new Response(text, { status, headers: { ...headers, 'Content-Type': 'text/plain; charset=utf-8' } });
const hex = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, '0')).join('');
const proof = async (value: string) => btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
function cookieValue(request: Request, name: string): string | null {
  for (const part of (request.headers.get('Cookie') ?? '').split(';')) {
    const at = part.indexOf('=');
    if (at > 0 && part.slice(0, at).trim() === name) return part.slice(at + 1).trim() || null;
  }
  return null;
}

/** Whether this address has the owner's System sign-in. */
export const hasOwnerSignIn = (url: URL) => Object.hasOwn(CLIENTS, url.origin);

/** Whether the request's owner token stands, asked of System now. */
export async function systemOwner(request: Request, env: OwnerEnv, now = Date.now()): Promise<boolean> {
  const token = cookieValue(request, OWNER_COOKIE);
  if (!token || token.length > 100 || !env.C9Y_IDENTITY || !hasOwnerSignIn(new URL(request.url))) return false;
  const owner = await env.C9Y_IDENTITY.validate(token);
  return owner?.owner === 'system-owner' && owner.expiry * 1000 > now;
}

/** Revokes the System session behind the request's owner token; the cookie that clears it, or null without one. */
export async function ownerSignOut(request: Request, env: OwnerEnv): Promise<string | null> {
  const token = cookieValue(request, OWNER_COOKIE);
  if (!token) return null;
  if (token.length <= 100) {
    if (!env.C9Y_IDENTITY) throw new Error('owner-sign-out-unavailable');
    await env.C9Y_IDENTITY.revoke(token);
  }
  return cookie(OWNER_COOKIE, '', 0);
}

interface Pending { state: string; verifier: string; until: number; silent: boolean }

/** `/auth/start` and `/auth/callback`; null for any other path. */
export async function ownerRoutes(request: Request, env: OwnerEnv, now = Date.now()): Promise<Response | null> {
  const url = new URL(request.url);
  if (url.pathname !== '/auth/start' && url.pathname !== '/auth/callback') return null;
  const identity = env.C9Y_IDENTITY;
  if (!hasOwnerSignIn(url) || !identity) return plain('Not found', 404);
  if (url.pathname === '/auth/start') {
    if (request.method !== 'GET') return plain('Method not allowed', 405);
    const state = hex(), verifier = hex(), silent = url.searchParams.get('silent') === '1';
    const pending: Pending = { state, verifier, until: now + PENDING_TTL, silent };
    return redirect(`${SYSTEM}/auth/authorize?client=${CLIENTS[url.origin]}&state=${state}&challenge=${await proof(verifier)}${silent ? '&prompt=none' : ''}`, cookie(PENDING_COOKIE, encodeURIComponent(JSON.stringify(pending)), PENDING_TTL / 1000, 'None'));
  }
  let pending: Pending | null = null;
  try {
    const value = JSON.parse(decodeURIComponent(cookieValue(request, PENDING_COOKIE) ?? '')) as Pending;
    if (/^[a-f0-9]{64}$/.test(value.state) && /^[a-f0-9]{64}$/.test(value.verifier) && Number.isFinite(value.until) && value.until >= now && value.until <= now + PENDING_TTL) pending = value;
  } catch { /* No pending sign-in. */ }
  const cleared = cookie(PENDING_COOKIE, '', 0, 'None');
  if (request.method === 'GET') {
    // System's quiet no: ask out loud, once, so the owner signs in to System.
    if (!pending || url.searchParams.get('state') !== pending.state || !url.searchParams.get('error')) return plain('Sign-in expired. Open c9y.site to try again.', 400);
    return redirect(pending.silent ? '/auth/start' : '/app/signin', cleared);
  }
  if (request.method !== 'POST' || request.headers.get('Origin') !== SYSTEM) return plain('Invalid origin', 403);
  try {
    if (!pending || Number(request.headers.get('Content-Length')) > 2000) throw new Error('expired');
    const body = await request.text();
    if (body.length > 2000) throw new Error('too-large');
    const form = new URLSearchParams(body);
    if (form.get('state') !== pending.state) throw new Error('state');
    const result = await identity.redeem(form.get('code') ?? '', pending.verifier);
    if (!result || result.owner !== 'system-owner' || result.expiry * 1000 <= now) throw new Error('refused');
    return redirect('/', cookie(OWNER_COOKIE, result.token, result.expiry - now / 1000), cleared);
  } catch {
    return plain('Sign-in expired. Open c9y.site to try again.', 400);
  }
}
