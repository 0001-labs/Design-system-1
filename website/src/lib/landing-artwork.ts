import palette from './landing-palette.json';

export type ClearArea = { left: number; top: number; right: number; bottom: number };

// Coordinate-based randomness keeps the artwork stable while the page resizes.
function noise(x: number, y: number, seed: number): number {
  const value = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return value - Math.floor(value);
}

export function createLandingArtwork(columns: number, rows: number, clearAreas: ClearArea[]) {
  const tiles: { x: number; y: number; size: number; color?: string }[] = [];
  const largeAreas: ClearArea[] = [];
  const overlaps = (x: number, y: number, size: number, areas: ClearArea[]) =>
    areas.some(area => x < area.right && x + size > area.left && y < area.bottom && y + size > area.top);
  const densityAt = (x: number, y: number) => Math.pow(
    (1 - 0.7 * Math.min(1, x / columns)) * (1 - 0.8 * Math.min(1, y / rows)), 1.5
  );

  // Fit occasional solid squares into the open space before placing micro clusters.
  for (let zoneY = 0; zoneY < Math.ceil(rows / 9); zoneY++) {
    for (let zoneX = 0; zoneX < Math.ceil(columns / 8); zoneX++) {
      const density = densityAt(zoneX * 8, zoneY * 9);
      if (noise(zoneX, zoneY, 16) > 0.06 + 0.64 * density) continue;
      const preferred = noise(zoneX, zoneY, 17);
      const sizes = preferred > 0.65 ? [4, 2, 1] : preferred > 0.25 ? [2, 1] : [1];
      let placed = false;
      for (const size of sizes) {
        for (let attempt = 0; attempt < 5; attempt++) {
          const x = zoneX * 8 + Math.floor(noise(zoneX, zoneY, 18 + attempt * 2) * (9 - size));
          const y = zoneY * 9 + Math.floor(noise(zoneX, zoneY, 19 + attempt * 2) * (10 - size));
          if (x + size > columns || y + size > rows || overlaps(x, y, size, clearAreas)) continue;
          const color = palette[Math.floor(noise(zoneX, zoneY, 31) * palette.length)];
          tiles.push({ x, y, size, color });
          largeAreas.push({ left: x, top: y, right: x + size, bottom: y + size });
          placed = true;
          break;
        }
        if (placed) break;
      }
    }
  }
  // A few larger accents remain in the otherwise quiet lower-right area.
  for (const [index, [anchorX, anchorY]] of [[0.72, 0.78], [0.9, 0.64], [0.88, 0.92]].entries()) {
    let placed = false;
    for (const size of [4, 2]) {
      for (let attempt = 0; attempt < 8; attempt++) {
        const x = Math.min(Math.floor(columns - size), Math.max(0, Math.floor(columns * anchorX) + Math.floor(noise(index, attempt, 40) * 9) - 4));
        const y = Math.min(Math.floor(rows - size), Math.max(0, Math.floor(rows * anchorY) + Math.floor(noise(index, attempt, 41) * 9) - 4));
        if (x < columns * 0.5 || y < rows * 0.5 || overlaps(x, y, size, clearAreas) || overlaps(x, y, size, largeAreas)) continue;
        const color = palette[Math.floor(noise(index, 0, 42) * palette.length)];
        tiles.push({ x, y, size, color });
        largeAreas.push({ left: x, top: y, right: x + size, bottom: y + size });
        placed = true;
        break;
      }
      if (placed) break;
    }
  }
  for (let y = 0; y < Math.ceil(rows); y++) {
    for (let x = 0; x < Math.ceil(columns); x++) {
      const zoneX = Math.floor(x / 8);
      const zoneY = Math.floor(y / 9);
      const density = densityAt(zoneX * 8, zoneY * 9);
      const activeCluster = noise(zoneX, zoneY, 32) < 0.04 + 0.96 * density;
      const centerX = zoneX * 8 + 1 + Math.floor(noise(zoneX, zoneY, 4) * 6);
      const centerY = zoneY * 9 + 1 + Math.floor(noise(zoneX, zoneY, 5) * 7);
      const radius = 1.2 + noise(zoneX, zoneY, 6) * 2;
      const distance = Math.hypot(x - centerX, (y - centerY) * 0.8);
      const squareCluster = noise(zoneX, zoneY, 12) > 0.4;
      const squareSize = 2 + Math.floor(noise(zoneX, zoneY, 13) * 3);
      const squareLeft = centerX - Math.floor(squareSize / 2);
      const squareTop = centerY - Math.floor(squareSize / 2);
      const clustered = activeCluster && (squareCluster
        ? x >= squareLeft && x < squareLeft + squareSize && y >= squareTop && y < squareTop + squareSize
        : distance < radius && noise(x, y, 7) > 0.24);
      const isolated = noise(x, y, 8) > 1 - 0.013 * density;
      if ((!clustered && !isolated) || x + 1 > columns || y + 1 > rows) continue;
      if (overlaps(x, y, 1, clearAreas) || overlaps(x, y, 1, largeAreas)) continue;
      if (!clustered) {
        tiles.push({ x: x + 0.75, y, size: 0.25 });
        continue;
      }
      const cellStart = tiles.length;
      // Square silhouettes have enough micro squares to read as larger forms,
      // while retaining holes and a few squares at the next size up.
      const coverage = (squareCluster
        ? 0.32 + noise(zoneX, zoneY, 14) * 0.2
        : 0.08 + 0.22 * Math.max(0, 1 - distance / radius)) * (0.45 + 0.75 * density);
      for (let groupY = 0; groupY < 4; groupY += 2) {
        for (let groupX = 0; groupX < 4; groupX += 2) {
          if (noise(x * 4 + groupX, y * 4 + groupY, 15) < coverage * 0.28) {
            tiles.push({ x: x + groupX / 4, y: y + groupY / 4, size: 0.5 });
            continue;
          }
          for (let dy = 0; dy < 2; dy++) {
            for (let dx = 0; dx < 2; dx++) {
              const microX = groupX + dx;
              const microY = groupY + dy;
              if (noise(x * 4 + microX, y * 4 + microY, 11) >= coverage) continue;
              tiles.push({ x: x + microX / 4, y: y + microY / 4, size: 0.25 });
            }
          }
        }
      }
      // A cell containing just one dot always uses its top-right corner.
      if (tiles.length === cellStart + 1) {
        const dot = tiles[cellStart];
        dot.x = x + 1 - dot.size;
        dot.y = y;
      }
    }
  }
  // Halve each size independently so the quieter composition keeps its size mix.
  const sparseTiles = [0.25, 0.5, 1, 2, 4].flatMap(size => {
    const matching = tiles.filter(tile => tile.size === size);
    matching.sort((a, b) => noise(a.x * 4, a.y * 4, 51) - noise(b.x * 4, b.y * 4, 51));
    return matching.slice(0, Math.ceil(matching.length / 2));
  });
  const cells = new Map<string, typeof sparseTiles>();
  for (const tile of sparseTiles) {
    if (tile.size >= 1) continue;
    const key = `${Math.floor(tile.x)},${Math.floor(tile.y)}`;
    const cell = cells.get(key) ?? [];
    cell.push(tile);
    cells.set(key, cell);
  }
  for (const cell of cells.values()) {
    if (cell.length !== 1) continue;
    const dot = cell[0];
    dot.x = Math.floor(dot.x) + 1 - dot.size;
    dot.y = Math.floor(dot.y);
  }
  return { tiles: sparseTiles };
}
