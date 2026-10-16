import { afterEach, describe, expect, it } from "vite-plus/test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { sourceSites, scanApp, checkSnapshots, checkLockedControls, checkLockedText } from "../scripts/component-adoption";

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
    expect(sourceSites("view.tsx", 'const button = <button className={`archive-cell${active ? " active" : ""} ds-button`} />;')[0]?.nativeStyle).toBe("ds-button");
    expect(sourceSites("view.ts", 'const button = html`<button class="dot ds-button ${state}" @click=${click}></button>`;')[0]?.nativeStyle).toBe("ds-button");
  });
  it("recognizes explicitly styled native buttons created and tagged in the same block", () => {
    const sites = sourceSites("view.ts", 'function view() { const button = document.createElement("button"); button.className = "local-action"; button.classList.add("ds-button"); host.append(button); } function other() { const button = document.createElement("button"); host.append(button); }');
    expect(sites.map(site => site.nativeStyle)).toEqual(["ds-button", undefined]);
  });
  it("counts shared native choice frames only once and separates literal local choices", () => {
    for (const file of ["page.html", "view.tsx"]) {
      const sites = sourceSites(file, '<ds-checkbox><input type="checkbox" /></ds-checkbox><ds-switch><button role="switch" /></ds-switch><input type="checkbox" /><button role="switch" />');
      expect(sites.map(site => site.tag)).toEqual(["ds-checkbox", "ds-switch", "input", "button"]);
      expect(sourceSites(file, '<ds-select><select><option>Alpha</option></select></ds-select>').filter(site => site.tag !== "option").map(site => site.tag)).toEqual(["ds-select"]);
      expect(sites[2]?.controlKind).toBe("checkbox"); expect(sites[3]?.controlKind).toBe("switch");
      const radios = sourceSites(file, '<ds-radio><input type="radio" /></ds-radio><input type="radio" />');
      expect(radios.map(site => site.tag)).toEqual(["ds-radio", "input"]); expect(radios[1]?.controlKind).toBe("radio");
    }
  });
  it("does not count the native button inside the shared DS1 button face twice", () => {
    expect(sourceSites("page.html", '<ds-button control="slotted"><button type="submit">Save</button></ds-button>').map(site => site.tag)).toEqual(["ds-button"]);
    expect(sourceSites("view.ts", 'function view() { const face = document.createElement("ds-button"); const button = document.createElement("button"); face.append(button); }').map(site => site.tag)).toEqual(["ds-button"]);
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
      '3-unit/ds-avatar-group.ts': 'export class AvatarGroup {}',
      'react/avatar-group.ts': 'import type { AvatarGroup } from "../3-unit/ds-avatar-group"; export const AvatarGroup = () => null;',
      '2-core/ds-avatar.ts': 'export class Avatar {}',
      'react/avatar.ts': 'import type { Avatar } from "../2-core/ds-avatar"; export const Avatar = () => null;',
      '3-unit/ds-accordion.ts': 'export class Accordion {}',
      'react/accordion.ts': 'import type { Accordion } from "../3-unit/ds-accordion"; export const Accordion = () => null;',
      '3-unit/ds-menu.ts': 'export class Menu {}',
      'react/menu.ts': 'import type { Menu } from "../3-unit/ds-menu"; export const Menu = () => null;',
      '2-core/ds-composer.ts': 'export class Composer {}',
      'react/composer.ts': 'import type { Composer } from "../2-core/ds-composer"; export const Composer = () => null;',
      '2-core/ds-split.ts': 'export class Split {}',
      'react/split.ts': 'import type { Split as SplitElement } from "../2-core/ds-split"; export const Split = () => null;',
      '2-core/ds-checkbox.ts': 'export class Checkbox {}',
      '2-core/ds-radio.ts': 'export class Radio {}',
      '2-core/ds-switch.ts': 'export class Switch {}',
      '2-core/ds-select.ts': 'export class Select {}',
      '2-core/ds-color.ts': 'export class ColorInput {}',
      'react/choice.ts': 'export const Checkbox = () => null; export const Radio = () => null; export const Switch = () => null; export const Select = () => null; export const ColorInput = () => null;',
      '2-core/ds-input.ts': 'export class Input {}',
      '4-page/ds-dialog.ts': 'export class Dialog {}',
      'react/dialog.ts': 'import type { Dialog as DialogElement } from "../4-page/ds-dialog"; export const DialogContent = () => null;',
      '2-core/ds-textarea.ts': 'import { Input } from "./ds-input"; export class Textarea extends Input {}',
      'react/button.ts': 'import type { Button as ButtonElement } from "../2-core/ds-button"; export const Button = () => null; export const ButtonLink = () => null;',
      'react/input.ts': 'import type { Input as InputElement } from "../2-core/ds-input"; export const Input = () => null; export const Textarea = () => null;',
    };
    for (const [file, body] of Object.entries(added)) { write(ds, `DS1/${file}`, body); write(app, `design/${file}`, body); }
    git(ds, 'add', '.'); git(ds, '-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-m', 'Add shared input');
    const manifestPath = join(app, 'design/components-manifest.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    manifest.commit = git(ds, 'rev-parse', 'HEAD'); manifest.components.push('avatar-group', 'avatar', 'accordion', 'menu', 'composer', 'split', 'input', 'textarea', 'dialog', 'checkbox', 'radio', 'switch', 'select', 'color');
    Object.assign(manifest.files, Object.fromEntries(Object.entries(added).map(([file, body]) => [file, createHash('sha256').update(body).digest('hex')])));
    writeFileSync(manifestPath, JSON.stringify(manifest));
    write(app, 'src/field.ts', 'import "./register"; export { Input as Field, Textarea as Multiline } from "../design/react/input";');
    write(app, 'src/action.ts', 'export { Button as Action } from "../design/react/button";');
    write(app, 'src/dialog.ts', 'export { DialogContent as Modal, DialogTitle } from "../design/react/dialog";');
    write(app, 'src/local.tsx', 'export const Input = () => <input />;');
    write(app, 'src/split.ts', 'import "./register"; export { Split as Segments } from "../design/react/split";');
    write(app, 'src/page.tsx', 'import { Avatar, Logo } from "../design/react/avatar"; import { AvatarGroup } from "../design/react/avatar-group"; import { Accordion } from "../design/react/accordion"; import { ButtonLink } from "../design/react/button"; import { Menu } from "../design/react/menu"; import { Composer } from "../design/react/composer"; import { Segments } from "./split"; import { Checkbox as Check, Radio as RadioChoice, Switch as Toggle, Select as Choice, ColorInput as Color } from "../design/react/choice"; import { Modal, DialogTitle } from "./dialog"; import { Action as SharedAction } from "./action"; import { Button as DirectAction } from "../design/react/button"; import { Field as SharedField, Multiline as Notes } from "@/field"; import { Input as Direct } from "../design/react/input"; import { Input as Local } from "./local"; export const Page = () => <><Avatar /><Logo /><AvatarGroup /><ds-avatar-group /><Accordion /><ButtonLink /><Menu /><ds-menu /><Composer /><ds-composer><textarea /></ds-composer><Segments /><ds-split /><ezo-split /><Check /><RadioChoice /><input type="radio" /><Toggle /><Choice /><Color /><input type="color" /><select /><input type="checkbox" /><button role="switch" /><SharedField /><Direct /><Local /><Notes /><textarea /><SharedAction /><DirectAction /><Modal><DialogTitle>Title</DialogTitle></Modal><dialog /><section role="dialog" /><div role="alertdialog" /></>;');
    git(app, 'add', '.'); git(app, '-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-m', 'Use shared input');
    const scan = () => scanApp({ id: 'example', name: 'Example', directory: 'Example', roots: ['src'], manifest: 'design/components-manifest.json' }, studio, ds);
    expect(scan().cells.avatar).toMatchObject({ shared: 2, local: 0, unverified: 0 });
    expect(scan().cells["avatar-group"]).toMatchObject({ shared: 2, local: 0, unverified: 0 });
    write(app, "design/react/avatar-group.ts", added["react/avatar-group.ts"] + "\n// Local change");
    expect(scan().cells["avatar-group"]).toMatchObject({ shared: 1, local: 0, unverified: 1 });
    write(app, "design/react/avatar.ts", added["react/avatar.ts"] + "\n// Local change");
    expect(scan().cells.avatar).toMatchObject({ shared: 0, local: 0, unverified: 2 });
    expect(scan().cells.accordion).toMatchObject({ shared: 1, local: 0, unverified: 0 });
    write(app, "design/react/accordion.ts", added["react/accordion.ts"] + "\n// Local change");
    expect(scan().cells.accordion).toMatchObject({ shared: 0, local: 0, unverified: 1 });
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
    expect(scan().cells.radio).toMatchObject({ shared: 1, local: 1, unverified: 0 });
    expect(scan().cells.switch).toMatchObject({ shared: 1, local: 1, unverified: 0 });
    expect(scan().cells.select).toMatchObject({ shared: 1, local: 1, unverified: 0 });
    expect(scan().cells.color).toMatchObject({ shared: 1, local: 1, unverified: 0 });
    write(app, 'design/react/choice.ts', added['react/choice.ts'] + '\n// Local changes');
    expect(scan().cells.select).toMatchObject({ shared: 0, local: 1, unverified: 1 });
    expect(scan().cells.color).toMatchObject({ shared: 0, local: 1, unverified: 1 });
    expect(scan().cells.checkbox).toMatchObject({ shared: 0, local: 1, unverified: 1 });
    expect(scan().cells.radio).toMatchObject({ shared: 0, local: 1, unverified: 1 });
    expect(scan().cells.switch).toMatchObject({ shared: 0, local: 1, unverified: 1 });
    expect(scan().cells.input).toMatchObject({ shared: 2, local: 1, unverified: 0 });
    expect(scan().cells.textarea).toMatchObject({ shared: 1, local: 1, unverified: 0 });
    expect(scan().cells.button).toMatchObject({ shared: 3, unverified: 0 });
    expect(scan().cells.dialog).toMatchObject({ shared: 1, local: 3, unverified: 0 });
    write(app, 'design/react/dialog.ts', added['react/dialog.ts'] + '\n// Local changes');
    expect(scan().cells.dialog).toMatchObject({ shared: 0, local: 3, unverified: 1 });
    write(app, 'design/react/button.ts', added['react/button.ts'] + '\n// Local changes');
    expect(scan().cells.button).toMatchObject({ shared: 0, unverified: 3 });
    expect(scan().cells.input).toMatchObject({ shared: 2, unverified: 0 });
    manifest.files['react/button.ts'] = createHash('sha256').update(readFileSync(join(app, 'design/react/button.ts'))).digest('hex');
    writeFileSync(manifestPath, JSON.stringify(manifest));
    expect(scan().cells.button).toMatchObject({ shared: 0, unverified: 3 });
    write(app, 'design/react/input.ts', added['react/input.ts'] + '\n// Local changes');
    expect(scan().cells.input).toMatchObject({ shared: 0, local: 1, unverified: 2 });
    expect(scan().cells.textarea).toMatchObject({ shared: 0, local: 1, unverified: 1 });
    manifest.files['react/input.ts'] = createHash('sha256').update(readFileSync(join(app, 'design/react/input.ts'))).digest('hex');
    writeFileSync(manifestPath, JSON.stringify(manifest));
    expect(scan().cells.input).toMatchObject({ shared: 0, unverified: 2 });
  }, 60_000); // This integration fixture repeatedly reads Git across every adapter graph; a full parallel run can take over 20 seconds.
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

