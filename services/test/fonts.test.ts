import { describe, expect, it, vi } from 'vite-plus/test';
import { fontWorkspace } from '../src/fonts';
import type { ReportsEnv } from '../src/reports';

const origin = 'https://fonts.designsystem1.com';
const woff2 = () => new Uint8Array([119, 79, 70, 50, 0, 0, 0, 0, 0, 0, 0, 0]);
type Listed = { id: string; name: string; available: boolean; fileName?: string | null; development?: boolean };
function setup() {
  const objects = new Map<string, Uint8Array | string>();
  const get = vi.fn(async (key: string) => {
    const value = objects.get(key);
    return value === undefined ? null : { body: value, json: async () => JSON.parse(String(value)) };
  });
  const put = vi.fn(async (key: string, value: Uint8Array | string) => { objects.set(key, value); });
  const env = { LIBRARIES: { get, put }, REPORTS_AUTH_URL: 'https://example.convex.cloud', REPORTS_OWNER_ID: 'owner' } as unknown as ReportsEnv;
  const send = vi.fn().mockImplementation(async () => Response.json({ status: 'success', value: { _id: 'owner', email: 'jaa90@icloud.com' } }));
  const request = (path = '/api/fonts', init: RequestInit = {}) => new Request(origin + path, { ...init, headers: { authorization: 'Bearer owner-session', origin, ...init.headers } });
  const listed = async () => ((await (await fontWorkspace(request(), env, send)).json()) as { fonts: Listed[] }).fonts;
  return { env, send, get, put, objects, request, listed };
}

