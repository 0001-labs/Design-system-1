import { isPublicComponent } from "../DS1/0-face/component-visibility";
/**
 * The system's four layers and what stands in each, as the sidebar numbers
 * them. `tag` is the name in code: the custom element, or the file for Root.
 * An entry with no `tag` is documented but has no element of its own.
 */
export type DirectoryEntry = { name: string; href: string; tag?: string };
export type DirectoryLayer = {
  number: number;
  name: string;
  color: string;
  summary: string;
  entries: DirectoryEntry[];
};

export const ALL_LAYERS: DirectoryLayer[] = [
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
      { name: 'Spacing handle', href: '/2-core/spacing-handle/', tag: 'ds-spacing-handle' },
      { name: 'Loading', href: '/2-core/loading/', tag: 'ds-loading' },
      { name: 'Avatar', href: '/2-core/avatar/', tag: 'ds-avatar' },
      { name: 'Banner', href: '/2-core/banner/', tag: 'ds-banner' },
      { name: 'Button', href: '/2-core/button/', tag: 'ds-button' },
      { name: 'Split', href: '/2-core/split/', tag: 'ds-split' },
      { name: 'Card', href: '/2-core/card/', tag: 'ds-card' },
      { name: 'Charts', href: '/2-core/chart/', tag: 'ds-chart' },
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


/** Public docs, workbench and normal library choices never list internal chrome. */
export const LAYERS: DirectoryLayer[] = ALL_LAYERS.map(layer => ({
  ...layer, entries: layer.entries.filter(entry => isPublicComponent(entry.tag ?? entry.href.split("/").filter(Boolean).at(-1)!)),
}));
