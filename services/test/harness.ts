import { build } from "esbuild";
import { Miniflare } from "miniflare";
import { fileURLToPath } from "node:url";

const COMPATIBILITY_DATE = "2026-07-24";

/** Crockford base32, lowercase — the alphabet `PUBLIC_ID_PATTERN` accepts. */
const ALPHABET = "0123456789abcdefghjkmnpqrstvwxyz";

/**
 * Each test uses a fresh public id so the Worker's edge cache, which is keyed
 * on URL, cannot leak state between tests.
 */
export function newPublicId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  return [...bytes].map((byte) => ALPHABET[byte % 32]).join("");
}

async function bundle(entry: string): Promise<string> {
  // Decode the project directory's spaces before passing it to the bundler.
  const result = await build({
    entryPoints: [fileURLToPath(new URL(entry, import.meta.url).href)],
    bundle: true,
    external: ["cloudflare:workers"],
    platform: "browser",
    target: "es2022",
    format: "esm",
    write: false,
  });

  const output = result.outputFiles?.[0];
  if (!output) throw new Error("bundle produced no output");
  return output.text;
}

// Miniflare ships its own undici-based Request/Response/R2 types, which are
// structurally similar to @cloudflare/workers-types but not identical. Derive
// from Miniflare's own signatures rather than importing either set by name.
type MiniflareBucket = Awaited<ReturnType<Miniflare["getR2Bucket"]>>;
type MiniflareFetchInit = Parameters<Miniflare["dispatchFetch"]>[1];

export interface Harness {
  fetch: (path: string, init?: MiniflareFetchInit) => Promise<Response>;
  bucket: () => Promise<MiniflareBucket>;
  dispose: () => Promise<void>;
}

async function start(entry: string, bindings: Record<string, string> = {}): Promise<Harness> {
  const mf = new Miniflare({
    modules: true,
    script: await bundle(entry),
    r2Buckets: ["LIBRARIES"],
    bindings,
    serviceBindings: {
      ASSETS: async (request: Request) => {
        const path = new URL(request.url).pathname;
        if (path === "/") return new Response("Documentation");
        if (path === "/app/") return new Response("Application");
        if (path === "/play/") return new Response("Play");
        if (path === "/resources/design-system-1.js") return new Response("Components");
        return new Response("Missing asset", { status: 404 });
      },
    },
    compatibilityDate: COMPATIBILITY_DATE,
  });

  await mf.ready;

  return {
    fetch: (path, init) => mf.dispatchFetch(path.startsWith("https://") ? path : `https://designsystem1.com${path}`, init) as unknown as Promise<Response>,
    bucket: () => mf.getR2Bucket("LIBRARIES"),
    dispose: () => mf.dispose(),
  };
}

export const startAssets = () => start("../src/index.ts");

export const startPublish = (secret = "test-secret-value") =>
  start("../src/index.ts", { PUBLISH_SECRET: secret, MAX_CSS_BYTES: "524288" });

/** Seed an artifact exactly the way the publish Worker would write it. */
export async function seedArtifact(
  harness: Harness,
  key: string,
  body: string,
  version: string,
  libraryId = "lib_test",
): Promise<void> {
  const bucket = await harness.bucket();
  await bucket.put(key, body, {
    httpMetadata: { contentType: "text/css; charset=utf-8" },
    customMetadata: {
      version,
      contentHash: await sha256Hex(body),
      libraryId,
      publishedAt: String(1_700_000_000_000),
    },
  });
}

export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Strip comments from JSONC while respecting string literals, so a `//` inside
 * a value is never mistaken for a comment.
 */
export function parseJsonc(text: string): unknown {
  let out = "";
  let inString = false;
  let inLine = false;
  let inBlock = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]!;
    const next = text[index + 1];

    if (inLine) {
      if (char === "\n") {
        inLine = false;
        out += char;
      }
      continue;
    }

    if (inBlock) {
      if (char === "*" && next === "/") {
        inBlock = false;
        index += 1;
      }
      continue;
    }

    if (inString) {
      out += char;
      if (char === "\\") {
        out += next ?? "";
        index += 1;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      out += char;
      continue;
    }

    if (char === "/" && next === "/") {
      inLine = true;
      index += 1;
      continue;
    }

    if (char === "/" && next === "*") {
      inBlock = true;
      index += 1;
      continue;
    }

    out += char;
  }

  // Trailing commas are legal in wrangler's JSONC but not in JSON.
  return JSON.parse(out.replace(/,(\s*[}\]])/g, "$1"));
}
