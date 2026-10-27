import { afterAll, beforeAll, describe, expect, it, vi } from 'vite-plus/test';
import { c9ySystemSite, C9Y_SYSTEM_HOST, isC9ySystemPath } from '../src/c9y-system-site';
import type { OwnerIdentity } from '../src/consistency-owner';
import { startAssets, type Harness } from './harness.ts';

const origin = `https://${C9Y_SYSTEM_HOST}`;
const SYSTEM = 'https://system.0001.dev';
const setCookies = (response: Response): string[] => (response.headers as unknown as { getSetCookie(): string[] }).getSetCookie();
const proof = async (value: string) => Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))).toString('base64url');
const expectPrivate = (response: Response) => {
  expect(response.headers.get('cache-control')).toBe('private, no-store');
  expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow');
};

/** System's One key as the identity binding answers it; `who` is the owner the next code redeems as. */
function setup() {
  const codes = new Map<string, string>();
  const tokens = new Map<string, string>();
  const calls = { revoke: 0 };
  const expiry = () => Math.floor(Date.now() / 1000) + 3600;
  const identity: OwnerIdentity = {
    redeem: async (code, verifier) => {
      const challenge = codes.get(code);
      codes.delete(code);
      if (!challenge || challenge !== (await proof(verifier))) return null;
      const token = crypto.randomUUID() + crypto.randomUUID();
      tokens.set(token, 'system-owner');
      return { token, expiry: expiry(), owner: 'system-owner' };
    },
    validate: async token => tokens.has(token) ? { expiry: expiry(), owner: tokens.get(token)! } : null,
    revoke: async token => { calls.revoke++; tokens.delete(token); },
  };
  const assets = vi.fn(async (request: Request) => new Response(new URL(request.url).pathname === '/private-c9y-system/' ? '<!doctype html><title>C9Y System</title>' : 'asset', { headers: { 'Cache-Control': 'public, max-age=31536000' } }));
  const env = { ASSETS: { fetch: assets }, C9Y_IDENTITY: identity } as unknown as { ASSETS: Fetcher; C9Y_IDENTITY: OwnerIdentity };
  const visit = (path: string, init: RequestInit = {}) => c9ySystemSite(new Request(origin + path, init), env);
  const signIn = async (next?: string) => {
    const start = await visit(`/auth/start?silent=1${next ? `&next=${encodeURIComponent(next)}` : ''}`);
    const authorize = new URL(start.headers.get('location')!);
    const pending = setCookies(start).find(value => value.startsWith('__Host-c9y_pending='))!.split(';')[0]!;
    const code = crypto.randomUUID();
    codes.set(code, authorize.searchParams.get('challenge')!);
    const back = await visit('/auth/callback', { method: 'POST', headers: { Origin: SYSTEM, Cookie: pending }, body: new URLSearchParams({ code, state: authorize.searchParams.get('state')! }).toString() });
    return { authorize, back, owner: setCookies(back).find(value => value.startsWith('__Host-c9y_owner='))!.split(';')[0]! };
  };
  return { env, assets, tokens, calls, visit, signIn };
}

