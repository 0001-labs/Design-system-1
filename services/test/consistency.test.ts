import { expect, it, vi } from 'vite-plus/test';
import { consistencyPreview } from '../src/consistency';
import type { ReportsEnv } from '../src/reports';
const origin = 'https://neweditor.c9y.site';
function setup(id = 'owner', verified = true) {
  const assets = vi.fn(async (_request: Request) => new Response('private bytes'));
  const env = { REPORTS_OWNER_ID: 'owner', REPORTS_AUTH_URL: 'https://example.convex.cloud', ASSETS: { fetch: assets } } as unknown as ReportsEnv & { ASSETS: Fetcher };
  const send = vi.fn(async () => Response.json({ status: 'success', value: { _id: id, email: 'jaa90@icloud.com', emailVerified: verified } }));
  return { assets, env, send };
}
const headers = { cookie: '__Host-ds1-dashboard=valid-token' };
it.each(['/', '/private-consistency/index.html', '/private-consistency/assets/editor.js'])('gates anonymous files %s', async path => {
  const { env, assets, send } = setup();
  const result = await consistencyPreview(new Request(origin + path), env, send);
  expect(result.status).toBe(302); expect(result.headers.get('location')).toBe('/app/signin'); expect(assets).not.toHaveBeenCalled();
});
it.each([['other', true], ['owner', false]] as const)('denies unauthorized identity %s %s', async (id, verified) => {
  const { env, assets, send } = setup(id, verified);
  expect((await consistencyPreview(new Request(origin, { headers }), env, send)).status).toBe(403); expect(assets).not.toHaveBeenCalled();
});
it('revalidates owner on every HTML and asset and maps root', async () => {
  const { env, assets, send } = setup();
  for (const path of ['/', '/private-consistency/assets/editor.js']) {
    const result = await consistencyPreview(new Request(origin + path, { headers }), env, send);
    expect(result.status).toBe(200); expect(result.headers.get('cache-control')).toBe('private, no-store');
  }
  expect(send).toHaveBeenCalledTimes(2); expect(new URL(assets.mock.calls[0]![0].url).pathname).toBe('/private-consistency/index.html');
});
it.each(['https://designsystem1.com', 'https://worker.workers.dev', 'https://adoption.designsystem1.com', 'http://neweditor.c9y.site'])('blocks alternate origin %s', async host => {
  const { env, assets, send } = setup();
  expect((await consistencyPreview(new Request(host + '/private-consistency/index.html', { headers }), env, send)).status).toBe(404); expect(assets).not.toHaveBeenCalled();
});
it('serves sign-in shell/assets and creates only a same-origin host-only owner session', async () => {
  const { env, assets, send } = setup();
  for (const path of ['/app/signin', '/app/assets/login.js']) expect((await consistencyPreview(new Request(origin + path), env, send)).status).toBe(200);
  expect(send).not.toHaveBeenCalled();
  expect((await consistencyPreview(new Request(origin + '/app/libraries'), env, send)).status).toBe(404);
  const result = await consistencyPreview(new Request(origin + '/api/dashboard/session', { method: 'POST', headers: { origin, authorization: 'Bearer valid-token' } }), env, send);
  expect(result.status).toBe(204); expect(result.headers.get('set-cookie')).toContain('Path=/; HttpOnly; Secure; SameSite=Strict'); expect(result.headers.get('set-cookie')).not.toContain('Domain='); expect(assets).toHaveBeenCalledTimes(2);
  expect((await consistencyPreview(new Request(origin + '/api/dashboard/session', { method: 'POST', headers: { origin: 'https://evil.test', authorization: 'Bearer valid-token' } }), env, send)).status).toBe(403);
});

it('marks only authenticated preview HTML, preserving public shell, assets and HEAD', async () => {
  const { env, assets, send } = setup();
  assets.mockImplementation(async request => new Response(request.method === 'HEAD' ? null : '<!doctype html><html lang="en"><body>Preview</body></html>', { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': '70', ETag: 'old' } }));
  const anonymous = await consistencyPreview(new Request(origin), env, send);
  expect(await anonymous.text()).not.toContain('data-ds-owner');
  const shell = await consistencyPreview(new Request(origin + '/app/signin'), env, send);
  expect(await shell.text()).not.toContain('data-ds-owner');
  const marked = await consistencyPreview(new Request(origin, { headers }), env, send);
  expect(await marked.text()).toContain('<html data-ds-owner lang="en">');
  expect(marked.headers.has('content-length')).toBe(false); expect(marked.headers.has('etag')).toBe(false);
  const head = await consistencyPreview(new Request(origin, { method: 'HEAD', headers }), env, send);
  expect(await head.text()).toBe(''); expect(head.headers.get('etag')).toBe('old');
  assets.mockImplementation(async () => new Response('const html = "<html>";', { headers: { 'Content-Type': 'text/javascript' } }));
  const script = await consistencyPreview(new Request(origin + '/private-consistency/assets/editor.js', { headers }), env, send);
  expect(await script.text()).toBe('const html = "<html>";');
});

it.each(['/app/assets/%2f..%2f..%2fprivate-consistency/index.html', '/app/assets/nested/editor.js'])('rejects noncanonical public asset paths %s', async path => {
  const { env, assets, send } = setup();
  expect((await consistencyPreview(new Request(origin + path), env, send)).status).toBe(404);
  expect(assets).not.toHaveBeenCalled();
});
