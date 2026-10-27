import { expect, test } from 'vite-plus/test';
import { readAction } from '../shared/consistency-content';

test('native button actions use the same destination boundary as saved source contexts', () => {
  for(const action of [{kind:'page',target:'/\\other.example'},{kind:'link',target:'https://example.com\nother'},{kind:'page',target:'//other.example'},{kind:'link',target:'javascript:bad'}])expect(readAction(action)).toBeUndefined();
  expect(readAction({kind:'page',target:'/about?from=home#contact'})).toEqual({kind:'page',target:'/about?from=home#contact'});
});
