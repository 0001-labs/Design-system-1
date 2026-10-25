/**
 * The owner's editor editing a site's words: `/api/consistency/sites/<id>/…` on the Consistency hosts, answered by
 * the platform's `ConsistencyWorkspace` through the service binding and nothing else.
 *
 * - `GET pages`, `GET page?path=` and `POST edit { path, key, markdown }`: Team CMS's data and a save, made by the
 *   platform as the owner in that site's own object, with Team CMS's own rules for the key, images and meta.
 * - `GET document?path=`: the site's page for the editor's frame, and `GET files/<path>` the styles, fonts,
 *   pictures and video it loads. Both are served on this origin, so this answer carries the sandbox: the page is
 *   `sandbox allow-same-origin` with no script source at all, so nothing of the site's runs here with the
 *   owner's cookies even when the address is opened on its own; a file is sandboxed too and only of the types a
 *   page draws with (an SVG opened alone cannot run either).
 *
 * Every route checks the owner as the other workspace routes do; a write is same-origin JSON, bounded.
 */
// A site by its IDv1 code, a list's shape (`12ABCD`); the platform alone knows its id.
export const SITE_ROUTE = /^\/api\/consistency\/sites\/(\d{2}[A-Za-z]{4})\/(pages|page|edit|document|files\/[^?#]{1,512})$/;
const METHODS: Record<string, string[]> = { pages: ['GET'], page: ['GET'], document: ['GET'], edit: ['POST'], files: ['GET', 'HEAD'] };
/** A Team CMS field takes 10,000 characters of Markdown; the JSON around it fits in this. */
export const EDIT_BYTES = 64 * 1024;

/** The page in the editor's frame: drawn with its own styles and pictures, never a script, a form, a frame or a plugin. */
export const DOCUMENT_POLICY = "sandbox allow-same-origin; default-src 'none'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; media-src 'self' https:; frame-ancestors 'self'; form-action 'none'; base-uri 'none'";
/** A file the page loads, which could be opened on its own. */
export const FILE_POLICY = "sandbox; default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; frame-ancestors 'self'";
const CANVAS_TYPE = /^(?:text\/css|font\/[\w.+-]+|application\/font-woff|image\/[\w.+-]+|video\/[\w.+-]+)(?:;|$)/i;

interface Gateway { CONSISTENCY_WORKSPACE?: Fetcher }

const refuse = (error: string, status: number, headers: Record<string, string> = {}) => Response.json({ error }, { status, headers });

/** Whether `path=` is a page's address as the manifest writes it. */
export const isPagePath = (value: string | null): value is string => typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && value.length <= 512 && !/[\p{Cc}\\]/u.test(value);

async function bounded(request: Request, limit: number): Promise<Uint8Array | null> {
  const reader = request.body?.getReader(); const chunks: Uint8Array[] = []; let size = 0;
  if (reader) for (;;) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > limit) { await reader.cancel(); return null; } chunks.push(value); }
  const body = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
  return body;
}

export async function sitesApi(request: Request, env: Gateway, authorize: (request: Request) => Promise<Response | null>): Promise<Response> {
  const url = new URL(request.url);
  const match = SITE_ROUTE.exec(url.pathname);
  if (!match) return refuse('Not found', 404);
  const route = match[2]!.startsWith('files/') ? 'files' : match[2]!;
  const denied = await authorize(new Request(request.url, { headers: request.headers })); if (denied) return denied;
  if (!METHODS[route]!.includes(request.method)) return refuse('Method not allowed', 405, { Allow: METHODS[route]!.join(', ') });
  const path = url.searchParams.get('path');
  if ((route === 'page' || route === 'document') && !isPagePath(path)) return refuse('Bad path', 400);
  let body: Uint8Array | undefined;
  if (route === 'edit') {
    if (request.headers.get('Origin') !== url.origin || request.headers.get('Content-Type')?.split(';')[0]?.trim() !== 'application/json') return refuse('Forbidden', 403);
    const read = await bounded(request, EDIT_BYTES);
    if (!read) return refuse('Too large', 413);
    body = read;
  }
  if (!env.CONSISTENCY_WORKSPACE) return refuse('Workspace unavailable', 503);
  const search = route === 'page' || route === 'document' ? `?path=${encodeURIComponent(path!)}` : '';
  const answer = await env.CONSISTENCY_WORKSPACE.fetch(new Request(`https://workspace.internal${url.pathname}${search}`, { method: request.method, body, headers: body ? { 'Content-Type': 'application/json' } : {} }));
  if (route !== 'document' && route !== 'files') return answer;
  const type = answer.headers.get('Content-Type') ?? '';
  const result = new Response(answer.body, answer);
  if (answer.ok && route === 'document' && !/^text\/html(?:;|$)/i.test(type)) return refuse('Not a page', 502);
  if (answer.ok && route === 'files' && !CANVAS_TYPE.test(type)) return refuse('Not a file the page draws with', 415);
  result.headers.set('Content-Security-Policy', route === 'document' ? DOCUMENT_POLICY : FILE_POLICY);
  result.headers.set('X-Content-Type-Options', 'nosniff');
  result.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  return result;
}
