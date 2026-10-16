import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, posix } from "node:path";
import type { IconAdoption, IconCell, IconKind, IconSite, IconStatus } from "../shared/component-adoption";
import { interfaceIconAliases } from "../website/src/lib/icons/icon-scope";

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
/** Line numbers by offset, without re-reading the text for every site. */
function lines(source: string): (offset: number) => number {
  const starts = [0];
  for (let i = source.indexOf("\n"); i !== -1; i = source.indexOf("\n", i + 1)) starts.push(i + 1);
  return offset => {
    let low = 0, high = starts.length - 1;
    while (low < high) { const mid = (low + high + 1) >> 1; if (starts[mid]! <= offset) low = mid; else high = mid - 1; }
    return low + 1;
  };
}

// ---------------------------------------------------------------------------
// Drawings: the geometry of an SVG, compared whatever the notation.

type Shape = { sig: string; values: number[] };
const NUMBER = /[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g;
const ARGS: Record<string, number> = { m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, q: 4, t: 2, a: 7, z: 0 };

/** A path in absolute commands, horizontal and vertical lines as lines, so equal geometry compares equal however it was written. */
export function pathShape(d: string): Shape | null {
  const tokens = d.match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g);
  if (!tokens) return null;
  const sig: string[] = [];
  const values: number[] = [];
  let x = 0, y = 0, sx = 0, sy = 0, i = 0, command = "";
  while (i < tokens.length) {
    if (/[a-z]/i.test(tokens[i]!)) command = tokens[i++]!;
    else if (!command || command.toLowerCase() === "z") return null;
    const lower = command.toLowerCase();
    if (!(lower in ARGS)) return null;
    const rel = command !== command.toUpperCase();
    if (lower === "z") { x = sx; y = sy; sig.push("Z"); continue; }
    const n = ARGS[lower]!;
    const args = tokens.slice(i, i + n).map(Number);
    if (args.length < n || args.some(Number.isNaN)) return null;
    i += n;
    const point = (px: number, py: number) => rel ? [x + px, y + py] : [px, py];
    if (lower === "h") { x = rel ? x + args[0]! : args[0]!; sig.push("L"); values.push(x, y); continue; }
    if (lower === "v") { y = rel ? y + args[0]! : args[0]!; sig.push("L"); values.push(x, y); continue; }
    if (lower === "a") {
      const [ex, ey] = point(args[5]!, args[6]!);
      sig.push("A"); values.push(args[0]!, args[1]!, args[2]!, args[3]!, args[4]!, ex!, ey!);
      x = ex!; y = ey!; continue;
    }
    const absolute: number[] = [];
    for (let k = 0; k < n; k += 2) absolute.push(...point(args[k]!, args[k + 1]!));
    sig.push(lower === "m" ? "M" : lower.toUpperCase());
    values.push(...absolute);
    x = absolute.at(-2)!; y = absolute.at(-1)!;
    if (lower === "m") { sx = x; sy = y; command = rel ? "l" : "L"; }
  }
  return sig.length ? { sig: sig.join(""), values } : null;
}

/** Attributes of one tag, in markup or JSX. An attribute written as an expression is marked dynamic. */
function attributes(text: string): Record<string, string> {
  const found: Record<string, string> = {};
  for (const match of text.matchAll(/([@:\w.-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|\{\s*["'`]([^"'`$]*)["'`]\s*\}|(\{[^}]*\}?)|([^\s>"'`]+)))?/g)) {
    const value = match[2] ?? match[3] ?? match[4] ?? (match[5] !== undefined ? "\u0000dynamic" : match[6]) ?? "true";
    found[match[1]!] = value;
  }
  return found;
}
const dynamicValue = (value: string | undefined) => value !== undefined && (value === "\u0000dynamic" || value.includes("${"));

