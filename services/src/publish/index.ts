/**
 * Authenticated artifact writes for the unified Design system 1 Worker.
 * Only Convex actions call these routes; every write requires the bearer secret.
 */
import { bearerToken, sha256Hex, timingSafeEqual } from "../shared/crypto.ts";
import { CONTENT_TYPE } from "../shared/headers.ts";
import { parseWritePath } from "../shared/keys.ts";

export interface Env {
  LIBRARIES: R2Bucket;
  PUBLISH_SECRET: string;
  /** Byte ceiling, mirroring the validator's. Defaults to 512 KiB. */
  MAX_CSS_BYTES?: string;
}

const DEFAULT_MAX_BYTES = 512 * 1024;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const ref = parseWritePath(url.pathname);
    if (!ref) return json({ error: { code: "not_found" } }, 404);

    if (!env.PUBLISH_SECRET) {
      // Fail closed. An unset secret must never mean "no auth required".
      return json({ error: { code: "misconfigured" } }, 500);
    }

    const provided = bearerToken(request);
    if (!provided || !timingSafeEqual(provided, env.PUBLISH_SECRET)) {
      return json({ error: { code: "unauthorized" } }, 401);
    }

    if (request.method === "HEAD") {
      const head = await env.LIBRARIES.head(ref.key);
      if (!head) return new Response(null, { status: 404 });

      return new Response(null, {
        status: 200,
        headers: {
          etag: head.httpEtag,
          "content-length": String(head.size),
          "ds1-version": head.customMetadata?.version ?? "",
          "ds1-content-hash": head.customMetadata?.contentHash ?? "",
        },
      });
    }

    if (request.method !== "PUT") {
      return json({ error: { code: "method_not_allowed" } }, 405, { allow: "PUT, HEAD" });
    }

    const libraryId = request.headers.get("ds1-library-id");
    const declaredVersion = request.headers.get("ds1-version");
    if (!libraryId || !declaredVersion) {
      return json({ error: { code: "missing_metadata" } }, 400);
    }

    // For an immutable key the version is in the path; requiring the header to
    // agree catches a caller that has computed one of them wrong.
    if (ref.version !== undefined && String(ref.version) !== declaredVersion) {
      return json({ error: { code: "version_mismatch" } }, 400);
    }

    const body = await request.text();
    const byteSize = new TextEncoder().encode(body).length;
    const maxBytes = Number(env.MAX_CSS_BYTES ?? DEFAULT_MAX_BYTES);

    if (byteSize === 0) return json({ error: { code: "empty_body" } }, 400);
    if (byteSize > maxBytes) {
      return json({ error: { code: "too_large", details: { byteSize, maxBytes } } }, 413);
    }

    const contentHash = await sha256Hex(body);

    // If the caller declared a hash, verify it. A mismatch means the bytes were
    // altered in transit, and publishing them would make the version row lie.
    const declaredHash = request.headers.get("ds1-content-hash");
    if (declaredHash && declaredHash !== contentHash) {
      return json({ error: { code: "hash_mismatch" } }, 422);
    }

    // Immutable keys are written exactly once. A retry with identical bytes is
    // a no-op rather than an error, because Convex actions retry and must be
    // able to resume a publish safely.
    if (ref.immutable) {
      const existing = await env.LIBRARIES.head(ref.key);
      if (existing) {
        if (existing.customMetadata?.contentHash === contentHash) {
          return json({ ok: true, key: ref.key, etag: existing.httpEtag, contentHash, byteSize, reused: true });
        }
        return json({ error: { code: "immutable_conflict", details: { key: ref.key } } }, 409);
      }
    }

    const written = await env.LIBRARIES.put(ref.key, body, {
      httpMetadata: { contentType: CONTENT_TYPE },
      customMetadata: {
        version: declaredVersion,
        contentHash,
        libraryId,
        publishedAt: String(Date.now()),
      },
    });

    return json({
      ok: true,
      key: ref.key,
      etag: written?.httpEtag ?? null,
      contentHash,
      byteSize,
      reused: false,
    });
  },
} satisfies ExportedHandler<Env>;

function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...extra },
  });
}
