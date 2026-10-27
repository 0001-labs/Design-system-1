/** The private editor's inference transport. Provider credentials never reach the browser. */
import { authorizeReport, type ReportsEnv } from './reports';
import { sessionRequest } from './dashboard';
import { isConsistencyHost } from './consistency';
import { routeComponentEdit, type ComponentRoutingEnv } from './consistency-routing';
import { systemOwner, type OwnerEnv } from './consistency-owner';
import { FEATURE_FLAGS } from '../../shared/feature-flags';
import { resolveFlag } from '../../shared/feature-flags-runtime/index';
import { COMPONENT_ROUTING_FLAG, COMPONENT_ROUTING_MODEL, COMPONENT_ROUTING_TIMEOUT } from '../../shared/consistency-routing';
import { ASK_LEVELS, ASK_TIMEOUTS, askHeuristic, askJudgmentQuestions, askPrompt, checkAskAnswer, readAskJudgment, type AskDocument, type AskInput, type AskJudgment, type AskLevel } from '../../shared/consistency-ask';
export interface PreviewAIEnv extends ReportsEnv, ComponentRoutingEnv, OwnerEnv { AI?: Ai }
const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
const headers = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow', 'X-Content-Type-Options': 'nosniff', Vary: 'Cookie, Authorization' };
const error = (message: string, status: number, extra: Record<string, string> = {}) => Response.json({ error: message }, { status, headers: { ...headers, ...extra } });
export async function consistencyAI(request: Request, env: PreviewAIEnv, send: typeof fetch = fetch): Promise<Response> {
  const url = new URL(request.url);
  if (!isConsistencyHost(url.hostname) || url.protocol !== 'https:') return error('Not found.', 404);
  if (request.method !== 'POST') return error('Use POST.', 405);
  if (request.headers.get('origin') !== url.origin) return error('Request origin is not allowed.', 403);
  const denied = (await systemOwner(request, env)) ? null : await authorizeReport(sessionRequest(new Request(request.url, { headers: request.headers })), env, send);
  if (denied) return denied;
  if (!request.headers.get('content-type')?.startsWith('application/json')) return error('Send JSON.', 415);
  // Bound streamed input too: Content-Length alone is not trustworthy.
  const reader = request.body?.getReader();
  if (!reader) return error('The request is empty.', 400);
  const chunks: Uint8Array[] = []; let bytes = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > 100_000) { await reader.cancel(); return error('The document is too long for AI.', 413); }
    chunks.push(value);
  }
  let input: Record<string, unknown>;
  try { input = JSON.parse(await new Blob(chunks).text()); } catch { return error('Invalid JSON.', 400); }
  if (!input || typeof input !== 'object' || typeof input.prompt !== 'string' || !input.prompt.trim() || input.prompt.length > 4000 || !['writing', 'diagram', ...ASK_LEVELS].includes(String(input.kind))) return error('Provide a prompt and editing kind.', 400);
  if ((ASK_LEVELS as readonly string[]).includes(String(input.kind))) return ask(request, input, env, send);
  for (const name of ['text', 'before', 'after', 'document']) if (input[name] !== undefined && typeof input[name] !== 'string') return error('Invalid document context.', 400);
  const routingStarted = Date.now();
  const routed = await routeComponentEdit({ prompt: input.prompt, kind: String(input.kind), text: input.text as string | undefined, document: input.document as string | undefined }, env, send, request.signal);
  if (request.signal.aborted) return error('The edit was cancelled.', 408);
  if (routed) return Response.json(routed, { headers: { ...headers, 'Server-Timing': `component;dur=${Date.now() - routingStarted}` } });
  if (!env.AI) return error('AI is not configured.', 503);
  const wholeDocument = input.kind === 'writing' && typeof input.document === 'string';
  const instruction = input.kind === 'diagram'
    ? 'Edit the supplied diagram according to the instruction. Return only its updated source. Preserve its source format. No explanation or surrounding code fences.'
    : wholeDocument
      ? 'Edit this Markdown document according to the instruction. The marker ⟦here⟧ indicates where to insert new writing. Return the entire updated Markdown document, preserving everything unrelated. Remove the marker. No explanation or surrounding code fences.'
      : 'Rewrite the selected Markdown according to the instruction. Return only replacement Markdown for the selected text. Use before and after as context only; do not include them in your answer. No explanation or surrounding code fences.';
  try {
    const answer = await generate(env.AI, [{ role: 'system', content: instruction }, { role: 'user', content: JSON.stringify({ instruction: input.prompt, text: input.text ?? '', before: input.before, after: input.after, document: input.document }) }], 4096, 45_000);
    if (!answer) return error('AI returned no writing. Try again.', 502);
    return Response.json(wholeDocument ? { document: answer } : { insert: answer }, { headers });
  } catch { return error('AI could not complete this edit. Try again.', 502); }
}
/** One run of the generator, bounded in time and length; empty or overlong writing is no answer. */
async function generate(ai: Ai, messages: Array<{ role: string; content: string }>, maxTokens: number, timeoutMs: number): Promise<string | null> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const answer = await Promise.race([ai.run(MODEL, { messages, max_tokens: maxTokens, temperature: 0.3 }), new Promise<never>((_, reject) => { timeout = setTimeout(() => reject(new Error('timeout')), timeoutMs); })]).finally(() => clearTimeout(timeout));
  if (!answer || typeof answer !== 'object' || !('response' in answer) || typeof answer.response !== 'string' || !answer.response.trim() || answer.response.length > 64_000) return null;
  return answer.response;
}

