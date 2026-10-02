import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v, type Value } from "convex/values";

import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { action, internalMutation, internalQuery, query } from "./_generated/server";
import { headLatest, putLatest } from "./lib/artifacts";
import { publishResultValidator } from "./publish";

function fail(code: string, message: string, details?: Record<string, Value>): never {
  const payload: Record<string, Value> = { code, message };
  if (details !== undefined) payload.details = details;
  throw new ConvexError(payload);
}

async function requireOwned(
  ctx: { auth: unknown; db: { get: (id: Id<"libraries">) => Promise<Doc<"libraries"> | null> } },
  id: Id<"libraries">,
): Promise<Doc<"libraries">> {
  const userId = await getAuthUserId(ctx as never);
  if (userId === null) fail("unauthenticated", "Sign in to continue.");

  const library = await ctx.db.get(id);
  if (library === null || library.ownerId !== userId || library.purgedAt !== undefined) {
    fail("not_found", "That library does not exist.");
  }
  return library;
}

function assetsBase(): string {
  return (process.env.ASSETS_BASE ?? "https://designsystem1.com/ds1").replace(/\/$/, "");
}

/**
 * Publication history: versions and the events that produced them, including
 * the failures.
 *
 * Failed attempts are returned alongside successful versions rather than hidden,
 * because `failed-validation` is a state the dashboard is required to surface
 * and the issue list is the only actionable thing about it.
 */
