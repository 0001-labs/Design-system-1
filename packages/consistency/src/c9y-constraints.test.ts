// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vite-plus/test';
import { BLOCKS, C9Y_CONSTRAINTS, MovementLedger, blockCapabilities, blockReorders, constraintsDocument, type BlockKind } from './c9y-constraints';
import { siteMeasureRange, siteMeasureValue } from './surface-measures';
import { createSortable, type SortableMovement } from './vendor/drag/sortable';

const read = (path: string) => readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '..', path), 'utf8');
const SQUARE = 20;

/** A block as the page lays it out: its height and the space it owns above and below. */
type Block = { height: number; above: number; below: number };

/** Block flow down the page, as a browser draws it: adjoining margins collapse into the larger. */
function layout(blocks: Block[], origin = 0): number[] {
  const tops: number[] = [];
  let edge = origin, below = 0;
  blocks.forEach((block, index) => {
    const top = edge + (index === 0 ? block.above : Math.max(below, block.above));
    tops.push(top); edge = top + block.height; below = block.below;
  });
  return tops;
}

function pointer(type: string, target: EventTarget, x: number, y: number) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(event, { pointerId: { value: 1 }, pointerType: { value: 'mouse' }, button: { value: 0 }, clientX: { value: x }, clientY: { value: y } });
  target.dispatchEvent(event);
}
const key = (target: EventTarget, name: string) => target.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true }));

/** Where layout put each element; its box is that place moved by its translate, as getBoundingClientRect draws it. */
const placed = new Map<HTMLElement, number>();
function place(element: HTMLElement, top: number, height: number) {
  placed.set(element, top);
  element.getBoundingClientRect = () => {
    const [, y = '0'] = (getComputedStyle(element).translate || '0 0').split(' ');
    const at = placed.get(element)! + (Number.parseFloat(y) || 0);
    return { left: 0, top: at, width: 400, height, right: 400, bottom: at + height, x: 0, y: at, toJSON: () => ({}) } as DOMRect;
  };
}

/** A page section of blocks, laid out, in a sortable list; the drop commits the new order and lays it out again. */
function page(blocks: Block[], movements: SortableMovement[]) {
  const list = document.createElement('section');
  list.style.display = 'block';
  place(list, 0, 2000);
  const elements = blocks.map((block, index) => {
    const element = document.createElement('div');
    element.textContent = `block ${index}`;
    element.style.marginTop = `${block.above}px`; element.style.marginBottom = `${block.below}px`;
    list.append(element);
    return element;
  });
  const draw = (order: number[]) => layout(order.map(index => blocks[index])).forEach((top, position) => place(elements[order[position]], top, blocks[order[position]].height));
  draw(blocks.map((_, index) => index));
  document.body.append(list);
  let order = blocks.map((_, index) => index);
  const sortable = createSortable({
    onMovement: movement => movements.push(movement),
    prepareDrop: result => {
      if (result.destination) {
        const moved = order.splice(result.source.index, 1)[0];
        order.splice(result.destination.index, 0, moved);
        draw(order);
      }
      return elements[Number(result.draggableId)];
    },
  });
  sortable.container({ element: list, id: 'section' });
  elements.forEach((element, index) => sortable.item({ element, id: String(index) }));
  return { sortable, elements };
}

/** Blocks of whole squares with their own space: a heading with room above, words, a card, a button. */
const SECTION: Block[] = [
  { height: 40, above: 40, below: 0 },
  { height: 60, above: 0, below: 20 },
  { height: 200, above: 20, below: 40 },
  { height: 40, above: 0, below: 0 },
  { height: 20, above: 60, below: 20 },
];

