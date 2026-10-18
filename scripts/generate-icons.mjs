#!/usr/bin/env node
/**
 * Generates PakRoam's favicon set from the site's own logo mark, in pure Node
 * (no native/image dependencies), so it can be re-run after brand changes:
 *
 *   node scripts/generate-icons.mjs
 *
 * Output:
 *   public/favicon.ico     16 / 32 / 48 px, 32-bit BMP entries + AND mask
 *                          (most compatible with legacy browsers/tools)
 *   public/icon.png        192x192 — favicon for modern browsers + Android touch
 *   public/apple-icon.png  180x180, fully opaque — iOS ignores transparency and
 *                          applies its own corner mask
 *
 * The artwork mirrors the header logo tile in `components/header.tsx`:
 * a rounded square filled with `bg-gradient-to-br from-brand-600 to-sky-500`
 * and the white lucide `Signal` mark (baseline dot + three ascending bars).
 */

import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "public");

// --- Brand constants (keep in sync with components/header.tsx) ---------------
const GRADIENT_FROM = [0x25, 0x63, 0xeb]; // brand-600, gradient start (top-left)
const GRADIENT_TO = [0x0e, 0xa5, 0xe9]; // sky-500, gradient end (bottom-right)
const WHITE = [255, 255, 255];
/** Corner radius as a fraction of the tile — echoes `rounded-xl` on the 36px header tile */
const CORNER_RATIO = 0.3;
/** Signal glyph ink width as a fraction of the tile */
const INK_RATIO = 0.5;

/**
 * lucide `signal` as stroked segments in its 24x24 viewBox (stroke radius 1,
 * round caps): baseline dot + three ascending signal bars.
 */
const SIGNAL = [
  [2, 20, 2.01, 20],
  [7, 20, 7, 16],
  [12, 20, 12, 12],
  [17, 20, 17, 8],
];
/** Ink bounding box of those strokes in viewBox units */
const INK = { cx: 9.5, cy: 14, width: 17, stroke: 1 };

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Distance from point (x, y) to segment (x1, y1)-(x2, y2). */
function distToSegment(x, y, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  let t = lenSq === 0 ? 0 : ((x - x1) * dx + (y - y1) * dy) / lenSq;
  t = clamp01(t);
  const px = x1 + t * dx - x;
  const py = y1 + t * dy - y;
  return Math.hypot(px, py);
}

/** Point-in-rounded-rectangle (r = 0 degenerates to a plain square). */
function insideTile(x, y, size, radius) {
  if (x < 0 || y < 0 || x > size || y > size) return false;
  const cx = Math.min(Math.max(x, radius), size - radius);
  const cy = Math.min(Math.max(y, radius), size - radius);
  return Math.hypot(x - cx, y - cy) <= radius;
}

/**
 * Rasterise the mark at `size` px with 8x8 supersampled antialiasing.
 * Returns a Buffer of size*size*4 RGBA bytes.
 */
function render(size, { opaque = false } = {}) {
  const SS = 8;
  const radius = opaque ? 0 : CORNER_RATIO * size;
  const k = INK_RATIO / INK.width; // viewBox unit -> fraction of tile
  const segments = SIGNAL.map(([x1, y1, x2, y2]) => ({
    x1: (x1 - INK.cx) * k * size + size / 2,
    y1: (y1 - INK.cy) * k * size + size / 2,
    x2: (x2 - INK.cx) * k * size + size / 2,
    y2: (y2 - INK.cy) * k * size + size / 2,
  }));
  const stroke = INK.stroke * k * size;

  const rgba = Buffer.alloc(size * size * 4);
  const total = SS * SS;

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let cov = 0;
      let r = 0;
      let g = 0;
      let b = 0;

      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const x = px + (sx + 0.5) / SS;
          const y = py + (sy + 0.5) / SS;

          let onGlyph = false;
          for (const s of segments) {
            if (distToSegment(x, y, s.x1, s.y1, s.x2, s.y2) <= stroke) {
              onGlyph = true;
              break;
            }
          }
          if (onGlyph) {
            r += WHITE[0];
            g += WHITE[1];
            b += WHITE[2];
            cov++;
            continue;
          }
          if (!insideTile(x, y, size, radius)) continue;

          // Diagonal (`to bottom right`) gradient, matching CSS `bg-gradient-to-br`
          const t = clamp01((x / size + y / size) / 2);
          r += GRADIENT_FROM[0] + (GRADIENT_TO[0] - GRADIENT_FROM[0]) * t;
          g += GRADIENT_FROM[1] + (GRADIENT_TO[1] - GRADIENT_FROM[1]) * t;
          b += GRADIENT_FROM[2] + (GRADIENT_TO[2] - GRADIENT_FROM[2]) * t;
          cov++;
        }
      }

      const o = (py * size + px) * 4;
      if (cov === 0) continue;
      rgba[o] = Math.round(r / cov);
      rgba[o + 1] = Math.round(g / cov);
      rgba[o + 2] = Math.round(b / cov);
      rgba[o + 3] = Math.round((cov / total) * 255);
    }
  }
  return rgba;
}

