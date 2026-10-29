// @vitest-environment node
import { afterAll, beforeAll, expect, test } from 'vite-plus/test';
import { chromium, webkit, type Browser } from 'playwright';
import { createServer, type ViteDevServer } from 'vite';
import type { AddressInfo } from 'node:net';
let server: ViteDevServer, url: string;
beforeAll(async () => {
  server = await createServer({ configFile: false, root: process.cwd(), logLevel: 'error', server: { host: '127.0.0.1', port: 0 } });
  await server.listen(); url = `http://127.0.0.1:${(server.httpServer!.address() as AddressInfo).port}/tests/fixtures/calendar-mobile-swipe.html`;
}, 60_000);
afterAll(async () => { await server?.close(); });
for (const [name, engine] of [['Chromium', chromium], ['WebKit', webkit]] as const) test(`${name}: adjacent month follows a held touch and returns with stable geometry`, async () => {
  const browser: Browser = await engine.launch({headless:true});
  try {
    const page = await browser.newPage({ viewport: {width:390,height:844}, hasTouch:true });
    await page.goto(url); await page.waitForFunction(() => !!document.querySelector('ds-calendar')?.shadowRoot?.querySelector('.month-track'));
    const read = () => page.evaluate(() => { const c = document.querySelector('ds-calendar') as any; return {month:c.month, value:c.value, height:c.getBoundingClientRect().height}; });
    const before = await read();
    const drag = async (from:number,to:number) => page.evaluate(({from,to}) => {
      const c=document.querySelector('ds-calendar') as any, grid=c.shadowRoot.querySelector('.grid');
      for(const [type,x] of [['pointerdown',from],['pointermove',to]]) grid.dispatchEvent(new PointerEvent(type as string,{pointerId:1,pointerType:'touch',isPrimary:true,clientX:x as number,clientY:100,bubbles:true,composed:true,cancelable:true}));
    },{from,to});
    await drag(180,100);
    await page.waitForFunction(() => { const t=document.querySelector('ds-calendar')!.shadowRoot!.querySelector('.month-track')!; return new DOMMatrixReadOnly(getComputedStyle(t).transform).m41 < -70; });
    expect(await page.locator('.month-neighbour.next ds-calendar').count()).toBe(1);
    const release=async(x:number)=>page.evaluate(x=>document.querySelector('ds-calendar')!.shadowRoot!.querySelector('.grid')!.dispatchEvent(new PointerEvent('pointerup',{pointerId:1,pointerType:'touch',isPrimary:true,clientX:x,clientY:100,bubbles:true,composed:true})),x);
    await release(100); await page.waitForFunction(()=>(document.querySelector('ds-calendar') as any).month==='2027-01');
    await drag(70,150); await release(150); await page.waitForFunction(()=>(document.querySelector('ds-calendar') as any).month==='2026-12');
    const after=await read(); expect(after.value).toBe(before.value); expect(after.height).toBe(before.height);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  } finally {await browser.close();}
},60_000);
