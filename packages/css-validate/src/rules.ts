import * as csstree from "css-tree";

import {
  ALLOWED_DATA_URL_TYPES,
  classifyUrl,
  decodeDataUrlPayload,
  isAllowedHost,
  svgPayloadIsScriptable,
} from "./hosts";
import type { Issue } from "./types";

/**
 * At-rules a published library may use. Anything outside this list is rejected
 * rather than passed through, so a future CSS feature has to be reviewed before
 * it can reach a customer's page.
 */
export const ALLOWED_AT_RULES: readonly string[] = [
  "charset",
  "import",
  "layer",
  "media",
  "supports",
  "container",
  "scope",
  "page",
  "font-face",
  "font-feature-values",
  "counter-style",
  "keyframes",
  "property",
];

/** Properties whose historical behaviour is script execution, not styling. */
const DISALLOWED_PROPERTIES: readonly string[] = ["-moz-binding", "behavior"];

export interface RuleContext {
  allowedHosts: readonly string[];
  allowDataUrls: boolean;
  maxDataUrlBytes: number;
  maxImports: number;
  push: (issue: Issue) => void;
}

type AnyNode = csstree.CssNode & {
  loc?: { start: { offset: number; line: number; column: number } } | null;
};

function position(node: AnyNode): Pick<Issue, "line" | "column" | "offset"> {
  const start = node.loc?.start;
  if (!start) return {};
  return { line: start.line, column: start.column, offset: start.offset };
}

function clip(value: string, max = 120): string {
  const collapsed = value.replace(/\s+/g, " ").trim();
  return collapsed.length > max ? `${collapsed.slice(0, max - 1)}…` : collapsed;
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

/**
 * Read the literal URL out of a `Url` or `String` node.
 *
 * css-tree has carried two shapes for `Url.value` across major versions — a
 * plain string (v2+) and a nested `{ type: 'String' | 'Raw', value }` node (v1).
 * Both are handled so a dependency bump cannot silently disable the host checks.
 * `dynamic` marks a value the parser could not resolve to a literal.
 */
export function readUrlLiteral(node: AnyNode): { value: string; dynamic: boolean } | null {
  if (node.type === "Url") {
    const raw = (node as unknown as { value: unknown }).value;
    if (typeof raw === "string") return { value: stripQuotes(raw), dynamic: false };
    if (raw && typeof raw === "object") {
      const inner = raw as { type?: string; value?: unknown };
      const text = typeof inner.value === "string" ? inner.value : "";
      return { value: stripQuotes(text), dynamic: inner.type === "Raw" };
    }
    return { value: "", dynamic: true };
  }

  if (node.type === "String") {
    const raw = (node as unknown as { value: unknown }).value;
    return { value: stripQuotes(typeof raw === "string" ? raw : ""), dynamic: false };
  }

  return null;
}

function stripQuotes(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length >= 2) {
    const first = trimmed[0];
    const last = trimmed[trimmed.length - 1];
    if ((first === '"' || first === "'") && first === last) return trimmed.slice(1, -1);
  }
  return trimmed;
}

/**
 * Walk the parsed stylesheet and report every rule violation.
 *
 * Selectors are deliberately not policed: a custom stylesheet is allowed
 * to restyle `html`, `body`, and every bare element, so any broad-selector rule
 * would fire on the stock DS1 sheet itself.
 */
export function collectAstIssues(ast: csstree.CssNode, ctx: RuleContext): void {
  /** Url/String nodes already validated as an `@import` target. */
  const importTargets = new Set<csstree.CssNode>();
  let importCount = 0;
  let importLimitReported = false;

  csstree.walk(ast, {
    enter(node: csstree.CssNode) {
      switch (node.type) {
        case "Atrule":
          handleAtrule(node as AnyNode, ctx, importTargets, () => {
            importCount += 1;
            if (importCount > ctx.maxImports && !importLimitReported) {
              importLimitReported = true;
              ctx.push({
                code: "too_many_imports",
                severity: "error",
                message: `At most ${ctx.maxImports} @import rules are allowed; found more.`,
                ...position(node as AnyNode),
              });
            }
          });
          break;

        case "Url":
          if (!importTargets.has(node)) checkUrlNode(node as AnyNode, ctx, "disallowed_url_host");
          break;

        case "Declaration":
          handleDeclaration(node as AnyNode, ctx);
          break;

        case "Function":
          if ((node as csstree.FunctionNode).name.toLowerCase() === "expression") {
            ctx.push({
              code: "disallowed_construct",
              severity: "error",
              message: "expression() is a script-execution construct and is not allowed.",
              ...position(node as AnyNode),
            });
          }
          break;

        default:
          break;
      }
    },
  });
}

