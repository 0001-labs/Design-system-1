/**
 * Team CMS's Markdown, shared by the Worker (which renders every saved edit),
 * the app (which shows the words live as they are typed) and the build step
 * (which writes the built words as Markdown into the manifest).
 *
 * A field is one element, so rendering is inline only: `**strong**`, `*em*`,
 * `` `code` ``, `[words](href)` with a safe address, and line breaks as
 * `<br>`. A backslash keeps the next punctuation mark as it is. Everything
 * else is escaped, so whatever a person types can never become markup of its
 * own. No imports and only erasable TypeScript, so Node runs it as it is.
 */

/** The longest Markdown a field takes, in characters. */
export const MARKDOWN_LIMIT = 10_000;

/** Deeper nesting than this is written as it stands. */
const MAX_DEPTH = 8;

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, ch => (ch === "&" ? "&amp;" : ch === "<" ? "&lt;" : ch === ">" ? "&gt;" : ch === "\"" ? "&quot;" : "&#39;"));
}

/**
 * Whether an address may be a link: `http(s):`, `mailto:` and `tel:`, a path
 * from the root, a fragment, or a relative address with no scheme at all.
 * `javascript:`, `data:` and every other scheme are refused, as are spaces and
 * control characters.
 */
export function safeHref(href: string): boolean {
  const value = href.trim();
  if (!value || /[\s\u0000-\u001f\u007f]/.test(value)) return false;
  if (/^(https?:|mailto:|tel:)/i.test(value)) return true;
  return !/^[a-z][a-z0-9+.-]*:/i.test(value);
}

type Emit = {
  text(text: string): string;
  strong(inner: string): string;
  em(inner: string): string;
  code(text: string): string;
  link(inner: string, href: string): string;
  br(): string;
};

const HTML: Emit = {
  text: escapeHtml,
  strong: inner => `<strong>${inner}</strong>`,
  em: inner => `<em>${inner}</em>`,
  code: text => `<code>${escapeHtml(text)}</code>`,
  link: (inner, href) => `<a href="${escapeHtml(href.trim())}">${inner}</a>`,
  br: () => "<br>",
};

const PLAIN: Emit = {
  text: text => text,
  strong: inner => inner,
  em: inner => inner,
  code: text => text,
  link: inner => inner,
  br: () => " ",
};

const PUNCTUATION = /[!-\/:-@\[-`{-~]/;

/**
 * One pass over the source. `close` is the delimiter that ends the current
 * span; a span whose closer never comes is null, and its opener is then read
 * as a plain character. Failed attempts are remembered by position, so a long
 * run of unmatched stars stays linear.
 */
function inline(src: string, emit: Emit): string {
  const failed = new Set<string>();

  const run = (start: number, close: string | null, depth: number, inLink: boolean): [string, number] | null => {
    let out = "";
    let pos = start;
    while (pos < src.length) {
      const ch = src[pos];
      if (close === "**" && src.startsWith("**", pos)) return [out, pos];
      if (close === "*" && ch === "*" && src[pos + 1] !== "*") return [out, pos];
      if (close === "]" && ch === "]") return [out, pos];
      if (ch === "\\" && pos + 1 < src.length && PUNCTUATION.test(src[pos + 1])) {
        out += emit.text(src[pos + 1]);
        pos += 2;
        continue;
      }
      if (ch === "\\" && src[pos + 1] === "\n") {
        out += emit.br();
        pos += 2;
        continue;
      }
      if (ch === "\n") {
        out += emit.br();
        pos += 1;
        continue;
      }
      // Spaces before a break are the break's, as Markdown's two-space break is.
      if (ch === " " && /^ +\n/.test(src.slice(pos, pos + 64))) {
        pos = src.indexOf("\n", pos);
        continue;
      }
      if (ch === "`") {
        const end = src.indexOf("`", pos + 1);
        if (end > pos + 1) {
          out += emit.code(src.slice(pos + 1, end));
          pos = end + 1;
          continue;
        }
      }
      if (ch === "*" && depth < MAX_DEPTH) {
        const strong = src.startsWith("**", pos);
        const opener = strong ? "**" : "*";
        const from = pos + opener.length;
        const id = `${from}:${opener}:${inLink}`;
        if (!failed.has(id) && from < src.length && src[from] !== " ") {
          const inner = run(from, opener, depth + 1, inLink);
          if (inner && inner[0] && src[inner[1] - 1] !== " ") {
            out += strong ? emit.strong(inner[0]) : emit.em(inner[0]);
            pos = inner[1] + opener.length;
            continue;
          }
          failed.add(id);
        }
        // A closing star of the span around this one: let that span end here.
        if (close === "*" && strong) return [out, pos];
      }
      if (ch === "[" && !inLink && depth < MAX_DEPTH) {
        const id = `${pos + 1}:]`;
        if (!failed.has(id)) {
          const label = run(pos + 1, "]", depth + 1, true);
          if (label && src[label[1] + 1] === "(") {
            const end = src.indexOf(")", label[1] + 2);
            const href = end > 0 ? src.slice(label[1] + 2, end) : "";
            if (end > 0 && !href.includes("\n")) {
              out += safeHref(href) ? emit.link(label[0], href) : label[0];
              pos = end + 1;
              continue;
            }
          }
          failed.add(id);
        }
      }
      out += emit.text(ch);
      pos += 1;
    }
    return close ? null : [out, pos];
  };

  return run(0, null, 0, false)?.[0] ?? "";
}

