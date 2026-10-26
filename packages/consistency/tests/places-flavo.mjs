// Flavo's own places in Consistency's app (Flavo's `places` export, taken into `src/sites/flavo/`): the menus under
// Flavo's name, Produkter's list and filters, a product edited and saved in its drawer, published at once and put back
// when refused, a failed save that keeps what was typed, closing with unsaved changes asked in place, Udlejning as the
// rental products alone, Flavo team's members and a role saved, Kunder with Link, and Flavo's content and project pages
// under the shared Pages (the `flavo` page source), edited and saved there; no Projekter, Indhold or Designretning.
// Every gateway answer is a stand-in: `api/business` the business store, `api/pages` the site engine's pages.
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
let contentPages = [
  { _id: 'c2', path: '/projekter/hotel', title: 'Hotel', text: '', images: ['/media/site/hotel.webp'], published: false, updatedAt: 1 },
  { _id: 'c1', path: '/om', title: 'Om Flavo', text: 'Hej', images: [], published: true, updatedAt: 1 },
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
  // The owner's one workspace, which holds the site (the app shows a workspace's sites only).
  await page.route('**/api/consistency/workspaces', route => route.fulfill({ json: { owner: true, workspaces: [{ code: '01STDO', name: '0001', plan: 'free', role: 'owner', sites: 1, siteCodes: ['92KTNN'], limits: { sites: 10, customDomains: true } }] } }));
  await page.route('**/api/consistency/sites', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ sites: [{ code: '92KTNN', name: 'Flavo', url: 'https://flavo.c9y.site/' }] }) }));
  await page.route('**/api/consistency/sites/*/places', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ places: [
    // As the platform gives them: Flavo's pages come under Pages from the `flavo` source; Flavo team and Profil are kept
    // here to test their elements, which Flavo still exports.
    { id: 'pages', label: 'Pages', sources: ['flavo'] }, { id: 'orders', label: 'Orders' }, { id: 'products', label: 'Produkter' }, { id: 'rentals', label: 'Udlejning' }, { id: 'clients', label: 'Kunder' },
    { id: 'media', label: 'Medier' }, { id: 'team', label: 'Flavo team' }, { id: 'profile', label: 'Profil' },
  ] }) }));
  await page.route('**/api/consistency/sites/92KTNN/api/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname.split('/api/').pop();
    const body = request.postData() ? JSON.parse(request.postData()) : null;
    const json = (value, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(value) });
    // The site engine's pages: Flavo's homepage alone, Gallery.
    if (path === 'pages') return json({ site: 'Flavo', pages: [{ path: '/shop', lang: 'da', title: 'Blomster i København', fields: 7, edited: 0 }], images: [] });
    if (path.startsWith('page')) return json({ path: '/shop', lang: 'da', title: 'Blomster i København', fields: [] });
    if (path === 'detached') return json({ edits: [] });
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
        case 'catalogue:pages': return contentPages;
        case 'catalogue:savePage': contentPages = contentPages.map(each => each._id === args.id ? { ...each, ...args.data } : each); return null;
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
  for (const menu of ['Pages', 'Produkter', 'Udlejning', 'Kunder', 'Medier', 'Flavo team', 'Profil', 'Orders'])
    await sidebar.getByText(menu, { exact: true }).waitFor();
  if (await sidebar.getByText('Forespørgsler', { exact: true }).count()) throw Error('Requests have a menu of their own beside Orders');
  for (const gone of ['Projekter', 'Indhold', 'Designretning']) if (await sidebar.getByText(gone, { exact: true }).count()) throw Error(`${gone} is still a menu`);

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

  // Pages: the homepage, then Flavo's content and project pages, each with its address; a page edited in the middle,
  // saved, a failed save kept, words typed kept while another page is chosen.
  await sidebar.getByText('Pages', { exact: true }).click();
  const pages = page.locator('consistency-place-pages:not([hidden])');
  const rows = pages.locator('.place-pages-list > ds-row');
  await pages.locator('ds-row[data-source="flavo"][data-path="/projekter/hotel"]').waitFor();
  if ((await rows.evaluateAll(each => each.map(row => row.dataset.path))).join() !== '/shop,/om,/projekter/hotel') throw Error('Pages does not list the homepage, then the content and project pages');
  if (!(await pages.locator('ds-row[data-path="/projekter/hotel"]').innerText()).includes('Skjult')) throw Error('A hidden page is not marked');
  await pages.locator('ds-row[data-path="/om"]').click();
  const editor = pages.locator('.place-pages-page flavo-page-editor');
  await editor.locator('a.ds-link', { hasText: '/om' }).waitFor();
  if (await editor.locator('a.ds-link').getAttribute('href') !== 'https://flavo.c9y.site/om') throw Error('The page\'s address is not on the site');
  await editor.locator('ds-input[aria-label="Titel"] input').fill('Om Flavo og os');
  await pages.locator('ds-row[data-path="/projekter/hotel"]').click();
  await pages.locator('.place-pages-page flavo-page-editor img').waitFor();
  await pages.locator('ds-row[data-path="/om"]').click();
  if (await editor.locator('ds-input[aria-label="Titel"]').evaluate(input => input.value) !== 'Om Flavo og os') throw Error('Words typed were lost when another page was chosen');
  await shot('pages');
  fail.add('catalogue:savePage');
  await editor.getByRole('button', { name: 'Gem side' }).click();
  await editor.getByText('Adressen eller placeringen findes allerede.').waitFor();
  if (await editor.locator('ds-input[aria-label="Titel"]').evaluate(input => input.value) !== 'Om Flavo og os') throw Error('A failed save did not keep what was typed');
  const listed = calls.filter(call => call.operation === 'catalogue:pages').length;
  await editor.getByRole('button', { name: 'Gem side' }).click();
  await page.getByText('Siden er gemt.').waitFor();
  const savedPage = calls.findLast(call => call.operation === 'catalogue:savePage');
  if (savedPage?.args.id !== 'c1' || savedPage.args.data.title !== 'Om Flavo og os' || savedPage.args.data.path !== '/om') throw Error('The page was not saved as typed: ' + JSON.stringify(savedPage));
  await pages.locator('ds-row[data-path="/om"]', { hasText: 'Om Flavo og os' }).waitFor();
  if (calls.filter(call => call.operation === 'catalogue:pages').length <= listed) throw Error('A save did not read the pages again');
  await pages.locator('ds-row[data-path="/shop"]').click();
  await pages.locator('.place-details').waitFor();

  await sidebar.getByText('Profil', { exact: true }).click();
  await page.locator('flavo-place-profile:not([hidden]) ds-input[aria-label="E-mail"]').waitFor();

  for (const width of [390, 1440]) { await page.setViewportSize({ width, height: 900 }); await page.waitForTimeout(100); if (await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)) throw Error(`The place overflows at ${width}`); }
  if (errors.length) throw Error('The page threw: ' + errors.join('; '));
  console.log('Flavo\'s places (the menus, Produkter listed, filtered, edited, saved, published and put back, a failed save kept, unsaved changes asked about, Udlejning, Flavo team\'s roles, Kunder with Link, Flavo\'s content and project pages under Pages edited and saved, Profil) passed');
} finally { await browser.close(); await new Promise(done => server.close(done)); }
