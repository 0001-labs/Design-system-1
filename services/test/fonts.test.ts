import { describe, expect, it, vi } from 'vite-plus/test';
import { fontWorkspace } from '../src/fonts';
import type { ReportsEnv } from '../src/reports';
import { emptySource, type FontSource } from '../../shared/font-source';

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
      expect.objectContaining({ id: 'supernatural', name: 'Supernatural', development: true, drawing: false, available: false, fileName: null }),
      expect.objectContaining({ id: '0001-sans', name: '0001 Sans', development: true, drawing: true, available: false, fileName: null }),
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
  describe('drawings', () => {
    const drawing = (): FontSource => {
      const source = emptySource('0001 Sans');
      source.glyphs.push({ unicode: 0x48, advance: 718, contours: [[
        { x: 80, y: 0, type: 'line' }, { x: 170, y: 0, type: 'line' }, { x: 170, y: 710, type: 'line' }, { x: 80, y: 710, type: 'line' },
      ], [
        { x: 359, y: -10, type: 'curve', smooth: true }, { x: 500, y: -10, type: 'offcurve' }, { x: 600, y: 100, type: 'offcurve' }, { x: 600, y: 250, type: 'curve' },
        { x: 600, y: 400, type: 'offcurve' }, { x: 500, y: 510, type: 'offcurve' },
      ]] });
      return source;
    };
    const put = (body: string, headers: Record<string, string> = {}) => ({ method: 'PUT', body, headers: { 'content-type': 'application/json', ...headers } });

    it('keeps drawings private to the owner', async () => {
      const { env, send, request, get, put: write } = setup();
      send.mockImplementation(async () => Response.json({ status: 'success', value: { _id: 'another', email: 'jaa90@icloud.com' } }));
      expect((await fontWorkspace(request('/api/fonts/0001-sans/source'), env, send)).status).toBe(403);
      expect((await fontWorkspace(request('/api/fonts/0001-sans/source', put(JSON.stringify(drawing()))), env, send)).status).toBe(403);
      expect((await fontWorkspace(new Request(origin + '/api/fonts/0001-sans/source'), env, send)).status).toBe(401);
      expect(get).not.toHaveBeenCalled(); expect(write).not.toHaveBeenCalled();
    });
    it('saves a drawing by content hash, keeps earlier ones and reads the latest back', async () => {
      const { env, send, request, objects } = setup();
      const empty = await fontWorkspace(request('/api/fonts/0001-sans/source'), env, send);
      expect(empty.status).toBe(404);
      expect(((await empty.json()) as { error: string }).error).toBe('Nothing has been drawn yet.');
      const first = drawing();
      const saved = await fontWorkspace(request('/api/fonts/0001-sans/source', put(JSON.stringify(first))), env, send);
      expect(saved.status).toBe(200);
      expect(saved.headers.get('cache-control')).toBe('private, no-store');
      const pointer = JSON.parse(String(objects.get('fonts/0001-sans/source/current.json')));
      expect(pointer).toMatchObject({ key: expect.stringMatching(/^fonts\/0001-sans\/source\/[a-f0-9]{64}$/), glyphs: 1 });
      const read = await fontWorkspace(request('/api/fonts/0001-sans/source'), env, send);
      expect(read.headers.get('content-type')).toBe('application/json');
      expect(JSON.parse(new TextDecoder().decode(await read.arrayBuffer()))).toEqual(first);
      const second = drawing(); second.glyphs[0]!.advance = 720;
      await fontWorkspace(request('/api/fonts/0001-sans/source', put(JSON.stringify(second))), env, send);
      expect(objects.has(pointer.key)).toBe(true);
      expect(JSON.parse(String(objects.get('fonts/0001-sans/source/current.json'))).key).not.toBe(pointer.key);
      // A drawing is not a build: the face still has no font to show.
      expect(objects.has('fonts/0001-sans/current.json')).toBe(false);
    });
    it('stores only the fields it knows, in character order', async () => {
      const { env, send, request } = setup();
      const source = drawing() as FontSource & { note?: string };
      source.note = 'not kept';
      source.glyphs.unshift({ unicode: 0x6e, advance: 569, contours: [] });
      (source.glyphs[1]!.contours[0]![0] as { label?: string }).label = 'not kept';
      await fontWorkspace(request('/api/fonts/0001-sans/source', put(JSON.stringify(source))), env, send);
      const stored = JSON.parse(new TextDecoder().decode(await (await fontWorkspace(request('/api/fonts/0001-sans/source'), env, send)).arrayBuffer()));
      expect(stored.note).toBeUndefined();
      expect(stored.glyphs.map((glyph: { unicode: number }) => glyph.unicode)).toEqual([0x48, 0x6e]);
      expect(stored.glyphs[0].contours[0][0]).toEqual({ x: 80, y: 0, type: 'line' });
    });
    it('keeps a tabular figure width and refuses one that is not a positive whole number', async () => {
      const { env, send, request } = setup();
      const source = drawing(); source.metrics.figureWidth = 620;
      expect((await fontWorkspace(request('/api/fonts/0001-sans/source', put(JSON.stringify(source))), env, send)).status).toBe(200);
      const stored = JSON.parse(new TextDecoder().decode(await (await fontWorkspace(request('/api/fonts/0001-sans/source'), env, send)).arrayBuffer()));
      expect(stored.metrics.figureWidth).toBe(620);
      for (const width of [0, -10, 12.5, 'wide']) {
        const bad = drawing() as unknown as { metrics: Record<string, unknown> }; bad.metrics.figureWidth = width;
        expect((await fontWorkspace(request('/api/fonts/0001-sans/source', put(JSON.stringify(bad))), env, send)).status).toBe(400);
      }
    });
    it('refuses drawings that are not well formed, too large, sent from elsewhere or for a face not drawn here', async () => {
      const { env, send, request, put: write } = setup();
      const status = async (path: string, init: RequestInit) => (await fontWorkspace(request(path, init), env, send)).status;
      expect(await status('/api/fonts/0001-sans/source', put('{not json'))).toBe(400);
      const oneHandle = drawing(); oneHandle.glyphs[0]!.contours[1]!.splice(1, 1);
      const response = await fontWorkspace(request('/api/fonts/0001-sans/source', put(JSON.stringify(oneHandle))), env, send);
      expect(response.status).toBe(400);
      expect(((await response.json()) as { error: string }).error).toBe('A curve point follows exactly two control points.');
      const twice = drawing(); twice.glyphs.push({ ...twice.glyphs[0]! });
      expect(await status('/api/fonts/0001-sans/source', put(JSON.stringify(twice)))).toBe(400);
      const fraction = drawing(); fraction.glyphs[0]!.contours[0]![0]!.x = 80.5;
      expect(await status('/api/fonts/0001-sans/source', put(JSON.stringify(fraction)))).toBe(400);
      expect(await status('/api/fonts/0001-sans/source', put(JSON.stringify(drawing()), { origin: 'https://other.example' }))).toBe(403);
      expect(await status('/api/fonts/0001-sans/source', put('x', { 'content-length': String(4 * 1024 * 1024 + 1) }))).toBe(413);
      expect(await status('/api/fonts/supernatural/source', put(JSON.stringify(drawing())))).toBe(404);
      expect(await status('/api/fonts/olivetti/source', put(JSON.stringify(drawing())))).toBe(404);
      expect(await status('/api/fonts/supernatural/source', { method: 'GET' })).toBe(404);
      expect(write).not.toHaveBeenCalled();
    });
  });
});
