import { afterEach, describe, expect, it } from "vite-plus/test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { sourceSites, scanApp, checkSnapshots } from "../scripts/component-adoption";

const temporary: string[] = [];
afterEach(() => { for (const dir of temporary.splice(0)) rmSync(dir, { recursive: true, force: true }); });
const write = (root: string, path: string, body: string) => { mkdirSync(dirname(join(root, path)), { recursive: true }); writeFileSync(join(root, path), body); };
const git = (root: string, ...args: string[]) => execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
function fixture() {
  const studio = mkdtempSync(join(tmpdir(), "component-adoption-")); temporary.push(studio);
  const ds = join(studio, "Design system 1"), app = join(studio, "Example");
  for (const root of [ds, app]) { mkdirSync(root); git(root, "init", "-b", "main"); }
  const files = { "2-core/ds-button.ts": "export const tag = 'ds-button';", "1-root/component-tokens.css": ":root { --test: 1; }", "1-root/controls.css": ":root { --control: 1; }" };
  for (const [file, body] of Object.entries(files)) { write(ds, `DS1/${file}`, body); write(app, `design/${file}`, body); }
  git(ds, "add", "."); git(ds, "-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-m", "Initial components");
  const commit = git(ds, "rev-parse", "HEAD");
  write(app, "design/components-manifest.json", JSON.stringify({ commit, components: ["button"], files: Object.fromEntries(Object.entries(files).map(([file, body]) => [file, createHash("sha256").update(body).digest("hex")])) }));
  return { studio, ds, app };
}

