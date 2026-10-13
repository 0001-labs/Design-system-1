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
  it("counts shared native choice frames only once and separates literal local choices", () => {
    for (const file of ["page.html", "view.tsx"]) {
      const sites = sourceSites(file, '<ds-checkbox><input type="checkbox" /></ds-checkbox><ds-switch><button role="switch" /></ds-switch><input type="checkbox" /><button role="switch" />');
      expect(sites.map(site => site.tag)).toEqual(["ds-checkbox", "ds-switch", "input", "button"]);
      expect(sourceSites(file, '<ds-select><select><option>Alpha</option></select></ds-select>').filter(site => site.tag !== "option").map(site => site.tag)).toEqual(["ds-select"]);
      expect(sites[2]?.controlKind).toBe("checkbox"); expect(sites[3]?.controlKind).toBe("switch");
    }
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
    write(app, "client/components/design/ColorLibraryDialog.tsx", "export const View = () => <button />;");
    for (const file of ["client/page.test.tsx", "client/__surface/demo.tsx", "client/design/inner.tsx", "src/pages/design/preview.astro"]) write(app, file, "const x = <button />;");
    git(app, "add", "."); git(app, "-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-m", "Initial app");
    write(app, "client/scratch.tsx", "const x = <button />;");
    const report = scanApp({ id: "example", name: "Example", directory: "Example", roots: ["client", "src"], manifest: "design/components-manifest.json" }, studio, ds);
    expect(report.status).toBe("scanned"); expect(report.files).toBe(2); expect(report.dirty).toBe(true);
    expect(report.cells.button).toMatchObject({ shared: 1, local: 2, unverified: 0 });
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

  it("verifies shared React adapters through pure re-exports and flags each modified adapter", () => {
    const { studio, app, ds } = fixture();
    const added = {
      '3-unit/ds-menu.ts': 'export class Menu {}',
      'react/menu.ts': 'import type { Menu } from "../3-unit/ds-menu"; export const Menu = () => null;',
      '2-core/ds-composer.ts': 'export class Composer {}',
      'react/composer.ts': 'import type { Composer } from "../2-core/ds-composer"; export const Composer = () => null;',
      '2-core/ds-split.ts': 'export class Split {}',
      'react/split.ts': 'import type { Split as SplitElement } from "../2-core/ds-split"; export const Split = () => null;',
      '2-core/ds-checkbox.ts': 'export class Checkbox {}',
      '2-core/ds-switch.ts': 'export class Switch {}',
      '2-core/ds-select.ts': 'export class Select {}',
      '2-core/ds-color.ts': 'export class ColorInput {}',
      'react/choice.ts': 'export const Checkbox = () => null; export const Switch = () => null; export const Select = () => null; export const ColorInput = () => null;',
      '2-core/ds-input.ts': 'export class Input {}',
      '4-page/ds-dialog.ts': 'export class Dialog {}',
      'react/dialog.ts': 'import type { Dialog as DialogElement } from "../4-page/ds-dialog"; export const DialogContent = () => null;',
      '2-core/ds-textarea.ts': 'import { Input } from "./ds-input"; export class Textarea extends Input {}',
      'react/button.ts': 'import type { Button as ButtonElement } from "../2-core/ds-button"; export const Button = () => null;',
      'react/input.ts': 'import type { Input as InputElement } from "../2-core/ds-input"; export const Input = () => null; export const Textarea = () => null;',
    };
    for (const [file, body] of Object.entries(added)) { write(ds, `DS1/${file}`, body); write(app, `design/${file}`, body); }
    git(ds, 'add', '.'); git(ds, '-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-m', 'Add shared input');
    const manifestPath = join(app, 'design/components-manifest.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    manifest.commit = git(ds, 'rev-parse', 'HEAD'); manifest.components.push('menu', 'composer', 'split', 'input', 'textarea', 'dialog', 'checkbox', 'switch', 'select', 'color');
    Object.assign(manifest.files, Object.fromEntries(Object.entries(added).map(([file, body]) => [file, createHash('sha256').update(body).digest('hex')])));
    writeFileSync(manifestPath, JSON.stringify(manifest));
    write(app, 'src/field.ts', 'import "./register"; export { Input as Field, Textarea as Multiline } from "../design/react/input";');
    write(app, 'src/action.ts', 'export { Button as Action } from "../design/react/button";');
    write(app, 'src/dialog.ts', 'export { DialogContent as Modal, DialogTitle } from "../design/react/dialog";');
    write(app, 'src/local.tsx', 'export const Input = () => <input />;');
    write(app, 'src/split.ts', 'import "./register"; export { Split as Segments } from "../design/react/split";');
    write(app, 'src/page.tsx', 'import { Menu } from "../design/react/menu"; import { Composer } from "../design/react/composer"; import { Segments } from "./split"; import { Checkbox as Check, Switch as Toggle, Select as Choice, ColorInput as Color } from "../design/react/choice"; import { Modal, DialogTitle } from "./dialog"; import { Action as SharedAction } from "./action"; import { Button as DirectAction } from "../design/react/button"; import { Field as SharedField, Multiline as Notes } from "@/field"; import { Input as Direct } from "../design/react/input"; import { Input as Local } from "./local"; export const Page = () => <><Menu /><ds-menu /><Composer /><ds-composer><textarea /></ds-composer><Segments /><ds-split /><ezo-split /><Check /><Toggle /><Choice /><Color /><input type="color" /><select /><input type="checkbox" /><button role="switch" /><SharedField /><Direct /><Local /><Notes /><textarea /><SharedAction /><DirectAction /><Modal><DialogTitle>Title</DialogTitle></Modal><dialog /><section role="dialog" /><div role="alertdialog" /></>;');
    git(app, 'add', '.'); git(app, '-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-m', 'Use shared input');
    const scan = () => scanApp({ id: 'example', name: 'Example', directory: 'Example', roots: ['src'], manifest: 'design/components-manifest.json' }, studio, ds);
    expect(scan().cells.menu).toMatchObject({ shared: 2, local: 0, unverified: 0 });
    write(app, 'design/react/menu.ts', added['react/menu.ts'] + '\n// Local changes');
    expect(scan().cells.menu).toMatchObject({ shared: 1, local: 0, unverified: 1 });
    expect(scan().cells.composer).toMatchObject({ shared: 2, local: 0, unverified: 0 });
    write(app, 'design/react/composer.ts', added['react/composer.ts'] + '\n// Local changes');
    expect(scan().cells.composer).toMatchObject({ shared: 1, local: 0, unverified: 1 });
    expect(scan().cells.split).toMatchObject({ shared: 2, local: 1, unverified: 0 });
    write(app, 'design/react/split.ts', added['react/split.ts'] + '\n// Local changes');
    expect(scan().cells.split).toMatchObject({ shared: 1, local: 1, unverified: 1 });
    expect(scan().cells.checkbox).toMatchObject({ shared: 1, local: 1, unverified: 0 });
    expect(scan().cells.switch).toMatchObject({ shared: 1, local: 1, unverified: 0 });
    expect(scan().cells.select).toMatchObject({ shared: 1, local: 1, unverified: 0 });
    expect(scan().cells.color).toMatchObject({ shared: 1, local: 1, unverified: 0 });
    write(app, 'design/react/choice.ts', added['react/choice.ts'] + '\n// Local changes');
    expect(scan().cells.select).toMatchObject({ shared: 0, local: 1, unverified: 1 });
    expect(scan().cells.color).toMatchObject({ shared: 0, local: 1, unverified: 1 });
    expect(scan().cells.checkbox).toMatchObject({ shared: 0, local: 1, unverified: 1 });
    expect(scan().cells.switch).toMatchObject({ shared: 0, local: 1, unverified: 1 });
    expect(scan().cells.input).toMatchObject({ shared: 2, local: 1, unverified: 0 });
    expect(scan().cells.textarea).toMatchObject({ shared: 1, local: 1, unverified: 0 });
    expect(scan().cells.button).toMatchObject({ shared: 2, unverified: 0 });
    expect(scan().cells.dialog).toMatchObject({ shared: 1, local: 3, unverified: 0 });
    write(app, 'design/react/dialog.ts', added['react/dialog.ts'] + '\n// Local changes');
    expect(scan().cells.dialog).toMatchObject({ shared: 0, local: 3, unverified: 1 });
    write(app, 'design/react/button.ts', added['react/button.ts'] + '\n// Local changes');
    expect(scan().cells.button).toMatchObject({ shared: 0, unverified: 2 });
    expect(scan().cells.input).toMatchObject({ shared: 2, unverified: 0 });
    manifest.files['react/button.ts'] = createHash('sha256').update(readFileSync(join(app, 'design/react/button.ts'))).digest('hex');
    writeFileSync(manifestPath, JSON.stringify(manifest));
    expect(scan().cells.button).toMatchObject({ shared: 0, unverified: 2 });
    write(app, 'design/react/input.ts', added['react/input.ts'] + '\n// Local changes');
    expect(scan().cells.input).toMatchObject({ shared: 0, local: 1, unverified: 2 });
    expect(scan().cells.textarea).toMatchObject({ shared: 0, local: 1, unverified: 1 });
    manifest.files['react/input.ts'] = createHash('sha256').update(readFileSync(join(app, 'design/react/input.ts'))).digest('hex');
    writeFileSync(manifestPath, JSON.stringify(manifest));
    expect(scan().cells.input).toMatchObject({ shared: 0, unverified: 2 });
  });
});

it("counts a shared dialog frame once across HTML, Lit, JSX and direct DOM composition", () => {
  expect(sourceSites("view.html", '<ds-dialog><dialog><p>Text</p></dialog></ds-dialog><dialog />').map(s => s.tag)).toEqual(["ds-dialog", "p", "dialog"]);
  expect(sourceSites("view.ts", 'html`<ds-dialog .open=${open}><dialog>${text}</dialog></ds-dialog><dialog></dialog>`').map(s => s.tag)).toEqual(["ds-dialog", "dialog"]);
  expect(sourceSites("view.tsx", 'const x = <><ds-dialog><dialog /></ds-dialog><dialog /></>').map(s => s.tag)).toEqual(["ds-dialog", "dialog"]);
  const dom = 'function show() { const host = document.createElement("ds-dialog"); const frame = document.createElement("dialog"); host.append(frame); } function separate() { const frame = document.createElement("dialog"); }';
  expect(sourceSites("view.ts", dom).map(s => s.tag)).toEqual(["ds-dialog", "dialog"]);
  expect(sourceSites("view.ts", 'let host = document.createElement("ds-dialog"); const frame = document.createElement("dialog"); host.append(frame);').map(s => s.tag)).toEqual(["ds-dialog", "dialog"]);
});

it("recognizes explicit DOM dialog roles while leaving dynamic role values unresolved", () => {
  const sites = sourceSites("overlay.ts", 'menu.setAttribute("role", "dialog"); active.setAttribute("role", "alertdialog"); node.setAttribute("role", role);');
  expect(sites.map(s => [s.tag, s.dialogRole])).toEqual([["role-dialog", true], ["role-dialog", true]]);
});

 it("separates color fields and excludes their native shared frame", () => {
  for (const file of ["view.html", "view.tsx"]) {
    const sites = sourceSites(file, '<ds-color><input type="color" /></ds-color><input type="color" />');
    expect(sites.map(site => site.tag)).toEqual(["ds-color", "input"]);
    expect(sites[1]?.controlKind).toBe("color");
  }
});

it("recognizes direct native control frames without conflating separate scopes or unrelated children", () => {
  for (const [hostTag, tag] of [["ds-select", "select"], ["ds-checkbox", "input"], ["ds-color", "input"], ["ds-switch", "button"]]) {
    const source = `function shared() { const field = document.createElement("${tag}"); const host = document.createElement("${hostTag}"); host.setAttribute("fit", ""); host.append(field); } function separate() { const field = document.createElement("${tag}"); }`;
    expect(sourceSites("view.ts", source).map(s => s.tag)).toEqual([hostTag, tag]);
  }
  expect(sourceSites("view.ts", 'const host = document.createElement("ds-select"); const field = document.createElement("select"); host.appendChild(field); const unrelated = document.createElement("input"); host.append(unrelated);').map(s => s.tag)).toEqual(["ds-select", "input"]);
  expect(sourceSites("view.ts", 'let host = document.createElement("ds-select"); const field = document.createElement("select"); host.append(field);').map(s => s.tag)).toEqual(["ds-select", "select"]);
});

it("counts highlighted native textarea frames once in HTML and direct DOM composition", () => {
  expect(sourceSites("field.html", '<ds-composer><textarea></textarea></ds-composer>').map(site => site.tag)).toEqual(["ds-composer"]);
  expect(sourceSites("field.ts", 'const host = document.createElement("ds-composer"); const input = document.createElement("textarea"); host.append(input);').map(site => site.tag)).toEqual(["ds-composer"]);
});
