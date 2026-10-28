import type { SortableMovement } from './vendor/drag/sortable';
import type { SiteCompositionNode } from './site-composition-state';

// C9Y constraints: every rule the Consistency editor keeps, each a sentence and the test that holds
// it, and the rules of every block it edits. C9Y-constraints.md is written from this file by
// `vp run c9y-constraints`; src/c9y-constraints.test.ts fails while a rule has no test, a block
// kind no rules, or the document an old list.
//
// A new rule: add it here, make the editor keep it, write its test under the name given in `check`,
// then run `vp run c9y-constraints`. A new block kind: add its row to BLOCKS.

export type C9yConstraint = {
  /** `<area>.<what>`, lower case, never changed once given. */
  code: string;
  /** The rule, one sentence. */
  rule: string;
  /** Why it holds, when the rule alone does not say. */
  why?: string;
  /** The test that holds it: a file in this package and the name it is given there. */
  check: { file: string; test: string };
};

export const C9Y_CONSTRAINTS: C9yConstraint[] = [
  {
    code: 'native.workspace',
    rule: 'New lab pages and blank site drafts use the published page model and editor; spacing survives saving and reopening, and a refused save retains the local document for recovery.',
    check: {file: 'tests/workspace-native.mjs', test: 'Shared workspace editor: native blocks'},
  },
  {
    code: 'spacing.hit-area',
    rule: 'Resize labels never intercept a neighbouring spacing handle; pointer and keyboard spacing changes persist after reopening.',
    check: { file: 'tests/soendergaarden-spacing.mjs', test: 'Søndergården front: publication retry' },
  },
  {
    code: 'native.gutters',
    rule: 'Native gallery guides cover only the real whitespace between overlapping tracks or complete rows, including after scrolling; they never cross product content.',
    check: { file: 'src/native-page-model.test.ts', test: 'maps two featured and three ordinary gallery items to actual whitespace' },
  },
  {
    code: 'native.publication',
    rule: 'A native page edits the same typed blocks and responsive measures that publication renders, with each block owning its mobile defaults and every saved gesture surviving reopening.',
    check: { file: 'tests/native-page.mjs', test: 'Native page: real model/scroll/public geometry' },
  },
  {
    code: 'native.sections',
    rule: 'A section of the vocabulary is one block: selected, moved, hidden, removed and resized whole; its fields are set from its menu inside the vocabulary\'s ranges, its words edited in place in their slots, and its items reordered and removed inside it, never below the kind\'s minimum.',
    why: 'The renderer expands a section to primitives, so the editor reads the same expansion and never guesses a layout from the HTML; the vocabulary is the one record of what a field may be.',
    check: { file: 'src/native-page-model.test.ts', test: 'edits a section as one block: slots, items and ranges from the vocabulary' },
  },
  {
    code: 'drag.one-movement',
    rule: 'While a block is carried, the blocks around it move out of the way once for each change of place, straight to where the dropped order will draw them, and nothing moves again on release.',
    why: 'Someone dragging is rearranging the layout; a page that lands and then corrects itself has guessed wrong in front of them. Drag measures each list\'s flow at lift (sizes, margins, gap, collapsing margins) so the room it makes is the layout the drop commits.',
    check: { file: 'src/c9y-constraints.test.ts', test: 'siblings move once, straight to the committed layout, for every move in a list' },
  },
  {
    code: 'drag.only-while-carried',
    rule: 'Blocks move out of the way only while a block is carried: never before it lifts, and never after the drop has settled.',
    check: { file: 'src/c9y-constraints.test.ts', test: 'the ledger reports any movement after release as a broken constraint' },
  },
  {
    code: 'drag.change-of-place',
    rule: 'A block makes room once the carried block\'s edge passes its centre, and gives it back only when the edge passes back, so a pointer resting near a centre never makes blocks flicker.',
    check: { file: 'src/c9y-constraints.test.ts', test: 'a sibling makes room past its centre and does not flicker back' },
  },
  {
    code: 'drag.single-landing',
    rule: 'A dropped block lands once, directly at its committed place, within a pixel; the editor commits the final layout before the carried block lands.',
    check: { file: 'tests/reorder.mjs', test: 'Single landing' },
  },
  {
    code: 'drag.grid',
    rule: 'Where blocks and the spaces between them are whole squares, every move out of the way is a whole number of squares.',
    why: 'Design system 1 draws everything on the 20px square multiplied by --sf; a block that makes room never leaves the grid, even for a frame.',
    check: { file: 'src/c9y-constraints.test.ts', test: 'room made on the grid is whole squares' },
  },
  {
    code: 'spacing.whole-squares',
    rule: 'Every space, padding, width and height the editor writes is a whole number of 20px squares, with widths of at least ten squares and heights of at least four.',
    check: { file: 'src/c9y-constraints.test.ts', test: 'measures the editor writes stay on whole squares' },
  },
  {
    code: 'spacing.owned-by-block',
    rule: 'The space above or below a block belongs to that block and travels with it when it moves, never to the position it stands in.',
    why: 'Space that depends on position (the last block losing its gap) changes the layout after the drop, which breaks drag.one-movement.',
    check: { file: 'src/c9y-constraints.test.ts', test: 'a block carries its own space when it moves' },
  },
  {
    code: 'blocks.capabilities',
    rule: 'Each kind of block offers exactly the handles its row in the block table gives it; the editor never draws a handle the platform would refuse.',
    check: { file: 'src/c9y-constraints.test.ts', test: 'every block kind has its rules and capabilities' },
  },
  {
    code: 'blocks.reorder',
    rule: 'A block can be moved among its siblings only when it can be placed and has at least one sibling.',
    check: { file: 'src/c9y-constraints.test.ts', test: 'a block reorders only among siblings' },
  },
  {
    code: 'blocks.protected',
    rule: 'A protected region and the page root can be measured but never hidden, placed or moved.',
    check: { file: 'src/c9y-constraints.test.ts', test: 'protected regions and the root never move' },
  },
  {
    code: 'motion.transform-only',
    rule: 'Dragging animates translate, transform and opacity only, never a property that changes layout.',
    check: { file: 'src/c9y-constraints.test.ts', test: 'drag motion animates translate, transform and opacity only' },
  },
  {
    code: 'motion.reduced',
    rule: 'With reduced motion, a release applies the final layout at once, with the same geometry and no animation.',
    check: { file: 'src/settle.test.ts', test: 'release uses translation only and reduced motion applies layout immediately' },
  },
];

