/** Prove the browser renders Inter arrows even with custom fonts and no network. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
const root = new URL('../../DS1/1-root/', import.meta.url);
const read = file => readFileSync(new URL(file, root), 'utf8').replace(/@import[^;]+;/g, '');
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.route('**/*', route => route.abort());
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('DOM.enable');
  await cdp.send('CSS.enable');
  for (const sheet of ['fonts.css', 'component-tokens.css', 'inter-arrows.css']) {
    await page.setContent(`<style>${read(sheet)}${read('text.css')}
      :root { --ds-typeface-regular: serif; --ds-typeface-medium: serif; }
      #portable { font-family: "Inter Arrows", monospace; }
    </style><p id="body">←↑→↓↔↕↖↗↘↙↩↪</p><h2 id="heading">→</h2><code id="portable">→</code>`);
    await page.evaluate(() => document.fonts.ready);
    const { root: document } = await cdp.send('DOM.getDocument');
    for (const selector of ['#body', '#heading', '#portable']) {
      const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: document.nodeId, selector });
      const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
      assert(fonts.length > 0, `${sheet} ${selector}: no rendered font`);
      assert(fonts.every(font => font.isCustomFont && /Inter/.test(font.familyName)), `${sheet} ${selector}: ${JSON.stringify(fonts)}`);
    }
  }
  console.log('Inter arrows rendered from all three entry points, offline, with custom typography.');
} finally { await browser.close(); }
