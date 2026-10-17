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
      'const view = <><button aria-label="<button>" /><ds-row>{items.map(item => <ds-button />)}</ds-row></>;',
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

describe("empty states and notices", () => {
  const sha = (body: string) => createHash("sha256").update(body).digest("hex");
  const commit = (root: string, message: string) => { git(root, "add", "."); git(root, "-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-m", message); };

  it("recognizes .ds-empty and .ds-notice on any element and keeps their text parts in the block", () => {
    for (const file of ["page.html", "view.tsx"]) {
      const attribute = file.endsWith("x") ? "className" : "class";
      const sites = sourceSites(file, `<><section ${attribute}="ds-empty ds-empty--centered"><h2 ${attribute}="ds-empty__title">Nothing here yet</h2><p ${attribute}="ds-empty__text">Add one.</p><div ${attribute}="ds-empty__actions"><button ${attribute}="ds-button">Add</button></div></section><div ${attribute}="ds-notice ds-notice--danger" role="alert"><p ${attribute}="ds-notice__text">Failed</p></div><p ${attribute}="my-ds-notice">Local</p></>`);
      expect(sites.filter(site => site.nativeStyle).map(site => [site.tag, site.nativeStyle]), file).toEqual([["section", "ds-empty"], ["h2", "block-part"], ["p", "block-part"], ["button", "ds-button"], ["div", "ds-notice"], ["p", "block-part"]]);
    }
    expect(sourceSites("view.ts", 'import { h } from "./dom"; h("div", { class: "ds-notice ds-notice--warning" });')[0]).toMatchObject({ tag: "div", nativeStyle: "ds-notice" });
  });

  it("verifies the native classes through the sheet that draws each, from the lock", () => {
    const studio = mkdtempSync(join(tmpdir(), "component-adoption-")); temporary.push(studio);
    const ds = join(studio, "Design system 1"), app = join(studio, "Pages");
    for (const root of [ds, app]) { mkdirSync(root); git(root, "init", "-b", "main"); }
    const sheets = { "notice.css": ".ds-notice { display: grid; }", "empty.css": ".ds-empty { display: flex; }", "component-tokens.css": ":root { --t: 1; }", "component-metrics.css": ":root { --m: 1; }", "component-appearance.css": ":root { --a: 1; }" };
    for (const [file, body] of Object.entries(sheets)) write(ds, `DS1/1-root/${file}`, body);
    commit(ds, "Sheets");
    // The product copied the notice sheet and the tokens, not the empty-state sheet.
    const copied = Object.fromEntries(Object.entries(sheets).filter(([file]) => file !== "empty.css"));
    for (const [file, body] of Object.entries(copied)) write(app, `web/ds1/${file}`, body);
    write(app, "sync.lock.json", JSON.stringify({ "Design system 1": { commit: git(ds, "rev-parse", "HEAD"), files: Object.fromEntries(Object.entries(copied).map(([file, body]) => [`web/ds1/${file}`, sha(body)])) } }));
    write(app, "web/index.html", '<div class="ds-notice" role="status"><p class="ds-notice__text">Saved</p></div>\n<section class="ds-empty"><p class="ds-empty__title">Nothing here yet</p></section>\n<p>Local</p>');
    commit(app, "Page");
    const scan = () => scanApp({ id: "pages", name: "Pages", directory: "Pages", roots: ["web"] }, studio, ds);
    expect(scan().cells.notice).toMatchObject({ styled: 1, unverified: 0 });
    expect(scan().cells.notice!.sites.map(site => site.tag)).toEqual(["div.ds-notice"]);
    expect(scan().cells.empty).toMatchObject({ styled: 0, unverified: 1 });
    expect(scan().cells.text).toMatchObject({ local: 1, styled: 0, unverified: 0 });
    write(app, "web/ds1/notice.css", ".ds-notice { display: block; }");
    expect(scan().cells.notice).toMatchObject({ styled: 0, unverified: 1 });
  });

  it("counts a native table with the ds-table class as DS1 styles, verified through table.css", () => {
    expect(sourceSites("view.html", '<div class="ds-table-scroll"><table class="ds-table"><tr><td data-numeric>1</td></tr></table></div><table><tr><td>2</td></tr></table>').filter(site => site.tag === "table").map(site => site.nativeStyle)).toEqual(["ds-table", undefined]);
    const studio = mkdtempSync(join(tmpdir(), "component-adoption-")); temporary.push(studio);
    const ds = join(studio, "Design system 1"), app = join(studio, "Pages");
    for (const root of [ds, app]) { mkdirSync(root); git(root, "init", "-b", "main"); }
    const sheets = { "table.css": ".ds-table { border-collapse: collapse; }", "component-tokens.css": ":root { --t: 1; }", "component-metrics.css": ":root { --m: 1; }", "component-appearance.css": ":root { --a: 1; }" };
    for (const [file, body] of Object.entries(sheets)) write(ds, `DS1/1-root/${file}`, body);
    commit(ds, "Sheets");
    for (const [file, body] of Object.entries(sheets)) write(app, `web/ds1/${file}`, body);
    write(app, "sync.lock.json", JSON.stringify({ "Design system 1": { commit: git(ds, "rev-parse", "HEAD"), files: Object.fromEntries(Object.entries(sheets).map(([file, body]) => [`web/ds1/${file}`, sha(body)])) } }));
    write(app, "web/index.html", '<table class="ds-table"><tr><td>1</td></tr></table>\n<table><tr><td>2</td></tr></table>');
    commit(app, "Page");
    const scan = () => scanApp({ id: "pages", name: "Pages", directory: "Pages", roots: ["web"] }, studio, ds);
    expect(scan().cells.table).toMatchObject({ styled: 1, local: 1, unverified: 0 });
    write(app, "web/ds1/table.css", ".ds-table { border: 0; }");
    expect(scan().cells.table).toMatchObject({ styled: 0, local: 1, unverified: 1 });
  });

  it("verifies ds-empty, ds-notice and their React adapters through the manifest, and flags a modified adapter", () => {
    const { studio, ds, app } = fixture();
    const files = {
      "2-core/ds-empty.ts": "export class Empty {}",
      "2-core/ds-notice.ts": "export class Notice {}",
      "1-root/empty.css": ".ds-empty { display: flex; }",
      "1-root/notice.css": ".ds-notice { display: grid; }",
      "react/empty.ts": 'import type { Empty as E } from "../2-core/ds-empty"; export const Empty = () => null;',
      "react/notice.ts": 'import type { Notice as N } from "../2-core/ds-notice"; export const Notice = () => null;',
    };
    for (const [file, body] of Object.entries(files)) { write(ds, `DS1/${file}`, body); write(app, `design/${file}`, body); }
    commit(ds, "Add empty states and notices");
    const path = join(app, "design/components-manifest.json"), manifest = JSON.parse(readFileSync(path, "utf8"));
    manifest.commit = git(ds, "rev-parse", "HEAD"); manifest.components.push("empty", "notice");
    for (const [file, body] of Object.entries(files)) manifest.files[file] = sha(body);
    writeFileSync(path, JSON.stringify(manifest));
    write(app, "src/view.tsx", 'import { Notice } from "../design/react/notice";\nimport { Empty } from "../design/react/empty";\nexport const view = <><Notice tone="danger">Failed</Notice><Empty heading="No lists" /><ds-notice tone="success"></ds-notice><div className="ds-empty" /></>;\n');
    commit(app, "Use empty states and notices");
    const scan = () => scanApp({ id: "example", name: "Example", directory: "Example", roots: ["src"], manifest: "design/components-manifest.json" }, studio, ds);
    expect(scan().cells.notice).toMatchObject({ shared: 2, unverified: 0, local: 0 });
    expect(scan().cells.empty).toMatchObject({ shared: 1, styled: 1, unverified: 0 });
    write(app, "design/react/notice.ts", files["react/notice.ts"] + "\n// Local modification");
    expect(scan().cells.notice).toMatchObject({ shared: 1, unverified: 1 });
    expect(scan().cells.notice!.issues).toContain("Locally modified: react/notice.ts");
  });

  it("counts Design system 1's own empty states and notices as source", () => {
    const studio = mkdtempSync(join(tmpdir(), "component-adoption-")); temporary.push(studio);
    const ds = join(studio, "Design system 1"); mkdirSync(ds); git(ds, "init", "-b", "main");
    write(ds, "DS1/2-core/ds-notice.ts", "export class Notice {}");
    write(ds, "DS1/1-root/notice.css", ".ds-notice { display: grid; }");
    write(ds, "DS1/react/notice.ts", 'import type { Notice as N } from "../2-core/ds-notice"; export const Notice = () => null;');
    write(ds, "app/src/view.tsx", 'import { Notice } from "../../DS1/react/notice";\nexport const view = <><Notice tone="danger">Failed</Notice><div className="ds-notice"><p className="ds-notice__text">Saved</p></div></>;\n');
    commit(ds, "App");
    const report = scanApp({ id: "ds1", name: "Design system 1", directory: "Design system 1", roots: ["app/src"], source: "direct" }, studio, ds);
    expect(report.cells.notice).toMatchObject({ shared: 1, styled: 1, unverified: 0 });
    expect(report.cells.text).toMatchObject({ shared: 0, styled: 0, local: 0 });
  });
});

