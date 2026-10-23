/** Bake a seamless 128px grain/fibre tile. No canvas or filters at runtime. */
import { deflateSync } from 'node:zlib';
import { readFileSync, writeFileSync } from 'node:fs';

const size = 128;
function noise(seed) {
  const random = () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let x = seed;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
  return Float32Array.from({ length: size * size }, () => (random() + random() + random()) / 3 - 0.5);
}

const grain = noise(71);
const fibre = noise(1957);
// PNG grayscale + alpha. Black and white flecks work on either paper colour.
const pixels = Buffer.alloc(size * (1 + size * 2));
for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
  let soft = 0;
  for (let dy = -2; dy <= 2; dy++) for (let dx = -4; dx <= 4; dx++) {
    soft += fibre[((y + dy + size) % size) * size + ((x + dx + size) % size)];
  }
  const value = grain[y * size + x] * 0.7 + soft / Math.sqrt(45) * 0.3;
  const offset = y * (1 + size * 2) + 1 + x * 2;
  pixels[offset] = value < 0 ? 0 : 255;
  pixels[offset + 1] = Math.min(18, Math.round(Math.abs(value) * 48));
}

function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type), data]);
  let crc = 0xffffffff;
  for (const byte of body) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
  return Buffer.concat([length, body, checksum]);
}

const header = Buffer.alloc(13);
header.writeUInt32BE(size, 0);
header.writeUInt32BE(size, 4);
header[8] = 8;
header[9] = 4;
const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(pixels, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
const path = new URL('../DS1/1-root/material.css', import.meta.url);
const current = readFileSync(path, 'utf8');
const next = current.replace(/\/\* paper-tile:start \*\/[\s\S]*?\/\* paper-tile:end \*\//, `/* paper-tile:start */\n  background-image: url("data:image/png;base64,${png.toString('base64')}");\n  /* paper-tile:end */`);
if (process.argv.includes('--check')) {
  if (next !== current) throw new Error('Paper tile is stale; run node scripts/material-paper.mjs');
} else writeFileSync(path, next);
console.log(`Paper: ${size} × ${size}, ${png.length} bytes, generated once at authoring time.`);
