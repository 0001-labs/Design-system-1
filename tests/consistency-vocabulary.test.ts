import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vite-plus/test';
import { COMMON_FIELDS, KINDS, PRIMITIVE_KINDS, SECTION_KINDS, SECTIONS, TONES, isSlot, vocabularyJson, vocabularyRecord, type KindDefinition, type MemberDefinition } from '../shared/consistency-vocabulary';
import { renderNativePage, validateNativePage, type NativeBlock, type NativePageDocument } from '../shared/consistency-native-page';

const context = { images: ['/photos/harbour.jpg', '/photos/logo.svg'], collections: ['storefront'], runtimes: { MenuToggle: [], Theme: [], Cart: ['label'] }, bindings: [] };
const page = (blocks: NativeBlock[]): NativePageDocument => ({ schema: 1, kind: 'native-page', lang: 'da', layout: { padding: 0, gap: 80 }, blocks });
const generated = join(import.meta.dirname, '../shared/generated/vocabulary.json');

describe('the vocabulary record', () => {
  test('names every kind the renderer and validator know, primitives and sections, once', () => {
    const kinds = KINDS.map(definition => definition.kind);
    expect(new Set(kinds).size).toBe(kinds.length);
    expect(kinds).toEqual([...PRIMITIVE_KINDS, ...SECTION_KINDS]);
    for (const kind of [...PRIMITIVE_KINDS, ...SECTION_KINDS]) expect(() => validateNativePage(page([{ id: 'x', kind } as unknown as NativeBlock]), context)).toThrow('invalid-native-page');
  });
  test('describes every kind, field and slot for a person and a model', () => {
    const member = (definition: MemberDefinition, path: string) => {
      expect(definition.meaning, path).toMatch(/\S/);
      if (isSlot(definition)) { if (definition.type === 'items') for (const [name, inner] of Object.entries(definition.item!)) member(inner, `${path}.${name}`); return; }
      if (definition.type === 'choice') { expect(definition.choices!.length, path).toBeGreaterThan(1); if (definition.default !== undefined) expect(definition.choices, path).toContain(definition.default); }
      if (definition.type === 'tone' && definition.default !== undefined) expect(TONES, path).toContain(definition.default);
      if (definition.type === 'tones') { expect(definition.min, path).toBeDefined(); expect(definition.max, path).toBeDefined(); expect(Array.isArray(definition.default), path).toBe(true); const list = definition.default as readonly string[]; expect(list.length, path).toBeGreaterThanOrEqual(definition.min!); expect(list.length, path).toBeLessThanOrEqual(definition.max!); for (const tone of list) expect(TONES, path).toContain(tone); }
      if (['squares', 'pixels', 'integer'].includes(definition.type)) { expect(definition.min, path).toBeDefined(); expect(definition.max, path).toBeDefined(); if (typeof definition.default === 'number') { expect(definition.default, path).toBeGreaterThanOrEqual(definition.min!); expect(definition.default, path).toBeLessThanOrEqual(definition.max!); } }
    };
    for (const definition of KINDS) {
      expect(definition.description).toMatch(/^[A-Z].*\.$/);
      expect(definition.examples.length, definition.kind).toBeGreaterThanOrEqual(2);
      expect(definition.examples.length, definition.kind).toBeLessThanOrEqual(3);
      for (const [name, field] of Object.entries(definition.fields)) member(field, `${definition.kind}.${name}`);
      for (const [name, slot] of Object.entries(definition.slots)) member(slot, `${definition.kind}.${name}`);
    }
    for (const [name, field] of Object.entries(COMMON_FIELDS)) member(field, `common.${name}`);
    expect(TONES).toEqual(['paper', 'cream', 'dark', 'accent', 'highlight', 'band', 'pastel-1', 'pastel-2', 'pastel-3', 'pastel-4', 'pastel-5', 'pastel-6']);
  });
  test('every example is a complete valid block that renders with its kind, slots and primitives', () => {
    for (const definition of KINDS) definition.examples.forEach((example, index) => {
      const label = `${definition.kind} example ${index}`;
      expect(example.kind, label).toBe(definition.kind);
      const checked = validateNativePage(page([structuredClone(example)]), context);
      expect(checked.blocks[0], label).toEqual(example);
      const html = renderNativePage(checked, { images: context.images, collections: { storefront: { items: [{ id: 'a', title: 'A raft', href: '/a/', price: '100 kr' }] } }, runtime: block => `<span data-runtime="${block.name}"></span>` });
      expect(html, label).toContain(`data-native-block="${example.id}"`);
      if (definition.layer === 'section') {
        expect(html, label).toContain(`class="c9y-native-node c9y-native-section`);
        expect(html, label).toContain(`data-section="${definition.kind}"`);
        for (const name of Object.keys(definition.slots)) if ((example as unknown as Record<string, unknown>)[name] !== undefined) expect(html, `${label} slot ${name}`).toContain(`data-slot="${name}"`);
      }
      expect(html, label).not.toMatch(/<script|javascript:/);
    });
  });
  test('field ranges are one definition: the validator refuses what the record says it refuses', () => {
    for (const definition of SECTIONS) {
      const example = structuredClone(definition.examples[0]!) as unknown as Record<string, unknown>;
      for (const [name, field] of Object.entries(definition.fields)) {
        const bad = { ...example };
        if (field.type === 'squares' || field.type === 'integer' || field.type === 'pixels') bad[name] = field.max! + 1;
        else if (field.type === 'choice') bad[name] = 'nothing-of-the-kind';
        else if (field.type === 'tone') bad[name] = 'mint';
        else if (field.type === 'tones') bad[name] = ['mint'];
        else if (field.type === 'boolean') bad[name] = 'yes';
        else continue;
        let refusal: { message: string; reason?: string } | undefined;
        try { validateNativePage(page([bad as unknown as NativeBlock]), context); } catch (error) { refusal = error as { message: string; reason?: string }; }
        expect(refusal?.message, `${definition.kind}.${name}`).toBe('invalid-native-page');
        expect(refusal?.reason, `${definition.kind}.${name}`).toContain(`${definition.kind} ${String(example.id)}.${name}`);
      }
    }
  });
  test('the written JSON is current and under 200 kB', () => {
    const json = vocabularyJson();
    expect(json.length).toBeLessThan(200_000);
    const record = JSON.parse(json) as ReturnType<typeof vocabularyRecord>;
    expect(record.kind).toBe('native-vocabulary');
    expect(record.kinds.map((kind: KindDefinition) => kind.kind)).toEqual([...PRIMITIVE_KINDS, ...SECTION_KINDS]);
    expect(existsSync(generated), 'run: vp exec tsx scripts/write-vocabulary.ts').toBe(true);
    expect(readFileSync(generated, 'utf8'), 'shared/generated/vocabulary.json is stale: run vp exec tsx scripts/write-vocabulary.ts').toBe(json);
  });
});
