import { convexTest } from 'convex-test';
import { afterEach, beforeEach, expect, test } from 'vite-plus/test';
import schema from '../convex/schema';
import { api } from '../convex/_generated/api';
import { TOKENS_END, TOKENS_START } from '../shared/base-sheet';

const modules = {
  '../convex/_generated/api.js': () => import('../convex/_generated/api.js'),
  '../convex/base.ts': () => import('../convex/base'),
};
const css = (radius: string) => `:root { --ds-radius: 0; }\n${TOKENS_START}\n:root {\n  --ds-radius: ${radius};\n}\n${TOKENS_END}\n`;

beforeEach(() => { process.env.SIGN_IN_OWNER_EMAIL = 'owner@example.com'; });
afterEach(() => { delete process.env.SIGN_IN_OWNER_EMAIL; });

async function account(t: ReturnType<typeof convexTest>, email: string, verified = true) {
  const id = await t.run(ctx => ctx.db.insert('users', { email, ...(verified ? { emailVerificationTime: 1 } : {}) }));
  return t.withIdentity({ subject: `${id}|session` });
}

test('only the verified owner reads or writes the base', async () => {
  const t = convexTest(schema, modules);
  await expect(t.query(api.base.get, {})).rejects.toThrow(/Sign in/);
  for (const other of [await account(t, 'someone@example.com'), await account(t, 'owner@example.com', false)]) {
    await expect(other.query(api.base.get, {})).rejects.toThrow(/owner/);
    await expect(other.mutation(api.base.save, { css: css('4px'), baseRev: 0 })).rejects.toThrow(/owner/);
  }
  delete process.env.SIGN_IN_OWNER_EMAIL;
  await expect((await account(t, 'owner@example.com')).query(api.base.get, {})).rejects.toThrow(/owner/);
});

test('each save is a version; stale revisions are refused and an earlier version can be restored', async () => {
  const t = convexTest(schema, modules);
  const owner = await account(t, 'Owner@Example.com');
  expect(await owner.query(api.base.get, {})).toBeNull();
  const first = await owner.mutation(api.base.save, { css: css('4px'), baseRev: 0 });
  expect(first).toMatchObject({ rev: 1, version: 1, unchanged: false, sheet: '/* Design system 1 base, version 1 */\n:root {\n  --ds-radius: 4px;\n}\n' });
  expect((await owner.mutation(api.base.save, { css: css('4px'), baseRev: 1 })).unchanged).toBe(true);
  await expect(owner.mutation(api.base.save, { css: css('8px'), baseRev: 0 })).rejects.toThrow(/somewhere else/);
  const second = await owner.mutation(api.base.save, { css: css('8px'), baseRev: 1 });
  expect(second).toMatchObject({ rev: 2, version: 2 });
  await expect(owner.mutation(api.base.save, { css: css('url(x)'), baseRev: 2 })).rejects.toThrow(/cannot carry/);
  const restored = await owner.mutation(api.base.restore, { version: 1 });
  expect(restored).toMatchObject({ version: 3, rev: 3, sheet: '/* Design system 1 base, version 3 */\n:root {\n  --ds-radius: 4px;\n}\n' });
  expect((await owner.query(api.base.history, {})).map(row => [row.version, row.restoredFrom])).toEqual([[3, 1], [2, null], [1, null]]);
  expect(await owner.query(api.base.get, {})).toMatchObject({ version: 3, css: css('4px') });
});
