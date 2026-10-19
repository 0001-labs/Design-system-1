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
    color: 'yellow',
    summary: 'Shared styling, language, formatting, appearance and preferences.',
    entries: [
      { name: 'Styling', href: '/1-root/styling/', tag: 'one.css' },
      { name: 'Colours', href: '/colours/' },
      { name: 'Fonts', href: '/1-root/fonts/', tag: 'fonts' },
      { name: 'Languages', href: '/1-root/languages/' },
      { name: 'Formatting', href: '/1-root/formatting/' },
      { name: 'Theming', href: '/1-root/theming/' },
      { name: 'Device', href: '/1-root/device/' },
      { name: 'Preferences', href: '/1-root/preferences/' },
      { name: 'Pricing', href: '/1-root/pricing/' },
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
      { name: 'Button', href: '/2-core/button/', tag: 'ds-button' },
      { name: 'Card', href: '/2-core/card/', tag: 'ds-card' },
      { name: 'Chart', href: '/2-core/chart/', tag: 'ds-chart' },
      { name: 'Checkbox', href: '/2-core/checkbox/', tag: 'ds-checkbox' },
      { name: 'Cycle', href: '/2-core/cycle/', tag: 'ds-cycle' },
      { name: 'Empty state', href: '/2-core/empty/', tag: 'ds-empty' },
      { name: 'Gap', href: '/2-core/gap/', tag: 'ds-gap' },
      { name: 'Icon', href: '/2-core/icon/', tag: 'ds-icon' },
      { name: 'Image', href: '/2-core/image/', tag: 'ds-image' },
      { name: 'Input', href: '/2-core/input/', tag: 'ds-input' },
      { name: 'Keyboard shortcut', href: '/2-core/kbd/', tag: 'ds-kbd' },
      { name: 'Link', href: '/2-core/link/' },
      { name: 'Message', href: '/2-core/message/', tag: 'ds-message' },
      { name: 'Progress', href: '/2-core/progress/', tag: 'ds-progress' },
      { name: 'Stat', href: '/2-core/stat/', tag: 'ds-stat' },
      { name: 'Switch', href: '/2-core/switch/', tag: 'ds-switch' },
      { name: 'Tag', href: '/2-core/tag/', tag: 'ds-tag' },
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
      { name: 'Calendar', href: '/3-unit/calendar/', tag: 'ds-calendar' },
      { name: 'Bento', href: '/3-unit/bento/', tag: 'ds-bento' },
      { name: 'Carousel', href: '/3-unit/carousel/', tag: 'ds-carousel' },
      { name: 'Context', href: '/3-unit/context/', tag: 'ds-context' },
      { name: 'Date picker', href: '/3-unit/date-picker/', tag: 'ds-date-picker' },
      { name: 'Form', href: '/3-unit/form/', tag: 'ds-form' },
      { name: 'Footer', href: '/4-page/footer/', tag: 'ds-footer' },
      { name: 'Header', href: '/4-page/header/', tag: 'ds-header' },
      { name: 'List', href: '/3-unit/list/', tag: 'ds-list' },
      { name: 'Matrix', href: '/3-unit/matrix/', tag: 'ds-matrix' },
      { name: 'Row', href: '/3-unit/row/', tag: 'ds-row' },
      { name: 'Select', href: '/3-unit/select/', tag: 'ds-select' },
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
      { name: 'Document', href: '/4-page/document/', tag: 'ds-document' },
      { name: 'Grid', href: '/4-page/grid/', tag: 'ds-grid' },
      { name: 'Overlay', href: '/4-page/overlay/', tag: 'ds-overlay' },
      { name: 'Page', href: '/4-page/page/', tag: 'ds-page' },
      { name: 'Panel', href: '/4-page/panel/', tag: 'ds-panel' },
    ],
  },
];


/** Public docs, workbench and normal library choices never list internal chrome. */
export const LAYERS: DirectoryLayer[] = ALL_LAYERS.map(layer => ({
  ...layer, entries: layer.entries.filter(entry => isPublicComponent(entry.tag ?? entry.href.split("/").filter(Boolean).at(-1)!)),
}));
