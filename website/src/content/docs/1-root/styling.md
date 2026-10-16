---
title: Styling
description: Style semantic HTML and configure its shared tokens.
---

Design system 1 styles native HTML through a shared stylesheet. Start with real elements: headings for structure, links for destinations, buttons for actions, labels for fields and tables for tabular data.

```html
<link rel="stylesheet" href="https://designsystem1.com/resources/vanilla.css">
<link rel="stylesheet" href="https://designsystem1.com/resources/fonts.css">

<main>
  <h1>A clear starting point</h1>
  <p>Ordinary HTML, with a shared appearance.</p>
  <details><summary>Read more</summary><p>No JavaScript is needed here.</p></details>
</main>
```

These native elements do not need a class on every node. CSS gives them an appearance; the browser supplies their native behavior. Use the [complete HTML downloads](/start-here/examples/) to inspect a working document.

## Configure the stylesheet

The native stylesheet is generated from the canonical `DS1/1-root/one.semantic.css`. The public `/resources/vanilla.css` route serves that source directly. The font companion sets the native font tokens to the shared font files.

Set tokens on `:root` or a scoped region when a page needs a deliberate variation:

```css
:root {
  --one-accent-color: var(--one-sharp-blue);
  --one-font: "Inter Arrows", "GT America", sans-serif;
}
```

Keep application data, submission logic and routing in your page. A stylesheet does not implement them. [My libraries](/libraries/) lets you save a stylesheet and publish a URL for consumers, while [the API](/libraries/api/) works on the same drafts and revisions.

## Interactive components

The `ds-*` components have their own scoped tokens and JavaScript implementations. Follow the API on each [component page](/components/) rather than assuming a native HTML token controls a shadow-root component. CSS-only setup does not register custom elements.

## Dependencies

The public stylesheets and fonts need network access unless you save and re-link them locally. The native stylesheet imports Inter from Google Fonts for some controls. [Use with HTML](/start-here/quick-start/) explains the distinction between one authored HTML file and an offline bundle.
