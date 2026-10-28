import { expandNativeSection, isNativeSection, type NativeBlock, type NativePageDocument, type NativeSection } from '../../../shared/consistency-native-page';
import type { FieldDefinition, KindDefinition, SlotDefinition } from '../../../shared/consistency-vocabulary';
import vocabulary from '../../../shared/generated/vocabulary.json';

export interface NativeEntry { block: NativeBlock; parent: string; index: number }
/** The page's blocks by id, a section counted once: its slots and items are the section's, not blocks of the page. */
export function nativeEntries(document: NativePageDocument): Map<string, NativeEntry> {
  const entries = new Map<string, NativeEntry>();
  const visit = (blocks: NativeBlock[], parent: string) => blocks.forEach((block,index) => { if(block.kind==='text'&&block.editable===false)return; entries.set(block.id,{block,parent,index}); if ('children' in block) visit(block.children,block.id); });
  visit(document.blocks,'page'); return entries;
}
export function updateNativeBlock(document: NativePageDocument, id: string, update: (block: NativeBlock) => NativeBlock): NativePageDocument {
  const visit = (blocks: NativeBlock[]): NativeBlock[] => blocks.map(block => block.id === id ? update(block) : 'children' in block ? {...block,children:visit(block.children)} : block);
  return {...document,blocks:visit(document.blocks)};
}
export function updateNativeChildren(document: NativePageDocument, id: string, update: (children: NativeBlock[]) => NativeBlock[]): NativePageDocument {
  if (id === 'page') return {...document,blocks:update(document.blocks)};
  return updateNativeBlock(document,id,block => 'children' in block ? {...block,children:update(block.children)} : block);
}

/*
 * The vocabulary, as `shared/generated/vocabulary.json` records it: every kind's fields with their
 * ranges and defaults, its slots and its examples. The editor reads ranges, defaults, choices and
 * examples from here alone; it keeps no table of its own.
 */
const VOCABULARY = vocabulary as unknown as { tones: readonly string[]; kinds: KindDefinition[] };
export const TONE_NAMES: readonly string[] = VOCABULARY.tones;
export const sectionKinds = (): KindDefinition[] => VOCABULARY.kinds.filter(kind => kind.layer === 'section');
export const kindDefinition = (kind: string): KindDefinition | undefined => VOCABULARY.kinds.find(definition => definition.kind === kind);
export const sectionField = (kind: string, name: string): FieldDefinition | undefined => kindDefinition(kind)?.fields[name];
/** A section field's current value, or the vocabulary's default. */
export function sectionValue<T = unknown>(block: NativeSection, name: string): T {
  const value = (block as unknown as Record<string, unknown>)[name];
  return (value === undefined ? sectionField(block.kind, name)?.default : value) as T;
}
/** A measure in squares kept on the square and inside the kind's range (and on its step). */
export function clampSectionMeasure(kind: string, name: string, squares: number): number {
  const field = sectionField(kind, name); if (!field) return Math.round(squares);
  const min = field.min ?? 0, max = field.max ?? 2000, step = field.step ?? 1;
  const stepped = min + Math.round((squares - min) / step) * step;
  return Math.max(min, Math.min(max, stepped));
}
/** The fields a section's spacing handles stand on: gaps and widths in squares between its items. */
export const SPACING_FIELDS: Readonly<Record<string, string>> = { panels: 'gap', footer: 'columnWidth' };
/** The field a section's height edge resizes, in squares, and the element it stands on: the section, or each item. */
export const HEIGHT_FIELDS: Readonly<Record<string, { field: string; on: 'section' | 'items' | 'picture' }>> = {
  hero: { field: 'height', on: 'section' }, split: { field: 'imageHeight', on: 'picture' }, cards: { field: 'height', on: 'items' }, gallery: { field: 'height', on: 'items' }, bento: { field: 'height', on: 'items' },
};