it("counts token fields and tokens using verified adapter imports and rejects modified adapters", () => {
  const {studio, ds, app}=fixture();
  const files={"2-core/ds-token.ts":"export const token = true;", "3-unit/ds-token-field.ts":"export const field = true;", "react/token-field.ts":'import type { Token } from "../2-core/ds-token"; import type { TokenField } from "../3-unit/ds-token-field";'};
  for (const [file,body] of Object.entries(files)) {write(ds,`DS1/${file}`,body);write(app,`design/${file}`,body);}
  git(ds,'add','.');git(ds,'-c','user.name=Test','-c','user.email=test@example.com','commit','-m','Add token fields');
  const path=join(app,'design/components-manifest.json'),manifest=JSON.parse(readFileSync(path,'utf8'));
  manifest.commit=git(ds,'rev-parse','HEAD');manifest.components.push('token','token-field');
  for(const [file,body] of Object.entries(files))manifest.files[file]=createHash('sha256').update(body).digest('hex');
  writeFileSync(path,JSON.stringify(manifest));
  write(app,'src/field.tsx','import {Token, TokenField} from "../design/react/token-field"; export const field = <><Token /><TokenField /><ds-token-field><input /></ds-token-field></>;');
  git(app,'add','.');git(app,'-c','user.name=Test','-c','user.email=test@example.com','commit','-m','Use token fields');
  const scan=()=>scanApp({id:'example',name:'Example',directory:'Example',roots:['src'],manifest:'design/components-manifest.json'},studio,ds);
  expect(scan().cells['token-field']).toMatchObject({shared:2,local:0,unverified:0});expect(scan().cells.token.shared).toBe(1);expect(scan().cells.input.local).toBe(0);
  write(app,'design/react/token-field.ts',files['react/token-field.ts']+'\n// Local modification');
  expect(scan().cells['token-field']).toMatchObject({shared:1,unverified:1});expect(scan().cells.token.unverified).toBe(1);
  for(const file of ['view.html','view.tsx'])expect(sourceSites(file,'<ds-token-field><input /></ds-token-field><input />').map(site=>site.tag)).toEqual(['ds-token-field','input']);
});

