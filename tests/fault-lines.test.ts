import { afterAll, beforeAll, expect, test } from 'vite-plus/test';
import { build } from 'esbuild';
import { chromium, webkit, type Browser } from 'playwright';
import { join } from 'node:path';
import { createServer, type ViteDevServer } from 'vite';
import type { AddressInfo } from 'node:net';
let server: ViteDevServer;
let base: string;
let browsers: Browser[];
let bundle: string;
beforeAll(async () => {
  server = await createServer({configFile:false, root:process.cwd(), logLevel:'error', server:{host:'127.0.0.1',port:0}});
  await server.listen();
  base = `http://127.0.0.1:${(server.httpServer!.address() as AddressInfo).port}`;
  browsers = await Promise.all([chromium.launch(), webkit.launch()]);
  bundle = (await build({stdin:{contents:"export * from './fault-lines'; export { createConstraintPanel } from './constraint-panel';",resolveDir:join(import.meta.dirname,'../DS1/0-face'),loader:'ts'},bundle:true,format:'iife',globalName:'FaultLines',write:false})).outputFiles[0]!.text;
});
afterAll(async () => { await server?.close(); await Promise.all(browsers?.map(browser=>browser.close()) ?? []); });

test("fault lines catch shifted tracks and unequal gaps across sections at each viewport", async () => {
  for (const browser of browsers) {
    const page = await browser.newPage();
    try {
      for (const width of [320,375,393,430,599,600,768,959,960,1024,1440]) {
        await page.setViewportSize({width,height:900});
        await page.setContent(`<style>
          body{margin:20px}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px;width:260px;margin-bottom:30px}
          button{height:40px;border:0}.bad{gap:10px}.tall button{height:80px}
          @media(max-width:599px){.grid{width:240px;grid-template-columns:1fr}}
          </style>
          <section><div id="reference" data-ds-fault-lines="cards" class="grid tall"><button>A</button><button>B</button><button>C</button><button>D</button></div></section>
          <section><div id="bad" data-ds-fault-lines="cards" class="grid bad"><button>A</button><button>B</button><button>C</button><button>D</button></div></section>
          <div id="hidden" data-ds-fault-lines="cards" class="grid bad" style="display:none"><button>A</button><button>B</button></div>
          <div data-ds-fault-lines="other" class="grid bad"><button>A</button><button>B</button></div>`);
        await page.addScriptTag({content:bundle});
        const findings = () => page.evaluate(()=>(window as any).FaultLines.inspectFaultLines(document).map((f:any)=>({id:f.element.id,review:!!f.review,message:f.message})));
        expect((await findings()).map(f=>f.id), `${width}px`).toEqual(['bad']);
        expect((await findings())[0]!.message).toContain(`${width}px`);
        await page.locator('#bad').evaluate(el=>(el as HTMLElement).style.gap='20px');
        expect(await findings()).toEqual([]); // Different card heights and responsive tracks are valid.
        await page.locator('#bad').evaluate(el=>(el as HTMLElement).style.marginLeft='4px');
        expect((await findings()).map(f=>f.id)).toEqual(['bad']);
        await page.locator('#bad').evaluate(el=>(el as HTMLElement).style.marginLeft='0.5px');
        expect(await findings()).toEqual([]); // Subpixel rounding is not a fault.
      }
    } finally {await page.close();}
  }
});

test("fault lines cross shadow boundaries and report inferred relationships for review", async () => {
  const page = await browsers[0]!.newPage();
  try {
    await page.setContent('<div id="host"></div><div id="second"></div><div id="inferred"></div>');
    await page.evaluate(()=>{
      const content=(id:string,gap:number,named:boolean)=>`<style>.grid{display:grid;grid-template-columns:repeat(2,1fr);width:260px;gap:${gap}px}button{height:40px}</style><div id="${id}" class="grid" ${named?'data-ds-fault-lines="cards"':''}><button>A</button><button>B</button></div>`;
      document.querySelector('#host')!.attachShadow({mode:'open'}).innerHTML=content('shadow-reference',20,true);
      document.querySelector('#second')!.innerHTML=content('bad',10,true);
      document.querySelector('#inferred')!.innerHTML=content('auto-reference',20,false)+content('auto-bad',10,false);
      (document.querySelector('#auto-reference') as HTMLElement).style.gap='20px';
    });
    await page.addScriptTag({content:bundle});
    expect(await page.evaluate(()=>(window as any).FaultLines.inspectFaultLines(document).map((f:any)=>[f.element.id,!!f.review]))).toEqual([['bad',false],['auto-bad',true]]);
  } finally {await page.close();}
});