// --- PNG encoder (8-bit RGBA, filter 0) -------------------------------------
let crcTable = null;
function crc32(buf) {
  if (!crcTable) {
    crcTable = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c;
    }
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ -1) >>> 0;
}

function pngChunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

function encodePng(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); // width
  ihdr.writeUInt32BE(size, 4); // height
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  const stride = size * 4 + 1;
  const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0; // filter: none
    rgba.copy(raw, y * stride + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(raw, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

/**
 * ICO container with classic (non-PNG-compressed) 32-bit entries:
 * BITMAPINFOHEADER + bottom-up BGRA XOR bitmap + 1-bit AND mask.
 * Widely compatible — including tools that expect BMP-based icons.
 */
function encodeIco(images) {
  const dir = Buffer.alloc(6 + images.length * 16);
  dir.writeUInt16LE(0, 0); // reserved
  dir.writeUInt16LE(1, 2); // type: icon
  dir.writeUInt16LE(images.length, 4);

  let offset = dir.length;
  const bodies = [];

  for (let i = 0; i < images.length; i++) {
    const { size, rgba } = images[i];
    const maskRow = Math.ceil(size / 16) * 2; // padded to 16-bit words
    const xorSize = size * size * 4;
    const blob = Buffer.alloc(40 + xorSize + maskRow * size);

    blob.writeUInt32LE(40, 0); // biSize
    blob.writeInt32LE(size, 4); // biWidth (XOR bitmap)
    blob.writeInt32LE(size * 2, 8); // biHeight (XOR + AND)
    blob.writeUInt16LE(1, 12); // biPlanes
    blob.writeUInt16LE(32, 14); // biBitCount
    blob.writeUInt32LE(0, 16); // biCompression: BI_RGB
    blob.writeUInt32LE(xorSize, 20); // biSizeImage

    // XOR bitmap: bottom-up rows, BGRA
    for (let y = 0; y < size; y++) {
      const srcRow = size - 1 - y;
      for (let x = 0; x < size; x++) {
        const s = (srcRow * size + x) * 4;
        const d = 40 + y * size * 4 + x * 4;
        blob[d] = rgba[s + 2]; // B
        blob[d + 1] = rgba[s + 1]; // G
        blob[d + 2] = rgba[s]; // R
        blob[d + 3] = rgba[s + 3]; // A
      }
    }

    // AND mask: bottom-up, MSB = leftmost pixel, set where fully transparent
    const maskStart = 40 + xorSize;
    for (let y = 0; y < size; y++) {
      const srcRow = size - 1 - y;
      for (let x = 0; x < size; x++) {
        if (rgba[(srcRow * size + x) * 4 + 3] < 128) {
          blob[maskStart + y * maskRow + (x >> 3)] |= 0x80 >> (x & 7);
        }
      }
    }

    const e = 6 + i * 16;
    dir.writeUInt8(size >= 256 ? 0 : size, e); // width
    dir.writeUInt8(size >= 256 ? 0 : size, e + 1); // height
    dir.writeUInt8(0, e + 2); // colour count (unlimited)
    dir.writeUInt8(0, e + 3); // reserved
    dir.writeUInt16LE(1, e + 4); // planes
    dir.writeUInt16LE(32, e + 6); // bit count
    dir.writeUInt32LE(blob.length, e + 8); // bytes in resource
    dir.writeUInt32LE(offset, e + 12); // image data offset

    offset += blob.length;
    bodies.push(blob);
  }

  return Buffer.concat([dir, ...bodies]);
}

/** Crude ASCII preview so the artwork can be eyeballed in the terminal. */
function preview(size, rgba) {
  const cols = size;
  const rows = Math.max(1, Math.round(size / 2));
  const lines = [];
  for (let ry = 0; ry < rows; ry++) {
    let line = "";
    for (let rx = 0; rx < cols; rx++) {
      const px = Math.min(size - 1, Math.floor((rx + 0.5) * (size / cols)));
      const py = Math.min(size - 1, Math.floor((ry + 0.5) * (size / rows)));
      const o = (py * size + px) * 4;
      const a = rgba[o + 3];
      if (a < 64) {
        line += " ";
        continue;
      }
      const luma = 0.299 * rgba[o] + 0.587 * rgba[o + 1] + 0.114 * rgba[o + 2];
      line += luma > 200 ? "#" : luma > 115 ? "+" : ".";
    }
    lines.push(line);
  }
  return lines.join("\n");
}

// --- Generate ---------------------------------------------------------------
mkdirSync(OUT_DIR, { recursive: true });

const faviconSizes = [16, 32, 48];
const icoImages = faviconSizes.map((size) => ({ size, rgba: render(size) }));
const icon192 = render(192);
const apple180 = render(180, { opaque: true });

const files = [
  ["favicon.ico", encodeIco(icoImages)],
  ["icon.png", encodePng(192, icon192)],
  ["apple-icon.png", encodePng(180, apple180)],
];

for (const [name, buf] of files) {
  writeFileSync(path.join(OUT_DIR, name), buf);
  console.log(`wrote public/${name} (${buf.length} bytes)`);
}

console.log("\npreview (32px):");
console.log(preview(32, icoImages.find((i) => i.size === 32).rgba));