import { getAuthUserId } from "@convex-dev/auth/server";

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * The signed-in user, or null.
 *
 * Convex Auth does not reliably populate `users.email` — it lives on the
 * `authAccounts` row as `providerAccountId`, which is what the sibling
 * Consistency repo reads too.
 */
export const current = query({
  args: {},
  returns: v.union(v.null(), v.object({
    _id: v.id("users"), email: v.union(v.string(), v.null()),
    emailVerified: v.boolean(), createdAt: v.number(),
  })),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;

    const user = await ctx.db.get(userId);
    if (user === null) return null;

    const account = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", userId))
      .first();

    return {
      _id: user._id,
      email: user.email ?? account?.providerAccountId ?? null,
      emailVerified: typeof user.emailVerificationTime === "number",
      createdAt: user._creationTime,
    };
  },
});

/** Company identity belongs to the signed-in account, never a caller-supplied user ID. */
export const profile = query({
  args: {},
  returns: v.union(v.null(), v.object({ companyName: v.string() })),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const profile = await ctx.db.query("accountProfiles").withIndex("by_user", q => q.eq("userId", userId)).unique();
    return { companyName: profile?.companyName ?? "" };
  },
});

export const setCompanyName = mutation({
  args: { companyName: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in to name your company.");
    const companyName = args.companyName.trim();
    if (!companyName || companyName.length > 80) throw new Error("Use a company name between 1 and 80 characters.");
    const profile = await ctx.db.query("accountProfiles").withIndex("by_user", q => q.eq("userId", userId)).unique();
    if (profile) await ctx.db.patch(profile._id, { companyName });
    else await ctx.db.insert("accountProfiles", { userId, companyName });
    return null;
  },
});
