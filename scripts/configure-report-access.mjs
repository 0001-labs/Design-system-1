/** Resolve the existing studio owner without printing or storing account values. */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const authUrl = /^VITE_CONVEX_URL=["']?([^\s"']+)/m.exec(env)?.[1];
const deployment = /^https:\/\/([a-z0-9-]+)\.convex\.cloud$/.exec(authUrl ?? "")?.[1];
if (!deployment) throw new Error("The app's VITE_CONVEX_URL must identify its existing Convex deployment.");
function convex(...args) {
  try { return execFileSync("vp", ["exec", "convex", ...args, "--deployment", deployment], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim(); }
  catch { throw new Error("Could not read the app's Convex deployment. Check CLI access before configuring report access."); }
}
const ownerEmail = convex("env", "get", "SIGN_IN_OWNER_EMAIL").replace(/^["']|["']$/g, "").trim().toLowerCase();
if (!ownerEmail.includes("@")) throw new Error("The app has no configured owner address.");
const accounts = JSON.parse(convex("data", "authAccounts", "--limit", "10000", "--format", "json"));
const ownerIds = [...new Set(accounts.filter(account => typeof account.providerAccountId === "string" && account.providerAccountId.toLowerCase() === ownerEmail).map(account => account.userId))];
if (ownerIds.length !== 1 || typeof ownerIds[0] !== "string") throw new Error("Exactly one existing owner account is required. Sign in as the owner or resolve duplicate accounts first.");
const bindings = { REPORTS_AUTH_URL: authUrl, REPORTS_OWNER_ID: ownerIds[0] };
if (process.argv.includes("--apply")) {
  try {
    execFileSync("vp", ["exec", "wrangler", "secret", "bulk", "--config", "../wrangler.jsonc"], {
      cwd: fileURLToPath(new URL("../services/", import.meta.url)), input: JSON.stringify(bindings), encoding: "utf8", stdio: ["pipe", "pipe", "pipe"],
    });
  } catch { throw new Error("Could not configure Worker report access. No account values have been printed."); }
  console.log("Report access configured for the app's existing owner account.");
} else {
  console.log("Verified one existing owner account on the app's configured deployment. No changes made. Use --apply to configure the Worker at release time.");
}
