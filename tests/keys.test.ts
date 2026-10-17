// @vitest-environment happy-dom
import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { createElement as h } from "react";
import { renderToString } from "react-dom/server";
import {
  ariaKeyShortcuts, isApplePlatform, isModKey, isTyping, keyWord, matchesShortcut, modKey, onShortcut,
  parseShortcut, setKeyWords, shortcutLabel,
} from "../DS1/0-face/keys";
import { SHARED_WORDS } from "../DS1/0-face/shared-words";
import { Kbd } from "../DS1/react/kbd";
vi.stubGlobal("fetch", vi.fn(async () => new Response("{}")));
await import("../DS1/2-core/ds-kbd");

const TRANSLATOR = Symbol.for("design-system-1.translate");
const apple = { platform: "apple" } as const;
const other = { platform: "other" } as const;
const key = (init: KeyboardEventInit) => new KeyboardEvent("keydown", { bubbles: true, cancelable: true, composed: true, ...init });

afterEach(() => {
  setKeyWords(null);
  delete (globalThis as unknown as Record<symbol, unknown>)[TRANSLATOR];
  vi.unstubAllGlobals();
  vi.stubGlobal("fetch", vi.fn(async () => new Response("{}")));
  document.body.replaceChildren();
});

describe("the platform", () => {
  test("⌘ is the command key on a Mac, iPhone or iPad, Ctrl elsewhere", () => {
    for (const [platform, expected] of [["MacIntel", true], ["iPhone", true], ["iPad", true], ["Win32", false], ["Linux x86_64", false]] as const) {
      vi.stubGlobal("navigator", { platform });
      expect(isApplePlatform(), platform).toBe(expected);
      expect(modKey(), platform).toBe(expected ? "⌘" : "Ctrl");
    }
    vi.stubGlobal("navigator", { platform: "", userAgentData: { platform: "macOS" } });
    expect(isApplePlatform()).toBe(true);
    expect(modKey(other)).toBe("Ctrl");
    expect(modKey(apple)).toBe("⌘");
  });

  test("isModKey reads ⌘ on Apple platforms and Ctrl elsewhere, so Ctrl-click stays the Mac's right click", () => {
    expect(isModKey({ metaKey: true, ctrlKey: false }, apple)).toBe(true);
    expect(isModKey({ metaKey: false, ctrlKey: true }, apple)).toBe(false);
    expect(isModKey({ metaKey: false, ctrlKey: true }, other)).toBe(true);
    expect(isModKey({ metaKey: true, ctrlKey: false }, other)).toBe(false);
  });
});

