import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v, type Value } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { sha256Hex, utf8ByteLength } from "./lib/hash";
import { baseOverrides, baseSheet, MAX_BASE_BYTES } from "../shared/base-sheet";

/**
 * The base system: the owner's edits on designsystem1.com, live in every product that links
 * `/ds1/base/latest.css`. The Worker checks the owner and the release flag before it calls these,
 * then writes the returned sheet to R2; these check the owner again, so nobody else can write the
 * base even by calling Convex directly.
 */

function fail(code: string, message: string, details?: Record<string, Value>): never {
  throw new ConvexError(details === undefined ? { code, message } : { code, message, details });
}

/** The verified account whose address is SIGN_IN_OWNER_EMAIL, the same owner sign-in names. */
async function requireOwner(ctx: QueryCtx | MutationCtx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) fail("unauthenticated", "Sign in to continue.");
  const owner = process.env.SIGN_IN_OWNER_EMAIL?.trim().toLowerCase();
  const user = await ctx.db.get(userId);
  const account = await ctx.db.query("authAccounts").withIndex("userIdAndProvider", q => q.eq("userId", userId)).first();
  const email = (user?.email ?? account?.providerAccountId ?? "").trim().toLowerCase();
  if (!owner || email !== owner || typeof user?.emailVerificationTime !== "number") fail("forbidden", "The base system is edited by the studio owner.");
  return userId;
}

async function current(ctx: QueryCtx | MutationCtx) {
  return ctx.db.query("baseSystem").first();
}

const baseValue = { css: v.string(), rev: v.number(), version: v.number(), updatedAt: v.number(), sheet: v.string(), contentHash: v.string() };
const saved = v.object({ ...baseValue, unchanged: v.boolean() });

function summary(base: Doc<"baseSystem"> | null, version: Doc<"baseVersions"> | null) {
  return base && version ? { css: base.css, rev: base.rev, version: base.version, updatedAt: base.updatedAt, sheet: version.sheet, contentHash: version.contentHash } : null;
}

/** The base as the owner last saved it, or null before the first save. */
export const get = query({
  args: {},
  returns: v.union(v.null(), v.object(baseValue)),
  handler: async (ctx) => {
    await requireOwner(ctx);
    const base = await current(ctx);
    const version = base ? await ctx.db.query("baseVersions").withIndex("by_version", q => q.eq("version", base.version)).unique() : null;
    return summary(base, version);
  },
});

/** The latest versions, newest first, without their stylesheets. */
export const history = query({
  args: {},
  returns: v.array(v.object({ version: v.number(), createdAt: v.number(), contentHash: v.string(), restoredFrom: v.union(v.number(), v.null()), overrides: v.number() })),
  handler: async (ctx) => {
    await requireOwner(ctx);
    const versions = await ctx.db.query("baseVersions").withIndex("by_version").order("desc").take(50);
    return versions.map(row => ({ version: row.version, createdAt: row.createdAt, contentHash: row.contentHash, restoredFrom: row.restoredFrom ?? null, overrides: (row.sheet.match(/^\s+--/gm) ?? []).length }));
  },
});

async function store(ctx: MutationCtx, userId: Id<"users">, css: string, restoredFrom?: number) {
  const base = await current(ctx);
  if (base?.css === css) {
    const live = await ctx.db.query("baseVersions").withIndex("by_version", q => q.eq("version", base.version)).unique();
    return { ...summary(base, live)!, unchanged: true };
  }
  const read = baseOverrides(css);
  if ("error" in read) fail("invalid_tokens", read.error);
  const version = (base?.version ?? 0) + 1;
  const sheet = baseSheet(read.overrides, version);
  const contentHash = await sha256Hex(sheet);
  const now = Date.now();
  await ctx.db.insert("baseVersions", { version, css, sheet, contentHash, createdAt: now, createdBy: userId, ...(restoredFrom === undefined ? {} : { restoredFrom }) });
  const rev = (base?.rev ?? 0) + 1;
  if (base) await ctx.db.patch(base._id, { css, rev, version, updatedAt: now, updatedBy: userId });
  else await ctx.db.insert("baseSystem", { css, rev, version, updatedAt: now, updatedBy: userId });
  return { css, rev, version, updatedAt: now, sheet, contentHash, unchanged: false };
}

/** Save the base as a new live version. A stale revision is refused, never merged. */
export const save = mutation({
  args: { css: v.string(), baseRev: v.number() },
  returns: saved,
  handler: async (ctx, args) => {
    const userId = await requireOwner(ctx);
    if (utf8ByteLength(args.css) > MAX_BASE_BYTES) fail("too_large", "The base stylesheet is too large.");
    const base = await current(ctx);
    if ((base?.rev ?? 0) !== args.baseRev) fail("draft_conflict", "The base was saved somewhere else.", { serverRev: base?.rev ?? 0 });
    return store(ctx, userId, args.css);
  },
});

/** Make an earlier version live again, as a new version, so history only grows. */
export const restore = mutation({
  args: { version: v.number() },
  returns: saved,
  handler: async (ctx, args) => {
    const userId = await requireOwner(ctx);
    const row = await ctx.db.query("baseVersions").withIndex("by_version", q => q.eq("version", args.version)).unique();
    if (!row) fail("not_found", "That version does not exist.");
    return store(ctx, userId, row.css, row.version);
  },
});
