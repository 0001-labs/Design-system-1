/**
 * Published design libraries: stylesheets authored in Design system 1's
 * libraries app and served from `designsystem1.com/ds1/<id>/latest.css` (or an
 * immutable `/v/<n>.css`). A product can hand native controls to one, marking
 * each with a literal `data-library-control` attribute, often through thin
 * wrappers of its own.
 *
 * Such a site claims DS1 styling through the library, not through controls.css.
 * The claim verifies only for a pinned library: Sync 1's `library` export copied
 * one published version (`ds1-library/<id>/v/<n>.css`) with its manifest, the
 * lock records both hashes at a DS1 commit, the copy and manifest are unchanged,
 * the stylesheet carries the stamp publishing writes (the DS1 library revision
 * that prepared it), and the product loads that copy and no library address.
 * Then its sites count as DS1 styles. A library loaded from its address
 * (`latest.css` changes with every publish), a copy that was changed, or one
 * without a lock or stamp, counts as needs review, never as local.
 *
 * Only literal evidence counts: a library address in the app's tracked source,
 * the marker on the element itself, or an imported JSX use of a wrapper whose
 * exported component renders exactly one marked native element. Native text a
 * page-wide library sheet may also draw is not inferred.
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import ts from "typescript";
import type { ComponentCell } from "../shared/component-adoption";

/** A published library's public address: a 20-character Crockford base32 ID. */
const addressPattern = "designsystem1\\.com/ds1/[0-9a-hjkmnp-tv-z]{20}/(latest|v/[1-9][0-9]*)\\.css";
export const libraryAddress = new RegExp(addressPattern);
export const libraryMarker = "data-library-control";
export const libraryIssue = (connection: string) => `Drawn by a published design library (connected in ${connection}). Its rules are not verifiable against a DS1 revision: no lock records the published library version and content hash this product carries.`;
/** A library loaded from its address: `latest.css` changes with every publish, and no address is locked. */
const liveIssue = (connection: string, latest: boolean) => latest
  ? `${libraryIssue(connection)} It is fetched from latest.css, which changes with every publish; pin a version through Sync 1's library export.`
  : `${libraryIssue(connection)} It is loaded from its address rather than a pinned copy; pin the version through Sync 1's library export.`;

/** What publishing stamps first (DS1/1-root/library-tokens.ts). */
const stamp = /^(?:@charset "[^"]*";\s*)?\/\* Design system 1 library, revision (sha256:[0-9a-f]{12}) \*\//;
const pinnedPath = /^(?:(.*)\/)?ds1-library\/([0-9a-hjkmnp-tv-z]{20})\/v\/([1-9][0-9]*)\.css$/;
const sha256 = (body: string | Buffer) => createHash("sha256").update(body).digest("hex");

/** A published library pinned through Sync 1's library export, and whether its copy verifies against the lock. */
export interface PinnedLibrary {
  id: string;
  version: number;
  /** The copy's path, relative to the app. */
  path: string;
  revision?: string;
  verified: boolean;
  issues: string[];
}

/** The libraries the app's sync.lock.json records as pinned, each checked against the lock, its manifest and its stamp. */
export function pinnedLibraries(root: string): PinnedLibrary[] {
  const lockPath = join(root, "sync.lock.json");
  if (!existsSync(lockPath)) return [];
  let lock: Record<string, { commit?: string; dirty?: boolean; files?: Record<string, string> }>;
  try { lock = JSON.parse(readFileSync(lockPath, "utf8")); } catch { return []; }
  const source = lock["Design system 1"];
  const files = source?.files ?? {};
  const pins: PinnedLibrary[] = [];
  for (const path of Object.keys(files)) {
    const match = pinnedPath.exec(path);
    if (!match) continue;
    const [, folder, id, number] = match;
    const version = Number(number);
    const issues: string[] = [];
    let revision: string | undefined;
    const at = (file: string) => resolve(root, file);
    const inside = (file: string) => at(file).startsWith(resolve(root) + "/");
    if (!/^[a-f0-9]{40}$/.test(source?.commit ?? "")) issues.push("sync.lock.json records no DS1 commit for the copy.");
    if (source?.dirty) issues.push("The copy was taken from DS1 with uncommitted changes.");
    if (!inside(path) || !existsSync(at(path))) issues.push(`Missing: ${path}`);
    else {
      const css = readFileSync(at(path));
      if (sha256(css) !== files[path]) issues.push(`Locally modified: ${path}`);
      revision = stamp.exec(css.toString("utf8"))?.[1];
      if (!revision) issues.push(`${path} carries no DS1 library stamp: it was not prepared by publishing.`);
    }
    const manifestPath = `${folder ? `${folder}/` : ""}ds1-library/library-manifest.json`;
    if (!files[manifestPath]) issues.push(`sync.lock.json records no ${manifestPath}.`);
    else if (!inside(manifestPath) || !existsSync(at(manifestPath))) issues.push(`Missing: ${manifestPath}`);
    else {
      const body = readFileSync(at(manifestPath));
      if (sha256(body) !== files[manifestPath]) issues.push(`Locally modified: ${manifestPath}`);
      let manifest: Record<string, unknown> = {};
      try { manifest = JSON.parse(body.toString("utf8")) as Record<string, unknown>; } catch { issues.push(`${manifestPath} is not JSON.`); }
      if (manifest.library !== id || manifest.version !== version || manifest.file !== `${id}/v/${version}.css`) issues.push(`${manifestPath} names another library or version than ${path}.`);
      if (manifest.sha256 !== files[path]) issues.push(`${manifestPath} records another hash than sync.lock.json for ${path}.`);
      if (revision && manifest.revision !== revision) issues.push(`${manifestPath} records another revision than ${path} is stamped with.`);
    }
    pins.push({ id: id!, version, path, revision, verified: !issues.length, issues });
  }
  return pins.sort((a, b) => a.path.localeCompare(b.path));
}

