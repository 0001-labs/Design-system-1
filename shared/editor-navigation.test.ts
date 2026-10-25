import { expect, test } from 'vite-plus/test';
import { editorChoice, editorSearch, editorSidebarItems, readEditorNavigation, EDITOR_COMPONENTS_ID } from './editor-navigation';

const reported = { components: [{ id: 'button', name: 'Button' }, { id: 'input', name: 'Input' }], component: 'input', view: null };

test('reads only what an editor frame reports', () => {
  expect(readEditorNavigation(reported)).toEqual(reported);
  expect(readEditorNavigation({ ...reported, view: 'history' })?.view).toBe('history');
  expect(readEditorNavigation({ ...reported, view: 'elsewhere' })?.view).toBeNull();
  for (const bad of [null, 'button', { ...reported, component: '<b>' }, { ...reported, components: [] }, { ...reported, components: [{ id: 'Bad id', name: 'x' }] }]) {
    expect(readEditorNavigation(bad)).toBeNull();
  }
});

test('the docs sidebar lists the components, then History and All tokens, marking what is open', () => {
  const items = editorSidebarItems(reported, true, '/libraries/design-system-1/');
  expect(items.map(item => item.label)).toEqual(['Components', 'Button', 'Input', 'History', 'All tokens']);
  expect(items.find(item => item.current)?.label).toBe('Input');
  expect(items[2]!.href).toBe('/libraries/design-system-1/?component=input');
  expect(editorSidebarItems({ ...reported, view: 'tokens' }, true, '/x/').find(item => item.current)?.label).toBe('All tokens');
  expect(editorSidebarItems(reported, false, '/x/').map(item => item.id)).toEqual([EDITOR_COMPONENTS_ID, 'editor:history', 'editor:tokens']);
});

test('a row becomes what the frame opens, and an address names one component or one view', () => {
  expect(editorChoice('editor:component:button')).toEqual({ component: 'button', view: null });
  expect(editorChoice('editor:history')).toEqual({ component: null, view: 'history' });
  expect(editorChoice('editor:tokens')).toEqual({ component: null, view: 'tokens' });
  expect(editorChoice('/2-core/button/')).toBeNull();
  expect(String(editorSearch('tag', null, new URLSearchParams('embed=docs&view=history')))).toBe('embed=docs&component=tag');
  expect(String(editorSearch('tag', 'tokens'))).toBe('view=tokens');
});
