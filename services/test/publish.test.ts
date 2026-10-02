import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";

import { latestKey, versionKey } from "../src/shared/keys.ts";
import { newPublicId, sha256Hex, startPublish, type Harness } from "./harness.ts";

const SECRET = "test-secret-value";
const CSS = ":root{--one-accent-color:#0066ff}\n";

let mf: Harness;

beforeAll(async () => {
  mf = await startPublish(SECRET);
});

afterAll(async () => {
  await mf.dispose();
});

function put(path: string, body: string, headers: Record<string, string> = {}) {
  return mf.fetch(path, {
    method: "PUT",
    body,
    headers: {
      authorization: `Bearer ${SECRET}`,
      "ds1-library-id": "lib_test",
      "ds1-version": "1",
      ...headers,
    },
  });
}

describe("authentication", () => {
  const id = newPublicId();

  it("rejects a request with no Authorization header", async () => {
    const response = await mf.fetch(`/api/artifacts/${id}/v/1`, { method: "PUT", body: CSS });
    expect(response.status).toBe(401);
  });

  it.each([
    ["a wrong secret", "completely-wrong"],
    ["a same-length near miss", "test-secret-valuf"],
    ["a prefix of the secret", "test-secret"],
    ["the secret plus a suffix", "test-secret-valuex"],
    ["an empty bearer value", ""],
  ])("rejects %s", async (_label, secret) => {
    const response = await mf.fetch(`/api/artifacts/${id}/v/1`, {
      method: "PUT",
      body: CSS,
      headers: { authorization: `Bearer ${secret}`, "ds1-library-id": "l", "ds1-version": "1" },
    });
    expect(response.status).toBe(401);
  });

  it("rejects a non-bearer scheme", async () => {
    const response = await mf.fetch(`/api/artifacts/${id}/v/1`, {
      method: "PUT",
      body: CSS,
      headers: { authorization: `Basic ${SECRET}` },
    });
    expect(response.status).toBe(401);
  });

  // Fail closed: an unset secret must never be read as "no auth required".
  it("returns 500 rather than allowing the write when the secret is unset", async () => {
    const unset = await startPublish("");
    try {
      const response = await unset.fetch(`/api/artifacts/${id}/v/1`, {
        method: "PUT",
        body: CSS,
        headers: { "ds1-library-id": "l", "ds1-version": "1" },
      });
      expect(response.status).toBe(500);
      expect(await (await unset.bucket()).get(versionKey(id, 1))).toBeNull();
    } finally {
      await unset.dispose();
    }
  });
});

describe("writing an immutable version", () => {
  it("stores the bytes with full custom metadata", async () => {
    const id = newPublicId();
    const response = await put(`/api/artifacts/${id}/v/1`, CSS);

    expect(response.status).toBe(200);
    const payload = (await response.json()) as Record<string, unknown>;
    expect(payload.ok).toBe(true);
    expect(payload.reused).toBe(false);
    expect(payload.contentHash).toBe(await sha256Hex(CSS));

    const object = await (await mf.bucket()).get(versionKey(id, 1));
    expect(await object!.text()).toBe(CSS);
    expect(object!.customMetadata?.version).toBe("1");
    expect(object!.customMetadata?.libraryId).toBe("lib_test");
    expect(object!.customMetadata?.contentHash).toBe(await sha256Hex(CSS));
    expect(object!.httpMetadata?.contentType).toBe("text/css; charset=utf-8");
  });

  // Convex actions retry, so a replay of an identical write must resume the
  // publish rather than fail it.
  it("treats a byte-identical replay as a no-op", async () => {
    const id = newPublicId();
    await put(`/api/artifacts/${id}/v/1`, CSS);

    const replay = await put(`/api/artifacts/${id}/v/1`, CSS);
    expect(replay.status).toBe(200);
    expect(((await replay.json()) as { reused: boolean }).reused).toBe(true);
  });

  it("refuses to overwrite a published version with different bytes", async () => {
    const id = newPublicId();
    await put(`/api/artifacts/${id}/v/1`, CSS);

    const response = await put(`/api/artifacts/${id}/v/1`, "body{color:red}\n");
    expect(response.status).toBe(409);
    expect((await response.json() as { error: { code: string } }).error.code).toBe("immutable_conflict");

    // The original is intact — this is what "immutable" has to mean.
    expect(await (await (await mf.bucket()).get(versionKey(id, 1)))!.text()).toBe(CSS);
  });
});

