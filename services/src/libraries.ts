/** The app's existing functions remain the authorization boundary for every client. */
export interface LibraryApiEnv { REPORTS_AUTH_URL?: string }
type Property = { type: "string" | "number" | "boolean"; description?: string };
type Operation = { description: string; kind: "query" | "mutation" | "action"; path: string; properties: Record<string, Property>; required: string[]; readOnly: boolean };
const id = { type: "string", description: "Library ID from list or create." } as const;
const css = { type: "string", description: "Complete stylesheet, not a patch." } as const;
const config = { type: "string", description: "Editor configuration as a JSON string. Preserve it when editing CSS." } as const;
const baseRev = { type: "number", description: "Revision read before editing; stale revisions are rejected." } as const;
export const libraryOperations: Record<string, Operation> = {
  list: { description: "List your libraries.", kind: "query", path: "libraries:list", properties: {}, required: [], readOnly: true },
  get: { description: "Read draft CSS, configuration and revision.", kind: "query", path: "libraries:get", properties: { id }, required: ["id"], readOnly: true },
  create: { description: "Create a library.", kind: "mutation", path: "libraries:create", properties: { name: { type: "string" }, css, config, templateVersion: { type: "string" } }, required: ["name", "css", "config", "templateVersion"], readOnly: false },
  save: { description: "Save a draft without publishing it.", kind: "mutation", path: "libraries:saveDraft", properties: { id, css, config, baseRev }, required: ["id", "css", "config", "baseRev"], readOnly: false },
  rename: { description: "Rename a library.", kind: "mutation", path: "libraries:rename", properties: { id, name: { type: "string" } }, required: ["id", "name"], readOnly: false },
  history: { description: "Read publication history.", kind: "query", path: "versions:history", properties: { id }, required: ["id"], readOnly: true },
  publish: { description: "Publish a saved draft. Changes the live appearance of connected apps.", kind: "action", path: "publish:publish", properties: { id, baseRev, note: { type: "string" } }, required: ["id", "baseRev"], readOnly: false },
  rollback: { description: "Make an existing published version live again.", kind: "action", path: "versions:rollback", properties: { id, version: { type: "number" } }, required: ["id", "version"], readOnly: false },
};
const headers = { "Content-Type": "application/json", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", Vary: "Authorization" };
const json = (value: unknown, status = 200) => Response.json(value, { status, headers });
const fail = (code: string, message: string, status: number) => json({ error: { code, message } }, status);
const object = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
export async function libraryApi(request: Request, env: LibraryApiEnv, send: typeof fetch = fetch): Promise<Response> {
  const path = new URL(request.url).pathname;
  if (path === "/api/libraries" && request.method === "GET") return json({ version: 1, operations: Object.entries(libraryOperations).map(([name, op]) => ({ name, description: op.description, readOnly: op.readOnly, inputSchema: { type: "object", properties: op.properties, required: op.required, additionalProperties: false } })) });
  if (request.method !== "POST") return fail("method_not_allowed", "Use POST with a JSON body.", 405);
  const isAuth = path.startsWith("/api/library-auth/");
  const name = path.split("/").at(-1)!;
  const op = Object.hasOwn(libraryOperations, name) ? libraryOperations[name] : undefined;
  if ((!isAuth && !op) || (isAuth && !["sign-in", "sign-out"].includes(name))) return fail("not_found", "Unknown operation.", 404);
  const authorization = request.headers.get("authorization") ?? "";
  if ((!isAuth || name === "sign-out") && !/^Bearer [^\s]{1,8192}$/.test(authorization)) return fail("unauthenticated", "Sign in to continue.", 401);
  if (!env.REPORTS_AUTH_URL || !/^https:\/\/[a-z0-9-]+\.convex\.cloud$/.test(env.REPORTS_AUTH_URL)) return fail("unavailable", "Library access is not configured.", 503);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return fail("invalid_request", "Send application/json.", 415);
  let bytes = 0; const chunks: Uint8Array[] = [];
  const reader = request.body?.getReader();
  if (reader) while (true) {
    const part = await reader.read(); if (part.done) break;
    bytes += part.value.byteLength;
    if (bytes > 2 * 1024 * 1024) { await reader.cancel(); return fail("too_large", "Request exceeds 2 MB.", 413); }
    chunks.push(part.value);
  }
  let args: unknown;
  try { args = JSON.parse(await new Blob(chunks).text()); } catch { return fail("invalid_request", "Invalid JSON.", 400); }
  if (!object(args)) return fail("invalid_request", "Expected an object.", 400);
  let backendPath: string; let kind: string;
  if (isAuth) {
    backendPath = name === "sign-in" ? "auth:signIn" : "auth:signOut"; kind = "action";
    if (name === "sign-out") args = {};
    else if (typeof args.refreshToken === "string" && Object.keys(args).length === 1) {
      if (args.refreshToken.length > 8192) return fail("invalid_request", "Invalid refresh token.", 400);
    } else if (args.provider === "email-code" && object(args.params) && typeof args.params.email === "string" && args.params.email.length <= 254 && (args.params.code === undefined || typeof args.params.code === "string" && args.params.code.length <= 256)) {
      args = { provider: "email-code", params: { email: args.params.email, ...(args.params.code === undefined ? {} : { code: args.params.code }) } };
    } else return fail("invalid_request", "Use email-code with email and optional code, or a refreshToken.", 400);
  } else {
    for (const key of op!.required) if (!(key in args)) return fail("invalid_request", `Missing ${key}.`, 400);
    for (const [key, value] of Object.entries(args)) {
      const property = op!.properties[key];
      if (!property || typeof value !== property.type || typeof value === "number" && (!Number.isSafeInteger(value) || value < 1)) return fail("invalid_request", `Invalid ${key}.`, 400);
    }
    backendPath = op!.path; kind = op!.kind;
  }
  try {
    const response = await send(`${env.REPORTS_AUTH_URL}/api/${kind}`, {
      method: "POST", headers: { "Content-Type": "application/json", ...(authorization ? { authorization } : {}) },
      body: JSON.stringify({ path: backendPath, args: [args], format: "convex_encoded_json" }), redirect: "error", signal: AbortSignal.timeout(60_000),
    });
    if (response.status === 401 || response.status === 403) return fail("unauthenticated", "Sign in again.", 401);
    if (!response.ok) return fail("upstream_error", "Library service could not complete the request.", 502);
    const result = await response.json() as { status: string; value?: unknown; errorData?: unknown };
    if (result.status === "success") {
      if (name === "get" && result.value === null) return fail("not_found", "Library not found.", 404);
      return json({ result: result.value ?? null });
    }
    const error = object(result.errorData) ? result.errorData : {};
    const code = typeof error.code === "string" ? error.code : "request_failed";
    return json({ error: { code, message: typeof error.message === "string" ? error.message : "The request could not be completed.", ...(error.details ? { details: error.details } : {}) } }, code === "unauthenticated" ? 401 : code === "not_found" ? 404 : code === "draft_conflict" ? 409 : 400);
  } catch { return fail("upstream_error", "Library service is unavailable. Read current state before retrying a write.", 502); }
}
