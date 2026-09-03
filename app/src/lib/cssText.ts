/**
 * Text primitives for reading and writing CSS custom properties.
 *
 * These are deliberately free of React and of the `?raw` stylesheet import, so
 * they can be unit tested directly. `App.tsx` is the only consumer today; the
 * library editor will reuse them once drafts are persisted.
 */

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Groups: 1 = `name:` and its spacing, 2 = the value, 3 = the semicolon. */
function customPropertyPattern(name: string) {
  return new RegExp(`(${escapeRegExp(name)}\\s*:\\s*)([^;]+)(;)`);
}

/**
 * Index of the `}` that closes the block opened at `openIndex`, or -1.
 *
 * Comment- and string-aware, so a `}` inside a comment or a quoted value
 * cannot close the block early.
 */
export function matchingBrace(css: string, openIndex: number) {
  let depth = 0;
  let quote = "";

  for (let index = openIndex; index < css.length; index += 1) {
    const char = css[index];

    if (quote) {
      if (char === "\\") index += 1;
      else if (char === quote) quote = "";
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }

    if (char === "/" && css[index + 1] === "*") {
      const close = css.indexOf("*/", index + 2);
      if (close < 0) return -1;
      index = close + 1;
      continue;
    }

    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }

  return -1;
}

/**
 * Body span of the first `:root { … }` block, or null when there isn't one.
 *
 * Token reads and writes must be confined to it. The controls address
 * declarations by name, so an unanchored search silently targets the wrong
 * declaration the moment a user puts a `--one-*` override in a
 * `@media (prefers-color-scheme: dark)` block above `:root` — and once drafts
 * are persisted, that corruption is permanent rather than lasting one session.
 */
export function rootBlockRange(css: string) {
  let depth = 0;
  let quote = "";
  // Start of the prelude of the top-level rule currently being scanned.
  let preludeStart = 0;

  for (let index = 0; index < css.length; index += 1) {
    const char = css[index];

    if (quote) {
      if (char === "\\") index += 1;
      else if (char === quote) quote = "";
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }

    if (char === "/" && css[index + 1] === "*") {
      const close = css.indexOf("*/", index + 2);
      if (close < 0) return null;
      index = close + 1;
      continue;
    }

    if (char === "{") {
      // Only a top-level `:root` counts. A `:root` nested in a preceding
      // `@media` block is textually first but is not what the controls bind to.
      if (depth === 0 && isRootPrelude(css.slice(preludeStart, index))) {
        const end = matchingBrace(css, index);
        return end < 0 ? null : { end, start: index + 1 };
      }
      depth += 1;
      continue;
    }

    if (char === "}") {
      depth = Math.max(0, depth - 1);
      if (depth === 0) preludeStart = index + 1;
      continue;
    }

    // A statement at-rule such as `@import …;` ends the prelude too.
    if (char === ";" && depth === 0) preludeStart = index + 1;
  }

  return null;
}

function isRootPrelude(prelude: string) {
  return /:root(?![\w-])/.test(prelude.replace(/\/\*[\s\S]*?\*\//g, ""));
}

/**
 * Rewrite a custom property's value inside the first `:root` block.
 *
 * Returns the source unchanged when the property is not declared there. Falls
 * back to a whole-file replace only when the stylesheet has no `:root` at all.
 */
export function replaceCustomProperty(css: string, name: string, value: string) {
  const pattern = customPropertyPattern(name);
  const rewrite = (text: string) =>
    text.replace(
      pattern,
      (_match, prefix: string, _previous: string, suffix: string) =>
        `${prefix}${value}${suffix}`,
    );

  const root = rootBlockRange(css);
  if (!root) return rewrite(css);

  const body = css.slice(root.start, root.end);
  return `${css.slice(0, root.start)}${rewrite(body)}${css.slice(root.end)}`;
}

/** Read a custom property's value from the first `:root` block. */
export function readCustomProperty(css: string, name: string) {
  const root = rootBlockRange(css);
  const scope = root ? css.slice(root.start, root.end) : css;
  return scope.match(customPropertyPattern(name))?.[2]?.trim();
}
