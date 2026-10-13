import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, mkdirSync, writeFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { COMPONENT_COLUMNS, type AdoptionApp, type AdoptionReport, type ComponentCell, type UsageSite } from "../shared/component-adoption";

const repository = fileURLToPath(new URL("../", import.meta.url));
const hash = (body: string | Buffer) => createHash("sha256").update(body).digest("hex");
const git = (root: string, ...args: string[]) => execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 20_000_000 }).trim();
export const excluded = /(?:^|\/)(?:design|ds1|vendor|signIn|_generated|generated|node_modules|dist|__surface|surface|design-lab|designLab|dev|experiments|previews|__tests__|tests|test|fixtures|stories)(?:\/|$)|(?:\.test|\.spec|\.stories|\.d)\.[^.]+$/i;

export interface AppSpec { id: string; name: string; directory: string; roots: string[]; manifest?: string }
export const APPS: AppSpec[] = [
  { id: "ezo", name: "Ezo", directory: "Ezo", roots: ["client"], manifest: "client/design/components-manifest.json" },
  { id: "music", name: "Music", directory: "Music", roots: ["web"] },
  { id: "link", name: "Link", directory: "Link", roots: ["client", "src"], manifest: "shared/ds1/components-manifest.json" },
  { id: "consistency", name: "Consistency", directory: "Consistency", roots: ["src"], manifest: "src/design/components-manifest.json" },
];
const known = new Set(COMPONENT_COLUMNS.map(c => c.id));
const native: Record<string, string> = { button: "button", input: "input", select: "input", textarea: "input", p: "text", h1: "text", h2: "text", h3: "text", h4: "text", h5: "text", h6: "text", ul: "list", ol: "list", table: "table", form: "form" };
type TagSite = { tag: string; line: number; nativeStyle?: string };
function nativeStyle(tag: string, className: string): string | undefined {
  const classes = className.split(/\s+/);
  const supported = tag === "button" ? ["ds-button"] : ["input", "select", "textarea"].includes(tag) ? ["ds-input", "ds-select", "ds-checkbox"] : [];
  return supported.find(name => classes.includes(name));
}

/** Parse syntax, not comments or import/selector strings. Template chunks preserve line offsets. */
export function sourceSites(file: string, source: string): TagSite[] {
  const found: TagSite[] = [];
  const line = (offset: number) => source.slice(0, offset).split("\n").length;
  const markup = (text: string, offset: number) => {
    const clean = text.replace(/<!--[\s\S]*?-->/g, match => match.replace(/[^\n]/g, " "));
    for (const match of clean.matchAll(/<([A-Za-z][\w.-]*)(?=[\s/>])/g)) {
      const attributes = clean.slice(match.index! + match[0].length).split(">")[0]!;
      const className = /\bclass\s*=\s*["']([^"']*)["']/.exec(attributes)?.[1] ?? "";
      found.push({ tag: match[1]!, line: line(offset + match.index!), nativeStyle: nativeStyle(match[1]!, className) });
    }
  };
  if (/\.(html|astro)$/.test(file)) {
    // Astro frontmatter is code, not markup. Embedded JS is walked separately below.
    const body = source.replace(/^---[\s\S]*?\n---/, match => match.replace(/[^\n]/g, " "));
    markup(body.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, match => match.replace(/[^\n]/g, " ")), 0);
    for (const match of source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
      const start = match.index! + match[0].indexOf(">") + 1;
      found.push(...sourceSites("embedded.ts", match[1]!).map(site => ({ ...site, line: site.line + line(start) - 1 })));
    }
    return found;
  }
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, /x$/.test(file) ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const reactFactories = new Set<string>();
  for (const statement of ast.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier) || statement.moduleSpecifier.text !== "react") continue;
    const bindings = statement.importClause?.namedBindings;
    if (bindings && ts.isNamedImports(bindings)) for (const binding of bindings.elements) {
      if ((binding.propertyName ?? binding.name).text === "createElement") reactFactories.add(binding.name.text);
    }
  }
  const walk = (node: ts.Node) => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(ast);
      const attribute = node.attributes.properties.find(p => ts.isJsxAttribute(p) && ["class", "className"].includes(p.name.getText(ast)));
      const initializer = attribute && ts.isJsxAttribute(attribute) ? attribute.initializer : undefined;
      const className = initializer && ts.isStringLiteral(initializer) ? initializer.text : "";
      found.push({ tag, line: line(node.getStart(ast)), nativeStyle: nativeStyle(tag, className) });
    }
    if (ts.isCallExpression(node) && ((ts.isPropertyAccessExpression(node.expression) && ["createElement", "createElementNS"].includes(node.expression.name.text)) || (ts.isIdentifier(node.expression) && reactFactories.has(node.expression.text)))) {
      const arg = node.arguments[ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "createElementNS" ? 1 : 0];
      if (arg && ts.isStringLiteralLike(arg)) found.push({ tag: arg.text, line: line(arg.getStart(ast)) });
    }
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) {
      // JSX attribute strings are copy, not elements. Other markup strings feed innerHTML/Lit.
      if (!ts.isJsxAttribute(node.parent)) markup(node.getText(ast).slice(1, ts.isTemplateHead(node) || ts.isTemplateMiddle(node) ? -2 : -1), node.getStart(ast) + 1);
    }
    ts.forEachChild(node, walk);
  };
  walk(ast);
  return found;
}

