import type { Composition } from './model';
export interface CardDesign { tone?: string; variant?: 'filled' | 'outlined'; width?: number; height?: number; gaps?: Record<string, number> }
const staticIds = ['bookshop', 'kitchen', 'contact-note'];
const fields = ['tone', 'variant', 'width', 'height'] as const;
const fence = /```c9y-card\r?\n([^]*?)\r?\n```/g;
type Card = CardDesign & { label: string; title: string; body: string };
function cards(source: string): Card[] {
 const found: Card[] = [];
 for (const match of source.matchAll(fence)) { try { const card = JSON.parse(match[1]); if (card && typeof card.label === 'string' && typeof card.title === 'string' && typeof card.body === 'string') found.push(card); } catch {} }
 return found;
}
function signature(card: Card) { return JSON.stringify([card.label, card.title, card.body]); }
function diff(previous: CardDesign, next: CardDesign, change: CardDesign) {
 for (const field of fields) if (next[field] !== previous[field] && next[field] !== undefined) Object.assign(change, { [field]: next[field] });
 for (const [key, value] of Object.entries(next.gaps ?? {})) if (previous.gaps?.[key] !== value) change.gaps = { ...change.gaps, [key]: value };
}
function merge<T extends CardDesign>(card: T, design: CardDesign): T { return { ...card, ...design, ...(design.gaps ? { gaps: { ...card.gaps, ...design.gaps } } : {}) }; }
/** Fan out design before history records the transaction; words never participate. */
export function linkCardDesign(previous: Composition, next: Composition): Composition {
 if (!next.consistency || previous.consistency !== next.consistency) return next;
 const change: CardDesign = {};
 for (const id of staticIds) {
  diff(previous.cardDesigns[id] ?? {}, next.cardDesigns[id] ?? {}, change);
  diff(previous.sizes[id] ?? {}, next.sizes[id] ?? {}, change);
  diff({ gaps: previous.cardGaps[id] }, { gaps: next.cardGaps[id] }, change);
 }
 const sources = (doc: Composition) => [doc.text, ...Object.values(doc.sections)];
 const oldCards = sources(previous).flatMap(cards), newCards = sources(next).flatMap(cards);
 const used = new Set<number>(), added: boolean[] = [];
 newCards.forEach((card, index) => {
  let match = oldCards[index] && !used.has(index) && signature(oldCards[index]) === signature(card) ? index : oldCards.findIndex((candidate, candidateIndex) => !used.has(candidateIndex) && signature(candidate) === signature(card));
  if (match < 0 && oldCards.length === newCards.length && !used.has(index)) match = index;
  const old = match >= 0 ? oldCards[match] : undefined;
  if (old) { used.add(match); diff(old, card, change); }
  added.push(!old);
 });
 const changed = Object.keys(change).length > 0;
 const design = changed ? merge(next.linkedCardDesign ?? {}, change) : next.linkedCardDesign;
 if (!design) return next;
 const cardDesigns = { ...next.cardDesigns }, sizes = { ...next.sizes }, cardGaps = { ...next.cardGaps };
 if (changed) for (const id of staticIds) {
  cardDesigns[id] = merge(cardDesigns[id] ?? {}, change);
  if (change.width !== undefined || change.height !== undefined) sizes[id] = { width: sizes[id]?.width ?? 280, height: sizes[id]?.height ?? (id === 'contact-note' ? 160 : 280), ...(change.width !== undefined ? { width: change.width } : {}), ...(change.height !== undefined ? { height: change.height } : {}) };
  if (change.gaps) cardGaps[id] = { ...cardGaps[id], ...change.gaps };
 }
 let rewrittenIndex = 0;
 const rewrite = (source: string) => source.replace(fence, (whole, json: string) => {
  try {
   const card = JSON.parse(json) as Card; if (!card || typeof card.label !== 'string' || typeof card.title !== 'string' || typeof card.body !== 'string') return whole;
   const isNew = added[rewrittenIndex++];
   const patch = changed ? change : isNew ? design : undefined;
   if (!patch) return whole;
   const updated = merge(card, patch); if (JSON.stringify(card) === JSON.stringify(updated)) return whole;
   return '```c9y-card\n' + JSON.stringify(updated).replaceAll('`', '\\u0060') + '\n```';
  } catch { return whole; }
 });
 return { ...next, cardDesigns, sizes, cardGaps, linkedCardDesign: design, text: rewrite(next.text), sections: Object.fromEntries(Object.entries(next.sections).map(([key, source]) => [key, rewrite(source)])) };
}
