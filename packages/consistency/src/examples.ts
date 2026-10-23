import { initialComposition, type Composition } from './model';
import { writeContentElement } from './elements';
import { writeColumns } from '../../../website/src/vendor/aa/aa';
import { image } from '../../../website/src/lib/library-example-parts';
export interface ExamplePage { id: string; label: string; sourcePath: string; sourceUrl: string; composition: Composition }
const photo = (name: string, alt: string, squares = 28) => `![${alt}](https://designsystem1.com${image(name)} "w${squares}")`;
const button = (label: string, secondary = false) => writeContentElement({ kind: 'button', label, secondary });
const card = (label: string, title: string, body: string) => writeContentElement({ kind: 'card', label, title, body, width: 280, height: 260 });
/** Content is adapted from the authored DS1 examples, never their demo scripts.
 * These are editable Markdown compositions, with Aa's real image/column atoms. */
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
editorExample.sourceUrl = 'https://neweditor.c9y.site/';
export const EXAMPLE_PAGES: readonly ExamplePage[] = [
 editorExample,
 { id: 'studio', label: 'Studio', sourcePath: 'packages/consistency/src/model.ts', sourceUrl: 'https://neweditor.c9y.site/', composition: structuredClone(initialComposition) },
 page('shop', 'Shop', [
  '# Room',
  'Furniture, objects & everyday rituals',
  '## A room is never really finished.',
  'A chair pulled up. A cup set down. A few things that make a place your own.',
  button('Find your next favourite'),
  photo('room.jpg', 'A cane chair in a room filled with afternoon light'),
  'Good things. Kept for years.\n\nMade for living',
 ].join('\n\n'), {
  collection: [
   '## The everyday collection',
   photo('chair.jpg', 'Everyday chair, a wooden chair with a slatted back', 16),
   card('€180', 'Everyday chair', 'Wood, with a little character.'),
   button('Add to bag', true),
   photo('cup.jpg', 'A speckled ceramic cup', 16),
   card('€28', 'Morning cup', 'For the first ten quiet minutes.'),
   button('Add to bag', true),
  ].join('\n\n'),
  story: '## Less, but more lived in.\n\nWe look for pieces with a useful shape and a reason to stay. Nothing too precious to touch. Nothing that needs a special occasion.\n\nPut your feet up. Leave the book open. Let the room become yours.',
 }, 720),
 page('product', 'Product', [
  '# Sound / 01',
  'For the love of listening.',
  '## Press play. Stay a while.',
  'One good pair. Your whole record collection. Meet Sound / 01.',
  button('Make it yours · €249'),
  photo('headphones.jpg', 'Mint headphones resting across pink and blue paper'),
 ].join('\n\n'), {
  details: [
   '## Nothing between you and the next track.',
   'Albums deserve more than background noise. Put the phone down, find the comfortable chair and listen all the way through.',
   writeColumns(['### Just plug in\n\nWired\n\nNo pairing. No battery.', '### Settle into the sound\n\nOver-ear\n\nSoft, full-size cushions']),
   '| Connection | Fit | Finish |\n| --- | --- | --- |\n| 3.5 mm cable | Over-ear | Ice blue |',
  ].join('\n\n'),
  package: [
   '## Your next favourite pair.',
   'Keep it simple, or take a little extra protection for the journey.',
   card('Your selection · €249', 'Headphones', 'Headphones, cable and the next album on your list.'),
   button('With travel case', true), button('Add to bag'),
   'This is a fictional product. No purchase is made.',
  ].join('\n\n'),
 }),
 page('planner', 'Planner', [
  '# A good week starts here.',
  'Monday, 19 October. Launch in four days.',
  '## Autumn collection',
  '| Mon · 19 | Tue · 20 | Wed · 21 | Thu · 22 | Fri · 23 |\n| --- | --- | --- | --- | --- |\n| Photographs | Design review | Print files | Final checks | Launch day |',
 ].join('\n\n'), {
  items: [
   '## Make it happen',
   '- [ ] Choose the final photographs\n- [ ] Review the collection page\n- [x] Send the print files\n- [ ] Write the launch note',
   button('Add an item', true),
  ].join('\n\n'),
  brief: [
   '## Collection shoot',
   'Natural light. Familiar objects. An ordinary morning, looked at a little longer.',
   photo('room.jpg', 'Chair by the window: location reference'),
   writeColumns(['### Location\n\nSet the chair beside the window. Shoot the full room first.', '### Details\n\nThen the grain, the handle and the edge of the cup.']),
   'Deliver six landscape crops and three portraits by Tuesday’s review.',
   card('Mika added 3 references', 'Collection shoot', 'Natural light. Familiar objects. An ordinary morning, looked at a little longer.'),
  ].join('\n\n'),
 }, 800),
 page('finance', 'Finance', [
  '# Ledger',
  'Demo data · October',
  '## Overview',
  writeColumns(['### Available balance\n\n€18,420\n\nAcross two accounts', '### Money in\n\n€6,200\n\n2 client payments']),
  '### Money out\n\n€408.80\n\n3 transactions',
 ].join('\n\n'), {
  activity: [
   '## Recent activity',
   '| Date | Name | Category | Amount |\n| --- | --- | --- | --- |\n| 19 Oct | North studio | Client payment | €3,200 |\n| 18 Oct | Corner market | Groceries | −€42.80 |\n| 17 Oct | Rail ticket | Travel | −€86 |\n| 16 Oct | Print workshop | Production | −€280 |\n| 15 Oct | Oak house | Client payment | €3,000 |',
   'Every outgoing payment, in one place.',
   button('Money in', true), button('Money out', true),
  ].join('\n\n'),
  goal: [
   '## A little closer to the mountains.',
   photo('lake.jpg', 'Mountains reflected in a still lake'),
   card('Your next chapter', 'A week away', '€2,400 of €3,000 saved. Your next €600 completes the travel fund.'),
   'Fictional demo. Your changes stay here.',
  ].join('\n\n'),
 }, 800),
 page('travel', 'Travel stays', [
  '# Stillwater', 'Cabins on the water, open all year',
  '## Slow mornings by still water.',
  'Twelve small cabins on three quiet lakes. A boat at the jetty, a stove for the evening, nowhere to be.',
  button('Find a cabin'), photo('lake.jpg', 'Mountains mirrored in a still lake at dawn'),
  writeColumns(['### 12 cabins\n\nOn three lakes\n\nEach with its own jetty', '### From €140 a night\n\nBreakfast basket included', '### 4.9 of 5\n\nFrom 2,300 stays']),
 ].join('\n\n'), {
  stays: ['## Stays for your dates',
   writeColumns([
    [photo('forest.webp', 'A path through pine forest to the cabin', 14), card('€140 · Lake view', 'Pine cabin', 'Sleeps 2 · Wood stove'), button('Save', true)].join('\n\n'),
    [photo('lake.jpg', 'The boathouse jetty over clear water', 14), card('€190 · On the water', 'The boathouse', 'Sleeps 4 · Rowing boat'), button('Save', true)].join('\n\n'),
    [photo('room.jpg', 'A cane chair by the cabin window', 14), card('€160 · Quiet', 'Reading cabin', 'Sleeps 2 · A shelf of books'), button('Save', true)].join('\n\n'),
   ])].join('\n\n'),
  arrival: '## Arrive, and the lake does the rest.\n\n### How do I get the key?\n\nA code arrives the morning you travel. The door opens with it until you leave.\n\n### Is there a boat?\n\nEvery cabin has a rowing boat, life jackets and a map of the swimming spots.\n\n### Can I bring a dog?\n\nYes, in the pine cabins. Bring its bed; we leave a bowl by the door.',
 }, 800, 'website/src/lib/library-examples.ts'),
 // Booking mounts its complete authored page; sections hold its editable text overrides.
 page('booking', 'Booking site', '', {}, 1120, 'website/src/lib/library-brands.ts'),
 page('cafe', 'Café', [
  '# Petal', 'Coffee, tea and things from the oven', '## Something warm, something sweet.',
  'Order ahead and it waits for you on the counter, still warm, with your name on the cup.',
  button('See today’s menu'), photo('cup.jpg', 'A speckled ceramic cup of coffee', 20),
 ].join('\n\n'), {
  menu: ['## Today’s menu', button('Coffee', true), button('Tea', true), button('Baking', true)].join('\n\n'),
  order: ['## Your order', 'Nothing yet. Add something from the menu.', '### Total\n\n€0.00', button('Order for pickup'), card('Stamps', '7 of 10', 'Three more for a free cup')].join('\n\n'),
 }, 720, 'website/src/lib/library-examples.ts'),
 page('magazine', 'Travel magazine', [
  '# Atlas', 'A magazine for the long way round', 'Issue 12 · Winter',
  '## The slow way north: nine days by train, ferry and foot to the edge of the map.',
  photo('atlas-cover.jpg', 'A coastline seen from above, a road along the cliffs'),
 ].join('\n\n'), {
  stories: ['## In this issue', 'Seven stories, four countries', writeColumns([
   [photo('atlas-alps.jpg', 'Snow on the roofs of a small alpine village', 14), card('Alps', 'A village that closes its road for winter', '')].join('\n\n'),
   [photo('atlas-desert.jpg', 'A straight road into the desert at noon', 14), card('Desert', 'Six hundred kilometres of empty road', '')].join('\n\n'),
   [photo('atlas-harbour.jpg', 'Bright painted fishing boats in a small harbour', 14), card('Coast', 'The harbour that paints its boats every spring', '')].join('\n\n'),
  ])].join('\n\n'),
  essay: ['## Nine days north', 'A photo essay by Ines Holm', photo('atlas-train.jpg', 'Snow passing the window of the night train'),
   '### Getting there is the point.', 'The fast way north takes three hours and two airports. We took nine days, and on most of them we did not know where we would sleep.',
   'This issue is about the long way round: the night trains coming back, the roads that close for winter, and the people who live at the end of them.'].join('\n\n'),
  letter: ['## A letter from somewhere, every Sunday.', 'One place, one story, a few photographs. No more than that.', button('Subscribe'), 'Free. Leave any time.'].join('\n\n'),
 }, 800, 'website/src/lib/library-sites.ts'),
 page('bike', 'Bike maker', [
  '# Tern', 'Tern City · electric', '## Hills, flattened.',
  'A light electric bike that makes the long way home the nice way home.', button('Book a test ride'), button('See the bikes', true),
  photo('bike-hero.jpg', 'A green step-through electric bike, seen from the side'),
  writeColumns(['### 120 km\n\nRange\n\nOn one charge', '### 19 kg\n\nWeight\n\nBattery included', '### From €2,490\n\nOr €104 a month']),
 ].join('\n\n'), {
  bikes: ['## Three bikes. One way of riding.',
   writeColumns([
    card('Motor', 'Help that feels like your own legs.', 'The motor reads how hard you push, a thousand times a second, and adds just enough.'),
    card('Battery', 'Out in one click.', 'Charge it at your desk; it weighs what a laptop does.'),
   ]), photo('bike-display.jpg', 'The small round display on the handlebar', 16)].join('\n\n'),
  rides: ['## Where it takes people.', photo('bike-gravel.jpg', 'A gravel road through pine trees at dusk'), 'Sixty kilometres of gravel, before dinner.', 'Ines, Gravel'].join('\n\n'),
  visit: ['## Ride one this week.', 'Half an hour on your own, with a helmet and a route we like. No one will sell you anything.', button('Book')].join('\n\n'),
 }, 800, 'website/src/lib/library-sites.ts'),
 page('financial', 'Financial services', [
  '# Morrow', 'Financial tools, built around your business',
  '## Start with one part. Connect the rest.',
  'A first purchase, a monthly membership, or a platform that connects people. Choose the tools that fit the way your business works.',
  button('Explore Morrow'), button('Plan an integration', true),
  writeColumns(['### Sales this month\n\n¥1,280,000\n\nSample activity', '### Payments\n\n138\n\nExample orders']),
 ].join('\n\n'), {
  products: ['## Make the next sale feel simple.', writeColumns([
   card('Payments', 'Make the next sale feel simple.', 'A checkout that belongs to your business, with a clear view of every payment afterwards.'),
   card('Billing', 'A rhythm that fits.', 'Start with a checkout. Add subscriptions when the idea grows.'),
   card('Platforms', 'Keep the pieces together.', 'Keep the same clear building blocks as the business changes.'),
  ])].join('\n\n'),
  markets: ['## Different markets. One shared picture.', 'Explore how a team could keep local currencies and familiar payment experiences together in one workspace.',
   '| City | Currency |\n| --- | --- |\n| Tokyo | JPY |\n| Copenhagen | DKK |\n| London | GBP |\n| New York | USD |', 'Illustrative markets and currencies, not a claim of service availability.'].join('\n\n'),
  developers: ['## A small beginning. Room to build.', 'Start with a checkout. Add subscriptions when the idea grows. Keep the same clear building blocks as the business changes.', button('Try the product preview')].join('\n\n'),
  contact: ['## What would you like to build?', 'Start with the experience you want your customers to have.', button('Explore Morrow'), 'Fictional example. No accounts are created and no money moves.'].join('\n\n'),
 }, 800, 'website/src/lib/financial-example.ts'),
];
/** Each selected page gets its own mutable draft; the catalogue is a seed. */
export function exampleComposition(id: string): Composition { return structuredClone((EXAMPLE_PAGES.find(page => page.id === id) ?? EXAMPLE_PAGES[0]).composition); }