export type BlockKind = NonNullable<SiteCompositionNode['kind']>;
export type Capability = SiteCompositionNode['capabilities'][number];

/**
 * The capabilities the platform gives a block (Consistency/platform/worker/site-composition.ts,
 * `capabilities`). `reorder` is added by blockReorders, from its siblings.
 */
export function blockCapabilities(kind: BlockKind, protectedRegion = false): Capability[] {
  const caps: Capability[] = ['width'];
  if (kind !== 'root') caps.push('marginTop', 'marginBottom');
  if (!protectedRegion && kind !== 'root') caps.push('hide', 'place');
  if (['root', 'container', 'group', 'columns', 'column'].includes(kind)) caps.push('padding', 'gap', 'insert');
  if (kind === 'region') caps.push('padding');
  if (['card', 'carousel'].includes(kind)) caps.push('height');
  if (['card', 'stat', 'button'].includes(kind)) caps.push('design');
  return caps;
}

/** blocks.reorder: a placeable block, or one the platform said reorders, with a sibling to move among. */
export function blockReorders(capabilities: readonly string[], siblings: number, wasReorderable = false): boolean {
  return siblings > 1 && (capabilities.includes('place') || wasReorderable);
}

export type BlockRule = {
  /** What it is, in a sentence. */
  is: string;
  /** How its children lie, and so which way they make room: down the page, or side by side. */
  axis: 'vertical' | 'horizontal' | null;
  /** Its own rules, beyond its capabilities. */
  rules: string[];
};