/** The shapes of an SVG in order, their numbers absolute; paint, ids, wrappers, definitions and clips are ignored. */
export function drawingShapes(svg: string): Shape[] | null {
  const body = svg.replace(/<!--[\s\S]*?-->/g, "").replace(/<(defs|clipPath|mask|title|desc|style)\b[\s\S]*?<\/\1\s*>/gi, "");
  const shapes: Shape[] = [];
  for (const match of body.matchAll(/<(path|circle|ellipse|rect|line|polyline|polygon)\b((?:[^>"'{]|"[^"]*"|'[^']*'|\{[^}]*\})*)>/gi)) {
    const tag = match[1]!.toLowerCase();
    const attrs = attributes(match[2]!);
    if (Object.values(attrs).some(dynamicValue)) return null;
    const num = (name: string) => Number.parseFloat(attrs[name] ?? "0") || 0;
    let shape: Shape | null;
    if (tag === "path") shape = attrs.d ? pathShape(attrs.d) : null;
    else if (tag === "circle") shape = { sig: "circle", values: [num("cx"), num("cy"), num("r")] };
    else if (tag === "ellipse") shape = { sig: "ellipse", values: [num("cx"), num("cy"), num("rx"), num("ry")] };
    else if (tag === "rect") shape = { sig: "rect", values: [num("x"), num("y"), num("width"), num("height"), num("rx"), num("ry")] };
    else if (tag === "line") shape = { sig: "line", values: [num("x1"), num("y1"), num("x2"), num("y2")] };
    else shape = { sig: tag, values: (attrs.points?.match(NUMBER) ?? []).map(Number) };
    if (!shape) return null;
    if (attrs.transform) shape = { sig: `${shape.sig}@${attrs.transform.replace(NUMBER, "#").replace(/\s+/g, "")}`, values: [...shape.values, ...(attrs.transform.match(NUMBER) ?? []).map(Number)] };
    shapes.push({ sig: `${tag}:${shape.sig}`, values: shape.values });
  }
  return shapes.length ? shapes : null;
}
const sameShapes = (a: Shape[], b: Shape[]) => a.length === b.length && a.every((shape, i) => shape.values.length === b[i]!.values.length && shape.values.every((value, k) => Math.abs(value - b[i]!.values[k]!) <= 0.02));

/** DS1's drawings, indexed by the outline of their commands. */
class Drawings {
  private byOutline = new Map<string, { name: string; shapes: Shape[] }[]>();
  constructor(ds1: Map<string, string>) {
    for (const [name, svg] of ds1) {
      const shapes = drawingShapes(svg);
      if (!shapes) continue;
      const key = shapes.map(shape => shape.sig).join("|");
      this.byOutline.set(key, [...(this.byOutline.get(key) ?? []), { name, shapes }]);
    }
  }
  /** The DS1 icon this drawing is, preferring the name it was given, then a canonical name over its repeats. */
  match(svg: string | Shape[], hint?: string): string | undefined {
    const shapes = typeof svg === "string" ? drawingShapes(svg) : svg;
    if (!shapes) return undefined;
    const names = (this.byOutline.get(shapes.map(shape => shape.sig).join("|")) ?? []).filter(entry => sameShapes(entry.shapes, shapes)).map(entry => entry.name).sort();
    if (!names.length) return undefined;
    if (hint && names.includes(hint)) return hint;
    return names.find(name => !Object.hasOwn(interfaceIconAliases, name)) ?? names[0];
  }
}
const drawingIndexes = new WeakMap<Map<string, string>, Drawings>();
const drawingsOf = (ds1: Map<string, string>) => drawingIndexes.get(ds1) ?? drawingIndexes.set(ds1, new Drawings(ds1)).get(ds1)!;

/** An SVG drawn at icon size: at most 32 units each way. A larger one is a picture or a logo. */
export function iconSized(svg: string): boolean {
  const root = /<svg\b([^>]*)>/i.exec(svg)?.[1];
  if (!root) return false;
  const attrs = attributes(root);
  const box = attrs.viewBox?.match(NUMBER)?.map(Number);
  const size = box?.length === 4 ? [box[2]!, box[3]!] : [Number.parseFloat(attrs.width ?? ""), Number.parseFloat(attrs.height ?? "")];
  return size.every(value => Number.isFinite(value) && value > 0 && value <= 32);
}

// ---------------------------------------------------------------------------
// Icon files: a URL or import resolved to a tracked SVG.

/** An SVG written into a `data:` address. */
export function dataSvg(url: string): string | null {
  const match = /^data:image\/svg\+xml(;[^,]*)?,([\s\S]*)$/i.exec(url.trim());
  if (!match || match[2]!.includes("${")) return null;
  try { return /;base64/i.test(match[1] ?? "") ? Buffer.from(match[2]!, "base64").toString("utf8") : decodeURIComponent(match[2]!); } catch { return null; }
}
const isFile = (path: string) => existsSync(path) && statSync(path).isFile();
/**
 * The tracked SVG a reference points at, relative to the app. A relative path
 * resolves from the file that names it; a root path from the nearest folder
 * (or its `public/`) that holds it, else from the one tracked file it ends.
 */
export function resolveSvg(root: string, from: string, url: string, svgs: string[] = []): { path: string; svg: string } | null {
  const clean = url.trim().replace(/[?#].*$/, "");
  if (!/\.svg$/i.test(clean) || /^(?:[a-z][\w+.-]*:|\/\/)/i.test(clean) || clean.includes("${")) return null;
  const candidates: string[] = [];
  if (clean.startsWith("/")) {
    for (let dir = posix.dirname(from); ; dir = posix.dirname(dir)) {
      candidates.push(posix.join(dir, clean), posix.join(dir, "public", clean));
      if (dir === "." || dir === "/") break;
    }
  } else candidates.push(clean.startsWith("@/") ? posix.join("src", clean.slice(2)) : posix.join(posix.dirname(from), clean));
  let path = candidates.map(candidate => posix.normalize(candidate)).find(candidate => !candidate.startsWith("..") && isFile(join(root, candidate)));
  if (!path && clean.startsWith("/")) {
    const ends = svgs.filter(file => `/${file}`.endsWith(clean));
    const shared = (file: string) => { let n = 0; while (n < file.length && file[n] === from[n]) n++; return n; };
    path = ends.sort((a, b) => shared(b) - shared(a))[0];
  }
  return path ? { path, svg: readFileSync(join(root, path), "utf8") } : null;
}

/** A CSS reference to an SVG from a mask or background, or from a custom property one of them reads. */
export interface StyleUse { property: string; url: string; line: number; block: number }
const MASK_PROPERTY = /^(?:-webkit-mask(?:-image)?|mask(?:-image)?|background(?:-image)?|WebkitMask(?:Image)?|maskImage|backgroundImage)$/;
/**
 * CSS declarations in stylesheets, `<style>`, style attributes, CSS in
 * template literals and style objects that name an SVG in `url(…)`, and the
 * custom properties a mask or background reads through `var()`.
 */
export function styleIconUrls(text: string): { uses: StyleUse[]; consumed: Set<string> } {
  // Quotes written as entities in a style attribute, kept at their length so offsets stay true.
  const source = text.replace(/&(?:quot|apos|#0?39);/g, entity => (entity === "&quot;" ? "\"" : "'").padEnd(entity.length, " "));
  const line = lines(source);
  const uses: StyleUse[] = [];
  const consumed = new Set<string>();
  const declarations = [
    ...[...source.matchAll(/(?<![\w-])(-webkit-mask-image|-webkit-mask|mask-image|mask|background-image|background|WebkitMaskImage|WebkitMask|maskImage|backgroundImage|--[\w-]+)\s*:\s*([^;{}]*)/g)].map(match => ({ property: match[1]!, value: match[2]!, index: match.index! })),
    ...[...source.matchAll(/\.setProperty\(\s*["'](--[\w-]+)["']\s*,\s*(["'`])((?:(?!\2)[\s\S])*)\2/g)].map(match => ({ property: match[1]!, value: match[3]!, index: match.index! })),
  ];
  for (const { property, value, index } of declarations) {
    if (MASK_PROPERTY.test(property)) for (const match of value.matchAll(/var\(\s*(--[\w-]+)/g)) consumed.add(match[1]!);
    for (const match of value.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)"'\s]*))\s*\)/g)) {
      const url = (match[1] ?? match[2] ?? match[3] ?? "").trim();
      if (!/\.svg(?:[?#]|$)/i.test(url) && !/^data:image\/svg\+xml/i.test(url)) continue;
      // One rule (or one style attribute) that sets mask and -webkit-mask to the same file is one site.
      const block = Math.max(source.lastIndexOf("{", index), source.lastIndexOf("}", index), source.lastIndexOf("<", index));
      uses.push({ property, url, line: line(index), block });
    }
  }
  return { uses, consumed };
}

/** `<img src="….svg">` with a literal address. */
export function imageIcons(source: string): { url: string; line: number }[] {
  const line = lines(source);
  return [...source.matchAll(/<img\b[^>]*?\bsrc\s*=\s*["']([^"'{}$]+?\.svg(?:[?#][^"']*)?)["']/gi)].map(match => ({ url: match[1]!, line: line(match.index!) }));
}

// ---------------------------------------------------------------------------
// ds-icon elements, icon set packages and SVG imports.

export interface IconUse { name: string | null; line: number; inline?: boolean; svg?: string }
/** The markup of the `<svg>` that opens at `start`, up to its own closing tag. */
function svgElement(source: string, start: number): string {
  const tag = /<(\/?)svg\b(?:[^>"'{]|"[^"]*"|'[^']*'|\{[^}]*\})*?(\/?)>/gi;
  tag.lastIndex = start;
  let depth = 0;
  for (let match = tag.exec(source); match; match = tag.exec(source)) {
    if (match[1]) depth--;
    else if (!match[2]) depth++;
    if (depth <= 0) return source.slice(start, match.index + match[0].length);
    if (match.index - start > 200_000) break;
  }
  return source.slice(start, start + 2000);
}
/**
 * Icon sites in one file: `ds-icon` with a literal `type` in markup, Lit or
 * JSX, and `h`/`createElement("ds-icon", { type })` calls. A `type` that is
 * an expression is a dynamic use, its name unknown; a `ds-icon` without one
 * draws its own content. Inline `<svg>` drawings are counted apart, with their markup.
 */
export function iconSites(source: string): IconUse[] {
  const uses: IconUse[] = [];
  const line = lines(source);
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
  for (const match of source.matchAll(/<svg\b/g)) uses.push({ name: null, line: line(match.index!), inline: true, svg: svgElement(source, match.index!) });
  return uses;
}

// Icon sets an app can draw from instead of DS1; every icon taken from one is local.
const ICON_LIBRARIES = /^(?:@tabler\/icons-react|lucide-react|lucide|@heroicons\/[\w/-]+|react-icons\/\w+|@phosphor-icons\/[\w-]+|@radix-ui\/react-icons)$/;
const kebab = (name: string) => name.replace(/^Icon(?=[A-Z0-9])|Icon$/g, "").replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/([A-Za-z])([0-9])/g, "$1-$2").toLowerCase();

/** JSX uses of components imported from an icon set, and default imports of SVG files (DS1 `x-icon` drawings or the app's own). */
export function importedIcons(source: string): { library: { name: string; set: string; icon: string; line: number }[]; files: { name: string; path: string; line: number }[] } {
  const line = lines(source);
  const library: { name: string; set: string; icon: string; line: number }[] = [];
  const files: { name: string; path: string; line: number }[] = [];
  for (const match of source.matchAll(/import\s*\{([^}]*)\}\s*from\s*["']([^"']+)["']/g)) {
    if (!ICON_LIBRARIES.test(match[2]!)) continue;
    const set = match[2]!.replace(/^@/, "").split("/")[0]!.replace(/^icons-react$/, "tabler");
    for (const binding of match[1]!.split(",").map(part => part.trim()).filter(Boolean)) {
      const [imported, local = imported] = binding.split(/\s+as\s+/).map(part => part.trim());
      if (!local || !/^[A-Z]\w*$/.test(local)) continue;
      for (const use of source.matchAll(new RegExp(`<${local}\\b`, "g"))) library.push({ name: `${set}: ${kebab(imported!)}`, set, icon: kebab(imported!), line: line(use.index!) });
    }
  }
  for (const match of source.matchAll(/import\s+\w+\s+from\s*["']([^"'?]+\.svg)(?:\?[^"']*)?["']/g)) {
    const path = match[1]!;
    files.push({ name: /(?:^|\/)x-icon\/([a-z0-9-]+)\.svg$/.exec(path)?.[1] ?? basename(path, ".svg"), path, line: line(match.index!) });
  }
  return { library, files };
}

// ---------------------------------------------------------------------------
// The app's icons.

/** Where an app's sources and drawings are, for the stylesheets and SVG files the component scan does not read. */
export interface IconScope { roots: string[]; include: (file: string) => boolean }
const STYLESHEET = /\.(?:css|scss|sass|less)$/i;
function tracked(root: string, ...paths: string[]): string[] {
  try {
    return execFileSync("git", ["ls-files", "-z", "--", ...paths], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 50_000_000 }).split("\0").filter(file => file && isFile(join(root, file)));
  } catch { return []; }
}
/**
 * Tracked stylesheets in the app's roots. A `design/` or `ds1/` folder at the
 * top of a root is skipped as a DS1 snapshot, unless it holds none of DS1's
 * layers: then it is the app's own stylesheets.
 */
export function styleSheets(root: string, scope: IconScope): string[] {
  return tracked(root, ...scope.roots).filter(file => {
    if (!STYLESHEET.test(file)) return false;
    if (scope.include(file)) return true;
    const folder = /^((?:client|src|web)\/)?(?:design|ds1)\//.exec(file);
    return Boolean(folder) && !["0-face", "1-root", "2-core", "x-icon", "components-manifest.json"].some(name => existsSync(join(root, folder![0], name))) && scope.include(file.replace(folder![0], folder![1] ?? ""));
  });
}

const severity: Record<IconStatus, number> = { shared: 0, local: 1, differs: 2 };

/**
 * Each icon an app names, against today's DS1 drawing. An app that carries a
 * copy of the icon map (beside its DS1 snapshot) is compared drawing by
 * drawing; one without a copy resolves names from DS1 itself. A name DS1
 * does not have is local only, used or merely added to the app's copy.
 * Files, masks and pasted drawings are compared with DS1's drawings by their
 * geometry. A cell takes the status of its furthest site from DS1.
 */
export function scanIcons(root: string, manifest: string | undefined, files: string[], ds1: Map<string, string>, _ds1Icons?: string, scope?: IconScope): IconAdoption {
  const copyPath = manifest ? join(dirname(manifest), "2-core/generated/ds-icon-map.ts") : null;
  const copy = copyPath ? readIconMap(join(root, copyPath)) : null;
  const drawings = drawingsOf(ds1);
  const cells: Record<string, IconCell> = {};
  const dynamic: IconSite[] = [];
  const inline: IconSite[] = [];
  const fonts: IconSite[] = [];
  const mapState = (name: string): { status: IconStatus; copy: IconCell["copy"] } => {
    const ours = copy?.get(name);
    const theirs = ds1.get(name);
    const state: IconCell["copy"] = theirs === undefined ? (!copy ? "none" : "local") : !copy ? "none" : ours === undefined ? "missing" : compact(ours) === compact(theirs) ? "same" : "differs";
    return { status: theirs === undefined ? "local" : state === "differs" || state === "missing" ? "differs" : "shared", copy: state };
  };
  const cell = (name: string): IconCell => cells[name] ??= { uses: 0, ...mapState(name), sites: [] };
  /** A site of `kind` drawing `name`; without a status it draws through the app's icon map. */
  const add = (name: string, site: IconSite, kind: IconKind, status?: IconStatus, ds1Name?: string) => {
    const target = cell(name);
    const state = status ?? mapState(name).status;
    target.status = target.uses ? (severity[state] > severity[target.status] ? state : target.status) : state;
    target.uses++;
    target.sites.push({ ...site, kind, status: state });
    if (ds1Name && ds1Name !== name && ds1.has(ds1Name)) target.ds1 = ds1Name;
  };
  /** A drawing named after DS1 when it is one, else after its file: a copy that differs, or local. Logos and codes are pictures. */
  const classify = (svg: string, hint: string, path: string): { name: string; status: IconStatus } | null => {
    const match = drawings.match(svg, hint);
    if (match) return { name: match, status: "shared" };
    if (!iconSized(svg) || /(?:^|[/._-])(?:logos?|qr)(?:[/._-]|$)/i.test(path)) return null;
    return { name: hint, status: ds1.has(hint) ? "differs" : "local" };
  };
  const styles = scope ? styleSheets(root, scope) : files.filter(file => STYLESHEET.test(file));
  const svgs = scope ? tracked(root, "*.svg") : files.filter(file => /\.svg$/i.test(file));
  const sources = [...new Set([...files.filter(file => !/\.svg$/i.test(file)), ...styles])].map(file => ({ file, source: readFileSync(join(root, file), "utf8") }));
  const cssUses = sources.map(({ file, source }) => ({ file, ...styleIconUrls(source) }));
  // A custom property counts where a mask or background reads it; DS1's .ds-icon reads --ds-icon.
  const consumed = new Set(["--ds-icon", ...cssUses.flatMap(use => [...use.consumed])]);
  const reference = (file: string, url: string, line: number, kind: IconKind) => {
    const data = dataSvg(url);
    if (data !== null) {
      const match = drawings.match(data);
      if (match) add(match, { file, line, name: "data:svg", drawing: "data:" }, kind, "shared");
      else if (iconSized(data)) inline.push({ file, line, name: "data:svg", kind, status: "local" });
      return;
    }
    const resolved = resolveSvg(root, file, url, svgs);
    if (!resolved) return;
    const found = classify(resolved.svg, basename(resolved.path, ".svg"), resolved.path);
    if (found) add(found.name, { file, line, name: basename(resolved.path), drawing: resolved.path }, kind, found.status);
  };
  for (const { file, uses } of cssUses) {
    const seen = new Set<string>();
    for (const use of uses) {
      if (!MASK_PROPERTY.test(use.property) && !(use.property.startsWith("--") && consumed.has(use.property))) continue;
      const key = `${use.block}|${use.url}`;
      if (seen.has(key)) continue;
      seen.add(key);
      reference(file, use.url, use.line, "mask");
    }
  }
  for (const { file, source } of sources) {
    if (STYLESHEET.test(file)) continue;
    for (const image of imageIcons(source)) reference(file, image.url, image.line, "file");
    const imported = importedIcons(source);
    for (const use of imported.library) add(use.name, { file, line: use.line, name: use.name }, "library", "local", wellKnown(use.icon));
    for (const use of imported.files) {
      const site = { file, line: use.line, name: use.name };
      const resolved = resolveSvg(root, file, use.path, svgs);
      const found = resolved ? classify(resolved.svg, use.name, resolved.path) : null;
      if (found) add(found.name, { ...site, drawing: resolved!.path }, "file", found.status);
      // A DS1 drawing named by its path still names the icon when the file is not there.
      else if (!resolved && /(?:^|\/)x-icon\/[a-z0-9-]+\.svg$/.test(use.path)) add(use.name, site, "file");
    }
    for (const use of iconSites(source)) {
      const site = { file, line: use.line, name: use.name ?? (use.inline ? "svg" : "ds-icon") };
      if (use.inline) inline.push({ ...site, kind: "inline", status: "local" });
      else if (!use.name) dynamic.push({ ...site, kind: "element" });
      else add(use.name, site, "element");
    }
  }
  // Unused copies still matter when they are not DS1's drawing.
  for (const name of copy?.keys() ?? []) {
    if (cells[name]) continue;
    const target = cell(name);
    if (target.status === "shared") delete cells[name];
  }
  return { copy: copy ? copyPath : null, cells, dynamic, inline, fonts };
}

// ---------------------------------------------------------------------------
// Names of other icon sets that plainly mean a DS1 icon.

const WELL_KNOWN: Record<string, string> = {
  x: "close", "x-mark": "close", xmark: "close", close: "close", cross: "close",
  trash: "delete", "trash-can": "delete", delete: "delete", bin: "delete",
  copy: "duplicate", duplicate: "duplicate", clone: "duplicate",
  "external-link": "up-right", "arrow-up-right": "up-right", "arrow-square-out": "up-right", "box-arrow-up-right": "up-right", "square-arrow-out-up-right": "up-right", "open-in-new": "up-right", "up-right-from-square": "up-right",
  "chevron-down": "down", "caret-down": "down", "arrow-down": "down", "expand-more": "down", "angle-down": "down",
  "chevron-up": "up", "caret-up": "up", "arrow-up": "up", "expand-less": "up", "angle-up": "up",
  "chevron-left": "left", "caret-left": "left", "arrow-left": "left", "angle-left": "left",
  "chevron-right": "right", "caret-right": "right", "arrow-right": "right", "angle-right": "right",
  plus: "plus", add: "plus", minus: "minus", check: "check", checkmark: "check", done: "check",
  search: "search", "magnifying-glass": "search", settings: "settings", gear: "settings", cog: "settings",
  "more-horizontal": "more", "more-vertical": "more", "more-horiz": "more", "more-vert": "more", ellipsis: "more", "dots-three": "more", "dots-three-vertical": "more", "three-dots": "more",
  menu: "menu", hamburger: "menu", bars: "menu", list: "lists", star: "star", heart: "heart", home: "home", house: "home",
  mail: "email", envelope: "email", email: "email", lock: "lock", unlock: "unlock", "lock-open": "unlock", eye: "see", "eye-off": "unsee", "eye-slash": "unsee",
  user: "avatar", "user-circle": "avatar", "circle-user": "avatar", person: "avatar", users: "people", calendar: "calendar", globe: "globe", languages: "globe", link: "link",
  download: "download", upload: "upload", play: "play-alt", pause: "pause", stop: "stop", undo: "undo", redo: "redo",
  refresh: "refresh", "refresh-cw": "refresh", "rotate-cw": "refresh", "arrow-clockwise": "refresh", history: "history",
  "log-in": "sign-in", "sign-in": "sign-in", "log-out": "sign-out", "sign-out": "sign-out", image: "icon", photo: "icon", folder: "folder", file: "page", "file-text": "page",
  bell: "notifications", info: "info", "help-circle": "help", "circle-help": "help", question: "help", "alert-triangle": "warning", "triangle-alert": "warning", warning: "warning",
  sun: "sun", moon: "moon", monitor: "system", paperclip: "attach", mic: "mic", "mic-off": "unmic", camera: "camera", code: "code",
  bold: "bold", italic: "italic", underline: "underline", strikethrough: "strike", sparkles: "sparkle", sparkle: "sparkle",
  grip: "handle", "grip-vertical": "handle", "dots-six-vertical": "handle", maximize: "expand", expand: "expand", minimize: "minimize",
  "message-square": "comment", "message-circle": "comment", chat: "comment", comment: "comment", pencil: "pen", edit: "pen", pen: "pen",
  share: "shared", wifi: "wifi", "wifi-off": "offline", key: "key", keyboard: "keyboard", video: "video", music: "music", tag: "tag", gift: "gift", shield: "shield",
  "credit-card": "card", wallet: "wallet", "shopping-cart": "cart", cart: "cart", "shopping-bag": "bag", phone: "phone", map: "map", "map-pin": "map",
};
/** The DS1 icon an icon set's name obviously means (`x`, `trash-2`, `external-link`), if any. */
export function wellKnown(name: string): string | undefined {
  const key = kebab(name).replace(/^icon-|-icon$/g, "").replace(/-\d+$/, "");
  return WELL_KNOWN[key];
}
