import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vite-plus/test";
import { parseJsonc } from "./harness.ts";

const config = parseJsonc(readFileSync(fileURLToPath(new URL("../../wrangler.jsonc", import.meta.url).href), "utf8")) as Record<string, unknown>;

describe("single Worker deployment", () => {
  it("serves the combined website and existing library bucket", () => {
    expect(config.name).toBe("designsystem1");
    expect(config.main).toBe("./services/src/index.ts");
    expect(config.assets).toMatchObject({ directory: "./website/dist", binding: "ASSETS", run_worker_first: true });
    expect(config.r2_buckets).toEqual([{ binding: "LIBRARIES", bucket_name: "ds-one-libraries", preview_bucket_name: "ds-one-libraries-preview" }]);
  });
  it("keeps public reads independent of database and service bindings", () => {
    for (const key of ["d1_databases", "kv_namespaces", "durable_objects", "queues", "hyperdrive"]) expect(config[key]).toBeUndefined();
    // Only Consistency's owner-only routes call other Workers: its platform and System's sign-in.
    expect(config.services).toEqual([
      { binding: "CONSISTENCY_WORKSPACE", service: "consistency-platform", entrypoint: "ConsistencyWorkspace" },
      { binding: "C9Y_IDENTITY", service: "0001-system", entrypoint: "ConsistencyIdentity" },
    ]);
    expect(config.placement).toBeUndefined();
  });
  it("never commits the publish credential", () => {
    expect(config.vars).toEqual({ MAX_CSS_BYTES: "524288" });
    expect(JSON.stringify(config)).not.toContain("PUBLISH_SECRET");
  });
  it("attaches the product hostnames and legacy domain", () => {
    expect(config.routes).toEqual([
      { pattern: "c9y.site/*", zone_name: "c9y.site" },
      { pattern: "editor.c9y.site/*", zone_name: "c9y.site" },
      { pattern: "editor.c9y.site", custom_domain: true },
      { pattern: "neweditor.c9y.site/*", zone_name: "c9y.site" },
      { pattern: "neweditor.c9y.site", custom_domain: true },
      { pattern: "consistency.site/", zone_name: "consistency.site" },
      { pattern: "consistency.site/auth/*", zone_name: "consistency.site" },
      { pattern: "consistency.site/api/consistency/*", zone_name: "consistency.site" },
      { pattern: "consistency.site/api/dashboard/*", zone_name: "consistency.site" },
      { pattern: "consistency.site/app/*", zone_name: "consistency.site" },
      { pattern: "consistency.site/private-consistency/*", zone_name: "consistency.site" },
      { pattern: "consistency.site/icons/design-system-1.svg", zone_name: "consistency.site" },
      { pattern: "fonts.designsystem1.com", custom_domain: true },
      { pattern: "icon.designsystem1.com", custom_domain: true },
      { pattern: "play.designsystem1.com", custom_domain: true },
      { pattern: "designsystem1.com", custom_domain: true },
      { pattern: "www.designsystem1.com", custom_domain: true },
      { pattern: "dsone.dev/*", zone_name: "dsone.dev" },
    ]);
  });
});
