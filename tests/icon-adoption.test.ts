import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vite-plus/test";
import { drawingShapes, fontIcons, glyphSites, iconSites, importedIcons, resolveSvg, scanIcons, scriptDrawings } from "../scripts/icon-adoption";

test("literal ds-icon names count as uses, expressions as dynamic and inline svg apart", () => {
  const sites = iconSites(`html\`<ds-icon type="close"></ds-icon><ds-icon type=\${name}></ds-icon>\`;
const a = <ds-icon type="home" />; h("ds-icon", { type: "check" }); createElement("ds-icon", { type: next });
const icon = document.createElement("ds-icon"); icon.type = "globe";
const svg = '<svg viewBox="0 0 16 16"></svg>';`);
  expect(sites.filter(site => site.name).map(site => site.name!).sort((a, b) => a.localeCompare(b))).toEqual(["check", "close", "globe", "home"]);
  expect(sites.filter(site => !site.name && !site.inline)).toHaveLength(2);
  expect(sites.filter(site => site.inline)).toHaveLength(1);
});

test("icon set components and direct x-icon imports are recognized", () => {
  const found = importedIcons(`import { IconArrowUp, IconX as Close } from "@tabler/icons-react";
import check from "../x-icon/check.svg?raw";
export const A = () => <><IconArrowUp /><Close size={2} /><IconArrowUp /></>;`);
  expect(found.library.map(use => use.name)).toEqual(["tabler: arrow-up", "tabler: arrow-up", "tabler: x"]);
  expect(found.files).toMatchObject([{ name: "check", path: "../x-icon/check.svg" }]);
});

test("a copy is compared with today's DS1 drawing and names DS1 lacks are local only", () => {
  const root = mkdtempSync(join(tmpdir(), "icons-"));
  mkdirSync(join(root, "src/design/2-core/generated"), { recursive: true });
  writeFileSync(join(root, "src/design/2-core/generated/ds-icon-map.ts"), `export const iconNameToSvgMap = {\n  "close": "<svg>A</svg>",\n  "home": "<svg>old</svg>",\n  "sparkle": "<svg>S</svg>",\n  "globe": "<svg>G</svg>",\n};`);
  writeFileSync(join(root, "src/app.ts"), `html\`<ds-icon type="close"></ds-icon><ds-icon type="home"></ds-icon><ds-icon type="check"></ds-icon><ds-icon type="own"></ds-icon>\``);
  const ds1 = new Map([["close", "<svg>A</svg>"], ["home", "<svg>new</svg>"], ["check", "<svg>C</svg>"], ["globe", "<svg>G</svg>"]]);
  const icons = scanIcons(root, "src/design/components-manifest.json", ["src/app.ts"], ds1);
  expect(icons.copy).toBe("src/design/2-core/generated/ds-icon-map.ts");
  expect(icons.cells.close).toMatchObject({ uses: 1, status: "shared", copy: "same" });
  expect(icons.cells.home).toMatchObject({ uses: 1, status: "differs", copy: "differs" });
  expect(icons.cells.check).toMatchObject({ uses: 1, status: "differs", copy: "missing" });
  expect(icons.cells.own).toMatchObject({ uses: 1, status: "local" });
  expect(icons.cells.sparkle).toMatchObject({ uses: 0, status: "local", copy: "local" });
  // An unused copy that is DS1's drawing is not listed.
  expect(icons.cells.globe).toBeUndefined();
  // Without a copy, a name resolves from DS1 itself.
  expect(scanIcons(root, undefined, ["src/app.ts"], ds1).cells.home).toMatchObject({ status: "shared", copy: "none" });
});

const close = `<svg width="16" height="16" viewBox="0 0 16 16"><path d="M3 3L13 13M3 13L13 3" fill="currentColor"/></svg>`;
const star = `<svg width="16" height="16" viewBox="0 0 16 16"><path d="M8 1L10 6H15L11 9L13 15L8 11L3 15L5 9L1 6H6Z"/></svg>`;
const ds1Drawings = new Map([["close", close], ["star", star]]);
const app = (files: Record<string, string>) => {
  const root = mkdtempSync(join(tmpdir(), "icons-"));
  for (const [path, body] of Object.entries(files)) { mkdirSync(join(root, path, ".."), { recursive: true }); writeFileSync(join(root, path), body); }
  return root;
};

