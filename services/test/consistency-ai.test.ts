import { afterEach, expect, it, vi } from 'vite-plus/test';
import { consistencyAI, type PreviewAIEnv } from '../src/consistency-ai';
const origin = 'https://neweditor.c9y.site';
function setup(id = 'owner') {
  const run = vi.fn(async () => ({ response: 'Updated writing' }));
  const send = vi.fn(async () => Response.json({ status: 'success', value: { _id: id, email: 'jaa90@icloud.com', emailVerified: true } }));
  const env = { REPORTS_OWNER_ID: 'owner', REPORTS_AUTH_URL: 'https://example.convex.cloud', AI: { run } } as unknown as PreviewAIEnv;
  return { run, env, send };
}
function request(body: unknown = { prompt: 'Improve this', kind: 'writing', text: 'Old writing' }, extra: Record<string, string> = {}) {
  return new Request(origin + '/api/consistency/ai', { method: 'POST', headers: { origin, 'content-type': 'application/json', cookie: '__Host-ds1-dashboard=valid-token', ...extra }, body: JSON.stringify(body) });
}
afterEach(() => vi.useRealTimers());
it('authorizes cookie owner before inference and converts selection and whole-document responses', async () => {
  const { env, send, run } = setup();
  const result = await consistencyAI(request(), env, send);
  expect(await result.json()).toEqual({ insert: 'Updated writing' }); expect(result.headers.get('cache-control')).toBe('private, no-store');
  expect(await (await consistencyAI(request({ prompt: 'Write', kind: 'writing', document: 'Title\n⟦here⟧' }), env, send)).json()).toEqual({ document: 'Updated writing' });
  expect(run).toHaveBeenCalledTimes(2);
});
it('denies anonymous/nonowner/cross-origin/alternate-host requests without inference', async () => {
  const { env, send, run } = setup('other');
  expect((await consistencyAI(request(), env, send)).status).toBe(403);
  expect((await consistencyAI(request({}, { cookie: '' }), env, send)).status).toBe(401);
  expect((await consistencyAI(request({}, { origin: 'https://evil.example' }), env, send)).status).toBe(403);
  expect((await consistencyAI(new Request('https://designsystem1.com/api/consistency/ai', request()), env, send)).status).toBe(404);
  expect(run).not.toHaveBeenCalled();
});
it('rejects malformed and oversized input before inference', async () => {
  const { env, send, run } = setup();
  expect((await consistencyAI(request({ prompt: '', kind: 'writing' }), env, send)).status).toBe(400);
  expect((await consistencyAI(request({ prompt: 'Write', kind: 'writing', text: 'a'.repeat(100_001) }), env, send)).status).toBe(413);
  expect(run).not.toHaveBeenCalled();
});
it('returns actionable failures for unavailable inference and empty output', async () => {
  const { env, send, run } = setup();
  run.mockRejectedValueOnce(new Error('provider detail must stay private'));
  const failed = await consistencyAI(request(), env, send);
  expect(failed.status).toBe(502); expect(await failed.text()).not.toContain('provider detail');
  run.mockResolvedValueOnce({ response: '' }); expect((await consistencyAI(request(), env, send)).status).toBe(502);
  expect((await consistencyAI(request(), { ...env, AI: undefined }, send)).status).toBe(503);
});
it('times out inference with a retryable failure', async () => {
  const { env, send, run } = setup();
  run.mockImplementation(() => new Promise(() => {}));
  vi.useFakeTimers();
  const pending = consistencyAI(request(), env, send);
  await vi.advanceTimersByTimeAsync(45_001);
  expect((await pending).status).toBe(502);
});
