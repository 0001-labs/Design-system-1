/** Canonical carousel content, shared by editing and publication. No DOM. */
export interface CarouselSlide { id: string; src: string; alt: string; fit: 'cover' | 'contain' }
export interface CarouselContent { kind: 'carousel'; slides: CarouselSlide[]; width?: number; height: number; current?: number }
export const EMPTY_CAROUSEL: CarouselContent = { kind: 'carousel', slides: [], height: 280 };
const MAX_SLIDES = 12, MAX_FILE = 4 * 1024 * 1024, MAX_DATA = 16 * 1024 * 1024;
export function safeCarouselSource(value: unknown): value is string {
  return typeof value === 'string' && ((value.length <= 4000 && /^(?:https?:\/\/|\/(?!\/))[^\s\\]+$/i.test(value)) || (value.length <= MAX_FILE * 1.4 && /^data:image\/(?:png|jpe?g|gif|webp|avif|bmp);base64,[a-z\d+/=]+$/i.test(value)));
}
export function readCarousel(source: string): CarouselContent | null {
  if (source.length > MAX_DATA) return null;
  const match = /^```c9y-carousel\r?\n([\s\S]*)\r?\n```$/.exec(source); if (!match) return null;
  try {
    const data = JSON.parse(match[1]);
    if (!data || !Array.isArray(data.slides) || data.slides.length > MAX_SLIDES) return null;
    const ids = new Set<string>();
    const slides: CarouselSlide[] = [];
    for (const slide of data.slides) {
      if (!slide || typeof slide.id !== 'string' || !/^[\w-]{1,80}$/.test(slide.id) || ids.has(slide.id) || !safeCarouselSource(slide.src) || typeof slide.alt !== 'string' || slide.alt.length > 500 || !['cover', 'contain'].includes(slide.fit)) return null;
      ids.add(slide.id); slides.push({ id: slide.id, src: slide.src, alt: slide.alt, fit: slide.fit });
    }
    const size = (value: unknown, fallback: number, min: number, max: number) => typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value / 20) * 20)) : fallback;
    return { kind: 'carousel', slides, height: size(data.height, 280, 160, 1200), ...(data.width === undefined ? {} : { width: size(data.width, 320, 160, 2000) }), ...(typeof data.current === 'number' && Number.isInteger(data.current) ? { current: Math.max(0, Math.min(slides.length - 1, data.current)) } : {}) };
  } catch { return null; }
}
export function writeCarousel(value: CarouselContent): string {
  const { kind: _, ...fields } = value;
  return `\`\`\`c9y-carousel\n${JSON.stringify(fields).replaceAll('`', '\\u0060')}\n\`\`\``;
}