describe("source adoption evidence", () => {
  it("counts JSX, Lit templates and DOM creation once while excluding comments and selectors", () => {
    const sites = sourceSites("view.tsx", [
      '// <ds-button />',
      'const selector = "ds-button";',
      'const template = html`<ds-button>${value}<ds-text>text</ds-text><!-- <button> --></ds-button>`;',
      'const view = <><button title="<button>" /><ds-row>{items.map(item => <ds-button />)}</ds-row></>;',
      'document.createElement("input");',
      'const dynamic = document.createElement(tag);',
    ].join("\n"));
    expect(sites.map(s => s.tag)).toEqual(["ds-button", "ds-text", "button", "ds-row", "ds-button", "input"]);
    expect(sites[0]!.line).toBe(3); expect(sites.at(-1)!.line).toBe(5);
  });
  it("counts HTML and Astro markup without counting frontmatter or comments", () => {
    expect(sourceSites("page.astro", '---\n// <button>\n---\n<!-- <input> -->\n<button>OK</button>\n<script>document.createElement("input")</script>').map(s => [s.tag, s.line])).toEqual([["button", 5], ["input", 6]]);
  });
  it("recognizes React's imported createElement and distinguishes native DS1 styles", () => {
    const sites = sourceSites("view.tsx", 'import { createElement as h } from "react"; h("ds-button"); const x = <input className="ds-input" />;');
    expect(sites[0]?.tag).toBe("ds-button");
    expect(sites[1]).toMatchObject({ tag: "input", nativeStyle: "ds-input" });
    expect(sourceSites("page.html", '<button class="ds-button secondary">Save</button>')[0]?.nativeStyle).toBe("ds-button");
  });
  it("distinguishes a verified snapshot, an older snapshot, and a locally modified copy", () => {
    const { app, ds } = fixture();
    expect(checkSnapshots(app, "design/components-manifest.json", ds).cells.button).toMatchObject({ snapshot: "verified", current: true });
    write(ds, "DS1/2-core/ds-button.ts", "export const tag = 'new-button';");
    expect(checkSnapshots(app, "design/components-manifest.json", ds).cells.button).toMatchObject({ snapshot: "verified", current: false });
    write(app, "design/2-core/ds-button.ts", "export const tag = 'local-button';");
    expect(checkSnapshots(app, "design/components-manifest.json", ds).cells.button?.snapshot).toBe("modified");
    // Editing a manifest to bless a local change must not make it shared DS1.
    const path = join(app, "design/components-manifest.json");
    const manifest = JSON.parse(readFileSync(path, "utf8"));
    manifest.files["2-core/ds-button.ts"] = createHash("sha256").update(readFileSync(join(app, "design/2-core/ds-button.ts"))).digest("hex");
    writeFileSync(path, JSON.stringify(manifest));
    expect(checkSnapshots(app, "design/components-manifest.json", ds).cells.button?.snapshot).toBe("unverified");
  });
  it("ignores previews, tests, vendored implementation and untracked files; unavailable is not zero", () => {
    const { studio, app, ds } = fixture();
    write(app, "client/page.tsx", "export const View = () => <><ds-button /><button /><ezo-input /><input className=\"ds-input\" /></>;");
    for (const file of ["client/page.test.tsx", "client/__surface/demo.tsx", "client/design/inner.tsx"]) write(app, file, "const x = <button />;");
    git(app, "add", "."); git(app, "-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-m", "Initial app");
    write(app, "client/scratch.tsx", "const x = <button />;");
    const report = scanApp({ id: "example", name: "Example", directory: "Example", roots: ["client"], manifest: "design/components-manifest.json" }, studio, ds);
    expect(report.status).toBe("scanned"); expect(report.files).toBe(1); expect(report.dirty).toBe(true);
    expect(report.cells.button).toMatchObject({ shared: 1, local: 1, unverified: 0 });
    expect(report.cells.input?.local).toBe(1);
    expect(report.cells.input?.styled).toBe(1);
    const missing = scanApp({ id: "missing", name: "Missing", directory: "Missing", roots: ["src"] }, studio, ds);
    expect(missing.status).toBe("unavailable"); expect(missing.cells).toEqual({});
  });
  it("counts renamed thin React adapter imports at their call sites, without double counting definitions", () => {
    const { studio, app, ds } = fixture();
    write(app, "client/components/TabPills.tsx", "export function TabPill() { return <ds-button /> }");
    write(app, "client/page.tsx", 'import { TabPill as Pill } from "./components/TabPills"; export const Page = () => <><Pill /><Pill /></>;');
    git(app, "add", "."); git(app, "-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-m", "Initial app");
    const report = scanApp({ id: "link", name: "Example", directory: "Example", roots: ["client"], manifest: "design/components-manifest.json" }, studio, ds);
    expect(report.cells.button?.shared).toBe(2);
    expect(report.cells.button?.sites.every(s => s.file === "client/page.tsx")).toBe(true);
  });

  it("verifies shared React input imports through pure re-exports and flags modified adapters", () => {
    const { studio, app, ds } = fixture();
    const added = {
      '2-core/ds-input.ts': 'export class Input {}',
      '2-core/ds-textarea.ts': 'import { Input } from "./ds-input"; export class Textarea extends Input {}',
      'react/input.ts': 'import type { Input as InputElement } from "../2-core/ds-input"; export const Input = () => null; export const Textarea = () => null;',
    };
    for (const [file, body] of Object.entries(added)) { write(ds, `DS1/${file}`, body); write(app, `design/${file}`, body); }
    git(ds, 'add', '.'); git(ds, '-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-m', 'Add shared input');
    const manifestPath = join(app, 'design/components-manifest.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    manifest.commit = git(ds, 'rev-parse', 'HEAD'); manifest.components.push('input', 'textarea');
    Object.assign(manifest.files, Object.fromEntries(Object.entries(added).map(([file, body]) => [file, createHash('sha256').update(body).digest('hex')])));
    writeFileSync(manifestPath, JSON.stringify(manifest));
    write(app, 'src/field.ts', 'import "./register"; export { Input as Field, Textarea as Multiline } from "../design/react/input";');
    write(app, 'src/local.tsx', 'export const Input = () => <input />;');
    write(app, 'src/page.tsx', 'import { Field as SharedField, Multiline as Notes } from "@/field"; import { Input as Direct } from "../design/react/input"; import { Input as Local } from "./local"; export const Page = () => <><SharedField /><Direct /><Local /><Notes /><textarea /></>;');
    git(app, 'add', '.'); git(app, '-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-m', 'Use shared input');
    const scan = () => scanApp({ id: 'example', name: 'Example', directory: 'Example', roots: ['src'], manifest: 'design/components-manifest.json' }, studio, ds);
    expect(scan().cells.input).toMatchObject({ shared: 2, local: 1, unverified: 0 });
    expect(scan().cells.textarea).toMatchObject({ shared: 1, local: 1, unverified: 0 });
    write(app, 'design/react/input.ts', added['react/input.ts'] + '\n// Local changes');
    expect(scan().cells.input).toMatchObject({ shared: 0, local: 1, unverified: 2 });
    expect(scan().cells.textarea).toMatchObject({ shared: 0, local: 1, unverified: 1 });
    manifest.files['react/input.ts'] = createHash('sha256').update(readFileSync(join(app, 'design/react/input.ts'))).digest('hex');
    writeFileSync(manifestPath, JSON.stringify(manifest));
    expect(scan().cells.input).toMatchObject({ shared: 0, unverified: 2 });
  });
});