describe("repointing latest", () => {
  it("overwrites freely, because latest is the mutable pointer", async () => {
    const id = newPublicId();
    await put(`/api/artifacts/${id}/latest`, CSS, { "ds1-version": "1" });

    const second = "body{color:red}\n";
    const response = await put(`/api/artifacts/${id}/latest`, second, { "ds1-version": "2" });
    expect(response.status).toBe(200);

    const object = await (await mf.bucket()).get(latestKey(id));
    expect(await object!.text()).toBe(second);
    expect(object!.customMetadata?.version).toBe("2");
  });

  it("reports the live version over HEAD, which is what reconciliation reads", async () => {
    const id = newPublicId();
    await put(`/api/artifacts/${id}/latest`, CSS, { "ds1-version": "9" });

    const response = await mf.fetch(`/api/artifacts/${id}/latest`, {
      method: "HEAD",
      headers: { authorization: `Bearer ${SECRET}` },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("ds1-version")).toBe("9");
    expect(response.headers.get("ds1-content-hash")).toBe(await sha256Hex(CSS));
  });

  it("404s a HEAD for a library that has never published", async () => {
    const response = await mf.fetch(`/api/artifacts/${newPublicId()}/latest`, {
      method: "HEAD",
      headers: { authorization: `Bearer ${SECRET}` },
    });
    expect(response.status).toBe(404);
  });
});

describe("request validation", () => {
  it("rejects a body with no library id", async () => {
    const id = newPublicId();
    const response = await mf.fetch(`/api/artifacts/${id}/v/1`, {
      method: "PUT",
      body: CSS,
      headers: { authorization: `Bearer ${SECRET}`, "ds1-version": "1" },
    });
    expect(response.status).toBe(400);
  });

  it("rejects a version header that disagrees with the path", async () => {
    const id = newPublicId();
    const response = await put(`/api/artifacts/${id}/v/3`, CSS, { "ds1-version": "4" });

    expect(response.status).toBe(400);
    expect((await response.json() as { error: { code: string } }).error.code).toBe("version_mismatch");
  });

  it("rejects a declared content hash that does not match the bytes", async () => {
    const id = newPublicId();
    const response = await put(`/api/artifacts/${id}/v/1`, CSS, { "ds1-content-hash": "deadbeef" });

    expect(response.status).toBe(422);
    expect(await (await mf.bucket()).get(versionKey(id, 1))).toBeNull();
  });

  it("accepts a declared content hash that matches", async () => {
    const id = newPublicId();
    const response = await put(`/api/artifacts/${id}/v/1`, CSS, {
      "ds1-content-hash": await sha256Hex(CSS),
    });
    expect(response.status).toBe(200);
  });

  it("rejects an empty body", async () => {
    const response = await put(`/api/artifacts/${newPublicId()}/v/1`, "");
    expect(response.status).toBe(400);
  });

  it("rejects a body over the byte ceiling", async () => {
    const response = await put(`/api/artifacts/${newPublicId()}/v/1`, "a".repeat(600_000));
    expect(response.status).toBe(413);
  });

  it.each([
    ["an invalid public id", "/api/artifacts/NOTVALID/v/1"],
    ["version zero", `/api/artifacts/${newPublicId()}/v/0`],
    ["an unknown sub-resource", `/api/artifacts/${newPublicId()}/draft`],
    ["a bare prefix", "/api/artifacts/"],
  ])("404s %s", async (_label, path) => {
    expect((await put(path, CSS)).status).toBe(404);
  });

  it("rejects methods other than PUT and HEAD", async () => {
    const response = await mf.fetch(`/api/artifacts/${newPublicId()}/latest`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${SECRET}` },
    });

    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("PUT, HEAD");
  });
});
