// A site's words in the editor: its real page in a sandboxed frame, words edited in place with Aa and saved as
// Team CMS edits, its links followed, its scripts never run. Every gateway answer is a stand-in.
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
const POLICY = "sandbox allow-same-origin; default-src 'none'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; media-src 'self' https:; frame-ancestors 'self'; form-action 'none'; base-uri 'none'";
const H1 = '0123456789ab', P = 'abcdef012345', BTN = 'bbbbbbbbbbbb', TITLE = '111111111111';
const fields = {
  '/': [
    { key: TITLE, tag: 'title', kind: 'meta', label: 'Title', markdown: 'CPH Raft' },
    { key: H1, tag: 'h1', kind: 'text', label: 'h1', markdown: 'Hello' },
    { key: P, tag: 'p', kind: 'text', label: 'p', markdown: 'Some **words**' },
    { key: BTN, tag: 'span', kind: 'text', label: 'Button', markdown: 'Book' },
    { key: 'dddddddddddd', tag: 'summary', kind: 'text', label: 'summary', markdown: 'A question?' },
    { key: 'aaaaaaaaaaaa', tag: 'p', kind: 'text', label: 'p', markdown: 'The answer' },
  ],
  '/en/': [{ key: 'eeeeeeeeeeee', tag: 'h1', kind: 'text', label: 'h1', markdown: 'Welcome' }],
};
const documents = {
  '/': `<!doctype html><html><head><title>CPH Raft</title><link rel="stylesheet" href="/api/consistency/sites/cph-raft/files/assets/site.css"></head><body>
    <h1 data-cms="${H1}">Hello</h1><p data-cms="${P}">Some <strong>words</strong></p><p class="copy" data-cms="${P}">Some <strong>words</strong></p>
    <a class="ds-button" href="https://cphraft.c9y.site/book/"><span data-cms="${BTN}">Book</span></a>
    <nav><a id="english" href="https://cphraft.c9y.site/en/">English</a><a id="away" href="https://example.com/">Away</a></nav>
    <form action="https://evil.test/"><button id="send">Send</button></form>
    <details><summary><span data-cms="dddddddddddd">A question?</span> <i id="toggle">+</i></summary><p data-cms="aaaaaaaaaaaa">The answer</p></details>
    <img src="x" onerror="document.body.dataset.ran=1"><script>document.body.dataset.ran = 1</script></body></html>`,
  '/en/': `<!doctype html><html><head><title>CPH Raft</title></head><body><h1 data-cms="eeeeeeeeeeee">Welcome</h1></body></html>`,
};
const browser = await chromium.launch({ headless: true });
const fail = message => { throw new Error(message); };
try {
  const base = `http://127.0.0.1:${server.address().port}/private-consistency/`;
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const edits = [], asked = [];
  await page.route('**/api/consistency/pages**', route => route.fulfill({ json: { pages: [] } }));
  await page.route('**/api/consistency/sites', route => route.fulfill({ json: { sites: [{ id: 'cph-raft', name: 'CPH Raft', url: 'https://cphraft.c9y.site/team/' }, { id: 'flavo', name: 'Flavo', url: 'https://flavo.c9y.site/team/' }] } }));
  await page.route('**/api/consistency/sites/*/**', async route => {
    const request = route.request(), url = new URL(request.url()), [, , , , site, ...rest] = url.pathname.split('/'), what = rest.join('/');
    asked.push(`${request.method()} ${what}${url.search}`);
    if (site === 'flavo') return route.fulfill({ status: 409, json: { error: 'not-editable' } });
    if (what === 'pages') return route.fulfill({ json: { site: 'CPH Raft', pages: [{ path: '/', lang: 'da', title: 'Forside', fields: 4, edited: 0 }, { path: '/en/', lang: 'en', title: 'Home', fields: 1, edited: 0 }], images: [] } });
    const path = url.searchParams.get('path');
    if (what === 'page') return route.fulfill({ json: { path, lang: path === '/' ? 'da' : 'en', title: 'CPH Raft', fields: fields[path] } });
    if (what === 'document') return route.fulfill({ body: documents[path], headers: { 'content-type': 'text/html; charset=utf-8', 'content-security-policy': POLICY } });
    if (what === 'files/assets/site.css') return route.fulfill({ body: 'h1{font-size:40px}', headers: { 'content-type': 'text/css' } });
    if (what === 'edit') {
      const body = request.postDataJSON(); edits.push(body);
      const html = body.markdown.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      return route.fulfill({ json: { html, edit: { markdown: body.markdown, editor: 'jaa90@icloud.com' } } });
    }
    return route.fulfill({ status: 404, json: { error: 'not-found' } });
  });
  await page.goto(base);
  await page.getByText('Create a page to begin.', { exact: false }).waitFor();
  await page.getByRole('button', { name: 'CPH Raft', exact: true }).click();
  const frame = page.frameLocator('iframe.consistency-site-frame');
  await frame.locator(`h1[data-cms="${H1}"]`).waitFor();
  if (await page.getByRole('button', { name: 'CPH Raft', exact: true }).getAttribute('aria-current') !== 'page') fail('The open site is not marked');
  if (await page.locator('iframe.consistency-site-frame').getAttribute('sandbox') !== 'allow-same-origin') fail('The frame is not sandboxed');
  if (await frame.locator('body').getAttribute('data-ran')) fail('A script of the site ran');
  if (await page.locator('consistency-editor').count()) fail('The composition tools are on in site mode');

  // A heading: pressed, typed, Enter saves it as a Team CMS edit.
  await frame.locator(`h1[data-cms="${H1}"]`).click();
  await page.locator('.consistency-site-bar-over').waitFor();
  await page.keyboard.press('End'); await page.keyboard.type(' there');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => !document.querySelector('.consistency-site-bar-over'));
  if (JSON.stringify(edits.at(-1)) !== JSON.stringify({ path: '/', key: H1, markdown: 'Hello there' })) fail(`Wrong edit: ${JSON.stringify(edits.at(-1))}`);
  if ((await frame.locator(`h1[data-cms="${H1}"]`).innerHTML()) !== 'Hello there') fail('The saved words are not on the page');

  // A paragraph: its Markdown while edited, its copy following as typed, Escape puts both back.
  await frame.locator(`p[data-cms="${P}"]`).first().click();
  await page.keyboard.press('End'); await page.keyboard.type(' more');
  await frame.locator('p.copy', { hasText: 'words more' }).waitFor();
  await page.keyboard.press('Escape');
  if ((await frame.locator('p.copy').innerHTML()) !== 'Some <strong>words</strong>' || edits.length !== 1) fail('Escape did not put the words back');

  // Mod+Enter saves a paragraph; pressing a button's words edits them and never follows the button.
  await frame.locator(`p[data-cms="${P}"]`).first().click();
  await page.keyboard.press('End'); await page.keyboard.type('!');
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+Enter' : 'Control+Enter');
  await page.waitForFunction(() => !document.querySelector('.consistency-site-bar-over'));
  if (edits.at(-1)?.markdown !== 'Some **words**!' || (await frame.locator('p.copy').innerHTML()) !== 'Some <strong>words</strong>!') fail('Mod+Enter did not save the paragraph in every copy');
  await frame.locator(`[data-cms="${BTN}"]`).click();
  await page.locator('.consistency-site-bar-over').waitFor();
  if (!(await page.locator('.consistency-site-bar-over').innerText()).includes('Button')) fail('The field is not named');
  await page.keyboard.press('Escape');

  // A question's disclosure opens beside its words, and its answer is edited like any other words.
  await frame.locator('#toggle').click();
  await frame.locator('[data-cms="aaaaaaaaaaaa"]').click();
  await page.locator('.consistency-site-bar-over').waitFor();
  await page.keyboard.press('Escape');

  // Links: another site and a form do nothing; the site's own page is followed, saving the words first.
  await frame.locator('#away').click(); await frame.locator('#send').click();
  if (!(await frame.locator(`h1[data-cms="${H1}"]`).count())) fail('A press left the page');
  await frame.locator(`h1[data-cms="${H1}"]`).click();
  await page.keyboard.press('End'); await page.keyboard.type('!');
  await frame.locator('#english').click();
  await frame.locator('h1[data-cms="eeeeeeeeeeee"]').waitFor();
  if (edits.at(-1)?.markdown !== 'Hello there!') fail('Following a link did not save the words first');
  if (await page.locator('ds-select select').inputValue() !== '/en/') fail('The page picker did not follow');
  if (!asked.includes('GET page?path=%2Fen%2F')) fail('The followed page was not read');

  // The page picker opens a page; a site that keeps its words elsewhere says so.
  await page.locator('ds-select select').selectOption('/');
  await frame.locator(`h1[data-cms="${H1}"]`).waitFor();
  await page.getByRole('button', { name: 'Flavo', exact: true }).click();
  await page.getByText('This site keeps its words in its own editor.', { exact: false }).waitFor();
  for (const width of [390, 768, 1440]) {
    await page.getByRole('button', { name: 'CPH Raft', exact: true }).click();
    await page.setViewportSize({ width, height: 900 }); await page.waitForTimeout(100);
    if (await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)) fail(`Site mode overflows at ${width}`);
  }
  if (edits.length !== 3) fail(`Expected three saves, got ${edits.length}`);
  console.log('Site words: sandboxed page, in-place edits, Enter/Mod+Enter/Escape, copies, links, picker, unsupported site and viewports passed');
} finally { await browser.close(); await new Promise(done => server.close(done)); }
