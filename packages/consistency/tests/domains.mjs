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
await new Promise(done => server.listen(0, '127.0.0.1', done));
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  // The platform as the gateway forwards it: sites, a Worker custom domain it cannot manage, and Cloudflare's word on each check.
  const state = { ready: true, allowed: true, sites: [{ code: '10VNDG', name: 'CPH Raft', domains: [] }, { code: '20FLAV', name: 'Flavo', domains: [{ host: 'flavo.flowers', state: 'active', detail: null, managed: false, checkedAt: null }] }] };
  const calls = [];
  let checks = 0;
  await page.route('**/api/consistency/workspaces', route => route.fulfill({ json: { owner: true, workspaces: [{ code: '01STDO', name: '0001', plan: 'plus', role: 'owner', sites: 2, siteCodes: ['10VNDG', '20FLAV'], limits: { sites: null, customDomains: true } }] } }));
  await page.route('**/api/consistency/sites', route => route.fulfill({ json: { sites: [{ code: '10VNDG', name: 'CPH Raft', url: 'https://cphraft.c9y.site/' }, { code: '20FLAV', name: 'Flavo', url: 'https://flavo.c9y.site/' }] } }));
  await page.route('**/api/consistency/domains**', async route => {
    const request = route.request(); const path = new URL(request.url()).pathname; calls.push(`${request.method()} ${path}`);
    if (request.headers()['x-c9y-workspace'] !== '01STDO') return route.fulfill({ status: 404, json: { error: 'unknown-workspace' } });
    if (request.method() === 'GET') return route.fulfill({ json: { target: 'connect.c9y.site', ...state } });
    if (request.method() === 'POST' && path.endsWith('/check')) {
      checks++;
      const host = path.split('/')[4];
      const domain = state.sites.flatMap(site => site.domains).find(item => item.host === host);
      Object.assign(domain, { state: 'active', detail: null, checkedAt: Date.now() });
      return route.fulfill({ json: domain });
    }
    if (request.method() === 'POST') {
      const body = request.postDataJSON();
      if (body.host === 'taken.com') return route.fulfill({ status: 409, json: { error: 'host-taken' } });
      const domain = { host: body.host.toLowerCase(), state: 'pending', detail: null, managed: true, checkedAt: 1 };
      state.sites.find(site => site.code === body.site).domains.push(domain);
      return route.fulfill({ status: 201, json: domain });
    }
    if (request.method() === 'DELETE') {
      const host = path.split('/')[4];
      for (const site of state.sites) site.domains = site.domains.filter(item => item.host !== host);
      return route.fulfill({ status: 204 });
    }
    return route.fulfill({ status: 405 });
  });
  const base = `http://127.0.0.1:${server.address().port}/private-consistency/home.html`;
  await page.goto(base); await page.locator('consistency-home ds-card').first().waitFor();
  // Settings is at the sidebar's foot (home.mjs covers the sidebar itself).
  await page.locator('consistency-home ds-sidebar.home-foot').getByText('Settings', { exact: true }).click();
  await page.locator('consistency-domains ds-list').first().waitFor();
  if (await page.locator('consistency-home ds-card').count()) throw Error('Projects still shown on Domains');
  const flavo = page.locator('consistency-domains ds-list[heading="Flavo"]');
  if (!(await flavo.innerText()).includes('flavo.flowers') || await flavo.getByRole('button', { name: /More for/ }).count()) throw Error('A Worker custom domain must show without actions');
  const connect = page.getByRole('button', { name: 'Connect', exact: true });
  if (!await connect.isDisabled()) throw Error('Connect is enabled without a domain');

  await page.locator('consistency-domains ds-input input').fill('taken.com'); await connect.click();
  await page.locator('consistency-domains ds-message[role="alert"][text*="already connected"]').waitFor();

  await page.locator('consistency-domains ds-input input').fill('WWW.CPHraft.dk'); await page.keyboard.press('Enter');
  const cph = page.locator('consistency-domains ds-list[heading="CPH Raft"]');
  await cph.locator('.ds-row__name', { hasText: 'www.cphraft.dk' }).waitFor();
  const record = cph.getByRole('group', { name: 'DNS record for www.cphraft.dk' });
  if ((await record.evaluate(group => [...group.querySelectorAll('ds-text')].map(text => text.getAttribute('text')).join(' '))) !== 'CNAME www.cphraft.dk connect.c9y.site') throw Error('The CNAME record is not shown');
  if (await page.locator('consistency-domains ds-input input').inputValue()) throw Error('The field was not cleared after connecting');
  if (calls.some(call => call.includes('/check'))) throw Error('Checked at once instead of on its own cadence');

  // Returning to the page asks Cloudflare again about waiting domains, with no button for it.
  if (await page.getByRole('button', { name: /check|refresh|reload/i }).count()) throw Error('A check button exists');
  await page.reload(); await cph.locator('ds-tag', { hasText: 'Connected' }).waitFor();
  if (checks !== 1) throw Error(`Expected one check, got ${checks}`);
  if (await cph.getByRole('group', { name: 'DNS record for www.cphraft.dk' }).count()) throw Error('A connected domain still shows its record');

  await cph.getByRole('button', { name: 'More for www.cphraft.dk' }).click();
  await page.getByRole('menuitem', { name: 'Disconnect' }).click();
  await cph.waitFor({ state: 'detached' });
  if (!calls.includes('DELETE /api/consistency/domains/www.cphraft.dk')) throw Error('Disconnect did not reach the platform');

  for (const width of [300, 390, 768, 1440]) { await page.setViewportSize({ width, height: 800 }); await page.waitForTimeout(100); if (await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)) throw Error(`Domains overflows at ${width}`); }
  await page.setViewportSize({ width: 1440, height: 800 });
  await page.locator('#home-workspace').click(); await page.locator('consistency-home ds-card').first().waitFor();

  state.ready = false;
  await page.goto(base + '#settings/domains'); await page.reload(); await page.locator('consistency-domains ds-message[text="Connecting domains is not set up yet."]').waitFor();
  // On Free, the sites stay on their built-in addresses: no form to connect one.
  state.ready = true; state.allowed = false;
  await page.reload(); await page.locator('consistency-domains ds-message[text*="comes with Plus"]').waitFor();
  if (await page.getByRole('button', { name: 'Connect', exact: true }).count()) throw Error('Free still offers to connect a domain');
  console.log('Domains: listing, refused domain, connect with its record, automatic check, disconnect, unset state, Free without domains and viewports passed');
} finally { await browser.close(); await new Promise(done => server.close(done)); }
