---
title: Keys
description: Keyboard shortcuts on every platform, the command key, a guard while typing and the labels shortcuts are written with.
---

`0-face/keys.ts` holds what every product needs for keyboard shortcuts: the
platform's command key, a guard that leaves typing alone, the label a shortcut
is written with, and one call that binds it. Plain TypeScript with no
framework and no language runtime. A page without the components copies it
with Sync 1's `root` export, `"modules": ["keys"]`; the components export
brings it with [`ds-kbd`](/2-core/kbd/).

## A shortcut, written once

A shortcut is written in lower case with its parts joined by `+`:
`"mod+shift+d"`, `"mod+enter"`, `"alt+arrowup"`, `"escape"`, `"?"`.
`mod` is ⌘ on a Mac, iPhone or iPad and Ctrl everywhere else; `ctrl`, `meta`,
`alt` and `shift` name a key as it is. The key is a letter, a digit, a symbol,
`enter`, `escape`, `tab`, `space`, `backspace`, `delete`, `home`, `end`,
`pageup`, `pagedown`, an arrow (`arrowup` … or `up` …), `f1` … `f24`, or
`plus` for `+`.

```ts
import { onShortcut, shortcutLabel, ariaKeyShortcuts } from "./ds1/0-face/keys";

const off = onShortcut("mod+d", () => duplicate());
button.setAttribute("aria-keyshortcuts", ariaKeyShortcuts("mod+d"));
hint.textContent = shortcutLabel("mod+d"); // ⌘D, or Ctrl+D
```

## API

| Function | What it does |
| --- | --- |
| `modKey()` | The command key's label: `⌘` on Apple platforms, `Ctrl` elsewhere. |
| `isModKey(event)` | True when the command key is held: ⌘ on Apple platforms, Ctrl elsewhere, so Ctrl-click stays a Mac's right click. |
| `isApplePlatform()` | True on a Mac, iPhone or iPad. |
| `isTyping(event)` | True while focus is in a text field, a textarea, a select, a contenteditable or an element with a `textbox`, `searchbox` or `combobox` role, inside open shadow roots too, or while an input method composes. A checkbox or a button is not typing. |
| `shortcutLabel(shortcut)` | The shortcut as the platform writes it: `⇧⌘D` on Apple platforms (⌃ ⌥ ⇧ ⌘ in Apple's order, then the key, no space), `Ctrl+Shift+D` elsewhere (Ctrl, Alt, Shift, then the key). Enter is `↩`, Escape `⎋`, Tab `⇥`, Backspace `⌫`, Delete `⌦` on Apple platforms; arrows are `↑ ↓ ← →` on both. |
| `ariaKeyShortcuts(shortcut)` | The value for `aria-keyshortcuts` on the control the shortcut presses: `Shift+Meta+D`, `Control+Shift+D`. |
| `matchesShortcut(event, shortcut)` | True when a keydown is the shortcut. Other modifiers must not be held; a symbol that needs Shift (`?`) matches either way. A letter or digit matches by its physical key too, so it works on other layouts and with ⌥ changing the character. |
| `onShortcut(shortcut, handler, options)` | Runs `handler` for a shortcut or a list of them and returns the function that unbinds it. A keydown already handled (`defaultPrevented`) is left alone. |
| `parseShortcut(shortcut)` | The shortcut taken apart: `{ ctrl, meta, alt, shift, key }` on this platform. A modifier it does not know throws. |
| `setKeyWords(words)` | Key names of a product's own: a table or a function, or `null` for the shared words. |

Every function takes `{ platform: "apple" | "other" }` last, to write a
shortcut for a platform other than the reader's (a help page showing both).

`onShortcut`'s options: `target` (the document by default; a panel listens to
its own keys), `typing: true` to run in fields too (a save shortcut),
`preventDefault: false` to let the browser act as well, `repeat: false` to
skip a held key's repeats, `capture` and an abort `signal`.

## Words

The keys written as words are the shared words `key.ctrl`, `key.shift`,
`key.alt`, `key.enter`, `key.escape`, `key.tab`, `key.space`, `key.backspace`,
`key.delete`, `key.home`, `key.end`, `key.pageup` and `key.pagedown`, in every
language: German writes `Strg+Umschalt+D`, French `Ctrl+Maj+D`. Where the page
loads the [language module](/1-root/languages/) with
`configureI18n({ sharedWords: true })`, they follow the page's language;
otherwise they read English, and nothing more is loaded. Apple's symbols are
the same in every language.

## Arrows

Arrows are written as arrows, and every Design system 1 typeface sets them in
Inter through the Inter Arrows face that leads it, code included. Never draw a
shortcut's arrow in another face, and never write "Up" for ↑.
