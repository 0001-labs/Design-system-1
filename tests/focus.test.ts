// @vitest-environment happy-dom
import { afterEach, expect, test } from "vite-plus/test";
import { CENTRE, focusFromRegions, focusImage, focusOf, objectPosition } from "../DS1/0-face/focus";
afterEach(() => document.body.replaceChildren());

/** A picture `width` × `height` in one colour, with rectangles painted on it. */
function picture(width: number, height: number, ground: number[], ...shapes: { x: number; y: number; w: number; h: number; rgb: number[] }[]) {
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const shape = shapes.find(s => x >= s.x && x < s.x + s.w && y >= s.y && y < s.y + s.h);
      pixels.set([...(shape?.rgb ?? ground), 255], (y * width + x) * 4);
    }
  }
  return pixels;
}

const skin = [224, 172, 140];
const darkSkin = [141, 85, 60];
const water = [70, 110, 150];

test("a face is the focus, above the hands", () => {
  const face = { x: 28, y: 4, w: 10, h: 12, rgb: skin };
  const hands = { x: 30, y: 40, w: 14, h: 5, rgb: skin };
  const focus = focusOf(picture(64, 48, water, face, hands), 64, 48);
  expect(focus.x).toBeCloseTo(33 / 64, 1);
  expect(focus.y).toBeLessThan(0.3);
});

test("darker skin is found as well", () => {
  const focus = focusOf(picture(64, 48, water, { x: 8, y: 6, w: 10, h: 12, rgb: darkSkin }), 64, 48);
  expect(focus.x).toBeLessThan(0.3);
  expect(focus.y).toBeLessThan(0.35);
});

test("without a face, the detail is the focus, drawn towards the middle", () => {
  const ground = [120, 120, 120];
  const checks = Array.from({ length: 8 }, (_, i) => ({ x: 44 + (i % 4) * 4, y: 34 + Math.floor(i / 4) * 6, w: 2, h: 2, rgb: [255, 255, 255] }));
  const focus = focusOf(picture(64, 48, ground, ...checks), 64, 48);
  expect(focus.x).toBeGreaterThan(0.6);
  expect(focus.x).toBeLessThan(0.9);
  expect(focus.y).toBeGreaterThan(0.6);
});

test("a picture of one colour keeps its middle", () => {
  expect(focusOf(picture(16, 16, [10, 200, 10]), 16, 16)).toEqual(CENTRE);
});

test("the focus is written as object-position in whole percents", () => {
  expect(objectPosition({ x: 0.5, y: 0.183 })).toBe("50% 18%");
});

test("a chosen focus is used as it is", () => {
  const image = document.createElement("img");
  image.dataset.dsFocus = "40% 20%";
  focusImage(image);
  expect(image.style.objectPosition).toBe("40% 20%");
});

test("faces from a detector are the focus, with room above the highest", () => {
  const focus = focusFromRegions({ faces: [{ x: 0.4, y: 0.2, w: 0.2, h: 0.2 }], salient: [{ x: 0, y: 0.5, w: 1, h: 0.5 }] })!;
  expect(focus.x).toBeCloseTo(0.5);
  expect(focus.y).toBeCloseTo(0.13);
});

test("a tiny face far off is left out beside a big one", () => {
  const focus = focusFromRegions({ faces: [{ x: 0.1, y: 0.3, w: 0.2, h: 0.25 }, { x: 0.9, y: 0.05, w: 0.02, h: 0.02 }] })!;
  expect(focus.x).toBeCloseTo(0.2);
});

test("without faces, the middle of what is salient", () => {
  expect(focusFromRegions({ salient: [{ x: 0.6, y: 0.2, w: 0.2, h: 0.4 }] })).toEqual({ x: 0.7, y: 0.4 });
  expect(focusFromRegions({})).toBeUndefined();
});
