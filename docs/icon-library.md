# SVG icon collection

The public collection is at https://designsystem1.com/icons. Interface icons use real vector geometry in a 16 × 16 coordinate space. The page is a plain table: each icon by name, a click downloads its SVG. The gridded badge and favicon drawings (`website/src/lib/icons/studio.ts`) only generate the site's own favicon assets; there is no public editor.

## Add an icon from a request

1. Inspect neighbouring icons in `DS1/x-icon/` and the Figma source collection before drawing. Match their optical weight, spacing, curves, and alignment; avoid rasterizing curves into cells.
2. Add a descriptively named, kebab-case SVG to `DS1/x-icon/`. Use `width="16" height="16" viewBox="0 0 16 16"`, self-contained vector paths, and `currentColor` for monochrome artwork. Use explicit fills when colour is part of the design. Do not embed scripts, event attributes, images, fonts, external resources, or links.
3. `vp run icons:build` automatically discovers the SVG, validates it and adds it to the public collection. No manual gallery list or frontend code change is needed for a new icon.
4. Run `vp test --run tests/interfaceIcons.test.ts tests/iconGrid.test.ts tests/iconStudio.test.ts`, then `vp run site:build`. Publish through the existing site deployment workflow when requested, and verify the public SVG and page assets by HTTP. Respect the user's browser-testing preference.

## Rounded everyday icons

A family for money and everyday life: accounts (`bank`, `postal`, `card`, `wallet`, `banknote`, `coins`, `safe`), movements (`transfer`, `income`, `refund`, `repeat`, `receipt`, `percent`, `tag`), bills (`home-alt`, `wifi`, `phone`, `bolt`, `flame`, `drop`, `wrench`, `medical`, `pill`, `shield-alt`), shopping (`cart`, `food`, `coffee`, `shop`, `bag-alt`, `shirt`, `gift`, `box`), getting around (`train`, `car`, `plane`, `fuel`) and leisure (`ticket`, `music-alt`, `tv`, `game`, `book-alt`, `dumbbell`, `cloud`, `school-alt`, `paw`, `heart`, `briefcase`). They are strokes at the collection's 0.92 weight with round caps and joins and soft corners, so they read as one set beside each other in a list. Where the library already had a square drawing of the same concept, the rounded one takes the `-alt` key.

## Planning icons

The issue-tracker example uses ten original 16-unit vectors: `health` (a pulse in a quiet circular field), `milestone` and `milestone-planned` (filled and open hexagons), `priority-low`, `priority-medium` and `priority-high` (three ascending bars), `project` (an open compass), `network` (connected nodes), `prediction` (five points) and `scaling` (a chart in a monitor). They are neutral, reusable additions to the shared collection, with `currentColor` and the existing optical weights. Slate assigns the status colours. Existing drawings and consumer snapshots are unchanged; products can select these keys through the normal icon export.

## Dot icons

Everyday money drawn in the dot matrix of Olivetti Dot: `dot-coin`, `dot-coins`, `dot-banknote`, `dot-banknotes`, `dot-wallet`, `dot-card`, `dot-bank`, `dot-receipt`, `dot-safe` and `dot-transfer`, and three faces for how a budget is doing, `dot-happy`, `dot-neutral` and `dot-sad`. Each is a 7 × 7 grid of filled circles in `currentColor` on a two-unit pitch (centres at 2, 4 … 14), each dot's diameter 91% of the pitch as in the font. They are a family of their own beside the rounded icons, for places that are set in Olivetti Dot. `scripts/build-dot-icons.mjs` holds every drawing as a bitmap and writes the SVGs; change a drawing there, run it, then `vp run icons:build` and `vp run generate:icons`. `--sheet FILE.html` writes a proof sheet at three sizes.

## Drawn arrows

