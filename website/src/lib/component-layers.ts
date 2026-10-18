// Which layer each element belongs to, read from where its source lives, and
// where it is documented. Used at build time by the layout examples.
const sources = import.meta.glob<string>(
  ['../../../DS1/2-core/**/*.ts', '../../../DS1/3-unit/**/*.ts', '../../../DS1/4-page/**/*.ts'],
  { query: '?raw', import: 'default', eager: true },
);
const docs = new Set(Object.keys(import.meta.glob('../content/docs/[234]-*/*.{md,mdx}')).map(path => path.replace(/^\.\.\/content\/docs\/|\.mdx?$/g, '')));

export type Layer = 2 | 3 | 4;
export const LAYER_NAMES: Record<Layer, string> = { 2: 'Core', 3: 'Unit', 4: 'Page' };
export interface TagInfo { layer: Layer; href?: string }

export const TAG_LAYERS: Record<string, TagInfo> = {};
for (const [path, source] of Object.entries(sources)) {
  const folder = /\/DS1\/([234]-[a-z]+)\//.exec(path)![1];
  const layer = Number(folder[0]) as Layer;
  for (const match of source.matchAll(/\b(?:define|customElement)\(\s*["'](ds-[a-z0-9-]+)["']/g)) {
    const tag = match[1];
    if (TAG_LAYERS[tag]) continue;
    const page = path.includes('/2-core/chart/') || path.endsWith('/ds-chart.ts') ? '2-core/chart' : `${folder}/${tag.slice(3)}`;
    TAG_LAYERS[tag] = { layer, href: docs.has(page) ? `/${page}/` : undefined };
  }
}
TAG_LAYERS['ds-page'].href = '/4-page/layout/';

/** The distinct elements a sample uses, grouped by layer, outermost layer first. */
export function layersIn(html: string): { layer: Layer; name: string; tags: { tag: string; href?: string }[] }[] {
  const tags = [...new Set([...html.matchAll(/<(ds-[a-z0-9-]+)/g)].map(match => match[1]))].filter(tag => TAG_LAYERS[tag]);
  return ([4, 3, 2] as Layer[])
    .map(layer => ({ layer, name: LAYER_NAMES[layer], tags: tags.filter(tag => TAG_LAYERS[tag].layer === layer).map(tag => ({ tag, href: TAG_LAYERS[tag].href })) }))
    .filter(group => group.tags.length);
}