function emptyCell(): ComponentCell { return { shared: 0, styled: 0, local: 0, unverified: 0, sites: [], snapshot: "none", current: null, issues: [] }; }
interface Manifest { commit: string; components: string[]; files: Record<string, string> }

export function checkSnapshots(root: string, manifestPath: string | undefined, dsRoot: string): { commit: string | null; cells: Record<string, ComponentCell>; controls: ComponentCell; reactInput: ComponentCell } {
  const cells = Object.fromEntries(COMPONENT_COLUMNS.map(c => [c.id, emptyCell()]));
  const controls = emptyCell();
  const reactInput = emptyCell();
  if (!manifestPath || !existsSync(join(root, manifestPath))) return { commit: null, cells, controls, reactInput };
  const manifest = JSON.parse(readFileSync(join(root, manifestPath), "utf8")) as Manifest;
  if (!/^[a-f0-9]{40}$/.test(manifest.commit) || !Array.isArray(manifest.components) || !manifest.files) throw new Error("Invalid component manifest");
  const snapshot = dirname(join(root, manifestPath));
  const historical = new Map<string, string | null>();
  const readHistorical = (file: string) => {
    if (!historical.has(file)) {
      try { historical.set(file, execFileSync("git", ["show", `${manifest.commit}:DS1/${file}`], { cwd: dsRoot, stdio: ["ignore", "pipe", "ignore"] }).toString()); }
      catch { historical.set(file, null); }
    }
    return historical.get(file)!;
  };
  for (const component of [...manifest.components, "@controls", ...(manifest.files['react/input.ts'] ? ['@react-input'] : [])]) {
    const cell = component === "@controls" ? controls : component === '@react-input' ? reactInput : cells[component];
    if (!cell) continue;
    const entry = component === "@controls" ? "1-root/controls.css" : component === '@react-input' ? 'react/input.ts' : Object.keys(manifest.files).find(f => f.endsWith(`/ds-${component}.ts`));
    const visited = new Set<string>();
    let modified = false, unverifiable = false, current = true;
    const visit = (file: string) => {
      if (visited.has(file)) return;
      visited.add(file);
      const path = resolve(snapshot, file);
      if (!path.startsWith(snapshot + "/") || !existsSync(path) || !manifest.files[file]) { unverifiable = true; cell.issues.push(`Missing dependency: ${file}`); return; }
      const body = readFileSync(path, "utf8");
      if (hash(body) !== manifest.files[file]) { modified = true; cell.issues.push(`Locally modified: ${file}`); }
      const original = readHistorical(file);
      if (original === null || hash(original) !== manifest.files[file]) { unverifiable = true; cell.issues.push(`Source revision not verified: ${file}`); }
      const latest = join(dsRoot, "DS1", file);
      if (!existsSync(latest) || hash(readFileSync(latest)) !== hash(body)) current = false;
      for (const match of body.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|^\s*import\s*|@import\s*)["'](\.[^"']+)["']/gm)) {
        const base = resolve(dirname(path), match[1]!.split("?")[0]!);
        const dep = [base, `${base}.ts`, `${base}.json`, join(base, "index.ts")].find(f => existsSync(f) && statSync(f).isFile());
        if (dep) visit(relative(snapshot, dep));
        else { unverifiable = true; cell.issues.push(`Unresolved dependency in ${file}`); }
      }
    };
    if (entry) visit(entry); else { unverifiable = true; cell.issues.push("Component entry missing"); }
    visit("1-root/component-tokens.css"); visit("1-root/controls.css");
    cell.snapshot = modified ? "modified" : unverifiable ? "unverified" : "verified";
    cell.current = current && !unverifiable;
  }
  return { commit: manifest.commit, cells, controls, reactInput };
}

