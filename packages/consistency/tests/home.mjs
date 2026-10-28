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
 // Two workspaces: 0001, the owner's own with three sites, and a client's, Raft & Co, with one.
 const limits={sites:2,customDomains:false};
 const workspaces=[{code:'01STDO',name:'0001',plan:'free',role:'owner',sites:3,siteCodes:['10VNDG','20FLAV','30SDGA'],limits},{code:'02RAFT',name:'Raft & Co',plan:'free',role:'owner',sites:1,siteCodes:['40RAFT'],limits}];
 // The platform's answers to the workspaces and the sites can be made to fail: 401 for a session that ended, 503 for a platform away.
 let workspacesStatus=200,sitesStatus=200;
 await page.route('**/api/consistency/workspaces',route=>route.fulfill(workspacesStatus===200?{status:200,contentType:'application/json',body:JSON.stringify({owner:true,workspaces})}:{status:workspacesStatus}));
 const workspaceSites={'01STDO':[{code:'20FLAV',name:'Flavo',url:'https://flavo.flowers/',address:'ghost-dew-rose.c9y.site',domain:'flavo.flowers'},{code:'10VNDG',name:'CPH Raft',url:'https://cphraft.c9y.site/',address:'alice-steel-blue.c9y.site'},{code:'30SDGA',name:'Søndergården',url:'https://soendergaarden.c9y.site/'}],'02RAFT':[{code:'40RAFT',name:'Raft',url:'https://amber-rose-teal.c9y.site/',address:'amber-rose-teal.c9y.site'}]};
 const asked=[];
 await page.route('**/api/consistency/sites',route=>{const workspace=route.request().headers()['x-c9y-workspace'];asked.push(workspace);route.fulfill(sitesStatus===200?{status:200,contentType:'application/json',body:JSON.stringify({workspace,sites:workspaceSites[workspace]??[]})}:{status:sitesStatus});});
 await page.route('**/api/consistency/sites/*/pages',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({pages:[]})}));
 await page.route('**/api/consistency/sites/*/api/composition?**',route=>route.fulfill({json:{path:new URL(route.request().url()).searchParams.get('path'),build:'site-build',base:'page-source',revision:0,document:{schema:1,nodes:{},order:{}},nodes:[]}}));
 await page.route('**/api/consistency/sites/*/api/native-page?**',route=>route.fulfill({json:{kind:'native',path:new URL(route.request().url()).searchParams.get('path'),build:'site-build',base:'page-source',revision:0,images:[],collections:{},document:{schema:1,kind:'native-page',title:'Søndergården',lang:'da',layout:{maxWidth:1200,padding:20,gap:20},blocks:[]},canvas:'<!doctype html><html data-c9y-native-base="page-source"><head><title>Søndergården</title></head><body><main data-c9y-native-root></main></body></html>'}}));
 // Søndergården's pages, in two languages, and their documents, for the site's own sidebar.
 const sdg=[{path:'/',lang:'da',title:'Forside',fields:1,edited:0},{path:'/om/',lang:'da',title:'Om os',fields:1,edited:0},{path:'/en/',lang:'en',title:'Home',fields:1,edited:0}];
 await page.route('**/api/consistency/sites/30SDGA/pages',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({pages:sdg})}));
 await page.route('**/api/consistency/sites/30SDGA/page?**',route=>{const path=new URL(route.request().url()).searchParams.get('path');route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({path,lang:path==='/en/'?'en':'da',title:'Søndergården',fields:[]})});});
 await page.route('**/api/consistency/sites/30SDGA/document?**',route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Søndergården</title><h1>Hej</h1>'}));
 // The sites' places: Søndergården names one the app has an element for and one it has not; the others none.
 let slowPlaces=false;
 await page.route('**/api/consistency/sites/*/places',async route=>{const code=new URL(route.request().url()).pathname.split('/')[4];if(code==='30SDGA'&&slowPlaces)await new Promise(resolve=>setTimeout(resolve,1500));await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({places:code==='30SDGA'?[{id:'lab',label:'Lab'},{id:'made-up',label:'Made up'}]:[]})});});
 let renamed=null;await page.route('**/api/consistency/workspaces/01STDO',async route=>{renamed=route.request().postDataJSON().name;await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({code:'01STDO',name:renamed})});});
 await page.route('**/api/consistency/workspaces/*/members',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({members:[{email:'ada@example.com',role:'admin',status:'active'}]})}));
 const home=`http://127.0.0.1:${server.address().port}/private-consistency/home.html`;
 await page.goto(home);await page.locator('consistency-home ds-card').first().waitFor();
 if(asked.some(code=>code!=='01STDO'))throw Error('Sites were asked outside the workspace: '+asked.join());
 if(await page.locator('consistency-home .home-drafts').getAttribute('text')!=='3 of 2 draft sites')throw Error('The plan\'s draft sites are not under the title');
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
 // Each card wears the workspace's people on its foot (and a plus for the owner), and a draft (no domain of its own) the draft mark before its name.
 await page.locator('consistency-home ds-card .home-site-people ds-avatar[initial="A"]').first().waitFor();
 const marks=await page.locator('consistency-home ds-card').evaluateAll(cards=>cards.map(card=>card.dataset.site+':'+[...card.querySelectorAll('.home-site-people ds-avatar')].map(avatar=>avatar.getAttribute('initial')??avatar.getAttribute('icon')).join('')+':'+(card.querySelector('[slot="title"] ds-icon[type="arrange-draft"]')?'draft':'')));
 if(marks.join()!=='20FLAV:Aplus:,10VNDG:Aplus:draft,30SDGA:Aplus:draft')throw Error('Cards: '+marks.join());
 // Pressing them opens the people panel at the side, the page still there and no site opened; Close puts it away.
 await page.locator('consistency-home ds-card[data-site="10VNDG"] .home-site-people').click();
 const panel=page.locator('consistency-home ds-overlay.home-people dialog[open]');await panel.locator('consistency-members ds-row',{hasText:'ada@example.com'}).waitFor();
 if(await page.locator('consistency-home consistency-site-editor:not([hidden])').count())throw Error('Pressing the people opened the site');
 if(!await panel.locator('consistency-members form.members-invite').count())throw Error('The owner cannot invite from the panel');
 if(await panel.getAttribute('aria-labelledby')!=='home-people-title'||(await page.locator('#home-people-title').innerText()).trim()!=='People in 0001')throw Error('The panel is not named for the workspace');
 if(process.env.PANEL_SHOT){await page.waitForTimeout(800);await page.screenshot({path:process.env.PANEL_SHOT});}
 await panel.getByRole('button',{name:'Close'}).click();await panel.waitFor({state:'detached'});if(page.url()!==home)throw Error('The panel changed the address');
 if(process.env.CARD_SHOT)await page.locator('consistency-home ds-card[data-site="10VNDG"]').screenshot({path:process.env.CARD_SHOT});
 const cards=await page.locator('consistency-home ds-card').evaluateAll(cards=>cards.map(card=>card.dataset.site+':'+(card.getAttribute('href')??'')));
 if(cards.join()!=='20FLAV:,10VNDG:,30SDGA:')throw Error('Sites: '+cards.join());
 // The address is the app's and nothing more: a site opens here, by its code, and the address does not change.
 const same=()=>{if(page.url()!==home)throw Error('The address changed: '+page.url());};
 await page.locator('consistency-home ds-card',{hasText:'CPH Raft'}).click();await page.locator('consistency-home consistency-site-editor:not([hidden])').waitFor();same();
 // Back goes to the sites, Forward to the site again.
 await page.goBack();await page.locator('consistency-home ds-card').first().waitFor();same();await page.goForward();await page.locator('consistency-home consistency-site-editor:not([hidden])').waitFor();same();
 await page.evaluate(()=>{document.querySelector('consistency-site-editor').dataset.first='yes';});
 // Pressing the site's name shows the workspace's sites, as pressing the workspace does.
 const allSites=async()=>{await page.locator('#home-site').click();await page.locator('consistency-home ds-card').first().waitFor();await page.mouse.move(700,500);};
 await allSites();
 if(await page.locator('consistency-home consistency-site-editor[hidden]').count()!==1)throw Error('Leaving a site took its editor out of the page');
 await page.locator('consistency-home ds-card',{hasText:'CPH Raft'}).click();
 await page.locator('consistency-home consistency-site-editor:not([hidden])').waitFor({timeout:2000});{const seen=await page.locator('consistency-home consistency-site-editor').evaluateAll(list=>list.map(e=>[e.dataset.first,e.hidden,e.isConnected]));if(seen.length!==1||seen[0][0]!=='yes'||seen[0][1])throw Error('Going back to a site made a new editor: '+JSON.stringify(seen));}
 if(await page.locator('consistency-home .home-title').count())throw Error('An open site still shows the page title');
 await allSites();
 if(await page.locator('consistency-home ds-sidebar').getByText('Sites',{exact:true}).count())throw Error('Sites is still in the sidebar');
 if(await page.locator('consistency-home ds-sidebar.home-places').count())throw Error('The sidebar still has rows of places');
 for(const width of [300,390,768,1440]){await page.setViewportSize({width,height:800});await page.waitForTimeout(100);if(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth))throw Error(`Home overflows at ${width}`);}
 await page.setViewportSize({width:1440,height:800});
 // The workspace has no menu: moving to another is Settings → Workspaces, as in Link, every workspace with its avatar and role, this one current.
 if(await page.locator('consistency-home ds-select[aria-label="Workspace"]').count())throw Error('The workspace still has a menu');
 const toWorkspace=async name=>{await page.locator('consistency-home ds-sidebar.home-foot').getByText('Settings',{exact:true}).click();await page.getByRole('tab',{name:'Workspaces'}).click();const rows=page.locator('consistency-home ds-list.home-workspaces ds-row');await rows.first().waitFor();return rows.filter({hasText:name});};
 {await toWorkspace('0001');const rows=await page.locator('consistency-home ds-list.home-workspaces ds-row').evaluateAll(rows=>rows.map(row=>row.querySelector('ds-avatar')?.getAttribute('initial')+':'+row.querySelector('.ds-row__name').textContent+':'+row.querySelector('.ds-row__value').textContent.trim()+':'+(row.getAttribute('current')??'')));
  if(rows.join()!=='1:0001:Owner:page,R:Raft & Co:Owner:')throw Error('Workspaces: '+rows.join());}
 // Switching shows the other workspace's sites alone, and back again.
 await (await toWorkspace('Raft & Co')).click();await page.getByRole('button',{name:'Workspace: Raft & Co'}).waitFor();await page.locator('consistency-home ds-card[data-site="40RAFT"]').waitFor();same();
 if(await page.locator('consistency-home ds-card').count()!==1)throw Error('Another workspace\'s sites show beside Raft & Co\'s');
 if(await page.evaluate(()=>localStorage.getItem('consistency-active-workspace'))!=='02RAFT')throw Error('The workspace chosen is not kept');
 await (await toWorkspace('0001')).click();await page.getByRole('button',{name:'Workspace: 0001'}).waitFor();await page.locator('consistency-home ds-card[data-site="10VNDG"]').waitFor();
 await page.mouse.move(700,500);await page.locator('consistency-home ds-sidebar.home-foot').getByText('Settings',{exact:true}).click();await page.locator('consistency-home consistency-domains').waitFor();same();await page.locator('#home-workspace').click();await page.locator('consistency-home ds-card').first().waitFor();if(await page.locator('consistency-home .home-title[text="Sites"]').count()!==1)throw Error('Pressing the workspace does not show Sites');await page.mouse.move(700,500);await page.locator('consistency-home ds-sidebar.home-foot').getByText('Settings',{exact:true}).click();await page.locator('consistency-home consistency-domains').waitFor();same();
 await page.locator('consistency-home consistency-domains').waitFor();
 if(await page.locator('consistency-home .home-title[text="Settings"]').count()!==1)throw Error('The page is not titled Settings');
 const tabs=await page.locator('consistency-home ds-tabs[aria-label="Settings"] [role="tab"]').evaluateAll(tabs=>tabs.map(tab=>tab.textContent.trim()+':'+tab.getAttribute('aria-selected')));
 if(tabs.join()!=='Workspaces:false,People:false,Domains:true,Account:false')throw Error('Tabs: '+tabs.join());
 await page.getByRole('tab',{name:'People'}).click();await page.locator('consistency-home consistency-members ds-row',{hasText:'ada@example.com'}).waitFor();same();
 await page.getByRole('tab',{name:'Account'}).click();await page.locator('consistency-home .home-account').waitFor();same();
 if(await page.locator('consistency-home ds-input.home-workspace-field input').inputValue()!=='0001')throw Error('Account does not show the workspace');
 await page.reload();await page.locator('consistency-home .home-account').waitFor();
 for(const width of [300,390,768,1440]){await page.setViewportSize({width,height:800});await page.waitForTimeout(100);if(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth))throw Error(`Settings overflows at ${width}`);}
 await page.setViewportSize({width:1440,height:800});
 // A site's /edit opens the app on that site once, ?open=CODE, and the address is the app's again at once.
 await page.goto(home+'?open=30SDGA');await page.locator('consistency-home consistency-site-editor:not([hidden])').waitFor();same();
 // An open site's sidebar is the site's: its name at the top, not the workspace, and no rows of its pages.
 await page.getByRole('button',{name:'Site: Søndergården'}).waitFor();
 if(await page.locator('#home-site ds-avatar[initial="S"]').count()!==1)throw Error('The site\'s name has no avatar, as the workspace\'s has');
 // The site's own address is the sidebar's first row, current while the site itself is shown.
 const rowsOf=()=>page.locator('consistency-home ds-sidebar.home-places').evaluate(bar=>[...bar.shadowRoot.querySelectorAll('[data-item]')].map(row=>row.textContent.trim()+(row.getAttribute('aria-current')?'*':'')));
 if(await page.locator('#home-workspace').count())throw Error('The workspace stays in the sidebar of an open site');
 const editor=page.locator('consistency-home consistency-site-editor:not([hidden])');await editor.locator('iframe').waitFor({state:'attached'});
 if(await editor.locator('.consistency-site-bar, ds-select select').count()||await editor.getByText('Open the page').count()||await editor.getByText(/Words save/).count())throw Error('A bar still stands over the site');
 await page.waitForTimeout(200);
 for(const words of ['Forside','Om os','English'])if(await page.locator('consistency-home nav.home-nav').getByText(words,{exact:true}).count())throw Error('The sidebar still lists the site\'s pages: '+words);
 // No place the app has no element for is shown: with neither of the site's two registered, there is no list at all.
 if((await rowsOf()).join()!=='Site*')throw Error('Places the app cannot show are listed, or Site is not first: '+(await rowsOf()).join());
 // A place the app has an element for is listed under the name, in the site's words; one it has not is left out.
 await page.evaluate(()=>{const home=document.querySelector('consistency-home');home.constructor.places.set('lab',site=>Object.assign(document.createElement('div'),{className:'test-place',textContent:'Lab of '+site.name}));home.requestUpdate();});
 const places=page.locator('consistency-home ds-sidebar.home-places');await places.getByText('Lab',{exact:true}).waitFor();
 if(await places.getByText('Made up').count())throw Error('A place the app has no element for is listed');
 await places.getByText('Lab',{exact:true}).click();await page.locator('consistency-home .home-stage .test-place:not([hidden])').waitFor();same();
 if(await page.locator('consistency-home consistency-site-editor:not([hidden])').count())throw Error('The site\'s canvas still shows beside a place');
 if((await rowsOf()).join()!=='Site,Lab*')throw Error('The place is not the current row: '+(await rowsOf()).join());
 if(await page.locator('consistency-home consistency-site-editor').count()!==1)throw Error('Showing a place took the site\'s canvas out of the page');
 if(await page.evaluate(()=>history.state?.place)!=='lab')throw Error('The place is not kept in the history');
 // Pressing the site's address shows the site itself again; the place stays, hidden.
 await places.getByText('Site',{exact:true}).click();await page.locator('consistency-home consistency-site-editor:not([hidden])').waitFor();same();
 if(await page.locator('consistency-home .home-stage .test-place[hidden]').count()!==1)throw Error('Leaving a place took it out of the page');
 await page.goBack();await page.locator('consistency-home .home-stage .test-place:not([hidden])').waitFor();await page.goForward();await page.locator('consistency-home consistency-site-editor:not([hidden])').waitFor();
 if(!(await page.evaluate(()=>localStorage.getItem('consistency-site-places:30SDGA')))?.includes('"lab"'))throw Error('The site\'s places are not kept for the next visit');
 // The next visit draws the places at once from the last, before the platform answers again.
 slowPlaces=true;await page.reload();await page.evaluate(()=>{const home=document.querySelector('consistency-home');home.constructor.places.set('lab',()=>document.createElement('div'));home.requestUpdate();});
 await page.locator('consistency-home ds-sidebar.home-places').getByText('Lab',{exact:true}).waitFor({timeout:500});slowPlaces=false;
 await page.mouse.move(700,500);
 await page.locator('#home-site').hover();const sitesMenu=page.locator('consistency-home ds-select[aria-label="Sites"]');
 if((await sitesMenu.locator('ds-button[menu-item]').allInnerTexts()).map(t=>t.trim()).join()!=='Flavo,CPH Raft')throw Error('The site menu is not the other sites');
 await sitesMenu.locator('ds-button[menu-item]',{hasText:'CPH Raft'}).click();await page.getByRole('button',{name:'Site: CPH Raft'}).waitFor();same();
 if((await rowsOf()).join()!=='Site*')throw Error('A site without places lists some: '+(await rowsOf()).join());
 await page.mouse.move(700,500);await allSites();
 if(await page.locator('consistency-home .home-title[text="Sites"]').count()!==1)throw Error('The site\'s name does not show Sites');
 // The workspace is renamed where it is shown, in Account.
 await page.evaluate(()=>document.querySelector('consistency-home').go({page:'settings',tab:'account'}));
 const field=page.locator('consistency-home ds-input.home-workspace-field input');await field.waitFor();await field.fill('0001 labs');await field.press('Enter');
 await page.getByRole('button',{name:'Workspace: 0001 labs'}).waitFor();if(renamed!=='0001 labs')throw Error('The workspace name was not saved');
 // A site of another workspace, asked for by its code, opens in that workspace.
 await page.goto(home+'?open=40RAFT');await page.getByRole('button',{name:'Site: Raft'}).waitFor();same();
 if(await page.evaluate(()=>localStorage.getItem('consistency-active-workspace'))!=='02RAFT')throw Error('Opening a site did not move to its workspace');
 // A failed read is said under the title, over the cards from the last visit, which stay: the session ended, with Sign in to the gateway's sign-in page.
 const problem=page.locator('consistency-home .home-problem');
 const problemIs=async words=>{await problem.waitFor();const seen=[await problem.getAttribute('text'),await problem.getAttribute('tone'),await problem.getAttribute('role')].join('|');if(seen!==words+'|danger|alert')throw Error('The failed read is not said under the title: '+seen);if(await page.locator('consistency-home .home-title[text="Sites"]').count()!==1)throw Error('The failed read is not under the title');if(!await page.locator('consistency-home ds-card[data-site="40RAFT"]').count())throw Error('The cards from the last visit are gone with the failed read');};
 // Going to the app's address again is a reload, which keeps where the app stood: the sites first, where the message is drawn.
 const sitesAgain=async()=>{await page.evaluate(()=>document.querySelector('consistency-home').go({page:'sites'}));await page.locator('consistency-home .home-title[text="Sites"]').waitFor();await page.reload();};
 workspacesStatus=401;await sitesAgain();await problemIs('Your session ended. Sign in again.');
 if(await problem.locator('ds-button',{hasText:'Sign in'}).getAttribute('href')!=='/app/signin')throw Error('Sign in does not go to the gateway\'s sign-in page');
 if(await problem.getByRole('button',{name:'Try again'}).count())throw Error('A session that ended offers Try again');
 // The platform away: Try again reads the workspaces again, and a read that succeeds takes the message off.
 workspacesStatus=503;await page.reload();await problemIs('Consistency could not be reached. Try again.');
 if(await problem.locator('ds-button[href]').count())throw Error('A platform away offers Sign in');
 workspacesStatus=200;await problem.getByRole('button',{name:'Try again'}).click();await problem.waitFor({state:'detached'});await page.locator('consistency-home ds-card[data-site="40RAFT"]').waitFor();
 // The sites failing on their own say the same, in the same place, and Try again takes it off the same way.
 sitesStatus=503;await page.reload();await problemIs('Consistency could not be reached. Try again.');
 sitesStatus=401;await problem.getByRole('button',{name:'Try again'}).click();await page.locator('consistency-home .home-problem[text="Your session ended. Sign in again."]').waitFor();
 sitesStatus=200;await page.reload();await page.locator('consistency-home ds-card[data-site="40RAFT"]').waitFor();await page.waitForTimeout(200);if(await problem.count())throw Error('A read that succeeded left the message standing');
 // An older address still opens its place and is taken off.
 await page.goto(home+'#settings/account');await page.locator('consistency-home .home-account').waitFor();same();await page.getByRole('button',{name:'Sign out',exact:true}).click();await page.waitForURL('**/app/signin');
 if(!signedOut)throw Error('Sign out did not end the session');
 console.log('Home workspaces: switching, each one\'s own sites and drafts, People, a site opening in its own workspace; an open site\'s own sidebar of places with no bar over the site, renaming the workspace, Sites as cards only, Settings with Workspaces, Domains and Account tabs, the site\'s address as its first row, a failed read said under the title with Sign in or Try again over the last visit\'s cards, sign out and viewports passed');
} finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
