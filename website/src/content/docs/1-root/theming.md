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

A person chooses Light, Dark or System; System follows the system's appearance as it changes. The choice is one stored value, `light`, `dark` or `system`, under `ds-one:theme` (or the product's `themeStorageKey`). A visitor who has chosen nothing sees System, unless the product sets `themeDefault` to `light` or `dark` (see the options below).

The theme is marked on the root element. Key styles on the class:

| Mark | Values | What it is for |
| --- | --- | --- |
| `light-theme` or `dark-theme` class | One of the two | The canonical mark. `one.css` keys `color-scheme` on it; write `:root.dark-theme` for a rule of your own. |
| `data-theme` | `light`, `dark` | The same theme, kept for pages that key on the attribute. |
| `color-scheme` | `light`, `dark` | `light-dark()` tokens and the browser's controls follow it. Components inherit the `color-scheme` of their surface. |
| `--lightningcss-light`, `--lightningcss-dark` | `initial` or empty | CSS compiled with Lightning CSS's `light-dark()` fallback follows the choice, not the system. |
| The canvas and `<meta name="theme-color">` | The paper | No white flash behind a dark page, and the browser's bars in the paper. |

Without any mark, the document stylesheet follows the system scheme.

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

### Before the first paint

`DS1/0-face/theme-bootstrap.js` is a classic script with no imports. Inline it in the `<head>`, before the stylesheets, so the first paint is already in the chosen theme. Set any options on `window.DS_ONE_PREFERENCES` before it:

```html
<head>
  <script>window.DS_ONE_PREFERENCES = { themeStorageKey: 'product:theme' };</script>
  <script>/* the text of 0-face/theme-bootstrap.js */</script>
  <link rel="stylesheet" href="/ds1/one.css" />
</head>
```

A build can inline the file's text (in Vite, import it with `?raw`). A page that cannot inline loads it with a plain `<script src="/ds1/0-face/theme-bootstrap.js"></script>`, not a module, so rendering waits for it. Sync 1's `root` export copies it with `"modules": ["theme-bootstrap"]`.

| Option | Default | What it does |
| --- | --- | --- |
| `themeStorageKey` | `ds-one:theme` | Where the choice is stored. Keep a product's existing key so saved choices carry over. |
| `themeDefault` | `'system'` | What a visitor who has chosen nothing sees: `'light'` or `'dark'` keeps that theme, whatever the system, until they choose. Nothing is stored until they do, and a stored choice always wins. |
| `themeMode: 'system'` | Off | Follow the system and never read or write a stored choice, for surfaces such as documentation. |
| `themePaper` | `{ light: '#ffffff', dark: '#2a2a2a' }` | The canvas and theme-color in each theme; `false` leaves both to the page. |

A site that has always been light keeps it for first visits:

```html
<script>window.DS_ONE_PREFERENCES = { themeStorageKey: 'theme', themeDefault: 'light' };</script>
```

The script also sets `lang` on the root, from `window.DS_ONE_I18N`:

- On a page whose address names its language (`/ja/…`), with `languageFromAddress: true`, the address's language, matched against `routing.languages`, then `languages`, then every language of the list. The stored choice is not changed.
- Otherwise the language module's stored choice (`storageKey`, `persist: false` to skip it, `languages` to allow only those).
- With `langTarget` set, the root's `lang` is left to the page.

See [Languages](/1-root/languages/#choosing-and-remembering-a-language).

After the first paint it keeps the page right: in System mode it follows `prefers-color-scheme` as it changes, and it applies the choice again when another tab stores one and when a page returns from the back-forward cache. A change crosses from one theme to the other in a view transition of the root; with reduced motion it changes at once.

### Changing the theme

The theme module (`DS1/0-face/theme.ts`) runs the same script, so a page that did not inline it still gets it, and mirrors it in signals:

```js
import { setThemeMode, getThemeMode, currentTheme, currentThemeMode } from './ds1/0-face/theme';

setThemeMode('system'); // or 'light', 'dark'
```

- `setThemeMode(mode)` stores the choice and puts it on the page; `getThemeMode()` reads it.
- `currentTheme` is the theme on the page, `light` or `dark`; `currentThemeMode` is the choice, which may be `system`.
- `setTheme('light' | 'dark')` chooses a theme, as before. `followSystemTheme()` makes the page follow the system without touching the stored choice, and returns a function that hands it back.
- A change emits `theme-changed` on `window`, with `detail.theme` and `detail.mode`.
- On a page without the module, `window.DS_ONE_THEME` has `mode()`, `theme()`, `set(mode)` and `apply()`.

<span id="copying-it"></span>
A page without the components copies the module with Sync 1's `root` export, `"modules": ["theme"]`: `0-face/theme.ts`, the head script it runs and `preference-options.ts`, the type of `window.DS_ONE_PREFERENCES`. It needs `@lit-labs/signals`. `"modules": ["theme-bootstrap"]` copies the head script alone, for a page that uses `window.DS_ONE_THEME`.

[Cycle](/2-core/cycle/) with `type="theme"` steps through Light, Dark and System. Keeping the choice on an account, the favicon and redrawing canvases belong to the application. See [Preferences](/1-root/preferences/) for the related storage topic.

CSS-only documents can use `color-scheme: light dark` and the existing `light-dark()` tokens. A preview pinned to one scheme must set its own paper, ink and line tokens as well as its scheme: inherited token values may already have resolved at the root.

<span id="component-theming"></span>
## Shape

The corners every component draws, square, rounded or circular, are the reader's choice too, put on by the same head script: see [Shape](/1-root/shape/).

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
