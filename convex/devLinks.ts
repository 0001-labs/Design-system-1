import { v } from "convex/values";

import { internalMutation, internalQuery } from "./_generated/server";
import { normalizeEmail } from "./lib/token";

/**
 * Dev-only capture of the most recent magic link per email, so the end-to-end
 * test can sign in without a mail server.
 *
 * Every function here refuses to run unless DEV_LOGIN_LINKS is explicitly set,
 * and they are `internal` so they are unreachable from a browser client. The
 * HTTP surface that exposes them (`http.ts`) applies the same guard again.
 */
function devLinksEnabled(): boolean {
  return process.env.DEV_LOGIN_LINKS === "1";
}

export const record = internalMutation({
  args: { email: v.string(), url: v.string(), expiresAt: v.number() },
  handler: async (ctx, args) => {
    if (!devLinksEnabled()) return;

    const email = normalizeEmail(args.email);

    // Keep exactly one row per address: a stale link that still verifies is a
    // live credential sitting in a table nobody is watching.
    const existing = await ctx.db
      .query("devLoginLinks")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();
    for (const row of existing) await ctx.db.delete(row._id);

    await ctx.db.insert("devLoginLinks", { email, url: args.url, createdAt: Date.now() });
  },
});

export const latest = internalQuery({
  args: { email: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!devLinksEnabled()) return null;

    if (args.email !== undefined) {
      const email = normalizeEmail(args.email);
      const row = await ctx.db
        .query("devLoginLinks")
        .withIndex("by_email", (q) => q.eq("email", email))
        .first();
      return row ? { email: row.email, url: row.url, createdAt: row.createdAt } : null;
    }

    const rows = await ctx.db.query("devLoginLinks").collect();
    const newest = rows.sort((a, b) => b.createdAt - a.createdAt)[0];
    return newest ? { email: newest.email, url: newest.url, createdAt: newest.createdAt } : null;
  },
});
