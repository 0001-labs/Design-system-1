/**
 * End-to-end smoke test against deployed Workers.
 *
 * Publishes a throwaway library through designsystem1, then checks that
 * the same Worker serves it correctly — the same assertions the miniflare suite
 * makes, but against the real Cloudflare runtime, real R2, and the real edge.
 *
 *   ASSETS_URL=https://designsystem1.com \
 *   PUBLISH_URL=https://designsystem1.com \
 *   PUBLISH_SECRET=... \
 *   vp run smoke
 *
 * Writes into whichever R2 bucket the Workers are bound to, under a random
 * public id. Pass --keep to leave the artifacts in place for manual poking.
 */
const ASSETS_URL = process.env.ASSETS_URL?.replace(/\/$/, "");
const PUBLISH_URL = process.env.PUBLISH_URL?.replace(/\/$/, "");
const PUBLISH_SECRET = process.env.PUBLISH_SECRET;

if (!ASSETS_URL || !PUBLISH_URL || !PUBLISH_SECRET) {
  console.error("Set ASSETS_URL, PUBLISH_URL and PUBLISH_SECRET. See the header of this file.");
  process.exit(1);
}

const ALPHABET = "0123456789abcdefghjkmnpqrstvwxyz";
const publicId = [...crypto.getRandomValues(new Uint8Array(20))]
  .map((byte) => ALPHABET[byte % 32])
  .join("");

const V1 = ":root{--one-accent-color:#0066ff}\nbutton{border-radius:8px}\n";
const V2 = ":root{--one-accent-color:#ff0066}\nbutton{border-radius:20px}\n";

let failures = 0;