export const BLOCKS: Record<BlockKind, BlockRule> = {
  root: { is: 'The page itself.', axis: 'vertical', rules: ['Never hidden, placed or moved; its width, padding and gap are the page\'s.', 'New blocks can be inserted into it.'] },
  container: { is: 'A section of the site\'s own markup that holds blocks.', axis: 'vertical', rules: ['Its children make room down the page.', 'Its padding and gap are whole squares; blocks can be inserted into it.'] },
  group: { is: 'A flow of blocks the editor made by grouping.', axis: 'vertical', rules: ['Behaves as a container: its children make room down the page, and blocks can be inserted into it.'] },
  columns: { is: 'Blocks placed side by side.', axis: 'horizontal', rules: ['Its columns make room across, not down.', 'Placing a block beside another makes a columns block; its gap is the space between columns.'] },
  column: { is: 'One column of a columns block.', axis: 'vertical', rules: ['A column with a single block moves with that block when the block is carried out.'] },
  text: { is: 'Words: a paragraph, heading or link drawn by Aa.', axis: null, rules: ['Its words are edited in place; a press on its words drags it only once it is selected.', 'Its spacing above and below belongs to it.'] },
  image: { is: 'A picture.', axis: null, rules: ['Its width is whole squares; its height follows its picture.', 'A selected image draws its selection over the picture, not around the frame.'] },
  card: { is: 'A DS1 card.', axis: null, rules: ['Width and height are whole squares, never below its minimum.', 'Its tone and outline are design; its words stay its own when designs are shared.'] },
  stat: { is: 'A DS1 figure with its label and caption.', axis: null, rules: ['Its inner gaps are whole squares.', 'Its design can be shared; its words cannot.'] },
  button: { is: 'A DS1 button or link styled as one.', axis: null, rules: ['Its action is a link or a page of the site.', 'Its appearance is plain, primary or secondary.'] },
  carousel: { is: 'A row of slides that scrolls sideways.', axis: null, rules: ['The carousel moves as one block; its slides scroll in its own frame and never widen the page.', 'Its height is whole squares.'] },
  region: { is: 'Native content the site renders: a menu, a form, a booking.', axis: null, rules: ['Its contents belong to the site; only its width, padding and spacing are edited.', 'Protected regions are never hidden or moved.'] },
};

export type C9yFinding = { code: string; message: string; elements: HTMLElement[] };

/**
 * Watches the drag engine's movements and reports drag.one-movement and drag.only-while-carried as
 * they break: any sibling moving after release. Hand `record` to the engine's `onMovement`.
 */
export class MovementLedger {
  readonly movements: SortableMovement[] = [];
  private pending: SortableMovement[] = [];
  private scheduled = false;
  constructor(private readonly broken: (finding: C9yFinding) => void) {}
  record = (movement: SortableMovement) => {
    this.movements.push(movement);
    if (movement.phase !== 'drop') return;
    this.pending.push(movement);
    if (this.scheduled) return;
    this.scheduled = true;
    queueMicrotask(() => this.flush());
  };
  flush() {
    this.scheduled = false;
    if (!this.pending.length) return;
    const moved = this.pending; this.pending = [];
    const farthest = Math.max(...moved.map(({ x, y }) => Math.round(Math.hypot(x, y))));
    this.broken({
      code: 'drag.one-movement',
      message: `${moved.length === 1 ? 'A block' : `${moved.length} blocks`} moved again after release, up to ${farthest}px.`,
      elements: [...new Set(moved.map(({ element }) => element))],
    });
  }
}

/** The constraints as a document: C9Y-constraints.md. */
export function constraintsDocument(): string {
  const lines = [
    '# C9Y constraints',
    '',
    'The rules the Consistency editor keeps, written from `src/c9y-constraints.ts` by `vp run c9y-constraints`. Do not edit this file by hand.',
    '',
    'Each rule names the test that holds it. While editing a site, a drag that breaks `drag.one-movement` outlines the blocks that moved again and says so in the editor\'s notice.',
    '',
    '## Rules',
    '',
    ...C9Y_CONSTRAINTS.flatMap(({ code, rule, why, check }) => [
      `### \`${code}\``, '', rule, ...(why ? ['', why] : []), '', `Held by \`${check.file}\`: “${check.test}”.`, '',
    ]),
    '## Blocks',
    '',
    'Capabilities come from the platform; `reorder` is added where `blocks.reorder` allows it. Measures are whole 20px squares multiplied by `--sf`.',
    '',
    ...(Object.entries(BLOCKS) as [BlockKind, BlockRule][]).flatMap(([kind, block]) => [
      `### ${kind}`, '', block.is, '',
      `- Capabilities: ${blockCapabilities(kind).map(cap => `\`${cap}\``).join(', ')}`,
      `- Children make room: ${block.axis === 'horizontal' ? 'across' : block.axis === 'vertical' ? 'down the page' : 'it holds no blocks'}`,
      ...block.rules.map(rule => `- ${rule}`), '',
    ]),
  ];
  return lines.join('\n').replace(/\n+$/, '\n');
}