test("fault line overlays paint reference and actual edges and follow the viewport", async () => {
  for (const browser of browsers) {
    const page = await browser.newPage({viewport:{width:1000,height:700}});
    try {
      await page.setContent(`<style>body{margin:20px;min-height:1600px}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:20px;width:260px;margin-bottom:80px}button{height:40px}#bad{gap:10px}</style><div class="grid" data-ds-fault-lines="cards"><button>A</button><button>B</button></div><div id="bad" class="grid" data-ds-fault-lines="cards"><button>C</button><button>D</button></div>`);
      await page.addScriptTag({content:bundle});
      await page.evaluate(()=>{(window as any).panel=(window as any).FaultLines.createConstraintPanel();(window as any).panel.show();});
      const overlay = page.locator('[data-ds-constraint-panel]');
      expect(await overlay.locator('[data-fault-reference]').count()).toBe(4);
      expect(await overlay.locator('[data-fault-actual]').count()).toBe(2);
      expect(await overlay.locator('[data-fault-gap]').textContent()).toContain('Gap 10px · reference 20px');
      expect(await overlay.locator('[data-fault-reference]').first().getAttribute('x1')).toBe('20');
      const before = Number(await overlay.locator('[data-fault-actual]').first().getAttribute('y1'));
      await page.evaluate(()=>scrollTo(0,50));
      await page.waitForFunction(y=>Number(document.querySelector('[data-ds-constraint-panel]')!.shadowRoot!.querySelector('[data-fault-actual]')!.getAttribute('y1'))===y-50,before);
      await overlay.getByRole('button',{name:'Lines',exact:true}).click();
      expect(await overlay.getAttribute('data-lines-only')).toBe('');
      expect(await page.evaluate(()=>document.elementFromPoint(30,100)?.closest('[data-ds-constraint-panel]')===null)).toBe(true);
      await page.locator('#bad').evaluate((el:HTMLElement)=>el.style.gap='20px');
      await page.waitForFunction(()=>document.querySelector('[data-ds-constraint-panel]')!.shadowRoot!.querySelectorAll('[data-fault-actual]').length===0);
      await page.setViewportSize({width:430,height:700});
      await page.waitForFunction(()=>document.querySelector('[data-ds-constraint-panel]')!.shadowRoot!.querySelector('svg')!.getAttribute('viewBox')==='0 0 430 700');
      expect(await overlay.locator('svg').getAttribute('viewBox')).toBe('0 0 430 700');
      await page.evaluate(()=>(window as any).panel.hide());
      expect(await overlay.locator('[data-fault-reference]').count()).toBe(0);
      expect(await overlay.evaluate(el=>(el as HTMLElement).hidden)).toBe(true);
    } finally {await page.close();}
  }
});


test("fault lines enforce visible content edges through real text-tab slots", async () => {
  for (const browser of browsers) {
    const page = await browser.newPage();
    try {
      await page.goto(`${base}/tests/fixtures/fault-lines-column.html`);
      await page.waitForFunction(() => document.documentElement.dataset.ready === 'true');
      await page.addScriptTag({content:bundle});
      const findings = () => page.evaluate(() => (window as any).FaultLines.inspectFaultLines(document).map((f:any) => f.element.id));
      for (const width of [320,375,393,430,768,1024,1440]) for (const scale of [1,1.5]) {
        await page.setViewportSize({width,height:900});
        await page.evaluate(scale => document.documentElement.style.setProperty('--ds-sf', String(scale)), scale);
        expect(await findings(), `aligned at ${width}px, scale ${scale}`).toEqual([]);
        // Reproduce the regression: outer -4px remains, inner padding disappears.
        await page.locator('#tabs ds-button').evaluateAll(els => els.forEach(el => (el as HTMLElement).style.setProperty('--ds-text-tab-padding','0')));
        expect(await findings()).toEqual(['tabs']);
        await page.evaluate(() => {
          const layer = document.createElementNS('http://www.w3.org/2000/svg','svg');
          layer.id = 'overlay'; document.body.append(layer);
          (window as any).FaultLines.paintFaultLines(document, layer);
        });
        expect(await page.locator('#overlay [data-fault-actual]').count()).toBe(1);
        await page.locator('#overlay').evaluate(el => el.remove());
        await page.locator('#tabs ds-button').evaluateAll(els => els.forEach(el => (el as HTMLElement).style.removeProperty('--ds-text-tab-padding')));
        expect(await findings()).toEqual([]);
      }
      await page.locator('#tabs').evaluate(el => el.setAttribute('data-ds-fault-lines','off'));
      await page.locator('#tabs ds-button').evaluateAll(els => els.forEach(el => (el as HTMLElement).style.setProperty('--ds-text-tab-padding','0')));
      expect(await findings()).toEqual([]);
    } finally { await page.close(); }
  }
}, 60_000);
