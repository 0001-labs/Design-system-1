import { convexTest } from 'convex-test';
import { describe, expect, it } from 'vite-plus/test';
import schema from '../convex/schema';
import { api } from '../convex/_generated/api';
const modules = import.meta.glob('../convex/**/*.ts');

describe('dashboard identity evidence', () => {
  it('never resolves an anonymous caller to an owner', async () => {
    const t = convexTest(schema, modules);
    expect(await t.query(api.users.current, {})).toBeNull();
  });
  it('derives email verification from the authenticated user record', async () => {
    for (const verified of [false, true]) {
      const t = convexTest(schema, modules);
      const id = await t.run(ctx => ctx.db.insert('users', {
        email: 'owner@example.com', ...(verified ? { emailVerificationTime: 123 } : {}),
      }));
      const result = await t.withIdentity({ subject: `${id}|session`, email: 'forged@example.com', emailVerified: true }).query(api.users.current, {});
      expect(result).toMatchObject({ _id: id, email: 'owner@example.com', emailVerified: verified });
    }
  });
});