it("counts shared context menu frames and native action rows through re-exports, including source changes", () => {
  const { studio, ds, app } = fixture();
  const files = {
    "3-unit/ds-menu.ts": "export class Menu {}",
    "react/menu.ts": 'import type { Menu } from "../3-unit/ds-menu"; export const Menu = () => null;',
    "react/button.ts": 'import type { Button } from "../2-core/ds-button"; export const Button = () => null;',
    "react/context-menu.ts": 'import { Menu } from "./menu"; import { Button } from "./button"; export const ContextMenuContent = Menu; export const ContextMenuSubContent = Menu; export const ContextMenuItem = Button; export const ContextMenuSubTrigger = Button; export const ContextMenuRadioItem = Button;',
  };
  for (const [file, body] of Object.entries(files)) { write(ds, `DS1/${file}`, body); write(app, `design/${file}`, body); }
  git(ds, "add", "."); git(ds, "-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-m", "Add menu composition");
  const path = join(app, "design/components-manifest.json"), manifest = JSON.parse(readFileSync(path, "utf8"));
  manifest.commit = git(ds, "rev-parse", "HEAD"); manifest.components.push("menu");
  for (const [file, body] of Object.entries(files)) manifest.files[file] = createHash("sha256").update(body).digest("hex");
  writeFileSync(path, JSON.stringify(manifest));
  write(app, "src/menu.ts", 'import "./register"; export { ContextMenuContent as Content, ContextMenuSubContent as Sub, ContextMenuItem as Item, ContextMenuSubTrigger as Trigger, ContextMenuRadioItem as Radio } from "../design/react/context-menu";');
  write(app, "src/example.tsx", 'import { Content, Sub, Item, Trigger, Radio } from "./menu"; export const view = <Content><Item /><Trigger /><Sub><Radio /></Sub></Content>;');
  git(app, "add", "."); git(app, "-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-m", "Use shared menu");
  const scan = () => scanApp({ id: "example", name: "Example", directory: "Example", roots: ["src"], manifest: "design/components-manifest.json" }, studio, ds);
  expect(scan().cells.menu).toMatchObject({ shared: 2, unverified: 0 });
  expect(scan().cells.button).toMatchObject({ shared: 3, unverified: 0 });
  write(app, "design/react/context-menu.ts", files["react/context-menu.ts"] + "\n// Changed composition");
  expect(scan().cells.menu).toMatchObject({ shared: 0, unverified: 2 });
  expect(scan().cells.button).toMatchObject({ shared: 0, unverified: 3 });
});

