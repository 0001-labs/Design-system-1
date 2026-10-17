import { createHash } from 'node:crypto';
import { convexTest } from 'convex-test';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import schema from '../convex/schema';
import { api } from '../convex/_generated/api';
import { LIBRARY_REVISION, libraryRevision } from '../DS1/1-root/library-tokens';
import type { Id } from '../convex/_generated/dataModel';
// The function modules these tests call, named as import.meta.glob would name them.
const modules = {
  '../convex/_generated/api.js': () => import('../convex/_generated/api.js'),
  '../convex/libraries.ts': () => import('../convex/libraries'),
  '../convex/publish.ts': () => import('../convex/publish'),
  '../convex/versions.ts': () => import('../convex/versions'),
};

const sha256 = (text: string) => createHash('sha256').update(text).digest('hex');
const draft = ':root { --one-radius: 8px; --one-accent-color: #d357fe; }\nbutton { border-radius: var(--one-radius); }\n';

/** The storage Worker, in memory: written once per immutable key, as services/src/publish does. */
function storage() {
  const objects = new Map<string, { body: string; version: string; hash: string }>();
  const writes: string[] = [];
  const fetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : input);
    const headers = new Headers(init?.headers);
    const key = url.pathname.replace(/^\/api\/artifacts\//, '');
    if (init?.method === 'PUT') {
      const body = init.body as string;
      const hash = sha256(body);
      if (headers.get('ds1-content-hash') !== hash) return Response.json({ error: { code: 'hash_mismatch' } }, { status: 422 });
      const existing = objects.get(key);
      if (key.includes('/v/') && existing && existing.hash !== hash) return Response.json({ error: { code: 'immutable_conflict' } }, { status: 409 });
      objects.set(key, { body, version: headers.get('ds1-version')!, hash });
      writes.push(key);
      return Response.json({ ok: true, key, etag: null, contentHash: hash, byteSize: body.length, reused: Boolean(existing) });
    }
    // A public read of an immutable version, as rollback makes.
    const match = /\/ds1\/([^/]+)\/v\/(\d+)\.css$/.exec(url.pathname);
    const object = match ? objects.get(`${match[1]}/v/${match[2]}`) : undefined;
    return object ? new Response(object.body) : new Response('Not found', { status: 404 });
  });
  return { objects, writes, fetch };
}

describe('publishing a library', () => {
  let store: ReturnType<typeof storage>;
  beforeEach(() => {
    store = storage();
    vi.stubGlobal('fetch', store.fetch);
    vi.stubEnv('ARTIFACTS_URL', 'https://artifacts.example/api/artifacts');
    vi.stubEnv('PUBLISH_SECRET', 'test-secret');
    vi.stubEnv('ASSETS_BASE', 'https://assets.example/ds1');
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  async function owner() {
    const t = convexTest(schema, modules);
    const userId = await t.run(ctx => ctx.db.insert('users', { email: 'owner@example.com', emailVerificationTime: 1 }));
    const as = t.withIdentity({ subject: `${userId}|session` });
    const created = await as.mutation(api.libraries.create, { name: 'Client', css: draft, config: '{"schema":2}', templateVersion: 'test' });
    return { t, as, id: created._id as Id<'libraries'> };
  }

  it('serves the prepared draft at an immutable version and records the draft it came from', async () => {
    const { t, as, id } = await owner();
    const library = (await as.query(api.libraries.get, { id }))!;
    const result = await as.action(api.publish.publish, { id, baseRev: library.draftRev });
    expect(result.version).toBe(1);
    expect(result.immutableUrl).toBe(`https://assets.example/ds1/${library.publicId}/v/1.css`);

    const served = store.objects.get(`${library.publicId}/v/1`)!;
    expect(store.objects.get(`${library.publicId}/latest`)!.body).toBe(served.body);
    expect(libraryRevision(served.body)).toBe(LIBRARY_REVISION);
    expect(served.body).toContain('--ds-corner-size: var(--one-radius)');
    expect(served.body).toContain(':is(button,:where(a[data-library-button]))');

    const row = await t.run(ctx => ctx.db.query('libraryVersions').withIndex('by_library_version', q => q.eq('libraryId', id).eq('version', 1)).unique());
    expect(row).toMatchObject({ contentHash: sha256(served.body), sourceHash: sha256(draft), transform: `ds1-library@${LIBRARY_REVISION}`, byteSize: new TextEncoder().encode(served.body).length });
    // The editor compares drafts, so a just-published library has no unpublished changes.
    expect((await as.query(api.libraries.get, { id }))!).toMatchObject({ state: 'published', publishedHash: sha256(draft) });
    await expect(as.action(api.publish.publish, { id, baseRev: library.draftRev })).rejects.toThrow(/nothing_to_publish|already matches/);
  });

  it('publishes a library again when its live version was not prepared by these rules, never rewriting a version', async () => {
    const { t, as, id } = await owner();
    const library = (await as.query(api.libraries.get, { id }))!;
    await as.action(api.publish.publish, { id, baseRev: library.draftRev });
    // As a version published before preparation was: the draft's bytes untransformed.
    await t.run(async ctx => {
      const row = await ctx.db.query('libraryVersions').withIndex('by_library_version', q => q.eq('libraryId', id).eq('version', 1)).unique();
      await ctx.db.patch(row!._id, { transform: 'none' });
    });
    const first = store.objects.get(`${library.publicId}/v/1`)!.body;
    const again = await as.action(api.publish.publish, { id, baseRev: library.draftRev });
    expect(again.version).toBe(2);
    expect(store.objects.get(`${library.publicId}/v/1`)!.body).toBe(first);
    expect(store.writes.filter(key => key.endsWith('/v/1'))).toHaveLength(1);

    // Rolling back restores v1's exact bytes and keeps the draft comparison right.
    await as.action(api.versions.rollback, { id, version: 1 });
    expect(store.objects.get(`${library.publicId}/latest`)!.body).toBe(first);
    expect((await as.query(api.libraries.get, { id }))!).toMatchObject({ state: 'published', publishedVersion: 1, publishedHash: sha256(draft) });
  });
});