test("one geometry compares equal however its path is written", () => {
  expect(drawingShapes(`<svg><path d="M1 1H3V3Z" fill="red"/></svg>`)).toEqual(drawingShapes(`<svg><g><path d="m1 1h2v2z"/></g></svg>`));
  expect(drawingShapes(`<path d="M1 1H3V3Z"/>`)).not.toEqual(drawingShapes(`<path d="M1 1H3V4Z"/>`));
  expect(drawingShapes(`<path d={shape}/>`)).toBeNull();
});

test("CSS masks and backgrounds name the drawing they point at", () => {
  const root = app({
    "src/icons/close.svg": close,
    "src/icons/close-copy.svg": close.replace(/\s+fill="currentColor"/, ""),
    "src/icons/star.svg": star.replace("M8 1", "M8 2"),
    "src/public/own.svg": `<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="4"/></svg>`,
    "src/big.svg": `<svg viewBox="0 0 120 40"><rect width="120" height="40"/></svg>`,
    "src/public/logos/client.svg": `<svg viewBox="0 0 24 12"><rect width="24" height="12"/></svg>`,
    "src/app.css": `.a { -webkit-mask: url("./icons/close.svg") center; mask: url("./icons/close.svg") center; }
.b { --glyph: url('./icons/star.svg'); }
.c { mask-image: var(--glyph); }
.d { background-image: url(/own.svg); }
.e { --unused: url(./icons/close.svg); }
.f { background: url(./big.svg); --logo: url(/logos/client.svg); mask: var(--logo); }
.ds-icon-x { --ds-icon: url(./icons/close-copy.svg); }
.g { mask: url("data:image/svg+xml,${encodeURIComponent(close)}"); }
.h { mask: url("data:image/svg+xml,${encodeURIComponent(`<svg viewBox="0 0 8 8"><path d="M0 0L8 8"/></svg>`)}"); }`,
    "src/page.html": `<span style="mask: url(&quot;icons/close.svg&quot;)"></span><img src="./icons/star.svg" alt="">`,
  });
  const icons = scanIcons(root, undefined, ["src/app.css", "src/page.html"], ds1Drawings);
  expect(icons.cells.close).toMatchObject({ uses: 4, status: "shared" });
  expect(icons.cells.close!.sites.map(site => [site.line, site.kind, site.drawing ?? ""])).toEqual([[1, "mask", "src/icons/close.svg"], [7, "mask", "src/icons/close-copy.svg"], [8, "mask", "data:"], [1, "mask", "src/icons/close.svg"]]);
  // A file named after a DS1 icon that is not its drawing needs the DS1 drawing.
  expect(icons.cells.star).toMatchObject({ uses: 2, status: "differs" });
  expect(icons.cells.star!.sites.map(site => site.kind)).toEqual(["mask", "file"]);
  expect(icons.cells.own).toMatchObject({ uses: 1, status: "local" });
  // Unread custom properties and pictures are not icons; an inline drawing that is not DS1's is counted apart.
  expect(Object.keys(icons.cells).sort()).toEqual(["close", "own", "star"]);
  expect(icons.inline).toMatchObject([{ line: 9, kind: "mask" }]);
});

test("SVG imports and root paths resolve to the tracked file they name", () => {
  const root = app({ "client/assets/glyph/stop.svg": `<svg viewBox="0 0 16 16"><rect x="4" y="4" width="8" height="8"/></svg>`, "client/vendor/kit/icons/close.svg": close });
  expect(resolveSvg(root, "client/app.css", "/kit/icons/close.svg", ["client/vendor/kit/icons/close.svg"])?.path).toBe("client/vendor/kit/icons/close.svg");
  expect(resolveSvg(root, "client/app.css", "https://example.com/close.svg")).toBeNull();
  writeFileSync(join(root, "client/menu.ts"), `import stopSvg from './assets/glyph/stop.svg?raw'\nimport logo from './assets/missing.svg'`);
  const icons = scanIcons(root, undefined, ["client/menu.ts"], ds1Drawings);
  expect(icons.cells.stop).toMatchObject({ uses: 1, status: "local", sites: [{ kind: "file", drawing: "client/assets/glyph/stop.svg" }] });
  expect(icons.cells.missing).toBeUndefined();
});

