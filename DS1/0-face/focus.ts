/**
 * Image focus: where a photo's subject is, so a picture cut to its box
 * (`object-fit: cover`) keeps it in view instead of its middle. A person's
 * face first, then whatever in the picture holds the most detail. Plain
 * TypeScript with no imports, for the browser and for a build script alike.
 *
 * The focus is a point of the picture, across and down from 0 to 1, and it is
 * written as the picture's `object-position` (`objectPosition()`), so a
 * cover crop of any shape keeps that point in view. Work it out once, where
 * the page is built, and write it into the markup, so the first paint is
 * already cut right. On a Mac, `focus-vision.swift` finds the faces and the
 * salient part with Apple's Vision framework, and `focusFromRegions()` turns
 * them into the focus; elsewhere, or where it finds nothing, `focusOf()`
 * reads the pixels:
 *
 * ```ts
 * // swift 0-face/focus-vision.swift *.jpg > regions.json
 * import { focusFromRegions, focusOf, objectPosition } from "./0-face/focus.ts";
 * const focus = focusFromRegions(regions[name]) ?? focusOf(data, info.width, info.height, info.channels);
 * // <img src="…" style="object-position: 50% 18%">
 * ```
 *
 * A page with no build step marks a picture `data-ds-focus="auto"` and calls
 * `startFocus()`: once the picture has loaded, its focus is found and kept in
 * the browser, so it is right from the first paint on the next visit. A
 * picture whose focus a person chose says so, `data-ds-focus="40% 20%"`, and
 * is never measured. A picture from another host without CORS cannot be read
 * and keeps its middle.
 */

/** A point of a picture, across (`x`) and down (`y`), each from 0 to 1. */
export interface Focus { x: number; y: number }

export const CENTRE: Focus = { x: 0.5, y: 0.5 };

/** The width a picture is measured at; enough to find a face, and cheap. */
export const FOCUS_SAMPLE = 64;

/** Whether a pixel's colour is skin, in YCbCr, for any skin tone. */
function isSkin(r: number, g: number, b: number): boolean {
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
  return y > 40 && cb >= 77 && cb <= 127 && cr >= 137 && cr <= 173 && r > g && r > b;
}

const clamp = (value: number) => Math.min(1, Math.max(0, value));

/**
 * The focus of a picture from its pixels (RGB or RGBA, row by row), measured
 * small (about `FOCUS_SAMPLE` across). Skin that gathers into a face wins:
 * the highest band of rows dense with skin, since a face stands above hands
 * and arms. Without one, the centre of the picture's detail (where neighbouring
 * pixels differ most), drawn a little towards the middle so a busy edge does
 * not take the crop.
 */
export function focusOf(pixels: ArrayLike<number>, width: number, height: number, channels = 4): Focus {
  if (width < 2 || height < 2) return CENTRE;
  const at = (x: number, y: number) => (y * width + x) * channels;
  const luma = new Float32Array(width * height);
  const skin = new Uint8Array(width * height);
  let skinCount = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = at(x, y);
      const r = pixels[i]!, g = pixels[i + 1]!, b = pixels[i + 2]!;
      luma[y * width + x] = 0.299 * r + 0.587 * g + 0.114 * b;
      if (isSkin(r, g, b)) { skin[y * width + x] = 1; skinCount++; }
    }
  }

  // A face: skin over at least half a percent of the picture, in a band of rows.
  if (skinCount >= width * height * 0.005) {
    const band = Math.max(2, Math.round(height / 10));
    const rows = new Float32Array(height);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) rows[y] += skin[y * width + x]!;
    let densest = 0;
    const bands: number[] = [];
    for (let y = 0; y + band <= height; y++) {
      let sum = 0;
      for (let k = 0; k < band; k++) sum += rows[y + k]!;
      bands.push(sum);
      densest = Math.max(densest, sum);
    }
    const top = bands.findIndex(sum => sum >= densest * 0.45);
    if (top >= 0) {
      let sx = 0, sy = 0, n = 0;
      for (let y = top; y < Math.min(height, top + band * 2); y++) {
        for (let x = 0; x < width; x++) if (skin[y * width + x]) { sx += x; sy += y; n++; }
      }
      if (n) return { x: clamp((sx / n + 0.5) / width), y: clamp((sy / n + 0.5) / height) };
    }
  }

  // Otherwise the picture's detail.
  let sx = 0, sy = 0, total = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const energy = Math.abs(luma[i + 1]! - luma[i - 1]!) + Math.abs(luma[i + width]! - luma[i - width]!);
      sx += x * energy; sy += y * energy; total += energy;
    }
  }
  if (!total) return CENTRE;
  const pull = 0.35;
  return {
    x: clamp(((sx / total + 0.5) / width) * (1 - pull) + 0.5 * pull),
    y: clamp(((sy / total + 0.5) / height) * (1 - pull) + 0.5 * pull),
  };
}

