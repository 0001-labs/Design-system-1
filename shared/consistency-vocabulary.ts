/**
 * The one record of what a native page can say: every block kind, the primitives and the sections
 * above them, with its fields (type, range, default, meaning), its slots and complete examples.
 * `validateNativePage` reads the section fields and slots from here, `scripts/write-vocabulary.ts`
 * writes `shared/generated/vocabulary.json` from here, and the editor's insert menu, the renderer's
 * documentation and the Ask prompt read that one record. No DOM, no CSS, no colours: a tone is a
 * name the library defines as `--c9y-tone-<name>` and `--c9y-tone-<name>-ink`.
 */
import type { NativeBlock } from './consistency-native-page';

export const TONES = ['paper', 'cream', 'dark', 'accent', 'highlight', 'band', 'pastel-1', 'pastel-2', 'pastel-3', 'pastel-4', 'pastel-5', 'pastel-6'] as const;
export type Tone = (typeof TONES)[number];
export const PRIMITIVE_KINDS = ['flow', 'grid', 'content', 'image', 'link', 'collection', 'runtime'] as const;
export const SECTION_KINDS = ['hero', 'split', 'statement', 'panels', 'cards', 'gallery', 'bento', 'questions', 'facts', 'list', 'action', 'header', 'footer'] as const;
export type SectionKind = (typeof SECTION_KINDS)[number];

/**
 * A field is a typed value: `squares` and `pixels` are whole numbers in that unit, `integer` a count,
 * `choice` one of `choices`, `tone` a name from TONES, `tones` a list of `min` to `max` such names,
 * `text` a line of plain words, `date` a day as `YYYY-MM-DD`, `address` a link target. `step` keeps a
 * measure on a coarser grid.
 */
export interface FieldDefinition {
  type: 'squares' | 'pixels' | 'integer' | 'boolean' | 'choice' | 'tone' | 'tones' | 'text' | 'date' | 'address' | 'markdown' | 'identifier' | 'map' | 'blocks' | 'props';
  min?: number; max?: number; step?: number; choices?: readonly string[];
  default?: string | number | boolean | readonly string[]; required?: boolean; meaning: string;
}
/**
 * A slot holds content: `words` is Aa Markdown as a `content` block carries it; `picture` an image
 * reference `{ src, alt, fit?, href?, focus? }` with `src` from the page's images and `focus` `{ x, y }`
 * where its subject is, as percentages from the left and the top (50 and 50 when absent); `action`
 * `{ text, href, appearance?, face?, size?, icon? }` as a `link` block, `face` `filled` or `outlined`,
 * `size` `medium` or `large`, `icon` a name from the library's icons where the section draws one;
 * `actions`, `pictures`, `links` (`{ text, href? }`) and `languages` (`{ text, href, picture? }`) are
 * arrays of those; `runtime` `{ name, props }` as a `runtime` block; `collection` the name of a
 * registered collection; `items` an array of records whose members are described by `item`; `heroes`
 * an array of complete `hero` blocks.
 */
export interface SlotDefinition {
  type: 'words' | 'picture' | 'action' | 'actions' | 'pictures' | 'links' | 'languages' | 'runtime' | 'collection' | 'items' | 'heroes';
  required?: boolean; min?: number; max?: number; meaning: string;
  item?: Record<string, MemberDefinition>;
}
export type MemberDefinition = FieldDefinition | SlotDefinition;
export const isSlot = (member: MemberDefinition): member is SlotDefinition => ['words', 'picture', 'action', 'actions', 'pictures', 'links', 'languages', 'runtime', 'collection', 'items', 'heroes'].includes(member.type);

export interface KindDefinition {
  kind: string;
  /** Primitives carry layout and content; sections stand above them and expand to primitives. */
  layer: 'primitive' | 'section';
  description: string;
  fields: Record<string, FieldDefinition>;
  slots: Record<string, SlotDefinition>;
  /** The names of slots of which exactly one must be given (the `list`'s items or collection). */
  oneOf?: readonly string[];
  examples: NativeBlock[];
}

/** Fields every block carries, whatever its kind. */
export const COMMON_FIELDS: Record<string, FieldDefinition> = {
  id: { type: 'identifier', required: true, meaning: 'Unique on the page: a letter, then letters, digits, _ or -, at most 80; never a dot, which derived ids use' },
  width: { type: 'pixels', min: 20, max: 10000, meaning: 'A fixed width in pixels (multiplied by the device scale) instead of sharing the row' },
  hidden: { type: 'boolean', default: false, meaning: 'Kept in the document but not drawn' },
  locale: { type: 'text', max: 20, meaning: 'The language of this block when it differs from the page, as `da` or `pt-BR`' },
};

