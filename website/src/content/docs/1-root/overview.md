---
title: Root
description: Shared visual foundations and behavior used by every layer.
---

Root establishes the common ground for the system: the square, colours, type, scale and the built-in behavior and utilities available across the system. Configure these foundations before composing a page; a change here can affect many controls at once.

## What belongs here

| Topic | Responsibility |
| --- | --- |
| [Colours](/colours/) | Palette, inks, pastels and their dark counterparts. |
| [Fonts](/1-root/fonts/) | Typefaces, font loading and specimens. |
| [Languages](/1-root/languages/) | Supported languages, shared words and translation lookup. |
| [Formatting](/1-root/formatting/) | Dates, times, relative time, numbers, money and lists in the current language. |
| [Theming](/1-root/theming/) | Appearance tokens and light/dark behavior. |
| [Device](/1-root/device/) | Device detection and responsive scale. |
| [Scaling](/1-root/scaling/) | The phone and tablet scale, `--sf`, put on the page. |
| [Preferences](/1-root/preferences/) | Remembering supported user choices. |
| [Pricing](/1-root/pricing/) | The reader's likely currency, and prices written in it. |

All built-ins are grouped here alongside the visual foundations: Languages, Formatting, Theming, Device, Preferences and Pricing. Formatting and Pricing write values; they do not implement billing or payments. These topics support interface controls rather than being controls themselves. The language module belongs here; the visible [Language control](/2-core/language/) belongs in Core. The docs group runtime foundations here even when their implementation lives in `DS1/0-face/`; this does not move their source or change import paths.

## How the layers fit

[Core](/2-core/overview/) uses these foundations for individual controls. [Unit](/3-unit/overview/) composes controls, and [Page](/4-page/overview/) arranges those compositions. Application state, permissions and persistence stay with the application. Internal component visibility is separate from these layers: an internal control does not become a Root topic merely because it is hidden from the catalogue.

## Style ordinary HTML

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

The `ds-*` components have their own scoped tokens and JavaScript implementations. Follow the API on each [component page](/2-core/overview/#component-overview) rather than assuming a native HTML token controls a shadow-root component. CSS-only setup does not register custom elements.

## Dependencies

The public stylesheets and fonts need network access unless you save and re-link them locally. The native stylesheet imports Inter from Google Fonts for some controls. [Use with HTML](/start-here/quick-start/) explains the distinction between one authored HTML file and an offline bundle.
