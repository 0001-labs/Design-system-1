/**
 * Bentos without Lit: places the tiles of a `.ds-bento[data-squares]` (drawn
 * by `1-root/bento.css`) on their squares and lets each surface reach a
 * quarter square towards the tiles beside it, so the tiles stand half a
 * square apart while what they hold stays on the squares. A flow bento needs
 * no script. No framework and no imports.
 *
 * ```html
 * <div class="ds-bento" data-squares style="--ds-bento-columns: 48">
 *   <a class="ds-card" href="/archive/" data-place="0 0 15 7">…</a>
 *   <a class="ds-card" href="/ezo/" data-place="16 0 16 20">…</a>
 * </div>
 * <script type="module">
 *   import { placeBentos } from "/ds1/0-face/bento.js";
 *   placeBentos();
 * </script>
 * ```
 *
 * A tile's `data-place` is its square across, its square down, its width and
 * its height, in whole squares counted from 0. Tiles are placed a square
 * apart; a tile a square away from another, with the two overlapping along
 * that side, reaches towards it.
 */

/** A tile's place in squares: across, down, wide, high. */
export type BentoPlace = readonly [x: number, y: number, w: number, h: number];

/** Which sides of each tile face another tile a square away. */
export interface BentoReach { start: boolean; top: boolean; end: boolean; bottom: boolean }

/** Reads `data-place` ("x y w h"); `undefined` unless it is four whole numbers with a size. */
export function bentoPlace(value: string | null | undefined): BentoPlace | undefined {
  const parts = (value ?? "").trim().split(/[\s,]+/).map(Number);
  if (parts.length !== 4 || parts.some(part => !Number.isInteger(part) || part < 0)) return undefined;
  const [x, y, w, h] = parts as [number, number, number, number];
  return w > 0 && h > 0 ? [x, y, w, h] : undefined;
}

const overlaps = (a0: number, a1: number, b0: number, b1: number) => a0 < b1 && b0 < a1;

/** For each place, the sides that face another tile across a one-square gap. */
export function bentoReach(places: readonly BentoPlace[]): BentoReach[] {
  return places.map(([x, y, w, h], index) => {
    const others = places.filter((_, other) => other !== index);
    return {
      start: others.some(([ox, oy, ow, oh]) => ox + ow + 1 === x && overlaps(y, y + h, oy, oy + oh)),
      end: others.some(([ox, oy, , oh]) => x + w + 1 === ox && overlaps(y, y + h, oy, oy + oh)),
      top: others.some(([ox, oy, ow, oh]) => oy + oh + 1 === y && overlaps(x, x + w, ox, ox + ow)),
      bottom: others.some(([ox, oy, ow]) => y + h + 1 === oy && overlaps(x, x + w, ox, ox + ow)),
    };
  });
}

/** Places one squares bento's tiles: their squares and their reach, as custom properties. */
export function placeBento(bento: HTMLElement): void {
  const tiles = [...bento.children].filter((child): child is HTMLElement => child instanceof HTMLElement && !child.hidden);
  const placed = tiles.map(tile => ({ tile, place: bentoPlace(tile.dataset.place) })).filter((entry): entry is { tile: HTMLElement; place: BentoPlace } => !!entry.place);
  const reach = bentoReach(placed.map(entry => entry.place));
  placed.forEach(({ tile, place: [x, y, w, h] }, index) => {
    const sides = reach[index]!;
    tile.style.setProperty("--ds-bento-x", String(x));
    tile.style.setProperty("--ds-bento-y", String(y));
    tile.style.setProperty("--ds-bento-w", String(w));
    tile.style.setProperty("--ds-bento-h", String(h));
    for (const side of ["start", "top", "end", "bottom"] as const) tile.style.setProperty(`--ds-bento-${side}`, sides[side] ? "1" : "0");
  });
}

/** Places every squares bento on the page (or under `root`), and again when its tiles change. */
export function placeBentos(root: ParentNode = document): () => void {
  const bentos = [...root.querySelectorAll<HTMLElement>(".ds-bento[data-squares]")];
  const observer = new MutationObserver(records => {
    for (const record of records) {
      const bento = record.target instanceof HTMLElement && record.target.matches(".ds-bento[data-squares]") ? record.target : (record.target as HTMLElement).parentElement;
      if (bento?.matches(".ds-bento[data-squares]")) placeBento(bento);
    }
  });
  for (const bento of bentos) {
    placeBento(bento);
    observer.observe(bento, { childList: true, subtree: false, attributes: true, attributeFilter: ["data-place", "hidden"] });
    for (const tile of bento.children) observer.observe(tile, { attributes: true, attributeFilter: ["data-place", "hidden"] });
  }
  return () => observer.disconnect();
}
