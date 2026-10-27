import { describe, expect, test } from 'vite-plus/test';
import { ASK_VOCABULARY, askHeuristic, askJudgmentQuestions, askPictures, askPrompt, checkAskAnswer, parseAskAnswer, readAskJudgment, snapMeasure, type AskContext, type AskDocument, type AskInput } from '../shared/consistency-ask';
import { SECTIONS, sectionDefinition, vocabularyRecord } from '../shared/consistency-vocabulary';
import { validateNativePage, type NativeBlock, type NativePageDocument } from '../shared/consistency-native-page';

const images = ['/photos/harbour.jpg', '/photos/logo.svg'], collections = ['storefront'], runtimes = { MenuToggle: [] as string[] };
const site = { name: 'Harbour rafts', lang: 'en', origin: 'https://example.com', pages: [{ path: '/', title: 'Home' }, { path: '/book/', title: 'Book' }] };
const document: AskDocument = { schema: 1, kind: 'native-page', title: 'Harbour rafts', lang: 'en', layout: { padding: 20, gap: 40 }, blocks: [
  { id: 'top', kind: 'hero', height: 24, picture: { src: '/photos/harbour.jpg', alt: 'Three rafts on the canal' }, title: 'The cosiest boat hire in town', actions: [{ text: 'Book', href: '/book/' }] } as unknown as AskDocument['blocks'][number],
  { id: 'about', kind: 'content', source: '## About us\n\nWe have sailed since 2016.' },
  { id: 'tours', kind: 'cards', items: [{ title: 'Green raft' }, { title: 'Sunset' }] } as unknown as AskDocument['blocks'][number],
] };
const input = (level: 'section' | 'page', prompt: string, selected?: string): AskInput => ({ level, prompt, document, selected, images, collections, runtimes, site });
const validate = (value: AskDocument) => validateNativePage(value, { images, collections, runtimes, bindings: [] });
const context: AskContext = { images, collections, runtimes, site, ids: ['top', 'about', 'tours'], layout: document.layout, validate };
const example = (kind: string, index = 0) => structuredClone(sectionDefinition(kind)!.examples[index]) as unknown as Record<string, unknown>;
const hero = () => ({ ...example('hero'), picture: { src: '/photos/harbour.jpg', alt: 'The harbour' }, logo: { src: '/photos/logo.svg', alt: 'Green raft' } });

describe('the generated vocabulary is the record Ask reads', () => {
  test('matches the source record kind for kind', () => {
    expect(ASK_VOCABULARY.kinds.map(kind => kind.kind)).toEqual(vocabularyRecord().kinds.map(kind => kind.kind));
    expect(ASK_VOCABULARY.tones).toEqual([...vocabularyRecord().tones]);
  });
});

