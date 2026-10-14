---
title: Quick Start
description: Get up and running with Design system 1 in minutes
---

Create a simple HTML page using Design system 1 components:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My Design system 1 App</title>

    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/@0001-labs/design-system-1@alpha/DS1/1-root/one.css"
    />
    <script
      type="module"
      src="https://cdn.jsdelivr.net/npm/@0001-labs/design-system-1@alpha/dist/design-system-1.bundle.js"
    ></script>
  </head>
  <body>
    <ds-layout>
      <ds-header slot="header">
        <ds-title variant="site">My App</ds-title>
      </ds-header>

      <main>
        <ds-text variant="heading">Welcome to Design system 1</ds-text>
        <ds-text variant="body">
          A modern design system built with TypeScript and Lit.
        </ds-text>

        <ds-button variant="primary">Get Started</ds-button>
        <ds-button variant="secondary">Learn More</ds-button>
      </main>
    </ds-layout>
  </body>
</html>
```

## Basic Components

### Button

```html
<ds-button variant="primary">Primary Button</ds-button>
<ds-button variant="secondary">Secondary Button</ds-button>
<ds-button variant="text">Text Button</ds-button>
```

### Text

```html
<ds-text variant="heading">This is a heading</ds-text>
<ds-text variant="body">This is body text</ds-text>
<ds-text variant="small">This is small text</ds-text>
```

### Link

```html
<ds-link href="https://example.com">Visit Example</ds-link>
<ds-link href="/about" internal>About Page</ds-link>
```

## With Translation Support

Design system 1 includes built-in internationalization. Use the `text` attribute (not `key`) to specify translation keys:

```html
<script type="module">
  import {
    setLanguage,
    loadTranslations,
  } from "https://cdn.jsdelivr.net/npm/@0001-labs/design-system-1@alpha/dist/design-system-1.bundle.js";

  // Load translations
  await loadTranslations({
    en: { greeting: "Hello", welcome: "Welcome" },
    es: { greeting: "Hola", welcome: "Bienvenido" },
  });

  // Set language
  setLanguage("en");
</script>

<ds-text text="Greeting"></ds-text>
<ds-text text="Welcome"></ds-text>
```

## Next Steps

- Explore [all components](/2-core/button/)
- Learn about [theming](/advanced/theming/)
- Set up [languages](/built-ins/languages/)
