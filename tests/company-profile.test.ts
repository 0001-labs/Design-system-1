import { convexTest } from 'convex-test';
import { expect, test } from 'vite-plus/test';
import schema from '../convex/schema';
import { api } from '../convex/_generated/api';
const modules = {
  '../convex/_generated/api.js': () => import('../convex/_generated/api.js'),
  '../convex/users.ts': () => import('../convex/users'),
};
test('company names require a session and stay isolated between accounts', async () => {
  const t = convexTest(schema, modules);
  expect(await t.query(api.users.profile, {})).toBeNull();
  await expect(t.mutation(api.users.setCompanyName, { companyName: 'Example' })).rejects.toThrow();
  const first = await t.run(ctx => ctx.db.insert('users', {}));
  const second = await t.run(ctx => ctx.db.insert('users', {}));
  const a = t.withIdentity({ subject: `${first}|session` });
  const b = t.withIdentity({ subject: `${second}|session` });
  await a.mutation(api.users.setCompanyName, { companyName: '  Studio  ' });
  expect(await a.query(api.users.profile, {})).toEqual({ companyName: 'Studio' });
  expect(await b.query(api.users.profile, {})).toEqual({ companyName: '' });
  await a.mutation(api.users.setCompanyName, { companyName: 'Renamed' });
  expect(await a.query(api.users.profile, {})).toEqual({ companyName: 'Renamed' });
  for (const companyName of [' ', 'x'.repeat(81)]) await expect(a.mutation(api.users.setCompanyName, { companyName })).rejects.toThrow();
});
