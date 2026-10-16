import { afterEach, describe, expect, it } from "vite-plus/test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { sourceSites, scanApp, checkLockedControls, classRule } from "../scripts/component-adoption";

const temporary: string[] = [];
afterEach(() => { for (const dir of temporary.splice(0)) rmSync(dir, { recursive: true, force: true }); });
const write = (root: string, path: string, body: string) => { mkdirSync(dirname(join(root, path)), { recursive: true }); writeFileSync(join(root, path), body); };
const git = (root: string, ...args: string[]) => execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
const commit = (root: string, message: string) => { git(root, "add", "."); git(root, "-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-m", message); };
const sha = (body: string) => createHash("sha256").update(body).digest("hex");
/** The same markup as HTML, or as JSX in a fragment. */
const asFile = (file: string, markup: string) => file.endsWith(".tsx") ? `const view = <>${markup.replaceAll("class=", "className=").replace(/ style="[^"]*"/g, "")}</>;` : markup;

const pieces = [".ds-button { }", ".ds-input { }", ".ds-field { }", ".ds-field__hint { }", ".ds-avatar { }", ".ds-badge { }", ".ds-toggle { }", ":where(.ds-icon) { }", ".ds-drop { }"].join("\n");
const page = [
  '<label class="ds-field ds-field--beside"><span class="ds-field__label">Email</span><input class="ds-input" type="email" /></label>',
  '<p class="ds-field__hint">We send the code here.</p>',
  '<span class="ds-avatar ds-avatar--square" aria-hidden="true">A</span>',
  '<span class="ds-badge"><span class="ds-icon" style="--ds-icon: url(icons/lock.svg)"></span>Locked</span>',
  '<button class="ds-button ds-toggle" type="button" aria-pressed="false">Timeline</button>',
  '<label class="ds-drop">Drop pictures here<input type="file" multiple /></label>',
  '<label class="ds-button ds-button--secondary">Choose a file<input type="file" /></label>',
].join("\n");

/** A product that copies the tokens and controls.css with Sync 1, verified from its lock. */
function lockFixture(controls: string) {
  const studio = mkdtempSync(join(tmpdir(), "native-pieces-")); temporary.push(studio);
  const ds = join(studio, "Design system 1"), app = join(studio, "Pieces");
  for (const root of [ds, app]) { mkdirSync(root); git(root, "init", "-b", "main"); }
  const styles = { "controls.css": controls, "component-tokens.css": ":root { --t: 1; }", "component-metrics.css": ":root { --m: 1; }", "component-appearance.css": ":root { --a: 1; }" };
  for (const [file, body] of Object.entries(styles)) { write(ds, `DS1/1-root/${file}`, body); write(app, `web/ds1/${file}`, body); }
  commit(ds, "Styles");
  write(app, "sync.lock.json", JSON.stringify({ "Design system 1": { commit: git(ds, "rev-parse", "HEAD"), files: Object.fromEntries(Object.entries(styles).map(([file, body]) => [`web/ds1/${file}`, sha(body)])) } }));
  write(app, "web/index.html", page);
  commit(app, "Page");
  return { studio, ds, app, scan: () => scanApp({ id: "pieces", name: "Pieces", directory: "Pieces", roots: ["web"] }, studio, ds) };
}

