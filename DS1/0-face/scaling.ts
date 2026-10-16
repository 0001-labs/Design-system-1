/**
 * Design system 1's scale, `--sf`: every measure is multiplied by it.
 *
 * A computer stays at 1, however narrow its window. A phone or a tablet (a
 * mobile browser, or a touch screen whose shorter side is at most 820px) is
 * drawn as if the screen were 280 units wide: the scale is the page's width
 * over 280, never under 0.75 or over 2, so a 375px phone draws everything a
 * third larger.
 *
 * `startScaling()` puts the scale on the page and keeps it there through
 * resizes and turns; `applyScaling()` does it once. Both set `--sf` and, on a
 * phone or tablet, `data-mobile` on the root element. The module imports
 * nothing, so a page without the components copies it alone (Sync 1's `root`
 * export with `"modules": ["scaling"]`). Call it before the page renders, and
 * the first paint is already to scale.
 */
export type ScalingMode = "auto" | "fixed" | "fluid";

/**
 * How the scale is rounded. `"layout"`: a square (20 units) is a whole number
 * of the 1/64px steps browsers lay pages out in, so a long run of rows stays on
 * ruled lines drawn exactly. `"pixel"`: a square is a whole number of device
 * pixels, rounded down, so every grid line and hairline stays sharp.
 * Without it the scale keeps three decimals.
 */
export type ScalingSnap = "layout" | "pixel" | false;

export interface ScalingConfig {
  mode: ScalingMode;
  baseWidth: number;
  minScale: number;
  maxScale: number;
  snap?: ScalingSnap;
}

export interface ScalingOptions extends Partial<ScalingConfig> {
  /** The element that receives `--sf` and `data-mobile`; the document's root by default. */
  root?: HTMLElement;
}

// ============================================================================
// Configuration
// ============================================================================

export const defaultScalingConfig: ScalingConfig = {
  mode: "auto",
  baseWidth: 280,
  minScale: 0.75,
  maxScale: 2.0,
};

/** One square in units. */
const SQUARE = 20;
/** Browsers lay pages out in 1/64px steps. */
const LAYOUT_STEPS = 64;

/** The factor, rounded so that a square is a whole number of 1/64px layout steps. */
export function toLayoutStep(factor: number): number {
  return Math.round(factor * SQUARE * LAYOUT_STEPS) / (SQUARE * LAYOUT_STEPS);
}

/** The factor, rounded down so that a square is a whole number of device pixels. */
export function toDevicePixel(factor: number, pixelRatio = 1): number {
  const ratio = pixelRatio > 0 ? pixelRatio : 1;
  return Math.floor(factor * SQUARE * ratio) / (SQUARE * ratio);
}

export function calculateScalingFactor(viewportWidth: number, config: ScalingConfig = defaultScalingConfig, pixelRatio = 1): number {
  if (config.mode === "fixed") return 1;
  const factor = Math.max(config.minScale, Math.min(config.maxScale, viewportWidth / config.baseWidth));
  if (config.snap === "layout") return toLayoutStep(factor);
  if (config.snap === "pixel") return toDevicePixel(factor, pixelRatio);
  return Number(factor.toFixed(3));
}

// ============================================================================
// Device
// ============================================================================

/**
 * Whether the page is on a phone or a tablet, the screens that scale: the
 * browser says it is mobile, or the screen takes touch and its shorter side
 * is at most 820px. A computer is never one, however narrow its window.
 */
export function detectMobileDevice(): boolean {
  if (typeof navigator === "undefined" || typeof window === "undefined") return false;
  const agent = navigator.userAgent || navigator.vendor || "";
  const byAgent = /Mobile|Android|iP(ad|hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)|Windows Phone|Phone|Tablet/i.test(agent);
  const touch = (navigator.maxTouchPoints || 0) > 1;
  const narrow = Math.min(window.innerWidth || 0, window.innerHeight || 0) <= 820;
  return byAgent || (touch && narrow);
}

// ============================================================================
// Applying the scale
// ============================================================================

/** Puts the scale on the page once: `--sf`, and `data-mobile` on a phone or tablet. Returns the factor. */
export function applyScaling(options: ScalingOptions = {}): number {
  if (typeof document === "undefined" || typeof window === "undefined") return 1;
  const { root = document.documentElement, ...config } = options;
  const mobile = detectMobileDevice();
  // The page's width without its scroll bar.
  const width = document.documentElement.clientWidth || window.innerWidth || 0;
  const factor = mobile ? calculateScalingFactor(width, { ...defaultScalingConfig, ...config }, window.devicePixelRatio || 1) : 1;
  root.style.setProperty("--sf", String(factor));
  root.toggleAttribute("data-mobile", mobile);
  return factor;
}

/** Puts the scale on the page now and again on every resize and turn. Returns a function that stops following. */
export function startScaling(options: ScalingOptions = {}): () => void {
  if (typeof window === "undefined") return () => {};
  const apply = () => { applyScaling(options); };
  apply();
  window.addEventListener("resize", apply);
  window.addEventListener("orientationchange", apply);
  return () => {
    window.removeEventListener("resize", apply);
    window.removeEventListener("orientationchange", apply);
  };
}