/** Tags the scanner places in a column: custom elements and the recognized native elements. */
const counted = (tag: string) => tag.includes("-") || ["button", "input", "select", "textarea", "p", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "table", "form", "dialog", "details"].includes(tag);

describe("classes written in code and local DOM builders", () => {
  const styles = (source: string) => sourceSites("view.ts", source).map(site => [site.tag, site.nativeStyle]);
  it("reads literal className, class attributes and class lists on an element created in the same block", () => {
    expect(styles('function view() { const save = document.createElement("button"); save.className = "ds-button ds-button--primary"; const name = document.createElement("input"); name.setAttribute("class", "ds-input wide"); const icon = document.createElement("span"); icon.className = "ds-icon " + kind; host.append(save, name, icon); }'))
      .toEqual([["button", "ds-button"], ["input", "ds-input"], ["span", "ds-icon"]]);
    expect(styles('let face; if (!face) { face = document.createElement("button"); face.className = "ds-button"; }')).toEqual([["button", "ds-button"]]);
  });
  it("does not infer dynamic classes or classes written in another scope", () => {
    expect(styles('function view(kind) { const save = document.createElement("button"); save.className = kind; return save; } function later(save) { save.className = "ds-button"; }')).toEqual([["button", undefined]]);
    expect(styles('const save = document.createElement("button"); function later() { save.className = "ds-button"; }')).toEqual([["button", undefined]]);
  });
  it("follows a helper whose first parameter goes into document.createElement, with its class parameter and options", () => {
    const source = [
      'function el(tag, cls, text) { const node = document.createElement(tag); if (cls) node.className = cls; if (text) node.textContent = text; return node; }',
      'const make = (tag, props) => Object.assign(document.createElement(tag), props);',
      'el("button", "ds-button", "Save"); el("button", null, "No"); el(tagName); make("input", { className: "ds-input" });',
      'const yes = el("button", null, "Yes"); yes.classList.add("ds-button");',
    ].join("\n");
    expect(styles(source)).toEqual([["button", "ds-button"], ["button", undefined], ["input", "ds-input"], ["button", "ds-button"]]);
  });
  it("recognizes a builder by its definition, not its name", () => {
    expect(sourceSites("view.ts", 'const el = (id) => document.getElementById(id); el("button"); function make(name) { return document.createElement("div"); } make("input");').map(site => site.tag)).toEqual(["div"]);
  });
});

