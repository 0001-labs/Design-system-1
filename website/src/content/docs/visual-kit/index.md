---
title: VisualKit
description: Real app content, presented in windows and device frames.
---

VisualKit supplies the surroundings for showing an app: desktop windows, device bezels and platform controls. It replaces the name FilmKit. The app content remains the product’s own code on sample records.

| Layer | Contains |
| --- | --- |
| [Windows](/visual-kit/windows/) | macOS app windows, Safari, Google Chrome and Microsoft Edge |
| [Device Bezels](/visual-kit/device-bezels/) | Measured iPhone and iPad artwork with a live app viewport |
| [AppChrome](/visual-kit/app-chrome/) | Window controls, browser toolbars, status bars and device time |
| [App content](/visual-kit/app-content/) | The product’s real, revision-pinned app on sample data |

[Open the owner preview](/private-app/visual-kit.html) to compare the window styles and 20 device variants. Sign in with the owner account to view the licensed artwork.

Public Lit components live in `DS1/5-visual-kit/`, with `2-core` entry points for Sync 1 selections `window`, `device-bezel` and `app-chrome`. The device artwork is supplied separately and is excluded from the public package.

The default device clock is **00:01**. Browser addresses are empty until supplied. Controls are presentation-only by default. Opting into interaction emits requests for the scene to handle; it does not close or navigate the host page.
