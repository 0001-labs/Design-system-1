---
title: Installation
description: Learn how to install Design system 1 in your project
---

Design system 1 can be installed via package managers or loaded directly from a CDN.

### Package Manager

Install Design system 1 using your preferred package manager:

```bash
# Using Vite+ (recommended)
vp add design-system-1@alpha

# Using npm
npm install design-system-1@alpha

# Using yarn
yarn add design-system-1@alpha
```

### CDN (No Build Step)

For quick prototyping or simple projects, you can load Design system 1 directly from a CDN:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Design system 1 Example</title>

    <!-- Design system 1 Styles -->
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/design-system-1@alpha/DS1/1-root/one.css"
    />

    <!-- Design system 1 Components -->
    <script
      type="module"
      src="https://cdn.jsdelivr.net/npm/design-system-1@alpha/dist/design-system-1.bundle.js"
    ></script>
  </head>
  <body>
    <ds-button variant="primary">Click Me</ds-button>
  </body>
</html>
```

### Using @alpha Tag

For automatic updates to the latest alpha version, you can use the `@alpha` tag:

```html
<script
  type="module"
  src="https://cdn.jsdelivr.net/npm/design-system-1@alpha/dist/design-system-1.bundle.js"
></script>
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/design-system-1@alpha/DS1/1-root/one.css"
/>
```

## Import in JavaScript/TypeScript

After installing via package manager, you can import components:

```typescript
// Import all components
import "design-system-1";

// Or import specific components
import "design-system-1/DS1/2-core/ds-button";
import "design-system-1/DS1/2-core/ds-text";

// Import styles
import "design-system-1/styles";
```

## Next Steps

- [Quick Start Guide](/start-here/quick-start/) - Learn the basics
- [Components](/2-core/button/) - Explore available components