describe("markup is read only where it is markup", () => {
  const tags = (file: string, source: string) => sourceSites(file, source).map(site => site.tag).filter(counted);
  it("does not count code samples or ordinary strings", () => {
    expect(tags("view.tsx", 'const rows = [{ semantic: "<button>" }, { semantic: \'<input type="text">\' }]; const sample = "<button>Get started</button>"; export const View = () => <p>{"<select>"}</p>; run("formatBlock", "<p>");')).toEqual(["p"]);
  });
  it("reads Lit html templates, innerHTML, outerHTML, insertAdjacentHTML, __html, document.write and whole documents", () => {
    expect(tags("view.ts", [
      'const a = html`<button>A</button>`;',
      'host.innerHTML = `<input>` + (open ? "<select></select>" : "");',
      'host.outerHTML = "<textarea></textarea>";',
      'host.insertAdjacentHTML("beforeend", "<table></table>");',
      'const b = { __html: "<p>B</p>" };',
      'popup.document.write(`<h1>Log</h1>`);',
      'return new Response("<html><body><p>Waiting</p></body></html>");',
    ].join("\n"))).toEqual(["button", "input", "select", "textarea", "table", "p", "h1", "p"]);
  });
  it("follows markup built in local names, functions and arrays before it is written", () => {
    const source = [
      'const MENU = `<button class="ds-button">Menu</button>`;',
      'function row(name) { return `<li><button>${name}</button></li>`; }',
      'function list() { const out = []; out.push("<p>Intro</p>"); let html = "<ul>"; html += items.map(row).join(""); return out.join("") + html + "</ul>"; }',
      'host.innerHTML = MENU + list();',
      'const unused = "<input>";',
    ].join("\n");
    expect(tags("view.ts", source)).toEqual(["button", "button", "p", "ul"]);
  });
  it("follows a function another file writes into markup into the module that exports it", () => {
    const { studio, ds, app } = fixture();
    write(app, "src/details.ts", 'export function detailsHtml(name) { return `<h2>${name}</h2><button class="ds-button">Open</button>`; }\nexport const label = "<button>Not markup</button>";\n');
    write(app, "src/page.ts", 'import { detailsHtml, label } from "./details";\nhost.innerHTML = detailsHtml("A");\nconsole.log(label);\n');
    git(app, "add", "."); git(app, "-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-m", "Page");
    const report = scanApp({ id: "example", name: "Example", directory: "Example", roots: ["src"], manifest: "design/components-manifest.json" }, studio, ds);
    expect(report.cells.text).toMatchObject({ local: 1 });
    expect(report.cells.button?.sites.map(site => site.tag)).toEqual(["button.ds-button"]);
  });
});

