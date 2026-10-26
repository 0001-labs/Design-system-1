// Flavo's own places in Consistency's app (Flavo's `places` export, taken into `src/sites/flavo/`): the menus under
// Flavo's name, Produkter's list and filters, a product edited and saved in its drawer, published at once and put back
// when refused, a failed save that keeps what was typed, closing with unsaved changes asked in place, Udlejning as the
// rental products alone, Flavo team's members and a role saved, Kunder with Link, and Designretning's choice saved and
// put back when refused. Every gateway answer is a stand-in: `api/business` the business store, `api/design` Flavo's.
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

const product = (id, title, extra = {}) => ({
  _id: id, sourceId: `flavo-${id}`, slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'), title, category: 'Vases', material: 'Glas', description: '',
  images: [`/media/site/${id}.webp`], price: 450, quantity: 3, published: true, updatedAt: 1, ...extra,
});
let products = [
  product('p1', 'Blue vase', { productType: 'sale', homepageSlot: 1 }),
  product('p2', 'Linen cloth', { category: 'Fabric', material: 'Hør', price: null, quantity: null, published: false }),
  product('p3', 'Poster', { productType: 'poster', category: 'Posters' }),
];
let members = [
  { _id: 'm1', name: 'Ida Hansen', company: 'Flavo', phone: '+45 1', cvr: '', roles: ['editor'] },
  { _id: 'm2', name: 'Ole Berg', company: 'Studio Nord', phone: '', cvr: '12345678', roles: [] },
];
let design = 'gallery';
const designs = [
  { id: 'gallery', name: 'Gallery', description: 'Hvidt lærred.', image: '/media/concepts/vase-blue.png', color: '#ffffff' },
  { id: 'studio', name: 'Flower studio', description: 'Flavos gule farve.', image: '/media/site/a.webp', color: '#f2d81c' },
  { id: 'portfolio', name: 'Portfolio', description: 'Store fotografier.', image: '/media/site/b.webp', color: '#eeeeee' },
];
const calls = [];
const fail = new Set();

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('https://flavo.c9y.site/**', route => route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Flavo</title>' }));
  await page.route('**/api/consistency/profile', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ companyName: '0001' }) }));
  await page.route('**/api/consistency/sites', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ sites: [{ code: '92KTNN', name: 'Flavo', url: 'https://flavo.c9y.site/' }] }) }));
  await page.route('**/api/consistency/sites/*/pages', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ pages: [] }) }));
  await page.route('**/api/consistency/sites/*/places', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ places: [
    { id: 'pages', label: 'Pages' }, { id: 'orders', label: 'Orders' }, { id: 'products', label: 'Produkter' }, { id: 'rentals', label: 'Udlejning' }, { id: 'clients', label: 'Kunder' },
    { id: 'projects', label: 'Projekter' }, { id: 'content', label: 'Indhold' }, { id: 'media', label: 'Medier' }, { id: 'team', label: 'Flavo team' }, { id: 'profile', label: 'Profil' }, { id: 'layout', label: 'Designretning' },
  ] }) }));
  await page.route('**/api/consistency/sites/92KTNN/api/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname.split('/api/').pop();
    const body = request.postData() ? JSON.parse(request.postData()) : null;
    const json = (value, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(value) });
    if (path === 'design') {
      calls.push({ method: request.method(), path, body });
      if (request.method() === 'PUT') {
        if (fail.has('design')) { fail.delete('design'); return json({ error: 'owner-required' }, 403); }
        design = body.design;
      }
      return json({ design, designs });
    }
    if (path !== 'business' || request.method() !== 'POST') return json({ error: 'unknown' }, 404);
    const { operation, args } = body;
    calls.push({ operation, args });
    if (fail.has(operation)) { fail.delete(operation); return json({ error: 'Adressen eller placeringen findes allerede.' }, 400); }
    const value = (() => {
      switch (operation) {
        case 'catalogue:staffList': return { page: products, isDone: true, continueCursor: String(products.length) };
        case 'notionSync:status': return { configured: true, status: 'idle', lastSuccess: Date.UTC(2026, 9, 26, 8) };
        case 'notionSync:requestSync': return null;
        case 'catalogue:inventory': return { box: 'K3', location: 'Lager', notes: '', lending: '' };
        case 'catalogue:setPublished': products = products.map(each => each._id === args.id ? { ...each, published: args.published } : each); return null;
        case 'catalogue:save': {
          const id = args.id ?? `p${products.length + 1}`;
          products = args.id ? products.map(each => each._id === id ? { ...each, ...args.data } : each) : [{ ...args.data, _id: id }, ...products];
          return id;
        }
        case 'catalogue:pages': return [{ _id: 'c1', path: '/om', title: 'Om Flavo', text: 'Hej', images: [], published: true, updatedAt: 1 }, { _id: 'c2', path: '/projekter/hotel', title: 'Hotel', text: '', images: [], published: false, updatedAt: 1 }];
        case 'accounts:members': return members;
        case 'accounts:me': return { email: 'jaa90@icloud.com', roles: ['admin', 'editor'], profile: null, flags: { 'flavo-profile-flags': true } };
        case 'accounts:setRoles': members = members.map(each => each._id === args.id ? { ...each, roles: args.roles } : each); return null;
        case 'link:connection': return { status: 'off' };
        default: return null;
      }
    })();
    return json({ value });
  });

  await page.goto(`http://127.0.0.1:${server.address().port}/private-consistency/home.html?open=92KTNN`);
  const sidebar = page.locator('consistency-home ds-sidebar.home-places');
  for (const menu of ['Produkter', 'Udlejning', 'Kunder', 'Projekter', 'Indhold', 'Medier', 'Flavo team', 'Profil', 'Designretning', 'Orders'])
    await sidebar.getByText(menu, { exact: true }).waitFor();
  if (await sidebar.getByText('Forespørgsler', { exact: true }).count()) throw Error('Requests have a menu of their own beside Orders');

  // Produkter: the catalogue, newest first as the store gives it, filtered; the Notion line; no reload button.
  await sidebar.getByText('Produkter', { exact: true }).click();
  const products$ = page.locator('flavo-place-products:not([hidden])');
  await products$.locator('ds-row[data-product="flavo-p1"]').waitFor();
  if (await products$.locator('ds-row.flavo-product').count() !== 3) throw Error('Produkter does not list every product');
  const first = await products$.locator('ds-row[data-product="flavo-p1"]').innerText();
  for (const words of ['Blue vase', 'Salg · Forside 1', 'Vaser', 'Udgivet']) if (!first.includes(words)) throw Error(`A product's row lacks ${words}: ${first}`);
  if (!(await products$.locator('ds-row[data-product="flavo-p2"]').innerText()).includes('Skal bekræftes')) throw Error('An unknown quantity is not shown as to be confirmed');
  await products$.getByText(/Senest synkroniseret/).waitFor();
  const shot = async name => { if (process.env.FLAVO_SHOT) await page.screenshot({ path: `${process.env.FLAVO_SHOT}-${name}.png` }); };
  await shot('products');
  if (await page.getByRole('button', { name: /^(Reload|Refresh|Opdater)$/ }).count()) throw Error('A reload button is shown');
  await products$.locator('ds-select select[aria-label="Visning"]').selectOption('draft');
  if (await products$.locator('ds-row.flavo-product').count() !== 1) throw Error('The visibility filter does not filter');
  await products$.locator('ds-select select[aria-label="Visning"]').selectOption('all');

  // A product in its drawer: the fields edited and saved; the list follows.
  await products$.locator('ds-row[data-product="flavo-p1"]').click();
  const drawer = products$.locator('dialog.place-drawer');
  await drawer.getByRole('heading', { name: 'Blue vase' }).waitFor();
  if (process.env.FLAVO_SHOT) await page.waitForTimeout(500);
  await shot('product');
  const field = label => drawer.locator(`ds-input[aria-label="${label}"]`);
  await field('Titel').locator('input').fill('Blue vase, large');
  await field('Pris i DKK (tom = forespørgsel)').locator('input').fill('525,5');
  await drawer.getByRole('button', { name: 'Gem produkt' }).click();
  await page.getByText('Produktet er gemt.').waitFor();
  const saved = calls.findLast(call => call.operation === 'catalogue:save');
  if (saved?.args.id !== 'p1' || saved.args.data.title !== 'Blue vase, large' || saved.args.data.price !== 525.5 || saved.args.data.homepageSlot !== 1) throw Error('The product was not saved as typed: ' + JSON.stringify(saved));
  await products$.locator('ds-row[data-product="flavo-p1"]', { hasText: 'Blue vase, large' }).waitFor();

  // A failed save keeps what was typed and says why.
  fail.add('catalogue:save');
  await field('Adresse').locator('input').fill('blue-vase-xl');
  await drawer.getByRole('button', { name: 'Gem produkt' }).click();
  await drawer.getByText('Adressen eller placeringen findes allerede.').waitFor();
  if (await field('Adresse').evaluate(input => input.value) !== 'blue-vase-xl') throw Error('A failed save did not keep what was typed');

  // Closing with unsaved changes asks in place; staying keeps them.
  await drawer.getByRole('button', { name: 'Luk' }).click();
  await drawer.getByText('Du har ændringer, der ikke er gemt. Vil du forlade produktet?').waitFor();
  await drawer.getByRole('button', { name: 'Bliv' }).click();
  if (await field('Adresse').evaluate(input => input.value) !== 'blue-vase-xl') throw Error('Staying lost the unsaved changes');

  // Publishing is saved the moment it is chosen; a refusal puts the choice back and says why.
  await drawer.locator('select[aria-label="Vis på hjemmesiden"]').selectOption('draft');
  await page.getByText('Produktet er en kladde.').waitFor();
  if (!calls.some(call => call.operation === 'catalogue:setPublished' && call.args.id === 'p1' && call.args.published === false)) throw Error('Publishing was not saved');
  fail.add('catalogue:setPublished');
  await drawer.locator('select[aria-label="Vis på hjemmesiden"]').selectOption('published');
  await drawer.getByText('Adressen eller placeringen findes allerede.').waitFor();
  if (await drawer.locator('select[aria-label="Vis på hjemmesiden"]').inputValue() !== 'draft') throw Error('A refused publish was not put back');

  // The internal stock, staff only, and the pictures' order; uploads are not offered from the app.
  await drawer.getByRole('tab', { name: 'Internt lager' }).click();
  await drawer.locator('ds-input[aria-label="Kasse"]').waitFor();
  if (await drawer.locator('ds-input[aria-label="Kasse"]').evaluate(input => input.value) !== 'K3') throw Error('The internal stock was not read');
  await drawer.getByRole('tab', { name: 'Billeder' }).click();
  await drawer.getByText(/Nye billeder uploades ikke herfra endnu/).waitFor();
  if (!(await drawer.locator('.flavo-gallery img').first().getAttribute('src')).startsWith('https://flavo.c9y.site/media/site/')) throw Error('A picture is not read from the site\'s address');
  await drawer.getByRole('button', { name: 'Luk' }).click();
  await drawer.getByRole('button', { name: 'Kassér ændringer' }).click();
  await drawer.getByRole('heading').waitFor({ state: 'detached' });

  // Udlejning: the rental products alone.
  await sidebar.getByText('Udlejning', { exact: true }).click();
  const rentals = page.locator('flavo-place-products:not([hidden])');
  await rentals.locator('ds-row[data-product="flavo-p2"]').waitFor();
  if (await rentals.locator('ds-row.flavo-product').count() !== 1) throw Error('Udlejning shows more than the rental products');

  // Flavo team: the members with a role; a role saved.
  await sidebar.getByText('Flavo team', { exact: true }).click();
  const team = page.locator('flavo-place-members:not([hidden])');
  await team.locator('ds-row[data-member="m1"]').waitFor();
  if (await team.locator('ds-row.flavo-member').count() !== 1) throw Error('Flavo team shows a client');
  await team.locator('ds-row[data-member="m1"]').click();
  await team.locator('input[data-role="admin"]').check();
  await team.getByRole('button', { name: 'Gem adgang' }).click();
  await page.getByText('Adgangen er gemt.').waitFor();
  if (!calls.some(call => call.operation === 'accounts:setRoles' && call.args.id === 'm1' && call.args.roles.join() === 'editor,admin')) throw Error('The roles were not saved');
  await team.getByRole('button', { name: 'Luk' }).click();

  // Kunder: the accounts without a role, and Link.
  await sidebar.getByText('Kunder', { exact: true }).click();
  const clients = page.locator('flavo-place-members:not([hidden])');
  await clients.locator('ds-row[data-member="m2"]').waitFor();
  await clients.getByRole('button', { name: 'Forbind Link' }).waitFor();
  await clients.getByRole('button', { name: 'Ny kunde' }).waitFor();
  await shot('clients');

  // Designretning: the choice saved; a refusal keeps the design the site uses.
  await sidebar.getByText('Designretning', { exact: true }).click();
  const layout = page.locator('flavo-place-design:not([hidden])');
  await layout.locator('button[data-design="studio"]').click();
  if (!(await layout.locator('iframe').getAttribute('src')).endsWith('/design-preview/studio?ph=out')) throw Error('The preview does not follow the choice');
  await shot('layout');
  await layout.getByRole('button', { name: 'Brug design' }).click();
  await page.getByText('Flower studio bruges nu på hjemmesiden.').waitFor();
  if (design !== 'studio') throw Error('The design was not saved');
  fail.add('design');
  await layout.locator('button[data-design="portfolio"]').click();
  await layout.getByRole('button', { name: 'Brug design' }).click();
  await layout.getByText('Log ind med System igen for at fortsætte.').waitFor();
  if (design !== 'studio' || !(await layout.locator('button[data-design="studio"]').innerText()).includes('Bruges nu')) throw Error('A refused design choice was not kept as it was');

  // Indhold and Profil draw from the store too.
  await sidebar.getByText('Indhold', { exact: true }).click();
  await page.locator('flavo-place-pages:not([hidden]) ds-row[data-page="/om"]').waitFor();
  await sidebar.getByText('Profil', { exact: true }).click();
  await page.locator('flavo-place-profile:not([hidden]) ds-input[aria-label="E-mail"]').waitFor();

  for (const width of [390, 1440]) { await page.setViewportSize({ width, height: 900 }); await page.waitForTimeout(100); if (await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)) throw Error(`The place overflows at ${width}`); }
  if (errors.length) throw Error('The page threw: ' + errors.join('; '));
  console.log('Flavo\'s places (the menus, Produkter listed, filtered, edited, saved, published and put back, a failed save kept, unsaved changes asked about, Udlejning, Flavo team\'s roles, Kunder with Link, Designretning saved and kept when refused, Indhold, Profil) passed');
} finally { await browser.close(); await new Promise(done => server.close(done)); }