/** The slot that holds a section's items: records, heroes or pictures, reordered and removed inside the section. */
export function itemsSlot(kind: string): { name: string; definition: SlotDefinition } | undefined {
  const definition = kindDefinition(kind); if (!definition) return undefined;
  const entry = Object.entries(definition.slots).find(([, slot]) => ['items', 'heroes', 'pictures'].includes(slot.type));
  return entry ? { name: entry[0], definition: entry[1] } : undefined;
}
const ITEM_LABELS: Readonly<Record<string, string>> = { cards: 'Card', bento: 'Tile', questions: 'Question', facts: 'Fact', list: 'Row', panels: 'Panel', footer: 'Column', gallery: 'Picture' };
export const itemLabel = (kind: string) => ITEM_LABELS[kind] ?? 'Item';
export const sectionLabel = (kind: string) => kind.charAt(0).toUpperCase() + kind.slice(1);
const items = (block: NativeSection): unknown[] | undefined => { const slot = itemsSlot(block.kind); const value = slot && (block as unknown as Record<string, unknown>)[slot.name]; return Array.isArray(value) ? value : undefined; };
/** The ids the renderer gives a section's items: a hero's own id in panels, `<id>.<slot>.<index>` elsewhere. */
export function sectionItemIds(block: NativeSection): string[] {
  const slot = itemsSlot(block.kind), list = items(block); if (!slot || !list) return [];
  return list.map((item, index) => slot.definition.type === 'heroes' ? (item as NativeBlock).id : `${block.id}.${slot.name}.${index}`);
}
export const sectionItemCount = (block: NativeSection) => items(block)?.length ?? 0;
export function moveSectionItem(document: NativePageDocument, id: string, from: number, to: number): NativePageDocument {
  return updateNativeBlock(document, id, block => {
    const slot = itemsSlot(block.kind), list = isNativeSection(block) ? items(block) : undefined; if (!slot || !list || from === to) return block;
    const next = [...list], [item] = next.splice(from, 1); next.splice(Math.max(0, Math.min(to, next.length)), 0, item);
    return { ...block, [slot.name]: next } as NativeBlock;
  });
}
/** Removes an item unless the kind's minimum forbids it; the document is unchanged then. */
export function removeSectionItem(document: NativePageDocument, id: string, index: number): NativePageDocument {
  return updateNativeBlock(document, id, block => {
    const slot = itemsSlot(block.kind), list = isNativeSection(block) ? items(block) : undefined; if (!slot || !list || list.length <= (slot.definition.min ?? 0)) return block;
    return { ...block, [slot.name]: list.filter((_, at) => at !== index) } as NativeBlock;
  });
}
/** Adds an item from the kind's first example, its words placeholders and its pictures the site's, unless the kind's maximum forbids it. */
export function addSectionItem(document: NativePageDocument, id: string, images: readonly string[], newId: () => string): NativePageDocument {
  return updateNativeBlock(document, id, block => {
    const slot = itemsSlot(block.kind), list = isNativeSection(block) ? items(block) : undefined, definition = kindDefinition(block.kind);
    if (!slot || !list || !definition || list.length >= (slot.definition.max ?? 100)) return block;
    const example = (definition.examples[0] as unknown as Record<string, unknown>)[slot.name] as unknown[];
    const item = slot.definition.type === 'heroes' ? freshSection(example[0] as NativeSection, images, newId) : slot.definition.type === 'pictures' ? freshPicture(example[0], images) : freshMembers(example[0] as Record<string, unknown>, slot.definition.item ?? {}, images, newId);
    return { ...block, [slot.name]: [...list, item] } as NativeBlock;
  });
}

/*
 * A new section is the kind's first example with fresh ids, its words emptied to short placeholders,
 * its pictures the site's own, and the slots the site may not have (runtimes, languages, collections)
 * left out, so what is inserted is valid on the page it lands in.
 */