test("icon font classes are local, named after their set and icon, with the font's stylesheet", () => {
  const found = fontIcons(`<link rel="stylesheet" href="/icons/regular/style.css" />
<i class="ph ph-x" aria-hidden="true"></i><i class="ph-bold ph-trash"></i>
el.innerHTML = '<i class="fa-solid fa-xmark fa-lg"></i>'; <span className="bi bi-gear"></span>
<span class="material-symbols-outlined">home</span><i class="ph ph-\${name}"></i>
@import url("https://unpkg.com/@phosphor-icons/web@2.1.1/src/bold/style.css");
<a href="https://fontawesome.com/">Credits</a><div class="ph phone-number"></div><span class="photo bi"></span>`);
  expect(found.icons.map(use => `${use.set}: ${use.icon}`)).toEqual(["phosphor: x", "phosphor: trash", "font awesome: xmark", "bootstrap: gear", "material: home", "phosphor: null"]);
  expect(found.sheets.map(sheet => [sheet.set, sheet.line])).toEqual([["phosphor", 1], ["phosphor", 5]]);
  const root = app({ "src/view.ts": `node.innerHTML = '<i class="ph ph-x"></i><i class="ph ph-\${kind}"></i>'` });
  const icons = scanIcons(root, undefined, ["src/view.ts"], ds1Drawings);
  expect(icons.cells["phosphor: x"]).toMatchObject({ uses: 1, status: "local", ds1: "close", sites: [{ kind: "font" }] });
  expect(icons.dynamic).toMatchObject([{ kind: "font" }]);
});

test("a control or icon whose whole text is one glyph stands for a DS1 icon", () => {
  const html = glyphSites("page.html", `<nav><a href="/a"><span class="nav__arrow" aria-hidden="true">←</span> Back</a>
<button type="button">×</button><button><span>▶</span></button>
<p>Read the guide →</p><p>Next <span>→</span></p><td>–</td><span class="price">+</span>
<script>close.textContent = '×'; toggle.textContent = open ? '▾' : '▸'; label.textContent = 'Done →'</script></nav>`);
  expect(html.map(site => `${site.glyph}@${site.line}`)).toEqual(["←@1", "×@2", "▶@2", "×@4", "▾@4", "▸@4"]);
  const jsx = glyphSites("Row.tsx", `export const Row = ({ on }) => <>
  <button className="ds-button" onClick={() => { on(); }}>
    ⋯
  </button>
  <span className="archive-star" aria-label="Starred">★</span>
  <button><ds-text text="✕" /></button>
  <p>{"→"}</p>
  <h1>Projects ↗ and more</h1>
</>;
const tile = h('span', { 'aria-hidden': 'true' }, '↗'), sum = h('span', { class: 'total' }, '+');
const view = html\`<button @click=\${close}>×</button>\`;`);
  expect(jsx.map(site => `${site.glyph}@${site.line}`)).toEqual(["⋯@3", "★@5", "✕@6", "↗@10", "×@11"]);
  const root = app({ "src/menu.ts": "remove.textContent = '×'" });
  expect(scanIcons(root, undefined, ["src/menu.ts"], ds1Drawings).cells.close).toMatchObject({ uses: 1, status: "differs", sites: [{ kind: "glyph", name: "×" }] });
});

test("SVG made in script counts like inline SVG, named when its paths are a DS1 drawing", () => {
  const source = `const SVG = 'http://www.w3.org/2000/svg'
export function closeMark() {
  const svg = document.createElementNS(SVG, 'svg')
  const path = document.createElementNS(SVG, 'path')
  path.setAttribute('d', 'm3 3 10 10M3 13 13 3')
  svg.append(path)
  return svg
}
export function categoryIcon(key) {
  const svg = document.createElementNS(SVG, 'svg')
  for (const d of LOOK[key]) { const path = document.createElementNS(SVG, 'path'); path.setAttribute('d', d); svg.append(path) }
  return svg
}
export function badge() {
  const svg = document.createElementNS(SVG, 'svg')
  svg.innerHTML = '<path d="M3 3L13 13"/>' + '<circle cx="8" cy="8" r="2"/>'
  return svg
}`;
  expect(scriptDrawings("draw.ts", source).map(drawing => [drawing.line, Boolean(drawing.svg)])).toEqual([[3, true], [10, false], [15, true]]);
  const icons = scanIcons(app({ "web/draw.ts": source }), undefined, ["web/draw.ts"], ds1Drawings);
  expect(icons.cells.close).toMatchObject({ uses: 1, status: "shared", sites: [{ kind: "script", line: 3 }] });
  expect(icons.inline.map(site => [site.kind, site.line])).toEqual([["script", 10], ["script", 15]]);
});

