import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import * as csstree from "css-tree";
import { describe, expect, it } from "vite-plus/test";
import { prepareLibrary, validateCss } from "../src/index";
import { LIBRARY_BUTTON_LINK_BASE, LIBRARY_REVISION, LIBRARY_SELECTORS, LIBRARY_TOKENS, libraryRevision, libraryStamp } from "../../../DS1/1-root/library-tokens";

const root = join(import.meta.dirname, "../../..");
const read = (path: string) => readFileSync(join(root, path), "utf8");
const componentSources = () => {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(join(root, dir), { withFileTypes: true })) {
      const path = `${dir}/${entry.name}`;
      if (entry.isDirectory()) walk(path);
      else if (/\.(css|ts)$/.test(entry.name)) files.push(read(path));
    }
  };
  for (const dir of ["DS1/1-root", "DS1/2-core", "DS1/3-unit"]) walk(dir);
  return files.join("\n");
};

/** [ids, classes, types] of one selector, with :where() as nothing and :is()/:not() as their most specific argument. */
function specificity(selector: string): [number, number, number] {
  const score = (node: csstree.CssNode): [number, number, number] => {
    const total: [number, number, number] = [0, 0, 0];
    const add = (part: [number, number, number]) => { for (const i of [0, 1, 2] as const) total[i] += part[i]; };
    csstree.walk(node, {
      enter(this: csstree.WalkContext, child: csstree.CssNode) {
        if (child.type === "IdSelector") add([1, 0, 0]);
        else if (child.type === "ClassSelector" || child.type === "AttributeSelector") add([0, 1, 0]);
        else if (child.type === "TypeSelector" && child.name !== "*") add([0, 0, 1]);
        else if (child.type === "PseudoElementSelector") add([0, 0, 1]);
        else if (child.type === "PseudoClassSelector") {
          const name = child.name.toLowerCase();
          if (["is", "not", "has"].includes(name) && child.children) {
            const options = child.children.toArray().flatMap(list => list.type === "SelectorList" ? list.children.toArray() : [list]).map(score);
            add(options.reduce((best, next) => (next[0] - best[0] || next[1] - best[1] || next[2] - best[2]) > 0 ? next : best, [0, 0, 0]));
          } else if (name !== "where") add([0, 1, 0]);
          return csstree.walk.skip;
        }
      },
    });
    return total;
  };
  return score(csstree.parse(selector, { context: "selector" }));
}

const library = [
  '@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap");',
  ':root {',
  '  --one-accent-color: #d357fe;',
  '  --one-radius: 8px !important;',
  '  --one-font-size: 16px;',
  '  --ds-paper: #fafafa;',
  '  --one-background: #ffffff;',
  '}',
  '@media (prefers-color-scheme: dark) { :root { --one-accent-color: #8a2be2; } }',
  ':where(button) { border-radius: calc(var(--one-radius) * var(--sf, 1)); background: var(--one-accent-color); }',
  'button[variant="neutral"]:hover, nav a, button:disabled, input:disabled { opacity: 0.5; }',
  'a[data-library-button].own { color: blue; }',
  '@keyframes pulse { from { opacity: 0; } to { opacity: 1; } }',
].join("\n");

describe("the component token bridge", () => {
  it("is stamped with the revision of its own rules", () => {
    const hash = createHash("sha256").update(JSON.stringify({ tokens: LIBRARY_TOKENS, selectors: LIBRARY_SELECTORS, base: LIBRARY_BUTTON_LINK_BASE })).digest("hex").slice(0, 12);
    expect(LIBRARY_REVISION, "Update LIBRARY_REVISION in DS1/1-root/library-tokens.ts").toBe(`sha256:${hash}`);
    expect(libraryRevision(`${libraryStamp()}\n:root {}`)).toBe(LIBRARY_REVISION);
    expect(libraryRevision(':root {}')).toBeUndefined();
    expect(libraryRevision(`:root {}\n${libraryStamp()}`), "only a first line counts").toBeUndefined();
  });

  it("maps legacy library tokens to tokens the components read", () => {
    const components = componentSources();
    for (const [component, token] of LIBRARY_TOKENS) {
      expect(token).toMatch(/^--one-/);
      expect(components, `${component} is read by a component`).toMatch(new RegExp(`var\\(${component}[,)]`));
    }
    expect(new Set(LIBRARY_TOKENS.map(([component]) => component)).size, "one source per component token").toBe(LIBRARY_TOKENS.length);
  });

  it("leaves DS1's own defaults alone: the component sheets never read a library token", () => {
    for (const sheet of ["component-tokens.css", "component-metrics.css", "component-appearance.css"]) expect(read(`DS1/1-root/${sheet}`), sheet).not.toMatch(/--one-/);
  });
});

