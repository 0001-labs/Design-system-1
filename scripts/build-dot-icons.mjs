// Draws the dot icons: everyday money in the dot matrix of Olivetti Dot.
// Each icon is a 7 x 7 bitmap, read top row first ("#" is a dot), set on a
// two-unit pitch in the 16-unit frame (x and y = 2, 4 … 14). A dot's
// diameter is 91% of its pitch, as in the font, where a 100-unit dot sits on
// a 110-unit pitch.
// Run: node scripts/build-dot-icons.mjs [--sheet FILE.html]
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const PITCH = 2;
const R = 0.91;

export const dotIcons = {
  "dot-coin": [
    "..###..",
    ".#...#.",
    "#.##..#",
    "#..#..#",
    "#..#..#",
    ".#...#.",
    "..###..",
  ],
  "dot-coins": [
    ".#####.",
    "#.....#",
    ".#####.",
    "#.....#",
    ".#####.",
    "#.....#",
    ".#####.",
  ],
  "dot-banknote": [
    ".......",
    "#######",
    "#..#..#",
    "#.#.#.#",
    "#..#..#",
    "#######",
    ".......",
  ],
  "dot-banknotes": [
    ".######",
    "......#",
    "######.",
    "#..#.#.",
    "#.#.##.",
    "#..#.#.",
    "######.",
  ],
  "dot-wallet": [
    "..####.",
    ".#....#",
    "#######",
    "#....##",
    "#...#.#",
    "#....##",
    "#######",
  ],
  "dot-card": [
    ".......",
    "#######",
    "#.....#",
    "#######",
    "#.....#",
    "#.##..#",
    "#######",
  ],
  "dot-bank": [
    "...#...",
    ".##.##.",
    "#######",
    ".#.#.#.",
    ".#.#.#.",
    ".#.#.#.",
    "#######",
  ],
  "dot-receipt": [
    ".#####.",
    ".#...#.",
    ".#.#.#.",
    ".#...#.",
    ".#.#.#.",
    ".#...#.",
    ".#.#.#.",
  ],
  "dot-safe": [
    "#######",
    "#.....#",
    "#.###.#",
    "#.#.###",
    "#.###.#",
    "#.....#",
    "#######",
  ],
  // Faces (Joachim, 19 October 2026: how much room a budget has): the coin's round outline,
  // two eyes, and a smile, a straight mouth or a frown.
  "dot-happy": [
    "..###..",
    ".#...#.",
    "#.#.#.#",
    "#.....#",
    "#.#.#.#",
    ".#.#.#.",
    "..###..",
  ],
  "dot-neutral": [
    "..###..",
    ".#...#.",
    "#.#.#.#",
    "#.....#",
    "#.###.#",
    ".#...#.",
    "..###..",
  ],
  "dot-sad": [
    "..###..",
    ".#...#.",
    "#.#.#.#",
    "#.....#",
    "#..#..#",
    ".##.##.",
    "..###..",
  ],
  "dot-transfer": [
    "....#..",
    "######.",
    "....#..",
    ".......",
    "..#....",
    ".######",
    "..#....",
  ],
};

export function dotIconSvg(rows) {
  if (rows.length !== 7 || rows.some((row) => row.length !== 7)) throw new Error("A dot icon is 7 x 7");
  const dots = rows.flatMap((row, j) =>
    [...row].flatMap((c, i) => (c === "#" ? [`<circle cx="${2 + i * PITCH}" cy="${2 + j * PITCH}" r="${R}"/>`] : [])),
  );
  return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">\n<g fill="currentColor">${dots.join("")}</g>\n</svg>\n`;
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  const sheet = process.argv.indexOf("--sheet");
  if (sheet > 0) {
    const cells = Object.entries(dotIcons)
      .map(([name, rows]) => {
        const svg = dotIconSvg(rows);
        return `<figure><div class="big">${svg}</div><div>${svg}${svg.replace('width="16" height="16"', 'width="32" height="32"')}</div><figcaption>${name}</figcaption></figure>`;
      })
      .join("");
    writeFileSync(
      process.argv[sheet + 1],
      `<!doctype html><meta charset="utf-8"><style>body{margin:20px;font:12px sans-serif;display:flex;flex-wrap:wrap;gap:20px;background:#fff;color:#1e1e1e}.dark{background:#1e1e1e;color:#fff}figure{margin:0;text-align:center}.big svg{width:96px;height:96px}div{display:flex;gap:8px;align-items:center;justify-content:center}</style><body>${cells}</body>`,
    );
  } else {
    const root = new URL("../DS1/x-icon/", import.meta.url);
    for (const [name, rows] of Object.entries(dotIcons)) writeFileSync(new URL(`${name}.svg`, root), dotIconSvg(rows));
    console.log(`${Object.keys(dotIcons).length} dot icons written to DS1/x-icon`);
  }
}
