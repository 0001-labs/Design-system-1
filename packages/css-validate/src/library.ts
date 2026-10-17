import * as csstree from "css-tree";

import { LIBRARY_BUTTON_LINK, LIBRARY_BUTTON_LINK_BASE, LIBRARY_REVISION, LIBRARY_SELECTORS, LIBRARY_TOKENS, libraryStamp } from "../../../DS1/1-root/library-tokens";

export interface PreparedLibrary {
  /** The stylesheet to publish: the draft with the component tokens, the button-link faces and the stamp. */
  css: string;
  /** The DS1 library revision it was prepared with, as stamped on its first line. */
  revision: string;
  /** What the version row records as its transform. */
  transform: string;
}

type Edit = { start: number; end: number; text: string };

const byLibraryToken = new Map<string, string[]>();
for (const [component, library] of LIBRARY_TOKENS) byLibraryToken.set(library, [...(byLibraryToken.get(library) ?? []), component]);

const replacements = Object.fromEntries(
  Object.entries(LIBRARY_SELECTORS).map(([name, text]) => [name, csstree.parse(text, { context: "selector" }) as csstree.Selector]),
) as Record<keyof typeof LIBRARY_SELECTORS, csstree.Selector>;

/** The stamp of an earlier preparation, so a published copy saved back as a draft prepares the same way. */
const earlierStamp = /^((?:@charset "[^"]*";\s*)?)\/\* Design system 1 library, revision sha256:[0-9a-f]{12} \*\/\n/;

/** A draft without what an earlier preparation added before the owner's rules. */
function withoutEarlier(draft: string): string {
  let source = (draft.charCodeAt(0) === 0xfeff ? draft.slice(1) : draft).replace(earlierStamp, "$1");
  const base = source.indexOf(LIBRARY_BUTTON_LINK_BASE);
  if (base >= 0) source = source.slice(0, base) + source.slice(base + LIBRARY_BUTTON_LINK_BASE.length).replace(/^\n/, "");
  return source;
}

/**
 * Prepare a library draft for publishing, the step between the owner's draft and the published
 * bytes. It changes nothing the owner wrote, it only adds:
 *
 * - after each `--one-*` token in LIBRARY_TOKENS, in the same rule, the `--ds-*` component token
 *   that follows it (`--ds-corner-size: var(--one-radius)`), unless that rule sets it itself, so
 *   DS1's components take the library's look wherever, and in whatever scheme, the library sets it;
 * - the button-link faces: every `button` selector also matches `a[data-library-button]`, `a`
 *   selectors leave it out, and `:disabled` also matches it with `aria-disabled="true"`, all
 *   through `:where()` so no selector's specificity changes. A rule that already names
 *   `data-library-button` is the owner's and stays as written; keyframe steps are not selectors;
 * - a base rule that takes a button-link's underline away, before every rule of the library's;
 * - a first line naming the revision of these rules.
 *
 * Preparing a prepared stylesheet gives the same stylesheet.
 */
export function prepareLibrary(draft: string): PreparedLibrary {
  const source = withoutEarlier(draft);
  const edits: Edit[] = [];
  let ast: csstree.StyleSheet | undefined;
  try {
    ast = csstree.parse(source, { positions: true, parseValue: false, parseCustomProperty: false, parseAtrulePrelude: false, onParseError() {} }) as csstree.StyleSheet;
  } catch {
    ast = undefined;
  }
  // The base rule comes before the owner's first rule, after @charset and the @imports that must lead.
  let lead = 0;
  for (const node of ast?.children.toArray() ?? []) {
    if (node.type === "Atrule" && /^(?:charset|import)$/i.test(node.name) && !node.block && node.loc) lead = node.loc.end.offset;
    else if (node.type !== "Comment") break;
  }
  edits.push({ start: lead, end: lead, text: lead ? `\n${LIBRARY_BUTTON_LINK_BASE}` : `${LIBRARY_BUTTON_LINK_BASE}\n` });
  if (ast) {
    csstree.walk(ast, {
      enter(this: csstree.WalkContext, node: csstree.CssNode) {
        const inKeyframes = Boolean(this.atrule && /keyframes$/i.test(this.atrule.name));
        if (node.type === "Rule" && !inKeyframes) {
          const edit = selectorEdit(source, node);
          if (edit) edits.push(edit);
        }
        if (node.type === "Block" && !inKeyframes) edits.push(...tokenEdits(source, node));
      },
    });
  }
  // Later edits first, so earlier offsets hold; at one offset, insertions keep their order.
  const ordered = edits.map((edit, index) => ({ edit, index })).sort((a, b) => b.edit.start - a.edit.start || b.index - a.index);
  let css = source;
  for (const { edit } of ordered) css = css.slice(0, edit.start) + edit.text + css.slice(edit.end);
  const charset = /^@charset "[^"]*";\s*/.exec(css)?.[0] ?? "";
  css = `${charset}${libraryStamp()}\n${css.slice(charset.length)}`;
  return { css, revision: LIBRARY_REVISION, transform: `ds1-library@${LIBRARY_REVISION}` };
}

