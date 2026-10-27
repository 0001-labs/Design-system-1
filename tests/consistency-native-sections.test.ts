import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vite-plus/test';
import { SECTIONS, TONES, sectionDefinition } from '../shared/consistency-vocabulary';
import { expandNativeSection, nativeBlockStyles, nativePageStyles, renderNativeBlock, renderNativePage, validateNativePage, type NativeBlock, type NativeHero, type NativePageDocument, type NativePageRefusal, type NativePageRenderOptions, type NativeSection } from '../shared/consistency-native-page';
import type { SectionKind } from '../shared/consistency-vocabulary';

const context = { images: ['/photos/harbour.jpg', '/photos/logo.svg'], collections: ['storefront'], runtimes: { MenuToggle: [], Theme: [], Cart: ['label'] }, bindings: [] };
const page = (blocks: NativeBlock[]): NativePageDocument => ({ schema: 1, kind: 'native-page', lang: 'da', layout: { padding: 0, gap: 80 }, blocks });
const example = (kind: SectionKind, index = 0) => structuredClone(sectionDefinition(kind)!.examples[index]) as NativeSection & Record<string, unknown>;
const hero = (index = 0) => example('hero', index) as NativeHero;
const refusal = (blocks: NativeBlock[]): NativePageRefusal => { try { validateNativePage(page(blocks), context); } catch (error) { return error as NativePageRefusal; } throw new Error('accepted'); };
const render = (block: NativeBlock, options: NativePageRenderOptions = {}) => renderNativeBlock(validateNativePage(page([block]), context).blocks[0]!, { images: context.images, lang: 'da', ...options });

