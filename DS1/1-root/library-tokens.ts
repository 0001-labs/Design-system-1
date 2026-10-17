// How a published design library reaches Design system 1's components. A library is a stylesheet
// its owner edits in the libraries app, written in the classless sheet's `--one-*` tokens
// (one.semantic.css) and its native selectors. DS1's components draw from `--ds-*` tokens
// (component-tokens.css, component-metrics.css) and, in some faces, one.css's own names
// (`--accent-color`). Publishing prepares the library
// (packages/css-validate/src/library.ts): after each `--one-*` token below that the library
// declares, it writes the component token that follows it, in the same rule, so the library's
// corners, fills, accent and type reach the components wherever the library sets them. A page
// without a library loads none of this, so DS1's own defaults never change.
//
// Change the bridge here, then update LIBRARY_REVISION: packages/css-validate/test/library.test.ts recomputes it.

/** `[component token, library token]`: each component token takes the library token's value. */
export const LIBRARY_TOKENS = [
  // Colours.
  ["--ds-accent-color", "--one-accent-color"],
  ["--ds-button-background-color-primary", "--one-button-primary-background"],
  ["--ds-button-text-color-on-accent", "--one-button-primary-text"],
  ["--ds-button-background-color-secondary", "--one-button-neutral-background"],
  ["--ds-button-text-color", "--one-button-neutral-text"],
  ["--ds-fill-hover", "--one-button-neutral-background-hover"],
  ["--ds-paper", "--one-background"],
  ["--ds-fill", "--one-surface"],
  ["--ds-text-color", "--one-text"],
  ["--ds-text-color-muted", "--one-text-muted"],
  ["--ds-border-color", "--one-border"],
  ["--ds-focus-ring", "--one-color-focus"],
  ["--ds-input-background", "--one-input-background"],
  ["--ds-input-color", "--one-input-text"],
  ["--ds-input-placeholder-color", "--one-input-placeholder"],
  ["--ds-input-disabled-color", "--one-input-disabled-text"],
  // The same colours under one.css's names, which the faces of ds-button and ds-input read.
  ["--accent-color", "--one-accent-color"],
  ["--button-background-color-primary", "--one-button-primary-background"],
  ["--button-text-color-on-light", "--one-button-primary-text"],
  ["--button-background-color-secondary", "--one-button-neutral-background"],
  ["--button-text-color", "--one-button-neutral-text"],
  ["--base-light-grey", "--one-input-background"],
  ["--base-slate", "--one-input-text"],
  // Type.
  ["--ds-typeface-regular", "--one-font"],
  ["--ds-typeface-medium", "--one-font-medium"],
  ["--ds-typeface-mono", "--one-font-mono"],
  // Measures, unscaled: component-metrics.css multiplies each by the component's --ds-sf.
  ["--ds-text-size", "--one-font-size"],
  ["--ds-small-text-size", "--one-font-size-small"],
  ["--ds-heading-text-size", "--one-heading-size"],
  ["--ds-display-text-size", "--one-display-size"],
  ["--ds-text-tracking", "--one-letter-spacing"],
  ["--ds-control-size", "--one-control-height"],
  ["--ds-corner-size", "--one-radius"],
  ["--ds-card-corner-size", "--one-radius"],
  ["--ds-button-inset", "--one-button-padding-inline"],
  ["--ds-1", "--one-unit"],
] as const satisfies ReadonlyArray<readonly [`--${string}`, `--one-${string}`]>;

/**
 * A link drawn as a button: `<a data-library-button>`. Publishing gives it the library's button
 * faces (every `button` selector also matches it, `a` selectors leave it out) and
 * `aria-disabled="true"` on it the disabled face, while it stays a link: navigation, selection and
 * modifier-click are the browser's.
 */
export const LIBRARY_BUTTON_LINK = "data-library-button";

/** The selector rewrites publishing applies, by what they replace. Specificity is kept: additions are in `:where()`. */
export const LIBRARY_SELECTORS = {
  button: `:is(button, :where(a[${LIBRARY_BUTTON_LINK}]))`,
  a: `a:not(:where([${LIBRARY_BUTTON_LINK}]))`,
  ":disabled": `:is(:disabled, :where([${LIBRARY_BUTTON_LINK}][aria-disabled="true"]))`,
} as const;

/**
 * What a button-link takes from the browser's button rather than its link, before any library
 * rule: no underline, a box, centred words. Without specificity, so every library rule wins.
 */
export const LIBRARY_BUTTON_LINK_BASE = `:where(a[${LIBRARY_BUTTON_LINK}]) { display: inline-block; text-align: center; text-decoration: none; }`;

/**
 * The revision of the rules above: `sha256:` and the first 12 hex digits of the sha256 of
 * `JSON.stringify({ tokens: LIBRARY_TOKENS, selectors: LIBRARY_SELECTORS, base: LIBRARY_BUTTON_LINK_BASE })`. Every published
 * version is stamped with it, and Sync 1 records it when a product pins the version.
 */
export const LIBRARY_REVISION = "sha256:8a0b55ce3acd";

/** The first line of a prepared library. */
export const libraryStamp = (revision = LIBRARY_REVISION as string) => `/* Design system 1 library, revision ${revision} */`;

/** The revision a prepared library was stamped with, or undefined for a library published before stamping. */
export function libraryRevision(css: string): string | undefined {
  return /^(?:\uFEFF)?(?:@charset "[^"]*";\s*)?\/\* Design system 1 library, revision (sha256:[0-9a-f]{12}) \*\//.exec(css)?.[1];
}
