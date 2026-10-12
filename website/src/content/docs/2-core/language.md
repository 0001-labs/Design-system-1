---
title: Language
description: The language picker, built on ds-cycle, showing each language by its own name
---

`ds-language` is the language picker: a press moves to the next of the product's languages, sets it and remembers it. Each language is shown by its own name (Dansk, 日本語, Norsk bokmål), set in its own typeface. When something else changes the language, the picker follows.

It is `ds-cycle`'s language cycle with the names in their own languages, so it saves the choice and announces `language-changed` the same way.

## Usage

```html
<ds-language></ds-language>
```

The languages it cycles through are the ones the product turned on:

```javascript
import { configureI18n } from "ds-one";

configureI18n({ languages: ["en", "da", "ja"] });
```

Without `languages`, it offers the languages found in the loaded words.

## Size

One square high and eight squares wide (159 × 19px drawn on a 160 × 20px pitch, times `--sf`), so the longest names, "Português (Brasil)" and "Norsk nynorsk", fit. `compact` makes it an ordinary item, four squares wide, for products whose names are all short.

```html
<ds-language compact></ds-language>
```

## Attributes

| Attribute | Type      | Default | Description                                |
| --------- | --------- | ------- | ------------------------------------------ |
| `compact` | `boolean` | `false` | Four squares wide instead of eight         |
| `variant` | `string`  | (none)  | `primary` paints it in the accent colour   |

## Events

| Event              | Detail     |
| ------------------ | ---------- |
| `language-changed` | `language` |

See [Languages](/built-ins/languages/) for the language list, the words and the rest of the module.
