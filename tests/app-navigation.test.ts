// @vitest-environment happy-dom
import { expect, test } from 'vite-plus/test';
import { placeAppNavigation, readAppComponents, type AppComponent } from '../website/src/lib/app-navigation';
import type { SidebarItem } from '../DS1/3-unit/ds-sidebar';
const components: AppComponent[] = [
  {name:'Keyboard shortcut', layer:2, href:'/libraries/workspace/?internal=keyboard-shortcut'},
  {name:'Spacing handle', layer:2, href:'/libraries/workspace/?internal=spacing-handle'},
  {name:'Loading indicator', layer:2, href:'/libraries/workspace/?internal=loading-indicator'},
];
const rows: SidebarItem[] = [
  {id:'/1-root/overview/',label:'1 Root',expanded:true},
  {id:'/2-core/overview/',label:'2 Core',expanded:true},
  {id:'/2-core/input/',label:'Input',depth:1},
  {id:'/2-core/link/',label:'Link',depth:1},
  {id:'/2-core/stat/',label:'Stat',depth:1},
  {id:'/2-core/switch/',label:'Switch',depth:1},
  {id:'/3-unit/overview/',label:'3 Unit',expanded:true},
];
test('private names require owner metadata and a local workspace destination', () => {
  expect(readAppComponents({authenticated:false,appComponents:components})).toEqual([]);
  expect(readAppComponents({authenticated:true,appComponents:[...components,{name:'Elsewhere',layer:2,href:'https://elsewhere.example'}]})).toEqual(components);
});
test('owner-only links sit alphabetically in Core and disappear when collapsed or signed out', () => {
  const root = document.createElement('div');
  const items = placeAppNavigation(root, rows, components);
  const expanded = items.flatMap(item => [item.label, ...[...root.querySelectorAll(`[slot="${item.afterSlot}"] a`)].map(link=>link.textContent)]);
  expect(expanded).toEqual(['1 Root','2 Core','Input','Keyboard shortcut','Link','Loading indicator','Spacing handle','Stat','Switch','3 Unit']);
  expect(root.querySelector('ds-tag')).toBeNull();
  expect([...root.querySelectorAll('a')].every(link=>link.classList.contains('private-component-link'))).toBe(true);
  placeAppNavigation(root, rows.map(row=>({...row,expanded:row.label==='2 Core'?false:row.expanded})), components);
  expect(root.querySelectorAll('a')).toHaveLength(0);
  placeAppNavigation(root, rows, components);
  placeAppNavigation(root, rows, readAppComponents({authenticated:false,appComponents:components}));
  expect(root.querySelectorAll('a')).toHaveLength(0);
});
test('numbered layers also work in a library and do not invent a missing section', () => {
  const root = document.createElement('div');
  const libraryRows: SidebarItem[] = [1,2,3,4].map(number=>({id:`library-layer-${number}`,label:String(number),expanded:true}));
  const items = placeAppNavigation(root,libraryRows,[{name:'Internal unit',layer:3,href:'/libraries/workspace/?internal=internal-unit'}]);
  expect(items[2].afterSlot).toBeDefined();
  expect(items[1].afterSlot).toBeUndefined();
  placeAppNavigation(root,[],components);
  expect(root.children).toHaveLength(0);
});