describe('the judgment', () => {
  test('asks the intent, the kind from every section kind, and each picture, over one state', () => {
    const { state, questions } = askJudgmentQuestions(input('section', 'A hero with the harbour photo and a Book button', 'tours'));
    expect(state.request).toBe('A hero with the harbour photo and a Book button');
    expect(state.selected).toEqual({ kind: 'cards', words: 'Green raft / Sunset' });
    expect(state.kinds.map(kind => kind.kind)).toEqual(SECTIONS.map(section => section.kind));
    expect(Object.keys(questions)).toEqual(['change', 'intent', 'kind', 'picture_0', 'picture_1']);
    expect(Object.keys(questions.intent!.criteria!)).toEqual(['make', 'replace', 'other']);
    expect(Object.keys(questions.kind!.criteria!)).toEqual([...SECTIONS.map(section => section.kind), 'unclear']);
    expect(state.pictures[0]).toEqual({ id: 'picture_0', file: 'harbour.jpg', shows: ['Three rafts on the canal'] });
    expect(Object.keys(askJudgmentQuestions(input('page', 'A page about the shelter')).questions.intent!.criteria!)).toEqual(['rewrite', 'other']);
  });
  test('reads confident answers as one judgment and leaves the rest to the heuristic', () => {
    const asked = input('section', 'Turn this into three cards', 'top');
    const answers = { change: { type: 'noul', noul: 0.97 }, intent: { type: 'choice', choice: 'replace', confidence: 0.9, probabilities: {} }, kind: { type: 'choice', choice: 'cards', confidence: 0.8, probabilities: {} }, picture_0: { type: 'noul', noul: 0.1 }, picture_1: { type: 'noul', noul: 0.95 } };
    expect(readAskJudgment(asked, { answers })).toEqual({ intent: 'replace', kind: 'cards', pictures: ['/photos/logo.svg'] });
    expect(readAskJudgment(asked, { answers: { ...answers, kind: { type: 'choice', choice: 'unclear', confidence: 0.9, probabilities: {} } } })).toEqual({ intent: 'replace', pictures: ['/photos/logo.svg'] });
    expect(readAskJudgment(asked, { answers: { ...answers, change: { type: 'noul', noul: 0.4 } } })).toBeNull();
    expect(readAskJudgment(asked, { answers: { ...answers, intent: { type: 'choice', choice: 'make', confidence: 0.3, probabilities: {} } } })).toBeNull();
    expect(readAskJudgment(asked, { answers: { ...answers, intent: { type: 'choice', choice: 'other', confidence: 1, probabilities: {} } } })).toBeNull();
    expect(readAskJudgment(asked, null)).toBeNull();
  });
  test('the heuristic reads the first word naming a kind, this section, and pictures by file or alt', () => {
    expect(askHeuristic(input('section', 'A hero with the harbour photo and a Book button', 'tours'))).toEqual({ intent: 'make', kind: 'hero', pictures: ['/photos/harbour.jpg'] });
    expect(askHeuristic(input('section', 'Turn this into three cards', 'top'))).toEqual({ intent: 'replace', kind: 'cards', pictures: [] });
    expect(askHeuristic(input('section', 'An FAQ about the rafts with the logo', 'top'))).toEqual({ intent: 'make', kind: 'questions', pictures: ['/photos/logo.svg'] });
    expect(askHeuristic(input('page', 'A page about the floating shelter with prices and questions'))).toEqual({ intent: 'rewrite', kind: 'facts', pictures: [] });
    expect(askHeuristic(input('section', 'Something lovely', 'top'))).toEqual({ intent: 'make', pictures: [] });
  });
  test('pictures the page shows come first, with the words it uses for them', () => {
    expect(askPictures(['/photos/logo.svg', '/photos/harbour.jpg'], document)).toEqual([{ src: '/photos/harbour.jpg', file: 'harbour.jpg', alt: ['Three rafts on the canal'] }, { src: '/photos/logo.svg', file: 'logo.svg', alt: [] }]);
  });
});

