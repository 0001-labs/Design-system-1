// The constraints on a phone: opens every page of a site, as its sitemap lists them, in WebKit as an
// iPhone at each phone width, scrolls it through so everything it loads late is drawn, and runs every
// rule in DS1/0-face/constraints.ts on it, as five presses of C would. Prints what each page breaks,
// at which width, and fails while anything is broken.
//
//   vp run constraints:phone https://example.com
//   vp run constraints:phone https://example.com --widths 320,393 --pages /,/about/
//
// It only reads: GETs, without cookies or credentials, so it is safe against production. It needs
// Playwright's WebKit (`vp exec playwright install webkit`).
import { build } from 'esbuild';
import { join } from 'node:path';
import { devices, webkit } from 'playwright';

/** The narrowest phone still sold, the common ones and the widest. */
const WIDTHS = [320, 375, 393, 430];

const args = process.argv.slice(2);
const option = (name: string) => {
  const at = args.indexOf(`--${name}`);
  return at >= 0 ? args[at + 1] : undefined;
};
const base = args.find(arg => /^https?:\/\//.test(arg));
if (!base) {
  console.error('Name the site: vp run constraints:phone https://example.com [--widths 320,393] [--pages /,/about/]');
  process.exit(2);
}
const widths = option('widths')?.split(',').map(Number) ?? WIDTHS;

/** The pages to open: those named, or the sitemap's on the site's own host, or the home page alone. */
async function pagesOf(site: string): Promise<string[]> {
  const named = option('pages');
  if (named) return named.split(',').map(path => new URL(path, site).href);
  const answer = await fetch(new URL('/sitemap.xml', site)).catch(() => null);
  const listed = answer?.ok ? [...(await answer.text()).matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map(match => match[1]!) : [];
  const own = listed.filter(url => new URL(url).host === new URL(site).host);
  return own.length ? own : [new URL('/', site).href];
}

// The rules as one script for the page, which puts its inspector on window.
const checker = (await build({
  stdin: {
    contents: `import { inspectConstraints } from './constraints.ts';
import { describeElement } from './constraint-site.ts';
window.__inspectConstraints = () => inspectConstraints(document).map(({ element, message, constraint }) =>
  ({ code: constraint.code, message, element: describeElement(element) }));`,
    resolveDir: join(import.meta.dirname, '../DS1/0-face'),
    loader: 'ts',
  },
  bundle: true,
  format: 'iife',
  write: false,
  logLevel: 'silent',
})).outputFiles[0]!.text;

type Broken = { code: string; message: string; element: string };

const pages = await pagesOf(base);
const browser = await webkit.launch();
const queue = widths.flatMap(width => pages.map(url => ({ width, url })));
const report: string[] = [];
let broken = 0;

async function open({ width, url }: { width: number; url: string }) {
  const context = await browser.newContext({ ...devices['iPhone 14'], viewport: { width, height: 844 }, screen: { width, height: 844 } });
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight / 2) {
        scrollTo(0, y);
        await new Promise(done => setTimeout(done, 40));
      }
      scrollTo(0, 0);
    });
    await page.waitForTimeout(300);
    await page.addScriptTag({ content: checker });
    const found = await page.evaluate(() => (window as unknown as { __inspectConstraints: () => Broken[] }).__inspectConstraints());
    if (found.length) {
      broken += found.length;
      report.push(`${width}px ${url}`, ...found.map(({ code, message, element }) => `  ${code}  ${element}: ${message}`));
    }
  } catch (error) {
    broken += 1;
    report.push(`${width}px ${url}`, `  could not be opened: ${(error as Error).message.split('\n')[0]}`);
  } finally {
    await context.close();
  }
}

await Promise.all(Array.from({ length: 6 }, async () => {
  for (let next = queue.shift(); next; next = queue.shift()) await open(next);
}));
await browser.close();

console.log(report.join('\n'));
console.log(`${pages.length} pages at ${widths.join(', ')}px: ${broken ? `${broken} broken` : 'every rule kept'}.`);
process.exit(broken ? 1 : 0);
