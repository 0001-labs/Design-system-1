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
const sq = (squares: number) => `calc(${squares * 20}px * var(--sf,1))`;
const sheet = readFileSync(join(import.meta.dirname, '../shared/consistency-native-page.css'), 'utf8');

describe('section kinds expand to primitives', () => {
  test('a hero is a picture and a toned panel of logo, kicker, title, text and actions', () => {
    const top = hero();
    const html = render(top);
    expect(html).toMatch(/^<section class="c9y-native-node c9y-native-section" data-native-block="top" data-section="hero" data-panel="centre" data-room="flush" data-translucent style="--c9y-hero-height:min\(calc\(480px \* var\(--sf,1\)\),80svh\);--c9y-hero-mobile-height:min\(calc\(480px \* var\(--sf,1\)\),80svh\);--c9y-panel-width:calc\(480px \* var\(--sf,1\)\)">/);
    expect(html).toContain('<figure class="c9y-native-node c9y-native-image" data-native-block="top.picture" data-slot="picture"');
    expect(html).toContain('class="c9y-native-node c9y-native-flow c9y-native-toned" data-native-block="top.panel" data-slot="panel" data-tone="cream"');
    expect(html).toContain('data-native-block="top.logo" data-slot="logo"');
    expect(html).toContain('data-native-block="top.title" data-slot="title"'); expect(html).toContain('<h1>The cosiest boat hire in town</h1>');
    expect(html).toContain('data-native-block="top.actions" data-slot="actions"');
    expect(html).toContain('data-native-block="top.actions.0" data-slot="actions" data-item="0"'); expect(html).toContain('class="ds-button ds-button--primary" data-face="outlined" data-size="medium" href="/book/"');
    expect(html).toContain('data-native-block="top.actions.1" data-slot="actions" data-item="1"'); expect(html).toContain('class="ds-button ds-button--secondary" href="/prices/"');
    expect(html).toContain('--c9y-image-fit:cover;--c9y-image-focus:50% 30%');
    const cabin = render(hero(1));
    expect(cabin).toContain('<h1>Floating glamping</h1>'); expect(cabin).toContain('data-panel="left" data-room="gap" style="--c9y-hero-height:calc(600px * var(--sf,1));--c9y-hero-mobile-height:calc(400px * var(--sf,1));--c9y-panel-width:calc(480px * var(--sf,1))"'); expect(cabin).not.toContain('data-translucent');
    expect(render({ ...top, title: '## Already a heading' })).toContain('<h2>Already a heading</h2>');
    expect(nativeBlockStyles(top)).toEqual({ '--c9y-hero-height': 'min(calc(480px * var(--sf,1)),80svh)', '--c9y-hero-mobile-height': 'min(calc(480px * var(--sf,1)),80svh)', '--c9y-panel-width': sq(24) });
    const editor = render(top, { editor: true });
    expect(editor).toContain('data-c9y-block="top" data-c9y-kind="hero"'); expect(editor).toContain('data-c9y-block="top.title" data-c9y-kind="content"');
  });
  test('the other kinds carry their slots, items and derived ids', () => {
    const split = render(example('split', 1));
    expect(split).toContain(`data-section="split" data-reverse data-heading-align="start" style="--c9y-split-columns:minmax(0,6fr) minmax(0,5fr);--c9y-split-image-height:${sq(20)};--c9y-split-mobile-image-height:${sq(20)};--c9y-split-overlap:${sq(4)}"`);
    expect(split).toContain('data-native-block="blue.heading" data-slot="heading"'); expect(split).toContain('<h2>Blue raft</h2>'); expect(split).toContain('data-tone="paper"'); expect(split).toContain('--c9y-image-focus:40% 50%');
    expect(render(example('split'))).toContain(`data-section="split" data-heading-align="centre" style="--c9y-split-columns:minmax(0,1fr) minmax(0,1fr);--c9y-split-image-height:${sq(16)};--c9y-split-mobile-image-height:${sq(12)};--c9y-split-overlap:${sq(2)}"`);
    const statement = render(example('statement', 1));
    expect(statement).toContain(`class="c9y-native-node c9y-native-section c9y-native-toned" data-native-block="hours" data-section="statement" data-align="centre" data-heading-align="start" data-tone="cream" style="--c9y-statement-width:${sq(32)}"`);
    expect(render(example('statement'))).toContain('data-align="start" data-heading-align="centre" style=');
    const title = render(example('statement', 2));
    expect(title).toContain('data-section="statement" data-align="start" data-heading-align="start" data-hidden-title style="--c9y-statement-width:none"'); expect(title).toContain('<h1>Harbour rafts: boat hire and floating glamping</h1>'); expect(title).not.toContain(' hidden');
    const panels = render(example('panels'));
    expect(panels).toContain('data-section="panels" data-room="flush" style="--c9y-columns:2;--c9y-gap:calc(0px * var(--sf,1))"');
    expect(panels).toContain('data-native-block="rafts-green" data-section="hero" data-panel="centre" data-room="flush" data-slot="items" data-item="0"');
    expect(panels).toContain('data-native-block="rafts-blue.title" data-slot="title"'); expect(panels).toContain('<h2>Floating glamping</h2>');
    const cards = render(example('cards'));
    expect(cards).toContain(`data-section="cards" data-variant="filled" data-tone="cream" data-measure="wide" style="--c9y-columns:3;--c9y-card-height:${sq(16)};--c9y-card-mobile-height:${sq(12)};--c9y-measure:${sq(62)}"`);
    expect(cards).toContain('class="c9y-native-node c9y-native-flow c9y-native-card c9y-native-toned" data-native-block="tours.items.1" data-slot="items" data-item="1"');
    expect(cards).toContain('data-native-block="tours.items.1.title" data-slot="title" data-item="1"'); expect(cards).toContain('<h3>Sunset sailing</h3>');
    expect(cards).toContain('data-native-block="tours.items.0.picture" data-slot="picture" data-item="0"'); expect(cards).toContain('data-native-block="tours.items.2.action" data-slot="action" data-item="2"');
    expect(cards).toContain('class="ds-button ds-button--primary" data-face="outlined" data-size="medium" href="/book/green/"');
    expect(render(example('cards', 1))).toContain(`c9y-native-card" data-native-block="news.items.0"`); expect(render(example('cards', 1))).toContain(`data-measure="full" style="--c9y-columns:2;--c9y-card-height:${sq(8)};--c9y-card-mobile-height:${sq(8)};--c9y-measure:none"`);
    const gallery = render(example('gallery', 1));
    expect(gallery).toContain(`data-section="gallery" data-strip data-measure="full" style="--c9y-columns:3;--c9y-gallery-height:${sq(12)};--c9y-gallery-mobile-height:${sq(12)};--c9y-measure:none"`);
    expect(gallery).toContain('data-native-block="strip.pictures.4" data-slot="pictures" data-item="4"');
    expect(render(example('gallery'))).toContain(`data-measure="wide" style="--c9y-columns:4;--c9y-gallery-height:${sq(8)};--c9y-gallery-mobile-height:${sq(6)};--c9y-measure:${sq(62)}"`);
    const bento = render(example('bento'));
    expect(bento).toContain(`data-section="bento" data-rhythm="featured" data-measure="full" style="--c9y-columns:4;--c9y-bento-height:${sq(12)};--c9y-bento-mobile-height:${sq(8)};--c9y-measure:none"`);
    expect(bento).toContain('c9y-native-tile c9y-native-toned" data-native-block="facilities.items.0" data-slot="items" data-item="0" data-tone="pastel-1"');
    expect(bento).toContain('data-native-block="facilities.items.3" data-slot="items" data-item="3" data-tone="pastel-5"'); expect(bento).toContain('<h3>Barbecue</h3>');
    const questions = render(example('questions'));
    expect(questions).toContain(`data-section="questions" data-measure="reading" style="--c9y-measure:${sq(32)}"`); expect(questions).toContain('<details class="c9y-native-node c9y-native-flow" data-native-block="faq.items.0" data-slot="items" data-item="0"');
    expect(questions).toMatch(/data-item="0"[^>]*data-direction="column" open><summary>Do I need a licence\?<\/summary>/); expect(questions).not.toMatch(/data-item="1"[^>]*open>/);
    expect(questions).toContain('data-native-block="faq.items.1.answer" data-slot="answer" data-item="1"');
    const facts = render(example('facts', 1));
    expect(facts).toContain('data-section="facts" data-measure="full" style="--c9y-columns:2;--c9y-measure:none"'); expect(facts).toContain('data-native-block="particulars.items.3.term" data-slot="term" data-item="3"'); expect(facts).toContain('data-native-block="particulars.items.3.value" data-slot="value" data-item="3"');
    const list = render(example('list'));
    expect(list).toContain(`data-section="list" data-dated data-grouped data-measure="reading" style="--c9y-measure:${sq(32)}"`); expect(list).toContain('data-group="2026"'); expect(list.indexOf('data-group="2026"')).toBeLessThan(list.indexOf('data-group="2025"'));
    expect(list).toContain('<time class="c9y-native-row-date" datetime="2026-05-12" data-native-block="news.items.0.date" data-slot="date" data-item="0">12. maj 2026</time>');
    expect(list).toContain('data-native-block="news.items.1.line" data-slot="line" data-item="1"'); expect(list).toContain('href="/news/may-2026/"');
    const shop = renderNativeBlock(validateNativePage(page([example('list', 2)]), context).blocks[0]!, { collections: { storefront: { items: [{ id: 'a', title: 'A raft', href: '/a/', price: '100 kr' }] } } });
    expect(shop).toContain('>A raft</a>'); expect(shop).toContain('data-slot="value" data-item="0">100 kr<'); expect(shop).toContain('data-native-block="shop.collection.0" data-slot="collection" data-item="0"');
    const action = render(example('action'));
    expect(action).toContain(`data-section="action" data-size="large" data-align="centre" data-measure="wide" style="--c9y-measure:${sq(62)}"`); expect(action).toContain('data-native-block="book.button" data-slot="button"'); expect(action).toContain('class="ds-button ds-button--primary" data-face="outlined" data-size="large" href="/book/"');
    expect(render(example('action', 1))).toContain('class="ds-button ds-button--secondary" data-size="medium" href="/gift/"');
  });
  test('header and footer draw the design system\'s own header and footer structure', () => {
    const header = render(example('header'), { currentPath: '/green/', runtime: block => `<button data-runtime="${block.name}"></button>` });
    expect(header).toMatch(/^<header class="c9y-native-node c9y-native-section ds-header ds-header--sticky" data-native-block="site-header" data-section="header" data-fold="40" data-links="line" style="--c9y-logo-height:calc\(80px \* var\(--sf,1\)\);--c9y-mobile-logo-height:calc\(60px \* var\(--sf,1\)\)">/);
    expect(header).toContain('c9y-native-flow ds-header__brand" data-native-block="site-header.brand" data-slot="brand"'); expect(header).toContain('data-native-block="site-header.logo" data-slot="logo"'); expect(header).toContain('<a href="/">');
    expect(header).toContain('<nav class="c9y-native-node c9y-native-flow ds-header__nav" data-native-block="site-header.links" data-slot="links"');
    expect(header).toContain('data-native-block="site-header.links.1" data-slot="links" data-item="1"'); expect(header).toContain('href="/green/" aria-current="page">Green raft</a>'); expect(header).not.toContain('href="/blue/" aria-current');
    expect(header).toContain('ds-header__actions" data-native-block="site-header.languages" data-slot="languages"'); expect(header).toContain('data-native-block="site-header.languages.0" data-slot="languages" data-item="0"'); expect(header).toContain('alt="English"'); expect(header).toContain('>Deutsch</a>');
    expect(header).toContain('c9y-native-runtime ds-header__toggle" data-native-block="site-header.menu" data-slot="menu"'); expect(header).toContain('<button data-runtime="MenuToggle">');
    const small = render(example('header', 1));
    expect(small).toContain('data-native-block="small-header.name" data-slot="name"'); expect(small).toContain(`data-fold="30" data-links="plain" style="--c9y-logo-height:${sq(2)};--c9y-mobile-logo-height:${sq(2)}"`);
    const footer = render(example('footer'), { runtime: () => '', currentPath: '/en/' });
    expect(footer).toMatch(/^<footer class="c9y-native-node c9y-native-section ds-footer" data-native-block="site-footer" data-section="footer" style="--ds-footer-column-width:8">/);
    expect(footer).toContain('ds-footer__brand" data-native-block="site-footer.brand" data-slot="brand"'); expect(footer).toContain('ds-footer__mark" data-native-block="site-footer.mark" data-slot="mark"'); expect(footer).toContain('ds-footer__tagline" data-native-block="site-footer.tagline" data-slot="tagline"');
    expect(footer).toContain('<nav class="ds-footer__columns" data-native-block="site-footer.columns" data-slot="columns">');
    expect(footer).toContain('<div class="ds-footer__column" data-native-block="site-footer.columns.1" data-slot="columns" data-item="1" style="--ds-footer-column-width:10">');
    expect(footer).toContain('<p class="ds-footer__heading" data-native-block="site-footer.columns.0.heading" data-slot="heading" data-item="0"><a href="/about/">Harbour Rafts ApS</a></p>');
    expect(footer).toContain('<li><span data-native-block="site-footer.columns.0.lines.0" data-slot="lines" data-item="0">CVR 40379886</span></li>'); expect(footer).toContain('<a href="mailto:info@example.com" data-native-block="site-footer.columns.0.lines.1"');
    expect(footer).toContain('<div class="ds-footer__base" data-native-block="site-footer.base">'); expect(footer).toContain('ds-footer__legal" data-native-block="site-footer.legal" data-slot="legal"');
    expect(footer).toContain('ds-footer__policies" data-native-block="site-footer.policies" data-slot="policies"'); expect(footer).toContain('class="ds-button ds-button--secondary" href="/privacy/"');
    expect(footer).toContain('<div class="ds-footer__preferences"'); expect(footer).toContain('data-native-block="site-footer.languages.1" data-slot="languages" data-item="1"');
    // The language being read is marked from the address, as the header's links are.
    expect(footer).toContain('href="/en/" aria-current="page">English</a>'); expect(footer).not.toContain('href="/" aria-current');
    // Follow links with an icon are the footer's stacked column of round marks, each named by its words.
    expect(footer).toContain('class="ds-footer__column c9y-native-follow ds-footer__column--stack" data-native-block="site-footer.follow" data-slot="follow"><ul class="ds-footer__icons">');
    expect(footer).toMatch(/<a href="https:\/\/www\.instagram\.com\/example" aria-label="Instagram" data-native-block="site-footer\.follow\.0" data-slot="follow" data-item="0"><span class="c9y-native-icon" aria-hidden="true"><svg/);
    const words = render({ ...example('footer'), follow: [{ text: 'Instagram', href: 'https://www.instagram.com/example' }] } as NativeBlock, { runtime: () => '' });
    expect(words).toContain('class="ds-footer__column c9y-native-follow" data-native-block="site-footer.follow" data-slot="follow"><ul class="ds-footer__links"><li><a href="https://www.instagram.com/example" data-native-block="site-footer.follow.0" data-slot="follow" data-item="0">Instagram</a>');
    const small2 = render(example('footer', 1), { runtime: block => `<button data-runtime="${block.name}"></button>` });
    expect(small2).toContain('--ds-footer-column-width:8'); expect(small2).not.toContain('ds-footer__brand'); expect(small2).toContain('data-native-block="small-footer.preferences" data-slot="preferences"'); expect(small2).toContain('data-runtime="Theme"');
    // The test runner gives every ?raw stylesheet an empty string, so the sheet is read from disk here; Vite and the Sync 1 export inline it.
    expect(nativePageStyles).toContain('@scope (.c9y-native-region)');
    for (const tone of TONES) { expect(sheet).toContain(`[data-tone="${tone}"]{--c9y-tone:var(--c9y-tone-${tone},`); expect(sheet).toContain(`--c9y-tone-glass:var(--c9y-tone-${tone}-glass,color-mix(in srgb,var(--c9y-tone) 85%,transparent))`); }
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

describe('the measures the old sites needed, as fields with defaults', () => {
  test('a picture\'s focus is its object-position; a height has its phone height beside it', () => {
    const focused = render({ ...hero(1), picture: { src: '/photos/harbour.jpg', alt: '', focus: { x: 7, y: 56 } } });
    expect(focused).toContain('data-slot="picture" style="--c9y-image-height:auto;--c9y-mobile-image-height:auto;--c9y-image-fit:cover;--c9y-image-focus:7% 56%"');
    expect(render(hero(1))).not.toContain('--c9y-image-focus');
    expect(refusal([{ ...hero(), picture: { src: '/photos/harbour.jpg', alt: '', focus: { x: 101, y: 0 } } }]).reason).toBe('hero top.picture.focus.x: a whole percentage from 0 to 100');
    expect(refusal([{ ...hero(), picture: { src: '/photos/harbour.jpg', alt: '', focus: { x: 50 } } } as never]).reason).toBe('hero top.picture.focus.y: a whole percentage from 0 to 100');
    expect(refusal([{ ...hero(), picture: { src: '/photos/harbour.jpg', alt: '', focus: { x: 50, y: 50, z: 1 } } } as never]).reason).toBe('hero top.picture.focus: "z" is not a field or slot of this kind');
    const image = validateNativePage(page([{ id: 'photo', kind: 'image', src: '/photos/harbour.jpg', alt: '', fit: 'cover', focus: { x: 0, y: 100 } }]), context).blocks[0]!;
    expect(nativeBlockStyles(image)).toMatchObject({ '--c9y-image-focus': '0% 100%' });
    expect(sheet).toContain('object-position:var(--c9y-image-focus,50% 50%)');
    expect(refusal([{ ...hero(), mobileHeight: 8 }]).reason).toBe('hero top.mobileHeight: 8 is not a whole number of squares from 12 to 40');
    expect(refusal([{ ...example('split'), mobileImageHeight: 31 } as never]).reason).toBe('split green.mobileImageHeight: 31 is not a whole number of squares from 8 to 30');
    for (const kind of ['cards', 'gallery', 'bento'] as const) expect(refusal([{ ...example(kind), mobileHeight: 0 } as never]).reason, kind).toContain(`${kind} ${example(kind).id}.mobileHeight: 0 is not a whole number of squares`);
    for (const [variable, mobile] of [['--c9y-hero-mobile-height', '--c9y-hero-height'], ['--c9y-split-mobile-image-height', '--c9y-split-image-height'], ['--c9y-card-mobile-height', '--c9y-card-height'], ['--c9y-gallery-mobile-height', '--c9y-gallery-height'], ['--c9y-bento-mobile-height', '--c9y-bento-height'], ['--c9y-mobile-logo-height', '--c9y-logo-height']]) expect(sheet, variable).toContain(`var(${variable},var(${mobile}`);
  });
  test('a hero fills the window or its height, lets the picture through its panel, chooses its panel\'s width and its room under the header', () => {
    const fixed = render({ ...hero(), fill: 'fixed', translucent: false, panelWidth: 32, room: 'gap' });
    expect(fixed).toContain(`data-panel="centre" data-room="gap" style="--c9y-hero-height:${sq(24)};--c9y-hero-mobile-height:${sq(24)};--c9y-panel-width:${sq(32)}"`);
    expect(refusal([{ ...hero(), fill: 'screen' } as never]).reason).toBe('hero top.fill: "screen" is not one of fixed, window');
    expect(refusal([{ ...hero(), panelWidth: 41 }]).reason).toBe('hero top.panelWidth: 41 is not a whole number of squares from 12 to 40');
    expect(refusal([{ ...hero(), translucent: 'yes' } as never]).reason).toBe('hero top.translucent: true or false');
    expect(refusal([{ ...example('panels'), room: 'tight' } as never]).reason).toBe('panels rafts.room: "tight" is not one of flush, gap');
    expect(sheet).toContain('[data-section="hero"][data-translucent]>[data-slot="panel"]{background:var(--c9y-tone-glass);-webkit-backdrop-filter:blur(calc(2px * var(--sf,1)));backdrop-filter:blur(calc(2px * var(--sf,1)))}');
    expect(sheet).toContain('width:min(100%,var(--c9y-panel-width,calc(24 * var(--c9y-unit))))');
    expect(sheet).toContain('.c9y-native-page>[data-section="header"]+:is([data-section="hero"],[data-section="panels"])[data-room="flush"],.c9y-native-page>[data-section="header"]+:is([hidden],[data-hidden-title])+:is([data-section="hero"],[data-section="panels"])[data-room="flush"]{margin-top:calc(-1 * var(--c9y-page-gap,0px))}');
  });
  test('a split lays its panel over the picture by its overlap and ratio; a statement centres its heading or keeps its words for machines', () => {
    const split = render({ ...example('split'), ratio: '5:6', overlap: 0, headingAlign: 'start' } as NativeBlock);
    expect(split).toContain(`data-heading-align="start" style="--c9y-split-columns:minmax(0,5fr) minmax(0,6fr);--c9y-split-image-height:${sq(16)};--c9y-split-mobile-image-height:${sq(12)};--c9y-split-overlap:${sq(0)}"`);
    expect(render({ ...example('split'), ratio: '2:1', reverse: true } as NativeBlock)).toContain('--c9y-split-columns:minmax(0,1fr) minmax(0,2fr)');
    expect(refusal([{ ...example('split'), ratio: '3:4' } as never]).reason).toBe('split green.ratio: "3:4" is not one of 1:1, 2:1, 5:6');
    expect(refusal([{ ...example('split'), overlap: 5 } as never]).reason).toBe('split green.overlap: 5 is not a whole number of squares from 0 to 4');
    expect(sheet).toContain('[data-section="split"][data-heading-align="centre"] [data-slot="heading"]{text-align:center}');
    expect(sheet).toContain('margin-inline-start:calc(-1 * var(--c9y-split-overlap,calc(2 * var(--c9y-unit))))');
    const full = render({ ...example('statement'), measure: 'full', headingAlign: 'centre' } as NativeBlock);
    expect(full).toContain('data-align="start" data-heading-align="centre" style="--c9y-statement-width:none"'); expect(full).not.toContain('data-hidden-title');
    expect(render({ ...example('statement'), measure: 'wide' } as NativeBlock)).toContain(`--c9y-statement-width:${sq(50)}`);
    expect(refusal([{ ...example('statement'), hiddenTitle: 1 } as never]).reason).toBe('statement about.hiddenTitle: true or false');
    expect(sheet).toContain('[data-section="statement"][data-heading-align="centre"]>[data-slot="heading"]{text-align:center}');
    expect(sheet).toContain('.c9y-native-section[data-hidden-title]{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0}');
  });
  test('grids stand in a measure: reading, wide or the page, with a square from a phone\'s edges', () => {
    for (const kind of ['cards', 'gallery', 'bento', 'questions', 'facts', 'list', 'action'] as const) {
      const block = example(kind);
      expect(render({ ...block, measure: 'reading' } as NativeBlock), kind).toContain(`data-measure="reading"`); expect(render({ ...block, measure: 'reading' } as NativeBlock), kind).toContain(`--c9y-measure:${sq(32)}`);
      expect(render({ ...block, measure: 'wide' } as NativeBlock), kind).toContain(`--c9y-measure:${sq(62)}`);
      expect(render({ ...block, measure: 'full' } as NativeBlock), kind).toContain('--c9y-measure:none');
      delete (block as Record<string, unknown>).measure;
      expect(render(block), kind).toContain('data-measure="full"');
      expect(refusal([{ ...block, measure: 'narrow' } as never]).reason, kind).toBe(`${kind} ${block.id}.measure: "narrow" is not one of reading, wide, full`);
    }
    expect(refusal([{ ...hero(), measure: 'wide' } as never]).reason).toBe('hero top: "measure" is not a field or slot of this kind');
    expect(sheet).toContain('.c9y-native-section[data-measure]{width:100%;max-width:var(--c9y-measure,none);margin-inline:auto}');
    expect(sheet).toContain('.c9y-native-section:is([data-measure="wide"],[data-measure="full"]){padding-inline:var(--c9y-unit)}');
  });
  test('a button names its face and size, written as the library\'s attributes only when it does', () => {
    const plain = render({ ...example('action', 1), button: { text: 'Go', href: '/go/' } } as NativeBlock);
    expect(plain).toContain('class="ds-button ds-button--primary" data-size="medium" href="/go/"'); expect(plain).not.toContain('data-face');
    expect(render({ ...example('action', 1), button: { text: 'Go', href: '/go/', size: 'large' } } as NativeBlock)).toContain('data-size="large" href="/go/"');
    const bento = render({ ...example('bento', 1), items: [{ title: 'Sail', action: { text: 'Ask', href: '/ask/', appearance: 'secondary', face: 'outlined', size: 'large' } }] } as NativeBlock);
    expect(bento).toContain('class="ds-button ds-button--secondary" data-face="outlined" data-size="large" href="/ask/"');
    expect(refusal([{ ...hero(), actions: [{ text: 'Go', href: '/go/', face: 'ghost' }] } as never]).reason).toBe('hero top.actions[0].face: filled or outlined');
    expect(refusal([{ ...hero(), actions: [{ text: 'Go', href: '/go/', size: 'small' }] } as never]).reason).toBe('hero top.actions[0].size: medium or large');
    const link = validateNativePage(page([{ id: 'go', kind: 'link', text: 'Go', href: '/go/', appearance: 'primary', face: 'outlined', size: 'large' }]), context);
    expect(renderNativePage(link)).toContain('class="ds-button ds-button--primary" data-face="outlined" data-size="large" href="/go/"');
    expect(() => validateNativePage(page([{ id: 'go', kind: 'link', text: 'Go', href: '/go/', face: 'ghost' } as never]), context)).toThrow('invalid-native-page');
    expect(sheet).toContain('.c9y-native-page a:where(.ds-button[data-face="outlined"]){--ds-button-background:transparent;--ds-button-color:var(--ds-text-color,var(--c9y-ink));box-shadow:inset 0 0 0 1px currentColor}');
    expect(sheet).toContain('.c9y-native-page a:where(.ds-button--primary[data-face="outlined"]){box-shadow:inset 0 0 0 calc(3px * var(--sf,1)) currentColor}');
    expect(sheet).toContain('.c9y-native-page a:where(.ds-button[data-size="large"]){--ds-button-height:calc(2 * var(--c9y-unit));--ds-button-padding:0 var(--c9y-unit)}');
    expect(sheet).not.toContain('[data-size="large"] .ds-button');
  });
  test('a bento turns through its tones and draws its titles as headings or strong lines', () => {
    const why = render(example('bento', 1));
    expect(why).toContain('data-item="0" data-tone="pastel-1"'); expect(why).toContain('data-item="1" data-tone="highlight"'); expect(why).toContain('data-item="2" data-tone="pastel-2"');
    expect(why).toContain('<p><strong>Stay</strong></p>'); expect(why).not.toContain('<h3>');
    expect(render({ ...example('bento', 1), items: [{ title: '## Kept' }] } as NativeBlock)).toContain('<h2>Kept</h2>');
    const six = render({ ...example('bento'), items: Array.from({ length: 7 }, (_, index) => ({ title: `Tile ${index}` })) } as NativeBlock);
    expect(six).toContain('data-item="5" data-tone="pastel-6"'); expect(six).toContain('data-item="6" data-tone="pastel-1"');
    expect(refusal([{ ...example('bento'), tones: ['pastel-1', 'mint'] } as never]).reason).toBe('bento facilities.tones[1]: "mint" is not a tone (paper, cream, dark, accent, highlight, band, pastel-1, pastel-2, pastel-3, pastel-4, pastel-5, pastel-6)');
    expect(refusal([{ ...example('bento'), tones: [] } as never]).reason).toBe('bento facilities.tones: a list of 1 to 12 tones');
    expect(refusal([{ ...example('bento'), tones: 'pastel-1' } as never]).reason).toBe('bento facilities.tones: a list of 1 to 12 tones');
    expect(refusal([{ ...example('bento'), titleFace: 'bold' } as never]).reason).toBe('bento facilities.titleFace: "bold" is not one of heading, strong');
  });
  test('a header sizes its mark, folds up to sixty squares, hangs its links from a line and draws languages as flags', () => {
    const header = render({ ...example('header'), fold: 60, logoHeight: 1, linkStyle: 'plain', mobileLogoHeight: undefined } as NativeBlock);
    expect(header).toContain(`data-fold="60" data-links="plain" style="--c9y-logo-height:${sq(1)};--c9y-mobile-logo-height:${sq(1)}"`);
    expect(refusal([{ ...example('header'), fold: 70 } as never]).reason).toBe('header site-header.fold: 70 is not a whole number of squares from 20 to 60');
    expect(refusal([{ ...example('header'), logoHeight: 5 } as never]).reason).toBe('header site-header.logoHeight: 5 is not a whole number of squares from 1 to 4');
    expect(refusal([{ ...example('header'), mobileLogoHeight: 0 } as never]).reason).toBe('header site-header.mobileLogoHeight: 0 is not a whole number of squares from 1 to 4');
    expect(refusal([{ ...example('header'), linkStyle: 'underline' } as never]).reason).toBe('header site-header.linkStyle: "underline" is not one of plain, line');
    for (const fold of [50, 60]) expect(sheet).toContain(`@container (max-width: ${fold * 20 - 1}px){.ds-header[data-fold="${fold}"]>:is(.ds-header__nav,.ds-header__actions){display:none}.ds-header[data-fold="${fold}"]>.ds-header__toggle{display:block}}`);
    expect(sheet).toContain('.ds-header [data-slot="logo"] img{width:auto;max-width:100%;height:var(--c9y-logo-height,var(--c9y-unit))}');
    expect(sheet).toContain('.ds-header[data-links="line"] .ds-header__nav a{display:flex;align-items:flex-end;height:calc(2 * var(--c9y-unit));padding:0 calc(8px * var(--sf,1));text-decoration:none;box-shadow:inset 0 1px currentColor}');
    expect(sheet).toContain('.ds-header[data-links="line"] .ds-header__nav a[aria-current]:not([aria-current="false"]){color:var(--ds-accent-color,var(--c9y-accent));box-shadow:inset 0 calc(4px * var(--sf,1)) currentColor}');
    // A language's flag is the design system's: one control high, 3:2, corners a quarter of its height, the fill's hairline on its edge.
    expect(sheet).toContain('.ds-header [data-slot="languages"] img{--c9y-flag:var(--ds-control-height,calc(16px * var(--sf,1)));width:calc(1.5 * var(--c9y-flag));height:var(--c9y-flag);object-fit:cover;border-radius:calc(var(--c9y-flag) / 4);outline:1px solid var(--ds-fill,var(--c9y-fill));outline-offset:-0.5px}');
    // The sticky header stands above a hero's panel (z-index 1), so it is never covered as the page scrolls.
    const headerSheet = readFileSync(join(import.meta.dirname, '../DS1/1-root/header.css'), 'utf8');
    expect(headerSheet).toMatch(/\.ds-header--sticky \{[^}]*z-index: 2;/);
  });
  test('a footer\'s follow marks name one of the library\'s icons', () => {
    expect(refusal([{ ...example('footer'), follow: [{ text: 'Pigeon', href: 'https://example.com', icon: 'carrier-pigeon' }] } as never]).reason).toBe('footer site-footer.follow[0].icon: "carrier-pigeon" is not one of the library\'s icons');
    expect(refusal([{ ...example('footer'), follow: [{ text: 'X', href: 'https://example.com', icon: 'constructor' }] } as never]).reason).toBe('footer site-footer.follow[0].icon: "constructor" is not one of the library\'s icons');
    expect(sheet).toContain('.ds-footer .c9y-native-link[aria-current]:not([aria-current="false"]){text-decoration-color:currentColor}');
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

/* The sites built on the vocabulary stay valid, unchanged, through every field added with a default: Søndergården on the
   primitives alone, CPH Raft on the sections. Each site's build is read where it was written; a missing build skips its case. */
type Build = { pages: Record<string, { document: NativePageDocument; images: string[]; collections: Record<string, unknown>; allowedRuntimes: Record<string, string[]> }> };
const site = (path: string) => {
  const build = JSON.parse(readFileSync(path, 'utf8')) as Build;
  const entries = Object.entries(build.pages);
  expect(entries.length).toBeGreaterThan(0);
  return entries.map(([route, entry]) => {
    const checked = validateNativePage(entry.document, { images: entry.images, collections: Object.keys(entry.collections), runtimes: entry.allowedRuntimes, bindings: [] });
    expect(checked, route).toEqual(entry.document);
    return { route, html: renderNativePage(checked, { images: entry.images, runtime: () => '' }) };
  });
};
describe('the sites built on the vocabulary stay valid, unchanged', () => {
  const primitives = '/Users/joachim/0001/Clients/Soendergaarden/dist/native/pages.json', sections = '/Users/joachim/0001/Clients/CPH Raft/dist/native/pages.json';
  test.skipIf(!existsSync(primitives))('Søndergården, on the primitives alone', () => {
    for (const { route, html } of site(primitives)) expect(html, route).not.toContain('data-section=');
  });
  test.skipIf(!existsSync(sections))('CPH Raft, on the sections', () => {
    for (const { route, html } of site(sections)) { expect(html, route).toContain('data-section="header"'); expect(html, route).toContain('data-section="footer"'); expect(html, route).toMatch(/data-section="(hero|split|statement|panels|cards|gallery|bento|questions|facts|action)"/); }
  });
});