describe('C9Y System site', () => {
  it('sends a signed-out page to a quiet System sign-in on this origin, as client c9y-system', async () => {
    const { visit, assets } = setup();
    for (const path of ['/', '/map', '/components', '/sites/', '/components/button', '/sites/flavo']) {
      const response = await visit(path);
      expect(response.status).toBe(302);
      const to = new URL(response.headers.get('location')!, origin);
      expect(to.origin + to.pathname).toBe(`${origin}/auth/start`);
      expect(to.searchParams.get('silent')).toBe('1');
      expect(to.searchParams.get('next')).toBe(path.replace(/(.)\/$/, '$1'));
      expectPrivate(response);
    }
    const start = await visit('/auth/start?silent=1&next=/map');
    const authorize = new URL(start.headers.get('location')!);
    expect(authorize.origin + authorize.pathname).toBe(`${SYSTEM}/auth/authorize`);
    expect(authorize.searchParams.get('client')).toBe('c9y-system');
    expect(authorize.searchParams.get('prompt')).toBe('none');
    expectPrivate(start);
    expect(assets).not.toHaveBeenCalled();
  });

  it('signs the owner in, returns to the page asked for, and serves the built page', async () => {
    const { visit, signIn, assets } = setup();
    const { back, owner } = await signIn('/components/button');
    expect(back.status).toBe(303);
    expect(back.headers.get('location')).toBe('/components/button');
    for (const path of ['/', '/map', '/components/button']) {
      const page = await visit(path, { headers: { Cookie: owner } });
      expect(page.status).toBe(200);
      expect(await page.text()).toContain('C9Y System');
      expect(new URL(assets.mock.lastCall![0].url).pathname).toBe('/private-c9y-system/');
      expectPrivate(page);
    }
    const asset = await visit('/private-c9y-system/assets/index-abc123.js', { headers: { Cookie: owner } });
    expect(asset.status).toBe(200);
    expect(new URL(assets.mock.lastCall![0].url).pathname).toBe('/private-c9y-system/assets/index-abc123.js');
    expectPrivate(asset);
  });

  it('keeps a return path on this origin only', async () => {
    const { signIn } = setup();
    for (const next of ['//evil.example/x', '/\\evil.example', 'https://evil.example/', '/a/../b']) expect((await signIn(next)).back.headers.get('location')).toBe('/');
  });

  it("System's quiet no asks out loud, keeping the page, and a loud no stays here", async () => {
    const { visit } = setup();
    const start = await visit('/auth/start?silent=1&next=/sites');
    const state = new URL(start.headers.get('location')!).searchParams.get('state')!;
    const pending = setCookies(start)[0]!.split(';')[0]!;
    const back = await visit(`/auth/callback?error=login_required&state=${state}`, { headers: { Cookie: pending } });
    expect(back.headers.get('location')).toBe('/auth/start?next=%2Fsites');
    const refused = await visit('/app/signin');
    expect(refused.status).toBe(401);
    expectPrivate(refused);
  });

  it('denies anyone but the System owner, and gates the assets', async () => {
    const { visit, tokens, assets } = setup();
    const member = 'm'.repeat(64);
    tokens.set(member, 'member');
    for (const cookie of [`__Host-c9y_owner=${member}`, '__Host-c9y_owner=unknown', '__Host-ds1-dashboard=token']) {
      const page = await visit('/map', { headers: { Cookie: cookie } });
      expect(page.status).toBe(302);
      expect(page.headers.get('location')).toMatch(/^\/auth\/start\?/);
      const asset = await visit('/private-c9y-system/assets/index.js', { headers: { Cookie: cookie } });
      expect(asset.status).toBe(404);
      expectPrivate(asset);
    }
    expect(assets).not.toHaveBeenCalled();
  });

  it('answers 404 with private headers for every other address, even to the owner', async () => {
    const { visit, signIn, assets } = setup();
    const { owner } = await signIn();
    for (const path of ['/private-c9y-system/', '/private-c9y-system/index.html', '/private-c9y-system/assets/../index.html', '/private-c9y-system/assets/.hidden', '/private-consistency/home.html', '/app/', '/api/dashboard/session', '/components/a/b', '/robots.txt']) {
      const response = await visit(path, { headers: { Cookie: owner } });
      expect(response.status).toBe(404);
      expectPrivate(response);
    }
    expect((await visit('/map', { method: 'POST', headers: { Cookie: owner } })).status).toBe(404);
    expect(assets).not.toHaveBeenCalled();
  });

  it('signs out from this origin only, revoking the System session', async () => {
    const { visit, signIn, calls } = setup();
    const { owner } = await signIn();
    expect((await visit('/auth/sign-out', { method: 'POST', headers: { Origin: 'https://evil.example', Cookie: owner } })).status).toBe(403);
    expect(calls.revoke).toBe(0);
    const out = await visit('/auth/sign-out', { method: 'POST', headers: { Origin: origin, Cookie: owner } });
    expect(out.status).toBe(204);
    expect(calls.revoke).toBe(1);
    expect(setCookies(out).join('\n')).toMatch(/__Host-c9y_owner=; .*Max-Age=0/);
    expect((await visit('/map', { headers: { Cookie: owner } })).status).toBe(302);
  });

  it('recognises the private build however it is encoded', () => {
    for (const path of ['/private-c9y-system/', '/PRIVATE-C9Y-SYSTEM/assets/a.js', '/%70rivate-c9y-system/', '//private-c9y-system/', '/%252fprivate-c9y-system/']) expect(isC9ySystemPath(path)).toBe(true);
    for (const path of ['/', '/private-consistency/', '/map']) expect(isC9ySystemPath(path)).toBe(false);
  });
});

describe('C9Y System build on other hosts', () => {
  let site: Harness;
  beforeAll(async () => { site = await startAssets(); });
  afterAll(async () => { await site.dispose(); });

  it('is not reachable on designsystem1.com, consistency.site or c9y.site', async () => {
    for (const host of ['https://designsystem1.com', 'https://consistency.site', 'https://c9y.site', 'https://editor.c9y.site', 'https://ds-one-services.example.workers.dev']) {
      for (const path of ['/private-c9y-system/', '/private-c9y-system/index.html', '/private-c9y-system/assets/index.js', '/%70rivate-c9y-system/', '/PRIVATE-C9Y-SYSTEM/']) {
        const response = await site.fetch(host + path, { redirect: 'manual' });
        expect(response.status).toBe(404);
        expect(await response.text()).toBe('Not found');
        expect(response.headers.get('cache-control')).toBe('private, no-store');
      }
    }
  });

  it('dispatches its own host before the Consistency hosts', async () => {
    const response = await site.fetch(`${origin}/map`, { redirect: 'manual' });
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('/auth/start?silent=1&next=%2Fmap');
  });
});
