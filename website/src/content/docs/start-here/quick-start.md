---
title: Use with HTML
description: Open an ordinary HTML file with the shared stylesheet and fonts.
---

Create `index.html`, paste this document, and open it in your browser:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>My first page</title>
  <link rel="stylesheet" href="https://designsystem1.com/resources/vanilla.css">
  <link rel="stylesheet" href="https://designsystem1.com/resources/fonts.css">
</head>
<body>
  <main>
    <h1>A place to begin</h1>
    <p>This is ordinary HTML with Design system 1 styling.</p>
    <details><summary>How it works</summary>
      <p>The browser owns this disclosure. No JavaScript is needed.</p>
    </details>
  </main>
</body>
</html>
```

No package install or build step is needed. These public asset URLs are served by the documentation site, not an assumed npm version. They follow the current documentation release.

## View, download, edit

The [examples](/start-here/examples/) include an article, a form, a report and a reference page. Each has a complete description and an HTML download. Edit the words and semantic structure first; use CSS custom properties for your own type and colour choices.

## Internet and offline use

The HTML loads the stylesheet and fonts over HTTPS; the native stylesheet itself imports nothing. To use it entirely offline, save both stylesheets and the font files, and change every external URL to a local path. Otherwise, keep the network references and describe the page as online-dependent.

## When JavaScript is needed

The [Web Component examples](/2-core/overview/#component-overview) demonstrate interactive elements such as `ds-sidebar` and `ds-chart`. Those elements need their JavaScript implementation; adding a custom tag to a CSS-only page is not enough. Application data, submissions and sign-in are separate from visual styling.
