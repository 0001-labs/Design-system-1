/** Component data shared by the private editor and its inference dispatcher; no DOM. */
export type BasicContentElement = { kind: 'button'; label: string; secondary: boolean; action?: { kind: 'link' | 'page'; target: string } } | { kind: 'card'; label: string; title: string; body: string; tone?: string; variant?: 'filled' | 'outlined'; width?: number; height?: number; gaps?: Record<string, number> };
export const componentDefaults: Record<'button' | 'card', BasicContentElement> = {
  button: { kind: 'button', label: 'Get in touch', secondary: false },
  card: { kind: 'card', label: 'A new idea', title: 'Something worth making', body: 'Write a little about it.' },
};
export const tones = ['', 'sharp-blue', 'apple-green', 'pink', 'orange', 'yellow', 'ink'];
export function readAction(value: unknown): { kind: 'link' | 'page'; target: string } | undefined {
  if (!value || typeof value !== 'object') return;
  const action = value as Record<string, unknown>;
  if ((action.kind !== 'link' && action.kind !== 'page') || typeof action.target !== 'string' || action.target.length > 2000) return;
  if (action.kind === 'page' ? !/^\/(?!\/)/.test(action.target) : !/^https?:\/\//i.test(action.target)) return;
  return { kind: action.kind, target: action.target };
}
const text = (value: unknown, limit: number): value is string => typeof value === 'string' && value.length <= limit;
/** Closed fenced Markdown keeps the component data local, readable and lossless. */
export function readBasicContentElement(source: string): BasicContentElement | null {
  const match = /^```c9y-(button|card)\r?\n([\s\S]*)\r?\n```$/.exec(source);
  if (!match) return null;
  try {
    const value: unknown = JSON.parse(match[2]!);
    if (!value || typeof value !== 'object') return null;
    const data = value as Record<string, unknown>;
    if (!text(data.label, 200)) return null;
    if (match[1] === 'button') return typeof data.secondary === 'boolean' ? { kind: 'button', label: data.label, secondary: data.secondary, ...(readAction(data.action) ? { action: readAction(data.action)! } : {}) } : null;
    return text(data.title, 500) && text(data.body, 5000) ? { kind: 'card', label: data.label, title: data.title, body: data.body, ...(data.gaps && typeof data.gaps === 'object' ? { gaps: Object.fromEntries(Object.entries(data.gaps).filter(([key, value]) => ['label', 'title', 'footer'].includes(key) && typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 2000)) as Record<string, number> } : {}), ...(typeof data.width === 'number' && Number.isFinite(data.width) && data.width >= 80 && data.width <= 2000 ? { width: data.width } : {}), ...(typeof data.height === 'number' && Number.isFinite(data.height) && data.height >= 80 && data.height <= 2000 ? { height: data.height } : {}), ...(typeof data.tone === 'string' && tones.includes(data.tone) ? { tone: data.tone } : {}), ...(data.variant === 'filled' || data.variant === 'outlined' ? { variant: data.variant } : {}) } : null;
  } catch { return null; }
}
export function writeBasicContentElement(value: BasicContentElement): string {
  const { kind, ...fields } = value;
  // A literal closing fence inside JSON would otherwise close the Markdown atom.
  return `\`\`\`c9y-${kind}\n${JSON.stringify(fields).replaceAll('`', '\\u0060')}\n\`\`\``;
}
