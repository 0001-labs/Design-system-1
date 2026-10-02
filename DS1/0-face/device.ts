// device.ts
// Device detection, context utilities, and responsive scaling

import { signal } from "@lit-labs/signals";
import { calculateScalingFactor as calculateScale, defaultScalingConfig, type ScalingConfig } from "./scaling";
export type { ScalingConfig, ScalingMode } from "./scaling";

// ============================================================================
// Types
// ============================================================================

export type DeviceType = "mobile" | "tablet" | "desktop";

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchCapable: boolean;
  deviceType: DeviceType;
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
}

/** Reactive scaling factor signal */
export const scalingFactor = signal<number>(1);

/** Current scaling configuration */
export const scalingConfig = signal<ScalingConfig>(defaultScalingConfig);

// ============================================================================
// Device Detection
// ============================================================================

/**
 * Comprehensive mobile device detection
 * Combines user agent detection, touch capability, and viewport size
 */
export function detectMobileDevice(): boolean {
  if (typeof navigator === "undefined" || typeof window === "undefined") {
    return false;
  }

  const nav = navigator as any;
  const win = window as any;
  const ua: string =
    (nav && (nav.userAgent || nav.vendor)) || (win && win.opera) || "";

  // User agent based detection
  const uaMatchesMobile =
    /Mobile|Android|iP(ad|hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)|Windows Phone|Phone|Tablet/i.test(
      ua
    );

  // Touch capability detection
  const touchPoints = (nav && nav.maxTouchPoints) || 0;
  const isTouchCapable = touchPoints > 1;

  // Viewport detection
  const narrowViewport = win
    ? Math.min(win.innerWidth || 0, win.innerHeight || 0) <= 820
    : false;

  return uaMatchesMobile || (isTouchCapable && narrowViewport);
}

/**
 * Get detailed device information
 */
export function getDeviceInfo(): DeviceInfo {
  const isMobile = detectMobileDevice();
  const nav = navigator as any;
  const win = window as any;

  const touchPoints = (nav && nav.maxTouchPoints) || 0;
  const isTouchCapable = touchPoints > 1;

  // Use clientWidth instead of innerWidth to exclude scrollbars
  const screenWidth =
    typeof document !== "undefined"
      ? document.documentElement.clientWidth
      : win?.innerWidth || 0;
  const screenHeight =
    typeof document !== "undefined"
      ? document.documentElement.clientHeight
      : win?.innerHeight || 0;
  const isTablet = isMobile && Math.min(screenWidth, screenHeight) >= 600;

  return {
    isMobile,
    isTablet,
    isDesktop: !isMobile,
    isTouchCapable,
    deviceType: isMobile ? (isTablet ? "tablet" : "mobile") : "desktop",
    userAgent: (nav && (nav.userAgent || nav.vendor)) || "",
    screenWidth,
    screenHeight,
  };
}

// ============================================================================
// Scaling
// ============================================================================

/**
 * Calculate the scaling factor based on viewport width
 * @param viewportWidth - Current viewport width in pixels
 * @param config - Scaling configuration
 * @returns The calculated scaling factor
 */
export function calculateScalingFactor(
  viewportWidth: number,
  config: ScalingConfig = scalingConfig.get()
): number {
  return calculateScale(viewportWidth, config);
}

/**
 * Set the scaling configuration
 * @param config - Partial scaling configuration to apply
 */
export function setScalingConfig(config: Partial<ScalingConfig>): void {
  const currentConfig = scalingConfig.get();
  const newConfig = { ...currentConfig, ...config };
  scalingConfig.set(newConfig);

  // Recalculate scaling factor if in browser
  if (typeof window !== "undefined") {
    updateScalingFactor();
  }
}

/**
 * Update the scaling factor based on current viewport
 * Desktop always uses factor 1; mobile uses computed factor
 */
export function updateScalingFactor(): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  const isMobile = detectMobileDevice();

  // Desktop: always use factor 1
  if (!isMobile) {
    const factor = 1;
    scalingFactor.set(factor);
    document.documentElement.style.setProperty("--sf", factor.toString());
    window.dispatchEvent(
      new CustomEvent("scaling-changed", {
        detail: { scalingFactor: factor, config: scalingConfig.get() },
      })
    );
    return;
  }

  // Mobile: compute scaling based on viewport
  const viewportWidth = document.documentElement.clientWidth;
  const config = scalingConfig.get();
  const newFactor = calculateScalingFactor(viewportWidth, config);

  scalingFactor.set(newFactor);
  document.documentElement.style.setProperty("--sf", newFactor.toString());

  window.dispatchEvent(
    new CustomEvent("scaling-changed", {
      detail: { scalingFactor: newFactor, config },
    })
  );
}

/**
 * Get the current scaling factor
 * @returns The current scaling factor
 */
export function getScalingFactor(): number {
  return scalingFactor.get();
}

/**
 * Convert a design pixel value to scaled pixels
 * @param designPx - The design pixel value (based on 280px width)
 * @returns The scaled pixel value
 */
export function scale(designPx: number): number {
  return designPx * scalingFactor.get();
}

/**
 * Convert a scaled pixel value back to design pixels
 * @param scaledPx - The scaled pixel value
 * @returns The design pixel value
 */
export function unscale(scaledPx: number): number {
  const factor = scalingFactor.get();
  return factor === 0 ? scaledPx : scaledPx / factor;
}

// ============================================================================
// Unified Initialization
// ============================================================================

