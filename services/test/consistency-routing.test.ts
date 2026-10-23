import { afterEach, expect, it, vi } from 'vite-plus/test';
import { consistencyAI, type PreviewAIEnv } from '../src/consistency-ai';
import { componentContext, componentQuestions } from '../../shared/consistency-routing';
const origin = 'https://neweditor.c9y.site';
const body = { prompt: 'Add a button', kind: 'writing', document: '# Keep\n\n⟦here⟧' };
function setup(enabled = true, owner = true) {
  const run = vi.fn(async () => ({ response: 'Fallback writing' }));
  const get = vi.fn(async () => ({ json: async () => ({ enabled, audience: 'owner' }) }));
  const questions = componentQuestions(componentContext(body)!);
  const answer = (criteria: Record<string, string>, choice: string) => ({ type: 'choice', choice, confidence: 1, probabilities: Object.fromEntries(Object.keys(criteria).map(key => [key, key === choice ? 1 : 0])) });
  const decide = vi.fn(async (_url?: RequestInfo | URL, _init?: RequestInit) => Response.json({ answers: { change: { type: 'noul', noul: 1 }, action: answer(questions.action.criteria, 'insert_button') } }));
  const send: typeof fetch = vi.fn(async (url, init) => String(url).startsWith('https://api.typesafe.ai/') ? decide(url, init) : Response.json({ status: 'success', value: { _id: owner ? 'owner' : 'another', email: 'jaa90@icloud.com', emailVerified: true } }));
  const env = { REPORTS_OWNER_ID: 'owner', REPORTS_AUTH_URL: 'https://example.convex.cloud', TYPESAFE_API_KEY: 'fixture-key', LIBRARIES: { get }, AI: { run } } as unknown as PreviewAIEnv;
  const request = new Request(origin + '/api/consistency/ai', { method: 'POST', headers: { origin, 'content-type': 'application/json', cookie: '__Host-ds1-dashboard=session' }, body: JSON.stringify(body) });
  return { request, env, send, get, decide, run };
}
afterEach(() => vi.useRealTimers());
it('uses an authenticated enabled decision to insert the existing component without generation', async () => {
  const { request, env, send, decide, run } = setup();
  const response = await consistencyAI(request, env, send);
  expect(await response.json()).toEqual({ insert: '```c9y-button\n{"label":"Get in touch","secondary":false}\n```' });
  expect(response.headers.get('server-timing')).toMatch(/^component;dur=/);
  expect(run).not.toHaveBeenCalled(); expect(decide).toHaveBeenCalledOnce();
  const init = vi.mocked(send).mock.calls.find(([url]) => String(url).startsWith('https://api.typesafe.ai/'))![1]!;
  expect(init.redirect).toBe('error');
  expect(JSON.parse(init.body as string).state).toEqual({ request: 'Add a button', insertionAvailable: true, components: [] });
});
it('honours explicit off and missing credentials without a decision call', async () => {
  for (const key of [true, false]) {
    const { request, env, send, decide, run } = setup(false);
    if (!key) delete env.TYPESAFE_API_KEY;
    expect(await (await consistencyAI(request, env, send)).json()).toEqual({ document: 'Fallback writing' });
    expect(decide).not.toHaveBeenCalled(); expect(run).toHaveBeenCalledOnce();
  }
});
it('denies a nonowner before flag storage or decision inference', async () => {
  const { request, env, send, get, decide, run } = setup(true, false);
  expect((await consistencyAI(request, env, send)).status).toBe(403);
  expect(get).not.toHaveBeenCalled(); expect(decide).not.toHaveBeenCalled(); expect(run).not.toHaveBeenCalled();
});
it('falls back on malformed responses and provider failures without leaking credentials', async () => {
  for (const failure of [Response.json({ answers: {} }), new Response('private provider details', { status: 500 })]) {
    const { request, env, send, decide, run } = setup(); decide.mockResolvedValue(failure);
    const response = await consistencyAI(request, env, send);
    expect(await response.json()).toEqual({ document: 'Fallback writing' }); expect(run).toHaveBeenCalledOnce();
  }
});
it('works without the writing provider when the component route succeeds', async () => {
  const { request, env, send } = setup(); delete env.AI;
  expect((await consistencyAI(request, env, send)).status).toBe(200);
});
it('bounds a stalled decision and aborts its request before falling back', async () => {
  const { request, env, send, decide, run } = setup();
  decide.mockImplementation(() => new Promise(() => {}));
  vi.useFakeTimers();
  const pending = consistencyAI(request, env, send);
  await vi.advanceTimersByTimeAsync(2501);
  expect(await (await pending).json()).toEqual({ document: 'Fallback writing' });
  const init = vi.mocked(send).mock.calls.find(([url]) => String(url).startsWith('https://api.typesafe.ai/'))![1]!;
  expect(init.signal?.aborted).toBe(true); expect(run).toHaveBeenCalledOnce();
});
it('does not start generation when the originating request was cancelled', async () => {
  const { request, env, send, run, decide } = setup();
  const controller = new AbortController();
  const cancelled = new Request(request, { signal: controller.signal });
  controller.abort();
  expect((await consistencyAI(cancelled, env, send)).status).toBe(408);
  expect(decide).not.toHaveBeenCalled(); expect(run).not.toHaveBeenCalled();
});
