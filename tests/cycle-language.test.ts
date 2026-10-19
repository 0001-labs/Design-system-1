// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from "vite-plus/test";
import { Cycle } from "../DS1/2-core/ds-cycle";
import { configureI18n, setLanguage, currentLanguage } from "../DS1/0-face/i18n";
import { currentTheme, setTheme } from "../DS1/0-face/theme";
import { savePreferences } from "../DS1/0-face/preferences";

afterEach(() => {
  document.body.replaceChildren();
  localStorage.clear();
  delete window.DS_ONE_PREFERENCES;
  configureI18n({ languages: ["en", "ja"], storageKey: "language" });
});
async function picker(chip = false) {
  const element = new Cycle(); element.type = "language"; element.chip = chip;
  document.body.append(element); await element.updateComplete;
  await element.shadowRoot!.querySelector("ds-button")?.updateComplete;
  return element;
}

test("language chips cycle once, keep native names and synchronize other pickers", async () => {
  configureI18n({ languages: ["en", "ja"], storageKey: "choice:language" });
  window.DS_ONE_PREFERENCES = { storageKey: "choice:preferences" };
  setLanguage("en");
  const first = await picker(), other = await picker(false);
  const changed = vi.fn(); window.addEventListener("language-changed", changed);
  first.shadowRoot!.querySelector("button")!.click();
  expect(changed).toHaveBeenCalledTimes(1);
  window.removeEventListener("language-changed", changed);
  await first.updateComplete; await other.updateComplete;
  expect(currentLanguage.value).toBe("ja");
  for (const element of [first, other]) {
    const button = element.shadowRoot!.querySelector("button")!;
    expect(button.textContent?.trim()).toBe("日本語");
    expect(button.lang).toBe("ja");
    expect(button.type).toBe("button");
    expect(button.hasAttribute("title")).toBe(false);
  }
  expect(localStorage.getItem("choice:language")).toBe("ja");
  expect(JSON.parse(localStorage.getItem("choice:preferences")!)).toMatchObject({ language: "ja" });
  expect(localStorage.getItem("ds-one:preferences")).toBeNull();
});

test("disabled pickers and disabled fieldsets cannot change language", async () => {
  configureI18n({ languages: ["en", "ja"] }); setLanguage("en");
  const element = await picker();
  for (const state of ["disabled", "fieldset"] as const) {
    element.disabled = state === "disabled";
    element.formDisabledCallback(state === "fieldset");
    await element.updateComplete;
    const button = element.shadowRoot!.querySelector("button")!;
    expect(button.disabled).toBe(true); button.click();
    expect(currentLanguage.value).toBe("en");
  }
  element.formDisabledCallback(false); await element.updateComplete;
  element.shadowRoot!.querySelector("button")!.click(); expect(currentLanguage.value).toBe("ja");
  element.focus(); expect(element.shadowRoot!.activeElement).toBe(element.shadowRoot!.querySelector("button"));
});

test("a single choice does not save or announce a redundant change", async () => {
  configureI18n({ languages: ["en"] }); setLanguage("en");
  const element = await picker(), changed = vi.fn();
  window.addEventListener("language-changed", changed);
  element.shadowRoot!.querySelector("button")!.click();
  expect(changed).not.toHaveBeenCalled();
  window.removeEventListener("language-changed", changed);
});

test("product preference namespaces merge existing data without changing the default store", () => {
  window.DS_ONE_PREFERENCES = { storageKey: "product:preferences", themeStorageKey: "product:theme" };
  localStorage.setItem("product:preferences", JSON.stringify({ density: "compact" }));
  savePreferences({ language: "ja" });
  expect(JSON.parse(localStorage.getItem("product:preferences")!)).toEqual({ density: "compact", language: "ja" });
  setTheme(currentTheme.get() === "dark" ? "light" : "dark");
  expect(localStorage.getItem("product:theme")).toBe(currentTheme.get());
  expect(localStorage.getItem("ds-one:theme")).toBeNull();
  delete window.DS_ONE_PREFERENCES; savePreferences({ language: "en" });
  expect(JSON.parse(localStorage.getItem("ds-one:preferences")!)).toEqual({ language: "en" });
});

