---
title: Pricing
description: The currency a reader is likely to think in, from their language or country, and prices written in it
---

The pricing module says which currency a reader is most likely to think in and writes prices in it (`DS1/0-face/pricing.ts`). The amounts come from the product's billing; this only says how they read. It writes them through [Formatting](/1-root/formatting/)'s `formatMoney`, so the currency's decimals and the language's separators are right.

```javascript
import { formatPrice, getPriceCurrency, getPriceLabel } from "@0001-labs/design-system-1";

getPriceCurrency({ language: "da" });            // "DKK"
getPriceCurrency({ language: "en", country: "GB" }); // "GBP"
getPriceLabel({ language: "ja" });               // "¥"

formatPrice(1999, { language: "en", minor: true }); // "$19.99"
formatPrice(1200, { language: "ja" });           // "￥1,200"
formatPrice(5, { currency: "EUR", language: "de" }); // "5,00 €"
```

## The reader's currency

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

## Labels and prices

- `getPriceLabel({ language?, country? })` gives the reader's currency as a short label: `kr.` for the Nordic crowns, `€`, `$`, `£`, `¥`, `₩`, `R$`; any other currency as the symbol the language writes it with.
- `formatPrice(amount, options?)` writes an amount in `currency`, or in the reader's currency when none is given. It takes [the money options](/1-root/formatting/#money): `minor` for amounts in cents, `display`, `whole`.

A price a person pays is in the currency the product charges, not a guess from their language: pass `currency` whenever the billing names one, and keep the reader's currency for estimates and labels.
