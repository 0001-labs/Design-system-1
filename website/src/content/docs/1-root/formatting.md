---
title: Formatting
description: Dates, times, relative time, numbers, money, prices and lists in the current language, through cached Intl formatters
---

Design system 1 writes dates, times, numbers, money, prices and lists the way the reader's language writes them. Every function formats in the [current language](/1-root/languages/#choosing-and-remembering-a-language), or in a language passed to it, through the platform's `Intl` formatters (`DS1/0-face/format.ts`, and `DS1/0-face/pricing.ts` for prices).

```javascript
import { formatDate, formatMoney, formatRelativeTime, setLanguage } from "@0001-labs/design-system-1";

formatDate(Date.now());                       // "Oct 17, 2026"
formatMoney(1999, "USD", { minor: true });    // "$19.99"
formatRelativeTime(Date.now() - 3 * 60_000);  // "3 minutes ago"

setLanguage("da");
formatDate(Date.now());                       // "17. okt. 2026"
formatMoney(1999, "DKK", { minor: true });    // "19,99 kr."
formatRelativeTime(Date.now() - 86_400_000);  // "i går"
```

## The current language

Each call reads the current language again, so text drawn after `setLanguage` is in the new language. Draw the text again when `language-changed` fires on `window`, as the components do; nothing has to be reset.

Pass `language` to format in another language, whatever the page speaks:

```javascript
formatDate(Date.now(), { language: "ja" }); // "2026/10/17"
```

`language` takes a code of the list (`ja`, `pt-BR`) or any locale tag (`en-GB`, `zh-Hant`).

## Locale tags

`localeTag(language?)` gives the locale a language formats in: the language with the region it is most read in.

| Language | Locale |
| --- | --- |
| `da` | `da-DK` |
| `de` | `de-DE` |
| `en` | `en-US` |
| `es` | `es-ES` |
| `fi` | `fi-FI` |
| `fr` | `fr-FR` |
| `is` | `is-IS` |
| `it` | `it-IT` |
| `ja` | `ja-JP` |
| `ko` | `ko-KR` |
| `nb` | `nb-NO` |
| `nn` | `nn-NO` |
| `no` | `no-NO` |
| `pt` | `pt-PT` |
| `pt-BR` | `pt-BR` |
| `sv` | `sv-SE` |
| `zh` | `zh-CN` |

`pt` is Portugal's Portuguese; `Intl` alone would read a bare `pt` as Brazil's. A tag with its own region or script keeps it (`en-GB`, `da_DK` gives `da-DK`), a language outside the list passes through (`nl`), and anything the runtime cannot read formats in `en-US`. The table is `LOCALE_TAGS`.

### A product's own region

When a product's readers expect another region, set it once at startup:

```javascript
import { configureFormat } from "@0001-labs/design-system-1";

configureFormat({
  locales: { en: "en-GB" },   // English dates day first: "17 Oct 2026"
  timeZone: "Europe/Copenhagen",
});
```

`timeZone` is the zone dates and times are shown in unless a call names one. Without it, the runtime's own zone applies; a Worker's is UTC.

## Dates and times

Each takes a `Date`, milliseconds since 1970 or a date string, and a length: `short`, `medium` or `long`. Pass the length alone, or with other options:

```javascript
formatDate(at);                                  // "Oct 17, 2026"
formatDate(at, "long");                          // "October 17, 2026"
formatDate(at, { length: "short", timeZone: "UTC" }); // "10/17/26"
```

| Function | Default | `en` | `da` | `ja` |
| --- | --- | --- | --- | --- |
| `formatDate` | medium | Oct 17, 2026 | 17. okt. 2026 | 2026/10/17 |
| `formatDate`, long | | October 17, 2026 | 17. oktober 2026 | 2026年10月17日 |
| `formatTime` | short | 2:30 PM | 14.30 | 14:30 |
| `formatDateTime` | medium | Oct 17, 2026, 2:30 PM | 17. okt. 2026, 14.30 | 2026/10/17 14:30 |
| `formatMonthYear` | long | October 2026 | oktober 2026 | 2026年10月 |
| `formatMonthDay` | medium | Oct 17 | 17. okt. | 10月17日 |
| `formatMonthDayTime` | medium | Oct 17, 2:30 PM | 17. okt., 14.30 | 10月17日 14:30 |

