// @vitest-environment node
import { afterAll, beforeAll, expect, test } from 'vite-plus/test';
import { chromium, type Browser, type Page } from 'playwright';
import { createServer, type ViteDevServer } from 'vite';
import type { AddressInfo } from 'node:net';
let server: ViteDevServer, browser: Browser, page: Page, base: string;
beforeAll(async()=>{
 server=await createServer({configFile:false,root:process.cwd(),publicDir:'website/public',logLevel:'error',server:{host:'127.0.0.1',port:0}});await server.listen();
 base=`http://127.0.0.1:${(server.httpServer!.address() as AddressInfo).port}`;
 browser=await chromium.launch();page=await browser.newPage();
},60000);
afterAll(async()=>{await browser?.close();await server?.close();});
async function open(name:string,width=1280){await page.setViewportSize({width,height:1000});await page.goto(`${base}/tests/fixtures/product-examples.html?example=${name}`);await page.waitForSelector('html[data-ready="true"]');}
for(const name of ['shop','planner','finance','product'])test(`${name} fits wide and narrow screens and loads its photographs`,async()=>{
 for(const width of [1280,390]){
  await open(name,width);
  await page.locator('ds-image img').evaluateAll(images=>Promise.all(images.map(image=>{const img=image as HTMLImageElement;img.loading='eager';return img.decode();})));
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  expect(await page.locator('ds-image img').count()).toBeGreaterThan(0);
  await page.waitForTimeout(500);
  await page.screenshot({path:`/tmp/ds1-${name}-${width}.png`,fullPage:true});
 }
},30000);
test('shop filters products and maintains a local bag',async()=>{
 await open('shop');await page.locator('[data-category="furniture"]').click();await expect.poll(()=>page.locator('[data-product]:visible').count()).toBe(1);
 await page.locator('[data-add="Everyday chair"]').click();expect(await page.locator('#bag').textContent()).toBe('Bag · 1');
 await page.locator('#bag').click();expect(await page.locator('#bag-content').textContent()).toContain('€180');
 await page.locator('#clear-bag').click();expect(await page.locator('#bag').textContent()).toBe('Bag · 0');
});
test('planner completes, finds and creates items',async()=>{
 await open('planner');await page.locator('#work-items input').first().click();await expect.poll(()=>page.locator('#work-items input').count()).toBe(2);
 await page.locator('#new-item input').fill('Check the proof');await page.locator('#add-item').click();
 await page.locator('#item-search input').fill('proof');await expect.poll(()=>page.locator('#work-items input').count()).toBe(1);expect(await page.locator('#work-items').textContent()).toContain('Check the proof');
});
test('finance searches and switches month',async()=>{
 await open('finance');await page.locator('[data-filter="income"]').click();await expect.poll(()=>page.locator('#transaction-count').textContent()).toBe('2 transactions');
 await page.locator('#transaction-search input').fill('North');await expect.poll(()=>page.locator('#transaction-count').textContent()).toBe('1 transactions');
 await page.locator('#month').click();expect(await page.locator('#month').textContent()).toBe('September');expect(await page.locator('ds-table tbody th').first().textContent()).toContain('Sep');
});
test('product configuration changes the local purchase summary',async()=>{
 await open('product');await page.locator('[data-package="Headphones + travel case"]').click();await page.locator('#configure-add').click();expect(await page.locator('#product-status').textContent()).toContain('Headphones + travel case');
});