describe("specimens, native frames of DS1 sites and shared parts", () => {
  const tags = (file: string, source: string) => sourceSites(file, source).map(site => site.tag).filter(counted);
  it("counts nothing under data-ds-specimen, in markup, JSX and DOM creation", () => {
    for (const file of ["page.html", "view.tsx"]) {
      expect(tags(file, '<section data-ds-specimen><h1>Heading</h1><button title="Specimen">Button</button><details><summary>More</summary></details></section><button>Counted</button>'), file).toEqual(["button"]);
    }
    expect(tags("view.tsx", 'import { createElement } from "react"; export const View = () => <div data-ds-specimen><button>{createElement("ds-icon", { type: "star" })}</button></div>;')).toEqual([]);
    expect(tags("view.ts", 'function measure() { const probe = document.createElement("button"); probe.setAttribute("data-ds-specimen", ""); document.body.append(probe); const real = document.createElement("button"); }')).toEqual(["button"]);
  });
  it("counts a heading or paragraph holding only a ds-text once, as the ds-text", () => {
    for (const file of ["page.html", "view.tsx"]) {
      expect(tags(file, '<h1 class="title"><ds-text text="welcome"></ds-text></h1><p>\n  <ds-text text="note"></ds-text>\n</p><h2>Plain <ds-text text="more"></ds-text></h2><p><ds-text text="a"></ds-text><ds-text text="b"></ds-text></p>'), file)
        .toEqual(["ds-text", "ds-text", "h2", "ds-text", "p", "ds-text", "ds-text"]);
    }
    expect(tags("view.ts", 'const a = html`<h1 class=${tone}><ds-text text="a"></ds-text></h1>`; const b = html`<h2>${title}<ds-text text="b"></ds-text></h2>`;')).toEqual(["ds-text", "h2", "ds-text"]);
    expect(tags("view.tsx", 'export const View = () => <h3>{label}<ds-text text="x" /></h3>;')).toEqual(["h3", "ds-text"]);
  });
  it("counts a list of ds-row items once, as its rows, and keeps other lists", () => {
    for (const file of ["page.html", "view.tsx"]) {
      expect(tags(file, '<ul><li><ds-row></ds-row><ds-row></ds-row></li><li><ds-row></ds-row></li></ul><ol><li>Text</li></ol><ul><li><ds-row></ds-row>More</li></ul>'), file)
        .toEqual(["ds-row", "ds-row", "ds-row", "ol", "ul", "ds-row"]);
    }
  });
  it("counts a dialog's data-ds-dialog parts as its frame, including markup written into a ds-dialog's native dialog", () => {
    for (const file of ["page.html", "view.tsx"]) {
      const attribute = file.endsWith("x") ? "className" : "class";
      expect(tags(file, `<dialog ${attribute}="ds-dialog"><h2 data-ds-dialog="title">Title</h2><p data-ds-dialog="description">Text</p><p>Other</p></dialog><div><h2 data-ds-dialog="title">Loose</h2></div>`), file).toEqual(["dialog", "p", "h2"]);
    }
    expect(tags("view.ts", 'function ask() { const frame = document.createElement("ds-dialog"); const dialog = document.createElement("dialog"); dialog.innerHTML = `<h2 data-ds-dialog="title">Sure?</h2><p data-ds-dialog="description">It goes.</p><p role="alert"></p>`; frame.append(dialog); }')).toEqual(["ds-dialog", "p"]);
    expect(tags("view.ts", 'function ask() { const dialog = document.createElement("dialog"); dialog.innerHTML = `<h2 data-ds-dialog="title">Sure?</h2>`; }')).toEqual(["dialog", "h2"]);
  });
  it("keeps a form around DS1 controls as a local Form lead", () => {
    expect(tags("page.html", '<form><ds-input></ds-input><ds-button></ds-button></form>')).toEqual(["form", "ds-input", "ds-button"]);
  });
  it("records custom elements defined in a copied shared folder as shared parts, verified by the lock when it matches", () => {
    const { studio, ds, app } = fixture();
    const definition = 'export function definePart(tag = "part-screen") { if (!customElements.get(tag)) customElements.define(tag, class extends HTMLElement {}); }\n';
    write(app, "src/signIn/part.ts", definition);
    write(app, "src/vendor/editor/editor.js", 'customElements.define("text-editor", class extends HTMLElement {});\n');
    write(app, "src/own.ts", 'customElements.define("own-widget", class extends HTMLElement {});\n');
    write(app, "src/page.html", "<part-screen></part-screen><text-editor></text-editor><own-widget></own-widget>");
    write(app, "sync.lock.json", JSON.stringify({ Editor: { commit: "0".repeat(40), files: { "src/vendor/editor/editor.js": createHash("sha256").update('customElements.define("text-editor", class extends HTMLElement {});\n').digest("hex") } } }));
    git(app, "add", "."); git(app, "-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-m", "Parts");
    const report = scanApp({ id: "example", name: "Example", directory: "Example", roots: ["src"], manifest: "design/components-manifest.json" }, studio, ds);
    expect(report.sharedParts).toEqual({ "part-screen": { uses: 1, definition: "src/signIn/part.ts" }, "text-editor": { uses: 1, definition: "src/vendor/editor/editor.js", lock: "Editor" } });
    expect(report.otherCustomElements).toEqual({ "own-widget": 1 });
  });
});

