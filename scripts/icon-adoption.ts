import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type { IconAdoption, IconCell, IconSite } from "../shared/component-adoption";

/** `"name": "<svg…>"` entries of a generated ds-icon map. */
export function iconMap(source: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const match of source.matchAll(/^\s*"([^"\n]+)":\s*("(?:[^"\\]|\\.)*")/gm)) map.set(match[1]!, JSON.parse(match[2]!) as string);
  return map;
}
export function readIconMap(path: string): Map<string, string> | null {
  return existsSync(path) ? iconMap(readFileSync(path, "utf8")) : null;
}
/** The same drawing whatever the whitespace. */
const compact = (svg: string) => svg.replace(/\s+/g, "");
const NAME = /^[a-z0-9][a-z0-9-]*$/i;

export interface IconUse { name: string | null; line: number; inline?: boolean }
/**
 * Icon sites in one file: `ds-icon` with a literal `type` in markup, Lit or
 * JSX, and `h`/`createElement("ds-icon", { type })` calls. A `type` that is
 * an expression is a dynamic use, its name unknown; a `ds-icon` without one
 * draws its own content. Inline `<svg>` drawings are counted apart.
 */
export function iconSites(source: string): IconUse[] {
  const uses: IconUse[] = [];
  const line = (offset: number) => source.slice(0, offset).split("\n").length;
  for (const match of source.matchAll(/<ds-icon\b([^>]*)>/g)) {
    const attributes = match[1]!;
    const literal = /\btype\s*=\s*["']([^"'$`{}]+)["']/.exec(attributes)?.[1];
    if (literal && NAME.test(literal)) uses.push({ name: literal, line: line(match.index!) });
    else if (/\btype\s*=/.test(attributes)) uses.push({ name: null, line: line(match.index!) });
  }
  for (const match of source.matchAll(/\b(?:h|createElement)\(\s*["']ds-icon["']\s*,\s*\{([^}]*)\}/g)) {
    const literal = /\btype\s*:\s*["']([^"']+)["']/.exec(match[1]!)?.[1];
    if (literal && NAME.test(literal)) uses.push({ name: literal, line: line(match.index!) });
    else if (/\btype\s*:/.test(match[1]!)) uses.push({ name: null, line: line(match.index!) });
  }
  // An element made bare and named afterwards, e.g. `icon.type = "close"`.
  for (const match of source.matchAll(/\b(?:const|let)\s+(\w+)\s*=\s*document\.createElement\(\s*["']ds-icon["']\s*\)/g)) {
    const rest = source.slice(match.index!, match.index! + 600);
    const variable = match[1]!;
    const literal = new RegExp(`\\b${variable}\\.(?:type\\s*=\\s*["']([^"']+)["']|setAttribute\\(\\s*["']type["']\\s*,\\s*["']([^"']+)["']\\s*\\))`).exec(rest);
    const name = literal?.[1] ?? literal?.[2];
    uses.push({ name: name && NAME.test(name) ? name : null, line: line(match.index!) });
  }
  for (const match of source.matchAll(/<svg\b/g)) uses.push({ name: null, line: line(match.index!), inline: true });
  return uses;
}

/**
 * Each icon an app names, against today's DS1 drawing. An app that carries a
 * copy of the icon map (beside its DS1 snapshot) is compared drawing by
 * drawing; one without a copy resolves names from DS1 itself. A name DS1
 * does not have is local only, used or merely added to the app's copy.
 */
// Icon sets an app can draw from instead of DS1; every icon taken from one is local.
const ICON_LIBRARIES = /^(?:@tabler\/icons-react|lucide-react|lucide|@heroicons\/[\w/-]+|react-icons\/\w+|@phosphor-icons\/[\w-]+|@radix-ui\/react-icons)$/;
const kebab = (name: string) => name.replace(/^Icon(?=[A-Z0-9])|Icon$/g, "").replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/([A-Za-z])([0-9])/g, "$1-$2").toLowerCase();

/** JSX uses of components imported from an icon set, and direct imports of DS1 `x-icon` drawings. */
export function importedIcons(source: string): { library: { name: string; set: string; line: number }[]; files: { name: string; path: string; line: number }[] } {
  const line = (offset: number) => source.slice(0, offset).split("\n").length;
  const library: { name: string; set: string; line: number }[] = [];
  const files: { name: string; path: string; line: number }[] = [];
  for (const match of source.matchAll(/import\s*\{([^}]*)\}\s*from\s*["']([^"']+)["']/g)) {
    if (!ICON_LIBRARIES.test(match[2]!)) continue;
    const set = match[2]!.replace(/^@/, "").split("/")[0]!.replace(/^icons-react$/, "tabler");
    for (const binding of match[1]!.split(",").map(part => part.trim()).filter(Boolean)) {
      const [imported, local = imported] = binding.split(/\s+as\s+/).map(part => part.trim());
      if (!local || !/^[A-Z]\w*$/.test(local)) continue;
      for (const use of source.matchAll(new RegExp(`<${local}\\b`, "g"))) library.push({ name: `${set}: ${kebab(imported!)}`, set, line: line(use.index!) });
    }
  }
  for (const match of source.matchAll(/import\s+\w+\s+from\s*["']([^"']*x-icon\/([a-z0-9-]+)\.svg)(?:\?[^"']*)?["']/g)) files.push({ name: match[2]!, path: match[1]!, line: line(match.index!) });
  return { library, files };
}

export function scanIcons(root: string, manifest: string | undefined, files: string[], ds1: Map<string, string>, ds1Icons?: string): IconAdoption {
  const copyPath = manifest ? join(dirname(manifest), "2-core/generated/ds-icon-map.ts") : null;
  const copy = copyPath ? readIconMap(join(root, copyPath)) : null;
  const cells: Record<string, IconCell> = {};
  const dynamic: IconSite[] = [];
  const inline: IconSite[] = [];
  const cell = (name: string): IconCell => {
    if (cells[name]) return cells[name]!;
    const ours = copy?.get(name);
    const theirs = ds1.get(name);
    const state: IconCell["copy"] = !copy ? "none" : ours === undefined ? "missing" : theirs === undefined ? "local" : compact(ours) === compact(theirs) ? "same" : "differs";
    const status: IconCell["status"] = theirs === undefined ? "local" : state === "differs" || state === "missing" ? "differs" : "shared";
    return (cells[name] = { uses: 0, status, copy: state, sites: [] });
  };
  for (const file of files) {
    const source = readFileSync(join(root, file), "utf8");
    const imported = importedIcons(source);
    for (const use of imported.library) {
      const target = (cells[use.name] ??= { uses: 0, status: "local", copy: "local", sites: [] });
      target.uses++; target.sites.push({ file, line: use.line, name: use.name });
    }
    for (const use of imported.files) {
      const target = cell(use.name);
      const path = resolve(join(root, dirname(file)), use.path);
      const reference = ds1Icons ? join(ds1Icons, `${use.name}.svg`) : null;
      // A drawing imported as a file is compared as a file.
      if (target.status !== "local" && reference && existsSync(path) && existsSync(reference) && compact(readFileSync(path, "utf8")) !== compact(readFileSync(reference, "utf8"))) { target.status = "differs"; target.copy = "differs"; }
      target.uses++; target.sites.push({ file, line: use.line, name: use.name });
    }
    for (const use of iconSites(source)) {
      const site = { file, line: use.line, name: use.name ?? (use.inline ? "svg" : "ds-icon") };
      if (use.inline) inline.push(site);
      else if (!use.name) dynamic.push(site);
      else { const target = cell(use.name); target.uses++; target.sites.push(site); }
    }
  }
  // Unused copies still matter when they are not DS1's drawing.
  for (const name of copy?.keys() ?? []) {
    if (cells[name]) continue;
    const target = cell(name);
    if (target.status === "shared") delete cells[name];
  }
  return { copy: copy ? copyPath : null, cells, dynamic, inline };
}
