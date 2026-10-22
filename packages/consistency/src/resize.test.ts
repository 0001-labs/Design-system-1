// @vitest-environment happy-dom
import { expect, it } from 'vite-plus/test';
import { resizeValue } from './resize';
it('snaps released sizes to squares within logical bounds', () => {
  expect(resizeValue(303)).toBe(300); expect(resizeValue(317)).toBe(320);
  expect(resizeValue(23)).toBe(80); expect(resizeValue(3000)).toBe(2000);
});
it('keeps two hundred pixels of readable card content plus its padding', async () => {
 const { cardMinimumWidth } = await import('./resize');
 const card = document.createElement('ds-card'), body = document.createElement('p');body.textContent='Short words';card.append(body);
 expect(cardMinimumWidth(card)).toBeGreaterThanOrEqual(240);
});
