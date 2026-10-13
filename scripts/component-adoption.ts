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
export const excluded = /^(?:(?:client|src|web)\/)?(?:design|ds1)\/|^src\/pages\/design\/|(?:^|\/)(?:vendor|signIn|_generated|generated|node_modules|dist|__surface|surface|design-lab|designLab|dev|experiments|previews|__tests__|tests|test|fixtures|stories)(?:\/|$)|(?:\.test|\.spec|\.stories|\.d)\.[^.]+$/i;

export interface AppSpec { id: string; name: string; directory: string; roots: string[]; manifest?: string }
export const APPS: AppSpec[] = [
  { id: "ezo", name: "Ezo", directory: "Ezo", roots: ["client"], manifest: "client/design/components-manifest.json" },
  { id: "music", name: "Music", directory: "Music", roots: ["web"] },
  { id: "link", name: "Link", directory: "Link", roots: ["client", "src"], manifest: "shared/ds1/components-manifest.json" },
  { id: "consistency", name: "Consistency", directory: "Consistency", roots: ["src"], manifest: "src/design/components-manifest.json" },
];
const known = new Set(COMPONENT_COLUMNS.map(c => c.id));
const native: Record<string, string> = { button: "button", input: "input", select: "select", textarea: "textarea", p: "text", h1: "text", h2: "text", h3: "text", h4: "text", h5: "text", h6: "text", ul: "list", ol: "list", table: "table", form: "form", dialog: "dialog" };
type TagSite = { tag: string; line: number; nativeStyle?: string; dialogRole?: boolean; controlKind?: "checkbox" | "switch" | "color" };
function nativeStyle(tag: string, className: string): string | undefined {
  const classes = className.split(/\s+/);
  const supported = tag === "button" ? ["ds-button"] : ["input", "select", "textarea"].includes(tag) ? ["ds-input", "ds-select", "ds-checkbox"] : [];
  return supported.find(name => classes.includes(name));
}

