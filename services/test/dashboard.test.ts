import { describe, expect, it, vi } from 'vite-plus/test';
import { dashboard } from '../src/dashboard';
import type { ReportsEnv } from '../src/reports';
const origin = 'https://adoption.designsystem1.com';
function setup() {
  const assets = vi.fn().mockResolvedValue(new Response('Application'));
  const get = vi.fn();
  const env = { LIBRARIES: { get }, REPORTS_AUTH_URL: 'https://example.convex.cloud', REPORTS_OWNER_ID: 'owner', ASSETS: { fetch: assets } } as unknown as ReportsEnv & { ASSETS: Fetcher };
  const send = vi.fn().mockResolvedValue(Response.json({ status: 'success', value: { _id: 'owner', email: 'jaa90@icloud.com', emailVerified: true } }));
  return { assets, get, env, send };
}
describe('private dashboard HTML and session bridge', () => {
  it('serves only a data-free sign-in shell anonymously', async () => {
    const { env, send, assets, get } = setup();
    const response = await dashboard(new Request(origin), env, send);
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('/app/signin');
    expect(assets).not.toHaveBeenCalled(); expect(get).not.toHaveBeenCalled();
    expect((await dashboard(new Request(`${origin}/app/signin`), env, send)).status).toBe(200);
    expect(send).not.toHaveBeenCalled();
  });
  it('revalidates the cookie with the authority before returning HTML', async () => {
    const { env, send, assets } = setup();
    const request = new Request(origin, { headers: { cookie: '__Host-ds1-dashboard=valid-token' } });
    const response = await dashboard(request, env, send);
    expect(response.status).toBe(200);
    expect(send).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ headers: { authorization: 'Bearer valid-token', 'Content-Type': 'application/json' } }));
    expect(assets).toHaveBeenCalledOnce();
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    send.mockResolvedValue(Response.json({ status: 'success', value: { _id: 'other' } }));
    expect((await dashboard(request, env, send)).status).toBe(403);
    expect(assets).toHaveBeenCalledOnce();
  });
  it('requires a same-origin authenticated POST and sets a host-only HttpOnly cookie', async () => {
    const { env, send } = setup();
    const request = new Request(`${origin}/api/dashboard/session`, { method: 'POST', headers: { origin, authorization: 'Bearer valid-token' } });
    const response = await dashboard(request, env, send);
    expect(response.status).toBe(204);
    const cookie = response.headers.get('set-cookie')!;
    expect(cookie).toContain('__Host-ds1-dashboard=valid-token; Path=/; HttpOnly; Secure; SameSite=Strict');
    expect(cookie).not.toContain('Domain=');
    expect((await dashboard(new Request(request, { headers: { origin: 'https://evil.example', authorization: 'Bearer valid-token' } }), env, send)).status).toBe(403);
    expect((await dashboard(new Request(request, { headers: { origin } }), env, send)).status).toBe(401);
    const revoked = await dashboard(new Request(request, { method: 'DELETE' }), env, send);
    expect(revoked.headers.get('set-cookie')).toContain('Max-Age=0');
  });
  it('fails closed on expired sessions and unavailable authority without serving assets', async () => {
    for (const response of [new Response(null, { status: 401 }), new Response(null, { status: 503 })]) {
      const { env, send, assets } = setup(); send.mockResolvedValue(response);
      const result = await dashboard(new Request(origin, { headers: { cookie: '__Host-ds1-dashboard=expired' } }), env, send);
      expect([302, 503]).toContain(result.status); expect(assets).not.toHaveBeenCalled();
    }
  });
});

describe('private App documentation and assets', () => {
  for (const path of ['/private-app/', '/private-app/app.js', '/private-app/app.css']) for (const host of [origin, 'https://designsystem1.com']) {
    it(`gates ${host}${path} using the verified pinned owner`, async () => {
      const { env, send, assets } = setup();
      const url = host + path;
      const anonymous = await dashboard(new Request(url), env, send);
      expect(anonymous.status).toBe(302);
      expect(assets).not.toHaveBeenCalled();
      for (const user of [
        { _id: 'other', email: 'jaa90@icloud.com', emailVerified: true },
        { _id: 'owner', email: 'someone@example.com', emailVerified: true },
        { _id: 'owner', email: 'jaa90@icloud.com', emailVerified: false },
      ]) {
        send.mockResolvedValue(Response.json({ status: 'success', value: user }));
        expect((await dashboard(new Request(url, { headers: { cookie: '__Host-ds1-dashboard=token' } }), env, send)).status).toBe(403);
        expect(assets).not.toHaveBeenCalled();
      }
      send.mockResolvedValue(Response.json({ status: 'success', value: { _id: 'owner', email: 'jaa90@icloud.com', emailVerified: true } }));
      const response = await dashboard(new Request(url, { headers: { cookie: '__Host-ds1-dashboard=token' } }), env, send);
      expect(response.status).toBe(200);
      expect(response.headers.get('cache-control')).toBe('private, no-store');
      expect(new URL(assets.mock.calls[0]![0].url).pathname).toBe(path);
    });
  }
});
