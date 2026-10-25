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
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 let signedOut=false;await page.route('**/api/dashboard/session',async route=>{signedOut=route.request().method()==='DELETE';await route.fulfill({status:204});});
 await page.route('**/app/signin',route=>route.fulfill({status:200,contentType:'text/html',body:'signed out'}));
 await page.route('**/api/consistency/profile',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({companyName:'0001'})}));
 await page.route('**/api/consistency/sites',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({sites:[{id:'flavo',name:'Flavo',url:'https://flavo.c9y.site/team/'},{id:'cph-raft',name:'CPH Raft',url:'https://cphraft.c9y.site/team/'},{id:'soendergaarden',name:'Søndergården',url:'https://soendergaarden.c9y.site/team/'}]})}));
 await page.route('**/api/consistency/sites/*/pages',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({pages:[]})}));
 await page.goto(`http://127.0.0.1:${server.address().port}/private-consistency/home.html`);await page.locator('consistency-home ds-card').first().waitFor();
 if(await page.getByRole('button',{name:/^(New|Grid|List)$/}).count())throw Error('Sites still has New or the view switch');
 if(await page.locator('consistency-home .home-title[text="Sites"]').count()!==1)throw Error('The page is not titled Sites');
 await page.getByRole('link',{name:'Workspace: 0001'}).waitFor();
 if(await page.locator('consistency-home .home-workspace-name ds-avatar').getAttribute('initial')!=='1')throw Error('The workspace avatar is not 1');
 await page.getByRole('button',{name:'Notifications',exact:true}).waitFor();
 if(await page.locator('consistency-home ds-sidebar').getByText('Projects',{exact:true}).count())throw Error('Projects is still in the sidebar');
 if(process.env.HOME_SHOT)await page.locator('consistency-home nav.home-nav').screenshot({path:process.env.HOME_SHOT});
 const cards=await page.locator('consistency-home ds-card').evaluateAll(cards=>cards.map(card=>card.getAttribute('href')));
 if(cards.join()!=='#sites/flavo,#sites/cph-raft,#sites/soendergaarden')throw Error('Projects: '+cards.join());
 // A site opens here, in the editor, and stays open while hidden: going back to it is the same editor, at once.
 await page.locator('consistency-home ds-card',{hasText:'CPH Raft'}).click();await page.waitForURL('**#sites/cph-raft');await page.locator('consistency-home consistency-site-editor:not([hidden])').waitFor();
 await page.evaluate(()=>{document.querySelector('consistency-site-editor').dataset.first='yes';});
 await page.locator('#home-workspace').click();await page.locator('consistency-home ds-card').first().waitFor();
 if(await page.locator('consistency-home consistency-site-editor[hidden]').count()!==1)throw Error('Leaving a site took its editor out of the page');
 await page.locator('consistency-home ds-card',{hasText:'CPH Raft'}).click();await page.waitForURL('**#sites/cph-raft');
 await page.locator('consistency-home consistency-site-editor:not([hidden])').waitFor({timeout:2000});{const seen=await page.locator('consistency-home consistency-site-editor').evaluateAll(list=>list.map(e=>[e.dataset.first,e.hidden,e.isConnected]));if(seen.length!==1||seen[0][0]!=='yes'||seen[0][1])throw Error('Going back to a site made a new editor: '+JSON.stringify(seen));}
 if(await page.locator('consistency-home .home-title').count())throw Error('An open site still shows the page title');
 await page.locator('#home-workspace').click();await page.locator('consistency-home ds-card').first().waitFor();
 if(await page.locator('consistency-home ds-sidebar').getByText('Sites',{exact:true}).count())throw Error('Sites is still in the sidebar');
 if(await page.locator('consistency-home ds-sidebar').count())throw Error('The sidebar still has rows of places');
 for(const width of [300,390,768,1440]){await page.setViewportSize({width,height:800});await page.waitForTimeout(100);if(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth))throw Error(`Home overflows at ${width}`);}
 await page.setViewportSize({width:1440,height:800});
 await page.locator('#home-workspace').hover();const menu=page.locator('consistency-home ds-select[aria-label="Workspace"]');if((await menu.locator('ds-button[menu-item]').allInnerTexts()).map(t=>t.trim()).join()!=='Settings'||await menu.locator('ds-avatar, hr').count())throw Error('The workspace menu holds more than Settings');await page.locator('consistency-home ds-select[aria-label="Workspace"] ds-button[menu-item]',{hasText:'Settings'}).click();await page.waitForURL('**#settings/domains');await page.locator('#home-workspace').click();await page.locator('consistency-home ds-card').first().waitFor();if(await page.locator('consistency-home .home-title[text="Sites"]').count()!==1)throw Error('Pressing the workspace does not show Sites');await page.mouse.move(700,500);await page.locator('#home-workspace').hover();await page.locator('consistency-home ds-select[aria-label="Workspace"] ds-button[menu-item]',{hasText:'Settings'}).click();await page.waitForURL('**#settings/domains');
 await page.locator('consistency-home consistency-domains').waitFor();
 if(await page.locator('consistency-home .home-title[text="Settings"]').count()!==1)throw Error('The page is not titled Settings');
 const tabs=await page.locator('consistency-home ds-tabs[aria-label="Settings"] [role="tab"]').evaluateAll(tabs=>tabs.map(tab=>tab.textContent.trim()+':'+tab.getAttribute('aria-selected')));
 if(tabs.join()!=='Domains:true,Account:false')throw Error('Tabs: '+tabs.join());
 await page.getByRole('tab',{name:'Account'}).click();await page.waitForURL('**#settings/account');
 if(!(await page.locator('consistency-home .home-account').innerText()).includes('0001'))throw Error('Account does not show the workspace');
 await page.reload();await page.locator('consistency-home .home-account').waitFor();
 for(const width of [300,390,768,1440]){await page.setViewportSize({width,height:800});await page.waitForTimeout(100);if(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth))throw Error(`Settings overflows at ${width}`);}
 await page.setViewportSize({width:1440,height:800});
 await page.goto(page.url().replace(/#.*$/,''));await page.locator('consistency-home ds-card').first().waitFor();
 await page.goto(page.url().replace(/#.*$/,'')+'#settings/account');await page.reload();await page.getByRole('button',{name:'Sign out',exact:true}).click();await page.waitForURL('**/app/signin');
 if(!signedOut)throw Error('Sign out did not end the session');
 console.log('Home workspace header, Sites as cards only, Settings with Domains and Account tabs, sign out and viewports passed');
} finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