describe('the prompt', () => {
  test('carries the chosen kind\'s record, the page, the site\'s words and the pictures, and the one hard rule', () => {
    const { system, user } = askPrompt('section', input('section', 'A hero with the harbour photo and a Book button', 'tours'), { intent: 'make', kind: 'hero', pictures: ['/photos/harbour.jpg'] });
    expect(system).toMatch(/exactly one JSON object/); expect(system).toMatch(/no HTML, no CSS, no scripts/); expect(system).toMatch(/only the "src" values listed/);
    const body = JSON.parse(user);
    expect(body.request).toBe('A hero with the harbour photo and a Book button'); expect(body.level).toBe('section'); expect(body.intent).toBe('make'); expect(body.kind).toBe('hero');
    expect(body.vocabulary.kinds.map((kind: { kind: string }) => kind.kind)).toEqual(['hero']); expect(body.vocabulary.kinds[0].examples).toHaveLength(2); expect(body.vocabulary.kinds[0].fields.height).toMatchObject({ type: 'squares', min: 12, max: 40 });
    expect(body.vocabulary.tones).toEqual([...vocabularyRecord().tones]);
    expect(body.pictures).toEqual([{ src: '/photos/harbour.jpg', alt: 'Three rafts on the canal' }, { src: '/photos/logo.svg', alt: '' }]);
    expect(body.site).toEqual({ name: 'Harbour rafts', language: 'en', headings: ['The cosiest boat hire in town', 'About us', 'Green raft', 'Sunset'], pages: site.pages });
    expect(body.addresses).toEqual(['/', '/book/']); expect(body.runtimes).toEqual(['MenuToggle']); expect(body.collections).toEqual(['storefront']);
    expect(body.selected.id).toBe('tours'); expect(body.page).toEqual(document);
  });
  test('at page level every section kind is there, with the primitives a page may still need, and a long page is outlined', () => {
    const long: AskDocument = { ...document, blocks: Array.from({ length: 40 }, (_, index) => ({ id: `w${index}`, kind: 'content', source: `## Heading ${index}\n\n${'Words '.repeat(200)}` })) };
    const { user } = askPrompt('page', { ...input('page', 'A page about the floating shelter'), document: long }, { intent: 'rewrite', pictures: [] });
    const body = JSON.parse(user);
    expect(body.vocabulary.kinds.map((kind: { kind: string }) => kind.kind)).toEqual([...SECTIONS.map(section => section.kind), 'content', 'image', 'link']);
    expect(body.vocabulary.kinds.every((kind: { examples: unknown[] }) => kind.examples.length === 1)).toBe(true);
    expect(body.page.blocks).toHaveLength(40); expect(body.page.blocks[0]).toEqual({ id: 'w0', kind: 'content', source: expect.stringMatching(/^## Heading 0/) }); expect(body.page.blocks[0].source.length).toBeLessThanOrEqual(200);
    expect(user.length).toBeLessThan(60_000);
  });
});

describe('the check', () => {
  test('parses one JSON object out of fences and prose', () => {
    expect(parseAskAnswer('Here you go:\n```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(parseAskAnswer('[1,2]')).toBeNull(); expect(parseAskAnswer('no object')).toBeNull(); expect(parseAskAnswer({ a: 1 })).toEqual({ a: 1 });
  });
  test('a valid hero passes, snapped to the square inside its range, with a fresh id where the page has one, and the renderer agrees', () => {
    const answer = { ...hero(), id: 'top', height: 23.4, picture: { src: '/photos/harbour.jpg', alt: 'The harbour', focus: { x: 50.4, y: 130 } }, actions: [{ text: 'Book', href: '/book/', appearance: 'primary', face: 'outlined', size: 'large', icon: 'right' }, { text: 'Prices', href: 'https://example.com/prices/' }], extra: 'dropped' };
    const result = checkAskAnswer('```json\n' + JSON.stringify(answer) + '\n```', 'section', context);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.block.kind).toBe('hero'); expect(result.block.id).not.toBe('top'); expect(result.block.id).toMatch(/^ask_\d+$/);
    expect((result.block as Record<string, unknown>).height).toBe(23); expect(result.block).not.toHaveProperty('extra');
    expect((result.block as { actions: unknown[] }).actions).toEqual([{ text: 'Book', href: '/book/', appearance: 'primary', face: 'outlined', size: 'large' }, { text: 'Prices', href: 'https://example.com/prices/' }]);
    expect((result.block as { picture: unknown }).picture).toEqual({ src: '/photos/harbour.jpg', alt: 'The harbour', focus: { x: 50, y: 100 } });
    expect(() => validateNativePage({ ...document, blocks: [result.block as unknown as NativeBlock] } as NativePageDocument, { images, collections, runtimes, bindings: [] })).not.toThrow();
    const tall = checkAskAnswer({ ...hero(), height: 100 }, 'section', context);
    expect(tall.ok && (tall.block as Record<string, unknown>).height).toBe(40);
    const low = checkAskAnswer({ ...hero(), height: 3 }, 'section', context);
    expect(low.ok && (low.block as Record<string, unknown>).height).toBe(12);
    expect(snapMeasure({ type: 'squares', min: 20, max: 40, step: 10, meaning: '' }, 34)).toBe(30);
    expect(snapMeasure({ type: 'pixels', min: 0, max: 2000, meaning: '' }, 33)).toBe(40);
  });
  test('refuses a bad tone, an unlisted picture, HTML in words, a section in a section, an address away from the site and a primitive for a section', () => {
    const refusal = (answer: unknown, level: 'section' | 'page' = 'section') => { const result = checkAskAnswer(answer, level, context); return result.ok ? 'accepted' : result.refusal; };
    expect(refusal({ ...hero(), panelTone: 'mint' })).toMatch(/panelTone: "mint" is not a tone the library has \(paper, cream/);
    expect(refusal({ ...hero(), picture: { src: '/photos/other.jpg', alt: 'Elsewhere' } })).toMatch(/"\/photos\/other.jpg" is not one of the site's pictures/);
    expect(refusal({ ...hero(), picture: { src: 'https://designsystem1.com/examples/images/atelier-hero.jpg', alt: '' } })).toMatch(/is not one of the site's pictures/);
    expect(refusal({ ...hero(), title: '<b>Hello</b>' })).toMatch(/hero → title holds HTML/);
    expect(refusal({ ...hero(), text: 'Fine [words](javascript:alert(1))' })).toMatch(/HTML/);
    expect(refusal({ ...hero(), text: 'A picture ![x](/photos/other.jpg)' })).toMatch(/not one of the site's/);
    expect(refusal({ ...example('cards'), items: [{ kind: 'hero', title: 'Inside' }] })).toMatch(/a hero cannot stand inside this section/);
    expect(refusal({ ...example('panels'), items: [{ ...example('cards'), picture: undefined }, hero()] })).toMatch(/only a hero stands in panels, not a cards/);
    expect(refusal({ ...hero(), actions: [{ text: 'Away', href: 'https://evil.example/' }] })).toMatch(/leads away from the site/);
    expect(refusal({ id: 'w', kind: 'content', source: 'Words' })).toMatch(/is a content, not a section/);
    expect(refusal({ id: 'w', kind: 'poster' })).toMatch(/"poster" is not a block kind/);
    expect(refusal({ ...hero(), panel: 'top' })).toMatch(/panel: "top" is not one of left, centre, right/);
    expect(refusal({ ...hero(), picture: undefined })).toMatch(/hero → picture is required/);
    expect(refusal({ ...example('header'), logo: { src: '/photos/logo.svg', alt: '' }, languages: undefined, menu: { name: 'Cart', props: {} } })).toMatch(/"Cart" is not one of the site's runtimes/);
    expect(refusal({ ...example('list', 2), collection: 'posts' })).toMatch(/"posts" is not one of the site's collections/);
    expect(refusal({ ...hero(), text: 'x'.repeat(24_001) })).toMatch(/longer than 24000/);
    expect(refusal('not json')).toBe('The answer was not one JSON object.');
  });
  test('a header with the site\'s runtime and a list on its collection pass, and the runtime\'s props keep only the allowed keys', () => {
    const header = checkAskAnswer({ ...example('header'), logo: { src: '/photos/logo.svg', alt: 'Harbour rafts', href: '/' }, languages: undefined, menu: { name: 'MenuToggle', props: { label: 'Menu' } } }, 'section', context);
    expect(header.ok && (header.block as { menu: unknown }).menu).toEqual({ name: 'MenuToggle', props: {} });
    const list = checkAskAnswer(example('list', 2), 'section', context);
    expect(list.ok && (list.block as { collection: string }).collection).toBe('storefront');
  });
  test('a page answer becomes a whole document, its layout kept, and an empty or overlong one is refused', () => {
    const answer = { title: 'The floating shelter', description: 'A night on the water.', lang: 'en', blocks: [hero(), { ...example('questions'), id: 'top' }, { id: 'words', kind: 'content', source: '## Prices\n\nFrom 1200 kr.' }] };
    const result = checkAskAnswer(JSON.stringify(answer), 'page', context);
    expect(result.ok).toBe(true);
    if (!result.ok || result.level !== 'page') return;
    expect(result.document).toMatchObject({ schema: 1, kind: 'native-page', title: 'The floating shelter', description: 'A night on the water.', lang: 'en', layout: { padding: 20, gap: 40 } });
    expect(result.document.blocks.map(block => block.kind)).toEqual(['hero', 'questions', 'content']);
    expect(result.document.blocks[1]!.id).not.toBe('top');
    expect(() => validate(result.document)).not.toThrow();
    const sized = checkAskAnswer({ layout: { padding: 33, gap: 7 }, blocks: [{ id: 'f', kind: 'flow', direction: 'row', gap: 25, padding: 0, children: [{ id: 'w', kind: 'content', source: 'Words' }] }] }, 'page', context);
    expect(sized.ok && sized.level === 'page' && sized.document.layout).toEqual({ padding: 40, gap: 0 });
    expect(sized.ok && sized.level === 'page' && (sized.document.blocks[0] as Record<string, unknown>).gap).toBe(20);
    expect(checkAskAnswer({ blocks: [] }, 'page', context)).toEqual({ ok: false, refusal: 'The page has no blocks.' });
    expect(checkAskAnswer({ blocks: [{ id: 'w', kind: 'content', source: 'x'.repeat(23_000) }, { id: 'v', kind: 'content', source: 'x'.repeat(23_000) }, { id: 'u', kind: 'content', source: 'x'.repeat(23_000) }] }, 'page', context)).toEqual({ ok: false, refusal: 'The page is longer than a page can be.' });
  });
  test('a binding is never taken from an answer, and the renderer\'s refusal is given in words', () => {
    const result = checkAskAnswer({ blocks: [{ id: 'w', kind: 'content', source: 'Words', binding: 'home.title' }] }, 'page', context);
    expect(result.ok && result.level === 'page' && result.document.blocks[0]).toEqual({ id: 'w', kind: 'content', source: 'Words' });
    const refused = checkAskAnswer(hero(), 'section', { ...context, validate: () => { throw Object.assign(new Error('invalid-native-page'), { reason: 'the picture is not the site\'s' }); } });
    expect(refused).toEqual({ ok: false, refusal: 'The page cannot hold it: the picture is not the site\'s.' });
  });
});
