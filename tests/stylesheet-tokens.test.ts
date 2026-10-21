import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vite-plus/test";
import { measures } from "../DS1/1-root/measures";

// Every stylesheet in DS1 reads custom properties that exist and draws its sizes from measures.ts.

const root = fileURLToPath(new URL("../DS1/", import.meta.url));
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) =>
    statSync(join(dir, name)).isDirectory() ? walk(join(dir, name)) : [join(dir, name)],
  );
const sources = walk(root).filter(
  (file) => /\.(css|ts)$/.test(file) && !file.includes("/generated/"),
);
const sheets = sources.filter((file) => file.endsWith(".css"));
const at = (file: string) => relative(root, file);
/** A stylesheet without its comments, each comment blanked so line numbers still match. */
const read = (file: string) =>
  readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, (comment) =>
    comment.replace(/[^\n]/g, " "),
  );
const lineOf = (text: string, index: number) => text.slice(0, index).split("\n").length;
/** Every `property: value` in a stylesheet, with the line it starts on. */
const declarations = (file: string) => {
  const text = read(file);
  return [...text.matchAll(/(?<![\w-])(--[\w-]+|[a-z-]+)\s*:\s*([^;{}]+)(?=[;}])/g)].map((m) => ({
    property: m[1],
    value: m[2].trim(),
    line: lineOf(text, m.index),
  }));
};

