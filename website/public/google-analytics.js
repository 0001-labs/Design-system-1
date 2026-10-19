(() => {
  "use strict";
  const settings = {
  "name": "Design System 1",
  "origin": "https://designsystem1.com",
  "hosts": [
    "designsystem1.com",
    "www.designsystem1.com"
  ],
  "id": "G-VD2N91L0ZC",
  "pages": [
    "home",
    "icons",
    "start-here",
    "getting-started",
    "0-face",
    "1-root",
    "2-core",
    "3-unit",
    "4-page",
    "advanced",
    "built-ins",
    "demo",
    "reference",
    "guides"
  ]
};
  if (!settings.hosts.includes(location.hostname)) return;
  const marker = "__websiteAnalytics_" + settings.id;
  if (window[marker]) return;
  window[marker] = true;
  const disableKey = "ga-disable-" + settings.id;
  const preferenceKey = "website-analytics-out";
  let started = false;
  let previousPage = "";

  function analyticsConsent() {
    const key = "website-analytics-consent-v1";
    const choice = new URLSearchParams(location.search).get("ph");
    if (choice === "in") localStorage.setItem(key, "granted");
    const consent = localStorage.getItem(key);
    if (consent) return consent === "granted";
    if (!document.body || document.getElementById("website-analytics-consent")) return false;
    const panel = document.createElement("section");
    panel.id = "website-analytics-consent";
    panel.setAttribute("aria-label", "Analytics preference");
    panel.style.cssText = "position:fixed;bottom:16px;left:16px;right:16px;max-width:420px;margin-left:auto;padding:16px;border:1px solid #d8d8d8;border-radius:12px;background:#fff;color:#222;box-shadow:0 4px 24px #0002;z-index:2147483000;font:14px/1.5 system-ui,sans-serif;text-align:left";
    const text = document.createElement("p");
    text.textContent = "Allow Google Analytics cookies to help us understand how this site is used? Optional, with no advertising tracking.";
    text.style.cssText = "margin:0 0 12px";
    panel.append(text);
    for (const [label, value] of [["No thanks", "denied"], ["Allow analytics", "granted"]]) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.style.cssText = "font:inherit;padding:8px 12px;margin:0 8px 0 0;border:1px solid #aaa;border-radius:6px;background:#fff;color:#222;cursor:pointer";
      button.addEventListener("click", () => {
        try { localStorage.setItem(key, value); } catch { return; }
        panel.remove();
        track();
      });
      panel.append(button);
    }
    document.body.append(panel);
    return false;
  }

  function allowed() {
    if (navigator.doNotTrack === "1" || navigator.globalPrivacyControl === true) return false;
    try {
      const choice = new URLSearchParams(location.search).get("ph");
      if (choice === "out") localStorage.setItem(preferenceKey, "1");
      if (choice === "in") localStorage.removeItem(preferenceKey);
      if (localStorage.getItem(preferenceKey) === "1") return false;
      if (choice !== "in" && settings.posthogKey && localStorage.getItem("__ph_opt_in_out_" + settings.posthogKey) === "0") return false;
      if (settings.consentKey) {
        const record = JSON.parse(localStorage.getItem(settings.consentKey) || "null");
        return record?.version === 1 && typeof record.savedAt === "string" && record.preferences?.analytics === true;
      }
      return analyticsConsent();
    } catch {
      return false;
    }
  }

  function publicPage() {
    const segment = location.pathname.split("/").filter(Boolean)[0] || "home";
    return settings.pages.includes(segment) ? segment : null;
  }

  function track() {
    const page = publicPage();
    const enabled = page !== null && allowed();
    if (started && window[disableKey] === enabled) {
      window.dataLayer.push((function () { return arguments; })("consent", "update", {
        analytics_storage: enabled ? "granted" : "denied",
      }));
    }
    window[disableKey] = !enabled;
    if (!enabled) {
      previousPage = "";
      return;
    }
    if (location.pathname === previousPage) return;
    window.dataLayer ||= [];
    function send() { window.dataLayer.push(arguments); }
    if (!started) {
      started = true;
      send("consent", "default", {
        analytics_storage: "granted", ad_storage: "denied",
        ad_user_data: "denied", ad_personalization: "denied",
      });
      send("set", "ads_data_redaction", true);
      send("js", new Date());
    }
    let referrer = "";
    try {
      const url = new URL(document.referrer);
      if (["https:", "http:"].includes(url.protocol)) referrer = url.origin + "/";
    } catch { /* No valid referrer. */ }
    const fields = {
      page_location: settings.origin + (page === "home" ? "/" : "/" + page),
      page_title: settings.name + " · " + page,
      page_referrer: referrer,
    };
    send("set", fields);
    send("config", settings.id, {
      ...fields, send_page_view: false,
      allow_google_signals: false, allow_ad_personalization_signals: false,
    });
    send("event", "page_view", { ...fields, send_to: settings.id });
    previousPage = location.pathname;
    if (!document.getElementById(marker)) {
      const script = document.createElement("script");
      script.id = marker;
      script.async = true;
      script.src = "https://www.googletagmanager.com/gtag/js?id=" + settings.id;
      document.head.append(script);
    }
  }

  window.addEventListener("storage", track);
  window.addEventListener("popstate", track);
  document.addEventListener("astro:page-load", track);
  if (settings.consentEvent) window.addEventListener(settings.consentEvent, track);
  for (const method of ["pushState", "replaceState"]) {
    const original = history[method];
    history[method] = function () {
      const result = original.apply(this, arguments);
      queueMicrotask(track);
      return result;
    };
  }
  if ("requestIdleCallback" in window) window.requestIdleCallback(track, { timeout: 2500 });
  else setTimeout(track, 0);
})();
