import { LAYERS as COMPONENT_LAYERS } from '../../../shared/component-directory';
export type { DirectoryEntry, DirectoryLayer } from '../../../shared/component-directory';
// Documentation leaves Styling out of Root without changing the private workbench catalogue.
export const LAYERS = COMPONENT_LAYERS.map(layer => layer.number !== 1 ? layer : {
  ...layer,
  entries: layer.entries.filter(entry => entry.name !== 'Styling'),
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
