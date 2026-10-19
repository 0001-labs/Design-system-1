import { expect, test, vi } from 'vite-plus/test';
import { appNavigation } from '../src/app-navigation';
import type { ReportsEnv } from '../src/reports';
const env = { REPORTS_AUTH_URL: 'https://example.convex.cloud', REPORTS_OWNER_ID: 'owner' } as ReportsEnv;
const request = (token = '') => new Request('https://designsystem1.com/api/app-navigation', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
test('internal navigation is returned only for the pinned, verified owner', async () => {
  const send = vi.fn();
  expect((await appNavigation(request(), env, send)).status).toBe(401);
  expect(send).not.toHaveBeenCalled();
  for (const value of [
    { _id: 'other', email: 'jaa90@icloud.com', emailVerified: true },
    { _id: 'owner', email: 'someone@example.com', emailVerified: true },
    { _id: 'owner', email: 'jaa90@icloud.com', emailVerified: false },
  ]) {
    send.mockResolvedValue(Response.json({ status: 'success', value }));
    expect((await appNavigation(request('valid'), env, send)).status).toBe(403);
  }
  send.mockResolvedValue(Response.json({ status: 'success', value: { _id: 'owner', email: 'jaa90@icloud.com', emailVerified: true } }));
  const response = await appNavigation(request('valid'), env, send);
  expect(response.status).toBe(200);
  expect(response.headers.get('cache-control')).toBe('private, no-store');
  expect((await response.json() as {components: {name:string}[]}).components.map(item => item.name)).toEqual(['Keyboard shortcut', 'Spacing handle', 'Loading indicator']);
});
