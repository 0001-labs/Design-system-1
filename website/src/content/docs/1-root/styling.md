---
title: CSS
description: Learn about the CSS styling in DS one
---

# CSS

DS one can style native HTML without loading its JavaScript bundle. The
CSS-only API is useful for static pages, server-rendered interfaces, and
progressive enhancement.

## CDN usage

Load `one.css`, then apply DS one classes to native elements:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/ds-one@alpha/DS1/1-root/one.css"
    />
    <title>CSS-only DS one</title>
  </head>
  <body>
    <main class="ds-card">
      <h1 class="ds-text ds-text--heading">Welcome</h1>
      <p class="ds-text">This page uses DS one without JavaScript.</p>
      <label class="ds-text" for="email">Email</label>
      <input
        class="ds-input"
        id="email"
        name="email"
        type="email"
        placeholder="you@example.com"
      />
      <button class="ds-button ds-button--primary" type="button">
        Get started
      </button>
      <button class="ds-button ds-button--secondary" type="button" disabled>
        Unavailable
      </button>
    </main>
  </body>
</html>
```

There is intentionally no `<script>` element in this example.

## Available classes

| Class | Purpose |
| --- | --- |
| `.ds-text` | Default text treatment |
| `.ds-text--heading` | Heading variant used with `.ds-text` |
| `.ds-text--small` | Small-text variant used with `.ds-text` |
| `.ds-button` | Base native button or link |
| `.ds-button--primary` | Primary button variant |
| `.ds-button--secondary` | Secondary button variant |
| `.ds-input` | Native form input |
| `.ds-card` | Bordered content container |

The classes use the same CSS custom properties as the Web Components, including
the color, typography, spacing, scaling, and theme tokens in `one.css`.

## Optional JavaScript

The CSS-only classes do not replace the component bundle. Load the JavaScript
bundle separately when you need DS one's Web Components, internationalization,
stored preferences, or other scripted behavior.
