# Design system 1

A design system for building interfaces on a 20px grid. Typography, colour, spacing and components share the same rules.

Use CSS to style ordinary HTML, or Lit web components for interactive controls. Change the design through CSS custom properties.

[Explore the system](https://designsystem1.com/) · [Try the workbench](https://designsystem1.com/app/) · [npm](https://www.npmjs.com/package/@0001-labs/design-system-1)

## Start

```sh
npm install @0001-labs/design-system-1@alpha
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

For ordinary HTML without component JavaScript, import only the classless stylesheet:

```js
import "@0001-labs/design-system-1/DS1/1-root/one.semantic.css";
```

The package is in alpha. APIs can change between releases.

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
