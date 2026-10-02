import { expect, test } from 'vite-plus/test'
import {
  CLEAR,
  ICON_PATTERNS,
  ICON_UNITS,
  applyPattern,
  blankIcon,
  cellIndex,
  flipIcon,
  generateIcon,
  groundRects,
  halfShard,
  iconSvg,
  paintSquare,
  parseIcon,
  patternCells,
  recolorIcon,
  removeInk,
  rotateIcon,
  seedFromText,
  shardArea,
  shardAt,
  snapPoint,
} from '../website/src/lib/icons/gridIcon'
import { FIGMA_ICONS } from '../website/src/lib/icons/gridIconFigma'

test('the ground is drawn as few rectangles, whole units only', () => {
  const striped = patternCells('stripes', 2)
  // Eight stripes two units tall, each one rectangle across the icon.
  expect(groundRects(striped)).toHaveLength(8)
  expect(groundRects(blankIcon().cells)).toEqual([{ x: 0, y: 0, width: 16, height: 16, ink: 0 }])
  const cleared = paintSquare(blankIcon(), 0, 0, 8, CLEAR)
  const rects = groundRects(cleared.cells)
  expect(rects.reduce((area, rect) => area + rect.width * rect.height, 0)).toBe(256 - 64)
  for (const rect of rects) for (const value of [rect.x, rect.y, rect.width, rect.height]) expect(Number.isInteger(value)).toBe(true)
})

test('painting fills the grid square under the pointer, snapped to its size', () => {
  const painted = paintSquare(blankIcon(), 5.4, 9.9, 4, 1)
  expect(painted.cells.filter(ink => ink === 1)).toHaveLength(16)
  expect(painted.cells[cellIndex(4, 8)]).toBe(1)
  expect(painted.cells[cellIndex(7, 11)]).toBe(1)
  expect(painted.cells[cellIndex(8, 8)]).toBe(0)
  // The last square stays inside the icon.
  expect(paintSquare(blankIcon(), 15.9, 15.9, 8, 1).cells[cellIndex(8, 8)]).toBe(1)
})

test('a half takes the corner nearest the pointer, and shards snap to crossings', () => {
  expect(halfShard(0.5, 0.5, 2, 1).points).toEqual([[0, 0], [2, 0], [0, 2]])
  expect(halfShard(3.8, 3.8, 2, 1).points).toEqual([[4, 2], [4, 4], [2, 4]])
  expect(shardArea(halfShard(9, 1, 8, 0).points)).toBe(32)
  expect(snapPoint(3.1, 12.9, 4)).toEqual([4, 12])
  expect(snapPoint(-2, 30, 2)).toEqual([0, 16])
  const icon = { ...blankIcon(), shards: [halfShard(1, 1, 16, 1)] }
  expect(shardAt(icon, 2, 2)).toBe(0)
  expect(shardAt(icon, 14, 14)).toBe(-1)
})

test('four quarter turns and two mirrors give the icon back', () => {
  const icon = generateIcon(42)
  let turned = icon
  for (let turn = 0; turn < 4; turn++) turned = rotateIcon(turned)
  expect(turned).toEqual(icon)
  expect(flipIcon(flipIcon(icon))).toEqual(icon)
  const marked = paintSquare(blankIcon(), 0, 0, 1, 1)
  expect(rotateIcon(marked).cells[cellIndex(ICON_UNITS - 1, 0)]).toBe(1)
  expect(flipIcon(marked).cells[cellIndex(ICON_UNITS - 1, 0)]).toBe(1)
})

test('dropping an ink clears what it drew and keeps the rest pointing right', () => {
  const icon = { ...applyPattern(blankIcon(['#99ff73', '#594dff', '#fec20d']), 'bands'), shards: [halfShard(1, 1, 2, 2)] }
  const dropped = removeInk(icon, 1)
  expect(dropped.inks).toEqual(['#99ff73', '#fec20d'])
  expect(dropped.cells).toContain(CLEAR)
  expect(dropped.cells).not.toContain(2)
  expect(dropped.shards).toEqual([{ points: icon.shards[0].points, ink: 1 }])
})