/*
 * Ask, on the vocabulary: a section or a page generated from a request in free text. The judgment
 * (TypeSafe, behind the component routing flag and the same timeout) decides the intent, the kind
 * and the pictures meant; without it a heuristic reads the request. The generator writes one JSON
 * object; `checkAskAnswer` keeps only what the vocabulary can say, and a refusal answers 422 with
 * the words to show. The browser sends the page's context; the platform validates again on save.
 */
const strings = (value: unknown, max: number): string[] | null => Array.isArray(value) && value.length <= max && value.every(item => typeof item === 'string' && item.length <= 4000) ? value as string[] : null;
async function ask(request: Request, input: Record<string, unknown>, env: PreviewAIEnv, send: typeof fetch): Promise<Response> {
  const level = input.kind as AskLevel;
  const images = strings(input.images ?? [], 400), collections = strings(input.collections ?? [], 100);
  if (!images || !collections) return error('Invalid site context.', 400);
  const runtimes: Record<string, readonly string[]> = {};
  if (input.runtimes !== undefined) {
    if (!input.runtimes || typeof input.runtimes !== 'object' || Array.isArray(input.runtimes)) return error('Invalid site context.', 400);
    for (const [name, props] of Object.entries(input.runtimes as Record<string, unknown>)) { const keys = strings(props, 100); if (!keys || name.length > 80) return error('Invalid site context.', 400); runtimes[name] = keys; }
  }
  if (input.document !== undefined && (!input.document || typeof input.document !== 'object' || Array.isArray(input.document) || !Array.isArray((input.document as { blocks?: unknown }).blocks))) return error('Invalid document context.', 400);
  if (input.selected !== undefined && typeof input.selected !== 'string') return error('Invalid document context.', 400);
  const site = input.site && typeof input.site === 'object' && !Array.isArray(input.site) ? input.site as Record<string, unknown> : {};
  const pages = Array.isArray(site.pages) ? site.pages.filter((page): page is { path: string; title?: string } => !!page && typeof page === 'object' && typeof (page as { path?: unknown }).path === 'string').slice(0, 60).map(page => ({ path: page.path, ...(typeof page.title === 'string' ? { title: page.title } : {}) })) : [];
  const asked: AskInput = {
    level, prompt: input.prompt as string, document: input.document as AskDocument | undefined, selected: input.selected as string | undefined, images, collections, runtimes,
    site: { ...(typeof site.name === 'string' ? { name: site.name.slice(0, 200) } : {}), ...(typeof site.lang === 'string' ? { lang: site.lang.slice(0, 20) } : {}), ...(typeof site.origin === 'string' ? { origin: site.origin.slice(0, 200) } : {}), pages },
  };
  const judgmentStarted = Date.now();
  const judgment = (await askJudgment(asked, env, send, request.signal)) ?? askHeuristic(asked);
  const judgmentTime = Date.now() - judgmentStarted;
  if (request.signal.aborted) return error('The edit was cancelled.', 408);
  if (!env.AI) return error('AI is not configured.', 503);
  const timing = (generateTime: number) => ({ 'Server-Timing': `judgment;dur=${judgmentTime}, generate;dur=${generateTime}` });
  const { system, user } = askPrompt(level, asked, judgment);
  const generateStarted = Date.now();
  let answer: string | null;
  try { answer = await generate(env.AI, [{ role: 'system', content: system }, { role: 'user', content: user }], level === 'page' ? 8192 : 4096, ASK_TIMEOUTS[level]); }
  catch { return error('Ask did not get an answer. Try again.', 502, timing(Date.now() - generateStarted)); }
  if (!answer) return error('Ask did not get an answer. Try again.', 502, timing(Date.now() - generateStarted));
  const ids = new Set<string>();
  const collect = (blocks: unknown) => { if (!Array.isArray(blocks)) return; for (const block of blocks) if (block && typeof block === 'object') { if (typeof (block as { id?: unknown }).id === 'string') ids.add((block as { id: string }).id); collect((block as { children?: unknown }).children); } };
  collect(asked.document?.blocks);
  const checked = checkAskAnswer(answer, level, { images, collections, runtimes, site: asked.site, ids, layout: asked.document?.layout });
  const responseHeaders = { ...headers, ...timing(Date.now() - generateStarted) };
  if (!checked.ok) return Response.json({ error: `Ask could not use the answer: ${checked.refusal}` }, { status: 422, headers: responseHeaders });
  if (checked.level === 'section') return Response.json({ level, intent: judgment.intent, ...(judgment.kind ? { kind: judgment.kind } : {}), block: checked.block }, { headers: responseHeaders });
  return Response.json({ level, intent: 'rewrite', document: checked.document }, { headers: responseHeaders });
}
/** The judgment, when the TypeSafe key and the flag are there; null when it is off, slow, failed or unsure. Caller has authorized the owner. */
async function askJudgment(input: AskInput, env: PreviewAIEnv, send: typeof fetch, signal: AbortSignal): Promise<AskJudgment | null> {
  if (!env.TYPESAFE_API_KEY || signal.aborted) return null;
  const abort = new AbortController();
  const cancel = () => abort.abort();
  signal.addEventListener('abort', cancel, { once: true });
  let timer: ReturnType<typeof setTimeout> | undefined;
  const work = async () => {
    const object = await env.LIBRARIES.get(`feature-flags/${COMPONENT_ROUTING_FLAG}.json`);
    const rules = object ? { [COMPONENT_ROUTING_FLAG]: await object.json() } : {};
    if (!resolveFlag(FEATURE_FLAGS, COMPONENT_ROUTING_FLAG, rules, { accountId: env.REPORTS_OWNER_ID, isOwner: true }) || abort.signal.aborted) return null;
    const { state, questions } = askJudgmentQuestions(input);
    const response = await send('https://api.typesafe.ai/v1/systemone', {
      method: 'POST', headers: { authorization: `Bearer ${env.TYPESAFE_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ model: COMPONENT_ROUTING_MODEL, state, questions }),
      signal: abort.signal, redirect: 'error',
    });
    if (!response.ok || abort.signal.aborted) return null;
    const body: unknown = await response.json();
    return abort.signal.aborted ? null : readAskJudgment(input, body);
  };
  try {
    return await Promise.race([work(), new Promise<null>(resolve => { timer = setTimeout(() => { cancel(); resolve(null); }, COMPONENT_ROUTING_TIMEOUT); })]);
  } catch { return null; }
  finally { clearTimeout(timer); signal.removeEventListener('abort', cancel); }
}
