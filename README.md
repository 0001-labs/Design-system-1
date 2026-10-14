# Design system 1 (0.3.0-alpha.13)

A plug and play design system

> A component-based design system built with Lit that provides reusable UI components with built-in theming, internationalization, and accessibility features.

**Design system 1** is a comprehensive modern design system that provides a set of reusable UI components built with Web Components via Lit. Available via CDN or npm.

## Installation

```bash
# Using Vite+ (recommended)
vp add @0001-labs/design-system-1@alpha

# Using npm
npm install @0001-labs/design-system-1@alpha

# Using yarn
yarn add @0001-labs/design-system-1@alpha

```

**Note**: The package is being renamed from `ds-one` to `design-system-1`. The installation commands and CDN URLs below target the new name and will work after its first npm publication.

## Quick Start

### Classless CSS usage

Load the separate semantic stylesheet and write ordinary HTML. Elements such as
`button`, `input`, `section`, headings, tables, and code blocks are styled
directly, so no component classes or JavaScript are required.

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@0001-labs/design-system-1@alpha/DS1/1-root/one.semantic.css"
/>

<section>
  <h2>Welcome</h2>
  <p>A native HTML interface styled by Design system 1.</p>
  <label for="email">Email</label>
  <input id="email" type="email" placeholder="you@example.com" />
  <button type="button">Get started</button>
</section>
```

The complete file is organized with comments for Root, Reset, Layout,
Typography, Buttons, Forms, Sections, Tables, Code, Feedback, and Motion. It is
an additional distribution: the existing `one.css` stylesheet and Lit Web
Components remain unchanged.

### Web Components via CDN

```html
<!DOCTYPE html>
<html>
  <head>
    <!-- CSS -->
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/@0001-labs/design-system-1@alpha/DS1/1-root/one.css"
    />
    <!-- Bundle -->
    <script type="module">
      import "https://cdn.jsdelivr.net/npm/@0001-labs/design-system-1@alpha/dist/design-system-1.bundle.min.js";
    </script>
  </head>
  <body>
    <ds-button variant="primary" text="Get Started"></ds-button>
    <ds-text text="Welcome"></ds-text>
  </body>
