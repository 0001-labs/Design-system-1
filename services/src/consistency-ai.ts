/** The private editor's inference transport. Provider credentials never reach the browser. */
import { authorizeReport, type ReportsEnv } from './reports';
import { sessionRequest } from './dashboard';
import { CONSISTENCY_HOST } from './consistency';
export interface PreviewAIEnv extends ReportsEnv { AI?: Ai }
const headers = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow', 'X-Content-Type-Options': 'nosniff', Vary: 'Cookie, Authorization' };
const error = (message: string, status: number) => Response.json({ error: message }, { status, headers });
export async function consistencyAI(request: Request, env: PreviewAIEnv, send: typeof fetch = fetch): Promise<Response> {
  const url = new URL(request.url);
  if (url.hostname !== CONSISTENCY_HOST || url.protocol !== 'https:') return error('Not found.', 404);
  if (request.method !== 'POST') return error('Use POST.', 405);
  if (request.headers.get('origin') !== url.origin) return error('Request origin is not allowed.', 403);
  const denied = await authorizeReport(sessionRequest(new Request(request.url, { headers: request.headers })), env, send);
  if (denied) return denied;
  if (!env.AI) return error('AI is not configured.', 503);
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
  if (!input || typeof input !== 'object' || typeof input.prompt !== 'string' || !input.prompt.trim() || input.prompt.length > 4000 || !['writing', 'diagram'].includes(String(input.kind))) return error('Provide a prompt and editing kind.', 400);
  for (const name of ['text', 'before', 'after', 'document']) if (input[name] !== undefined && typeof input[name] !== 'string') return error('Invalid document context.', 400);
  const wholeDocument = input.kind === 'writing' && typeof input.document === 'string';
  const instruction = input.kind === 'diagram'
    ? 'Edit the supplied diagram according to the instruction. Return only its updated source. Preserve its source format. No explanation or surrounding code fences.'
    : wholeDocument
      ? 'Edit this Markdown document according to the instruction. The marker ⟦here⟧ indicates where to insert new writing. Return the entire updated Markdown document, preserving everything unrelated. Remove the marker. No explanation or surrounding code fences.'
      : 'Rewrite the selected Markdown according to the instruction. Return only replacement Markdown for the selected text. Use before and after as context only; do not include them in your answer. No explanation or surrounding code fences.';
  try {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const answer = await Promise.race([env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [{ role: 'system', content: instruction }, { role: 'user', content: JSON.stringify({ instruction: input.prompt, text: input.text ?? '', before: input.before, after: input.after, document: input.document }) }],
      max_tokens: 4096, temperature: 0.3,
    }), new Promise<never>((_, reject) => { timeout = setTimeout(() => reject(new Error('timeout')), 45_000); })]).finally(() => clearTimeout(timeout));
    if (!answer || typeof answer !== 'object' || !('response' in answer) || typeof answer.response !== 'string' || !answer.response.trim() || answer.response.length > 64_000) return error('AI returned no writing. Try again.', 502);
    return Response.json(wholeDocument ? { document: answer.response } : { insert: answer.response }, { headers });
  } catch { return error('AI could not complete this edit. Try again.', 502); }
}
