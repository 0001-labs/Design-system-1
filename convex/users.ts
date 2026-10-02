import { getAuthUserId } from "@convex-dev/auth/server";

import { query } from "./_generated/server";

/**
 * The signed-in user, or null.
 *
 * Convex Auth does not reliably populate `users.email` — it lives on the
 * `authAccounts` row as `providerAccountId`, which is what the sibling
 * Consistency repo reads too.
 */
export const current = query({
  args: {},
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
      createdAt: user._creationTime,
    };
  },
});
