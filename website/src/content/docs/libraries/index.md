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

The [documentation](/) and [downloadable HTML examples](/start-here/examples/) are public. You do not need an account, a build step to use the components directly in HTML.

The [playground](/app/playground) is for temporary experiments. Copy your work to keep it, or sign in to save a library.

## Your library and the components

A new library starts with the component tokens and measures. Edit its `--ds-*` tokens to customize type, colours, corners and other documented component choices. Load its published stylesheet after Design system 1's stylesheet so those choices apply to the Lit elements.

The component module is still required. Publishing CSS does not register custom elements or implement their behavior. Existing saved libraries and immutable published versions remain available; older token names are translated by the publishing compatibility layer.

## Pin a version in a product

`latest.css` changes with every publish. A product that wants to know what it carries pins one version instead. Every version stays published at its own address, `/ds1/<id>/v/<n>.css`, written once and never changed.

Name the library and version under Design system 1 in the product's `sync.json` (the publish panel shows the entry):

```json
{ "library": { "to": "src/design", "id": "<library id>", "version": 4 } }
```

Sync 1 fetches that version, checks it against the hash the publish recorded and its stamp, and copies it unchanged to `ds1-library/<id>/v/4.css` with `ds1-library/library-manifest.json` (its address, revision and sha256). `sync.lock.json` records both files' hashes at the Design system 1 commit, and `sync1 check` fails if either is edited. `"sha256"` also checks the version against a hash you name; `"styles": false` leaves out the run-time connector, `library-styles.ts`, for a `to` in `public/`. Import the copy as any stylesheet. To move to a new version, change `version` and run `sync1`.

A version published before publishing stamped libraries cannot be pinned: publish the library again and pin the new version.
