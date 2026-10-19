// app-banner.ts
// Where a banner leading to a site's iPhone app shows, and what its Open does.
// `<ds-message form="app">` uses it, and a page without Lit calls
// `startAppBanners()` for every `.ds-notice--app` block it wrote.
//
// On a phone or tablet running iOS, Safari draws Apple's own Smart App Banner
// from `<meta name="apple-itunes-app">`, so the page draws nothing there; in
// another iOS browser (Chrome, Firefox, Edge…) the page draws Design system
// 1's banner. Never on a computer, an Android phone, a page opened from the
// home screen or an app's own web view, and never again once closed in this
// browser.

import { detectMobileDevice } from "./scaling";

export interface AppBannerOptions {
  /** The app's App Store id, the digits after `id` in its store address. */
  appId?: string;
  /** The app's store address; `https://apps.apple.com/app/id<appId>` by default. */
  appUrl?: string;
  /** The address that opens the app at this page: a universal link or the app's own scheme. */
  open?: string;
  /** What remembers the close in this browser; one key per app by default. */
  key?: string;
}

/** `safari`: Apple's banner from the meta tag; `drawn`: the page's own; `none`: nothing. */
export type AppBannerPlacement = "safari" | "drawn" | "none";

export interface AppBannerDevice {
  userAgent: string;
  touchPoints: number;
  /** A phone or tablet, as the scale reads it. */
  mobile: boolean;
  /** Opened from the home screen. */
  standalone: boolean;
}

/** iOS's other browsers, each with Safari's engine and its own token. */
const OTHER_BROWSERS = /CriOS|FxiOS|EdgiOS|OPiOS|OPT\/|GSA\/|DuckDuckGo|Ddg\/|YaBrowser|Focus\/|Brave\//;

export function appBannerDevice(): AppBannerDevice {
  if (typeof navigator === "undefined" || typeof window === "undefined") return { userAgent: "", touchPoints: 0, mobile: false, standalone: false };
  const standalone = Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
    || Boolean(window.matchMedia?.("(display-mode: standalone)").matches);
  return { userAgent: navigator.userAgent || "", touchPoints: navigator.maxTouchPoints || 0, mobile: detectMobileDevice(), standalone };
}

/** An iPhone, iPod or iPad, including an iPad that asks for the desktop site. */
export function isAppleMobile({ userAgent, touchPoints }: Pick<AppBannerDevice, "userAgent" | "touchPoints">): boolean {
  return /iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && touchPoints > 1);
}

/**
 * Safari, another browser, or an app's web view. A web view's agent has no
 * `Safari/` token (Safari's view controller and sign-in sheet keep it).
 */
export function appleBrowser(userAgent: string): "safari" | "other" | "webview" {
  if (OTHER_BROWSERS.test(userAgent)) return "other";
  return /Safari\//.test(userAgent) ? "safari" : "webview";
}

export function appBannerKey(options: AppBannerOptions): string {
  return options.key || `ds-app-banner:${options.appId || options.appUrl || options.open || ""}`;
}

export function appStoreUrl(options: AppBannerOptions): string {
  return options.appUrl || (options.appId ? `https://apps.apple.com/app/id${options.appId}` : "");
}

export function isAppBannerClosed(options: AppBannerOptions): boolean {
  try { return localStorage.getItem(appBannerKey(options)) === "closed"; } catch { return false; }
}

/** Remembers the close in this browser, so the banner never comes back here. */
export function closeAppBanner(options: AppBannerOptions): void {
  try { localStorage.setItem(appBannerKey(options), "closed"); } catch { /* private mode keeps it for the page */ }
}

/**
 * Where the banner shows on this device. Safari takes Apple's banner only
 * when there is an App Store id for its meta tag; without one it draws the
 * page's own, like the other browsers.
 */
export function appBannerPlacement(options: AppBannerOptions, device: AppBannerDevice = appBannerDevice()): AppBannerPlacement {
  if (!appStoreUrl(options) && !options.open) return "none";
  if (!device.mobile || device.standalone || !isAppleMobile(device)) return "none";
  const browser = appleBrowser(device.userAgent);
  if (browser === "webview") return "none";
  if (browser === "safari" && options.appId) return "safari";
  return isAppBannerClosed(options) ? "none" : "drawn";
}

/**
 * Writes Apple's `<meta name="apple-itunes-app">` when the page has none.
 * Safari reads it as the page loads, so a page that knows its app writes the
 * tag in its own head; this is the fallback for one that did not.
 */
export function ensureSmartAppBanner(options: AppBannerOptions): void {
  if (typeof document === "undefined" || !options.appId) return;
  if (document.head.querySelector('meta[name="apple-itunes-app"]')) return;
  const meta = document.createElement("meta");
  meta.name = "apple-itunes-app";
  meta.content = [`app-id=${options.appId}`, options.open ? `app-argument=${options.open}` : ""].filter(Boolean).join(", ");
  document.head.append(meta);
}

/**
 * Opens the app: the deep link first, then the App Store when the page is
 * still in view a moment later (the app was not there to take it). Without a
 * deep link, the store, which offers Open when the app is installed.
 */
export function openApp(options: AppBannerOptions, wait = 1500): void {
  const store = appStoreUrl(options);
  if (!options.open) { if (store) location.href = store; return; }
  location.href = options.open;
  if (!store) return;
  const timer = window.setTimeout(() => { if (document.visibilityState === "visible") location.href = store; }, wait);
  const left = () => { window.clearTimeout(timer); document.removeEventListener("visibilitychange", left); window.removeEventListener("pagehide", left); };
  document.addEventListener("visibilitychange", left);
  window.addEventListener("pagehide", left);
}

/**
 * Puts every `.ds-notice--app` block on the page in place: hides it unless
 * this device draws it, writes the meta tag for Safari, and wires its Open
 * link (`.ds-notice__open`) and close button (`.ds-notice__dismiss`). The
 * block names its app in `data-app-id`, `data-app-url`, `data-open` and
 * optionally `data-remember`. Returns a function that unwires them.
 */
export function startAppBanners(root: ParentNode = document): () => void {
  const undo: (() => void)[] = [];
  for (const block of root.querySelectorAll<HTMLElement>(".ds-notice--app")) {
    const options: AppBannerOptions = { appId: block.dataset.appId, appUrl: block.dataset.appUrl, open: block.dataset.open, key: block.dataset.remember };
    const placement = appBannerPlacement(options);
    if (placement === "safari") ensureSmartAppBanner(options);
    block.hidden = placement !== "drawn";
    if (block.hidden) continue;
    const link = block.querySelector<HTMLAnchorElement>(".ds-notice__open");
    const close = block.querySelector<HTMLButtonElement>(".ds-notice__dismiss");
    if (link && !link.getAttribute("href")) link.href = appStoreUrl(options);
    const onOpen = (event: MouseEvent) => { if (!options.open) return; event.preventDefault(); openApp(options); };
    const onClose = () => { closeAppBanner(options); block.hidden = true; };
    link?.addEventListener("click", onOpen);
    close?.addEventListener("click", onClose);
    undo.push(() => { link?.removeEventListener("click", onOpen); close?.removeEventListener("click", onClose); });
  }
  return () => undo.forEach(fn => fn());
}
