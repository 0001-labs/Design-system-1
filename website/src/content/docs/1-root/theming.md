---
title: Theming
description: Customize colours, typography, spacing and light or dark appearance
---

Theming belongs to Root: CSS custom properties define the appearance that components share. Set defaults on the document and override public tokens on a component or containing surface. Start with the [Root setup](/1-root/overview/) and the [Colours](/colours/) and [Fonts](/1-root/fonts/) catalogues.

<span id="quick-customization"></span>
## Color system

<span id="change-accent-color"></span>
### Accent color

The document stylesheet uses `--accent-color`; shared components use the scoped `--ds-accent-color`. Set the token for the surface you are styling, after loading the foundation styles:

```css
:root {
  --accent-color: var(--apple-green);
  --ds-accent-color: light-dark(var(--ds-apple-green), #529d36);
}
```

### Theme modes

The document stylesheet follows the system scheme by default. Explicit `light-theme` and `dark-theme` classes on the root select a scheme. Components use `light-dark()` tokens and inherit the CSS `color-scheme` of their surface.

<span id="css-variables"></span>
## CSS custom properties

### Colors

Use role tokens for surfaces and text rather than fixed white or black. Document and component tokens are separate:

```css
.article {
  background: var(--background);
  color: var(--text-color);
}

.component-surface {
  background: var(--ds-paper);
  color: var(--ds-text-color);
}
```

### Typography

Document type uses `--typeface-regular`, `--typeface-mono`, `--type-size-default` and `--type-size-small`. Components use scoped tokens such as `--ds-typeface-regular`. Keep “Inter Arrows” first in a custom font stack so arrows remain consistent. Code uses Iosevka Extended.

### Spacing

Use the shared grid: `--1` is one 20px square scaled by `--sf`; `--half` is half a square. Component surfaces use their resolved `--ds-unit`. Keep rows, padding and gaps on this grid instead of introducing a separate spacing scale. See [Root overview](/1-root/overview/#configure-the-stylesheet) for document setup and scaling.

<span id="dark-mode-support"></span>
## Dark mode

The runtime module exposes `currentTheme`, `setTheme('light' | 'dark')` and `followSystemTheme()`. `setTheme` updates root classes and the stored theme unless system mode is active. `followSystemTheme()` follows system changes and returns a cleanup function; it also updates `color-scheme` and compiled light/dark fallback properties.

For an application with Light, Dark and System choices, keep one preference, apply it before first paint, and synchronize it on storage changes and page restoration. Account persistence, the theme picker and canvas redraws belong to the application. See [Preferences](/1-root/preferences/) for the related storage topic.

CSS-only documents can use `color-scheme: light dark` and the existing `light-dark()` tokens. A preview pinned to one scheme must set its own paper, ink and line tokens as well as its scheme: inherited token values may already have resolved at the root.

<span id="component-theming"></span>
## Component-specific theming

### Button variants

Use the component's public attributes and tokens. A primary button uses the boolean `primary` attribute:

```html
<ds-button primary>Save</ds-button>
```

For a local adjustment, set the role token on the component itself:

```css
ds-button.confirm {
  --ds-button-background-color-primary: light-dark(var(--ds-apple-green), #529d36);
  --ds-button-text-color-on-accent: var(--ds-black);
}
```

<span id="per-component-colors"></span>
### Custom accent colors

A containing surface can supply shared tokens for its children. For one button's fill, use the button token directly so its purpose is clear:

```html
<ds-button primary style="--ds-button-background-color-primary: var(--ds-tuned-red)">
  Remove
</ds-button>
<ds-button primary style="--ds-button-background-color-primary: var(--ds-apple-green)">
  Confirm
</ds-button>
```

## Examples

### Brand colors

Give each role its own token and a light/dark pair. Use the [palette](/colours/) as the source for both versions; do not borrow a warning colour for an unrelated role. Accent fills are opt-in for meaningful states, not automatic decoration on rows or tables.

### Custom font

Load the font before assigning it, then keep the arrow face at the start of both document and component stacks:

```css
:root {
  --typeface-regular: "Inter Arrows", "My Font", system-ui, sans-serif;
  --ds-typeface-regular: "Inter Arrows", "My Font", system-ui, sans-serif;
}
```

Use the [Fonts catalogue](/1-root/fonts/) to inspect the available faces. This does not change the code font.

## Best practices

1. Set document defaults at the root and local exceptions on the relevant surface.
2. Use documented role tokens and component attributes; do not style component internals.
3. Check light, dark and system appearance, including first paint and restored pages.
4. Maintain readable contrast for text, controls and focus indicators.
5. Keep the shared grid, scale and type rules when customizing appearance.

<span id="learn-more"></span>
Related: [Root overview](/1-root/overview/) · [Colours](/colours/) · [Fonts](/1-root/fonts/) · [Preferences](/1-root/preferences/).
