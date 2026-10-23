import { afterAll, beforeAll, expect, test } from 'vite-plus/test';
import { build } from 'esbuild';
import { chromium, webkit, type Browser } from 'playwright';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string) => readFileSync(join(import.meta.dirname, '..', path), 'utf8');
let browsers: Browser[];
let bundle: string;
beforeAll(async () => {
  browsers = await Promise.all([chromium.launch(), webkit.launch()]);
  bundle = (await build({ entryPoints: [join(import.meta.dirname, '../DS1/0-face/word-wrap.ts')], bundle: true, format: 'iife', globalName: 'WordWrap', write: false })).outputFiles[0]!.text;
});
afterAll(async () => { await Promise.all(browsers?.map(browser => browser.close()) ?? []); });

test("headings and table headers keep whole words or use a typesetting hyphen", async () => {
  for (const browser of browsers) {
    const page = await browser.newPage();
    try {
      await page.setContent(`<html lang="en"><style>
        h2, th, [role=heading] { margin:0; padding:0; font:20px/30px monospace; width:78px; }
        .bad { overflow-wrap:anywhere; } table { table-layout:fixed; width:78px; }
        .manual { hyphens:manual } .auto { hyphens:auto; -webkit-hyphens:auto; }
        </style>
        <h2 id="last-letter" class="bad">Material</h2>
        <table><tr><th id="table" class="bad">Material</th></tr></table>
        <h2 id="inline" class="bad">Mate<span>rial</span></h2>
        <h2 id="forced">Mate<br>rial</h2>
        <h2 id="auto-forced" class="auto">Mate<br>rial</h2>
        <h2 id="auto-emergency" class="auto bad">xxxxxxxq</h2>
        <h2 id="safe">Material</h2>
        <h2 id="phrase">Small header</h2>
        <h2 id="manual" class="manual">type&shy;setting</h2>
        <h2 id="hyphen">well-known</h2>
        <h2 id="auto" class="auto">internationalization</h2>
        <h2 id="cjk" lang="ja">日本語の見出し</h2>
        <h2 id="hidden" class="bad" hidden>Material</h2>
        <div id="shadow"></div><div id="slot">Material</div>
        <p class="bad" style="width:78px">Material</p></html>`);
      await page.evaluate(() => {
        document.querySelector('#shadow')!.attachShadow({mode:'open'}).innerHTML = '<h2 id="shadow-heading" style="font:20px/30px monospace;width:78px;word-break:break-all">Material</h2>';
        document.querySelector('#slot')!.attachShadow({mode:'open'}).innerHTML = '<h2 id="slot-heading" style="font:20px/30px monospace;width:78px;overflow-wrap:anywhere"><slot></slot></h2>';
      });
      await page.addScriptTag({ content: bundle });
      const ids = await page.evaluate(() => (window as any).WordWrap.inspectWordWrap(document).map((f: any) => f.element.id).sort());
      expect(ids).toEqual(['auto-emergency','auto-forced','forced','inline','last-letter','shadow-heading','slot-heading','table']);
    } finally { await page.close(); }
  }
});

test("shared heading styles and docs tables prevent inherited emergency word breaks", async () => {
  for (const browser of browsers) {
    const page = await browser.newPage();
    try {
      const text = read('DS1/1-root/text.css').replace(/^@import.*$/gm, '');
      const prose = read('DS1/1-root/prose.css').replace(/^@import.*$/gm, '');
      const docs = read('website/src/styles/custom.css');
      const tableRules = docs.slice(docs.indexOf('.sl-markdown-content :is(th, td)'), docs.indexOf('.expressive-code pre'));
      await page.setContent(`<style>${text}\n${prose}\n${tableRules}
        body { font:20px/30px monospace; overflow-wrap:anywhere; word-break:break-all; }
        h2 {font:inherit;width:78px} table{table-layout:fixed;width:78px}th{font:inherit}
        </style><section data-ds-prose class="sl-markdown-content"><h2>Material</h2><table><tr><th>Material</th></tr></table></section>
        <ds-text size="heading" wrap>Material</ds-text>`);
      const component = read('DS1/2-core/styles/ds-text.css').replace(/^@import.*$/gm, '');
      await page.evaluate(css => {
        document.querySelector('ds-text')!.attachShadow({mode:'open'}).innerHTML = `<style>${css}:host{font:20px/30px monospace;width:78px}</style><slot></slot>`;
      }, component);
      await page.addScriptTag({ content: bundle });
      expect(await page.evaluate(() => (window as any).WordWrap.inspectWordWrap(document).length)).toBe(0);
      expect(await page.evaluate(() => ['h2','th','ds-text'].map(tag => getComputedStyle(document.querySelector(tag)!).overflowWrap))).toEqual(['normal','normal','normal']);
    } finally { await page.close(); }
  }
});
