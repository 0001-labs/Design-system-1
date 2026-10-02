---
title: Theming
description: Customize the look and feel of Design system 1 components
---

Design system 1 uses CSS custom properties (variables) for theming, making it easy to customize colors, spacing, and other design tokens.

## Color System

### Accent Color

Change the primary accent color:

```css
:root {
  --accent-color: #0066cc;
}
```

### Theme Modes

Design system 1 automatically detects and responds to system dark/light mode preferences.

## CSS Custom Properties

### Colors

```css
:root {
  --accent-color: #0066cc;
  --background-color: #ffffff;
  --text-color: #000000;
  --border-color: #e0e0e0;
}
```

### Typography

```css
:root {
  --font-family: "GT America", system-ui, sans-serif;
  --font-size-base: 16px;
  --line-height: 1.5;
}
```

### Spacing

```css
:root {
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
}
```

## Dark Mode

Design system 1 components automatically adapt to dark mode:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --background-color: #1a1a1a;
    --text-color: #ffffff;
    --border-color: #333333;
  }
}
```

## Component-Specific Theming

### Button Variants

```css
ds-button[variant="primary"] {
  --button-background: var(--accent-color);
  --button-text: white;
}
```

### Custom Accent Colors

Each page or component can have its own accent color:

```html
<div style="--accent-color: #ff6b6b;">
  <ds-button variant="primary">Red Button</ds-button>
</div>
```

## Examples

### Brand Colors

```css
:root {
  /* Primary brand color */
  --accent-color: #6366f1;

  /* Secondary colors */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
}
```

### Custom Font

```css
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap");

:root {
  --font-family: "Inter", sans-serif;
}
```

## Best Practices

1. Define theme variables at the `:root` level
2. Use semantic variable names
3. Test in both light and dark modes
4. Maintain sufficient contrast ratios for accessibility
