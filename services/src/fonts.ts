/** Private font workspace. Every data and font request verifies the existing owner session. */
import type { ReportsEnv } from './reports';

const OWNER_EMAIL = 'jaa90@icloud.com';
const MAX_FONT_BYTES = 10 * 1024 * 1024;
/** The faces in development. Each build is stored by content hash under fonts/<id>/, and fonts/<id>/current.json names the one shown. */
const DEVELOPMENT: Record<string, { name: string; detail: string }> = {
  supernatural: { name: 'Supernatural', detail: 'Handwriting · In development' },
  '0001-sans': { name: '0001 Sans', detail: 'Sans · In development' },
};
const isDevelopment = (id: string) => Object.hasOwn(DEVELOPMENT, id);
const currentKey = (id: string) => `fonts/${id}/current.json`;
const headers = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow', 'X-Content-Type-Options': 'nosniff', Vary: 'Authorization' };
const json = (value: unknown, status = 200) => Response.json(value, { status, headers });
type SavedFont = { key: string; name: string; format: string };
const savedFont = async (env: ReportsEnv, id: string): Promise<SavedFont | null> => {
  const object = await env.LIBRARIES.get(currentKey(id));
  if (!object) return null;
  const value = await object.json<SavedFont>();
  const prefix = `fonts/${id}/`;
  if (!value.key.startsWith(prefix) || !/^[a-f0-9]{64}$/.test(value.key.slice(prefix.length))) throw new Error('Invalid font reference');
  return value;
};

export async function fontWorkspace(request: Request, env: ReportsEnv, send: typeof fetch = fetch): Promise<Response> {
  const authorization = request.headers.get('authorization') ?? '';
  if (!/^Bearer [^\s]{1,8192}$/.test(authorization)) return json({ error: 'Sign in to view your fonts.' }, 401);
  if (!env.REPORTS_OWNER_ID || !env.REPORTS_AUTH_URL || !/^https:\/\/[a-z0-9-]+\.convex\.cloud$/.test(env.REPORTS_AUTH_URL)) return json({ error: 'Font access is not configured.' }, 503);
  try {
    const response = await send(`${env.REPORTS_AUTH_URL}/api/query`, {
      method: 'POST', headers: { authorization, 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: 'users:current', args: [{}], format: 'convex_encoded_json' }),
      signal: AbortSignal.timeout(8_000), redirect: 'manual',
    });
    if (response.status === 401 || response.status === 403) return json({ error: 'Your session has expired. Sign in again.' }, 401);
    if (!response.ok) return json({ error: 'Sign-in could not be checked. Try again.' }, 503);
    const identity = await response.json() as { status?: string; value?: { _id?: string; email?: string } };
    if (identity.status !== 'success' || !identity.value?._id) return json({ error: 'Your session has expired. Sign in again.' }, 401);
    if (identity.value._id !== env.REPORTS_OWNER_ID || identity.value.email?.trim().toLowerCase() !== OWNER_EMAIL) return json({ error: 'This font workspace is private.' }, 403);
  } catch { return json({ error: 'Sign-in could not be checked. Try again.' }, 503); }

  const path = new URL(request.url).pathname;
  try {
    if (path === '/api/fonts' && request.method === 'GET') {
      const development = await Promise.all(Object.entries(DEVELOPMENT).map(async ([id, face]) => {
        const saved = await savedFont(env, id);
        return { id, ...face, development: true, available: Boolean(saved), fileName: saved?.name ?? null };
      }));
      return json({ fonts: [
        ...development,
        { id: 'olivetti', name: 'Olivetti Dot', detail: 'Regular · Dot matrix', available: true },
        { id: 'america', name: 'GT America', detail: 'Standard Regular · Reference', available: true },
        { id: 'iosevka', name: 'Iosevka Extended', detail: 'Regular · Code reference', available: true },
      ] });
    }
    if (path.startsWith('/api/fonts/file/') && request.method === 'GET') {
      const id = path.slice('/api/fonts/file/'.length);
      const builtins: Record<string, string> = { olivetti: 'fonts/reference/olivetti.woff2', america: 'fonts/reference/america.woff2', iosevka: 'fonts/reference/iosevka.woff2' };
      const key = isDevelopment(id) ? (await savedFont(env, id))?.key : builtins[id];
      if (!key) return json({ error: 'This font is not available yet.' }, 404);
      const font = await env.LIBRARIES.get(key);
      if (!font) return json({ error: 'This font is not available yet.' }, 404);
      return new Response(font.body, { headers: { ...headers, 'Content-Type': 'application/octet-stream' } });
    }
    if (path.startsWith('/api/fonts/') && request.method === 'PUT') {
      const id = path.slice('/api/fonts/'.length);
      if (!isDevelopment(id)) return json({ error: 'This font is not in development here.' }, 404);
      if (request.headers.get('origin') !== new URL(request.url).origin) return json({ error: 'Use the font workspace to save a font.' }, 403);
      if (Number(request.headers.get('content-length')) > MAX_FONT_BYTES) return json({ error: 'Choose a font smaller than 10 MB.' }, 413);
      const reader = request.body?.getReader();
      if (!reader) return json({ error: 'Choose a font file.' }, 400);
      const chunks: Uint8Array[] = []; let length = 0;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        length += value.byteLength;
        if (length > MAX_FONT_BYTES) { await reader.cancel(); return json({ error: 'Choose a font smaller than 10 MB.' }, 413); }
        chunks.push(value);
      }
      const bytes = new Uint8Array(length); let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
      const signature = String.fromCharCode(...bytes.slice(0, 4));
      const format = ({ wOF2: 'woff2', wOFF: 'woff', OTTO: 'opentype', '\u0000\u0001\u0000\u0000': 'truetype' } as Record<string, string>)[signature];
      if (!format || length < 12) return json({ error: 'Choose a WOFF2, WOFF, OTF or TTF font.' }, 400);
      const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(n => n.toString(16).padStart(2, '0')).join('');
      const name = (request.headers.get('x-font-name') ?? DEVELOPMENT[id]?.name ?? 'Font').replace(/[\x00-\x1f\x7f]/g, '').slice(0, 160);
      const key = `fonts/${id}/${hash}`;
      await env.LIBRARIES.put(key, bytes, { httpMetadata: { contentType: 'application/octet-stream' } });
      await env.LIBRARIES.put(currentKey(id), JSON.stringify({ key, name, format }));
      return json({ saved: true });
    }
    return json({ error: 'Not found.' }, 404);
  } catch { return json({ error: 'The font could not be read or saved. Try again.' }, 503); }
}
