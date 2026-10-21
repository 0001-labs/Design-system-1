---
title: Image focus
description: Where a photo's subject is, so a picture cut to its box keeps the subject in view
---

A picture cut to its box (`object-fit: cover`: a card's photo, a hero, a tile) keeps its middle by default, and a portrait loses its head. The focus module (`DS1/0-face/focus.ts`) finds where the subject is and writes it as the picture's `object-position`, so the crop keeps it in view at any shape.

## What it looks for

1. **Faces.** The point between the faces across, and a little above the top of the highest one down, so the heads stay whole with room above them. A face far smaller than the largest (someone in the background) is left out.
2. **Otherwise, what a person looks at first**: the salient part of the picture.
3. **Where neither can be found**, the part with the most detail, drawn a little towards the middle.

The first two come from Apple's Vision framework, through `focus-vision.swift` (face detection and attention-based saliency). The third is plain TypeScript that reads the pixels (`focusOf()`), for any machine and in the browser.

## At build time

Work the focus out where the page is built and write it into the markup, so the first paint is already cut right:

```ts
// swift 0-face/focus-vision.swift photos/*.jpg > regions.json   (on a Mac)
import { focusFromRegions, focusOf, objectPosition } from "./0-face/focus.ts";

const focus = focusFromRegions(regions[name]) ?? focusOf(pixels, width, height, channels);
// <img src="photos/alex.jpg" style="object-position: 50% 15%">
```

`focusOf()` takes the picture's pixels measured small: about `FOCUS_SAMPLE` (64) across, RGB or RGBA (for example sharp's `.resize(64).raw()`). A focus a person chose stays theirs: keep it beside the found ones and write it instead.

## In the browser

A page with no build step marks a picture `data-ds-focus="auto"` and calls `startFocus()`. Once the picture has loaded, `focusOf()` measures it and the focus is kept in the browser's storage, so from the next visit on it is right from the first paint. `data-ds-focus="40% 20%"` is a focus chosen by hand and is never measured. A picture from another host without CORS cannot be read and keeps its middle.

The browser has no face detector to rely on, so prefer the build step wherever there is one.

## With Sync 1

```json
"root": { "to": "web/ds1", "modules": ["focus"] }
```

copies `0-face/focus.ts` and `0-face/focus-vision.swift`.
