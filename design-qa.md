# Design QA: split design and CSS workspace

## Evidence

- Source visual truth: `/var/folders/qw/k3yb268s15sblxbjgj09jdgm0000gn/T/TemporaryItems/NSIRD_screencaptureui_UM8Wil/Screenshot 2026-07-24 at 15.07.14.png`
- Existing-product reference: `/var/folders/qw/k3yb268s15sblxbjgj09jdgm0000gn/T/TemporaryItems/NSIRD_screencaptureui_fKtroy/Screenshot 2026-07-24 at 15.06.05.png`
- Implementation screenshot: `/Users/joachim/.codex/visualizations/2026/07/23/019f8cff-20b9-7523-8a71-aae8f93de92c/ds-one-split-layout/implementation.jpg`
- Combined comparison: `/Users/joachim/.codex/visualizations/2026/07/23/019f8cff-20b9-7523-8a71-aae8f93de92c/ds-one-split-layout/comparison.png`
- Requested browser viewport override: 1702 × 855 CSS px
- Captured app viewport: 1652 × 830 CSS px at device scale factor 1
- Source pixels: 2818 × 1676 at 144 dpi
- Normalized source: 1396 × 830 px
- Implementation pixels: 1652 × 830 px
- State: Button / Default, light design canvas, full semantic CSS file

The Tailwind Play screenshot is a structural reference rather than a literal
brand target. The user explicitly requested the relationship to be mirrored:
design tools on the left and code on the right.

## Full-view comparison

The reference establishes a strong two-pane playground with a continuous
vertical divider and one primary surface per half. The implementation now uses
the same large-region model in the requested order. Measured design and code
regions are both 826.21 px wide. The CSS panel occupies the complete 780.10 px
content height below the global header, and the controls are fully contained
within the left design region.

## Focused comparison

A separate crop was not needed because the requested change concerns the
large-region layout and all relevant areas are readable in the full-height
capture. DOM geometry was used as focused evidence for the center split,
full-height code panel, and control containment.

## Required fidelity surfaces

- Fonts and typography: DS one typefaces and hierarchy are intentionally
  preserved rather than copying Tailwind branding. Code retains the existing
  monospace treatment and readable line rhythm.
- Spacing and layout rhythm: the workspace is split exactly 50/50. Library,
  canvas, and docked controls form one left-side design tool; the CSS file is an
  uninterrupted right-side surface.
- Colors and visual tokens: the existing light DS one workbench and dark code
  editor remain intact, preserving the product's visual identity while
  matching the reference's clear surface contrast.
- Image quality and assets: no new imagery is required. The Tailwind logo and
  preview artwork belong to the reference product and are intentionally not
  reproduced.
- Copy and content: DS one component labels, semantic CSS path, status, and
  export language remain accurate.

## Interaction verification

- Edited horizontal button spacing and verified
  `--one-button-padding-inline` changed in the full CSS file.
- Switched from Button to Card and verified the preview changed to `ARTICLE`
  while the complete CSS remained present.
- Opened and closed the export dialog and verified semantic CSS plus
  no-runtime messaging.
- Checked for the development error overlay; none was present.

## Comparison history

### Iteration 1

- Findings: no actionable P0, P1, or P2 differences for the requested mirrored
  playground layout.
- Fixes made after comparison: none required.
- Post-fix evidence: the first browser-rendered comparison already showed an
  exact center split, full-height right code surface, and left-contained
  controls.

## Follow-up polish

- P3: a future iteration could add a draggable center divider if variable pane
  widths become useful. The current fixed 50/50 split matches this request.

final result: passed
