/**
 * Markdown and MDX that a site compiles into its pages.
 *
 * A `.mdx` file is always compiled. A `.md` file counts only in an Astro
 * project's `src/pages` or `src/content` folders; elsewhere Markdown is a
 * README, a licence, or text the app reads as data and draws with its own
 * renderer, whose templates already count once, like a loop.
 *
 * Paragraphs and headings count as text, a list once as a list and a table once
 * as a table, at the line where each block starts. They are prose when the
 * renderer that draws the document is DS1's: a Starlight site whose
 * `MarkdownContent` component wraps its slot in an element marked
 * `data-ds-prose`, for the documents in `src/content/docs`. The nearest
 * `data-ds-prose` or `data-ds-not-prose` element written in the document itself
 * still decides. Any other renderer is local text. Markup and component uses in
 * MDX, and HTML in Markdown, are read like markup; code blocks, inline code,
 * frontmatter and MDX imports and exports are not sites.
 */
import { existsSync, readFileSync } from "node:fs";
import { join, posix } from "node:path";

type Site = { tag: string; line: number; prose?: boolean };
export type ReadMarkup<S extends Site> = (file: string, source: string) => S[];

const astroConfigs = ["astro.config.mjs", "astro.config.js", "astro.config.ts", "astro.config.mts", "astro.config.cjs"];
/** The Astro project a page or content file belongs to, relative to the app. */
function astroProject(root: string, file: string): string | undefined {
  const match = /^(?:(.*?)\/)?src\/(?:pages|content)\//.exec(file);
  if (!match) return undefined;
  const dir = match[1] ?? "";
  return astroConfigs.some(name => existsSync(join(root, dir, name))) ? dir : undefined;
}

const blank = (text: string) => text.replace(/[^\n]/g, " ");
/** Markup without comments, frontmatter, scripts and styles, at the same offsets. */
const markupOnly = (text: string) => text.replace(/^---[\s\S]*?\n---/, blank).replace(/<!--[\s\S]*?-->/g, blank).replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, blank);
const voidTags = /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/i;
/** For each offset, whether the nearest open element marked data-ds-prose or data-ds-not-prose is prose. */
export function proseAt(text: string, offsets: number[], initial: boolean): boolean[] {
  const stack: { tag: string; prose?: boolean }[] = [];
  const state = () => [...stack].reverse().find(open => open.prose !== undefined)?.prose ?? initial;
  const order = offsets.map((offset, index) => ({ offset, index })).sort((a, b) => a.offset - b.offset);
  const answers: boolean[] = [];
  let next = 0;
  for (const match of markupOnly(text).matchAll(/<(\/?)([A-Za-z][\w.:-]*)([^>]*)>/g)) {
    while (next < order.length && order[next]!.offset < match.index!) answers[order[next++]!.index] = state();
    const [, closing, tag, attributes] = match as unknown as [string, string, string, string];
    if (closing) {
      let at = stack.length - 1;
      while (at >= 0 && stack[at]!.tag !== tag) at--;
      if (at >= 0) stack.length = at;
      continue;
    }
    if (/\/\s*$/.test(attributes) || voidTags.test(tag)) continue;
    stack.push({ tag, prose: /(?:^|\s)data-ds-not-prose(?=[\s=/]|$)/.test(attributes) ? false : /(?:^|\s)data-ds-prose(?=[\s=/]|$)/.test(attributes) ? true : undefined });
  }
  while (next < order.length) answers[order[next++]!.index] = state();
  return answers;
}

/** Whether a component's slot sits inside an element marked data-ds-prose. */
export function slotInProse(component: string): boolean {
  const slot = markupOnly(component).search(/<slot(?=[\s/>])/);
  return slot >= 0 && proseAt(component, [slot], false)[0] === true;
}

/** Markdown block starts: [tag, zero-based line] for paragraphs, headings, lists and tables. */
export function markdownBlocks(lines: string[]): [string, number][] {
  const found: [string, number][] = [];
  const empty = (line: string | undefined) => line === undefined || !line.trim();
  const heading = /^ {0,3}(#{1,6})(?:\s|$)/, rule = /^ {0,3}([-*_])(?:\s*\1){2,}\s*$/, item = /^ {0,3}([-*+]|\d{1,9}[.)])(?:\s|$)/, quote = /^ {0,3}>/;
  const markup = /^ {0,3}(?:<[A-Za-z/!]|\{)/, delimiter = /^\s*\|?\s*:?-+:?\s*(?:\|\s*:?-+:?\s*)*\|?\s*$/;
  const walk = (block: string[], offset: number) => {
    for (let i = 0; i < block.length;) {
      const line = block[i]!;
      if (empty(line)) { i++; continue; }
      const heads = heading.exec(line);
      if (heads) { found.push([`h${heads[1]!.length}`, offset + i]); i++; continue; }
      if (rule.test(line)) { i++; continue; }
      if (markup.test(line) || /^( {4}|\t)/.test(line) || /^ {0,3}\[[^\]]+\]:\s*\S/.test(line)) {
        while (i < block.length && !empty(block[i])) i++;
        continue;
      }
      const list = item.exec(line);
      if (list) {
        found.push([/\d/.test(list[1]!) ? "ol" : "ul", offset + i]);
        for (i++; i < block.length; i++) {
          const current = block[i]!;
          if (empty(current)) {
            let ahead = i + 1;
            while (ahead < block.length && empty(block[ahead])) ahead++;
            if (ahead < block.length && (/^\s/.test(block[ahead]!) || item.test(block[ahead]!))) { i = ahead - 1; continue; }
            break;
          }
          if (!/^\s/.test(current) && (heading.test(current) || rule.test(current) || quote.test(current))) break;
        }
        continue;
      }
      if (quote.test(line)) {
        const start = i;
        while (i < block.length && !empty(block[i])) i++;
        walk(block.slice(start, i).map(text => text.replace(/^ {0,3}> ?/, "")), offset + start);
        continue;
      }
      if (line.includes("|") && delimiter.test(block[i + 1] ?? "") && (block[i + 1] ?? "").includes("-")) {
        found.push(["table", offset + i]);
        while (i < block.length && !empty(block[i])) i++;
        continue;
      }
      const start = i;
      let tag = "p";
      for (i++; i < block.length && !empty(block[i]); i++) {
        const current = block[i]!;
        if (/^ {0,3}=+\s*$/.test(current)) { tag = "h1"; i++; break; }
        if (/^ {0,3}-+\s*$/.test(current)) { tag = "h2"; i++; break; }
        if (heading.test(current) || rule.test(current) || quote.test(current) || markup.test(current) || /^ {0,3}(?:[-*+]|1[.)])\s/.test(current)) break;
      }
      found.push([tag, offset + start]);
    }
  };
  walk(lines, 0);
  return found;
}

