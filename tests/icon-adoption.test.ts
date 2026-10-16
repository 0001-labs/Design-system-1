import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vite-plus/test";
import { iconSites, importedIcons, scanIcons } from "../scripts/icon-adoption";

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
