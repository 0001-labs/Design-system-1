import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, mkdirSync, writeFileSync, statSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { readIconMap, scanIcons } from "./icon-adoption";
import { COMPONENT_COLUMNS, IMPLEMENTATION_COLUMNS, catalogueApp, type AdoptionApp, type AdoptionReport, type ComponentCell, type UsageSite } from "../shared/component-adoption";

const repository = fileURLToPath(new URL("../", import.meta.url));
const hash = (body: string | Buffer) => createHash("sha256").update(body).digest("hex");
const git = (root: string, ...args: string[]) => execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 20_000_000 }).trim();
export const excluded = /^(?:(?:client|src|web)\/)?(?:design|ds1)\/|^src\/pages\/design\/|(?:^|\/)(?:vendor|signIn|_generated|generated|node_modules|dist|__surface|surface|design-lab|designLab|dev|experiments|previews|__tests__|tests|test|fixtures|stories)(?:\/|$)|(?:\.test|\.spec|\.stories|\.d)\.[^.]+$/i;

/** `source: "direct"` is Design system 1 itself: its app and site import DS1/ from the same commit, so there is no copy to verify. */
export interface AppSpec { id: string; name: string; directory: string; roots: string[]; manifest?: string; source?: "direct"; group?: "Products" | "Clients"; excludes?: string[]; migration?: "deferred"; migrationReason?: string }
/** The studio owns product names and scan scope; the reusable scanner owns recognition. */
export function loadAppSpecs(studio: string): AppSpec[] {
  const config = JSON.parse(readFileSync(join(studio, "0001/server/component-adoption.config.json"), "utf8")) as { apps: AppSpec[] };
  if (!Array.isArray(config.apps) || !config.apps.length) throw new Error("The studio adoption configuration has no apps.");
  const ids = new Set<string>();
  for (const app of config.apps) {
    if (!app.id || ids.has(app.id) || !app.name || !app.directory || !app.roots?.length || [app.directory, ...app.roots].some(path => path.startsWith("/") || path.split("/").includes(".."))) throw new Error("Invalid or duplicate adoption app scope.");
    ids.add(app.id);
  }
  return config.apps;
}
const known = new Set(IMPLEMENTATION_COLUMNS.map(c => c.id));
/** Blocks a native class draws on any element, each with the sheet that draws it. Text marked as one of their parts is the block's own. */
const blockClasses: Record<string, { component: string; sheet: string }> = { "ds-empty": { component: "empty", sheet: "1-root/empty.css" }, "ds-notice": { component: "notice", sheet: "1-root/notice.css" }, "ds-table": { component: "table", sheet: "1-root/table.css" } };
const blockPart = /^ds-(?:empty|notice)__/;
/** Files verified on their own: the block sheets and the React adapters for empty states and notices. */
const entryFiles = ["1-root/empty.css", "1-root/notice.css", "1-root/table.css", "react/empty.ts", "react/notice.ts"];
const native: Record<string, string> = { button: "button", input: "input", select: "select", textarea: "textarea", p: "text", h1: "text", h2: "text", h3: "text", h4: "text", h5: "text", h6: "text", ul: "list", ol: "list", table: "table", form: "form", dialog: "dialog" };
/** `prose` marks native text, a list or a table inside an element marked data-ds-prose, which DS1's prose sheet draws. */
type TagSite = { tag: string; line: number; nativeStyle?: string; prose?: boolean; dialogRole?: boolean; controlKind?: "checkbox" | "radio" | "switch" | "color" | "file-picker" };
type OpenElement = { tag: string; prose?: boolean; className?: string; site?: TagSite };
const textTags = new Set(["p", "h1", "h2", "h3", "h4", "h5", "h6"]);
const proseTags = new Set([...textTags, "ul", "ol", "table"]);
/**
 * The pieces controls.css draws on any element, and the column each counts in:
 * a field's label row counts with forms, a drop zone as a file picker.
 */
export const nativePieces: Record<string, string> = { "ds-field": "form", "ds-avatar": "avatar", "ds-badge": "badge", "ds-icon": "icon", "ds-drop": "file-picker" };
/** The column a native class moves its element into: the pieces, and a toggle button. */
const nativeColumns: Record<string, string> = { ...nativePieces, "ds-toggle": "toggle" };
/** A field's label, hint and error, drawn by controls.css on native text. */
const fieldParts = ["ds-field__label", "ds-field__hint", "ds-field__error"];
/**
 * Classes newer than the first copies of controls.css: a site counts as DS1
 * styles only when the copy it is verified through defines the class.
 */
export const definedNativeClasses = new Set([...Object.keys(nativeColumns), ...fieldParts]);
function nativeStyle(tag: string, className: string): string | undefined {
  const classes = className.split(/\s+/);
  const block = classes.find(name => Object.hasOwn(blockClasses, name));
  if (block) return block;
  if (textTags.has(tag) && classes.some(name => blockPart.test(name))) return "block-part";
  // Native text with a literal .ds-text class or one of its sizes and tones, or a field's part.
  if (textTags.has(tag)) return classes.some(name => name === "ds-text" || name.startsWith("ds-text--")) ? "ds-text" : fieldParts.find(name => classes.includes(name));
  const supported = tag === "button" ? ["ds-toggle", "ds-button", "ds-switch"] : ["input", "select", "textarea"].includes(tag) ? ["ds-input", "ds-textarea", "ds-select", "ds-checkbox", "ds-radio"] : tag === "dialog" ? ["ds-dialog"] : [];
  return supported.find(name => classes.includes(name)) ?? (native[tag] ? undefined : Object.keys(nativePieces).find(name => classes.includes(name)));
}
/** A file input directly inside a label drawn as a drop zone or a button is that file picker's frame. */
const fileFrameClass = (className: string | undefined) => (className ?? "").split(/\s+/).find(name => name === "ds-drop" || name === "ds-button");
/** The label counts as the file picker; a label.ds-button is one only once its file input is seen. */
function claimFileFrame(label: TagSite | undefined, frameClass: string) {
  if (!label || frameClass !== "ds-button") return;
  label.nativeStyle = "ds-button";
  label.controlKind = "file-picker";
}
function jsxClassName(initializer: ts.JsxAttributeValue | undefined): string {
  if (initializer && ts.isStringLiteral(initializer)) return initializer.text;
  if (!initializer || !ts.isJsxExpression(initializer) || !initializer.expression) return "";
  const expression = initializer.expression;
  if (ts.isStringLiteralLike(expression)) return expression.text;
  if (ts.isTemplateExpression(expression)) return [expression.head.text, ...expression.templateSpans.map(span => span.literal.text)].join(" ");
  return "";
}

