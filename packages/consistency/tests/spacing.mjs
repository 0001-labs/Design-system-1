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
  try { const body = await readFile(file); response.setHeader('content-type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html' })[extname(file)] ?? 'application/octet-stream'); response.end(body); }
  catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true });
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}});await page.goto(`http://127.0.0.1:${server.address().port}/private-consistency/`);await page.waitForSelector('aa-editor');
 await page.locator('consistency-editor').evaluate(async e=>{const button='```c9y-button\n'+JSON.stringify({label:'New button',secondary:false})+'\n```';const card='```c9y-card\n'+JSON.stringify({label:'New card',title:'A card title',body:'Independent words.'})+'\n```';e.history.commit({text:['# Newly inserted elements',button,card,'<columns>\n<column>\n## First column\n\nFirst paragraph\n\n'+button+'\n</column>\n<column>\n## Second column\n\nSecond paragraph\n</column>\n</columns>'].join('\n\n')});e.requestUpdate();await e.updateComplete;});await page.waitForTimeout(100);
 const top=page.locator('.consistency-text-gap[aria-label="Adjust intro block gap 1"]');const nested=page.locator('.consistency-text-gap[aria-label="Adjust intro nested 1 block gap 1"]');await top.waitFor();await nested.waitFor();
 const original=Number(await top.getAttribute('aria-valuenow'));await top.focus();await page.keyboard.press('ArrowUp');await page.waitForTimeout(100);if(Number(await top.getAttribute('aria-valuenow'))!==original+20)throw Error('Inserted component gap did not edit');
 const beforeNested=Number(await nested.getAttribute('aria-valuenow'));await nested.focus();await page.keyboard.press('ArrowUp');await page.waitForTimeout(100);if(Number(await nested.getAttribute('aria-valuenow'))!==beforeNested+20)throw Error('Nested block gap did not edit');if(Number(await top.getAttribute('aria-valuenow'))!==original+20)throw Error('Nested gap changed another gap');
 await nested.focus();await page.keyboard.press('Home');await page.waitForTimeout(50);
 console.log('Spacing: inserted button/card boundaries and independent nested column block gaps passed');
 await page.locator('select[aria-label="Example page"]').selectOption('shop');await page.waitForTimeout(100);await page.waitForFunction(()=>[...document.querySelectorAll('.consistency-sheet img')].some(image=>image.complete&&image.naturalWidth>0));
 const images=await page.locator('.consistency-sheet .aa-block:has(>.aa-atom[data-atom="image"])').evaluateAll(blocks=>blocks.map(block=>{const atom=block.querySelector('.aa-atom'),image=atom.querySelector('img');return{block:block.getBoundingClientRect().width,atom:atom.getBoundingClientRect().width,image:image.getBoundingClientRect().width}}));if(images.some(box=>box.block>box.atom+1||box.atom>box.image+1))throw Error(`Picture row does not hug its image: ${JSON.stringify(images)}`);
 console.log('Images: portrait/landscape wrappers hug their picture and caption instead of unused row width');
 await page.locator('select[aria-label="Example page"]').selectOption('bike');await page.waitForTimeout(100);
 const columns=page.locator('aa-editor[data-editor-key="bikes"] .aa-columns').first();const gap=page.locator('[aria-label="Adjust bikes column gap 1.1"]');await gap.scrollIntoViewIfNeeded();
 const separation=()=>columns.locator('ds-card').evaluateAll(cards=>{const a=cards[0].getBoundingClientRect(),b=cards[1].getBoundingClientRect();return{horizontal:b.left-a.right,vertical:b.top-a.bottom};});
 let distance=await separation();const initial=Number(await gap.getAttribute('aria-valuenow'));if(Math.abs(distance.horizontal-initial)>1)throw Error(`Unit tracks add unexplained space: ${JSON.stringify(distance)}`);
 let box=await gap.boundingBox(),x=box.x+box.width/2,y=box.y+box.height/2;await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+20,y,{steps:5});await page.waitForTimeout(50);let live=await gap.boundingBox();if(Math.abs(live.x+live.width/2-x-20)>1)throw Error('Column gap midpoint did not follow pointer');await page.mouse.up();await page.waitForTimeout(220);distance=await separation();if(Math.abs(distance.horizontal-initial-40)>1)throw Error('Horizontal card gap did not commit');
 await page.mouse.move(1100,5);await page.waitForTimeout(150);if(Number(await gap.locator('.ghost-measure').evaluate(e=>getComputedStyle(e).opacity))!==0)throw Error('Column gap hover label stayed visible');
 await page.locator('.consistency-sheet').focus();await page.keyboard.press('Meta+z');await page.waitForTimeout(80);if(Math.abs((await separation()).horizontal-initial)>1)throw Error('Column gap undo failed');
 await gap.focus();await page.keyboard.press('Home');await page.waitForTimeout(80);if(Math.abs((await separation()).horizontal)>1||Number(await gap.getAttribute('aria-valuenow'))!==0)throw Error('Zero column gap failed');await page.locator('.consistency-sheet').focus();await page.keyboard.press('Meta+z');
 await gap.scrollIntoViewIfNeeded();box=await gap.boundingBox();x=box.x+box.width/2;y=box.y+box.height/2;await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(Math.min(1400,x+900),y,{steps:8});await page.waitForTimeout(40);if(await gap.getAttribute('aria-orientation')!=='horizontal')throw Error('Horizontal gap changed axis during constrained drag');await page.keyboard.press('Escape');await page.mouse.up();await page.waitForTimeout(60);
 await page.locator('consistency-editor').evaluate(async e=>{e.history.commit({gaps:{...e.history.value.gaps,'columns:bikes:0:0':1000}});e.requestUpdate();await e.updateComplete;});await page.waitForTimeout(80);if(await gap.getAttribute('aria-orientation')!=='vertical'||Math.abs((await separation()).vertical-1000)>1)throw Error('Large manual column gap did not stack readably');await page.locator('.consistency-sheet').focus();await page.keyboard.press('Meta+z');await page.waitForTimeout(80);
 await page.getByRole('button',{name:'Mobile preview',exact:true}).click();await page.setViewportSize({width:390,height:1000});await page.waitForTimeout(120);if(await gap.getAttribute('aria-orientation')!=='vertical')throw Error('Phone column gap did not reflow vertically');await gap.focus();await page.keyboard.press('ArrowUp');await page.waitForTimeout(80);distance=await separation();if(Math.abs(distance.vertical-initial-20)>1)throw Error(`Stacked card gap mismatches visible gap: ${JSON.stringify(distance)}`);
 await page.getByRole('button',{name:'Desktop preview',exact:true}).click();await page.setViewportSize({width:1440,height:1000});
 await page.locator('consistency-editor').evaluate(async e=>{const b=label=>'```c9y-button\n'+JSON.stringify({label,secondary:false})+'\n```';e.history.commit({sections:{...e.history.value.sections,bikes:'<columns>\n<column>\n'+b('One')+'\n</column>\n<column>\n'+b('Two')+'\n</column>\n</columns>'}});e.requestUpdate();await e.updateComplete;});await page.waitForTimeout(100);
 const buttons=await columns.locator('.aa-column').evaluateAll(nodes=>nodes.map(column=>({column:column.getBoundingClientRect().width,button:column.querySelector('ds-button').getBoundingClientRect().width})));if(buttons.some(size=>size.column>size.button+1||size.column>=200))throw Error(`Button units did not hug: ${JSON.stringify(buttons)}`);
 console.log('Column spacing: Bike cards follow horizontal drag, undo, zero, quiet hover, phone vertical reflow and small button tracks passed');
 await page.locator('select[aria-label="Example page"]').selectOption('studio');
 for(const production of [true,false]){
  await page.locator('consistency-editor').evaluate(async(e,production)=>{e.layers={...e.layers,production};e.selection=new Set(['text:intro:1','bookshop']);e.marquee={left:20,top:20,right:100,bottom:100};e.requestUpdate();await e.updateComplete;e.querySelector('aa-editor[data-editor-key="intro"]>.aa-block:nth-child(2)').setAttribute('data-selected','');},production);
  const feedback=await page.locator('consistency-editor').evaluate(e=>{
   const paragraph=e.querySelector('aa-editor[data-editor-key="intro"]>.aa-block:nth-child(2)'),card=e.querySelector('[data-selectable="bookshop"]'),marquee=e.querySelector('.consistency-marquee');
   const grey=color=>{const canvas=document.createElement('canvas');canvas.width=1;canvas.height=1;const context=canvas.getContext('2d');context.fillStyle=color;context.fillRect(0,0,1,1);const [r,g,b,a]=context.getImageData(0,0,1,1).data;return a>0&&Math.abs(r-g)<3&&Math.abs(g-b)<3;};
   return{outlines:[paragraph,card].map(node=>getComputedStyle(node).outlineStyle),marqueeOutline:getComputedStyle(marquee).borderStyle,greyMarquee:grey(getComputedStyle(marquee).backgroundColor),greyCard:grey(getComputedStyle(card,'::after').backgroundColor)};
  });
  if(feedback.outlines.some(outline=>outline!=='none')||feedback.marqueeOutline!=='none'||!feedback.greyMarquee||!feedback.greyCard)throw Error(`Selection feedback production=${production}: ${JSON.stringify(feedback)}`);
 }
 console.log('Selection: native Aa and composition selections have no yellow outline, with grey borderless marquee in both modes');await page.close();
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
