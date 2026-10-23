/** Render the opt-in finishes and their accessibility fallbacks in isolation.
 * Optionally check the built documentation: node scripts/check-material.mjs URL. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { chromium, webkit } from 'playwright';

const css = readFileSync(new URL('../DS1/1-root/material.css', import.meta.url), 'utf8');
const compressed = gzipSync(css).length;
assert.ok(compressed < 16 * 1024, `Optional material CSS exceeds 16 KiB gzip: ${compressed}`);
const tile = css.match(/url\("(data:image\/png;base64,[^"]+)"\)/)[1];
for (const engine of [chromium, webkit]) {
  const browser = await engine.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(`<style>
      :root { color-scheme: light dark; --ds-paper: light-dark(#f4f4f4, #2c2c2c); --ds-text-color: light-dark(#2a2a2a, #fff); --ds-orange: #fec20d; --ds-sharp-blue: #594dff; }
      section { width: 240px; height: 160px; }
      ${css}
    </style>${['solid', 'paper', 'glass', 'wash'].map(name => `<section id="${name}" data-ds-material="${name}">Readable writing</section>`).join('')}
    <div data-ds-material="glass"><div id="nested" data-ds-material="glass">Nested</div></div>`);
    const styles = () => page.evaluate(() => Object.fromEntries([...document.querySelectorAll('[id]')].map(el => {
      const s = getComputedStyle(el);
      return [el.id, { background: s.backgroundColor, image: s.backgroundImage, blur: s.backdropFilter || s.webkitBackdropFilter, ink: s.color }];
    })));
    await page.emulateMedia({ colorScheme: 'light' });
    const light = await styles();
    assert.equal(light.solid.blur, 'none');
    assert.equal(light.paper.blur, 'none');
    assert.ok(light.paper.image.startsWith('url('));
    assert.ok(light.wash.image.includes('linear-gradient'));
    assert.equal(light.glass.blur, 'blur(8px)');
    assert.equal(light.nested.blur, 'none');
    const dimensions = await page.evaluate(async src => {
      const image = new Image();
      image.src = src;
      await image.decode();
      return [image.naturalWidth, image.naturalHeight];
    }, tile);
    assert.deepEqual(dimensions, [128, 128]);
    await page.emulateMedia({ colorScheme: 'dark' });
    const dark = await styles();
    for (const material of ['solid', 'paper', 'glass', 'wash']) {
      assert.notEqual(light[material].background, dark[material].background);
      assert.notEqual(light[material].ink, dark[material].ink);
    }
    const assertFlat = async () => {
      const flat = await styles();
      for (const material of ['solid', 'paper', 'glass', 'wash']) {
        assert.equal(flat[material].blur, 'none');
        assert.equal(flat[material].image, 'none');
        assert.equal(flat[material].background, flat.solid.background);
      }
    };
    await page.evaluate(() => document.body.setAttribute('data-ds-material-effects', 'off'));
    await assertFlat();
    await page.evaluate(() => document.body.removeAttribute('data-ds-material-effects'));
    await page.emulateMedia({ media: 'print' });
    await assertFlat();
    await page.emulateMedia({ media: 'screen', contrast: 'more' });
    await assertFlat();
    await page.emulateMedia({ contrast: 'no-preference', forcedColors: 'active' });
    await assertFlat();
    await page.emulateMedia({ forcedColors: 'none' });
    if (engine === chromium) {
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }] });
      assert.equal(await page.evaluate(() => matchMedia('(prefers-reduced-transparency: reduce)').matches), true);
      await assertFlat();
      await cdp.send('Emulation.setEmulatedMedia', { features: [] });
    }
    assert.equal(await page.evaluate(() => document.getAnimations().length), 0);
    if (process.argv[2]) {
      await page.emulateMedia({ colorScheme: 'light' });
      await page.setViewportSize({ width: 1440, height: 1100 });
      await page.goto(new URL('/1-root/material/', process.argv[2]).href, { waitUntil: 'networkidle' });
      assert.equal(await page.locator('.surface[data-ds-material]').count(), 4);
      const drawn = await page.locator('.surface').evaluateAll(elements => elements.map(el => {
        const rect = el.getBoundingClientRect();
        return { width: rect.width, height: rect.height, blur: getComputedStyle(el).backdropFilter };
      }));
      assert.ok(drawn.every(rect => rect.width % 20 === 0 && rect.height % 20 === 0), JSON.stringify(drawn));
      assert.equal(drawn[2].blur, 'blur(8px)');
      if (engine === chromium) await page.locator('.materials').screenshot({ path: '/tmp/ds1-materials.png' });
    }
    console.log(`${engine.name()}: light/dark, tile decoding, nested blur, effects off, print, contrast and forced colours passed.`);
  } finally { await browser.close(); }
}
console.log(`Material CSS: ${compressed} bytes gzip; no animation or runtime texture generation.`);
