/**
 * The server's check that a value is a language, for a product's Convex
 * functions and schema. Built from the list in `./languages`, so it cannot
 * drift from what the interface offers.
 *
 * Import it by path, from a product's `convex/` folder:
 *
 *   import { languageValidator } from "@0001-labs/design-system-1/DS1/0-face/language-validator.ts";
 *
 * It is not exported from `DS1/index.ts`, so the browser bundle stays free of
 * `convex/values`.
 */
import { v } from "convex/values";
import type { VLiteral, VUnion } from "convex/values";
import { LANGUAGES, isLanguage } from "./languages";
import type { Language } from "./languages";

export type LanguageValidator<L extends Language = Language> = VUnion<
  L,
  VLiteral<L, "required">[],
  "required",
  never
>;

/**
 * A validator for some of the languages: the ones a product saves, say. Every
 * code must be in the list, and there must be at least one.
 */
export function languageValidatorFor<L extends Language>(
  languages: readonly L[]
): LanguageValidator<L> {
  if (languages.length === 0) {
    throw new Error("languageValidatorFor needs at least one language.");
  }
  const unknown = languages.filter((code) => !isLanguage(code));
  if (unknown.length > 0) {
    throw new Error(
      `languageValidatorFor got codes that are not in the language list: ${unknown.join(", ")}`
    );
  }
  const unique = [...new Set(languages)];
  return v.union(...unique.map((code) => v.literal(code))) as LanguageValidator<L>;
}

/** Accepts every language in the list (`LANGUAGES`). */
export const languageValidator: LanguageValidator = languageValidatorFor(LANGUAGES);
