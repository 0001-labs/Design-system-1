import { afterEach, describe, expect, it } from "vite-plus/test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { loadAppSpecs, scanApp, scanReport, sourceSites } from "../scripts/component-adoption";
import { markdownBlocks, markdownSites, slotInProse } from "../scripts/markdown-sites";

const temporary: string[] = [];
afterEach(() => { for (const dir of temporary.splice(0)) rmSync(dir, { recursive: true, force: true }); });
const write = (root: string, path: string, body: string) => { mkdirSync(dirname(join(root, path)), { recursive: true }); writeFileSync(join(root, path), body); };
const git = (root: string, ...args: string[]) => execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
const commit = (root: string) => { git(root, "add", "."); git(root, "-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-m", "Fixture"); };
function fixture() {
  const studio = mkdtempSync(join(tmpdir(), "library-markdown-")); temporary.push(studio);
  const ds = join(studio, "Design system 1"), app = join(studio, "Example");
  for (const root of [ds, app]) { mkdirSync(root); git(root, "init", "-b", "main"); }
  const files = { "2-core/ds-button.ts": "export const tag = 'ds-button';", "1-root/component-tokens.css": ":root { --test: 1; }", "1-root/controls.css": ":root { --control: 1; }", "1-root/prose.css": "[data-ds-prose] p { margin: 0; }" };
  for (const [file, body] of Object.entries(files)) { write(ds, `DS1/${file}`, body); write(app, `design/${file}`, body); }
  commit(ds);
  write(app, "design/components-manifest.json", JSON.stringify({ commit: git(ds, "rev-parse", "HEAD"), components: ["button"], files: Object.fromEntries(Object.entries(files).map(([file, body]) => [file, createHash("sha256").update(body).digest("hex")])) }));
  return { studio, ds, app };
}
const spec = { id: "example", name: "Example", directory: "Example", roots: ["src"], manifest: "design/components-manifest.json" };
const address = "https://designsystem1.com/ds1/0123456789abcdefghjk/latest.css";
const wrappers = [
  'import { createElement as h, forwardRef } from "react";',
  'export const Button = forwardRef(function Button(props, ref) { return h("button", { ...props, ref, "data-library-control": "" }); });',
  'export const ButtonLink = forwardRef(function ButtonLink(props, ref) { return h("a", { ...props, ref, "data-library-control": "", "data-library-button": "" }); });',
  'export const Checkbox = forwardRef(function Checkbox(props, ref) { return h("input", { ...props, ref, type: "checkbox", "data-library-control": "" }); });',
  'export function Pair() { return <><button data-library-control /><input data-library-control /></>; }',
  'export const Field = (props) => (<textarea data-library-control {...props}></textarea>);',
].join("\n");
const page = 'import { Button, ButtonLink as Go, Checkbox, Pair, Field } from "../design/controls";\nexport const Page = () => <form><Button /><Go href="/" /><Checkbox /><Pair /><Field /><input data-library-control /><button>Local</button></form>;';
const controls = 'import "./layout.css";\nif (typeof window !== "undefined") console.log("ready");\nexport { Button, ButtonLink, Checkbox, Pair, Field } from "./library-controls";';

describe("published library provenance", () => {
  it("counts marked controls and wrapper uses as needs review once a published library is connected", () => {
    const { studio, app, ds } = fixture();
    write(app, "src/design/library-css.ts", `export const libraryUrl = "${address}";`);
    write(app, "src/design/library-controls.tsx", wrappers);
    write(app, "src/design/controls.ts", controls);
    write(app, "src/components/page.tsx", page);
    commit(app);
    const report = scanApp(spec, studio, ds);
    expect(report.cells.button).toMatchObject({ unverified: 2, local: 1, shared: 0, styled: 0 });
    expect(report.cells.checkbox).toMatchObject({ unverified: 1, local: 0 });
    expect(report.cells.input).toMatchObject({ unverified: 1, local: 0 });
    expect(report.cells.textarea).toMatchObject({ unverified: 1, local: 0 });
    expect(report.cells.button?.sites.map(site => site.tag)).toEqual(["Button", "Go", "button"]);
    expect(report.cells.input?.sites[0]?.tag).toBe("input[data-library-control]");
    expect(report.cells.button?.issues.join(" ")).toMatch(/published design library \(connected in src\/design\/library-css\.ts\)/);
    expect(JSON.stringify(report)).not.toContain(studio);
  });
  it("counts a scanned wrapper's own face at its uses, not again", () => {
    const { studio, app, ds } = fixture();
    write(app, "src/library.css", `@import url("${address}");`);
    write(app, "src/lib/controls.tsx", wrappers);
    write(app, "src/components/page.tsx", 'import { Button } from "../lib/controls";\nexport const Page = () => <><Button /><Button /></>;');
    commit(app);
    const report = scanApp(spec, studio, ds);
    // Pair renders two marked controls: it is not a wrapper, so its elements count where they are written.
    expect(report.cells.button).toMatchObject({ unverified: 3, local: 0 });
    expect(report.cells.button?.sites.map(site => site.file)).toEqual(["src/lib/controls.tsx", "src/components/page.tsx", "src/components/page.tsx"].sort());
    expect(report.cells.input).toMatchObject({ unverified: 1 });
    expect(report.cells.checkbox?.unverified).toBe(0);
  });
  it("leaves markers and wrappers alone without a connected library", () => {
    const { studio, app, ds } = fixture();
    write(app, "AGENTS.md", `The library lives at ${address}.`);
    write(app, "src/design/library-controls.tsx", wrappers);
    write(app, "src/design/controls.ts", controls);
    write(app, "src/components/page.tsx", page);
    commit(app);
    const report = scanApp(spec, studio, ds);
    expect(report.cells.button).toMatchObject({ unverified: 0, local: 1 });
    expect(report.cells.input).toMatchObject({ unverified: 0, local: 1 });
    expect(report.cells.checkbox?.unverified).toBe(0);
  });
});