const PLACEHOLDERS: Readonly<Record<string, string>> = { title: 'Title', text: 'Text', kicker: 'Kicker', heading: 'Heading', label: 'Label', line: 'Line', legal: 'Legal line', tagline: 'Tagline', answer: 'Answer', term: 'Term', value: 'Value', question: 'Question', name: 'Name' };
const ACTION_WORDS: Readonly<Record<string, string>> = { links: 'Link', policies: 'Policy', follow: 'Follow', lines: 'Line' };
export const placeholderWords = (slot: string) => PLACEHOLDERS[slot] ?? slot.charAt(0).toUpperCase() + slot.slice(1);
/** The picture a new section shows on a site that has no images yet, from Design system 1's own examples. */
export const PLACEHOLDER_PICTURE = 'https://designsystem1.com/examples/images/atelier-hero.jpg';
const freshPicture = (value: unknown, images: readonly string[]) => { const picture = value as { src: string; alt: string; fit?: string; href?: string }; return { ...picture, src: images[0] ?? PLACEHOLDER_PICTURE, alt: '' }; };
const freshAction = (value: unknown, slot: string) => ({ ...(value as { href: string }), text: ACTION_WORDS[slot] ?? 'Button' });
function freshMembers(value: Record<string, unknown>, members: Record<string, FieldDefinition | SlotDefinition>, images: readonly string[], newId: () => string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [name, definition] of Object.entries(members)) {
    const item = value[name]; if (item === undefined) continue;
    const fresh = freshMember(item, definition, images, newId, name); if (fresh !== undefined) result[name] = fresh;
  }
  return result;
}
function freshMember(value: unknown, definition: FieldDefinition | SlotDefinition, images: readonly string[], newId: () => string, name: string): unknown {
  switch (definition.type) {
    case 'words': return placeholderWords(name);
    case 'text': return placeholderWords(name);
    case 'picture': return freshPicture(value, images);
    case 'pictures': return (value as unknown[]).map(item => freshPicture(item, images));
    case 'action': return freshAction(value, name);
    case 'actions': return (value as unknown[]).map(item => freshAction(item, name));
    case 'links': return (value as unknown[]).map(item => freshAction(item, 'lines'));
    case 'items': return (value as Record<string, unknown>[]).map(item => freshMembers(item, (definition as SlotDefinition).item ?? {}, images, newId));
    case 'heroes': return (value as NativeSection[]).map(item => freshSection(item, images, newId));
    case 'languages': case 'runtime': case 'collection': return undefined;
    default: return value;
  }
}
export function freshSection(example: NativeSection, images: readonly string[], newId: () => string): NativeSection {
  const definition = kindDefinition(example.kind)!, source = example as unknown as Record<string, unknown>, result: Record<string, unknown> = { id: newId(), kind: example.kind };
  for (const name of ['width', 'hidden', 'locale']) if (source[name] !== undefined) result[name] = source[name];
  for (const name of Object.keys(definition.fields)) if (source[name] !== undefined) result[name] = source[name];
  for (const [name, slot] of Object.entries(definition.slots)) { if (source[name] === undefined) continue; const value = freshMember(source[name], slot, images, newId, name); if (value !== undefined) result[name] = value; }
  if (definition.oneOf && !definition.oneOf.some(name => result[name] !== undefined)) result[definition.oneOf[0]!] = [];
  return result as unknown as NativeSection;
}
/** A new section of this kind for a page with these images. */
export function newSection(kind: string, images: readonly string[], newId: () => string): NativeSection | undefined {
  const definition = kindDefinition(kind); if (!definition || definition.layer !== 'section') return undefined;
  return freshSection(structuredClone(definition.examples[0]) as NativeSection, images, newId);
}
/** The first words slot of a section as drawn: the content block the caret goes to after inserting it. */
export function firstWordsId(block: NativeSection): string | undefined {
  const find = (blocks: NativeBlock[]): string | undefined => { for (const child of blocks) { if (child.kind === 'content') return child.id; const inner = 'children' in child ? find(child.children) : isNativeSection(child) ? find(expandNativeSection(child).children) : undefined; if (inner) return inner; } return undefined; };
  return find(expandNativeSection(block).children);
}

