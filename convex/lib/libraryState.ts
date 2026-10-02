import type { Doc } from "../_generated/dataModel";

export type LibraryState =
  | "purged"
  | "archived"
  | "failed-validation"
  | "publishing"
  | "draft"
  | "unpublished-changes"
  | "published";

/**
 * The dashboard state of a library, derived rather than stored.
 *
 * One function, used by both `libraries.list` and `libraries.get`, so a card
 * and the editor it opens can never disagree about what state something is in.
 *
 * `failed-validation` deliberately takes precedence over `published`: a library
 * can be serving v6 while its most recent publish attempt failed, and the spec
 * requires that be visible. The flag is sticky until the next publish attempt,
 * so it survives a reload.
 */
export function libraryState(library: Doc<"libraries">): LibraryState {
  if (library.purgedAt !== undefined) return "purged";
  if (library.archivedAt !== undefined) return "archived";
  if (library.lastPublishStatus === "failed") return "failed-validation";
  if (library.lastPublishStatus === "in_progress") return "publishing";
  if (library.publishedVersion === undefined) return "draft";
  if (library.draftHash !== library.publishedHash) return "unpublished-changes";
  return "published";
}

export function hasUnpublishedChanges(library: Doc<"libraries">): boolean {
  return library.publishedVersion !== undefined && library.draftHash !== library.publishedHash;
}
