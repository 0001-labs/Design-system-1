export { LAYERS, type DirectoryEntry, type DirectoryLayer } from '../../../shared/component-directory';
import { isSharedInterfaceIcon, sharedIconName } from './icons/icon-scope';

/** Every drawing in DS1/x-icon, by file name: the name ds-icon takes. */
const drawings = import.meta.glob<string>('../../../DS1/x-icon/*.svg', { query: '?raw', import: 'default', eager: true });
export const ICONS = Object.entries(drawings)
  .map(([path, svg]) => ({ key: path.split('/').pop()!.replace('.svg', ''), svg }))
  .filter(icon => isSharedInterfaceIcon(icon.key))
  .map(icon => ({ ...icon, name: sharedIconName(icon.key) }))
  .sort((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true }));
export const ICON_SUMMARY = 'The drawings ds-icon shows, each by its name.';
