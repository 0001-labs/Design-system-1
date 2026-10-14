import { describe, expect, it } from "vite-plus/test";

import { escapeHref, escapeHtml } from "../convex/lib/escape";
import { renderMagicLinkEmail } from "../convex/lib/mail";
import {
  base64UrlEncode,
  generateMagicLinkToken,
  isPlausibleEmail,
  normalizeEmail,
} from "../convex/lib/token";

describe("normalizeEmail", () => {
  // The canonicalization that keeps one person from owning two disjoint sets of
  // libraries. Convex Auth normalizes nothing itself — verified by running it,
  // which produced separate users for Tester@Example.COM and tester@example.com
  // before convex/auth.ts grew its createOrUpdateUser callback.
  it.each([
    ["Tester@Example.COM", "tester@example.com"],
    ["  spaced@example.com  ", "spaced@example.com"],
    ["MiXeD.CaSe+tag@Example.Org", "mixed.case+tag@example.org"],
  ])("normalizes %s", (input, expected) => {
    expect(normalizeEmail(input)).toBe(expected);
  });
});

describe("isPlausibleEmail", () => {
  it.each([
    "a@b.co",
    "first.last+tag@sub.example.com",
    "  Padded@Example.com  ",
  ])("accepts %s", (email) => {
    expect(isPlausibleEmail(email)).toBe(true);
  });

  it.each([
    ["empty", ""],
    ["no at sign", "nobody"],
    ["no domain dot", "a@b"],
    ["spaces inside", "a b@example.com"],
    ["two at signs", "a@b@example.com"],
    ["trailing dot only", "a@example."],
    ["over 254 bytes", `${"a".repeat(250)}@example.com`],
  ])("rejects %s", (_label, email) => {
    expect(isPlausibleEmail(email)).toBe(false);
  });
});

describe("generateMagicLinkToken", () => {
  // With `authorize: undefined` the token is the sole credential, so entropy is
  // the whole security story. 32 bytes base64url is 43 characters.
  it("is 43 base64url characters, i.e. 256 bits", () => {
    const token = generateMagicLinkToken();
    expect(token).toHaveLength(43);
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("carries no base64 padding or non-url-safe characters", () => {
    for (let i = 0; i < 200; i += 1) {
      const token = generateMagicLinkToken();
      expect(token).not.toContain("=");
      expect(token).not.toContain("+");
      expect(token).not.toContain("/");
    }
  });

  it("never repeats across 20k draws", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 20_000; i += 1) seen.add(generateMagicLinkToken());
    expect(seen.size).toBe(20_000);
  });

  // A regression guard against someone "simplifying" this to Math.random, which
  // is safe for a short code only where an `authorize` check supplies a second
  // factor.
  it("spreads across the alphabet rather than clustering", () => {
    const counts = new Map<string, number>();
    for (let i = 0; i < 2_000; i += 1) {
      for (const char of generateMagicLinkToken()) {
        counts.set(char, (counts.get(char) ?? 0) + 1);
      }
    }
    // base64url has 64 symbols; a CSPRNG should touch essentially all of them.
    expect(counts.size).toBeGreaterThan(60);
  });
});

describe("base64UrlEncode", () => {
  it("round-trips a known byte sequence", () => {
    expect(base64UrlEncode(new Uint8Array([0, 1, 2, 253, 254, 255]))).toBe("AAEC_f7_");
  });

  it("handles an empty array", () => {
    expect(base64UrlEncode(new Uint8Array([]))).toBe("");
  });
});

describe("escapeHtml", () => {
  it("escapes every character that can break out of a text node or attribute", () => {
    expect(escapeHtml(`<script>alert("x")&'`)).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&amp;&#39;",
    );
  });

  it("escapes the ampersand first so entities are not double-formed", () => {
    expect(escapeHtml("&lt;")).toBe("&amp;lt;");
  });

  it("leaves ordinary text alone", () => {
    expect(escapeHtml("tester@example.com")).toBe("tester@example.com");
  });
});

describe("escapeHref", () => {
  it("passes an https URL through", () => {
    expect(escapeHref("https://dsone.dev/app?code=abc")).toContain("https://dsone.dev/app?code=abc");
  });

  it.each(["javascript:alert(1)", "data:text/html,<b>x</b>", "file:///etc/passwd", "not a url"])(
    "refuses %s",
    (url) => {
      expect(escapeHref(url)).toBe("#");
    },
  );

  it("escapes quotes so it cannot break out of the attribute", () => {
    expect(escapeHref('https://dsone.dev/?a="onload="alert(1)')).not.toContain('"');
  });
});

describe("renderMagicLinkEmail", () => {
  const url = "https://dsone.dev/app?code=TOKEN123";

  it("includes the link in both the HTML and the plain-text part", () => {
    const email = renderMagicLinkEmail({ url, expiresMinutes: 15 });
    expect(email.html).toContain(url);
    expect(email.text).toContain(url);
    expect(email.subject).toBe("Sign in to Design system 1");
  });

  it("states the expiry and that the link is single use", () => {
    const email = renderMagicLinkEmail({ url, expiresMinutes: 15 });
    expect(email.text).toContain("15 minutes");
    expect(email.text).toContain("once");
  });

  // An email renderer may interpolate unescaped, and a magic-link mail
  // interpolates user-influenced values, so this is a real boundary.
  it("neutralizes a hostile URL rather than rendering it as markup", () => {
    const hostile = 'https://dsone.dev/?x="><script>alert(1)</script>';
    const email = renderMagicLinkEmail({ url: hostile, expiresMinutes: 15 });

    expect(email.html).not.toContain("<script>alert(1)</script>");
    expect(email.html).toContain("&lt;script&gt;");
  });

  it("never emits a javascript: href", () => {
    const email = renderMagicLinkEmail({ url: "javascript:alert(1)", expiresMinutes: 15 });
    expect(email.html).toContain('href="#"');
    expect(email.html).not.toContain("javascript:alert(1)");
  });
});
