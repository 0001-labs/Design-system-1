---
title: Layout
description: Learn about layout components in Design system 1
---

# Layout

Layout components provide the foundational structure for building page templates and application frameworks.

## Flexible Content

`ds-layout` is a **flexible page structure** that can hold any content in its designated areas:
- **Header area** - Use `ds-banner`, navigation, or any header content
- **Sidebar area** - Use `ds-list`, `ds-accordion`, or navigation menus
- **Main content** - Use `ds-container`, `ds-grid`, or any page content
- **Footer area** - Use links, text, or any footer content

## Features

The layout components include:

- Header and footer layouts
- Sidebar layouts
- Main content areas
- Responsive grid systems
- Flexible container patterns

Use layout components to establish consistent page structures across your application.

## Example

```html
<ds-layout>
  <header slot="header">
    <ds-banner text="App Announcement" variant="info"></ds-banner>
  </header>
  <aside slot="sidebar">
    <ds-list>
      <ds-list-item>Navigation</ds-list-item>
    </ds-list>
  </aside>
  <main slot="content">
    <ds-container>
      <h1>Page Content</h1>
    </ds-container>
  </main>
</ds-layout>
```
