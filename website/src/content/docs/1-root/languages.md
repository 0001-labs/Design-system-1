---
title: Languages
description: One language list for every product, the words, the translations file format, language-aware addresses, the Convex validator and the picker
---

Design system 1 owns languages for every product built on it: the list of languages, choosing and remembering one, looking words up, the shared interface words, addresses that carry a language, the server's check and the picker. Each product keeps its own words in its own translations file, in the format below.

## The list and a product's subset

There is one list, `LANGUAGES` (`DS1/0-face/languages.ts`):

| Code | English name | Own name |
| --- | --- | --- |
| `da` | Danish | Dansk |
| `de` | German | Deutsch |
| `en` | English | English |
| `es` | Spanish | Español |
| `fi` | Finnish | Suomi |
| `fr` | French | Français |
| `is` | Icelandic | Íslenska |
| `it` | Italian | Italiano |
| `ja` | Japanese | 日本語 |
| `ko` | Korean | 한국어 |
| `nb` | Norwegian Bokmål | Norsk bokmål |
| `nn` | Norwegian Nynorsk | Norsk nynorsk |
| `no` | Norwegian | Norsk |
| `pt` | Portuguese | Português |
| `pt-BR` | Brazilian Portuguese | Português (Brasil) |
| `sv` | Swedish | Svenska |
| `zh` | Chinese | 中文 |

`LANGUAGE_METADATA[code]` holds each one's `label`, `nativeLabel` and `aliases`. The file has no browser code, so a product's backend imports it too.

A product turns on the languages it translates, once, at startup:

```javascript
import { configureI18n } from "@0001-labs/design-system-1";

configureI18n({
  languages: ["en", "da", "ja"],
  sharedWords: true,
});
```

`pickLanguages(codes)` gives any set of codes back as members of the list, in the list's order.

### Reading a language

`normalizeLanguage(input, fallback = "en", languages = LANGUAGES)` reads whatever a browser, an address or a saved setting calls a language: `da-DK`, `nb_NO`, `pt-br`, or a browser's list (`"nl-NL,sv;q=0.9"`, the first language it knows wins). Given the product's languages, a relative stands in for a language the product lacks: with `["en", "nb", "pt-BR"]`, `no` and `nn` read as `nb`, and `pt` as `pt-BR`. Pass `null` as the fallback to tell when nothing matched. `isLanguage(value)` tells whether a value is a code exactly as the list writes it.

## Choosing and remembering a language

```javascript
import { setLanguage, currentLanguage } from "@0001-labs/design-system-1";

setLanguage("da");
currentLanguage.value; // "da"
```

`setLanguage` remembers the choice in `localStorage` (under `language`, or the `storageKey` the product configures), sets the document's `lang`, fetches the language's words when they come a file at a time, and announces `language-changed` on `window` with `{ language }` as its detail.

`setLanguage(language, { remember: false })` changes the language for this page alone, without storing it: a preview, or a language the page was asked for.

### Where `lang` goes

`lang` follows the language on the document's root by default. A page that embeds a surface in another language than its own, such as a prototype in Japanese on a page written in English, keeps it on that surface:

```javascript
configureI18n({ langTarget: document.querySelector(".prototype") });
```

