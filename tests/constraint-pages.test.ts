import { expect, test } from 'vite-plus/test';
import { remoteConstraintPages } from '../scripts/constraint-pages';
import { DOC_EXAMPLES } from '../shared/doc-examples';

test('live constraint discovery follows sitemap indexes without missing DS1 examples', async () => {
 const requests: string[] = [];
 const send = (async (input: string | URL | Request) => {
  const url = String(input); requests.push(url);
  if (url.endsWith('/sitemap-index.xml')) return new Response('<sitemapindex><loc>https://designsystem1.com/sitemap-0.xml</loc></sitemapindex>');
  if (url.endsWith('/sitemap-0.xml')) return new Response('<urlset><loc>https://designsystem1.com/1-root/constraints/</loc><loc>https://elsewhere.test/private</loc><loc>https://designsystem1.com/sitemap-index.xml</loc></urlset>');
  return new Response('not found', { status: 404 });
 }) as typeof fetch;
 const pages = await remoteConstraintPages('https://designsystem1.com', send);
 expect(pages).toEqual(['https://designsystem1.com/1-root/constraints/', ...DOC_EXAMPLES.map(example => `https://designsystem1.com${example.href}`)]);
 expect(new Set(requests).size).toBe(requests.length);
 expect(requests.some(url => url.includes('elsewhere'))).toBe(false);
});
test('other products use their own sitemap and fall back safely without a catalogue', async () => {
 expect(await remoteConstraintPages('https://example.test', (async () => new Response('', { status: 404 })) as typeof fetch)).toEqual(['https://example.test/']);
});