`formatDateTime` writes the date at the length given and the time to the minute. `formatTime` at `medium` adds seconds, at `long` the zone. `formatMonthYear`, `formatMonthDay` and `formatMonthDayTime` write the month as a number at `short` and in full at `long`. `formatMonthDay` and `formatMonthDayTime` leave the year out, for dates the reader places in the current year: a list of recent changes, a calendar's week.

A date written without a time (`"2026-10-17"`) is that day wherever it is read: it is never shown as the day before in a zone behind UTC. A moment that is not one (`NaN`, `"soon"`) is written as an empty string.

## Relative time

`formatRelativeTime(value, options?)` says how long ago, or how far ahead, a moment is, in the unit that reads best:

| How far | Written |
| --- | --- |
| under 45 seconds | now |
| under 45 minutes | 3 minutes ago |
| under 22 hours, or on the same day | 5 hours ago |
| under a week | yesterday, 3 days ago, tomorrow |
| under 26 days | last week, 3 weeks ago |
| under 335 days | last month, 4 months ago |
| more | last year, 2 years ago |

Days are calendar days, so "yesterday" is the day before today, in the time zone of the call or `configureFormat`. A date without a time counts days from today: `formatRelativeTime("2026-10-16")` on 17 October is "yesterday", and today's date is "today".

| Option | Default | What it does |
| --- | --- | --- |
| `now` | the present | The moment it is measured from; pass it when a view ticks or in a test |
| `unit` | the one that reads best | Always count in `second`, `minute`, `hour`, `day`, `week`, `month`, `quarter` or `year` |
| `numeric` | `auto` | `auto` writes "yesterday" and "now"; `always` writes "1 day ago" and "0 seconds ago" |
| `style` | `long` | `short` ("3 min. ago") or `narrow` |
| `timeZone` | as dates | The zone whose calendar decides what "yesterday" is |
| `language` | the current language | |

`relativeTimeUnit(value, now?, timeZone?)` gives the count and unit alone (`[-3, "minute"]`), for a product that writes its own sentence around them.

## Numbers

```javascript
formatNumber(1234.5);       // "1,234.5", "1.234,5" in Danish
formatCompact(12345);       // "12.3K", "1.2万" in Japanese
formatPercent(0.256);       // "26%", "26 %" in Danish
formatNumber(2, { minimumFractionDigits: 2 }); // "2.00"
```

`formatPercent` takes a fraction: `0.25` is 25%. `formatCompact` writes one decimal unless the options say otherwise. All three take any `Intl.NumberFormat` option beside `language`.

## Money

`formatMoney(amount, currency, options?)` writes an amount in a currency (an ISO 4217 code, in any case). The currency decides the decimals: two for USD, EUR and DKK, none for JPY and KRW, three for BHD.

```javascript
formatMoney(1234.5, "USD");                    // "$1,234.50"
formatMoney(1234.5, "DKK", { language: "da" }); // "1.234,50 kr."
formatMoney(1234, "JPY", { language: "ja" });   // "￥1,234"
formatMoney(1234.6, "JPY");                    // "¥1,235"
```

Payment services send amounts in the currency's minor unit (cents, øre). Say so with `minor`, and the currency's own decimals divide it: 1999 is $19.99, and 1999 yen are 1999 yen.

```javascript
formatMoney(1999, "usd", { minor: true });     // "$19.99"
formatMoney(1999, "JPY", { minor: true });     // "¥1,999"
```

| Option | Default | What it does |
| --- | --- | --- |
| `minor` | `false` | The amount is in minor units |
| `display` | `symbol` | `symbol` ($, US$ in British English), `narrowSymbol` ($ everywhere), `code` (USD 12.00) or `name` |
| `whole` | `false` | Whole units only, rounded: "$20" |
| `language` | the current language | |

Any other `Intl.NumberFormat` option applies too (`signDisplay: "exceptZero"` for "+$5.00"). A code that is not one (not three letters) is written after the number rather than throwing: "12.00 US".