it("counts native and shared file pickers separately and verifies the adapter source", () => {
  const {studio, ds, app}=fixture();
  const files={"2-core/ds-file-picker.ts":"export const picker = true;", "react/file-picker.ts":'export const FilePicker = () => null;'};
  for (const [file,body] of Object.entries(files)) {write(ds,`DS1/${file}`,body);write(app,`design/${file}`,body);}
  git(ds,'add','.');git(ds,'-c','user.name=Test','-c','user.email=test@example.com','commit','-m','Add file picker');
  const path=join(app,'design/components-manifest.json'),manifest=JSON.parse(readFileSync(path,'utf8'));
  manifest.commit=git(ds,'rev-parse','HEAD');manifest.components.push('file-picker');
  for(const [file,body] of Object.entries(files))manifest.files[file]=createHash('sha256').update(body).digest('hex');
  writeFileSync(path,JSON.stringify(manifest));
  write(app,'src/field.tsx','import {FilePicker} from "../design/react/file-picker"; export const field = <><FilePicker label="Logo" /><ds-file-picker><input type="file" /></ds-file-picker><input type="file" /></>;');
  git(app,'add','.');git(app,'-c','user.name=Test','-c','user.email=test@example.com','commit','-m','Use shared picker');
  const scan=()=>scanApp({id:'example',name:'Example',directory:'Example',roots:['src'],manifest:'design/components-manifest.json'},studio,ds);
  expect(scan().cells['file-picker']).toMatchObject({shared:2,local:1,unverified:0});
  expect(scan().cells.input.local).toBe(0);
  write(app,'design/react/file-picker.ts',files['react/file-picker.ts']+'\n// Local modification');
  expect(scan().cells['file-picker']).toMatchObject({shared:1,local:1,unverified:1});
  for(const file of ['field.html','field.tsx']) {
    const sites=sourceSites(file,'<ds-file-picker><input type="file" /></ds-file-picker><input type="file" />');
    expect(sites.map(site=>site.tag)).toEqual(['ds-file-picker','input']);
    expect(sites[1].controlKind).toBe('file-picker');
  }
});

