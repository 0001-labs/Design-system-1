import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";

import { latestKey, versionKey } from "../src/shared/keys.ts";
import { newPublicId, seedArtifact, startAssets, type Harness } from "./harness.ts";

const CSS = ":root{--one-accent-color:#0066ff}\nbutton{border-radius:8px}\n";

let mf: Harness;

beforeAll(async () => {
  mf = await startAssets();
});

afterAll(async () => {
  await mf.dispose();
});

/** Seed both keys with identical bytes, exactly as a publish does. */
async function publishFixture(version = "1", body = CSS) {
  const publicId = newPublicId();
  await seedArtifact(mf, versionKey(publicId, version), body, version);
  await seedArtifact(mf, latestKey(publicId), body, version);
  return publicId;
}

describe("GET latest.css", () => {
  it("serves the stylesheet with the documented header set", async () => {
    const id = await publishFixture();
    const response = await mf.fetch(`/ds1/${id}/latest.css`);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe(CSS);
    expect(response.headers.get("content-type")).toBe("text/css; charset=utf-8");
    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=0, must-revalidate, s-maxage=10, stale-if-error=86400",
    );
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    expect(response.headers.get("cross-origin-resource-policy")).toBe("cross-origin");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("ds1-version")).toBe("1");
    expect(response.headers.get("etag")).toBeTruthy();
  });

  it("does not send Vary, which Cloudflare adds itself for text/css", async () => {
    const id = await publishFixture();
    const response = await mf.fetch(`/ds1/${id}/latest.css`);
    expect(response.headers.get("vary")).toBeNull();
  });
});

describe("GET v/{n}.css", () => {
  it("is cached as immutable for a year", async () => {
    const id = await publishFixture("7");
    const response = await mf.fetch(`/ds1/${id}/v/7.css`);

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");
    expect(response.headers.get("ds1-version")).toBe("7");
  });

  it("names the content hash the publish recorded, for a product that pins the version", async () => {
    const id = await publishFixture("3");
    const response = await mf.fetch(`/ds1/${id}/v/3.css`);
    const body = await response.text();
    const digest = [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(body)))].map(byte => byte.toString(16).padStart(2, "0")).join("");
    expect(response.headers.get("ds1-content-hash")).toBe(digest);
    expect(response.headers.get("access-control-expose-headers")).toContain("ds1-content-hash");
    const head = await mf.fetch(`/ds1/${id}/v/3.css`, { method: "HEAD" });
    expect(head.headers.get("ds1-content-hash")).toBe(digest);
  });

  // The byte-copy design, asserted rather than assumed. If someone turns
  // latest.css into a redirect or a lookup, this is the test that fails.
  it("shares an ETag with latest.css when it is the live version", async () => {
    const id = await publishFixture("4");

    const [latest, pinned] = await Promise.all([
      mf.fetch(`/ds1/${id}/latest.css`),
      mf.fetch(`/ds1/${id}/v/4.css`),
    ]);

    expect(latest.headers.get("etag")).toBe(pinned.headers.get("etag"));
    expect(await latest.text()).toBe(await pinned.text());
  });
});

describe("conditional requests", () => {
  it("answers a matching If-None-Match with an empty 304", async () => {
    const id = await publishFixture();

    const first = await mf.fetch(`/ds1/${id}/latest.css`);
    const etag = first.headers.get("etag")!;
    await first.text();

    const second = await mf.fetch(`/ds1/${id}/latest.css`, { headers: { "if-none-match": etag } });

    expect(second.status).toBe(304);
    expect(await second.text()).toBe("");
    expect(second.headers.get("etag")).toBe(etag);
    expect(second.headers.get("cache-control")).toBeTruthy();
  });

  it("answers If-None-Match: * with a 304", async () => {
    const id = await publishFixture();
    await (await mf.fetch(`/ds1/${id}/latest.css`)).text();

    const response = await mf.fetch(`/ds1/${id}/latest.css`, { headers: { "if-none-match": "*" } });
    expect(response.status).toBe(304);
  });

  it("serves the body when the etag does not match", async () => {
    const id = await publishFixture();
    await (await mf.fetch(`/ds1/${id}/latest.css`)).text();

    const response = await mf.fetch(`/ds1/${id}/latest.css`, {
      headers: { "if-none-match": '"not-the-etag"' },
    });

    expect(response.status).toBe(200);
    expect(await response.text()).toBe(CSS);
  });
});