function check(label: string, ok: boolean, detail = ""): void {
  console.log(`${ok ? "  ok  " : " FAIL "} ${label}${detail ? `  — ${detail}` : ""}`);
  if (!ok) failures += 1;
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function publish(version: number, css: string): Promise<void> {
  const headers = {
    authorization: `Bearer ${PUBLISH_SECRET}`,
    "ds1-library-id": "lib_smoke",
    "ds1-version": String(version),
    "ds1-content-hash": await sha256Hex(css),
  };

  for (const path of [`/api/artifacts/${publicId}/v/${version}`, `/api/artifacts/${publicId}/latest`]) {
    const response = await fetch(`${PUBLISH_URL}${path}`, { method: "PUT", body: css, headers });
    if (!response.ok) {
      throw new Error(`PUT ${path} → ${response.status} ${await response.text()}`);
    }
  }
}

console.log(`\nlibrary ${publicId}\n  assets  ${ASSETS_URL}\n  publish ${PUBLISH_URL}\n`);

console.log("auth");
{
  const anonymous = await fetch(`${PUBLISH_URL}/api/artifacts/${publicId}/v/1`, {
    method: "PUT",
    body: V1,
    headers: { "ds1-library-id": "x", "ds1-version": "1" },
  });
  check("unauthenticated write is rejected", anonymous.status === 401, `got ${anonymous.status}`);

  const wrong = await fetch(`${PUBLISH_URL}/api/artifacts/${publicId}/v/1`, {
    method: "PUT",
    body: V1,
    headers: { authorization: "Bearer wrong", "ds1-library-id": "x", "ds1-version": "1" },
  });
  check("wrong secret is rejected", wrong.status === 401, `got ${wrong.status}`);
}

console.log("\npublish v1");
await publish(1, V1);

console.log("read path");
{
  const latest = await fetch(`${ASSETS_URL}/ds1/${publicId}/latest.css`);
  const body = await latest.text();

  check("latest.css is 200", latest.status === 200, `got ${latest.status}`);
  check("body matches what was published", body === V1);
  check("content-type is CSS", latest.headers.get("content-type") === "text/css; charset=utf-8");
  check("CORS allows any origin", latest.headers.get("access-control-allow-origin") === "*");
  check("nosniff is set", latest.headers.get("x-content-type-options") === "nosniff");
  check("ds1-version reports 1", latest.headers.get("ds1-version") === "1");
  check(
    "latest revalidates rather than caching hard",
    (latest.headers.get("cache-control") ?? "").includes("must-revalidate"),
    latest.headers.get("cache-control") ?? "",
  );

  const etag = latest.headers.get("etag");
  check("etag is present", Boolean(etag));

  const pinned = await fetch(`${ASSETS_URL}/ds1/${publicId}/v/1.css`);
  check("v/1.css is 200", pinned.status === 200, `got ${pinned.status}`);
  check(
    "v/1.css is immutable for a year",
    pinned.headers.get("cache-control") === "public, max-age=31536000, immutable",
    pinned.headers.get("cache-control") ?? "",
  );
  // Proves latest.css is a byte copy rather than a redirect or a lookup.
  check("latest and v/1 share an etag", etag === pinned.headers.get("etag"));

  const conditional = await fetch(`${ASSETS_URL}/ds1/${publicId}/latest.css`, {
    headers: { "if-none-match": etag ?? "" },
  });
  check("If-None-Match yields 304", conditional.status === 304, `got ${conditional.status}`);
  check("304 carries no body", (await conditional.text()) === "");
}

console.log("\nimmutability");
{
  const conflict = await fetch(`${PUBLISH_URL}/api/artifacts/${publicId}/v/1`, {
    method: "PUT",
    body: V2,
    headers: {
      authorization: `Bearer ${PUBLISH_SECRET}`,
      "ds1-library-id": "lib_smoke",
      "ds1-version": "1",
    },
  });
  check("rewriting v/1 with new bytes is refused", conflict.status === 409, `got ${conflict.status}`);
  check("v/1 still serves the original", (await (await fetch(`${ASSETS_URL}/ds1/${publicId}/v/1.css`)).text()) === V1);
}

console.log("\npublish v2 and roll back");
{
  await publish(2, V2);

  // The edge may hold latest.css for up to s-maxage=10.
  await new Promise((resolve) => setTimeout(resolve, 12_000));

  const after = await fetch(`${ASSETS_URL}/ds1/${publicId}/latest.css`, { cache: "no-store" });
  check("latest.css now serves v2", (await after.text()) === V2);
  check("ds1-version reports 2", after.headers.get("ds1-version") === "2", after.headers.get("ds1-version") ?? "");
  check("v/1.css is still reachable forever", (await (await fetch(`${ASSETS_URL}/ds1/${publicId}/v/1.css`)).text()) === V1);

  // Rollback is a repoint: write v1's bytes back to latest, minting no version.
  await fetch(`${PUBLISH_URL}/api/artifacts/${publicId}/latest`, {
    method: "PUT",
    body: V1,
    headers: {
      authorization: `Bearer ${PUBLISH_SECRET}`,
      "ds1-library-id": "lib_smoke",
      "ds1-version": "1",
    },
  });
  await new Promise((resolve) => setTimeout(resolve, 12_000));

  const rolledBack = await fetch(`${ASSETS_URL}/ds1/${publicId}/latest.css`, { cache: "no-store" });
  check("rollback repoints latest to v1", (await rolledBack.text()) === V1);
  check("v/2.css survives the rollback", (await (await fetch(`${ASSETS_URL}/ds1/${publicId}/v/2.css`)).text()) === V2);
}

console.log("\nmissing library");
{
  const missing = await fetch(`${ASSETS_URL}/ds1/${"z".repeat(20)}/latest.css`);
  check("unknown id is 404", missing.status === 404, `got ${missing.status}`);
  check("404 is still CSS-typed", missing.headers.get("content-type") === "text/css; charset=utf-8");
}

console.log(
  failures === 0
    ? `\nAll checks passed.\n\n  <link rel="stylesheet" href="${ASSETS_URL}/ds1/${publicId}/latest.css">\n`
    : `\n${failures} check(s) failed.\n`,
);

if (!process.argv.includes("--keep") && failures === 0) {
  console.log("Artifacts left in R2 under", `ds1/${publicId}/`, "- delete with:");
  console.log(`  vp exec wrangler r2 object delete ds-one-libraries/ds1/${publicId}/latest.css --remote`);
}

process.exit(failures === 0 ? 0 : 1);
