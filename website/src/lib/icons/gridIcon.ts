/**
 * Gridded icons, the drawings stickers are made of.
 *
 * An icon is sixteen units a side. Its ground is a square of unit cells, each
 * holding one of the icon's own inks or nothing; over the ground lie shards,
 * polygons whose corners stand on the grid's crossings. Every edge lands on a
 * whole unit, so at sixteen pixels each edge is a pixel edge, and drawn larger
 * the icon keeps to the paper's ruling. A circle mask rounds the whole.
 *
 * Cells and shards name an ink by its place in `inks`, so the same drawing can
 * be worn in other colours. The shapes follow the icon page of the ds1 Figma
 * file (node 403:3634): bands, stripes, bricks, checkers, fans of shards and
 * split circles, all on a two-unit grid.
 */

export const ICON_UNITS = 16
/** A cell with no ink: the paper shows through. */
export const CLEAR = -1
export const MAX_INKS = 32

export type IconMask = 'square' | 'circle'
export type IconPoint = readonly [number, number]

export interface IconShard {
  points: IconPoint[]
  ink: number
}

export interface GridIcon {
  mask: IconMask
  /** Colours as `#rrggbb`, or `#rrggbbaa` where the Figma drew a tint. */
  inks: string[]
  /** ICON_UNITS × ICON_UNITS entries, row by row: an index into `inks`, or CLEAR. */
  cells: number[]
  shards: IconShard[]
}

/** The design's colours, the only ones the builder offers. */
export const ICON_PALETTE = [
  { name: 'Apple green', hex: '#99ff73' },
  { name: 'Chartreuse green', hex: '#ccff4d' },
  { name: 'Yellow', hex: '#eaff00' },
  { name: 'Orange', hex: '#fec20d' },
  { name: 'Tuned red', hex: '#ff5f5f' },
  { name: 'Pink', hex: '#f5aad1' },
  { name: 'Zenith blue', hex: '#ccccff' },
  { name: 'Sharp blue', hex: '#594dff' },
  { name: 'Every green', hex: '#979441' },
  { name: 'White', hex: '#ffffff' },
  { name: 'Light grey', hex: '#e8e8e8' },
  { name: 'Darker grey', hex: '#797979' },
  { name: 'Black', hex: '#2a2a2a' },
] as const

/** The accents alone: what a generated icon is coloured from. */
const ACCENTS: readonly string[] = ICON_PALETTE.slice(0, 9).map(colour => colour.hex)

const INK = /^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/

export const ICON_PATTERNS = [
  { key: 'solid', name: 'Solid' },
  { key: 'halves', name: 'Halves' },
  { key: 'bands', name: 'Bands' },
  { key: 'stripes', name: 'Stripes' },
  { key: 'columns', name: 'Columns' },
  { key: 'bricks', name: 'Bricks' },
  { key: 'tall-bricks', name: 'Tall bricks' },
  { key: 'weave', name: 'Weave' },
  { key: 'checker', name: 'Checker' },
  { key: 'big-checker', name: 'Big checker' },
] as const

export type IconPattern = (typeof ICON_PATTERNS)[number]['key']

export function cellIndex(x: number, y: number): number {
  return y * ICON_UNITS + x
}

export function blankIcon(inks: string[] = ['#ccccff', '#594dff']): GridIcon {
  return { mask: 'square', inks: [...inks], cells: new Array(ICON_UNITS * ICON_UNITS).fill(0), shards: [] }
}

export function cloneIcon(icon: GridIcon): GridIcon {
  return {
    mask: icon.mask,
    inks: [...icon.inks],
    cells: [...icon.cells],
    shards: icon.shards.map(shard => ({ ink: shard.ink, points: shard.points.map(([x, y]) => [x, y] as const) })),
  }
}

/** Which ink a pattern puts in the unit cell at x, y, given how many inks there are. */
function patternInk(pattern: IconPattern, x: number, y: number, inks: number): number {
  const two = (value: number) => (inks < 2 ? 0 : value % 2)
  switch (pattern) {
    case 'solid': return 0
    // The top half in the second ink, as the lavender over pink does.
    case 'halves': return two(y < 8 ? 1 : 0)
    // Four-unit bands through every ink, the last band the ground's.
    case 'bands': return inks < 2 ? 0 : (Math.floor(y / 4) + 1) % inks
    case 'stripes': return two(Math.floor(y / 2))
    case 'columns': return two(Math.floor(x / 2))
    // Eight by two, each row shifted by half: the green and the red-blue badges.
    case 'bricks': return two(Math.floor(y / 2) + Math.floor(x / 8))
    case 'tall-bricks': return two(Math.floor(x / 2) + Math.floor(y / 8))
    // Eight, four and four wide, the middle column a row out of step.
    case 'weave': return two(Math.floor(y / 2) + (x >= 8 && x < 12 ? 1 : 0))
    case 'checker': return two(Math.floor(x / 2) + Math.floor(y / 2))
    case 'big-checker': return two(Math.floor(x / 4) + Math.floor(y / 4))
  }
}

