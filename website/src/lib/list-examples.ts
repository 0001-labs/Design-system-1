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
};