describe('drag', () => {
  let movements: SortableMovement[];
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'] });
    movements = []; placed.clear();
    HTMLElement.prototype.animate = vi.fn() as unknown as HTMLElement['animate'];
  });
  afterEach(() => { document.body.replaceChildren(); vi.useRealTimers(); });

  test('siblings move once, straight to the committed layout, for every move in a list', async () => {
    for (let source = 0; source < SECTION.length; source++) {
      for (let target = 0; target < SECTION.length; target++) {
        movements = []; placed.clear(); document.body.replaceChildren();
        const { sortable, elements } = page(SECTION, movements);
        key(elements[source], ' ');
        const steps = target - source;
        for (let step = 0; step < Math.abs(steps); step++) {
          const before = movements.length;
          key(document.body, steps > 0 ? 'ArrowDown' : 'ArrowUp');
          const moved = movements.slice(before).map(({ element }) => element);
          // One change of place: each sibling moves at most once.
          expect(new Set(moved).size, `${source}→${target}, step ${step}`).toBe(moved.length);
        }
        key(document.body, ' ');
        await vi.runAllTimersAsync();
        expect(movements.filter(({ phase }) => phase === 'drop'), `${source}→${target}`).toEqual([]);
        sortable.destroy();
      }
    }
  });

  test('a block carries its own space when it moves', async () => {
    const { sortable, elements } = page(SECTION, movements);
    // The heading, with 40px of its own above it, moves below the words: the words close up by the heading and its space.
    key(elements[0], ' ');
    key(document.body, 'ArrowDown');
    expect(elements[1].style.translate).toBe('0 -80px');
    key(document.body, ' ');
    await vi.runAllTimersAsync();
    expect(movements.filter(({ phase }) => phase === 'drop')).toEqual([]);
    sortable.destroy();
  });

  test('room made on the grid is whole squares', () => {
    const { sortable, elements } = page(SECTION, movements);
    key(elements[2], ' ');
    for (const name of ['ArrowDown', 'ArrowDown', 'ArrowUp', 'ArrowUp', 'ArrowUp', 'ArrowUp']) key(document.body, name);
    const shifts = movements.filter(({ phase }) => phase === 'drag').map(({ y }) => y);
    expect(shifts.length).toBeGreaterThan(0);
    for (const y of shifts) expect(Math.abs(y % SQUARE)).toBe(0);
    sortable.destroy();
  });

  test('a sibling makes room past its centre and does not flicker back', () => {
    const { sortable, elements } = page([{ height: 40, above: 0, below: 0 }, { height: 40, above: 0, below: 0 }, { height: 40, above: 0, below: 0 }], movements);
    pointer('pointerdown', elements[0], 10, 20);
    pointer('pointermove', window, 10, 26);
    // The carried edge (40 + moved) passes the next centre (60) once moved past 20.
    pointer('pointermove', window, 10, 39);
    expect(elements[1].style.translate || 'none').toBe('none');
    pointer('pointermove', window, 10, 42);
    expect(elements[1].style.translate).toBe('0 -40px');
    // Resting just past it, back and forth, moves nothing more.
    const settled = movements.length;
    for (const y of [41, 43, 41, 42]) pointer('pointermove', window, 10, y);
    expect(movements.length).toBe(settled);
    sortable.destroy();
  });

  test('the ledger reports any movement after release as a broken constraint', async () => {
    const broken = vi.fn();
    const ledger = new MovementLedger(broken);
    const element = document.createElement('div');
    ledger.record({ element, phase: 'drag', x: 0, y: -40 });
    await Promise.resolve();
    expect(broken).not.toHaveBeenCalled();
    ledger.record({ element, phase: 'drop', x: 0, y: 20 });
    ledger.record({ element: document.createElement('div'), phase: 'drop', x: 0, y: -6 });
    await Promise.resolve();
    expect(broken).toHaveBeenCalledTimes(1);
    expect(broken.mock.calls[0][0]).toMatchObject({ code: 'drag.one-movement', message: '2 blocks moved again after release, up to 20px.' });
  });
});

describe('blocks', () => {
  const KINDS: BlockKind[] = ['root', 'container', 'text', 'image', 'card', 'stat', 'button', 'carousel', 'group', 'columns', 'column', 'region'];

  test('every block kind has its rules and capabilities', () => {
    expect(Object.keys(BLOCKS).sort()).toEqual([...KINDS].sort());
    for (const kind of KINDS) {
      expect(BLOCKS[kind].rules.length, kind).toBeGreaterThan(0);
      expect(blockCapabilities(kind), kind).toContain('width');
    }
    // Only blocks that hold blocks take new ones, and only those lay children out along an axis.
    for (const kind of KINDS) expect(blockCapabilities(kind).includes('insert'), kind).toBe(['root', 'container', 'group', 'columns', 'column'].includes(kind));
    expect(BLOCKS.columns.axis).toBe('horizontal');
  });

  test('a block reorders only among siblings', () => {
    expect(blockReorders(['place'], 2)).toBe(true);
    expect(blockReorders(['place'], 1)).toBe(false);
    expect(blockReorders(['width'], 3)).toBe(false);
    expect(blockReorders(['width'], 3, true)).toBe(true);
  });

  test('protected regions and the root never move', () => {
    for (const caps of [blockCapabilities('region', true), blockCapabilities('root')]) {
      expect(caps).not.toContain('place');
      expect(caps).not.toContain('hide');
    }
    expect(blockCapabilities('region')).toContain('place');
  });
});

test('measures the editor writes stay on whole squares', () => {
  for (const property of ['gap', 'padding', 'width', 'height', 'marginTop', 'marginBottom'] as const) {
    const range = siteMeasureRange(property, 1000, 800);
    for (const value of [-7, 0, 13, 31, 199, 455, 3000]) {
      const written = siteMeasureValue(value, range)!;
      expect(written % SQUARE, `${property} ${value}`).toBe(0);
      expect(written).toBeGreaterThanOrEqual(range[0]);
    }
  }
  expect(siteMeasureRange('width', 1000, 800)[0]).toBe(10 * SQUARE);
  expect(siteMeasureRange('height', 1000, 800)[0]).toBe(4 * SQUARE);
});

test('drag motion animates translate, transform and opacity only', () => {
  const source = read('src/vendor/drag/sortable.ts');
  const transitions = [...source.matchAll(/transition\s*=\s*(?:reducedMotion \? 'none' : )?`([^`]*)`/g)].map(match => match[1]);
  expect(transitions.length).toBeGreaterThan(0);
  for (const transition of transitions) for (const part of transition.split(',')) expect(part.trim().split(' ')[0]).toMatch(/^(translate|transform|opacity)$/);
  const keyframes = [...source.matchAll(/\.animate\(\[\{ (\w+):/g)].map(match => match[1]);
  for (const property of keyframes) expect(property).toMatch(/^(translate|transform|opacity)$/);
  expect(read('src/settle.ts')).not.toMatch(/\b(top|left|height|width|margin)\s*:/);
});

describe('the constraints', () => {
  test('each names a test that exists', () => {
    for (const { code, check } of C9Y_CONSTRAINTS) {
      expect(read(check.file), `${code}: ${check.file}`).toContain(check.test);
    }
    expect(new Set(C9Y_CONSTRAINTS.map(({ code }) => code)).size).toBe(C9Y_CONSTRAINTS.length);
  });

  test('C9Y-constraints.md is current', () => {
    expect(read('C9Y-constraints.md'), 'Run vp run c9y-constraints').toBe(constraintsDocument());
  });
});