describe('section kinds expand to primitives', () => {
  test('a hero is a picture and a toned panel of logo, kicker, title, text and actions', () => {
    const top = hero();
    const html = render(top);
    expect(html).toMatch(/^<section class="c9y-native-node c9y-native-section" data-native-block="top" data-section="hero" data-panel="centre" style="--c9y-hero-height:calc\(480px \* var\(--sf,1\)\)">/);
    expect(html).toContain('<figure class="c9y-native-node c9y-native-image" data-native-block="top.picture" data-slot="picture"');
    expect(html).toContain('class="c9y-native-node c9y-native-flow c9y-native-toned" data-native-block="top.panel" data-slot="panel" data-tone="cream"');
    expect(html).toContain('data-native-block="top.logo" data-slot="logo"');
    expect(html).toContain('data-native-block="top.title" data-slot="title"'); expect(html).toContain('<h1>The cosiest boat hire in town</h1>');
    expect(html).toContain('data-native-block="top.actions" data-slot="actions"');
    expect(html).toContain('data-native-block="top.actions.0" data-slot="actions" data-item="0"'); expect(html).toContain('class="ds-button ds-button--primary" href="/book/"');
    expect(html).toContain('data-native-block="top.actions.1" data-slot="actions" data-item="1"'); expect(html).toContain('ds-button--secondary');
    expect(html).toContain('--c9y-image-fit:cover');
    expect(render(hero(1))).toContain('<h1>Floating glamping</h1>');
    expect(render({ ...top, title: '## Already a heading' })).toContain('<h2>Already a heading</h2>');
    expect(nativeBlockStyles(top)).toEqual({ '--c9y-hero-height': 'calc(480px * var(--sf,1))' });
    const editor = render(top, { editor: true });
    expect(editor).toContain('data-c9y-block="top" data-c9y-kind="hero"'); expect(editor).toContain('data-c9y-block="top.title" data-c9y-kind="content"');
  });
  test('the other kinds carry their slots, items and derived ids', () => {
    const split = render(example('split', 1));
    expect(split).toContain('data-section="split" data-reverse style="--c9y-split-columns:minmax(0,1fr) minmax(0,2fr);--c9y-split-image-height:calc(400px * var(--sf,1))"');
    expect(split).toContain('data-native-block="blue.heading" data-slot="heading"'); expect(split).toContain('<h2>Blue raft</h2>'); expect(split).toContain('data-tone="paper"');
    const statement = render(example('statement', 1));
    expect(statement).toContain('class="c9y-native-node c9y-native-section c9y-native-toned" data-native-block="hours" data-section="statement" data-align="centre" data-tone="cream" style="--c9y-statement-width:calc(640px * var(--sf,1))"');
    expect(render(example('statement', 2))).toContain('--c9y-statement-width:calc(1000px * var(--sf,1))');
    const panels = render(example('panels'));
    expect(panels).toContain('data-section="panels" style="--c9y-columns:2;--c9y-gap:calc(0px * var(--sf,1))"');
    expect(panels).toContain('data-native-block="rafts-green" data-section="hero" data-panel="centre" data-slot="items" data-item="0"');
    expect(panels).toContain('data-native-block="rafts-blue.title" data-slot="title"'); expect(panels).toContain('<h2>Floating glamping</h2>');
    const cards = render(example('cards'));
    expect(cards).toContain('data-section="cards" data-variant="filled" data-tone="cream" style="--c9y-columns:3;--c9y-card-height:calc(320px * var(--sf,1))"');
    expect(cards).toContain('class="c9y-native-node c9y-native-flow c9y-native-card c9y-native-toned" data-native-block="tours.items.1" data-slot="items" data-item="1"');
    expect(cards).toContain('data-native-block="tours.items.1.title" data-slot="title" data-item="1"'); expect(cards).toContain('<h3>Sunset sailing</h3>');
    expect(cards).toContain('data-native-block="tours.items.0.picture" data-slot="picture" data-item="0"'); expect(cards).toContain('data-native-block="tours.items.2.action" data-slot="action" data-item="2"');
    expect(render(example('cards', 1))).toContain('c9y-native-card" data-native-block="news.items.0"');
    const gallery = render(example('gallery', 1));
    expect(gallery).toContain('data-section="gallery" data-strip style="--c9y-columns:3;--c9y-gallery-height:calc(240px * var(--sf,1))"');
    expect(gallery).toContain('data-native-block="strip.pictures.4" data-slot="pictures" data-item="4"');
    const bento = render(example('bento'));
    expect(bento).toContain('data-section="bento" data-rhythm="featured" style="--c9y-columns:4;--c9y-bento-height:calc(240px * var(--sf,1))"');
    expect(bento).toContain('c9y-native-tile c9y-native-toned" data-native-block="facilities.items.0" data-slot="items" data-item="0" data-tone="pastel-1"');
    expect(bento).toContain('data-native-block="facilities.items.3" data-slot="items" data-item="3" data-tone="pastel-5"');
    const questions = render(example('questions'));
    expect(questions).toContain('data-section="questions"'); expect(questions).toContain('<details class="c9y-native-node c9y-native-flow" data-native-block="faq.items.0" data-slot="items" data-item="0"');
    expect(questions).toMatch(/data-item="0"[^>]*data-direction="column" open><summary>Do I need a licence\?<\/summary>/); expect(questions).not.toMatch(/data-item="1"[^>]*open>/);
    expect(questions).toContain('data-native-block="faq.items.1.answer" data-slot="answer" data-item="1"');
    const facts = render(example('facts', 1));
    expect(facts).toContain('data-section="facts" style="--c9y-columns:2"'); expect(facts).toContain('data-native-block="particulars.items.3.term" data-slot="term" data-item="3"'); expect(facts).toContain('data-native-block="particulars.items.3.value" data-slot="value" data-item="3"');
    const list = render(example('list'));
    expect(list).toContain('data-section="list" data-dated data-grouped'); expect(list).toContain('data-group="2026"'); expect(list.indexOf('data-group="2026"')).toBeLessThan(list.indexOf('data-group="2025"'));
    expect(list).toContain('<time class="c9y-native-row-date" datetime="2026-05-12" data-native-block="news.items.0.date" data-slot="date" data-item="0">12. maj 2026</time>');
    expect(list).toContain('data-native-block="news.items.1.line" data-slot="line" data-item="1"'); expect(list).toContain('href="/news/may-2026/"');
    const shop = renderNativeBlock(validateNativePage(page([example('list', 2)]), context).blocks[0]!, { collections: { storefront: { items: [{ id: 'a', title: 'A raft', href: '/a/', price: '100 kr' }] } } });
    expect(shop).toContain('>A raft</a>'); expect(shop).toContain('data-slot="value" data-item="0">100 kr<'); expect(shop).toContain('data-native-block="shop.collection.0" data-slot="collection" data-item="0"');
    const action = render(example('action'));
    expect(action).toContain('data-section="action" data-size="large" data-align="centre"'); expect(action).toContain('data-native-block="book.button" data-slot="button"'); expect(action).toContain('ds-button--primary');
  });
  test('header and footer draw the design system\'s own header and footer structure', () => {
    const header = render(example('header'), { currentPath: '/green/', runtime: block => `<button data-runtime="${block.name}"></button>` });
    expect(header).toMatch(/^<header class="c9y-native-node c9y-native-section ds-header ds-header--sticky" data-native-block="site-header" data-section="header" data-fold="30" style="">/);
    expect(header).toContain('c9y-native-flow ds-header__brand" data-native-block="site-header.brand" data-slot="brand"'); expect(header).toContain('data-native-block="site-header.logo" data-slot="logo"'); expect(header).toContain('<a href="/">');
    expect(header).toContain('<nav class="c9y-native-node c9y-native-flow ds-header__nav" data-native-block="site-header.links" data-slot="links"');
    expect(header).toContain('data-native-block="site-header.links.1" data-slot="links" data-item="1"'); expect(header).toContain('href="/green/" aria-current="page">Green raft</a>'); expect(header).not.toContain('href="/blue/" aria-current');
    expect(header).toContain('ds-header__actions" data-native-block="site-header.languages" data-slot="languages"'); expect(header).toContain('data-native-block="site-header.languages.0" data-slot="languages" data-item="0"'); expect(header).toContain('alt="English"'); expect(header).toContain('>Deutsch</a>');
    expect(header).toContain('c9y-native-runtime ds-header__toggle" data-native-block="site-header.menu" data-slot="menu"'); expect(header).toContain('<button data-runtime="MenuToggle">');
    expect(render(example('header', 1))).toContain('data-native-block="small-header.name" data-slot="name"');
    const footer = render(example('footer'), { runtime: () => '' });
    expect(footer).toMatch(/^<footer class="c9y-native-node c9y-native-section ds-footer" data-native-block="site-footer" data-section="footer" style="--ds-footer-column-width:8">/);
    expect(footer).toContain('ds-footer__brand" data-native-block="site-footer.brand" data-slot="brand"'); expect(footer).toContain('ds-footer__mark" data-native-block="site-footer.mark" data-slot="mark"'); expect(footer).toContain('ds-footer__tagline" data-native-block="site-footer.tagline" data-slot="tagline"');
    expect(footer).toContain('<nav class="ds-footer__columns" data-native-block="site-footer.columns" data-slot="columns">');
    expect(footer).toContain('<div class="ds-footer__column" data-native-block="site-footer.columns.1" data-slot="columns" data-item="1" style="--ds-footer-column-width:10">');
    expect(footer).toContain('<p class="ds-footer__heading" data-native-block="site-footer.columns.0.heading" data-slot="heading" data-item="0"><a href="/about/">Harbour Rafts ApS</a></p>');
    expect(footer).toContain('<li><span data-native-block="site-footer.columns.0.lines.0" data-slot="lines" data-item="0">CVR 40379886</span></li>'); expect(footer).toContain('<a href="mailto:info@example.com" data-native-block="site-footer.columns.0.lines.1"');
    expect(footer).toContain('<div class="ds-footer__base" data-native-block="site-footer.base">'); expect(footer).toContain('ds-footer__legal" data-native-block="site-footer.legal" data-slot="legal"');
    expect(footer).toContain('ds-footer__policies" data-native-block="site-footer.policies" data-slot="policies"'); expect(footer).toContain('class="ds-button ds-button--secondary" href="/privacy/"');
    expect(footer).toContain('<div class="ds-footer__preferences"'); expect(footer).toContain('data-native-block="site-footer.languages.1" data-slot="languages" data-item="1"');
    expect(footer).toContain('class="ds-footer__column c9y-native-follow" data-native-block="site-footer.follow" data-slot="follow"'); expect(footer).toContain('https://www.instagram.com/example');
    const small = render(example('footer', 1), { runtime: block => `<button data-runtime="${block.name}"></button>` });
    expect(small).toContain('--ds-footer-column-width:8'); expect(small).not.toContain('ds-footer__brand'); expect(small).toContain('data-native-block="small-footer.preferences" data-slot="preferences"'); expect(small).toContain('data-runtime="Theme"');
    // The test runner gives every ?raw stylesheet an empty string, so the sheet is read from disk here; Vite and the Sync 1 export inline it.
    expect(nativePageStyles).toContain('@scope (.c9y-native-region)');
    const sheet = readFileSync(join(import.meta.dirname, '../shared/consistency-native-page.css'), 'utf8');
    for (const tone of TONES) expect(sheet).toContain(`[data-tone="${tone}"]{--c9y-tone:var(--c9y-tone-${tone},`);
    expect(sheet).toContain('--c9y-tone-ink:var(--c9y-tone-dark-ink,'); expect(sheet).not.toMatch(/#[0-9a-f]{3,8}\b(?![^"]*")/i);
    for (const kind of SECTIONS.map(definition => definition.kind).filter(kind => !['header', 'footer'].includes(kind))) expect(sheet, kind).toContain(`[data-section="${kind}"]`);
  });
  test('the expansion the editor reads is the one the renderer draws', () => {
    const { children, marks } = expandNativeSection(example('cards'));
    expect(children.map(child => child.id)).toEqual(['tours.items.0', 'tours.items.1', 'tours.items.2']);
    expect(marks.get('tours.items.0.title')).toEqual({ slot: 'title', item: 0, classes: undefined });
    expect((children[0] as { children: NativeBlock[] }).children.map(child => child.id)).toEqual(['tours.items.0.label', 'tours.items.0.title', 'tours.items.0.text', 'tours.items.0.action', 'tours.items.0.picture']);
    for (const definition of SECTIONS) for (const block of definition.examples) {
      const ids = [...expandNativeSection(block as NativeSection).marks.keys()];
      expect(new Set(ids).size, definition.kind).toBe(ids.length);
      for (const id of ids) if (definition.kind !== 'panels') expect(id, definition.kind).toMatch(new RegExp(`^${block.id}\\.`));
    }
  });
});

describe('section refusals name what was refused', () => {
  test('a tone outside the library\'s list, a measure off the square and a field no kind has', () => {
    const tone = refusal([{ ...hero(), panelTone: 'mint' as never }]);
    expect(tone.message).toBe('invalid-native-page'); expect(tone.reason).toBe('hero top.panelTone: "mint" is not a tone (paper, cream, dark, accent, highlight, band, pastel-1, pastel-2, pastel-3, pastel-4, pastel-5, pastel-6)');
    expect(refusal([{ ...hero(), height: 12.5 }]).reason).toBe('hero top.height: 12.5 is not a whole number of squares from 12 to 40');
    expect(refusal([{ ...hero(), height: 41 }]).reason).toBe('hero top.height: 41 is not a whole number of squares from 12 to 40');
    expect(refusal([{ ...example('header'), fold: 25 } as never]).reason).toBe('header site-header.fold: 25 is not on the step of 10 squares from 20');
    expect(refusal([{ ...example('cards'), columns: 0 } as never]).reason).toBe('cards tours.columns: 0 is not a whole number from 1 to 4');
    expect(refusal([{ ...hero(), style: 'position:fixed' } as never]).reason).toBe('hero top: "style" is not a field or slot of this kind');
    expect(refusal([{ ...hero(), picture: undefined } as never]).reason).toBe('hero top.picture is required');
    expect(refusal([{ ...hero(), picture: { src: '/elsewhere.jpg', alt: '' } }]).reason).toBe('hero top.picture.src: "/elsewhere.jpg" is not one of the page\'s images');
    expect(refusal([{ ...hero(), actions: [{ text: 'Go', href: 'javascript:alert(1)' }] }]).reason).toBe('hero top.actions[0].href: not a safe address');
    expect(refusal([{ ...hero(), title: '![x](/elsewhere.jpg)' }]).reason).toBe('hero top.title: the Markdown has a picture, link or atom the page cannot publish');
    expect(refusal([{ ...example('list'), collection: 'storefront' } as never]).reason).toBe('list news: exactly one of items or collection');
    expect(refusal([{ ...example('list'), items: [{ name: 'x', date: '2026-13-01' }] } as never]).reason).toBe('list news.items[0].date: "2026-13-01" is not a day as YYYY-MM-DD');
    expect(refusal([{ ...example('header'), menu: { name: 'Cart', props: { query: 'x' } } } as never]).reason).toBe('header site-header.menu.props: "query" is not a field or slot of this kind');
  });
  test('a section inside a section, except heroes in panels', () => {
    const panels = example('panels') as { items: NativeBlock[] };
    panels.items[1] = example('split');
    expect(refusal([panels as NativeBlock]).reason).toBe('panels rafts.items[1]: only a hero stands in panels, not a split');
    const nested = example('panels') as { items: NativeBlock[]; id: string };
    const inner = example('panels') as { items: NativeHero[]; id: string }; inner.id = 'inner'; inner.items.forEach((hero, index) => { hero.id = `inner-${index}`; });
    nested.items[1] = inner as unknown as NativeBlock;
    expect(refusal([nested as NativeBlock]).reason).toBe('panels rafts.items[1]: only a hero stands in panels, not a panels');
    expect(refusal([{ ...example('panels'), items: [hero()] } as never]).reason).toBe('panels rafts.items: at least 2');
    const twice = example('panels') as { items: NativeHero[] }; twice.items[1]!.id = twice.items[0]!.id;
    expect(refusal([twice as NativeBlock]).reason).toBe('id "rafts-green" is used twice');
    const flowAround = { id: 'wrap', kind: 'flow', direction: 'column', gap: 0, padding: 0, children: [example('statement')] } as NativeBlock;
    expect(validateNativePage(page([flowAround]), context).blocks[0]).toEqual(flowAround);
  });
  test('a hero that is not valid is refused with the same message the platform relays', () => {
    expect(() => validateNativePage(page([{ id: 'top', kind: 'hero' } as never]), context)).toThrow('invalid-native-page');
  });
});

describe('the sites built on the primitives alone stay valid, unchanged', () => {
  const fixtures = ['/Users/joachim/0001/Clients/CPH Raft/dist/native/pages.json', '/Users/joachim/0001/Clients/Soendergaarden/dist/native/pages.json'];
  for (const path of fixtures) test.skipIf(!existsSync(path))(path, () => {
    const build = JSON.parse(readFileSync(path, 'utf8')) as { pages: Record<string, { document: NativePageDocument; images: string[]; collections: Record<string, unknown>; allowedRuntimes: Record<string, string[]> }> };
    const entries = Object.entries(build.pages);
    expect(entries.length).toBeGreaterThan(0);
    for (const [route, entry] of entries) {
      const checked = validateNativePage(entry.document, { images: entry.images, collections: Object.keys(entry.collections), runtimes: entry.allowedRuntimes, bindings: [] });
      expect(checked, route).toEqual(entry.document);
      const html = renderNativePage(checked, { images: entry.images, runtime: () => '' });
      expect(html, route).not.toContain('data-section=');
    }
  });
});