describe("native pieces drawn by controls.css", () => {
  it("recognizes each piece class on any element, and a toggle only on a button", () => {
    for (const file of ["page.html", "view.tsx"]) {
      const sites = sourceSites(file, asFile(file, page)).filter(site => site.nativeStyle);
      expect(sites.map(site => `${site.tag}.${site.nativeStyle}`), file).toEqual(["label.ds-field", "input.ds-input", "p.ds-field__hint", "span.ds-avatar", "span.ds-badge", "span.ds-icon", "button.ds-toggle", "label.ds-drop", "label.ds-button"]);
    }
    expect(sourceSites("view.ts", 'const view = html`<span class="ds-toggle">On</span><p class="ds-badge">Done</p>`;').map(site => site.nativeStyle)).toEqual([undefined, undefined]);
    expect(sourceSites("view.ts", 'import { h } from "./dom"; h("span", { class: "ds-avatar" }, "A"); h("button", { className: "ds-button ds-toggle" });').map(site => site.nativeStyle)).toEqual(["ds-avatar", "ds-toggle"]);
  });

  it("counts a file input directly inside label.ds-drop or label.ds-button as the label's frame", () => {
    const drop = '<label class="ds-drop"><input type="file" /></label>';
    const button = '<label class="ds-button">Choose<input type="file" /></label>';
    const plain = '<label class="picker"><input type="file" /></label>';
    const nested = '<label class="ds-drop"><span><input type="file" /></span></label>';
    for (const file of ["page.html", "view.tsx"]) {
      const sites = (source: string) => sourceSites(file, asFile(file, source));
      expect(sites(drop).map(site => [site.tag, site.nativeStyle, site.controlKind]), file).toEqual([["label", "ds-drop", undefined]]);
      expect(sites(button).map(site => [site.tag, site.nativeStyle, site.controlKind]), file).toEqual([["label", "ds-button", "file-picker"]]);
      expect(sites(plain).map(site => [site.tag, site.nativeStyle, site.controlKind]), file).toEqual([["label", undefined, undefined], ["input", undefined, "file-picker"]]);
      expect(sites(nested).map(site => site.tag), file).toEqual(["label", "span", "input"]);
    }
    const factory = sourceSites("view.ts", 'import { h } from "./dom"; h("label", { class: "ds-button" }, "Choose", h("input", { type: "file" })); h("label", { class: "ds-drop" }, h("input", { type: "file" })); h("div", {}, h("input", { type: "file" }));');
    expect(factory.map(site => [site.tag, site.nativeStyle, site.controlKind])).toEqual([["label", "ds-button", "file-picker"], ["label", "ds-drop", undefined], ["div", undefined, undefined], ["input", undefined, "file-picker"]]);
  });

  it("counts the pieces as DS1 styles in their components' columns when the copy defines them", () => {
    const report = lockFixture(pieces).scan();
    expect(report.status).toBe("scanned");
    expect(report.cells.form).toMatchObject({ styled: 1, local: 0, unverified: 0 });
    expect(report.cells.text).toMatchObject({ styled: 1, local: 0, unverified: 0 });
    expect(report.cells.input).toMatchObject({ styled: 1, local: 0, unverified: 0 });
    expect(report.cells.avatar).toMatchObject({ styled: 1, unverified: 0 });
    expect(report.cells.badge).toMatchObject({ styled: 1, unverified: 0 });
    expect(report.cells.icon).toMatchObject({ styled: 1, unverified: 0 });
    expect(report.cells.toggle).toMatchObject({ styled: 1, unverified: 0 });
    expect(report.cells.button).toMatchObject({ styled: 0, local: 0 });
    expect(report.cells["file-picker"]).toMatchObject({ styled: 2, local: 0, unverified: 0 });
    expect(report.cells["file-picker"]!.sites.map(site => site.tag)).toEqual(["label.ds-drop", "label.ds-button"]);
  });

  it("needs review when the verified copy of controls.css is older than a piece's class", () => {
    const report = lockFixture(".ds-button { }\n.ds-input { }\n/* .ds-avatar, .ds-badge and .ds-icon arrive later { } */").scan();
    expect(report.cells.button).toMatchObject({ styled: 0, unverified: 0 });
    expect(report.cells.input).toMatchObject({ styled: 1, unverified: 0 });
    expect(report.cells["file-picker"]).toMatchObject({ styled: 1, unverified: 1 });
    for (const column of ["form", "text", "avatar", "badge", "icon", "toggle"]) {
      expect(report.cells[column], column).toMatchObject({ styled: 0, unverified: 1 });
    }
    expect(report.cells.avatar!.issues).toContain("No DS1 rule for .ds-avatar in this copy of controls.css");
  });

  it("reads a class's rule outside comments, in any selector", () => {
    expect(classRule("ds-icon").test(":where(.ds-icon) { mask: none; }")).toBe(true);
    expect(classRule("ds-icon").test(".ds-icon--small { }")).toBe(false);
    expect(classRule("ds-field").test(".ds-field__hint { }")).toBe(false);
    expect(classRule("ds-drop").test(".ds-drop:has(> input:focus-visible),\nlabel.ds-button { }")).toBe(true);
    const { ds, app } = lockFixture(pieces);
    expect(checkLockedControls(app, ds, "ds-badge")?.snapshot).toBe("verified");
    expect(checkLockedControls(app, ds, "ds-notice")?.snapshot).toBe("unverified");
  });
});