const squares = (min: number, max: number, def: number, meaning: string, step?: number): FieldDefinition => ({ type: 'squares', min, max, default: def, meaning, ...(step ? { step } : {}) });
/** A measure on a phone (700px and narrower) with no default of its own: the computer's measure when absent. */
const mobileSquares = (min: number, max: number, meaning: string): FieldDefinition => ({ type: 'squares', min, max, meaning });
/** The column a grid of items stands in; the sections that take it share one definition. */
const MEASURE: FieldDefinition = { type: 'choice', choices: ['reading', 'wide', 'full'], default: 'full', meaning: 'The column\'s measure: reading, 32 squares; wide, 62 squares; full, the page; wide and full keep a square from a phone\'s edges' };
const headingAlign = (what: string): FieldDefinition => ({ type: 'choice', choices: ['start', 'centre'], default: 'start', meaning: `${what} against the start, or centred` });
const choice = (choices: readonly string[], def: string, meaning: string): FieldDefinition => ({ type: 'choice', choices, default: def, meaning });
const tone = (meaning: string, def?: Tone): FieldDefinition => ({ type: 'tone', meaning, ...(def ? { default: def } : {}) });
const boolean = (def: boolean, meaning: string): FieldDefinition => ({ type: 'boolean', default: def, meaning });
const words = (meaning: string, required = false): SlotDefinition => ({ type: 'words', meaning, ...(required ? { required } : {}) });
const picture = (meaning: string, required = false): SlotDefinition => ({ type: 'picture', meaning, ...(required ? { required } : {}) });
const action = (meaning: string, required = false): SlotDefinition => ({ type: 'action', meaning, ...(required ? { required } : {}) });
const actions = (meaning: string, max = 4, required = false): SlotDefinition => ({ type: 'actions', max, meaning, ...(required ? { required, min: 1 } : {}) });

const PICTURE = { src: '/photos/harbour.jpg', alt: 'Three green rafts on the canal' };

