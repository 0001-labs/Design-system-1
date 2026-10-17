/**
 * The Kotlin package in native/android, as one folder: its Gradle project with the
 * handwritten and generated sources, and the resources laid out from their canonical
 * files (the icons in DS1/x-icon as vector drawables, the typefaces as the TrueType and
 * OpenType builds in native/android/fonts, written from the web's woff2 files by
 * scripts/fonts/build-android-fonts.py). Sync 1's `kotlin` export and
 * scripts/write-native-tokens.ts both lay it out with `androidPackage`, so a product's
 * copy and the local build match.
 */
import { posix } from 'node:path';

/** The typefaces the package can carry, by the web's file names, and their builds here. */
export const androidFonts = {
  'Inter-Arrows.woff2': 'native/android/fonts/Inter-Arrows.ttf',
  'Iosevka-Regular.woff2': 'native/android/fonts/Iosevka-Regular.ttf',
  'GT-America-Standard-Regular.woff2': 'native/android/fonts/GT-America-Standard-Regular.otf',
  'GT-America-Standard-Medium.woff2': 'native/android/fonts/GT-America-Standard-Medium.otf',
  'GT-America-Compressed-Regular.woff2': 'native/android/fonts/GT-America-Compressed-Regular.otf',
  'OlivettiDot-Regular.woff2': 'native/android/fonts/OlivettiDot-Regular.otf',
};
/** Faces that may be redistributed travel always; arrows are Inter in every typeface. */
export const androidFontsAlways = ['Inter-Arrows.woff2', 'Iosevka-Regular.woff2'];
const licences = {
  'Inter-LICENSE.md': 'DS1/1-root/fonts/Inter-LICENSE.md',
  'Iosevka-LICENSE.md': 'DS1/1-root/fonts/Iosevka-LICENSE.md',
  'Tabler-LICENSE.md': 'DS1/x-icon/Tabler-LICENSE.md',
};

const res = 'ds1/src/main/res';

/** `GT-America-Standard-Regular.woff2` → `ds1_gt_america_standard_regular`. */
export const fontResource = file => `ds1_${file.replace(/\.[a-z0-9]+$/i, '').replace(/[^A-Za-z0-9]+/g, '_').toLowerCase()}`;
/** `shield-alt` → `ds1_icon_shield_alt`, `1x` → `ds1_icon_1x`. */
export const iconResource = name => `ds1_icon_${name.replace(/[^A-Za-z0-9]+/g, '_').toLowerCase()}`;

/** The icon names in DS1/x-icon, sorted. */
export function iconNames(tree) {
  return [...tree('DS1/x-icon', { only: /^[^/]+\.svg$/ }).keys()].map(file => file.slice(0, -4)).sort();
}

/**
 * Every file of the package, keyed by its path inside native/android. `fonts` names the
 * faces to carry besides the ones that always travel; `sources` is false for the
 * resources alone (the local build, whose sources are committed).
 *
 * @param {{ read: (path: string) => Buffer, tree: (path: string, filter?: { only?: RegExp, skip?: RegExp }) => Map<string, Buffer>, fonts?: string[], sources?: boolean }} context
 * @returns {Map<string, Buffer | string>}
 */
export function androidPackage({ read, tree, fonts = [], sources = true }) {
  const files = new Map();
  if (sources)
    for (const [file, content] of tree('native/android', { skip: /(^|\/)(build|\.gradle|\.kotlin|res|Licences|fonts|sample)(\/|$)|(^|\/)(\.gitignore|\.DS_Store|local\.properties)$/ }))
      files.set(file, content);
  for (const name of new Set([...androidFontsAlways, ...fonts])) {
    if (!Object.hasOwn(androidFonts, name)) throw new Error(`Unknown font for the Kotlin package: ${name}`);
    const source = androidFonts[name];
    let content;
    try { content = read(source); } catch {
      throw new Error(`${source} is not built: run vp run native:fonts (licensed faces are built on this Mac, never committed)`);
    }
    files.set(`${res}/font/${fontResource(name)}${posix.extname(source)}`, content);
  }
  for (const [name, path] of Object.entries(licences)) files.set(`Licences/${name}`, read(path));
  for (const name of iconNames(tree)) files.set(`${res}/drawable/${iconResource(name)}.xml`, vectorDrawable(read(`DS1/x-icon/${name}.svg`).toString('utf8')));
  return files;
}

