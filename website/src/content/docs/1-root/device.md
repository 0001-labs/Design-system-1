---
title: Device
description: Built-in device detection and responsive scaling in Design system 1
---

Built-in device detection and responsive scaling in Design system 1.

Design system 1 includes automatic mobile and device detection with integrated responsive scaling. The device module automatically detects device type, sets CSS classes, and configures the scaling factor.

## Auto-Initialization

When Design system 1 loads, it automatically:

1. Detects whether the device is mobile, tablet, or desktop
2. Adds `.mobile` or `.desktop` class to the `<html>` element
3. Sets the `--sf` CSS custom property for scaling
4. Listens for resize and orientation changes

## Device Detection API

### detectMobileDevice()

Returns `true` if the current device is mobile (phone or tablet).

```javascript
import { detectMobileDevice } from "design-system-1";

if (detectMobileDevice()) {
  console.log("Mobile device");
} else {
  console.log("Desktop device");
}
```

Detection combines:

- User agent string matching
- Touch capability (`maxTouchPoints > 1`)
- Viewport size (narrow viewport ≤ 820px)

### getDeviceInfo()

Returns detailed device information.

```javascript
import { getDeviceInfo } from "design-system-1";

const info = getDeviceInfo();
// {
//   isMobile: boolean,
//   isTablet: boolean,
//   isDesktop: boolean,
//   isTouchCapable: boolean,
//   deviceType: 'mobile' | 'tablet' | 'desktop',
//   userAgent: string,
//   screenWidth: number,
//   screenHeight: number
// }
```

### initDeviceDetection()

Manually trigger device detection and scaling update.

```javascript
import { initDeviceDetection } from "design-system-1";

const deviceInfo = initDeviceDetection();
```

This is called automatically on load and resize, but can be invoked manually if needed.

## CSS Classes

The `<html>` element receives device-specific classes:

```css
/* Target mobile devices */
html.mobile .my-element {
  font-size: 18px;
}

/* Target desktop devices */
html.desktop .my-element {
  font-size: 14px;
}
```

## App-Like Behavior

Disable browser zoom gestures for a native app feel.

```javascript
import { applike } from "design-system-1";

applike();
```

This prevents:

- Double-tap to zoom
- Pinch-to-zoom
- Ctrl/Cmd + scroll wheel zoom

## Page travel

A page travels the way it is going, and never twice.

On a phone or a tablet a page change inside one document slides the whole page in one view transition: onward in from the right, back out to the right, 240ms on an ease-out curve in `transform` alone. A computer keeps the browser's plain crossfade, however narrow its window, and reduced motion swaps the page in place.

A swipe from the screen's edge is the browser's own animation: Safari slides the page arriving in under the finger. The page never plays a second animation over it. A transition started after the swipe captures the page just left and slides or fades it over the one the swipe has already shown, a flash of where the person came from, which the browser's own Back and Forward buttons never cause.

- **Inside one document**, a `popstate` whose `hasUAVisualTransition` is true draws the route plainly: no `startViewTransition`, neither the slide nor the crossfade, and a transition still running is retired with `skipTransition()` first, so its old snapshot cannot flash either. A route that prepares its data before it is drawn draws plainly too, once prepared.
- **Between documents** no event reports the swipe ([whatwg/html#10831](https://github.com/whatwg/html/issues/10831)), so the page notes a touch that begins within a square of either edge. A `pageswap` within 1.5 seconds of it, on a `traverse`, skips its transition and leaves the note in session storage; the document arriving skips its `pagereveal` transition on the note and spends it at once (15 seconds at most). A tap at the edge that follows a link is a `push` and still slides.

Back and Forward in the browser's own controls animate nothing themselves, so they keep the page's slide.

## Integration with Scaling

Device detection and scaling are unified: this module puts the scale on the page with the scaling module's rule, setting `--sf` and `data-mobile` on the root and emitting `scaling-changed`. A computer always uses `--sf: 1`, however narrow its window, while phones and tablets calculate a scaling factor based on the page's width. A page that needs only the scale calls `startScaling()` from the scaling module instead. See [Scaling](/1-root/scaling/) for details.

## Best Practices

1. Test on real devices when possible
2. Use the `--sf` CSS variable for responsive sizing
3. Design mobile-first
4. Ensure touch targets are at least 44×44px
5. Test both portrait and landscape orientations
