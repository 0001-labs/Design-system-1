# Issue list

## Starlight documentation

Status: implemented; content and visual review remain open.

The original request calls for Starlight documentation for DS one (now Design
system 1). The referenced `specification.md` is absent from this checkout, so
this entry records the request and the current implementation rather than
claiming a full specification review.

- [x] Configure Astro and Starlight in `website/`.
- [x] Configure the documentation content collection and schema.
- [x] Add navigation for setup, foundations, components, built-ins, and advanced guides.
- [x] Integrate the project header, sidebar, layout, and styles.
- [x] Provide root commands for documentation development, build, and preview.
- [x] Document how to maintain the site in `website/README.md`.
- [x] Verify the static build and generated search index.
- [ ] Reconcile this checklist with the original specification when available.
- [ ] Review examples against the current component APIs and package publication status.
- [ ] User review of navigation, search, responsive layout, and appearance.

Validation on 2026-09-16: `vp run docs:build` passed, generating 41 pages
and a Pagefind index covering 40 pages. The build reported a missing optional
`docs → 404` entry and a Node child-process deprecation warning. Browser testing
and deployment were not performed.
