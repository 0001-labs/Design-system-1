// The Orders place in Consistency's app, on the site engine's orders: its title and kinds in the site's own words
// (orders/config), the list newest first with Show more, the kind tabs, the status Select and the search, an order's
// drawer with its lines, customer, payment and history, each step the engine allows (approve, invoice, mark paid,
// fulfil), declining and cancelling confirmed in place, the note saved on leaving it and put back when refused, and
// Who can order. Every gateway answer is a stand-in.
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

const zone = 'Europe/Copenhagen';
const uuid = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const order = (n, code, kind, status, extra = {}) => ({
  id: uuid(n), code, kind, status, lang: 'da', currency: 'dkk', totalMinor: 120000, paidMinor: status === 'paid' ? 120000 : 0, refundedMinor: 0,
  payment: kind === 'request' ? 'none' : 'invoice', invoice: status === 'invoiced' ? { number: '1007', to: { company: 'Studio Nord', address: 'Gade 1, 2100 København', vat: 'DK12345678' }, dueOn: '2026-11-09', at: Date.now() } : null,
  lines: [{ id: n, position: 0, item: { kind: 'product', ref: 'chair' }, label: 'Chair', quantity: 4, unitMinor: 30000, totalMinor: 120000, startsAt: null, endsAt: null, nights: null, seats: null, meta: kind === 'request' ? { from: '2026-11-01', to: '2026-11-03' } : {} }],
  createdAt: Date.now() - n * 3600_000, updatedAt: Date.now(), heldUntil: null, testMode: true,
  customer: { name: code === 'Rq01Aa' ? 'Ida Hansen' : `Customer ${code}`, email: code === 'Rq01Aa' ? 'ida@example.com' : `${code.toLowerCase()}@example.com`, phone: '+45 12 34 56 78', note: 'By the back door' },
  stripe: { session: null, paymentIntent: null }, note: '', meta: {}, ...extra,
});
// Newest first, as the engine answers: 60 orders, the first page 50 and Show more the rest.
let orders = [
  order(1, 'Rq01Aa', 'request', 'requested'),
  order(2, 'Sa02Bb', 'sale', 'confirmed'),
  order(3, 'Sa03Cc', 'sale', 'invoiced'),
  order(4, 'Sa04Dd', 'sale', 'paid', { payment: 'stripe', stripe: { session: 'cs_1', paymentIntent: 'pi_4' } }),
  ...Array.from({ length: 56 }, (_, i) => order(10 + i, `Ol${String(i).padStart(2, '0')}Zz`, i % 2 ? 'sale' : 'request', 'fulfilled')),
];
const about = {
  label: { da: { one: 'Ordre', many: 'Ordrer' }, en: { one: 'Order', many: 'Orders' } },
  kindLabels: { request: { da: { one: 'Forespørgsel', many: 'Forespørgsler' }, en: { one: 'Enquiry', many: 'Enquiries' } } },
  kinds: ['sale', 'request'], currency: 'dkk', timeZone: zone, payment: { stripe: true, invoice: true }, testMode: true,
};
let open = 'owners';
const NEXT = to => { const allowed = { confirm: ['requested'], invoice: ['confirmed'], 'mark-paid': ['confirmed', 'invoiced'], fulfil: ['confirmed', 'invoiced', 'paid'], cancel: ['requested', 'held', 'confirmed', 'invoiced', 'paid'] }; return allowed[to]; };
const TO = { confirm: 'confirmed', invoice: 'invoiced', 'mark-paid': 'paid', fulfil: 'fulfilled', cancel: 'cancelled' };
const calls = [];
const fail = new Set();

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/api/consistency/profile', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ companyName: '0001' }) }));
  // The owner's one workspace, which holds the site (the app shows a workspace's sites only).
  await page.route('**/api/consistency/workspaces', route => route.fulfill({ json: { owner: true, workspaces: [{ code: '01STDO', name: '0001', plan: 'free', role: 'owner', sites: 1, siteCodes: ['20FLVO'], limits: { sites: 10, customDomains: true } }] } }));
  await page.route('**/api/consistency/sites', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ sites: [{ code: '20FLVO', name: 'Flavo', url: 'https://flavo.c9y.site/' }] }) }));
  await page.route('**/api/consistency/sites/*/pages', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ pages: [] }) }));
  await page.route('**/api/consistency/sites/*/places', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ places: [{ id: 'pages', label: 'Pages' }, { id: 'orders', label: 'Orders' }] }) }));
  await page.route('**/api/consistency/sites/20FLVO/api/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.split('/api/').pop();
    const method = request.method();
    const body = request.postData() ? JSON.parse(request.postData()) : null;
    calls.push({ method, path, query: url.search, body });
    const json = (value, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(value) });
    const key = `${method} ${path}`;
    if (fail.has(key)) { fail.delete(key); return json({ error: 'database-busy' }, 503); }
    if (key === 'GET orders/config') return json({ ...about, open });
    if (key === 'GET orders') {
      const kind = url.searchParams.get('kind'); const status = url.searchParams.get('status'); const q = (url.searchParams.get('q') ?? '').toLowerCase();
      const limit = Number(url.searchParams.get('limit') ?? 50); const after = url.searchParams.get('after');
      const matching = orders.filter(each => (!kind || each.kind === kind) && (!status || each.status === status) && (!q || `${each.code} ${each.customer.name} ${each.customer.email}`.toLowerCase().includes(q)));
      const start = after ? matching.findIndex(each => each.id === after.split(':')[1]) + 1 : 0;
      const pageOf = matching.slice(start, start + limit);
      const last = pageOf.at(-1);
      return json({ orders: pageOf, next: start + limit < matching.length && last ? `${last.createdAt}:${last.id}` : null, ...about });
    }
    const detail = id => ({ order: orders.find(each => each.id === id), events: [{ id: 1, order: id, at: Date.now() - 600_000, by: null, what: 'created', detail: {} }, { id: 2, order: id, at: Date.now() - 300_000, by: null, what: 'email-team', detail: { to: 'team@flavo.dk' } }], giftCard: null, testMode: true });
    let match = /^orders\/([\w-]{36})$/.exec(path);
    if (method === 'GET' && match) return json(detail(match[1]));
    match = /^orders\/([\w-]{36})\/note$/.exec(path);
    if (method === 'PUT' && match) { orders = orders.map(each => each.id === match[1] ? { ...each, note: body.note.trim() } : each); return json(detail(match[1])); }
    match = /^orders\/([\w-]{36})\/(confirm|cancel|mark-paid|invoice|fulfil)$/.exec(path);
    if (method === 'POST' && match) {
      const found = orders.find(each => each.id === match[1]);
      if (!NEXT(match[2]).includes(found.status)) return json({ error: 'not-allowed-now' }, 409);
      orders = orders.map(each => each.id === match[1] ? { ...each, status: TO[match[2]], ...(match[2] === 'invoice' ? { invoice: { number: '1008', to: null, dueOn: '2026-11-09', at: Date.now() } } : {}), ...(match[2] === 'mark-paid' ? { paidMinor: each.totalMinor } : {}) } : each);
      return json(detail(match[1]));
    }
    if (key === 'PUT order-settings') { open = body.open; return json({ open, announceTo: null, owners: [], fallback: null, testMode: true }); }
    return json({ error: 'unknown' }, 404);
  });

  const home = `http://127.0.0.1:${server.address().port}/private-consistency/home.html`;
  await page.goto(home + '?open=20FLVO');
  const places = page.locator('consistency-home ds-sidebar.home-places');
  await places.getByText('Orders', { exact: true }).waitFor();
  await places.getByText('Orders', { exact: true }).click();
  const place = page.locator('consistency-place-orders:not([hidden])');
  await place.locator('ds-row[data-order="Rq01Aa"]').waitFor();
  const shot = async name => { if (process.env.ORDERS_SHOT) await page.screenshot({ path: `${process.env.ORDERS_SHOT}-${name}.png` }); };
  await shot('orders');

  // The title and the kinds in the site's words; a row an order with its code, customer, kind, status, day and total.
  if ((await place.locator('ds-text.place-title').getAttribute('text')) !== 'Orders') throw Error('The title is not the site\'s word');
  const kinds = (await place.locator('ds-tabs[aria-label="Kinds"] [role="tab"]').allInnerTexts()).map(each => each.trim());
  if (kinds.join() !== 'All,Sales,Enquiries') throw Error('The kinds are not in the site\'s words: ' + kinds.join());
  const first = await place.locator('ds-row[data-order="Rq01Aa"]').innerText();
  for (const words of ['Rq01Aa', 'Ida Hansen', 'Enquiry', 'Requested']) if (!first.includes(words)) throw Error(`The order's row lacks ${words}: ${first}`);
  if (!/1\.200,00\s?kr\./.test(first)) throw Error('The total is not in kroner: ' + first);
  if (!(await place.locator('ds-row[data-order="Rq01Aa"] code.place-code').count())) throw Error('The code is not in the code face');
  if (await place.locator('ds-row.place-order').count() !== 50) throw Error('The first page is not 50 orders');
  if (!calls.some(call => call.path === 'orders' && call.query === '?limit=50')) throw Error('The list was not asked newest first, a page at a time');
  if (await page.getByRole('button', { name: /^(Reload|Refresh)$/ }).count()) throw Error('A reload button is shown');

  // Paging: Show more asks after the last order shown and adds the rest.
  await place.getByRole('button', { name: 'Show more' }).click();
  await place.locator('ds-row[data-order="Ol55Zz"]').waitFor();
  if (await place.locator('ds-row.place-order').count() !== 60) throw Error('Show more did not add the rest');
  if (!calls.some(call => call.path === 'orders' && /after=\d+%3A00000000-0000-4000-8000-000000000055/.test(call.query))) throw Error('Show more does not ask after the last order: ' + calls.filter(call => call.path === 'orders').map(call => call.query).join(' '));
  if (await place.getByRole('button', { name: 'Show more' }).count()) throw Error('Show more stays with nothing more');

  // The filters: a kind, a status and the search, each from the first page.
  await place.getByRole('tab', { name: 'Sales' }).click();
  await place.locator('ds-row[data-order="Rq01Aa"]').waitFor({ state: 'detached' });
  await place.locator('ds-row[data-order="Sa02Bb"]').waitFor();
  if (await place.locator('ds-row[data-order^="Rq"]').count()) throw Error('Sales shows requests');
  if (!calls.some(call => call.query === '?kind=sale&limit=50')) throw Error('The kind tab does not ask for its kind');
  if (await place.locator('ds-row.place-order__kind, ds-row .place-order__kind').count() === 0) throw Error('The kind tags are gone');
  await place.locator('select[aria-label="Status"]').selectOption('invoiced');
  await place.locator('ds-row[data-order="Sa02Bb"]').waitFor({ state: 'detached' });
  await place.locator('ds-row[data-order="Sa03Cc"]').waitFor();
  if (await place.locator('ds-row.place-order').count() !== 1) throw Error('The status filter shows other statuses');
  if (!calls.some(call => call.query === '?kind=sale&status=invoiced&limit=50')) throw Error('The status Select does not ask for its status');
  await place.locator('select[aria-label="Status"]').selectOption('');
  await place.getByRole('tab', { name: 'All' }).click();
  await place.locator('ds-input[aria-label="Search"] input').fill('ida');
  await page.waitForFunction(() => document.querySelectorAll('consistency-place-orders ds-row.place-order').length === 1);
  if (!calls.some(call => call.query === '?q=ida&limit=50')) throw Error('The search does not ask with its words');
  await place.locator('ds-input[aria-label="Search"] input').fill('nobody');
  await place.getByText('No orders match').waitFor();
  await place.locator('ds-input[aria-label="Search"] input').fill('');
  await place.locator('ds-row[data-order="Sa04Dd"]').waitFor();

  // The drawer: non-modal, beside the list, with the lines, customer, payment and history.
  await place.locator('ds-row[data-order="Sa03Cc"]').click();
  const drawer = place.locator('dialog.place-drawer[open]');
  await drawer.getByText('Announced to team@flavo.dk').waitFor();
  if (await drawer.evaluate(dialog => dialog.matches(':modal'))) throw Error('The order opens in a modal');
  const words = await drawer.innerText();
  for (const each of ['Chair', '× 4', 'Studio Nord', 'DK12345678', 'Invoice 1007', '2026-11-09', 'Invoiced', 'Placed', 'Sa03Cc']) if (!words.includes(each)) throw Error(`The drawer lacks ${each}`);
  await page.waitForTimeout(process.env.ORDERS_SHOT ? 1000 : 0); await shot('order');
  // An invoiced order may be marked paid, fulfilled or cancelled; never approved or invoiced again.
  const stepsOf = async () => (await drawer.locator('[data-step]').evaluateAll(buttons => buttons.map(button => button.getAttribute('data-step')))).join();
  if (await stepsOf() !== 'mark-paid,fulfil,cancel') throw Error('The invoiced order\'s steps: ' + await stepsOf());
  await drawer.getByRole('button', { name: 'Mark paid' }).click();
  await drawer.getByRole('button', { name: 'Mark fulfilled' }).waitFor();
  if (await stepsOf() !== 'fulfil,cancel') throw Error('After Mark paid the steps are ' + await stepsOf());
  if (!(await place.locator('ds-row[data-order="Sa03Cc"]').innerText()).includes('Paid')) throw Error('The list does not follow the step');
  await drawer.getByRole('button', { name: 'Mark fulfilled' }).click();
  await drawer.locator('[data-step]').first().waitFor({ state: 'detached' });
  if (orders.find(each => each.code === 'Sa03Cc').status !== 'fulfilled') throw Error('Mark fulfilled was not sent');

  // The note: saved on leaving it; a refused save puts the saved one back and says why.
  const note = drawer.locator('ds-input[aria-label="Note"] textarea');
  await note.fill('Picked up Friday');
  await drawer.getByRole('heading', { name: /Customer Sa03Cc/ }).click();
  await page.waitForFunction(() => document.querySelector('consistency-place-orders')?.noting?.saved === 'Picked up Friday');
  const saved = calls.find(call => call.method === 'PUT' && call.path.endsWith('/note'));
  if (saved?.body.note !== 'Picked up Friday') throw Error('The note was not saved as written: ' + JSON.stringify(saved));
  fail.add(`PUT orders/${uuid(3)}/note`);
  await note.fill('Something else');
  await drawer.getByRole('heading', { name: /Customer Sa03Cc/ }).click();
  await drawer.getByText(/The note was not saved/).waitFor();
  if (await note.inputValue() !== 'Picked up Friday') throw Error('A refused note was not put back: ' + await note.inputValue());

  // A confirmed sale: Send invoice.
  await place.locator('ds-row[data-order="Sa02Bb"]').click();
  await drawer.getByRole('button', { name: 'Send invoice' }).waitFor();
  if (await stepsOf() !== 'invoice,mark-paid,fulfil,cancel') throw Error('The confirmed order\'s steps: ' + await stepsOf());
  await drawer.getByRole('button', { name: 'Send invoice' }).click();
  await drawer.getByText('Invoice 1008').waitFor();
  if (!calls.some(call => call.method === 'POST' && call.path === `orders/${uuid(2)}/invoice`)) throw Error('Send invoice was not sent');

  // A paid sale: Cancel with a refund, confirmed in place; Keep it takes the question back.
  await place.locator('ds-row[data-order="Sa04Dd"]').click();
  await drawer.getByText('pi_4').waitFor();
  const refund = drawer.locator('ds-input[aria-label="Refund"] input');
  await refund.fill('2000');
  await drawer.getByRole('button', { name: 'Cancel', exact: true }).click();
  await drawer.getByText(/At most 1\.200,00/).first().waitFor();
  await refund.fill('300');
  await drawer.getByRole('button', { name: 'Cancel', exact: true }).click();
  await drawer.getByText(/Cancel Sa04Dd and refund 300,00\s?kr\., telling the customer\? This cannot be undone\./).waitFor();
  if (await page.locator('dialog:modal').count()) throw Error('The cancellation asks in a modal');
  await drawer.getByRole('button', { name: 'Keep it' }).click();
  if (calls.some(call => call.path.endsWith('/cancel'))) throw Error('Keep it cancelled the order');
  await drawer.getByRole('button', { name: 'Cancel', exact: true }).click();
  await drawer.getByRole('button', { name: 'Cancel the sale' }).click();
  await drawer.locator('[data-step]').first().waitFor({ state: 'detached' });
  const cancelled = calls.find(call => call.path === `orders/${uuid(4)}/cancel`);
  if (cancelled?.body.refundMinor !== 30000 || cancelled.body.notify !== true) throw Error('The cancellation was not sent as confirmed: ' + JSON.stringify(cancelled));

  // A request: Approve, telling the customer; another is declined, confirmed in place, without the email.
  orders = [order(70, 'Rq70Ee', 'request', 'requested'), ...orders];
  await page.evaluate(() => dispatchEvent(new Event('focus')));
  await place.locator('ds-row[data-order="Rq70Ee"]').waitFor();
  await place.locator('ds-row[data-order="Rq01Aa"]').click();
  await drawer.getByText('2026-11-01 to 2026-11-03').waitFor();
  if (await stepsOf() !== 'confirm,cancel') throw Error('The request\'s steps: ' + await stepsOf());
  await drawer.getByRole('button', { name: 'Approve' }).click();
  await drawer.getByRole('button', { name: 'Send invoice' }).waitFor();
  const approved = calls.find(call => call.path === `orders/${uuid(1)}/confirm`);
  if (approved?.body.notify !== true) throw Error('Approving does not tell the customer: ' + JSON.stringify(approved));
  await place.locator('ds-row[data-order="Rq70Ee"]').click();
  await drawer.getByRole('button', { name: 'Decline' }).waitFor();
  await drawer.locator('label.place-check input').uncheck();
  await drawer.getByRole('button', { name: 'Decline' }).click();
  await drawer.getByText('Decline Rq70Ee? This cannot be undone.').waitFor();
  await drawer.getByRole('button', { name: 'Decline the enquiry' }).click();
  await drawer.locator('[data-step]').first().waitFor({ state: 'detached' });
  const declined = calls.find(call => call.path === `orders/${uuid(70)}/cancel`);
  if (!declined || declined.body.notify !== false || 'refundMinor' in declined.body) throw Error('The decline was not sent as confirmed: ' + JSON.stringify(declined));
  // A step the engine refuses says so in place.
  orders = orders.map(each => each.code === 'Sa02Bb' ? { ...each, status: 'confirmed' } : each);
  await place.locator('ds-row[data-order="Sa02Bb"]').click();
  await drawer.getByRole('button', { name: 'Send invoice' }).waitFor();
  orders = orders.map(each => each.code === 'Sa02Bb' ? { ...each, status: 'fulfilled' } : each);
  await drawer.getByRole('button', { name: 'Send invoice' }).click();
  await drawer.getByText(/Send invoice did not go through: the site answered “not-allowed-now”/).waitFor();
  await drawer.getByRole('button', { name: 'Close' }).click();

  // Who can order: saved at once; a refusal puts it back and says why.
  const who = place.locator('ds-tabs[aria-label="Who can order"]');
  if (await who.locator('ds-button', { hasText: 'Owners only' }).getAttribute('aria-pressed') !== 'true') throw Error('Who can order does not show Owners only');
  await who.getByRole('button', { name: 'Everyone' }).click();
  await place.getByText(/Every visitor can order on the site/).waitFor();
  if (open !== 'everyone' || !calls.some(call => call.method === 'PUT' && call.path === 'order-settings' && call.body.open === 'everyone')) throw Error('Who can order was not saved');
  fail.add('PUT order-settings');
  await who.getByRole('button', { name: 'Off' }).click();
  await place.getByText(/Who can order was not changed/).waitFor();
  if (await who.locator('ds-button', { hasText: 'Everyone' }).getAttribute('aria-pressed') !== 'true' || open !== 'everyone') throw Error('A refused change of who can order was not put back');

  for (const width of [390, 1440]) { await page.setViewportSize({ width, height: 900 }); await page.waitForTimeout(100); if (await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)) throw Error(`The place overflows at ${width}`); }
  if (errors.length) throw Error('The page threw: ' + errors.join('; '));
  console.log('Orders (the site\'s words, the list with Show more, kind tabs, status Select and search, the drawer, approve, invoice, mark paid, fulfil, decline and cancel confirmed in place, a refused step, the note saved and put back, who can order) passed');
} finally { await browser.close(); await new Promise(done => server.close(done)); }
