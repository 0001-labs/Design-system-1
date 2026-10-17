---
title: My libraries
description: Save, edit and publish your Design system 1 stylesheets.
---

My libraries is your workspace for saved Design system 1 stylesheets. Sign in with the existing Design system 1 account to create a library, edit a draft, and publish a CSS URL for your pages.

[Open My libraries](/app/libraries) · [Sign in](/app/signin)

## Drafts and published CSS

Drafts belong to your account. Saving a draft does not publish it. Publishing creates a version of the stylesheet that a page can load by URL. Published CSS is public; keep secrets and private content out of it.

The editor and the API operate on the same libraries. Revision checks protect a draft from silently overwriting someone else's changes. [Read the API and tools guide](/libraries/api/).

## Start without an account

The [documentation](/start-here/overview/) and [downloadable HTML examples](/start-here/examples/) are public. You do not need an account, a framework or a build step to style your own HTML.

The [playground](/app/playground) is for temporary experiments. Copy your work to keep it, or sign in to save a library.

## Your library and the components

A library is written in the classless sheet's `--one-*` tokens and native selectors (`button`, `input`, `a`). Design system 1's components draw from their own component tokens. Publishing joins the two, without changing what you wrote:

- After each `--one-*` token your library sets, in the same rule, it sets the component token that follows it: `--one-radius` gives `--ds-corner-size`, `--one-accent-color` gives `--ds-accent-color`, `--one-font` gives `--ds-typeface-regular`, and so on for fills, text, borders, fields and type sizes. So `ds-button`, `ds-input` and `ds-menu` take your corners, fills, accent and type, in light and dark, wherever your library sets them. A rule that sets a component token itself keeps its own value.
- A link marked `data-library-button` takes your button faces: every `button` selector also matches it, `a` selectors leave it out, and `aria-disabled="true"` on it takes the `:disabled` face. It stays a link for the keyboard, assistive technology and modifier-click. Selectors keep their specificity, and a rule that already names `data-library-button` is left as you wrote it.
- The first line names the revision of these rules: `/* Design system 1 library, revision sha256:… */`.

The square, the control height and the menu's rows stay Design system 1's. Your brand stays yours: the bridge only passes your values on, and a page without a library draws the components exactly as before. Load the library after Design system 1's stylesheets, and in the same cascade layer or a later one, so its tokens win.

## Pin a version in a product

`latest.css` changes with every publish. A product that wants to know what it carries pins one version instead. Every version stays published at its own address, `/ds1/<id>/v/<n>.css`, written once and never changed.

Name the library and version under Design system 1 in the product's `sync.json` (the publish panel shows the entry):

```json
{ "library": { "to": "src/design", "id": "<library id>", "version": 4 } }
```

Sync 1 fetches that version, checks it against the hash the publish recorded and its stamp, and copies it unchanged to `ds1-library/<id>/v/4.css` with `ds1-library/library-manifest.json` (its address, revision and sha256). `sync.lock.json` records both files' hashes at the Design system 1 commit, and `sync1 check` fails if either is edited. `"sha256"` also checks the version against a hash you name; `"styles": false` leaves out the run-time connector, `library-styles.ts`, for a `to` in `public/`. Import the copy as any stylesheet. To move to a new version, change `version` and run `sync1`.

A version published before publishing stamped libraries cannot be pinned: publish the library again and pin the new version.
