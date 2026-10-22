import type { StatDesign, ButtonDesign } from './surface-context';
import { linkCardDesign, type CardDesign } from './card-design';
export type Dimension = 'width' | 'padding' | 'gap';
export interface Composition { statDesigns: Record<string, StatDesign>; buttonDesigns: Record<string, ButtonDesign>; pageTone?: string; consistency: boolean; cardDesigns: Record<string, CardDesign>; linkedCardDesign?: CardDesign; cardGaps: Record<string, Record<string, number>>; sizes: Record<string, { width: number; height: number }>;  width: number; padding: number; gap: number; wrap: boolean; text: string; sections: Record<string, string>; gaps: Record<string, number>; order: string[]; hidden: string[] }
export const initialComposition: Composition = { statDesigns: {}, buttonDesigns: {}, linkedCardDesign: undefined, pageTone: '', consistency: true, cardDesigns: {}, cardGaps: {}, sizes: {}, width: 640, padding: 40, gap: 40, wrap: true,
  hidden: [],
  order: ['intro', 'work', 'approach', 'contact'],
  gaps: { 'intro-actions': 40, 'intro-work': 40, 'work-cards': 40, 'work-approach': 40, 'approach-stats': 40, 'approach-contact': 40, 'contact-card': 40, 'contact-action': 40, 'projects-columns': 20, 'stats-columns': 40, 'actions-columns': 20 },
  sections: {
    work: '## Things taking shape\n\nSmall ideas become places people can spend time in. These are two of the projects on our table.',
    approach: '## From a first thought to something real\n\nWe start with a conversation and a page of questions. Then we write, sketch and build until the pieces belong together.\n\n### Find the point\nWhat should this help someone do? We keep that question close.\n\n### Make it tangible\nA working version gives us something to react to, change and try again.\n\n### Keep making it better\nThe useful details tend to appear once people begin using it.',
    contact: '## Have something in mind?\n\nA rough idea is enough to begin. Tell us what you are thinking about, who it is for and what you would like to change.\n\nThere is always room for a good conversation.',
  },
  text: '# A place for what comes next\n\nBring the words, the shape and the space between them together. A small studio for things worth making.\n\nMake room for a new idea.' };
export const limits: Record<Dimension, [number, number]> = { width: [280, 960], padding: [20, 80], gap: [0, 2000] };
export function dimensionValue(key: Dimension, value: number): number {
  const [min, max] = limits[key];
  return Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value / 20) * 20)) : initialComposition[key];
}
/** Document history stays separate from the transient drag preview. */
export class CompositionHistory {
  value: Composition;
  private past: Composition[] = [];
  private future: Composition[] = [];
  constructor(value = initialComposition) { this.value = { ...value, ...compositionBounds(value.width, value.padding) }; }
  get canUndo() { return this.past.length > 0; }
  get canRedo() { return this.future.length > 0; }
  commit(patch: Partial<Composition>) {
    const candidate = { ...this.value, ...patch };
    candidate.sizes = Object.fromEntries(Object.entries(candidate.sizes).map(([id, size]) => [id, { width: Math.max(READABLE_CARD_MIN, size.width), height: Math.max(80, size.height) }]));
    const next = linkCardDesign(this.value, { ...candidate, ...compositionBounds(candidate.width, candidate.padding) });
    if (JSON.stringify(next) === JSON.stringify(this.value)) return;
    this.past.push(this.value); this.past = this.past.slice(-100);
    this.value = next; this.future = [];
  }
  undo() { const previous = this.past.pop(); if (previous) { this.future.push(this.value); this.value = previous; } }
  redo() { const next = this.future.pop(); if (next) { this.past.push(this.value); this.value = next; } }
}

/** A gap's centre moves half its size change; two logical units keep that
 * centre under one physical pointer unit, on either axis and at every scale. */
export function pointerGain(key: Dimension, scale: number): number {
  return (key === 'width' ? 1 : 2) / (Number.isFinite(scale) && scale > 0 ? scale : 1);
}

/** Remove selected block source ranges in one document edit. */
export function removeSourceRanges(source: string, ranges: readonly { start: number; end: number }[]): string {
  let result = source;
  for (const range of [...ranges].sort((a, b) => b.start - a.start)) result = result.slice(0, range.start) + result.slice(range.end);
  return result.replace(/^\n+|\n+$/g, '');
}

export const READABLE_TEXT_MIN = 200;
export const READABLE_CARD_MIN = 240;
/** Every website keeps one square inside its edges and a readable column. */
export function compositionBounds(width: number, padding: number, snap = true, minimumWidth = limits.width[0]) {
 const rawWidth = Number.isFinite(width) ? Math.min(limits.width[1], Math.max(280, minimumWidth, width)) : initialComposition.width;
 const safeWidth = snap ? Math.round(rawWidth / 20) * 20 : rawWidth;
 const room = Math.max(0, (safeWidth - READABLE_CARD_MIN) / 2);
 const maxPadding = snap ? Math.floor(room / 20) * 20 : room;
 const safePadding = snap ? dimensionValue('padding', padding) : Math.max(20, Math.min(80, padding));
 return { width: safeWidth, padding: Math.min(safePadding, maxPadding) };
}
export function compositionRange(key: Dimension, width: number, padding: number): [number, number] {
 if (key === 'width') return [Math.max(limits.width[0], READABLE_CARD_MIN + 2 * padding), limits.width[1]];
 if (key === 'padding') return [20, Math.min(limits.padding[1], Math.max(0, Math.floor((width - READABLE_CARD_MIN) / 40) * 20))];
 return limits.gap;
}