export function patternCells(pattern: IconPattern, inks: number): number[] {
  const cells: number[] = []
  for (let y = 0; y < ICON_UNITS; y++) for (let x = 0; x < ICON_UNITS; x++) cells.push(patternInk(pattern, x, y, inks))
  return cells
}

export function applyPattern(icon: GridIcon, pattern: IconPattern): GridIcon {
  return { ...cloneIcon(icon), cells: patternCells(pattern, icon.inks.length) }
}

/** The grid square of `size` units holding x, y, as its top-left unit. */
export function squareAt(x: number, y: number, size: number): IconPoint {
  const clamp = (value: number) => Math.max(0, Math.min(ICON_UNITS - size, Math.floor(value / size) * size))
  return [clamp(x), clamp(y)]
}

/** Put an ink, or CLEAR, in every cell of the grid square holding x, y. */
export function paintSquare(icon: GridIcon, x: number, y: number, size: number, ink: number): GridIcon {
  const [left, top] = squareAt(x, y, size)
  const next = cloneIcon(icon)
  for (let row = top; row < top + size; row++) for (let column = left; column < left + size; column++) next.cells[cellIndex(column, row)] = ink
  return next
}

export type Corner = 'nw' | 'ne' | 'se' | 'sw'

/** The half of a grid square on the side of the corner nearest x, y. */
export function halfShard(x: number, y: number, size: number, ink: number): IconShard {
  const [left, top] = squareAt(x, y, size)
  const right = left + size
  const bottom = top + size
  const east = x - left >= size / 2
  const south = y - top >= size / 2
  const corner: Corner = south ? (east ? 'se' : 'sw') : (east ? 'ne' : 'nw')
  const points: Record<Corner, IconPoint[]> = {
    nw: [[left, top], [right, top], [left, bottom]],
    ne: [[left, top], [right, top], [right, bottom]],
    se: [[right, top], [right, bottom], [left, bottom]],
    sw: [[left, top], [right, bottom], [left, bottom]],
  }
  return { points: points[corner], ink }
}

/** The nearest crossing of a grid `step` units apart. */
export function snapPoint(x: number, y: number, step: number): IconPoint {
  const snap = (value: number) => Math.max(0, Math.min(ICON_UNITS, Math.round(value / step) * step))
  return [snap(x), snap(y)]
}

export function shardArea(points: readonly IconPoint[]): number {
  let twice = 0
  for (let index = 0; index < points.length; index++) {
    const [x1, y1] = points[index]
    const [x2, y2] = points[(index + 1) % points.length]
    twice += x1 * y2 - x2 * y1
  }
  return Math.abs(twice) / 2
}