/** A field's Markdown as the inline HTML that goes inside its element. */
export function renderMarkdown(markdown: string): string {
  return inline(markdown.replace(/\r\n?/g, "\n"), HTML);
}

/** A field's Markdown as plain words, for the title and description: marks dropped, breaks as spaces. */
export function plainText(markdown: string): string {
  return inline(markdown.replace(/\r\n?/g, "\n"), PLAIN).replace(/\s+/g, " ").trim();
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'", nbsp: " ", ndash: "–", mdash: "—", hellip: "…", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", shy: "­", copy: "©", reg: "®", trade: "™", euro: "€" };

export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, (whole, name: string) => {
    if (name[0] === "#") {
      const code = name[1] === "x" || name[1] === "X" ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : whole;
    }
    return ENTITIES[name.toLowerCase()] ?? whole;
  });
}

/** Characters that would read as Markdown, kept as they are with a backslash. */
const escapeMarkdown = (text: string) => text.replace(/[\\*`\[\]]/g, ch => `\\${ch}`);

/**
 * Inline HTML from the build as Markdown, for the manifest's built words.
 * `strong`/`b`, `em`/`i`, `code`, `a` and `br` become their Markdown; any
 * other tag is dropped and its words kept. Whitespace collapses as the
 * browser shows it.
 */
export function htmlToMarkdown(html: string): string {
  const stack: { tag: string; href?: string; start: number }[] = [];
  let out = "";
  const pattern = /<!--[\s\S]*?-->|<\/?([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[^\s"'>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))?)*)\s*\/?>|([^<]+|<)/g;
  for (const match of html.matchAll(pattern)) {
    const [whole, tagName, attrs, text] = match;
    if (text !== undefined) {
      out += escapeMarkdown(decodeEntities(text).replace(/[\t\n\f\r ]+/g, " "));
      continue;
    }
    if (!tagName) continue;
    const tag = tagName.toLowerCase();
    const closing = whole.startsWith("</");
    if (tag === "br") {
      out = out.replace(/ +$/, "") + "\n";
      continue;
    }
    const mark = tag === "strong" || tag === "b" ? "**" : tag === "em" || tag === "i" ? "*" : tag === "code" ? "`" : tag === "a" ? "a" : null;
    if (!mark) continue;
    if (!closing) {
      const href = tag === "a" ? /(?:^|\s)href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i.exec(attrs ?? "") : null;
      stack.push({ tag: mark, href: href ? decodeEntities(href[1] ?? href[2] ?? href[3] ?? "") : undefined, start: out.length });
      if (mark !== "a") out += mark;
      continue;
    }
    const at = stack.map(open => open.tag).lastIndexOf(mark);
    if (at < 0) continue;
    const [open] = stack.splice(at, 1);
    if (mark === "a") {
      const words = out.slice(open.start);
      out = open.href && safeHref(open.href) ? `${out.slice(0, open.start)}[${words}](${open.href.trim().replace(/[()\s]/g, encodeURIComponent)})` : out;
    } else if (out.length === open.start + mark.length) {
      out = out.slice(0, open.start);
    } else {
      // Spaces at a mark's edge stay outside it, where Markdown reads them.
      const inner = out.slice(open.start + mark.length);
      const lead = inner.match(/^\s*/)![0];
      const trail = inner.slice(lead.length).match(/\s*$/)![0];
      const core = inner.slice(lead.length, inner.length - trail.length);
      out = core ? `${out.slice(0, open.start)}${lead}${mark}${mark === "`" ? core.replace(/\\(.)/g, "$1") : core}${mark}${trail}` : `${out.slice(0, open.start)}${inner}`;
    }
  }
  // A mark left open by broken markup keeps its words, not its stars.
  for (const open of stack.reverse()) if (open.tag !== "a") out = out.slice(0, open.start) + out.slice(open.start + open.tag.length);
  return out.replace(/ *\n */g, "\n").replace(/^[ \n]+|[ \n]+$/g, "");
}
