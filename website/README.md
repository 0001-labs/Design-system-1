# Design system 1 documentation

The documentation site uses Astro and Starlight. Its configured public URL is
[designsystem1.com](https://designsystem1.com/).

## Local development

Use the repository's Vite+ toolchain and Node version declared in the root
`package.json`. Run these commands from the repository root:

```sh
vp install
vp run docs:dev
```

Open the address printed by Astro, normally <http://localhost:4321>.
For the embedded library editor, run `vp run app:dev` in another terminal.
The documentation dev server proxies `/app` to `http://127.0.0.1:5173`;
`DS1_APP_DEV_ORIGIN` can override that origin.

## Writing documentation

- Add Markdown or MDX pages under `src/content/docs/`, with `title` and
  `description` frontmatter. Directory and file names define page routes.
- Add sidebar entries in `astro.config.mjs` when pages should appear in navigation.
- The content collection and Starlight schema are in `src/content.config.ts`.
- Shared overrides live in `src/components/` and `src/layouts/`; site styles
  live in `src/styles/custom.css`.
- Put processed images in `src/assets/` and static files in `public/`.

For example, `src/content/docs/2-core/button.md` renders at `/2-core/button/`.
Use site-relative links with a trailing slash when linking between guides.

## Build and preview

```sh
vp run docs:build
vp run docs:preview
```

The static output is written to `website/dist/`. The Starlight build generates
Pagefind's search index. Review search using the production preview.

The combined website and embedded app are built with `vp run site:build`.
Deployment uses the shared root configuration; `vp run site:deploy` builds and
publishes both. The documentation-only build does not deploy anything.

Track remaining work in [the issue list](../docs/issue-list.md).
