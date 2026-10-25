/**
 * The base system's live sheet: the token values changed on designsystem1.com, and nothing else.
 *
 * The owner edits the whole base (every token of the component template) in the workbench, which
 * keeps its changes in one final override block. Only that block is served at
 * `/ds1/base/latest.css`, after each product's own copy, so a product that has never been edited
 * looks exactly as it does today and a token nobody touched is never redeclared.
 */
export const TOKENS_START = '/* ds1:tokens:start */';
export const TOKENS_END = '/* ds1:tokens:end */';

const NAME = /^--[a-zA-Z0-9_-]{1,80}$/;
/** The sheet loads in every live product: values hold plain tokens, never rules, imports or addresses. */
const UNSAFE = /[;{}<>\\@]|url\s*\(|image-set\s*\(|expression\s*\(|\/\*|\*\//i;
export const MAX_BASE_BYTES = 512 * 1024;

export type BaseOverride = [name: string, value: string];

/** The overrides in the last block, in order, or a reason the block cannot be served. */
export function baseOverrides(css: string): { overrides: BaseOverride[] } | { error: string } {
  const from = css.lastIndexOf(TOKENS_START);
  if (from < 0) return { overrides: [] };
  const to = css.indexOf(TOKENS_END, from);
  if (to < 0) return { error: 'The token block is not closed.' };
  const block = css.slice(from + TOKENS_START.length, to);
  const body = /^\s*:root\s*\{([\s\S]*)\}\s*$/.exec(block);
  if (!body) return block.trim() ? { error: 'The token block holds something other than :root.' } : { overrides: [] };
  const overrides: BaseOverride[] = [];
  for (const declaration of body[1]!.split(';')) {
    if (!declaration.trim()) continue;
    const colon = declaration.indexOf(':');
    const name = declaration.slice(0, colon).trim();
    const value = declaration.slice(colon + 1).trim();
    if (colon < 0 || !NAME.test(name)) return { error: `"${declaration.trim().slice(0, 40)}" is not a token.` };
    if (!value || value.length > 400 || UNSAFE.test(value)) return { error: `${name} has a value the live sheet cannot carry.` };
    overrides.push([name, value]);
  }
  return { overrides };
}

/** The served bytes for a version: deterministic, so equal overrides make an equal hash. */
export function baseSheet(overrides: BaseOverride[], version: number): string {
  const lines = overrides.map(([name, value]) => `  ${name}: ${value};`);
  return `/* Design system 1 base, version ${version} */\n:root {\n${lines.join('\n')}${lines.length ? '\n' : ''}}\n`;
}
