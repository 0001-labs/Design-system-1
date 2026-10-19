// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, expect, test, vi } from "vite-plus/test";
import { appBannerPlacement, appleBrowser, closeAppBanner, ensureSmartAppBanner, startAppBanners, type AppBannerDevice } from "../DS1/0-face/app-banner";

vi.stubGlobal("fetch", vi.fn(async () => new Response("{}")));
await import("../DS1/2-core/ds-message");

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko)";
const SAFARI = `${IPHONE} Version/18.5 Mobile/15E148 Safari/604.1`;
const CHROME = `${IPHONE} CriOS/131.0.6778.73 Mobile/15E148 Safari/604.1`;
const FIREFOX = `${IPHONE} FxiOS/133.0 Mobile/15E148 Safari/605.1.15`;
const WEBVIEW = `${IPHONE} Mobile/15E148`;
const ANDROID = "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36";
const MAC = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15";
const phone = (userAgent: string, more: Partial<AppBannerDevice> = {}): AppBannerDevice => ({ userAgent, touchPoints: 5, mobile: true, standalone: false, ...more });
const app = { appId: "1234567890", open: "https://example.com/app" };

afterEach(() => { document.body.replaceChildren(); document.head.replaceChildren(); localStorage.clear(); });

test("Safari on an iPhone takes Apple's banner, other iOS browsers draw the page's own", () => {
  expect(appleBrowser(SAFARI)).toBe("safari");
  expect(appleBrowser(CHROME)).toBe("other");
  expect(appleBrowser(FIREFOX)).toBe("other");
  expect(appleBrowser(WEBVIEW)).toBe("webview");
  expect(appBannerPlacement(app, phone(SAFARI))).toBe("safari");
  expect(appBannerPlacement(app, phone(CHROME))).toBe("drawn");
  expect(appBannerPlacement(app, phone(FIREFOX))).toBe("drawn");
});

test("never on a computer, Android, from the home screen or in an app's web view", () => {
  expect(appBannerPlacement(app, phone(MAC, { mobile: false, touchPoints: 0 }))).toBe("none");
  expect(appBannerPlacement(app, phone(ANDROID))).toBe("none");
  expect(appBannerPlacement(app, phone(SAFARI, { standalone: true }))).toBe("none");
  expect(appBannerPlacement(app, phone(WEBVIEW))).toBe("none");
  // An iPad asking for the desktop site still says Macintosh, with touch.
  expect(appBannerPlacement(app, phone(MAC))).toBe("safari");
});

test("closed once, it stays closed in this browser; Safari keeps its own", () => {
  closeAppBanner(app);
  expect(appBannerPlacement(app, phone(CHROME))).toBe("none");
  expect(appBannerPlacement({ ...app, appId: "999" }, phone(CHROME))).toBe("drawn");
  expect(appBannerPlacement(app, phone(SAFARI))).toBe("safari");
});

test("without an App Store id Safari draws the page's own; without any address nothing shows", () => {
  expect(appBannerPlacement({ appUrl: "https://testflight.apple.com/join/abc" }, phone(SAFARI))).toBe("drawn");
  expect(appBannerPlacement({}, phone(CHROME))).toBe("none");
});

test("the meta tag carries the id and the deep link, written once", () => {
  ensureSmartAppBanner(app);
  ensureSmartAppBanner(app);
  const metas = document.head.querySelectorAll('meta[name="apple-itunes-app"]');
  expect(metas).toHaveLength(1);
  expect(metas[0]!.getAttribute("content")).toBe("app-id=1234567890, app-argument=https://example.com/app");
});

test("ds-message form=app draws nothing on a computer and the whole row in preview", async () => {
  const hidden = Object.assign(document.createElement("ds-message"), { form: "app", appId: "1234567890", heading: "Example", text: "An app", literal: true });
  document.body.append(hidden);
  await hidden.updateComplete;
  expect(hidden.hidden).toBe(true);
  expect(hidden.shadowRoot!.querySelector(".ds-notice")).toBeNull();

  const shown = Object.assign(document.createElement("ds-message"), { form: "app", appId: "1234567890", heading: "Example", text: "An app", literal: true, src: "/icon.png", preview: true });
  document.body.append(shown);
  await shown.updateComplete;
  expect(shown.hidden).toBe(false);
  expect(shown.getAttribute("role")).toBe("region");
  expect(shown.getAttribute("aria-label")).toBe("Example");
  const root = shown.shadowRoot!;
  expect(root.querySelector(".ds-notice--app")).not.toBeNull();
  expect(root.querySelector(".ds-notice__picture img")!.getAttribute("src")).toBe("/icon.png");
  expect(root.querySelector('[part="title"]')!.textContent!.trim()).toBe("Example");
  expect(root.querySelector('[part="text"]')!.textContent!.trim()).toBe("An app");
  const open = root.querySelector<HTMLAnchorElement>("a.ds-notice__open")!;
  expect(open.getAttribute("href")).toBe("https://apps.apple.com/app/id1234567890");
  expect(open.textContent!.trim()).toBe("Open");
  root.querySelector<HTMLButtonElement>(".ds-notice__dismiss")!.click();
  expect(shown.hidden).toBe(true);
});

test("a native block hides where it does not belong", () => {
  document.body.innerHTML = `<div class="ds-notice ds-notice--app" data-app-id="1234567890"><a class="ds-notice__open">Open</a><button class="ds-notice__dismiss"></button></div>`;
  startAppBanners();
  expect(document.querySelector<HTMLElement>(".ds-notice--app")!.hidden).toBe(true);
});

test("the row is three squares: the picture two, the lines and the controls on the sixteen", () => {
  const css = readFileSync(join(import.meta.dirname, "../DS1/1-root/notice.css"), "utf8");
  const start = css.indexOf(".ds-notice--app {");
  const rule = css.slice(start, css.indexOf("}", start));
  expect(rule).toContain("grid-template-columns: calc(2 * var(--ds-unit))");
  expect(rule).toContain("grid-template-rows: var(--ds-unit) var(--ds-unit)");
  expect(rule).toContain("padding: calc(var(--ds-unit) / 2) var(--ds-unit)");
  expect(rule).toContain("line-height: var(--ds-type-lineheight-default)");
  expect(css).toContain("margin: calc(1.5 * var(--ds-unit) - var(--ds-control-height)) 0 0");
});