/** A native element carrying the marker, at the line its site is recorded. */
export type MarkedElement = { tag: string; line: number; component: string; start: number; end: number };
type Site = { tag: string; line: number };

/** The column a marked native element counts in: a marked link is a library button face. */
function markedColumn(tag: string, type: string | undefined): string | undefined {
  if (tag === "button" || tag === "a") return "button";
  if (tag === "input") return type === "checkbox" || type === "radio" || type === "color" ? type : type === "file" ? "file-picker" : "input";
  return ({ select: "select", textarea: "textarea" } as Record<string, string>)[tag];
}

/** Marked native elements in markup, JSX and createElement/h calls, with literal attributes only. */
export function markedElements(file: string, source: string): MarkedElement[] {
  const found: MarkedElement[] = [];
  const line = (offset: number) => source.slice(0, offset).split("\n").length;
  const markup = (text: string, offset: number) => {
    const clean = text.replace(/<!--[\s\S]*?-->/g, match => match.replace(/[^\n]/g, " "));
    for (const match of clean.matchAll(/<([a-z][\w-]*)(?=[\s/>])([^>]*)>/g)) {
      if (!new RegExp(`(?:^|\\s)${libraryMarker}(?=[\\s=/]|$)`).test(match[2]!)) continue;
      const type = /\btype\s*=\s*["']([^"']*)["']/.exec(match[2]!)?.[1];
      const component = markedColumn(match[1]!, type);
      if (component) found.push({ tag: match[1]!, line: line(offset + match.index!), component, start: offset + match.index!, end: offset + match.index! + match[0].length });
    }
  };
  if (/\.(html|astro)$/.test(file)) {
    markup(source.replace(/^---[\s\S]*?\n---/, match => match.replace(/[^\n]/g, " ")).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, match => match.replace(/[^\n]/g, " ")), 0);
    return found;
  }
  if (!/\.[cm]?[jt]sx?$/.test(file)) return found;
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, /x$/.test(file) ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const factories = new Set<string>();
  for (const statement of ast.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier) || statement.moduleSpecifier.text !== "react") continue;
    const bindings = statement.importClause?.namedBindings;
    if (bindings && ts.isNamedImports(bindings)) for (const binding of bindings.elements) if ((binding.propertyName ?? binding.name).text === "createElement") factories.add(binding.name.text);
  }
  const literal = (node: ts.Node | undefined) => node && ts.isStringLiteralLike(node) ? node.text : undefined;
  const walk = (node: ts.Node) => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(ast);
      const attributes = node.attributes.properties.filter(ts.isJsxAttribute);
      const type = attributes.find(attribute => attribute.name.getText(ast) === "type");
      const component = /^[a-z]/.test(tag) && attributes.some(attribute => attribute.name.getText(ast) === libraryMarker) ? markedColumn(tag, literal(type?.initializer)) : undefined;
      if (component) found.push({ tag, line: line(node.getStart(ast)), component, start: node.getStart(ast), end: ts.isJsxOpeningElement(node) ? node.parent.getEnd() : node.getEnd() });
    }
    if (ts.isCallExpression(node) && ((ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "createElement") || (ts.isIdentifier(node.expression) && factories.has(node.expression.text)))) {
      const [tag, props] = node.arguments;
      if (tag && ts.isStringLiteralLike(tag) && props && ts.isObjectLiteralExpression(props)) {
        const named = (name: string) => props.properties.find((property): property is ts.PropertyAssignment => ts.isPropertyAssignment(property) && property.name.getText(ast).replace(/["']/g, "") === name);
        const component = named(libraryMarker) ? markedColumn(tag.text, literal(named("type")?.initializer)) : undefined;
        if (component) found.push({ tag: tag.text, line: line(tag.getStart(ast)), component, start: node.getStart(ast), end: node.getEnd() });
      }
    }
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      if (!ts.isJsxAttribute(node.parent) && !ts.isImportDeclaration(node.parent)) markup(node.text, node.getStart(ast) + 1);
    }
    ts.forEachChild(node, walk);
  };
  walk(ast);
  return found;
}

