# Design system 1

A design system for building interfaces on a 20px grid. Typography, colour, spacing and components share the same rules.

Use the Lit web components directly in HTML, with any framework or none. Change the design through CSS custom properties.

[Explore the system](https://designsystem1.com/) · [Try the workbench](https://designsystem1.com/app/) · [npm](https://www.npmjs.com/package/@0001-labs/design-system-1)

## Start

```sh
npm install @0001-labs/design-system-1
```

In a project with a CSS-capable bundler:

```js
import "@0001-labs/design-system-1/styles";
import "@0001-labs/design-system-1";
```

Then use the components in your HTML:

```html
<ds-button>Save</ds-button>
```

For a plain HTML page, load the stylesheet and component module:

```html
<link rel="stylesheet" href="https://designsystem1.com/resources/design-system-1.css">
<script type="module" src="https://designsystem1.com/resources/design-system-1.js"></script>
<ds-button>Save</ds-button>
```

The module includes Lit. No package install or build step is needed for this setup.

The package follows semantic versioning: patch and minor releases keep the API, a major release says what changes.

## Four layers

- **Root** — colours, type, spacing and themes.
- **Core** — individual controls, from buttons to messages.
- **Unit** — controls composed into tables, sidebars and forms.
- **Page** — layouts that bring them together.

[Native](https://designsystem1.com/advanced/native/) brings the system to Swift and Kotlin. [Email kit](https://designsystem1.com/email/) applies it to email.

Internal app-building controls live in a separate, unpublished **App** package. They are not included in the public npm package.

## Develop

```sh
vp install
vp run docs:dev
```

Run `vp test` for the component tests and `vp run site:build` to build the documentation and workbench.

[MIT license](LICENSE).
