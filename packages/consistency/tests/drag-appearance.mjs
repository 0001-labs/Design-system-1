import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { nativePageFixture, nativePicture } from './native-page-fixture.mjs';

// A two-paragraph site region takes Aa's paragraph path; moving an image
// takes the page controller's path. Both must retain their enclosing site's design.
const source = 'First paragraph with enough words to wrap inside a narrow column.\n\nWe are looking for **Sponsors**, Event Venues, collaboration partners with knowledge and connections that can help us realize the trip for around 100 Child members and a smaller entourage of adult staff.';
const fixture = await nativePageFixture({
 definition: {document: {schema: 1, kind: 'native-page', title: 'Appearance', lang: 'en', layout: {maxWidth: 720, padding: 20, gap: 40}, blocks: [
  {id: 'words', kind: 'content', source}, {id: 'other', kind: 'image', src: nativePicture, alt: 'Picture', width: 300, height: 180}
 ]}, bindings: {}},
 styles: '.c9y-native-content{max-width:340.5px;font:16px/20px Georgia,serif}.c9y-native-content .aa-block strong{color:rgb(150,20,30);font-size:18px}.c9y-native-content .aa-block{background:transparent!important}'
});
const browser = await chromium.launch({headless: true});
const appearance = element => {
 const root = element.getBoundingClientRect();
 const nodes = [element, ...element.querySelectorAll('*')];
 return nodes.map(node => {
  const style = getComputedStyle(node), rect = node.getBoundingClientRect();
  const range = document.createRange(); range.selectNodeContents(node);
  return {tag: node.tagName, text: node.textContent, width: rect.width, height: rect.height,
   font: style.fontFamily, size: style.fontSize, weight: style.fontWeight, line: style.lineHeight,
   color: style.color, background: style.backgroundColor, padding: style.padding, border: style.border,
   lines: [...range.getClientRects()].map(box => [box.width, box.height, box.left-root.left, box.top-root.top])};
 });
};
try {
 const page = await browser.newPage({viewport: {width: 1200, height: 900}});
 await page.emulateMedia({reducedMotion: 'reduce'}); await fixture.route(page); await page.goto(fixture.url);
 await page.waitForFunction(() => document.querySelector('.consistency-site-frame')?.contentDocument?.querySelector('[data-editor-surface]'));
 const frame = page.frameLocator('.consistency-site-frame');
 for (const paragraph of [
  frame.locator('.aa-block').filter({hasText: 'We are looking for'}).first(),
  frame.locator('[data-native-block="other"]'),
 ]) {
 const before = await paragraph.evaluate(appearance), saved = JSON.stringify((await fixture.read()).document);
 const box = await paragraph.boundingBox(), point = {x: box.x+100, y: box.y+10};
 const input = await page.context().newCDPSession(page);
 await input.send('Input.dispatchMouseEvent', {type:'mouseMoved', ...point});
 await input.send('Input.dispatchMouseEvent', {type:'mousePressed', ...point, button:'left', buttons:1, clickCount:1});
 for (let n=1;n<=10;n++) await input.send('Input.dispatchMouseEvent', {type:'mouseMoved', x:point.x, y:point.y+n*3, buttons:1});
 const preview = frame.locator('[data-drag-preview]'); await preview.waitFor();
 const during = await preview.evaluate(appearance);
 await page.keyboard.press('Escape');
 await input.send('Input.dispatchMouseEvent', {type:'mouseReleased', ...point, button:'left', buttons:0, clickCount:1});
 await input.detach();
 assert.deepEqual(during, before, 'Carrying a paragraph changed its rendered appearance');
 assert.equal(JSON.stringify((await fixture.read()).document), saved, 'Cancellation changed stored content');
 assert.deepEqual(await paragraph.evaluate(appearance), before, 'Cancellation changed the original element');
 }
 console.log('Dragged content preserves typography, wrapping and appearance');
} finally { await browser.close(); await fixture.close(); }