it("verifies badge adapters and keeps their composed icons out of product counts", () => {
  const {studio, ds, app}=fixture();
  const files={"2-core/ds-badge.ts":"export class Badge {}", "react/badge.ts":'import type { Badge } from "../2-core/ds-badge"; export const Badge = () => null;'};
  for (const [file,body] of Object.entries(files)) {write(ds,`DS1/${file}`,body);write(app,`design/${file}`,body);}
  git(ds,'add','.');git(ds,'-c','user.name=Test','-c','user.email=test@example.com','commit','-m','Add badge');
  const path=join(app,'design/components-manifest.json'),manifest=JSON.parse(readFileSync(path,'utf8'));
  manifest.commit=git(ds,'rev-parse','HEAD');manifest.components.push('badge');
  for(const [file,body] of Object.entries(files))manifest.files[file]=createHash('sha256').update(body).digest('hex');
  writeFileSync(path,JSON.stringify(manifest));
  write(app,'src/status.tsx','import {Badge} from "../design/react/badge"; export const view = <><Badge icon="lock">Locked</Badge><ds-badge icon="archive">Archived</ds-badge></>;');
  git(app,'add','.');git(app,'-c','user.name=Test','-c','user.email=test@example.com','commit','-m','Use badge');
  const scan=()=>scanApp({id:'example',name:'Example',directory:'Example',roots:['src'],manifest:'design/components-manifest.json'},studio,ds);
  expect(scan().cells.badge).toMatchObject({shared:2,unverified:0});
  expect(scan().cells.icon.shared).toBe(0);
  write(app,'design/react/badge.ts',files['react/badge.ts']+'\n// Local modification');
  expect(scan().cells.badge).toMatchObject({shared:1,unverified:1});
});

