import { expect, it, vi } from 'vite-plus/test';
import { consistencyPreview } from '../src/consistency';
import { consistencyAI } from '../src/consistency-ai';
import type { ReportsEnv } from '../src/reports';
import type { OwnerIdentity } from '../src/consistency-owner';

// The app's address; c9y.site's home leads here.
const origin = 'https://consistency.site';
const SYSTEM = 'https://system.0001.dev';
/** Every Set-Cookie of an answer (the Workers types leave `getSetCookie` out). */
const setCookies = (response: Response): string[] => (response.headers as unknown as { getSetCookie(): string[] }).getSetCookie();
const proof = async (value: string) => Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))).toString('base64url');

/** System's One key as the identity binding answers it: one-use codes for a challenge, tokens that end with the System session. */
function setup() {
  const codes = new Map<string, string>();
  const tokens = new Set<string>();
  const calls = { validate: 0, revoke: 0 };
  const expiry = () => Math.floor(Date.now() / 1000) + 3600;
  const identity: OwnerIdentity = {
    redeem: async (code, verifier) => {
      const challenge = codes.get(code);
      codes.delete(code);
      if (!challenge || challenge !== (await proof(verifier))) return null;
      const token = crypto.randomUUID() + crypto.randomUUID();
      tokens.add(token);
      return { token, expiry: expiry(), owner: 'system-owner' };
    },
    validate: async token => (calls.validate++, tokens.has(token) ? { expiry: expiry(), owner: 'system-owner' } : null),
    revoke: async token => { calls.revoke++; if (tokens.has(token)) tokens.clear(); },
  };
  const assets = vi.fn(async (_request: Request) => new Response('<!doctype html><html><body>Home</body></html>', { headers: { 'Content-Type': 'text/html' } }));
  // The platform's landing answers at its own origin; Convex, asked about a session, says there is none.
  const send = vi.fn(async (input: string | URL | Request) => String(input instanceof Request ? input.url : input).startsWith('https://consistency.c9y.site/') ? new Response('Landing') : new Response(null, { status: 401 }));
  const env = { REPORTS_OWNER_ID: 'owner', REPORTS_AUTH_URL: 'https://example.convex.cloud', ASSETS: { fetch: assets }, C9Y_IDENTITY: identity } as unknown as ReportsEnv & { ASSETS: Fetcher; C9Y_IDENTITY: OwnerIdentity };
  const visit = (path: string, init: RequestInit = {}) => consistencyPreview(new Request(origin + path, init), env, send);
  const signIn = async () => {
    const start = await visit('/auth/start?silent=1');
    const authorize = new URL(start.headers.get('location')!);
    const pending = setCookies(start).find(value => value.startsWith('__Host-c9y_pending='))!.split(';')[0]!;
    const code = crypto.randomUUID();
    codes.set(code, authorize.searchParams.get('challenge')!);
    const back = await visit('/auth/callback', { method: 'POST', headers: { Origin: SYSTEM, Cookie: pending }, body: new URLSearchParams({ code, state: authorize.searchParams.get('state')! }).toString() });
    return { start, authorize, pending, back, owner: setCookies(back).find(value => value.startsWith('__Host-c9y_owner='))?.split(';')[0] };
  };
  return { env, assets, send, calls, tokens, visit, signIn };
}

it('shows a signed-out visitor the landing, and asks System for the app client on sign-in', async () => {
  const { visit, assets, send } = setup();
  const home = await visit('/');
  expect(await home.text()).toBe('Landing');
  expect(send.mock.calls[0]![0]).toBe('https://consistency.c9y.site/');
  expect(await (await visit('/examples/')).text()).toBe('Landing');
  expect(assets).not.toHaveBeenCalled();
  const start = await visit('/auth/start?silent=1');
  const authorize = new URL(start.headers.get('location')!);
  expect(authorize.origin + authorize.pathname).toBe(`${SYSTEM}/auth/authorize`);
  expect(authorize.searchParams.get('client')).toBe('c9y-app');
  expect(authorize.searchParams.get('prompt')).toBe('none');
  expect(setCookies(start).join()).toMatch(/__Host-c9y_pending=[^;]+; Path=\/; Secure; HttpOnly; SameSite=None; Max-Age=600/);
});

it("takes System's code by POST from System only, into a host-only owner cookie, and opens the home signed in", async () => {
  const { visit, signIn, assets } = setup();
  const { back, owner } = await signIn();
  expect(back.status).toBe(303);
  expect(back.headers.get('location')).toBe('/');
  expect(setCookies(back).join('\n')).toMatch(/__Host-c9y_owner=[^;]+; Path=\/; Secure; HttpOnly; SameSite=Lax; Max-Age=3\d{3}/);
  expect(setCookies(back).join('\n')).not.toMatch(/Domain=/i);
  const home = await visit('/', { headers: { Cookie: owner! } });
  expect(home.status).toBe(200);
  expect(await home.text()).toContain('data-ds-owner');
  expect(new URL(assets.mock.calls[0]![0].url).pathname).toBe('/private-consistency/home.html');
  for (const from of ['https://evil.example', origin]) expect((await visit('/auth/callback', { method: 'POST', headers: { Origin: from }, body: 'code=x&state=y' })).status).toBe(403);
});

