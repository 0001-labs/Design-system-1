import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vite-plus/test';
import config from '../sync.exports.mjs';
import { prepareLibrary } from '../packages/css-validate/src/index';
import { LIBRARY_REVISION } from '../DS1/1-root/library-tokens';

const root = join(import.meta.dirname, '..');
const read = (path: string) => readFileSync(join(root, path), 'utf8');
type Exported = { files(context: { read: typeof read; options: Record<string, unknown> }): Promise<Record<string, string>> };
const library = (config.exports as unknown as Record<string, Exported>).library;
const files = (options: Record<string, unknown> = {}) => library.files({ read, options });

const id = '0123456789abcdefghjk';
const published = prepareLibrary(':root { --one-radius: 8px; }\nbutton { border-radius: var(--one-radius); }\n').css;
const sha256 = (text: string) => createHash('sha256').update(text).digest('hex');

let cache: string;
let served: { status?: number; body?: string; headers?: Record<string, string> };
const fetch = vi.fn(async (url: string) => new Response(served.body ?? published, {
  status: served.status ?? 200,
  headers: { 'content-type': 'text/css; charset=utf-8', 'ds1-version': /\/v\/(\d+)\.css$/.exec(url)?.[1] ?? '', 'ds1-content-hash': sha256(served.body ?? published), ...served.headers },
}));
beforeEach(() => {
  cache = mkdtempSync(join(tmpdir(), 'ds1-libraries-'));
  vi.stubEnv('DS1_LIBRARY_CACHE', cache);
  vi.stubGlobal('fetch', fetch);
  served = {};
  fetch.mockClear();
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); rmSync(cache, { recursive: true, force: true }); });

describe('the library export', () => {
  test('copies the run-time connector alone when it names no library', async () => {
    expect(Object.keys(await files())).toEqual(['library-styles.ts']);
    expect(fetch).not.toHaveBeenCalled();
    await expect(files({ styles: false })).rejects.toThrow(/Name the library to pin/);
  });

  test('pins a published version unchanged, with a manifest naming its address, revision and hash', async () => {
    const copy = await files({ id, version: 4 });
    expect(Object.keys(copy).sort()).toEqual(['ds1-library/0123456789abcdefghjk/v/4.css', 'ds1-library/library-manifest.json', 'library-styles.ts']);
    expect(copy[`ds1-library/${id}/v/4.css`]).toBe(published);
    expect(fetch).toHaveBeenCalledWith(`https://designsystem1.com/ds1/${id}/v/4.css`, { redirect: 'error' });
    expect(JSON.parse(copy['ds1-library/library-manifest.json']!)).toEqual({
      source: 'Design system 1', library: id, version: 4, url: `https://designsystem1.com/ds1/${id}/v/4.css`, file: `${id}/v/4.css`, revision: LIBRARY_REVISION, sha256: sha256(published),
    });
    expect(Object.keys(await files({ id, version: 4, styles: false })).sort()).toEqual(['ds1-library/0123456789abcdefghjk/v/4.css', 'ds1-library/library-manifest.json']);
  });

  test('keeps a fetched version, so a check reads it without the network', async () => {
    await files({ id, version: 2, sha256: sha256(published) });
    expect(existsSync(join(cache, id, 'v', '2.css'))).toBe(true);
    fetch.mockRejectedValue(new Error('offline'));
    expect((await files({ id, version: 2 }))[`ds1-library/${id}/v/2.css`]).toBe(published);
    fetch.mockReset();
  });

  test('refuses what it cannot verify', async () => {
    await expect(files({ id, version: 'latest' })).rejects.toThrow(/latest\.css changes with every publish/);
    await expect(files({ id })).rejects.toThrow(/Pin a published version/);
    await expect(files({ id: 'NOT-AN-ID', version: 1 })).rejects.toThrow(/public ID/);
    await expect(files({ id, version: 1, sha256: 'abc' })).rejects.toThrow(/64 hex digits/);
    await expect(files({ id, version: 1, sha256: '0'.repeat(64) })).rejects.toThrow(/not the "sha256" sync.json names/);
    served = { status: 404, body: '/* DS1: library not found */\n' };
    await expect(files({ id, version: 3 })).rejects.toThrow(/answered 404/);
    served = { body: ':root { --one-radius: 8px; }\n' };
    await expect(files({ id, version: 5 })).rejects.toThrow(/published before Design system 1 prepared and stamped/);
    served = { headers: { 'ds1-content-hash': '0'.repeat(64) } };
    await expect(files({ id, version: 6 })).rejects.toThrow(/other bytes than the publish recorded/);
    served = { headers: { 'ds1-version': '9' } };
    await expect(files({ id, version: 7 })).rejects.toThrow(/answered with version 9/);
    served = { headers: { 'content-type': 'text/html' } };
    await expect(files({ id, version: 8 })).rejects.toThrow(/not a stylesheet/);
    // Nothing unverified was kept.
    for (const version of [3, 5, 6, 7, 8]) expect(existsSync(join(cache, id, 'v', `${version}.css`))).toBe(false);
  });
});
