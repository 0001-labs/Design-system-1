import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, mkdirSync, writeFileSync, statSync, realpathSync } from "node:fs";
import { basename, dirname, join, posix, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { rootConnections, historicalSource } from "./root-adoption";
import { readIconMap, scanIcons } from "./icon-adoption";
import { countLibrarySite, libraryMethod, publishedLibrary } from "./library-provenance";
import { markdownMethod, markdownScope } from "./markdown-sites";
import { COMPONENT_COLUMNS, IMPLEMENTATION_COLUMNS, catalogueApp, type AdoptionApp, type AdoptionReport, type ComponentCell, type UsageSite } from "../shared/component-adoption";

const repository = fileURLToPath(new URL("../", import.meta.url));
const hash = (body: string | Buffer) => createHash("sha256").update(body).digest("hex");
const git = (root: string, ...args: string[]) => execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 20_000_000 }).trim();
export const excluded = /^(?:(?:client|src|web)\/)?(?:design|ds1)\/|^src\/pages\/design\/|(?:^|\/)(?:vendor|signIn|_generated|generated|node_modules|dist|__surface|surface|design-lab|designLab|dev|experiments|previews|__tests__|tests|test|fixtures|stories)(?:\/|$)|(?:\.test|\.spec|\.stories|\.d)\.[^.]+$/i;

/** `source: "direct"` is Design system 1 itself: its app and site import DS1/ from the same commit, so there is no copy to verify. */
export interface AppSpec { id: string; name: string; directory: string; roots: string[]; manifest?: string; source?: "direct"; group?: "Products" | "Clients"; excludes?: string[]; migration?: "deferred"; migrationReason?: string }
/** The studio owns product names and scan scope; the reusable scanner owns recognition. */
/** `ADOPTION_CONFIG` names another configuration file, to try a scope without editing the studio's. */
export function loadAppSpecs(studio: string, configPath = process.env.ADOPTION_CONFIG ? resolve(process.env.ADOPTION_CONFIG) : join(studio, "0001/server/component-adoption.config.json")): AppSpec[] {
  const config = JSON.parse(readFileSync(configPath, "utf8")) as { apps: AppSpec[] };
  if (!Array.isArray(config.apps) || !config.apps.length) throw new Error("The studio adoption configuration has no apps.");
  const ids = new Set<string>();
  for (const app of config.apps) {
    if (!app.id || ids.has(app.id) || !app.name || !app.directory || !app.roots?.length || [app.directory, ...app.roots].some(path => path.startsWith("/") || path.split("/").includes(".."))) throw new Error("Invalid or duplicate adoption app scope.");
    ids.add(app.id);
  }
  return config.apps;
}
const known = new Set(IMPLEMENTATION_COLUMNS.map(c => c.id));
/** The site chrome's native blocks: the header (its drawer drawn by drawer.css, which header.css imports), the footer, and the document page with its definition table. */
/** The site chrome's sheets, React adapters and the header's page script, each verified on its own. */
const siteChromeFiles = ["1-root/header.css", "1-root/footer.css", "1-root/document.css", "react/header.ts", "react/footer.ts", "react/document.ts", "0-face/header.ts"];
const siteChromeBlocks: Record<string, { component: string; sheet: string }> = { "ds-header": { component: "header", sheet: "1-root/header.css" }, "ds-footer": { component: "footer", sheet: "1-root/footer.css" }, "ds-document": { component: "document", sheet: "1-root/document.css" }, "ds-definitions": { component: "document", sheet: "1-root/document.css" } };
/** Blocks a native class draws on any element, each with the sheet that draws it. Text marked as one of their parts is the block's own. */
const blockClasses: Record<string, { component: string; sheet: string }> = { "ds-empty": { component: "empty", sheet: "1-root/empty.css" }, "ds-notice": { component: "notice", sheet: "1-root/notice.css" }, "ds-table": { component: "table", sheet: "1-root/table.css" }, "ds-kbd": { component: "kbd", sheet: "1-root/kbd.css" }, "ds-carousel": { component: "carousel", sheet: "1-root/carousel.css" }, "ds-card": { component: "card", sheet: "1-root/card.css" }, "ds-stat": { component: "stat", sheet: "1-root/figures.css" }, "ds-progress": { component: "progress", sheet: "1-root/progress.css" }, "ds-row": { component: "row", sheet: "1-root/row.css" }, "ds-sidebar": { component: "sidebar", sheet: "1-root/row.css" }, ...siteChromeBlocks };
const blockPart = /^ds-(?:empty|notice|carousel|progress|card|stat|header|footer|document)__/;
/** A row's press target and a sidebar tree's rows and parts belong to the row or sidebar that counts them, on any element. */
const rowPart = /^ds-(?:row|sidebar)__/;
/**
 * Files verified on their own: the block sheets, the React adapters for empty states, notices, shortcut hints, carousels, stats and progress, and the page
 * scripts that draw DS1 without a component: the tooltip script and the feedback dialogs.
 */
const entryFiles = ["1-root/empty.css", "1-root/notice.css", "1-root/table.css", "1-root/kbd.css", "1-root/carousel.css", "1-root/card.css", "1-root/figures.css", "1-root/progress.css", "1-root/row.css", "react/empty.ts", "react/notice.ts", "react/kbd.ts", "react/carousel.ts", "react/stat.ts", "react/progress.ts", "0-face/tooltips.ts", "0-face/feedback.ts", "0-face/feedback-overlays.ts", ...siteChromeFiles];
const native: Record<string, string> = { a: "link", button: "button", input: "input", select: "select", textarea: "textarea", p: "text", h1: "text", h2: "text", h3: "text", h4: "text", h5: "text", h6: "text", ul: "list", ol: "list", table: "table", form: "form", dialog: "dialog", details: "accordion", meter: "progress", progress: "progress", kbd: "kbd" };
/**
 * `prose` marks native text, a list or a table inside an element marked data-ds-prose, which DS1's prose sheet draws.
 * `column` places a site that is not an element of its own kind: a title or data-tooltip attribute (Tooltip), a
 * table or grid role (Table), a browser dialog call (Overlay). `module` and `imported` name the DS1 code a site
 * depends on: the tooltip script, or the dialogs imported under that local name. A `range` is a known gap, kept
 * outside the matrix.
 */
