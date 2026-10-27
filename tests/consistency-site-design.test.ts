import { expect, test } from 'vitest';
import { sitePagePatch, siteSurfacePatch } from '../shared/consistency-site-design';

test('page colours resolve without client DS1 tokens and default restores authored values', () => {
  expect(sitePagePatch('pink').styles).toMatchObject({ 'background-color': 'var(--one-pink-pastel, light-dark(#fad1e6, #471f34))', 'color-scheme': 'light' });
  expect(sitePagePatch('ink').styles).toMatchObject({ 'background-color': 'var(--ds-black, #2a2a2a)', '--ds-text-color': 'var(--ds-white, #ffffff)', 'color-scheme': 'dark' });
  expect(sitePagePatch('').styles).toEqual({});
});

test('typed source contexts share attributes, class states and logical spacing', () => {
  expect(siteSurfacePatch('card','div',{tone:'pink',variant:'outlined',gaps:{title:40}})).toEqual({attributes:{'data-tone':'pink'},classes:{'ds-card--outlined':true},styles:{'--ds-card-title-gap':'calc(40px * var(--sf, 1))'}});
  expect(siteSurfacePatch('card','ds-card',{variant:'filled'}).attributes).toEqual({variant:'filled'});
  expect(siteSurfacePatch('button','a',{appearance:'plain',action:{kind:'page',target:'/about'}})).toEqual({attributes:{primary:null,secondary:null,href:'/about'},classes:{'ds-button--primary':false,'ds-button--secondary':false},styles:{}});
  expect(siteSurfacePatch('button','a',{action:null}).attributes).toEqual({href:null});
  expect(siteSurfacePatch('button','a',{}).attributes).toEqual({});
});

test('stat colour resolves both schemes without global DS1 tokens', () => {
  const styles=siteSurfacePatch('stat','ds-stat',{color:'sharp-blue',gaps:{figure:20}}).styles;
  expect(styles['--ds-text-color']).toContain('var(--ds-sharp-blue, #594dff)');
  expect(styles['--ds-text-color']).toContain('var(--ds-black, #2a2a2a)');
  expect(styles['--ds-text-color-muted']).toBe(styles['--ds-text-color']);
  expect(styles['--ds-stat-figure-gap']).toBe('calc(20px * var(--sf, 1))');
});
