# Design QA: semantic tags and fixed example copy

## Evidence

- Source visual truth: `/var/folders/qw/k3yb268s15sblxbjgj09jdgm0000gn/T/TemporaryItems/NSIRD_screencaptureui_CiW9dY/Screenshot 2026-07-24 at 15.18.36.png`
- Implementation screenshot: `/Users/joachim/.codex/visualizations/2026/07/23/019f8cff-20b9-7523-8a71-aae8f93de92c/ds-one-semantic-tags/implementation-full.jpg`
- Focused controls screenshot: `/Users/joachim/.codex/visualizations/2026/07/23/019f8cff-20b9-7523-8a71-aae8f93de92c/ds-one-semantic-tags/implementation-controls.png`
- Combined focused comparison: `/Users/joachim/.codex/visualizations/2026/07/23/019f8cff-20b9-7523-8a71-aae8f93de92c/ds-one-semantic-tags/comparison.png`
- Browser viewport: 1242 × 699 CSS px at device scale factor 1
- Source pixels: 552 × 354
- Implementation pixels: 1243 × 699
- Focused implementation pixels: 430 × 230, normalized to 662 × 354
- State: Section / Default, curated default copy, light canvas

## Full-view comparison

The source showed freeform Text and Description fields that allowed arbitrary
copy. The implementation removes those fields entirely. The first control group
now presents a fixed copy state with only Shorter and Longer actions, while the
existing spacing, theme, output, canvas, and full CSS editor remain intact.

The library names are native HTML tags: `<p>`, `<button>`, `<input>`, and
`<section>`. The selected surface renders as
`<section><h2>…</h2><p>…</p></section>`.

## Focused comparison

The focused side-by-side comparison directly contrasts the original editable
Props panel with the new locked Example copy control. The updated panel has no
text or textarea input. Its two actions are visually balanced and leave the
control group more compact than the source.

## Required fidelity surfaces

- Fonts and typography: existing DS one interface typography is preserved.
  Fixed-copy status and length labels use the established UI and monospace
  hierarchy.
- Spacing and layout rhythm: the replacement control fits the same docked area
  without increasing its height. The 50/50 design and code split remains
  unchanged.
- Colors and visual tokens: the new buttons reuse existing border, surface,
  muted text, and focus colors.
- Image quality and assets: no imagery is required for this control change.
- Copy and content: arbitrary text is replaced by curated short, default, and
  long examples. The default section uses the supplied WWF History example.

## Interaction verification

- Confirmed the library exposes only native tag names.
- Confirmed the preview renders a `SECTION` containing `H2` and `P`.
- Confirmed the complete CSS uses `section` and `--one-section-*`, with no
  `article` selector or `--one-card-*` token.
- Confirmed no editable copy text or textarea fields remain in Controls.
- Confirmed Shorter changes the section body to “WWF was founded in 1961.” and
  disables at the shortest state.
- Confirmed Longer reaches the extended example and disables at the longest
  state.
- Confirmed export contains `<section>`, excludes `<article>`, preserves the
  selected example length, and includes no runtime script.
- Checked for the development error overlay; none was present.

## Comparison history

### Iteration 1

- Finding: the source permitted arbitrary copy, conflicting with the requested
  fixed-example step.
- Fix: removed copy inputs and replaced them with curated Shorter and Longer
  actions.
- Post-fix evidence: the focused comparison shows no editable copy fields and a
  compact two-action control.

### Iteration 2

- Finding: “Card” and `article` still described the surface concept rather than
  the requested native tag.
- Fix: renamed the library item, preview, export, CSS selector, and tokens to
  `section`.
- Post-fix evidence: browser inspection reports a `SECTION` preview, a
  `<section>` output label, `section {` in the full CSS file, and no
  `article {`.

## Follow-up polish

- P3: custom writing can be introduced later as a separate composition-level
  mode without reopening freeform fields in this primitive step.

final result: passed
