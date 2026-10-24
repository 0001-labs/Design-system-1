---
title: AppChrome
description: Platform controls that surround the app viewport.
---

`ds-app-chrome` draws the controls independently of the window or device artwork. Available kinds are `macos`, `safari`, `chrome`, `edge`, `ios`, `ipados` and `safari-ios`.

```html
<ds-app-chrome kind="ios" time="00:01"></ds-app-chrome>
<ds-app-chrome kind="safari" label="Orders" address="shop.example"></ds-app-chrome>
```

The time defaults to **00:01** and remains editable. The address has no default. Both light and dark appearances are supported. iOS status geometry follows the source status component; device artwork supplies the camera island. `asset-base` can supply `status-wifi.svg` and `status-battery.svg` from appropriately licensed assets.

For interactive scenes, set `interactive` and listen for `chrome-action`. Its `detail.action` identifies the requested action. Buttons stay disabled in presentation mode; the component never navigates, closes a page or mutates app records itself.

Platform chrome intentionally uses native typography and dimensions. DS1’s surrounding documentation and editor controls retain DS1’s own sizing and typography. Safari and Chromium toolbar templates use DS1 icons and need visual review against the particular OS/browser version a film targets.
