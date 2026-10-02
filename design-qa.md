# Design QA: grouped heading component

## Evidence

- Requested row reference: `/var/folders/qw/k3yb268s15sblxbjgj09jdgm0000gn/T/TemporaryItems/NSIRD_screencaptureui_jNqjRZ/Screenshot 2026-07-24 at 15.27.19.png`
- Final implementation: `/Users/joachim/.codex/visualizations/2026/07/24/ds-one-core-editor/headings.png`
- Focused comparison: `/Users/joachim/.codex/visualizations/2026/07/24/ds-one-core-editor/headings-comparison.png`
- Reference pixels: 304 × 74
- Implementation pixels: 1205 × 759
- State: `<h1> - <h6>` selected with the Typography section visible in the CSS editor

## Visual comparison

The heading entry follows the reference as a single, bold tag-range row rather
than six separate sidebar items. It uses the existing selected-row fill and
left marker so it remains consistent with the other semantic HTML entries.

The canvas renders all six native heading elements together, making the
typographic hierarchy visible at a glance. Selecting the group scrolls the
full CSS file to `/* Typography` and highlights that section.

## Interaction verification

- Selected `<h1> - <h6>` and confirmed the canvas renders native `h1` through
  `h6` elements.
- Confirmed the example copy is fixed and the Shorter and Longer actions alter
  the supplied example length.
- Changed Horizontal spacing to 8px and confirmed
  `--one-text-padding-inline: 8px` and the rendered heading padding both update.
- Restored Horizontal spacing to 0px for the final reference state.
- Confirmed the CSS editor scrolls to the Typography section on selection.
- Checked browser warnings and errors; none were present.

## Findings

- No P0, P1, or P2 visual or interaction issues remain.
- The focus outline visible in the implementation is the accessible keyboard
  focus state and intentionally supplements the selected-row treatment.

final result: passed

---

# Design QA: instance labels above previews

## Evidence

- Source visual truth: `/var/folders/qw/k3yb268s15sblxbjgj09jdgm0000gn/T/TemporaryItems/NSIRD_screencaptureui_2d49h5/Screenshot 2026-07-25 at 14.23.25.png`
- Final heading implementation: `/Users/joachim/.codex/visualizations/2026/07/25/019f97b7-b882-7b50-bc43-9f6d7a9dbaf2/instance-label-qa/implementation-full-final.png`
- Focused heading implementation: `/Users/joachim/.codex/visualizations/2026/07/25/019f97b7-b882-7b50-bc43-9f6d7a9dbaf2/instance-label-qa/implementation-focused-final.png`
- Combined focused comparison: `/Users/joachim/.codex/visualizations/2026/07/25/019f97b7-b882-7b50-bc43-9f6d7a9dbaf2/instance-label-qa/comparison-final.png`
- Button variant verification: `/Users/joachim/.codex/visualizations/2026/07/25/019f97b7-b882-7b50-bc43-9f6d7a9dbaf2/instance-label-qa/implementation-buttons-final.png`
- Browser viewport: 1242 × 699 CSS px at device scale factor 1
- Source pixels: 288 × 90 at approximately 2× density, normalized to 144 × 45 CSS px
- Focused implementation pixels: 355 × 310 at 1× density; scaled to 710 × 620 for the combined 2× comparison
- State: light canvas with `<h1> – <h6>` selected

## Full-view comparison

The component name is attached to a fitted instance frame and sits directly
above the rendered heading group. It no longer occupies the top-left corner of
the full story frame. The surrounding canvas, component controls, and CSS
editor retain their prior layout.

The button state confirms the same pattern for repeated instances: `default`,
`variant="secondary"`, `variant="tertiary"`, and `disabled` are each positioned
above the button they describe.

## Focused comparison

The source and implementation use the same `<h1> – <h6>` copy, muted gray
monospace treatment, left alignment, and frame-name placement. The label sits
8px above its rendered instance.

## Required fidelity surfaces

- Fonts and typography: the existing 14px monospace label style is preserved;
  the short hyphen was corrected to the source en dash.
- Spacing and layout rhythm: the label is fitted to the instance wrapper with
  an 8px gap and no longer consumes a separate story-frame row.
- Colors and visual tokens: the established muted label color `#b0b0b0` is
  retained and matches the light reference treatment.
- Image quality and asset fidelity: no image or icon assets are present or
  required for this text-only adjustment.
- Copy and content: the heading label matches `<h1> – <h6>` exactly, and all
  existing button variant names are preserved.

## Interaction verification

- Selected the heading group and confirmed its name is directly above the six
  rendered headings.
- Selected the button group and confirmed the primary and four variant names
  appear above their corresponding instances.
- Confirmed the component controls and CSS editor still update with selection.
- Checked browser warnings and errors; none were present.

## Comparison history

### Iteration 1

- Finding: the implementation used `<h1> - <h6>` with a short hyphen.
- Fix: replaced the separator with the reference en dash.
- Post-fix evidence: `comparison-final.png` shows the corrected copy and closer
  label width against the source.

## Findings

- No P0, P1, or P2 differences remain.
- P3: minor antialiasing differences are expected between the source capture
  density and the browser render.

final result: passed

---

# Design QA: CLASSless documentation integration — 2026-09-03

## Evidence and scope

- Source visual truth: `/var/folders/qw/k3yb268s15sblxbjgj09jdgm0000gn/T/TemporaryItems/NSIRD_screencaptureui_qiAj9e/Screenshot 2026-09-03 at 20.41.00.png`.
- Source pixels: 2828 × 1710 including browser chrome; displayed attachment is 2048 × 1238. Exact CSS viewport and density are not known.
- Implementation: `http://127.0.0.1:4322/classless/editor/` and `/classless/libraries/`.
- Implementation screenshot, viewport, and density normalization: unavailable; the user explicitly requested no browser testing.
- Intended state: shared documentation shell, CLASSless editor or libraries, matching the documentation theme.
- Full-view and focused comparisons: not performed. No visual fidelity verdict is claimed.

## Implementation

- Reused the existing documentation header, sidebar, fonts, colours, and mobile navigation.
- Added a CLASSless section with Overview, Editor, and My libraries.
- Embedded the existing app on the same origin, retaining variants, CSS editing, and box-model controls.
- Added validated same-origin theme messages and responsive embedded layouts that keep the inspector accessible.
- Kept the standalone app and existing documentation routes available.

## Required fidelity surfaces

- Fonts and typography: existing documentation assets reused; rendered sizing and wrapping need user review.
- Spacing and layout rhythm: existing shell retained; app region adapted to the available width. Responsive rendering remains unverified.
- Colours and tokens: embedded chrome follows documentation light/dark tokens; actual contrast requires visual review.
- Image quality and assets: no new raster imagery or icons were needed; existing header assets retained.
- Copy and content: CLASSless naming, native HTML positioning, and temporary-versus-saved editing are explicit.

## Non-browser checks

- Combined documentation and app production build, including app TypeScript check: passed.
- CSS-text and documentation-embed tests: 23 passed.
- Local documentation page, proxied app shell, and app entry module: HTTP 200.
- No browser interaction, sign-in, publishing, or deployment was performed.

## Findings and next check

Visual comparison is blocked by the user's no-browser-testing instruction. Review the local editor, theme toggle, narrow layout, and libraries view manually before visual acceptance or publication. Earlier QA reports above are historical and do not apply to this integration.

final result: blocked
