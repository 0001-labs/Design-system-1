---
title: Product guides
description: Instructions beside real device examples.
---

Keep a guide on the product’s own site, with its normal navigation and language. Give each article one task, a short introduction, stable section links and instructions using the interface’s exact labels.

## Shared presentation

Copy `DS1/1-root/guide.css` with Sync 1’s `sheets` export. Load it with the DS1 foundations. Use `ds-document` for article navigation and semantic headings and paragraphs for the writing.

Apply `ds-guide` to the guide, `ds-guide-illustrated` to a section pairing words and an example, and `ds-guide-words` to its instructions. Add `ds-guide-illustrated--phone` for a fourteen-square phone beside the reading column. The columns stack on narrow screens.

## Device examples

Put a real screen inside `ds-device-bezel` for a phone or `ds-window` for a browser. Wrap it in a `figure` with `ds-guide-example`; phone figures also take `ds-guide-example--phone`. Add descriptive alternative text and a `figcaption` explaining the state and what to do. Use `ds-guide-example-note` for the sample-data and platform label. Offer an enlarged image when details are small.

Capture the actual interface with isolated synthetic records. Keep personal records and credentials out of examples. Identify mobile web as mobile web; a phone frame alone does not make a native screenshot. Match screenshots to the documented release and replace them when the interface changes.

## Controls and checks

Inline control illustrations use the read-only Aa partial renderer and real DS1 components. They illustrate the instruction and must not call application actions or read account data. Keep a readable text fallback.

Check stable links, keyboard navigation, readable captions and narrow widths from 320px. Verify public guide assets are available while application records remain protected. Record source checks, publishing and visual acceptance separately.
