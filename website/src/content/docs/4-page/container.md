---
title: Container Component
description: Page container with responsive width constraints
---

The `ds-container` component provides a centered container with responsive width constraints for page content.

## Flexible Content

`ds-container` is a **flexible layout component** that can hold any content. Use it to wrap page sections, cards, grids, or any combination of components.

## Basic Usage

```html
<ds-container>
  <h1>Page Title</h1>
  <p>Page content goes here.</p>
</ds-container>
```

## Size Variants

### Small

```html
<ds-container size="small">
  <!-- Content limited to ~600px -->
</ds-container>
```

### Medium (Default)

```html
<ds-container size="medium">
  <!-- Content limited to ~900px -->
</ds-container>
```

### Large

```html
<ds-container size="large">
  <!-- Content limited to ~1200px -->
</ds-container>
```

### Full Width

```html
<ds-container size="full">
  <!-- No width constraint -->
</ds-container>
```

## Padding Options

```html
<ds-container padding="none">No padding</ds-container>
<ds-container padding="small">Small padding</ds-container>
<ds-container padding="medium">Medium padding</ds-container>
<ds-container padding="large">Large padding</ds-container>
```

## Attributes

| Attribute | Type     | Default    | Description                         |
| --------- | -------- | ---------- | ----------------------------------- |
| `size`    | `string` | `'medium'` | Width constraint: small, medium, large, full |
| `padding` | `string` | `'medium'` | Horizontal padding: none, small, medium, large |
| `centered`| `boolean`| `true`     | Center the container horizontally   |

## Responsive Behavior

The container automatically adjusts on smaller screens:

```css
:host {
  width: 100%;
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: 0 var(--container-padding);
}

@media (max-width: 768px) {
  :host {
    padding: 0 var(--container-padding-mobile);
  }
}
```

## Examples

### Article Page

```html
<ds-container size="small" padding="large">
  <article>
    <h1>Article Title</h1>
    <p>Article content with comfortable reading width.</p>
  </article>
</ds-container>
```

### Dashboard

```html
<ds-container size="large">
  <ds-row>
    <ds-card>Widget 1</ds-card>
    <ds-card>Widget 2</ds-card>
    <ds-card>Widget 3</ds-card>
  </ds-row>
</ds-container>
```
