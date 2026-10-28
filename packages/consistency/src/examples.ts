import { SITE_TEMPLATES, templateDocument } from './templates';
import { initialComposition, type Composition } from './model';
import { writeContentElement } from './elements';
import { writeColumns } from '../../../website/src/vendor/aa/aa';
export interface ExamplePage { id: string; label: string; sourcePath: string; sourceUrl: string; composition: Composition }
const card = (label: string, title: string, body: string) => writeContentElement({ kind: 'card', label, title, body, width: 280, height: 260 });
/** The editor introduction remains native Aa Markdown. Site templates retain their authored pages. */
function page(id: string, label: string, text: string, sections: Record<string, string>, width = 640, sourcePath = 'website/src/lib/product-examples.ts'): ExamplePage {
 return { id, label, sourcePath, sourceUrl: `https://designsystem1.com/examples/layouts/${id}/`, composition: { ...structuredClone(initialComposition), width, text, sections, order: ['intro', ...Object.keys(sections)], gaps: {}, hidden: [], sizes: {}, cardGaps: {}, cardDesigns: {}, linkedCardDesign: undefined, statDesigns: {}, buttonDesigns: {} } };
}
export const DEFAULT_EXAMPLE = 'editor';
const editorExample = page(DEFAULT_EXAMPLE, 'Consistency editor', [
 '# Make the page your own.',
 'Write, draw and arrange directly on the page. This is a working introduction to the Consistency editor: every example below is yours to change.',
 'Click this sentence and try a few words. Select text to format it, or type / on a new line to add a block.',
].join('\n\n'), {
 writing: [
  '## Start with words. Add a drawing.',
  'Aa brings text, tables and diagrams into the same page. Click a box in this diagram to rename it. Drag a box to move it; use its drawing tools to connect ideas.',
  '```diagram wrap\n[Write] @ 0 0\n[Draw] @ 6 0\n[Arrange] @ 12 0\nWrite -> Draw -> Arrange\n```',
  'Try changing “Draw” to something you want to make. The drawing is editable content, just like this paragraph.',
 ].join('\n\n'),
 layout: [
  '## Give each piece its place.',
  'Drag a block to move it. Drag the space between blocks to adjust the gap. Use card edges to resize, and turn on Grouping to see which pieces belong together.',
  writeColumns([
   card('Try moving me', 'Words stay yours.', 'Edit this card’s title or body directly on the page.'),
   card('Try changing my spacing', 'Design can be shared.', 'With Consistency on, matching cards share design changes while keeping their own words.'),
  ]),
 ].join('\n\n'),
 together: [
  '## One design. Different content.',
  'Consistency links the design of matching cards. Turn it off to work on their design independently. Your text remains separate in either mode.',
  '```diagram wrap\n[Shared design] @ 0 0\n[First card] @ 0 3\n[Second card] @ 6 3\nShared design -> First card\nShared design -> Second card\n```',
  '| Try this | What it does |\n| --- | --- |\n| Spacing | Adjust the space between pieces |\n| Grouping | Show the containers around your content |\n| Mobile preview | See how the page fits a narrow screen |\n| Library preset | Try another visual style |',
 ].join('\n\n'),
 explore: [
  '## Learn by changing it.',
  'Move a card, rewrite a heading or add a diagram with /diagram. Undo with Command Z on Mac or Control Z on Windows.',
  'Choose another Example page to explore a different layout. Your edits stay with each example while you switch during this session. Reloading starts a fresh example.',
 ].join('\n\n'),
}, 800, 'packages/consistency/src/examples.ts');
editorExample.sourceUrl = 'https://editor.c9y.site/';
/** Every documentation example is seeded from its authored page, including its library and static data. */
export const EXAMPLE_PAGES: readonly ExamplePage[] = [
 editorExample,
 { id: 'studio', label: 'Studio', sourcePath: 'packages/consistency/src/model.ts', sourceUrl: 'https://editor.c9y.site/', composition: structuredClone(initialComposition) },
 ...SITE_TEMPLATES.map(template => ({ id: template.id, label: template.label, sourcePath: 'website/src/lib/layout-examples.ts', sourceUrl: template.href ? `https://designsystem1.com${template.href}` : 'https://consistency.site/', composition: (templateDocument(template.id).composition ?? { ...structuredClone(initialComposition), text: '# Your site\n\nStart writing.', sections: { __authored: '1' }, order: ['intro'], gaps: {} }) as Composition })),
];
/** Each selected page gets its own mutable draft; the catalogue is a seed. */
export function exampleComposition(id: string): Composition { return structuredClone((EXAMPLE_PAGES.find(page => page.id === id) ?? EXAMPLE_PAGES[0]).composition); }
