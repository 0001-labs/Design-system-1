import { mountShowcase } from "./showcase-runtime";
import type { ComponentExample } from "./component-examples";

/** Original, local-only specimens composed from the public component APIs. */
export const SHOWCASE_EXAMPLES: Record<string, ComponentExample> = {
  "image-landscape": {
    title: "A wide photograph",
    hint: "A 16:9 frame crops the photograph while keeping its centre in view.",
    html: '<ds-image src="/examples/images/forest.webp" alt="A path beneath tall trees in a sunlit forest" ratio="16 / 9" caption="A quiet path through the forest." style="max-width: 640px" loading="eager"></ds-image>',
    height: 430,
  },
  "image-fit": {
    title: "Crop or show the whole image",
    hint: "Cover fills the square. Contain preserves the complete photograph.",
    html: '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;max-width:640px"><ds-image src="/examples/images/lake.jpg" alt="A mountain reflected in a lake" ratio="1" fit="cover" caption="Cover" loading="eager"></ds-image><ds-image src="/examples/images/lake.jpg" alt="The full portrait photograph of a mountain and its reflection" ratio="1" fit="contain" caption="Contain" loading="eager"></ds-image></div>',
    height: 410,
  },
  "tag-labels": {
    title: "Labels that fit their words",
    hint: "Each tag hugs its text with 4px of padding on each side.",
    html: '<ds-row><ds-tag style="--ds-tag-accent: var(--ds-pink)">App</ds-tag><ds-tag style="--ds-tag-accent: var(--ds-apple-green)">Published</ds-tag><ds-tag style="--ds-tag-accent: var(--ds-orange)">Draft</ds-tag></ds-row>',
    height: 120,
  },
  "button-publishing": {
    "title": "A publication toolbar",
    "hint": "Primary, secondary and quiet actions share one baseline.",
    "html": "<section class=\"specimen\">\n<ds-row class=\"line\" ><ds-button primary><span class=\"mark\"><ds-icon type=\"check\" size=\"large\" aria-hidden=\"true\"></ds-icon></span>Publish</ds-button><ds-button secondary>Save draft</ds-button><ds-button >Preview</ds-button><ds-button disabled>Archive</ds-button></ds-row>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 200
  },
  "button-navigation": {
    "title": "Moving through a collection",
    "hint": "Icon-only controls retain accessible names and the same control height.",
    "html": "<section class=\"specimen\">\n<ds-row class=\"line\" ><ds-button secondary label=\"Previous photograph\"><span class=\"mark\"><ds-icon type=\"left\" size=\"large\" aria-hidden=\"true\"></ds-icon></span></ds-button><ds-text literal class=\"mono\">12 of 48</ds-text><ds-button secondary label=\"Next photograph\"><span class=\"mark\"><ds-icon type=\"right\" size=\"large\" aria-hidden=\"true\"></ds-icon></span></ds-button><ds-button secondary><span class=\"mark\"><ds-icon type=\"download\" size=\"large\" aria-hidden=\"true\"></ds-icon></span>Download</ds-button></ds-row>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 200
  },
  "text-editorial": {
    "title": "An exhibition label",
    "hint": "Display, heading, body and small text keep the square rhythm. The edition uses the mono face.",
    "html": "<section class=\"specimen\">\n<ds-text literal size=\"display\">Rooms of light</ds-text><ds-gap></ds-gap><ds-row class=\"line\" ><ds-text literal strong>Photographs by Nia Vale</ds-text></ds-row><ds-row class=\"line\" ><ds-text literal >Silver prints, made beside the coast.</ds-text></ds-row><ds-row class=\"line\" ><ds-text literal class=\"mono\" size=\"small\" tone=\"muted\">Edition 024 / 100</ds-text></ds-row>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 240
  },
  "text-statuses": {
    "title": "Different meanings, one baseline",
    "hint": "Regular, strong, small, warning and danger text retain a consistent line.",
    "html": "<section class=\"specimen\">\n<ds-row class=\"line\" ><span class=\"mark\"><ds-icon type=\"page\" size=\"large\" aria-hidden=\"true\"></ds-icon></span><ds-text literal strong>Field notes</ds-text></ds-row><ds-row class=\"line\" ><span class=\"mark\"><ds-icon type=\"check\" size=\"large\" aria-hidden=\"true\"></ds-icon></span><ds-text literal >Proofs approved</ds-text></ds-row><ds-row class=\"line\" ><span class=\"mark\"><ds-icon type=\"calendar\" size=\"large\" aria-hidden=\"true\"></ds-icon></span><ds-text literal tone=\"warning\">Collection closes tomorrow</ds-text></ds-row><ds-row class=\"line\" ><span class=\"mark\"><ds-icon type=\"warning\" size=\"large\" aria-hidden=\"true\"></ds-icon></span><ds-text literal tone=\"danger\">One photograph is missing</ds-text></ds-row><ds-row class=\"line\" ><span class=\"mark\"><ds-icon type=\"info\" size=\"large\" aria-hidden=\"true\"></ds-icon></span><ds-text literal size=\"small\" tone=\"muted\">Last edited this morning</ds-text></ds-row>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 200
  },
  "icon-labelled": {
    "title": "Icons beside words",
    "hint": "Every drawing occupies a square, with its lower edge on the text line.",
    "html": "<section class=\"specimen\">\n<ds-row class=\"line\" ><span class=\"mark\"><ds-icon type=\"folder\" size=\"large\" aria-hidden=\"true\"></ds-icon></span><ds-text literal >Archive</ds-text></ds-row><ds-row class=\"line\" ><span class=\"mark\"><ds-icon type=\"image\" size=\"large\" aria-hidden=\"true\"></ds-icon></span><ds-text literal >Photographs</ds-text></ds-row><ds-row class=\"line\" ><span class=\"mark\"><ds-icon type=\"music\" size=\"large\" aria-hidden=\"true\"></ds-icon></span><ds-text literal >Recordings</ds-text></ds-row><ds-row class=\"line\" ><span class=\"mark\"><ds-icon type=\"page\" size=\"large\" aria-hidden=\"true\"></ds-icon></span><ds-text literal >Transcripts</ds-text></ds-row><ds-row class=\"line\" ><span class=\"mark\"><ds-icon type=\"star\" size=\"large\" aria-hidden=\"true\"></ds-icon></span><ds-text literal >Selected works</ds-text></ds-row>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 200
  },
  "avatar-credits": {
    "title": "Credits and roles",
    "hint": "Small round identities align with names and quieter roles.",
    "html": "<section class=\"specimen\">\n<ds-row class=\"line\" ><span class=\"mark\"><ds-avatar initial=\"N\" label=\"Nia Vale\"></ds-avatar></span><ds-text literal class=\"grow\">Nia Vale</ds-text><ds-text literal tone=\"muted\" size=\"small\">Photographs</ds-text></ds-row><ds-row class=\"line\" ><span class=\"mark\"><ds-avatar initial=\"O\" label=\"Omar Lee\"></ds-avatar></span><ds-text literal class=\"grow\">Omar Lee</ds-text><ds-text literal tone=\"muted\" size=\"small\">Words</ds-text></ds-row><ds-row class=\"line\" ><span class=\"mark\"><ds-avatar initial=\"R\" label=\"Ruth Park\"></ds-avatar></span><ds-text literal class=\"grow\">Ruth Park</ds-text><ds-text literal tone=\"muted\" size=\"small\">Sound</ds-text></ds-row>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 200
  },
  "avatar-scale": {
    "title": "From a byline to a profile",
    "hint": "The same identity at control height and two squares, paired with type.",
    "html": "<section class=\"specimen\">\n<ds-row class=\"line\" ><ds-avatar initial=\"N\" label=\"Nia Vale\"></ds-avatar><ds-text literal >Nia Vale</ds-text></ds-row><ds-gap></ds-gap><ds-row class=\"line\" auto><ds-avatar initial=\"N\" size=\"large\" label=\"Nia Vale\"></ds-avatar><div><ds-row class=\"line\" ><ds-text literal strong>Nia Vale</ds-text></ds-row><ds-row class=\"line\" ><ds-text literal tone=\"muted\">Photographer</ds-text></ds-row></div></ds-row>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 220
  },
  "badge-records": {
    "title": "Record states",
    "hint": "Icons and short state labels sit beside the content they describe.",
    "html": "<section class=\"specimen\">\n<ds-row class=\"line\" ><ds-text literal class=\"grow\">Winter issue</ds-text><ds-badge icon=\"check\">Approved</ds-badge></ds-row><ds-row class=\"line\" ><ds-text literal class=\"grow\">Field recordings</ds-text><ds-badge icon=\"lock\">Private</ds-badge></ds-row><ds-row class=\"line\" ><ds-text literal class=\"grow\">Early sketches</ds-text><ds-badge icon=\"archive\">Archived</ds-badge></ds-row>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 200
  },
  "badge-actions": {
    "title": "Compact status controls",
    "hint": "Text badges and icon-only badges use the same compact line.",
    "html": "<section class=\"specimen\">\n<ds-row class=\"line\" ><ds-badge icon=\"star\">Selected</ds-badge><ds-badge icon=\"lock\">Members</ds-badge><ds-badge icon=\"archive\" icon-only aria-label=\"Archived\">Archived</ds-badge></ds-row>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 200
  },
  "input-address": {
    "title": "A delivery address",
    "hint": "Labels, values and controls align in a compact group. All values are fictional.",
    "html": "<section class=\"specimen\">\n<div class=\"columns\"><ds-input label=\"Recipient\" value=\"Nia Vale\"></ds-input><ds-input label=\"City\" value=\"Northbridge\"></ds-input></div><ds-gap></ds-gap><ds-input label=\"Delivery note\" value=\"Leave with the reading room\"></ds-input>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 260
  },
  "input-validation": {
    "title": "An edition reference",
    "hint": "A validation message stays with its field; a locked value retains the field geometry.",
    "html": "<section class=\"specimen\">\n<ds-input label=\"Edition reference\" value=\"PRINT-\" error=\"Add the edition number, for example PRINT-024\"></ds-input><ds-gap></ds-gap><ds-input label=\"Collection\" value=\"Rooms of light\" disabled></ds-input>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 260
  },
  "choice-checklist": {
    "title": "Preparing a small exhibition",
    "hint": "Checkboxes and labels occupy the same line; completed and unavailable states stay aligned.",
    "html": "<section class=\"specimen\">\n<label><ds-checkbox><input type=\"checkbox\" checked></ds-checkbox>Print wall labels</label><label><ds-checkbox><input type=\"checkbox\" ></ds-checkbox>Pack the frames</label><label><ds-checkbox><input type=\"checkbox\" disabled></ds-checkbox>Reserve transport</label>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: 0; min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 200
  },
  "choice-switches": {
    "title": "Reading preferences",
    "hint": "Switches remain aligned at the ends of their label rows.",
    "html": "<section class=\"specimen\">\n<ds-row class=\"line\" ><ds-text literal class=\"grow\">Remember my place</ds-text><ds-switch><button type=\"button\" role=\"switch\" aria-label=\"Remember my place\" aria-checked=\"true\"></button></ds-switch></ds-row><ds-row class=\"line\" ><ds-text literal class=\"grow\">Show annotations</ds-text><ds-switch><button type=\"button\" role=\"switch\" aria-label=\"Show annotations\" aria-checked=\"false\"></button></ds-switch></ds-row><ds-row class=\"line\" ><ds-text literal class=\"grow\">Use compact rows</ds-text><ds-switch><button type=\"button\" role=\"switch\" aria-label=\"Use compact rows\" aria-checked=\"true\"></button></ds-switch></ds-row>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 200
  },
  "radio-editions": {
    "title": "Choose an edition",
    "hint": "A single selection, arranged on one-square rows.",
    "html": "<section class=\"specimen\">\n<fieldset><legend>Edition</legend><label><ds-radio><input type=\"radio\" name=\"edition\" value=\"0\" checked></ds-radio>Softcover</label><label><ds-radio><input type=\"radio\" name=\"edition\" value=\"1\" ></ds-radio>Clothbound</label><label><ds-radio><input type=\"radio\" name=\"edition\" value=\"2\" ></ds-radio>Signed copy</label></fieldset>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: 0; min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 200
  },
  "select-print": {
    "title": "Paper and finish",
    "hint": "Native choices keep their keyboard behaviour inside the shared control face.",
    "html": "<section class=\"specimen\">\n<div class=\"columns\"><label>Paper<ds-select><select aria-label=\"Paper\"><option>Natural</option><option>Bright white</option><option>Recycled</option></select></ds-select></label><label>Finish<ds-select><select aria-label=\"Finish\"><option>Uncoated</option><option>Matt</option><option>Gloss</option></select></ds-select></label></div>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 200
  },
  "select-sort": {
    "title": "A compact sorting row",
    "hint": "A chip-sized select sits alongside the content count.",
    "html": "<section class=\"specimen\">\n<ds-row class=\"line\" ><ds-text literal class=\"grow\">24 photographs</ds-text><ds-select fit chip primary><select aria-label=\"Sort photographs\"><option>Newest first</option><option>Title</option><option>Oldest first</option></select></ds-select></ds-row>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 200
  },
  "color-palette": {
    "title": "A print palette",
    "hint": "Named swatches, exact values and the native picker share a row. Sample colours come from the shared palette.",
    "html": "<section class=\"specimen\">\n<ds-row class=\"line\" ><ds-swatch value=\"#99ff73\" aria-hidden=\"true\"></ds-swatch><ds-text literal class=\"grow\">Apple green</ds-text><ds-color><input type=\"color\" value=\"#99ff73\" aria-label=\"Apple green\"></ds-color></ds-row><ds-row class=\"line\" ><ds-swatch value=\"#ccccff\" aria-hidden=\"true\"></ds-swatch><ds-text literal class=\"grow\">Zenith blue</ds-text><ds-color><input type=\"color\" value=\"#ccccff\" aria-label=\"Zenith blue\"></ds-color></ds-row><ds-row class=\"line\" ><ds-swatch value=\"#f5aad1\" aria-hidden=\"true\"></ds-swatch><ds-text literal class=\"grow\">Pink</ds-text><ds-color><input type=\"color\" value=\"#f5aad1\" aria-label=\"Pink\"></ds-color></ds-row>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 200
  },
  "composer-caption": {
    "title": "Write a photograph caption",
    "hint": "The plain composer grows in whole lines as you write.",
    "html": "<section class=\"specimen\">\n<ds-composer auto-grow max-rows=\"6\" variant=\"plain\"><textarea rows=\"3\" aria-label=\"Photograph caption\">A north-facing window, just before the first visitors arrive.</textarea></ds-composer>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 240
  },
  "file-picker-artwork": {
    "title": "Choose a print file",
    "hint": "The file input stays native. Selection is local to this preview; nothing is uploaded.",
    "html": "<section class=\"specimen\">\n<ds-file-picker label=\"Choose artwork\" secondary><input type=\"file\" accept=\"image/*,.pdf\" aria-label=\"Choose artwork\"></ds-file-picker><ds-gap></ds-gap><ds-text literal tone=\"muted\" size=\"small\">PDF or an image from your device</ds-text>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 200
  },
  "link-reading": {
    "title": "Links within a reading list",
    "hint": "Underlined text links and whole-row links keep their native navigation semantics.",
    "html": "<section class=\"specimen\">\n<ds-row class=\"line\" ><a class=\"ds-link\" href=\"#essay\">Read the essay</a></ds-row><ds-row class=\"line\" ><a class=\"ds-link\" href=\"#sources\">View the sources</a></ds-row><ds-gap></ds-gap><ds-row class=\"line\" href=\"#notes\"><span class=\"mark\"><ds-icon type=\"page\" size=\"large\" aria-hidden=\"true\"></ds-icon></span><ds-text literal >Notes on daylight</ds-text></ds-row>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 220
  },
  "link-actions": {
    "title": "One destination, two treatments",
    "hint": "A quiet text link beside a stronger link button.",
    "html": "<section class=\"specimen\">\n<ds-row class=\"line\" ><a class=\"ds-link\" href=\"#programme\">Programme</a><ds-button primary href=\"#reservation\">Reserve a seat</ds-button></ds-row>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 200
  },
  "tooltip-tools": {
    "title": "A labelled editing toolbar",
    "hint": "Focus or hover the compact controls to read their full action names.",
    "html": "<section class=\"specimen\">\n<ds-row class=\"line\" ><ds-tooltip text=\"Add to selected works\"><ds-button secondary label=\"Add to selected works\"><span class=\"mark\"><ds-icon type=\"star\" size=\"large\" aria-hidden=\"true\"></ds-icon></span></ds-button></ds-tooltip><ds-tooltip text=\"Download original\"><ds-button secondary label=\"Download original\"><span class=\"mark\"><ds-icon type=\"download\" size=\"large\" aria-hidden=\"true\"></ds-icon></span></ds-button></ds-tooltip><ds-tooltip text=\"Move to archive\"><ds-button secondary label=\"Move to archive\"><span class=\"mark\"><ds-icon type=\"archive\" size=\"large\" aria-hidden=\"true\"></ds-icon></span></ds-button></ds-tooltip></ds-row>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 200
  },
  "cycle-format": {
    "title": "Cycle through print formats",
    "hint": "A small set of choices beside the label it changes.",
    "html": "<section class=\"specimen\">\n<ds-row class=\"line\" ><ds-text literal class=\"grow\">Print size</ds-text><ds-cycle values='[\"A5\",\"A4\",\"A3\"]'></ds-cycle></ds-row>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 200
  },
  "cycle-language-row": {
    "title": "Language in a text row",
    "hint": "The language control occupies the same baseline as its label.",
    "html": "<section class=\"specimen\">\n<ds-row class=\"line\" ><ds-text literal class=\"grow\">Reading language</ds-text><ds-cycle type=\"language\" chip></ds-cycle></ds-row>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 200
  },
  "empty-archive": {
    "title": "An archive waiting for its first entry",
    "hint": "An icon, a title, a short explanation and one clear action.",
    "html": "<section class=\"specimen\">\n<ds-empty icon=\"folder\" heading=\"The archive is empty\" text=\"Keep a finished recording here when it is ready.\" literal><ds-button slot=\"actions\" primary>Choose a recording</ds-button></ds-empty>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 220
  },
  "empty-filter": {
    "title": "A search with no match",
    "hint": "A centred empty state keeps its action close to the explanation.",
    "html": "<section class=\"specimen\">\n<ds-empty centered icon=\"search\" heading=\"No photographs from November\" text=\"Try another month or clear the filter.\" literal><ds-button slot=\"actions\" secondary>Clear filter</ds-button></ds-empty>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 240
  },
  "message-proof": {
    "title": "Feedback beside a proof",
    "hint": "Success and warning messages share a face while their tone communicates the state.",
    "html": "<section class=\"specimen\">\n<ds-message tone=\"success\" heading=\"Proof approved\" text=\"The printer can prepare this edition.\" literal></ds-message><ds-gap></ds-gap><ds-message tone=\"warning\" heading=\"Check the cover image\" text=\"The supplied image is smaller than the print size.\" literal dismissible><ds-button slot=\"actions\" secondary>View image</ds-button></ds-message>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 260
  },
  "progress-edition": {
    "title": "Preparing an edition",
    "hint": "A measured quantity, a square count and a step sequence express different kinds of progress.",
    "html": "<section class=\"specimen\">\n<ds-progress label=\"Prints checked\" value=\"36\" max=\"50\" literal></ds-progress><ds-gap></ds-gap><ds-progress label=\"Boxes packed\" value=\"6\" max=\"10\" squares=\"10\" literal></ds-progress><ds-gap></ds-gap><ds-progress current=\"2\" steps='[\"Proof\",\"Print\",\"Bind\",\"Deliver\"]' literal></ds-progress>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 260
  },
  "stat-reading": {
    "title": "A month at the reading room",
    "hint": "Counts, a percentage and a change share a restrained figure hierarchy.",
    "html": "<section class=\"specimen\">\n<div class=\"ds-stats\"><ds-stat label=\"Visits\" value=\"1248\" change=\"0.08\" change-format=\"percent\" caption=\"Since September\" literal></ds-stat><ds-stat label=\"Books borrowed\" value=\"386\" literal></ds-stat><ds-stat label=\"Returned on time\" value=\"0.96\" format=\"percent\" literal></ds-stat></div>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 240
  },
  "stat-print": {
    "title": "A small print run",
    "hint": "Tabular figures and currency formatting stay separate from the labels.",
    "html": "<section class=\"specimen\">\n<div class=\"ds-stats\"><ds-stat label=\"Edition\" value=\"150\" caption=\"Numbered copies\" literal></ds-stat><ds-stat label=\"Price\" value=\"28\" format=\"money\" currency=\"EUR\" literal></ds-stat><ds-stat label=\"Remaining\" value=\"42\" literal></ds-stat></div>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 220
  },
  "gap-editorial": {
    "title": "Space between related sections",
    "hint": "One square separates a title from its details; two squares mark the next section.",
    "html": "<section class=\"specimen\">\n<ds-row class=\"line\" ><ds-text literal strong>Opening hours</ds-text></ds-row><ds-gap size=\"1\"></ds-gap><ds-row class=\"line\" ><ds-text literal >Tuesday to Sunday</ds-text></ds-row><ds-row class=\"line\" ><ds-text literal class=\"mono\">10:00–18:00</ds-text></ds-row><ds-gap size=\"2\"></ds-gap><ds-row class=\"line\" ><ds-text literal tone=\"muted\">Last entry at 17:30</ds-text></ds-row>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 260
  },
  "card-exhibitions": {
    "title": "Two exhibition cards",
    "hint": "An outlined card and a filled card show different emphasis with the same title and label structure.",
    "html": "<section class=\"specimen\">\n<div class=\"columns\"><ds-card variant=\"outlined\" width=\"12\" height=\"12\" href=\"#light\"><span slot=\"label\">Photography</span><span slot=\"title\">Rooms of light</span><ds-text literal wrap tone=\"muted\">18 October — 12 November</ds-text></ds-card><ds-card tone=\"pink\" width=\"12\" height=\"12\" href=\"#sound\"><span slot=\"label\">Sound</span><span slot=\"title\">A place to listen</span><ds-text literal wrap>Recordings from the coast</ds-text></ds-card></div>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 620
  },
  "row-record": {
    "title": "A recording and its actions",
    "hint": "The row opens the recording; its end-slot control remains a separate target.",
    "html": "<section class=\"specimen\">\n<ds-row class=\"line\" interactive><span class=\"mark\"><ds-icon type=\"music\" size=\"large\" aria-hidden=\"true\"></ds-icon></span><ds-text literal class=\"grow\">Morning tide</ds-text><ds-text literal class=\"mono\">04:32</ds-text><ds-button slot=\"end\" secondary label=\"Download recording\"><span class=\"mark\"><ds-icon type=\"download\" size=\"large\" aria-hidden=\"true\"></ds-icon></span></ds-button></ds-row>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 200
  },
  "row-settings": {
    "title": "Aligned setting values",
    "hint": "Short and long labels share a stable value edge.",
    "html": "<section class=\"specimen\">\n<ds-row class=\"line\" ><ds-text literal class=\"grow\">Paper size</ds-text><ds-text literal tone=\"muted\">A4</ds-text></ds-row><ds-row class=\"line\" ><ds-text literal class=\"grow\">Binding</ds-text><ds-text literal tone=\"muted\">Thread sewn</ds-text></ds-row><ds-row class=\"line\" ><ds-text literal class=\"grow\">Copies in this edition</ds-text><ds-text literal tone=\"muted\">150</ds-text></ds-row>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 200
  },
  "accordion-visit": {
    "title": "Planning a visit",
    "hint": "Related questions remain compact until opened.",
    "html": "<section class=\"specimen\">\n<ds-accordion summary=\"When is the gallery open?\"><p slot=\"details\" class=\"ds-text\">Tuesday to Sunday, from 10:00 to 18:00.</p></ds-accordion><ds-accordion summary=\"Can I bring a sketchbook?\"><p slot=\"details\" class=\"ds-text\">Yes. Pencils and small sketchbooks are welcome.</p></ds-accordion><ds-accordion summary=\"Is there a quiet hour?\"><p slot=\"details\" class=\"ds-text\">The first hour on Thursday is kept quiet.</p></ds-accordion>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 100,
    "fit": "content"
  },
  "accordion-record": {
    "title": "Metadata beneath a title",
    "hint": "A heading and duration remain visible while longer notes are tucked away.",
    "html": "<section class=\"specimen\">\n<style>.specimen .notes { margin: 0; }</style><ds-row class=\"line\" ><span class=\"mark\"><ds-icon type=\"music\" size=\"large\" aria-hidden=\"true\"></ds-icon></span><ds-text literal class=\"grow\">Rain in the courtyard</ds-text><ds-text literal class=\"mono\">06:18</ds-text></ds-row><ds-accordion summary=\"Recording notes\"><div slot=\"details\"><ds-row class=\"line\" ><ds-text literal strong>Recorded at dawn</ds-text></ds-row><p class=\"ds-text ds-text--muted notes\">Two microphones beside the east window.</p></div></ds-accordion>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 100,
    "fit": "content"
  },
  "form-workshop": {
    "title": "Reserve a workshop place",
    "hint": "Labels, fields and actions form a small vertical rhythm. Submitting stays inside this preview.",
    "html": "<section class=\"specimen\">\n<ds-form><ds-input label=\"Name\" name=\"name\" value=\"Nia Vale\" required></ds-input><ds-input label=\"Email\" name=\"email\" type=\"email\" placeholder=\"you@example.com\" required></ds-input><ds-gap></ds-gap><ds-button primary type=\"submit\">Reserve a place</ds-button></ds-form>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 320
  },
  "form-search": {
    "title": "Search the archive",
    "hint": "A compact single-purpose form with a query and one action.",
    "html": "<section class=\"specimen\">\n<ds-form><ds-input label=\"Search recordings\" name=\"query\" value=\"rain\"></ds-input><ds-gap size=\"05\"></ds-gap><ds-button primary type=\"submit\"><span class=\"mark\"><ds-icon type=\"search\" size=\"large\" aria-hidden=\"true\"></ds-icon></span>Search</ds-button></ds-form>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 220
  },
  "calendar-journal": {
    "title": "A quiet field journal",
    "hint": "A compact fixed calendar puts day numbers on the small square grid.",
    "html": "<section class=\"specimen\">\n<ds-calendar compact fixed selectable value=\"2026-10-14\"></ds-calendar><ds-row class=\"line\" ><ds-text literal tone=\"muted\" size=\"small\">Field visit: 14 October</ds-text></ds-row>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 300
  },
  "calendar-streak": {
    "title": "A writing streak",
    "hint": "Two months lit by how much was written each day, as a contribution graph.",
    "html": "<section class=\"specimen\">\n<div class=\"columns\"><ds-calendar compact heat fixed no-today month=\"2026-06\" label=\"Writing, June 2026\" literal data-showcase-props=\"{&quot;events&quot;: [{&quot;title&quot;: &quot;1 pages&quot;, &quot;start&quot;: &quot;2026-06-01&quot;, &quot;count&quot;: 1}, {&quot;title&quot;: &quot;3 pages&quot;, &quot;start&quot;: &quot;2026-06-03&quot;, &quot;count&quot;: 3}, {&quot;title&quot;: &quot;2 pages&quot;, &quot;start&quot;: &quot;2026-06-04&quot;, &quot;count&quot;: 2}, {&quot;title&quot;: &quot;4 pages&quot;, &quot;start&quot;: &quot;2026-06-08&quot;, &quot;count&quot;: 4}, {&quot;title&quot;: &quot;6 pages&quot;, &quot;start&quot;: &quot;2026-06-09&quot;, &quot;count&quot;: 6}, {&quot;title&quot;: &quot;2 pages&quot;, &quot;start&quot;: &quot;2026-06-10&quot;, &quot;count&quot;: 2}, {&quot;title&quot;: &quot;5 pages&quot;, &quot;start&quot;: &quot;2026-06-12&quot;, &quot;count&quot;: 5}, {&quot;title&quot;: &quot;2 pages&quot;, &quot;start&quot;: &quot;2026-06-15&quot;, &quot;count&quot;: 2}, {&quot;title&quot;: &quot;7 pages&quot;, &quot;start&quot;: &quot;2026-06-16&quot;, &quot;count&quot;: 7}, {&quot;title&quot;: &quot;9 pages&quot;, &quot;start&quot;: &quot;2026-06-17&quot;, &quot;count&quot;: 9}, {&quot;title&quot;: &quot;3 pages&quot;, &quot;start&quot;: &quot;2026-06-18&quot;, &quot;count&quot;: 3}, {&quot;title&quot;: &quot;1 pages&quot;, &quot;start&quot;: &quot;2026-06-19&quot;, &quot;count&quot;: 1}, {&quot;title&quot;: &quot;4 pages&quot;, &quot;start&quot;: &quot;2026-06-22&quot;, &quot;count&quot;: 4}, {&quot;title&quot;: &quot;8 pages&quot;, &quot;start&quot;: &quot;2026-06-23&quot;, &quot;count&quot;: 8}, {&quot;title&quot;: &quot;12 pages&quot;, &quot;start&quot;: &quot;2026-06-24&quot;, &quot;count&quot;: 12}, {&quot;title&quot;: &quot;6 pages&quot;, &quot;start&quot;: &quot;2026-06-25&quot;, &quot;count&quot;: 6}, {&quot;title&quot;: &quot;2 pages&quot;, &quot;start&quot;: &quot;2026-06-26&quot;, &quot;count&quot;: 2}, {&quot;title&quot;: &quot;3 pages&quot;, &quot;start&quot;: &quot;2026-06-29&quot;, &quot;count&quot;: 3}, {&quot;title&quot;: &quot;5 pages&quot;, &quot;start&quot;: &quot;2026-06-30&quot;, &quot;count&quot;: 5}]}\"></ds-calendar><ds-calendar compact heat fixed no-today month=\"2026-07\" label=\"Writing, July 2026\" literal data-showcase-props=\"{&quot;events&quot;: [{&quot;title&quot;: &quot;2 pages&quot;, &quot;start&quot;: &quot;2026-07-01&quot;, &quot;count&quot;: 2}, {&quot;title&quot;: &quot;6 pages&quot;, &quot;start&quot;: &quot;2026-07-02&quot;, &quot;count&quot;: 6}, {&quot;title&quot;: &quot;1 pages&quot;, &quot;start&quot;: &quot;2026-07-04&quot;, &quot;count&quot;: 1}, {&quot;title&quot;: &quot;3 pages&quot;, &quot;start&quot;: &quot;2026-07-07&quot;, &quot;count&quot;: 3}, {&quot;title&quot;: &quot;9 pages&quot;, &quot;start&quot;: &quot;2026-07-08&quot;, &quot;count&quot;: 9}, {&quot;title&quot;: &quot;4 pages&quot;, &quot;start&quot;: &quot;2026-07-09&quot;, &quot;count&quot;: 4}, {&quot;title&quot;: &quot;1 pages&quot;, &quot;start&quot;: &quot;2026-07-11&quot;, &quot;count&quot;: 1}, {&quot;title&quot;: &quot;7 pages&quot;, &quot;start&quot;: &quot;2026-07-12&quot;, &quot;count&quot;: 7}, {&quot;title&quot;: &quot;10 pages&quot;, &quot;start&quot;: &quot;2026-07-13&quot;, &quot;count&quot;: 10}, {&quot;title&quot;: &quot;2 pages&quot;, &quot;start&quot;: &quot;2026-07-14&quot;, &quot;count&quot;: 2}, {&quot;title&quot;: &quot;5 pages&quot;, &quot;start&quot;: &quot;2026-07-17&quot;, &quot;count&quot;: 5}, {&quot;title&quot;: &quot;3 pages&quot;, &quot;start&quot;: &quot;2026-07-18&quot;, &quot;count&quot;: 3}, {&quot;title&quot;: &quot;11 pages&quot;, &quot;start&quot;: &quot;2026-07-19&quot;, &quot;count&quot;: 11}, {&quot;title&quot;: &quot;1 pages&quot;, &quot;start&quot;: &quot;2026-07-20&quot;, &quot;count&quot;: 1}, {&quot;title&quot;: &quot;2 pages&quot;, &quot;start&quot;: &quot;2026-07-23&quot;, &quot;count&quot;: 2}, {&quot;title&quot;: &quot;8 pages&quot;, &quot;start&quot;: &quot;2026-07-24&quot;, &quot;count&quot;: 8}, {&quot;title&quot;: &quot;6 pages&quot;, &quot;start&quot;: &quot;2026-07-25&quot;, &quot;count&quot;: 6}, {&quot;title&quot;: &quot;4 pages&quot;, &quot;start&quot;: &quot;2026-07-26&quot;, &quot;count&quot;: 4}, {&quot;title&quot;: &quot;1 pages&quot;, &quot;start&quot;: &quot;2026-07-29&quot;, &quot;count&quot;: 1}, {&quot;title&quot;: &quot;3 pages&quot;, &quot;start&quot;: &quot;2026-07-30&quot;, &quot;count&quot;: 3}, {&quot;title&quot;: &quot;9 pages&quot;, &quot;start&quot;: &quot;2026-07-31&quot;, &quot;count&quot;: 9}]}\"></ds-calendar></div><ds-row class=\"line\" ><ds-text literal tone=\"muted\" size=\"small\">Pages written each day: the busier the day, the stronger it is lit.</ds-text></ds-row>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 220
  },
  "calendar-visit": {
    "title": "Arrival and departure",
    "hint": "One picker chooses the stay: arrival and departure in the same month, written as one value.",
    "html": "<section class=\"specimen\">\n<ds-calendar picker label=\"Arrival and departure\" literal name=\"stay\" value=\"2026-11-04/2026-11-07\"></ds-calendar>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 100,
    "fit": "content"
  },
  "carousel-quotes": {
    "title": "Three observations",
    "hint": "Text slides keep the same measure while their lengths differ.",
    "html": "<section class=\"specimen\">\n<ds-carousel label=\"Field journal observations\" literal buttons><blockquote style=\"margin:0;min-height:calc(5 * var(--ds-unit))\"><ds-text literal wrap>The room changes before anyone moves.</ds-text><ds-gap size=\"05\"></ds-gap><ds-text literal size=\"small\" tone=\"muted\">North window, 08:10</ds-text></blockquote><blockquote style=\"margin:0;min-height:calc(5 * var(--ds-unit))\"><ds-text literal wrap>Rain makes the courtyard sound larger.</ds-text><ds-gap size=\"05\"></ds-gap><ds-text literal size=\"small\" tone=\"muted\">Courtyard, 11:45</ds-text></blockquote><blockquote style=\"margin:0;min-height:calc(5 * var(--ds-unit))\"><ds-text literal wrap>By evening the walls have borrowed the sky.</ds-text><ds-gap size=\"05\"></ds-gap><ds-text literal size=\"small\" tone=\"muted\">West room, 17:20</ds-text></blockquote></ds-carousel>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 280
  },
  "header-gallery": {
    "title": "An exhibition header",
    "hint": "A short identity, navigation and a single action share the top row.",
    "html": "<section class=\"specimen\">\n<ds-header brand=\"North Window\" href=\"#home\" literal><a slot=\"nav\" href=\"#exhibitions\">Exhibitions</a><a slot=\"nav\" href=\"#visit\">Visit</a><ds-button slot=\"actions\" primary>Reserve a visit</ds-button></ds-header>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 200
  },
  "footer-journal": {
    "title": "A journal footer",
    "hint": "Quiet grouped links under a short editorial identity.",
    "html": "<section class=\"specimen\">\n<ds-footer brand=\"Field Journal\" tagline=\"Notes from places worth noticing\" literal year=\"2026\" columns='[{\"heading\":\"Read\",\"links\":[{\"label\":\"Essays\",\"href\":\"#essays\"},{\"label\":\"Archive\",\"href\":\"#archive\"}]},{\"heading\":\"Visit\",\"links\":[{\"label\":\"Reading room\",\"href\":\"#room\"},{\"label\":\"Contact\",\"href\":\"#contact\"}]}]'></ds-footer>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 320
  },
  "document-guide": {
    "title": "A visitor guide",
    "hint": "Headings, paragraphs and a definition list form a readable document.",
    "html": "<section class=\"specimen\">\n<ds-document><h1>Before your visit</h1><p>A few details for a quiet afternoon at the gallery.</p><h2>Arriving</h2><p>The entrance is through the courtyard. Leave coats beside the reading room.</p><h2>Opening hours</h2><dl class=\"ds-definitions\"><dt>Tuesday–Friday</dt><dd>10:00–18:00</dd><dt>Weekend</dt><dd>11:00–17:00</dd></dl></ds-document>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 420
  },
  "container-reading": {
    "title": "A contained introduction",
    "hint": "The container holds a short reading measure as the viewport changes.",
    "html": "<section class=\"specimen\">\n<ds-container><ds-text literal size=\"display\">A room for reading</ds-text><ds-gap></ds-gap><ds-text literal wrap>A small collection of essays, field notes and conversations. Take a seat, choose a page and stay a while.</ds-text></ds-container>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 240
  },
  "page-catalogue": {
    "title": "A simple catalogue page",
    "hint": "A page title, quiet count and a few aligned rows establish hierarchy.",
    "html": "<section class=\"specimen\">\n<ds-page><ds-row class=\"line\" auto><ds-text literal size=\"display\">New acquisitions</ds-text></ds-row><ds-gap></ds-gap><ds-row class=\"line\" ><ds-text literal tone=\"muted\" size=\"small\">Three additions this week</ds-text></ds-row><ds-list><ds-row class=\"line\" ><span class=\"mark\"><ds-icon type=\"page\" size=\"large\" aria-hidden=\"true\"></ds-icon></span><ds-text literal class=\"grow\">A book of windows</ds-text><ds-text literal class=\"mono\">2026</ds-text></ds-row><ds-row class=\"line\" ><span class=\"mark\"><ds-icon type=\"page\" size=\"large\" aria-hidden=\"true\"></ds-icon></span><ds-text literal class=\"grow\">Along the river</ds-text><ds-text literal class=\"mono\">2025</ds-text></ds-row><ds-row class=\"line\" ><span class=\"mark\"><ds-icon type=\"page\" size=\"large\" aria-hidden=\"true\"></ds-icon></span><ds-text literal class=\"grow\">The listening room</ds-text><ds-text literal class=\"mono\">2026</ds-text></ds-row></ds-list></ds-page>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 300
  },
  "panel-inspector": {
    "title": "A photograph inspector",
    "hint": "The header and footer stay in place while metadata fills the body.",
    "html": "<section class=\"specimen\">\n<ds-panel><ds-row class=\"line\" slot=\"header\"><ds-text literal strong>Photograph details</ds-text></ds-row><ds-row class=\"line\" ><ds-text literal class=\"grow\">Reference</ds-text><ds-text literal class=\"mono\" tone=\"muted\">NW-024</ds-text></ds-row><ds-row class=\"line\" ><ds-text literal class=\"grow\">Edition</ds-text><ds-text literal class=\"mono\" tone=\"muted\">024 / 100</ds-text></ds-row><ds-row class=\"line\" ><ds-text literal class=\"grow\">Width</ds-text><ds-text literal class=\"mono\" tone=\"muted\">240 mm</ds-text></ds-row><ds-row class=\"line\" ><ds-text literal class=\"grow\">Height</ds-text><ds-text literal class=\"mono\" tone=\"muted\">300 mm</ds-text></ds-row><ds-row class=\"line\" ><ds-text literal class=\"grow\">Paper</ds-text><ds-text literal class=\"mono\" tone=\"muted\">Cotton</ds-text></ds-row><ds-row class=\"line\" ><ds-text literal class=\"grow\">Year</ds-text><ds-text literal class=\"mono\" tone=\"muted\">2026</ds-text></ds-row><ds-row class=\"line\" slot=\"footer\"><ds-button secondary>Close</ds-button><ds-button primary>Apply</ds-button></ds-row></ds-panel>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 300
  },
  "panel-queue": {
    "title": "A compact review panel",
    "hint": "A stable title and action frame a short queue.",
    "html": "<section class=\"specimen\">\n<ds-panel><ds-row class=\"line\" slot=\"header\"><ds-text literal strong>Ready for review</ds-text></ds-row><ds-list><ds-row class=\"line\" ><span class=\"mark\"><ds-icon type=\"page\" size=\"large\" aria-hidden=\"true\"></ds-icon></span><ds-text literal >Cover proof</ds-text></ds-row><ds-row class=\"line\" ><span class=\"mark\"><ds-icon type=\"page\" size=\"large\" aria-hidden=\"true\"></ds-icon></span><ds-text literal >Wall labels</ds-text></ds-row><ds-row class=\"line\" ><span class=\"mark\"><ds-icon type=\"page\" size=\"large\" aria-hidden=\"true\"></ds-icon></span><ds-text literal >Visitor guide</ds-text></ds-row></ds-list><ds-row class=\"line\" slot=\"footer\"><ds-text literal class=\"grow\" tone=\"muted\">3 documents</ds-text><ds-button primary>Review</ds-button></ds-row></ds-panel>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 300
  },
  "grid-records": {
    "title": "Rows against the paper grid",
    "hint": "The visible grid makes the shared row pitch and icon columns easy to inspect.",
    "html": "<section class=\"specimen\">\n<div style=\"position:relative;isolation:isolate;padding:var(--ds-unit)\"><ds-grid contained></ds-grid><div style=\"position:relative\"><ds-row class=\"line\" ><span class=\"mark\"><ds-icon type=\"page\" size=\"large\" aria-hidden=\"true\"></ds-icon></span><ds-text literal >North window</ds-text></ds-row><ds-row class=\"line\" ><span class=\"mark\"><ds-icon type=\"page\" size=\"large\" aria-hidden=\"true\"></ds-icon></span><ds-text literal >East courtyard</ds-text></ds-row><ds-row class=\"line\" ><span class=\"mark\"><ds-icon type=\"page\" size=\"large\" aria-hidden=\"true\"></ds-icon></span><ds-text literal >Reading room</ds-text></ds-row><ds-row class=\"line\" ><span class=\"mark\"><ds-icon type=\"page\" size=\"large\" aria-hidden=\"true\"></ds-icon></span><ds-text literal >West staircase</ds-text></ds-row></div></div>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 240
  },
  "bento-layers": {
    "title": "Four layers",
    "hint": "A flow bento: three columns sharing the width, tiles one or two columns wide, half a square apart.",
    "html": "<ds-bento>\n  <ds-card data-span=\"2\" tone=\"yellow\"><span slot=\"label\">Root</span><span slot=\"title\">One foundation</span>Colour, type and scale for everything after.</ds-card>\n  <ds-card tone=\"apple-green\"><span slot=\"label\">Core</span><span slot=\"title\">Small pieces</span>A control, a value, a state.</ds-card>\n  <ds-card tone=\"sharp-blue\"><span slot=\"label\">Unit</span><span slot=\"title\">Together</span>Rows, lists and forms.</ds-card>\n  <ds-card data-span=\"2\" tone=\"pink\"><span slot=\"label\">Page</span><span slot=\"title\">Everything in its place</span>Navigation, work and context on one grid.</ds-card>\n</ds-bento>",
    "height": 460
  },
  "bento-squares": {
    "title": "Tiles on squares",
    "hint": "A squares bento: each tile placed on whole squares a square apart, its surface reaching a quarter square towards its neighbours, so the tiles stand half a square apart.",
    "html": "<ds-bento squares columns=\"32\">\n  <ds-card data-place=\"0 0 15 7\"><span slot=\"label\">Archive</span><span slot=\"title\">Everything kept</span></ds-card>\n  <ds-card data-place=\"16 0 16 15\" tone=\"yellow\"><span slot=\"label\">Lists</span><span slot=\"title\">Every list in one place</span>Placed on whole squares, half a square from the tiles beside it.</ds-card>\n  <ds-card data-place=\"0 8 15 7\" tone=\"sharp-blue\"><span slot=\"label\">Home</span><span slot=\"title\">Today first</span></ds-card>\n</ds-bento>",
    "height": 380
  },
  "table-stock": {
    "title": "Print stock",
    "hint": "Text columns and numeric columns share rows; figures align at the end of their columns.",
    "html": "<section class=\"specimen\">\n<ds-table label=\"Print stock\" sticky data-showcase-props='{\"data\":[{\"edition\":\"North window\",\"printed\":150,\"remaining\":42},{\"edition\":\"Courtyard\",\"printed\":80,\"remaining\":17},{\"edition\":\"Reading room\",\"printed\":120,\"remaining\":63}],\"columns\":[\"edition\",\"printed\",\"remaining\"],\"footer\":{}}'></ds-table>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 240,
    "script": "document.querySelectorAll('[data-showcase-props]').forEach(element => {\n  Object.assign(element, JSON.parse(element.dataset.showcaseProps));\n});"
  },
  "table-sheet": {
    "title": "A year of print sales",
    "hint": "A sheet: 26 lettered columns and 500 numbered rows, every cell four squares by one; the letters, labels and row numbers stay while it scrolls both ways. Drag a row by the grip on its number (hold it on a touch screen), or press Alt+↑ or Alt+↓ on the grip; the rows renumber.",
    "html": "<ds-table sheet reorderable label=\"A year of print sales\" style=\"--ds-table-height: calc(20 * 20px * var(--sf, 1))\"></ds-table>",
    "height": 440,
    "script": "const table = document.querySelector('ds-table[sheet]');\nconst months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];\nconst names = ['Atlas', 'Comet', 'Harbour', 'Linen', 'Meadow', 'North', 'Orchard', 'Pebble', 'Quarry', 'Ridge', 'Signal', 'Tide'];\nconst kinds = ['poster', 'print', 'card', 'zine', 'book', 'map'];\nconst places = ['Kyoto', 'Oslo', 'Lisbon', 'Aarhus', 'Porto', 'Lyon'];\nlet seed = 7;\nconst next = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;\ntable.columns = [\n  { key: 'item', label: 'Item' }, { key: 'kind', label: 'Kind' },\n  ...months.map(month => ({ key: month, label: month, numeric: true })),\n  { key: 'total', label: 'Total', numeric: true }, { key: 'price', label: 'Price', numeric: true },\n  { key: 'revenue', label: 'Revenue', numeric: true }, { key: 'stock', label: 'Stock', numeric: true },\n  { key: 'reorder', label: 'Reorder', numeric: true }, { key: 'cost', label: 'Cost', numeric: true },\n  { key: 'margin', label: 'Margin', numeric: true }, { key: 'place', label: 'Printed in' },\n  { key: 'paper', label: 'Paper' }, { key: 'code', label: 'Code' },\n];\ntable.data = Array.from({ length: 500 }, (_, index) => {\n  const row = { item: `${names[index % names.length]} ${Math.floor(index / names.length) + 1}`, kind: kinds[index % kinds.length] };\n  let total = 0;\n  for (const month of months) { const sold = Math.round(next() * 240); row[month] = sold; total += sold; }\n  const price = 8 + Math.round(next() * 72);\n  const cost = Math.round(price * (0.3 + next() * 0.3));\n  return Object.assign(row, { total, price, revenue: total * price, stock: Math.round(next() * 900), reorder: 50 + Math.round(next() * 150), cost, margin: price - cost, place: places[index % places.length], paper: next() > 0.5 ? 'Cotton 300g' : 'Recycled 170g', code: `PS-${String(index + 1).padStart(4, '0')}` });\n});\nconst sum = key => table.data.reduce((all, row) => all + row[key], 0);\ntable.footer = { item: 'Total', ...Object.fromEntries(months.map(month => [month, sum(month)])), total: sum('total'), revenue: sum('revenue'), stock: sum('stock') };"
  },
  "table-loans": {
    "title": "Reading room loans",
    "hint": "Text columns and numeric columns share rows; figures align at the end of their columns.",
    "html": "<section class=\"specimen\">\n<ds-table label=\"Reading room loans\" sticky data-showcase-props='{\"data\":[{\"title\":\"Along the river\",\"copies\":6,\"borrowed\":4},{\"title\":\"The listening room\",\"copies\":3,\"borrowed\":1},{\"title\":\"A book of windows\",\"copies\":8,\"borrowed\":8}],\"columns\":[\"title\",\"copies\",\"borrowed\"],\"footer\":{}}'></ds-table>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 240,
    "script": "document.querySelectorAll('[data-showcase-props]').forEach(element => {\n  Object.assign(element, JSON.parse(element.dataset.showcaseProps));\n});"
  },
  "sidebar-gallery": {
    "title": "An exhibition index",
    "hint": "Icons, nested labels and counts share compact navigation rows.",
    "html": "<section class=\"specimen\">\n<ds-sidebar label=\"Exhibition navigation\" data-showcase-props='{\"items\":[{\"id\":\"all\",\"label\":\"All exhibitions\",\"icon\":\"image\",\"meta\":\"12\",\"current\":true},{\"id\":\"now\",\"label\":\"On view\",\"expanded\":true},{\"id\":\"light\",\"label\":\"Rooms of light\",\"depth\":1,\"meta\":\"24\"},{\"id\":\"sound\",\"label\":\"A place to listen\",\"depth\":1,\"meta\":\"8\"},{\"id\":\"archive\",\"label\":\"Archive\",\"icon\":\"folder\"}]}'></ds-sidebar>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 240,
    "script": "document.querySelectorAll('[data-showcase-props]').forEach(element => {\n  Object.assign(element, JSON.parse(element.dataset.showcaseProps));\n});"
  },
  "matrix-workshop": {
    "title": "Workshop equipment",
    "hint": "A small matrix compares materials across activities, using marks rather than repeated words.",
    "html": "<section class=\"specimen\">\n<ds-matrix label=\"Workshop materials\" literal data-showcase-props='{\"groups\":[{\"id\":\"materials\",\"label\":\"Materials\"}],\"columns\":[{\"id\":\"paper\",\"label\":\"Paper\",\"group\":\"materials\"},{\"id\":\"ink\",\"label\":\"Ink\",\"group\":\"materials\"},{\"id\":\"cloth\",\"label\":\"Cloth\",\"group\":\"materials\"}],\"rows\":[{\"id\":\"print\",\"label\":\"Printmaking\"},{\"id\":\"book\",\"label\":\"Bookbinding\"},{\"id\":\"draw\",\"label\":\"Drawing\"}],\"cells\":[{\"row\":\"print\",\"column\":\"paper\",\"mark\":\"fill\"},{\"row\":\"print\",\"column\":\"ink\",\"mark\":\"fill\"},{\"row\":\"book\",\"column\":\"paper\",\"mark\":\"fill\"},{\"row\":\"book\",\"column\":\"cloth\",\"mark\":\"fill\"},{\"row\":\"draw\",\"column\":\"paper\",\"mark\":\"fill\"}],\"marks\":[{\"mark\":\"fill\",\"label\":\"Included\"}]}'></ds-matrix>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 280,
    "script": "document.querySelectorAll('[data-showcase-props]').forEach(element => {\n  Object.assign(element, JSON.parse(element.dataset.showcaseProps));\n});"
  },
  "chart-attendance": {
    "title": "Visitors through the week",
    "hint": "A line and its summary share a quiet frame; values are fictional.",
    "html": "<section class=\"specimen\">\n<ds-row class=\"line\" ><ds-text literal strong>Daily visitors</ds-text></ds-row><ds-chart kind=\"line\" rows=\"8\" aria-label=\"Daily visitors, from 32 to 84\" data-showcase-props='{\"data\":[{\"time\":0,\"value\":32},{\"time\":86400,\"value\":48},{\"time\":172800,\"value\":43},{\"time\":259200,\"value\":67},{\"time\":345600,\"value\":84},{\"time\":432000,\"value\":76},{\"time\":518400,\"value\":52}]}'></ds-chart><ds-row class=\"line\" ><ds-text literal tone=\"muted\" size=\"small\">Busiest day: Friday, 84 visitors</ds-text></ds-row>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 300,
    "script": "document.querySelectorAll('[data-showcase-props]').forEach(element => {\n  Object.assign(element, JSON.parse(element.dataset.showcaseProps));\n});"
  },
  "chart-materials": {
    "title": "Materials used",
    "hint": "Short bars compare quantities, with labels on the same grid.",
    "html": "<section class=\"specimen\">\n<ds-bars rows=\"6\" aria-label=\"Paper 48, cloth 26, board 34\" data-showcase-props='{\"items\":[{\"label\":\"Paper\",\"value\":48},{\"label\":\"Cloth\",\"value\":26},{\"label\":\"Board\",\"value\":34}]}'></ds-bars>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 260,
    "script": "document.querySelectorAll('[data-showcase-props]').forEach(element => {\n  Object.assign(element, JSON.parse(element.dataset.showcaseProps));\n});"
  },
  "tokens-tags": {
    "title": "Keywords for a recording",
    "hint": "Removable labels and the native text field share one wrapping line.",
    "html": "<section class=\"specimen\">\n<label for=\"recording-tags\">Keywords</label><ds-token-field separators=\",;\"><ds-token value=\"rain\" label=\"Rain\" remove-label=\"Remove Rain\"></ds-token><ds-token value=\"courtyard\" label=\"Courtyard\" remove-label=\"Remove Courtyard\"></ds-token><input id=\"recording-tags\" placeholder=\"Add a keyword\"></ds-token-field>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 180
  },
  "select-actions": {
    "title": "Actions from a button",
    "hint": "Press More: the menu stands half a square below its button, fits its words on whole squares, and closes when an action is chosen.",
    "html": "<section class=\"specimen\">\n<ds-row class=\"line\"><ds-text literal class=\"grow\">Rain over the courtyard</ds-text><ds-button id=\"recording-more\" secondary icon label=\"More actions\"><ds-icon type=\"more\" aria-hidden=\"true\"></ds-icon></ds-button></ds-row>\n<ds-select for=\"recording-more\" aria-label=\"Recording actions\"><ds-text data-ds-menu-label tone=\"muted\" literal>Recording</ds-text><ds-button menu-item role=\"menuitem\"><span class=\"mark\"><ds-icon type=\"download\" size=\"large\" aria-hidden=\"true\"></ds-icon></span>Download</ds-button><ds-button menu-item role=\"menuitem\"><span class=\"mark\"><ds-icon type=\"duplicate\" size=\"large\" aria-hidden=\"true\"></ds-icon></span>Duplicate</ds-button><ds-button menu-item role=\"menuitem\"><span class=\"mark\"><ds-icon type=\"archive\" size=\"large\" aria-hidden=\"true\"></ds-icon></span>Archive</ds-button><hr data-ds-menu-separator><ds-button menu-item role=\"menuitem\" danger><span class=\"mark\"><ds-icon type=\"delete\" size=\"large\" aria-hidden=\"true\"></ds-icon></span>Delete</ds-button></ds-select>\n</section>\n<style>\\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen .notes { width: calc(16 * var(--cell)); }\n</style>",
    "height": 260
  },
  "select-field-list": {
    "title": "A field's choices, in place of the picker",
    "hint": "Press the field: one square a choice, the chosen one checked, groups headed by their label, details and shortcuts on the row.",
    "html": "<section class=\"specimen\">\n<label>Paper <ds-select><select aria-label=\"Paper\"><option data-details=\"Uncoated\" data-shortcut=\"mod+1\">Natural</option><option selected data-details=\"Smooth\" data-shortcut=\"mod+2\">Bright white</option><optgroup label=\"Recycled\"><option data-icon=\"page\" data-details=\"Grey fleck\">Newsprint</option><option data-icon=\"page\" disabled>Kraft</option></optgroup></select></ds-select></label>\n</section>\n<style>\\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen .notes { width: calc(16 * var(--cell)); }\n</style>",
    "height": 260
  },
  "context-notes": {
    "title": "A note's actions where the pointer is",
    "hint": "Right-click a note, press and hold one, or press Shift+F10: Ezo's gap face, a pixel between rows and two between groups, the page showing through.",
    "html": "<section class=\"specimen\">\n<div id=\"notes\" class=\"notes\"><ds-row class=\"line note\" tabindex=\"0\" aria-haspopup=\"menu\"><span class=\"mark\"><ds-icon type=\"page\" size=\"large\" aria-hidden=\"true\"></ds-icon></span><ds-text literal>Opening night plan</ds-text></ds-row><ds-row class=\"line note\" tabindex=\"0\" aria-haspopup=\"menu\"><span class=\"mark\"><ds-icon type=\"page\" size=\"large\" aria-hidden=\"true\"></ds-icon></span><ds-text literal>Lighting cues</ds-text></ds-row><ds-row class=\"line note\" tabindex=\"0\" aria-haspopup=\"menu\"><span class=\"mark\"><ds-icon type=\"page\" size=\"large\" aria-hidden=\"true\"></ds-icon></span><ds-text literal>Guest list</ds-text></ds-row></div>\n<ds-context for=\"notes\" context-selector=\".note\" aria-label=\"Note actions\"><button role=\"menuitem\">Rename<ds-icon type=\"pen\" aria-hidden=\"true\"></ds-icon></button><button role=\"menuitem\">Duplicate<ds-icon type=\"duplicate\" aria-hidden=\"true\"></ds-icon></button><button role=\"menuitem\">Star<ds-icon type=\"star\" aria-hidden=\"true\"></ds-icon></button><hr data-ds-menu-separator><button role=\"menuitem\">Archive<ds-icon type=\"archive\" aria-hidden=\"true\"></ds-icon></button><button role=\"menuitem\" data-danger>Delete<ds-icon type=\"delete\" aria-hidden=\"true\"></ds-icon></button></ds-context>\n</section>\n<style>\\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen .notes { width: calc(16 * var(--cell)); }\n</style>",
    "height": 220
  },
  "context-bar": {
    "title": "A bar over the words chosen",
    "hint": "Select words in the sentence: the bar stands half a square above them, a cell a square for each icon, and the caret stays in the writing.",
    "html": "<section class=\"specimen\">\n<p class=\"passage\">The rehearsal starts at seven. <span class=\"chosen\">Bring the lighting cues</span> and the guest list, and leave the coats by the door.</p>\n<ds-context bar aria-label=\"Format\"><button role=\"menuitem\" aria-label=\"Bold\" data-keep-open><ds-icon type=\"bold\" aria-hidden=\"true\"></ds-icon></button><button role=\"menuitem\" aria-label=\"Italic\" data-keep-open><ds-icon type=\"italic\" aria-hidden=\"true\"></ds-icon></button><button role=\"menuitem\" aria-label=\"Strikethrough\" data-keep-open><ds-icon type=\"strike\" aria-hidden=\"true\"></ds-icon></button><button role=\"menuitem\" aria-label=\"Code\" data-keep-open><ds-icon type=\"code\" aria-hidden=\"true\"></ds-icon></button><button role=\"menuitem\" aria-label=\"Link\" data-keep-open><ds-icon type=\"link\" aria-hidden=\"true\"></ds-icon></button><hr data-ds-menu-separator><button role=\"menuitem\" data-keep-open>Text<ds-icon type=\"chevron-down\" aria-hidden=\"true\"></ds-icon></button></ds-context>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .passage { width: calc(16 * var(--cell)); margin: calc(3 * var(--cell)) 0 0; line-height: var(--cell); }\n.specimen .chosen { background: color-mix(in srgb, currentColor 15%, transparent); border-radius: 2px; }\n</style>",
    "height": 200
  },
  "menu-recording": {
    "title": "Actions for a recording",
    "hint": "A Select's actions pair real icons and short labels on one-square rows.",
    "html": "<section class=\"specimen\">\n<ds-select role=\"menu\" aria-label=\"Recording actions\"><ds-button secondary><span class=\"mark\"><ds-icon type=\"download\" size=\"large\" aria-hidden=\"true\"></ds-icon></span>Download</ds-button><ds-button secondary><span class=\"mark\"><ds-icon type=\"duplicate\" size=\"large\" aria-hidden=\"true\"></ds-icon></span>Duplicate</ds-button><ds-button secondary><span class=\"mark\"><ds-icon type=\"archive\" size=\"large\" aria-hidden=\"true\"></ds-icon></span>Archive</ds-button></ds-select>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 240
  },
  "dialog-proof": {
    "title": "Review a proof",
    "hint": "An inline modeless dialog demonstrates its title, body and action alignment.",
    "html": "<section class=\"specimen\">\n<ds-overlay open non-modal><dialog aria-labelledby=\"proof-title\"><h2 id=\"proof-title\" data-ds-overlay=\"title\">Approve this proof?</h2><p>The printer will use this version for the edition.</p><div data-ds-overlay=\"actions\"><ds-button secondary data-ds-overlay-dismiss>Keep reviewing</ds-button><ds-button primary data-ds-overlay-dismiss>Approve</ds-button></div></dialog></ds-overlay>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 300
  },
  "progress-reading": {
    "title": "Reading position",
    "hint": "A short progress bar and its plain-language label.",
    "html": "<section class=\"specimen\">\n<ds-row class=\"line\" ><ds-text literal class=\"grow\">Chapter 4 of 12</ds-text><ds-text literal class=\"mono\">33%</ds-text></ds-row><ds-progress label=\"Book read\" value=\"4\" max=\"12\" literal></ds-progress>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 200
  },
  "empty-complete": {
    "title": "Everything reviewed",
    "hint": "An empty state can mark completion as well as absence.",
    "html": "<section class=\"specimen\">\n<ds-empty icon=\"check\" heading=\"All proofs reviewed\" text=\"There is nothing else waiting for your attention.\" literal centered></ds-empty>\n</section>\n<style>\n.specimen { width: 100%; min-width: 0; --cell: calc(20px * var(--sf, 1)); }\n.specimen .line { width: 100%; }\n.specimen .grow { flex: 1; min-width: 0; }\n.specimen .muted { color: var(--ds-text-color-muted); }\n.specimen .mono { --ds-typeface-regular: var(--ds-typeface-mono); font-variant-numeric: tabular-nums; }\n.specimen .value { width: calc(4 * var(--cell)); text-align: right; }\n.specimen .mark { display: inline-flex; align-items: flex-end; width: var(--cell); height: var(--ds-control-height); flex: 0 0 var(--cell); }\n.specimen .columns { display: flex; flex-wrap: wrap; gap: var(--cell); }\n.specimen .columns > * { min-width: 0; }\n.specimen fieldset { border: 0; padding: 0; margin: 0; }\n.specimen legend { padding: 0; }\n.specimen label { display: flex; align-items: flex-end; gap: calc(var(--cell) / 2); min-height: var(--cell); }\n.specimen ds-panel { height: calc(10 * var(--cell)); }\n</style>",
    "height": 200
  }
};

