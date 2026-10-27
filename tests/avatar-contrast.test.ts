import { afterAll, beforeAll, expect, test } from 'vite-plus/test';
import { build } from 'esbuild';
import { chromium, webkit, type Browser } from 'playwright';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
const root = join(import.meta.dirname, '..');
const css = (path: string): string => readFileSync(path, 'utf8').replace(/@import\s+["']([^"']+)["'];/g, (_, imported) => css(resolve(dirname(path), imported)));
let browsers: Browser[], bundle: string;
beforeAll(async () => {
 browsers = await Promise.all([chromium.launch(), webkit.launch()]);
 bundle = (await build({ stdin: { contents: "import './DS1/2-core/ds-avatar'; export {inspectConstraints,measureConstraints} from './DS1/0-face/constraints';", resolveDir: root, loader: 'ts' }, bundle: true, format: 'iife', globalName: 'AvatarCheck', write: false, plugins: [{ name: 'styles', setup(build) {
  build.onResolve({ filter: /\.css\?inline$/ }, args => ({ path: resolve(args.resolveDir, args.path.replace('?inline', '')), namespace: 'styles' }));
  build.onLoad({ filter: /.*/, namespace: 'styles' }, args => ({ contents: `export default ${JSON.stringify(css(args.path))}`, loader: 'js' }));
 } }] })).outputFiles[0]!.text;
});
afterAll(async () => { await Promise.all(browsers.map(browser => browser.close())); });

test("avatar initials stay readable after theme and CSS-variable changes, and the avatar constraint catches overrides", async () => {
 for (const browser of browsers) {
  const page = await browser.newPage();
  try {
   await page.setContent(`<style>${css(join(root,'DS1/1-root/component-tokens.css'))}
    :root{--ds-black:#2a2a2a;--ds-white:#fff;--brand:#8589eb;--ds-fill:#ddd;--ds-text-color:#2a2a2a}body{background:white;color:black}body.dark{background:#2a2a2a;color:white;--brand:#201852}ds-avatar{margin:20px}</style>
    <ds-avatar id="studio" initial="S" color="var(--brand)"></ds-avatar>
    <ds-avatar id="team" initial="M" color="var(--brand)" aria-hidden="true"></ds-avatar>
    <ds-avatar id="middle" initial="A" color="#888"></ds-avatar>`);
   await page.addScriptTag({ content: bundle });
   await page.evaluate(async () => { await Promise.all([...document.querySelectorAll('ds-avatar')].map(avatar => (avatar as any).updateComplete)); });
   const failures = () => page.evaluate(() => (window as any).AvatarCheck.inspectConstraints(document).filter((finding: any) => ['color.text-contrast','avatar.initial-contrast'].includes(finding.constraint.code)).map((finding: any) => finding.message));
   expect(await failures()).toEqual([]);
   await page.evaluate(() => document.body.classList.add('dark'));
   await page.waitForTimeout(100);
   expect(await failures()).toEqual([]);
   await page.evaluate(() => document.body.style.setProperty('--brand', '#f5aad1'));
   await page.waitForTimeout(100);
   expect(await failures()).toEqual([]);
   await page.evaluate(() => document.querySelector('ds-avatar')!.setAttribute('ink', '#f5aad1'));
   await page.waitForTimeout(50);
   const avatarFailures = await page.evaluate(() => (window as any).AvatarCheck.inspectConstraints(document).filter((finding: any) => finding.constraint.code === 'avatar.initial-contrast').map((finding: any) => finding.message));
   expect(avatarFailures).toHaveLength(1);
   expect(avatarFailures[0]).toContain('4.5:1');
   expect(await page.evaluate(() => (window as any).AvatarCheck.measureConstraints(document).find((row: any) => row.constraint.code === 'avatar.initial-contrast').measured)).toBe(3);
  } finally { await page.close(); }
 }
});