describe("class copies, direct source and scoped checkouts", () => {
  const sha = (body: string) => createHash("sha256").update(body).digest("hex");
  const styles = { "controls.css": ".ds-button { }", "component-tokens.css": ":root { --t: 1; }", "component-metrics.css": ":root { --m: 1; }", "component-appearance.css": ":root { --a: 1; }" };
  function lockFixture() {
    const studio = mkdtempSync(join(tmpdir(), "component-adoption-")); temporary.push(studio);
    const ds = join(studio, "Design system 1"), app = join(studio, "Classes");
    for (const root of [ds, app]) { mkdirSync(root); git(root, "init", "-b", "main"); }
    for (const [file, body] of Object.entries(styles)) { write(ds, `DS1/1-root/${file}`, body); write(app, `web/ds1/${file}`, body); }
    write(ds, "DS1/2-core/ds-button.ts", "export const tag = 'ds-button';");
    git(ds, "add", "."); git(ds, "-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-m", "Styles");
    const commit = git(ds, "rev-parse", "HEAD");
    write(app, "sync.lock.json", JSON.stringify({ "Design system 1": { commit, files: Object.fromEntries(Object.entries(styles).map(([file, body]) => [`web/ds1/${file}`, sha(body)])) } }));
    write(app, "web/src/page.ts", 'import { h } from "./dom";\nexport const view = () => [h("button", { className: "ds-button" }), h("textarea", { className: "ds-textarea" }), h("input", { className: "ds-radio", type: "radio" })];\n');
    write(app, "web/src/dom.ts", "export const h = (tag: string, props: object) => ({ tag, props });\n");
    git(app, "add", "."); git(app, "-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-m", "Page");
    return { studio, ds, app };
  }

  it("verifies a tokens-only copy from its lock and counts its native classes as DS1 styles", () => {
    const { studio, ds } = lockFixture();
    const report = scanApp({ id: "classes", name: "Classes", directory: "Classes", roots: ["web"] }, studio, ds);
    expect(report.status).toBe("scanned");
    expect(report.cells.button).toMatchObject({ styled: 1, unverified: 0 });
    expect(report.cells.textarea).toMatchObject({ styled: 1, unverified: 0 });
    expect(report.cells.radio).toMatchObject({ styled: 1, unverified: 0 });
  });

  it("does not verify a locked copy that was edited or whose lock does not match the revision", () => {
    const { ds, app } = lockFixture();
    expect(checkLockedControls(app, ds)).toMatchObject({ snapshot: "verified", current: true });
    write(app, "web/ds1/controls.css", ".ds-button { color: red; }");
    expect(checkLockedControls(app, ds)?.snapshot).toBe("modified");
    write(app, "web/ds1/controls.css", styles["controls.css"]);
    const lock = JSON.parse(readFileSync(join(app, "sync.lock.json"), "utf8"));
    lock["Design system 1"].files["web/ds1/controls.css"] = sha(".ds-button { forged }");
    write(app, "web/ds1/controls.css", ".ds-button { forged }");
    write(app, "sync.lock.json", JSON.stringify(lock));
    expect(checkLockedControls(app, ds)?.snapshot).toBe("unverified");
  });

  it("counts Design system 1's own direct DS1 imports as source, and refuses direct source elsewhere", () => {
    const { studio, ds } = lockFixture();
    write(ds, "app/src/view.ts", "export const view = html`<ds-button>Save</ds-button>`;\n");
    git(ds, "add", "."); git(ds, "-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-m", "App");
    const report = scanApp({ id: "ds1", name: "Design system 1", directory: "Design system 1", roots: ["app/src"], source: "direct" }, studio, ds);
    expect(report.cells.button).toMatchObject({ shared: 1, unverified: 0 });
    expect(report.snapshotCommit).toBeNull();
    write(ds, "DS1/2-core/ds-button.ts", "export const tag = 'changed';");
    expect(scanApp({ id: "ds1", name: "Design system 1", directory: "Design system 1", roots: ["app/src"], source: "direct" }, studio, ds).cells.button).toMatchObject({ shared: 0, unverified: 1 });
    expect(scanApp({ id: "x", name: "X", directory: "Classes", roots: ["web"], source: "direct" }, studio, ds).status).toBe("unavailable");
  });

  it("reports a checkout dirty only for changes in the app's own folder", () => {
    const { studio, ds, app } = lockFixture();
    write(app, "sibling/note.txt", "another product's uncommitted work");
    const scoped = scanApp({ id: "classes", name: "Classes", directory: "Classes/web", roots: ["src"] }, studio, ds);
    expect(scoped.dirty).toBe(false);
    write(app, "web/src/new.ts", "export {};\n");
    expect(scanApp({ id: "classes", name: "Classes", directory: "Classes/web", roots: ["src"] }, studio, ds).dirty).toBe(true);
  });
});

