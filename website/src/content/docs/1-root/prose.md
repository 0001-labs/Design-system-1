---
title: Prose
description: Long-form and marketing writing in native HTML, drawn on the grid by one scoped sheet.
---

`prose.css` draws writing that stays native HTML: headings, paragraphs, lists, links, quotes, inline and block code, rules and simple tables. Mark the element that holds the writing with `data-ds-prose`. Nothing outside it is touched: the sheet has no rules for the page, its body or its controls, and it imports no fonts.

```html
<link rel="stylesheet" href="/ds1/component-tokens.css" />
<link rel="stylesheet" href="/ds1/prose.css" />

<article data-ds-prose>
  <h1>A small reading room</h1>
  <p>A quiet space starts with a few things: daylight, a place to sit and something worth reading.</p>
  <h2>What it needs</h2>
  <ul>
    <li>A chair by the window</li>
    <li>A shelf at arm's length</li>
  </ul>
</article>
```

## The measures

Every line is one square. One square stands between two blocks, and two before a heading.

| Element | Draws |
| --- | --- |
| `h1` | 20px on two squares, in the medium face |
| `h2`, `h3` | 17px and 15px on one square, in the medium face |
| `h4`, `h5`, `h6`, `p`, `li`, `td`, `th` | 14px on one square |
| `a` | Underlined, in the text colour |
| `strong`, `b`, `th`, `dt` | The medium face |
| `ul`, `ol` | Items edge to edge, indented one square |
| `blockquote` | Indented one square, with a hairline at its side |
| `code`, `kbd`, `samp` | 13px in the code face on the fill, with 4px corners |
| `pre` | 13px in the code face, a square of room inside a hairline frame |
| `hr` | A hairline that takes no room |
| `table` | Rows of two squares, a hairline under each; a wide table scrolls on its own |
| `img`, `video` | No wider than the writing, with 4px corners |

The sizes follow `--ds-sf`, and the colours and faces come from the component tokens, so dark mode and the page's scale apply without a second sheet.

## Leaving a part out

An example, a widget or a code frame inside the writing that draws itself carries `data-ds-not-prose`. The block still takes its square of room, and nothing inside it is drawn by the sheet.

```html
<article data-ds-prose>
  <p>Try the control:</p>
  <div data-ds-not-prose>
    <ds-button primary>Save</ds-button>
  </div>
</article>
```

## Changing it

Each rule is as strong as one attribute, so one class in the page's own stylesheet overrides it. The heading sizes have base tokens: `--ds-display-text-size` (20px) for `h1`, `--ds-prose-h2-size` (17px) and `--ds-prose-h3-size` (15px), and `--ds-code-text-size` (13px) for code.

## Prose or text

Long-form and marketing content, such as an article, a help page or a landing page's story, stays in native headings, paragraphs and lists under `data-ds-prose`. Copy in an application's interface uses [`ds-text`](/2-core/text/), or the `.ds-text` classes where a page has no scripts. Both are Design system 1's styles.

## Copying it

Products copy the sheet with Sync 1: `"prose": true` on the `root` export, which also carries the tokens it reads, or on the `tokens` export. The `root` export's `styles` list may name `prose.css` as well. The sheet reads the component tokens (`component-tokens.css`) and the faces the page loads, from `one.css` or the `fonts` export.

```json
{
  "sources": {
    "Design system 1": {
      "root": { "to": "web/ds1", "prose": true }
    }
  }
}
```