test("existing cycle variants map to the shared button and disabled cycles do not act", async () => {
  const element = new Cycle(); element.type = "theme"; element.variant = "primary";
  document.body.append(element); await element.updateComplete;
  const button = element.shadowRoot!.querySelector("ds-button")!;
  expect(button.primary).toBe(true); expect(button.hasAttribute("variant")).toBe(false);
  element.formDisabledCallback(true); await element.updateComplete;
  const before = currentTheme.get(); button.click(); expect(currentTheme.get()).toBe(before);
});

test("a cycle through its own values starts on value, steps on click and emits change", async () => {
  const cycle = new Cycle();
  cycle.values = ["Line", "Area", "Bars"];
  cycle.value = "Area";
  document.body.append(cycle);
  await cycle.updateComplete;
  const label = () => cycle.shadowRoot!.querySelector("ds-text")!.getAttribute("text");
  expect(label()).toBe("Area");
  const changes: string[] = [];
  cycle.addEventListener("change", event => changes.push((event as CustomEvent).detail.value));
  const click = async () => { cycle.shadowRoot!.querySelector("ds-button")!.dispatchEvent(new Event("click")); await cycle.updateComplete; };
  await click(); await click();
  expect(changes).toEqual(["Bars", "Line"]);
  expect(cycle.value).toBe("Line");
  cycle.value = "Bars"; await cycle.updateComplete;
  expect(label()).toBe("Bars");
  expect(changes).toHaveLength(2);
  expect(localStorage.length).toBe(0);
});

test("a labelled cycle names its control while the face shows the value alone", async () => {
  const { loadTranslations } = await import("../DS1/0-face/i18n");
  loadTranslations("da", { Size: "Størrelse" });
  setLanguage("en");
  const cycle = new Cycle();
  cycle.label = "Size";
  cycle.values = ["20", "40"];
  cycle.value = "20";
  document.body.append(cycle);
  await cycle.updateComplete;
  const face = cycle.shadowRoot!.querySelector("ds-button")!;
  await face.updateComplete;
  const button = () => face.shadowRoot!.querySelector("button")!;
  expect(cycle.getAttribute("label")).toBe("Size");
  expect(button().getAttribute("aria-label")).toBe("Size: 20");
  expect(cycle.shadowRoot!.querySelector("ds-text")!.getAttribute("text")).toBe("20");
  face.dispatchEvent(new Event("click"));
  await cycle.updateComplete; await face.updateComplete;
  expect(button().getAttribute("aria-label")).toBe("Size: 40");
  setLanguage("da");
  await cycle.updateComplete; await face.updateComplete;
  expect(button().getAttribute("aria-label")).toBe("Størrelse: 40");
  setLanguage("en");
});

test("a cycle without a label leaves its control named by its face", async () => {
  const cycle = new Cycle();
  cycle.values = ["Line", "Area"];
  document.body.append(cycle);
  await cycle.updateComplete;
  const face = cycle.shadowRoot!.querySelector("ds-button")!;
  await face.updateComplete;
  expect(face.shadowRoot!.querySelector("button")!.hasAttribute("aria-label")).toBe(false);
});

test("a labelled theme cycle reads the translated value after its name", async () => {
  const cycle = new Cycle();
  cycle.type = "theme";
  cycle.label = "Theme";
  document.body.append(cycle);
  await cycle.updateComplete;
  const face = cycle.shadowRoot!.querySelector("ds-button")!;
  await face.updateComplete;
  expect(face.shadowRoot!.querySelector("button")!.getAttribute("aria-label")).toMatch(/^Theme: (Light|Dark|System)$/);
});

 test("default and legacy language pickers all use a label-sized normal button", async () => {
  for (const attributes of [[], ["compact"], ["chip"]]) {
    const element = new Cycle(); element.type = "language";
    attributes.forEach(name => element.setAttribute(name, ""));
    document.body.append(element); await element.updateComplete;
    const face = element.shadowRoot!.querySelector("ds-button");
    expect(face).not.toBeNull();
    expect(face!.hasAttribute("fit")).toBe(true);
    expect(face!.querySelector("button")?.getAttribute("type")).toBe("button");
  }
});