describe("labels", () => {
  test("Apple platforms write symbols in Apple's order with no space; others write words joined with +", () => {
    expect(shortcutLabel("mod+shift+d", apple)).toBe("⇧⌘D");
    expect(shortcutLabel("mod+shift+d", other)).toBe("Ctrl+Shift+D");
    expect(shortcutLabel("ctrl+alt+shift+mod+k", apple)).toBe("⌃⌥⇧⌘K");
    expect(shortcutLabel("shift+alt+mod+k", other)).toBe("Ctrl+Alt+Shift+K");
    expect(shortcutLabel("mod+enter", apple)).toBe("⌘↩");
    expect(shortcutLabel("mod+enter", other)).toBe("Ctrl+Enter");
    expect(shortcutLabel("escape", apple)).toBe("⎋");
    expect(shortcutLabel("esc", other)).toBe("Esc");
    expect(shortcutLabel("mod+backspace", apple)).toBe("⌘⌫");
    expect(shortcutLabel("delete", other)).toBe("Del");
    expect(shortcutLabel("space", apple)).toBe("Space");
    expect(shortcutLabel("shift+tab", other)).toBe("Shift+Tab");
    expect(shortcutLabel("f2", other)).toBe("F2");
    expect(shortcutLabel("?", other)).toBe("?");
    expect(shortcutLabel("mod++", other)).toBe("Ctrl++");
    expect(shortcutLabel("mod+plus", apple)).toBe("⌘+");
  });

  test("arrows are written as arrows on every platform, the characters Inter Arrows draws", () => {
    const arrows = ["alt+arrowup", "alt+arrowdown", "mod+left", "mod+right"].map(text => shortcutLabel(text, other));
    expect(arrows).toEqual(["Alt+↑", "Alt+↓", "Ctrl+←", "Ctrl+→"]);
    expect(shortcutLabel("alt+arrowup", apple)).toBe("⌥↑");
    // Inter Arrows covers U+2190–21FF, so every arrow and ⇧ ↩ ⇥ are Inter's.
    for (const text of [...arrows, "⇧", "↩", "⇥"].join("").replace(/[^←-⇿]/g, "")) expect(text.codePointAt(0)!).toBeGreaterThanOrEqual(0x2190);
  });

  test("the words are the shared words in the page's language, the id's English without them, or a product's own", () => {
    (globalThis as unknown as Record<symbol, unknown>)[TRANSLATOR] = (id: string) => SHARED_WORDS.de?.[id] ?? id;
    expect(shortcutLabel("mod+shift+d", other)).toBe("Strg+Umschalt+D");
    expect(shortcutLabel("delete", other)).toBe("Entf");
    expect(modKey(other)).toBe("Strg");
    // The language module without the shared words answers with the id: English is written.
    (globalThis as unknown as Record<symbol, unknown>)[TRANSLATOR] = (id: string) => id;
    expect(shortcutLabel("mod+shift+d", other)).toBe("Ctrl+Shift+D");
    setKeyWords({ "key.ctrl": "Control" });
    expect(shortcutLabel("mod+d", other)).toBe("Control+D");
    setKeyWords(word => word.slice(4).toUpperCase());
    expect(keyWord("key.shift")).toBe("SHIFT");
  });

  test("every shared language names every key", () => {
    const ids = Object.keys(SHARED_WORDS.en ?? {}).filter(id => id.startsWith("key."));
    expect(ids).toHaveLength(13);
    for (const [language, table] of Object.entries(SHARED_WORDS)) for (const id of ids) expect(table?.[id], `${language}: ${id}`).toBeTruthy();
  });

  test("aria-keyshortcuts names the keys as KeyboardEvent does", () => {
    expect(ariaKeyShortcuts("mod+shift+d", apple)).toBe("Shift+Meta+D");
    expect(ariaKeyShortcuts("mod+shift+d", other)).toBe("Control+Shift+D");
    expect(ariaKeyShortcuts("alt+arrowup", other)).toBe("Alt+ArrowUp");
    expect(ariaKeyShortcuts("space", other)).toBe("Space");
  });

  test("a shortcut is parsed once, and a mistake says so", () => {
    expect(parseShortcut("Mod+Shift+D", apple)).toEqual({ ctrl: false, meta: true, alt: false, shift: true, key: "d" });
    expect(parseShortcut("cmd+opt+up", other)).toEqual({ ctrl: false, meta: true, alt: true, shift: false, key: "arrowup" });
    expect(() => parseShortcut("hyper+d")).toThrow(/Unknown modifier/);
  });
});

