import { describe, expect, it, vi } from 'vite-plus/test';
import { libraryApi } from '../src/libraries';
const env = { REPORTS_AUTH_URL: 'https://example.convex.cloud' };
const request = (operation: string, args: unknown = {}, token = 'session') => new Request(`https://designsystem1.com/api/libraries/${operation}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(args) });
describe('library API', () => {
  it('describes the same operations used by clients without exposing backend paths', async () => {
    const result = await libraryApi(new Request('https://designsystem1.com/api/libraries'), env);
    const body = await result.json() as any;
    expect(body.operations.map((op: any) => op.name)).toContain('publish');
    expect(JSON.stringify(body)).not.toContain('libraries:');
  });
  it('rejects anonymous calls before contacting the backend', async () => {
    const send = vi.fn();
    expect((await libraryApi(request('list', {}, ''), env, send)).status).toBe(401);
    expect(send).not.toHaveBeenCalled();
  });
  it('passes the bearer token to the existing ownership-checked function', async () => {
    const send = vi.fn(async () => Response.json({ status: 'success', value: [{ name: 'Example' }] }));
    const result = await libraryApi(request('list'), env, send);
    expect(result.status).toBe(200);
    expect((send.mock.calls as unknown as [string, RequestInit][])[0]?.[0]).toBe('https://example.convex.cloud/api/query');
    const init = (send.mock.calls as unknown as [string, RequestInit][])[0]![1];
    expect(init.headers).toMatchObject({ authorization: 'Bearer session' });
    expect(JSON.parse(init.body as string)).toMatchObject({ path: 'libraries:list', args: [{}] });
  });
  it('preserves conflicts and their revision without retrying writes', async () => {
    const send = vi.fn(async () => Response.json({ status: 'error', errorData: { code: 'draft_conflict', message: 'Edited elsewhere.', details: { serverRev: 3 } } }));
    const result = await libraryApi(request('save', { id: 'library', css: ':root{}', config: '{}', baseRev: 2 }), env, send);
    expect(result.status).toBe(409);
    expect(await result.json()).toMatchObject({ error: { details: { serverRev: 3 } } });
    expect(send).toHaveBeenCalledOnce();
  });
  it('does not disclose whether an unowned library exists', async () => {
    const send = vi.fn(async () => Response.json({ status: 'success', value: null }));
    expect((await libraryApi(request('get', { id: 'other' }), env, send)).status).toBe(404);
  });
  it('rejects extra identity fields, invalid revisions and arbitrary functions', async () => {
    const send = vi.fn();
    expect((await libraryApi(request('list', { ownerId: 'other' }), env, send)).status).toBe(400);
    expect((await libraryApi(request('publish', { id: 'x', baseRev: -1 }), env, send)).status).toBe(400);
    expect((await libraryApi(request('purge'), env, send)).status).toBe(404);
    expect(send).not.toHaveBeenCalled();
  });
  it('does not return backend stack traces', async () => {
    const send = vi.fn(async () => Response.json({ status: 'error', errorMessage: 'private stack and service details' }));
    const result = await libraryApi(request('list'), env, send);
    expect(await result.text()).not.toContain('private stack');
  });
  it('allows email code sign-in but no caller-selected identity or auth provider', async () => {
    const send = vi.fn(async () => Response.json({ status: 'success', value: { tokens: null } }));
    const req = new Request('https://designsystem1.com/api/library-auth/sign-in', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider: 'email-code', params: { email: 'reader@example.com' } }) });
    expect((await libraryApi(req, env, send)).status).toBe(200);
    const invalid = new Request(req.url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider: 'custom', subject: 'other' }) });
    expect((await libraryApi(invalid, env, send)).status).toBe(400);
  });
});