function contains(points: readonly IconPoint[], x: number, y: number): boolean {
  let inside = false
  for (let index = 0, previous = points.length - 1; index < points.length; previous = index++) {
    const [xi, yi] = points[index]
    const [xj, yj] = points[previous]
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

/** The topmost shard under x, y, or -1. */
export function shardAt(icon: GridIcon, x: number, y: number): number {
  for (let index = icon.shards.length - 1; index >= 0; index--) if (contains(icon.shards[index].points, x, y)) return index
  return -1
}

/** A quarter turn clockwise, cells and shards alike. */
export function rotateIcon(icon: GridIcon): GridIcon {
  const next = cloneIcon(icon)
  for (let y = 0; y < ICON_UNITS; y++) {
    for (let x = 0; x < ICON_UNITS; x++) next.cells[cellIndex(ICON_UNITS - 1 - y, x)] = icon.cells[cellIndex(x, y)]
  }
  next.shards = icon.shards.map(shard => ({ ink: shard.ink, points: shard.points.map(([x, y]) => [ICON_UNITS - y, x] as const) }))
  return next
}

/** Mirrored left to right. */
export function flipIcon(icon: GridIcon): GridIcon {
  const next = cloneIcon(icon)
  for (let y = 0; y < ICON_UNITS; y++) {
    for (let x = 0; x < ICON_UNITS; x++) next.cells[cellIndex(ICON_UNITS - 1 - x, y)] = icon.cells[cellIndex(x, y)]
  }
  next.shards = icon.shards.map(shard => ({ ink: shard.ink, points: shard.points.map(([x, y]) => [ICON_UNITS - x, y] as const) }))
  return next
}

/** Drop an ink; what was drawn in it goes clear, and later inks move up one. */
export function removeInk(icon: GridIcon, ink: number): GridIcon {
  if (icon.inks.length <= 1) return cloneIcon(icon)
  const shift = (value: number) => (value === ink ? CLEAR : value > ink ? value - 1 : value)
  return {
    mask: icon.mask,
    inks: icon.inks.filter((_, index) => index !== ink),
    cells: icon.cells.map(shift),
    shards: icon.shards.filter(shard => shard.ink !== ink).map(shard => ({ points: shard.points, ink: shift(shard.ink) })),
  }
}

interface IconRect { x: number; y: number; width: number; height: number; ink: number }

/** The ground as few rectangles as a row-then-column merge gives. */
export function groundRects(cells: readonly number[]): IconRect[] {
  const done: IconRect[] = []
  let open = new Map<string, IconRect>()
  for (let y = 0; y < ICON_UNITS; y++) {
    const next = new Map<string, IconRect>()
    let x = 0
    while (x < ICON_UNITS) {
      const ink = cells[cellIndex(x, y)]
      let end = x + 1
      while (end < ICON_UNITS && cells[cellIndex(end, y)] === ink) end++
      if (ink !== CLEAR) {
        const key = `${x}:${end - x}:${ink}`
        const above = open.get(key)
        if (above) {
          above.height++
          open.delete(key)
          next.set(key, above)
        } else {
          next.set(key, { x, y, width: end - x, height: 1, ink })
        }
      }
      x = end
    }
    done.push(...open.values())
    open = next
  }
  done.push(...open.values())
  return done.sort((a, b) => a.y - b.y || a.x - b.x)
}

function number(value: number): string {
  return String(Math.round(value * 1000) / 1000)
}

export interface IconSvgOptions {
  /** Pixel width and height; omit for an SVG that fills what holds it. */
  size?: number
  /** Unique within the page when several icons with circle masks are inlined. */
  id?: string
  title?: string
}

export function iconSvg(icon: GridIcon, options: IconSvgOptions = {}): string {
  const id = options.id ?? 'ezo-icon'
  const size = options.size ? ` width="${options.size}" height="${options.size}"` : ''
  const title = options.title ? `<title>${options.title.replace(/[<&>]/g, character => `&#${character.charCodeAt(0)};`)}</title>` : ''
  const ink = (index: number) => icon.inks[index] ?? '#000000'
  const rects = groundRects(icon.cells)
    .map(rect => `<rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" fill="${ink(rect.ink)}"/>`)
    .join('')
  const shards = icon.shards
    .filter(shard => shard.ink !== CLEAR && shard.points.length >= 3)
    .map(shard => `<path d="M${shard.points.map(([x, y]) => `${number(x)} ${number(y)}`).join('L')}Z" fill="${ink(shard.ink)}"/>`)
    .join('')
  // Rectangles meet edge to edge without a seam; shards keep their smoothing.
  const body = `<g shape-rendering="crispEdges">${rects}</g>${shards}`
  const masked = icon.mask === 'circle'
    ? `<defs><clipPath id="${id}-mask"><circle cx="8" cy="8" r="8"/></clipPath></defs><g clip-path="url(#${id}-mask)">${body}</g>`
    : body
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ICON_UNITS} ${ICON_UNITS}"${size}>${title}${masked}</svg>`
}

/** An icon read back from storage or a paste, or null when it is not one. */
export function parseIcon(value: unknown): GridIcon | null {
  if (!value || typeof value !== 'object') return null
  const icon = value as Partial<GridIcon>
  if (icon.mask !== 'square' && icon.mask !== 'circle') return null
  if (!Array.isArray(icon.inks) || !icon.inks.length || icon.inks.length > MAX_INKS) return null
  if (!icon.inks.every(ink => typeof ink === 'string' && INK.test(ink))) return null
  const inkOk = (ink: unknown) => Number.isInteger(ink) && (ink as number) >= CLEAR && (ink as number) < icon.inks!.length
  if (!Array.isArray(icon.cells) || icon.cells.length !== ICON_UNITS * ICON_UNITS || !icon.cells.every(inkOk)) return null
  if (!Array.isArray(icon.shards) || icon.shards.length > 256) return null
  const pointOk = (point: unknown) => Array.isArray(point) && point.length === 2 && point.every(axis => typeof axis === 'number' && axis >= 0 && axis <= ICON_UNITS)
  if (!icon.shards.every(shard => shard && inkOk(shard.ink) && Array.isArray(shard.points) && shard.points.length >= 3 && shard.points.length <= 12 && shard.points.every(pointOk))) return null
  return cloneIcon(icon as GridIcon)
}

/** A number from a word, the same one every time: FNV-1a. */
export function seedFromText(text: string): number {
  let hash = 0x811c9dc5
  for (const character of text.trim().toLowerCase()) {
    hash ^= character.codePointAt(0)!
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/** Mulberry32: small, fast and the same on every device. */
export function randomFrom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function pick<T>(random: () => number, values: readonly T[]): T {
  return values[Math.floor(random() * values.length)]
}

function pickInks(random: () => number, count: number): string[] {
  const pool = [...ACCENTS]
  const inks: string[] = []
  while (inks.length < count && pool.length) inks.push(pool.splice(Math.floor(random() * pool.length), 1)[0])
  return inks
}

/** The frame's crossings every four units, clockwise from the top-left corner. */
const RIM: IconPoint[] = (() => {
  const points: IconPoint[] = []
  for (let x = 0; x < 16; x += 4) points.push([x, 0])
  for (let y = 0; y < 16; y += 4) points.push([16, y])
  for (let x = 16; x > 0; x -= 4) points.push([x, 16])
  for (let y = 16; y > 0; y -= 4) points.push([0, y])
  return points
})()

/** Corners and the middles of the edges: where the Figma's fans open from. */
const FAN_ORIGINS: IconPoint[] = [[0, 0], [8, 0], [16, 0], [16, 8], [16, 16], [8, 16], [0, 16], [0, 8]]

/** A fan of shards opening from a corner or an edge's middle across the icon. */
function fan(random: () => number, inks: number[]): IconShard[] {
  const origin = pick(random, FAN_ORIGINS)
  const blades = 1 + Math.floor(random() * 4)
  const start = Math.floor(random() * RIM.length)
  const shards: IconShard[] = []
  for (let index = 0; index < blades; index++) {
    const from = RIM[(start + index) % RIM.length]
    const to = RIM[(start + index + 1) % RIM.length]
    const points = [origin, from, to]
    if (shardArea(points) < 8) continue
    shards.push({ points, ink: inks[index % inks.length] })
  }
  return shards
}

/**
 * An icon made up on the spot, in the Figma's grammar: two to four accents, a
 * pattern on the two-unit grid, sometimes a fan of shards, sometimes round.
 * The same seed always draws the same icon.
 */
export function generateIcon(seed: number): GridIcon {
  const random = randomFrom(seed)
  const count = 2 + (random() < 0.45 ? 1 : 0) + (random() < 0.2 ? 1 : 0)
  const inks = pickInks(random, count)
  const pattern = pick(random, ICON_PATTERNS).key
  const icon: GridIcon = { mask: random() < 0.28 ? 'circle' : 'square', inks, cells: patternCells(pattern, pattern === 'bands' ? count : 2), shards: [] }
  // Shards take the inks the pattern left unused, so they stand out from it.
  const used = pattern === 'solid' ? 1 : pattern === 'bands' ? count : 2
  const loose = inks.map((_, index) => index).filter(index => index >= used)
  const shardInks = loose.length ? loose : [1]
  if (icon.mask === 'circle' && random() < 0.4) {
    // Split down a diagonal, as the red circle is.
    icon.shards.push({ points: random() < 0.5 ? [[16, 0], [16, 16], [0, 16]] : [[0, 0], [16, 0], [16, 16]], ink: shardInks[0] })
  } else if (random() < 0.5 || pattern === 'solid') {
    icon.shards.push(...fan(random, shardInks.length > 1 ? shardInks : [shardInks[0], 0]))
  }
  return icon
}

/** The same drawing in other accents. */
export function recolorIcon(icon: GridIcon, seed: number): GridIcon {
  const random = randomFrom(seed)
  return { ...cloneIcon(icon), inks: pickInks(random, icon.inks.length) }
}
