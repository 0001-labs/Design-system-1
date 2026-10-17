import { CLEAR, ICON_PALETTE, ICON_PATTERNS, MAX_INKS, applyPattern, blankIcon, cloneIcon, flipIcon, halfShard, paintSquare, recolorIcon, removeInk, rotateIcon, shardAt, type GridIcon } from '../../../../website/src/lib/icons/gridIcon';
import { FIGMA_ICONS } from '../../../../website/src/lib/icons/gridIconFigma';
import { PRODUCTS, copyDrawing, drawingSvg, fileStem, packIco, readDrawing, type Drawing } from '../../../../website/src/lib/icons/studio';
import { copyText, toast } from '../../../../DS1/0-face/feedback';
import type { Button as ButtonElement } from '../../../../DS1/2-core/ds-button';
import type { Input as InputElement } from '../../../../DS1/2-core/ds-input';
import type { Swatch } from '../../../../DS1/2-core/ds-swatch';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const DRAFT = 'ds1-icon-draft-v1';
const SHELF = 'ds1-icon-shelf-v1';
const load = (key: string) => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } };
let drawing = readDrawing(load(DRAFT)) ?? copyDrawing(PRODUCTS[0]);
const saved = load(SHELF);
let shelf: Drawing[] = Array.isArray(saved) ? saved.map(readDrawing).filter((d): d is Drawing => d !== null).slice(0, 30) : [];
let ink = Math.min(1, drawing.icon.inks.length - 1);
let tool = 'paint';
let brush = 2;
let cursor: [number, number] = [0, 0];
let pointer: number | null = null;
let strokeStart: Drawing | null = null;
let sliderStart: Drawing | null = null;
const touched = new Set<string>();
const undo: Drawing[] = [];
const redo: Drawing[] = [];
let previewId = 0;
/** Messages go to Design system 1's toast stack. */
const notice = (message: string) => { toast(message); };
/** The `ds-button` face around a native control; disabling the face disables the control. */
const face = (control: HTMLElement) => control.closest('ds-button') as ButtonElement;
const enable = (id: string, on: boolean) => { face($(id)).disabled = !on; };
/** A choice is pressed on its native button and `active` on its face. */
function press(control: HTMLElement, on: boolean) {
  control.setAttribute('aria-pressed', String(on));
  face(control)?.toggleAttribute('active', on);
}
/** A colour choice: a shared button face holding the shared swatch. */
function swatchButton(color: string, label: string, selected: boolean, tooltip = false) {
  const host = document.createElement('ds-button'); host.setAttribute('control', 'slotted'); host.setAttribute('choice', ''); host.setAttribute('icon', '');
  if (selected) host.setAttribute('active', '');
  const button = document.createElement('button'); button.type = 'button'; button.setAttribute('aria-label', label); button.setAttribute('aria-pressed', String(selected));
  if (tooltip) button.dataset.tooltip = label;
  const swatch = document.createElement('ds-swatch') as Swatch; swatch.setAttribute('aria-hidden', 'true'); swatch.value = color; swatch.selected = selected;
  button.append(swatch); host.append(button);
  return { host, button };
}
const history = $<ButtonElement>('history');
function persist() {
  try { localStorage.setItem(DRAFT, JSON.stringify(drawing)); $('save-state').textContent = 'Saved locally'; }
  catch { $('save-state').textContent = 'Not saved · export a file'; }
}
function remember(before: Drawing) {
  if (JSON.stringify(before) === JSON.stringify(drawing)) return;
  undo.push(before); if (undo.length > 80) undo.shift(); redo.length = 0;
}
function change(edit: () => void) {
  const before = copyDrawing(drawing); edit(); remember(before); render();
}
function svg(value: Drawing, size: number) { return drawingSvg(value, size, 'preview-' + previewId++); }
function overlay() {
  const lines = [];
  if ($<HTMLInputElement>('show-grid').checked) {
    for (let n = 0; n <= 16; n++) lines.push(`<path d="M${n} 0V16M0 ${n}H16" class="${n % brush === 0 ? 'major' : 'minor'}"/>`);
  }
  const x = Math.floor(cursor[0] / brush) * brush;
  const y = Math.floor(cursor[1] / brush) * brush;
  lines.push(`<rect x="${x}" y="${y}" width="${brush}" height="${brush}" class="cursor"/>`);
  $('overlay').innerHTML = lines.join('');
}
function render() {
  ink = Math.max(0, Math.min(ink, drawing.icon.inks.length - 1));
  $('artwork').innerHTML = svg({ ...drawing, padding: 0 }, 320);
  const name = $<InputElement>('drawing-name'); if (document.activeElement !== name) name.value = drawing.name;
  $('tab-title').textContent = drawing.name || 'Untitled icon'; $('tab-icon').innerHTML = svg(drawing, 16);
  for (const id of ['light-preview', 'dark-preview']) {
    $(id).innerHTML = [16, 24, 32, 64].map(size => `<div>${svg(drawing, size)}<span>${size}</span></div>`).join('');
  }
  $('inks').replaceChildren(...drawing.icon.inks.map((color, index) => {
    const { host, button } = swatchButton(color, `Ink ${index + 1}: ${color}`, index === ink);
    button.addEventListener('click', () => { ink = index; render(); }); return host;
  }));
  $<HTMLInputElement>('ink-color').value = drawing.icon.inks[ink].slice(0, 7);
  $<InputElement>('ink-hex').value = drawing.icon.inks[ink];
  enable('add-ink', drawing.icon.inks.length < MAX_INKS);
  enable('remove-ink', drawing.icon.inks.length > 1);
  const steps = `${undo.length > 0}:${redo.length > 0}`;
  if (history.dataset.steps !== steps) {
    history.dataset.steps = steps;
    history.segments = [
      { value: 'undo', label: 'Undo', icon: 'undo', disabled: !undo.length },
      { value: 'redo', label: 'Redo', icon: 'redo', disabled: !redo.length },
    ];
  }
  for (const option of document.querySelectorAll<HTMLElement>('[data-mask]')) press(option, option.dataset.mask === drawing.icon.mask);
  $<HTMLInputElement>('radius').value = String(drawing.radius); $<HTMLInputElement>('radius').disabled = drawing.icon.mask === 'circle';
  $('radius-value').textContent = drawing.icon.mask === 'circle' ? 'Circle' : String(drawing.radius);
  $<HTMLInputElement>('padding').value = String(drawing.padding); $('padding-value').textContent = String(drawing.padding);
  for (const option of document.querySelectorAll<HTMLElement>('[data-product]')) {
    const preset = PRODUCTS.find(p => p.key === option.dataset.product)!;
    press(option, JSON.stringify(copyDrawing(preset)) === JSON.stringify(drawing));
  }
  for (const option of document.querySelectorAll<HTMLElement>('[data-original]')) {
    const preset = FIGMA_ICONS.find(p => p.key === option.dataset.original)!;
    press(option, drawing.name === preset.name && JSON.stringify(drawing.icon) === JSON.stringify(preset.icon));
  }
  overlay(); persist();
}
function take(value: Drawing, description = 'A small drawing, with room to make it yours.') {
  change(() => { drawing = copyDrawing(value); }); $('drawing-description').textContent = description;
}
for (const button of document.querySelectorAll<HTMLElement>('[data-product]')) button.addEventListener('click', () => {
  const preset = PRODUCTS.find(p => p.key === button.dataset.product)!; take(preset, preset.description);
});
for (const button of document.querySelectorAll<HTMLElement>('[data-original]')) button.addEventListener('click', () => {
  const preset = FIGMA_ICONS.find(p => p.key === button.dataset.original)!;
  take({ name: preset.name, icon: preset.icon, radius: 0, padding: 0 }, 'From the original collection. Every ink and shape is editable.');
});
$('new-drawing').addEventListener('click', () => take({ name: 'Untitled icon', icon: { ...blankIcon(), cells: new Array(256).fill(CLEAR) }, radius: 0, padding: 0 }));
function renderShelf() {
  $('shelf').replaceChildren(...shelf.map((value, index) => {
    const wrap = document.createElement('div'); wrap.className = 'shelf-item';
    const control = (label: string, className: string) => {
      const host = document.createElement('ds-button'); host.setAttribute('control', 'slotted'); host.setAttribute('icon', ''); host.className = className;
      const button = document.createElement('button'); button.type = 'button'; button.setAttribute('aria-label', label); button.dataset.tooltip = label;
      host.append(button); wrap.append(host); return button;
    };
    const open = control(`Open ${value.name}`, 'drawing-choice'); open.innerHTML = svg(value, 32); open.addEventListener('click', () => take(value));
    const remove = control(`Remove ${value.name}`, 'remove-saved'); remove.innerHTML = '<ds-icon type="close" aria-hidden="true"></ds-icon>';
    remove.addEventListener('click', () => { shelf.splice(index, 1); saveShelf(); renderShelf(); });
    return wrap;
  }));
  $('shelf-note').textContent = shelf.length ? `${shelf.length} saved in this browser.` : 'Keep a few favourites in this browser.';
}
function saveShelf() { try { localStorage.setItem(SHELF, JSON.stringify(shelf)); } catch { notice('Browser storage is full. Download a file to keep your drawing.'); } }
$('save-drawing').addEventListener('click', () => {
  if (shelf.length >= 30) { notice('Your shelf holds 30 icons. Remove one to make room.'); return; }
  if (shelf.some(value => JSON.stringify(value) === JSON.stringify(drawing))) { notice('Already on your shelf.'); return; }
  shelf.push(copyDrawing(drawing)); saveShelf(); renderShelf(); notice('Added to your shelf.');
});
for (const button of document.querySelectorAll<HTMLElement>('[data-tool]')) button.addEventListener('click', () => selectTool(button.dataset.tool!));
function selectTool(value: string) {
  tool = value; for (const button of document.querySelectorAll<HTMLElement>('[data-tool]')) press(button, button.dataset.tool === tool);
}
for (const button of document.querySelectorAll<HTMLElement>('[data-mask]')) button.addEventListener('click', () => change(() => { drawing.icon.mask = button.dataset.mask as GridIcon['mask']; }));
function setColor(color: string) { if (/^#[\da-f]{6}([\da-f]{2})?$/i.test(color)) change(() => { drawing.icon.inks[ink] = color.toLowerCase(); }); }
$<HTMLInputElement>('ink-color').addEventListener('change', event => setColor((event.target as HTMLInputElement).value));
$<InputElement>('ink-hex').addEventListener('change', event => { const input = event.target as InputElement; if (!/^#[\da-f]{6}([\da-f]{2})?$/i.test(input.value)) { notice('Use a hex colour, such as #b6ff60.'); render(); } else setColor(input.value); });
$('palette').replaceChildren(...ICON_PALETTE.map(color => {
  const { host, button } = swatchButton(color.hex, color.name, false, true);
  button.removeAttribute('aria-pressed'); button.addEventListener('click', () => setColor(color.hex)); return host;
}));
$('add-ink').addEventListener('click', () => change(() => { if (drawing.icon.inks.length < MAX_INKS) { drawing.icon.inks.push('#ffffff'); ink = drawing.icon.inks.length - 1; } }));
$('remove-ink').addEventListener('click', () => change(() => { drawing.icon = removeInk(drawing.icon, ink); }));
$('recolor').addEventListener('click', () => change(() => { drawing.icon = recolorIcon(drawing.icon, Math.floor(Math.random() * 0xffffffff)); }));
for (const field of ['radius', 'padding'] as const) {
  const range = $<HTMLInputElement>(field);
  range.addEventListener('input', () => { sliderStart ??= copyDrawing(drawing); drawing[field] = Number(range.value); render(); });
  range.addEventListener('change', () => { if (sliderStart) remember(sliderStart); sliderStart = null; render(); });
}
const pattern = $<HTMLSelectElement>('pattern');
for (const value of ICON_PATTERNS) { const option = document.createElement('option'); option.value = value.key; option.textContent = value.name; pattern.append(option); }
pattern.addEventListener('change', () => { const value = ICON_PATTERNS.find(p => p.key === pattern.value); if (value) change(() => { drawing.icon = { ...applyPattern(drawing.icon, value.key), shards: [] }; }); pattern.value = ''; });
$('rotate').addEventListener('click', () => change(() => { drawing.icon = rotateIcon(drawing.icon); }));
$('flip').addEventListener('click', () => change(() => { drawing.icon = flipIcon(drawing.icon); }));
let nameBefore: Drawing | null = null;
$('drawing-name').addEventListener('focus', () => { nameBefore = copyDrawing(drawing); });
$('drawing-name').addEventListener('input', () => { drawing.name = $<InputElement>('drawing-name').value; render(); });
$('drawing-name').addEventListener('change', () => { if (nameBefore) remember(nameBefore); nameBefore = null; render(); });
$('brush').addEventListener('change', () => { brush = Number($<HTMLSelectElement>('brush').value); overlay(); });
$('show-grid').addEventListener('change', overlay);
function travel(from: Drawing[], to: Drawing[]) { const value = from.pop(); if (!value) return; to.push(copyDrawing(drawing)); drawing = value; render(); }
history.addEventListener('press', event => { if ((event as CustomEvent<{ value: string }>).detail.value === 'undo') travel(undo, redo); else travel(redo, undo); });
const canvas = $('canvas');
function position(event: PointerEvent): [number, number] {
  const bounds = canvas.getBoundingClientRect();
  return [Math.max(0, Math.min(15.999, (event.clientX - bounds.left) / bounds.width * 16)), Math.max(0, Math.min(15.999, (event.clientY - bounds.top) / bounds.height * 16))];
}
function paint(x: number, y: number) {
  const key = `${tool}:${Math.floor(x / brush)}:${Math.floor(y / brush)}:${tool === 'triangle' ? `${x % brush >= brush / 2}:${y % brush >= brush / 2}` : ''}`;
  if (touched.has(key)) return; touched.add(key);
  if (tool === 'triangle') {
    const shard = halfShard(x, y, brush, ink);
    drawing.icon.shards = drawing.icon.shards.filter(s => JSON.stringify(s.points) !== JSON.stringify(shard.points));
    if (drawing.icon.shards.length >= 256) { notice('The drawing has 256 triangles. Erase a few to add more.'); return; }
    drawing.icon.shards.push(shard);
  } else {
    const top = shardAt(drawing.icon, x, y); if (top >= 0) drawing.icon.shards.splice(top, 1);
    drawing.icon = paintSquare(drawing.icon, x, y, brush, tool === 'erase' ? CLEAR : ink);
  }
}
canvas.addEventListener('pointerdown', event => {
  if (event.button !== 0 || pointer !== null) return; event.preventDefault(); canvas.focus(); pointer = event.pointerId; canvas.setPointerCapture(pointer); strokeStart = copyDrawing(drawing); touched.clear(); cursor = position(event); paint(...cursor); render();
});
canvas.addEventListener('pointermove', event => {
  const next = position(event);
  if (event.pointerId === pointer) {
    const dx = next[0] - cursor[0], dy = next[1] - cursor[1], steps = Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) * 2);
    for (let i = 1; i <= steps; i++) paint(cursor[0] + dx * i / steps, cursor[1] + dy * i / steps);
    paint(...next);
  }
  cursor = next; if (event.pointerId === pointer) render(); else overlay();
});
function endStroke(event: PointerEvent) {
  if (event.pointerId !== pointer) return;
  if (strokeStart) remember(strokeStart); strokeStart = null; pointer = null; touched.clear(); render();
}
canvas.addEventListener('pointerup', endStroke); canvas.addEventListener('pointercancel', endStroke); canvas.addEventListener('lostpointercapture', endStroke);
canvas.addEventListener('keydown', event => {
  if (event.key.startsWith('Arrow')) {
    event.preventDefault(); const [x, y] = cursor;
    cursor = [Math.max(0, Math.min(16 - brush, x + (event.key === 'ArrowRight' ? brush : event.key === 'ArrowLeft' ? -brush : 0))), Math.max(0, Math.min(16 - brush, y + (event.key === 'ArrowDown' ? brush : event.key === 'ArrowUp' ? -brush : 0)))]; overlay();
  } else if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); touched.clear(); change(() => paint(cursor[0] + .25, cursor[1] + .25)); }
});
document.addEventListener('keydown', event => {
  if ((event.target as HTMLElement).matches('input,select,textarea,ds-input')) return;
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); event.shiftKey ? travel(redo, undo) : travel(undo, redo); }
  else if (!event.metaKey && !event.ctrlKey && !event.altKey && ['p', 't', 'e'].includes(event.key.toLowerCase())) selectTool(({p:'paint',t:'triangle',e:'erase'} as Record<string,string>)[event.key.toLowerCase()]);
});
function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = name; document.body.append(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 10000);
}
async function png(snapshot: Drawing, size: number): Promise<Blob> {
  const url = URL.createObjectURL(new Blob([drawingSvg(snapshot, size)], {type:'image/svg+xml'}));
  try {
    const image = new Image(); image.src = url; await image.decode();
    const surface = document.createElement('canvas'); surface.width = surface.height = size; const context = surface.getContext('2d'); if (!context) throw new Error('Canvas unavailable'); context.drawImage(image, 0, 0, size, size);
    return await new Promise((resolve, reject) => surface.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG export failed')), 'image/png'));
  } finally { URL.revokeObjectURL(url); }
}
async function exportFile(button: HTMLButtonElement, task: (snapshot: Drawing) => Promise<void>) {
  face(button).disabled = true; try { await task(copyDrawing(drawing)); notice('Your icon is ready.'); } catch { toast.error('Could not export. Try SVG or save your drawing file.'); } finally { face(button).disabled = false; }
}
$('download-svg').addEventListener('click', () => download(new Blob([drawingSvg(drawing)], {type:'image/svg+xml'}), fileStem(drawing.name)+'.svg'));
$('download-png').addEventListener('click', event => exportFile(event.currentTarget as HTMLButtonElement, async snapshot => download(await png(snapshot, 512), fileStem(snapshot.name)+'.png')));
$('download-ico').addEventListener('click', event => exportFile(event.currentTarget as HTMLButtonElement, async snapshot => {
  const images = await Promise.all([16,32,48,256].map(async size => ({size,bytes:new Uint8Array(await (await png(snapshot,size)).arrayBuffer())})));
  download(new Blob([packIco(images).buffer as ArrayBuffer], {type:'image/x-icon'}), fileStem(snapshot.name)+'.ico');
}));
$('copy-svg').addEventListener('click', () => { void copyText(drawingSvg(drawing), { toast: 'SVG copied' }); });
$('download-json').addEventListener('click', () => download(new Blob([JSON.stringify(drawing,null,2)], {type:'application/json'}), fileStem(drawing.name)+'.json'));
$('file-input').addEventListener('change', async () => {
  const input = $<HTMLInputElement>('file-input'); const file = input.files?.[0]; if (!file) return;
  try { if (file.size > 100000) throw new Error('Too large'); const value = readDrawing(JSON.parse(await file.text())); if (!value) throw new Error('Invalid'); take(value); notice('Drawing opened.'); }
  catch { toast.error('Choose a drawing JSON exported from this builder.'); } finally { input.value = ''; }
});
$('drawing-description').textContent = PRODUCTS.find(p => p.name === drawing.name)?.description ?? 'A small drawing, with room to make it yours.';
renderShelf(); render();
