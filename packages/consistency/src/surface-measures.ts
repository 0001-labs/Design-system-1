export type SurfaceMeasure='gap'|'padding'|'width'|'height'|'marginTop'|'marginBottom';
/** Logical measures stay on whole squares even when CSS scaling leaves fractional physical bounds. */
export function siteMeasureRange(property: SurfaceMeasure, available: number, width: number): [number, number] {
  if (property === 'gap' || property === 'marginTop' || property === 'marginBottom') return [0, 2000];
  if (property === 'height') return [80, 2000];
  const finite = (value: number, fallback: number) => Number.isFinite(value) && value > 0 ? value : fallback;
  if (property === 'width') { const maximum = Math.max(1, Math.floor(Math.min(10000, finite(available, 200)) / 20) * 20); return [Math.min(200, maximum), maximum]; }
  return [0, Math.max(0, Math.min(2000, Math.floor((finite(width, 200) - 200) / 40) * 20))];
}
export function siteMeasureValue(value: number, range: [number, number]): number | null {
  return Number.isFinite(value) ? Math.max(range[0], Math.min(range[1], Math.round(value / 20) * 20)) : null;
}

export interface SurfaceNode { id: string; tag: string; kind?: 'root' | 'container' | 'text' | 'image' | 'card' | 'stat' | 'button' | 'carousel' | 'group' | 'columns' | 'column' | 'region'; protected?: boolean; parent: string | null; children: string[]; label: string; capabilities: Array<SurfaceMeasure | 'hide' | 'reorder' | 'insert' | 'place' | 'design'> }
