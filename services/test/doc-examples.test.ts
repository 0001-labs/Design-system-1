import { describe, expect, it } from 'vite-plus/test';
import { DOC_EXAMPLES } from '../../shared/doc-examples';
import { listExamples, setExample } from '../src/doc-examples';
import type { ReportsEnv } from '../src/reports';
import { startAssets } from './harness';

describe('documentation example visibility', () => {
  it('keeps existing examples on, the new draft off, and validates every write', async () => {
    const values = new Map<string, string>();
    const env = { LIBRARIES: {
      get: async (key: string) => values.has(key) ? { json: async () => JSON.parse(values.get(key)!) } : null,
      put: async (key: string, value: string) => { values.set(key, value); },
    }} as unknown as ReportsEnv;
    expect((await listExamples(env)).filter(example => !example.enabled).map(example => example.id)).toEqual(['financial']);
    for (const invalid of [null, {}, { id: 'no-such-example', enabled: true }, { id: '../secret', enabled: true }, { id: 'shop', enabled: 'false' }]) {
      await expect(setExample(env, invalid)).rejects.toThrow('Invalid example setting');
    }
    await Promise.all([setExample(env, { id: 'shop', enabled: false }), setExample(env, { id: 'financial', enabled: true })]);
    const next = await listExamples(env);
    expect(next.find(example => example.id === 'shop')?.enabled).toBe(false);
    expect(next.find(example => example.id === 'financial')?.enabled).toBe(true);
    expect(values.size).toBe(2);
    expect(next).toHaveLength(DOC_EXAMPLES.length);
  });

  it('removes disabled cards and their iframes from served HTML and applies saved changes immediately', async () => {
    const worker = await startAssets();
    try {
      const before = await worker.fetch('/start-here/examples/');
      expect(before.headers.get('cache-control')).toBe('no-store');
      const html = await before.text();
      expect(html).toContain('Shop specimen');
      expect(html).not.toContain('Financial specimen');
      expect(html).not.toContain('financial/');
      const bucket = await worker.bucket();
      await bucket.put('docs/examples/shop.json', JSON.stringify({ enabled: false }));
      await bucket.put('docs/examples/financial.json', JSON.stringify({ enabled: true }));
      const after = await (await worker.fetch('/start-here/examples/')).text();
      expect(after).not.toContain('Shop specimen');
      expect(after).toContain('Financial specimen');
      expect(after).toContain('Other content');
      expect((await worker.fetch('/api/examples', { method: 'PUT', body: '{}' })).status).toBe(404);
    } finally { await worker.dispose(); }
  });
});
