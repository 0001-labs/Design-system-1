import type { ComponentExample } from './component-examples';
export const LIST_EXAMPLES: Record<string, ComponentExample> = {
  'list-records': {
    title: 'Payments under their day', hint: 'A heading names each group; a picture on its square, the name, a tag and the amount at the end, no lines between the rows. Narrow the window to see a long name fade.', height: 260,
    html: `<style>
.records { display: grid; gap: var(--ds-unit); width: 100%; max-width: calc(28 * var(--ds-unit)); --ds-row-padding: 0px; }
</style>
<div class="records">
  <ds-list heading="Yesterday">
    <ds-row href="#coop"><ds-avatar shape="square" icon="cart" color="var(--ds-apple-green)"></ds-avatar><ds-text class="ds-row__name" literal>Co-op fresh market, Hakodate main street</ds-text><ds-tag>Cash</ds-tag><ds-text class="ds-row__value" literal>206.49 kr</ds-text></ds-row>
    <ds-row href="#seven"><ds-avatar shape="square" icon="cart" color="var(--ds-orange)"></ds-avatar><ds-text class="ds-row__name" literal>Seven-Eleven</ds-text><ds-tag>Cash</ds-tag><ds-text class="ds-row__value" literal>12.52 kr</ds-text></ds-row>
  </ds-list>
  <ds-list heading="Monday">
    <ds-row href="#juice"><ds-avatar shape="square" icon="cart" color="var(--ds-apple-green)"></ds-avatar><ds-text class="ds-row__name" literal>Apple juice</ds-text><ds-tag>Cash</ds-tag><ds-text class="ds-row__value" literal>5.89 kr</ds-text></ds-row>
    <ds-row href="#coffee"><ds-avatar shape="square" icon="coffee" color="var(--ds-yellow)"></ds-avatar><ds-text class="ds-row__name" literal>Coffee</ds-text><ds-tag>Cash</ds-tag><ds-text class="ds-row__value" literal>5.05 kr</ds-text></ds-row>
    <ds-row href="#laundry"><ds-avatar shape="square" icon="plus" color="var(--ds-pink)"></ds-avatar><ds-text class="ds-row__name" literal>Laundromat, Hakodate</ds-text><ds-tag style="--ds-tag-accent: var(--ds-sharp-blue)">JP Bank</ds-tag><ds-text class="ds-row__value" literal>46.29 kr</ds-text></ds-row>
    <ds-row href="#sushi"><ds-avatar shape="square" icon="star" color="var(--ds-zenith-blue)"></ds-avatar><ds-text class="ds-row__name" literal>Hama-Sushi, Hakodate</ds-text><ds-tag>Cash</ds-tag><ds-text class="ds-row__value" literal>57.40 kr</ds-text></ds-row>
  </ds-list>
</div>`,
  },
  'list-dated': {
    title: 'Events under their month', hint: 'A date tile on the first sixteen of its square, inside the button that changes the date; four pixels on, the name starts on the next square. The status stands in a column at the end. Press a row to see the fill reach two pixels past the tile and the status.', height: 240,
    html: `<style>
.dated { display: grid; gap: var(--ds-unit); width: 100%; max-width: calc(28 * var(--ds-unit)); --ds-row-padding: 0px; }
.dated .when { display: inline-flex; }
.dated .status { margin-inline-start: auto; width: calc(6 * var(--ds-unit)); padding-inline-start: var(--ds-unit); box-sizing: border-box; }
</style>
<div class="dated">
  <ds-list heading="Events in October">
    <ds-row href="#migration"><span class="ds-row__picture"><ds-button control="slotted" fit icon><button type="button" aria-label="Change the date, 19 October"><ds-avatar shape="square" initial="19" color="var(--ds-orange)"></ds-avatar></button></ds-button></span><ds-text class="ds-row__name" literal>Platform migration <span class="ds-text--muted">for Harbour &amp; Co</span></ds-text><span class="status" slot="end"><ds-tag>Ongoing</ds-tag></span></ds-row>
    <ds-row href="#sprint"><span class="ds-row__picture"><ds-button control="slotted" fit icon><button type="button" aria-label="Change the date, 5 October"><ds-avatar shape="square" initial="5" color="var(--ds-pink)"></ds-avatar></button></ds-button></span><ds-text class="ds-row__name" literal>Performance sprint</ds-text><span class="status" slot="end"><ds-tag>Done</ds-tag></span></ds-row>
  </ds-list>
  <ds-list heading="Events in November">
    <ds-row href="#launch"><span class="ds-row__picture"><ds-button control="slotted" fit icon><button type="button" aria-label="Change the date, 23 November"><ds-avatar shape="square" initial="23" color="var(--ds-zenith-blue)"></ds-avatar></button></ds-button></span><ds-text class="ds-row__name" literal>App launch</ds-text><span class="status" slot="end"><ds-tag>Planned</ds-tag></span></ds-row>
  </ds-list>
</div>`,
  },
  'list-icons': {
    title: 'Places with their icons', hint: 'A 16px icon takes the first sixteen of its square, as a tile does, and the words start on the next square; the count stands at the end in tabular figures. Every row is one square high, edge to edge.', height: 160,
    html: `<style>
.places { width: 100%; max-width: calc(16 * var(--ds-unit)); --ds-row-padding: 0px; }
</style>
<ds-list class="places">
  <ds-row href="#folders"><ds-icon class="ds-row__picture" type="folder" size="large"></ds-icon><ds-text class="ds-row__name" literal>Folders</ds-text><ds-text class="ds-row__value" literal>12</ds-text></ds-row>
  <ds-row href="#calendar"><ds-icon class="ds-row__picture" type="calendar" size="large"></ds-icon><ds-text class="ds-row__name" literal>Calendar</ds-text><ds-text class="ds-row__value" literal>3</ds-text></ds-row>
  <ds-row href="#links"><ds-icon class="ds-row__picture" type="link" size="large"></ds-icon><ds-text class="ds-row__name" literal>Shared links</ds-text><ds-text class="ds-row__value" literal>48</ds-text></ds-row>
  <ds-row href="#settings"><ds-icon class="ds-row__picture" type="settings" size="large"></ds-icon><ds-text class="ds-row__name" literal>Settings</ds-text></ds-row>
</ds-list>`,
  },
  'list-words': {
    title: 'Words only', hint: 'With no picture the words start on the column\'s edge and the fill reaches two pixels past them on each side; a value at the end keeps tabular figures so a column of amounts lines up.', height: 140,
    html: `<style>
.words { width: 100%; max-width: calc(16 * var(--ds-unit)); --ds-row-padding: 0px; }
</style>
<ds-list class="words" heading="Totals">
  <ds-row href="#paid"><ds-text class="ds-row__name" literal>Paid</ds-text><ds-text class="ds-row__value" literal>12,400 kr</ds-text></ds-row>
  <ds-row href="#invoiced"><ds-text class="ds-row__name" literal>Invoiced, not paid</ds-text><ds-text class="ds-row__value" literal>3,150 kr</ds-text></ds-row>
  <ds-row href="#draft"><ds-text class="ds-row__name" literal>Not invoiced</ds-text><ds-text class="ds-row__value" literal>980 kr</ds-text></ds-row>
</ds-list>`,
  },
};
