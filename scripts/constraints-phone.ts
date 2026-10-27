// The constraints on a phone: opens every page of a site, as its sitemap lists them, in WebKit as an
// iPhone at each phone width, scrolls it through so everything it loads late is drawn, and runs every
// rule in DS1/0-face/constraints.ts on it, as five presses of C would. Prints what each page breaks,
// at which width, and fails while anything is broken.
//
//   vp run constraints:phone https://example.com
//   vp run constraints:phone https://example.com --widths 320,393 --pages /,/about/
//   vp run constraints:phone --dist website/dist
//
// `--dist` checks a built site before it is uploaded: the folder is served here, every page in its
// sitemap is opened on this machine, and the full-page layout examples under /examples/layouts/,
// which the sitemap leaves out, are opened too. A file the folder lacks (the live base stylesheet,
// a hosted library) is fetched from `--origin`, https://designsystem1.com unless named.
//
// It only reads: GETs, without cookies or credentials, so it is safe against production. It needs
// Playwright's WebKit (`vp exec playwright install webkit`).
import { build } from 'esbuild';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { extname, join, resolve } from 'node:path';
import { devices, webkit } from 'playwright';

/** Representative phone, tablet and desktop widths; --widths adds breakpoint boundaries. */
const WIDTHS = [320, 375, 393, 430, 768, 1024, 1440];

const args = process.argv.slice(2);
const option = (name: string) => {
  const at = args.indexOf(`--${name}`);
  return at >= 0 ? args[at + 1] : undefined;
};
const dist = option('dist');
const origin = option('origin') ?? 'https://designsystem1.com';
const named = args.find(arg => /^https?:\/\//.test(arg));
if (!named && !dist) {
  console.error('Name the site: vp run constraints:phone https://example.com [--widths 320,393] [--pages /,/about/], or --dist website/dist for the built site.');
  process.exit(2);
}
const widths = option('widths')?.split(',').map(Number) ?? WIDTHS;

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.xml': 'application/xml', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json', '.mp4': 'video/mp4', '.webm': 'video/webm', '.wasm': 'application/wasm',
};

/** The file in the built folder a path names: the page's index.html for a folder, nothing for a path outside it. */
function fileOf(folder: string, pathname: string) {
  const file = resolve(folder, '.' + decodeURIComponent(pathname));
  if (!file.startsWith(resolve(folder))) return undefined;
  if (existsSync(file) && statSync(file).isDirectory()) return existsSync(join(file, 'index.html')) ? join(file, 'index.html') : undefined;
  if (existsSync(file)) return file;
  return existsSync(`${file}.html`) ? `${file}.html` : undefined;
}

/** Serves the built folder here, GETs only, fetching what it lacks from the origin. */
async function serve(folder: string): Promise<{ server: Server; base: string }> {
  const server = createServer(async (request, response) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') { response.writeHead(405).end(); return; }
    const url = new URL(request.url ?? '/', 'http://localhost');
    const file = fileOf(folder, url.pathname);
    if (file) {
      response.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
      response.end(readFileSync(file));
      return;
    }
    const answer = await fetch(new URL(url.pathname + url.search, origin), { redirect: 'follow' }).catch(() => null);
    if (!answer) { response.writeHead(502).end(); return; }
    response.writeHead(answer.status, { 'content-type': answer.headers.get('content-type') ?? 'application/octet-stream' });
    response.end(Buffer.from(await answer.arrayBuffer()));
  });
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  return { server, base: `http://127.0.0.1:${port}` };
}

