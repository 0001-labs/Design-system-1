/**
 * Design system 1's theme, on before the first paint.
 *
 * A classic script for the <head>: inline it before the stylesheets, or load it
 * there with a plain <script src> (not a module), which holds rendering until
 * it has run. It needs nothing else and waits for nothing.
 *
 * It reads the stored choice, light, dark or system, and puts the theme on
 * the root element at once (with nothing stored, `themeDefault`: system
 * unless the product says light or dark):
 * - the class `light-theme` or `dark-theme`, the canonical mark the
 *   stylesheets key on;
 * - `data-theme="light"` or `"dark"`, the same, for pages that key on it;
 * - `color-scheme`, so light-dark() tokens and the browser's controls follow;
 * - `--lightningcss-light` and `--lightningcss-dark`, so CSS compiled with
 *   Lightning CSS's light-dark() fallback follows the choice, not the system;
 * - the canvas behind the page and the theme-color meta, in the paper.
 * It also sets `lang` from the language module's stored choice, or from the
 * address when the product takes the language from there.
 *
 * Then it keeps the page right: in system mode it follows
 * prefers-color-scheme as it changes, and it applies the choice again when
 * another tab stores one and when a page returns from the back-forward cache.
 * A change after the first paint crosses over in a view transition of the
 * root, unless the reader asks for reduced motion.
 *
 * `window.DS_ONE_THEME` is the runtime: `mode()`, `theme()`, `set(mode)` and
 * `apply()`; a change dispatches `theme-changed` on window with
 * `{ theme, mode }`. `0-face/theme.ts` runs this same file, so the components
 * and a page without them share one implementation, whichever loads first.
 *
 * Set options before it on `window.DS_ONE_PREFERENCES`: `themeStorageKey`
 * (`"ds-one:theme"` by default), `themeDefault` (`"light"`, `"dark"` or
 * `"system"`, the default) for a visitor who has chosen nothing yet,
 * `themeMode: "system"` to follow the system and never read or write a stored
 * choice, and `themePaper` as `{ light, dark }` colours for the canvas, or
 * `false` to leave the background and theme-color to the page. The language
 * follows `window.DS_ONE_I18N`: `storageKey` (`"language"`), `persist: false`,
 * `languages`, `routing` with `languageFromAddress: true` (a prefix such as
 * `/ja/…` wins over the stored choice), and `langTarget` (set, the root's
 * `lang` is left alone).
 */
