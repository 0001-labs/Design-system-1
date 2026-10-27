/** The real platform validator, SQLite store and public renderer behind an isolated local canvas. */
import { build } from 'esbuild';
import { createServer } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { componentFixture } from './component-fixture.mjs';

const assets = fileURLToPath(new URL('../../../website/dist/', import.meta.url));
const policy = "sandbox allow-same-origin; default-src 'none'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; media-src 'self' https:; frame-ancestors 'self'; form-action 'none'; base-uri 'none'";
export const fixturePicture = '/pictures/sample.svg';
const picture = '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="160"><rect width="240" height="160" fill="#ded2ed"/></svg>';

export async function sitePlatformFixture(sources) {
  // The application renderer stays with its owner. Release worktrees can point
  // this cross-product contract at another checked platform with this override.
  const platform = resolve(process.env.C9Y_PLATFORM_ROOT ?? join(homedir(), '0001/Consistency/platform'));
  const temporary = await mkdtemp(join(tmpdir(), 'c9y-canvas-fixture-'));
  const output = join(temporary, 'platform.mjs');
  await build({
    stdin: { contents: `export * from ${JSON.stringify(join(platform, 'worker/site-composition.ts'))}; export { FakeStorage } from ${JSON.stringify(join(platform, 'tests/fakes.ts'))};`, resolveDir: platform, loader: 'ts' },
    outfile: output, bundle: true, platform: 'node', format: 'esm', logLevel: 'silent',
    banner: { js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);' },
  });
  const engine = await import(pathToFileURL(output));
  const storage = new engine.FakeStorage();
  const store = new engine.SiteCompositionStore(storage);
  const pages = new Map(await Promise.all(Object.entries(sources).map(async ([path, html]) => [path, await engine.inspectComposition(html)])));
  const code = '10VNDG', workspace = '01STDO', origin = 'https://fixture-canvas.c9y.site';
  const images = new Set([fixturePicture]);
  const writes = [];
  let fail = false, held = null;
  const read = (path = '/') => store.read(path, 'fixture-build', pages.get(path));
  const publicHTML = async (path = '/') => {
    const response = await store.render(new Request(origin + path), new Response(sources[path], { headers: { 'content-type': 'text/html' } }));
    return response.text();
  };
  const server = createServer(async (request, response) => {
    const url = new URL(request.url, 'http://localhost');
    if (url.pathname === '/fixture-public/') { response.setHeader('content-type', 'text/html'); response.end(await publicHTML(url.searchParams.get('path') ?? '/')); return; }
    if (url.pathname.endsWith(fixturePicture)) { response.setHeader('content-type', 'image/svg+xml'); response.end(picture); return; }
    const pathname = decodeURIComponent(url.pathname);
    const file = resolve(assets, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
    if (!file.startsWith(assets)) { response.writeHead(403).end(); return; }
    try { response.setHeader('content-type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' })[extname(file)] ?? 'application/octet-stream'); response.end(await componentFixture(file)); }
    catch { response.writeHead(404).end(); }
  });
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  const base = `http://127.0.0.1:${server.address().port}`;
  return {
    base, url: `${base}/private-consistency/home.html?open=${code}`, code, engine, pages, storage, store, writes, read, publicHTML,
    failWrites(value) { fail = value; },
    holdNextWrite() {
      let release, entered;
      const wait = new Promise(resolve => { release = resolve; });
      const seen = new Promise(resolve => { entered = resolve; });
      held = { wait, entered };
      return { seen, release };
    },
    async route(page) {
      await page.route('**/api/consistency/workspaces', route => route.fulfill({ json: { owner: true, workspaces: [{ code: workspace, name: 'Fixture studio', role: 'owner', plan: 'free', sites: 1, siteCodes: [code], limits: { sites: 2, customDomains: false } }] } }));
      await page.route('**/api/consistency/workspaces/*/members', route => route.fulfill({ json: { members: [] } }));
      await page.route('**/api/consistency/profile', route => route.fulfill({ json: { companyName: 'Fixture studio' } }));
      await page.route('**/api/consistency/sites', route => route.fulfill({ json: { workspace, sites: [{ code, name: 'Fixture site', url: origin + '/', address: new URL(origin).host }] } }));
      await page.route('**/api/consistency/sites/*/**', async route => {
        const request = route.request(), url = new URL(request.url()), what = url.pathname.split('/').slice(5).join('/'), path = url.searchParams.get('path') ?? '/';
        if (what === 'places') return route.fulfill({ json: { places: [] } });
        if (what === 'pages') return route.fulfill({ json: { pages: [...pages.keys()].map(path => ({ path, title: path === '/' ? 'Home' : 'About', lang: 'en', fields: 1, edited: 0 })), images: [...images] } });
        if (what === 'page') return route.fulfill({ json: { path, title: 'Fixture site', lang: 'en', fields: [{ key: '0123456789ab', tag: 'h1', kind: 'text', label: 'h1', markdown: 'Original heading' }] } });
        if (what === 'document') return route.fulfill({ body: engine.applyComposition(pages.get(path), read(path).document, true), headers: { 'content-type': 'text/html', 'content-security-policy': policy } });
        if (what.startsWith('files/')) return route.fulfill({ body: picture, contentType: 'image/svg+xml' });
        if (what === 'api/composition') {
          if (request.method() === 'GET') return route.fulfill({ json: { ...read(path), images: [...images] } });
          const body = request.postDataJSON(); writes.push(structuredClone({ path, ...body }));
          if (held) { const gate = held; held = null; gate.entered(); await gate.wait; }
          if (fail) return route.fulfill({ status: 503, json: { error: 'unavailable' } });
          try { return route.fulfill({ json: { ...store.save(path, 'fixture-build', pages.get(path), body, 'fixture@example.com', Date.now(), images), images: [...images] } }); }
          catch (error) { return route.fulfill({ status: error.status ?? 500, json: { error: error.message } }); }
        }
        return route.fulfill({ status: 404, json: { error: 'not-found' } });
      });
    },
    async close() { await new Promise(done => server.close(done)); storage.sql.db.close(); await rm(temporary, { recursive: true, force: true }); },
  };
}
