/**
 * The badges on the icon page of the ds1 Figma file (node 403:4011), drawn
 * again as gridded icons: the builder's starting points, and the proof that
 * its grammar holds the Figma's shapes.
 *
 * Colours are the ones the Figma paints. Where it laid a tint over a colour,
 * the tint is an ink with alpha, or the two are mixed into the colour the
 * canvas shows. Frames the Figma turns a quarter or a half are drawn upright
 * here and turned the same way.
 */
import {
  CLEAR,
  ICON_UNITS,
  patternCells,
  rotateIcon,
  type GridIcon,
  type IconMask,
  type IconPoint,
  type IconShard,
} from './gridIcon'

export interface FigmaIcon {
  /** What an item or a list stores to wear this icon; never renamed once used. */
  key: string
  name: string
  /** The node on the Figma page this one is drawn from. */
  node: string
  icon: GridIcon
}

const shard = (ink: number, ...points: IconPoint[]): IconShard => ({ ink, points })

function cells(ink: (x: number, y: number) => number): number[] {
  const all: number[] = []
  for (let y = 0; y < ICON_UNITS; y++) for (let x = 0; x < ICON_UNITS; x++) all.push(ink(x, y))
  return all
}

const fill = (ink: number) => cells(() => ink)

function icon(inks: string[], ground: number[], shards: IconShard[] = [], mask: IconMask = 'square', turns = 0): GridIcon {
  let drawn: GridIcon = { mask, inks, cells: ground, shards }
  for (let turn = 0; turn < turns; turn++) drawn = rotateIcon(drawn)
  return drawn
}

/** The two fans share one cut: eight shards, turned a half. */
const FAN_SHARDS = [
  shard(0, [8, 16], [16, 16], [16, 8]),
  shard(1, [8, 16], [16, 8], [16, 0]),
  shard(1, [0, 16], [8, 16], [4, 8]),
  shard(2, [8, 0], [0, 8], [0, 16], [4, 8]),
  shard(2, [8, 16], [16, 0], [12, 0]),
  shard(3, [8, 0], [8, 16], [12, 0]),
  shard(3, [8, 0], [0, 0], [0, 8]),
  shard(0, [8, 16], [8, 0], [4, 8]),
]

/**
 * Orange, and two yellows taking turns in the gaps between: the Figma's
 * checker is three inks, not two.
 */
function yellowChecker(x: number, y: number): number {
  const column = Math.floor(x / 2)
  const row = Math.floor(y / 2)
  if ((column + row) % 2 === 0) return 0
  return (column + (row % 2)) % 4 === 1 ? 1 : 2
}

export const FIGMA_ICONS: FigmaIcon[] = [
  { key: 'fan', name: 'Fan', node: '403:4012', icon: icon(['#99ff73', '#56a7a1', '#ccccff', '#fec20d40'], fill(CLEAR), FAN_SHARDS, 'square', 2) },
  { key: 'fan-dark', name: 'Fan, dark', node: '403:4014', icon: icon(['#65a74f', '#56a7a1', '#263724', '#391d5a'], fill(CLEAR), FAN_SHARDS, 'square', 2) },
  { key: 'red', name: 'Red', node: '403:4013', icon: icon(['#ff5f5f'], fill(0)) },
  { key: 'halves', name: 'Halves', node: '403:4015', icon: icon(['#f5aad1', '#ccccff'], patternCells('halves', 2)) },
  { key: 'bands', name: 'Bands', node: '936:124', icon: icon(['#f5aad1', '#ccccff', '#979441', '#eaff00'], patternCells('bands', 4)) },
  { key: 'halves-green', name: 'Halves, green', node: '403:4024', icon: icon(['#fec20d', '#99ff73'], patternCells('halves', 2)) },
  { key: 'tall-bricks', name: 'Tall bricks', node: '403:4033', icon: icon(['#594dff', '#fec20d'], patternCells('bricks', 2), [], 'square', 1) },
  { key: 'bricks', name: 'Bricks', node: '403:4050', icon: icon(['#979441', '#99ff73'], patternCells('bricks', 2)) },
  { key: 'weave', name: 'Weave', node: '936:139', icon: icon(['#f5aad1', '#797979'], patternCells('weave', 2)) },
  {
    key: 'broken-stripes',
    name: 'Broken stripes',
    node: '403:4068',
    icon: icon(['#ffff00', '#fec20d'], cells((x, y) => (Math.floor(y / 2) + (x >= 4 ? 1 : 0)) % 2), [], 'square', 1),
  },
  { key: 'checker', name: 'Checker', node: '403:4085', icon: icon(['#fec20d', '#ffff00', '#eaff00'], cells(yellowChecker)) },
  { key: 'shard', name: 'Shard', node: '403:4086', icon: icon(['#979441', '#ccccff'], fill(0), [shard(1, [16, 0], [0, 16], [8, 16])]) },
  { key: 'red-blue-bricks', name: 'Red and blue bricks', node: '403:4088', icon: icon(['#594dff', '#ff5f5f'], patternCells('bricks', 2)) },
  {
    key: 'blue-fan',
    name: 'Blue fan',
    node: '403:4089',
    icon: icon(['#594dff', '#979441', '#ffff00', '#ff5f5f'], fill(0), [
      shard(1, [8, 0], [0, 0], [0, 8]),
      shard(2, [8, 0], [0, 8], [0, 16]),
      shard(2, [16, 0], [8, 0], [12, 8]),
      shard(3, [8, 16], [16, 8], [16, 0], [12, 8]),
      shard(3, [8, 0], [0, 16], [4, 16]),
      shard(1, [8, 16], [8, 0], [4, 16]),
      shard(1, [8, 16], [16, 16], [16, 8]),
      shard(1, [8, 0], [8, 16], [12, 8]),
    ], 'square', 1),
  },
  // A grey and a red, each under a fifth of a tint, mixed as the canvas shows them.
  { key: 'split-circle', name: 'Split circle', node: '403:4091', icon: icon(['#e1aeae', '#d73300'], fill(0), [shard(1, [16, 0], [16, 16], [0, 16])], 'circle') },
  {
    key: 'round-fan',
    name: 'Round fan',
    node: '403:4092',
    icon: icon(['#979441', '#ffff00', '#ff5f5f', '#594dff'], fill(0), [
      shard(1, [16, 0], [8, 0], [8, 8]),
      shard(2, [16, 0], [8, 8], [8, 16]),
      shard(3, [16, 0], [8, 16], [12, 16]),
      shard(1, [16, 16], [0, 16], [0, 8]),
    ], 'circle', 1),
  },
  {
    key: 'diamond',
    name: 'Diamond',
    node: '403:4094',
    icon: icon(['#37ff0033', '#d9d9d9', '#c0b5b5'], fill(0), [
      shard(1, [8, 0], [16, 8], [8, 16], [0, 8]),
      shard(2, [8, 4], [12, 8], [4, 16], [0, 12]),
    ], 'circle'),
  },
]

/** The icon a stored key names, or undefined for a key no icon answers to. */
export function figmaIcon(key: string | null | undefined): FigmaIcon | undefined {
  return key ? FIGMA_ICONS.find(icon => icon.key === key) : undefined
}
