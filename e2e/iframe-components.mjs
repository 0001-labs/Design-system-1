import { createServer } from 'vite';
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const server = await createServer({configFile:false,server:{host:'127.0.0.1',port:0}});
await server.listen();
const browser=await chromium.launch({headless:true});
try {
  const page=await browser.newPage(); const errors=[]; page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/e2e/fixtures/iframe-components.html`);
  await page.evaluate(()=>customElements.whenDefined('ds-card'));
  const result=await page.evaluate(async()=>{
    const frame=document.createElement('iframe');frame.setAttribute('sandbox','allow-same-origin');frame.srcdoc='<!doctype html><html><body></body></html>';
    const loaded=new Promise(resolve=>frame.onload=resolve);document.body.append(frame);await loaded;
    const doc=frame.contentDocument;
    const card=document.createElement('ds-card');card.style.width='280px';card.style.height='200px';card.innerHTML='<span slot="title">A native card</span><p>Native content</p>';
    const button=document.createElement('ds-button');button.text='Native destination';
    // Components and nested template-created components are constructed in the
    // registered realm, then connected to a script-free authored document.
    doc.body.append(doc.adoptNode(card),doc.adoptNode(button));
    await Promise.all([card.updateComplete,button.updateComplete]);
    const text=button.shadowRoot.querySelector('ds-text');await text?.updateComplete;
    const original=document.createElement('ds-card');original.style.width='280px';document.body.append(original);await original.updateComplete;
    const embedded=[];for(const tag of ['ds-table','ds-form','ds-container']){const element=document.createElement(tag);doc.body.append(doc.adoptNode(element));await element.updateComplete;embedded.push({tag,styles:element.shadowRoot.querySelectorAll('style').length});}
    return {embedded,sandbox:frame.getAttribute('sandbox'),card:card.getBoundingClientRect().width,title:card.querySelector('[slot=title]').getBoundingClientRect().width,styles:card.shadowRoot.querySelectorAll('style').length,nested:!!text?.shadowRoot,nestedStyles:text?.shadowRoot?.querySelectorAll('style').length,ordinary:original.getBoundingClientRect().width};
  });
  assert.deepEqual(errors,[]);assert.ok(result.embedded.every(element=>element.styles>0));assert.equal(result.sandbox,'allow-same-origin');assert.equal(result.card,280);assert.ok(result.title>0);assert.ok(result.styles>0);assert.ok(result.nested);assert.ok(result.nestedStyles>0);assert.equal(result.ordinary,280);
  console.log('Canonical components render in script-free frames, including nested Lit components.');
} finally {await browser.close();await server.close();}
