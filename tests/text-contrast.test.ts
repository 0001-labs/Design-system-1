import { afterAll, beforeAll, expect, test } from 'vite-plus/test';
import { build } from 'esbuild';
import { chromium, type Browser, type Page } from 'playwright';
import { join } from 'node:path';
import { composite, contrastRatio } from '../DS1/0-face/text-contrast';

let browser: Browser;
let bundle: string;
beforeAll(async () => {
  browser = await chromium.launch();
  bundle = (await build({ entryPoints: [join(import.meta.dirname, '../DS1/0-face/constraints.ts')], bundle: true, format: 'iife', globalName: 'DSConstraints', write: false })).outputFiles[0]!.text;
});
afterAll(async () => browser?.close());
const findings = (page: Page) => page.evaluate(() => (window as any).DSConstraints.inspectConstraints(document)
  .filter((f: any) => f.constraint.code === 'color.text-contrast').map((f: any) => ({ id: f.element.id, message: f.message })));
async function fixture(html: string) {
  const page = await browser.newPage();
  await page.setContent(`<style>html { background:white; color:black; font:14px Arial } body{margin:20px} </style>${html}`);
  await page.addScriptTag({ content: bundle });
  return page;
}

test("rendered text contrast catches component overrides, slots, alpha and opacity", async () => {
  const page = await fixture(`<style>:root{--fill:#8589eb;--bad:#bfc2c8}</style>
    <div id="shadow"></div><div id="slot"></div><div id="raw-slot">Raw slotted words</div>
    <p id="alpha" style="color:rgba(0,0,0,.3)">Alpha text</p>
    <div style="opacity:.2"><p id="opacity">Faded group</p></div>
    <div style="background:black"><p id="safe" style="color:white;background:rgba(255,255,255,.05)">Readable</p></div>`);
  try {
    await page.evaluate(() => {
      document.querySelector('#raw-slot')!.attachShadow({mode:'open'}).innerHTML = '<div style="background:#aaa;color:#bbb"><slot></slot></div>';
      document.querySelector('#shadow')!.attachShadow({mode:'open'}).innerHTML = '<span id="initials" style="color:var(--bad);background:var(--fill)">AK</span>';
      const host = document.querySelector('#slot')!;
      host.innerHTML = '<span id="slotted" style="color:#aaa">Slotted words</span>';
      host.attachShadow({mode:'open'}).innerHTML = '<div style="background:#bbb"><slot></slot></div>';
    });
    const broken = await findings(page);
    expect(broken.map(f => f.id).sort()).toEqual(['alpha','initials','opacity','raw-slot','slotted']);
    expect(broken.find(f => f.id === 'initials')!.message).toContain('rgb(191, 194, 200) on rgb(133, 137, 235)');
    await page.evaluate(() => {
      document.querySelector('#shadow')!.shadowRoot!.querySelector<HTMLElement>('#initials')!.style.color = '#101112';
    });
    expect((await findings(page)).some(f => f.id === 'initials')).toBe(false);
    expect(await page.evaluate(() => (window as any).DSConstraints.measureConstraints(document).find((r: any) => r.constraint.code === 'color.text-contrast').measured)).toBe(6);
  } finally { await page.close(); }
});

test("contrast includes values, placeholders and visible decorative initials but skips hidden and disabled writing", async () => {
  const page = await fixture(`<style>input::placeholder{color:#ddd;opacity:1} #pseudo::before{content:'Generated label';color:#ddd}</style>
    <input id="password" type="password" value="private-value" style="color:#ddd;background:white"><input id="value" value="Value" style="color:#ddd;background:white">
    <input id="placeholder" placeholder="Placeholder" style="background:white">
    <span id="decorative" aria-hidden="true" style="color:#ddd">AB</span>
    <span id="pseudo"></span>
    <p hidden style="color:#eee">Hidden</p><p style="opacity:0">Invisible</p>
    <div style="display:none"><p>Hidden ancestor</p></div>
    <button disabled style="color:#ddd">Disabled</button><fieldset disabled><input value="Disabled fieldset"></fieldset>`);
  try {
    const broken = await findings(page);
    expect(broken.map(f=>f.id).sort()).toEqual(['decorative','password','placeholder','pseudo','value']);
    expect(JSON.stringify(broken)).not.toContain('private-value');
  } finally { await page.close(); }
});

test("unmeasurable backgrounds require review and opaque surfaces cover ancestor images", async () => {
  const page = await fixture(`<div style="background:linear-gradient(black,white)">
    <p id="gradient">Review this</p><p style="background:white">Opaque safe surface</p></div>
    <div style="filter:opacity(.5)"><p id="filter">Review filter</p></div>
    <p id="modern" style="color:color(srgb .7 .7 .7);background:color(srgb 1 1 1)">Modern CSS</p>`);
  try {
    const broken=await findings(page);
    expect(broken.map(f=>f.id).sort()).toEqual(['filter','gradient','modern']);
    expect(broken.find(f=>f.id==='gradient')!.message).toContain('visual contrast review');
    expect(broken.find(f=>f.id==='modern')!.message).toContain(':1 text contrast');
  } finally { await page.close(); }
});

test("contrast thresholds use unrounded ratios and composite transparent ink", () => {
  expect(contrastRatio([0,0,0,1],[1,1,1,1])).toBe(21);
  expect(contrastRatio([1,1,1,1],[1,1,1,1])).toBe(1);
  expect(composite([0,0,0,.5],[1,1,1,1])).toEqual([.5,.5,.5,1]);
  expect(contrastRatio([119/255,119/255,119/255,1],[1,1,1,1])).toBeLessThan(4.5);
});