export const PRIMITIVES: KindDefinition[] = [
  {
    kind: 'flow', layer: 'primitive',
    description: 'A row or column of blocks with a gap between them and room around them; the layout primitive every section expands to.',
    fields: {
      role: { type: 'choice', choices: ['section', 'header', 'nav', 'footer', 'main'], default: 'section', meaning: 'The HTML landmark the flow is drawn as' },
      direction: { type: 'choice', choices: ['column', 'row'], required: true, meaning: 'Blocks one under another, or side by side sharing the width' },
      mobileDirection: { type: 'choice', choices: ['column', 'row'], default: 'column', meaning: 'The direction on a phone (700px and narrower)' },
      gap: { type: 'pixels', min: 0, max: 2000, required: true, meaning: 'Between the blocks' },
      mobileGap: { type: 'pixels', min: 0, max: 2000, meaning: 'Between the blocks on a phone; the gap when absent' },
      padding: { type: 'pixels', min: 0, max: 2000, required: true, meaning: 'Around the blocks' },
      disclosure: { type: 'map', meaning: '`{ label, open? }` folds the flow under a summary line that opens it' },
      children: { type: 'blocks', required: true, meaning: 'The blocks inside, any kind, nested at most twelve deep' },
    },
    slots: {},
    examples: [
      { id: 'intro', kind: 'flow', direction: 'column', gap: 20, padding: 0, children: [{ id: 'intro-text', kind: 'content', source: '## Welcome\n\nThe harbour is open every day.' }] },
      { id: 'row', kind: 'flow', direction: 'row', mobileDirection: 'column', gap: 40, mobileGap: 20, padding: 20, children: [{ id: 'row-photo', kind: 'image', ...PICTURE, fit: 'cover', height: 300 }, { id: 'row-words', kind: 'content', source: 'A line beside the photo.' }] },
      { id: 'more', kind: 'flow', direction: 'column', gap: 20, padding: 0, disclosure: { label: 'Opening hours', open: false }, children: [{ id: 'more-text', kind: 'content', source: 'Monday to Sunday, 10:00 to 16:00.' }] },
    ],
  },
  {
    kind: 'grid', layer: 'primitive',
    description: 'Blocks in equal columns with gaps between columns and rows.',
    fields: {
      columns: { type: 'integer', min: 1, max: 12, required: true, meaning: 'Columns on a computer' },
      mobileColumns: { type: 'integer', min: 1, max: 6, default: 1, meaning: 'Columns on a phone' },
      columnGap: { type: 'pixels', min: 0, max: 2000, required: true, meaning: 'Between columns' },
      rowGap: { type: 'pixels', min: 0, max: 2000, required: true, meaning: 'Between rows' },
      children: { type: 'blocks', required: true, meaning: 'The blocks inside, filling the columns in order' },
    },
    slots: {},
    examples: [
      { id: 'photos', kind: 'grid', columns: 3, mobileColumns: 2, columnGap: 20, rowGap: 20, children: [{ id: 'photo-1', kind: 'image', ...PICTURE, height: 200, fit: 'cover' }, { id: 'photo-2', kind: 'image', ...PICTURE, height: 200, fit: 'cover' }, { id: 'photo-3', kind: 'image', ...PICTURE, height: 200, fit: 'cover' }] },
      { id: 'pair', kind: 'grid', columns: 2, columnGap: 40, rowGap: 40, children: [{ id: 'pair-a', kind: 'content', source: '### Green raft\n\nA raft for eight.' }, { id: 'pair-b', kind: 'content', source: '### Blue raft\n\nA floating cabin for two.' }] },
    ],
  },
  {
    kind: 'content', layer: 'primitive',
    description: 'Writing in Aa Markdown: headings, paragraphs, lists, tables, columns, tabs, pictures by reference, and the closed atoms (card, button, carousel, icon).',
    fields: {
      source: { type: 'markdown', max: 24000, required: true, meaning: 'The Markdown; pictures by `![alt](/path)` from the page\'s images; no HTML' },
      gaps: { type: 'map', meaning: 'Spacing between its blocks in pixels, keyed `<id>-text-<n>` and `columns:<id>:<column>:<n>`' },
      binding: { type: 'text', max: 200, meaning: 'A registered editorial field whose words replace the source at publication' },
    },
    slots: {},
    examples: [
      { id: 'about', kind: 'content', source: '# About us\n\nWe have sailed the canals since 2016.\n\n- Green raft\n- Blue raft' },
      { id: 'hours', kind: 'content', source: '## Opening hours\n\nMonday to Sunday: 10:00 to 16:00\n\n[info@example.com](mailto:info@example.com)', gaps: { 'hours-text-1': 40 } },
    ],
  },
  {
    kind: 'image', layer: 'primitive',
    description: 'One picture, from the page\'s images or an https address, optionally a link.',
    fields: {
      src: { type: 'address', required: true, meaning: 'A path from the page\'s images, or an https address' },
      alt: { type: 'text', max: 1000, required: true, meaning: 'What the picture shows, for people who cannot see it; empty when decorative' },
      height: { type: 'pixels', min: 20, max: 2000, meaning: 'A fixed height; the picture\'s own proportion when absent' },
      mobileHeight: { type: 'pixels', min: 20, max: 2000, meaning: 'The height on a phone' },
      fit: { type: 'choice', choices: ['contain', 'cover'], default: 'contain', meaning: 'Whole inside its box, or filling it and cropped' },
      focus: { type: 'map', meaning: '`{ x, y }`: where the picture\'s subject is, as whole percentages from 0 to 100 from the left and the top, kept in view when the picture is cropped; 50 and 50 when absent' },
      href: { type: 'address', meaning: 'Where the picture leads when pressed' },
    },
    slots: {},
    examples: [
      { id: 'facade', kind: 'image', ...PICTURE, height: 400, mobileHeight: 240, fit: 'cover', focus: { x: 50, y: 30 } },
      { id: 'logo', kind: 'image', src: '/photos/logo.svg', alt: 'Harbour rafts', height: 60, fit: 'contain', href: '/' },
    ],
  },
  {
    kind: 'link', layer: 'primitive',
    description: 'A destination: words that lead somewhere, drawn as running text or as one of the library\'s button faces.',
    fields: {
      text: { type: 'text', max: 1000, required: true, meaning: 'The words' },
      href: { type: 'address', required: true, meaning: 'A path, an https address, mailto:, tel: or #anchor' },
      appearance: { type: 'choice', choices: ['plain', 'default', 'primary', 'secondary'], default: 'plain', meaning: 'Running text, or the default, primary or secondary button' },
      face: { type: 'choice', choices: ['filled', 'outlined'], default: 'filled', meaning: 'A button on its fill, or outlined: the ink\'s line around a primary, a hairline around a secondary (the library\'s `data-face="outlined"`)' },
      size: { type: 'choice', choices: ['medium', 'large'], default: 'medium', meaning: 'A button one control high, or two squares high (the library\'s `data-size`)' },
      binding: { type: 'text', max: 200, meaning: 'A registered editorial field whose words replace the text' },
    },
    slots: {},
    examples: [
      { id: 'book', kind: 'link', text: 'Book a raft', href: '/book/', appearance: 'primary', face: 'outlined', size: 'large' },
      { id: 'read-more', kind: 'link', text: 'Read more', href: '/about/' },
    ],
  },
  {
    kind: 'collection', layer: 'primitive',
    description: 'A registered collection of the site\'s records (products, posts) drawn as cards in a grid or a gallery whose first row is featured.',
    fields: {
      binding: { type: 'text', max: 200, required: true, meaning: 'The registered collection\'s name' },
      layout: { type: 'choice', choices: ['grid', 'gallery'], required: true, meaning: 'Equal cards, or a first row of larger featured cards' },
      columns: { type: 'integer', min: 1, max: 6, required: true, meaning: 'Ordinary cards per row' },
      featured: { type: 'integer', min: 0, max: 6, required: true, meaning: 'Featured cards in a gallery\'s first row' },
      columnGap: { type: 'pixels', min: 0, max: 2000, required: true, meaning: 'Between cards' },
      rowGap: { type: 'pixels', min: 0, max: 2000, required: true, meaning: 'Between rows' },
      imageHeight: { type: 'pixels', min: 20, max: 2000, required: true, meaning: 'A card picture\'s height' },
      featuredImageHeight: { type: 'pixels', min: 20, max: 2000, meaning: 'A featured card picture\'s height' },
      mobileImageHeight: { type: 'pixels', min: 20, max: 2000, meaning: 'A card picture\'s height on a phone' },
      fit: { type: 'choice', choices: ['contain', 'cover'], required: true, meaning: 'How a picture fills its box' },
    },
    slots: {},
    examples: [
      { id: 'products', kind: 'collection', binding: 'storefront', layout: 'gallery', columns: 3, featured: 2, columnGap: 40, rowGap: 120, imageHeight: 400, fit: 'contain' },
      { id: 'posts', kind: 'collection', binding: 'storefront', layout: 'grid', columns: 4, featured: 0, columnGap: 20, rowGap: 40, imageHeight: 200, mobileImageHeight: 160, fit: 'cover' },
    ],
  },
  {
    kind: 'runtime', layer: 'primitive',
    description: 'A place for one of the site\'s registered dynamic parts (a cart, a menu toggle, a theme switch), drawn by the site\'s trusted code with only the props it allows.',
    fields: {
      name: { type: 'text', max: 80, required: true, meaning: 'The registered runtime\'s name' },
      props: { type: 'props', required: true, meaning: 'Strings, numbers, booleans or null, only the keys the runtime allows' },
    },
    slots: {},
    examples: [
      { id: 'menu', kind: 'runtime', name: 'MenuToggle', props: {} },
      { id: 'cart', kind: 'runtime', name: 'Cart', props: { label: 'Basket' } },
    ],
  },
];