const starlight = 'import starlight from "@astrojs/starlight";\nexport default { integrations: [starlight({ components: {\n  // The body is prose\n  MarkdownContent: "./src/components/MarkdownContent.astro" } })] };';
const doc = [
  "---", "title: <p>Not a site</p>", "---",
  "# Heading", "", "A paragraph with `<button>` in code.", "", "- one", "- two", "", "  still the list", "",
  "| a | b |", "| - | - |", "| 1 | 2 |", "", "```html", "<button>Example</button>", "```", "",
  "> A quote", "", "<ds-button>Live</ds-button>", "", "<div data-ds-not-prose>", "", "Local paragraph", "", "</div>", "",
].join("\n");

describe("Markdown and MDX", () => {
  it("reads Markdown blocks, setext headings and quotes", () => {
    expect(markdownBlocks(["Title", "=====", "", "Text", "more", "", "1. a", "2. b", "", "> quoted", "", "    code", "", "***"])).toEqual([["h1", 0], ["p", 3], ["ol", 6], ["p", 9]]);
    expect(markdownSites("page.md", "`<p>` opens this paragraph.\n\n    indented code", false, sourceSites).sites).toEqual([{ tag: "p", line: 1 }]);
    expect(slotInProse('<div class="x" data-ds-prose><slot /></div>')).toBe(true);
    expect(slotInProse('<div data-ds-prose><section data-ds-not-prose><slot /></section></div>')).toBe(false);
    expect(slotInProse("<main><slot /></main>")).toBe(false);
  });
  it("skips code, frontmatter and MDX imports, and keeps imports for adapters", () => {
    const read = markdownSites("page.mdx", 'import { Button } from "./react/button";\n\n<Button />\n\nText `<input>`', true, sourceSites);
    expect(read.sites.map(site => [site.tag, site.line, site.prose ?? false])).toEqual([["Button", 3, false], ["p", 5, true]]);
    expect(read.code.split("\n")[0]).toContain("./react/button");
  });
  it("counts docs Markdown drawn by DS1's prose sheet as DS1 styles, and its markup like JSX", () => {
    const { studio, ds } = fixture();
    write(ds, "website/astro.config.mjs", starlight);
    write(ds, "website/src/components/MarkdownContent.astro", "---\nimport '../../../DS1/1-root/prose.css';\n---\n<div class=\"sl-markdown-content\" data-ds-prose><slot /></div>");
    write(ds, "website/src/content/docs/guide.md", doc);
    write(ds, "website/src/content/docs/page.mdx", doc);
    commit(ds);
    const report = scanApp({ id: "ds", name: "DS", directory: "Design system 1", roots: ["website/src"], source: "direct" }, studio, ds);
    expect(report.status).toBe("scanned");
    // Heading, paragraph and quote paragraph are prose; the paragraph inside data-ds-not-prose is local.
    expect(report.cells.text).toMatchObject({ styled: 6, local: 2 });
    expect(report.cells.list).toMatchObject({ styled: 2 });
    expect(report.cells.table).toMatchObject({ styled: 2 });
    expect(report.cells.button).toMatchObject({ shared: 2, local: 0 });
    expect(report.cells.text?.sites.some(site => site.kind === "styled" && site.tag === "p[data-ds-prose]")).toBe(true);
  });
  it("counts other renderers' Markdown as local text, and does not read data or README Markdown", () => {
    const { studio, app, ds } = fixture();
    write(app, "astro.config.mjs", "export default {};");
    write(app, "src/content/docs/guide.md", "# Title\n\nText");
    write(app, "src/pages/about.md", "Text");
    write(app, "src/README.md", "# Not compiled");
    write(app, "src/lib/content/en.md", "# Read as data");
    write(app, "src/page.tsx", "export const Page = () => <p />;");
    commit(app);
    const report = scanApp(spec, studio, ds);
    expect(report.files).toBe(3);
    expect(report.cells.text).toMatchObject({ local: 4, styled: 0 });
    write(app, "src/components/MarkdownContent.astro", "<div><slot /></div>");
    write(app, "astro.config.mjs", 'import starlight from "@astrojs/starlight";\nexport default { integrations: [starlight({ components: { MarkdownContent: "./src/components/MarkdownContent.astro" } })] };');
    expect(scanApp(spec, studio, ds).cells.text).toMatchObject({ local: 4, styled: 0 });
  });
});

describe("scan configuration", () => {
  it("reads an explicit configuration path", () => {
    const { studio } = fixture();
    const path = join(studio, "trial.json");
    writeFileSync(path, JSON.stringify({ apps: [spec] }));
    expect(loadAppSpecs(studio, path).map(app => app.id)).toEqual(["example"]);
    expect(() => loadAppSpecs(studio)).toThrow();
    process.env.ADOPTION_CONFIG = path;
    try { expect(scanReport(studio).method.join(" ")).toMatch(/published library/); }
    finally { delete process.env.ADOPTION_CONFIG; }
  });
});
