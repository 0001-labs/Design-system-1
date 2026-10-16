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

## Integration with Scaling

Device detection and scaling are unified. Desktop always uses `--sf: 1`, while mobile devices calculate a scaling factor based on viewport width. See Scaling for details.

## Best Practices

1. Test on real devices when possible
2. Use the `--sf` CSS variable for responsive sizing
3. Design mobile-first
4. Ensure touch targets are at least 44×44px
5. Test both portrait and landscape orientations
