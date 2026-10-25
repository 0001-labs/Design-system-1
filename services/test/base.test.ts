import { describe, expect, it, vi } from 'vite-plus/test';
import { baseApi, BASE_FLAG } from '../src/base';
import type { ReportsEnv } from '../src/reports';
import { parseArtifactPath, parseWritePath } from '../src/shared/keys';

const owner = { _id: 'owner', email: 'jaa90@icloud.com', emailVerified: true };
const saved = { css: ':root{}', rev: 2, version: 2, updatedAt: 1, sheet: '/* base */\n:root {\n}\n', contentHash: 'abc', unchanged: false };

function setup({ flag = { enabled: true, audience: 'owner', accountIds: [] } as unknown, identity = owner as unknown, backend = (path: string): unknown => ({ status: 'success', value: path === 'base:history' ? [] : path === 'base:get' ? null : saved }) } = {}) {
  const put = vi.fn().mockResolvedValue({});
  const get = vi.fn(async (key: string) => key === `feature-flags/${BASE_FLAG}.json` && flag ? { json: async () => flag } : null);
  const env = { LIBRARIES: { get, put }, REPORTS_AUTH_URL: 'https://example.convex.cloud', REPORTS_OWNER_ID: 'owner' } as unknown as ReportsEnv;
  const send = vi.fn(async (_url: unknown, init?: RequestInit) => {
    const { path } = JSON.parse(String(init?.body));
    return Response.json(path === 'users:current' ? { status: 'success', value: identity } : backend(path));
  });
  return { env, put, send: send as unknown as typeof fetch & typeof send };
}
const request = (method = 'GET', body?: unknown, path = '/api/base', origin = 'https://designsystem1.com') =>
  new Request(`https://designsystem1.com${path}`, { method, headers: { authorization: 'Bearer token', origin, 'content-type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });

describe('base editing', () => {
  it('needs a session, the owner and the flag before it reaches the base', async () => {
    const anonymous = setup();
    expect((await baseApi(new Request('https://designsystem1.com/api/base'), anonymous.env, undefined, anonymous.send)).status).toBe(401);
    const other = setup({ identity: { ...owner, _id: 'someone' } });
    expect((await baseApi(request(), other.env, undefined, other.send)).status).toBe(403);
    const off = setup({ flag: null });
    expect((await baseApi(request(), off.env, undefined, off.send)).status).toBe(404);
    for (const { send } of [anonymous, other, off]) expect(send.mock.calls.map(call => JSON.parse(String(call[1]?.body)).path)).not.toContain('base:get');
  });

  it('reads the base and its history for the owner', async () => {
    const { env, send } = setup();
    const response = await baseApi(request(), env, undefined, send);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ base: null, history: [] });
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  });

  it('refuses writes from another origin and malformed input', async () => {
    const { env, send, put } = setup();
    expect((await baseApi(request('PUT', { css: '', baseRev: 0 }, '/api/base', 'https://evil.example'), env, undefined, send)).status).toBe(403);
    expect((await baseApi(request('PUT', { css: 1, baseRev: 0 }), env, undefined, send)).status).toBe(400);
    expect((await baseApi(request('POST', { version: 0 }, '/api/base/restore'), env, undefined, send)).status).toBe(400);
    expect((await baseApi(request('DELETE'), env, undefined, send)).status).toBe(404);
    expect(put).not.toHaveBeenCalled();
  });

  it('makes a saved version live: its own key first, then latest.css', async () => {
    const { env, send, put } = setup();
    const waitUntil = vi.fn();
    const response = await baseApi(request('PUT', { css: ':root{}', baseRev: 1 }), env, { waitUntil }, send);
    expect(response.status).toBe(200);
    expect(put.mock.calls.map(call => call[0])).toEqual(['ds1/base/v/2.css', 'ds1/base/latest.css']);
    expect(put.mock.calls[1]![1]).toBe(saved.sheet);
    expect(put.mock.calls[1]![2]).toMatchObject({ customMetadata: { version: '2', contentHash: 'abc' } });
    expect(send.mock.calls.at(-1)![1]!.body).toContain('"path":"base:save"');
  });

  it('passes a stale revision back as a conflict without publishing', async () => {
    const { env, send, put } = setup({ backend: path => path === 'base:save' ? { status: 'error', errorData: { code: 'draft_conflict', message: 'The base was saved somewhere else.', details: { serverRev: 5 } } } : { status: 'success', value: null } });
    const response = await baseApi(request('PUT', { css: ':root{}', baseRev: 1 }), env, undefined, send);
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: { code: 'draft_conflict', details: { serverRev: 5 } } });
    expect(put).not.toHaveBeenCalled();
  });
});

it('reads the base folder like a library but never accepts it as a publish target', () => {
  expect(parseArtifactPath('/ds1/base/latest.css')).toMatchObject({ key: 'ds1/base/latest.css', immutable: false });
  expect(parseArtifactPath('/ds1/base/v/4.css')).toMatchObject({ key: 'ds1/base/v/4.css', immutable: true });
  expect(parseArtifactPath('/ds1/base/../x/latest.css')).toBeNull();
  expect(parseWritePath('/api/artifacts/base/latest')).toBeNull();
});
