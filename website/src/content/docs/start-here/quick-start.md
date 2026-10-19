---
title: Use with HTML
description: Load Design system 1 and write its Lit Web Components directly in HTML.
---

Design system 1 is a Lit Web Component library. A plain HTML page needs a stylesheet and a module script. The script includes Lit and registers the `ds-*` elements; you write them directly in HTML.

Create `index.html`:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>My first page</title>
  <link rel="stylesheet" href="https://designsystem1.com/resources/design-system-1.css">
  <script type="module" src="https://designsystem1.com/resources/design-system-1.js"></script>
</head>
<body>
  <ds-page layout="column">
    <ds-text size="display" literal>A place to begin</ds-text>
    <ds-text literal wrap>Write clean HTML with the system's components.</ds-text>
    <ds-button primary>Save</ds-button>
    <ds-accordion summary="How it works" literal>
      The stylesheet loads the foundations. The module gives each element its appearance and behavior.
    </ds-accordion>
  </ds-page>
</body>
</html>
```

Open it in your browser. No package install, build step or Lit templates are needed. The stylesheet alone does not register components: keep both the `link` and `script`.

## Add behavior

Components expose properties, slots and events. Ordinary JavaScript works with them:

```js
const button = document.querySelector('ds-button');
button.addEventListener('click', () => console.log('Save requested'));
```

For properties containing objects or arrays, wait for registration before assigning them:

```js
await customElements.whenDefined('ds-table');
const table = document.querySelector('ds-table');
// Set its columns and data as described on the Table page.
```

[Browse the components](/2-core/overview/) and use each component's documented interface. Application data, submissions and routing remain yours.

## Scale and theme

The component module starts the shared device scale. Phones and tablets follow the page's width; desktop stays at scale 1. The hosted stylesheet connects component scale to the page scale. See [Scaling](/1-root/scaling/) for embedded surfaces and [Theming](/1-root/theming/) for setting the theme before first paint.

## Examples and libraries

The [HTML downloads](/start-here/examples/#html-examples) use this same component library. [My libraries](/libraries/) customizes the component tokens; load your library stylesheet after the base stylesheet.

## Hosting the files yourself

The URLs above follow the current documentation release and require a connection. For a pinned or offline copy, use the [package](/getting-started/installation/) and host its bundle, referenced JavaScript chunks, stylesheets and font files together. Preserve their relative paths.

React apps use the adapters over these same Lit components. Server-rendered apps register the components in the browser.
