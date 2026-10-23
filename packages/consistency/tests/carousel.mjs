/** Local-only rendered carousel contract. Build first; no accounts or production writes. */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname } from 'node:path';
import { chromium } from 'playwright';
const root = fileURLToPath(new URL('../../../website/dist/', import.meta.url));
const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+c7S8AAAAASUVORK5CYII=', 'base64');
const server = createServer(async (request, response) => {
 const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
 if (/^\/(one|two)\.png$/.test(pathname)) { response.setHeader('content-type', 'image/png'); response.end(pixel); return; }
 const file = resolve(root, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
 if (!file.startsWith(root)) { response.writeHead(403).end(); return; }
 try { const body = await readFile(file); response.setHeader('content-type', ({ '.js':'text/javascript','.css':'text/css','.html':'text/html' })[extname(file)] ?? 'application/octet-stream'); response.end(body); }
 catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true });
try {
 const base = `http://127.0.0.1:${server.address().port}`;
 const page = await browser.newPage({ viewport:{ width:1440,height:1000 } });
 const failures=[]; page.on('pageerror',error=>failures.push(error.message));
 await page.goto(base+'/private-consistency/'); await page.waitForSelector('aa-editor[data-editor-key="intro"]');
 await page.locator('consistency-editor').evaluate(async element=>{element.history.commit({text:''});element.requestUpdate();await element.updateComplete;});
 const text = page.locator('aa-editor[data-editor-key="intro"]>.aa-block').first(); await text.click(); await page.keyboard.type('/carousel');
 const choice = page.locator('.aa-menu button').filter({hasText:'Carousel'}).first(); await choice.waitFor(); await choice.click();
 await page.locator('.consistency-carousel-frame').waitFor();
 const source=()=>page.locator('aa-editor[data-editor-key="intro"]').evaluate(host=>host.editor.value);
 const model=async()=>JSON.parse((await source()).match(/```c9y-carousel\n([^]*?)\n```/)[1]);
 if((await model()).slides.length!==0||await page.locator('.consistency-carousel-frame img').count())throw Error('Carousel did not insert empty');
 const tools=page.locator('.consistency-carousel-tools');
 const add=async(name)=>{await page.locator('.consistency-content-carousel').hover();await tools.locator('ds-input[aria-label="Image address"] input').fill(base+'/'+name+'.png');await tools.getByRole('button',{name:'Add address',exact:true}).click();await page.waitForTimeout(60);};
 await page.locator('.consistency-content-carousel').hover();
 const addressInput=tools.locator('ds-input[aria-label="Image address"] input');await addressInput.focus();
 if(!await addressInput.evaluate(el=>el===el.getRootNode().activeElement))throw Error('Carousel input was not focused before dismissal');
 const beforeDismiss=await source();
 await page.locator('body').dispatchEvent('pointerdown');
 if(await tools.evaluate(el=>getComputedStyle(el).visibility)!=='hidden')throw Error('Outside press retained focused carousel toolbar');
 if(await source()!==beforeDismiss)throw Error('Toolbar dismissal changed source');
 await page.mouse.move(0,0);await page.locator('.consistency-content-carousel').hover();
 if(await tools.evaluate(el=>getComputedStyle(el).visibility)!=='visible')throw Error('Fresh pointer entry did not restore toolbar');
 await add('one');await add('two');
 if((await model()).slides.length!==2)throw Error('Images did not persist');
 await page.locator('.consistency-content-carousel').hover();await tools.getByRole('button',{name:'Previous',exact:true}).click();
 if((await page.locator('ds-carousel').evaluate(face=>face.current))!==0)throw Error('Previous did not select image');
 await tools.getByRole('button',{name:'Next',exact:true}).click();
 const alt=tools.locator('ds-input[aria-label="Image description"] input');await alt.fill('Second image description');await alt.press('Tab');await page.waitForTimeout(50);
 if((await model()).slides[1].alt!=='Second image description')throw Error('Image description not persisted');
 await page.locator('.consistency-content-carousel').hover();await tools.getByRole('button',{name:'Move left',exact:true}).click();await page.waitForTimeout(50);
 if((await model()).slides[0].alt!=='Second image description')throw Error('Slide order not persisted');
 const frame=page.locator('.consistency-carousel-frame');await frame.scrollIntoViewIfNeeded();
 const box=await frame.boundingBox();const corner=frame.locator('[aria-label="Carousel size"]');await corner.waitFor();
 const grip=await corner.boundingBox();await page.mouse.move(grip.x+grip.width/2,grip.y+grip.height/2);await page.mouse.down();await page.mouse.move(grip.x+grip.width/2-77,grip.y+grip.height/2+33,{steps:12});await page.mouse.up();await page.waitForTimeout(300);
 const resized=await model();const actual=await frame.boundingBox();
 if(!resized.width||resized.width%20||resized.height%20||resized.width>=box.width||resized.height<=box.height)throw Error('Diagonal resize did not snap and persist: '+JSON.stringify({box,resized,actual}));
 if(Math.abs(actual.width-resized.width)>1||Math.abs(actual.height-resized.height)>1)throw Error('Persisted carousel size does not match rendered box');
 await page.locator('.consistency-sheet').focus();await page.keyboard.press('Meta+z');await page.waitForTimeout(100);
 if((await model()).width!==undefined||(await model()).height!==280)throw Error('Undo did not restore carousel dimensions');
 await page.keyboard.press('Meta+Shift+z');await page.waitForTimeout(100);if((await model()).width!==resized.width)throw Error('Redo did not restore carousel dimensions');
 await page.locator('.consistency-content-carousel').hover();
 await tools.locator('select[aria-label="Image fit"]').selectOption('contain');await page.waitForTimeout(60);
 if((await model()).slides[(await model()).current].fit!=='contain')throw Error('Image fit did not persist');
 await tools.locator('input[type="file"]').setInputFiles({name:'local-image.png',mimeType:'image/png',buffer:pixel});await page.waitForTimeout(100);
 const uploaded=await model();if(uploaded.slides.length!==3||!uploaded.slides[2].src.startsWith('data:image/png;base64,'))throw Error('Local image upload did not persist in draft');
 await page.locator('.consistency-content-carousel').hover();await tools.getByRole('button',{name:'Remove image',exact:true}).click();await page.waitForTimeout(60);
 if((await model()).slides.length!==2)throw Error('Image removal did not persist');
 await page.locator('.consistency-sheet').focus();await page.keyboard.press('Meta+z');await page.waitForTimeout(80);if((await model()).slides.length!==3)throw Error('Undo did not restore removed image');
 await page.setViewportSize({width:390,height:850});await page.waitForTimeout(100);
 const geometry=await page.evaluate(()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth,frame:document.querySelector('.consistency-carousel-frame').getBoundingClientRect().width,block:document.querySelector('.consistency-content-carousel').getBoundingClientRect().width}));
 if(geometry.scroll>geometry.viewport||geometry.frame>geometry.block+1)throw Error('Carousel caused phone overflow: '+JSON.stringify(geometry));
 if(failures.length)throw Error('Browser errors: '+failures.join('; '));
 console.log('Carousel: empty slash insertion → two local fixture images → navigation → alt edit → reorder → diagonal raw resize/grid release → undo/redo → image fit/upload/removal undo → phone containment passed');
 await page.close();
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
