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
 await page.route('**/api/consistency/sites',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({sites:[{code:'20FLAV',name:'Flavo',url:'https://flavo.flowers/',address:'ghost-dew-rose.c9y.site',domain:'flavo.flowers'},{code:'10VNDG',name:'CPH Raft',url:'https://cphraft.c9y.site/',address:'alice-steel-blue.c9y.site'},{code:'30SDGA',name:'Søndergården',url:'https://soendergaarden.c9y.site/'}]})}));
 await page.route('**/api/consistency/sites/*/pages',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({pages:[]})}));
 // Søndergården's pages, in two languages, and their documents, for the site's own sidebar.
 const sdg=[{path:'/',lang:'da',title:'Forside',fields:1,edited:0},{path:'/om/',lang:'da',title:'Om os',fields:1,edited:0},{path:'/en/',lang:'en',title:'Home',fields:1,edited:0}];
 await page.route('**/api/consistency/sites/30SDGA/pages',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({pages:sdg})}));
 await page.route('**/api/consistency/sites/30SDGA/page?**',route=>{const path=new URL(route.request().url()).searchParams.get('path');route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({path,lang:path==='/en/'?'en':'da',title:'Søndergården',fields:[]})});});
 await page.route('**/api/consistency/sites/30SDGA/document?**',route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Søndergården</title><h1>Hej</h1>'}));
 // The sites' places: Søndergården names one the app has an element for and one it has not; the others none.
 let slowPlaces=false;
 await page.route('**/api/consistency/sites/*/places',async route=>{const code=new URL(route.request().url()).pathname.split('/')[4];if(code==='30SDGA'&&slowPlaces)await new Promise(resolve=>setTimeout(resolve,1500));await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({places:code==='30SDGA'?[{id:'pages',label:'Pages'},{id:'made-up',label:'Made up'}]:[]})});});
 let renamed=null;await page.route('**/api/consistency/profile',async route=>{if(route.request().method()==='PUT'){renamed=route.request().postDataJSON().companyName;await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({companyName:renamed})});}else await route.fallback();});
 const home=`http://127.0.0.1:${server.address().port}/private-consistency/home.html`;
 await page.goto(home);await page.locator('consistency-home ds-card').first().waitFor();
 if(await page.getByRole('button',{name:/^(New|Grid|List)$/}).count())throw Error('Sites still has New or the view switch');
 if(await page.locator('consistency-home .home-title[text="Sites"]').count()!==1)throw Error('The page is not titled Sites');
 await page.getByRole('button',{name:'Workspace: 0001'}).waitFor();
 if(await page.locator('consistency-home .home-workspace-name ds-avatar').getAttribute('initial')!=='1')throw Error('The workspace avatar is not 1');
 await page.getByRole('button',{name:'Notifications',exact:true}).waitFor();
 if(await page.locator('consistency-home ds-sidebar').getByText('Projects',{exact:true}).count())throw Error('Projects is still in the sidebar');
 if(process.env.HOME_SHOT)await page.locator('consistency-home nav.home-nav').screenshot({path:process.env.HOME_SHOT});
 // A connected domain after a globe; otherwise the built-in colour address, never a named c9y.site host.
 const labels=await page.locator('consistency-home ds-card [slot="label"]').evaluateAll(spans=>spans.map(span=>(span.querySelector('ds-icon[type="globe"]')?'globe ':'')+span.textContent.trim()));
 if(labels.join()!=='globe flavo.flowers,alice-steel-blue.c9y.site,soendergaarden.c9y.site')throw Error('The cards label their sites '+labels.join());
 const cards=await page.locator('consistency-home ds-card').evaluateAll(cards=>cards.map(card=>card.dataset.site+':'+(card.getAttribute('href')??'')));
 if(cards.join()!=='20FLAV:,10VNDG:,30SDGA:')throw Error('Sites: '+cards.join());
 // The address is the app's and nothing more: a site opens here, by its code, and the address does not change.
 const same=()=>{if(page.url()!==home)throw Error('The address changed: '+page.url());};
 await page.locator('consistency-home ds-card',{hasText:'CPH Raft'}).click();await page.locator('consistency-home consistency-site-editor:not([hidden])').waitFor();same();
 // Back goes to the sites, Forward to the site again.
 await page.goBack();await page.locator('consistency-home ds-card').first().waitFor();same();await page.goForward();await page.locator('consistency-home consistency-site-editor:not([hidden])').waitFor();same();
 await page.evaluate(()=>{document.querySelector('consistency-site-editor').dataset.first='yes';});
 const allSites=async()=>{await page.locator('#home-site').hover();await page.locator('consistency-home ds-select[aria-label="Sites"] ds-button[menu-item]',{hasText:'All sites'}).click();await page.locator('consistency-home ds-card').first().waitFor();await page.mouse.move(700,500);};
 await allSites();
 if(await page.locator('consistency-home consistency-site-editor[hidden]').count()!==1)throw Error('Leaving a site took its editor out of the page');
 await page.locator('consistency-home ds-card',{hasText:'CPH Raft'}).click();
 await page.locator('consistency-home consistency-site-editor:not([hidden])').waitFor({timeout:2000});{const seen=await page.locator('consistency-home consistency-site-editor').evaluateAll(list=>list.map(e=>[e.dataset.first,e.hidden,e.isConnected]));if(seen.length!==1||seen[0][0]!=='yes'||seen[0][1])throw Error('Going back to a site made a new editor: '+JSON.stringify(seen));}
 if(await page.locator('consistency-home .home-title').count())throw Error('An open site still shows the page title');
 await allSites();
 if(await page.locator('consistency-home ds-sidebar').getByText('Sites',{exact:true}).count())throw Error('Sites is still in the sidebar');
 if(await page.locator('consistency-home ds-sidebar').count())throw Error('The sidebar still has rows of places');
 for(const width of [300,390,768,1440]){await page.setViewportSize({width,height:800});await page.waitForTimeout(100);if(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth))throw Error(`Home overflows at ${width}`);}
 await page.setViewportSize({width:1440,height:800});
 await page.locator('#home-workspace').hover();const menu=page.locator('consistency-home ds-select[aria-label="Workspace"]');if((await menu.locator('ds-button[menu-item]').allInnerTexts()).map(t=>t.trim()).join()!=='Settings'||await menu.locator('ds-avatar, hr').count())throw Error('The workspace menu holds more than Settings');await page.locator('consistency-home ds-select[aria-label="Workspace"] ds-button[menu-item]',{hasText:'Settings'}).click();await page.locator('consistency-home consistency-domains').waitFor();same();await page.locator('#home-workspace').click();await page.locator('consistency-home ds-card').first().waitFor();if(await page.locator('consistency-home .home-title[text="Sites"]').count()!==1)throw Error('Pressing the workspace does not show Sites');await page.mouse.move(700,500);await page.locator('#home-workspace').hover();await page.locator('consistency-home ds-select[aria-label="Workspace"] ds-button[menu-item]',{hasText:'Settings'}).click();await page.locator('consistency-home consistency-domains').waitFor();same();
 await page.locator('consistency-home consistency-domains').waitFor();
 if(await page.locator('consistency-home .home-title[text="Settings"]').count()!==1)throw Error('The page is not titled Settings');
 const tabs=await page.locator('consistency-home ds-tabs[aria-label="Settings"] [role="tab"]').evaluateAll(tabs=>tabs.map(tab=>tab.textContent.trim()+':'+tab.getAttribute('aria-selected')));
 if(tabs.join()!=='Domains:true,Account:false')throw Error('Tabs: '+tabs.join());
 await page.getByRole('tab',{name:'Account'}).click();await page.locator('consistency-home .home-account').waitFor();same();
 if(await page.locator('consistency-home ds-input.home-workspace-field input').inputValue()!=='0001')throw Error('Account does not show the workspace');
 await page.reload();await page.locator('consistency-home .home-account').waitFor();
 for(const width of [300,390,768,1440]){await page.setViewportSize({width,height:800});await page.waitForTimeout(100);if(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth))throw Error(`Settings overflows at ${width}`);}
 await page.setViewportSize({width:1440,height:800});
 // A site's /edit opens the app on that site once, ?open=CODE, and the address is the app's again at once.
 await page.goto(home+'?open=30SDGA');await page.locator('consistency-home consistency-site-editor:not([hidden])').waitFor();same();
 // An open site's sidebar is the site's: its name at the top, not the workspace, and no rows of its pages.
 await page.getByRole('button',{name:'Site: Søndergården'}).waitFor();
 if(await page.locator('#home-workspace').count())throw Error('The workspace stays in the sidebar of an open site');
 const editor=page.locator('consistency-home consistency-site-editor:not([hidden])');await editor.locator('iframe').waitFor({state:'attached'});
 if(await editor.locator('.consistency-site-bar, ds-select select').count()||await editor.getByText('Open the page').count()||await editor.getByText(/Words save/).count())throw Error('A bar still stands over the site');
 await page.waitForTimeout(200);
 for(const words of ['Forside','Om os','English'])if(await page.locator('consistency-home nav.home-nav').getByText(words,{exact:true}).count())throw Error('The sidebar still lists the site\'s pages: '+words);
 // No place the app has no element for is shown: with none registered, there is no list at all.
 if(await page.locator('consistency-home ds-sidebar').count())throw Error('Places the app cannot show are listed');
 // A place the app has an element for is listed under the name, in the site's words; one it has not is left out.
 await page.evaluate(()=>{const home=document.querySelector('consistency-home');home.constructor.places.set('pages',site=>Object.assign(document.createElement('div'),{className:'test-place',textContent:'Pages of '+site.name}));home.requestUpdate();});
 const places=page.locator('consistency-home ds-sidebar.home-places');await places.getByText('Pages',{exact:true}).waitFor();
 if(await places.getByText('Made up').count())throw Error('A place the app has no element for is listed');
 await places.getByText('Pages',{exact:true}).click();await page.locator('consistency-home .home-stage .test-place:not([hidden])').waitFor();same();
 if(await page.locator('consistency-home consistency-site-editor:not([hidden])').count())throw Error('The site\'s canvas still shows beside a place');
 if(await page.locator('consistency-home consistency-site-editor').count()!==1)throw Error('Showing a place took the site\'s canvas out of the page');
 if(await page.evaluate(()=>history.state?.place)!=='pages')throw Error('The place is not kept in the history');
 // Pressing the site's name shows the site itself again; the place stays, hidden.
 await page.locator('#home-site').click();await page.locator('consistency-home consistency-site-editor:not([hidden])').waitFor();same();
 if(await page.locator('consistency-home .home-stage .test-place[hidden]').count()!==1)throw Error('Leaving a place took it out of the page');
 await page.goBack();await page.locator('consistency-home .home-stage .test-place:not([hidden])').waitFor();await page.goForward();await page.locator('consistency-home consistency-site-editor:not([hidden])').waitFor();
 if(!(await page.evaluate(()=>localStorage.getItem('consistency-site-places:30SDGA')))?.includes('"pages"'))throw Error('The site\'s places are not kept for the next visit');
 // The next visit draws the places at once from the last, before the platform answers again.
 slowPlaces=true;await page.reload();await page.evaluate(()=>{const home=document.querySelector('consistency-home');home.constructor.places.set('pages',()=>document.createElement('div'));home.requestUpdate();});
 await page.locator('consistency-home ds-sidebar.home-places').getByText('Pages',{exact:true}).waitFor({timeout:500});slowPlaces=false;
 await page.mouse.move(700,500);
 await page.locator('#home-site').hover();const sitesMenu=page.locator('consistency-home ds-select[aria-label="Sites"]');
 if((await sitesMenu.locator('ds-button[menu-item]').allInnerTexts()).map(t=>t.trim()).join()!=='Flavo,CPH Raft,All sites')throw Error('The site menu is not the other sites and All sites');
 await sitesMenu.locator('ds-button[menu-item]',{hasText:'CPH Raft'}).click();await page.getByRole('button',{name:'Site: CPH Raft'}).waitFor();same();
 if(await page.locator('consistency-home ds-sidebar').count())throw Error('A site without places lists some');
 await page.mouse.move(700,500);await allSites();
 if(await page.locator('consistency-home .home-title[text="Sites"]').count()!==1)throw Error('All sites does not show Sites');
 // The workspace is renamed where it is shown, in Account.
 await page.evaluate(()=>document.querySelector('consistency-home').go({page:'settings',tab:'account'}));
 const field=page.locator('consistency-home ds-input.home-workspace-field input');await field.waitFor();await field.fill('0001 labs');await field.press('Enter');
 await page.getByRole('button',{name:'Workspace: 0001 labs'}).waitFor();if(renamed!=='0001 labs')throw Error('The workspace name was not saved');
 // An older address still opens its place and is taken off.
 await page.goto(home+'#settings/account');await page.locator('consistency-home .home-account').waitFor();same();await page.getByRole('button',{name:'Sign out',exact:true}).click();await page.waitForURL('**/app/signin');
 if(!signedOut)throw Error('Sign out did not end the session');
 console.log('Home workspace header, an open site\'s own sidebar of places with no bar over the site, renaming the workspace, Sites as cards only, Settings with Domains and Account tabs, sign out and viewports passed');
} finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
