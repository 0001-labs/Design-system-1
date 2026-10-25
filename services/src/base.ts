import { FEATURE_FLAGS } from '../../shared/feature-flags';
import { resolveFlag } from '../../shared/feature-flags-runtime/index';
import { authorizeReport, type ReportsEnv } from './reports';
import { BASE_ID, latestKey, versionKey } from './shared/keys';

/**
 * The owner's edits to the base system, live at `/ds1/base/latest.css`.
 *
 *   GET  /api/base           the base, its live version and its history
 *   PUT  /api/base           { css, baseRev } saves a new live version
 *   POST /api/base/restore   { version } makes an earlier version live again
 *
 * Every call needs the verified owner and the `base-live-editing` flag; writes also need this
 * origin. Convex (convex/base.ts) checks the owner again and keeps every version. A version is
 * live once its sheet is in R2: `v/{n}.css` first, then `latest.css` as its byte copy, the same
 * layout libraries publish, so reading it needs neither Convex nor a session.
 */
export const BASE_FLAG = 'base-live-editing';
const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow', Vary: 'Cookie, Authorization' };
const json = (value: unknown, status = 200) => Response.json(value, { status, headers });
const fail = (code: string, message: string, status: number, details?: unknown) => json({ error: { code, message, ...(details ? { details } : {}) } }, status);

type Saved = { css: string; rev: number; version: number; updatedAt: number; sheet: string; contentHash: string; unchanged: boolean };

export async function baseApi(request: Request, env: ReportsEnv, ctx?: Pick<ExecutionContext, 'waitUntil'>, send: typeof fetch = fetch): Promise<Response> {
  const path = new URL(request.url).pathname;
  const route = path === '/api/base' ? (request.method === 'GET' ? 'get' : request.method === 'PUT' ? 'save' : null) : path === '/api/base/restore' && request.method === 'POST' ? 'restore' : null;
  if (!route) return fail('not_found', 'Unknown operation.', 404);
  if (route !== 'get' && request.headers.get('origin') !== new URL(request.url).origin) return fail('forbidden', 'Save from designsystem1.com.', 403);
  const denied = await authorizeReport(request, env, send);
  if (denied) return denied;
  if (!await flagOn(env)) return fail('disabled', 'Live base editing is off.', 404);
  const authorization = request.headers.get('authorization')!;

  if (route === 'get') {
    const [base, history] = await Promise.all([call(env, send, authorization, 'query', 'base:get', {}), call(env, send, authorization, 'query', 'base:history', {})]);
    if ('error' in base) return base.error;
    if ('error' in history) return history.error;
    return json({ base: base.value, history: history.value });
  }

  let input: Record<string, unknown>;
  try {
    const text = await request.text();
    if (text.length > 600_000) return fail('too_large', 'The base stylesheet is too large.', 413);
    input = JSON.parse(text);
  } catch { return fail('invalid_request', 'Invalid JSON.', 400); }
  const args = route === 'save'
    ? (typeof input?.css === 'string' && Number.isSafeInteger(input.baseRev) ? { css: input.css, baseRev: input.baseRev } : null)
    : (Number.isSafeInteger(input?.version) && (input.version as number) > 0 ? { version: input.version } : null);
  if (!args) return fail('invalid_request', route === 'save' ? 'Send css and baseRev.' : 'Send a version.', 400);
  const result = await call(env, send, authorization, 'mutation', route === 'save' ? 'base:save' : 'base:restore', args);
  if ('error' in result) return result.error;
  const saved = result.value as Saved;
  try { await publishBase(env, saved); }
  catch { return fail('not_live', 'Saved, but not live yet. Save again to publish it.', 502, { version: saved.version }); }
  // This location's edge copy goes at once; others follow within latest.css's ten-second s-maxage.
  if (ctx && typeof caches !== 'undefined') ctx.waitUntil(caches.default.delete(new Request(new URL(`/ds1/${BASE_ID}/latest.css`, request.url))).catch(() => false));
  return json({ base: { ...saved, unchanged: undefined } });
}

/** The version first, then `latest.css`: a reader never meets a pointer to bytes that are not there. */
export async function publishBase(env: Pick<ReportsEnv, 'LIBRARIES'>, saved: Pick<Saved, 'version' | 'sheet' | 'contentHash'>) {
  const options = { httpMetadata: { contentType: 'text/css; charset=utf-8' }, customMetadata: { version: String(saved.version), contentHash: saved.contentHash } };
  await env.LIBRARIES.put(versionKey(BASE_ID, saved.version), saved.sheet, options);
  await env.LIBRARIES.put(latestKey(BASE_ID), saved.sheet, options);
}

async function flagOn(env: ReportsEnv) {
  const object = await env.LIBRARIES.get(`feature-flags/${BASE_FLAG}.json`);
  const rules = object ? { [BASE_FLAG]: await object.json() } : {};
  return resolveFlag(FEATURE_FLAGS, BASE_FLAG, rules, { accountId: env.REPORTS_OWNER_ID, isOwner: true });
}

async function call(env: ReportsEnv, send: typeof fetch, authorization: string, kind: 'query' | 'mutation', path: string, args: unknown): Promise<{ value: unknown } | { error: Response }> {
  try {
    const response = await send(`${env.REPORTS_AUTH_URL}/api/${kind}`, {
      method: 'POST', headers: { authorization, 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, args: [args], format: 'convex_encoded_json' }), redirect: 'manual', signal: AbortSignal.timeout(20_000),
    });
    if (response.status === 401 || response.status === 403) return { error: fail('unauthenticated', 'Sign in again.', 401) };
    if (!response.ok) return { error: fail('upstream_error', 'The base could not be reached.', 502) };
    const result = await response.json() as { status: string; value?: unknown; errorData?: { code?: unknown; message?: unknown; details?: unknown } };
    if (result.status === 'success') return { value: result.value ?? null };
    const code = typeof result.errorData?.code === 'string' ? result.errorData.code : 'request_failed';
    const status = code === 'draft_conflict' ? 409 : code === 'forbidden' ? 403 : code === 'unauthenticated' ? 401 : code === 'not_found' ? 404 : 400;
    return { error: fail(code, typeof result.errorData?.message === 'string' ? result.errorData.message : 'The request could not be completed.', status, result.errorData?.details) };
  } catch { return { error: fail('upstream_error', 'The base could not be reached.', 502) }; }
}
