import { afterAll, beforeAll, describe, expect, it } from 'vite-plus/test';
import { build } from 'esbuild';
import { Miniflare } from 'miniflare';
import { fileURLToPath } from 'node:url';

let runtime: Miniflare;
let upstreamStatus = 200;
let calls = 0;
beforeAll(async () => {
  const bundle = await build({
    entryPoints: [fileURLToPath(new URL('../src/index.ts', import.meta.url).href)],
    bundle: true, platform: 'browser', format: 'esm', write: false,
  });
  runtime = new Miniflare({
    modules: true, compatibilityDate: '2026-07-24', script: bundle.outputFiles[0]!.text,
    r2Buckets: ['LIBRARIES'],
    bindings: { REPORTS_AUTH_URL: 'https://example.convex.cloud', REPORTS_OWNER_ID: 'owner' },
    outboundService: async (request: Request) => {
      calls++;
      expect(request.url).toBe('https://example.convex.cloud/api/query');
      expect(request.headers.get('authorization')).toBe('Bearer session');
      return Response.json({ status: 'success', value: { _id: 'owner', email: 'jaa90@icloud.com' } }, {
        status: upstreamStatus,
        headers: upstreamStatus === 302 ? { location: 'https://unexpected.example/' } : {},
      });
    },
  });
  await runtime.ready;
  await (await runtime.getR2Bucket('LIBRARIES')).put('reports/component-adoption.json', '{}');
});
afterAll(async () => { await runtime.dispose(); });

describe('private access in the Worker runtime', () => {
  it('verifies the owner, handles rejected sessions and refuses redirects without forwarding credentials', async () => {
    for (const path of ['/api/fonts', '/api/reports/components']) {
      for (const [status, expected] of [[200, 200], [401, 401], [302, 503]]) {
        upstreamStatus = status!;
        const previousCalls = calls;
        const response = await runtime.dispatchFetch(`https://designsystem1.com${path}`, { headers: { authorization: 'Bearer session' } });
        expect(response.status).toBe(expected);
        expect(calls - previousCalls).toBe(1);
      }
    }
  });
});
