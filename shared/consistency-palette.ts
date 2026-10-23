import { LAYERS } from './component-directory';
import { componentDefaults, writeBasicContentElement } from './consistency-content';

/** The public visual catalogue, shared by insertion menus and the decision route. */
export interface PaletteField { label: string; value: string; type?: 'number' | 'url'; options?: readonly string[] }
export interface PaletteDefinition { id: string; label: string; name: string; tag: string; layer: string; keywords: string; fields: Record<string, PaletteField>; variants?: readonly string[] }
const field = (label: string, value: string): PaletteField => ({ label, value });
const number = (label: string, value: number): PaletteField => ({ label, value: String(value), type: 'number' });
const fields: Record<string, Record<string, PaletteField>> = {
  avatar: { label: field('Name', 'Alex'), initial: field('Initial', 'A') },
  chart: { label: field('Label', 'Sample values'), values: field('Values, separated by commas', '20,40,30,60') },
  checkbox: { label: field('Label', 'Accept updates') },
  cycle: { label: field('Label', 'Size') },
  empty: { heading: field('Heading', 'Nothing here yet'), text: field('Text', 'Add your first item.') },
  gap: {}, icon: { type: field('Icon name', 'star') },
  image: { src: { ...field('Image address', ''), type: 'url' }, alt: field('Alternative text', 'Your image'), caption: field('Caption', '') },
  input: { label: field('Label', 'Your name'), placeholder: field('Placeholder', 'Type here') },
  number: { label: field('Label', 'Quantity'), value: number('Value', 1) },
  link: { label: field('Label', 'Read more'), href: { ...field('Destination', '/'), type: 'url' } },
  message: { heading: field('Heading', 'A little update'), text: field('Text', 'Write your message here.') },
  progress: { value: number('Value', 40), max: number('Maximum', 100) },
  stat: { label: field('Label', 'Projects'), value: number('Value', 12), caption: field('Caption', 'This month') },
  switch: { label: field('Label', 'Receive updates') }, tag: { label: field('Label', 'New') },
  text: { text: field('Text', 'Something worth saying.') },
  tooltip: { label: field('Trigger label', 'More information'), text: field('Tooltip', 'A helpful explanation.') },
  accordion: { summary: field('Summary', 'A common question'), details: field('Details', 'Write the answer here.') },
  calendar: {}, bento: { first: field('First tile', 'First idea'), second: field('Second tile', 'Second idea') },
  context: { first: field('First action', 'Copy'), second: field('Second action', 'Duplicate') },
  form: { label: field('Field label', 'Email'), button: field('Button label', 'Subscribe') },
  footer: { brand: field('Brand', 'Your studio'), tagline: field('Tagline', 'Made with care') },
  header: { brand: field('Brand', 'Your studio'), first: field('First link', 'Work'), second: field('Second link', 'About') },
  list: { first: field('First item', 'First item'), second: field('Second item', 'Second item') },
  matrix: { label: field('Label', 'Overview'), row: field('Row', 'Project'), column: field('Column', 'Ready') },
  row: { label: field('Label', 'An item'), detail: field('Detail', 'A little more detail') },
  select: { first: field('First option', 'First option'), second: field('Second option', 'Second option') },
  sidebar: { first: field('First page', 'Overview'), second: field('Second page', 'Projects') },
  table: { column: field('Column', 'Name'), first: field('First row', 'First item'), second: field('Second row', 'Second item') },
  'table-of-contents': { first: field('First section', 'Introduction'), second: field('Second section', 'Details') },
  tabs: { first: field('First tab', 'Overview'), second: field('Second tab', 'Details') },
  container: { text: field('Content', 'Your content here.') }, document: { title: field('Title', 'A document'), text: field('Content', 'Start writing here.') },
  grid: {}, overlay: { title: field('Title', 'A closer look'), text: field('Content', 'Your overlay content.') },
  page: { title: field('Title', 'A new page'), text: field('Content', 'Start making something.') },
  panel: { title: field('Title', 'Panel'), text: field('Content', 'Your panel content.') },
};
const variants: Record<string, readonly string[]> = {
  avatar: ['round', 'square'], gap: ['1', '2', '05'], image: ['cover', 'contain'],
  input: ['text', 'email', 'tel', 'url'], message: ['neutral', 'success', 'warning', 'danger'],
  accordion: ['closed', 'open'], calendar: ['month', 'week', 'day'],
  row: ['horizontal', 'stacked'], tabs: ['buttons', 'text', 'split', 'paper'],
  grid: ['grid', 'lines', 'columns', 'dots'], overlay: ['modal', 'sheet', 'drawer', 'popover', 'screen'],
  page: ['column', 'centered', 'sidebar', 'split', 'inspector', 'tiles'],
};
const labels: Record<string, string> = { text: 'Text component', table: 'Data table', tabs: 'Tab bar', 'table-of-contents': 'Contents navigation' };
const aliases: Record<string, string> = { carousel: 'slides slideshow gallery images', chart: 'graph plot', stat: 'statistic metric', bento: 'tiles', context: 'context menu', overlay: 'dialog modal drawer sheet popover', 'table-of-contents': 'toc outline headings', switch: 'toggle', message: 'notice alert banner', image: 'picture photo', gap: 'space spacer' };
export const COMPONENT_PALETTE: readonly PaletteDefinition[] = LAYERS.filter(layer => layer.number > 1).flatMap(layer => layer.entries.map(entry => {
  const id = entry.href.split('/').filter(Boolean).at(-1)!;
  return { id, name: entry.name, label: labels[id] ?? entry.name, tag: entry.tag ?? 'a', layer: layer.name, keywords: `${id} ${entry.name} ${entry.tag ?? ''} ${layer.name} ${aliases[id] ?? ''}`, fields: fields[id] ?? {}, ...(variants[id] ? { variants: variants[id] } : {}) };
}));
export const paletteDefinition = (id: string) => COMPONENT_PALETTE.find(entry => entry.id === id);
export interface PaletteContent { kind: 'palette'; component: string; values: Record<string, string>; variant?: string }
export function defaultPaletteContent(entry: PaletteDefinition): PaletteContent {
  return { kind: 'palette', component: entry.id, values: Object.fromEntries(Object.entries(entry.fields).map(([key, field]) => [key, field.value])), ...(entry.variants ? { variant: entry.variants[0] } : {}) };
}
export function validPaletteField(field: PaletteField, value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 5000) return false;
  if (field.options && !field.options.includes(value)) return false;
  if (field.type === 'number') return value.trim() !== '' && Number.isFinite(Number(value)) && Math.abs(Number(value)) <= 1_000_000;
  if (field.type === 'url') return !value || !/[\s\\<>]/.test(value) && (/^https?:\/\//i.test(value) || /^\/(?!\/)/.test(value) || /^#[\w-]*$/.test(value));
  return true;
}
export function writePaletteContent(value: PaletteContent): string {
  const { kind: _, ...fields } = value;
  return '\x60\x60\x60c9y-component\n' + JSON.stringify(fields).replaceAll('`', '\\u0060') + '\n\x60\x60\x60';
}
export function readPaletteContent(source: string): PaletteContent | null {
  const match = /^```c9y-component\r?\n([\s\S]*)\r?\n```$/.exec(source);
  if (!match || source.length > 24_000) return null;
  try {
    const value = JSON.parse(match[1]!);
    if (!value || typeof value.component !== 'string' || !value.values || typeof value.values !== 'object' || Array.isArray(value.values)) return null;
    const entry = paletteDefinition(value.component);
    if (!entry || ['button', 'card', 'carousel'].includes(entry.id)) return null;
    if (value.variant !== undefined && !entry.variants?.includes(value.variant)) return null;
    if (Object.keys(value.values).some(key => !Object.hasOwn(entry.fields, key))) return null;
    if (Object.entries(entry.fields).some(([key, field]) => !validPaletteField(field, value.values[key]))) return null;
    if (entry.id === 'chart' && (!/^-?\d+(?:\.\d+)?(?:\s*,\s*-?\d+(?:\.\d+)?){0,23}$/.test(value.values.values) || value.values.values.split(',').some((number: string) => !Number.isFinite(Number(number)) || Math.abs(Number(number)) > 1_000_000))) return null;
    return { kind: 'palette', component: entry.id, values: value.values, ...(value.variant === undefined ? {} : { variant: value.variant }) };
  } catch { return null; }
}
export function paletteInsertion(entry: PaletteDefinition): string {
  if (entry.id === 'button' || entry.id === 'card') return writeBasicContentElement(componentDefaults[entry.id]);
  if (entry.id === 'carousel') return '```c9y-carousel\n{"slides":[],"height":280}\n```';
  return writePaletteContent(defaultPaletteContent(entry));
}