/** Parse syntax, not comments or import/selector strings. Template chunks preserve line offsets. */
export function sourceSites(file: string, source: string): TagSite[] {
  const found: TagSite[] = [];
  const line = (offset: number) => source.slice(0, offset).split("\n").length;
  const markup = (text: string, offset: number, stack: OpenElement[] = []) => {
    const clean = text.replace(/<!--[\s\S]*?-->/g, match => match.replace(/[^\n]/g, " "));
    for (const match of clean.matchAll(/<(\/?)([A-Za-z][\w.-]*)(?=[\s/>])/g)) {
      const tag = match[2]!;
      if (match[1]) {
        let at = stack.length - 1;
        while (at >= 0 && stack[at]!.tag !== tag) at--;
        if (at >= 0) stack.length = at;
        continue;
      }
      const parentElement = stack.at(-1);
      const parent = parentElement?.tag ?? "";
      const attributes = clean.slice(match.index! + match[0].length).split(">")[0]!;
      const fileFrame = tag === "input" && parent === "label" && /\btype\s*=\s*["']file["']/.test(attributes) ? fileFrameClass(parentElement!.className) : undefined;
      const frame = (tag === "dialog" && parent === "ds-dialog") || (tag === "input" && ["ds-checkbox", "ds-radio", "ds-color", "ds-token-field", "ds-file-picker"].includes(parent)) || (tag === "button" && ["ds-switch", "ds-button"].includes(parent)) || (tag === "select" && parent === "ds-select") || (tag === "textarea" && parent === "ds-composer") || Boolean(fileFrame);
      const inProse = proseTags.has(tag) && [...stack].reverse().find(open => open.prose !== undefined)?.prose === true;
      const prose = /(?:^|\s)data-ds-not-prose(?=[\s=/]|$)/.test(attributes) ? false : /(?:^|\s)data-ds-prose(?=[\s=/]|$)/.test(attributes) ? true : undefined;
      const className = /\bclass\s*=\s*["']([^"']*)["']/.exec(attributes)?.[1] ?? /\bclass\s*=\s*["']([^"']*)$/.exec(attributes)?.[1] ?? "";
      const open: OpenElement = { tag, prose, className };
      if (!/\/\s*$/.test(attributes) && !/^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/.test(tag)) stack.push(open);
      if (fileFrame) claimFileFrame(parentElement!.site, fileFrame);
      if (frame) continue;
      const dialogRole = /\brole\s*=\s*["'](?:alertdialog|dialog)["']/.test(attributes);
      const controlKind = /\brole\s*=\s*["']switch["']/.test(attributes) ? "switch" : tag === "input" && /\btype\s*=\s*["']checkbox["']/.test(attributes) ? "checkbox" : tag === "input" && /\btype\s*=\s*["']radio["']/.test(attributes) ? "radio" : tag === "input" && /\btype\s*=\s*["']color["']/.test(attributes) ? "color" : tag === "input" && /\btype\s*=\s*["']file["']/.test(attributes) ? "file-picker" : undefined;
      const site: TagSite = { tag, line: line(offset + match.index!), nativeStyle: nativeStyle(tag, className), ...(inProse ? { prose: true } : {}), ...(dialogRole ? { dialogRole } : {}), ...(controlKind ? { controlKind } : {}) };
      open.site = site;
      found.push(site);
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
  const domFactories = new Set<string>();
  for (const statement of ast.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
    const module = statement.moduleSpecifier.text;
    if (module !== "react" && !/(?:^|\/)dom(?:\.[cm]?[jt]s)?$/.test(module)) continue;
    const bindings = statement.importClause?.namedBindings;
    if (bindings && ts.isNamedImports(bindings)) for (const binding of bindings.elements) {
      if (module === "react" && (binding.propertyName ?? binding.name).text === "createElement") reactFactories.add(binding.name.text);
      if (module !== "react" && (binding.propertyName ?? binding.name).text === "h") domFactories.add(binding.name.text);
    }
  }
  // A direct, const DOM append is evidence that the native control is the
  // shared host's required frame. Do not infer dynamic factories or aliases.
  const frames = new Set<ts.Node>();
  const styledButtons = new Set<ts.CallExpression>();
  const findStyledButtons = (scope: ts.Node) => {
    if (ts.isSourceFile(scope) || ts.isBlock(scope)) {
      const creations = new Map<string, ts.CallExpression>();
      const styled = new Set<string>();
      const inspect = (node: ts.Node) => {
        if (node !== scope && (ts.isBlock(node) || ts.isFunctionLike(node))) return;
        if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer && ts.isCallExpression(node.initializer) && ts.isPropertyAccessExpression(node.initializer.expression) && node.initializer.expression.expression.getText(ast) === "document" && node.initializer.expression.name.text === "createElement" && node.initializer.arguments[0] && ts.isStringLiteral(node.initializer.arguments[0]) && node.initializer.arguments[0].text === "button") {
          creations.set(node.name.text, node.initializer);
        }
        if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken && ts.isCallExpression(node.right) && ts.isPropertyAccessExpression(node.right.expression) && node.right.expression.expression.getText(ast) === "document" && node.right.expression.name.text === "createElement" && node.right.arguments[0] && ts.isStringLiteral(node.right.arguments[0]) && node.right.arguments[0].text === "button") {
          creations.set(node.left.getText(ast), node.right);
        }
        if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "add" && ts.isPropertyAccessExpression(node.expression.expression) && node.expression.expression.name.text === "classList" && (ts.isIdentifier(node.expression.expression.expression) || ts.isPropertyAccessExpression(node.expression.expression.expression)) && node.arguments.some(arg => ts.isStringLiteral(arg) && arg.text === "ds-button")) {
          styled.add(node.expression.expression.expression.getText(ast));
        }
        ts.forEachChild(node, inspect);
      };
      for (const statement of scope.statements) inspect(statement);
      for (const [target, call] of creations) if (styled.has(target)) styledButtons.add(call);
    }
    ts.forEachChild(scope, findStyledButtons);
  };
  findStyledButtons(ast);
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
        const frameTags: Record<string, string> = { "ds-dialog": "dialog", "ds-select": "select", "ds-token-field": "input", "ds-file-picker": "input", "ds-composer": "textarea", "ds-checkbox": "input", "ds-radio": "input", "ds-color": "input", "ds-switch": "button", "ds-button": "button" };
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
  const templateStacks = new Map<ts.Node, OpenElement[]>();
  /** Sites and classes of JSX elements and h/createElement calls, for a file input to claim its label. */
  const elementSites = new Map<ts.Node, OpenElement>();
  /** The nearest JSX ancestor marked data-ds-prose or data-ds-not-prose decides. */
  const jsxInProse = (node: ts.Node) => {
    for (let parent = node.parent; parent; parent = parent.parent) {
      if (!ts.isJsxElement(parent) || parent.openingElement === node) continue;
      const names = parent.openingElement.attributes.properties.filter(ts.isJsxAttribute).map(p => p.name.getText(ast));
      if (names.includes("data-ds-not-prose")) return false;
      if (names.includes("data-ds-prose")) return true;
    }
    return false;
  };
  const walk = (node: ts.Node) => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(ast);
      const attribute = node.attributes.properties.find(p => ts.isJsxAttribute(p) && ["class", "className"].includes(p.name.getText(ast)));
      const initializer = attribute && ts.isJsxAttribute(attribute) ? attribute.initializer : undefined;
      const className = jsxClassName(initializer);
      const role = node.attributes.properties.find(p => ts.isJsxAttribute(p) && p.name.getText(ast) === "role");
      const roleValue = role && ts.isJsxAttribute(role) ? role.initializer : undefined;
      const dialogRole = roleValue && ts.isStringLiteral(roleValue) && ["dialog", "alertdialog"].includes(roleValue.text);
      const parentElement = ts.isJsxOpeningElement(node) ? node.parent.parent : node.parent;
      const frameHosts: Record<string, string> = { dialog: "ds-dialog", input: "ds-checkbox", button: "ds-switch", select: "ds-select", textarea: "ds-composer" };
      const sharedFrame = parentElement && ts.isJsxElement(parentElement) && (parentElement.openingElement.tagName.getText(ast) === frameHosts[tag] || (tag === "input" && ["ds-radio", "ds-color", "ds-token-field", "ds-file-picker"].includes(parentElement.openingElement.tagName.getText(ast))));
      const type = node.attributes.properties.find(p => ts.isJsxAttribute(p) && p.name.getText(ast) === "type");
      const typeValue = type && ts.isJsxAttribute(type) ? type.initializer : undefined;
      const controlKind = roleValue && ts.isStringLiteral(roleValue) && roleValue.text === "switch" ? "switch" : tag === "input" && typeValue && ts.isStringLiteral(typeValue) && typeValue.text === "checkbox" ? "checkbox" : tag === "input" && typeValue && ts.isStringLiteral(typeValue) && typeValue.text === "radio" ? "radio" : tag === "input" && typeValue && ts.isStringLiteral(typeValue) && typeValue.text === "color" ? "color" : tag === "input" && typeValue && ts.isStringLiteral(typeValue) && typeValue.text === "file" ? "file-picker" : undefined;
      const prose = proseTags.has(tag) && jsxInProse(node);
      const label = controlKind === "file-picker" && parentElement && ts.isJsxElement(parentElement) && parentElement.openingElement.tagName.getText(ast) === "label" ? elementSites.get(parentElement.openingElement) : undefined;
      const fileFrame = label && fileFrameClass(label.className);
      if (fileFrame) claimFileFrame(label.site, fileFrame);
      else if (!sharedFrame) {
        const site: TagSite = { tag, line: line(node.getStart(ast)), nativeStyle: nativeStyle(tag, className), ...(prose ? { prose } : {}), ...(dialogRole ? { dialogRole: true } : {}), ...(controlKind ? { controlKind } : {}) };
        elementSites.set(node, { tag, className, site });
        found.push(site);
      }
    }
    if (ts.isCallExpression(node) && ((ts.isPropertyAccessExpression(node.expression) && ["createElement", "createElementNS"].includes(node.expression.name.text)) || (ts.isIdentifier(node.expression) && (reactFactories.has(node.expression.text) || domFactories.has(node.expression.text))))) {
      const arg = node.arguments[ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "createElementNS" ? 1 : 0];
      if (arg && ts.isStringLiteralLike(arg) && !frames.has(node)) {
        const props = node.arguments[1];
        const strings: Record<string, string> = {};
        if (props && ts.isObjectLiteralExpression(props)) for (const property of props.properties) {
          if (ts.isPropertyAssignment(property) && property.name && ts.isStringLiteralLike(property.initializer)) strings[property.name.getText(ast).replace(/["']/g, "")] = property.initializer.text;
        }
        const controlKind = strings.role === "switch" ? "switch" : arg.text === "input" && ["checkbox", "radio", "color", "file"].includes(strings.type ?? "") ? strings.type === "file" ? "file-picker" : strings.type as "checkbox" | "radio" | "color" : undefined;
        const className = strings.className ?? strings.class ?? "";
        const style = styledButtons.has(node) ? nativeStyle(arg.text, "ds-button") : nativeStyle(arg.text, className);
        // A file input passed straight to the call that makes its label.
        const label = controlKind === "file-picker" ? elementSites.get(node.parent) : undefined;
        const fileFrame = label?.tag === "label" ? fileFrameClass(label.className) : undefined;
        if (fileFrame) claimFileFrame(label!.site, fileFrame);
        else {
          const site: TagSite = { tag: arg.text, line: line(arg.getStart(ast)), ...(style ? { nativeStyle: style } : {}), ...(controlKind ? { controlKind } : {}) };
          elementSites.set(node, { tag: arg.text, className, site });
          found.push(site);
        }
      }
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

export function checkSnapshots(root: string, manifestPath: string | undefined, dsRoot: string): { commit: string | null; cells: Record<string, ComponentCell>; controls: ComponentCell; text: ComponentCell; prose: ComponentCell; reactInput: ComponentCell; reactButton: ComponentCell; reactDialog: ComponentCell; reactChoice: ComponentCell; reactSplit: ComponentCell; reactComposer: ComponentCell; reactMenu: ComponentCell; reactAccordion: ComponentCell; reactAvatar: ComponentCell; reactAvatarGroup: ComponentCell; reactToken: ComponentCell; reactFilePicker: ComponentCell; reactContextMenu: ComponentCell; reactBadge: ComponentCell; entries: Record<string, ComponentCell> } {
  const cells = Object.fromEntries(IMPLEMENTATION_COLUMNS.map(c => [c.id, emptyCell()]));
  const entries: Record<string, ComponentCell> = {};
  const controls = emptyCell();
  const text = emptyCell();
  const prose = emptyCell();
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
  const reactBadge = emptyCell();
  const reactFilePicker = emptyCell();
  const reactContextMenu = emptyCell();
  if (!manifestPath || !existsSync(join(root, manifestPath))) return { commit: null, cells, controls, text, prose, reactInput, reactButton, reactDialog, reactChoice, reactSplit, reactComposer, reactMenu, reactAccordion, reactAvatar, reactAvatarGroup, reactToken, reactFilePicker, reactContextMenu, reactBadge, entries };
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
  for (const component of [...manifest.components, ...entryFiles.filter(file => manifest.files[file]).map(file => `@file:${file}`), "@controls", ...(manifest.files["1-root/text.css"] ? ["@text"] : []), ...(manifest.files["1-root/prose.css"] ? ["@prose"] : []), ...(manifest.files["react/badge.ts"] ? ["@react-badge"] : []), ...(manifest.files["react/context-menu.ts"] ? ["@react-context-menu"] : []), ...(manifest.files["react/file-picker.ts"] ? ["@react-file-picker"] : []), ...(manifest.files["react/token-field.ts"] ? ["@react-token-field"] : []), ...(manifest.files["react/avatar-group.ts"] ? ["@react-avatar-group"] : []), ...(manifest.files["react/avatar.ts"] ? ["@react-avatar"] : []), ...(manifest.files["react/accordion.ts"] ? ["@react-accordion"] : []), ...(manifest.files["react/menu.ts"] ? ["@react-menu"] : []), ...(manifest.files['react/composer.ts'] ? ['@react-composer'] : []), ...(manifest.files['react/split.ts'] ? ['@react-split'] : []), ...(manifest.files['react/input.ts'] ? ['@react-input'] : []), ...(manifest.files['react/button.ts'] ? ['@react-button'] : []), ...(manifest.files['react/dialog.ts'] ? ['@react-dialog'] : []), ...(manifest.files['react/choice.ts'] ? ['@react-choice'] : [])]) {
    const file = component.startsWith("@file:") ? component.slice("@file:".length) : undefined;
    const cell = file ? (entries[file] = emptyCell()) : component === "@text" ? text : component === "@prose" ? prose : component === "@react-badge" ? reactBadge : component === "@react-context-menu" ? reactContextMenu : component === "@react-file-picker" ? reactFilePicker : component === "@react-token-field" ? reactToken : component === "@react-avatar-group" ? reactAvatarGroup : component === "@react-avatar" ? reactAvatar : component === "@react-accordion" ? reactAccordion : component === "@controls" ? controls : component === "@react-menu" ? reactMenu : component === "@react-composer" ? reactComposer : component === '@react-input' ? reactInput : component === '@react-button' ? reactButton : component === '@react-dialog' ? reactDialog : component === '@react-choice' ? reactChoice : component === '@react-split' ? reactSplit : cells[component];
    if (!cell) continue;
    const entry = file ?? (component === "@text" ? "1-root/text.css" : component === "@prose" ? "1-root/prose.css" : component === "@react-badge" ? "react/badge.ts" : component === "@react-context-menu" ? "react/context-menu.ts" : component === "@react-file-picker" ? "react/file-picker.ts" : component === "@react-token-field" ? "react/token-field.ts" : component === "@react-avatar-group" ? "react/avatar-group.ts" : component === "@react-avatar" ? "react/avatar.ts" : component === "@react-accordion" ? "react/accordion.ts" : component === "@controls" ? "1-root/controls.css" : component === "@react-menu" ? "react/menu.ts" : component === "@react-composer" ? "react/composer.ts" : component === '@react-input' ? 'react/input.ts' : component === '@react-button' ? 'react/button.ts' : component === '@react-dialog' ? 'react/dialog.ts' : component === '@react-choice' ? 'react/choice.ts' : component === '@react-split' ? 'react/split.ts' : Object.keys(manifest.files).find(f => f.endsWith(`/ds-${component}.ts`)));
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
  return { commit: manifest.commit, cells, controls, text, prose, reactInput, reactButton, reactDialog, reactChoice, reactSplit, reactComposer, reactMenu, reactAccordion, reactAvatar, reactAvatarGroup, reactToken, reactFilePicker, reactContextMenu, reactBadge, entries };
}

/**
 * A product that copies only the tokens and controls.css (Sync 1's `tokens` or
 * `root` export) has no component manifest. Its sync.lock.json records the DS1
 * revision and each copied file's hash: the copy is verified when the files on
 * disk match the lock and the lock matches DS1 at that revision.
 */
const componentStyles = ["component-tokens.css", "component-metrics.css", "component-appearance.css"];
const lockedControlStyles = ["controls.css", ...componentStyles];
/** The sheets that draw native text: text.css today, or one.css from before it, which held .ds-text itself. */
const lockedTextStyles: LockedStyles[] = [{ names: ["text.css", ...componentStyles] }, { names: ["one.css", ...componentStyles], defines: { "one.css": /\.ds-text\s*\{/ } }];
const lockedProseStyles = ["prose.css", ...componentStyles];
type LockedStyles = { names: string[]; defines?: Record<string, RegExp> };
const withoutComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");
/** A rule whose selector names the class, outside comments. */
export const classRule = (name: string) => new RegExp(`\\.${name}(?![\\w-])[^{};]*\\{`);
export function checkLockedStyles(root: string, dsRoot: string, { names, defines = {} }: LockedStyles): ComponentCell | undefined {
  const lockPath = join(root, "sync.lock.json");
  if (!existsSync(lockPath)) return undefined;
  const source = (JSON.parse(readFileSync(lockPath, "utf8")) as Record<string, { commit?: string; files?: Record<string, string> }>)["Design system 1"];
  if (!source?.files || !/^[a-f0-9]{40}$/.test(source.commit ?? "")) return undefined;
  const copies = new Map<string, Record<string, string>>();
  for (const path of Object.keys(source.files)) {
    const name = basename(path);
    if (names.includes(name)) copies.set(dirname(path), { ...copies.get(dirname(path)), [name]: path });
  }
  let best: ComponentCell | undefined;
  for (const found of copies.values()) {
    if (!names.every(name => found[name])) continue;
    const cell = emptyCell();
    let modified = false, unverifiable = false, current = true;
    for (const name of names) {
      const path = found[name]!, full = resolve(root, path);
      if (!full.startsWith(resolve(root) + "/") || !existsSync(full)) { unverifiable = true; cell.issues.push(`Missing copy: ${path}`); continue; }
      const body = readFileSync(full);
      if (hash(body) !== source.files[path]) { modified = true; cell.issues.push(`Locally modified: ${path}`); }
      let original: Buffer | null = null;
      try { original = execFileSync("git", ["show", `${source.commit}:DS1/1-root/${name}`], { cwd: dsRoot, stdio: ["ignore", "pipe", "ignore"] }); } catch { original = null; }
      if (!original || hash(original) !== source.files[path]) { unverifiable = true; cell.issues.push(`Source revision not verified: ${path}`); }
      if (defines[name] && !defines[name]!.test(withoutComments(body.toString("utf8")))) { unverifiable = true; cell.issues.push(`No DS1 rule for these sites in ${path}`); }
      const latest = join(dsRoot, "DS1/1-root", name);
      if (!existsSync(latest) || hash(readFileSync(latest)) !== hash(body)) current = false;
    }
    cell.snapshot = modified ? "modified" : unverifiable ? "unverified" : "verified";
    cell.current = current && !unverifiable;
    if (cell.snapshot === "verified") return cell;
    best ??= cell;
  }
  return best;
}
export const checkLockedControls = (root: string, dsRoot: string, defines?: string) => checkLockedStyles(root, dsRoot, { names: lockedControlStyles, ...(defines ? { defines: { "controls.css": classRule(defines) } } : {}) });
/** The first verified of the text sheets, else the closest attempt. */
export function checkLockedText(root: string, dsRoot: string): ComponentCell | undefined {
  let best: ComponentCell | undefined;
  for (const styles of lockedTextStyles) {
    const cell = checkLockedStyles(root, dsRoot, styles);
    if (cell?.snapshot === "verified") return cell;
    best ??= cell;
  }
  return best;
}
export const checkLockedProse = (root: string, dsRoot: string) => checkLockedStyles(root, dsRoot, { names: lockedProseStyles });

/**
 * Design system 1's own app and site import DS1/ directly, at the same commit:
 * a component is its source when DS1 defines it and DS1/ has no uncommitted
 * changes. There is no copy, so nothing is recorded as a consumer manifest.
 */
function directSnapshots(dsRoot: string): ReturnType<typeof checkSnapshots> {
  const dirty = Boolean(git(dsRoot, "status", "--porcelain", "--", "DS1"));
  const source = (): ComponentCell => dirty
    ? { ...emptyCell(), snapshot: "unverified", current: false, issues: ["Design system 1 source has uncommitted changes."] }
    : { ...emptyCell(), snapshot: "verified", current: true };
  const files = git(dsRoot, "ls-files", "--", "DS1").split("\n");
  const cells = Object.fromEntries(IMPLEMENTATION_COLUMNS.map(c => [c.id, files.some(f => f.endsWith(`/ds-${c.id}.ts`)) ? source() : emptyCell()]));
  return { commit: git(dsRoot, "rev-parse", "HEAD"), cells, controls: source(), text: source(), prose: source(), reactInput: source(), reactButton: source(), reactDialog: source(), reactChoice: source(), reactSplit: source(), reactComposer: source(), reactMenu: source(), reactAccordion: source(), reactAvatar: source(), reactAvatarGroup: source(), reactToken: source(), reactFilePicker: source(), reactContextMenu: source(), reactBadge: source(), entries: Object.fromEntries(entryFiles.map(file => [file, source()])) };
}
/** Where a direct-source app's shared adapters live, as if DS1/ were its snapshot. */
const directManifest = "DS1/components-manifest.json";

/** Follow direct imports and pure registration/re-export entries to the snapshot.
 * Matching names alone never establish adoption. The adapter's full dependency
 * graph is checked separately from direct Lit usage.
 */
type SharedAdapter = { component: string; contextMenu: boolean; file: string };
function importedSharedAdapters(root: string, file: string, source: string, manifestPath?: string): Map<string, SharedAdapter> {
  const found = new Map<string, SharedAdapter>();
  if (!manifestPath) return found;
  const adapterModules: Record<string, Record<string, string>> = {
    [resolve(root, dirname(manifestPath), "react/file-picker.ts")]: { FilePicker: "file-picker" },
    [resolve(root, dirname(manifestPath), "react/token-field.ts")]: { TokenField: "token-field", Token: "token" },
    [resolve(root, dirname(manifestPath), "react/avatar-group.ts")]: { AvatarGroup: "avatar-group" },
    [resolve(root, dirname(manifestPath), "react/badge.ts")]: { Badge: "badge" },
    [resolve(root, dirname(manifestPath), "react/empty.ts")]: { Empty: "empty" },
    [resolve(root, dirname(manifestPath), "react/notice.ts")]: { Notice: "notice" },
    [resolve(root, dirname(manifestPath), "react/avatar.ts")]: { Avatar: "avatar", Logo: "avatar" },
    [resolve(root, dirname(manifestPath), "react/accordion.ts")]: { Accordion: "accordion" },
    [resolve(root, dirname(manifestPath), "react/menu.ts")]: { Menu: "menu" },
    [resolve(root, dirname(manifestPath), "react/context-menu.ts")]: {
      ContextMenuContent: "menu", ContextMenuSubContent: "menu",
      ContextMenuItem: "button", ContextMenuSubTrigger: "button",
      ContextMenuCheckboxItem: "button", ContextMenuRadioItem: "button",
      ContextMenuFilePicker: "file-picker", ContextMenuLabel: "text",
    },
    [resolve(root, dirname(manifestPath), 'react/composer.ts')]: { Composer: 'composer' },
    [resolve(root, dirname(manifestPath), 'react/split.ts')]: { Split: 'split' },
    [resolve(root, dirname(manifestPath), 'react/input.ts')]: { Input: 'input', Textarea: 'textarea' },
    [resolve(root, dirname(manifestPath), 'react/button.ts')]: { Button: 'button', ButtonLink: 'button' },
    [resolve(root, dirname(manifestPath), 'react/dialog.ts')]: { DialogContent: 'dialog' },
    [resolve(root, dirname(manifestPath), 'react/choice.ts')]: { Checkbox: 'checkbox', Radio: 'radio', Switch: 'switch', Select: 'select', ColorInput: 'color' },
  };
  const resolveModule = (from: string, name: string) => {
    if (!name.startsWith('.') && !name.startsWith('@/')) return undefined;
    const base = name.startsWith('@/') ? resolve(root, 'src', name.slice(2)) : resolve(dirname(from), name);
    if (!base.startsWith(resolve(root) + '/')) return undefined;
    return [base, `${base}.ts`, `${base}.tsx`, join(base, 'index.ts')].find(path => existsSync(path) && statSync(path).isFile());
  };
  const forwards = (path: string | undefined, name: string, depth = 0): SharedAdapter | undefined => {
    if (!path || depth > 3) return undefined;
    if (adapterModules[path]) {
      const component = adapterModules[path][name];
      return component ? { component, contextMenu: path === resolve(root, dirname(manifestPath), "react/context-menu.ts"), file: relative(resolve(root, dirname(manifestPath)), path) } : undefined;
    }
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

const ds1Icons = (dsRoot: string) => readIconMap(join(dsRoot, "DS1/2-core/generated/ds-icon-map.ts")) ?? new Map<string, string>();

export function scanApp(spec: AppSpec, studio: string, dsRoot = repository): AdoptionApp {
  const root = join(studio, spec.directory);
  const app: AdoptionApp = { id: spec.id, name: spec.name, status: "unavailable", commit: null, dirty: false, files: 0, scope: spec.roots, snapshotCommit: null, cells: {}, otherCustomElements: {}, group: spec.group ?? "Products", ...(spec.migration ? { migration: spec.migration, migrationReason: spec.migrationReason } : {}) };
  try {
    app.commit = git(root, "rev-parse", "HEAD");
    // Several products share one repository: only this app's own folder counts.
    app.dirty = Boolean(git(root, "status", "--porcelain", "--", "."));
    if (spec.source === "direct" && resolve(root) !== resolve(dsRoot)) throw new Error("Only Design system 1 itself can be scanned as direct source.");
    const manifest = spec.source === "direct" ? directManifest : spec.manifest;
    const snapshots = spec.source === "direct" ? directSnapshots(dsRoot) : checkSnapshots(root, spec.manifest, dsRoot);
    let lockedControls = false;
    if (spec.source !== "direct") {
      // Without a manifest copy, a product's sync.lock.json can still show its native class sheets.
      for (const [name, check] of [["controls", checkLockedControls], ["text", checkLockedText], ["prose", checkLockedProse]] as const) {
        if (snapshots[name].snapshot !== "none") continue;
        const locked = check(root, dsRoot);
        if (locked) { snapshots[name] = locked; lockedControls ||= name === "controls"; }
      }
    }
    // A newer class is DS1 styles only where the verified copy of controls.css defines it.
    const classEvidence = new Map<string, ComponentCell>();
    const controlsFor = (style: string): ComponentCell => {
      if (spec.source === "direct" || !definedNativeClasses.has(style) || snapshots.controls.snapshot !== "verified") return snapshots.controls;
      if (!classEvidence.has(style)) {
        const copy = lockedControls ? undefined : resolve(root, dirname(spec.manifest!), "1-root/controls.css");
        const defined = lockedControls ? checkLockedControls(root, dsRoot, style)?.snapshot === "verified" : existsSync(copy!) && classRule(style).test(withoutComments(readFileSync(copy!, "utf8")));
        classEvidence.set(style, defined ? snapshots.controls : { ...snapshots.controls, snapshot: "unverified", issues: [...snapshots.controls.issues, `No DS1 rule for .${style} in this copy of controls.css`] });
      }
      return classEvidence.get(style)!;
    };
    // A native block is verified through the sheet that draws it: from the manifest, else from sync.lock.json.
    const blockSheets: Record<string, ComponentCell> = Object.fromEntries(Object.values(blockClasses).map(({ sheet }) => {
      const copied = snapshots.entries[sheet];
      return [sheet, copied ?? (spec.source === "direct" ? undefined : checkLockedStyles(root, dsRoot, { names: [basename(sheet), ...componentStyles] })) ?? emptyCell()];
    }));
    app.snapshotCommit = spec.source === "direct" ? null : snapshots.commit;
    app.cells = snapshots.cells;
    const files = git(root, "ls-files", "-z", "--", ...spec.roots).split("\0").filter(f => /\.(tsx?|jsx?|[cm]js|html|astro)$/.test(f) && !excluded.test(f) && !(spec.excludes ?? []).some(prefix => f === prefix || f.startsWith(prefix + "/")) && existsSync(join(root, f)));
    if (!files.length) throw new Error("No tracked web source was found in the configured scope.");
    app.icons = scanIcons(root, spec.source === "direct" ? undefined : spec.manifest, files, ds1Icons(dsRoot), join(dsRoot, "DS1/x-icon"), { roots: spec.roots, include: file => !excluded.test(file) && !(spec.excludes ?? []).some(prefix => file === prefix || file.startsWith(prefix + "/")) });
    for (const file of files) {
      app.files++;
      const source = readFileSync(join(root, file), "utf8");
      const aliases = spec.id === "link" ? importedAdapters(root, file, source) : {};
      const sharedAdapters = importedSharedAdapters(root, file, source, manifest);
      const sites = sourceSites(file, source);
      const adapterTags = spec.id === "link" && linkAdapters[file]
        ? new Set(Object.values(linkAdapters[file]!).map(id => `ds-${id}`).filter(tag => sites.filter(s => s.tag === tag).length === 1))
        : new Set<string>();
      for (const site of sites) {
        if (adapterTags.has(site.tag) || site.nativeStyle === "block-part") continue;
        const block = site.nativeStyle ? blockClasses[site.nativeStyle] : undefined;
        const custom = /^(ds|ezo|c9y)-(.+)$/.exec(site.tag);
        const chartPart = custom?.[1] === "ds" && ["bars", "range", "ratio", "spark"].includes(custom[2] ?? "") ? "chart" : undefined;
        const component = chartPart ?? block?.component ?? (sharedAdapters.has(site.tag) ? sharedAdapters.get(site.tag)!.component : aliases[site.tag] ?? (custom && known.has(custom[2]!) ? custom[2]! : site.dialogRole ? "dialog" : (site.nativeStyle && nativeColumns[site.nativeStyle]) || (site.controlKind ?? native[site.tag])));
        if (!component) {
          if (site.tag.includes("-")) app.otherCustomElements[site.tag] = (app.otherCustomElements[site.tag] ?? 0) + 1;
          continue;
        }
        const cell = app.cells[component]!;
        const ds = sharedAdapters.has(site.tag) || Boolean(aliases[site.tag]) || custom?.[1] === "ds";
        const adapterFile = sharedAdapters.get(site.tag)?.file;
        const entryEvidence = adapterFile && entryFiles.includes(adapterFile) ? snapshots.entries[adapterFile] ?? { ...emptyCell(), snapshot: "unverified" as const, current: false, issues: [`Not in the component manifest: ${adapterFile}`] } : undefined;
        const evidence = entryEvidence ?? (sharedAdapters.get(site.tag)?.contextMenu ? snapshots.reactContextMenu : sharedAdapters.has(site.tag) ? (component === "badge" ? snapshots.reactBadge : component === "file-picker" ? snapshots.reactFilePicker : ["token", "token-field"].includes(component) ? snapshots.reactToken : component === "avatar-group" ? snapshots.reactAvatarGroup : component === "avatar" ? snapshots.reactAvatar : component === "accordion" ? snapshots.reactAccordion : component === "menu" ? snapshots.reactMenu : component === "composer" ? snapshots.reactComposer : component === "split" ? snapshots.reactSplit : component === "button" ? snapshots.reactButton : component === "dialog" ? snapshots.reactDialog : ["checkbox", "radio", "switch", "select", "color"].includes(component) ? snapshots.reactChoice : snapshots.reactInput) : cell);
        if (sharedAdapters.has(site.tag)) {
          cell.issues = [...new Set([...cell.issues, ...evidence.issues])];
          cell.current = cell.current === true && evidence.current === true;
        }
        // Native classes are verified by the sheet that draws them: controls.css, text.css, or prose.css for writing marked data-ds-prose.
        const styled = block ? blockSheets[block.sheet] : site.nativeStyle === "ds-text" ? snapshots.text : site.nativeStyle ? controlsFor(site.nativeStyle) : site.prose ? snapshots.prose : undefined;
        const kind: UsageSite["kind"] = ds ? cell.snapshot === "verified" && evidence.snapshot === "verified" ? "shared" : "unverified"
          : styled ? styled.snapshot === "verified" ? "styled" : "unverified" : "local";
        if (styled && styled.snapshot !== "verified") cell.issues = [...new Set([...cell.issues, ...styled.issues, site.nativeStyle === "ds-text" ? "Native DS1 text styles could not be verified." : site.nativeStyle ? "Native DS1 styles could not be verified." : "DS1 prose styles could not be verified."])];
        cell[kind]++;
        cell.sites.push({ file, line: site.line, tag: site.tag + (site.nativeStyle ? `.${site.nativeStyle}` : site.prose ? "[data-ds-prose]" : ""), kind });
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
    icons: { names: [...ds1Icons(repository).keys()] },
    apps: loadAppSpecs(studio).map(app => catalogueApp(scanApp(app, studio))),
    method: [
      "Names and layers follow the shared DS1 catalogue (Core, Unit and Page). Split compatibility uses are included under Button, and Switch uses under Toggle; original source tags remain in drilldowns. Specialist implementation components retain their source names. Internal Spacing handle and Loading are included in this private audit, not the public picker.",
      "Products and Clients have separate row groups. Deferred products remain measured but are excluded from migration recommendations. Only configured tracked web roots are scanned; native apps, libraries and film recreations remain outside this report.",
      "Counts are authored source sites in tracked web files, read from the current working tree. A loop counts once. This is not a runtime or production audit; unused tracked source can be included.",
      "DS1 means the component and its imported dependencies match a recorded DS1 Git revision. An older verified snapshot still counts as DS1; the detail view shows whether it matches today's source. Modified or unverifiable DS1 is counted separately.",
      "DS1 styles counts native controls with literal ds-button, ds-switch, ds-input, ds-textarea, ds-select, ds-checkbox, ds-radio or ds-dialog classes and verified shared control styles: from a component manifest, or for a product that copies only the tokens and controls.css, from its sync.lock.json (the files match the lock and the lock matches DS1 at its revision). These are not Lit components. Dynamic class expressions are not inferred.",
      "DS1 styles also counts the pieces controls.css draws on any element: ds-field in Form (with ds-field__label, ds-field__hint and ds-field__error on native text in Text), ds-avatar in Avatar, ds-badge in Badge, ds-icon in Icon and the ds-drop zone in File picker, and a button with ds-toggle in Toggle. Each counts only when the verified copy of controls.css defines its class; an older copy that does not is needs review. A native input type=file directly inside label.ds-drop or label.ds-button is that label's frame: the label counts once as a DS1-styled file picker and the input is not counted again.",
      "DS1 styles also counts any element with a literal ds-empty or ds-notice class in Empty state or Notice, and a native table with a literal ds-table class in Table, verified through the sheet that draws it (empty.css, notice.css or table.css with the component tokens), from a component manifest or the sync.lock.json. Native p and h1-h6 marked with one of their ds-empty__ or ds-notice__ parts belong to the block and are not counted again as text; buttons and links inside stay their own sites.",
      "DS1 styles also counts native p and h1-h6 with a literal ds-text class (ds-text or a ds-text-- size or tone), verified through text.css (or, in an older copy, the one.css that held .ds-text), and native p, h1-h6, ul, ol and table inside an element marked data-ds-prose, verified through prose.css. The nearest data-ds-prose or data-ds-not-prose ancestor in the same markup or JSX decides; prose is not inferred across components or from DOM creation.",
      "Design system 1's own app and site import DS1/ directly at the same commit, so their DS1 sites count as DS1 when DS1/ has no uncommitted changes; there is no copied snapshot to verify. A checkout is dirty when the app's own folder has uncommitted changes, not the repository around it.",
      "Local means recognized ezo-/c9y- components or native button, input/select/textarea, p/headings, ul/ol, table, form and dialog, plus literal dialog/alertdialog roles, including explicit setAttribute sites. Native semantics can be intentional; these counts are review leads, not automatic defects.",
      "Tests, demos in preview/dev directories, generated files, vendored implementations and shared sign-in internals are excluded. Link's inspected TabPill, TabPillRow and Tooltip/Tooltop adapters and DS1's verified React FilePicker, Input, Textarea, Composer, Menu, ContextMenuContent/SubContent and their Button, Text and FilePicker entries, Checkbox, Radio, Switch, Select, ColorInput, Button, ButtonLink, Token, TokenField, Avatar, Logo, AvatarGroup, Accordion, Split, DialogContent, Empty and Notice adapters count at imported JSX uses, without counting their inner DS1 tags again.",
      "Icons: ds-icon with a literal type in markup, Lit, JSX or h/createElement calls counts as a use of that name; a type set by an expression is a dynamic use, and inline <svg> drawings are counted apart. An app with a copied icon map beside its DS1 snapshot is compared drawing by drawing with today's DS1 map: Differs marks a copy that is not DS1's drawing, or a DS1 name missing from the copy; Local only is a name DS1 does not draw. Apps without a copy resolve names from DS1 itself.",
      "Native dialog/input/button/select/textarea children directly inside ds-dialog/ds-file-picker/ds-checkbox/ds-radio/ds-color/ds-switch/ds-select/ds-composer count as their shared frames, not as extra local controls. Literal file, color, checkbox and radio types have their own columns; switch roles are grouped as Toggle; dynamic types stay in Input. Direct const document.createElement plus append composition and statically imported h factories from inspected DOM helpers are also recognized. Other React abstractions, dynamic tag names, CSS-only controls, spans and inline SVGs are not inferred. Native apps are outside this scan. A zero means no recognized source site, not that a capability is absent.",
    ],
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = scanReport(process.env.ADOPTION_STUDIO_ROOT ?? resolve(repository, ".."));
  const output = join(repository, ".reports/component-adoption.json");
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, JSON.stringify(report, null, 2) + "\n");
  for (const app of report.apps) console.log(`${app.name}: ${app.status}, ${app.files} files, ${Object.values(app.cells).reduce((sum, c) => sum + c.shared + c.styled + c.local + c.unverified, 0)} source sites`);
  console.log(`Saved ${output}`);
  if (report.apps.some(app => app.status !== "scanned")) process.exitCode = 1;
}