/** Parse syntax, not comments or import/selector strings. Template chunks preserve line offsets. */
export function sourceSites(file: string, source: string): TagSite[] {
  const found: TagSite[] = [];
  const line = (offset: number) => source.slice(0, offset).split("\n").length;
  const markup = (text: string, offset: number, stack: string[] = []) => {
    const clean = text.replace(/<!--[\s\S]*?-->/g, match => match.replace(/[^\n]/g, " "));
    for (const match of clean.matchAll(/<(\/?)([A-Za-z][\w.-]*)(?=[\s/>])/g)) {
      const tag = match[2]!;
      if (match[1]) {
        const at = stack.lastIndexOf(tag);
        if (at >= 0) stack.length = at;
        continue;
      }
      const frame = (tag === "dialog" && stack.at(-1) === "ds-dialog") || (tag === "input" && ["ds-checkbox", "ds-color", "ds-token-field"].includes(stack.at(-1) ?? "")) || (tag === "button" && stack.at(-1) === "ds-switch") || (tag === "select" && stack.at(-1) === "ds-select") || (tag === "textarea" && stack.at(-1) === "ds-composer");
      const attributes = clean.slice(match.index! + match[0].length).split(">")[0]!;
      if (!/\/\s*$/.test(attributes) && !/^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/.test(tag)) stack.push(tag);
      if (frame) continue;
      const className = /\bclass\s*=\s*["']([^"']*)["']/.exec(attributes)?.[1] ?? "";
      const dialogRole = /\brole\s*=\s*["'](?:alertdialog|dialog)["']/.test(attributes);
      const controlKind = /\brole\s*=\s*["']switch["']/.test(attributes) ? "switch" : tag === "input" && /\btype\s*=\s*["']checkbox["']/.test(attributes) ? "checkbox" : tag === "input" && /\btype\s*=\s*["']color["']/.test(attributes) ? "color" : undefined;
      found.push({ tag, line: line(offset + match.index!), nativeStyle: nativeStyle(tag, className), ...(dialogRole ? { dialogRole } : {}), ...(controlKind ? { controlKind } : {}) });
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
  // A direct, const DOM append is evidence that the native control is the
  // shared host's required frame. Do not infer dynamic factories or aliases.
  const frames = new Set<ts.Node>();
  const findFrames = (scope: ts.Node) => {
    if (ts.isSourceFile(scope) || ts.isBlock(scope)) {
      const creations = new Map<string, { tag: string; call: ts.CallExpression }>();
      for (const statement of scope.statements) {
        if (ts.isVariableStatement(statement) && (statement.declarationList.flags & ts.NodeFlags.Const)) {
          for (const declaration of statement.declarationList.declarations) {
            const call = declaration.initializer;
            if (!ts.isIdentifier(declaration.name) || !call || !ts.isCallExpression(call) || !ts.isPropertyAccessExpression(call.expression)) continue;
            if (call.expression.expression.getText(ast) !== "document" || call.expression.name.text !== "createElement") continue;
            const tag = call.arguments[0];
            if (tag && ts.isStringLiteral(tag)) creations.set(declaration.name.text, { tag: tag.text, call });
          }
        }
        if (!ts.isExpressionStatement(statement) || !ts.isCallExpression(statement.expression)) continue;
        const call = statement.expression;
        if (!ts.isPropertyAccessExpression(call.expression) || !ts.isIdentifier(call.expression.expression) || !["append", "appendChild"].includes(call.expression.name.text)) continue;
        const host = creations.get(call.expression.expression.text)?.tag;
        const frameTags: Record<string, string> = { "ds-dialog": "dialog", "ds-select": "select", "ds-token-field": "input", "ds-composer": "textarea", "ds-checkbox": "input", "ds-color": "input", "ds-switch": "button" };
        const frameTag = host && frameTags[host];
        if (!frameTag) continue;
        for (const arg of call.arguments) {
          const child = ts.isIdentifier(arg) ? creations.get(arg.text) : undefined;
          if (child?.tag === frameTag) frames.add(child.call);
        }
      }
    }
    ts.forEachChild(scope, findFrames);
  };
  findFrames(ast);
  const templateStacks = new Map<ts.Node, string[]>();
  const walk = (node: ts.Node) => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(ast);
      const attribute = node.attributes.properties.find(p => ts.isJsxAttribute(p) && ["class", "className"].includes(p.name.getText(ast)));
      const initializer = attribute && ts.isJsxAttribute(attribute) ? attribute.initializer : undefined;
      const className = initializer && ts.isStringLiteral(initializer) ? initializer.text : "";
      const role = node.attributes.properties.find(p => ts.isJsxAttribute(p) && p.name.getText(ast) === "role");
      const roleValue = role && ts.isJsxAttribute(role) ? role.initializer : undefined;
      const dialogRole = roleValue && ts.isStringLiteral(roleValue) && ["dialog", "alertdialog"].includes(roleValue.text);
      const parentElement = ts.isJsxOpeningElement(node) ? node.parent.parent : node.parent;
      const frameHosts: Record<string, string> = { dialog: "ds-dialog", input: "ds-checkbox", button: "ds-switch", select: "ds-select", textarea: "ds-composer" };
      const sharedFrame = parentElement && ts.isJsxElement(parentElement) && (parentElement.openingElement.tagName.getText(ast) === frameHosts[tag] || (tag === "input" && ["ds-color", "ds-token-field"].includes(parentElement.openingElement.tagName.getText(ast))));
      const type = node.attributes.properties.find(p => ts.isJsxAttribute(p) && p.name.getText(ast) === "type");
      const typeValue = type && ts.isJsxAttribute(type) ? type.initializer : undefined;
      const controlKind = roleValue && ts.isStringLiteral(roleValue) && roleValue.text === "switch" ? "switch" : tag === "input" && typeValue && ts.isStringLiteral(typeValue) && typeValue.text === "checkbox" ? "checkbox" : tag === "input" && typeValue && ts.isStringLiteral(typeValue) && typeValue.text === "color" ? "color" : undefined;
      if (!sharedFrame) found.push({ tag, line: line(node.getStart(ast)), nativeStyle: nativeStyle(tag, className), ...(dialogRole ? { dialogRole: true } : {}), ...(controlKind ? { controlKind } : {}) });
    }
    if (ts.isCallExpression(node) && ((ts.isPropertyAccessExpression(node.expression) && ["createElement", "createElementNS"].includes(node.expression.name.text)) || (ts.isIdentifier(node.expression) && reactFactories.has(node.expression.text)))) {
      const arg = node.arguments[ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "createElementNS" ? 1 : 0];
      if (arg && ts.isStringLiteralLike(arg) && !frames.has(node)) found.push({ tag: arg.text, line: line(arg.getStart(ast)) });
    }
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "setAttribute") {
      const [name, value] = node.arguments;
      if (name && value && ts.isStringLiteral(name) && name.text === "role" && ts.isStringLiteral(value) && ["dialog", "alertdialog"].includes(value.text)) {
        found.push({ tag: "role-dialog", line: line(node.getStart(ast)), dialogRole: true });
      }
    }
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) {
      // JSX attribute strings are copy, not elements. Other markup strings feed innerHTML/Lit.
      const template = ts.isTemplateHead(node) ? node.parent : (ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) ? node.parent.parent : node;
      let stack = templateStacks.get(template);
      if (!stack) templateStacks.set(template, stack = []);
      if (!ts.isJsxAttribute(node.parent)) markup(node.getText(ast).slice(1, ts.isTemplateHead(node) || ts.isTemplateMiddle(node) ? -2 : -1), node.getStart(ast) + 1, stack);
    }
    ts.forEachChild(node, walk);
  };
  walk(ast);
  return found;
}