describe("matching a keydown", () => {
  test("mod is ⌘ on Apple platforms and Ctrl elsewhere, and other modifiers must not be held", () => {
    expect(matchesShortcut(key({ key: "d", metaKey: true }), "mod+d", apple)).toBe(true);
    expect(matchesShortcut(key({ key: "d", ctrlKey: true }), "mod+d", apple)).toBe(false);
    expect(matchesShortcut(key({ key: "d", ctrlKey: true }), "mod+d", other)).toBe(true);
    expect(matchesShortcut(key({ key: "d", ctrlKey: true, shiftKey: true }), "mod+d", other)).toBe(false);
    expect(matchesShortcut(key({ key: "D", ctrlKey: true, shiftKey: true }), "mod+shift+d", other)).toBe(true);
  });

  test("a letter matches by its physical key too: other layouts, and ⌥ changing the character", () => {
    expect(matchesShortcut(key({ key: "˚", code: "KeyK", altKey: true }), "alt+k", apple)).toBe(true);
    expect(matchesShortcut(key({ key: "в", code: "KeyD", ctrlKey: true }), "mod+d", other)).toBe(true);
    expect(matchesShortcut(key({ key: "!", code: "Digit1", ctrlKey: true, shiftKey: true }), "mod+shift+1", other)).toBe(true);
  });

  test("a symbol that needs Shift matches whether or not Shift was asked for", () => {
    expect(matchesShortcut(key({ key: "?", shiftKey: true }), "?", other)).toBe(true);
    expect(matchesShortcut(key({ key: "?", shiftKey: true }), "shift+?", other)).toBe(true);
    expect(matchesShortcut(key({ key: "Escape" }), "escape", other)).toBe(true);
    expect(matchesShortcut(key({ key: " ", code: "Space" }), "space", other)).toBe(true);
    expect(matchesShortcut(key({ key: "ArrowUp", altKey: true }), "alt+up", other)).toBe(true);
  });
});

describe("typing", () => {
  test("text fields, selects, contenteditables and textboxes are typing; a checkbox and a button are not", () => {
    document.body.innerHTML = `<input id="text"><input id="search" type="search"><input id="box" type="checkbox"><input id="read" readonly>
      <textarea id="area"></textarea><select id="pick"><option>One</option></select><div id="edit" contenteditable="true"><span id="inside">Words</span></div>
      <div id="off" contenteditable="false">Words</div><div id="textbox" role="textbox" tabindex="0"></div><button id="button">Go</button>`;
    const typing = (id: string) => { let result = false; const element = document.getElementById(id)!; element.addEventListener("keydown", event => { result = isTyping(event); }, { once: true }); element.dispatchEvent(key({ key: "d" })); return result; };
    expect(["text", "search", "area", "pick", "edit", "inside", "textbox"].map(typing)).toEqual([true, true, true, true, true, true, true]);
    expect(["box", "read", "off", "button"].map(typing)).toEqual([false, false, false, false]);
  });

  test("an input method composing is typing, wherever focus is", () => {
    expect(isTyping(key({ key: "a", isComposing: true }))).toBe(true);
    expect(isTyping(key({ key: "Process", keyCode: 229 }))).toBe(true);
    expect(isTyping(key({ key: "a" }))).toBe(false);
  });

  test("a field inside a component's shadow root is typing", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const input = document.createElement("input");
    host.attachShadow({ mode: "open" }).append(input);
    let result = false;
    document.addEventListener("keydown", event => { result = isTyping(event); }, { once: true });
    input.dispatchEvent(key({ key: "d" }));
    expect(result).toBe(true);
  });
});

describe("onShortcut", () => {
  test("runs on the shortcut, prevents the browser's action, leaves typing alone and unbinds", () => {
    document.body.innerHTML = `<input id="field"><div id="panel" tabindex="0"></div>`;
    const handler = vi.fn();
    const off = onShortcut(["mod+k", "?"], handler, { platform: "other" });
    const pressed = key({ key: "k", ctrlKey: true });
    document.getElementById("panel")!.dispatchEvent(pressed);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(pressed.defaultPrevented).toBe(true);
    document.getElementById("panel")!.dispatchEvent(key({ key: "?", shiftKey: true }));
    expect(handler).toHaveBeenCalledTimes(2);
    const typed = key({ key: "?", shiftKey: true });
    document.getElementById("field")!.dispatchEvent(typed);
    expect(handler).toHaveBeenCalledTimes(2);
    expect(typed.defaultPrevented).toBe(false);
    off();
    document.getElementById("panel")!.dispatchEvent(key({ key: "k", ctrlKey: true }));
    expect(handler).toHaveBeenCalledTimes(2);
  });

  test("typing: true runs in fields too; a handled key, a repeat and an aborted signal are left alone", () => {
    document.body.innerHTML = `<input id="field">`;
    const field = document.getElementById("field")!;
    const save = vi.fn();
    const controller = new AbortController();
    onShortcut("mod+s", save, { platform: "apple", typing: true, repeat: false, signal: controller.signal });
    field.dispatchEvent(key({ key: "s", metaKey: true }));
    expect(save).toHaveBeenCalledTimes(1);
    field.dispatchEvent(key({ key: "s", metaKey: true, repeat: true }));
    expect(save).toHaveBeenCalledTimes(1);
    const handled = key({ key: "s", metaKey: true });
    field.addEventListener("keydown", event => event.preventDefault(), { once: true, capture: true });
    field.dispatchEvent(handled);
    expect(save).toHaveBeenCalledTimes(1);
    controller.abort();
    field.dispatchEvent(key({ key: "s", metaKey: true }));
    expect(save).toHaveBeenCalledTimes(1);
  });

  test("a target listens to its own keys; preventDefault: false lets the browser act", () => {
    document.body.innerHTML = `<div id="panel" tabindex="0"></div><div id="elsewhere" tabindex="0"></div>`;
    const panel = document.getElementById("panel")!;
    const handler = vi.fn();
    onShortcut("escape", handler, { target: panel, preventDefault: false });
    document.getElementById("elsewhere")!.dispatchEvent(key({ key: "Escape" }));
    expect(handler).not.toHaveBeenCalled();
    const escape = key({ key: "Escape" });
    panel.dispatchEvent(escape);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(escape.defaultPrevented).toBe(false);
  });
});