/** Block sites carry only a tag, a line and prose, which every site type allows. */
export interface MarkdownDocument<S extends Site> { sites: S[]; code: string }

/** The sites of one Markdown or MDX document, and its MDX imports as code for adapter resolution. */
export function markdownSites<S extends Site>(file: string, source: string, inProse: boolean, readMarkup: ReadMarkup<S>): MarkdownDocument<S> {
  const lines = source.split("\n");
  const code = lines.map(() => "");
  let i = 0;
  if (lines[0]?.trim() === "---") {
    const end = lines.findIndex((line, at) => at > 0 && line.trim() === "---");
    for (; i <= (end < 0 ? lines.length - 1 : end); i++) lines[i] = "";
  }
  for (; i < lines.length; i++) {
    const fence = /^\s*(`{3,}|~{3,})/.exec(lines[i]!);
    if (fence) {
      const close = new RegExp(`^\\s*${fence[1]![0] === "`" ? "`" : "~"}{${fence[1]!.length},}\\s*$`);
      lines[i] = "";
      for (i++; i < lines.length && !close.test(lines[i]!); i++) lines[i] = "";
      if (i < lines.length) lines[i] = "";
      continue;
    }
    if (/\.mdx$/i.test(file) && /^(?:import|export)\b/.test(lines[i]!)) {
      for (; i < lines.length && lines[i]!.trim(); i++) { code[i] = lines[i]!; lines[i] = ""; }
    }
  }
  // Inline code becomes letters, not spaces, so a line that opens with it is not read as indented code.
  for (let at = 0; at < lines.length; at++) lines[at] = lines[at]!.replace(/``[^\n]*?``|`[^`\n]*`/g, code => "x".repeat(code.length));
  const text = lines.join("\n");
  // The renderer's prose scope opens before the document, on its first line.
  const markup = readMarkup("document.html", inProse ? `<div data-ds-prose>${text}</div>` : text).slice(inProse ? 1 : 0);
  const blocks = markdownBlocks(lines);
  const starts: number[] = [];
  for (let at = 0, offset = 0; at < lines.length; offset += lines[at]!.length + 1, at++) starts.push(offset);
  const prose = proseAt(text, blocks.map(([, line]) => starts[line]!), inProse);
  const sites: S[] = [...markup, ...blocks.map(([tag, line], at) => ({ tag, line: line + 1, ...(prose[at] ? { prose: true } : {}) }) as S)];
  return { sites: sites.sort((a, b) => a.line - b.line), code: code.join("\n") };
}

/** Which Markdown an app compiles, and which of it DS1's prose sheet draws. */
export function markdownScope(root: string) {
  const docs = new Map<string, string | undefined>();
  /** The docs folder a Starlight site renders inside data-ds-prose, if it does. */
  const proseDocs = (dir: string) => {
    if (docs.has(dir)) return docs.get(dir);
    const config = astroConfigs.map(name => join(root, dir, name)).find(path => existsSync(path));
    const body = config ? readFileSync(config, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "") : "";
    const component = /@astrojs\/starlight/.test(body) ? /\bMarkdownContent\s*:\s*["'](\.{1,2}\/[^"']+\.astro)["']/.exec(body)?.[1] : undefined;
    const path = component ? join(root, dir, component) : undefined;
    const folder = path && existsSync(path) && slotInProse(readFileSync(path, "utf8")) ? posix.join(dir, "src/content/docs") + "/" : undefined;
    docs.set(dir, folder);
    return folder;
  };
  return {
    includes: (file: string) => /\.mdx$/i.test(file) || (/\.md$/i.test(file) && astroProject(root, file) !== undefined),
    read<S extends Site>(file: string, source: string, readMarkup: ReadMarkup<S>): MarkdownDocument<S> | undefined {
      if (!/\.mdx?$/i.test(file)) return undefined;
      const dir = astroProject(root, file);
      const folder = dir === undefined ? undefined : proseDocs(dir);
      return markdownSites(file, source, folder !== undefined && file.startsWith(folder), readMarkup);
    },
  };
}

export const markdownMethod = [
  "Markdown and MDX: .mdx files and .md files in an Astro project's src/pages or src/content are read; other Markdown (READMEs, or text an app reads as data for its own renderer, whose templates already count once) is not. Paragraphs and headings count as text, each list and table once, at the line its block starts. They count as DS1 styles through a verified prose.css only where DS1's prose sheet draws them: a Starlight site whose MarkdownContent component wraps its slot in data-ds-prose, for src/content/docs. Otherwise they are local text. Markup and component uses in MDX and HTML in Markdown are read like markup; code blocks, inline code, frontmatter and MDX imports are not sites.",
];