- `currencyDigits(currency)` gives the minor unit's decimals: `0` for JPY.
- `fromMinorUnits(1999, "USD")` gives `19.99`; `toMinorUnits(19.99, "USD")` gives `1999`, rounded.
- `currencySymbol(currency, options?)` gives the symbol alone: `kr.` in Danish.
- `formatMoneyToParts(amount, currency, options?)` gives the text in parts (`currency`, `integer`, `group`, `decimal`, `fraction`), for drawing each digit in a cell of its own width so amounts line up. A [Stat](/2-core/stat/) with `cells` does this for any figure, and writes its value through these functions.

## Prices

The pricing module says which currency a reader is most likely to think in and writes prices in it (`DS1/0-face/pricing.ts`). The amounts come from the product's billing; this only says how they read. It writes them through `formatMoney`, so the currency's decimals and the language's separators are right.

```javascript
import { formatPrice, getPriceCurrency, getPriceLabel } from "@0001-labs/design-system-1";

getPriceCurrency({ language: "da" });            // "DKK"
getPriceCurrency({ language: "en", country: "GB" }); // "GBP"
getPriceLabel({ language: "ja" });               // "¥"

formatPrice(1999, { language: "en", minor: true }); // "$19.99"
formatPrice(1200, { language: "ja" });           // "￥1,200"
formatPrice(5, { currency: "EUR", language: "de" }); // "5,00 €"
```

### The reader's currency

`getPriceCurrency({ language?, country? })` gives an ISO 4217 code: the country's currency when the country is known (`US`, `GB`, `JP`, `CN`, `KR`, as two or three letters), else the language's, else USD. Without a language, the current language's.

| Language | Currency |
| --- | --- |
| `da` | DKK |
| `de`, `es`, `fi`, `fr`, `it`, `pt` | EUR |
| `en` | USD |
| `is` | ISK |
| `ja` | JPY |
| `ko` | KRW |
| `nb`, `nn`, `no` | NOK |
| `pt-BR` | BRL |
| `sv` | SEK |
| `zh` | CNY |

### Labels and prices

- `getPriceLabel({ language?, country? })` gives the reader's currency as a short label: `kr.` for the Nordic crowns, `€`, `$`, `£`, `¥`, `₩`, `R$`; any other currency as the symbol the language writes it with.
- `formatPrice(amount, options?)` writes an amount in `currency`, or in the reader's currency when none is given. It takes [the money options](#money): `minor` for amounts in cents, `display`, `whole`.

A price a person pays is in the currency the product charges, not a guess from their language: pass `currency` whenever the billing names one, and keep the reader's currency for estimates and labels.

## Lists

```javascript
formatList(["A", "B", "C"]);                          // "A, B, and C"
formatList(["A", "B", "C"], { language: "en-GB" });   // "A, B and C"
formatList(["A", "B", "C"], { language: "da" });      // "A, B og C"
formatList(["A", "B", "C"], { language: "ja" });      // "A、B、C"
formatList(["A", "B"], { type: "disjunction" });      // "A or B"
```

`type` is `conjunction` ("and", the default), `disjunction` ("or") or `unit`; `style` is `long`, `short` or `narrow`. Any iterable of strings works.

## Kept formatters

Each formatter is made once per locale and options, then kept, so formatting in a long list costs one `Intl` object, not one per row. For options the functions above do not cover, take the kept formatter itself:

```javascript
import { dateFormatter } from "@0001-labs/design-system-1";

dateFormatter({ weekday: "long" }).format(at); // "Saturday", "lørdag" in Danish
```

`dateFormatter`, `numberFormatter`, `relativeTimeFormatter` and `listFormatter` take their `Intl` options and `language`. `dateFormatter` applies the time zone from `configureFormat` unless the options name one.

## On a server

The module has no browser code: it runs in a Worker, in Node and in Convex as it does in a page. A server's current language is nobody's in particular, so name the request's language on each call:

```javascript
formatMoney(order.amount, order.currency, { minor: true, language: request.language });
```

## Copying it

Products that copy Design system 1 with Sync 1 get `format.ts` and `pricing.ts` in the `languages` export, beside the language runtime they import, in `0-face/`. A product with a vendored copy imports them from its copy:

```javascript
import { formatMoney } from "./ds1/0-face/format";
```

`format.ts` and every other module in `0-face/` type-check under `strict` with the DOM libraries alone (`dom` and `dom.iterable`, no bundler's types), so a strict product can check its copy as it is; a test in Design system 1 holds them to it.