describe("tooltips, disclosures, browser dialogs, ranges and table roles", () => {
  const sha = (body: string) => createHash("sha256").update(body).digest("hex");
  const commit = (root: string, message: string) => { git(root, "add", "."); git(root, "-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-m", message); };
  const marks = (file: string, source: string) => sourceSites(file, source).filter(site => site.column || site.controlKind === "range").map(site => [site.tag, site.column ?? site.controlKind]);
  it("counts a literal title as a local Tooltip and data-tooltip as DS1's, in markup, JSX, factories and DOM", () => {
    for (const file of ["page.html", "view.tsx"]) {
      expect(marks(file, '<button title="Refresh">R</button><span data-tooltip="Close"></span><abbr title="Design system">DS</abbr><iframe title="Preview"></iframe><a title="">x</a><svg><title>Mark</title></svg>'), file)
        .toEqual([["button[title]", "tooltip"], ["span[data-tooltip]", "tooltip"]]);
    }
    expect(marks("view.tsx", 'export const View = () => <><Card title="Settings" /><button title={t("close")} /><button title={"Close"} /></>;')).toEqual([["button[title]", "tooltip"]]);
    expect(marks("view.ts", 'import { h } from "./dom"; h("button", { title: "Save" }); const b = document.createElement("button"); b.title = "Open"; b.setAttribute("data-tooltip", "Open"); document.title = "Page"; item.title = "Untitled"; node.setAttribute("title", "Loose");'))
      .toEqual([["button[title]", "tooltip"], ["button[title]", "tooltip"], ["button[data-tooltip]", "tooltip"], ["[title]", "tooltip"]]);
    expect(sourceSites("view.ts", 'host.innerHTML = `<button data-tooltip="Close"></button>`;').find(site => site.column)?.module).toBe("tooltips");
  });
  it("counts details once as a local Accordion, without its summary", () => {
    for (const file of ["page.html", "view.tsx"]) expect(sourceSites(file, "<details><summary>More</summary><p>Text</p></details>").map(site => site.tag).filter(counted), file).toEqual(["details", "p"]);
    expect(sourceSites("view.ts", 'const more = document.createElement("details"); const summary = document.createElement("summary");').map(site => site.tag).filter(counted)).toEqual(["details"]);
  });
  it("counts the browser's alert, confirm and prompt, and not a local or imported function of the same name", () => {
    expect(marks("view.ts", 'alert("Saved"); if (window.confirm("Delete?")) remove(); const name = globalThis.prompt("Name"); dialog.confirm(); state.alert = true;')).toEqual([["alert()", "dialog"], ["confirm()", "dialog"], ["prompt()", "dialog"]]);
    expect(marks("view.ts", 'function confirm(text) { return true; } confirm("Sure?"); const prompt = ask; prompt();')).toEqual([]);
    expect(sourceSites("view.ts", 'import { confirm as ask } from "./feedback"; ask({ title: "Sure?" });')).toMatchObject([{ tag: "confirm()", column: "dialog", imported: "ask" }]);
  });
  it("keeps range inputs and slider roles out of Input as a known gap", () => {
    for (const file of ["page.html", "view.tsx"]) expect(marks(file, '<input type="range" /><div role="slider"></div><input type="text" />'), file).toEqual([["input[type=range]", "range"], ["div[role=slider]", "range"]]);
    const { studio, ds, app } = fixture();
    write(app, "src/page.html", '<input type="range"><div role="slider" tabindex="0"></div><input>');
    commit(app, "Ranges");
    const report = scanApp({ id: "example", name: "Example", directory: "Example", roots: ["src"], manifest: "design/components-manifest.json" }, studio, ds);
    expect(report.gaps?.range?.map(site => site.tag)).toEqual(["input[type=range]", "div[role=slider]"]);
    expect(report.cells.input).toMatchObject({ local: 1 });
  });
  it("counts a literal table or grid role on a non-table element as a local Table", () => {
    for (const file of ["page.html", "view.tsx"]) expect(marks(file, '<div role="grid"></div><section role="table"></section><table role="grid"></table><ds-list role="grid"></ds-list><div role="list"></div>'), file).toEqual([["div[role=grid]", "table"], ["section[role=table]", "table"]]);
    expect(marks("view.ts", 'const grid = document.createElement("div"); grid.setAttribute("role", "grid"); other.setAttribute("role", "table");')).toEqual([["div[role=grid]", "table"], ["[role=table]", "table"]]);
  });
  it("verifies data-tooltip and imported DS1 dialogs through the copied page scripts, and needs review without them", () => {
    const studio = mkdtempSync(join(tmpdir(), "component-adoption-")); temporary.push(studio);
    const ds = join(studio, "Design system 1"), app = join(studio, "Pages");
    for (const root of [ds, app]) { mkdirSync(root); git(root, "init", "-b", "main"); }
    const scripts = { "0-face/tooltips.ts": "export function startTooltips() {}\n", "0-face/feedback.ts": 'export { alert, confirm, prompt } from "./dialogs";\n', "0-face/dialogs.ts": "export const confirm = async () => true; export const alert = async () => {}; export const prompt = async () => null;\n" };
    for (const [file, body] of Object.entries(scripts)) { write(ds, `DS1/${file}`, body); write(app, `web/ds1/${file}`, body); }
    commit(ds, "Scripts");
    write(app, "sync.lock.json", JSON.stringify({ "Design system 1": { commit: git(ds, "rev-parse", "HEAD"), files: Object.fromEntries(Object.entries(scripts).map(([file, body]) => [`web/ds1/${file}`, sha(body)])) } }));
    write(app, "web/src/page.ts", 'import { confirm } from "../ds1/0-face/feedback";\nimport { prompt } from "./ask";\nhost.innerHTML = `<button data-tooltip="Close"></button>`;\nif (await confirm({ title: "Delete?" })) remove();\nprompt();\nalert("Done");\n');
    write(app, "web/src/ask.ts", "export const prompt = () => null;\n");
    commit(app, "Page");
    const scan = () => scanApp({ id: "pages", name: "Pages", directory: "Pages", roots: ["web/src"] }, studio, ds);
    expect(scan().cells.tooltip).toMatchObject({ shared: 1, local: 0, unverified: 0 });
    expect(scan().cells.dialog).toMatchObject({ shared: 1, local: 1, unverified: 0 });
    write(app, "web/ds1/0-face/dialogs.ts", scripts["0-face/dialogs.ts"] + "// Local change\n");
    expect(scan().cells.dialog).toMatchObject({ shared: 0, local: 1, unverified: 1 });
    expect(scan().cells.dialog!.issues).toContain("Locally modified: web/ds1/0-face/dialogs.ts");
    write(app, "sync.lock.json", JSON.stringify({ "Design system 1": { commit: git(ds, "rev-parse", "HEAD"), files: {} } }));
    expect(scan().cells.tooltip).toMatchObject({ shared: 0, unverified: 1 });
  });
});

