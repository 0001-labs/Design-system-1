---
title: Windows
description: Desktop application and browser surroundings.
---

`ds-window` wraps app content in a macOS application window or a Safari, Google Chrome or Microsoft Edge browser window.

```html
<ds-window kind="safari" label="Orders" address="shop.example" style="height:500px">
  <iframe title="Orders preview" src="/sample-app/"></iframe>
</ds-window>
```

Choose `kind="macos|safari|chrome|edge"` and `appearance="light|dark"`. Use a real app kit in the viewport; keep the window upright and scale it as a whole. Browser controls use shared DS1 icons within platform-specific geometry. These are configurable presentation templates, not version-certified replicas of each browser release.

The `viewport` CSS part owns the app area. A slotted iframe fills it. Add `interactive` to emit `chrome-action` requests such as `back`, `reload` and `close`; the scene decides what those requests do.