export const history = query({
  args: { id: v.id("libraries") },
  returns: v.object({
    publishedVersion: v.union(v.number(), v.null()),
    versions: v.array(
      v.object({
        version: v.number(),
        status: v.string(),
        byteSize: v.number(),
        contentHash: v.string(),
        note: v.union(v.string(), v.null()),
        createdAt: v.number(),
        isLive: v.boolean(),
        immutableUrl: v.string(),
      }),
    ),
    events: v.array(
      v.object({
        _id: v.id("publishEvents"),
        kind: v.string(),
        status: v.string(),
        fromVersion: v.union(v.number(), v.null()),
        toVersion: v.union(v.number(), v.null()),
        startedAt: v.number(),
        finishedAt: v.union(v.number(), v.null()),
        failureStage: v.union(v.string(), v.null()),
        issues: v.union(v.string(), v.null()),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    const library = await requireOwned(ctx, args.id);

    const versions = await ctx.db
      .query("libraryVersions")
      .withIndex("by_library", (q) => q.eq("libraryId", library._id))
      .collect();

    const events = await ctx.db
      .query("publishEvents")
      .withIndex("by_library", (q) => q.eq("libraryId", library._id))
      .collect();

    return {
      publishedVersion: library.publishedVersion ?? null,
      versions: versions
        .sort((a, b) => b.version - a.version)
        .map((row) => ({
          version: row.version,
          status: row.status,
          byteSize: row.byteSize,
          contentHash: row.contentHash,
          note: row.note ?? null,
          createdAt: row._creationTime,
          isLive: row.version === library.publishedVersion,
          immutableUrl: `${assetsBase()}/${library.publicId}/v/${row.version}.css`,
        })),
      events: events
        .sort((a, b) => b.startedAt - a.startedAt)
        .slice(0, 30)
        .map((row) => ({
          _id: row._id,
          kind: row.kind,
          status: row.status,
          fromVersion: row.fromVersion ?? null,
          toVersion: row.toVersion ?? null,
          startedAt: row.startedAt,
          finishedAt: row.finishedAt ?? null,
          failureStage: row.failureStage ?? null,
          issues: row.issues ?? null,
        })),
    };
  },
});

/**
 * Roll back by repointing `latest.css`, minting no new version.
 *
 * This is deliberately the *same single write* as the last step of a publish:
 * copy a version's exact bytes over the live pointer. Every prior version stays
 * reachable at its immutable URL forever, and rolling forward again is just
 * another rollback to a higher number.
 */
export const rollback = action({
  args: { id: v.id("libraries"), version: v.number() },
  returns: publishResultValidator,
  handler: async (ctx, args): Promise<{
    version: number;
    publishedAt: number;
    installUrl: string;
    immutableUrl: string;
  }> => {
    const target = await ctx.runQuery(internal.versions.forRollback, {
      id: args.id,
      version: args.version,
    });

    // Read the exact bytes back from the public artifact rather than
    // regenerating them: what gets restored is what customers actually had.
    const response = await fetch(`${assetsBase()}/${target.publicId}/v/${args.version}.css`);
    if (!response.ok) {
      fail("version_unavailable", "That version's stylesheet could not be read back from storage.");
    }
    const css = await response.text();

    const eventId = await ctx.runMutation(internal.versions.beginRollback, {
      id: args.id,
      toVersion: args.version,
    });

    try {
      await putLatest(target.publicId, args.version, css, {
        libraryId: args.id,
        contentHash: target.contentHash,
      });
    } catch (error) {
      await ctx.runMutation(internal.versions.failRollback, { eventId, id: args.id });
      throw new ConvexError({
        code: "artifact_write_failed",
        message: "The rollback could not be written. The live version is unchanged.",
        details: { stage: "r2_latest" },
      });
    }

    return await ctx.runMutation(internal.versions.finishRollback, {
      id: args.id,
      eventId,
      version: args.version,
      contentHash: target.contentHash,
    });
  },
});

export const forRollback = internalQuery({
  args: { id: v.id("libraries"), version: v.number() },
  returns: v.object({ publicId: v.string(), contentHash: v.string() }),
  handler: async (ctx, args) => {
    const library = await requireOwned(ctx, args.id);

    const version = await ctx.db
      .query("libraryVersions")
      .withIndex("by_library_version", (q) =>
        q.eq("libraryId", library._id).eq("version", args.version),
      )
      .unique();

    if (version === null) fail("unknown_version", "That version does not exist.");
    if (version.status !== "published") {
      fail("version_not_publishable", "That version was never successfully published.");
    }
    if (library.publishedVersion === args.version) {
      fail("already_live", "That version is already live.");
    }

    return { publicId: library.publicId, contentHash: version.contentHash };
  },
});

export const beginRollback = internalMutation({
  args: { id: v.id("libraries"), toVersion: v.number() },
  returns: v.id("publishEvents"),
  handler: async (ctx, args) => {
    const library = await requireOwned(ctx, args.id);
    return await ctx.db.insert("publishEvents", {
      libraryId: library._id,
      kind: "rollback",
      status: "in_progress",
      fromVersion: library.publishedVersion,
      toVersion: args.toVersion,
      actorId: library.ownerId,
      startedAt: Date.now(),
    });
  },
});

export const failRollback = internalMutation({
  args: { id: v.id("libraries"), eventId: v.id("publishEvents") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.eventId, {
      status: "failed",
      finishedAt: Date.now(),
      failureStage: "r2_latest",
    });
    return null;
  },
});

export const finishRollback = internalMutation({
  args: {
    id: v.id("libraries"),
    eventId: v.id("publishEvents"),
    version: v.number(),
    contentHash: v.string(),
  },
  returns: publishResultValidator,
  handler: async (ctx, args) => {
    const library = await requireOwned(ctx, args.id);
    const now = Date.now();

    await ctx.db.patch(library._id, {
      publishedVersion: args.version,
      publishedHash: args.contentHash,
      publishedAt: now,
      lastPublishStatus: "succeeded",
      lastPublishError: undefined,
    });

    await ctx.db.patch(args.eventId, { status: "succeeded", finishedAt: now });

    return {
      version: args.version,
      publishedAt: now,
      installUrl: `${assetsBase()}/${library.publicId}/latest.css`,
      immutableUrl: `${assetsBase()}/${library.publicId}/v/${args.version}.css`,
    };
  },
});

/**
 * Repair the database from R2 when a publish died between writing `latest.css`
 * and recording it.
 *
 * R2 wins, because R2 is what the world is actually being served.
 *
 * A note on where this runs: the SQL plan called this on every library-detail
 * GET. Convex queries cannot make network requests, so it cannot live inside
 * `libraries.get` — it is an action, invoked when a library is left showing
 * `in_progress`. In practice a retried publish is self-healing anyway, because
 * writing an identical version is idempotent.
 */
export const reconcile = action({
  args: { id: v.id("libraries") },
  returns: v.object({ repaired: v.boolean(), liveVersion: v.union(v.number(), v.null()) }),
  handler: async (ctx, args): Promise<{ repaired: boolean; liveVersion: number | null }> => {
    const state = await ctx.runQuery(internal.versions.forReconcile, { id: args.id });
    const live = await headLatest(state.publicId);

    if (live === null || live.version === null) {
      return { repaired: false, liveVersion: null };
    }

    if (live.version === state.publishedVersion) {
      return { repaired: false, liveVersion: live.version };
    }

    await ctx.runMutation(internal.versions.applyReconciliation, {
      id: args.id,
      version: live.version,
      contentHash: live.contentHash ?? "",
    });

    return { repaired: true, liveVersion: live.version };
  },
});

export const forReconcile = internalQuery({
  args: { id: v.id("libraries") },
  returns: v.object({ publicId: v.string(), publishedVersion: v.union(v.number(), v.null()) }),
  handler: async (ctx, args) => {
    const library = await requireOwned(ctx, args.id);
    return { publicId: library.publicId, publishedVersion: library.publishedVersion ?? null };
  },
});

export const applyReconciliation = internalMutation({
  args: { id: v.id("libraries"), version: v.number(), contentHash: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const library = await requireOwned(ctx, args.id);

    await ctx.db.patch(library._id, {
      publishedVersion: args.version,
      publishedHash: args.contentHash,
      publishedAt: Date.now(),
      lastPublishStatus: "succeeded",
    });

    const version = await ctx.db
      .query("libraryVersions")
      .withIndex("by_library_version", (q) =>
        q.eq("libraryId", library._id).eq("version", args.version),
      )
      .unique();

    if (version !== null && version.status === "writing") {
      await ctx.db.patch(version._id, { status: "published" });
    }

    return null;
  },
});
