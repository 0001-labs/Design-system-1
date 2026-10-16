import { LAYERS as COMPONENT_LAYERS } from '../../../shared/component-directory';
export type { DirectoryEntry, DirectoryLayer } from '../../../shared/component-directory';
// Documentation groups foundations without changing the private workbench catalogue.
export const LAYERS = COMPONENT_LAYERS.map(layer => layer.number !== 1 ? layer : {
  ...layer,
  entries: [
    ...layer.entries.filter(entry => entry.name !== 'Styling'),
    { name: 'Languages', href: '/1-root/languages/' },
    { name: 'Formatting', href: '/1-root/formatting/' },
    { name: 'Theming', href: '/1-root/theming/' },
    { name: 'Device', href: '/1-root/device/' },
    { name: 'Preferences', href: '/1-root/preferences/' },
    { name: 'Pricing', href: '/1-root/pricing/' },
  ],
});
import { isSharedInterfaceIcon, sharedIconName } from './icons/icon-scope';

/** Every drawing in DS1/x-icon, by file name: the name ds-icon takes. */
const drawings = import.meta.glob<string>('../../../DS1/x-icon/*.svg', { query: '?raw', import: 'default', eager: true });
export const ICONS = Object.entries(drawings)
  .map(([path, svg]) => ({ key: path.split('/').pop()!.replace('.svg', ''), svg }))
  .filter(icon => isSharedInterfaceIcon(icon.key))
  .map(icon => ({ ...icon, name: sharedIconName(icon.key) }))
  .sort((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true }));
export const ICON_SUMMARY = 'The drawings ds-icon shows, each by its name.';
