import { describe, expect, it, vi } from "vite-plus/test";
import { componentReport, REPORT_KEY, type ReportsEnv } from "../src/reports";

const request = (token = "owner-token") => new Request("https://designsystem1.com/api/reports/components", { headers: { authorization: `Bearer ${token}` } });
const setup = () => {
  const get = vi.fn().mockResolvedValue({ body: '{"private":true}' });
  const env = { LIBRARIES: { get }, REPORTS_AUTH_URL: "https://example.convex.cloud", REPORTS_OWNER_ID: "owner" } as unknown as ReportsEnv;
  const send = vi.fn().mockResolvedValue(Response.json({ status: "success", value: { _id: "owner", email: "jaa90@icloud.com", emailVerified: true } }));
  return { env, get, send };
};

describe("owner-only component report", () => {
  it("never reads data for an anonymous request", async () => {
    const { env, get, send } = setup();
    const response = await componentReport(new Request("https://designsystem1.com/api/reports/components"), env, send);
    expect(response.status).toBe(401); expect(get).not.toHaveBeenCalled(); expect(send).not.toHaveBeenCalled();
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
  it("requires configured authorization and accepts no caller-provided owner ID", async () => {
    const { env, get, send } = setup();
    delete env.REPORTS_OWNER_ID;
    expect((await componentReport(request(), env, send)).status).toBe(503);
    expect(get).not.toHaveBeenCalled();
  });
  it("rejects a valid session belonging to another account", async () => {
    const { env, get, send } = setup();
    send.mockResolvedValue(Response.json({ status: "success", value: { _id: "another-user" } }));
    expect((await componentReport(request(), env, send)).status).toBe(403);
    expect(get).not.toHaveBeenCalled();
  });
  it("requires both the pinned user ID and verified owner email", async () => {
    for (const identity of [
      { _id: "owner", email: "someone@example.com", emailVerified: true },
      { _id: "owner", email: "jaa90@icloud.com", emailVerified: false },
      { _id: "owner", email: "jaa90@icloud.com" },
    ]) {
      const { env, get, send } = setup();
      send.mockResolvedValue(Response.json({ status: "success", value: identity }));
      expect((await componentReport(request(), env, send)).status).toBe(403);
      expect(get).not.toHaveBeenCalled();
    }
  });
  it("fails closed for rejected, expired and unavailable sessions", async () => {
    for (const response of [Response.json({ status: "success", value: null }), new Response(null, { status: 401 }), new Response(null, { status: 503 })]) {
      const { env, get, send } = setup(); send.mockResolvedValue(response);
      expect([401, 503]).toContain((await componentReport(request(), env, send)).status);
      expect(get).not.toHaveBeenCalled();
    }
    const { env, get, send } = setup(); send.mockRejectedValue(new Error("Unavailable"));
    expect((await componentReport(request(), env, send)).status).toBe(503); expect(get).not.toHaveBeenCalled();
  });
  it("verifies with Convex before reading the private R2 key, with no shared cache or CORS", async () => {
    const { env, get, send } = setup();
    const response = await componentReport(request(), env, send);
    expect(send).toHaveBeenCalledWith("https://example.convex.cloud/api/query", expect.objectContaining({ headers: { authorization: "Bearer owner-token", "Content-Type": "application/json" } }));
    expect(get).toHaveBeenCalledWith(REPORT_KEY);
    expect(response.status).toBe(200); expect(await response.json()).toEqual({ private: true });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("access-control-allow-origin")).toBeNull();
  });
  it("does not allow writes and explains missing snapshots", async () => {
    const { env, get, send } = setup();
    expect((await componentReport(new Request(request(), { method: "POST" }), env, send)).status).toBe(405);
    get.mockResolvedValue(null);
    expect((await componentReport(request(), env, send)).status).toBe(404);
  });
});
