import { afterAll, beforeAll, expect, test } from 'vite-plus/test';
import { build } from 'esbuild';
import { chromium, webkit, type Browser } from 'playwright';
import { join } from 'node:path';
let browsers: Browser[];
let bundle: string;
beforeAll(async () => {
  browsers = await Promise.all([chromium.launch(), webkit.launch()]);
  bundle = (await build({entryPoints:[join(import.meta.dirname,'../DS1/0-face/fault-lines.ts')],bundle:true,format:'iife',globalName:'FaultLines',write:false})).outputFiles[0]!.text;
});
afterAll(async () => { await Promise.all(browsers?.map(browser=>browser.close()) ?? []); });

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