An arrow drawn inside an icon keeps the form of the Inter arrows the type uses: a 90° head whose arms are cut square, as in `right`, `in`, `download` and `upload`. `move` puts four of these heads on a cross. The circular arrows follow `rewind`: an open ring that runs a short way along its tangent into an L-shaped head with one vertical and one horizontal arm. `refresh` turns clockwise with its head at the upper right, so it reads apart from `loop` (two square arrows) and `repeat` (the rounded media pair); `history` is the counter-clockwise ring with clock hands, and `rotate` is a quarter turn over an image frame. `repeat-small` is `repeat` drawn for 6 to 10 pixels, as a badge on a picture's corner: the same rounded pair, simplified, at a 2.4 weight so each line stays more than a pixel wide; never use it at 16.

## Interface additions

- `sign-in` and `sign-out` are the download and upload arrows turned towards a door frame; the sheet calls them Enter and Exit. `in` is a different drawing: two arrows meeting at a line.
- `material` is the filled circle behind a rounded square, for a collection of samples or attachments. Its original vector geometry is centred on the 16-unit frame.
- `stop` is the filled square of the media set, beside `play-alt` and `pause`.
- File kinds are drawn as what they hold: `video`, `audio` (a waveform centred on the middle line, where `stats` stands on a baseline), `pdf` (the top of `page` with its text lines, above the letters), `page` for a generic file and `code` for a code file.
- `flip` mirrors a shape across a dashed axis. `title-struck` is the title T crossed by a level line, where `untitle` is crossed diagonally.
- The theme picker uses `sun`, `moon` and `system`, a circle filled on its left half, in the rounded family's weight. `offline` is `wifi` with its arcs cut around a slash. `sparkle` is filled like `star`; `keyboard` and `cursor`, the pointer, are rounded.

## Flags

Country flags are their own folder, `DS1/x-flag/`, outside the icon collection and its catalogue: in colour, 3:2 rather than 16 square, and one for every country and territory (plus the UK's nations, `gb-eng`, `gb-sct`, `gb-wls`, `gb-nir`, and a few regions such as `es-ct` and `eu`). The Icon page says they exist and how to draw them without listing them. `scripts/import-flags.mjs` writes the folder from country-flag-icons' 3:2 drawings (MIT, `x-flag/LICENSE.md`), each framed 30 × 20 and otherwise untouched; Japan's is Ezo's, the disc three-fifths of the height. Leave the drawings to the import: to change one, change the script and run it again. `.ds-flag` in `controls.css` draws one, its corners a quarter of its height and centred in a table row, and Sync 1's `flags` export copies them.

## Brand marks

Third-party brand marks are monochrome outlines in `currentColor`, named after the brand in one word (`figma`, `drive`, `github`). Fourteen of them (airtable, drive, dropbox, facebook, figma, github, instagram, linkedin, loom, notion, slack, vimeo, x-brand, youtube) are adapted from Tabler Icons' MIT outlines, drawn in a 24-unit inner frame at a 1.5 stroke so they render at the library's one-unit weight; the licence is in `DS1/x-icon/Tabler-LICENSE.md`. The X mark's key is `x-brand`, because `close` is the cross and a bare `x` would read as one. The browsers and systems a visit came from are marks too: `chrome`, `firefox`, `safari`, `opera`, `edge-brand` (Microsoft Edge, keyed apart from the library's word for an edge), `windows` and `android` adapted from Tabler Icons 3.49.0 the same way, and `linux`, Tux filled in `currentColor` from Simple Icons 16.0.0 (CC0), framed 14 units inside the 16; Mac and iOS take `apple`. `google` and `apple` keep their own drawings. `jpbank` is Japan Post Bank's own JP BANK mark, its outlines taken unchanged from the official logo on Wikimedia Commons (File:Japan_Post_Bank_Logo.svg, public domain as a text logo, a trademark of Japan Post Bank), framed on the 16-unit grid; its colour is #009042 on white.

## Source collection