/** A part of a picture, as fractions of it from its top left corner. */
export interface Region { x: number; y: number; w: number; h: number }

/**
 * The focus from what a detector found (`focus-vision.swift`: Apple's face
 * detection and attention-based saliency), or `undefined` when it found
 * nothing. Faces win: the point between them across, and down a little above
 * the top of the highest, so a crop keeps the heads whole with room above
 * them. Otherwise the middle of everything salient.
 */
export function focusFromRegions(found: { faces?: Region[]; salient?: Region[] }): Focus | undefined {
  const faces = (found.faces ?? []).filter(face => face.w * face.h > 0.0005);
  if (faces.length) {
    const biggest = Math.max(...faces.map(face => face.w * face.h));
    const kept = faces.filter(face => face.w * face.h >= biggest * 0.25);
    const left = Math.min(...kept.map(face => face.x));
    const right = Math.max(...kept.map(face => face.x + face.w));
    const top = Math.min(...kept.map(face => face.y));
    const height = Math.max(...kept.map(face => face.h));
    return { x: clamp((left + right) / 2), y: clamp(top - height * 0.35) };
  }
  const salient = found.salient ?? [];
  if (!salient.length) return undefined;
  const left = Math.min(...salient.map(r => r.x));
  const right = Math.max(...salient.map(r => r.x + r.w));
  const top = Math.min(...salient.map(r => r.y));
  const bottom = Math.max(...salient.map(r => r.y + r.h));
  return { x: clamp((left + right) / 2), y: clamp((top + bottom) / 2) };
}

/** The focus as CSS `object-position`, in whole percents. */
export function objectPosition(focus: Focus): string {
  return `${Math.round(focus.x * 100)}% ${Math.round(focus.y * 100)}%`;
}

const KEY = "ds-focus:";

/** Finds and sets the focus of one picture marked `data-ds-focus="auto"`, once it has loaded. */
export function focusImage(image: HTMLImageElement): void {
  const chosen = image.dataset.dsFocus;
  if (chosen && chosen !== "auto") { image.style.objectPosition = chosen; return; }
  const source = image.currentSrc || image.src;
  try {
    const kept = localStorage.getItem(KEY + source);
    if (kept) { image.style.objectPosition = kept; return; }
  } catch { /* Storage can be blocked. */ }
  const measure = () => {
    if (!image.naturalWidth) return;
    const width = FOCUS_SAMPLE;
    const height = Math.max(2, Math.round((image.naturalHeight / image.naturalWidth) * width));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;
    try {
      context.drawImage(image, 0, 0, width, height);
      const position = objectPosition(focusOf(context.getImageData(0, 0, width, height).data, width, height, 4));
      image.style.objectPosition = position;
      try { localStorage.setItem(KEY + source, position); } catch { /* Storage can be blocked. */ }
    } catch { /* A picture from another host without CORS cannot be read; it keeps its middle. */ }
  };
  if (image.complete) measure();
  else image.addEventListener("load", measure, { once: true });
}

/** Sets the focus of every picture marked `data-ds-focus` in `root`. */
export function startFocus(root: ParentNode = document): void {
  for (const image of root.querySelectorAll<HTMLImageElement>("img[data-ds-focus]")) focusImage(image);
}