/*
 * A derived id names a place in its section: `<id>.<slot>`, `<id>.<slot>.<index>` or
 * `<id>.<items>.<index>.<member>`, as the renderer marks it; the footer's mark stands for its brand.
 */
const ALIASES: Readonly<Record<string, string>> = { mark: 'brand' };
export function sectionPath(sectionId: string, derivedId: string): string[] | undefined {
  if (!derivedId.startsWith(`${sectionId}.`)) return undefined;
  const parts = derivedId.slice(sectionId.length + 1).split('.');
  return parts.map((part, index) => index === 0 ? ALIASES[part] ?? part : part);
}
export function readAt(block: NativeSection, path: readonly string[]): unknown {
  let value: unknown = block;
  for (const part of path) { if (value === null || typeof value !== 'object') return undefined; value = (value as Record<string, unknown>)[/^\d+$/.test(part) ? Number(part) : part]; }
  return value;
}
/** The words at a path, or none: a slot that is not words reads as empty. */
export const wordsAt = (block: NativeSection, path: readonly string[]): string => { const value = readAt(block, path); return typeof value === 'string' ? value : ''; };
export function writeAt(block: NativeSection, path: readonly string[], value: unknown): NativeSection {
  const set = (target: unknown, at: number): unknown => {
    if (at === path.length) return value;
    const part = path[at]!, index = /^\d+$/.test(part) ? Number(part) : part;
    if (Array.isArray(target)) { const next = [...target]; next[index as number] = set(target[index as number], at + 1); return next; }
    const record = (target ?? {}) as Record<string, unknown>; return { ...record, [index]: set(record[index as string], at + 1) };
  };
  return set(block, 0) as NativeSection;
}
/** The member a derived path reaches in the vocabulary: its own definition, or the slot that holds it. */
export function memberAt(kind: string, path: readonly string[]): FieldDefinition | SlotDefinition | undefined {
  const definition = kindDefinition(kind); if (!definition) return undefined;
  let member: FieldDefinition | SlotDefinition | undefined = definition.slots[path[0]!] ?? definition.fields[path[0]!];
  for (let at = 1; at < path.length && member; at++) {
    const part = path[at]!;
    if (/^\d+$/.test(part)) continue;
    member = 'item' in member && member.item ? member.item[part] : undefined;
  }
  return member;
}

export interface SpaceBox {left:number;top:number;width:number;height:number}
interface Box extends SpaceBox {right:number;bottom:number}
/** Track rows from rendered native grid items. Only intersecting tracks form a gutter. */
export function nativeGridSpaces(boxes: readonly Box[]): Array<{axis:'horizontal'|'vertical';box:SpaceBox}> {
  const rows: Box[][] = [];
  for (const box of [...boxes].filter(box=>box.width>0&&box.height>0).sort((a,b)=>a.top-b.top||a.left-b.left)) {
    const row=rows.find(row=>Math.abs(row[0].top-box.top)<1); if(row)row.push(box);else rows.push([box]);
  }
  const spaces:Array<{axis:'horizontal'|'vertical';box:SpaceBox}>=[];
  for(const row of rows){row.sort((a,b)=>a.left-b.left);for(let index=1;index<row.length;index++){
    const a=row[index-1],b=row[index],top=Math.max(a.top,b.top),bottom=Math.min(a.bottom,b.bottom),width=b.left-a.right;
    if(width>=0&&bottom>top)spaces.push({axis:'horizontal',box:{left:a.right,top,width,height:bottom-top}});
  }}
  for(let index=1;index<rows.length;index++){
    const before=rows[index-1],after=rows[index],top=Math.max(...before.map(box=>box.bottom)),bottom=Math.min(...after.map(box=>box.top));
    const left=Math.max(Math.min(...before.map(box=>box.left)),Math.min(...after.map(box=>box.left))),right=Math.min(Math.max(...before.map(box=>box.right)),Math.max(...after.map(box=>box.right)));
    if(bottom>=top&&right>left)spaces.push({axis:'vertical',box:{left,top,width:right-left,height:bottom-top}});
  }
  return spaces;
}
