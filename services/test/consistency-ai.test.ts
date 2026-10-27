import { afterEach, expect, it, vi } from 'vite-plus/test';
import { consistencyAI, type PreviewAIEnv } from '../src/consistency-ai';
const origin = 'https://editor.c9y.site';
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

/*
 * Ask, on the vocabulary: a section or a page generated from a request. The judgment runs through
 * TypeSafe behind the component routing flag; without it the heuristic reads the request. The
 * generator's answer passes `checkAskAnswer` before it is given, and a refusal answers 422.
 */
const nativeDocument = { schema: 1, kind: 'native-page', title: 'Harbour rafts', lang: 'en', layout: { padding: 20, gap: 40 }, blocks: [
  { id: 'top', kind: 'hero', height: 24, picture: { src: '/photos/harbour.jpg', alt: 'Three rafts' }, title: 'The cosiest boat hire in town' },
  { id: 'tours', kind: 'cards', items: [{ title: 'Green raft' }] },
] };
const generatedHero = { id: 'top', kind: 'hero', height: 23.6, panel: 'left', panelTone: 'dark', picture: { src: '/photos/harbour.jpg', alt: 'The harbour at dusk' }, title: 'A night on the water', actions: [{ text: 'Book', href: '/book/', appearance: 'primary' }] };
const askBody = (kind: 'section' | 'page', prompt = 'A hero with the harbour photo and a Book button', extra: Record<string, unknown> = {}) => ({ kind, prompt, document: nativeDocument, selected: 'tours', images: ['/photos/harbour.jpg', '/photos/logo.svg'], collections: [], runtimes: { MenuToggle: [] }, site: { name: 'Harbour rafts', lang: 'en', origin: 'https://native.example', pages: [{ path: '/', title: 'Home' }, { path: '/book/', title: 'Book' }] }, ...extra });
it('asks for a section: the heuristic judges without TypeSafe, the generator writes JSON, the check snaps it and the answer is the clean block', async () => {
  const { env, send, run } = setup();
  run.mockResolvedValueOnce({ response: 'Here it is:\n```json\n' + JSON.stringify({ ...generatedHero, extra: 'dropped' }) + '\n```' });
  const response = await consistencyAI(request(askBody('section')), env, send);
  expect(response.status).toBe(200);
  const body = await response.json() as { level: string; intent: string; kind?: string; block: Record<string, unknown> };
  expect(body).toMatchObject({ level: 'section', intent: 'make', kind: 'hero' });
  expect(body.block).toMatchObject({ kind: 'hero', height: 24, panel: 'left', panelTone: 'dark', title: 'A night on the water' });
  expect(body.block.id).not.toBe('top'); expect(body.block).not.toHaveProperty('extra');
  expect(response.headers.get('server-timing')).toMatch(/^judgment;dur=\d+, generate;dur=\d+$/);
  const [model, options] = run.mock.calls[0] as unknown as [string, { messages: Array<{ role: string; content: string }>; max_tokens: number }];
  expect(model).toBe('@cf/meta/llama-3.3-70b-instruct-fp8-fast'); expect(options.max_tokens).toBe(4096);
  expect(options.messages[0]!.content).toMatch(/exactly one JSON object/);
  const prompt = JSON.parse(options.messages[1]!.content);
  expect(prompt).toMatchObject({ request: 'A hero with the harbour photo and a Book button', level: 'section', intent: 'make', kind: 'hero' });
  expect(prompt.vocabulary.kinds.map((kind: { kind: string }) => kind.kind)).toEqual(['hero']);
  expect(prompt.pictures[0]).toEqual({ src: '/photos/harbour.jpg', alt: 'Three rafts' });
  expect(prompt.selected.id).toBe('tours');
});
it('refuses an answer outside the vocabulary with the words to show, and an answer that is not JSON', async () => {
  const { env, send, run } = setup();
  run.mockResolvedValueOnce({ response: JSON.stringify({ ...generatedHero, panelTone: 'mint' }) });
  const refused = await consistencyAI(request(askBody('section')), env, send);
  expect(refused.status).toBe(422);
  expect((await refused.json() as { error: string }).error).toMatch(/^Ask could not use the answer: hero → panelTone: "mint" is not a tone/);
  run.mockResolvedValueOnce({ response: JSON.stringify({ ...generatedHero, picture: { src: 'https://elsewhere.example/a.jpg', alt: '' } }) });
  expect((await consistencyAI(request(askBody('section')), env, send)).status).toBe(422);
  run.mockResolvedValueOnce({ response: 'I would rather explain the hero.' });
  const prose = await consistencyAI(request(askBody('section')), env, send);
  expect(prose.status).toBe(422); expect((await prose.json() as { error: string }).error).toContain('not one JSON object');
});
it('asks for a page: a whole document comes back checked, with the page\'s layout and a longer time', async () => {
  const { env, send, run } = setup();
  run.mockResolvedValueOnce({ response: JSON.stringify({ title: 'The floating shelter', lang: 'en', blocks: [generatedHero, { id: 'faq', kind: 'questions', items: [{ question: 'Where?', answer: 'In the harbour.' }] }] }) });
  const response = await consistencyAI(request(askBody('page', 'A page about the floating shelter with questions')), env, send);
  expect(response.status).toBe(200);
  const body = await response.json() as { level: string; intent: string; document: { title: string; layout: unknown; blocks: Array<{ kind: string }> } };
  expect(body.level).toBe('page'); expect(body.intent).toBe('rewrite');
  expect(body.document).toMatchObject({ schema: 1, kind: 'native-page', title: 'The floating shelter', layout: { padding: 20, gap: 40 } });
  expect(body.document.blocks.map(block => block.kind)).toEqual(['hero', 'questions']);
  expect((run.mock.calls[0] as unknown as [string, { max_tokens: number }])[1].max_tokens).toBe(8192);
  run.mockImplementation(() => new Promise(() => {}));
  vi.useFakeTimers();
  const pending = consistencyAI(request(askBody('page')), env, send);
  await vi.advanceTimersByTimeAsync(45_001);
  await vi.advanceTimersByTimeAsync(15_000);
  const slow = await pending;
  expect(slow.status).toBe(502); expect((await slow.json() as { error: string }).error).toBe('Ask did not get an answer. Try again.');
});
it('judges with TypeSafe when the key and flag are there: the intent, the kind and the pictures come from its answers', async () => {
  const { env, send, run } = setup();
  const get = vi.fn(async () => ({ json: async () => ({ enabled: true, audience: 'owner' }) }));
  const decide = vi.fn(async () => Response.json({ answers: { change: { type: 'noul', noul: 0.98 }, intent: { type: 'choice', choice: 'replace', confidence: 0.9, probabilities: {} }, kind: { type: 'choice', choice: 'cards', confidence: 0.85, probabilities: {} }, picture_0: { type: 'noul', noul: 0.1 }, picture_1: { type: 'noul', noul: 0.9 } } }));
  const both: typeof fetch = vi.fn(async (url, init) => String(url).startsWith("https://api.typesafe.ai/") ? decide() : (send as typeof fetch)(url, init));
  const judgedEnv = { ...env, TYPESAFE_API_KEY: 'fixture-key', LIBRARIES: { get } } as unknown as PreviewAIEnv;
  run.mockResolvedValueOnce({ response: JSON.stringify({ id: 'tours', kind: 'cards', columns: 3, items: [{ title: 'Green raft', picture: { src: '/photos/logo.svg', alt: 'The mark' } }, { title: 'Sunset' }, { title: 'Quiz' }] }) });
  const response = await consistencyAI(request(askBody('section', 'Turn this into three cards with the logo')), judgedEnv, both);
  expect(await response.json()).toMatchObject({ level: 'section', intent: 'replace', kind: 'cards', block: { kind: 'cards', columns: 3 } });
  expect(decide).toHaveBeenCalledOnce(); expect(get).toHaveBeenCalledWith('feature-flags/consistency-component-routing.json');
  const init = vi.mocked(both).mock.calls.find(([url]) => String(url).startsWith('https://api.typesafe.ai/'))![1]!;
  const sent = JSON.parse(init.body as string);
  expect(sent.model).toBe('jev-1.13.0'); expect(sent.state).toMatchObject({ request: 'Turn this into three cards with the logo', level: 'section', selected: { kind: 'cards' } });
  expect(Object.keys(sent.questions)).toEqual(['change', 'intent', 'kind', 'picture_0', 'picture_1']);
  const prompt = JSON.parse((run.mock.calls[0] as unknown as [string, { messages: Array<{ content: string }> }])[1].messages[1]!.content);
  expect(prompt.pictures[0].src).toBe('/photos/logo.svg');
});
it('rejects a malformed Ask context before any inference, and needs the generator', async () => {
  const { env, send, run } = setup();
  expect((await consistencyAI(request(askBody('section', 'A hero', { images: 'nope' })), env, send)).status).toBe(400);
  expect((await consistencyAI(request(askBody('section', 'A hero', { document: { blocks: 'nope' } })), env, send)).status).toBe(400);
  expect((await consistencyAI(request(askBody('section', 'A hero', { runtimes: { Cart: 'label' } })), env, send)).status).toBe(400);
  expect(run).not.toHaveBeenCalled();
  expect((await consistencyAI(request(askBody('section')), { ...env, AI: undefined }, send)).status).toBe(503);
});
