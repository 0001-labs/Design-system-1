---
title: Device Bezels
description: Original device artwork around measured app viewports.
---

The catalogue includes 20 colour variants: iPhone 17 Pro Max, iPhone 17 Pro, iPhone 17, iPhone Air, iPad Pro 13, iPad Pro 11 and iPad mini. Measurements and artwork provenance follow the [supplied Figma community file](https://www.figma.com/design/8azymSnKt4pnYTZqdzQ7tF/?node-id=507-24672).

[Compare every variant in the owner preview](/private-app/visual-kit.html).

```html
<ds-device-bezel
  device="iphone-17-pro-max-deep-blue"
  asset-base="/licensed-device-art/"
  time="00:01"
  browser="safari"
  address="shop.example">
  <iframe title="App preview" src="/sample-app/"></iframe>
</ds-device-bezel>
```

`BEZELS` exports each artwork size, screen rectangle and source node. `screenGeometry` scales the viewport uniformly without changing its logical app dimensions. `asset-base` names the folder containing the artwork filenames in the catalogue. `chrome-assets` optionally supplies the separately licensed status icons. `appearance` changes the screen surroundings; `browser="safari"` adds the mobile toolbar. Set the `status` JavaScript property to `false` when the app content already includes a status bar.

Original artwork is not included in npm or public documentation assets. The owner preview serves it through the existing authenticated private asset route. Obtain and use artwork under the source terms; importing it does not grant redistribution rights. Missing artwork is reported explicitly rather than replaced with a different device.