function emptyCell(): ComponentCell { return { shared: 0, styled: 0, local: 0, unverified: 0, sites: [], snapshot: "none", current: null, issues: [] }; }
interface Manifest { commit: string; components: string[]; files: Record<string, string> }

export function checkSnapshots(root: string, manifestPath: string | undefined, dsRoot: string): { commit: string | null; cells: Record<string, ComponentCell>; controls: ComponentCell; reactInput: ComponentCell; reactButton: ComponentCell; reactDialog: ComponentCell; reactChoice: ComponentCell; reactSplit: ComponentCell; reactComposer: ComponentCell; reactMenu: ComponentCell; reactAccordion: ComponentCell; reactAvatar: ComponentCell; reactAvatarGroup: ComponentCell; reactToken: ComponentCell } {
  const cells = Object.fromEntries(COMPONENT_COLUMNS.map(c => [c.id, emptyCell()]));
  const controls = emptyCell();
  const reactInput = emptyCell();
  const reactButton = emptyCell();
  const reactDialog = emptyCell();
  const reactChoice = emptyCell();
  const reactSplit = emptyCell();
  const reactComposer = emptyCell();
  const reactMenu = emptyCell();
  const reactAccordion = emptyCell();
  const reactAvatar = emptyCell();
  const reactAvatarGroup = emptyCell();
  const reactToken = emptyCell();
  if (!manifestPath || !existsSync(join(root, manifestPath))) return { commit: null, cells, controls, reactInput, reactButton, reactDialog, reactChoice, reactSplit, reactComposer, reactMenu, reactAccordion, reactAvatar, reactAvatarGroup, reactToken };
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
  for (const component of [...manifest.components, "@controls", ...(manifest.files["react/token-field.ts"] ? ["@react-token-field"] : []), ...(manifest.files["react/avatar-group.ts"] ? ["@react-avatar-group"] : []), ...(manifest.files["react/avatar.ts"] ? ["@react-avatar"] : []), ...(manifest.files["react/accordion.ts"] ? ["@react-accordion"] : []), ...(manifest.files["react/menu.ts"] ? ["@react-menu"] : []), ...(manifest.files['react/composer.ts'] ? ['@react-composer'] : []), ...(manifest.files['react/split.ts'] ? ['@react-split'] : []), ...(manifest.files['react/input.ts'] ? ['@react-input'] : []), ...(manifest.files['react/button.ts'] ? ['@react-button'] : []), ...(manifest.files['react/dialog.ts'] ? ['@react-dialog'] : []), ...(manifest.files['react/choice.ts'] ? ['@react-choice'] : [])]) {
    const cell = component === "@react-token-field" ? reactToken : component === "@react-avatar-group" ? reactAvatarGroup : component === "@react-avatar" ? reactAvatar : component === "@react-accordion" ? reactAccordion : component === "@controls" ? controls : component === "@react-menu" ? reactMenu : component === "@react-composer" ? reactComposer : component === '@react-input' ? reactInput : component === '@react-button' ? reactButton : component === '@react-dialog' ? reactDialog : component === '@react-choice' ? reactChoice : component === '@react-split' ? reactSplit : cells[component];
    if (!cell) continue;
    const entry = component === "@react-token-field" ? "react/token-field.ts" : component === "@react-avatar-group" ? "react/avatar-group.ts" : component === "@react-avatar" ? "react/avatar.ts" : component === "@react-accordion" ? "react/accordion.ts" : component === "@controls" ? "1-root/controls.css" : component === "@react-menu" ? "react/menu.ts" : component === "@react-composer" ? "react/composer.ts" : component === '@react-input' ? 'react/input.ts' : component === '@react-button' ? 'react/button.ts' : component === '@react-dialog' ? 'react/dialog.ts' : component === '@react-choice' ? 'react/choice.ts' : component === '@react-split' ? 'react/split.ts' : Object.keys(manifest.files).find(f => f.endsWith(`/ds-${component}.ts`));
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
  return { commit: manifest.commit, cells, controls, reactInput, reactButton, reactDialog, reactChoice, reactSplit, reactComposer, reactMenu, reactAccordion, reactAvatar, reactAvatarGroup, reactToken };
}

/** Follow direct imports and pure registration/re-export entries to the snapshot.
 * Matching names alone never establish adoption. The adapter's full dependency
 * graph is checked separately from direct Lit usage.
 */
function importedSharedAdapters(root: string, file: string, source: string, manifestPath?: string): Map<string, string> {
  const found = new Map<string, string>();
  if (!manifestPath) return found;
  const adapterModules: Record<string, Record<string, string>> = {
    [resolve(root, dirname(manifestPath), "react/token-field.ts")]: { TokenField: "token-field", Token: "token" },
    [resolve(root, dirname(manifestPath), "react/avatar-group.ts")]: { AvatarGroup: "avatar-group" },
    [resolve(root, dirname(manifestPath), "react/avatar.ts")]: { Avatar: "avatar", Logo: "avatar" },
    [resolve(root, dirname(manifestPath), "react/accordion.ts")]: { Accordion: "accordion" },
    [resolve(root, dirname(manifestPath), "react/menu.ts")]: { Menu: "menu" },
    [resolve(root, dirname(manifestPath), 'react/composer.ts')]: { Composer: 'composer' },
    [resolve(root, dirname(manifestPath), 'react/split.ts')]: { Split: 'split' },
    [resolve(root, dirname(manifestPath), 'react/input.ts')]: { Input: 'input', Textarea: 'textarea' },
    [resolve(root, dirname(manifestPath), 'react/button.ts')]: { Button: 'button', ButtonLink: 'button' },
    [resolve(root, dirname(manifestPath), 'react/dialog.ts')]: { DialogContent: 'dialog' },
    [resolve(root, dirname(manifestPath), 'react/choice.ts')]: { Checkbox: 'checkbox', Switch: 'switch', Select: 'select', ColorInput: 'color' },
  };
  const resolveModule = (from: string, name: string) => {
    if (!name.startsWith('.') && !name.startsWith('@/')) return undefined;
    const base = name.startsWith('@/') ? resolve(root, 'src', name.slice(2)) : resolve(dirname(from), name);
    if (!base.startsWith(resolve(root) + '/')) return undefined;
    return [base, `${base}.ts`, `${base}.tsx`, join(base, 'index.ts')].find(path => existsSync(path) && statSync(path).isFile());
  };
  const forwards = (path: string | undefined, name: string, depth = 0): string | undefined => {
    if (!path || depth > 3) return undefined;
    if (adapterModules[path]) return adapterModules[path][name];
    const module = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true);
    if (module.statements.some(node => !ts.isImportDeclaration(node) && !ts.isExportDeclaration(node) && !ts.isEmptyStatement(node))) return undefined;
    for (const node of module.statements) {
      if (!ts.isExportDeclaration(node) || node.isTypeOnly || !node.moduleSpecifier || !ts.isStringLiteral(node.moduleSpecifier) || !node.exportClause || !ts.isNamedExports(node.exportClause)) continue;
      const exportedModule = resolveModule(path, node.moduleSpecifier.text);
      for (const binding of node.exportClause.elements) {
        if (binding.isTypeOnly || binding.name.text !== name) continue;
        const component = forwards(exportedModule, (binding.propertyName ?? binding.name).text, depth + 1);
        if (component) return component;
      }
    }
    return undefined;
  };
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  for (const node of ast.statements) {
    if (!ts.isImportDeclaration(node) || !ts.isStringLiteral(node.moduleSpecifier) || node.importClause?.isTypeOnly) continue;
    const bindings = node.importClause?.namedBindings;
    if (!bindings || !ts.isNamedImports(bindings)) continue;
    for (const binding of bindings.elements) {
      if (binding.isTypeOnly) continue;
      const component = forwards(resolveModule(resolve(root, file), node.moduleSpecifier.text), (binding.propertyName ?? binding.name).text);
      if (component) found.set(binding.name.text, component);
    }
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
      const sharedAdapters = importedSharedAdapters(root, file, source, spec.manifest);
      const sites = sourceSites(file, source);
      const adapterTags = spec.id === "link" && linkAdapters[file]
        ? new Set(Object.values(linkAdapters[file]!).map(id => `ds-${id}`).filter(tag => sites.filter(s => s.tag === tag).length === 1))
        : new Set<string>();
      for (const site of sites) {
        if (adapterTags.has(site.tag)) continue;
        const custom = /^(ds|ezo|c9y)-(.+)$/.exec(site.tag);
        const component = sharedAdapters.has(site.tag) ? sharedAdapters.get(site.tag)! : aliases[site.tag] ?? (custom && known.has(custom[2]!) ? custom[2]! : site.dialogRole ? "dialog" : site.controlKind ?? native[site.tag]);
        if (!component) {
          if (site.tag.includes("-")) app.otherCustomElements[site.tag] = (app.otherCustomElements[site.tag] ?? 0) + 1;
          continue;
        }
        const cell = app.cells[component]!;
        const ds = sharedAdapters.has(site.tag) || Boolean(aliases[site.tag]) || custom?.[1] === "ds";
        const evidence = sharedAdapters.has(site.tag) ? (["token", "token-field"].includes(component) ? snapshots.reactToken : component === "avatar-group" ? snapshots.reactAvatarGroup : component === "avatar" ? snapshots.reactAvatar : component === "accordion" ? snapshots.reactAccordion : component === "menu" ? snapshots.reactMenu : component === "composer" ? snapshots.reactComposer : component === "split" ? snapshots.reactSplit : component === "button" ? snapshots.reactButton : component === "dialog" ? snapshots.reactDialog : ["checkbox", "switch", "select", "color"].includes(component) ? snapshots.reactChoice : snapshots.reactInput) : cell;
        if (sharedAdapters.has(site.tag)) {
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
      "Local means recognized ezo-/c9y- components or native button, input/select/textarea, p/headings, ul/ol, table, form and dialog, plus literal dialog/alertdialog roles, including explicit setAttribute sites. Native semantics can be intentional; these counts are review leads, not automatic defects.",
      "Tests, demos in preview/dev directories, generated files, vendored implementations and shared sign-in internals are excluded. Link's inspected TabPill, TabPillRow and Tooltip/Tooltop adapters and DS1's verified React Input, Textarea, Composer, Menu, Checkbox, Switch, Select, ColorInput, Button, ButtonLink, Token, TokenField, Avatar, Logo, AvatarGroup, Accordion, Split and DialogContent adapters count at imported JSX uses, without counting their inner DS1 tags again.",
      "Native dialog/input/button/select/textarea children directly inside ds-dialog/ds-checkbox/ds-color/ds-switch/ds-select/ds-composer count as their shared frames, not as extra local controls. Literal color and checkbox types and switch roles have their own columns; dynamic types stay in Input. Direct const document.createElement plus append composition is also recognized. Other React abstractions, dynamic tag names, CSS-only controls, spans and inline SVGs are not inferred. Native apps are outside this scan. A zero means no recognized source site, not that a capability is absent.",
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
