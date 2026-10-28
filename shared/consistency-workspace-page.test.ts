import { describe, expect, it } from 'vitest';
import { validateWorkspacePage } from './consistency-workspace-page';
const document = () => ({schema: 2, kind: 'page', example: 'editor', library: 'original', fonts: {}, page: {schema: 1, kind: 'native-page', layout: {padding: 40, gap: 20}, blocks: [{id: 'intro', kind: 'content', source: '# Hello'}]}});
describe('workspace pages use the published page model', () => {
  it('validates and copies the same native blocks without a second composition', () => {
    const value = document(), clean = validateWorkspacePage(value);
    expect(clean).toEqual(value); expect(clean.page).not.toBe(value.page);
  });
  it('rejects executable content, duplicate IDs and unregistered bindings', () => {
    for (const block of [
      {id:'intro', kind:'runtime', name:'Arbitrary', props:{}},
      {id:'picture', kind:'image', src:'javascript:alert(1)', alt:''},
      {id:'intro', kind:'content', source:'Duplicate'},
    ]) {
      const value=document(); (value.page.blocks as unknown[]).push(block);
      expect(() => validateWorkspacePage(value)).toThrow();
    }
  });
  it('refuses submitted styles and unknown fields instead of treating them as a library', () => {
    expect(() => validateWorkspacePage({...document(), styles:'body{display:none}'})).toThrow();
    expect(() => validateWorkspacePage({...document(), library:'https://other.example/a.css'})).toThrow();
    expect(() => validateWorkspacePage({...document(), fonts:{text:'x; color:red'}})).toThrow();
  });
});