/** The rule's selectors with the button-link faces, when they name a button, a link or :disabled. */
function selectorEdit(source: string, rule: csstree.Rule): Edit | undefined {
  const prelude = rule.prelude;
  if (prelude.type !== "SelectorList" || !prelude.loc) return undefined;
  const start = prelude.loc.start.offset, end = prelude.loc.end.offset;
  if (source.slice(start, end).includes(LIBRARY_BUTTON_LINK)) return undefined;
  const copy = csstree.clone(prelude) as csstree.SelectorList;
  // Found first and replaced after, so a replacement is never itself rewritten.
  const found: { item: csstree.ListItem<csstree.CssNode>; list: csstree.List<csstree.CssNode>; name: keyof typeof LIBRARY_SELECTORS }[] = [];
  csstree.walk(copy, {
    enter(node: csstree.CssNode, item: csstree.ListItem<csstree.CssNode>, list: csstree.List<csstree.CssNode>) {
      if (!item || !list) return;
      if (node.type === "TypeSelector" && !node.name.includes("|")) {
        const name = node.name.toLowerCase();
        if (name === "button" || name === "a") found.push({ item, list, name });
      }
      // Only where a link could match: `input:disabled` and `select:disabled` stay as written.
      const other = list.toArray().some(sibling => sibling.type === "TypeSelector" && !["button", "*"].includes(sibling.name.toLowerCase()));
      if (node.type === "PseudoClassSelector" && node.name.toLowerCase() === "disabled" && !node.children && !other) found.push({ item, list, name: ":disabled" });
    },
  });
  if (!found.length) return undefined;
  for (const { item, list, name } of found) list.replace(item, (csstree.clone(replacements[name]) as csstree.Selector).children);
  return { start, end, text: csstree.generate(copy) };
}

/** The component tokens that follow the library tokens a declaration block sets. */
function tokenEdits(source: string, block: csstree.Block): Edit[] {
  const declarations = block.children.toArray().filter((node): node is csstree.Declaration => node.type === "Declaration");
  const declared = new Set(declarations.map(declaration => declaration.property));
  const edits: Edit[] = [];
  for (const declaration of declarations) {
    const components = byLibraryToken.get(declaration.property);
    if (!components || !declaration.loc) continue;
    const end = declaration.loc.end.offset;
    const lineStart = source.lastIndexOf("\n", declaration.loc.start.offset - 1) + 1;
    const lead = source.slice(lineStart, declaration.loc.start.offset);
    const indent = /^[ \t]*$/.test(lead) ? `\n${lead}` : " ";
    const important = declaration.important ? " !important" : "";
    const added = components.filter(component => !declared.has(component));
    if (!added.length) continue;
    edits.push({ start: end, end, text: added.map(component => `;${indent}${component}: var(${declaration.property})${important}`).join("") });
  }
  return edits;
}