/** Follow direct imports and pure registration/re-export entries to the snapshot.
 * Matching names alone never establish adoption. The adapter's full dependency
 * graph is checked separately from direct Lit usage.
 */
function importedInputAdapters(root: string, file: string, source: string, manifestPath?: string): Set<string> {
  const found = new Set<string>();
  if (!manifestPath) return found;
  const expected = resolve(root, dirname(manifestPath), 'react/input.ts');
  const resolveModule = (from: string, name: string) => {
    if (!name.startsWith('.') && !name.startsWith('@/')) return undefined;
    const base = name.startsWith('@/') ? resolve(root, 'src', name.slice(2)) : resolve(dirname(from), name);
    if (!base.startsWith(resolve(root) + '/')) return undefined;
    return [base, `${base}.ts`, `${base}.tsx`, join(base, 'index.ts')].find(path => existsSync(path) && statSync(path).isFile());
  };
  const forwards = (path: string | undefined, name: string, depth = 0): boolean => {
    if (!path || depth > 3) return false;
    if (path === expected) return name === 'Input';
    const module = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true);
    if (module.statements.some(node => !ts.isImportDeclaration(node) && !ts.isExportDeclaration(node) && !ts.isEmptyStatement(node))) return false;
    return module.statements.some(node => {
      if (!ts.isExportDeclaration(node) || node.isTypeOnly || !node.moduleSpecifier || !ts.isStringLiteral(node.moduleSpecifier) || !node.exportClause || !ts.isNamedExports(node.exportClause)) return false;
      const exportedModule = resolveModule(path, node.moduleSpecifier.text);
      return node.exportClause.elements.some(binding => !binding.isTypeOnly && binding.name.text === name && forwards(exportedModule, (binding.propertyName ?? binding.name).text, depth + 1));
    });
  };
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  for (const node of ast.statements) {
    if (!ts.isImportDeclaration(node) || !ts.isStringLiteral(node.moduleSpecifier) || node.importClause?.isTypeOnly) continue;
    const bindings = node.importClause?.namedBindings;
    if (!bindings || !ts.isNamedImports(bindings)) continue;
    for (const binding of bindings.elements) if (!binding.isTypeOnly && forwards(resolveModule(resolve(root, file), node.moduleSpecifier.text), (binding.propertyName ?? binding.name).text)) found.add(binding.name.text);
  }
  return found;
}

/** Only these inspected, thin adapters are expanded. Their DS tags must still exist. */
const linkAdapters: Record<string, Record<string, string>> = {
  "client/components/TabPills.tsx": { TabPill: "button", TabPillRow: "tabs" },
  "client/components/Tooltip.tsx": { Tooltip: "tooltip", Tooltop: "tooltip" },
};
function importedAdapters(root: string, file: string, source: string): Record<string, string> {
  const result: Record<string, string> = {};
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  for (const node of ast.statements) {
    if (!ts.isImportDeclaration(node) || !ts.isStringLiteral(node.moduleSpecifier)) continue;
    const bindings = node.importClause?.namedBindings;
    if (!bindings || !ts.isNamedImports(bindings)) continue;
    const resolved = relative(root, resolve(root, dirname(file), node.moduleSpecifier.text)).replace(/\.tsx?$/, "") + ".tsx";
    const mapping = linkAdapters[resolved];
    if (!mapping || !existsSync(join(root, resolved))) continue;
    const tags = sourceSites(resolved, readFileSync(join(root, resolved), "utf8")).map(s => s.tag);
    for (const binding of bindings.elements) {
      const component = mapping[(binding.propertyName ?? binding.name).text];
      if (component && tags.filter(tag => tag === `ds-${component}`).length === 1) result[binding.name.text] = component;
    }
  }
  return result;
}

