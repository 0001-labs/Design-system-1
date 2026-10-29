// CPH Raft's places in Consistency's app: Bookings (the lists by day, the drawer, Cancel confirmed in place, Who can
// book, Schedule's matrix edited, saved, discarded and kept through a failed save) and Gift cards (the tabs, the
// drawer, Resend and Void confirmed in place, Issue a card). Every gateway answer is a stand-in.
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
const day = offset => { const at = new Date(Date.now() + offset * 86_400_000); return new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(at); };
const uuid = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const booking = (n, code, date, extra = {}) => ({
  id: uuid(n), code, offer: 'green-1', offerName: { da: 'Grøn tømmerflåde 1', en: 'Green raft 1' }, kind: 'slot', date, time: '10:00', nights: null, endDate: date,
  start: Date.now() + 5 * 86_400_000, end: 0, guests: 2, tickets: [{ priceId: 'adult', name: { en: 'Adult' }, unitAmount: 45000, quantity: 2 }], amount: 90000, paid: 90000, refunded: 0,
  currency: 'dkk', status: 'confirmed', lang: 'da', createdAt: Date.now() - 86_400_000, testMode: true,
  guest: { name: code === 'RAFT01' ? 'Ida Hansen' : code, email: 'ida@example.com', phone: '+45 12 34 56 78', note: '' }, holdUntil: 0, stripe: { session: null, paymentIntent: 'pi_123' }, ...extra,
});
let bookings = [
  booking(1, 'RAFT01', day(1)),
  booking(2, 'RAFT02', day(1), { time: '14:00', status: 'pending' }),
  booking(3, 'OLD001', day(-5)),
  booking(4, 'GONE01', day(3), { status: 'cancelled' }),
];
const weekly = { mon: ['10:00', '12:00'], tue: ['10:00'], wed: [], thu: [], fri: [], sat: ['10:00'], sun: [] };
const offer = (id, name, extra = {}) => ({
  id, name: { en: name }, kind: 'slot', durationMinutes: 90, capacity: 1, pool: 'green', maxGuests: 6, minGuests: 1, prices: [{ id: 'adult', name: { en: 'Adult' }, amount: 45000 }],
  cancellation: { fullRefundHours: 24, feeMinor: 10000 }, open: true, season: { from: '2026-05-01', to: '2026-09-30' }, weekly, closed: [], noticeHours: 2, horizonDays: 180, ...extra,
});
let offers = [offer('green-1', 'Green raft 1'), offer('green-2', 'Green raft 2'), offer('stay', 'Blue raft stay', { kind: 'nights', pool: 'blue', weekly: {}, prices: [{ id: 'night', name: { en: 'Night' }, amount: 290000 }] })];
let settings = { open: 'owners', closed: [], testMode: true };
const card = (n, code, extra = {}) => ({
  id: uuid(100 + n), code, amount: 50000, balance: 50000, held: 0, currency: 'dkk', status: 'active', expires: day(300), recipient: `Recipient ${n}`, recipientEmail: `r${n}@example.com`,
  sendTo: 'recipient', sendOn: null, sent: true, lang: 'da', testMode: true, buyer: { name: 'Bo', email: 'bo@example.com' }, message: 'Tillykke', paid: 50000, issuedBy: null,
  createdAt: Date.now() - n * 86_400_000, uses: [], ...extra,
});
let cards = [card(1, 'RAFT-AAAA-BBBB', { balance: 20000, uses: [{ booking: uuid(1), bookingCode: 'RAFT01', amount: 30000, state: 'drawn', at: Date.now() }] }), card(2, 'RAFT-CCCC-DDDD', { status: 'used', balance: 0 }), card(3, null, { status: 'pending' })];
const calls = [];
const fail = new Set();

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/api/consistency/profile', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ companyName: '0001' }) }));
  // The owner's one workspace, which holds the site (the app shows a workspace's sites only).
  await page.route('**/api/consistency/workspaces', route => route.fulfill({ json: { owner: true, workspaces: [{ code: '01STDO', name: '0001', plan: 'free', role: 'owner', sites: 1, siteCodes: ['10VNDG'], limits: { sites: 10, customDomains: true } }] } }));
  await page.route('**/api/consistency/sites', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ sites: [{ code: '10VNDG', name: 'CPH Raft', url: 'https://cphraft.c9y.site/' }] }) }));
  await page.route('**/api/consistency/sites/*/pages', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ pages: [] }) }));
  await page.route('**/api/consistency/sites/*/places', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ places: [{ id: 'pages', label: 'Pages' }, { id: 'bookings', label: 'Bookings' }, { id: 'giftcards', label: 'Gift cards' }] }) }));
  await page.route('**/api/consistency/sites/10VNDG/api/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.split('/api/').pop();
    const method = request.method();
    const body = request.postData() ? JSON.parse(request.postData()) : null;
    calls.push({ method, path, query: url.search, body });
    const json = (value, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(value) });
    const key = `${method} ${path}`;
    if (fail.has(key)) { fail.delete(key); return json({ error: 'stripe-unavailable' }, 502); }
    if (key === 'GET bookings') {
      const status = url.searchParams.get('status');
      return json({ bookings: status ? bookings.filter(each => each.status === status) : bookings, currency: 'dkk', timeZone: zone, testMode: true });
    }
    let match = /^bookings\/([\w-]+)$/.exec(path);
    if (method === 'GET' && match) {
      const found = bookings.find(each => each.id === match[1]);
      return json({ booking: found, events: [{ id: 1, booking: found.id, at: Date.now() - 3600_000, type: 'paid', by: null, detail: { amount: found.paid } }], suggestedRefund: 80000, cancellation: { fullRefundHours: 24, feeMinor: 10000 }, testMode: true });
    }
    match = /^bookings\/([\w-]+)\/cancel$/.exec(path);
    if (method === 'POST' && match) { bookings = bookings.map(each => each.id === match[1] ? { ...each, status: 'cancelled', refunded: body.refundMinor } : each); return json({ booking: bookings.find(each => each.id === match[1]) }); }
    if (key === 'GET booking-offers') return json({ offers, currency: 'dkk', timeZone: zone, testMode: true });
    if (key === 'PUT booking-offers') {
      offers = offers.map(each => { const change = body.offers.find(other => other.id === each.id); return change ? { ...each, ...change } : each; });
      return json({ offers, currency: 'dkk', timeZone: zone, testMode: true });
    }
    if (key === 'GET booking-settings') return json({ ...settings, owners: [], fallback: null });
    if (key === 'PUT booking-settings') { settings = { ...settings, ...body }; return json(settings); }
    if (key === 'GET giftcards') return json({ cards, currency: 'dkk', testMode: true });
    if (key === 'POST giftcards') { const made = card(9, 'RAFT-NEW0-CARD', { amount: body.amount, balance: body.amount, recipient: body.recipient.name, recipientEmail: body.recipient.email, issuedBy: 'jaa90@icloud.com', paid: 0 }); cards = [made, ...cards]; return json({ card: made }); }
    match = /^giftcards\/([\w-]+)$/.exec(path);
    if (method === 'GET' && match) return json({ card: cards.find(each => each.id === match[1]), events: [{ at: Date.now(), type: 'sent', by: null, detail: { to: 'r1@example.com' } }] });
    match = /^giftcards\/([\w-]+)\/(resend|void)$/.exec(path);
    if (method === 'POST' && match) {
      if (match[2] === 'void') cards = cards.map(each => each.id === match[1] ? { ...each, status: 'void' } : each);
      return json({ card: cards.find(each => each.id === match[1]), events: [] });
    }
    return json({ error: 'unknown' }, 404);
  });

  const home = `http://127.0.0.1:${server.address().port}/editor/home.html`;
  await page.goto(home + '?open=10VNDG');
  const places = page.locator('consistency-home ds-sidebar.home-places');
  await places.getByText('Bookings', { exact: true }).waitFor();
  await places.getByText('Bookings', { exact: true }).click();
  const place = page.locator('consistency-place-bookings:not([hidden])');
  await place.locator('ds-row[data-booking="RAFT01"]').waitFor();

  // Upcoming: by day, a row a booking with its time, guest, offer, guests, status tag and amount in kroner.
  const first = await place.locator('ds-row[data-booking="RAFT01"]').innerText();
  for (const words of ['10:00', 'Ida Hansen', 'Green raft 1', '2 guests', 'Paid']) if (!first.includes(words)) throw Error(`The booking's row lacks ${words}: ${first}`);
  if (!/900,00\s?kr\./.test(first)) throw Error('The amount is not in kroner: ' + first);
  if (!(await place.locator('ds-list.place-day').first().getAttribute('heading'))?.startsWith('Tomorrow, ')) throw Error('Upcoming is not by day');
  if (!(await place.locator('ds-row[data-booking="RAFT02"]').innerText()).includes('Awaiting payment')) throw Error('A held booking is not marked');
  if (await place.locator('ds-row[data-booking="OLD001"], ds-row[data-booking="GONE01"]').count()) throw Error('Upcoming shows past or cancelled bookings');
  if (!calls.some(call => call.path === 'bookings' && call.query.startsWith('?from='))) throw Error('Upcoming does not ask from a stay back');
  if (await page.getByRole('button', { name: /^(Reload|Refresh)$/ }).count()) throw Error('A reload button is shown');

  const shot = async name => { if (process.env.RAFT_SHOT) await page.screenshot({ path: `${process.env.RAFT_SHOT}-${name}.png` }); };
  await shot('bookings');
  // The filters: Past and Cancelled.
  await place.getByRole('tab', { name: 'Past' }).click();
  await place.locator('ds-row[data-booking="OLD001"]').waitFor();
  if (await place.locator('ds-row[data-booking="RAFT01"]').count()) throw Error('Past shows what is ahead');
  await place.getByRole('tab', { name: 'Cancelled' }).click();
  await place.locator('ds-row[data-booking="GONE01"]').waitFor();
  if (!calls.some(call => call.query === '?status=cancelled')) throw Error('Cancelled does not ask for cancelled bookings');
  await place.getByRole('tab', { name: 'Upcoming' }).click();

  // The drawer: non-modal, beside the list, with the booking's history.
  await place.locator('ds-row[data-booking="RAFT01"]').click();
  const drawer = place.locator('dialog.place-drawer[open]');
  await drawer.getByText('Paid 900,00', { exact: false }).waitFor();
  if (await drawer.evaluate(dialog => dialog.matches(':modal'))) throw Error('The booking opens in a modal');
  if (!(await drawer.locator('[data-ds-overlay="description"]').innerText()).includes('RAFT01')) throw Error('The drawer does not name the booking');
  await page.waitForTimeout(1000); await shot('booking');
  // A refund over what was paid is refused in place.
  const refund = drawer.locator('ds-input[aria-label="Refund"] input');
  if (await refund.inputValue() !== '800,00') throw Error('The suggested refund is not filled in: ' + await refund.inputValue());
  await refund.fill('2000');
  await drawer.getByRole('button', { name: 'Cancel and refund' }).click();
  await drawer.getByText(/At most 900,00/).first().waitFor();
  await refund.fill('800');
  await drawer.getByRole('button', { name: 'Cancel and refund' }).click();
  // Confirmed in place, never a centred modal; Keep it takes the question back.
  await drawer.getByText(/Cancel RAFT01 and refund 800,00\s?kr\., telling the guest\? This cannot be undone\./).waitFor();
  if (await page.locator('dialog:modal').count()) throw Error('The cancellation asks in a modal');
  await drawer.getByRole('button', { name: 'Keep it' }).click();
  if (calls.some(call => call.path.endsWith('/cancel'))) throw Error('Keep it cancelled the booking');
  await drawer.getByRole('button', { name: 'Cancel and refund' }).click();
  await drawer.getByRole('button', { name: 'Cancel the booking' }).click();
  await place.locator('dialog.place-drawer[open]').waitFor({ state: 'detached', timeout: 3000 }).catch(() => {});
  const cancelled = calls.find(call => call.path.endsWith('/cancel'));
  if (!cancelled || cancelled.body.refundMinor !== 80000 || cancelled.body.notify !== true) throw Error('The cancellation was not sent as confirmed: ' + JSON.stringify(cancelled));
  await place.locator('ds-row[data-booking="RAFT01"]').waitFor({ state: 'detached' });

  // Who can book: saved at once; a refusal puts it back and says why.
  const who = place.locator('ds-tabs[aria-label="Who can book"]');
  if (await who.locator('ds-button', { hasText: 'Owners only' }).getAttribute('aria-pressed') !== 'true') throw Error('Who can book does not show Owners only');
  await who.getByRole('button', { name: 'Off' }).click();
  await place.getByText(/Visitors cannot book on the site/).waitFor();
  if (settings.open !== 'off') throw Error('Who can book was not saved');
  fail.add('PUT booking-settings');
  await who.getByRole('button', { name: 'Everyone' }).click();
  await place.getByText(/Who can book was not changed/).waitFor();
  if (await who.locator('ds-button', { hasText: 'Off' }).getAttribute('aria-pressed') !== 'true' || settings.open !== 'off') throw Error('A refused change of who can book was not put back');

  // Try booking opens the site's own booking page in a tab of its own.
  const tryLink = place.locator('ds-button.place-try');
  if (await tryLink.getAttribute('href') !== 'https://cphraft.c9y.site/book/' || await tryLink.getAttribute('target') !== '_blank') throw Error('Try booking does not open the site\'s booking page');
  if (await page.locator('iframe[src*="/book/"]').count()) throw Error('Try booking frames the booking page');

  // Schedule: the offers' groups as tabs, a cell edited in place, saved, discarded and kept through a failed save.
  await place.getByRole('tab', { name: 'Schedule' }).click();
  const schedule = place.locator('consistency-bookings-schedule:not([hidden])');
  await schedule.locator('table.place-matrix').waitFor();
  const groups = await schedule.locator('ds-tabs[aria-label="Offers"] [role="tab"]').allInnerTexts();
  if (groups.map(each => each.trim()).join() !== 'Green raft,Blue raft stay') throw Error('The offers\' groups: ' + groups.join());
  const mon = () => schedule.locator('tr[data-offer="green-1"] button[data-key="green-1:mon"]');
  await shot('schedule');
  if ((await mon().innerText()).trim() !== '10 12') throw Error('A day\'s times are not written compactly: ' + await mon().innerText());
  await mon().click();
  const input = schedule.locator('input.place-cell__input');
  await input.fill('9:30, 14');
  await input.press('Enter');
  if ((await mon().innerText()).trim() !== '9:30 14') throw Error('The edited times are not shown: ' + await mon().innerText());
  if (!(await mon().evaluate(button => button.parentElement.hasAttribute('data-changed')))) throw Error('An unsaved cell is not marked');
  await schedule.getByText('1 offer changed').waitFor();
  // Words that are not times stay red and keep Save from sending.
  await schedule.locator('button[data-key="green-2:tue"]').click();
  await input.fill('25');
  await input.press('Enter');
  await schedule.getByText(/“25” is not a time/).waitFor();
  if (!(await schedule.getByRole('button', { name: 'Save', exact: true }).evaluate(button => button.disabled))) throw Error('Save is open with words that cannot be read');
  await input.press('Escape');
  // A failed save keeps the drafts and says why.
  fail.add('PUT booking-offers');
  await schedule.getByRole('button', { name: 'Save', exact: true }).click();
  await schedule.getByText(/Not saved: the site answered/).waitFor();
  if ((await mon().innerText()).trim() !== '9:30 14') throw Error('A failed save lost the draft');
  // Coming back to the window keeps the draft too.
  await page.evaluate(() => dispatchEvent(new Event('focus')));
  await page.waitForTimeout(300);
  if ((await mon().innerText()).trim() !== '9:30 14') throw Error('Reading again lost the draft');
  await schedule.getByRole('button', { name: 'Save', exact: true }).click();
  await schedule.getByText('1 offer changed').waitFor({ state: 'detached' });
  const saved = calls.filter(call => call.method === 'PUT' && call.path === 'booking-offers').pop();
  if (saved.body.offers.length !== 1 || saved.body.offers[0].id !== 'green-1' || saved.body.offers[0].weekly.mon.join() !== '09:30,14:00') throw Error('Save did not send the changed offer: ' + JSON.stringify(saved.body));
  // Discard takes an edit back.
  await schedule.locator('button[data-key="green-2:sat"]').click();
  await input.fill('');
  await input.press('Enter');
  await schedule.getByText('1 offer changed').waitFor();
  await schedule.getByRole('button', { name: 'Discard' }).click();
  if ((await schedule.locator('button[data-key="green-2:sat"]').innerText()).trim() !== '10') throw Error('Discard did not take the edit back');
  // The row's ⋯ copies another row's week.
  await schedule.getByRole('button', { name: 'More for Green raft 2' }).click();
  await page.locator('ds-select[aria-label="More for Green raft 2"] ds-button[menu-item]', { hasText: /^\s*1\s*$/ }).click();
  if ((await schedule.locator('button[data-key="green-2:mon"]').innerText()).trim() !== '9:30 14') throw Error('Same times as did not copy the week');
  await schedule.getByRole('button', { name: 'Discard' }).click();
  await place.getByRole('tab', { name: 'Upcoming' }).click();
  await place.locator('ds-row[data-booking="RAFT02"]').waitFor();
  await place.getByRole('tab', { name: 'Schedule' }).click();
  if (await schedule.locator('table.place-matrix').count() !== 1) throw Error('Schedule did not stay in the page');

  // Gift cards: Active, Used and All.
  await places.getByText('Gift cards', { exact: true }).click();
  const gifts = page.locator('consistency-place-giftcards:not([hidden])');
  await gifts.locator('ds-row[data-card="RAFT-AAAA-BBBB"]').waitFor();
  const active = await gifts.locator('ds-row[data-card="RAFT-AAAA-BBBB"]').innerText();
  for (const words of ['RAFT-AAAA-BBBB', 'Recipient 1', 'Active']) if (!active.includes(words)) throw Error(`The card's row lacks ${words}: ${active}`);
  if (!/200,00\s?kr\. of 500,00\s?kr\./.test(active.replace(/\s+/g, ' '))) throw Error('The card\'s balance is not shown: ' + active);
  if (await gifts.locator('ds-row[data-card="RAFT-CCCC-DDDD"]').count()) throw Error('Active shows a used card');
  if (await gifts.locator('ds-row[data-card="RAFT-AAAA-BBBB"] code').evaluate(code => getComputedStyle(code).fontFamily).then(face => !/iosevka|mono/i.test(face))) throw Error('The code is not in the code face');
  await gifts.getByRole('tab', { name: 'Used' }).click();
  await gifts.locator('ds-row[data-card="RAFT-CCCC-DDDD"]').waitFor();
  await gifts.getByRole('tab', { name: 'All' }).click();
  if (await gifts.locator('ds-row.place-card').count() !== 3) throw Error('All does not show every card');
  await gifts.getByRole('tab', { name: 'Active' }).click();

  // The card's drawer: its uses, the PDF, Resend and Void confirmed in place.
  await gifts.locator('ds-row[data-card="RAFT-AAAA-BBBB"]').click();
  const cardDrawer = gifts.locator('dialog.place-drawer[open]');
  await cardDrawer.getByText('Sent to r1@example.com').waitFor();
  if (!(await cardDrawer.innerText()).includes('RAFT01')) throw Error('The card\'s uses are not shown');
  if (await cardDrawer.evaluate(dialog => dialog.matches(':modal'))) throw Error('The card opens in a modal');
  await page.waitForTimeout(1000); await shot('card');
  const pdf = await cardDrawer.locator('ds-button', { hasText: 'View the PDF' }).getAttribute('href');
  if (pdf !== `/api/consistency/sites/10VNDG/api/giftcards/${uuid(101)}/pdf`) throw Error('The PDF is not the site\'s: ' + pdf);
  const address = cardDrawer.locator('ds-input[aria-label="Send it to"] input');
  if (await address.inputValue() !== 'r1@example.com') throw Error('Resend does not offer the address it last went to');
  await address.fill('other@example.com');
  await cardDrawer.getByRole('button', { name: 'Resend' }).click();
  await cardDrawer.getByText('Send RAFT-AAAA-BBBB to other@example.com again, with the PDF?').waitFor();
  await cardDrawer.getByRole('button', { name: 'Send it' }).click();
  await page.waitForFunction(() => true);
  await gifts.getByText('Send RAFT-AAAA-BBBB to other@example.com again', { exact: false }).waitFor({ state: 'detached' });
  if (calls.filter(call => call.path.endsWith('/resend')).pop()?.body?.to !== 'other@example.com') throw Error('Resend was not sent to the address confirmed');
  await cardDrawer.getByRole('button', { name: 'Void', exact: true }).click();
  await cardDrawer.getByText(/Void RAFT-AAAA-BBBB\? Its balance of 200,00\s?kr\. can no longer be used\./).waitFor();
  await cardDrawer.getByRole('button', { name: 'Keep it' }).click();
  if (calls.some(call => call.path.endsWith('/void'))) throw Error('Keep it voided the card');
  await cardDrawer.getByRole('button', { name: 'Void', exact: true }).click();
  await cardDrawer.getByRole('button', { name: 'Void the card' }).click();
  await gifts.locator('ds-row[data-card="RAFT-AAAA-BBBB"]').waitFor({ state: 'detached' });
  if (!calls.some(call => call.method === 'POST' && call.path === `giftcards/${uuid(101)}/void`)) throw Error('Void was not sent');

  // Issue a card: checked in place, then sent and opened.
  await gifts.getByRole('button', { name: 'Issue a card' }).click();
  const issue = gifts.locator('dialog.place-drawer[open]');
  await issue.getByRole('heading', { name: 'Issue a card' }).waitFor();
  await issue.locator('ds-input[aria-label="Amount in DKK"] input').fill('500,50');
  await issue.getByRole('button', { name: 'Issue', exact: true }).click();
  await issue.getByText('Write the amount in whole kroner, without øre.').waitFor();
  await issue.locator('ds-input[aria-label="Amount in DKK"] input').fill('500');
  await issue.locator('ds-input[aria-label="Recipient’s name"] input').fill('Maja');
  await issue.locator('ds-input[aria-label="Recipient’s email"] input').fill('maja@example.com');
  await issue.getByRole('button', { name: 'Issue', exact: true }).click();
  await gifts.locator('ds-row[data-card="RAFT-NEW0-CARD"]').waitFor();
  const issued = calls.find(call => call.method === 'POST' && call.path === 'giftcards');
  if (issued?.body.amount !== 50000 || issued.body.recipient.email !== 'maja@example.com' || issued.body.sendTo !== 'maja@example.com') throw Error('The card was not issued as written: ' + JSON.stringify(issued));
  await gifts.locator('dialog.place-drawer[open]').getByText('Issued by').waitFor();

  for (const width of [390, 1440]) { await page.setViewportSize({ width, height: 900 }); await page.waitForTimeout(100); if (await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)) throw Error(`The places overflow at ${width}`); }
  if (errors.length) throw Error('The page threw: ' + errors.join('; '));
  console.log('CPH Raft\'s Bookings (lists by day, filters, drawer, cancel confirmed in place, who can book, try booking, schedule edited, saved, discarded and kept through a failed save) and Gift cards (tabs, drawer, PDF, resend and void confirmed in place, issue a card) passed');
} finally { await browser.close(); await new Promise(done => server.close(done)); }
