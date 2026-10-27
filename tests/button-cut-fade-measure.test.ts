// @vitest-environment node
// Real layout: button labels remain visible and round up to the grid.
import { afterAll, beforeAll, expect, test } from "vite-plus/test";
import { chromium, type Browser, type Page } from "playwright";
import { createServer, type ViteDevServer } from "vite";
import type { AddressInfo } from "node:net";

let server: ViteDevServer;
let browser: Browser;
let url = "";

beforeAll(async () => {
  server = await createServer({ configFile: false, root: process.cwd(), logLevel: "error", server: { host: "127.0.0.1", port: 0 } });
  await server.listen();
  browser = await chromium.launch();
  url = `http://127.0.0.1:${(server.httpServer!.address() as AddressInfo).port}/tests/fixtures/cut-fade-measure.html`;
}, 60_000);
afterAll(async () => { await browser?.close(); await server?.close(); });

test("hug button faces occupy their grid width and preserve the row gap", async () => {
 const tab = await browser.newPage();
 await tab.goto(url);
 await tab.waitForFunction(() => document.documentElement.dataset.ready === 'true');
 for (const mode of ['native', 'host', 'slotted']) {
  const result = await tab.evaluate(async mode => {
   const stage = document.getElementById('stage')!;
   stage.style.cssText = 'display:flex;align-items:flex-end;gap:10px';
   stage.innerHTML = ['View as', 'Material', 'Present'].map(label => `<ds-button secondary fit control="${mode}">${mode === 'slotted' ? `<button>${label}</button>` : label}</ds-button>`).join('');
   await Promise.all([...stage.querySelectorAll('ds-button')].map((e: any) => e.updateComplete));
   await document.fonts.ready;
   return [...stage.querySelectorAll<HTMLElement>('ds-button')].map(host => {
    const face = mode === 'host' ? host : mode === 'slotted' ? host.querySelector('button')! : host.shadowRoot!.querySelector<HTMLElement>('[part="control"]')!;
    const rect = face.getBoundingClientRect();
    return { hostWidth: host.getBoundingClientRect().width, width: rect.width, left: rect.left, right: rect.right };
   });
  }, mode);
  for (const [index, face] of result.entries()) {
   expect(face.width).toBeCloseTo(face.hostWidth, 1);
   expect(face.width % 20).toBeLessThan(1);
   if (index) expect(face.left - result[index - 1].right).toBeCloseTo(10, 1);
  }
 }
 await tab.close();
});

test("button labels stay whole without gradients and snap up to the grid", async () => {
 const tab = await browser.newPage();
 await tab.goto(url);
 await tab.waitForFunction(() => document.documentElement.dataset.ready === 'true');
 for (const dir of ['ltr', 'rtl']) {
  const result = await tab.evaluate(async dir => {
   document.documentElement.dir = dir;
   document.getElementById('stage')!.innerHTML = ['native', 'host', 'slotted'].map(mode => `<ds-button primary fixed control="${mode}" style="--ds-button-width:80px">${mode === 'slotted' ? '<button>Try the product page</button>' : 'Try the product page'}</ds-button>`).join('');
   await Promise.all([...document.querySelectorAll('ds-button')].map((e: any) => e.updateComplete));
   await document.fonts.ready;
   await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
   return [...document.querySelectorAll<HTMLElement>('ds-button')].map(host => {
    const face = host.getAttribute('control') === 'host' ? host : host.getAttribute('control') === 'slotted' ? host.querySelector('button')! : host.shadowRoot!.querySelector<HTMLElement>('[part="control"]')!;
    const style = getComputedStyle(face), rect = face.getBoundingClientRect();
    const range = document.createRange(); range.selectNodeContents(host.getAttribute('control') === 'slotted' ? face : host);
    const label = range.getBoundingClientRect();
    return { width: host.getBoundingClientRect().width, unit: 20 * (Number(getComputedStyle(host).getPropertyValue('--ds-sf')) || 1), fits: label.left >= rect.left - 1 && label.right <= rect.right + 1, cut: face.hasAttribute('data-cut'), mask: style.maskImage, image: style.backgroundImage, clip: style.backgroundClip };
   });
  }, dir);
  for (const face of result) { expect(face.fits).toBe(true); expect(face.cut).toBe(false); expect(face.mask).toBe('none'); expect(face.clip).not.toContain('text'); expect(face.image).not.toContain('gradient'); expect(face.width % face.unit).toBeLessThan(1); }
 }
 const findings = await tab.evaluate(`(async () => {
  const path = '/DS1/0-face/constraints.ts';
  const { inspectConstraints } = await import(path);
  const inspect = () => inspectConstraints(document).filter((entry) => entry.constraint.code === 'button.visible-label').length;
  const clean = inspect();
  const button = document.querySelector('ds-button');
  button.setAttribute('style', 'mask-image:linear-gradient(black,transparent)');
  return { clean, masked: inspect() };
 })()`);
 expect(findings.clean).toBe(0); expect(findings.masked).toBeGreaterThan(0);
 await tab.close();
});