/** Names DS1 gives a value somewhere: in a stylesheet, an inline style, `setProperty` or a style object. */
const declared = new Set<string>();
for (const file of sources) {
  const text = readFileSync(file, "utf8");
  for (const m of text.matchAll(/(?<![\w(-])(--[\w-]+)\s*['"`]?\s*:/g)) declared.add(m[1]);
  for (const m of text.matchAll(/setProperty\(\s*['"`](--[\w-]+)/g)) declared.add(m[1]);
}

/**
 * Hooks from before the `--ds-` names, read with a fallback for pages that still set them. A new
 * hook a page sets takes a `--ds-` name, so it never picks up a page's own custom property.
 */
const legacyHooks = new Set([
  "--button-color",
  "--input-readonly-background",
  "--input-filled-background",
  "--surface-color-secondary",
  "--border-color",
  "--font-regular",
]);

describe("Custom properties", () => {
  test("a var() without a fallback reads a property DS1 declares", () => {
    const unknown: string[] = [];
    for (const file of sheets) {
      for (const { property, value, line } of declarations(file)) {
        // `--a: var(--ds-b)` passes a hook on: unset, it leaves --a unset for its reader's own fallback.
        const passedOn = property.startsWith("--") && /^var\(\s*--ds-[\w-]+\s*\)$/.test(value);
        for (const m of value.matchAll(/var\(\s*(--[\w-]+)\s*\)/g)) {
          if (!declared.has(m[1]) && !passedOn) unknown.push(`${at(file)}:${line} ${m[1]}`);
        }
      }
    }
    expect(unknown).toEqual([]);
  });

  test("a hook nothing in DS1 declares has a --ds- name", () => {
    const stray: string[] = [];
    for (const file of sources) {
      const text = read(file);
      for (const m of text.matchAll(/var\(\s*(--[\w-]+)\s*,/g)) {
        const name = m[1];
        if (!declared.has(name) && !name.startsWith("--ds-") && !legacyHooks.has(name))
          stray.push(`${at(file)}:${lineOf(text, m.index)} ${name}`);
      }
    }
    expect(stray).toEqual([]);
  });

  test("every legacy hook is still read somewhere", () => {
    const text = sources.map((file) => readFileSync(file, "utf8")).join("\n");
    for (const name of legacyHooks) expect(text, name).toContain(`var(${name},`);
  });
});

// The design-system-1 skill's own measures that measures.ts does not carry.
/** The spare four above the sixteen: the inset of words in a pressed item, and the gap between tabs. */
const spare = measures.square - measures.control;
/** A row's press layer hugs the icon tiles with 6px corners; a sidebar's highlighted row has 2px ones. */
const rowFillRadius = 6;
const sidebarRadius = 2;
/** A corner this large or larger draws a pill or a circle. */
const round = 999;
const oneOf = (px: number, ...values: number[]) => values.includes(px);

/** What each kind of property may measure, in pixels at a scale of 1. */
const kinds: { name: string; property: RegExp; allows: (px: number) => boolean }[] = [
  {
    name: "size",
    property: /^(min-|max-)?(width|height|inline-size|block-size)$|^flex-basis$/,
    allows: (px) =>
      px % measures.half === 0 ||
      oneOf(px, measures.control, measures.item.width, measures.item.height, measures.line),
  },
  {
    name: "gap",
    property: /^(row-|column-)?gap$/,
    // Items a pixel apart (a square's pitch), groups two pixels apart, tabs four apart.
    allows: (px) => px % measures.half === 0 || oneOf(px, measures.line, 2 * measures.line, spare),
  },
  {
    name: "type",
    property: /^font-size$/,
    allows: (px) => oneOf(px, ...Object.values(measures.type)),
  },
  {
    name: "leading",
    property: /^line-height$/,
    allows: (px) => px === measures.leading || px === measures.row,
  },
  {
    name: "corner",
    property: /^border(-[a-z]+)*-radius$/,
    allows: (px) =>
      px === 0 || px >= round || oneOf(px, measures.radius, rowFillRadius, sidebarRadius),
  },
];

/**
 * Values off those measures, each with why. A drawn mark inside a control (a check, a dot, a
 * chevron) keeps its own geometry. Take an entry out when its value moves onto the measures.
 */
const offMeasures: Record<string, string> = {
  "1-root/controls.css height 2": "an indeterminate checkbox's dash",
  "1-root/controls.css width 12": "a menu entry's check and chevron marks",
  "1-root/controls.css height 12": "a menu entry's check and chevron marks",
  "1-root/one.css height 9": "the move grip on a column header",
  "1-root/progress.css width 4": "a progress dot, a fifth of the square",
  "1-root/progress.css height 4": "a progress dot, a fifth of the square",
  "1-root/prose.css type 17": "prose h2, between text and the display title",
  "1-root/prose.css type 15": "prose h3, between text and the display title",
  "2-core/chart/chart.css width 5": "a chart's point marks",
  "2-core/chart/chart.css height 5": "a chart's point marks",
  "2-core/styles/ds-checkbox.css height 2": "an indeterminate checkbox's dash",
  "2-core/styles/ds-input.css height 18": "a row input: 2px above an 18px field make up its square",
  "2-core/styles/ds-input.css width 24": "a password field's reveal button",
  "2-core/styles/ds-toast.css width 14": "the page toaster's inline icons",
  "2-core/styles/ds-toast.css height 14": "the page toaster's inline icons",
  "2-core/styles/ds-toast.css corner 1": "a toast button's focus ring",
  "3-unit/styles/ds-list.css gap 8": "columns of a list: off the grid, to be decided",
  "3-unit/styles/ds-matrix.css width 7": "a matrix's cell marks",
  "3-unit/styles/ds-matrix.css height 7": "a matrix's cell marks",
  "3-unit/styles/ds-matrix.css width 8": "a matrix's cell marks",
  "3-unit/styles/ds-matrix.css height 8": "a matrix's cell marks",
  "3-unit/styles/ds-matrix.css width 9": "a matrix's cell marks",
};

/** A length that stands as a measure: not one added to or taken from another in a calc(). */
const lengths = (value: string) =>
  [...value.matchAll(/(?<![\w.-])(-?\d*\.?\d+)px/g)]
    .filter((m) => !/[+-]\s+$/.test(value.slice(0, m.index)))
    .map((m) => Math.abs(Number(m[1])));

describe("Measures in the stylesheets", () => {
  const found = new Map<string, string[]>();
  for (const file of sheets) {
    for (const { property, value, line } of declarations(file)) {
      const kind = kinds.find((k) => k.property.test(property));
      if (!kind) continue;
      for (const px of lengths(value)) {
        if (kind.allows(px)) continue;
        const key = `${at(file)} ${kind.name === "size" ? property.replace(/^(min|max)-/, "") : kind.name} ${px}`;
        found.set(key, [...(found.get(key) ?? []), `${at(file)}:${line} ${property}: ${value}`]);
      }
    }
  }

  test("sizes, gaps, type, leading and corners come from measures.ts", () => {
    expect(
      [...found].filter(([key]) => !(key in offMeasures)).flatMap(([, places]) => places),
    ).toEqual([]);
  });

  test("every value recorded off the measures is still in its stylesheet", () => {
    expect(Object.keys(offMeasures).filter((key) => !found.has(key))).toEqual([]);
  });
});