describe("HEAD", () => {
  it("returns headers and no body", async () => {
    const id = await publishFixture("3");
    const response = await mf.fetch(`/ds1/${id}/latest.css`, { method: "HEAD" });

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("");
    expect(response.headers.get("ds1-version")).toBe("3");
    expect(response.headers.get("content-length")).toBe(String(new TextEncoder().encode(CSS).length));
  });
});

describe("missing artifacts", () => {
  it("returns a CSS-typed 404 so a broken link does not raise a MIME error", async () => {
    const response = await mf.fetch(`/ds1/${newPublicId()}/latest.css`);

    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toBe("text/css; charset=utf-8");
    expect(await response.text()).toContain("library not found");
    // Short, so a just-created library is not negatively cached at the edge.
    expect(response.headers.get("cache-control")).toBe("public, max-age=30");
  });

  it("404s an unpublished version of a real library", async () => {
    const id = await publishFixture("1");
    expect((await mf.fetch(`/ds1/${id}/v/2.css`)).status).toBe(404);
  });
});

describe("path validation", () => {
  const id = "abcdefghjkmnpqrstvwx"; // 20 valid crockford chars

  it.each([
    ["uppercase in the id", `/ds1/ABCDEFGHJKMNPQRSTVWX/latest.css`],
    ["excluded letter i", `/ds1/iiiiiiiiiiiiiiiiiiii/latest.css`],
    ["excluded letter l", `/ds1/llllllllllllllllllll/latest.css`],
    ["excluded letter o", `/ds1/oooooooooooooooooooo/latest.css`],
    ["excluded letter u", `/ds1/uuuuuuuuuuuuuuuuuuuu/latest.css`],
    ["id too short", `/ds1/abcdefgh/latest.css`],
    ["id too long", `/ds1/${id}extra/latest.css`],
    ["encoded traversal", `/ds1/${id}/%2e%2e/secret.css`],
    ["version zero", `/ds1/${id}/v/0.css`],
    ["negative version", `/ds1/${id}/v/-1.css`],
    ["non-numeric version", `/ds1/${id}/v/latest.css`],
    ["wrong extension", `/ds1/${id}/latest.txt`],
    ["extra segment", `/ds1/${id}/v/1/extra.css`],
    ["bare prefix", `/ds1/`],
    ["unrelated path", `/2-core/button/`],
  ])("rejects %s", async (_label, path) => {
    expect((await mf.fetch(path)).status).toBe(404);
  });
});

describe("methods", () => {
  it("answers OPTIONS with a CORS preflight", async () => {
    const response = await mf.fetch(`/ds1/${newPublicId()}/latest.css`, { method: "OPTIONS" });

    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    expect(response.headers.get("access-control-allow-methods")).toContain("GET");
  });

  it.each(["POST", "PUT", "DELETE", "PATCH"])("rejects %s with 405", async (method) => {
    const id = await publishFixture();
    const response = await mf.fetch(`/ds1/${id}/latest.css`, { method });

    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("GET, HEAD, OPTIONS");
  });

  // The read Worker must never be able to mutate an artifact, even though the
  // R2 binding it holds is technically read-write.
  it("leaves the artifact untouched after a rejected write", async () => {
    const id = await publishFixture();
    await mf.fetch(`/ds1/${id}/latest.css`, { method: "PUT", body: "body{color:red}" });

    expect(await (await mf.fetch(`/ds1/${id}/latest.css`)).text()).toBe(CSS);
  });
});