(function () {
  if (typeof window === "undefined" || typeof document === "undefined" || window.DS_ONE_THEME) return;
  var root = document.documentElement;
  var MODES = ["light", "dark", "system"];
  // Design system 1's languages (0-face/languages.ts), the prefixes an address may carry by default.
  var LANGUAGES = ["da", "de", "en", "es", "fi", "fr", "is", "it", "ja", "ko", "nb", "nn", "no", "pt", "pt-BR", "sv", "zh"];
  var PAPER = { light: "#ffffff", dark: "#2a2a2a" };
  // A choice that cannot be stored, or one made while the page follows the system, lasts for this page.
  var session = null;
  var shown = null;
  var shownMode = null;
  var crossing = null;

  function options() { return window.DS_ONE_PREFERENCES || {}; }
  function key() { return options().themeStorageKey || "ds-one:theme"; }
  function query(media) {
    try { return window.matchMedia ? window.matchMedia(media) : null; } catch { return null; }
  }

  function mode() {
    if (session) return session;
    if (options().themeMode === "system") return "system";
    try {
      var stored = window.localStorage.getItem(key());
      if (MODES.indexOf(stored) >= 0) return stored;
    } catch { /* Storage can be blocked. */ }
    var first = options().themeDefault;
    return MODES.indexOf(first) >= 0 ? first : "system";
  }

  function resolve(choice) {
    if (choice !== "system") return choice;
    var system = query("(prefers-color-scheme: dark)");
    return system && system.matches ? "dark" : "light";
  }

  function paint(theme) {
    root.classList.remove(theme === "dark" ? "light-theme" : "dark-theme");
    root.classList.add(theme + "-theme");
    root.setAttribute("data-theme", theme);
    root.style.colorScheme = theme;
    root.style.setProperty("--lightningcss-light", theme === "light" ? "initial" : " ");
    root.style.setProperty("--lightningcss-dark", theme === "dark" ? "initial" : " ");
    var paper = options().themePaper;
    if (paper === false) return;
    var colour = (paper && paper[theme]) || PAPER[theme];
    root.style.backgroundColor = colour;
    var meta = document.querySelector('meta[name="theme-color"]:not([media])');
    if (!meta && document.head) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      document.head.appendChild(meta);
    }
    if (meta) meta.setAttribute("content", colour);
  }

  // The two themes are two pictures of one page: cross from one to the other.
  function cross(theme) {
    var reduced = query("(prefers-reduced-motion: reduce)");
    if (typeof document.startViewTransition !== "function" || (reduced && reduced.matches) || document.visibilityState === "hidden") {
      paint(theme);
      return;
    }
    if (crossing) crossing.skipTransition();
    var painted = false;
    var once = function () { if (!painted) { painted = true; paint(theme); } };
    try {
      var transition = document.startViewTransition(once);
      crossing = transition;
      // A skipped crossing rejects all three promises; none may swallow the change.
      void transition.ready.catch(function () {});
      void transition.updateCallbackDone.catch(once);
      void transition.finished.catch(function () {}).then(function () { if (crossing === transition) crossing = null; });
    } catch {
      once();
    }
  }

  function apply() {
    var choice = mode();
    var theme = resolve(choice);
    var first = shown === null;
    var moved = theme !== shown || choice !== shownMode;
    if (!first && theme !== shown) cross(theme);
    else paint(theme);
    shown = theme;
    shownMode = choice;
    if (!first && moved) window.dispatchEvent(new CustomEvent("theme-changed", { detail: { theme: theme, mode: choice } }));
  }

  function set(choice) {
    if (MODES.indexOf(choice) < 0) return;
    session = null;
    if (options().themeMode === "system") {
      if (choice !== "system") session = choice;
    } else {
      try { window.localStorage.setItem(key(), choice); } catch { session = choice; }
    }
    apply();
  }

  var i18n = window.DS_ONE_I18N || {};
  // The language an address names in its first segment (`/pt-br/…` gives pt-BR), as the language module reads it.
  function addressLanguage() {
    if (!i18n.languageFromAddress) return null;
    var routing = i18n.routing || {};
    var prefixed = (routing.languages && routing.languages.length ? routing.languages : null) || (i18n.languages && i18n.languages.length ? i18n.languages : null) || LANGUAGES;
    var segment = String((window.location && window.location.pathname) || "").split("/")[1] || "";
    var slug = segment.toLowerCase().replace(/_/g, "-");
    if (!slug) return null;
    for (var index = 0; index < prefixed.length; index++) {
      if (String(prefixed[index]).toLowerCase().replace(/_/g, "-") === slug) return String(prefixed[index]);
    }
    return null;
  }
  function storedLanguage() {
    if (i18n.persist === false) return null;
    try {
      var language = window.localStorage.getItem(i18n.storageKey || "language");
      if (language && (!i18n.languages || i18n.languages.indexOf(language) >= 0)) return language;
    } catch { /* Storage can be blocked. */ }
    return null;
  }
  if (i18n.langTarget === undefined) {
    var language = addressLanguage() || storedLanguage();
    if (language && /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(language)) root.lang = language;
  }

  window.DS_ONE_THEME = {
    mode: function () { return shownMode; },
    theme: function () { return shown; },
    set: set,
    apply: function () { apply(); },
  };
  apply();

  var system = query("(prefers-color-scheme: dark)");
  if (system && system.addEventListener) system.addEventListener("change", function () { apply(); });
  else if (system && system.addListener) system.addListener(function () { apply(); });
  window.addEventListener("storage", function (event) { if (event.key === null || event.key === key()) apply(); });
  window.addEventListener("pageshow", function () { apply(); });
})();

/**
 * The shape, on before the first paint as well: square, rounded or circular,
 * the corners every component draws (component-appearance.css keys on
 * `data-ds-shape` on the root). Rounded draws squircles where the browser
 * can. With nothing stored it is `shapeDefault` from
 * `window.DS_ONE_PREFERENCES`, and without that the root carries no shape and
 * the components keep their own corners. It is stored under `shapeStorageKey`
 * (`"ds-one:shape"`), applied again when another tab stores one, and changed
 * with `window.DS_ONE_SHAPE.set(shape)`, which dispatches `shape-changed` on
 * window with `{ shape }`.
 */
(function () {
  if (typeof window === "undefined" || typeof document === "undefined" || window.DS_ONE_SHAPE) return;
  var root = document.documentElement;
  var SHAPES = ["square", "rounded", "circular"];
  var session = null;
  function options() { return window.DS_ONE_PREFERENCES || {}; }
  function key() { return options().shapeStorageKey || "ds-one:shape"; }
  function stored() {
    if (session) return session;
    try {
      var saved = window.localStorage.getItem(key());
      if (SHAPES.indexOf(saved) >= 0) return saved;
    } catch { /* Storage can be blocked. */ }
    return SHAPES.indexOf(options().shapeDefault) >= 0 ? options().shapeDefault : null;
  }
  function apply() {
    var shape = stored();
    if (shape) root.setAttribute("data-ds-shape", shape);
    else root.removeAttribute("data-ds-shape");
    return shape;
  }
  function set(shape) {
    if (SHAPES.indexOf(shape) < 0) return;
    try { window.localStorage.setItem(key(), shape); session = null; } catch { session = shape; }
    apply();
    window.dispatchEvent(new CustomEvent("shape-changed", { detail: { shape: shape } }));
  }
  window.DS_ONE_SHAPE = { shape: stored, set: set, apply: apply };
  apply();
  window.addEventListener("storage", function (event) { if (event.key === null || event.key === key()) apply(); });
})();
