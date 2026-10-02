---
title: Theming
description: Built-in theming system in Design system 1
---

Design system 1 uses CSS custom properties for theming, allowing you to customize colors and styles without modifying component code.

## Quick Customization

### Change Accent Color

```html
<style>
  :root {
    --accent-color: #6366f1;
  }
</style>
```

### Dark Mode Support

Design system 1 automatically adapts to system dark mode preferences:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --accent-color: #818cf8;
  }
}
```

## Component Theming

### Per-Component Colors

```html
<div style="--accent-color: #ef4444;">
  <ds-button variant="primary">Red Button</ds-button>
</div>

<div style="--accent-color: #10b981;">
  <ds-button variant="primary">Green Button</ds-button>
</div>
```

## CSS Variables

Common theme variables:

```css
:root {
  --accent-color: #0066cc;
  --background-color: #ffffff;
  --text-color: #000000;
  --border-color: #e0e0e0;
}
```

## Learn More

For detailed theming documentation, see the [Advanced Theming Guide](/advanced/theming/).
