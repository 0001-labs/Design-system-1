import templates from './consistency-template-pages.json';
import type { NativeComponents } from './consistency-components';
import { validateNativePage, type NativePageDocument } from './consistency-native-page';

/** Host metadata surrounds the same page used by published sites. It never defines blocks. */
export interface WorkspacePage {
  schema: 2;
  kind: 'page';
  example: string;
  library: string;
  fonts: { heading?: string; text?: string };
  page: NativePageDocument;
}
const refusal = (): never => { throw new Error('invalid-workspace-page'); };
const object = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : refusal();
const only = (value: Record<string, unknown>, keys: string[]) => { if (Object.keys(value).some(key => !keys.includes(key))) refusal(); };
const name = (value: unknown, pattern: RegExp, max: number): string => typeof value === 'string' && value.length <= max && pattern.test(value) ? value : refusal();
/** No runtime or collection can be supplied by an unregistered private draft. Local images require
 * a future upload registry; absolute HTTP(S) images use the native page's existing URL validator. */
export function validateWorkspacePage(value: unknown): WorkspacePage {
  const input = object(value);
  only(input, ['schema', 'kind', 'example', 'library', 'fonts', 'page']);
  if (input.schema !== 2 || input.kind !== 'page') return refusal();
  if (JSON.stringify(value).length > 750_000) return refusal();
  const fonts = object(input.fonts); only(fonts, ['heading', 'text']);
  const result: WorkspacePage = {
    schema: 2, kind: 'page',
    example: name(input.example, /^[a-z][a-z0-9-]*$/, 80),
    library: name(input.library, /^[a-z][a-z0-9-]*$/, 80),
    fonts: {}, page: validateNativePage(input.page, { images: [], collections: [], runtimes: {}, components: (templates as unknown as Record<string,{components:NativeComponents}>)[String(input.example)]?.components ?? {} }),
  };
  for (const key of ['heading', 'text'] as const) if (fonts[key] !== undefined) result.fonts[key] = name(fonts[key], /^[A-Za-z][A-Za-z0-9 ]*$/, 80);
  return result;
}
