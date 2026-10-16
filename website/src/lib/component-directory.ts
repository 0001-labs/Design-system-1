/**
 * The system's four layers and what stands in each, as the sidebar numbers
 * them. `tag` is the name in code: the custom element, or the file for Root.
 * An entry with no `tag` is documented but has no element of its own.
 */
import { isSharedInterfaceIcon, sharedIconName } from './icons/icon-scope';
export type DirectoryEntry = { name: string; href: string; tag?: string };
export type DirectoryLayer = {
  number: number;
  name: string;
  color: string;
  summary: string;
  entries: DirectoryEntry[];
};

export const LAYERS: DirectoryLayer[] = [
  {
    number: 1,
    name: 'Root',
    color: 'white',
    summary: 'The unit, the colours and the type.',
    entries: [
      { name: 'Styling', href: '/1-root/styling/', tag: 'one.css' },
      { name: 'Fonts', href: '/1-root/fonts/', tag: 'fonts' },
    ],
  },
  {
    number: 2,
    name: 'Core',
    color: 'light-green',
    summary: 'One piece each: a button, a text, an icon.',
    entries: [
      { name: 'Avatar', href: '/2-core/avatar/', tag: 'ds-avatar' },
      { name: 'Banner', href: '/2-core/banner/', tag: 'ds-banner' },
      { name: 'Button', href: '/2-core/button/', tag: 'ds-button' },
      { name: 'Split', href: '/2-core/split/', tag: 'ds-split' },
      { name: 'Card', href: '/2-core/card/', tag: 'ds-card' },
      { name: 'Cycle', href: '/2-core/cycle/', tag: 'ds-cycle' },
      { name: 'Date', href: '/2-core/date/', tag: 'ds-date' },
      { name: 'Gap', href: '/2-core/gap/', tag: 'ds-gap' },
      { name: 'Icon', href: '/2-core/icon/', tag: 'ds-icon' },
      { name: 'Input', href: '/2-core/input/', tag: 'ds-input' },
      { name: 'Language', href: '/2-core/language/', tag: 'ds-language' },
      { name: 'Link', href: '/2-core/link/' },
      { name: 'Text', href: '/2-core/text/', tag: 'ds-text' },
      { name: 'Tooltip', href: '/2-core/tooltip/', tag: 'ds-tooltip' },
    ],
  },
  {
    number: 3,
    name: 'Unit',
    color: 'light-blue',
    summary: 'Core pieces put together: a row, a list.',
    entries: [
      { name: 'Accordion', href: '/3-unit/accordion/', tag: 'ds-accordion' },
      { name: 'Card', href: '/3-unit/card/' },
      { name: 'Form', href: '/3-unit/form/', tag: 'ds-form' },
      { name: 'List', href: '/3-unit/list/', tag: 'ds-list' },
      { name: 'Navigation', href: '/3-unit/navigation/' },
      { name: 'Panel', href: '/3-unit/panel/' },
      { name: 'Row', href: '/3-unit/row/', tag: 'ds-row' },
      { name: 'Sidebar', href: '/3-unit/sidebar/', tag: 'ds-sidebar' },
      { name: 'Table', href: '/3-unit/table/', tag: 'ds-table' },
    ],
  },
  {
    number: 4,
    name: 'Page',
    color: 'pink',
    summary: 'Where units stand on the grid.',
    entries: [
      { name: 'Container', href: '/4-page/container/', tag: 'ds-container' },
      { name: 'Grid', href: '/4-page/grid/', tag: 'ds-grid' },
      { name: 'Layout', href: '/4-page/layout/', tag: 'ds-layout' },
    ],
  },
];

/** Every drawing in DS1/x-icon, by file name: the name ds-icon takes. */
const drawings = import.meta.glob<string>('../../../DS1/x-icon/*.svg', { query: '?raw', import: 'default', eager: true });
export const ICONS = Object.entries(drawings)
  .map(([path, svg]) => ({ key: path.split('/').pop()!.replace('.svg', ''), svg }))
  .filter(icon => isSharedInterfaceIcon(icon.key))
  .map(icon => ({ ...icon, name: sharedIconName(icon.key) }))
  .sort((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true }));
export const ICON_SUMMARY = 'The drawings ds-icon shows, each by its name.';
