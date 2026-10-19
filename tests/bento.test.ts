// @vitest-environment happy-dom
import { afterEach, expect, test } from "vite-plus/test";
import { bentoPlace, bentoReach, placeBento } from "../DS1/0-face/bento";
await import("../DS1/3-unit/ds-bento");
afterEach(() => document.body.replaceChildren());

test("a tile's place is four whole numbers with a size", () => {
  expect(bentoPlace("0 0 15 7")).toEqual([0, 0, 15, 7]);
  expect(bentoPlace("16,0,16,20")).toEqual([16, 0, 16, 20]);
  expect(bentoPlace("0 0 0 7")).toBeUndefined();
  expect(bentoPlace("0 0 1.5 7")).toBeUndefined();
  expect(bentoPlace("0 0 15")).toBeUndefined();
  expect(bentoPlace(null)).toBeUndefined();
});

test("a tile reaches towards each tile a square away that it overlaps along that side", () => {
  // Ezo's first rows: archive and home on the left, ezo in the middle, stats on the right.
  const reach = bentoReach([[0, 0, 15, 7], [16, 0, 16, 20], [33, 0, 15, 12], [0, 8, 15, 12]]);
  expect(reach[0]).toEqual({ start: false, top: false, end: true, bottom: true });
  expect(reach[1]).toEqual({ start: true, top: false, end: true, bottom: false });
  expect(reach[2]).toEqual({ start: true, top: false, end: false, bottom: false });
  expect(reach[3]).toEqual({ start: false, top: true, end: true, bottom: false });
});

test("placing a squares bento sets each tile's square and reach", () => {
  document.body.innerHTML = '<div class="ds-bento" data-squares><a data-place="0 0 15 7"></a><a data-place="16 0 16 20"></a><a hidden data-place="0 8 15 7"></a><a></a></div>';
  placeBento(document.querySelector<HTMLElement>(".ds-bento")!);
  const [first, second, hidden, unplaced] = [...document.querySelectorAll<HTMLElement>("a")];
  expect(first!.style.getPropertyValue("--ds-bento-w")).toBe("15");
  expect(first!.style.getPropertyValue("--ds-bento-end")).toBe("1");
  expect(first!.style.getPropertyValue("--ds-bento-bottom")).toBe("0");
  expect(second!.style.getPropertyValue("--ds-bento-x")).toBe("16");
  expect(second!.style.getPropertyValue("--ds-bento-start")).toBe("1");
  expect(hidden!.style.getPropertyValue("--ds-bento-x")).toBe("");
  expect(unplaced!.style.getPropertyValue("--ds-bento-x")).toBe("");
});

test("the element reflects its columns and places its tiles on squares", async () => {
  document.body.innerHTML = '<ds-bento squares columns="32"><ds-card data-place="0 0 15 7"></ds-card><ds-card data-place="16 0 16 15"></ds-card></ds-bento>';
  const bento = document.querySelector("ds-bento")!;
  await bento.updateComplete;
  expect(bento.style.getPropertyValue("--ds-bento-columns")).toBe("32");
  expect(document.querySelector<HTMLElement>("ds-card")!.style.getPropertyValue("--ds-bento-end")).toBe("1");
});