const locations = (xml: string) => [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map(match => match[1]!);

/** The pages of a built folder: its sitemap's, by path, and every full-page layout example. */
function builtPages(folder: string, base: string): string[] {
  const pages = new Set<string>();
  const sitemaps = ['sitemap-index.xml', 'sitemap.xml', 'sitemap-0.xml'].filter(name => existsSync(join(folder, name)));
  const read = (name: string) => {
    for (const location of locations(readFileSync(join(folder, name), 'utf8'))) {
      const { pathname } = new URL(location);
      if (/\.xml$/.test(pathname)) { if (existsSync(join(folder, pathname))) read(pathname.slice(1)); }
      else pages.add(new URL(pathname, base).href);
    }
  };
  for (const name of sitemaps) read(name);
  const layouts = join(folder, 'examples/layouts');
  if (existsSync(layouts)) {
    for (const entry of readdirSync(layouts, { withFileTypes: true })) {
      if (entry.isDirectory() && existsSync(join(layouts, entry.name, 'index.html'))) pages.add(new URL(`/examples/layouts/${entry.name}/`, base).href);
    }
  }
  return pages.size ? [...pages] : [new URL('/', base).href];
}

/** The pages to open: those named, or the sitemap's on the site's own host, or the home page alone. */
async function pagesOf(site: string): Promise<string[]> {
  const chosen = option('pages');
  if (chosen) return chosen.split(',').map(path => new URL(path, site).href);
  if (dist) return builtPages(dist, site);
  const index = await fetch(new URL('/sitemap.xml', site)).catch(() => null);
  const listed = index?.ok ? locations(await index.text()) : [];
  const pages: string[] = [];
  for (const url of listed) {
    if (new URL(url).host !== new URL(site).host) continue;
    if (/\.xml$/.test(new URL(url).pathname)) {
      const part = await fetch(url).catch(() => null);
      if (part?.ok) pages.push(...locations(await part.text()).filter(page => new URL(page).host === new URL(site).host));
    } else pages.push(url);
  }
  return pages.length ? pages : [new URL('/', site).href];
}

// The rules as one script for the page, which puts its inspector on window.
const checker = (await build({
  stdin: {
    contents: `import { measureConstraints } from './constraints.ts';
import { describeElement } from './constraint-site.ts';
window.__inspectConstraints = () => {
  const results = measureConstraints(document);
  return {
    findings: results.flatMap(({ constraint, findings }) => findings.map(({ element, message, review }) =>
      ({ code: constraint.code, message, element: describeElement(element), review: review === true }))),
    measured: Object.fromEntries(results.map(({ constraint, measured }) => [constraint.code, measured])),
  };
};`,
    resolveDir: join(import.meta.dirname, '../DS1/0-face'),
    loader: 'ts',
  },
  bundle: true,
  format: 'iife',
  write: false,
  logLevel: 'silent',
})).outputFiles[0]!.text;

type Broken = { code: string; message: string; element: string; review: boolean };

const served = dist ? await serve(dist) : undefined;
const base = served?.base ?? named!;
const pages = await pagesOf(base);
const browser = await webkit.launch();
const queue = widths.flatMap(width => pages.map(url => ({ width, url })));
const report: string[] = [];
/** What the rules could not measure and a person must look at: listed, never a failure. */
const reviews: string[] = [];
let broken = 0;
const measured: Record<string, number> = {};
/** A page's address as the report names it: the production address for a page served here. */
const shown = (url: string) => served ? new URL(new URL(url).pathname, origin).href : url;

async function open({ width, url }: { width: number; url: string }) {
  const context = await browser.newContext({ ...(width < 768 ? devices['iPhone 14'] : {}), viewport: { width, height: 844 }, screen: { width, height: 844 } });
  const page = await context.newPage();
  try {
    // A page that does not settle in time gets a second chance: one slow load among many is not a broken rule.
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 })
      .catch(() => page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 }));
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight / 2) {
        scrollTo(0, y);
        await new Promise(done => setTimeout(done, 40));
      }
      scrollTo(0, 0);
    });
    await page.waitForTimeout(300);
    await page.addScriptTag({ content: checker });
    const result = await page.evaluate(() => (window as unknown as { __inspectConstraints: () => { findings: Broken[]; measured: Record<string, number> } }).__inspectConstraints());
    for (const [code, count] of Object.entries(result.measured)) measured[code] = (measured[code] ?? 0) + count;
    const found = result.findings.filter(finding => !finding.review);
    const toReview = result.findings.filter(finding => finding.review);
    if (found.length) {
      broken += found.length;
      report.push(`${width}px ${shown(url)}`, ...found.map(({ code, message, element }) => `  ${code}  ${element}: ${message}`));
    }
    if (toReview.length) reviews.push(`${width}px ${shown(url)}`, ...toReview.map(({ code, message, element }) => `  ${code}  ${element}: ${message}`));
  } catch (error) {
    broken += 1;
    report.push(`${width}px ${shown(url)}`, `  could not be opened: ${(error as Error).message.split('\n')[0]}`);
  } finally {
    await context.close();
  }
}

await Promise.all(Array.from({ length: 6 }, async () => {
  for (let next = queue.shift(); next; next = queue.shift()) await open(next);
}));
await browser.close();
served?.server.close();

console.log(report.join('\n'));
if (reviews.length) console.log(`\nTo review by eye (not measured, so not counted as broken):\n${reviews.join('\n')}\n`);
for (const [code, count] of Object.entries(measured)) console.log(`${code}: ${count} measured.`);
console.log(`${pages.length} pages at ${widths.join(', ')}px${served ? ` from ${dist}` : ''}: ${broken ? `${broken} broken` : 'every rule kept'}.`);
process.exit(broken ? 1 : 0);