/* ------------------------------------------------------------------------------------------
 * SVG to Android vector drawable. Every shape becomes a path with its transforms applied to
 * its points (arcs and quadratic curves become cubic curves first), so matrix transforms,
 * which a vector drawable's groups cannot hold, come out exact. Clip paths become a group's
 * clip-path; filters are left out. `currentColor` is black: icons are tinted where drawn.
 * ---------------------------------------------------------------------------------------- */

/** A small XML reader for the icon files: elements, attributes and nesting. */
function parseXml(text) {
  const root = { name: '#root', attrs: {}, children: [] };
  const stack = [root];
  const tag = /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<(\/?)([A-Za-z][\w:-]*)((?:\s+[\w:-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>/g;
  for (const m of text.matchAll(tag)) {
    if (!m[2]) continue;
    const [, closing, name, rawAttrs, selfClosing] = m;
    if (closing) {
      while (stack.length > 1 && stack.pop().name !== name);
      continue;
    }
    const attrs = {};
    for (const a of rawAttrs.matchAll(/([\w:-]+)\s*=\s*("([^"]*)"|'([^']*)')/g)) attrs[a[1]] = a[3] ?? a[4];
    if (attrs.style) for (const decl of attrs.style.split(';')) {
      const [k, v] = decl.split(':').map(s => s?.trim());
      if (k && v) attrs[k] = v;
    }
    const node = { name, attrs, children: [] };
    stack.at(-1).children.push(node);
    if (!selfClosing) stack.push(node);
  }
  return root.children.find(n => n.name === 'svg');
}

const num = v => (v === undefined || v === '' ? 0 : parseFloat(v));
const IDENTITY = [1, 0, 0, 1, 0, 0];
const multiply = (m, n) => [
  m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5],
];
const apply = (m, [x, y]) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];

function parseTransform(value) {
  let m = IDENTITY;
  for (const t of (value ?? '').matchAll(/(\w+)\s*\(([^)]*)\)/g)) {
    const a = t[2].split(/[\s,]+/).filter(Boolean).map(Number);
    let n = IDENTITY;
    if (t[1] === 'matrix') n = a;
    else if (t[1] === 'translate') n = [1, 0, 0, 1, a[0], a[1] ?? 0];
    else if (t[1] === 'scale') n = [a[0], 0, 0, a[1] ?? a[0], 0, 0];
    else if (t[1] === 'rotate') {
      const r = (a[0] * Math.PI) / 180;
      const [cx, cy] = [a[1] ?? 0, a[2] ?? 0];
      n = multiply(multiply([1, 0, 0, 1, cx, cy], [Math.cos(r), Math.sin(r), -Math.sin(r), Math.cos(r), 0, 0]), [1, 0, 0, 1, -cx, -cy]);
    } else if (t[1] === 'skewX') n = [1, 0, Math.tan((a[0] * Math.PI) / 180), 1, 0, 0];
    else if (t[1] === 'skewY') n = [1, Math.tan((a[0] * Math.PI) / 180), 0, 1, 0, 0];
    m = multiply(m, n);
  }
  return m;
}

/** Path data as absolute segments: ['M', x, y], ['L', x, y], ['C', x1, y1, x2, y2, x, y], ['Z']. */
function parsePath(d) {
  const tokens = [...d.matchAll(/[MmLlHhVvCcSsQqTtAaZz]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g)].map(m => m[0]);
  const out = [];
  let i = 0, cmd = '', x = 0, y = 0, sx = 0, sy = 0, lastC = null, lastQ = null;
  const isCmd = t => /^[A-Za-z]$/.test(t);
  const next = () => parseFloat(tokens[i++]);
  // Arc flags may be written without separators ("a1 1 0 011 1"): split them out.
  const flag = () => {
    const t = tokens[i];
    if (t.length > 1 && /^[01]/.test(t)) { tokens[i] = t.slice(1); return Number(t[0]); }
    i++;
    return Number(t);
  };
  while (i < tokens.length) {
    if (isCmd(tokens[i])) cmd = tokens[i++];
    const rel = cmd === cmd.toLowerCase();
    const C = cmd.toUpperCase();
    const ox = rel ? x : 0, oy = rel ? y : 0;
    if (C === 'Z') { out.push(['Z']); x = sx; y = sy; lastC = lastQ = null; continue; }
    if (C === 'M') {
      x = ox + next(); y = oy + next(); sx = x; sy = y;
      out.push(['M', x, y]);
      cmd = rel ? 'l' : 'L';
      lastC = lastQ = null;
    } else if (C === 'L') { x = ox + next(); y = oy + next(); out.push(['L', x, y]); lastC = lastQ = null; }
    else if (C === 'H') { x = (rel ? x : 0) + next(); out.push(['L', x, y]); lastC = lastQ = null; }
    else if (C === 'V') { y = (rel ? y : 0) + next(); out.push(['L', x, y]); lastC = lastQ = null; }
    else if (C === 'C') {
      const s = [ox + next(), oy + next(), ox + next(), oy + next(), ox + next(), oy + next()];
      out.push(['C', ...s]); lastC = [s[2], s[3]]; lastQ = null; [x, y] = [s[4], s[5]];
    } else if (C === 'S') {
      const [c1x, c1y] = lastC ? [2 * x - lastC[0], 2 * y - lastC[1]] : [x, y];
      const s = [ox + next(), oy + next(), ox + next(), oy + next()];
      out.push(['C', c1x, c1y, ...s]); lastC = [s[0], s[1]]; lastQ = null; [x, y] = [s[2], s[3]];
    } else if (C === 'Q' || C === 'T') {
      const [qx, qy] = C === 'Q' ? [ox + next(), oy + next()] : lastQ ? [2 * x - lastQ[0], 2 * y - lastQ[1]] : [x, y];
      const [ex, ey] = [ox + next(), oy + next()];
      out.push(['C', x + (2 / 3) * (qx - x), y + (2 / 3) * (qy - y), ex + (2 / 3) * (qx - ex), ey + (2 / 3) * (qy - ey), ex, ey]);
      lastQ = [qx, qy]; lastC = null; [x, y] = [ex, ey];
    } else if (C === 'A') {
      const rx = next(), ry = next(), rot = next(), large = flag(), sweep = flag();
      const [ex, ey] = [ox + next(), oy + next()];
      for (const c of arcToCubics(x, y, rx, ry, rot, large, sweep, ex, ey)) out.push(['C', ...c]);
      lastC = lastQ = null; [x, y] = [ex, ey];
    } else i++;
  }
  return out;
}

/** An elliptical arc as cubic curves (SVG implementation notes, F.6). */
function arcToCubics(x1, y1, rx, ry, angle, large, sweep, x2, y2) {
  if (rx === 0 || ry === 0 || (x1 === x2 && y1 === y2)) return [[x1, y1, x2, y2, x2, y2]];
  rx = Math.abs(rx); ry = Math.abs(ry);
  const phi = (angle * Math.PI) / 180, cos = Math.cos(phi), sin = Math.sin(phi);
  const dx = (x1 - x2) / 2, dy = (y1 - y2) / 2;
  const x1p = cos * dx + sin * dy, y1p = -sin * dx + cos * dy;
  const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lambda > 1) { rx *= Math.sqrt(lambda); ry *= Math.sqrt(lambda); }
  const sign = large === sweep ? -1 : 1;
  const num_ = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
  const coef = sign * Math.sqrt(Math.max(0, num_ / (rx * rx * y1p * y1p + ry * ry * x1p * x1p)));
  const cxp = (coef * rx * y1p) / ry, cyp = (-coef * ry * x1p) / rx;
  const cx = cos * cxp - sin * cyp + (x1 + x2) / 2, cy = sin * cxp + cos * cyp + (y1 + y2) / 2;
  const angleOf = (ux, uy, vx, vy) => {
    const a = Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
    return a;
  };
  const t1 = angleOf(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let dt = angleOf((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
  if (!sweep && dt > 0) dt -= 2 * Math.PI;
  if (sweep && dt < 0) dt += 2 * Math.PI;
  const parts = Math.max(1, Math.ceil(Math.abs(dt) / (Math.PI / 2)));
  const step = dt / parts, k = (4 / 3) * Math.tan(step / 4);
  const point = t => [cx + rx * Math.cos(t) * cos - ry * Math.sin(t) * sin, cy + rx * Math.cos(t) * sin + ry * Math.sin(t) * cos];
  const deriv = t => [-rx * Math.sin(t) * cos - ry * Math.cos(t) * sin, -rx * Math.sin(t) * sin + ry * Math.cos(t) * cos];
  const curves = [];
  for (let p = 0, t = t1; p < parts; p++, t += step) {
    const [ax, ay] = point(t), [bx, by] = point(t + step), [dax, day] = deriv(t), [dbx, dby] = deriv(t + step);
    curves.push([ax + k * dax, ay + k * day, bx - k * dbx, by - k * dby, bx, by]);
  }
  const last = curves.at(-1);
  last[4] = x2; last[5] = y2;
  return curves;
}

/**
 * A nested <svg>'s own transform: its position, and its viewBox fitted into its width and
 * height as `preserveAspectRatio` says (centred and whole by default).
 */
function viewport(a) {
  const x = num(a.x), y = num(a.y);
  if (!a.viewBox) return [1, 0, 0, 1, x, y];
  const [vx, vy, vw, vh] = a.viewBox.split(/[\s,]+/).map(Number);
  const w = a.width !== undefined ? num(a.width) : vw, h = a.height !== undefined ? num(a.height) : vh;
  const [align = 'xMidYMid', fit = 'meet'] = (a.preserveAspectRatio ?? '').trim().split(/\s+/).filter(Boolean);
  let sx = w / vw, sy = h / vh;
  if (align !== 'none') sx = sy = fit === 'slice' ? Math.max(sx, sy) : Math.min(sx, sy);
  const free = (part, room, size, scale) => (part === 'Min' ? 0 : part === 'Max' ? room - size * scale : (room - size * scale) / 2);
  const ax = align === 'none' ? 0 : free(align.slice(1, 4), w, vw, sx);
  const ay = align === 'none' ? 0 : free(align.slice(5, 8), h, vh, sy);
  return [sx, 0, 0, sy, x + ax - vx * sx, y + ay - vy * sy];
}

/** A shape element as path data, before transforms. */
function shapePath(node) {
  const a = node.attrs;
  switch (node.name) {
    case 'path': return a.d ?? '';
    case 'rect': {
      const x = num(a.x), y = num(a.y), w = num(a.width), h = num(a.height);
      let rx = a.rx !== undefined ? num(a.rx) : a.ry !== undefined ? num(a.ry) : 0;
      let ry = a.ry !== undefined ? num(a.ry) : rx;
      rx = Math.min(rx, w / 2); ry = Math.min(ry, h / 2);
      if (!rx || !ry) return `M${x} ${y}H${x + w}V${y + h}H${x}Z`;
      return `M${x + rx} ${y}H${x + w - rx}A${rx} ${ry} 0 0 1 ${x + w} ${y + ry}V${y + h - ry}A${rx} ${ry} 0 0 1 ${x + w - rx} ${y + h}H${x + rx}A${rx} ${ry} 0 0 1 ${x} ${y + h - ry}V${y + ry}A${rx} ${ry} 0 0 1 ${x + rx} ${y}Z`;
    }
    case 'circle':
    case 'ellipse': {
      const cx = num(a.cx), cy = num(a.cy);
      const rx = node.name === 'circle' ? num(a.r) : num(a.rx), ry = node.name === 'circle' ? num(a.r) : num(a.ry);
      return `M${cx - rx} ${cy}A${rx} ${ry} 0 1 0 ${cx + rx} ${cy}A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}Z`;
    }
    case 'line': return `M${num(a.x1)} ${num(a.y1)}L${num(a.x2)} ${num(a.y2)}`;
    case 'polyline':
    case 'polygon': {
      const p = (a.points ?? '').trim().split(/[\s,]+/).filter(Boolean).map(Number);
      if (p.length < 4) return '';
      let d = `M${p[0]} ${p[1]}`;
      for (let i = 2; i + 1 < p.length; i += 2) d += `L${p[i]} ${p[i + 1]}`;
      return node.name === 'polygon' ? d + 'Z' : d;
    }
    default: return '';
  }
}

const fmt = n => {
  const r = Math.round(n * 1000) / 1000;
  return Object.is(r, -0) ? '0' : String(r);
};
function pathData(segments, m) {
  return segments.map(([c, ...p]) => {
    if (c === 'Z') return 'Z';
    const pts = [];
    for (let i = 0; i < p.length; i += 2) pts.push(...apply(m, [p[i], p[i + 1]]));
    return c + pts.map(fmt).join(' ');
  }).join('');
}

const NAMED = { black: '#000000', white: '#ffffff', red: '#ff0000', none: 'none' };
/** An SVG paint as `#AARRGGBB`, or null for none. */
function paint(value, opacity = 1) {
  if (!value || value === 'none') return null;
  let v = value.trim().toLowerCase();
  if (v === 'currentcolor') v = '#000000';
  v = NAMED[v] ?? v;
  if (v === 'none' || v.startsWith('url(')) return null;
  let hex;
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(v);
  if (short) hex = short.slice(1).map(c => c + c).join('');
  else if (/^#[0-9a-f]{6}$/.test(v)) hex = v.slice(1);
  else if (/^#[0-9a-f]{8}$/.test(v)) { opacity *= parseInt(v.slice(7), 16) / 255; hex = v.slice(1, 7); }
  else {
    const rgb = /^rgba?\(([^)]+)\)$/.exec(v);
    if (!rgb) return '#FF000000';
    const [r, g, b, al] = rgb[1].split(/[\s,/]+/).map(Number);
    if (al !== undefined && !Number.isNaN(al)) opacity *= al;
    hex = [r, g, b].map(c => Math.round(c).toString(16).padStart(2, '0')).join('');
  }
  const alpha = Math.round(Math.max(0, Math.min(1, opacity)) * 255).toString(16).padStart(2, '0');
  return `#${alpha}${hex}`.toUpperCase();
}

const INHERITED = ['fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'fill-rule', 'fill-opacity', 'stroke-opacity', 'vector-effect'];
const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

/** An SVG icon as an Android vector drawable. */
export function vectorDrawable(svgText) {
  const svg = parseXml(svgText);
  if (!svg) throw new Error('Not an SVG');
  const vb = (svg.attrs.viewBox ?? `0 0 ${num(svg.attrs.width) || 24} ${num(svg.attrs.height) || 24}`).split(/[\s,]+/).map(Number);
  const width = num(svg.attrs.width) || vb[2];
  const height = num(svg.attrs.height) || vb[3];
  const ids = new Map();
  const index = node => {
    if (node.attrs.id) ids.set(node.attrs.id, node);
    node.children.forEach(index);
  };
  index(svg);
  const lines = [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<!-- Generated from DS1/x-icon by scripts/native-android.mjs. Do not edit. -->',
    `<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="${fmt(width)}dp" android:height="${fmt(height)}dp" android:viewportWidth="${fmt(vb[2])}" android:viewportHeight="${fmt(vb[3])}">`,
  ];
  const base = [1, 0, 0, 1, -vb[0], -vb[1]];
  const shapes = new Set(['path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon']);

  const clipData = (ref, m) => {
    const node = ids.get(/url\(#([^)]+)\)/.exec(ref)?.[1] ?? '');
    if (!node) return '';
    const parts = [];
    const walk = (n, mm) => {
      const t = multiply(mm, parseTransform(n.attrs.transform));
      if (shapes.has(n.name)) parts.push(pathData(parsePath(shapePath(n)), t));
      n.children.forEach(c => walk(c, t));
    };
    node.children.forEach(c => walk(c, m));
    return parts.join('');
  };

  const visit = (node, m, style, opacity, depth) => {
    if (['defs', 'clipPath', 'mask', 'filter', 'title', 'desc', 'style', 'metadata', 'linearGradient', 'radialGradient'].includes(node.name)) return;
    const own = { ...style };
    for (const k of INHERITED) if (node.attrs[k] !== undefined) own[k] = node.attrs[k];
    const t = multiply(multiply(m, parseTransform(node.attrs.transform)), node.name === 'svg' ? viewport(node.attrs) : IDENTITY);
    const o = opacity * (node.attrs.opacity !== undefined ? num(node.attrs.opacity) : 1);
    const pad = '  '.repeat(depth);
    const clip = node.attrs['clip-path'] ? clipData(node.attrs['clip-path'], t) : '';
    if (clip) lines.push(`${pad}<group>`, `${pad}  <clip-path android:pathData="${clip}"/>`);
    const inner = clip ? depth + 1 : depth;
    if (shapes.has(node.name)) {
      const d = pathData(parsePath(shapePath(node)), t);
      if (d) {
        const fill = paint(own.fill ?? '#000000', o * (own['fill-opacity'] !== undefined ? num(own['fill-opacity']) : 1));
        const stroke = paint(own.stroke, o * (own['stroke-opacity'] !== undefined ? num(own['stroke-opacity']) : 1));
        if (fill || stroke) {
          const scale = own['vector-effect'] === 'non-scaling-stroke' ? 1 : Math.sqrt(Math.abs(t[0] * t[3] - t[1] * t[2]));
          const attrs = [`android:pathData="${esc(d)}"`];
          if (fill) attrs.push(`android:fillColor="${fill}"`);
          if (fill && own['fill-rule'] === 'evenodd') attrs.push('android:fillType="evenOdd"');
          if (stroke) {
            attrs.push(`android:strokeColor="${stroke}"`, `android:strokeWidth="${fmt((own['stroke-width'] !== undefined ? num(own['stroke-width']) : 1) * scale)}"`);
            if (own['stroke-linecap']) attrs.push(`android:strokeLineCap="${own['stroke-linecap']}"`);
            if (own['stroke-linejoin']) attrs.push(`android:strokeLineJoin="${own['stroke-linejoin'] === 'arcs' || own['stroke-linejoin'] === 'miter-clip' ? 'miter' : own['stroke-linejoin']}"`);
            if (own['stroke-miterlimit']) attrs.push(`android:strokeMiterLimit="${num(own['stroke-miterlimit'])}"`);
          }
          lines.push(`${'  '.repeat(inner + 1)}<path ${attrs.join(' ')}/>`);
        }
      }
    }
    for (const child of node.children) visit(child, t, own, o, inner);
    if (clip) lines.push(`${pad}</group>`);
  };
  for (const child of svg.children) visit(child, base, { fill: svg.attrs.fill ?? '#000000', stroke: svg.attrs.stroke, 'stroke-width': svg.attrs['stroke-width'], 'stroke-linecap': svg.attrs['stroke-linecap'], 'stroke-linejoin': svg.attrs['stroke-linejoin'] }, 1, 0);
  lines.push('</vector>', '');
  return lines.join('\n');
}
