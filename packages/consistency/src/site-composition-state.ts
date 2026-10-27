import { DocumentState } from './document-state';
/** A site's composition is its own revisioned document; pointer previews never enter this history. */
export type SiteDesign = { tone?: string; variant?: 'filled' | 'outlined'; color?: string; appearance?: 'plain' | 'primary' | 'secondary'; action?: { kind: 'link' | 'page'; target: string } | null; gaps?: Record<string, number> };
export type SiteNodeStyle = { design?: SiteDesign; gap?: number; padding?: number; width?: number; height?: number; marginTop?: number; marginBottom?: number; hidden?: boolean };
export type SiteNodeProperty = 'gap' | 'padding' | 'width' | 'height' | 'marginTop' | 'marginBottom';
export interface SiteInsertion { id: string; parent: string; before?: string; kind: 'text' | 'heading' | 'image' | 'link' | 'button' | 'region'; text?: string; source?: string; gaps?: Record<string, number>; href?: string; src?: string; alt?: string }
export interface SiteCompositionDocument { schema: 1; nodes: Record<string, SiteNodeStyle>; order: Record<string, string[]>; insertions?: SiteInsertion[]; groups?: Array<{id: string; kind: 'flow' | 'columns' | 'column'}>; pageTone?: string }
/** Logical measures stay on whole squares even when CSS scaling leaves fractional physical bounds. */
export function siteMeasureRange(property: SiteNodeProperty, available: number, width: number): [number, number] {
  if (property === 'gap' || property === 'marginTop' || property === 'marginBottom') return [0, 2000];
  if (property === 'height') return [80, 2000];
  const finite = (value: number, fallback: number) => Number.isFinite(value) && value > 0 ? value : fallback;
  if (property === 'width') { const maximum = Math.max(1, Math.floor(Math.min(10000, finite(available, 200)) / 20) * 20); return [Math.min(200, maximum), maximum]; }
  return [0, Math.max(0, Math.min(2000, Math.floor((finite(width, 200) - 200) / 40) * 20))];
}
export function siteMeasureValue(value: number, range: [number, number]): number | null {
  return Number.isFinite(value) ? Math.max(range[0], Math.min(range[1], Math.round(value / 20) * 20)) : null;
}

export interface SiteCompositionNode { id: string; tag: string; kind?: 'root' | 'container' | 'text' | 'image' | 'card' | 'stat' | 'button' | 'carousel' | 'group' | 'columns' | 'column' | 'region'; protected?: boolean; parent: string | null; children: string[]; label: string; capabilities: Array<SiteNodeProperty | 'hide' | 'reorder' | 'insert' | 'place' | 'design'> }
export interface SiteCompositionSnapshot { path: string; build: string; base: string; revision: number; document: SiteCompositionDocument; nodes: SiteCompositionNode[]; images?: string[]; stale?: boolean }
export type CompositionSave = (value: { build: string; base: string; revision: number; document: SiteCompositionDocument }) => Promise<SiteCompositionSnapshot>;
/** Source-page geometry operations over the shared revisioned document history. */
export class SiteCompositionState extends DocumentState<SiteCompositionDocument, SiteCompositionSnapshot> {
  patch(id: string, patch: SiteNodeStyle) { this.commit({ ...this.document, nodes: { ...this.document.nodes, [id]: { ...this.document.nodes[id], ...patch } } }); }
}