describe("ds-kbd", () => {
  test("writes its shortcut for the platform in a native kbd, or shows its words, and hides with hidden", async () => {
    document.body.innerHTML = `<ds-kbd id="mac" shortcut="mod+shift+d" platform="apple"></ds-kbd><ds-kbd id="pc" shortcut="mod+shift+d" platform="other" plain></ds-kbd><ds-kbd id="own">Fn</ds-kbd>`;
    const [mac, pc, own] = ["mac", "pc", "own"].map(id => document.getElementById(id) as HTMLElement & { updateComplete: Promise<unknown>; label: string });
    await Promise.all([mac!.updateComplete, pc!.updateComplete, own!.updateComplete]);
    const kbd = (element: HTMLElement) => element.shadowRoot!.querySelector("kbd")!;
    expect(kbd(mac!).textContent).toBe("⇧⌘D");
    expect(kbd(mac!).className).toBe("ds-kbd");
    expect(kbd(pc!).textContent).toBe("Ctrl+Shift+D");
    expect(kbd(pc!).className).toBe("ds-kbd ds-kbd--plain");
    expect(pc!.hasAttribute("plain")).toBe(true);
    expect(kbd(own!).querySelector("slot")).not.toBeNull();
    expect(own!.label).toBe("");
  });

  test("follows the page's language", async () => {
    document.body.innerHTML = `<ds-kbd shortcut="mod+shift+d" platform="other"></ds-kbd>`;
    const element = document.querySelector("ds-kbd")!;
    await element.updateComplete;
    (globalThis as unknown as Record<symbol, unknown>)[TRANSLATOR] = (id: string) => SHARED_WORDS.fr?.[id] ?? id;
    window.dispatchEvent(new Event("language-changed"));
    await element.updateComplete;
    expect(element.shadowRoot!.querySelector("kbd")!.textContent).toBe("Ctrl+Maj+D");
  });

  test("an unknown shortcut shows as written rather than failing", async () => {
    document.body.innerHTML = `<ds-kbd shortcut="hyper+d"></ds-kbd>`;
    const element = document.querySelector("ds-kbd")!;
    await element.updateComplete;
    expect(element.shadowRoot!.querySelector("kbd")!.textContent).toBe("hyper+d");
  });

  test("React renders ds-kbd with its shortcut and words in the light DOM", () => {
    const markup = renderToString(h("p", null, h(Kbd, { shortcut: "mod+k", plain: true, platform: "apple" }), h(Kbd, null, "Fn")));
    expect(markup).toContain('<ds-kbd shortcut="mod+k" plain="" platform="apple"></ds-kbd>');
    expect(markup).toContain("<ds-kbd>Fn</ds-kbd>");
  });
});
