import { componentFixture } from './component-fixture.mjs';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { chromium } from 'playwright';
const root = resolve('website/dist');
const server = createServer(async (request, response) => {
 const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
 const file = resolve(root, '.' + (path.endsWith('/') ? path + 'index.html' : path));
 if (!file.startsWith(root + '/')) return response.writeHead(403).end();
 try { response.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html' })[extname(file)] ?? 'application/octet-stream'); response.end(await componentFixture(file)); } catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true });
try {
 const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
 const failures = [];
 page.on('pageerror', error => {failures.push(error.message); console.log('PAGE ERROR',error.stack)}); page.on('console', message => {if(message.type()==='error') console.log('CONSOLE',message.text().slice(0,200))});
 await page.route('**/api/consistency/pages', route => route.fulfill({ json: { pages: [] } }));
 await page.route('**/api/consistency/sites', route => route.fulfill({ json: { sites: [] } }));
 await page.goto(`http://127.0.0.1:${server.address().port}/private-consistency/`);
 const ids = await page.locator('select[aria-label="Example page"] option').evaluateAll(options => options.map(option => option.value).filter(id => !['editor','studio'].includes(id)));
 if (process.env.FLOW_ONLY) ids.length = 0;
 for (const id of ids) {
  await page.locator('select[aria-label="Example page"]').selectOption(id);
  const frame = page.frameLocator('consistency-template iframe');
  try { await frame.locator('[contenteditable]:not([contenteditable="false"]):visible').first().waitFor({ timeout: 10000 }); } catch(error) { console.log('FAILED',id, failures,await page.locator('consistency-template').evaluate(e=>({text:e.innerHTML, doc:e.querySelector('iframe')?.contentDocument?.body?.innerHTML.slice(0,1500)}))); throw error; }
  const editor = frame.locator('[contenteditable]:not([contenteditable="false"]):visible').first();
  await editor.fill(`Changed ${id}`);
  await page.locator('select[aria-label="Example page"]').selectOption('editor');
  await page.locator('select[aria-label="Example page"]').selectOption(id);
  await frame.getByText(`Changed ${id}`, { exact: true }).first().waitFor();
  if (failures.length) throw Error(`${id}: ${failures.join('; ')}`);
  console.log(`${id}: authored page, direct writing, independent draft and reopen passed`);
 }

 // The app's complete flow uses only isolated workspace records and a revisioned fake transport.
 const drafts = new Map(); let refuse = false, requests = [];
 await page.route('**/api/consistency/workspaces', route => route.fulfill({ json: { workspaces: [{ code: '01STDO', name: 'Example workspace', role: 'owner', sites: 0, siteCodes: [], limits: { sites: 2, customDomains: false } }] } }));
 await page.route('**/api/consistency/workspaces/*/members', route => route.fulfill({ json: { members: [] } }));
 await page.route('**/api/consistency/draft-sites{,/**}', async route => {
  const request = route.request(), id = new URL(request.url()).pathname.split('/')[4];
  requests.push(request.headers()['x-c9y-workspace']);
  if (request.method() === 'PUT') {
   if (refuse) return route.fulfill({ status: 503, json: { error: 'unavailable' } });
   const body = request.postDataJSON(), previous = drafts.get(id);
   if (previous && previous.revision !== body.revision && body.revision !== 0) return route.fulfill({ status: 409, json: { error: 'revision-conflict' } });
   const saved = { ...body, id, revision: (previous?.revision ?? 0) + 1, updatedAt: Date.now() }; drafts.set(id, saved);
   return route.fulfill({ json: saved });
  }
  return route.fulfill({ json: id ? drafts.get(id) : { sites: [...drafts.values()] } });
 });
 await page.goto(`http://127.0.0.1:${server.address().port}/private-consistency/home.html`);
 await page.getByRole('button', { name: 'Add new site', exact: true }).click();
 if (await page.locator('consistency-new-site ds-card[data-template]').count() !== 30) throw Error('Incomplete template picker');
 await page.getByRole('searchbox', { name: 'Find a template' }).fill('Booking');
 await page.locator('ds-card[data-template="booking"]').click();
 await page.getByRole('textbox', { name: 'Site name', exact: true }).fill('A saved booking site');
 await page.frameLocator('consistency-new-site consistency-template iframe').getByRole('textbox', { name: 'Edit Get more from every work trip' }).locator('[contenteditable]').fill('Our first site');
 refuse = true;
 await page.getByRole('button', { name: 'Create site', exact: true }).click();
 await page.getByRole('alert').filter({ hasText: 'could not be saved' }).waitFor();
 if (drafts.size) throw Error('Failed creation produced a draft');
 refuse = false;
 await page.getByRole('button', { name: 'Create site', exact: true }).click();
 await page.locator('consistency-draft-site consistency-template iframe').waitFor();
 const savedFrame = page.frameLocator('consistency-draft-site consistency-template iframe');
 await savedFrame.getByText('Our first site', { exact: true }).waitFor();
 const heading = savedFrame.getByRole('textbox', { name: 'Edit Get more from every work trip' }).locator('[contenteditable]');
 await heading.fill('The next version');
 await page.getByRole('button', { name: 'Workspace: Example workspace' }).click();
 await page.locator('ds-card[data-draft-site]').click();
 await savedFrame.getByText('The next version', { exact: true }).waitFor();
 await page.reload();
 await savedFrame.getByText('The next version', { exact: true }).waitFor();
 if (drafts.size !== 1 || requests.some(workspace => workspace !== '01STDO')) throw Error('Duplicate creation or wrong workspace');
 console.log('Home: picker, preview, failed creation/retry, workspace scoping, autosave, navigation and full reload passed');
 await page.screenshot({ path: '/tmp/c9y-template-desktop.png' });
 // A failed autosave must retain the draft and block navigation.
 refuse = true;
 await savedFrame.getByRole('textbox', { name: 'Edit Get more from every work trip' }).locator('[contenteditable]').fill('Keep this unsaved edit');
 await page.getByRole('button', { name: 'Workspace: Example workspace' }).click();
 await page.locator('consistency-draft-site [role="alert"]').waitFor();
 await savedFrame.getByText('Keep this unsaved edit', { exact: true }).waitFor();
 refuse = false;
 await page.locator('consistency-draft-site').getByRole('button', { name: 'Try again', exact: true }).click();
 await page.getByRole('button', { name: 'Workspace: Example workspace' }).click();
 await page.getByRole('button', { name: 'Add new site', exact: true }).waitFor();
 console.log('Home: failed autosave keeps the edit, blocks navigation and recovers on retry');
 await page.goto(`http://127.0.0.1:${server.address().port}/private-consistency/`);
 await page.setViewportSize({ width: 390, height: 844 });
 await page.locator('select[aria-label="Example page"]').selectOption('booking');
 await page.frameLocator('consistency-template iframe').locator('.trip-hero').waitFor();
 const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
 if (overflow) throw Error('Editor exceeds the phone viewport');
 await page.screenshot({ path: '/tmp/c9y-template-phone.png' });
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
