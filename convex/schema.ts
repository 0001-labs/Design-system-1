import { authTables } from "@convex-dev/auth/server";
import { signInTables } from "./signIn/schema";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Convex is the database for hosted DS1 libraries. There is no SQL anywhere in
 * the system: R2 holds the served bytes, and these tables hold everything else.
 */
export default defineSchema({
  // users, authSessions, authAccounts, authRefreshTokens,
  // authVerificationCodes, authVerifiers, authRateLimits
  ...authTables,
  ...signInTables,

  accountProfiles: defineTable({
    userId: v.id("users"),
    companyName: v.string(),
  }).index("by_user", ["userId"]),

  libraries: defineTable({
    /** 20-char Crockford base32, the `/ds1/{publicId}/` segment. */
    publicId: v.string(),

    // A real Id reference, deliberately not the v.string() convention used in
    // the sibling Consistency repo: getAuthUserId returns Id<"users">, so the
    // typed reference costs nothing and the database enforces it.
    ownerId: v.id("users"),

    name: v.string(),
    /** Dashboard URL only. Never public — publicId is what customers see. */
    slug: v.string(),
    /** e.g. '0.0.1-alpha.1+sha256:ab12cd34', so template drift is answerable. */
    templateVersion: v.string(),

    archivedAt: v.optional(v.number()),
    purgedAt: v.optional(v.number()),

    // ---- draft: exactly one per library, stored inline ----
    // The spec requires no draft history, so autosave is a single patch: no
    // insert churn, no index growth, nothing to garbage collect.

    /** AUTHORITATIVE. The published artifact is these exact bytes. */
    draftCss: v.string(),
    /** Opaque JSON of advisory UI state. Stored verbatim, never interpreted. */
    draftConfig: v.string(),
    draftHash: v.string(),
    /** Optimistic-concurrency token; the client sends it back as baseRev. */
    draftRev: v.number(),
    draftUpdatedAt: v.number(),

    // ---- publication ----
    /** Reserved for publish-time lowering/minification. False in v1. */
    optimize: v.boolean(),
    nextVersion: v.number(),
    publishedVersion: v.optional(v.number()),
    /** sha256 of the draft the live version was published from (its version row's sourceHash). */
    publishedHash: v.optional(v.string()),
    publishedAt: v.optional(v.number()),
    publishLockUntil: v.optional(v.number()),
    lastPublishStatus: v.union(
      v.literal("never"),
      v.literal("in_progress"),
      v.literal("succeeded"),
      v.literal("failed"),
    ),
    /** JSON array of validator issues. Sticky until the next publish attempt. */
    lastPublishError: v.optional(v.string()),
  })
    .index("by_publicId", ["publicId"])
    .index("by_owner", ["ownerId"])
    .index("by_owner_slug", ["ownerId", "slug"]),

  libraryVersions: defineTable({
    libraryId: v.id("libraries"),
    version: v.number(),
    status: v.union(v.literal("writing"), v.literal("published"), v.literal("orphaned")),

    /** sha256 of the published bytes. */
    contentHash: v.string(),
    /** sha256 of the draft it came from; equal to contentHash for versions published untransformed. */
    sourceHash: v.string(),
    /** 'none' for early versions; 'ds1-library@sha256:…' for a draft prepared by that DS1 library revision. */
    transform: v.string(),

    byteSize: v.number(),
    r2Key: v.string(),
    r2Etag: v.optional(v.string()),
    sourceDraftRev: v.number(),
    createdBy: v.id("users"),
    note: v.optional(v.string()),
  })
    .index("by_library", ["libraryId"])
    .index("by_library_version", ["libraryId", "version"]),

  /**
   * Dev-only capture of the most recent magic link per email, so Playwright can
   * sign in without a mail server.
   *
   * Written and read only when DEV_LOGIN_LINKS is set, which is an explicit
   * per-deployment opt-in rather than something inferred from the environment —
   * inferring "am I production?" is exactly the check you do not want to get
   * subtly wrong on an endpoint that hands out sign-in links.
   */
  devLoginLinks: defineTable({
    email: v.string(),
    url: v.string(),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  publishEvents: defineTable({
    libraryId: v.id("libraries"),
    kind: v.union(v.literal("publish"), v.literal("rollback")),
    status: v.union(v.literal("in_progress"), v.literal("succeeded"), v.literal("failed")),
    fromVersion: v.optional(v.number()),
    toVersion: v.optional(v.number()),
    actorId: v.optional(v.id("users")),
    startedAt: v.number(),
    finishedAt: v.optional(v.number()),
    /** validation | r2_version | r2_latest | metadata | lock */
    failureStage: v.optional(v.string()),
    issues: v.optional(v.string()),
  }).index("by_library", ["libraryId"]),

  /**
   * The base system as the owner edits it on designsystem1.com: one row, the truth that live
   * products read through `/ds1/base/latest.css`. Owner-only; see convex/base.ts.
   */
  baseSystem: defineTable({
    /** The whole workbench stylesheet: the component template and its final override block. */
    css: v.string(),
    /** Optimistic-concurrency token, as a library draft's. */
    rev: v.number(),
    /** The live version, a row of baseVersions. */
    version: v.number(),
    updatedAt: v.number(),
    updatedBy: v.id("users"),
  }),

  /** Every saved base, immutable, so any of them can be made live again. */
  baseVersions: defineTable({
    version: v.number(),
    css: v.string(),
    /** The served bytes: the override block alone (shared/base-sheet.ts). */
    sheet: v.string(),
    contentHash: v.string(),
    createdAt: v.number(),
    createdBy: v.id("users"),
    /** Set when this version restored an earlier one. */
    restoredFrom: v.optional(v.number()),
  }).index("by_version", ["version"]),
});
