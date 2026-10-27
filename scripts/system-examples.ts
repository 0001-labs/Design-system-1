/** Build the System example snapshots with the canonical rendered constraint inspector. No account or data writes. */
import { build } from 'esbuild';
import { createServer } from 'node:http';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { devices, webkit } from 'playwright';
import { DOC_EXAMPLES } from '../shared/doc-examples';
import type { ExampleCheck, ExampleReport, ExampleResult } from '../shared/constraint-catalogue';
const folder = resolve('website/dist');
const widths = [320, 375, 393, 430];
const themes = ['light', 'dark'];
const types: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
const server = createServer(async (request, response) => {
  const url = new URL(request.url!, 'http://localhost');
  let path = resolve(folder, '.' + decodeURIComponent(url.pathname));
  if (!path.startsWith(folder + '/') && path !== folder) { response.writeHead(403).end(); return; }
  try {
    if ((await stat(path)).isDirectory()) path = join(path, 'index.html');
    response.setHeader('Content-Type', types[extname(path)] ?? 'application/octet-stream');
    response.end(await readFile(path));
  } catch {
    // Examples take the published token-only base; every other missing asset remains a failure.
    if (url.pathname.startsWith('/ds1/')) {
      const result = await fetch(new URL(url.pathname, 'https://designsystem1.com')).catch(() => null);
      if (result?.ok) { response.setHeader('Content-Type', result.headers.get('content-type') ?? 'text/css'); response.end(Buffer.from(await result.arrayBuffer())); return; }
    }
    response.writeHead(404).end();
  }
});
await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
const address = server.address() as { port: number };
const base = `http://127.0.0.1:${address.port}`;
const inspector = (await build({ stdin: { contents: `
import { measureConstraints } from './DS1/0-face/constraints';
import { describeElement } from './DS1/0-face/constraint-site';
import { setThemeMode } from './DS1/0-face/theme';
window.__systemTheme = setThemeMode;
window.__systemInspect = () => measureConstraints(document).map(({ constraint, measured, findings }) => ({
 code: constraint.code, measured,
 status: findings.some(f => !f.review) ? 'fail' : findings.length ? 'review' : measured ? 'pass' : 'absent',
 findings: findings.map(f => ({ message: f.message, element: describeElement(f.element), review: f.review === true }))
}));`, resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, format: 'iife' })).outputFiles[0]!.text;
await mkdir(join(folder, 'system-previews'), { recursive: true });
await mkdir(join(folder, 'system-data'), { recursive: true });
const browser = await webkit.launch();
const results: ExampleResult[] = [];
const queue = [...DOC_EXAMPLES];
try {
  await Promise.all(Array.from({ length: 4 }, async () => {
    for (let example = queue.shift(); example; example = queue.shift()) {
      const result: ExampleResult = { id: example.id, checks: [], errors: [] };
      const context = await browser.newContext({ ...devices['iPhone 14'], colorScheme: 'light' });
      const page = await context.newPage();
      try {
        for (const width of widths) {
          await page.setViewportSize({ width, height: 844 });
          const response = await page.goto(`${base}${example.href}?ph=out`, { waitUntil: 'networkidle', timeout: 30_000 });
          if (!response?.ok()) throw new Error(`${width}px: page returned ${response?.status() ?? 'no response'}`);
          await page.evaluate(async () => { await document.fonts.ready; for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight) { scrollTo(0, y); await new Promise(done => setTimeout(done, 30)); } scrollTo(0, 0); });
          await page.addScriptTag({ content: inspector });
          for (const theme of themes) {
            await page.evaluate(theme => (window as any).__systemTheme(theme), theme);
            await page.waitForTimeout(350);
            const checks = await page.evaluate(() => (window as any).__systemInspect()) as Omit<ExampleCheck, 'width' | 'theme'>[];
            result.checks.push(...checks.map(check => ({ ...check, width, theme })));
          }
        }
        const preview = await browser.newContext({ viewport: { width: 800, height: 500 }, colorScheme: 'light', deviceScaleFactor: 1 });
        try {
          const picture = await preview.newPage();
          await picture.goto(`${base}${example.href}?ph=out`, { waitUntil: 'networkidle' });
          await picture.evaluate(() => document.fonts.ready);
          await picture.screenshot({ path: join(folder, 'system-previews', `${example.id}.png`), type: 'png' });
          result.preview = `/system-previews/${example.id}.png`;
        } finally { await preview.close(); }
      } catch (error) { result.errors.push((error as Error).message.split('\n')[0]!); }
      finally { await context.close(); }
      results.push(result);
      console.log(`${example.id}: ${result.checks.filter(check => check.status === 'pass').length}/${result.checks.filter(check => check.status !== 'absent').length}${result.errors.length ? ' — incomplete' : ''}`);
    }
  }));
} finally { await browser.close(); server.close(); }
const report: ExampleReport = { schema: 1, generatedAt: new Date().toISOString(), revision: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), sourceDirty: !!execFileSync('git', ['status', '--porcelain', '--untracked-files=no'], { encoding: 'utf8' }).trim(), widths, themes, examples: DOC_EXAMPLES.map(example => results.find(result => result.id === example.id)!) };
await writeFile(join(folder, 'system-data/examples.json'), JSON.stringify(report));
if (results.some(result => result.errors.length)) process.exitCode = 1;
