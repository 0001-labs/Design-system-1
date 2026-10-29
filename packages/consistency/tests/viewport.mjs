import { componentFixture } from './component-fixture.mjs';
/** Local-only viewport contract. Build first; no customer data or live host. */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname } from 'node:path';
import { chromium } from 'playwright';
const root = fileURLToPath(new URL('../../../website/dist/', import.meta.url));
const server = createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const file = resolve(root, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
  if (!file.startsWith(root)) { response.writeHead(403).end(); return; }
  try { const body = await componentFixture(file); response.setHeader('content-type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html' })[extname(file)] ?? 'application/octet-stream'); response.end(body); }
  catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true });
try {
  const base = `http://127.0.0.1:${server.address().port}/editor/`;
  for (const width of [300, 390, 768, 1440, 1920]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } });
    await page.goto(base); await page.waitForSelector('.consistency-sheet');
 await page.locator('select[aria-label="Example page"]').selectOption('studio');
    const check = async label => {
      const result = await page.evaluate(() => { window.scrollTo(100, window.scrollY); return { client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth, left: window.scrollX }; });
      if (result.scroll > result.client || result.left !== 0) throw Error(`${width}px ${label}: document ${result.scroll}px exceeds viewport ${result.client}px`);
    };
    await check('initial');
    const checkInset = async mobile => {
      await page.waitForTimeout(100);
      const result = await page.evaluate(() => {
        const editor = document.querySelector('consistency-editor'), sheet = editor.querySelector('.consistency-sheet'), stage = editor.querySelector('.consistency-stage');
        const style = getComputedStyle(sheet), scale = Number.parseFloat(style.getPropertyValue('--sf')) || 1;
        const bounds = sheet.getBoundingClientRect(), text = editor.querySelector('.consistency-text-bounds').getBoundingClientRect();
        return { savedPadding: editor.history.value.padding, left: Number.parseFloat(style.paddingLeft) / scale, right: Number.parseFloat(style.paddingRight) / scale, textInset: (text.left - bounds.left) / scale, stageClient: stage.clientWidth, stageScroll: stage.scrollWidth };
      });
      if (result.savedPadding < 20 || result.left < 20 || result.right < 20 || result.textInset < 20 - .5) throw Error(`${width}px: zero saved padding removed website text inset: ${JSON.stringify(result)}`);
      if (mobile && result.stageScroll > result.stageClient + 1) throw Error(`${width}px: mobile preview scrolls sideways: ${JSON.stringify(result)}`);
      await check(mobile ? 'zero padding mobile inset' : 'zero padding desktop inset');
    };
    await page.evaluate(async () => { const editor = document.querySelector('consistency-editor'); editor.history.commit({ padding: 0 }); editor.requestUpdate(); await editor.updateComplete; });
    await checkInset(false);
    await page.getByRole('button', { name: 'Mobile preview', exact: true }).click(); await checkInset(true);
    await page.locator('ds-device-bezel ds-app-chrome[kind=ios]').getByText('00:01',{exact:true}).waitFor();
    await page.locator('ds-device-bezel ds-app-chrome[kind=safari-ios]').getByText('preview.example',{exact:true}).waitFor();
    await page.getByRole('button', { name: 'Desktop preview', exact: true }).click();

    await page.locator('select[aria-label="Library preset"]').selectOption('bold');
    await page.evaluate(() => { const editor = document.querySelector('consistency-editor'); editor.history.commit({ width: 960, sizes: { bookshop: { width: 800, height: 400 } }, text: '```c9y-button\n{"label":"Read more","secondary":false}\n```' }); editor.requestUpdate(); });
    await page.locator('.consistency-content-button').waitFor();
    await check('wide authored website and Bold library');
    const desktop = await page.locator('.consistency-stage').evaluate(stage => ({ stage:stage.clientWidth,sheet:stage.querySelector('.consistency-sheet').getBoundingClientRect().width }));
    if(Math.abs(desktop.sheet-desktop.stage)>1)throw Error(`${width}px: desktop website does not fill available width: ${JSON.stringify(desktop)}`);
    const text = page.locator('.consistency-content-button [contenteditable="plaintext-only"]');
    await text.focus(); await page.getByRole('toolbar', { name: 'Button action', exact: true }).waitFor({ state: 'visible' });
    await check('open button action toolbar');
    const toolbar = page.getByRole('toolbar', { name: 'Button action', exact: true }); await toolbar.locator('select').selectOption('link'); await toolbar.locator('ds-input').evaluate(element => { element.value = 'https://example.com/' + 'long-destination'.repeat(30); element.dispatchEvent(new Event('input', { bubbles: true })); }); await check('long destination field');
    await page.getByRole('button', { name: 'Mobile preview', exact: true }).click();
    await page.waitForTimeout(100);
    await check('mobile preview');
    const sheet = await page.locator('.consistency-sheet').evaluate(element => ({ client: element.clientWidth, scroll: element.scrollWidth }));
    if (sheet.scroll > sheet.client + 1) throw Error(`${width}px: mobile website itself overflows (${sheet.scroll} > ${sheet.client})`);
    await page.getByRole('button', { name: 'Desktop preview', exact: true }).click(); await check('restored desktop');
    console.log(`Viewport ${width}px: initial, wide canvas, Bold, action toolbar and mobile preview passed`);
    await page.reload(); await page.waitForSelector('.consistency-sheet');
    await page.evaluate(async () => {
      const editor = document.querySelector('consistency-editor');
      editor.history.commit({ width: 280, padding: 80, gaps: { ...editor.history.value.gaps, 'projects-columns': 500, 'stats-columns': 500 }, sizes: { bookshop: { width: 80, height: 100 } } });
      editor.requestUpdate(); await editor.updateComplete; await document.fonts.ready;
    });
    const readable = async label => {
      await page.waitForTimeout(100);
      const failures = await page.evaluate(() => {
        const problems = [];
        for (const element of document.querySelectorAll('.consistency-text-bounds, .consistency-sheet ds-stat, .consistency-sheet ds-card')) {
          if (!element.getClientRects().length || element.hidden) continue;
          const scale = Number.parseFloat(getComputedStyle(element).getPropertyValue('--sf')) || 1;
          const minimum = element.tagName === 'DS-CARD' ? 240 : 200;
          const actual = element.getBoundingClientRect().width / scale;
          if (actual < minimum - 1) problems.push(`${element.tagName} ${actual}px < ${minimum}px`);
          const figure = element.shadowRoot?.querySelector('.ds-stat__figure');
          if (figure && figure.scrollWidth > figure.clientWidth + 1) problems.push('Stat figure is clipped');
        }
        return problems;
      });
      if (failures.length) throw Error(`${width}px ${label}: ${failures.join('; ')}`);
      await check(label);
    };
    await readable('minimum width with excessive padding and gaps');
    await page.getByRole('button', { name: 'Mobile preview', exact: true }).click();
    await readable('minimum width in mobile preview');
    // The narrow-phone addition covers inset, containment and readable content;
    // the established hover-preview matrix remains 390, 768 and 1440px.
    if (width === 300) { console.log('Viewport 300px: zero-padding inset, mobile stage fit and readable content passed'); await page.close(); continue; }
    await page.reload(); await page.waitForSelector('.consistency-sheet');
    for (const preset of ['original', 'bold']) {
      await page.locator('select[aria-label="Library preset"]').selectOption(preset);
      await page.evaluate(() => { const e = document.querySelector('aa-editor'); e.editor.value = '/button'; e.editor.focus(); e.editor.selectRange(7); e.dispatchEvent(new Event('aa-change')); document.dispatchEvent(new Event('selectionchange')); });
      await page.locator('.aa-menu button').filter({ hasText: 'Button' }).hover();
      const preview = page.locator('.consistency-element-preview'); await preview.waitFor({ state: 'visible' });
      await preview.locator('ds-button').evaluate(async element => { await element.updateComplete; });
      const geometry = await preview.evaluate(element => {
        const button = element.querySelector('ds-button'), inner = element.querySelector('.consistency-element-preview-inner');
        const control = button.shadowRoot.querySelector('button') ?? button, caption = element.querySelector('.consistency-element-preview-label');
        const scale = Number.parseFloat(getComputedStyle(button).getPropertyValue('--sf')) || 1;
        return { zoom: getComputedStyle(inner).zoom, font: Number.parseFloat(getComputedStyle(control).fontSize) / scale, caption: Number.parseFloat(getComputedStyle(caption).fontSize) / scale, width: button.getBoundingClientRect().width / scale };
      });
      if (Number(geometry.zoom) !== 1 || geometry.font < 14 || geometry.caption < 14 || geometry.width < (preset === 'bold' ? 160 : 120) - 1) throw Error(`${width}px ${preset} undersized preview: ${JSON.stringify(geometry)}`);
      await check('readable slash preview'); await page.keyboard.press('Escape');
    }
    console.log(`Viewport ${width}px: readable text/card/stat minimums and full-size preview type passed`);
    await page.close();
  }
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
