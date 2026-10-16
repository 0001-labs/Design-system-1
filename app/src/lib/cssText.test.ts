import { readFileSync } from "node:fs";

import { describe, expect, it } from "vite-plus/test";

import { matchingBrace, readCustomProperty, replaceCustomProperty, rootBlockRange } from "./cssText";

const STOCK_SHEET = new URL("../../../DS1/1-root/one.semantic.css", import.meta.url);
const stock = () => readFileSync(STOCK_SHEET, "utf8");

/** A dark-mode override above `:root` — the shape that used to corrupt drafts. */
const DARK_BLOCK_ABOVE_ROOT = [
  "@media (prefers-color-scheme: dark) {",
  "  :root {",
  "    --one-accent-color: #99ccff;",
  "    --one-radius: 2px;",
  "  }",
  "}",
  "",
].join("\n");

describe("rootBlockRange", () => {
  it("finds the block in the stock stylesheet", () => {
    const css = stock();
    const range = rootBlockRange(css);

    expect(range).not.toBeNull();
    const body = css.slice(range!.start, range!.end);
    expect(body).toContain("--one-accent-color");
    expect(body).toContain("--one-page-width");
    // The block must stop before the Reset section that follows it.
    expect(body).not.toContain("box-sizing");
  });

  it("returns null when there is no :root at all", () => {
    expect(rootBlockRange("a{color:red}")).toBeNull();
  });

  it("is not fooled by the substring :rooted", () => {
    expect(rootBlockRange(".rooted{color:red}")).toBeNull();
  });

  it("handles a grouped selector", () => {
    const css = ":root, :host {\n  --x: 1px;\n}";
    const range = rootBlockRange(css);
    expect(css.slice(range!.start, range!.end)).toContain("--x: 1px;");
  });
});

describe("matchingBrace", () => {
  it("ignores braces inside comments", () => {
    const css = ":root{ /* } not the end */ --x: 1px; }";
    expect(matchingBrace(css, css.indexOf("{"))).toBe(css.length - 1);
  });

  it("ignores braces inside quoted values", () => {
    const css = ':root{ --x: "}"; }';
    expect(matchingBrace(css, css.indexOf("{"))).toBe(css.length - 1);
  });

  it("handles nesting", () => {
    const css = "@media screen { :root { --x: 1px; } }";
    expect(matchingBrace(css, css.indexOf("{"))).toBe(css.length - 1);
  });

  it("returns -1 when the block never closes", () => {
    expect(matchingBrace(":root{ --x: 1px;", 5)).toBe(-1);
  });
});

describe("replaceCustomProperty", () => {
  it("rewrites a token in the stock stylesheet", () => {
    const next = replaceCustomProperty(stock(), "--one-accent-color", "#ff0066");
    expect(readCustomProperty(next, "--one-accent-color")).toBe("#ff0066");
  });

  it("preserves the rest of the stylesheet byte for byte", () => {
    const css = stock();
    const radius = readCustomProperty(css, "--one-radius")!;
    const next = replaceCustomProperty(css, "--one-radius", "13px");

    expect(next).not.toBe(css);
    expect(next.length - css.length).toBe("13px".length - radius.length);
    // Undoing that single declaration must restore the file exactly, which is
    // only true if nothing else moved — including the token's own alignment.
    expect(next.replace(/(--one-radius:\s*)13px;/, (_, name: string) => `${name}${radius};`)).toBe(css);
  });

  // The regression this whole module exists for. Before the fix, an unanchored
  // first-match regex rewrote the declaration inside the @media block and left
  // the real :root untouched, permanently once drafts are persisted.
  it("edits the real :root, not an earlier @media override", () => {
    const css = DARK_BLOCK_ABOVE_ROOT + stock();
    const next = replaceCustomProperty(css, "--one-accent-color", "#ff0066");

    // The dark-mode override is untouched...
    expect(next).toContain("--one-accent-color: #99ccff;");
    // ...and the value the controls actually bind to did change.
    expect(readCustomProperty(next, "--one-accent-color")).toBe("#ff0066");
  });

  it("is a fixed point across repeated edits", () => {
    const css = DARK_BLOCK_ABOVE_ROOT + stock();
    let next = css;
    for (const value of ["#111111", "#222222", "#333333"]) {
      next = replaceCustomProperty(next, "--one-accent-color", value);
      expect(readCustomProperty(next, "--one-accent-color")).toBe(value);
    }
    // Exactly one occurrence was ever rewritten.
    expect(next.match(/--one-accent-color:/g)?.length).toBe(
      css.match(/--one-accent-color:/g)?.length,
    );
  });

  it("leaves the source alone when the property is not declared in :root", () => {
    const css = ":root{ --a: 1px; }\n.x{ --b: 2px; }";
    expect(replaceCustomProperty(css, "--b", "9px")).toBe(css);
  });

  it("does not confuse a token with a longer token sharing its prefix", () => {
    const css = ":root{\n  --one-font: Arial;\n  --one-font-size: 16px;\n}";
    const next = replaceCustomProperty(css, "--one-font", "Georgia");

    expect(readCustomProperty(next, "--one-font")).toBe("Georgia");
    expect(readCustomProperty(next, "--one-font-size")).toBe("16px");
  });

  it("treats a dollar sign in the value literally", () => {
    const css = ':root{ --label: "a"; }';
    expect(readCustomProperty(replaceCustomProperty(css, "--label", '"$&$1"'), "--label")).toBe('"$&$1"');
  });

  it("falls back to a whole-file replace when there is no :root", () => {
    const css = ".theme{ --x: 1px; }";
    expect(replaceCustomProperty(css, "--x", "4px")).toContain("--x: 4px;");
  });
});

describe("readCustomProperty", () => {
  it("reads every token the workbench binds to", () => {
    const css = stock();
    for (const token of ["--one-accent-color", "--one-radius", "--one-unit", "--one-page-width", "--one-font"]) {
      expect(readCustomProperty(css, token), token).toBeTruthy();
    }
  });

  it("reads from :root, not from an earlier @media override", () => {
    const css = DARK_BLOCK_ABOVE_ROOT + stock();
    expect(readCustomProperty(css, "--one-accent-color")).not.toBe("#99ccff");
    expect(readCustomProperty(css, "--one-radius")).not.toBe("2px");
  });

  it("returns undefined for a token that is not declared", () => {
    expect(readCustomProperty(stock(), "--one-nonexistent")).toBeUndefined();
  });

  it("round-trips every write through a read", () => {
    const css = DARK_BLOCK_ABOVE_ROOT + stock();
    const writes: Array<[string, string]> = [
      ["--one-accent-color", "#0a0a0a"],
      ["--one-radius", "3px"],
      ["--one-unit", "27px"],
      ["--one-page-width", "60rem"],
    ];

    const next = writes.reduce((acc, [name, value]) => replaceCustomProperty(acc, name, value), css);

    for (const [name, value] of writes) {
      expect(readCustomProperty(next, name), name).toBe(value);
    }
  });
});