/** A wrapper is an exported component whose declaration renders exactly one marked native element. */
function exportedWrappers(file: string, source: string): Map<string, MarkedElement> {
  const marked = markedElements(file, source);
  const wrappers = new Map<string, MarkedElement>();
  if (!marked.length) return wrappers;
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, /x$/.test(file) ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const exported = (node: ts.Node) => ts.canHaveModifiers(node) && ts.getModifiers(node)?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword);
  /** The expressions a declaration's functions return: a wrapper returns its marked element itself. */
  const returned = (node: ts.Node) => {
    const ranges = new Set<string>();
    const add = (expression: ts.Expression) => {
      let inner: ts.Expression = expression;
      while (ts.isParenthesizedExpression(inner)) inner = inner.expression;
      ranges.add(`${inner.getStart(ast)}:${inner.getEnd()}`);
    };
    const visit = (child: ts.Node) => {
      if (ts.isReturnStatement(child) && child.expression) add(child.expression);
      if (ts.isArrowFunction(child) && !ts.isBlock(child.body)) add(child.body);
      ts.forEachChild(child, visit);
    };
    visit(node);
    return ranges;
  };
  const claim = (name: string, node: ts.Node) => {
    const inside = marked.filter(element => element.start >= node.getStart(ast) && element.end <= node.getEnd());
    if (inside.length === 1 && returned(node).has(`${inside[0]!.start}:${inside[0]!.end}`)) wrappers.set(name, inside[0]!);
  };
  for (const statement of ast.statements) {
    if (!exported(statement)) continue;
    if (ts.isFunctionDeclaration(statement) && statement.name) claim(statement.name.text, statement);
    if (ts.isVariableStatement(statement)) for (const declaration of statement.declarationList.declarations) if (ts.isIdentifier(declaration.name) && declaration.initializer) claim(declaration.name.text, declaration.initializer);
  }
  return wrappers;
}

export type LibraryUse = { component: string };
export interface PublishedLibrary {
  /** Where the app connects the library, relative to the app. */
  connection: string;
  /** A pinned copy that verifies, loaded in place of any library address: its sites are DS1 styles. */
  verified: boolean;
  /** Why the library's sites need review, when they do. */
  issue?: string;
  /** Per file: wrapper uses by binding name, marked native sites, and wrapper faces counted at their uses instead. */
  read(file: string, source: string): LibraryFile;
}
export interface LibraryFile {
  /** A site drawn by the library (its column), `null` for a wrapper's own face, or undefined when the library has no claim on it. */
  site(site: Site): LibraryUse | null | undefined;
}

