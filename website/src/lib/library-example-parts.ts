// The pieces shared by the examples drawn with a published design library: the same components,
// measures and grid as every other example, with a library's colours, corners and type. The
// library is loaded after Design system 1's stylesheet, as any page loads one; each version is
// pinned, so an edit to a library never changes an example until it names the new version.

export const LIBRARIES = {
  slate: { name: 'Slate', id: 'SLATE_ID', version: 1 },
  lagoon: { name: 'Lagoon', id: 'LAGOON_ID', version: 1 },
  bloom: { name: 'Bloom', id: 'BLOOM_ID', version: 1 },
  grove: { name: 'Grove', id: 'GROVE_ID', version: 1 },
  signal: { name: 'Signal', id: 'SIGNAL_ID', version: 1 },
  graphite: { name: 'Graphite', id: 'GRAPHITE_ID', version: 1 },
  voyage: { name: 'Voyage', id: 'VOYAGE_ID', version: 1 },
  studio: { name: 'Studio', id: 'STUDIO_ID', version: 1 },
} as const;

// Until a library is published in the libraries account, the example loads its draft, written by
// scripts/example-libraries.mjs into public/examples/libraries; then its pinned version.
const published = (id: string) => !id.endsWith('_ID');
export const library = (key: keyof typeof LIBRARIES) => {
  const { id, version } = LIBRARIES[key];
  return { ...LIBRARIES[key], href: published(id) ? `https://designsystem1.com/ds1/${id}/v/${version}.css` : `/examples/libraries/${key}.css` };
};

// Pictures made for these examples. Until a picture is in public/examples/images, its place is
// held by one of the photographs already there.
const STAND_INS: Record<string, string> = {
  'halo-hero.jpg': 'headphones.jpg', 'halo-colours.jpg': 'cup.jpg', 'halo-shelf.jpg': 'room.jpg', 'halo-fabric.jpg': 'chair.jpg', 'halo-outdoors.jpg': 'forest.webp',
  'bike-hero.jpg': 'forest.webp', 'bike-city.jpg': 'room.jpg', 'bike-display.jpg': 'chair.jpg', 'bike-gravel.jpg': 'lake.jpg',
  'tide-stage.jpg': 'lake.jpg', 'tide-sax.jpg': 'headphones.jpg', 'tide-decks.jpg': 'cup.jpg', 'tide-choir.jpg': 'room.jpg', 'tide-strings.jpg': 'chair.jpg', 'tide-map.jpg': 'forest.webp',
  'relay-waves.jpg': 'lake.jpg',
  'trip-wing.jpg': 'lake.jpg', 'trip-room.jpg': 'room.jpg', 'city-lisbon.jpg': 'room.jpg', 'city-kyoto.jpg': 'forest.webp', 'city-oslo.jpg': 'lake.jpg', 'city-tokyo.jpg': 'cup.jpg', 'city-copenhagen.jpg': 'chair.jpg',
  'easel-collage.jpg': 'headphones.jpg', 'easel-file-poster.jpg': 'cup.jpg', 'easel-file-app.jpg': 'room.jpg', 'easel-file-type.jpg': 'chair.jpg', 'easel-file-brand.jpg': 'forest.webp',
  'atlas-cover.jpg': 'lake.jpg', 'atlas-alps.jpg': 'forest.webp', 'atlas-desert.jpg': 'room.jpg', 'atlas-harbour.jpg': 'cup.jpg', 'atlas-train.jpg': 'chair.jpg',
};
export const image = (name: string) => `/examples/images/${STAND_INS[name] ?? name}`;

export const photo = (name: string, alt: string, ratio = '4 / 3', extra = '') => `<ds-image src="${image(name)}" alt="${alt}" ratio="${ratio}" ${extra}></ds-image>`;
export const text = (words: string, attrs = '') => `<ds-text literal ${attrs}>${words}</ds-text>`;
export const heading = (words: string, level = 2) => text(words, `size="display" strong wrap role="heading" aria-level="${level}"`);
export const icon = (type: string) => `<ds-icon type="${type}" aria-hidden="true"></ds-icon>`;
export const choices = (label: string, attr: string, values: string[]) => `<ds-tabs role="group" aria-label="${label}">${values.map((value, index) => `<ds-button control="host" data-${attr}="${value.toLowerCase()}" aria-pressed="${index === 0}"${index === 0 ? ' active' : ''}>${value}</ds-button>`).join('')}</ds-tabs>`;
export const choose = `function choose(selector, button){document.querySelectorAll(selector).forEach(item=>{item.toggleAttribute('active',item===button);item.setAttribute('aria-pressed',String(item===button));});}`;
