import { readdirSync, readFileSync } from "node:fs";
import { expect, test } from "vite-plus/test";

// An icon is drawn in a square box (a mask, an <img>, a native image), so its canvas is square:
// a wide one is placed at the box's top, as left.svg's 16 by 9 stood above right.svg's arrow.
test("every icon is drawn on a square canvas", () => {
  const notSquare = readdirSync("DS1/x-icon")
    .filter((name) => name.endsWith(".svg"))
    .filter((name) => {
      const box = /viewBox="([^"]+)"/.exec(readFileSync(`DS1/x-icon/${name}`, "utf8"))?.[1].split(/[\s,]+/).map(Number);
      return !box || box[2] !== box[3];
    });
  expect(notSquare).toEqual([]);
});

test("the left and right arrows stand on the same line", () => {
  const ys = (name: string) => {
    const d = /d="([^"]+)"/.exec(readFileSync(`DS1/x-icon/${name}.svg`, "utf8"))![1];
    const points = [...d.matchAll(/[ML]\s*(-?[\d.]+(?:e-?\d+)?)[\s,]+(-?[\d.]+(?:e-?\d+)?)/g)].map((m) => Number(m[2]));
    return [Math.min(...points), Math.max(...points)];
  };
  const [top, bottom] = ys("right");
  const [leftTop, leftBottom] = ys("left");
  expect(leftTop).toBeCloseTo(top, 2);
  expect(leftBottom).toBeCloseTo(bottom, 2);
});
