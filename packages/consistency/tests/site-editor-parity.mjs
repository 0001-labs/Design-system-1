/** Real-site acceptance against the canonical editor and the actual public renderer. */
import { chromium } from 'playwright';
import { sitePlatformFixture, fixturePicture } from './site-platform-fixture.mjs';

const source = `<!doctype html><html><head><title>Authored site</title><style>
:root{--sf:1}body{margin:0;font:16px/20px Georgia,serif;color:#222;background:white}
nav,footer{padding:20px}main{padding:20px}section{display:flex;flex-direction:column;gap:20px;padding:40px;background:#f2f2f2;box-sizing:border-box}
section+section{margin-top:20px}h1,h2,p{margin:0}h1,h2{font-size:20px;line-height:40px}img{display:block;max-width:100%;width:240px;height:auto}
</style></head><body><nav id="protected-nav"><a href="/about/">Protected navigation</a></nav><main aria-label="Page content">
<section aria-label="First section"><h1 data-cms="0123456789ab">Original heading</h1><p aria-label="First paragraph">These are the site’s own words.</p><p aria-label="Second paragraph">Keep its typeface, layout and page structure.</p><img aria-label="Authored image" alt="Sample" src="${fixturePicture}"></section>
<section aria-label="Second section"><h2>More content</h2><p>A second authored section.</p></section>
</main><form id="protected-form"><label>Existing field<input name="original"></label></form><footer>Protected footer</footer><script id="protected-script">window.siteRan=true</script></body></html>`;
const fixture = await sitePlatformFixture({ '/': source, '/about/': source.replace('Original heading', 'About the site') });
const browser = await chromium.launch({ headless: true });
const check = (condition, message) => { if (!condition) throw Error(message); };
const eventually = async (test, message) => {
  const deadline = Date.now() + 10_000;
  while (!await test()) { if (Date.now() > deadline) throw Error(message); await new Promise(resolve => setTimeout(resolve, 20)); }
};
const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
const measure = locator => locator.evaluate(element => {
  const style = getComputedStyle(element), label = element.querySelector('.ghost-measure'), labelStyle = label && getComputedStyle(label);
  return { fill: style.backgroundColor, border: style.borderStyle, radius: style.borderRadius, cursor: style.cursor, labelFill: labelStyle?.backgroundColor, labelFont: labelStyle?.fontSize, labelOpacity: labelStyle?.opacity };
});

