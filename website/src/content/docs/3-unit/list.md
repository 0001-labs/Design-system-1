---
title: List
description: Learn about list components in Design system 1
---

# List

List components organize and display collections of items in a structured format.

## Flexible Content

`ds-list` is a **flexible container** that can hold any content. Each list item can contain:

- **`ds-text`** - For internationalized text
- **`ds-icon`** - For visual indicators
- **`ds-row`** - For horizontal layouts within items
- Any other components or HTML elements

## Features

The list components include:

- Ordered and unordered lists
- Styled list items
- Compact and expanded layouts
- List with icons and badges

Lists help present information clearly and make content easy to scan.

## Example with Components

```html
<ds-list>
  <ds-list-item>
    <ds-row fill>
      <ds-icon name="check"></ds-icon>
      <ds-text text="Completed"></ds-text>
    </ds-row>
  </ds-list-item>
</ds-list>
```
