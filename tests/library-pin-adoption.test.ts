import { afterEach, describe, expect, it } from "vite-plus/test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { scanApp } from "../scripts/component-adoption";
import { pinnedLibraries } from "../scripts/library-provenance";
import { prepareLibrary } from "../packages/css-validate/src/index";
import { LIBRARY_REVISION } from "../DS1/1-root/library-tokens";

const temporary: string[] = [];
afterEach(() => { for (const dir of temporary.splice(0)) rmSync(dir, { recursive: true, force: true }); });
const write = (root: string, path: string, body: string) => { mkdirSync(dirname(join(root, path)), { recursive: true }); writeFileSync(join(root, path), body); };
const git = (root: string, ...args: string[]) => execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
const commit = (root: string) => { git(root, "add", "."); git(root, "-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-m", "Fixture"); };
const sha256 = (body: string) => createHash("sha256").update(body).digest("hex");

const id = "0123456789abcdefghjk";
const pinned = `src/design/ds1-library/${id}/v/3.css`;
const manifestPath = "src/design/ds1-library/library-manifest.json";
const published = prepareLibrary(":root { --one-radius: 8px; }\nbutton { border-radius: var(--one-radius); }\n").css;
const wrappers = [
  'import { createElement as h, forwardRef } from "react";',
  'export const Button = forwardRef(function Button(props, ref) { return h("button", { ...props, ref, "data-library-control": "" }); });',
  'export const ButtonLink = forwardRef(function ButtonLink(props, ref) { return h("a", { ...props, ref, "data-library-control": "", "data-library-button": "" }); });',
].join("\n");
const page = 'import { Button, ButtonLink } from "../design/library-controls";\nexport const Page = () => <form><Button /><ButtonLink href="/" /><button>Local</button></form>;';
const spec = { id: "example", name: "Example", directory: "Example", roots: ["src"], manifest: "design/components-manifest.json" };

/** A DS1 source and an app that pins a library through its sync.lock.json, as Sync 1 writes it. */
function fixture({ css = published, revision = LIBRARY_REVISION }: { css?: string; revision?: string } = {}) {
  const studio = mkdtempSync(join(tmpdir(), "library-pin-")); temporary.push(studio);
  const ds = join(studio, "Design system 1"), app = join(studio, "Example");
  for (const root of [ds, app]) { mkdirSync(root); git(root, "init", "-b", "main"); }
  const sources = { "2-core/ds-button.ts": "export const tag = 'ds-button';", "1-root/component-tokens.css": ":root { --test: 1; }", "1-root/controls.css": ":root { --control: 1; }" };
  for (const [file, body] of Object.entries(sources)) { write(ds, `DS1/${file}`, body); write(app, `design/${file}`, body); }
  commit(ds);
  write(app, "design/components-manifest.json", JSON.stringify({ commit: git(ds, "rev-parse", "HEAD"), components: ["button"], files: Object.fromEntries(Object.entries(sources).map(([file, body]) => [file, sha256(body)])) }));
  const manifest = JSON.stringify({ source: "Design system 1", library: id, version: 3, url: `https://designsystem1.com/ds1/${id}/v/3.css`, file: `${id}/v/3.css`, revision, sha256: sha256(css) }, null, 2) + "\n";
  write(app, pinned, css);
  write(app, manifestPath, manifest);
  write(app, "sync.lock.json", JSON.stringify({ "Design system 1": { commit: git(ds, "rev-parse", "HEAD"), version: "0.3.0", files: { [pinned]: sha256(css), [manifestPath]: sha256(manifest) } } }, null, 2));
  write(app, "src/design/library-controls.tsx", wrappers);
  write(app, "src/components/page.tsx", page);
  return { studio, ds, app };
}

describe("a library pinned through Sync 1", () => {
  it("counts its controls as DS1 styles when the app loads the verified copy", () => {
    const { studio, ds, app } = fixture();
    write(app, "src/design/library.css", `@import "./ds1-library/${id}/v/3.css";`);
    commit(app);
    expect(pinnedLibraries(app)).toEqual([{ id, version: 3, path: pinned, revision: LIBRARY_REVISION, verified: true, issues: [] }]);
    const report = scanApp(spec, studio, ds);
    expect(report.cells.button).toMatchObject({ styled: 2, local: 1, unverified: 0, shared: 0 });
    expect(report.cells.button?.sites.filter(site => site.kind === "styled").map(site => site.tag)).toEqual(["Button", "ButtonLink"]);
    expect(report.cells.button?.issues.join(" ")).not.toMatch(/published design library/);
  });

  it("keeps needs review while the app still loads latest.css", () => {
    const { studio, ds, app } = fixture();
    write(app, "src/design/library.css", `@import "./ds1-library/${id}/v/3.css";`);
    write(app, "src/design/library-css.ts", `export const libraryUrl = "https://designsystem1.com/ds1/${id}/latest.css";`);
    commit(app);
    const report = scanApp(spec, studio, ds);
    expect(report.cells.button).toMatchObject({ styled: 0, unverified: 2, local: 1 });
    expect(report.cells.button?.issues.join(" ")).toMatch(/connected in src\/design\/library-css\.ts.*fetched from latest\.css/);
  });

  it("keeps needs review for a copy rewritten after the sync, or one publishing never stamped", () => {
    const rewritten = fixture();
    write(rewritten.app, pinned, published.replaceAll("button", ":is(button, a[data-library-button])"));
    write(rewritten.app, "src/design/library.css", `@import "./ds1-library/${id}/v/3.css";`);
    commit(rewritten.app);
    const changed = scanApp(spec, rewritten.studio, rewritten.ds);
    expect(changed.cells.button).toMatchObject({ styled: 0, unverified: 2 });
    expect(changed.cells.button?.issues.join(" ")).toMatch(new RegExp(`Pinned library ${id} v3 .* does not verify: Locally modified: ${pinned.replaceAll("/", "\\/")}`));

    const unstamped = fixture({ css: ":root { --one-radius: 8px; }\n" });
    write(unstamped.app, "src/design/library.css", `@import "./ds1-library/${id}/v/3.css";`);
    commit(unstamped.app);
    expect(pinnedLibraries(unstamped.app)[0]).toMatchObject({ verified: false, issues: [expect.stringMatching(/carries no DS1 library stamp/)] });
    expect(scanApp(spec, unstamped.studio, unstamped.ds).cells.button).toMatchObject({ styled: 0, unverified: 2 });

    const misrecorded = fixture({ revision: "sha256:000000000000" });
    expect(pinnedLibraries(misrecorded.app)[0]?.issues).toEqual([expect.stringMatching(/another revision than/)]);
  });

  it("leaves markers alone when the app pins a library but never loads it", () => {
    const { studio, ds, app } = fixture();
    commit(app);
    expect(scanApp(spec, studio, ds).cells.button).toMatchObject({ styled: 0, unverified: 0 });
  });
});