The reference is Figma file `XAnoaRoq9LxVAHUZgtdO0r`, frame `403:4105`. Its 72 original SVGs, less the three panel icons since removed as unused (`panel`, `pleft`, `pright`), are stored in `website/public/icons/interface/`; metadata is in `website/src/lib/icons/figma-interface.json`. These assets preserve the original Figma icon coordinates, transforms, and clipping in their 16-unit frames. The export renderer’s page background and purple component-set boundary were removed; the icon layers were not redrawn. Existing additions with smaller bounds are centred without changing their paths. `note-page` and `title-text` distinguish identically named Figma components.

The catalog includes the original reference icons, additional loose Figma drawings recorded in `website/src/lib/icons/figma-additions.json`, and shared interface icons in `DS1/x-icon/`. The loose drawings retain their source node links and geometry; coloured frame backgrounds are presentation surfaces and are excluded from exports. 30-unit drawings are scaled as a whole into the 16-unit overview grid.

Product-specific artwork belongs to its product and stays there; the library never names a product, in an icon's name or anywhere else. `icon-scope.ts` excludes coloured badges, block and pattern thumbnails, and arrangement/navigation collections from the shared overview and its public SVG exports. Shared icon labels are one semantic word, without product names. Use `icon` as the shared symbol for artwork; `image` is retired from the collection and its public exports. Variations of one concept share that word; their existing technical keys and Figma node references distinguish the drawings. Repeated drawings appear once in the shared collection: `interfaceIconAliases` records their canonical keys and prevents old runtime copies from being rediscovered as additions. Compare the rendered geometry when checking duplicates, including tiny coordinate rounding differences; matching names alone do not make different drawings duplicates. Existing runtime copies remain for compatibility with product consumers; their presence there does not make them shared icons. Future product imports must respect this boundary. Existing names are not silently replaced: a reference name takes precedence in the gallery. To refine a reference icon, update its source SVG deliberately and compare it with the linked Figma component; update the runtime counterpart in `DS1/x-icon/` only when the requested scope includes it.

`scripts/build-interface-catalog.ts` produces the generated `interface-catalog.json`, public `/icons/catalog.json`, and public copies of added SVGs. Do not edit those generated files directly. Downloading an icon returns the untouched source SVG.

Request new icons through the development conversation, following the drawing and publishing steps above.

## Product icon coverage

Run `vp run icons:sync-products` to import the icons the products share: the runtime map of a product's copy, flat badges and their 3D forms, and the editor's editing SVGs. It records each source and the installed drawing in `scripts/product-icon-sources.json`, outside the published package. Run `vp run icons:check-products` to check for drift against the product checkouts. Existing library drawings stay intact. A product's own drawings (anything named after the product, its settings and screen glyphs, its logo) and its variants of a library drawing are not imported: they stay in the product, which draws them through `<ds-icon>` with the SVG as content. Duplicate is the reference Command-D drawing in all three products. Globe uses one unioned vector path so adjoining pieces cannot leave seams.

For these shared refinements, change the SVGs here and run `vp run icons:sync-consumers`. It synchronizes Globe across Ezo (web, iPhone and Android), Consistency (Lit and React), Link (web and iPhone), and tau99, then updates Duplicate in Ezo and Aa, regenerates Ezo’s icon chunks, and refreshes the built Aa snapshot. `vp run icons:sync-globe` updates only Globe; `vp run icons:check-globe` verifies all its consumers without writing. The canonical source is `DS1/x-icon/globe.svg`; native Swift paths and React adapters are generated from that exact path. Keep display sizes, including 30px, separate from the 16-unit drawing grid. The Android library name remains a compatibility alias of Globe, not a separate drawing. Then run `vp run icons:sync-products` to refresh the inventory and its checks.

The collection’s optical stroke weight is not a universal 1px. Preserve the source measurements, including 0.92-unit strokes, and the geometry of filled outlines. Do not round artwork to 1px during import or regeneration.