export function scanApp(spec: AppSpec, studio: string, dsRoot = repository): AdoptionApp {
  const root = join(studio, spec.directory);
  const app: AdoptionApp = { id: spec.id, name: spec.name, status: "unavailable", commit: null, dirty: false, files: 0, scope: spec.roots, snapshotCommit: null, cells: {}, otherCustomElements: {} };
  try {
    app.commit = git(root, "rev-parse", "HEAD");
    app.dirty = Boolean(git(root, "status", "--porcelain"));
    const snapshots = checkSnapshots(root, spec.manifest, dsRoot);
    app.snapshotCommit = snapshots.commit;
    app.cells = snapshots.cells;
    const files = git(root, "ls-files", "-z", "--", ...spec.roots).split("\0").filter(f => /\.(tsx?|jsx?|mjs|html|astro)$/.test(f) && !excluded.test(f) && existsSync(join(root, f)));
    if (!files.length) throw new Error("No tracked web source was found in the configured scope.");
    for (const file of files) {
      app.files++;
      const source = readFileSync(join(root, file), "utf8");
      const aliases = spec.id === "link" ? importedAdapters(root, file, source) : {};
      const inputs = importedInputAdapters(root, file, source, spec.manifest);
      const sites = sourceSites(file, source);
      const adapterTags = spec.id === "link" && linkAdapters[file]
        ? new Set(Object.values(linkAdapters[file]!).map(id => `ds-${id}`).filter(tag => sites.filter(s => s.tag === tag).length === 1))
        : new Set<string>();
      for (const site of sites) {
        if (adapterTags.has(site.tag)) continue;
        const custom = /^(ds|ezo|c9y)-(.+)$/.exec(site.tag);
        const component = inputs.has(site.tag) ? 'input' : aliases[site.tag] ?? (custom && known.has(custom[2]!) ? custom[2]! : native[site.tag]);
        if (!component) {
          if (site.tag.includes("-")) app.otherCustomElements[site.tag] = (app.otherCustomElements[site.tag] ?? 0) + 1;
          continue;
        }
        const cell = app.cells[component]!;
        const ds = inputs.has(site.tag) || Boolean(aliases[site.tag]) || custom?.[1] === "ds";
        const evidence = inputs.has(site.tag) ? snapshots.reactInput : cell;
        if (inputs.has(site.tag)) {
          cell.issues = [...new Set([...cell.issues, ...evidence.issues])];
          cell.current = cell.current === true && evidence.current === true;
        }
        const kind: UsageSite["kind"] = ds ? cell.snapshot === "verified" && evidence.snapshot === "verified" ? "shared" : "unverified"
          : site.nativeStyle ? snapshots.controls.snapshot === "verified" ? "styled" : "unverified" : "local";
        if (site.nativeStyle && snapshots.controls.snapshot !== "verified") cell.issues = [...new Set([...cell.issues, ...snapshots.controls.issues, "Native DS1 styles could not be verified."])];
        cell[kind]++;
        cell.sites.push({ file, line: site.line, tag: site.tag + (site.nativeStyle ? `.${site.nativeStyle}` : ""), kind });
      }
    }
    app.status = "scanned";
  } catch (error) {
    app.error = error instanceof Error ? error.message.split("\n")[0] : "Source unavailable";
    app.cells = {};
  }
  return app;
}

export function scanReport(studio = resolve(repository, "..")): AdoptionReport {
  return {
    schema: 1, generatedAt: new Date().toISOString(), sourceCommit: git(repository, "rev-parse", "HEAD"), sourceDirty: Boolean(git(repository, "status", "--porcelain")),
    columns: COMPONENT_COLUMNS,
    apps: APPS.map(app => scanApp(app, studio)),
    method: [
      "Counts are authored source sites in tracked web files, read from the current working tree. A loop counts once. This is not a runtime or production audit; unused tracked source can be included.",
      "DS1 means the component and its imported dependencies match a recorded DS1 Git revision. An older verified snapshot still counts as DS1; the detail view shows whether it matches today's source. Modified or unverifiable DS1 is counted separately.",
      "DS1 styles counts native controls with literal ds-button, ds-input, ds-select or ds-checkbox classes and verified shared control styles. These are not Lit components. Dynamic class expressions are not inferred.",
      "Local means recognized ezo-/c9y- components or native button, input/select/textarea, p/headings, ul/ol, table and form. Native semantics can be intentional; these counts are review leads, not automatic defects.",
      "Tests, demos in preview/dev directories, generated files, vendored implementations and shared sign-in internals are excluded. Link's inspected TabPill, TabPillRow and Tooltip/Tooltop adapters and DS1's verified React Input adapter count at imported JSX uses, without counting their inner DS1 tags again.",
      "Other React abstractions, dynamic tag names, CSS-only controls, spans and inline SVGs are not inferred. Native apps are outside this scan. A zero means no recognized source site, not that a capability is absent.",
    ],
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = scanReport();
  const output = join(repository, ".reports/component-adoption.json");
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, JSON.stringify(report, null, 2) + "\n");
  for (const app of report.apps) console.log(`${app.name}: ${app.status}, ${app.files} files, ${Object.values(app.cells).reduce((sum, c) => sum + c.shared + c.styled + c.local + c.unverified, 0)} source sites`);
  console.log(`Saved ${output}`);
  if (report.apps.some(app => app.status !== "scanned")) process.exitCode = 1;
}