test("an app's own icon set is recognised by its shape and its components counted at their JSX uses", () => {
  const svgComponent = (name: string) => `export const ${name} = forwardRef((props, ref) => <svg ref={ref} viewBox="0 0 24 24" {...props}><path d="M1 1L${name.length} 2" /></svg>);`;
  const root = app({
    "src/kit/converted.tsx": ["X", "Trash2", "Copy", "ChevronDown", "Sparkle"].map(svgComponent).join("\n") + "\nexport const XIcon = X;",
    "src/kit/make.tsx": `export function makeIcon(displayName: string, type: string) { return (props) => createElement("ds-icon", { type, ...props }); }`,
    "src/kit/named.tsx": `import { makeIcon } from "./make.tsx";\n` + ["Close:close", "Star:star", "Up:up", "Down:down", "Plus:plus"].map(pair => `export const ${pair.split(":")[0]} = makeIcon("${pair.split(":")[0]}", "${pair.split(":")[1]}");`).join("\n"),
    "src/kit/index.ts": `export * from "./converted.tsx";\nexport { Close, Star } from "./named.tsx";`,
    "src/kit/few.tsx": ["A", "B", "C"].map(svgComponent).join("\n"),
    "src/kit/panels.tsx": ["One", "Two", "Three", "Four", "Five"].map(name => `export const ${name} = () => <div>${name}</div>;`).join("\n"),
    "src/app.tsx": `import { XIcon, Trash2, Close } from "@/kit";
import { Up } from "./kit/named";
import { A } from "./kit/few";
import { One } from "./kit/panels";
import type { Star } from "./kit/named";
export const App = () => <><XIcon /><Trash2 size={16} /><Close /><Up /><A /><One /><Trash2 /></>;`,
  });
  const icons = scanIcons(root, undefined, ["src/app.tsx"], ds1Drawings);
  expect(icons.cells.X).toMatchObject({ uses: 1, status: "local", ds1: "close", sites: [{ kind: "component", name: "XIcon" }] });
  expect(icons.cells.Trash2).toMatchObject({ uses: 2, status: "local" });
  // DS1 has no delete drawing in this fixture, so no DS1 icon is suggested.
  expect(icons.cells.Trash2!.ds1).toBeUndefined();
  expect(icons.cells.close).toMatchObject({ uses: 1, status: "shared", sites: [{ kind: "component", name: "Close" }] });
  expect(icons.cells.up).toMatchObject({ uses: 1, sites: [{ kind: "component" }] });
  expect(Object.keys(icons.cells).sort()).toEqual(["Trash2", "X", "close", "up"]);
});

test("an inline SVG that pastes a DS1 drawing is named after it", () => {
  const root = app({ "src/view.tsx": `export const Close = () => <svg width="16" height="16" viewBox="0 0 16 16" {...props}><path d="m3 3 10 10M3 13l10-10" /></svg>;
export const Own = () => <svg viewBox="0 0 16 16"><path d="M2 2L14 2" /></svg>;
const wrapped = '<svg viewBox="0 0 16 16"><svg viewBox="0 0 16 16"><path d="M3 3L13 13M3 13L13 3"/></svg></svg>';
export const Drawn = ({ d }) => <svg viewBox="0 0 16 16"><path d={d} /></svg>;` });
  const icons = scanIcons(root, undefined, ["src/view.tsx"], ds1Drawings);
  expect(icons.cells.close).toMatchObject({ uses: 2, status: "shared" });
  expect(icons.cells.close!.sites.map(site => [site.kind, site.line])).toEqual([["inline", 1], ["inline", 3]]);
  expect(icons.inline.map(site => site.line)).toEqual([2, 4]);
});
