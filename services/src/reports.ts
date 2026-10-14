/** Private report data. Sign-in remains the app's shared Sign-in implementation. */
export interface ReportsEnv {
  LIBRARIES: R2Bucket;
  /** The same deployment as the app's VITE_CONVEX_URL. */
  REPORTS_AUTH_URL?: string;
  /** A Convex user ID, stored as a Worker secret. Email is not an authorization key. */
  REPORTS_OWNER_ID?: string;
}
export const REPORT_KEY = "reports/component-adoption.json";
const headers = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow",
  "X-Content-Type-Options": "nosniff",
  "Vary": "Authorization",
};
const failure = (error: string, status: number) => Response.json({ error }, { status, headers });

export async function componentReport(request: Request, env: ReportsEnv, send: typeof fetch = fetch): Promise<Response> {
  if (request.method !== "GET") return new Response(null, { status: 405, headers: { ...headers, Allow: "GET" } });
  const authorization = request.headers.get("authorization") ?? "";
  if (!/^Bearer [^\s]{1,8192}$/.test(authorization)) return failure("Sign in to view this report.", 401);
  if (!env.REPORTS_OWNER_ID || !env.REPORTS_AUTH_URL || !/^https:\/\/[a-z0-9-]+\.convex\.cloud$/.test(env.REPORTS_AUTH_URL)) {
    return failure("Report access has not been configured.", 503);
  }
  // Convex validates its own session token. Never trust a decoded JWT or a client-supplied ID.
  let identity: { status?: string; value?: { _id?: string } | null };
  try {
    const response = await send(`${env.REPORTS_AUTH_URL}/api/query`, {
      method: "POST", headers: { authorization, "Content-Type": "application/json" },
      body: JSON.stringify({ path: "users:current", args: [{}], format: "convex_encoded_json" }),
      signal: AbortSignal.timeout(8_000), redirect: "error",
    });
    if (response.status === 401 || response.status === 403) return failure("Your session has expired. Sign in again.", 401);
    if (!response.ok) return failure("Sign-in could not be checked. Try again.", 503);
    identity = await response.json();
  } catch { return failure("Sign-in could not be checked. Try again.", 503); }
  if (identity.status !== "success" || !identity.value?._id) return failure("Your session has expired. Sign in again.", 401);
  if (identity.value._id !== env.REPORTS_OWNER_ID) return failure("This report is private to the studio owner.", 403);
  const report = await env.LIBRARIES.get(REPORT_KEY);
  if (!report) return failure("No source snapshot has been published yet.", 404);
  return new Response(report.body, { headers });
}
