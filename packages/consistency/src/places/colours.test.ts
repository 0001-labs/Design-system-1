import { describe, expect, it } from "vite-plus/test";
import { addTallies, hexOf, namesOf, parseColour, shareOf, tallyColours } from "./colours";

// Ported from the sites' own editor's tests (team-cms/tests/app-pages.test.ts, deleted 26 October 2026).
describe("colours in use", () => {
  it("reads the forms the browser computes colours in", () => {
    expect(parseColour("rgb(42, 42, 42)")).toEqual({ r: 42, g: 42, b: 42, a: 1 });
    expect(parseColour("rgba(255, 0, 0, 0.5)")).toEqual({ r: 255, g: 0, b: 0, a: 0.5 });
    expect(parseColour("rgb(0 128 255 / 25%)")).toEqual({ r: 0, g: 128, b: 255, a: 0.25 });
    expect(parseColour("color(srgb 1 0.5 0)")).toEqual({ r: 255, g: 127.5, b: 0, a: 1 });
    expect(parseColour("#0af")).toEqual({ r: 0, g: 170, b: 255, a: 1 });
    expect(parseColour("transparent")).toEqual({ r: 0, g: 0, b: 0, a: 0 });
    expect(parseColour("oklch(0.6 0.1 200)")).toBeNull();
  });

  it("writes a colour as one hex, and none for a colour that cannot be seen", () => {
    expect(hexOf({ r: 42, g: 42, b: 42, a: 1 })).toBe("#2a2a2a");
    expect(hexOf({ r: 255, g: 127.5, b: 0, a: 1 })).toBe("#ff8000");
    expect(hexOf({ r: 255, g: 0, b: 0, a: 0.5 })).toBe("#ff000080");
    expect(hexOf({ r: 0, g: 0, b: 0, a: 0 })).toBeNull();
    expect(hexOf(parseColour("rgba(0, 0, 0, 0)")!)).toBeNull();
  });

  it("counts each colour once an element, the most used first", () => {
    const tally = tallyColours([["#2a2a2a", "#ffffff"], ["#2a2a2a", "#2a2a2a"], ["#594dff"], ["#2a2a2a", "#594dff"]]);
    expect(tally).toEqual([
      { hex: "#2a2a2a", elements: 3 },
      { hex: "#594dff", elements: 2 },
      { hex: "#ffffff", elements: 1 },
    ]);
    expect([...addTallies(new Map([["#ffffff", 4]]), tally)]).toEqual([["#ffffff", 5], ["#2a2a2a", 3], ["#594dff", 2]]);
  });

  it("names a colour by every token whose value it is, Design system 1's first", () => {
    const tokens: [string, string][] = [["--cph-ink", "#2a2a2a"], ["--one-black", "#2a2a2a"], ["--ds-text-color", "#2a2a2a"], ["--ds-paper", "#ffffff"]];
    expect(namesOf("#2a2a2a", tokens)).toEqual(["--ds-text-color", "--one-black", "--cph-ink"]);
    expect(namesOf("#123456", tokens)).toEqual([]);
  });

  it("writes a share of the elements", () => {
    expect(shareOf(34, 100)).toBe("34%");
    expect(shareOf(1, 400)).toBe("under 1%");
    expect(shareOf(0, 0)).toBe("0%");
  });
});
