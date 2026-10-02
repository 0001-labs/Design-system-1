import * as csstree from "css-tree";

import { DEFAULT_ALLOWED_HOSTS } from "./hosts";
import { collectAstIssues, type RuleContext } from "./rules";
import { MAX_ISSUES, type Issue, type ValidateOptions, type ValidateResult } from "./types";

export { DEFAULT_ALLOWED_HOSTS, ALLOWED_DATA_URL_TYPES } from "./hosts";
export { ALLOWED_AT_RULES } from "./rules";
export { MAX_ISSUES } from "./types";
export type { Issue, IssueCode, Severity, ValidateOptions, ValidateResult } from "./types";

const DEFAULT_MAX_BYTES = 512 * 1024;
const DEFAULT_WARN_BYTES = 128 * 1024;
const DEFAULT_MAX_DATA_URL_BYTES = 64 * 1024;
const DEFAULT_MAX_IMPORTS = 5;

/**
 * Validate a stylesheet before it becomes a published artifact.
 *
 * The same module runs in two places and they can legitimately disagree — a
 * user on a cached SPA bundle may run an older ruleset than the deployed
 * Worker. The client copy is **advisory**, driving inline editor feedback; the
 * copy in the publish handler is **authoritative**. The UI must therefore be
 * able to render server-returned issues in the same component as its own.
 */
export function validateCss(css: string, options: ValidateOptions = {}): ValidateResult {
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const warnBytes = options.warnBytes ?? DEFAULT_WARN_BYTES;
  const allowedHosts = options.allowedHosts ?? DEFAULT_ALLOWED_HOSTS;
  const allowDataUrls = options.allowDataUrls ?? true;
  const maxDataUrlBytes = options.maxDataUrlBytes ?? DEFAULT_MAX_DATA_URL_BYTES;
  const maxImports = options.maxImports ?? DEFAULT_MAX_IMPORTS;

  const issues: Issue[] = [];
  const push = (issue: Issue): void => {
    issues.push(issue);
  };

  // A leading BOM is legitimate. Strip it so offsets line up with the text the
  // editor shows; it sits at offset 0, so line/column are unaffected.
  const source = css.charCodeAt(0) === 0xfeff ? css.slice(1) : css;
  const byteSize = new TextEncoder().encode(source).length;

  if (source.trim() === "") {
    return finish([{ code: "empty", severity: "error", message: "The stylesheet is empty." }], byteSize);
  }

  if (byteSize > maxBytes) {
    // Do not attempt to parse something oversized — report and stop.
    return finish(
      [
        {
          code: "too_large",
          severity: "error",
          message: `The stylesheet is ${byteSize} bytes; the limit is ${maxBytes}.`,
        },
      ],
      byteSize,
    );
  }

  if (byteSize > warnBytes) {
    push({
      code: "too_large",
      severity: "warning",
      message: `The stylesheet is ${byteSize} bytes. Stylesheets above ${warnBytes} bytes will slow down every page that loads them.`,
    });
  }

  const controlIssue = findControlCharacter(source);
  if (controlIssue) push(controlIssue);

  let ast: csstree.CssNode;
  try {
    ast = csstree.parse(source, {
      positions: true,
      parseAtrulePrelude: true,
      parseRulePrelude: true,
      parseValue: true,
      // DS1 is almost entirely custom properties, so their values must be
      // parsed or url() inside them would never be seen.
      parseCustomProperty: true,
      onParseError(error: unknown) {
        push(parseErrorToIssue(error));
      },
    });
  } catch (error) {
    push(parseErrorToIssue(error));
    return finish(issues, byteSize);
  }

  const ctx: RuleContext = { allowedHosts, allowDataUrls, maxDataUrlBytes, maxImports, push };
  collectAstIssues(ast, ctx);

  return finish(issues, byteSize);
}

function finish(issues: Issue[], byteSize: number): ValidateResult {
  const sorted = [...issues].sort((a, b) => (a.offset ?? -1) - (b.offset ?? -1));
  const truncated = sorted.length > MAX_ISSUES;
  const capped = truncated ? sorted.slice(0, MAX_ISSUES) : sorted;

  return {
    ok: capped.every((issue) => issue.severity !== "error"),
    issues: capped,
    byteSize,
    truncated,
  };
}

function parseErrorToIssue(error: unknown): Issue {
  const err = error as { message?: unknown; rawMessage?: unknown; line?: unknown; column?: unknown; offset?: unknown };
  const message =
    typeof err?.rawMessage === "string"
      ? err.rawMessage
      : typeof err?.message === "string"
        ? err.message
        : "The stylesheet could not be parsed.";

  return {
    code: "parse_error",
    severity: "error",
    message,
    ...(typeof err?.line === "number" ? { line: err.line } : {}),
    ...(typeof err?.column === "number" ? { column: err.column } : {}),
    ...(typeof err?.offset === "number" ? { offset: err.offset } : {}),
  };
}

/**
 * NUL and unpaired surrogates survive JSON round-trips but corrupt the stored
 * artifact, so they are rejected before anything else looks at the text.
 */
function findControlCharacter(source: string): Issue | null {
  for (let index = 0; index < source.length; index += 1) {
    const code = source.charCodeAt(index);

    if (code === 0) {
      return {
        code: "control_characters",
        severity: "error",
        message: "The stylesheet contains a NUL character.",
        offset: index,
      };
    }

    // High surrogate must be followed by a low surrogate, and vice versa.
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = source.charCodeAt(index + 1);
      if (Number.isNaN(next) || next < 0xdc00 || next > 0xdfff) {
        return {
          code: "control_characters",
          severity: "error",
          message: "The stylesheet contains an unpaired surrogate character.",
          offset: index,
        };
      }
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      return {
        code: "control_characters",
        severity: "error",
        message: "The stylesheet contains an unpaired surrogate character.",
        offset: index,
      };
    }
  }

  return null;
}
