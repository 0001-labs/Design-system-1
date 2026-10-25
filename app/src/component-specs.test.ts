import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vite-plus/test";
import { baseOverrides, TOKENS_END, TOKENS_START } from "../../shared/base-sheet";
import { setLibraryToken } from "./lib/libraryTokens";
import { COLOURS, COMPONENTS, TEXT_SIZES, componentSpec, readLength, readWidth, tokenValue, type ComponentProperty } from "./component-specs";

const stylesheet = (tag: string) => readFileSync(fileURLToPath(new URL(`../../DS1/2-core/styles/${tag}.css`, import.meta.url)), "utf8");
const properties = COMPONENTS.flatMap(spec => spec.properties.map(property => ({ spec, property })));

/** Every value the editor can write for a property. */
function values(property: ComponentProperty): string[] {
  switch (property.kind) {
    case "width": return [...new Set([1, property.min!, property.max!, Number(property.default)].flatMap(squares => property.modes!.map(mode => tokenValue(property, { mode, squares }))))];
    case "text": return TEXT_SIZES.map(size => tokenValue(property, size.value));
    case "colour": return COLOURS.map(option => tokenValue(property, option.value));
    default: {
      const written: string[] = [];
      for (let px = property.min!; px <= property.max!; px += property.step!) written.push(tokenValue(property, px));
      return written;
    }
  }
}

describe("component specs", () => {
  test("every token is a component's own --ds- token, named once", () => {
    const tokens = properties.map(({ property }) => property.token);
    expect(new Set(tokens).size).toBe(tokens.length);
    for (const { spec, property } of properties) expect(property.token, property.token).toMatch(new RegExp(`^--${spec.tag}-`));
  });

  test("every token is read by its component's stylesheet with a fallback", () => {
    for (const { spec, property } of properties) {
      const css = stylesheet(spec.tag) + (spec.tag === "ds-button" ? stylesheet("ds-button-host") : "");
      expect(css, property.token).toMatch(new RegExp(`var\\(${property.token}[,)]`));
    }
  });

  test("every value the editor can write is one the live sheet carries", () => {
    for (const { property } of properties) {
      for (const value of values(property)) {
        const css = setLibraryToken(":root { --ds-sf: 1; }\n", property.token, value || "initial");
        const result = baseOverrides(css);
        expect(result, `${property.token}: ${value}`).toEqual({ overrides: [[property.token, value || "initial"]] });
      }
    }
    // A whole set of edits together is one valid block.
    let css = "";
    for (const { property } of properties) {
      const value = values(property).find(Boolean);
      if (value) css = setLibraryToken(css, property.token, value);
    }
    expect(css).toContain(TOKENS_START);
    expect(css).toContain(TOKENS_END);
    const result = baseOverrides(css);
    expect("overrides" in result && result.overrides.length).toBe(properties.length);
  });

  test("heights stand on whole squares: a control's face N × 20 − 4, a field's N × 20", () => {
    const button = componentSpec("button").properties.find(p => p.token === "--ds-button-size")!;
    expect([16, 25, 30, 36, 47, 56, 90].map(px => tokenValue(button, px))).toEqual(["", "", "36px", "36px", "56px", "56px", "56px"]);
    const input = componentSpec("input").properties.find(p => p.token === "--ds-input-size")!;
    expect([20, 31, 40, 60, 0].map(px => tokenValue(input, px))).toEqual(["", "40px", "40px", "60px", ""]);
  });

  test("lengths keep their step and range, and the default writes nothing", () => {
    const padding = componentSpec("button").properties.find(p => p.token === "--ds-button-padding-size")!;
    expect([4, 5, 7, 0, -8, 100].map(px => tokenValue(padding, px))).toEqual(["", "", "8px", "0px", "0px", "40px"]);
    expect(readLength(padding, "12px")).toBe(12);
    expect(readLength(padding, undefined)).toBe(4);
    const box = componentSpec("checkbox").properties.find(p => p.token === "--ds-checkbox-size")!;
    expect(tokenValue(box, 40)).toBe("20px");
  });

  test("widths hug, fill or stand fixed in whole squares", () => {
    const width = componentSpec("button").properties.find(p => p.kind === "width")!;
    expect(tokenValue(width, { mode: "hug", squares: 6 })).toBe("");
    expect(tokenValue(width, { mode: "fill", squares: 6 })).toBe("100%");
    expect(tokenValue(width, { mode: "fixed", squares: 6.4 })).toBe("calc(6 * var(--ds-unit, 20px))");
    expect(readWidth(width, "calc(6 * var(--ds-unit, 20px))")).toEqual({ mode: "fixed", squares: 6 });
    expect(readWidth(width, "100%").mode).toBe("fill");
    expect(readWidth(width, undefined).mode).toBe("hug");
    const field = componentSpec("input").properties.find(p => p.kind === "width")!;
    expect(readWidth(field, undefined).mode).toBe("fill");
    expect(tokenValue(field, { mode: "fill", squares: 12 })).toBe("");
  });

  test("an unknown component opens the first", () => {
    expect(componentSpec("nope").id).toBe("button");
    expect(componentSpec("tag").name).toBe("Tag");
    expect(componentSpec("/2-core/switch/").id).toBe("switch");
  });
});