describe("preparing a library for publishing", () => {
  const prepared = prepareLibrary(library);

  it("follows each library token with its component token, in the same rule, where the rule does not set it", () => {
    expect(prepared.css).toContain("  --one-accent-color: #d357fe;\n  --ds-accent-color: var(--one-accent-color);\n  --accent-color: var(--one-accent-color);");
    expect(prepared.css).toContain("  --one-radius: 8px !important;\n  --ds-corner-size: var(--one-radius) !important;\n  --ds-card-corner-size: var(--one-radius) !important;");
    expect(prepared.css).toContain("--ds-text-size: var(--one-font-size)");
    expect(prepared.css).toContain("@media (prefers-color-scheme: dark) { :root { --one-accent-color: #8a2be2; --ds-accent-color: var(--one-accent-color); --accent-color: var(--one-accent-color); } }");
    // The rule sets --ds-paper itself, so the owner's value stands.
    expect(prepared.css).not.toContain("--ds-paper: var(--one-background)");
    expect(prepared.css).toContain("--ds-paper: #fafafa;");
  });

  it("gives links marked as buttons the button faces, keeping every selector's specificity", () => {
    const rules = prepared.css.split("\n").filter(line => /\{ (?:border-radius|opacity)/.test(line));
    expect(rules[0]).toMatch(/^:where\(:is\(button,:where\(a\[data-library-button\]\)\)\) \{/);
    expect(rules[1]).toContain(':is(button,:where(a[data-library-button]))[variant="neutral"]:hover');
    expect(rules[1]).toContain("nav a:not(:where([data-library-button]))");
    expect(rules[1]).toContain(':is(button,:where(a[data-library-button])):is(:disabled,:where([data-library-button][aria-disabled="true"]))');
    expect(rules[1], "a field is never a link").toContain("input:disabled");
    const before = 'button[variant="neutral"]:hover, nav a, button:disabled, input:disabled'.split(", ");
    const after = rules[1]!.slice(0, rules[1]!.indexOf(" {")).split(",").reduce<string[]>((parts, piece) => {
      // Rejoin the commas inside :is() and :where().
      const open = (parts.at(-1)?.match(/\(/g)?.length ?? 0) - (parts.at(-1)?.match(/\)/g)?.length ?? 0);
      if (parts.length && open > 0) parts[parts.length - 1] += `,${piece}`; else parts.push(piece);
      return parts;
    }, []);
    expect(after).toHaveLength(before.length);
    before.forEach((selector, index) => expect(specificity(after[index]!), selector).toEqual(specificity(selector)));
  });

  it("puts the button-link base rule after the imports, before the owner's first rule", () => {
    const lines = prepared.css.split("\n");
    expect(lines.slice(0, 4)).toEqual([libraryStamp(), library.split("\n")[0], LIBRARY_BUTTON_LINK_BASE, ":root {"]);
    expect(prepareLibrary(":root { --one-radius: 2px; }").css.split("\n").slice(0, 2)).toEqual([libraryStamp(), LIBRARY_BUTTON_LINK_BASE]);
    expect(prepared.css.split(LIBRARY_BUTTON_LINK_BASE)).toHaveLength(2);
  });

  it("keeps the owner's own button-link rules and keyframe steps as written", () => {
    expect(prepared.css).toContain("a[data-library-button].own { color: blue; }");
    expect(prepared.css).toContain("@keyframes pulse { from { opacity: 0; } to { opacity: 1; } }");
  });

  it("stamps the first line, publishes valid CSS and prepares a prepared library the same way", () => {
    expect(prepared.css.startsWith(`${libraryStamp()}\n`)).toBe(true);
    expect(prepared.revision).toBe(LIBRARY_REVISION);
    expect(prepared.transform).toBe(`ds1-library@${LIBRARY_REVISION}`);
    expect(validateCss(prepared.css).ok).toBe(true);
    expect(prepareLibrary(prepared.css).css).toBe(prepared.css);
    const charset = prepareLibrary('@charset "utf-8";\n:root { --one-radius: 2px; }').css;
    expect(charset.startsWith(`@charset "utf-8";\n${libraryStamp()}\n`)).toBe(true);
  });

  it("prepares a legacy draft and a component library, both valid and stamped", () => {
    for (const draft of [':root { --one-radius: 4px; --one-accent-color: #99ff73; }', `${read("DS1/1-root/component-metrics.css")}\n${read("DS1/1-root/component-tokens.css")}`.replace(/^@import[^;]+;\s*/gm, "")]) {
      const { css } = prepareLibrary(draft);
      expect(validateCss(css).ok).toBe(true);
      expect(libraryRevision(css)).toBe(LIBRARY_REVISION);
      expect(prepareLibrary(css).css).toBe(css);
    }
  });
});