/**
 * Initialize device detection and scaling
 * Sets CSS classes (.mobile/.desktop) and --sf custom property
 */
export function initDeviceDetection(): DeviceInfo {
  const deviceInfo = getDeviceInfo();

  if (typeof document === "undefined") {
    return deviceInfo;
  }

  // Set device class on html element
  if (deviceInfo.isMobile) {
    document.documentElement.classList.add("mobile");
    document.documentElement.classList.remove("desktop");
  } else {
    document.documentElement.classList.add("desktop");
    document.documentElement.classList.remove("mobile");
  }

  // Update scaling factor (handles --sf CSS property)
  updateScalingFactor();

  // Log device info
  const factor = scalingFactor.get();
  if (deviceInfo.isMobile) {
    console.log(
      `[Design system 1] Mobile device detected - ${deviceInfo.deviceType} (${deviceInfo.screenWidth}x${deviceInfo.screenHeight}), scaling factor: ${factor.toFixed(2)}`
    );
  } else {
    console.log(
      `[Design system 1] Desktop device detected (${deviceInfo.screenWidth}x${deviceInfo.screenHeight})`
    );
  }

  // Log additional details in development mode
  if (typeof window !== "undefined" && (window as any).DS_ONE_DEBUG) {
    console.log("[Design system 1] Device Info:", {
      type: deviceInfo.deviceType,
      isMobile: deviceInfo.isMobile,
      isTablet: deviceInfo.isTablet,
      isDesktop: deviceInfo.isDesktop,
      isTouchCapable: deviceInfo.isTouchCapable,
      viewport: `${deviceInfo.screenWidth}x${deviceInfo.screenHeight}`,
      scalingFactor: factor,
      userAgent: deviceInfo.userAgent,
    });
  }

  return deviceInfo;
}

// Auto-initialize when module loads
if (typeof window !== "undefined") {
  // Wait for DOM to be ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      initDeviceDetection();
    });
  } else {
    // DOM is already ready
    initDeviceDetection();
  }

  // Single debounced resize handler for both device detection + scaling
  let resizeTimeout: ReturnType<typeof setTimeout>;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      initDeviceDetection();
    }, 100);
  });

  // Also handle orientation change
  window.addEventListener("orientationchange", () => {
    setTimeout(initDeviceDetection, 100);
  });
}

// ============================================================================
// App-like Behavior
// ============================================================================

/**
 * Disable double-tap to zoom in the browser (app-like behavior)
 * Prevents all zoom gestures including double-tap and pinch-to-zoom
 */
export function applike(): void {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return;
  }

  // Set viewport meta tag to prevent zoom - this is the most important step
  let viewport = document.querySelector('meta[name="viewport"]');
  if (!viewport) {
    viewport = document.createElement("meta");
    viewport.setAttribute("name", "viewport");
    document.head.appendChild(viewport);
  }
  viewport.setAttribute(
    "content",
    "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
  );

  // Apply touch-action: pan-x pan-y globally to prevent zoom but allow panning
  const style = document.createElement("style");
  style.id = "ds-one-applike-style";
  style.textContent = `
    * {
      touch-action: pan-x pan-y !important;
      -ms-touch-action: pan-x pan-y !important;
    }
    html, body {
      touch-action: pan-x pan-y !important;
      -ms-touch-action: pan-x pan-y !important;
    }
  `;
  // Remove existing style if present
  const existingStyle = document.getElementById("ds-one-applike-style");
  if (existingStyle) {
    existingStyle.remove();
  }
  document.head.appendChild(style);

  // Track touch events to prevent double-tap zoom
  let lastTouchEnd = 0;
  let touchStartTime = 0;

  const preventZoom = (event: TouchEvent | WheelEvent | Event) => {
    // Prevent pinch zoom (two fingers)
    if (event instanceof TouchEvent) {
      if (event.touches.length > 1) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      const now = Date.now();

      if (event.type === "touchstart") {
        // If touchstart happens within 300ms of last touchend, it's likely a double-tap
        if (now - lastTouchEnd < 300) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        touchStartTime = now;
      } else if (event.type === "touchend") {
        const touchDuration = now - touchStartTime;
        // If this is a quick tap (< 300ms) and happened soon after previous touchend, prevent it
        if (touchDuration < 300 && now - lastTouchEnd < 300) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        lastTouchEnd = now;
      } else if (event.type === "touchmove") {
        // Prevent any touchmove that might trigger zoom
        if (event.touches.length > 1) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
      }
    }

    // Prevent wheel zoom with ctrl/cmd key (common on trackpads)
    if (event instanceof WheelEvent && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
  };

  // Use capture phase to catch events earlier
  const options = { passive: false, capture: true };

  // Prevent all zoom gestures - use capture phase
  document.addEventListener("touchstart", preventZoom, options);
  document.addEventListener("touchmove", preventZoom, options);
  document.addEventListener("touchend", preventZoom, options);
  document.addEventListener("touchcancel", preventZoom, options);

  // Prevent wheel zoom
  document.addEventListener("wheel", preventZoom, options);

  // Prevent gesture events (iOS Safari) - use capture phase
  document.addEventListener(
    "gesturestart",
    (e) => {
      e.preventDefault();
      e.stopPropagation();
    },
    options
  );
  document.addEventListener(
    "gesturechange",
    (e) => {
      e.preventDefault();
      e.stopPropagation();
    },
    options
  );
  document.addEventListener(
    "gestureend",
    (e) => {
      e.preventDefault();
      e.stopPropagation();
    },
    options
  );
}