it("System's quiet no asks out loud once, so the owner signs in to System", async () => {
  const { visit } = setup();
  const start = await visit('/auth/start?silent=1');
  const state = new URL(start.headers.get('location')!).searchParams.get('state')!;
  const pending = setCookies(start)[0]!.split(';')[0]!;
  const back = await visit(`/auth/callback?error=login_required&state=${state}`, { headers: { Cookie: pending } });
  expect(back.headers.get('location')).toBe('/auth/start');
  expect(new URL((await visit('/auth/start')).headers.get('location')!).searchParams.has('prompt')).toBe(false);
  expect((await visit(`/auth/callback?error=login_required&state=${'c'.repeat(64)}`, { headers: { Cookie: pending } })).status).toBe(400);
});

it('asks System on every request, and a sign-out anywhere ends it here', async () => {
  const { visit, signIn, calls, tokens } = setup();
  const { owner } = await signIn();
  const before = calls.validate;
  await visit('/', { headers: { Cookie: owner! } });
  await visit('/api/consistency/sites', { headers: { Cookie: owner! } });
  expect(calls.validate - before).toBe(2);
  tokens.clear();
  expect(await (await visit('/', { headers: { Cookie: owner! } })).text()).toBe('Landing');
  expect((await visit('/private-consistency/assets/editor.js', { headers: { Cookie: owner! } })).status).toBe(302);
});

it("leads c9y.site's home to the app, and keeps its own sign-in client", async () => {
  const { env, send } = setup();
  const home = await consistencyPreview(new Request('https://c9y.site/'), env, send);
  expect(home.status).toBe(302);
  expect(home.headers.get('location')).toBe('https://consistency.site/');
  const start = await consistencyPreview(new Request('https://c9y.site/auth/start'), env, send);
  expect(new URL(start.headers.get('location')!).searchParams.get('client')).toBe('c9y');
});

it('signing out here revokes the System session behind it', async () => {
  const { visit, signIn, calls } = setup();
  const { owner } = await signIn();
  const out = await visit('/api/dashboard/session', { method: 'DELETE', headers: { Origin: origin, Cookie: owner! } });
  expect(out.status).toBe(204);
  expect(calls.revoke).toBe(1);
  expect(setCookies(out).join('\n')).toMatch(/__Host-c9y_owner=; .*Max-Age=0/);
  expect((await visit('/private-consistency/assets/editor.js', { headers: { Cookie: owner! } })).status).toBe(302);
});

it("the editor's AI takes the System owner too, still only from its own origin", async () => {
  const { env, signIn, send } = setup();
  const { owner } = await signIn();
  const ask = (from: string) => consistencyAI(new Request(origin + '/api/consistency/ai', { method: 'POST', headers: { Origin: from, Cookie: owner!, 'Content-Type': 'text/plain' }, body: 'x' }), env, send);
  expect((await ask('https://evil.example')).status).toBe(403);
  expect((await ask(origin)).status).toBe(415); // past the owner check, refused only for its body
});

it('the editor lab has no System sign-in and ignores an owner cookie', async () => {
  const { env, send, signIn } = setup();
  const { owner } = await signIn();
  const other = (path: string) => consistencyPreview(new Request('https://editor.c9y.site' + path, { headers: { Cookie: owner! } }), env, send);
  expect((await other('/auth/start')).status).toBe(404);
  const home = await other('/');
  expect(home.status).toBe(302);
  expect(home.headers.get('location')).toBe('/app/signin');
});

it('Settings → Domains reaches the platform with the One key session alone, and refuses without it', async () => {
  const { env, visit, signIn } = setup();
  const workspace = { fetch: vi.fn(async () => Response.json({ target: 'connect.c9y.site', ready: true, sites: [] })) };
  (env as unknown as { CONSISTENCY_WORKSPACE: typeof workspace }).CONSISTENCY_WORKSPACE = workspace;
  expect((await visit('/api/consistency/domains')).status).toBe(401);
  const { owner } = await signIn();
  expect((await visit('/api/consistency/domains', { headers: { Cookie: owner! } })).status).toBe(200);
  expect((await visit('/api/consistency/domains/www.example.com', { method: 'DELETE', headers: { Cookie: owner!, Origin: 'https://evil.test' } })).status).toBe(403);
  expect(workspace.fetch).toHaveBeenCalledTimes(1);
});