describe("stats, meters and steps", () => {
  const sha = (body: string) => createHash("sha256").update(body).digest("hex");
  const commit = (root: string, message: string) => { git(root, "add", "."); git(root, "-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-m", message); };

  it("recognizes .ds-stat, .ds-meter and .ds-steps on any element, keeps their text parts in the block and counts a native meter as local", () => {
    for (const file of ["page.html", "view.tsx"]) {
      const attribute = file.endsWith("x") ? "className" : "class";
      const sites = sourceSites(file, `<><div ${attribute}="ds-stats"><div ${attribute}="ds-stat"><p ${attribute}="ds-stat__label">Users</p><p ${attribute}="ds-stat__figure">12</p></div></div><span ${attribute}="ds-meter ds-meter--over" role="meter"><span ${attribute}="ds-meter__fill"></span></span><ol ${attribute}="ds-steps"><li ${attribute}="ds-steps__step">Apply</li></ol><meter value="0.5"></meter></>`);
      expect(sites.filter(site => site.nativeStyle).map(site => [site.tag, site.nativeStyle]), file).toEqual([["div", "ds-stat"], ["p", "block-part"], ["p", "block-part"], ["span", "ds-meter"], ["ol", "ds-steps"]]);
      expect(sites.some(site => site.tag === "meter" && !site.nativeStyle), file).toBe(true);
    }
  });

  it("verifies the classes through figures.css from the lock, and the React adapters through the manifest", () => {
    const studio = mkdtempSync(join(tmpdir(), "component-adoption-")); temporary.push(studio);
    const ds = join(studio, "Design system 1"), app = join(studio, "Pages");
    for (const root of [ds, app]) { mkdirSync(root); git(root, "init", "-b", "main"); }
    const sheets = { "figures.css": ".ds-stat { display: flex; }", "component-tokens.css": ":root { --t: 1; }", "component-metrics.css": ":root { --m: 1; }", "component-appearance.css": ":root { --a: 1; }" };
    for (const [file, body] of Object.entries(sheets)) write(ds, `DS1/1-root/${file}`, body);
    commit(ds, "Sheets");
    for (const [file, body] of Object.entries(sheets)) write(app, `web/ds1/${file}`, body);
    write(app, "sync.lock.json", JSON.stringify({ "Design system 1": { commit: git(ds, "rev-parse", "HEAD"), files: Object.fromEntries(Object.entries(sheets).map(([file, body]) => [`web/ds1/${file}`, sha(body)])) } }));
    write(app, "web/index.html", '<div class="ds-stat"><p class="ds-stat__figure">12</p></div>\n<ol class="ds-steps"><li class="ds-steps__step">Apply</li></ol>\n<meter value="1"></meter>');
    commit(app, "Page");
    const scan = () => scanApp({ id: "pages", name: "Pages", directory: "Pages", roots: ["web"] }, studio, ds);
    expect(scan().cells.stat).toMatchObject({ styled: 1, unverified: 0 });
    expect(scan().cells.steps).toMatchObject({ styled: 1, unverified: 0 });
    expect(scan().cells.meter).toMatchObject({ styled: 0, local: 1 });
    expect(scan().cells.text).toMatchObject({ styled: 0, local: 0 });
    write(app, "web/ds1/figures.css", ".ds-stat { display: block; }");
    expect(scan().cells.stat).toMatchObject({ styled: 0, unverified: 1 });

    const { studio: studio2, ds: ds2, app: app2 } = fixture();
    const files = {
      "2-core/ds-meter.ts": "export class Meter {}",
      "1-root/figures.css": ".ds-meter { display: block; }",
      "react/meter.ts": 'import type { Meter as M } from "../2-core/ds-meter"; export const Meter = () => null;',
    };
    for (const [file, body] of Object.entries(files)) { write(ds2, `DS1/${file}`, body); write(app2, `design/${file}`, body); }
    commit(ds2, "Add meters");
    const path = join(app2, "design/components-manifest.json"), manifest = JSON.parse(readFileSync(path, "utf8"));
    manifest.commit = git(ds2, "rev-parse", "HEAD"); manifest.components.push("meter");
    for (const [file, body] of Object.entries(files)) manifest.files[file] = sha(body);
    writeFileSync(path, JSON.stringify(manifest));
    write(app2, "src/view.tsx", 'import { Meter } from "../design/react/meter";\nexport const view = <><Meter value={1} /><ds-meter value="2"></ds-meter></>;\n');
    commit(app2, "Use meters");
    const scanned = () => scanApp({ id: "example", name: "Example", directory: "Example", roots: ["src"], manifest: "design/components-manifest.json" }, studio2, ds2);
    expect(scanned().cells.meter).toMatchObject({ shared: 2, unverified: 0, local: 0 });
    write(app2, "design/react/meter.ts", files["react/meter.ts"] + "\n// Local modification");
    expect(scanned().cells.meter).toMatchObject({ shared: 1, unverified: 1 });
  });
});
