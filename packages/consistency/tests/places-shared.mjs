// An open site's shared places in Consistency's app: Pages (the list, the chosen page's details, its title and
// description edited in place, a failed save putting the words back, the share image, Edit on the canvas, and a site's
// own pages from the page source its Pages place names, after the site engine's, edited by the source's editor), Emails
// (Sent and How they look as tabs, the non-modal drawer, the email in a sandboxed frame) and Design (the site's pages
// read through the gateway's sandboxed document route). Every gateway answer is a stand-in.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname } from 'node:path';
import { chromium, webkit } from 'playwright';
const root = fileURLToPath(new URL('../../../website/dist/', import.meta.url));
const server = createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const file = resolve(root, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
  if (!file.startsWith(root)) { response.writeHead(403).end(); return; }
  try { const body = await readFile(file); response.setHeader('content-type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html' })[extname(file)] ?? 'application/octet-stream'); response.end(body); }
  catch { response.writeHead(404).end(); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const fail = message => { throw new Error(message); };
// What a part says, its ds-text and ds-message words (drawn in their shadow) included.
const said = locator => locator.evaluate(element => `${element.innerText} ${[...element.querySelectorAll('ds-text, ds-message')].map(text => `${text.getAttribute('heading') ?? ''} ${text.getAttribute('text') ?? ''}`).join(' ')}`);
const POLICY = "sandbox allow-same-origin allow-scripts; default-src 'none'; script-src 'none'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; media-src 'self' https:; frame-ancestors 'self'; form-action 'none'; base-uri 'none'";
const CODE = '10VNDG';
const TITLE = '111111111111', DESC = '222222222222', IMAGE = '333333333333', H1 = '444444444444';
const pages = [
  { path: '/', lang: 'da', title: 'Forside | CPH Raft', fields: 4, edited: 0 },
  { path: '/blueraft/', lang: 'da', title: 'Blå Raft - CPH Raft', fields: 4, edited: 2, lastEdit: { editor: 'jaa90@icloud.com', at: Date.UTC(2026, 9, 20, 9) } },
  { path: '/en/', lang: 'en', title: 'Home | CPH Raft', fields: 4, edited: 0 },
  { path: '/en/blueraft/', lang: 'en', title: 'Blue Raft | CPH Raft', fields: 4, edited: 1 },
];
// The edits saved, kept as the site engine keeps them: a page read again has its words saved since.
const saved = new Map();
const fields = path => {
  const page = pages.find(each => each.path === path);
  return [
    { key: TITLE, tag: 'title', kind: 'meta', label: 'Title', markdown: page.title, edited: false, lastEdit: null },
    { key: DESC, tag: 'meta', kind: 'meta', label: 'Description', markdown: `About ${page.title}`, edited: false, lastEdit: null },
    { key: IMAGE, tag: 'image', kind: 'image', label: 'Share image', markdown: '/photos/a.jpg', edited: false, lastEdit: null },
    { key: H1, tag: 'h1', kind: 'text', label: 'h1', markdown: 'Hej', edited: path === '/en/blueraft/', lastEdit: null },
  ].map(field => (saved.has(`${path} ${field.key}`) ? { ...field, markdown: saved.get(`${path} ${field.key}`), edited: true } : field));
};
const documentOf = path => `<!doctype html><html><head><title>${path}</title><link rel="stylesheet" href="/api/consistency/sites/${CODE}/files/site.css"></head>
  <body><h1 data-cms="${H1}">Hej</h1><p class="accent">Book a raft</p><a class="ds-button" href="https://cphraft.c9y.site/book/">Book</a>
  <script>document.body.style.color = '#ff0000'; document.body.dataset.ran = 1</script></body></html>`;
const SITE_CSS = ':root{--ds-paper:#ffffff;--ds-text-color:#2a2a2a;--ds-accent-color:#594dff;--site-ink:#2a2a2a;--ds-unit:20px;--ds-radius:4px;--ds-typeface-regular:Georgia}body{margin:0;background:#ffffff;color:#2a2a2a}.accent{color:#594dff}';
const emails = [
  { id: 'e1', at: Date.now() - 60_000, kind: 'booking-confirmation', to: 'ida@example.com', from: 'hej@cphraft.dk', subject: 'Your booking', related: 'b1', status: 'sent', error: null, attachments: [] },
  { id: 'e2', at: Date.now() - 120_000, kind: 'gift-card', to: 'bo@example.com', from: 'hej@cphraft.dk', subject: 'A gift card', related: 'g1', status: 'failed', error: 'The address bounced.', attachments: [{ filename: 'gift.pdf', contentType: 'application/pdf', size: 41_200 }] },
];
const browser = await (process.env.PLACES_BROWSER === 'webkit' ? webkit : chromium).launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const edits = [], asked = [], sourced = [];
  let failNext = false, editableEmail = false, failEmailSave = false, delayEmailSave = 0;
  const emailWrites = [];
  let emailRevision = 0, emailSource = { subject: 'Enquiry from {{name}}', text: 'From {{email}}\n\n{{message}}' };
  const emailTemplate = () => ({ kind: 'form-inquiry', from: 'Forms <forms@example.com>', to: 'owner@example.com', subject: emailSource.subject.replace('{{name}}', 'Alex'), text: emailSource.text.replace('{{email}}', 'alex@example.com').replace('{{message}}', 'A new website'), html: '<pre>A new website</pre>', attachments: [], editing: { build: 'email-build', base: 'email-base', revision: emailRevision, document: { ...emailSource }, values: { name: 'Alex', email: 'alex@example.com', message: 'A new website' } } });
  await page.route('**/api/consistency/profile', route => route.fulfill({ json: { companyName: '0001' } }));
  // The owner's one workspace, which holds the site (the app shows a workspace's sites only).
  await page.route('**/api/consistency/workspaces', route => route.fulfill({ json: { owner: true, workspaces: [{ code: '01STDO', name: '0001', plan: 'free', role: 'owner', sites: 1, siteCodes: [CODE], limits: { sites: 10, customDomains: true } }] } }));
  await page.route('**/api/consistency/sites', route => route.fulfill({ json: { sites: [{ code: CODE, name: 'CPH Raft', url: 'https://cphraft.c9y.site/' }] } }));
  await page.route(`**/api/consistency/sites/${CODE}/**`, async route => {
    const request = route.request(), url = new URL(request.url()), what = url.pathname.split('/').slice(5).join('/'), path = url.searchParams.get('path');
    asked.push(`${request.method()} ${what}${url.search}`);
    // Pages names a page source (the only one registered is Flavo's) and one the app does not know, which is left out.
    if (what === 'places') return route.fulfill({ json: { places: [{ id: 'pages', label: 'Pages', sources: ['flavo', 'nowhere'] }, { id: 'emails', label: 'Emails' }, { id: 'design', label: 'Design' }] } });
    if (what === 'api/business') {
      const { operation } = request.postDataJSON();
      sourced.push(operation);
      if (operation === 'catalogue:pages') return route.fulfill({ json: { value: [{ _id: 'c1', path: '/om', title: 'Om os', text: 'Hej', images: [], published: false, updatedAt: 1 }] } });
      return route.fulfill({ status: 400, json: { error: 'unknown-operation' } });
    }
    if (what === 'pages' || what === 'api/pages') return route.fulfill({ json: { site: 'CPH Raft', pages, images: ['/photos/a.jpg', '/photos/b.jpg', 'https://evil.example/x.jpg'] } });
    if (what === 'page' || what === 'api/page') return route.fulfill({ json: { path, lang: pages.find(each => each.path === path).lang, title: 'CPH Raft', fields: fields(path) } });
    if (what === 'api/composition') return route.fulfill({ json: { path, build: 'site-build', base: 'page-source', revision: 0, document: { schema: 1, nodes: {}, order: {} }, nodes: [] } });
    if (what === 'api/detached') return route.fulfill({ json: { edits: [{ id: 9, path: '/gone/', key: 'x', markdown: 'Old **words**', editor: 'jaa90@icloud.com', at: Date.UTC(2026, 9, 1) }] } });
    if (what === 'api/edit') {
      const body = request.postDataJSON(); edits.push(body);
      if (failNext) { failNext = false; return route.fulfill({ status: 500, json: { error: 'broken' } }); }
      saved.set(`${body.path} ${body.key}`, body.markdown);
      return route.fulfill({ json: { html: body.markdown, edit: { markdown: body.markdown, editor: 'jaa90@icloud.com', at: Date.now() } } });
    }
    if (what === 'document') return route.fulfill({ body: documentOf(path), headers: { 'content-type': 'text/html; charset=utf-8', 'content-security-policy': POLICY } });
    if (what === 'files/site.css') return route.fulfill({ body: SITE_CSS, headers: { 'content-type': 'text/css' } });
    if (what.startsWith('files/photos/')) return route.fulfill({ body: Buffer.from('R0lGODlhAQABAAAAACw=', 'base64'), headers: { 'content-type': 'image/gif' } });
    if (what === 'api/emails') {
      const q = url.searchParams.get('q'), kind = url.searchParams.get('kind');
      return route.fulfill({ json: { kinds: ['booking-confirmation', 'gift-card'], emails: emails.filter(email => (!q || email.to.includes(q) || email.subject.includes(q)) && (!kind || email.kind === kind)), next: null } });
    }
    if (what === 'api/emails/templates') {
      const lang = url.searchParams.get('lang');
      if (editableEmail) return route.fulfill({ json: { lang, from: 'Forms <forms@example.com>', templates: [emailTemplate()] } });
      return route.fulfill({ json: { lang, from: 'hej@cphraft.dk', templates: [{ from: 'Forms <forms@example.com>', kind: 'booking-confirmation', to: 'ida@example.com', subject: lang === 'en' ? 'Your booking' : 'Din booking', text: 'Hej', html: '<p>Hej</p>', attachments: [] }] } });
    }
    if (what === 'api/emails/templates/form-inquiry') {
      if (request.method() === 'GET') return route.fulfill({ json: { template: emailTemplate() } });
      const input = request.postDataJSON(); emailWrites.push(input);
      if (delayEmailSave) await new Promise(done => setTimeout(done, delayEmailSave));
      if (failEmailSave) return route.fulfill({ status: 503, json: { error: 'unavailable' } });
      if (input.revision !== emailRevision || input.base !== 'email-base') return route.fulfill({ status: 409, json: { error: 'stale-email-template' } });
      emailSource = input.document; emailRevision++;
      return route.fulfill({ json: { template: emailTemplate() } });
    }
    if (what.startsWith('api/emails/')) {
      const email = emails.find(each => each.id === what.split('/')[2]);
      return route.fulfill({ json: { email: { ...email, html: `<p id="words">${email.subject}</p><script>document.body.dataset.ran=1</script>`, text: `${email.subject} as text` } } });
    }
    return route.fulfill({ status: 404, json: { error: 'not-found' } });
  });
  const home = `http://127.0.0.1:${server.address().port}/editor/home.html`;
  await page.goto(home);
  await page.locator('consistency-home ds-card', { hasText: 'CPH Raft' }).click();
  const sidebar = page.locator('consistency-home ds-sidebar.home-places');
  for (const label of ['Pages', 'Emails', 'Design']) await sidebar.getByText(label, { exact: true }).waitFor();

  if (!process.env.EMAILS_ONLY) {
  // Pages: a row per page across its languages, the first chosen, its details in the chosen language.
  await sidebar.getByText('Pages', { exact: true }).click();
  const place = page.locator('consistency-place-pages:not([hidden])');
  const rows = place.locator('.place-pages-list > ds-row');
  const engine = place.locator('.place-pages-list > ds-row:not([data-source])');
  await rows.nth(1).waitFor();
  if (await engine.count() !== 2) fail(`Expected two rows, got ${await engine.count()}`);
  if ((await engine.allInnerTexts()).map(text => text.split('\n')[0].trim()).join() !== 'Forside,Blå Raft') fail('The rows are not the short titles: ' + (await engine.allInnerTexts()).join(' / '));
  if ((await place.locator('ds-tabs[aria-label="Languages"] [role="tab"]').allInnerTexts()).map(text => text.trim()).join() !== 'Dansk,English') fail('The languages are not the tabs');
  if (await rows.first().getAttribute('current') === null) fail('The first page is not chosen');
  const words = key => place.locator(`.place-details__words[data-key="${key}"] [contenteditable]`);
  await words(TITLE).waitFor();
  if ((await words(TITLE).innerText()).trim() !== 'Forside | CPH Raft') fail('The title is not the front page\'s');
  if (!(await place.locator('.place-details__count').first().getAttribute('text'))?.startsWith('18 of 60')) fail('The title\'s length is not counted');
  if (await place.getByText('Open the page').count()) fail('Open the page is still in Pages');
  await place.locator('ds-table').waitFor();
  // Choosing a row only changes the details; English shows each page in English.
  await rows.nth(1).click();
  await page.waitForFunction(() => document.querySelector('consistency-place-pages .place-details__words [contenteditable]')?.textContent.trim() === 'Blå Raft - CPH Raft');
  if (!(await said(place.locator('.place-share__words'))).includes('cphraft.c9y.site')) fail('The share card has no host');
  await place.getByRole('tab', { name: 'English' }).click();
  await page.waitForFunction(() => document.querySelector('consistency-place-pages .place-details__words [contenteditable]')?.textContent.trim() === 'Blue Raft | CPH Raft');
  if (await rows.nth(1).getAttribute('data-path') !== '/en/blueraft/') fail('The row does not show the English address');

  // The title, edited in place: the share card follows as it is typed, Enter saves it.
  await words(TITLE).click(); await page.keyboard.press('ControlOrMeta+a'); await page.keyboard.type('Blue Raft, floating');
  await page.waitForFunction(() => document.querySelector('consistency-place-pages .place-share__title')?.getAttribute('text') === 'Blue Raft, floating');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.querySelector('consistency-place-pages .place-details__words[data-key="111111111111"]') && !document.activeElement?.closest('.place-details__words') || true);
  await page.waitForTimeout(200);
  if (JSON.stringify(edits.at(-1)) !== JSON.stringify({ path: '/en/blueraft/', key: TITLE, markdown: 'Blue Raft, floating' })) fail('The title was not saved: ' + JSON.stringify(edits.at(-1)));
  // Escape puts back the words saved last, and saves nothing.
  await words(DESC).click(); await page.keyboard.press('ControlOrMeta+a'); await page.keyboard.type('About Blue Raft, more');
  await page.keyboard.press('Escape');
  if ((await words(DESC).innerText()).trim() !== 'About Blue Raft | CPH Raft' || edits.length !== 1) fail('Escape did not put the description back: ' + JSON.stringify([await words(DESC).innerText(), edits]));
  // A failed save, on leaving the field, puts the saved words back and says why beside them.
  failNext = true;
  await words(DESC).click(); await page.keyboard.press('ControlOrMeta+a'); await page.keyboard.type('Broken words');
  await rows.first().click();
  await place.locator('.place-details ds-message[tone="danger"]').waitFor();
  if (edits.at(-1)?.markdown !== 'Broken words') fail('The description was not sent');
  if (!(await place.locator('.place-details ds-message[tone="danger"]').getAttribute('text')).startsWith('The description was not saved.')) fail('The failure is not in words');
  await rows.nth(1).click();
  await page.waitForFunction(() => document.querySelector('consistency-place-pages .place-details__words[data-key="222222222222"] [contenteditable]')?.textContent.trim() === 'About Blue Raft | CPH Raft');

  // The share image: Change opens a drawer beside the page, which stays usable; a picture pressed is saved.
  await place.getByRole('button', { name: 'Change' }).click();
  const drawer = place.locator('ds-overlay dialog[open]');
  await drawer.waitFor();
  if (await drawer.locator('.place-picker__image').count() !== 2) fail('The picker offers more than the site\'s own pictures');
  if (await page.evaluate(() => document.documentElement.style.overflow === 'hidden')) fail('The drawer holds the page\'s scroll');
  await drawer.locator('.place-picker__image[title="/photos/b.jpg"]').click();
  await drawer.waitFor({ state: 'detached' }).catch(() => {});
  await page.waitForFunction(() => !document.querySelector('consistency-place-pages ds-overlay dialog[open]'));
  if (JSON.stringify(edits.at(-1)) !== JSON.stringify({ path: '/en/blueraft/', key: IMAGE, markdown: '/photos/b.jpg' })) fail('The share image was not saved');

  if (process.env.PLACES_SHOT) await page.screenshot({ path: `${process.env.PLACES_SHOT}/pages.png` });

  // The site's own pages, after the site engine's, each with its address: the arrows reach them, and choosing one shows
  // its source's editor in the middle; its saving reads the rows again, and an engine row brings the details back.
  const own = place.locator('.place-pages-list > ds-row[data-source="flavo"]');
  await own.waitFor();
  if (await rows.count() !== 3 || await own.getAttribute('data-path') !== '/om' || await rows.nth(2).getAttribute('data-source') !== 'flavo') fail('The site\'s own page does not follow the site engine\'s');
  if (!(await said(own)).includes('/om') || !(await own.innerText()).includes('Skjult')) fail('The site\'s own page lacks its address or that it is hidden');
  await rows.nth(1).click();
  await rows.nth(1).press('ArrowDown');
  const editor = place.locator('.place-pages-page flavo-page-editor');
  await editor.waitFor();
  if (await own.getAttribute('current') === null || await rows.nth(1).getAttribute('current') !== null) fail('The arrow did not choose the site\'s own page');
  if (await place.locator('.place-pages-share .place-share').count()) fail('A share card shows beside the site\'s own page');
  // A source's editor saying it saved (`consistency-page-saved`; Flavo's save itself is in places-flavo.mjs) reads the rows again.
  const listed = sourced.filter(each => each === 'catalogue:pages').length;
  await editor.evaluate(element => element.dispatchEvent(new CustomEvent('consistency-page-saved', { detail: { path: '/om' }, bubbles: true, composed: true })));
  await page.waitForTimeout(300);
  if (sourced.filter(each => each === 'catalogue:pages').length <= listed) fail('A save did not read the rows again');
  await rows.nth(1).click();
  await place.locator('.place-details').waitFor();
  if (await editor.count()) fail('The source\'s editor stayed beside the site engine\'s page');
  // Data stays current: coming back to the window reads the pages again; no Reload button anywhere.
  const before = asked.filter(each => each === 'GET api/pages').length;
  await page.evaluate(() => dispatchEvent(new Event('focus')));
  await page.waitForTimeout(200);
  if (asked.filter(each => each === 'GET api/pages').length <= before) fail('Coming back did not read the pages again');
  if (await page.getByRole('button', { name: /^(Reload|Refresh)$/ }).count()) fail('A Reload button is shown');

  // Edit opens the page on the site's canvas; a double press does the same.
  await place.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.locator('consistency-home consistency-site-editor:not([hidden])').waitFor();
  await page.waitForFunction(() => document.querySelector('consistency-site-editor iframe')?.getAttribute('src')?.includes('%2Fen%2Fblueraft%2F'));
  if (await page.locator('consistency-place-pages:not([hidden])').count()) fail('Pages still shows beside the canvas');
  await sidebar.getByText('Pages', { exact: true }).click();
  await place.waitFor();
  await rows.first().dblclick();
  await page.waitForFunction(() => (document.querySelector('consistency-site-editor iframe')?.getAttribute('src') ?? '').endsWith('path=%2Fen%2F'));
  for (const width of [390, 1440]) {
    await sidebar.getByText('Pages', { exact: true }).click().catch(() => {});
    await page.setViewportSize({ width, height: 900 }); await page.waitForTimeout(150);
    if (await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)) fail(`Pages overflows at ${width}`);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });

  }
  // Emails: Sent and How they look as text tabs; the rows, a failed one marked.
  await sidebar.getByText('Emails', { exact: true }).click();
  const mail = page.locator('consistency-place-emails:not([hidden])');
  await page.waitForFunction(() => document.querySelectorAll('consistency-place-emails select[aria-label=Kind] option').length === 3);
  if (await mail.locator('select[aria-label=Kind] option[value=sign-in-code]').count()) fail('An unrelated sign-in email was offered');
  const sent = mail.locator('ds-list[aria-label="Sent emails"] > ds-row');
  await sent.nth(1).waitFor();
  if ((await mail.locator('ds-tabs[text][aria-label="Emails"] [role="tab"]').evaluateAll(tabs => tabs.map(tab => tab.textContent.trim() + ':' + tab.getAttribute('aria-selected')))).join() !== 'Sent:true,How they look:false') fail('The tabs are not Sent and How they look');
  if (await sent.nth(1).getAttribute('data-failed') === null) fail('A failed email is not marked');
  // The drawer: the email in a frame without scripts, then who and when; another row swaps it, the list stays live.
  await sent.first().click();
  const email = mail.locator('ds-overlay dialog[open]');
  await email.locator('iframe.place-email__frame').waitFor();
  const sandbox = await email.locator('iframe.place-email__frame').getAttribute('sandbox');
  if (/allow-scripts|allow-same-origin/.test(sandbox ?? 'none')) fail('The email\'s frame is not sandboxed: ' + sandbox);
  if (!(await email.locator('iframe.place-email__frame').evaluate(frame => frame.srcdoc)).includes("default-src 'none'")) fail('The email\'s document fetches more than images');
  if (!(await said(email)).includes('ida@example.com')) fail('The drawer does not say to whom');
  await sent.nth(1).click();
  await page.waitForFunction(() => document.querySelector('consistency-place-emails #place-email-title')?.textContent === 'A gift card');
  await email.locator('a.ds-link', { hasText: 'gift.pdf' }).waitFor();
  if (!(await email.locator('a.ds-link', { hasText: 'gift.pdf' }).getAttribute('href')).endsWith(`/sites/${CODE}/api/giftcards/g1/pdf`)) fail('The gift card\'s PDF is not read through the site\'s API');
  if (!(await said(email)).includes('The address bounced.')) fail('A failure\'s words are not shown');
  await email.getByRole('button', { name: 'Close' }).click();
  await page.waitForFunction(() => !document.querySelector('consistency-place-emails ds-overlay dialog[open]'));
  // Words narrow the list.
  await mail.locator('ds-input.place-emails__search input').fill('bo@');
  await page.waitForFunction(() => document.querySelectorAll('consistency-place-emails ds-list[aria-label="Sent emails"] > ds-row').length === 1);
  if (!asked.some(each => each.startsWith('GET api/emails?q=bo%40'))) fail('The words were not asked for');
  // How they look: every kind in the language chosen, opened in the same drawer.
  await mail.getByRole('tab', { name: 'How they look' }).click();
  await mail.locator('ds-list[aria-label="How they look"] > ds-row').first().waitFor();
  if (!asked.includes('GET api/emails/templates?lang=da')) fail('The kinds were not drawn in the first language');
  await mail.getByRole('tab', { name: 'English' }).click();
  await page.waitForFunction(() => document.querySelector('consistency-place-emails ds-list[aria-label="How they look"] .place-email__subject')?.textContent === 'Your booking');
  await mail.locator('ds-list[aria-label="How they look"] > ds-row').first().click();
  await email.waitFor();
  if (!(await said(email)).includes('Forms <forms@example.com>')) fail('The template lost its own sender');
  if (process.env.PLACES_SHOT) await page.screenshot({ path: `${process.env.PLACES_SHOT}/emails.png` });
  if (!(await said(email)).includes('Nothing is sent')) fail('A kind does not say it is drawn with made up people');

  // Editable enquiry email: automatic persistence, slow responses, failed drafts and reopening.
  await mail.getByRole('button', { name: 'Close', exact: true }).click();
  editableEmail = true;
  await page.evaluate(() => dispatchEvent(new Event('focus')));
  const enquiry = mail.locator('ds-row[label="Form enquiry"]');
  await enquiry.waitFor(); await enquiry.click();
  const wording = mail.locator('consistency-email-template-editor');
  const subject = wording.getByRole('textbox', { name: 'Email subject' });
  const message = wording.getByRole('textbox', { name: 'Email message' });
  await subject.fill('A request from {{name}}');
  await page.waitForFunction(() => !document.querySelector('consistency-email-template-editor')?.textContent?.includes('could not be saved'));
  for (let i = 0; i < 50 && emailRevision < 1; i++) await page.waitForTimeout(50);
  if (emailRevision !== 1 || emailSource.subject !== 'A request from {{name}}') fail('The subject did not save without a button press');
  delayEmailSave = 500;
  const beforeSlow = emailWrites.length;
  await message.fill('First {{message}}');
  for (let i = 0; i < 50 && emailWrites.length === beforeSlow; i++) await page.waitForTimeout(25);
  await message.fill('Final {{message}}\nReply to {{email}}');
  for (let i = 0; i < 80 && emailSource.text !== 'Final {{message}}\nReply to {{email}}'; i++) await page.waitForTimeout(50);
  if (await message.inputValue() !== 'Final {{message}}\nReply to {{email}}' || emailSource.text !== 'Final {{message}}\nReply to {{email}}') fail('A slow save replaced newer typing');
  delayEmailSave = 0; failEmailSave = true;
  await subject.fill('Keep my draft {{name}}');
  await wording.getByRole('alert').waitFor();
  await mail.getByRole('button', { name: 'Close', exact: true }).click();
  if (!await wording.isVisible()) fail('Closing lost a failed draft');
  await page.keyboard.press('Escape');
  if (!await wording.isVisible()) fail('Escape lost a failed draft');
  await sidebar.getByText('Design', { exact: true }).click();
  if (!await wording.isVisible() || await subject.inputValue() !== 'Keep my draft {{name}}') fail('Navigation lost a failed draft');
  failEmailSave = false;
  await wording.getByRole('button', { name: 'Try again', exact: true }).click();
  for (let i = 0; i < 50 && emailSource.subject !== 'Keep my draft {{name}}'; i++) await page.waitForTimeout(50);
  if (emailSource.subject !== 'Keep my draft {{name}}') fail('Retry did not save the retained draft');
  await mail.getByRole('button', { name: 'Close', exact: true }).click();
  await enquiry.click();
  if (await subject.inputValue() !== 'Keep my draft {{name}}') fail('Reopening did not retain the saved subject');
  const previewText = await wording.locator('iframe').contentFrame().locator('body').innerText();
  if (!previewText.includes('Final A new website') || !previewText.includes('alex@example.com')) fail('The preview did not draw the live form fields');
  if (await wording.getByRole('button', { name: /^(Save|Apply)$/ }).count()) fail('Email wording has a save ceremony');
  emailRevision++; emailSource = { ...emailSource, subject: 'Changed in another tab {{name}}' };
  await subject.fill('My conflicting draft {{name}}');
  await wording.getByRole('alert').waitFor();
  if (await subject.inputValue() !== 'My conflicting draft {{name}}' || emailSource.subject !== 'Changed in another tab {{name}}') fail('A conflict replaced the other tab or lost the draft');
  await wording.getByRole('button', { name: 'Use saved version', exact: true }).click();
  for (let i = 0; i < 50 && await subject.inputValue() !== 'Changed in another tab {{name}}'; i++) await page.waitForTimeout(50);
  if (await subject.inputValue() !== 'Changed in another tab {{name}}') fail('Conflict recovery did not show the saved version');
  await page.keyboard.press('Escape');
  await enquiry.click();
  if (await subject.inputValue() !== 'Changed in another tab {{name}}') fail('Conflict recovery did not reopen the current version');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(150);
  if (await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)) fail('The enquiry editor overflows on a phone');
  await page.setViewportSize({ width: 1440, height: 1000 });
  console.log('Enquiry templates save automatically, preserve newer typing and failed drafts, preview fields and reopen');

  // Design: each page read in turn through the sandboxed document route, its colours counted with their tokens.
  const read = asked.length;
  await sidebar.getByText('Design', { exact: true }).click();
  const design = page.locator('consistency-place-design:not([hidden])');
  await design.locator('.place-swatches').first().waitFor({ timeout: 15000 });
  const documents = asked.slice(read).filter(each => each.startsWith('GET document'));
  if (documents.join() !== 'GET document?path=%2F,GET document?path=%2Fblueraft%2F') fail('Not every page was read once, in its first language: ' + documents.join(', '));
  const swatches = await said(design.locator('.place-swatches').first());
  if (!swatches.includes('#594dff') || !swatches.includes('--ds-accent-color')) fail('The accent in use is not named by its token: ' + swatches);
  if (swatches.includes('#ff0000')) fail('A script of the site ran while its pages were read');
  if (await page.locator('iframe.place-measure').count()) fail('The measuring frame stayed in the page');
  if (!(await design.innerText()).includes('Accent')) fail('The library\'s colours are not shown');
  const specimen = design.locator('iframe.place-design__specimen');
  if (await specimen.getAttribute('sandbox') !== 'allow-same-origin') fail('The pieces\' frame runs scripts');
  if (!(await specimen.evaluate(frame => frame.srcdoc)).includes(`/api/consistency/sites/${CODE}/files/site.css`)) fail('The pieces are not drawn in the site\'s stylesheets');
  await page.frameLocator('iframe.place-design__specimen').locator('.ds-button--primary').waitFor();
  if (process.env.PLACES_SHOT) await page.screenshot({ path: `${process.env.PLACES_SHOT}/design.png`, fullPage: true });
  if (await page.getByRole('button', { name: /^(Reload|Refresh)$/ }).count()) fail('A Reload button is shown');
  console.log('Shared places: Pages list, details, in-place title and description with failure restore, share image drawer, Edit on the canvas, a site’s own pages from its page source; Emails tabs and drawer; Design read from the sandboxed pages passed');
} finally { await browser.close(); await new Promise(done => server.close(done)); }
