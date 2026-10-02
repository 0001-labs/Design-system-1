---
title: CLASSless Design System
description: A visual workspace for designing with native HTML and a single stylesheet.
---

Native HTML. Your design. One stylesheet.

CLASSless is the CSS-only side of Design system 1. Style ordinary HTML elements
without adding a class to every element or installing a component runtime.

[Open the editor](/classless/editor/) · [My libraries](/classless/libraries/)

## Design in the editor

Explore buttons, inputs, typography, and other native elements side by side.
Compare sizes and states, then use the box model to adjust margin, border,
padding, and corner radius. The CSS updates as you work, and editing the CSS
updates the preview.

The playground is available without signing in. Its changes are temporary.
Use **My libraries** to sign in and work with saved stylesheets.

## Use native HTML

Link your stylesheet, then write the elements you already know:

```html
<link rel="stylesheet" href="/styles/my-design-system.css" />

<section>
  <h1>A simple starting point</h1>
  <p>Typography, colours, and spacing belong to your stylesheet.</p>
  <button>Get started</button>
</section>
```

Replace the stylesheet path with your own saved file or the URL supplied when
you publish a library.

## Two ways to use Design system 1

**CLASSless** styles native HTML with CSS. The **component library** uses Lit
Web Components such as `ds-button` and `ds-date`. They remain separate options;
using CLASSless does not require the Web Component bundle.
