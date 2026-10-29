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
 // People in Settings: an invite is emailed by the platform, and an invited person's menu sends it again; an active one's has only Remove.
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 await page.route('**/api/dashboard/session',route=>route.fulfill({status:204}));
 await page.route('**/api/consistency/profile',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({companyName:'0001'})}));
 const limits={sites:2,customDomains:false};
 await page.route('**/api/consistency/workspaces',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({owner:true,workspaces:[{code:'02RAFT',name:'Raft & Co',plan:'free',role:'owner',sites:1,siteCodes:['40RAFT'],limits}]})}));
 await page.route('**/api/consistency/sites',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({workspace:'02RAFT',sites:[{code:'40RAFT',name:'Raft',url:'https://amber-rose-teal.c9y.site/',address:'amber-rose-teal.c9y.site'}]})}));
 await page.route('**/api/consistency/domains**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({domains:[]})}));
 const members=[{email:'ada@example.com',role:'admin',status:'active'},{email:'bo@example.com',role:'editor',status:'invited'}];
 const posted=[];
 await page.route('**/api/consistency/workspaces/02RAFT/members',async route=>{
  if(route.request().method()==='POST'){const body=route.request().postDataJSON();posted.push(body);if(!members.some(each=>each.email===body.email))members.push({email:body.email,role:body.role,status:'invited'});await route.fulfill({status:201,contentType:'application/json',body:JSON.stringify({email:body.email,role:body.role,status:'invited',sent:true})});return;}
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({members})});
 });
 const home=`http://127.0.0.1:${server.address().port}/editor/home.html`;
 await page.goto(home);await page.locator('consistency-home ds-card').first().waitFor();
 await page.mouse.move(700,500);await page.locator('consistency-home ds-sidebar.home-foot').getByText('Settings',{exact:true}).click();
 await page.getByRole('tab',{name:'People'}).click();
 const people=page.locator('consistency-home consistency-members');await people.locator('ds-row',{hasText:'bo@example.com'}).waitFor();
 // Inviting someone new.
 await people.locator('ds-input.members-email input').fill('cy@example.com');
 await people.getByRole('button',{name:'Invite',exact:true}).click();
 await people.locator('ds-message',{hasText:'Invite sent to cy@example.com.'}).waitFor();
 if(JSON.stringify(posted)!==JSON.stringify([{email:'cy@example.com',role:'editor'}]))throw Error('The invite posted '+JSON.stringify(posted));
 if(await people.locator('ds-input.members-email input').inputValue()!=='')throw Error('The address stayed in the field after the invite');
 // Sending Bo's waiting invite again, with Bo's own role.
 await people.getByRole('button',{name:'More for bo@example.com'}).click();
 await page.getByRole('menuitem',{name:'Send the invite again'}).click();
 await people.locator('ds-message',{hasText:'Invite sent again to bo@example.com.'}).waitFor();
 if(JSON.stringify(posted.at(-1))!==JSON.stringify({email:'bo@example.com',role:'editor'}))throw Error('Sending again posted '+JSON.stringify(posted.at(-1)));
 // Ada is in: her menu has no invite to send.
 await page.keyboard.press('Escape');
 await people.getByRole('button',{name:'More for ada@example.com'}).click();
 await page.getByRole('menuitem',{name:'Remove'}).first().waitFor();
 if(await page.getByRole('menuitem',{name:'Send the invite again'}).count())throw Error('An active person is offered the invite again');
 console.log('Members: invite and send again pass');
} finally { await browser.close(); server.close(); }