export const SHOWCASE_PAGES: Record<string, string[]> = {
  "2-core/button": [
    "button-publishing",
    "button-navigation"
  ],
  "2-core/text": [
    "text-editorial",
    "text-statuses"
  ],
  "2-core/icon": [
    "icon-labelled"
  ],
  "2-core/avatar": [
    "avatar-credits",
    "avatar-scale"
  ],
  "2-core/badge": [
    "badge-records",
    "badge-actions"
  ],
  "2-core/input": [
    "input-address",
    "input-validation"
  ],
  "2-core/checkbox": [
    "choice-checklist"
  ],
  "2-core/switch": [
    "choice-switches"
  ],
  "2-core/radio": [
    "radio-editions"
  ],
  "3-unit/select": [
    "select-actions",
    "select-field-list",
    "select-print",
    "select-sort",
    "menu-recording"
  ],
  "3-unit/context": [
    "context-notes",
    "context-bar"
  ],
  "2-core/color": [
    "color-palette"
  ],
  "2-core/composer": [
    "composer-caption"
  ],
  "2-core/file-picker": [
    "file-picker-artwork"
  ],
  "2-core/link": [
    "link-reading",
    "link-actions"
  ],
  "2-core/tooltip": [
    "tooltip-tools"
  ],
  "2-core/cycle": [
    "cycle-format",
    "cycle-language-row"
  ],
  "2-core/empty": [
    "empty-archive",
    "empty-filter",
    "empty-complete"
  ],
  "2-core/message": [
    "message-proof"
  ],
  "2-core/progress": [
    "progress-edition",
    "progress-reading"
  ],
  "2-core/stat": [
    "stat-reading",
    "stat-print"
  ],
  "2-core/gap": [
    "gap-editorial"
  ],
  "2-core/card": [
    "card-exhibitions"
  ],
  "3-unit/row": [
    "row-record",
    "row-settings"
  ],
  "3-unit/accordion": [
    "accordion-visit",
    "accordion-record"
  ],
  "3-unit/form": [
    "form-workshop",
    "form-search"
  ],
  "3-unit/calendar": [
    "calendar-journal",
    "calendar-streak",
    "calendar-visit"
  ],
  "3-unit/carousel": [
    "carousel-quotes"
  ],
  "4-page/header": [
    "header-gallery"
  ],
  "4-page/footer": [
    "footer-journal"
  ],
  "4-page/document": [
    "document-guide"
  ],
  "4-page/container": [
    "container-reading"
  ],
  "4-page/page": [
    "page-catalogue"
  ],
  "4-page/panel": [
    "panel-inspector",
    "panel-queue"
  ],
  "4-page/grid": [
    "grid-records"
  ],
  "3-unit/table": [
    "table-stock",
    "table-loans",
    "table-sheet"
  ],
  "3-unit/bento": [
    "bento-layers",
    "bento-squares"
  ],
  "3-unit/sidebar": [
    "sidebar-gallery"
  ],
  "3-unit/matrix": [
    "matrix-workshop"
  ],
  "2-core/chart": [
    "chart-attendance",
    "chart-materials"
  ],
  "3-unit/token-field": [
    "tokens-tags"
  ],
  "4-page/overlay": [
    "dialog-proof"
  ]
};

for (const example of Object.values(SHOWCASE_EXAMPLES)) {
  if (example.html.includes("data-showcase-props") || example.html.includes("ds-token-field"))
    example.script = `(${mountShowcase.toString()})(document);`;
}