function handleAtrule(
  node: AnyNode,
  ctx: RuleContext,
  importTargets: Set<csstree.CssNode>,
  onImport: () => void,
): void {
  const atrule = node as csstree.Atrule;
  const name = atrule.name.toLowerCase();

  if (!ALLOWED_AT_RULES.includes(name)) {
    ctx.push({
      code: "unknown_at_rule",
      severity: "error",
      message: `@${name} is not an allowed at-rule.`,
      ...position(node),
    });
    return;
  }

  if (name === "charset") {
    const offset = node.loc?.start.offset;
    if (offset !== undefined && offset !== 0) {
      ctx.push({
        code: "charset_position",
        severity: "error",
        message: "@charset must be the very first thing in the stylesheet.",
        ...position(node),
      });
    }
    return;
  }

  if (name !== "import") return;

  onImport();

  const target = findImportTarget(atrule);
  if (!target) {
    ctx.push({
      code: "unresolvable_url",
      severity: "error",
      message: "@import has no readable URL.",
      detail: clip(safeGenerate(atrule.prelude)),
      ...position(node),
    });
    return;
  }

  importTargets.add(target);
  checkUrlNode(target as AnyNode, ctx, "disallowed_import_host");
}

function findImportTarget(atrule: csstree.Atrule): csstree.CssNode | null {
  const prelude = atrule.prelude;
  if (!prelude || prelude.type !== "AtrulePrelude") return null;

  let found: csstree.CssNode | null = null;
  csstree.walk(prelude, (child: csstree.CssNode) => {
    if (found) return;
    if (child.type === "Url" || child.type === "String") found = child;
  });
  return found;
}

function safeGenerate(node: csstree.CssNode | null | undefined): string {
  if (!node) return "";
  try {
    return csstree.generate(node);
  } catch {
    return "";
  }
}