export const SECTIONS: KindDefinition[] = [
  {
    kind: 'hero', layer: 'section',
    description: 'A photo across the page with the words and actions on a panel over it: the top of a page.',
    fields: {
      height: squares(12, 40, 24, 'The section\'s height; the picture fills it'),
      mobileHeight: mobileSquares(12, 40, 'The height on a phone; `height` when absent'),
      fill: choice(['fixed', 'window'], 'fixed', 'The height as given, or no more than four fifths of the window (`min(height, 80svh)`), so a short window still shows what follows'),
      panel: choice(['left', 'centre', 'right'], 'centre', 'Where the words\' panel stands over the picture'),
      panelTone: tone('The panel\'s tone', 'cream'),
      panelWidth: squares(12, 40, 24, 'The panel\'s width; narrower than the section on a phone'),
      translucent: boolean(false, 'The panel lets the picture through: its tone with alpha and a blur behind it (`--c9y-tone-<tone>-glass` when the library defines it, else the tone at 85%)'),
      room: choice(['flush', 'gap'], 'flush', 'Under a header: flush against it, or the page\'s gap above it'),
      level: { type: 'integer', min: 1, max: 2, default: 1, meaning: 'The heading level the title is drawn at when it carries no # of its own' },
      fit: choice(['cover', 'contain'], 'cover', 'The picture filling the section and cropped, or whole inside it'),
    },
    slots: {
      picture: picture('The photo behind the panel; its `focus` keeps the subject in view when it is cropped', true),
      logo: picture('A mark above the title, three squares high'),
      kicker: words('A short line above the title'),
      title: words('The title; one line of Markdown, a heading of `level` unless it carries its own #', true),
      text: words('A line or two under the title'),
      actions: actions('Buttons under the words, primary first; each may name its `face` and `size`'),
    },
    examples: [
      { id: 'top', kind: 'hero', height: 24, fill: 'window', panel: 'centre', panelTone: 'cream', panelWidth: 24, translucent: true, room: 'flush', level: 1, fit: 'cover', picture: { ...PICTURE, focus: { x: 50, y: 30 } }, logo: { src: '/photos/logo.svg', alt: 'Green raft' }, title: 'The cosiest boat hire in town', text: 'Sail the canals on a raft for eight, with a barbecue in the middle.', actions: [{ text: 'Book', href: '/book/', appearance: 'primary', face: 'outlined', size: 'medium' }, { text: 'Prices', href: '/prices/', appearance: 'secondary' }] },
      { id: 'cabin', kind: 'hero', height: 30, mobileHeight: 20, panel: 'left', panelTone: 'dark', room: 'gap', picture: { src: '/photos/harbour.jpg', alt: 'A floating cabin at dusk', fit: 'cover' }, kicker: 'Blue raft', title: 'Floating glamping', actions: [{ text: 'Stay a night', href: '/stay/', appearance: 'primary' }] },
    ],
  },
  {
    kind: 'split', layer: 'section',
    description: 'Words beside a photo, the words on a panel laid over the photo\'s edge.',
    fields: {
      reverse: boolean(false, 'The picture at the end and the words at the start'),
      panelTone: tone('The words\' panel tone', 'cream'),
      ratio: choice(['1:1', '2:1', '5:6'], '1:1', 'The picture\'s share against the words\': equal, the picture twice as wide, or five to the words\' six'),
      imageHeight: squares(8, 30, 16, 'The picture\'s height'),
      mobileImageHeight: mobileSquares(8, 30, 'The picture\'s height on a phone; `imageHeight` when absent'),
      overlap: squares(0, 4, 2, 'How far the panel stands over the picture\'s edge; over its foot on a phone'),
      headingAlign: headingAlign('The heading'),
    },
    slots: {
      picture: picture('The photo; its `focus` keeps the subject in view when it is cropped', true),
      heading: words('The heading on the panel; a heading of level 2 unless it carries its own #', true),
      text: words('The words under the heading'),
      actions: actions('Buttons under the words; each may name its `face` and `size`'),
    },
    examples: [
      { id: 'green', kind: 'split', ratio: '1:1', imageHeight: 16, mobileImageHeight: 12, overlap: 2, headingAlign: 'centre', panelTone: 'cream', picture: PICTURE, heading: 'Green raft', text: 'A raft for eight with a table, a barbecue and a quiet electric motor.', actions: [{ text: 'See the raft', href: '/green/', appearance: 'default', face: 'outlined' }] },
      { id: 'blue', kind: 'split', reverse: true, ratio: '5:6', imageHeight: 20, overlap: 4, panelTone: 'paper', picture: { src: '/photos/harbour.jpg', alt: 'The cabin from the water', focus: { x: 40, y: 50 } }, heading: '## Blue raft', text: 'A cabin of wood and glass on the harbour.' },
    ],
  },
  {
    kind: 'statement', layer: 'section',
    description: 'A section of writing alone, in a reading column, optionally on a panel.',
    fields: {
      measure: choice(['reading', 'wide', 'full'], 'reading', 'The column\'s measure: reading, 32 squares; wide, 50 squares; full, the page'),
      panel: tone('A panel of this tone under the writing; none when absent'),
      align: choice(['start', 'centre'], 'start', 'The words against the start, or centred'),
      headingAlign: headingAlign('The heading alone'),
      hiddenTitle: boolean(false, 'Words for search engines and screen readers alone, such as a page\'s title said in pictures: kept in the page and read out, not drawn'),
    },
    slots: {
      heading: words('The heading; level 2 unless it carries its own #'),
      text: words('The writing', true),
      actions: actions('Buttons under the writing; each may name its `face` and `size`'),
    },
    examples: [
      { id: 'about', kind: 'statement', measure: 'reading', align: 'start', headingAlign: 'centre', heading: 'About us', text: 'We have sailed the canals since 2016, first with one raft, now with nine.' },
      { id: 'hours', kind: 'statement', measure: 'reading', panel: 'cream', align: 'centre', heading: 'Opening hours', text: 'Monday to Sunday, 10:00 to 16:00.\n\nWrite to [info@example.com](mailto:info@example.com).', actions: [{ text: 'Get in touch', href: '/contact/', appearance: 'secondary' }] },
      { id: 'page-title', kind: 'statement', measure: 'full', hiddenTitle: true, text: '# Harbour rafts: boat hire and floating glamping' },
    ],
  },
  {
    kind: 'panels', layer: 'section',
    description: 'Two or three heroes side by side, one above the other on a phone; the only section that holds sections.',
    fields: {
      columns: { type: 'integer', min: 2, max: 3, default: 2, meaning: 'Heroes side by side' },
      gap: squares(0, 4, 0, 'Between the heroes'),
      room: choice(['flush', 'gap'], 'flush', 'Under a header: flush against it, or the page\'s gap above it'),
    },
    slots: {
      items: { type: 'heroes', required: true, min: 2, max: 3, meaning: 'Complete hero blocks, each with its own id' },
    },
    examples: [
      { id: 'rafts', kind: 'panels', columns: 2, gap: 0, room: 'flush', items: [
        { id: 'rafts-green', kind: 'hero', height: 20, panelTone: 'cream', picture: PICTURE, logo: { src: '/photos/logo.svg', alt: 'Green raft' }, title: 'The cosiest boat hire in town', level: 2, actions: [{ text: 'Info', href: '/green/', appearance: 'primary' }] },
        { id: 'rafts-blue', kind: 'hero', height: 20, panelTone: 'cream', picture: { src: '/photos/harbour.jpg', alt: 'The blue raft' }, title: 'Floating glamping', level: 2, actions: [{ text: 'Info', href: '/blue/', appearance: 'primary' }] },
      ] },
      { id: 'three', kind: 'panels', columns: 3, gap: 1, items: [
        { id: 'three-a', kind: 'hero', height: 16, picture: PICTURE, title: 'Sail', level: 2 },
        { id: 'three-b', kind: 'hero', height: 16, picture: PICTURE, title: 'Stay', level: 2 },
        { id: 'three-c', kind: 'hero', height: 16, picture: PICTURE, title: 'Eat', level: 2 },
      ] },
    ],
  },
  {
    kind: 'cards', layer: 'section',
    description: 'Cards side by side, each with a label, a title, words, a photo on its foot and a link.',
    fields: {
      columns: { type: 'integer', min: 1, max: 4, default: 3, meaning: 'Cards per row' },
      measure: MEASURE,
      height: squares(6, 40, 16, 'A card\'s height; a card grows for longer words'),
      mobileHeight: mobileSquares(6, 40, 'A card\'s height on a phone; `height` when absent'),
      tone: tone('The cards\' fill', 'cream'),
      variant: choice(['filled', 'outlined'], 'filled', 'On the tone, or on the paper inside a hairline'),
    },
    slots: {
      items: { type: 'items', required: true, min: 1, max: 12, meaning: 'The cards', item: {
        label: words('A small line above the title, muted'),
        title: words('The card\'s title; level 3 unless it carries its own #', true),
        text: words('The words'),
        picture: picture('A photo on the card\'s foot'),
        action: action('A link at the foot of the words, with its `face` and `size`; a card whose whole body is a link keeps this'),
      } },
    },
    examples: [
      { id: 'tours', kind: 'cards', columns: 3, measure: 'wide', height: 16, mobileHeight: 12, tone: 'cream', variant: 'filled', items: [
        { label: '1.5 hours', title: 'Private green raft', text: 'Your own raft for up to eight.', picture: PICTURE, action: { text: 'Book', href: '/book/green/', appearance: 'primary', face: 'outlined', size: 'medium' } },
        { label: '3 hours', title: 'Sunset sailing', text: 'The canals in the evening light.', picture: PICTURE, action: { text: 'Book', href: '/book/sunset/', appearance: 'primary' } },
        { label: 'For groups', title: 'Quiz tour', text: 'Culture, history and design.', action: { text: 'Ask us', href: '/contact/' } },
      ] },
      { id: 'news', kind: 'cards', columns: 2, height: 8, variant: 'outlined', items: [
        { label: 'May 2026', title: 'Newsletter', text: 'The balconies are painted and the roses are out.', action: { text: 'Read', href: '/news/may-2026/' } },
        { label: 'March 2026', title: 'Annual meeting', text: 'Minutes from the residents\' meeting.', action: { text: 'Read', href: '/news/march-2026/' } },
      ] },
    ],
  },
  {
    kind: 'gallery', layer: 'section',
    description: 'Photos to look through, in a grid or a strip that scrolls sideways.',
    fields: {
      columns: { type: 'integer', min: 2, max: 4, default: 3, meaning: 'Photos per row; two on a phone' },
      measure: MEASURE,
      height: squares(4, 30, 8, 'Each photo\'s height'),
      mobileHeight: mobileSquares(4, 30, 'Each photo\'s height on a phone; `height` when absent'),
      strip: boolean(false, 'One row that scrolls sideways instead of a grid'),
      fit: choice(['cover', 'contain'], 'cover', 'Photos cropped to their boxes, or whole inside them'),
    },
    slots: {
      pictures: { type: 'pictures', required: true, min: 1, max: 24, meaning: 'The photos; a `focus` keeps a cropped photo\'s subject in view' },
    },
    examples: [
      { id: 'photos', kind: 'gallery', columns: 4, measure: 'wide', height: 8, mobileHeight: 6, fit: 'cover', pictures: [{ ...PICTURE, focus: { x: 50, y: 40 } }, { src: '/photos/harbour.jpg', alt: 'The harbour at dusk' }, { src: '/photos/harbour.jpg', alt: 'A raft under the bridge' }, { src: '/photos/harbour.jpg', alt: 'Lunch on the raft' }] },
      { id: 'strip', kind: 'gallery', columns: 3, height: 12, strip: true, pictures: [PICTURE, { src: '/photos/harbour.jpg', alt: 'The cabin' }, { src: '/photos/harbour.jpg', alt: 'The deck' }, { src: '/photos/harbour.jpg', alt: 'The bed' }, { src: '/photos/harbour.jpg', alt: 'The view' }] },
    ],
  },
  {
    kind: 'bento', layer: 'section',
    description: 'Tiles of different sizes in a pastel palette, each a title, words and a photo.',
    fields: {
      columns: { type: 'integer', min: 3, max: 4, default: 4, meaning: 'Columns of tiles; two on a phone' },
      measure: MEASURE,
      rhythm: choice(['even', 'featured'], 'featured', 'Tiles all one size, or every eighth tile two by two, the fourth tall and the sixth wide'),
      height: squares(6, 20, 12, 'A row of tiles\' height'),
      mobileHeight: mobileSquares(6, 20, 'A row of tiles\' height on a phone; `height` when absent'),
      tones: { type: 'tones', min: 1, max: 12, default: ['pastel-1', 'pastel-2', 'pastel-3', 'pastel-4', 'pastel-5', 'pastel-6'], meaning: 'The tones the tiles turn through, the first tile taking the first; a tile\'s own `tone` stands instead' },
      titleFace: choice(['heading', 'strong'], 'heading', 'A tile\'s title as a heading of level 3, or as a line in the medium face'),
    },
    slots: {
      items: { type: 'items', required: true, min: 1, max: 16, meaning: 'The tiles', item: {
        title: words('The tile\'s title; level 3 unless it carries its own #, or a strong line by `titleFace`', true),
        text: words('A line under the title'),
        picture: picture('A photo filling the top of the tile'),
        action: action('A link at the foot, with its `face` and `size`; a tile whose whole body is a link keeps this'),
        tone: tone('The tile\'s tone; one of `tones` in turn when absent'),
      } },
    },
    examples: [
      { id: 'facilities', kind: 'bento', columns: 4, measure: 'full', rhythm: 'featured', height: 12, mobileHeight: 8, items: [
        { title: 'Barbecue', text: 'On every raft.', picture: PICTURE },
        { title: 'Table for eight', text: 'With benches.', picture: PICTURE },
        { title: 'Electric motor', text: 'Quiet and simple.', picture: PICTURE },
        { title: 'Life jackets', text: 'For everyone aboard.', picture: PICTURE, tone: 'pastel-5' },
      ] },
      { id: 'why', kind: 'bento', columns: 3, rhythm: 'even', height: 8, tones: ['pastel-2', 'highlight'], titleFace: 'strong', items: [
        { title: 'Sail', text: 'No licence needed.', tone: 'pastel-1' },
        { title: 'Stay', text: 'A night on the water.' },
        { title: 'Celebrate', text: 'Birthdays and team days.', action: { text: 'Ask us', href: '/contact/' } },
      ] },
    ],
  },
  {
    kind: 'questions', layer: 'section',
    description: 'Questions that open to their answers.',
    fields: {
      open: choice(['first', 'none'], 'none', 'Which answer stands open at first'),
      measure: MEASURE,
    },
    slots: {
      heading: words('A heading above the questions; level 2 unless it carries its own #'),
      items: { type: 'items', required: true, min: 1, max: 40, meaning: 'The questions', item: {
        question: { type: 'text', max: 500, required: true, meaning: 'The question, one plain line' },
        answer: words('The answer', true),
      } },
    },
    examples: [
      { id: 'faq', kind: 'questions', open: 'first', measure: 'reading', heading: 'Questions', items: [
        { question: 'Do I need a licence?', answer: 'No. The rafts are slow and simple, and we show you everything before you leave.' },
        { question: 'What if it rains?', answer: 'The rafts have a roof; a little rain is part of the harbour. In a storm we move your booking.' },
      ] },
      { id: 'practical', kind: 'questions', items: [
        { question: 'Where do we meet?', answer: 'At the Black Diamond, Søren Kierkegaards Plads 1.' },
      ] },
    ],
  },
  {
    kind: 'facts', layer: 'section',
    description: 'Terms and their values, each pair on a line: contacts, prices, particulars.',
    fields: {
      columns: { type: 'integer', min: 1, max: 2, default: 1, meaning: 'Columns of pairs' },
      measure: MEASURE,
    },
    slots: {
      items: { type: 'items', required: true, min: 1, max: 40, meaning: 'The pairs', item: {
        term: words('The term, eight squares wide in the muted ink', true),
        value: words('Its value', true),
      } },
    },
    examples: [
      { id: 'contact', kind: 'facts', columns: 1, measure: 'reading', items: [
        { term: 'Office', value: 'Hestehaven 11, 2500 Valby' },
        { term: 'Email', value: '[info@example.com](mailto:info@example.com)' },
        { term: 'Phone', value: '[+45 20 82 50 01](tel:+4520825001)' },
      ] },
      { id: 'particulars', kind: 'facts', columns: 2, items: [
        { term: 'Length', value: '6 m' }, { term: 'Guests', value: 'Up to 8' }, { term: 'Motor', value: 'Electric, 2 kW' }, { term: 'Speed', value: '4 knots' },
      ] },
    ],
  },
  {
    kind: 'list', layer: 'section',
    description: 'Records in rows: a name, a line about it, a value or a date, a link; written items or a registered collection.',
    fields: {
      dated: boolean(false, 'Each record shows its date at the row\'s end'),
      grouped: boolean(false, 'Records stand under their year, newest first'),
      measure: MEASURE,
    },
    slots: {
      items: { type: 'items', min: 1, max: 200, meaning: 'The records', item: {
        name: { type: 'text', max: 500, required: true, meaning: 'The record\'s name, a link when `href` is given' },
        line: words('A line under the name, muted'),
        value: { type: 'text', max: 200, meaning: 'A value at the row\'s end: a price, a count' },
        date: { type: 'date', meaning: 'The record\'s day as YYYY-MM-DD; shown when `dated`, grouped by year when `grouped`' },
        href: { type: 'address', meaning: 'Where the name leads' },
      } },
      collection: { type: 'collection', meaning: 'A registered collection drawn as records (name, value, link) instead of written items' },
    },
    oneOf: ['items', 'collection'],
    examples: [
      { id: 'news', kind: 'list', dated: true, grouped: true, measure: 'reading', items: [
        { name: 'Newsletter May 2026', date: '2026-05-12', href: '/news/may-2026/' },
        { name: 'Summer: show consideration', line: 'The courtyard after ten in the evening.', date: '2025-06-20', href: '/news/summer/' },
        { name: 'Newsletter December 2025', date: '2025-12-15', href: '/news/december-2025/' },
      ] },
      { id: 'minutes', kind: 'list', dated: true, items: [
        { name: 'Residents\' meeting', date: '2026-03-10', href: '/minutes/2026-03/' },
        { name: 'Board meeting', date: '2026-01-14', href: '/minutes/2026-01/' },
      ] },
      { id: 'shop', kind: 'list', collection: 'storefront' },
    ],
  },
  {
    kind: 'action', layer: 'section',
    description: 'One call to action standing alone.',
    fields: {
      size: choice(['medium', 'large'], 'medium', 'A button one control high, or two squares high; the button\'s own `size` stands instead'),
      align: choice(['start', 'centre'], 'centre', 'Against the start, or centred'),
      measure: MEASURE,
    },
    slots: {
      button: action('The button; primary unless it says otherwise, on its fill unless its `face` is outlined', true),
    },
    examples: [
      { id: 'book', kind: 'action', size: 'large', align: 'centre', measure: 'wide', button: { text: 'Book a raft', href: '/book/', appearance: 'primary', face: 'outlined' } },
      { id: 'gift', kind: 'action', size: 'medium', align: 'start', button: { text: 'Buy a gift card', href: '/gift/', appearance: 'secondary' } },
    ],
  },
  {
    kind: 'header', layer: 'section',
    description: 'The top of every page: the logo and name at the start, the links in the middle, the language links and the menu at the end; the links fold behind the menu on a narrow screen.',
    fields: {
      sticky: boolean(false, 'Stays at the top of the window as the page scrolls, over every section'),
      fold: squares(20, 60, 30, 'Below this width the links and languages fold behind the menu', 10),
      logoHeight: squares(1, 4, 2, 'The mark\'s height'),
      mobileLogoHeight: mobileSquares(1, 4, 'The mark\'s height on a phone; `logoHeight` when absent'),
      linkStyle: choice(['plain', 'line'], 'plain', 'Each link as words on a one-square line, or hanging two squares from a line above it: a hairline of the ink, the current page four pixels of the accent in the accent\'s ink'),
    },
    slots: {
      logo: picture('The mark, `logoHeight` squares high, leading home with `href`', true),
      name: words('The site\'s name beside the mark'),
      links: { type: 'actions', required: true, min: 1, max: 12, meaning: 'The pages; the current page is marked from the address, not stored' },
      languages: { type: 'languages', max: 8, meaning: 'The other languages\' front pages, as words, or as flags one control high where a language has a `picture`' },
      menu: { type: 'runtime', meaning: 'The site\'s menu toggle runtime, which opens the folded links' },
    },
    examples: [
      { id: 'site-header', kind: 'header', sticky: true, fold: 40, logoHeight: 4, mobileLogoHeight: 3, linkStyle: 'line', logo: { src: '/photos/logo.svg', alt: 'Harbour rafts', href: '/' }, links: [{ text: 'Start', href: '/' }, { text: 'Green raft', href: '/green/' }, { text: 'Blue raft', href: '/blue/' }, { text: 'Book', href: '/book/' }], languages: [{ text: 'English', href: '/en/', picture: { src: '/photos/logo.svg', alt: 'English' } }, { text: 'Deutsch', href: '/de/' }], menu: { name: 'MenuToggle', props: {} } },
      { id: 'small-header', kind: 'header', logo: { src: '/photos/logo.svg', alt: '', href: '/' }, name: 'Søndergården', links: [{ text: 'News', href: '/news/' }, { text: 'Minutes', href: '/minutes/' }, { text: 'Contact', href: '/contact/' }] },
    ],
  },
  {
    kind: 'footer', layer: 'section',
    description: 'The foot of every page: the brand, columns of lines with their widths, then the legal line, the policies, the languages and the site\'s preferences.',
    fields: {
      columnWidth: squares(6, 16, 8, 'A column\'s width unless it names its own'),
      line: boolean(true, 'A hairline along the top'),
    },
    slots: {
      brand: picture('The mark, one square high, leading home with `href`'),
      tagline: words('A line about the site under the mark, muted'),
      columns: { type: 'items', required: true, min: 1, max: 6, meaning: 'The columns', item: {
        heading: { type: 'text', max: 200, meaning: 'The column\'s heading, in the title grey' },
        href: { type: 'address', meaning: 'Where the heading leads' },
        width: { type: 'squares', min: 4, max: 16, meaning: 'This column\'s width instead of `columnWidth`' },
        lines: { type: 'links', required: true, min: 1, max: 20, meaning: 'The lines: links with `href`, or words alone' },
      } },
      legal: words('The copyright and legal line, muted'),
      policies: actions('Privacy, terms and the like, as secondary buttons', 8),
      languages: { type: 'languages', max: 8, meaning: 'This page in every language; the one being read is marked from the address, not stored' },
      follow: actions('Social links, a column at the row\'s end; with an `icon` each is a round mark one control high in the ink, its words read out', 8),
      preferences: { type: 'runtime', meaning: 'The site\'s theme or language runtime at the base\'s end' },
    },
    examples: [
      { id: 'site-footer', kind: 'footer', columnWidth: 8, line: true, brand: { src: '/photos/logo.svg', alt: 'Harbour rafts', href: '/' }, tagline: 'Rafts in the harbour since 2016.', columns: [
        { heading: 'Harbour Rafts ApS', href: '/about/', lines: [{ text: 'CVR 40379886' }, { text: 'info@example.com', href: 'mailto:info@example.com' }, { text: '+45 20 82 50 01', href: 'tel:+4520825001' }] },
        { heading: 'Office', width: 10, lines: [{ text: 'Hestehaven 11' }, { text: '2500 Valby' }] },
      ], legal: '© 2026 Harbour Rafts', policies: [{ text: 'Privacy', href: '/privacy/' }, { text: 'Press', href: '/press/' }], languages: [{ text: 'Dansk', href: '/' }, { text: 'English', href: '/en/' }], follow: [{ text: 'Instagram', href: 'https://www.instagram.com/example', icon: 'instagram' }, { text: 'Facebook', href: 'https://www.facebook.com/example', icon: 'facebook' }] },
      { id: 'small-footer', kind: 'footer', columns: [
        { heading: 'Søndergården', lines: [{ text: 'News', href: '/news/' }, { text: 'Minutes', href: '/minutes/' }] },
        { heading: 'Contact', lines: [{ text: 'The residents\' committee', href: '/contact/' }, { text: 'The caretaker', href: '/caretaker/' }] },
      ], legal: 'Søndergården 1931. A site for the residents.', preferences: { name: 'Theme', props: {} } },
    ],
  },
];

export const KINDS: KindDefinition[] = [...PRIMITIVES, ...SECTIONS];
export const sectionDefinition = (kind: string): KindDefinition | undefined => SECTIONS.find(definition => definition.kind === kind);

/** The record as written to `shared/generated/vocabulary.json`. */
export function vocabularyRecord() {
  return {
    schema: 1 as const,
    kind: 'native-vocabulary' as const,
    description: 'Every block a native page can hold: the primitives (layout and content) and the sections above them. Measures are whole squares of 20px, multiplied by the device scale, where the type says squares, and pixels where it says pixels. A tone is a name the site\'s library defines; a section carries no colour, CSS or HTML. A words slot is Aa Markdown; a picture is a reference into the page\'s images; an action is a link.',
    tones: [...TONES],
    common: COMMON_FIELDS,
    kinds: KINDS,
  };
}
/** The record as JSON, exactly as the file is committed. */
export const vocabularyJson = () => JSON.stringify(vocabularyRecord(), null, 2) + '\n';