export type TagSite = { tag: string; line: number; nativeStyle?: string; prose?: boolean; dialogRole?: boolean; controlKind?: "checkbox" | "radio" | "switch" | "color" | "file-picker" | "range"; column?: string; module?: "tooltips"; imported?: string };
type OpenElement = { tag: string; prose?: boolean; className?: string; site?: TagSite; specimen?: boolean; children?: OpenElement[]; content?: boolean };
/** The open elements of one markup context; `inTag` when a template chunk ended inside a tag. */
type Stack = OpenElement[] & { inTag?: boolean };
const textTags = new Set(["p", "h1", "h2", "h3", "h4", "h5", "h6"]);
/** Elements whose title attribute is no tooltip: an abbreviation's expansion, a frame's accessible name, head elements. */
const untitled = new Set(["abbr", "iframe", "link", "style", "meta", "title"]);
/** The browser's own dialogs, which DS1's feedback module replaces with promise-based ones. */
const browserDialogs = new Set(["alert", "confirm", "prompt"]);
/** A literal title or data-tooltip attribute, each a site of its own in Tooltip. An empty value is no tooltip. */
const tooltipSites = (tag: string, line: number, title: string | undefined, tooltip: string | undefined): TagSite[] => [
  ...(title?.trim() && !untitled.has(tag) ? [{ tag: `${tag}[title]`, line, column: "tooltip" }] : []),
  ...(tooltip?.trim() ? [{ tag: `${tag}[data-tooltip]`, line, column: "tooltip", module: "tooltips" as const }] : []),
];
/** A literal table or grid role on an element that is neither a table nor a custom element with semantics of its own. */
const roleColumn = (tag: string, role: string | undefined) => (role === "table" || role === "grid") && tag !== "table" && !tag.includes("-") ? "table" : undefined;
/** A literal slider role, or a range input: DS1 has no range control yet. */
const isRange = (tag: string, role: string | undefined, type: string | undefined) => (role === "slider" && !tag.includes("-")) || (tag === "input" && type === "range");
const rangeTag = (tag: string) => tag === "input" ? "input[type=range]" : `${tag}[role=slider]`;
const markupAttribute = (attributes: string, name: string) => { const match = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`).exec(attributes); return match ? match[1] ?? match[2] : undefined; };
const markupFlag = (attributes: string, name: string) => new RegExp(`(?:^|\\s)${name}(?=[\\s=/]|$)`).test(attributes);
/** The ds-overlay element, or the native dialog.ds-overlay frame, whose data-ds-overlay parts DS1 draws. */
const dialogFrame = (open: { tag: string; className?: string }) => open.tag === "ds-overlay" || (open.tag === "dialog" && /(?:^|\s)ds-overlay(?:\s|$)/.test(open.className ?? ""));
/**
 * A heading or paragraph that holds only a ds-text, or a list whose items are only ds-row (directly, or within
 * each li), is the DS1 site's native frame: the DS1 site counts, the wrapper does not.
 */
function wrapsDs1(tag: string, children: { tag: string; content?: boolean; children?: { tag: string }[] }[], content: boolean | undefined): boolean {
  if (content) return false;
  if (textTags.has(tag)) return children.length === 1 && children[0]!.tag === "ds-text";
  if (tag !== "ul" && tag !== "ol") return false;
  return children.length > 0 && children.every(child => child.tag === "ds-row" || (child.tag === "li" && !child.content && Boolean(child.children?.length) && child.children!.every(row => row.tag === "ds-row")));
}
/** Literal class text: a string, or the static chunks of a template or a concatenation. Other expressions are not inferred. */
function staticClasses(expression: ts.Expression | undefined): string | undefined {
  if (!expression) return undefined;
  if (ts.isStringLiteralLike(expression)) return expression.text;
  if (ts.isTemplateExpression(expression)) return [expression.head.text, ...expression.templateSpans.map(span => span.literal.text)].join(" ");
  if (ts.isParenthesizedExpression(expression)) return staticClasses(expression.expression);
  if (ts.isBinaryExpression(expression) && expression.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    const parts = [staticClasses(expression.left), staticClasses(expression.right)].filter((part): part is string => part !== undefined);
    return parts.length ? parts.join("") : undefined;
  }
  return undefined;
}
const proseTags = new Set([...textTags, "ul", "ol", "table", "kbd"]);
/**
 * The pieces controls.css draws on any element, and the column each counts in:
 * a field's label row counts with forms, a drop zone as a file picker.
 */
export const nativePieces: Record<string, string> = { "ds-field": "form", "ds-avatar": "avatar", "ds-badge": "badge", "ds-icon": "icon", "ds-drop": "file-picker" };
/** The column a native class moves its element into: the pieces, and a toggle button. */
const nativeColumns: Record<string, string> = { ...nativePieces, "ds-toggle": "toggle", "ds-link": "link" };
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
  if (classes.some(name => rowPart.test(name))) return "block-part";
  if (textTags.has(tag) && classes.some(name => blockPart.test(name))) return "block-part";
  // A page dot is the dots' own button, counted with them.
  if (tag === "button" && classes.includes("ds-progress__dot")) return "block-part";
  // Native text with a literal .ds-text class or one of its sizes and tones, or a field's part.
  if (textTags.has(tag)) return classes.some(name => name === "ds-text" || name.startsWith("ds-text--")) ? "ds-text" : fieldParts.find(name => classes.includes(name));
  const supported = tag === "a" ? ["ds-button", "ds-link"] : tag === "button" ? ["ds-toggle", "ds-button", "ds-switch"] : ["input", "select", "textarea"].includes(tag) ? ["ds-input", "ds-textarea", "ds-select", "ds-checkbox", "ds-radio"] : tag === "dialog" ? ["ds-overlay"] : tag === "kbd" ? ["ds-menu__shortcut"] : [];
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

/**
 * Parse syntax, not comments, import/selector strings or code samples. Markup is read where it is markup: HTML and
 * Astro files, JSX, Lit html templates, and strings written into innerHTML/outerHTML, insertAdjacentHTML or React's
 * __html. Template chunks preserve line offsets.
 */
export function sourceSites(file: string, source: string, exported?: ReadonlySet<string>): TagSite[] {
  return readSource(file, source, exported).sites;
}
/** Sites, and the imported names a file writes into markup, so the scan can follow them into their module. */
export function readSource(file: string, source: string, exported?: ReadonlySet<string>): { sites: TagSite[]; markupImports: { module: string; name: string }[] } {
  const found: TagSite[] = [];
  const markupImports: { module: string; name: string }[] = [];
  /** Native wrappers of a DS1 site, dropped once their content is known. */
  const dropped = new Set<TagSite>();
  const line = (offset: number) => source.slice(0, offset).split("\n").length;
  const markup = (text: string, offset: number, stack: Stack = [], followed = false) => {
    const clean = text.replace(/<!--[\s\S]*?-->/g, match => match.replace(/[^\n]/g, " "));
    let cursor = 0;
    if (stack.inTag) {
      // The previous chunk ended inside a tag; an expression stood in an attribute.
      const end = clean.indexOf(">");
      if (end < 0) return;
      cursor = end + 1;
      stack.inTag = false;
    }
    const content = (from: number, to: number) => { const top = stack.at(-1); if (top && from < to && /\S/.test(clean.slice(from, to))) top.content = true; };
    for (const match of clean.matchAll(/<(\/?)([A-Za-z][\w.-]*)(?=[\s/>])/g)) {
      if (match.index! < cursor) continue;
      content(cursor, match.index!);
      const end = clean.indexOf(">", match.index!);
      cursor = end < 0 ? clean.length : end + 1;
      stack.inTag = end < 0;
      const tag = match[2]!;
      if (match[1]) {
        let at = stack.length - 1;
        while (at >= 0 && stack[at]!.tag !== tag) at--;
        if (at >= 0) {
          const closed = stack[at]!;
          if (closed.site && wrapsDs1(closed.tag, closed.children ?? [], closed.content)) dropped.add(closed.site);
          stack.length = at;
        }
        continue;
      }
      const parentElement = stack.at(-1);
      const parent = parentElement?.tag ?? "";
      const attributes = clean.slice(match.index! + match[0].length).split(">")[0]!;
      const fileFrame = tag === "input" && parent === "label" && /\btype\s*=\s*["']file["']/.test(attributes) ? fileFrameClass(parentElement!.className) : undefined;
      const frame = (tag === "a" && parent === "ds-button") || (tag === "dialog" && parent === "ds-overlay") || (tag === "input" && ["ds-checkbox", "ds-radio", "ds-color", "ds-token-field", "ds-file-picker"].includes(parent)) || (tag === "button" && ["ds-switch", "ds-button"].includes(parent)) || (tag === "select" && parent === "ds-select") || (tag === "textarea" && parent === "ds-composer") || Boolean(fileFrame);
      const inProse = proseTags.has(tag) && [...stack].reverse().find(open => open.prose !== undefined)?.prose === true;
      const prose = /(?:^|\s)data-ds-not-prose(?=[\s=/]|$)/.test(attributes) ? false : /(?:^|\s)data-ds-prose(?=[\s=/]|$)/.test(attributes) ? true : undefined;
      const className = /\bclass\s*=\s*["']([^"']*)["']/.exec(attributes)?.[1] ?? /\bclass\s*=\s*["']([^"']*)$/.exec(attributes)?.[1] ?? "";
      // Nothing inside an element marked data-ds-specimen is counted: it demonstrates native HTML.
      const specimen = markupFlag(attributes, "data-ds-specimen") || stack.some(open => open.specimen);
      const open: OpenElement = { tag, prose, className, children: [], ...(specimen ? { specimen } : {}) };
      parentElement?.children?.push(open);
      if (!/\/\s*$/.test(attributes) && !/^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/.test(tag)) stack.push(open);
      if (specimen) continue;
      const at = line(offset + match.index!);
      found.push(...tooltipSites(tag, at, markupAttribute(attributes, "title"), markupAttribute(attributes, "data-tooltip")));
      if (fileFrame) claimFileFrame(parentElement!.site, fileFrame);
      // A dialog's data-ds-overlay parts are drawn by the ds-overlay or dialog.ds-overlay around them.
      const dialogPart = markupFlag(attributes, "data-ds-overlay") && stack.some(element => element !== open && dialogFrame(element));
      if (frame || dialogPart) continue;
      const dialogRole = /\brole\s*=\s*["'](?:alertdialog|dialog)["']/.test(attributes);
      const role = markupAttribute(attributes, "role");
      const column = roleColumn(tag, role);
      const type = /\btype\s*=\s*["']([\w-]+)["']/.exec(attributes)?.[1];
      const controlKind = role === "switch" ? "switch" : isRange(tag, role, type) ? "range" : tag === "input" && ["checkbox", "radio", "color"].includes(type ?? "") ? type as "checkbox" | "radio" | "color" : tag === "input" && type === "file" ? "file-picker" : undefined;
      const site: TagSite = { tag: column ? `${tag}[role=${role}]` : controlKind === "range" ? rangeTag(tag) : tag, line: at, nativeStyle: nativeStyle(tag, className), ...(inProse ? { prose: true } : {}), ...(dialogRole ? { dialogRole } : {}), ...(controlKind ? { controlKind } : {}), ...(column ? { column } : {}) };
      open.site = site;
      found.push(site);
    }
    content(cursor, clean.length);
    // An expression between template chunks is content of the element it stands in.
    if (followed && !stack.inTag && stack.length) stack.at(-1)!.content = true;
  };
  const kept = () => ({ sites: found.filter(site => !dropped.has(site)), markupImports });
  if (/\.(html|astro)$/.test(file)) {
    // Astro frontmatter is code, not markup. Embedded JS is walked separately below.
    const body = source.replace(/^---[\s\S]*?\n---/, match => match.replace(/[^\n]/g, " "));
    markup(body.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, match => match.replace(/[^\n]/g, " ")), 0);
    for (const match of source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
      const start = match.index! + match[0].indexOf(">") + 1;
      const embedded = readSource("embedded.ts", match[1]!);
      found.push(...embedded.sites.map(site => ({ ...site, line: site.line + line(start) - 1 })));
      markupImports.push(...embedded.markupImports);
    }
    return kept();
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
  // Names this file declares or imports: a call to one of them is not the browser's alert, confirm or prompt.
  const declared = new Set<string>();
  const imported = new Map<string, string>();
  const findNames = (node: ts.Node) => {
    if ((ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node) || ts.isFunctionExpression(node)) && node.name) declared.add(node.name.text);
    if ((ts.isVariableDeclaration(node) || ts.isParameter(node) || ts.isBindingElement(node)) && ts.isIdentifier(node.name)) declared.add(node.name.text);
    if ((ts.isImportClause(node) || ts.isNamespaceImport(node) || ts.isImportEqualsDeclaration(node)) && node.name) declared.add(node.name.text);
    if (ts.isImportSpecifier(node)) imported.set(node.name.text, (node.propertyName ?? node.name).text);
    ts.forEachChild(node, findNames);
  };
  findNames(ast);
  const isDocumentCreate = (node: ts.Node): node is ts.CallExpression => ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.expression.getText(ast) === "document" && node.expression.name.text === "createElement";
  /**
   * Local DOM builders, recognized by their definition: a function whose first parameter goes straight into
   * document.createElement. `classParam` is the parameter it writes into the element's class.
   */
  const builders = new Map<string, { classParam?: number }>();
  const findBuilders = (node: ts.Node) => {
    const definition = ts.isFunctionDeclaration(node) && node.name ? { name: node.name.text, fn: node as ts.FunctionLikeDeclaration }
      : ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer && (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer)) ? { name: node.name.text, fn: node.initializer as ts.FunctionLikeDeclaration } : undefined;
    const [first, ...rest] = definition?.fn.parameters ?? [];
    if (definition?.fn.body && first && ts.isIdentifier(first.name)) {
      const tag = first.name.text;
      const params = rest.map(parameter => ts.isIdentifier(parameter.name) ? parameter.name.text : "");
      const classParam = (name: ts.Expression | undefined) => name && ts.isIdentifier(name) && params.includes(name.text) ? params.indexOf(name.text) + 1 : undefined;
      let creates = false, element: string | undefined, classes: number | undefined;
      const inspect = (inner: ts.Node) => {
        if (isDocumentCreate(inner) && inner.arguments[0] && ts.isIdentifier(inner.arguments[0]) && inner.arguments[0].text === tag) {
          creates = true;
          if (ts.isVariableDeclaration(inner.parent) && ts.isIdentifier(inner.parent.name)) element = inner.parent.name.text;
        }
        if (element && ts.isBinaryExpression(inner) && inner.operatorToken.kind === ts.SyntaxKind.EqualsToken && ts.isPropertyAccessExpression(inner.left) && inner.left.name.text === "className" && inner.left.expression.getText(ast) === element) classes ??= classParam(inner.right);
        if (element && ts.isCallExpression(inner) && ts.isPropertyAccessExpression(inner.expression)) {
          const owner = inner.expression.expression;
          if (inner.expression.name.text === "setAttribute" && owner.getText(ast) === element && inner.arguments[0] && ts.isStringLiteralLike(inner.arguments[0]) && inner.arguments[0].text === "class") classes ??= classParam(inner.arguments[1]);
          if (inner.expression.name.text === "add" && ts.isPropertyAccessExpression(owner) && owner.name.text === "classList" && owner.expression.getText(ast) === element) classes ??= classParam(inner.arguments[0]);
        }
        ts.forEachChild(inner, inspect);
      };
      inspect(definition.fn.body);
      if (creates) builders.set(definition.name, classes === undefined ? {} : { classParam: classes });
    }
    ts.forEachChild(node, findBuilders);
  };
  findBuilders(ast);
  /** The literal tag of an element made by document.createElement, an imported h, or a local builder. */
  const createdTag = (node: ts.Node): string | undefined => {
    if (!ts.isCallExpression(node)) return undefined;
    const tag = node.arguments[0];
    if (!tag || !ts.isStringLiteralLike(tag)) return undefined;
    if (isDocumentCreate(node)) return tag.text;
    return ts.isIdentifier(node.expression) && (builders.has(node.expression.text) || domFactories.has(node.expression.text)) ? tag.text : undefined;
  };
  /**
   * What the same lexical block writes onto an element it creates: literal classes (className, the class attribute,
   * classList.add), title, data-tooltip, a table, grid or slider role, the specimen marker, and markup written into it.
   * Dynamic values and other scopes are not inferred.
   */
  type Created = { tag: string; call: ts.CallExpression; classes: string[]; title?: string; tooltip?: string; role?: string; specimen?: boolean };
  const created = new Map<ts.CallExpression, Created>();
  /** setAttribute calls read as a created element's own attributes, not counted again on their own. */
  const consumed = new Set<ts.Node>();
  /** Markup written into a created element opens inside it. */
  const markupTargets = new Map<ts.Node, ts.CallExpression>();
  const trackCreated = (scope: ts.Node) => {
    if (ts.isSourceFile(scope) || ts.isBlock(scope)) {
      const elements = new Map<string, Created>();
      const record = (name: string, call: ts.CallExpression, tag: string) => { const element = { tag, call, classes: [] }; created.set(call, element); elements.set(name, element); };
      const inspect = (node: ts.Node) => {
        if (node !== scope && (ts.isBlock(node) || ts.isFunctionLike(node))) return;
        if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
          const tag = createdTag(node.initializer);
          if (tag) record(node.name.text, node.initializer as ts.CallExpression, tag);
        }
        if (ts.isBinaryExpression(node) && [ts.SyntaxKind.EqualsToken, ts.SyntaxKind.PlusEqualsToken].includes(node.operatorToken.kind)) {
          const tag = node.operatorToken.kind === ts.SyntaxKind.EqualsToken ? createdTag(node.right) : undefined;
          if (tag) record(node.left.getText(ast), node.right as ts.CallExpression, tag);
          else if (ts.isPropertyAccessExpression(node.left)) {
            const name = node.left.name.text;
            const element = elements.get(node.left.expression.getText(ast));
            const literal = ts.isStringLiteralLike(node.right) ? node.right.text : undefined;
            if (element && name === "className") { const classes = staticClasses(node.right); if (classes !== undefined) element.classes.push(classes); }
            if (element && name === "title" && literal !== undefined) element.title = literal;
            if (element && name === "role" && literal !== undefined) element.role = literal;
            if (element && name === "innerHTML") markupTargets.set(node.right, element.call);
            if (ts.isPropertyAccessExpression(node.left.expression) && node.left.expression.name.text === "dataset") {
              const owner = elements.get(node.left.expression.expression.getText(ast));
              if (owner && name === "dsSpecimen") owner.specimen = true;
              if (owner && name === "tooltip" && literal !== undefined) owner.tooltip = literal;
            }
          }
        }
        if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
          const method = node.expression.name.text, owner = node.expression.expression;
          const element = elements.get(owner.getText(ast));
          const [name, value] = node.arguments;
          if (element && method === "setAttribute" && name && ts.isStringLiteralLike(name)) {
            const literal = value && ts.isStringLiteralLike(value) ? value.text : undefined;
            if (name.text === "class") { const classes = staticClasses(value); if (classes !== undefined) element.classes.push(classes); }
            if (name.text === "data-ds-specimen") element.specimen = true;
            if (literal !== undefined && name.text === "title") { element.title = literal; consumed.add(node); }
            if (literal !== undefined && name.text === "data-tooltip") { element.tooltip = literal; consumed.add(node); }
            if (literal !== undefined && name.text === "role" && ["table", "grid", "slider"].includes(literal)) { element.role = literal; consumed.add(node); }
          }
          if (element && method === "insertAdjacentHTML" && name && value && ts.isStringLiteralLike(name) && ["afterbegin", "beforeend"].includes(name.text)) markupTargets.set(value, element.call);
          if (method === "add" && ts.isPropertyAccessExpression(owner) && owner.name.text === "classList") {
            const listOwner = elements.get(owner.expression.getText(ast));
            if (listOwner) for (const arg of node.arguments) if (ts.isStringLiteralLike(arg)) listOwner.classes.push(arg.text);
          }
        }
        ts.forEachChild(node, inspect);
      };
      for (const statement of scope.statements) inspect(statement);
    }
    ts.forEachChild(scope, trackCreated);
  };
  trackCreated(ast);
  // A direct, const DOM append is evidence that the native control is the
  // shared host's required frame. Do not infer dynamic factories or aliases.
  const frameHosts = new Map<ts.CallExpression, string>();
  const findFrames = (scope: ts.Node) => {
    if (ts.isSourceFile(scope) || ts.isBlock(scope)) {
      const creations = new Map<string, { tag: string; call: ts.CallExpression }>();
      for (const statement of scope.statements) {
        if (ts.isVariableStatement(statement) && (statement.declarationList.flags & ts.NodeFlags.Const)) {
          for (const declaration of statement.declarationList.declarations) {
            const tag = declaration.initializer && createdTag(declaration.initializer);
            if (tag && ts.isIdentifier(declaration.name)) creations.set(declaration.name.text, { tag, call: declaration.initializer as ts.CallExpression });
          }
        }
        if (!ts.isExpressionStatement(statement) || !ts.isCallExpression(statement.expression)) continue;
        const call = statement.expression;
        if (!ts.isPropertyAccessExpression(call.expression) || !ts.isIdentifier(call.expression.expression) || !["append", "appendChild"].includes(call.expression.name.text)) continue;
        const host = creations.get(call.expression.expression.text)?.tag;
        const frameTags: Record<string, string> = { "ds-overlay": "dialog", "ds-select": "select", "ds-token-field": "input", "ds-file-picker": "input", "ds-composer": "textarea", "ds-checkbox": "input", "ds-radio": "input", "ds-color": "input", "ds-switch": "button", "ds-button": "button" };
        const frameTag = host && frameTags[host];
        if (!frameTag) continue;
        for (const arg of call.arguments) {
          const child = ts.isIdentifier(arg) ? creations.get(arg.text) : undefined;
          if (child && (child.tag === frameTag || (host === "ds-button" && child.tag === "a"))) frameHosts.set(child.call, host);
        }
      }
    }
    ts.forEachChild(scope, findFrames);
  };
  findFrames(ast);
  /**
   * What a name in markup holds, for markup assembled before it is written: a variable's initializer and every
   * value assigned to it, a function's returned expressions. Names resolve through their lexical scope; an
   * imported name is reported so the scan can follow it into the module that exports it.
   */
  const declarationOf = (identifier: ts.Identifier): ts.Node | undefined => {
    for (let scope: ts.Node | undefined = identifier.parent; scope; scope = scope.parent) {
      if (ts.isFunctionLike(scope)) for (const parameter of scope.parameters) if (ts.isIdentifier(parameter.name) && parameter.name.text === identifier.text) return parameter;
      if ((ts.isForStatement(scope) || ts.isForOfStatement(scope) || ts.isForInStatement(scope)) && scope.initializer && ts.isVariableDeclarationList(scope.initializer)) {
        for (const declaration of scope.initializer.declarations) if (ts.isIdentifier(declaration.name) && declaration.name.text === identifier.text) return declaration;
      }
      const statements = ts.isBlock(scope) || ts.isSourceFile(scope) || ts.isCaseClause(scope) || ts.isDefaultClause(scope) || ts.isModuleBlock(scope) ? scope.statements : undefined;
      for (const statement of statements ?? []) {
        if (ts.isFunctionDeclaration(statement) && statement.name?.text === identifier.text) return statement;
        if (ts.isVariableStatement(statement)) for (const declaration of statement.declarationList.declarations) if (ts.isIdentifier(declaration.name) && declaration.name.text === identifier.text) return declaration;
      }
    }
    return undefined;
  };
  const returned = (fn: ts.FunctionLikeDeclaration): ts.Node[] => {
    if (fn.body && !ts.isBlock(fn.body)) return [fn.body];
    const found: ts.Node[] = [];
    const visit = (node: ts.Node) => { if (ts.isReturnStatement(node) && node.expression) found.push(node.expression); if (!ts.isFunctionLike(node)) ts.forEachChild(node, visit); };
    if (fn.body) ts.forEachChild(fn.body, visit);
    return found;
  };
  const assignedValues = new Map<ts.Node, ts.Node[]>();
  const findAssigned = (node: ts.Node) => {
    if (ts.isBinaryExpression(node) && [ts.SyntaxKind.EqualsToken, ts.SyntaxKind.PlusEqualsToken].includes(node.operatorToken.kind) && ts.isIdentifier(node.left)) {
      const declaration = declarationOf(node.left);
      if (declaration) assignedValues.set(declaration, [...(assignedValues.get(declaration) ?? []), node.right]);
    }
    // Pieces pushed onto an array that is later joined into the markup.
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && ["push", "unshift"].includes(node.expression.name.text) && ts.isIdentifier(node.expression.expression)) {
      const declaration = declarationOf(node.expression.expression);
      if (declaration) assignedValues.set(declaration, [...(assignedValues.get(declaration) ?? []), ...node.arguments]);
    }
    ts.forEachChild(node, findAssigned);
  };
  findAssigned(ast);
  const valuesOf = (declaration: ts.Node): ts.Node[] => {
    if (ts.isFunctionDeclaration(declaration)) return returned(declaration);
    if (!ts.isVariableDeclaration(declaration)) return [];
    const value = declaration.initializer;
    const initial = !value ? [] : ts.isArrowFunction(value) || ts.isFunctionExpression(value) ? returned(value) : ts.isObjectLiteralExpression(value) ? [] : [value];
    return [...initial, ...(assignedValues.get(declaration) ?? [])];
  };
  const importSources = new Map<string, { module: string; name: string }>();
  for (const statement of ast.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier) || statement.importClause?.isTypeOnly) continue;
    const bindings = statement.importClause?.namedBindings;
    if (bindings && ts.isNamedImports(bindings)) for (const binding of bindings.elements) importSources.set(binding.name.text, { module: statement.moduleSpecifier.text, name: (binding.propertyName ?? binding.name).text });
  }
  /** Strings that are markup, each with the created element it is written into, if known. */
  const markupStrings = new Map<ts.Node, ts.CallExpression | undefined>();
  const followed = new Set<ts.Node>();
  const collect = (node: ts.Node, target: ts.CallExpression | undefined) => {
    if ((ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateExpression(node)) && !markupStrings.has(node)) markupStrings.set(node, target);
    // A name in the markup: follow it once to what it holds, or report the module it is imported from.
    if (ts.isIdentifier(node) && !(ts.isPropertyAccessExpression(node.parent) && node.parent.name === node) && !(ts.isPropertyAssignment(node.parent) && node.parent.name === node)) {
      const declaration = declarationOf(node);
      if (declaration && !followed.has(declaration)) {
        followed.add(declaration);
        for (const value of valuesOf(declaration)) collect(value, undefined);
      }
      if (!declaration && importSources.has(node.text)) markupImports.push(importSources.get(node.text)!);
    }
    ts.forEachChild(node, child => collect(child, target));
  };
  // Functions this module exports that another module writes into markup.
  for (const statement of ast.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name && exported?.has(statement.name.text)) collect(statement.name, undefined);
    if (ts.isVariableStatement(statement)) for (const declaration of statement.declarationList.declarations) if (ts.isIdentifier(declaration.name) && exported?.has(declaration.name.text)) collect(declaration.name, undefined);
  }
  const findMarkup = (node: ts.Node) => {
    if (ts.isTaggedTemplateExpression(node) && ts.isIdentifier(node.tag) && node.tag.text === "html") markupStrings.set(node.template, undefined);
    // A whole document written as a string, such as a rendered page or a server response.
    if ((ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) && /^\s*<(?:!doctype\s+html|html)[\s>]/i.test(node.text)) collect(node, undefined);
    if (ts.isTemplateExpression(node) && /^\s*<(?:!doctype\s+html|html)[\s>]/i.test(node.head.text)) collect(node, undefined);
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && ["write", "writeln"].includes(node.expression.name.text) && /(?:^|\.)document$/.test(node.expression.expression.getText(ast))) for (const arg of node.arguments) collect(arg, undefined);
    if (ts.isBinaryExpression(node) && [ts.SyntaxKind.EqualsToken, ts.SyntaxKind.PlusEqualsToken].includes(node.operatorToken.kind) && ts.isPropertyAccessExpression(node.left) && ["innerHTML", "outerHTML"].includes(node.left.name.text)) collect(node.right, markupTargets.get(node.right));
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "insertAdjacentHTML" && node.arguments[1]) collect(node.arguments[1], markupTargets.get(node.arguments[1]));
    if (ts.isPropertyAssignment(node) && node.name.getText(ast).replace(/["']/g, "") === "__html") collect(node.initializer, undefined);
    ts.forEachChild(node, findMarkup);
  };
  findMarkup(ast);
  /** Markup written into a created element starts inside it, and inside the shared host it is the frame of. */
  const seed = (call: ts.CallExpression | undefined): Stack => {
    const element = call && created.get(call);
    if (!element) return [];
    const host = frameHosts.get(element.call);
    return [...(host ? [{ tag: host, children: [] }] : []), { tag: element.tag, className: element.classes.join(" "), children: [], ...(element.specimen ? { specimen: true } : {}) }];
  };
  const templateStacks = new Map<ts.Node, Stack>();
  /** Sites and classes of JSX elements and h/createElement calls, for a file input to claim its label. */
  const elementSites = new Map<ts.Node, OpenElement>();
  const jsxTag = (element: ts.JsxElement | ts.JsxSelfClosingElement | ts.JsxOpeningElement) => (ts.isJsxElement(element) ? element.openingElement : element).tagName.getText(ast);
  const jsxAttribute = (element: ts.JsxOpeningElement | ts.JsxSelfClosingElement, name: string) => element.attributes.properties.find((p): p is ts.JsxAttribute => ts.isJsxAttribute(p) && p.name.getText(ast) === name);
  const jsxLiteral = (attribute: ts.JsxAttribute | undefined) => {
    const value = attribute?.initializer;
    if (value && ts.isStringLiteral(value)) return value.text;
    return value && ts.isJsxExpression(value) && value.expression && ts.isStringLiteralLike(value.expression) ? value.expression.text : undefined;
  };
  /** The JSX elements around a node, nearest first. */
  const jsxAncestors = (node: ts.Node) => {
    const found: ts.JsxOpeningElement[] = [];
    for (let parent = node.parent; parent; parent = parent.parent) if (ts.isJsxElement(parent) && parent.openingElement !== node) found.push(parent.openingElement);
    return found;
  };
  /** The nearest JSX ancestor marked data-ds-prose or data-ds-not-prose decides. */
  const jsxInProse = (node: ts.Node) => {
    for (const element of jsxAncestors(node)) {
      if (jsxAttribute(element, "data-ds-not-prose")) return false;
      if (jsxAttribute(element, "data-ds-prose")) return true;
    }
    return false;
  };
  /** A JSX element's element children, and whether it holds anything else: text or an expression. */
  const jsxChildren = (element: ts.JsxElement) => {
    const children: { tag: string; content?: boolean; children?: { tag: string }[] }[] = [];
    let content = false;
    for (const child of element.children) {
      if (ts.isJsxText(child)) { if (!child.containsOnlyTriviaWhiteSpaces) content = true; }
      else if (ts.isJsxElement(child)) { const inner = jsxChildren(child); children.push({ tag: jsxTag(child), content: inner.content, children: inner.children }); }
      else if (ts.isJsxSelfClosingElement(child)) children.push({ tag: jsxTag(child), children: [] });
      else if (!ts.isJsxExpression(child) || child.expression) content = true;
    }
    return { children, content };
  };
  const walk = (node: ts.Node) => {
    if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && !jsxAttribute(node, "data-ds-specimen") && !jsxAncestors(node).some(element => jsxAttribute(element, "data-ds-specimen"))) {
      const tag = node.tagName.getText(ast);
      const at = line(node.getStart(ast));
      // A title on a React component is a prop; only intrinsic and custom elements carry the attribute.
      if (/^[a-z]/.test(tag)) found.push(...tooltipSites(tag, at, jsxLiteral(jsxAttribute(node, "title")), jsxLiteral(jsxAttribute(node, "data-tooltip"))));
      const className = jsxClassName(jsxAttribute(node, "className")?.initializer ?? jsxAttribute(node, "class")?.initializer);
      const role = jsxLiteral(jsxAttribute(node, "role"));
      const dialogRole = role === "dialog" || role === "alertdialog";
      const parentElement = ts.isJsxOpeningElement(node) ? node.parent.parent : node.parent;
      const frameHostTags: Record<string, string> = { a: "ds-button", dialog: "ds-overlay", input: "ds-checkbox", button: "ds-switch", select: "ds-select", textarea: "ds-composer" };
      const sharedFrame = parentElement && ts.isJsxElement(parentElement) && (parentElement.openingElement.tagName.getText(ast) === frameHostTags[tag] || (tag === "input" && ["ds-radio", "ds-color", "ds-token-field", "ds-file-picker"].includes(parentElement.openingElement.tagName.getText(ast))));
      const type = jsxLiteral(jsxAttribute(node, "type"));
      const controlKind = role === "switch" ? "switch" : isRange(tag, role, type) ? "range" : tag === "input" && ["checkbox", "radio", "color"].includes(type ?? "") ? type as "checkbox" | "radio" | "color" : tag === "input" && type === "file" ? "file-picker" : undefined;
      const column = roleColumn(tag, role);
      const prose = proseTags.has(tag) && jsxInProse(node);
      const label = controlKind === "file-picker" && parentElement && ts.isJsxElement(parentElement) && parentElement.openingElement.tagName.getText(ast) === "label" ? elementSites.get(parentElement.openingElement) : undefined;
      const fileFrame = label && fileFrameClass(label.className);
      const dialogPart = Boolean(jsxAttribute(node, "data-ds-overlay")) && jsxAncestors(node).some(element => dialogFrame({ tag: jsxTag(element), className: jsxClassName(jsxAttribute(element, "className")?.initializer ?? jsxAttribute(element, "class")?.initializer) }));
      const wrapper = ts.isJsxOpeningElement(node) && (({ children, content }) => wrapsDs1(tag, children, content))(jsxChildren(node.parent));
      if (fileFrame) claimFileFrame(label.site, fileFrame);
      else if (!sharedFrame && !dialogPart && !wrapper) {
        const site: TagSite = { tag: column ? `${tag}[role=${role}]` : controlKind === "range" ? rangeTag(tag) : tag, line: at, nativeStyle: nativeStyle(tag, className), ...(prose ? { prose } : {}), ...(dialogRole ? { dialogRole: true } : {}), ...(controlKind ? { controlKind } : {}), ...(column ? { column } : {}) };
        elementSites.set(node, { tag, className, site });
        found.push(site);
      }
    }
    if (ts.isCallExpression(node) && ((ts.isPropertyAccessExpression(node.expression) && ["createElement", "createElementNS"].includes(node.expression.name.text)) || (ts.isIdentifier(node.expression) && (reactFactories.has(node.expression.text) || domFactories.has(node.expression.text) || builders.has(node.expression.text))))) {
      const arg = node.arguments[ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "createElementNS" ? 1 : 0];
      if (arg && ts.isStringLiteralLike(arg) && !frameHosts.has(node)) {
        const props = node.arguments[1];
        const strings: Record<string, string> = {};
        if (props && ts.isObjectLiteralExpression(props)) for (const property of props.properties) {
          if (ts.isPropertyAssignment(property) && property.name && ts.isStringLiteralLike(property.initializer)) strings[property.name.getText(ast).replace(/["']/g, "")] = property.initializer.text;
        }
        const element = created.get(node);
        const builder = ts.isIdentifier(node.expression) ? builders.get(node.expression.text) : undefined;
        if (!element?.specimen && !Object.hasOwn(strings, "data-ds-specimen") && !jsxAncestors(node).some(parent => jsxAttribute(parent, "data-ds-specimen"))) {
          const role = strings.role ?? element?.role;
          const controlKind = role === "switch" ? "switch" : isRange(arg.text, role, strings.type) ? "range" : arg.text === "input" && ["checkbox", "radio", "color", "file"].includes(strings.type ?? "") ? strings.type === "file" ? "file-picker" : strings.type as "checkbox" | "radio" | "color" : undefined;
          const column = roleColumn(arg.text, role);
          const className = [strings.className ?? strings.class, builder?.classParam ? staticClasses(node.arguments[builder.classParam]) : undefined, ...(element?.classes ?? [])].filter(Boolean).join(" ");
          const style = nativeStyle(arg.text, className);
          const at = line(arg.getStart(ast));
          found.push(...tooltipSites(arg.text, at, strings.title ?? element?.title, strings["data-tooltip"] ?? element?.tooltip));
          // A file input passed straight to the call that makes its label.
          const label = controlKind === "file-picker" ? elementSites.get(node.parent) : undefined;
          const fileFrame = label?.tag === "label" ? fileFrameClass(label.className) : undefined;
          if (fileFrame) claimFileFrame(label!.site, fileFrame);
          else {
            const site: TagSite = { tag: column ? `${arg.text}[role=${role}]` : controlKind === "range" ? rangeTag(arg.text) : arg.text, line: at, ...(style ? { nativeStyle: style } : {}), ...(controlKind ? { controlKind } : {}), ...(column ? { column } : {}) };
            elementSites.set(node, { tag: arg.text, className, site });
            found.push(site);
          }
        }
      }
    }
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "setAttribute" && !consumed.has(node)) {
      const [name, value] = node.arguments;
      const at = line(node.getStart(ast));
      if (name && value && ts.isStringLiteral(name) && name.text === "role" && ts.isStringLiteral(value) && ["dialog", "alertdialog"].includes(value.text)) {
        found.push({ tag: "role-dialog", line: at, dialogRole: true });
      }
      if (name && value && ts.isStringLiteral(name) && ts.isStringLiteralLike(value)) {
        if (name.text === "role" && roleColumn("", value.text)) found.push({ tag: `[role=${value.text}]`, line: at, column: "table" });
        if (name.text === "role" && value.text === "slider") found.push({ tag: "[role=slider]", line: at, controlKind: "range" });
        if (name.text === "title") found.push(...tooltipSites("", at, value.text, undefined));
        if (name.text === "data-tooltip") found.push(...tooltipSites("", at, undefined, value.text));
      }
    }
    // The browser's alert, confirm and prompt, called globally or on window; or DS1's, imported by name.
    if (ts.isCallExpression(node)) {
      const callee = node.expression;
      const at = line(node.getStart(ast));
      if (ts.isIdentifier(callee) && imported.has(callee.text) && browserDialogs.has(imported.get(callee.text)!)) found.push({ tag: `${imported.get(callee.text)}()`, line: at, column: "dialog", imported: callee.text });
      else if (ts.isIdentifier(callee) && browserDialogs.has(callee.text) && !declared.has(callee.text) && !imported.has(callee.text)) found.push({ tag: `${callee.text}()`, line: at, column: "dialog" });
      else if (ts.isPropertyAccessExpression(callee) && ts.isIdentifier(callee.expression) && ["window", "globalThis"].includes(callee.expression.text) && !declared.has(callee.expression.text) && browserDialogs.has(callee.name.text)) found.push({ tag: `${callee.name.text}()`, line: at, column: "dialog" });
    }
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) {
      // Only markup contexts: a plain string or a code sample is not a site.
      const template = ts.isTemplateHead(node) ? node.parent : (ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) ? node.parent.parent : node;
      if (markupStrings.has(template)) {
        let stack = templateStacks.get(template);
        if (!stack) templateStacks.set(template, stack = seed(markupStrings.get(template)));
        const followed = ts.isTemplateHead(node) || ts.isTemplateMiddle(node);
        markup(node.getText(ast).slice(1, followed ? -2 : -1), node.getStart(ast) + 1, stack, followed);
      }
    }
    ts.forEachChild(node, walk);
  };
  walk(ast);
  return kept();
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
      try { historical.set(file, (historicalSource(dsRoot, manifest.commit, `DS1/${file}`)?.toString() ?? null)); }
      catch { historical.set(file, null); }
    }
    return historical.get(file)!;
  };
  for (const component of [...manifest.components, ...entryFiles.filter(file => manifest.files[file]).map(file => `@file:${file}`), "@controls", ...(manifest.files["1-root/text.css"] ? ["@text"] : []), ...(manifest.files["1-root/prose.css"] ? ["@prose"] : []), ...(manifest.files["react/badge.ts"] ? ["@react-badge"] : []), ...(manifest.files["react/context-menu.ts"] ? ["@react-context-menu"] : []), ...(manifest.files["react/file-picker.ts"] ? ["@react-file-picker"] : []), ...(manifest.files["react/token-field.ts"] ? ["@react-token-field"] : []), ...(manifest.files["react/avatar-group.ts"] ? ["@react-avatar-group"] : []), ...(manifest.files["react/avatar.ts"] ? ["@react-avatar"] : []), ...(manifest.files["react/accordion.ts"] ? ["@react-accordion"] : []), ...(manifest.files["react/menu.ts"] ? ["@react-menu"] : []), ...(manifest.files['react/composer.ts'] ? ['@react-composer'] : []), ...(manifest.files['react/split.ts'] ? ['@react-split'] : []), ...(manifest.files['react/input.ts'] ? ['@react-input'] : []), ...(manifest.files['react/button.ts'] ? ['@react-button'] : []), ...(manifest.files['react/overlay.ts'] ? ['@react-dialog'] : []), ...(manifest.files['react/choice.ts'] ? ['@react-choice'] : [])]) {
    const file = component.startsWith("@file:") ? component.slice("@file:".length) : undefined;
    const cell = file ? (entries[file] = emptyCell()) : component === "@text" ? text : component === "@prose" ? prose : component === "@react-badge" ? reactBadge : component === "@react-context-menu" ? reactContextMenu : component === "@react-file-picker" ? reactFilePicker : component === "@react-token-field" ? reactToken : component === "@react-avatar-group" ? reactAvatarGroup : component === "@react-avatar" ? reactAvatar : component === "@react-accordion" ? reactAccordion : component === "@controls" ? controls : component === "@react-menu" ? reactMenu : component === "@react-composer" ? reactComposer : component === '@react-input' ? reactInput : component === '@react-button' ? reactButton : component === '@react-dialog' ? reactDialog : component === '@react-choice' ? reactChoice : component === '@react-split' ? reactSplit : cells[component];
    if (!cell) continue;
    const entry = file ?? (component === "@text" ? "1-root/text.css" : component === "@prose" ? "1-root/prose.css" : component === "@react-badge" ? "react/badge.ts" : component === "@react-context-menu" ? "react/context-menu.ts" : component === "@react-file-picker" ? "react/file-picker.ts" : component === "@react-token-field" ? "react/token-field.ts" : component === "@react-avatar-group" ? "react/avatar-group.ts" : component === "@react-avatar" ? "react/avatar.ts" : component === "@react-accordion" ? "react/accordion.ts" : component === "@controls" ? "1-root/controls.css" : component === "@react-menu" ? "react/menu.ts" : component === "@react-composer" ? "react/composer.ts" : component === '@react-input' ? 'react/input.ts' : component === '@react-button' ? 'react/button.ts' : component === '@react-dialog' ? 'react/overlay.ts' : component === '@react-choice' ? 'react/choice.ts' : component === '@react-split' ? 'react/split.ts' : Object.keys(manifest.files).find(f => f.endsWith(`/ds-${component}.ts`)));
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
      try { original = historicalSource(dsRoot, source.commit!, `DS1/1-root/${name}`) ?? null; } catch { original = null; }
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

type Lock = Record<string, { commit?: string; files?: Record<string, string> }>;
const readLock = (root: string): Lock => existsSync(join(root, "sync.lock.json")) ? JSON.parse(readFileSync(join(root, "sync.lock.json"), "utf8")) as Lock : {};
const relativeImports = /(?:\bfrom\s*|\bimport\s*\(\s*|^\s*import\s*|@import\s*)["'](\.[^"']+)["']/gm;
/**
 * A DS1 page script copied without a component manifest (the root export's `modules`, or the feedback export),
 * at `path`, which lies under its copy's 0-face/. It is verified when it and everything it imports match
 * sync.lock.json on disk and the lock matches DS1 at its revision.
 */
export function checkLockedModule(root: string, dsRoot: string, path: string): ComponentCell | undefined {
  const source = readLock(root)["Design system 1"];
  const at = path.lastIndexOf("0-face/");
  if (!source?.files?.[path] || !/^[a-f0-9]{40}$/.test(source.commit ?? "") || at < 0 || (at > 0 && path[at - 1] !== "/")) return undefined;
  const files = source.files, base = path.slice(0, at), cell = emptyCell(), visited = new Set<string>();
  let modified = false, unverifiable = false, current = true;
  const visit = (file: string) => {
    if (visited.has(file)) return;
    visited.add(file);
    const copy = base + file, full = resolve(root, copy);
    if (!full.startsWith(resolve(root) + "/") || !existsSync(full) || !files[copy]) { unverifiable = true; cell.issues.push(`Missing dependency: ${copy}`); return; }
    const body = readFileSync(full);
    if (hash(body) !== files[copy]) { modified = true; cell.issues.push(`Locally modified: ${copy}`); }
    let original: Buffer | null = null;
    try { original = historicalSource(dsRoot, source.commit!, `DS1/${file}`) ?? null; } catch { original = null; }
    if (!original || hash(original) !== files[copy]) { unverifiable = true; cell.issues.push(`Source revision not verified: ${copy}`); }
    const latest = join(dsRoot, "DS1", file);
    if (!existsSync(latest) || hash(readFileSync(latest)) !== hash(body)) current = false;
    if (!/\.(ts|css)$/.test(file)) return;
    for (const match of body.toString("utf8").matchAll(relativeImports)) {
      const dependency = posix.normalize(posix.join(posix.dirname(file), match[1]!.split("?")[0]!));
      const resolved = dependency.startsWith("..") ? undefined : [dependency, `${dependency}.ts`, `${dependency}.json`, `${dependency}/index.ts`].find(candidate => existsSync(resolve(root, base + candidate)) && statSync(resolve(root, base + candidate)).isFile());
      if (resolved) visit(resolved);
      else { unverifiable = true; cell.issues.push(`Unresolved dependency in ${copy}`); }
    }
  };
  visit(path.slice(at));
  cell.snapshot = modified ? "modified" : unverifiable ? "unverified" : "verified";
  cell.current = current && !unverifiable;
  return cell;
}

/** A relative or `@/` import from a source file, resolved inside the app. */
function resolveImport(root: string, from: string, name: string): string | undefined {
  if (!name.startsWith(".") && !name.startsWith("@/")) return undefined;
  const base = name.startsWith("@/") ? resolve(root, "src", name.slice(2)) : resolve(dirname(from), name);
  if (!base.startsWith(resolve(root) + "/")) return undefined;
  return [base, `${base}.ts`, `${base}.tsx`, base.replace(/\.js$/, ".ts"), join(base, "index.ts")].find(path => existsSync(path) && statSync(path).isFile());
}
/**
 * alert, confirm and prompt imported by name from DS1's feedback module or its dialogs, by local name, with the
 * app path of the module they come from. Script blocks in HTML and Astro files are read the same way.
 */
export function importedDialogs(root: string, file: string, source: string): Map<string, string> {
  const found = new Map<string, string>();
  for (const match of source.matchAll(/\bimport\s*\{([^}]*)\}\s*from\s*["']([^"']+)["']/g)) {
    const module = resolveImport(root, resolve(root, file), match[2]!);
    if (!module || !/(?:^|\/)0-face\/(?:feedback|dialogs)\.ts$/.test(module)) continue;
    for (const binding of match[1]!.split(",")) {
      const [name, local] = binding.trim().replace(/^type\s+/, "").split(/\s+as\s+/);
      if (name && browserDialogs.has(name)) found.set((local ?? name).trim(), relative(root, module));
    }
  }
  return found;
}

/** Folders that hold copies of shared parts, which the scan leaves out as their internals. */
const sharedFolder = /(?:^|\/)(?:vendor|signIn)\//;
/**
 * Custom elements that are not the product's own: defined (customElements.define, with the tag as a literal in
 * the same file) in a copied shared folder. `lock` names the sync.lock.json source whose recorded hash the
 * definition matches; without it, the copy's provenance rests on the folder alone.
 */
export function findSharedParts(root: string, tracked: string[], tags: string[]): Record<string, { definition: string; lock?: string }> {
  const parts: Record<string, { definition: string; lock?: string }> = {};
  if (!tags.length) return parts;
  const lock = readLock(root);
  for (const file of tracked) {
    if (!sharedFolder.test(file) || !/\.(?:[cm]?js|ts)$/.test(file) || /\.d\.ts$/.test(file) || !existsSync(join(root, file))) continue;
    const body = readFileSync(join(root, file), "utf8");
    if (!body.includes("customElements.define")) continue;
    for (const tag of tags) {
      if (parts[tag] || !(body.includes(`"${tag}"`) || body.includes(`'${tag}'`))) continue;
      const source = Object.entries(lock).find(([, entry]) => entry?.files?.[file] === hash(body))?.[0];
      parts[tag] = { definition: file, ...(source ? { lock: source } : {}) };
    }
  }
  return parts;
}

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
    [resolve(root, dirname(manifestPath), "react/kbd.ts")]: { Kbd: "kbd" },
    [resolve(root, dirname(manifestPath), "react/header.ts")]: { Header: "header" },
    [resolve(root, dirname(manifestPath), "react/footer.ts")]: { Footer: "footer" },
    [resolve(root, dirname(manifestPath), "react/document.ts")]: { DocumentPage: "document" },
    [resolve(root, dirname(manifestPath), "react/carousel.ts")]: { Carousel: "carousel" },
    [resolve(root, dirname(manifestPath), "react/stat.ts")]: { Stat: "stat" },
    [resolve(root, dirname(manifestPath), "react/meter.ts")]: { Meter: "meter" },
    [resolve(root, dirname(manifestPath), "react/steps.ts")]: { Steps: "steps" },
    [resolve(root, dirname(manifestPath), "react/progress.ts")]: { Progress: "progress" },
    [resolve(root, dirname(manifestPath), "react/sidebar.ts")]: { Sidebar: "sidebar" },
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
    [resolve(root, dirname(manifestPath), 'react/overlay.ts')]: { OverlayContent: 'dialog' },
    [resolve(root, dirname(manifestPath), 'react/choice.ts')]: { Checkbox: 'checkbox', Radio: 'radio', Switch: 'switch', Select: 'select', ColorInput: 'color' },
  };
  const resolveModule = (from: string, name: string) => resolveImport(root, from, name);
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
    if (spec.source === "direct" && realpathSync(root) !== realpathSync(dsRoot)) throw new Error("Only Design system 1 itself can be scanned as direct source.");
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
    const markdown = markdownScope(root);
    const library = publishedLibrary(root);
    const tracked = git(root, "ls-files", "-z", "--", ...spec.roots).split("\0").filter(Boolean);
    const files = tracked.filter(f => (/\.(tsx?|jsx?|[cm]js|html|astro)$/.test(f) || markdown.includes(f)) && !excluded.test(f) && !(spec.excludes ?? []).some(prefix => f === prefix || f.startsWith(prefix + "/")) && existsSync(join(root, f)));
    // DS1 page scripts (the tooltip script, the feedback dialogs) are verified like the block sheets: from the manifest, else the lock.
    const moduleCells = new Map<string, ComponentCell>();
    const moduleEvidence = (path: string): ComponentCell => {
      if (!moduleCells.has(path)) {
        const snapshot = manifest ? dirname(manifest) + "/" : undefined;
        const entry = snapshot && path.startsWith(snapshot) ? snapshots.entries[path.slice(snapshot.length)] : undefined;
        moduleCells.set(path, entry ?? (spec.source === "direct" ? undefined : checkLockedModule(root, dsRoot, path)) ?? { ...emptyCell(), snapshot: "unverified", current: false, issues: [`No verified DS1 copy of ${path}`] });
      }
      return moduleCells.get(path)!;
    };
    const tooltipScript = (): ComponentCell => {
      const snapshot = manifest ? dirname(manifest) + "/" : "";
      if (snapshots.entries["0-face/tooltips.ts"]) return moduleEvidence(`${snapshot}0-face/tooltips.ts`);
      const copy = Object.keys(readLock(root)["Design system 1"]?.files ?? {}).find(path => /(?:^|\/)0-face\/tooltips\.ts$/.test(path));
      return copy ? moduleEvidence(copy) : { ...emptyCell(), snapshot: "unverified", current: false, issues: ["No copy of DS1's tooltip script (0-face/tooltips.ts)"] };
    };
    if (!files.length) throw new Error("No tracked web source was found in the configured scope.");
    app.icons = scanIcons(root, spec.source === "direct" ? undefined : spec.manifest, files, ds1Icons(dsRoot), join(dsRoot, "DS1/x-icon"), { roots: spec.roots, include: file => !excluded.test(file) && !(spec.excludes ?? []).some(prefix => file === prefix || file.startsWith(prefix + "/")) });
    const roots = rootConnections(root, dsRoot, spec.manifest, spec.source === "direct");
    for (const file of tracked.filter(f => /\.(css|tsx?|jsx?|[cm]js|html|astro)$/.test(f) && !excluded.test(f) && !(spec.excludes ?? []).some(prefix => f === prefix || f.startsWith(prefix + "/")) && existsSync(join(root, f)))) {
      roots(file, readFileSync(join(root, file), "utf8"), app.cells);
    }
    const sources = new Map(files.map(file => [file, readFileSync(join(root, file), "utf8")]));
    // Markdown is read per file below; the script and markup reader takes the rest.
    const reads = new Map(files.filter(file => !markdown.includes(file)).map(file => [file, readSource(file, sources.get(file)!)]));
    // A function another file writes into markup is read as markup in the module that exports it.
    const exportsInMarkup = new Map<string, Set<string>>();
    for (let round = 0; round < 4; round++) {
      let grown = false;
      for (const [file, read] of reads) for (const { module, name } of read.markupImports) {
        const target = resolveImport(root, resolve(root, file), module);
        const path = target && relative(root, target);
        if (!path || !reads.has(path)) continue;
        const names = exportsInMarkup.get(path) ?? new Set<string>();
        if (!names.has(name)) { names.add(name); exportsInMarkup.set(path, names); grown = true; }
      }
      if (!grown) break;
      for (const [path, names] of exportsInMarkup) reads.set(path, readSource(path, sources.get(path)!, names));
    }
    for (const file of files) {
      app.files++;
      const source = sources.get(file)!;
      const aliases = spec.id === "link" ? importedAdapters(root, file, source) : {};
      const document = markdown.read(file, source, sourceSites);
      const sharedAdapters = importedSharedAdapters(root, file, document?.code ?? source, manifest);
      const sites = document?.sites ?? reads.get(file)!.sites;
      const dialogs = sites.some(site => site.imported) ? importedDialogs(root, file, source) : new Map<string, string>();
      const libraryFile = library?.read(file, source);
      const adapterTags = spec.id === "link" && linkAdapters[file]
        ? new Set(Object.values(linkAdapters[file]!).map(id => `ds-${id}`).filter(tag => sites.filter(s => s.tag === tag).length === 1))
        : new Set<string>();
      for (const site of sites) {
        if (adapterTags.has(site.tag) || site.nativeStyle === "block-part") continue;
        // A published library's controls are needs review; a wrapper's own face counts at its uses.
        const viaLibrary = libraryFile?.site(site);
        if (viaLibrary !== undefined) { if (viaLibrary) countLibrarySite(app.cells[viaLibrary.component]!, file, site, library!); continue; }
        // DS1 has no range control: a range is recorded as a known gap, outside the matrix.
        if (site.controlKind === "range") { ((app.gaps ??= {}).range ??= []).push({ file, line: site.line, tag: site.tag, kind: "local" }); continue; }
        if (site.column && !site.nativeStyle) {
          // A name imported from somewhere other than DS1's dialogs is the product's own function, not a site.
          if (site.imported && !dialogs.has(site.imported)) continue;
          const evidence = site.module === "tooltips" ? tooltipScript() : site.imported ? moduleEvidence(dialogs.get(site.imported)!) : undefined;
          const cell = app.cells[site.column]!;
          const kind: UsageSite["kind"] = evidence ? evidence.snapshot === "verified" ? "shared" : "unverified" : "local";
          if (evidence && kind === "unverified") cell.issues = [...new Set([...cell.issues, ...evidence.issues])];
          cell[kind]++;
          cell.sites.push({ file, line: site.line, tag: site.tag, kind });
          continue;
        }
        const block = site.nativeStyle ? blockClasses[site.nativeStyle] : undefined;
        const custom = /^(ds|ezo|c9y)-(.+)$/.exec(site.tag);
        const chartPart = custom?.[1] === "ds" && ["bars", "range", "ratio", "spark"].includes(custom[2] ?? "") ? "chart" : undefined;
        const component = (site.tag === "a" && site.nativeStyle === "ds-button" ? "button" : undefined) ?? chartPart ?? block?.component ?? (sharedAdapters.has(site.tag) ? sharedAdapters.get(site.tag)!.component : aliases[site.tag] ?? (custom && known.has(custom[2]!) ? custom[2]! : site.dialogRole ? "dialog" : (site.nativeStyle && nativeColumns[site.nativeStyle]) || (site.controlKind ?? native[site.tag])));
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
    // A custom element defined in a copied shared folder is a studio part, not the product's own.
    for (const [tag, part] of Object.entries(findSharedParts(root, tracked, Object.keys(app.otherCustomElements)))) {
      (app.sharedParts ??= {})[tag] = { uses: app.otherCustomElements[tag]!, ...part };
      delete app.otherCustomElements[tag];
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
      "Root counts authored stylesheet connections to Styling, Colours and Fonts, including their local CSS imports. Each foundation sheet is verified against its recorded source; these are connections, not rendered elements or individual token uses.",
      "Names and layers follow the shared DS1 catalogue (Root, Core, Unit and Page). Split compatibility uses are included under Button, and Switch uses under Toggle; original source tags remain in drilldowns. Specialist implementation components retain their source names. Internal Spacing handle and Loading are included in this private audit, not the public picker.",
      "Products and Clients have separate row groups. Deferred products remain measured but are excluded from migration recommendations. Only configured tracked web roots are scanned; native apps, libraries and film recreations remain outside this report.",
      "Counts are authored source sites in tracked web files, read from the current working tree. A loop counts once. This is not a runtime or production audit; unused tracked source can be included.",
      "Markup is read where it is markup: HTML and Astro files, JSX, Lit html templates, strings written into innerHTML, outerHTML, insertAdjacentHTML, React's __html or document.write, and strings that are a whole document. Markup assembled first is followed: a local name's value and later assignments, a function's returned strings, pieces pushed onto an array, and a function another file imports and writes into markup. A plain string or code sample (\"<button>\") is not a site. Markup written into an element created in the same block opens inside it.",
      "Classes and attributes written in code count on an element created in the same lexical block, by document.createElement, an imported h or a local builder: literal className (static parts of a template or concatenation), setAttribute(\"class\") and classList.add; a literal title, data-tooltip, or a table, grid or slider role. A local builder is a function whose first parameter goes straight into document.createElement; calls with a literal tag count like h(), with classes from its options and from the parameter it writes into the class.",
      "Nothing under an element marked data-ds-specimen counts (also set with setAttribute or dataset.dsSpecimen on a created element): it demonstrates native HTML.",
      "Native frames of a DS1 site count once, as that site: a heading or paragraph holding only a ds-text, a list whose items hold only ds-row, and data-ds-overlay parts inside ds-overlay or dialog.ds-overlay. A form around DS1 controls stays a local Form lead: DS1 has ds-form, and no DS1 sheet draws a native form.",
      "Tooltip counts each literal, non-empty title attribute as local (not on abbr, iframe or head elements, nor on React components, where title is a prop) and each data-tooltip as DS1, verified through the copied tooltip script (0-face/tooltips.ts). Accordion counts each native details once. Overlay counts the browser's alert, confirm and prompt, called globally or on window, as local; DS1's own, imported by name from its feedback module, count as DS1 once that copy and its imports are verified. Table counts a literal table or grid role on an element that is not a table. Attribute values set by an expression are not inferred.",
      "DS1 has no range control: range inputs and slider roles are kept out of Input and listed as a known gap in the app record. Custom elements defined in a copied shared folder (signIn/, vendor/) are listed as shared parts, with the Sync 1 lock source when it verifies the copy, not as product-local elements.",
      "DS1 means the component and its imported dependencies match a recorded DS1 Git revision. An older verified snapshot still counts as DS1; the detail view shows whether it matches today's source. Modified or unverifiable DS1 is counted separately.",
      "DS1 styles counts native controls with literal ds-button, ds-switch, ds-input, ds-textarea, ds-select, ds-checkbox, ds-radio or ds-overlay classes and verified shared control styles: from a component manifest, or for a product that copies only the tokens and controls.css, from its sync.lock.json (the files match the lock and the lock matches DS1 at its revision). These are not Lit components. Dynamic class expressions are not inferred.",
      "DS1 styles also counts the pieces controls.css draws on any element: ds-field in Form (with ds-field__label, ds-field__hint and ds-field__error on native text in Text), ds-avatar in Avatar, ds-badge in Badge, ds-icon in Icon and the ds-drop zone in File picker, and a button with ds-toggle in Toggle. Each counts only when the verified copy of controls.css defines its class; an older copy that does not is needs review. A native input type=file directly inside label.ds-drop or label.ds-button is that label's frame: the label counts once as a DS1-styled file picker and the input is not counted again.",
      "DS1 styles also counts any element with a literal ds-empty, ds-notice, ds-stat or ds-progress class in Empty state, Notice, Stat or Progress, a native table with a literal ds-table class in Table, any element with a literal ds-row or ds-sidebar class in Row or Sidebar, and a literal ds-kbd class in Keyboard shortcut, verified through the sheet that draws it (empty.css, notice.css, figures.css, progress.css, table.css, row.css or kbd.css with the component tokens), from a component manifest or the sync.lock.json. Native p and h1-h6 marked with one of their ds-empty__, ds-notice__, ds-stat__ or ds-progress__ parts belong to the block and are not counted again as text; buttons and links inside stay their own sites, except a row's ds-row__target and a sidebar tree's ds-sidebar__ parts, which are the row's or sidebar's own.",
      "DS1 styles also counts native p and h1-h6 with a literal ds-text class (ds-text or a ds-text-- size or tone), verified through text.css (or, in an older copy, the one.css that held .ds-text), and native p, h1-h6, ul, ol, table and kbd inside an element marked data-ds-prose, verified through prose.css. The nearest data-ds-prose or data-ds-not-prose ancestor in the same markup or JSX decides; prose is not inferred across components or from DOM creation.",
      "Design system 1's own app and site import DS1/ directly at the same commit, so their DS1 sites count as DS1 when DS1/ has no uncommitted changes; there is no copied snapshot to verify. A checkout is dirty when the app's own folder has uncommitted changes, not the repository around it.",
      "Local means recognized ezo-/c9y- components or native button, input/select/textarea, p/headings, ul/ol, table, form, details, meter, dialog and kbd (a kbd with the menu's ds-menu__shortcut class counts as DS1 styles), plus literal dialog/alertdialog roles, including explicit setAttribute sites, title tooltips, table and grid roles and the browser's dialogs. Native semantics can be intentional; these counts are review leads, not automatic defects.",
      "Tests, demos in preview/dev directories, generated files, vendored implementations and shared sign-in internals are excluded. Link's inspected TabPill, TabPillRow and Tooltip/Tooltop adapters and DS1's verified React FilePicker, Input, Textarea, Composer, Menu, ContextMenuContent/SubContent and their Button, Text and FilePicker entries, Checkbox, Radio, Switch, Select, ColorInput, Button, ButtonLink, Token, TokenField, Avatar, Logo, AvatarGroup, Accordion, Split, OverlayContent, Empty, Notice, Kbd, Stat, Meter and Steps adapters count at imported JSX uses, without counting their inner DS1 tags again.",
      "Icons: ds-icon with a literal type in markup, Lit, JSX or h/createElement calls counts as a use of that name; a type set by an expression is a dynamic use, and inline <svg> drawings are counted apart. An app with a copied icon map beside its DS1 snapshot is compared drawing by drawing with today's DS1 map: Differs marks a copy that is not DS1's drawing, or a DS1 name missing from the copy; Local only is a name DS1 does not draw. Apps without a copy resolve names from DS1 itself. Icons drawn other ways count too, each as its own kind: SVG files used as CSS masks or backgrounds, imported or in <img>, compared with DS1 by geometry; icon-font classes (local only); a control whose whole text is one symbol glyph, mapped to the DS1 icon it stands for; SVG built with createElementNS; components from a product's own icon set, recognised by shape; and inline drawings that match a DS1 icon, named after it.",
      "Native dialog/input/button/select/textarea children directly inside ds-overlay/ds-file-picker/ds-checkbox/ds-radio/ds-color/ds-switch/ds-select/ds-composer count as their shared frames, not as extra local controls. Literal file, color, checkbox and radio types have their own columns; switch roles are grouped as Toggle; dynamic types stay in Input. Direct const document.createElement plus append composition, statically imported h factories from inspected DOM helpers and local builders are also recognized. Other React abstractions, dynamic tag names, CSS-only controls, spans and inline SVGs are not inferred. Native apps are outside this scan. A zero means no recognized source site, not that a capability is absent.",
      ...libraryMethod,
      ...markdownMethod,
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
