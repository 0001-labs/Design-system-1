/**
 * Consistency's app asking a site, as the owner: `/api/consistency/sites/<code>/…` on the Consistency hosts, answered
 * by the platform's `ConsistencyWorkspace` through the service binding and nothing else.
 *
 * - `api/<route>`: one of the site engine's own routes (`/team/api/<route>`) or Flavo's `business` and `design`, from the
 *   allowlist below with the methods each takes, the query string passed on. The platform asks that site's own
 *   object as the owner and checks the same list again. `pages`, `page?path=` and `edit` are the older addresses
 *   of `api/pages`, `api/page` and `api/edit`.
 * - `GET places`: the menus the app shows for the site, from its current build's config.
 * - `GET document?path=`: the site's page for the editor's frame, and `GET files/<path>` the styles, fonts,
 *   pictures and video it loads. Both are served on this origin, so this answer carries the sandbox: the page is
 *   `sandbox allow-same-origin` with no script source at all, so nothing of the site's runs here with the
 *   owner's cookies even when the address is opened on its own; a file is sandboxed too and only of the types a
 *   page draws with (an SVG opened alone cannot run either).
 *
 * Every route checks the owner first, as the other workspace routes do; a write is same-origin JSON, bounded.
 */
// A site by its IDv1 code, a list's shape (`12ABCD`); the platform alone knows its id.
export const SITE_ROUTE = /^\/api\/consistency\/sites\/(\d{2}[A-Za-z]{4})\/(pages|page|edit|document|places|api\/[\w/-]{1,160}|files\/[^?#]{1,512})$/;
const METHODS: Record<string, string[]> = { document: ['GET'], places: ['GET'], files: ['GET', 'HEAD'] };
/** A write to the site engine (its own limit is 32,000 characters); the JSON around a 10,000-character field fits. */
export const EDIT_BYTES = 64 * 1024;
/** A write to Flavo's business store, its own limit. */
export const BUSINESS_BYTES = 1_000_000;
/** The longest query string passed on. */
export const QUERY_LIMIT = 2048;

const UUID = '[0-9a-f-]{36}';
const allow = (pattern: string, ...methods: string[]) => ({ pattern: new RegExp(`^${pattern}$`), methods });
/** The site engine's routes the app may ask, as the platform lists them (`Consistency/platform/worker/owner-api.ts`). */
export const API_ROUTES = [
  allow('me', 'GET'), allow('pages', 'GET'), allow('page', 'GET'), allow('history', 'GET'), allow('detached', 'GET'),
  allow('edit', 'POST'), allow('reset', 'POST'),
  allow('emails', 'GET'), allow('emails/templates', 'GET'), allow('emails/[\\w-]{1,64}', 'GET'),
  allow('bookings', 'GET'), allow(`bookings/${UUID}`, 'GET'), allow(`bookings/${UUID}/cancel`, 'POST'),
  allow('booking-offers', 'GET', 'PUT'), allow('booking-settings', 'GET', 'PUT'),
  allow('giftcards', 'GET', 'POST'), allow(`giftcards/${UUID}`, 'GET'), allow(`giftcards/${UUID}/pdf`, 'GET'), allow(`giftcards/${UUID}/(?:resend|void)`, 'POST'),
  allow('orders', 'GET'), allow('orders/config', 'GET'), allow(`orders/${UUID}`, 'GET'),
  allow(`orders/${UUID}/(?:confirm|cancel|mark-paid|invoice|fulfil)`, 'POST'), allow(`orders/${UUID}/note`, 'PUT'), allow('order-settings', 'GET', 'PUT'),
  // Flavo's own: its business operations and its homepage design (the platform answers them for Flavo alone).
  allow('business', 'POST'), allow('design', 'GET', 'PUT'),
] as const;

/** The allowlisted route a path under `api/` names, or null. */
export const apiRoute = (path: string) => API_ROUTES.find(each => each.pattern.test(path)) ?? null;

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
  const named = match[2]!;
  const route = named.startsWith('files/') ? 'files' : named.startsWith('api/') || named === 'pages' || named === 'page' || named === 'edit' ? 'api' : named;
  const path = route === 'api' ? (named.startsWith('api/') ? named.slice(4) : named) : '';
  const allowed = route === 'api' ? apiRoute(path) : null;
  if (route === 'api' && !allowed) return refuse('Not found', 404);
  const denied = await authorize(new Request(request.url, { headers: request.headers })); if (denied) return denied;
  const methods = allowed ? [...allowed.methods] : METHODS[route]!;
  if (!methods.includes(request.method)) return refuse('Method not allowed', 405, { Allow: methods.join(', ') });
  if (url.search.length > QUERY_LIMIT) return refuse('Bad query', 400);
  const page = url.searchParams.get('path');
  if ((path === 'page' || route === 'document') && !isPagePath(page)) return refuse('Bad path', 400);
  let body: Uint8Array | undefined;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    if (request.headers.get('Origin') !== url.origin || request.headers.get('Content-Type')?.split(';')[0]?.trim() !== 'application/json') return refuse('Forbidden', 403);
    const read = await bounded(request, path === 'business' ? BUSINESS_BYTES : EDIT_BYTES);
    if (!read) return refuse('Too large', 413);
    body = read;
  }
  if (!env.CONSISTENCY_WORKSPACE) return refuse('Workspace unavailable', 503);
  // A route of the API takes its whole query; the page routes take the page's path alone.
  const search = route === 'api' && path !== 'page' ? url.search : path === 'page' || route === 'document' ? `?path=${encodeURIComponent(page!)}` : '';
  const target = route === 'api' ? `/api/consistency/sites/${match[1]}/api/${path}` : url.pathname;
  const answer = await env.CONSISTENCY_WORKSPACE.fetch(new Request(`https://workspace.internal${target}${search}`, { method: request.method, body, headers: body ? { 'Content-Type': 'application/json' } : {} }));
  if (route !== 'document' && route !== 'files') {
    const result = new Response(answer.body, answer);
    result.headers.set('X-Content-Type-Options', 'nosniff');
    result.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
    return result;
  }
  const type = answer.headers.get('Content-Type') ?? '';
  const result = new Response(answer.body, answer);
  if (answer.ok && route === 'document' && !/^text\/html(?:;|$)/i.test(type)) return refuse('Not a page', 502);
  if (answer.ok && route === 'files' && !CANVAS_TYPE.test(type)) return refuse('Not a file the page draws with', 415);
  result.headers.set('Content-Security-Policy', route === 'document' ? DOCUMENT_POLICY : FILE_POLICY);
  result.headers.set('X-Content-Type-Options', 'nosniff');
  result.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  return result;
}