describe("text on the grid: .ds-text classes and prose", () => {
  const sha = (body: string) => createHash("sha256").update(body).digest("hex");
  const component = { "component-tokens.css": ":root { --t: 1; }", "component-metrics.css": ":root { --m: 1; }", "component-appearance.css": ":root { --a: 1; }" };
  function textFixture(copied: Record<string, string>) {
    const studio = mkdtempSync(join(tmpdir(), "component-adoption-")); temporary.push(studio);
    const ds = join(studio, "Design system 1"), app = join(studio, "Pages");
    for (const root of [ds, app]) { mkdirSync(root); git(root, "init", "-b", "main"); }
    const sheets = { "text.css": ".ds-text { line-height: 20px; }", "prose.css": "[data-ds-prose] { line-height: 20px; }", "one.css": ".ds-text { margin: 0; }", ...component };
    for (const [file, body] of Object.entries(sheets)) write(ds, `DS1/1-root/${file}`, body);
    write(ds, "DS1/2-core/ds-text.ts", "export const tag = 'ds-text';");
    git(ds, "add", "."); git(ds, "-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-m", "Sheets");
    const commit = git(ds, "rev-parse", "HEAD");
    const files = { ...component, ...copied };
    for (const [file, body] of Object.entries(files)) write(app, `web/ds1/${file}`, body);
    write(app, "sync.lock.json", JSON.stringify({ "Design system 1": { commit, files: Object.fromEntries(Object.entries(files).map(([file, body]) => [`web/ds1/${file}`, sha(body)])) } }));
    write(app, "web/index.html", [
      '<h1 class="ds-text ds-text--display">Title</h1>',
      '<p class="ds-text--muted">A note</p>',
      '<article data-ds-prose><h2>Section</h2><p>Writing</p><ul><li>One</li></ul><table></table><div data-ds-not-prose><p>Example</p></div></article>',
      '<p>Local</p>',
    ].join("\n"));
    git(app, "add", "."); git(app, "-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-m", "Page");
    return { studio, ds, app, scan: () => scanApp({ id: "pages", name: "Pages", directory: "Pages", roots: ["web"] }, studio, ds) };
  }

  it("recognizes native text with a literal ds-text class, and only text", () => {
    for (const file of ["page.html", "view.tsx"]) {
      const attribute = file.endsWith("x") ? "className" : "class";
      const sites = sourceSites(file, `<><p ${attribute}="lead ds-text ds-text--muted">A</p><h3 ${attribute}="ds-text--heading">B</h3><p ${attribute}="my-ds-text">C</p><textarea ${attribute}="ds-textarea" /><span ${attribute}="ds-text">D</span></>`);
      expect(sites.filter(site => site.nativeStyle).map(site => [site.tag, site.nativeStyle])).toEqual([["p", "ds-text"], ["h3", "ds-text"], ["textarea", "ds-textarea"]]);
    }
  });

  it("marks text, lists and tables inside data-ds-prose, and leaves data-ds-not-prose parts and the outside alone", () => {
    const markup = '<article data-ds-prose><h1>T</h1><p>A</p><ul><li>x</li></ul><table></table><div data-ds-not-prose><p>B</p></div><p>C</p></article><p>D</p>';
    for (const [file, source] of [["page.html", markup], ["view.tsx", `const view = <>${markup}</>;`], ["view.ts", `const view = html\`<article data-ds-prose>\${intro}<p>A</p></article><p>D</p>\`;`]] as const) {
      const sites = sourceSites(file, source).filter(site => ["h1", "p", "ul", "table"].includes(site.tag));
      const expected = file === "view.ts" ? [["p", true], ["p", false]] : [["h1", true], ["p", true], ["ul", true], ["table", true], ["p", false], ["p", true], ["p", false]];
      expect(sites.map(site => [site.tag, site.prose === true]), file).toEqual(expected);
    }
  });

  it("counts .ds-text and prose sites as DS1 styles when the lock verifies text.css and prose.css", () => {
    const { scan } = textFixture({ "text.css": ".ds-text { line-height: 20px; }", "prose.css": "[data-ds-prose] { line-height: 20px; }" });
    const report = scan();
    // The example inside data-ds-not-prose and the paragraph outside stay local.
    expect(report.cells.text).toMatchObject({ styled: 4, local: 2, unverified: 0 });
    expect(report.cells.list).toMatchObject({ styled: 1, local: 0 });
    expect(report.cells.table).toMatchObject({ styled: 1, local: 0 });
    expect(report.cells.text!.sites.map(site => site.tag)).toEqual(["h1.ds-text", "p.ds-text", "h2[data-ds-prose]", "p[data-ds-prose]", "p", "p"]);
  });

  it("needs review when the sheet that draws a site is edited or missing", () => {
    const { app, scan } = textFixture({ "text.css": ".ds-text { line-height: 20px; }" });
    expect(scan().cells.text).toMatchObject({ styled: 2, unverified: 2, local: 2 });
    expect(scan().cells.text!.issues).toContain("DS1 prose styles could not be verified.");
    write(app, "web/ds1/text.css", ".ds-text { line-height: 16px; }");
    expect(scan().cells.text).toMatchObject({ styled: 0, unverified: 4 });
    expect(scan().cells.text!.issues).toContain("Native DS1 text styles could not be verified.");
  });

  it("verifies .ds-text through a component manifest that carries text.css", () => {
    const { studio, ds, app } = fixture();
    write(app, "src/page.tsx", 'export const Page = () => <p className="ds-text">Saved</p>;');
    git(app, "add", "."); git(app, "-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-m", "Page");
    const scan = () => scanApp({ id: "example", name: "Example", directory: "Example", roots: ["src"], manifest: "design/components-manifest.json" }, studio, ds);
    expect(scan().cells.text).toMatchObject({ styled: 0, unverified: 1 });
    const body = ".ds-text { line-height: 20px; }";
    write(ds, "DS1/1-root/text.css", body); write(app, "design/1-root/text.css", body);
    git(ds, "add", "."); git(ds, "-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-m", "Text");
    const path = join(app, "design/components-manifest.json"), manifest = JSON.parse(readFileSync(path, "utf8"));
    manifest.commit = git(ds, "rev-parse", "HEAD"); manifest.files["1-root/text.css"] = sha(body);
    writeFileSync(path, JSON.stringify(manifest));
    expect(scan().cells.text).toMatchObject({ styled: 1, unverified: 0 });
  });

  it("accepts an older copy of one.css that held .ds-text itself, and no other", () => {
    expect(textFixture({ "one.css": ".ds-text { margin: 0; }" }).scan().cells.text).toMatchObject({ styled: 2, unverified: 2 });
    const { ds, app } = textFixture({ "one.css": ".ds-text { margin: 0; }" });
    expect(checkLockedText(app, ds)).toMatchObject({ snapshot: "verified" });
    write(ds, "DS1/1-root/one.css", ":root { --x: 1; }"); git(ds, "add", "."); git(ds, "-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-m", "Move text out");
    const lock = JSON.parse(readFileSync(join(app, "sync.lock.json"), "utf8"));
    lock["Design system 1"].commit = git(ds, "rev-parse", "HEAD"); lock["Design system 1"].files["web/ds1/one.css"] = sha(":root { --x: 1; }");
    write(app, "web/ds1/one.css", ":root { --x: 1; }"); write(app, "sync.lock.json", JSON.stringify(lock));
    expect(checkLockedText(app, ds)?.snapshot).toBe("unverified");
  });
});