describe('private font workspace', () => {
  it('does not read private files without a valid owner session', async () => {
    const { env, send, get, put, request } = setup();
    expect((await fontWorkspace(new Request(origin + '/api/fonts'), env, send)).status).toBe(401);
    for (const value of [{ _id: 'another', email: 'jaa90@icloud.com' }, { _id: 'owner', email: 'other@example.com' }]) {
      send.mockImplementation(async () => Response.json({ status: 'success', value }));
      for (const path of ['/api/fonts', '/api/fonts/file/supernatural', '/api/fonts/supernatural', '/api/fonts/file/0001-sans', '/api/fonts/0001-sans']) {
        expect((await fontWorkspace(request(path), env, send)).status).toBe(403);
      }
    }
    expect(get).not.toHaveBeenCalled(); expect(put).not.toHaveBeenCalled();
  });
  it('fails closed for expired sessions, unavailable identity services and missing configuration', async () => {
    const { env, send, request, get } = setup();
    for (const response of [new Response(null, { status: 401 }), Response.json({ status: 'success', value: null }), new Response(null, { status: 503 })]) {
      send.mockResolvedValue(response);
      expect([401, 503]).toContain((await fontWorkspace(request(), env, send)).status);
    }
    send.mockRejectedValue(new Error('offline'));
    expect((await fontWorkspace(request(), env, send)).status).toBe(503);
    delete env.REPORTS_OWNER_ID;
    expect((await fontWorkspace(request(), env, send)).status).toBe(503);
    expect(get).not.toHaveBeenCalled();
  });
  it('returns the catalogue only after verification and never permits shared caching or CORS', async () => {
    const { env, send, request } = setup();
    const response = await fontWorkspace(request(), env, send);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(response.headers.get('access-control-allow-origin')).toBeNull();
    const { fonts } = (await response.json()) as { fonts: Listed[] };
    // The faces in development come first, each honest about whether a build exists, then the references.
    expect(fonts.slice(0, 2)).toEqual([
      expect.objectContaining({ id: 'supernatural', name: 'Supernatural', development: true, available: false, fileName: null }),
      expect.objectContaining({ id: '0001-sans', name: '0001 Sans', development: true, available: false, fileName: null }),
    ]);
    expect(fonts.slice(2).map(font => font.id)).toEqual(['olivetti', 'america', 'iosevka']);
    expect(fonts.slice(2).every(font => font.available && !font.development)).toBe(true);
    expect(send).toHaveBeenCalledWith('https://example.convex.cloud/api/query', expect.objectContaining({ redirect: 'manual', headers: { authorization: 'Bearer owner-session', 'Content-Type': 'application/json' } }));
  });
  it('keeps uploads versioned and returns their bytes only to the owner', async () => {
    const { env, send, request, objects, listed } = setup();
    const bytes = woff2();
    expect((await fontWorkspace(request('/api/fonts/supernatural', { method: 'PUT', body: bytes, headers: { 'x-font-name': 'handwriting.woff2' } }), env, send)).status).toBe(200);
    const first = JSON.parse(String(objects.get('fonts/supernatural/current.json')));
    expect(first.key).toMatch(/^fonts\/supernatural\/[a-f0-9]{64}$/);
    expect((await listed())[0]).toMatchObject({ id: 'supernatural', available: true, fileName: 'handwriting.woff2' });
    const font = await fontWorkspace(request('/api/fonts/file/supernatural'), env, send);
    expect(new Uint8Array(await font.arrayBuffer())).toEqual(bytes);
    bytes[11] = 1;
    await fontWorkspace(request('/api/fonts/supernatural', { method: 'PUT', body: bytes }), env, send);
    expect(objects.has(first.key)).toBe(true);
    expect(JSON.parse(String(objects.get('fonts/supernatural/current.json'))).key).not.toBe(first.key);
  });
  it('saves each face in development under its own id and leaves the others as they were', async () => {
    const { env, send, request, objects, listed } = setup();
    const bytes = woff2();
    expect((await fontWorkspace(request('/api/fonts/0001-sans', { method: 'PUT', body: bytes, headers: { 'x-font-name': 'sans.woff2' } }), env, send)).status).toBe(200);
    const current = JSON.parse(String(objects.get('fonts/0001-sans/current.json')));
    expect(current).toMatchObject({ key: expect.stringMatching(/^fonts\/0001-sans\/[a-f0-9]{64}$/), name: 'sans.woff2', format: 'woff2' });
    expect(objects.has('fonts/supernatural/current.json')).toBe(false);
    const fonts = await listed();
    expect(fonts.find(font => font.id === '0001-sans')).toMatchObject({ available: true, fileName: 'sans.woff2' });
    expect(fonts.find(font => font.id === 'supernatural')).toMatchObject({ available: false, fileName: null });
    expect(new Uint8Array(await (await fontWorkspace(request('/api/fonts/file/0001-sans'), env, send)).arrayBuffer())).toEqual(bytes);
    expect((await fontWorkspace(request('/api/fonts/file/supernatural'), env, send)).status).toBe(404);
    // Saving the other face afterwards does not move this one's pointer, and a build without a name takes the face's.
    expect((await fontWorkspace(request('/api/fonts/supernatural', { method: 'PUT', body: woff2() }), env, send)).status).toBe(200);
    expect(JSON.parse(String(objects.get('fonts/0001-sans/current.json')))).toEqual(current);
    expect(JSON.parse(String(objects.get('fonts/supernatural/current.json')))).toMatchObject({ key: expect.stringMatching(/^fonts\/supernatural\//), name: 'Supernatural' });
  });
  it('rejects cross-origin, oversize and non-font uploads, faces not in development, and unknown paths', async () => {
    const { env, send, request, put } = setup();
    expect((await fontWorkspace(request('/api/fonts/supernatural', { method: 'PUT', body: 'x', headers: { origin: 'https://other.example' } }), env, send)).status).toBe(403);
    expect((await fontWorkspace(request('/api/fonts/supernatural', { method: 'PUT', body: 'x', headers: { 'content-length': '10485761' } }), env, send)).status).toBe(413);
    expect((await fontWorkspace(request('/api/fonts/supernatural', { method: 'PUT', body: '<html>bad</html>' }), env, send)).status).toBe(400);
    // The references and anything else outside the development table cannot be overwritten.
    for (const path of ['/api/fonts/olivetti', '/api/fonts/america', '/api/fonts/file/supernatural', '/api/fonts/reference/olivetti.woff2']) {
      expect((await fontWorkspace(request(path, { method: 'PUT', body: woff2() }), env, send)).status).toBe(404);
    }
    expect((await fontWorkspace(request('/api/fonts/file/../../reports'), env, send)).status).toBe(404);
    expect(put).not.toHaveBeenCalled();
  });
});
