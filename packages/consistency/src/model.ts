export type Dimension = 'width' | 'padding' | 'gap';
export interface Composition { width: number; padding: number; gap: number; wrap: boolean; text: string; sections: Record<string, string>; gaps: Record<string, number>; order: string[]; hidden: string[] }
export const initialComposition: Composition = { width: 640, padding: 40, gap: 40, wrap: true,
  hidden: [],
  order: ['intro', 'work', 'approach', 'contact'],
  gaps: { 'intro-actions': 40, 'intro-work': 40, 'work-cards': 40, 'work-approach': 40, 'approach-stats': 40, 'approach-contact': 40, 'contact-card': 40, 'contact-action': 40, 'projects-columns': 20, 'stats-columns': 40, 'actions-columns': 20 },
  sections: {
    work: '## Things taking shape\n\nSmall ideas become places people can spend time in. These are two of the projects on our table.',
    approach: '## From a first thought to something real\n\nWe start with a conversation and a page of questions. Then we write, sketch and build until the pieces belong together.\n\n### Find the point\nWhat should this help someone do? We keep that question close.\n\n### Make it tangible\nA working version gives us something to react to, change and try again.\n\n### Keep making it better\nThe useful details tend to appear once people begin using it.',
    contact: '## Have something in mind?\n\nA rough idea is enough to begin. Tell us what you are thinking about, who it is for and what you would like to change.\n\nThere is always room for a good conversation.',
  },
  text: '# A place for what comes next\n\nBring the words, the shape and the space between them together. A small studio for things worth making.\n\nMake room for a new idea.' };
export const limits: Record<Dimension, [number, number]> = { width: [280, 960], padding: [0, 80], gap: [0, 2000] };
export function dimensionValue(key: Dimension, value: number): number {
  const [min, max] = limits[key];
  return Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value / 20) * 20)) : initialComposition[key];
}
/** Document history stays separate from the transient drag preview. */
export class CompositionHistory {
  value: Composition;
  private past: Composition[] = [];
  private future: Composition[] = [];
  constructor(value = initialComposition) { this.value = { ...value }; }
  get canUndo() { return this.past.length > 0; }
  get canRedo() { return this.future.length > 0; }
  commit(patch: Partial<Composition>) {
    const next = { ...this.value, ...patch };
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