/** The app's published library connection, from its tracked files. Without one, the marker means nothing. */
export function publishedLibrary(root: string): PublishedLibrary | undefined {
  const pins = pinnedLibraries(root);
  const pinnedFiles = new Set(pins.map(pin => pin.path));
  // Code and stylesheets connect a library; a brief, README, manifest or test that names it does not.
  const connecting = (args: string[]) => {
    let listed = "";
    try { listed = execFileSync("git", ["grep", "-l", ...args, "--", "."], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); }
    catch { return []; }
    return listed.split("\n").filter(file => file && !pinnedFiles.has(file) && /\.(?:[cm]?[jt]sx?|css|html|astro)$/.test(file) && !/(?:^|\/)(?:tests?|__tests__|fixtures)\/|\.(?:test|spec)\.[^.]+$/.test(file)).sort();
  };
  const remote = connecting(["-E", addressPattern])[0];
  const loaded = pins.map(pin => ({ pin, file: connecting(["-F", `ds1-library/${pin.id}/v/${pin.version}.css`])[0] })).filter(entry => entry.file);
  const connection = remote ?? loaded[0]?.file;
  if (!connection) return undefined;
  let verified = false, issue: string;
  if (remote) {
    const latest = libraryAddress.exec(readFileSync(join(root, remote), "utf8"))?.[1] === "latest";
    issue = liveIssue(remote, latest);
  } else {
    const failing = loaded.filter(({ pin }) => !pin.verified);
    verified = !failing.length;
    issue = failing.map(({ pin }) => `Pinned library ${pin.id} v${pin.version} (loaded in ${connection}) does not verify: ${pin.issues.join(" ")}`).join(" ");
  }
  const modules = new Map<string, Map<string, MarkedElement>>();
  const wrappersIn = (path: string) => {
    if (!modules.has(path)) modules.set(path, exportedWrappers(path, readFileSync(path, "utf8")));
    return modules.get(path)!;
  };
  const resolveModule = (from: string, name: string) => {
    if (!name.startsWith(".") && !name.startsWith("@/")) return undefined;
    const base = name.startsWith("@/") ? resolve(root, "src", name.slice(2)) : resolve(dirname(from), name);
    if (!base.startsWith(resolve(root) + "/")) return undefined;
    return [base, `${base}.ts`, `${base}.tsx`, join(base, "index.ts"), join(base, "index.tsx")].find(path => existsSync(path) && statSync(path).isFile() && /\.[cm]?[jt]sx?$/.test(path));
  };
  /** Follow named re-exports: they bind the same component whatever else the module does. */
  const wrapper = (path: string | undefined, name: string, depth = 0): MarkedElement | undefined => {
    if (!path || depth > 3) return undefined;
    const own = wrappersIn(path).get(name);
    if (own) return own;
    const module = ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest, true);
    for (const node of module.statements) {
      if (!ts.isExportDeclaration(node) || node.isTypeOnly || !node.moduleSpecifier || !ts.isStringLiteral(node.moduleSpecifier) || !node.exportClause || !ts.isNamedExports(node.exportClause)) continue;
      for (const binding of node.exportClause.elements) {
        if (binding.isTypeOnly || binding.name.text !== name) continue;
        const found = wrapper(resolveModule(path, node.moduleSpecifier.text), (binding.propertyName ?? binding.name).text, depth + 1);
        if (found) return found;
      }
    }
    return undefined;
  };
  return {
    connection,
    verified,
    ...(verified ? {} : { issue }),
    read(file, source) {
      const path = resolve(root, file);
      const uses = new Map<string, string>();
      if (/\.[cm]?[jt]sx?$/.test(file)) {
        const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, /x$/.test(file) ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
        for (const node of ast.statements) {
          if (!ts.isImportDeclaration(node) || !ts.isStringLiteral(node.moduleSpecifier) || node.importClause?.isTypeOnly) continue;
          const bindings = node.importClause?.namedBindings;
          if (!bindings || !ts.isNamedImports(bindings)) continue;
          for (const binding of bindings.elements) {
            if (binding.isTypeOnly) continue;
            const found = wrapper(resolveModule(path, node.moduleSpecifier.text), (binding.propertyName ?? binding.name).text);
            if (found) uses.set(binding.name.text, found.component);
          }
        }
      }
      const faces = new Set([...(/\.[cm]?[jt]sx?$/.test(file) ? wrappersIn(path).values() : [])].map(element => `${element.tag}:${element.line}`));
      const marked = new Map(markedElements(file, source).map(element => [`${element.tag}:${element.line}`, element.component]));
      return {
        site(site) {
          if (uses.has(site.tag)) return { component: uses.get(site.tag)! };
          const key = `${site.tag}:${site.line}`;
          if (faces.has(key)) return null;
          return marked.has(key) ? { component: marked.get(key)! } : undefined;
        },
      };
    },
  };
}

/** Record a library site: DS1 styles through a verified pinned library, else needs review with the provenance issue. */
export function countLibrarySite(cell: ComponentCell, file: string, site: Site, library: Pick<PublishedLibrary, "connection" | "verified" | "issue">) {
  const tag = /^[a-z]/.test(site.tag) ? `${site.tag}[${libraryMarker}]` : site.tag;
  if (library.verified) {
    cell.styled++;
    cell.sites.push({ file, line: site.line, tag, kind: "styled" });
    return;
  }
  cell.unverified++;
  cell.sites.push({ file, line: site.line, tag, kind: "unverified" });
  const issue = library.issue ?? libraryIssue(library.connection);
  if (!cell.issues.includes(issue)) cell.issues.push(issue);
}

export const libraryMethod = [
  "Published design libraries: a native control marked with a literal data-library-control attribute, or an imported JSX use of a wrapper whose exported component renders exactly one such control, in an app whose tracked source connects a published library, counts in the control's column. It is DS1 styles when the app loads a pinned copy (ds1-library/<id>/v/<n>.css from Sync 1's library export) and no library address, and the copy verifies: sync.lock.json records it and its manifest at a DS1 commit, both are unchanged, and the stylesheet carries the stamp publishing writes, naming the DS1 library revision that prepared it. A library loaded from its address (designsystem1.com/ds1/<id>/latest.css changes with every publish), or a copy that does not verify, counts as needs review. A wrapper's own face counts at its uses, not again. Native text a page-wide library sheet may draw is not inferred.",
];