</html>
```

### NPM Usage

```tsx
import "design-system-1/styles";
import "design-system-1";
```

For the classless version, import only the semantic stylesheet:

```ts
import "design-system-1/DS1/1-root/one.semantic.css";
```

## Source snapshots in products

Products can select shared Lit components without loading the full system's
page, device or theme setup. `sync.exports.mjs` says what a product may copy:
`languages`, `components`, `email` and `icons`. 0001's products copy them with
Sync 1, naming what they take in their `sync.json`:

```json
{ "sources": { "Design system 1": { "components": { "to": "src/design", "components": ["button", "text", "row"] } } } }
```

Import the generated `components.ts` and `1-root/component-tokens.css` in the
consumer. The copy carries the relative dependency graph
(`scripts/component-graph.mjs`), including shared languages and SVG maps, and a
`components-manifest.json` for the adoption report. Sync 1 records every file's
hash in the product's `sync.lock.json`, and `sync1 check` fails on missing
files or local drift. Files the copy did not write stay owned by the consumer.
All component edits happen here, then consumers sync.

Components use scoped `--ds-*` tokens so an embedded document can keep its own
scale and theme. A product may configure those tokens at its surface.
`ds-button control="host"` makes the custom element the accessible control
for React event handlers and roles; the default keeps a native shadow button.
`ds-text literal` preserves renderer-owned light DOM children; the default
looks up translation keys. `ds-panel` provides header and footer slots around
its body. The shared native-control sheet serves elements that need native
form or third-party focus semantics.

`ds-tooltip literal text="…"` accepts product-translated copy; omit `literal`
for a shared translation key. It labels its slotted control, supports top and
bottom placement, and dismisses on Escape. `ds-tabs` owns arrow, Home and End
navigation for its tab controls; the product handles their clicks to select
the corresponding content. Set `role="group"` for standalone filter choices.
Host buttons accept `icon` and `trailing` slots for glyphs and counts.

Reload the page after changing registered custom-element classes during
development; the browser defines each element once per document.

## Documentation

See the full documentation for Design system 1 at: [**designsystem1.com**](https://designsystem1.com/)

The Astro + Starlight site lives in `website/`. Run `vp run docs:dev` locally;
see the [documentation contributor guide](website/README.md) for build and authoring instructions.

The site uses Astro and Starlight. Run `vp run docs:dev` locally; see the
[documentation authoring guide](website/README.md) and [issue list](docs/issue-list.md).

## Design system 1 app

The repository includes a React-based component workbench for refining semantic
elements one at a time. The right panel always shows the complete
`one.semantic.css` file and updates its root variables as spacing and theme
controls change. Exports contain plain HTML and require no JavaScript runtime.

```bash
vp run app:dev
```

The app and documentation belong to this single project. The documentation lives
at `/`, and the app lives at `/app/` on `designsystem1.com`. Both are built into
`website/dist` and deployed together to the Cloudflare Worker named `designsystem1`.

Build the complete website locally:

```bash
vp run site:build
```

Deploy the complete website from the repository root:

```bash
vp run deploy
```

The `app:deploy`, `docs:deploy`, and subproject `deploy` commands all use this same
combined release. Cloudflare settings are defined in the root `wrangler.jsonc`.
The same Worker serves published CSS at `/ds1/*` and authenticated publishing
at `/api/artifacts/*`, using the existing R2 library bucket. Convex remains the
backend for accounts and library metadata. All Cloudflare deployment commands
release this single Worker. The legacy `dsone.dev/*` route also belongs to this
Worker: documentation redirects to the new domain, while existing `/ds1/*`
stylesheet URLs remain served directly. The public workbench is available at
`/app/` and `/app/playground`.

The existing Convex deployment is still `aromatic-lapwing-453` (development).
Its publishing URLs point to `designsystem1.com`; development login-link capture
is disabled. Account sign-in requires an email provider before it can be used
on the public site. The workbench does not require an account.

## Features

### Internationalization

- **Language keys**: Add a `translations.json` to your project and everything is translatable with the cycle type language button
- **Multi-language**: Automatically switches language based on browser language settings

### Core Components

- **Web Components**: Built with Lit for maximum compatibility
- **Responsive design**: Mobile-first approach with scaling factor
- **Theme system**: CSS custom properties for easy customization

### Completed Features

- ✅ Core component library (ds-button, ds-text, ds-icon, etc.)
- ✅ Theming system with accent colors
- ✅ Internationalization with language keys
- ✅ Responsive design with mobile scaling
- ✅ CDN delivery via jsDelivr
- ✅ NPM package published

### In Progress

- 🚧 Starlight documentation coverage and manual review ([issue list](docs/issue-list.md))
- 🚧 Additional component variants and states defined in Figma

## Architecture

```
Design system 1/
├── dist/             # Built files for NPM
├── DS1/
│   ├── 0-face/       # Utilities for device detection, internationalization,
│   │                 # localStorage preferences, pricing and theme
│   ├── 1-root/       # Core styles, fonts, and design tokens
│   │                 # (everything as CSS variables)
│   ├── 2-core/       # Core components (banner, buttons, text, cycle,
│   │                 # date, icon, input, tooltip)
│   ├── 3-unit/       # Composite components (list, row, table)
│   ├── 4-page/       # Page-level components for layout (layout, grid)
│   └── x-icon/       # SVG icon library
├── app/              # React workbench and account/library screens at /app/
├── website/          # Documentation at /; combined site output in website/dist
├── convex/           # Backend, authentication, libraries, and publishing actions
├── services/         # Asset-serving and publishing routes
├── packages/         # Shared CSS validation package
├── e2e/              # End-to-end checks
├── tests/            # Project checks
└── wrangler.jsonc    # Shared website deployment configuration

```

## License

MIT © [Design system 1](https://github.com/0001-labs/ds-one)

## 🔗 Links

- [**Website**](https://designsystem1.com/) - Official website
- [**GitHub**](https://github.com/0001-labs/ds-one) - Source code and issues
- [**NPM Package**](https://www.npmjs.com/package/design-system-1) - Install with `@alpha` tag
- [**CDN**](https://cdn.jsdelivr.net/npm/@0001-labs/design-system-1@alpha/) - Direct browser usage
