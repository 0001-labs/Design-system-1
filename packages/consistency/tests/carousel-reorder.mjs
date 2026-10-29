import { chromium, webkit } from 'playwright';
import { nativePageFixture, nativePicture } from './native-page-fixture.mjs';
const check = (ok, message) => { if (!ok) throw Error(message); };
const until = async (test, message) => { const end = Date.now() + 8000; while (!await test()) { if (Date.now() > end) throw Error(message); await new Promise(done => setTimeout(done, 30)); } };
const definition = { document: { schema: 1, kind: 'native-page', title: 'Work carousel', lang: 'en', layout: { padding: 40, gap: 40 }, blocks: [
 { id: 'work', kind: 'component', name: 'Carousel', children: ['one','two','three'].map(id => ({ id, kind: 'component', name: 'Card', children: [{ id: `${id}-title`, kind: 'text', text: `Project ${id}` }, { id: `${id}-image`, kind: 'image', src: nativePicture, alt: id, height: 180 }] })) }
] }, components: { Carousel: { tag: 'ds-carousel', attributes: { 'slide-width': '32', gap: '2', bleed: 'none' }, fields: [] }, Card: { tag: 'ds-card', attributes: {}, fields: [] } }, images: [nativePicture], bindings: {}, collections: {}, allowedRuntimes: {} };
for (const engine of [chromium, webkit]) {
 const fixture = await nativePageFixture({ definition }), browser = await engine.launch({ headless: true });
 try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }); page.setDefaultTimeout(8000);
  const errors=[];let phase='drop';page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.text().startsWith('C9Y constraint'))errors.push(phase+': '+message.text());});
  await fixture.route(page); await page.goto(fixture.url);
  const frame = page.frameLocator('.consistency-site-frame'); await frame.locator('[data-editor-surface]').waitFor();
  const order = async () => (await fixture.read()).document.blocks[0].children.map(block => block.id).join(',');
  const first = frame.locator('ds-card[data-native-block="one"]'), second = frame.locator('ds-card[data-native-block="two"]');
  const a = await first.boundingBox(), b = await second.boundingBox();
  check(a && b && b.x > a.x, 'Fixture cards are not side by side');
  const x = a.x + a.width / 2, y = a.y + a.height / 2, endX=Math.min(b.x+b.width-5,1340);
  const input = engine === chromium ? await page.context().newCDPSession(page) : null;
  const pointer = async (type, px, py) => input ? input.send('Input.dispatchMouseEvent', { type, x: px, y: py, ...(type === 'mouseMoved' ? { buttons: 1 } : { button: 'left', buttons: type === 'mousePressed' ? 1 : 0, clickCount: 1 }) }) : type === 'mousePressed' ? page.mouse.down() : type === 'mouseReleased' ? page.mouse.up() : page.mouse.move(px, py);
  await page.mouse.move(x, y); await pointer('mousePressed', x, y);
  for (let step = 1; step <= 12; step++) await pointer('mouseMoved', x + (endX - x) * step / 12, y);
  await pointer('mouseReleased', endX, y);

  await until(async () => await order() === 'two,one,three', 'Dragging a carousel card did not save the new order').catch(async error=>{throw Error(error.message+': '+JSON.stringify((await fixture.read()).document.blocks));});
  await until(async()=>!await frame.locator('html').getAttribute('data-drag-active'),'The drag did not finish');
  phase='cancel';
  const current=await first.boundingBox();
  const cancelX=current.x+current.width/2,cancelY=current.y+current.height/2,writes=fixture.writes.length;
  await page.mouse.move(cancelX,cancelY);await pointer('mousePressed',cancelX,cancelY);await pointer('mouseMoved',cancelX-80,cancelY);
  await page.keyboard.press('Escape');await pointer('mouseReleased',cancelX-80,cancelY);
  await until(async()=>!await frame.locator('html').getAttribute('data-drag-active'),'Cancelled drag did not finish');
  check(await order()==='two,one,three'&&fixture.writes.length===writes,'Cancelling changed the carousel order');
  await input?.detach();
  phase='undo';
  await frame.locator('body').click({position:{x:200,y:5}});
  await page.keyboard.press(process.platform==='darwin'?'Meta+Z':'Control+Z');
  await until(async()=>await order()==='one,two,three','Undo did not restore the carousel order');
  await page.keyboard.press(process.platform==='darwin'?'Meta+Shift+Z':'Control+Shift+Z');
  await until(async()=>await order()==='two,one,three','Redo did not restore the carousel order');
  await frame.locator('[data-native-block="one-title"]').click();
  await page.keyboard.press(process.platform==='darwin'?'Meta+A':'Control+A');await page.keyboard.type('Edited project');
  await frame.locator('body').click({position:{x:200,y:5}});
  await until(async()=>(await fixture.read()).document.blocks[0].children.find(card=>card.id==='one').children[0].text==='Edited project','Carousel title editing did not save');
  await page.reload(); await frame.locator('[data-editor-surface]').waitFor();
  check(await frame.locator('ds-carousel > ds-card').evaluateAll(cards => cards.map(card => card.dataset.nativeBlock).join(',')) === 'two,one,three', 'Reopening lost the carousel order');
  const publicPage = await browser.newPage(); await publicPage.goto(fixture.base + '/fixture-public/');
  check(await publicPage.locator('ds-carousel > ds-card').evaluateAll(cards => cards.map(card => card.dataset.nativeBlock).join(',')) === 'two,one,three', 'Published rendering lost the carousel order');
  check(!errors.length,errors.join('; '));
  console.log(`${engine.name()}: Carousel cards drag horizontally, save and reopen in their new order`);
 } finally { await browser.close(); await fixture.close(); }
}
