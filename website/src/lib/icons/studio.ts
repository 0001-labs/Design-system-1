import { blankIcon, cloneIcon, iconSvg, parseIcon, type GridIcon } from './gridIcon';
import { FIGMA_ICONS } from './gridIconFigma';
import packagingMosaic from './brands/design-system-1-mosaic.json';

export type Drawing = { name: string; icon: GridIcon; radius: number; padding: number };
export type Preset = Drawing & { key: string; description: string };
const block = (icon: GridIcon, x: number, y: number, w: number, h: number, ink: number) => {
  for (let row = y; row < y + h; row++) for (let col = x; col < x + w; col++) icon.cells[row * 16 + col] = ink;
};
// The packaging front's 340-unit square, sampled on the favicon's 16-unit grid.
// Preserve its original colour tokens and progression from large to small tiles.
const system: GridIcon = { ...packagingMosaic, mask: 'square' };
const consistency = blankIcon(['#594dff', '#f0ecff']);
block(consistency, 3, 3, 10, 2, 1); block(consistency, 3, 7, 7, 2, 1); block(consistency, 3, 11, 10, 2, 1);
const worktrees = blankIcon(['#204c38', '#c7f7a2']);
block(worktrees, 7, 7, 2, 7, 1); block(worktrees, 3, 3, 3, 3, 1); block(worktrees, 10, 3, 3, 3, 1);
block(worktrees, 4, 6, 2, 3, 1); block(worktrees, 10, 6, 2, 3, 1); block(worktrees, 6, 8, 4, 2, 1);
const link = blankIcon(['#e9f64a', '#a2f67f', '#48e4ae', '#2adacb', '#124d45']);
link.cells = link.cells.map((_, at) => Math.min(3, Math.floor(((at % 16) + Math.floor(at / 16)) / 8)));
block(link, 3, 4, 6, 2, 4); block(link, 3, 4, 2, 6, 4); block(link, 3, 8, 5, 2, 4);
block(link, 7, 6, 6, 2, 4); block(link, 11, 6, 2, 6, 4); block(link, 7, 10, 6, 2, 4);
export const PRODUCTS: Preset[] = [
  { key: 'design-system-1', name: 'Design System 1', description: 'The square colour mosaic from the packaging.', icon: system, radius: 0, padding: 0 },
  { key: 'link', name: 'Link', description: 'Two connected forms in citrus and mint.', icon: link, radius: 3, padding: 0 },
  { key: 'consistency', name: 'Consistency', description: 'A repeated rhythm, with a deliberate variation.', icon: consistency, radius: 2, padding: 0 },
  { key: 'worktrees', name: 'Worktrees', description: 'Two branches. A shared starting point.', icon: worktrees, radius: 2, padding: 0 },
  { key: 'ezo', name: 'Ezo', description: 'The original geometric fan from Ezo’s collection.', icon: cloneIcon(FIGMA_ICONS[0].icon), radius: 0, padding: 0 },
];
export function copyDrawing(drawing: Drawing): Drawing {
  return { name: drawing.name, icon: cloneIcon(drawing.icon), radius: drawing.radius, padding: drawing.padding };
}
export function readDrawing(value: unknown): Drawing | null {
  if (!value || typeof value !== 'object') return null;
  const data = value as Partial<Drawing>;
  const icon = parseIcon(data.icon);
  if (!icon || typeof data.name !== 'string' || data.name.length > 80) return null;
  if (typeof data.radius !== 'number' || !Number.isFinite(data.radius) || data.radius < 0 || data.radius > 8) return null;
  if (typeof data.padding !== 'number' || !Number.isFinite(data.padding) || data.padding < 0 || data.padding > 4) return null;
  return { name: data.name, icon, radius: data.radius, padding: data.padding };
}
export function drawingSvg(drawing: Drawing, size = 512, id = 'drawing'): string {
  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '');
  const title = drawing.name.replace(/[<>&"']/g, c => `&#${c.charCodeAt(0)};`);
  const inner = iconSvg(drawing.icon, { id: safeId + '-inner' }).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  const padding = drawing.padding;
  const scale = (16 - padding * 2) / 16;
  const mask = drawing.icon.mask === 'circle' ? '<circle cx="8" cy="8" r="8"/>' : `<rect width="16" height="16" rx="${drawing.radius}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="${size}" height="${size}" role="img" aria-label="${title}"><title>${title}</title><defs><clipPath id="${safeId}-clip">${mask}</clipPath></defs><g transform="translate(${padding} ${padding}) scale(${scale})"><g clip-path="url(#${safeId}-clip)">${inner}</g></g></svg>`;
}
export function fileStem(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'icon';
}
/** PNG-backed ICO directory, with one entry per actual raster size. */
export function packIco(images: { size: number; bytes: Uint8Array }[]): Uint8Array {
  if (!images.length || images.length > 8 || images.some(i => !Number.isInteger(i.size) || i.size < 1 || i.size > 256)) throw new Error('Invalid icon sizes');
  const header = 6 + images.length * 16;
  const output = new Uint8Array(header + images.reduce((sum, i) => sum + i.bytes.length, 0));
  const view = new DataView(output.buffer);
  view.setUint16(2, 1, true); view.setUint16(4, images.length, true);
  let offset = header;
  images.forEach((image, index) => {
    const at = 6 + index * 16;
    output[at] = output[at + 1] = image.size === 256 ? 0 : image.size;
    view.setUint16(at + 4, 1, true); view.setUint16(at + 6, 32, true);
    view.setUint32(at + 8, image.bytes.length, true); view.setUint32(at + 12, offset, true);
    output.set(image.bytes, offset); offset += image.bytes.length;
  });
  return output;
}