function checkUrlNode(
  node: AnyNode,
  ctx: RuleContext,
  hostCode: "disallowed_url_host" | "disallowed_import_host",
): void {
  const literal = readUrlLiteral(node);
  const pos = position(node);

  if (!literal) return;

  // Dynamic URL construction defeats the allowlist, so it is rejected outright
  // rather than guessed at. Note that css-tree already reports `url(var(--x))`
  // and unquoted URLs containing parentheses as parse errors and exposes them
  // as Raw rather than Url, so this is a second line of defence — it must not
  // reject parentheses in general, which are legal inside a quoted url().
  if (literal.dynamic || /\bvar\s*\(/i.test(literal.value)) {
    ctx.push({
      code: "unresolvable_url",
      severity: "error",
      message: "url() must be a literal URL; computed or function-built URLs are not allowed.",
      detail: clip(literal.value),
      ...pos,
    });
    return;
  }

  if (literal.value === "") {
    ctx.push({
      code: "unresolvable_url",
      severity: "error",
      message: "url() is empty.",
      ...pos,
    });
    return;
  }

  const classified = classifyUrl(literal.value);

  switch (classified.kind) {
    // Fragment references (fill: url(#gradient), filter: url(#blur)) resolve
    // against the customer's own document and make no network request.
    case "fragment":
      return;

    case "https":
      if (!isAllowedHost(classified.host, ctx.allowedHosts)) {
        ctx.push({
          code: hostCode,
          severity: "error",
          message: `${classified.host} is not an allowed host. Allowed: ${ctx.allowedHosts.join(", ")}.`,
          detail: clip(literal.value),
          ...pos,
        });
      }
      return;

    case "insecure-scheme":
      ctx.push({
        code: hostCode,
        severity: "error",
        message: "Only https URLs are allowed; http would be blocked as mixed content anyway.",
        detail: clip(literal.value),
        ...pos,
      });
      return;

    case "protocol-relative":
      ctx.push({
        code: hostCode,
        severity: "error",
        message: "Protocol-relative URLs (//host/…) are not allowed; use an absolute https URL.",
        detail: clip(literal.value),
        ...pos,
      });
      return;

    case "relative":
      ctx.push({
        code: "unresolvable_url",
        severity: "error",
        message:
          "Relative URLs resolve against the hosted stylesheet's own path and cannot reach your assets. Use an absolute https URL.",
        detail: clip(literal.value),
        ...pos,
      });
      return;

    case "data":
      checkDataUrl(classified, literal.value, ctx, pos);
      return;

    case "other-scheme":
      ctx.push({
        code: hostCode,
        severity: "error",
        message: `The ${classified.scheme}: scheme is not allowed in a published stylesheet.`,
        detail: clip(literal.value),
        ...pos,
      });
      return;
  }
}

function checkDataUrl(
  classified: { kind: "data"; mime: string; base64: boolean; payload: string },
  raw: string,
  ctx: RuleContext,
  pos: Pick<Issue, "line" | "column" | "offset">,
): void {
  if (!ctx.allowDataUrls) {
    ctx.push({
      code: "data_url_type",
      severity: "error",
      message: "data: URLs are not allowed.",
      ...pos,
    });
    return;
  }

  if (!ALLOWED_DATA_URL_TYPES.includes(classified.mime)) {
    ctx.push({
      code: "data_url_type",
      severity: "error",
      message: `data: URLs of type ${classified.mime} are not allowed. Allowed: ${ALLOWED_DATA_URL_TYPES.join(", ")}.`,
      ...pos,
    });
    return;
  }

  const size = byteLength(raw);
  if (size > ctx.maxDataUrlBytes) {
    ctx.push({
      code: "data_url_too_large",
      severity: "error",
      message: `A data: URL is ${size} bytes; the limit is ${ctx.maxDataUrlBytes}.`,
      ...pos,
    });
    return;
  }

  if (classified.mime !== "image/svg+xml") return;

  const decoded = decodeDataUrlPayload(classified.payload, classified.base64);
  if (decoded === null) {
    ctx.push({
      code: "data_url_type",
      severity: "error",
      message: "This data:image/svg+xml payload could not be decoded for inspection.",
      ...pos,
    });
    return;
  }

  if (svgPayloadIsScriptable(decoded)) {
    ctx.push({
      code: "disallowed_construct",
      severity: "error",
      message: "Embedded SVG contains a script or an inline event handler.",
      ...pos,
    });
  }
}

function handleDeclaration(node: AnyNode, ctx: RuleContext): void {
  const declaration = node as csstree.Declaration;
  const property = declaration.property.toLowerCase().trim();

  if (DISALLOWED_PROPERTIES.includes(property)) {
    ctx.push({
      code: "disallowed_construct",
      severity: "error",
      message: `The ${property} property can execute script and is not allowed.`,
      ...position(node),
    });
    return;
  }

  // Custom property values are a raw token stream, so url()/expression() inside
  // them never reach the Url/Function visitors. Scan the generated text instead.
  if (property.startsWith("--")) {
    const text = safeGenerate(declaration.value);
    if (/\bexpression\s*\(/i.test(text)) {
      ctx.push({
        code: "disallowed_construct",
        severity: "error",
        message: "expression() is a script-execution construct and is not allowed.",
        ...position(node),
      });
    }
    scanRawUrls(text, ctx, position(node));
  }
}

/** Last-resort literal scan for url(...) in text css-tree exposed as Raw. */
function scanRawUrls(text: string, ctx: RuleContext, pos: Pick<Issue, "line" | "column" | "offset">): void {
  const pattern = /\burl\(\s*(?:"([^"]*)"|'([^']*)'|([^)"'\s][^)]*?))\s*\)/gi;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    const value = (match[1] ?? match[2] ?? match[3] ?? "").trim();
    if (value === "") continue;

    const classified = classifyUrl(value);
    if (classified.kind === "fragment") continue;
    if (classified.kind === "https" && isAllowedHost(classified.host, ctx.allowedHosts)) continue;
    if (classified.kind === "data") {
      checkDataUrl(classified, value, ctx, pos);
      continue;
    }

    ctx.push({
      code: "disallowed_url_host",
      severity: "error",
      message: "url() inside a custom property must point at an allowed https host.",
      detail: clip(value),
      ...pos,
    });
  }
}