`langTarget: false` writes `lang` nowhere. With either, the [theme head script](/1-root/theming/#before-the-first-paint) leaves the root's `lang` alone too.

On a first visit the language is the browser's, as one the product speaks: the first of the browser's languages that fits, a relative standing in. A stored choice is read the same way, so a saved `pt` becomes `pt-BR` in a product that speaks only Brazilian Portuguese.

## Translating

```javascript
import { translate } from "@0001-labs/design-system-1";

translate("Save");                                   // "Gem" in Danish
translate("Hello {name}", { name: "Ada" });          // placeholders filled
translate("auth.sentTo", { email: "ada@0001.dev" }); // {{email}} too
```

`translate(key, params?)`, `getText(key, params?)` and `textInLanguage(key, language, params?)` fill placeholders written `{name}` and `{{name}}` alike. A placeholder without a value stays as written. `hasTranslation(key, language?)` tells whether any table has the key.

In markup, `ds-text` shows a key's text and follows the language:

```html
<ds-text text="Save"></ds-text>
```

### The fallback order

A word is looked up in:

1. the language itself (`ja-JP`);
2. its primary subtag (`ja`);
3. its relatives: `nb`, `no` and `nn` for each other, `pt` and `pt-BR` for each other;
4. English (`en`);
5. the key itself.

In each language, the product's words come before the shared words, so a product's own text always wins, and a shared word in the reader's language still beats the product's English.

## The translations file format

One format for every product's words:

```json
{
  "en": { "settings.language": "Language" },
  "da": { "settings.language": "Sprog", "Send": "Send" }
}
```

- The top level is keyed by language code from the list.
- A key is any string: the English sentence (`"Send": "Send"`) or a dotted id (`"settings.language"`). Both are the same format, and no product's words need rewriting.
- English is the fallback table. When a key is missing from `en`, the key itself is the English text: a sentence key needs no English entry; an id key needs one.
- Placeholders are `{name}` or `{{name}}`.
- Sentence case everywhere, never all caps.

By default the module loads the whole table from `./translations.json` (or the file `translationsFile`, `window.DS_ONE_TRANSLATIONS_FILE` or a `data-ds-one-translations` attribute names).

`validateTranslations(file)` checks a file: errors for what cannot load (not an object of language tables, a text that is not a string), warnings for a language outside the list, an id key with no English text, and a translation whose placeholders differ from its English text's.

### Per-language files

A page can load only its own language:

```javascript
configureI18n({
  languages: ["en", "da", "ja"],
  languageFile: "/translations/{language}.json",
});
```

Each file holds one language's table, wrapped (`{ "da": { … } }`) or bare (`{ … }`). When a language's file is missing, the whole table is the fallback. Switching language fetches the new language's file once.

### Words in a TypeScript module

A product can ship its words as a module of the same shape and hand them over at startup. Tables may be `Partial`:

```typescript
import { loadTranslations } from "@0001-labs/design-system-1";
import { translations } from "./i18n/translations";

loadTranslations(translations); // { en: {…}, da: {…} }
loadTranslations("da", { "settings.language": "Sprog" });
```

## The shared words

Design system 1 carries the interface words every product shares, in `DS1/0-face/translations/<language>.json`, keyed by the English sentence:

- buttons: Save, Cancel, Delete, Close, Back, Next, Done, Continue, Search, Edit, Yes, No;
- actions: Try again, Undo, Redo, Copy, Copy link, Remove, Rename, Duplicate, Download, Refresh, Open, Send, Clear;
- states and names: Saved, Saving…, Untitled, Account;
- sign-in: Sign in, Sign out, Email, Password;
- empty states: Nothing here yet;
- dates: Today, Yesterday, Tomorrow;
- settings: Settings, Language, Theme, Light, Dark, Note, Page and the accent colours `ds-cycle` shows;
- `ds-notice`'s words;
- the language names (`translate("Japanese")`).

Use them rather than a word of the product's own: "Try again" after a failure, never a local "Retry", and Close for a dismiss button. They are translated into every language of the list except `nn` and `no`, which read `nb`'s; a word left out of a language reads English. Turn them on with `configureI18n({ sharedWords: true })` (or `await loadSharedWords()`). They arrive in a chunk of their own, so products that do not use them do not carry them, and they never change which languages a product offers.

## Language-aware addresses

`/ja/pricing` is the pricing page in Japanese, `/pricing` the same page in the default language. The functions are pure, for a browser, a Worker or a test alike (`DS1/0-face/language-routing.ts`):

```javascript
import {
  parseLanguagePath,
  withLanguagePrefix,
  stripLanguagePrefix,
  isLanguageSlug,
} from "@0001-labs/design-system-1";

parseLanguagePath("/ja/pricing"); // { language: "ja", restPath: "/pricing" }
withLanguagePrefix("/pricing", "pt-BR"); // "/pt-br/pricing"
withLanguagePrefix("/ja/pricing", "en"); // "/pricing"
stripLanguagePrefix("/ja/pricing"); // "/pricing"
```

### The language an address names

A page at `/ja/…` speaks Japanese, whatever the reader chose before. Take the language from the address, and the stored choice is left as it is, so following a link to `/ja/…` never overwrites what a person chose for the rest of the product:

```javascript
configureI18n({ languages: ["en", "da", "ja"], languageFromAddress: true });
```

With `languageFromAddress`, the language at startup is the address's prefix (by `routing`); an address without one keeps the stored choice or the browser's. A person's choice through `setLanguage` (or the language cycle) is still stored; the product then goes to the address in that language with `withLanguagePrefix`. Set it on `window.DS_ONE_I18N` before the [theme head script](/1-root/theming/#before-the-first-paint), and `lang` is right before the first paint too.

Calling `setLanguage(language)` with the address's language at startup instead stores it as the person's choice: pass `{ remember: false }` if a product does it that way.

The languages that get a prefix are the product's `languages`; the default language (`en`) has none. Change either through `configureI18n({ routing: { … } })` or `configureLanguageRouting`:

```javascript
configureI18n({
  languages: ["en", "da", "ja"],
  routing: { languages: ["da", "ja"], defaultLanguage: "en", prefixDefaultLanguage: false },
});
```

A prefix already there is replaced, never doubled, and a query and hash stay on the address. Product-specific rules (which pages never carry a language) stay in the product.

## The Convex validator

The server checks languages with a validator built from the same list, so it cannot drift from the interface. Import it by path in the product's `convex/` folder; it is not in the browser bundle:

```typescript
import { languageValidator, languageValidatorFor } from "@0001-labs/design-system-1/DS1/0-face/language-validator.ts";

export const setLanguage = mutation({
  args: { language: languageValidatorFor(["en", "da", "nb", "pt-BR"]) },
  handler: async (ctx, { language }) => { /* … */ },
});
```

`languageValidator` accepts every language in the list; `languageValidatorFor(subset)` only the subset. `convex` is an optional peer dependency of Design system 1. A product with a vendored copy imports the file from its copy instead.

## The picker

```html
<ds-cycle type="language"></ds-cycle>
```

The language cycle goes through the product's languages, each shown by its own name, sets the language on a press and follows it when something else changes it. One square high and eight wide; `compact` makes it four, `chip` a chip. See [Cycle](/2-core/cycle/#the-language-picker).

## Dates, numbers and money

Dates, times, relative time ("3 minutes ago"), numbers, money and lists follow the current language too, through cached `Intl` formatters: `formatDate`, `formatRelativeTime`, `formatNumber`, `formatMoney`, `formatList` and the rest. See [Formatting](/1-root/formatting/).

## Options

| Option | Default | What it does |
| --- | --- | --- |
| `languages` | the languages in the loaded words | The languages the product speaks: offered by the picker, the browser's language lands on one, they get an address prefix |
| `sharedWords` | `false` | Load the shared interface words beneath the product's |
| `languageFile` | none | A file per language: a pattern with `{language}`, or a function |
| `translationsFile` | `./translations.json` | The whole table |
| `storageKey` | `language` | Where the choice is remembered |
| `routing` | the product's languages, no default prefix | Which languages get an address prefix |
| `languageFromAddress` | `false` | Start in the language the address's prefix names, without storing it |
| `langTarget` | the document's root | The element that carries `lang`, or `false` for none |
| `reportMissingKeys` | `false` | Report keys with no text on the console, each once (also `window.DS_ONE_I18N_DEBUG = true`) |

Call `configureI18n` straight after importing the module, or set `window.DS_ONE_I18N` before it loads.