test('every pattern uses only the inks it is given', () => {
  for (const { key } of ICON_PATTERNS) {
    for (const count of [1, 2, 4]) {
      const cells = patternCells(key, count)
      expect(cells).toHaveLength(256)
      expect(Math.max(...cells), key).toBeLessThan(count)
    }
  }
})

test('the same word always draws the same icon, in the design colours', () => {
  expect(seedFromText('Budget')).toBe(seedFromText(' budget '))
  expect(generateIcon(seedFromText('Budget'))).toEqual(generateIcon(seedFromText('Budget')))
  expect(generateIcon(1)).not.toEqual(generateIcon(2))
  for (let seed = 0; seed < 200; seed++) {
    const icon = generateIcon(seed)
    expect(parseIcon(JSON.parse(JSON.stringify(icon))), `seed ${seed}`).toEqual(icon)
    expect(new Set(icon.inks).size).toBe(icon.inks.length)
    for (const shard of icon.shards) expect(shardArea(shard.points)).toBeGreaterThan(0)
  }
  const recoloured = recolorIcon(generateIcon(7), 99)
  expect(recoloured.cells).toEqual(generateIcon(7).cells)
  expect(recoloured.inks).toHaveLength(generateIcon(7).inks.length)
})

test('the SVG stands on a sixteen-unit box and rounds only when asked', () => {
  const square = iconSvg(blankIcon(['#ff5f5f']), { size: 32 })
  expect(square).toBe('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="32" height="32"><g shape-rendering="crispEdges"><rect x="0" y="0" width="16" height="16" fill="#ff5f5f"/></g></svg>')
  const round = iconSvg({ ...blankIcon(), mask: 'circle' }, { id: 'a' })
  expect(round).toContain('<clipPath id="a-mask"><circle cx="8" cy="8" r="8"/></clipPath>')
  expect(round).toContain('clip-path="url(#a-mask)"')
  expect(iconSvg(blankIcon(), { title: 'A & <b>' })).toContain('<title>A &#38; &#60;b&#62;</title>')
})

test('what is read back from storage has to be an icon', () => {
  expect(parseIcon(null)).toBeNull()
  expect(parseIcon({ ...blankIcon(), cells: [0] })).toBeNull()
  expect(parseIcon({ ...blankIcon(), inks: ['red'] })).toBeNull()
  expect(parseIcon({ ...blankIcon(), cells: new Array(256).fill(5) })).toBeNull()
  expect(parseIcon({ ...blankIcon(), shards: [{ ink: 0, points: [[0, 0], [20, 0], [0, 4]] }] })).toBeNull()
  expect(parseIcon(blankIcon())).toEqual(blankIcon())
})

test('the Figma badges are drawn again, whole, on the grid', () => {
  expect(FIGMA_ICONS).toHaveLength(17)
  for (const badge of FIGMA_ICONS) {
    expect(parseIcon(badge.icon), badge.name).toEqual(badge.icon)
    expect(badge.node).toMatch(/^\d+:\d+$/)
    for (const shard of badge.icon.shards) for (const [x, y] of shard.points) {
      // Every corner stands on a crossing of the four-unit grid.
      expect(x % 4, badge.name).toBe(0)
      expect(y % 4, badge.name).toBe(0)
    }
  }
  const red = FIGMA_ICONS.find(badge => badge.name === 'Red')!
  expect(iconSvg(red.icon)).toContain('fill="#ff5f5f"')
  // The fans cover the whole square with their shards and leave no ground.
  const fan = FIGMA_ICONS.find(badge => badge.name === 'Fan')!
  expect(fan.icon.cells.every(ink => ink === CLEAR)).toBe(true)
  expect(fan.icon.shards.reduce((area, shard) => area + shardArea(shard.points), 0)).toBe(256)
})