try {
  // The reference is the same built canonical editor, with its normal production layers.
  const reference = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await reference.goto(fixture.base + '/private-consistency/');
  await reference.locator('select[aria-label="Example page"]').selectOption('studio');
  const referenceGap = reference.locator('.consistency-text-gap').first();
  await referenceGap.hover(); await reference.waitForTimeout(250);
  const referenceGuide = await measure(referenceGap);
  await reference.locator('.consistency-sheet').screenshot({ path: '/tmp/c9y-parity-reference-hover.png' });
  await reference.locator('consistency-editor').evaluate(async element => { element.selection = new Set(['group-intro']); await element.updateComplete; });
  const referenceSelection = await reference.locator('[data-selection-face]').first().evaluate(element => getComputedStyle(element, '::after').backgroundColor);
  await reference.mouse.move(1400, 5); await reference.waitForTimeout(250);
  await reference.locator('.consistency-sheet').screenshot({ path: '/tmp/c9y-parity-reference-selected.png' });
  const referenceCard = reference.locator('ds-card[data-selectable="bookshop"]');
  await referenceCard.click({ button: 'right', position: { x: 10, y: 10 } });
  await reference.getByRole('menuitem', { name: 'Pink', exact: true }).click();
  const referenceAppearance = await referenceCard.evaluate(element => { const style = getComputedStyle(element.shadowRoot.querySelector('.ds-card')); return { fill: style.backgroundColor, borderStyle: style.borderStyle, borderWidth: style.borderWidth }; });
  await reference.close();

  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  const parityIssues = [];
  page.on('pageerror', error => { errors.push(error.message); console.error('Canvas error:', error.stack); });
  page.setDefaultTimeout(10_000);
  await fixture.route(page); await page.goto(fixture.url);
  const frame = page.frameLocator('iframe.consistency-site-frame');
  await frame.locator('[data-editor-surface]').waitFor();
  const nodeId = label => fixture.read().nodes.find(node => node.label === label)?.id;
  const section = frame.locator(`[data-c9y-node="${nodeId('First section')}"]`);
  const gap = frame.locator('.ghost-surface[aria-label="First section gap"]').first();
  const padding = frame.locator('.ghost-surface[aria-label="First section padding"]');
  const selectedLeaves = frame.locator('[data-selection-face]');
  const imagePixel = async () => {
    const picture = frame.locator(`[data-c9y-node="${nodeId('Authored image')}"]`);
    await picture.evaluate(image => image.decode());
    const box = await picture.boundingBox();
    const shot = await page.screenshot({ clip: { x: Math.floor(box.x + box.width / 2), y: Math.floor(box.y + box.height / 2), width: 1, height: 1 } });
    return page.evaluate(async encoded => { const image = new Image(); image.src = 'data:image/png;base64,' + encoded; await image.decode(); const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1; const context = canvas.getContext('2d'); context.drawImage(image, 0, 0); return [...context.getImageData(0, 0, 1, 1).data]; }, shot.toString('base64'));
  };
  const selectSection = async () => { const box = await section.boundingBox(); await section.click({ position: { x: box.width - 25, y: box.height - 25 } }); };
  const openSectionMenu = async () => { const box = await section.boundingBox(); await section.click({ button: 'right', position: { x: box.width - 25, y: 25 } }); };
  // Chromium input bypasses Playwright's iframe timer-based native-drag interception.
  const gesture = async (from, to, { cancel = false, shift = false } = {}) => {
    const input = await page.context().newCDPSession(page);
    if (shift) await page.keyboard.down('Shift');
    await input.send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...from });
    await input.send('Input.dispatchMouseEvent', { type: 'mousePressed', ...from, button: 'left', buttons: 1, clickCount: 1, modifiers: shift ? 8 : 0 });
    for (let step = 1; step <= 12; step++) await input.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: from.x + (to.x - from.x) * step / 12, y: from.y + (to.y - from.y) * step / 12, buttons: 1, modifiers: shift ? 8 : 0 });
    if (cancel) await page.keyboard.press('Escape');
    await input.send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...to, button: 'left', buttons: 0, clickCount: 1 });
    if (shift) await page.keyboard.up('Shift');
    await input.detach();
  };

  check(await page.locator('iframe.consistency-site-frame').getAttribute('sandbox') === 'allow-same-origin', 'The actual editor loosened the site sandbox');
  check(!await frame.locator('body').evaluate(() => window.siteRan), 'Site scripts ran with app credentials');
  check(!await page.getByRole('switch').count() && !await page.getByLabel('Example page', { exact: true }).count(), 'The site shows lab controls');
  check(!await page.locator('.consistency-composition-bar').count() && !await frame.locator('.consistency-composition-bar').count(), 'The adapter retained its separate numeric toolbar');
  await page.mouse.move(1400, 5); await page.waitForTimeout(250);
  check((await measure(gap)).labelOpacity === '0', 'A spacing measurement is visible at idle');
  await page.screenshot({ path: '/tmp/c9y-parity-site-idle.png' });
  await gap.hover(); await page.waitForTimeout(250);
  const realGuide = await measure(gap);
  check(JSON.stringify(realGuide) === JSON.stringify(referenceGuide), `Spacing feedback differs from the editor: ${JSON.stringify({ referenceGuide, realGuide })}`);
  await page.screenshot({ path: '/tmp/c9y-parity-site-hover.png' });

  const beforeSelection = fixture.writes.length;
  const unselectedImage = await imagePixel();
  await selectSection();
  check(await selectedLeaves.count() >= 3, 'Section selection did not paint its authored leaves');
  check(await section.evaluate(element => getComputedStyle(element).outlineStyle) === 'none', 'Section selection outlines the container');
  check(await section.evaluate(element => getComputedStyle(element, '::after').content) === 'none', 'Section selection paints the intervening space');
  const realSelection = await selectedLeaves.first().evaluate(element => getComputedStyle(element, '::after').backgroundColor);
  if (realSelection !== referenceSelection) { parityIssues.push(`Selection fill differs: ${JSON.stringify({ referenceSelection, realSelection })}`); console.error(parityIssues.at(-1)); }
  await page.mouse.move(1400, 5); await page.waitForTimeout(250);
  const selectedImage = await imagePixel();
  if (!selectedImage.slice(0, 3).every((value, index) => value < unselectedImage[index] - 10)) { parityIssues.push(`Selected image has no painted face: ${JSON.stringify({ unselectedImage, selectedImage })}`); console.error(parityIssues.at(-1)); }
  await page.screenshot({ path: '/tmp/c9y-parity-site-selected.png' });
  check(fixture.writes.length === beforeSelection, 'Selection changed the saved document');

  // Shift marquee wins over section dragging, writes no history, and leaves spacing available.
  const first = await section.boundingBox(), paragraph = await frame.getByText('These are the site’s own words.', { exact: true }).boundingBox();
  await gesture({ x: first.x + first.width - 25, y: first.y + 25 }, { x: paragraph.x + 10, y: paragraph.y + paragraph.height - 2 }, { shift: true });
  check(await selectedLeaves.count() > 0 && fixture.writes.length === beforeSelection, 'Additive marquee changed content or lost selection');
  const beforePadding = Number(await padding.getAttribute('aria-valuenow'));
  await padding.press('ArrowRight');
  await eventually(() => fixture.read().document.nodes[nodeId('First section')]?.padding === beforePadding + 20, 'The canonical boundary guide did not persist its change');
  check(await selectedLeaves.count() > 0, 'Spacing a selection cleared it');
  await page.keyboard.press('Escape');
  check(!await selectedLeaves.count(), 'Escape left selected content shaded');

  // Context is deliberate and temporary, with canonical guide suspension.
  await openSectionMenu();
  await page.locator('ds-context[data-consistency-context][open]').waitFor();
  check(await gap.evaluate(element => element.hidden || getComputedStyle(element).pointerEvents === 'none' || element.getAttribute('aria-disabled') === 'true'), 'An open context left its spacing gesture active');
  await frame.locator('#protected-nav').click();
  await page.locator('ds-context[data-consistency-context][open]').waitFor({ state: 'hidden' });

  // The authored image receives the same quiet edge and cancellable pointer sizing.
  const image = frame.locator(`[data-c9y-node="${nodeId('Authored image')}"]`);
  const imageWidth = frame.getByRole('slider', { name: 'Authored image width', exact: true });
  await imageWidth.hover();
  check(Math.abs((await imageWidth.boundingBox()).width - 6) <= 1, 'Image sizing uses a different edge than the canonical editor');
  const imageBefore = (await image.boundingBox()).width;
  let edge = await imageWidth.boundingBox();
  await gesture({ x: edge.x + edge.width / 2, y: edge.y + edge.height / 2 }, { x: edge.x + edge.width / 2 + 20, y: edge.y + edge.height / 2 });
  await eventually(() => fixture.read().document.nodes[nodeId('Authored image')]?.width === imageBefore + 20, 'Canonical image sizing did not persist');
  const beforeResizeCancel = fixture.writes.length;
  edge = await imageWidth.boundingBox();
  await gesture({ x: edge.x + edge.width / 2, y: edge.y + edge.height / 2 }, { x: edge.x + edge.width / 2 + 40, y: edge.y + edge.height / 2 }, { cancel: true });
  await page.waitForTimeout(500);
  check(fixture.writes.length === beforeResizeCancel && Math.abs((await image.boundingBox()).width - imageBefore - 20) <= 1, 'Escape committed or retained a resize preview');

  // Side placement moves original nodes through the checked graph, not copied HTML.
  const firstParagraph = frame.locator(`[data-c9y-node="${nodeId('First paragraph')}"]`);
  const secondParagraph = frame.locator(`[data-c9y-node="${nodeId('Second paragraph')}"]`);
  let from = await firstParagraph.boundingBox(), to = await secondParagraph.boundingBox();
  await firstParagraph.click({ position: { x: from.width - 25, y: from.height / 2 } });
  await gesture({ x: from.x + from.width - 25, y: from.y + from.height / 2 }, { x: to.x + 6, y: to.y + to.height / 2 });
  await eventually(() => fixture.read().document.groups?.some(group => group.kind === 'columns'), 'Side placement did not persist a source graph columns group');
  check(fixture.read().nodes.find(node => node.id === nodeId('First paragraph')).parent !== nodeId('First section'), 'Side placement duplicated the source paragraph instead of moving its graph node');
  check(await firstParagraph.count() === 1 && await secondParagraph.count() === 1, 'Side placement duplicated authored content on the canvas');
  const beforeColumnMove = fixture.writes.length;
  from = await firstParagraph.boundingBox(); to = await secondParagraph.boundingBox();
  await firstParagraph.click({ position: { x: from.width - 25, y: from.height / 2 } });
  await gesture({ x: from.x + from.width - 25, y: from.y + from.height / 2 }, { x: to.x + to.width - 6, y: to.y + to.height / 2 });
  await eventually(async () => fixture.writes.length > beforeColumnMove && (await firstParagraph.boundingBox()).x > (await secondParagraph.boundingBox()).x, 'A singleton source block could not move to the other column edge');
  check(await frame.locator('body').evaluate(body => [...body.children].filter(element => element.matches('nav,main,form,footer,script')).map(element => element.tagName).join(',')) === 'NAV,MAIN,FORM,FOOTER,SCRIPT', 'Side placement moved protected source siblings');

  const publicHTML = await fixture.publicHTML();
  for (const original of ['<nav id="protected-nav">', '<form id="protected-form">', '<script id="protected-script">window.siteRan=true</script>', 'These are the site’s own words.']) check(publicHTML.includes(original), `The renderer changed protected source: ${original}`);
  check(!/data-editor-surface|data-selection-face|data-selectable=|data-c9y-node=|consistency-composition-bar/.test(publicHTML), 'Editor chrome escaped into the public page');
  check(await section.evaluate(element => getComputedStyle(element).fontFamily.includes('Georgia')), 'The editor replaced authored typography');
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    check(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), `The app overflows at ${width}`);
    check(!await frame.locator('html').evaluate(element => element.scrollWidth > element.clientWidth), `The site overflows at ${width}`);
  }

  // Native Aa content uses the real stored Markdown and the real publication renderer.
  const regionId = 'new_native0001';
  const native = [
    '## Native heading', 'Native prose keeps its own block spacing.',
    '```c9y-card\n' + JSON.stringify({ label: 'Card label', title: 'Editable card title', body: 'A card with independent words.', variant: 'outlined', tone: '', width: 280, height: 200 }) + '\n```',
    '```c9y-button\n' + JSON.stringify({ label: 'Native button', secondary: false }) + '\n```',
    '| Name | Value |\n| --- | --- |\n| Original cell | 2 |',
    '<columns>\n<column>\nFirst native column\n\nA second column block.\n</column>\n<column>\nSecond native column\n</column>\n</columns>',
    `![Catalogue picture](${fixturePicture} "w12")`, ':icon[star]',
  ].join('\n\n');
  const beforeNative = fixture.read();
  const regionParent = nodeId('First section'), parentOrder = beforeNative.document.order[regionParent];
  fixture.store.save('/', beforeNative.build, fixture.pages.get('/'), { build: beforeNative.build, base: beforeNative.base, revision: beforeNative.revision, document: { ...beforeNative.document, ...(parentOrder ? { order: { ...beforeNative.document.order, [regionParent]: [...parentOrder, regionId] } } : {}), insertions: [{ id: regionId, parent: regionParent, kind: 'region', source: native, gaps: { [`${regionId}-text-1`]: 40, [`${regionId}-nested-1-text-1`]: 40, [`columns:${regionId}:0:0`]: 40 } }] } }, 'fixture@example.com', Date.now(), new Set([fixturePicture]));
  await page.reload();
  const region = frame.locator(`[data-c9y-node="${regionId}"]`);
  await region.locator('.aa-block').first().waitFor();
  const regionState = () => fixture.read().document.insertions.find(item => item.id === regionId);
  const atomState = kind => JSON.parse(new RegExp('```c9y-' + kind + '\\n([\\s\\S]*?)\\n```').exec(regionState().source)[1]);
  check(await region.locator('ds-card').count() === 1 && await region.locator('ds-button').count() === 1, 'Native atoms were replaced by a simplified content surface');
  const nativeEditing = await region.evaluate(element => ({ cardInert: element.querySelector('ds-card').inert, buttonInert: element.querySelector('ds-button').inert, editorReady: !!element.querySelector('aa-editor')?.editor, readOnly: element.querySelector('aa-editor')?.readOnly }));
  check(nativeEditing.editorReady && !nativeEditing.readOnly && !nativeEditing.cardInert && !nativeEditing.buttonInert, `Reopened native components are not editable: ${JSON.stringify(nativeEditing)}`);
  check(await region.locator('.aa-columns .aa-column').count() === 2, 'Native columns were flattened on opening');
  const picture = region.getByRole('img', { name: 'Catalogue picture', exact: true });
  await picture.waitFor();
  check((await picture.getAttribute('src')).includes(`/sites/${fixture.code}/files${fixturePicture}`), 'The editor image bypasses the site files gateway');
  await picture.scrollIntoViewIfNeeded(); await picture.evaluate(image => image.decode());

  await region.locator('ds-card').click({ button: 'right', position: { x: 10, y: 10 } });
  await frame.getByRole('menuitem', { name: 'Pink', exact: true }).click();
  await eventually(() => atomState('card').tone === 'pink', 'The canonical card context did not persist its appearance');
  await frame.locator('#protected-nav').click();
  const editorAppearance = await region.locator('ds-card').evaluate(element => { const style = getComputedStyle(element.shadowRoot.querySelector('.ds-card')); return { fill: style.backgroundColor, borderStyle: style.borderStyle, borderWidth: style.borderWidth }; });
  check(JSON.stringify(editorAppearance) === JSON.stringify(referenceAppearance), `Native canvas card appearance differs: ${JSON.stringify({ referenceAppearance, editorAppearance })}`);
  const title = region.locator('[aria-label="card title"]');
  await title.click(); await page.keyboard.press(`${modifier}+A`); await page.keyboard.type('A saved native title'); await page.keyboard.press('Tab');
  await eventually(() => atomState('card').title === 'A saved native title', 'Native card typing did not replace and persist the complete title');
  await region.getByRole('slider', { name: 'Card width', exact: true }).press('ArrowRight');
  await eventually(() => atomState('card').width === 300, 'Native card edge sizing did not update the typed atom');
  const cardGeometry = await region.locator('ds-card').evaluate(element => ({ width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height }));

  await region.locator('.consistency-button-action').locator('..').hover();
  await region.locator('select[aria-label="Button action type"]').selectOption('page');
  const destination = region.getByRole('textbox', { name: 'Button destination', exact: true });
  await destination.fill('/about/'); await destination.press('Tab');
  await eventually(() => atomState('button').action?.target === '/about/', 'The canonical button destination did not persist');
  await region.locator('[data-cell="1:0"]').click();
  await page.keyboard.press(`${modifier}+A`); await page.keyboard.type('Saved table cell'); await page.keyboard.press('Tab');
  await eventually(() => regionState().source.includes('| Saved table cell | 2 |'), 'Table editing did not persist through native Markdown');

  const nativeGap = frame.getByRole('slider', { name: `Adjust ${regionId} block gap 1`, exact: true });
  await nativeGap.press('ArrowUp');
  await eventually(() => regionState().gaps?.[`${regionId}-text-1`] === 60, 'Native block gap did not persist');
  await page.keyboard.press('Escape');
  const canvasContentGeometry = await region.evaluate(element => {
    const columns = [...element.querySelectorAll('.aa-columns .aa-column')];
    return { tableRatio: element.querySelector('table').getBoundingClientRect().width / element.querySelector('aa-editor').getBoundingClientRect().width, columnStart: columns[1].querySelector('.aa-block').getBoundingClientRect().top - columns[0].querySelector('.aa-block').getBoundingClientRect().top };
  });
  const savedNative = structuredClone(regionState());
  const html = await fixture.publicHTML();
  check(html.includes('A saved native title') && html.includes('Saved table cell') && html.includes('href="/about/"'), 'Native fields were lost at the public-render boundary');
  check(!html.includes('```c9y-') && !html.includes('data-selection-face') && !html.includes('data-aa-interactive'), 'Editor syntax or controls leaked into publication');
  check(html.includes('<script id="protected-script">window.siteRan=true</script>') && html.includes('These are the site’s own words.'), 'Native content replaced protected or unrelated source');
  const published = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await published.goto(fixture.base + '/fixture-public/');
  const authoredColumns = published.locator('[data-c9y-layout="columns"]');
  check(await authoredColumns.count() === 1 && (await authoredColumns.innerText()).includes('These are the site’s own words.') && (await authoredColumns.innerText()).includes('Keep its typeface'), 'Publication lost the source-node column placement');
  check((await published.getByText('These are the site’s own words.', { exact: true }).boundingBox()).x > (await published.getByText('Keep its typeface, layout and page structure.', { exact: true }).boundingBox()).x, 'Publication lost the reordered source columns');
  const publicRegion = published.locator('.c9y-native-region');
  const publicContentGeometry = await publicRegion.evaluate(element => {
    const columns = [...element.querySelectorAll('.c9y-native-column')];
    return { tableRatio: element.querySelector('table').getBoundingClientRect().width / element.getBoundingClientRect().width, columnStart: columns[1].querySelector('.c9y-native-block').getBoundingClientRect().top - columns[0].querySelector('.c9y-native-block').getBoundingClientRect().top };
  });
  check(Math.abs(publicContentGeometry.tableRatio - canvasContentGeometry.tableRatio) < .01 && Math.abs(publicContentGeometry.columnStart - canvasContentGeometry.columnStart) <= 1, `Published table/column geometry differs: ${JSON.stringify({canvasContentGeometry, publicContentGeometry})}`);
  const publicCard = publicRegion.locator('.ds-card');
  check(Math.abs((await publicCard.boundingBox()).width - cardGeometry.width) <= 1, 'Published card width differs from the editor');
  check(await publicCard.getAttribute('data-tone') === 'pink', 'Published card appearance differs from the chosen context');
  const publicAppearance = await publicCard.evaluate(element => { const style = getComputedStyle(element); return { fill: style.backgroundColor, borderStyle: style.borderStyle, borderWidth: style.borderWidth }; });
  check(JSON.stringify(publicAppearance) === JSON.stringify(referenceAppearance), `Published native card appearance differs: ${JSON.stringify({ referenceAppearance, publicAppearance })}`);
  check(await publicRegion.getByRole('link', { name: 'Native button', exact: true }).getAttribute('href') === '/about/', 'Published button lost its destination');
  check(await publicRegion.locator('.c9y-native-block').nth(1).evaluate(element => Number.parseFloat(getComputedStyle(element).marginBlockStart)) === 60, 'Published block gap differs from the editor');
  const columnGap = await publicRegion.locator('.c9y-native-column').evaluateAll(columns => columns[1].getBoundingClientRect().left - columns[0].getBoundingClientRect().right);
  check(Math.abs(columnGap - 40) <= 1, `Published column gap is ${columnGap}, expected40`);
  const publishedPicture = publicRegion.getByRole('img', { name: 'Catalogue picture', exact: true });
  await publishedPicture.scrollIntoViewIfNeeded(); await publishedPicture.evaluate(image => image.decode());
  await published.screenshot({ path: '/tmp/c9y-parity-public-native.png' });
  await published.close();
  await page.reload(); await region.locator('ds-card').waitFor();
  check(JSON.stringify(regionState()) === JSON.stringify(savedNative), 'Reopening changed the native document');
  check(await region.locator('[aria-label="card title"]').innerText() === 'A saved native title', 'Reopening lost the edited native title');
  await page.screenshot({ path: '/tmp/c9y-parity-site-native.png' });

  // Adding content opens the actual Aa picker, including the approved native atoms.
  await openSectionMenu(); await page.getByRole('menuitem', { name: 'Add content', exact: true }).click();
  await page.keyboard.type('/Button');
  await frame.locator('.aa-menu button[aria-label="Button"]').click();
  await eventually(() => fixture.read().document.insertions.some(item => item.id !== regionId && item.kind === 'region' && item.source.includes('```c9y-button')), 'The native picker did not insert a persisted typed button');
  const insertedRegion = fixture.read().document.insertions.find(item => item.id !== regionId);
  check(insertedRegion.kind === 'region' && insertedRegion.source.includes('```c9y-button'), 'Insertion used the retired simplified element model');
  check(!errors.length, `Canvas runtime errors: ${errors.join('; ')}`);
  check(!parityIssues.length, parityIssues.join('; '));
  console.log('Actual editor parity: canonical guides, selection, marquee, context, native atoms/columns/table/media, public rendering and source protection passed');
} catch (error) {
  const active = browser.contexts().flatMap(context => context.pages()).find(page => page.url().includes('home.html'));
  if (active) await active.screenshot({ path: '/tmp/c9y-parity-failure.png' }).catch(() => {});
  throw error;
} finally { await browser.close(); await fixture.close(); }
