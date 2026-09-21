// Draws the app icon (a coral branch over waves) and writes PNG files with no dependencies.
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const crcTable = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = buf => { let c = 0xFFFFFFFF; for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

// geometry in a 512x512 design space
const capsule = (px, py, ax, ay, bx, by, r) => {
  const vx = bx - ax, vy = by - ay, wx = px - ax, wy = py - ay;
  const t = Math.max(0, Math.min(1, (wx * vx + wy * vy) / (vx * vx + vy * vy || 1)));
  return Math.hypot(wx - t * vx, wy - t * vy) - r;
};
const BRANCH = [
  [256, 420, 256, 300, 17], [256, 350, 186, 268, 15], [186, 268, 160, 190, 13], [186, 268, 214, 196, 12],
  [256, 310, 328, 236, 15], [328, 236, 352, 158, 13], [328, 236, 296, 178, 12], [256, 300, 256, 210, 14], [256, 210, 240, 150, 12]
];
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));

function shade(x, y, maskable) {
  // background: midnight-blue paper of a ship's log, darker at the bottom
  let col = mix(hex('#1E3556'), hex('#0D1626'), y / 512);
  // bubbles in cream ink
  [[400, 110, 22], [352, 76, 12], [430, 170, 10]].forEach(([cx, cy, r]) => {
    const d = Math.hypot(x - cx, y - cy);
    if (Math.abs(d - r) < 3.2) col = mix(col, hex('#EADFC6'), 0.85);
  });
  // coral branch in wax-seal red
  let dmin = 1e9;
  BRANCH.forEach(([ax, ay, bx, by, r]) => { dmin = Math.min(dmin, capsule(x, y, ax, ay, bx, by, r)); });
  if (dmin < 0) col = mix(hex('#D4553F'), hex('#F0977F'), Math.max(0, 1 - (y - 150) / 280) * 0.55);
  // waves: cream and brass
  [[430, 12, '#EADFC6'], [462, 12, '#C9A24B']].forEach(([base, th, c], i) => {
    const wy = base + 9 * Math.sin((x / 512) * Math.PI * 4 + i * 1.6);
    if (Math.abs(y - wy) < th / 2) col = hex(c);
  });
  // brass porthole rings around the edge
  const rr = Math.hypot(x - 256, y - 256);
  if (Math.abs(rr - 236) < 3.5 || Math.abs(rr - 224) < 1.6) col = hex('#C9A24B');
  return col;
}

function render(size, { rounded, scale }) {
  const buf = Buffer.alloc(size * size * 4);
  const SS = 3;
  for (let py = 0; py < size; py++) for (let px = 0; px < size; px++) {
    let r = 0, g = 0, b = 0, a = 0;
    for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
      const u = (px + (sx + 0.5) / SS) / size * 512, v = (py + (sy + 0.5) / SS) / size * 512;
      // content scaling around the centre (for the maskable safe zone)
      const x = (u - 256) / scale + 256, y = (v - 256) / scale + 256;
      let alpha = 1;
      if (rounded) { // rounded square, corner radius 112
        const dx = Math.abs(u - 256) - (256 - 112), dy = Math.abs(v - 256) - (256 - 112);
        const d = Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0) - 112;
        alpha = d > 0 ? 0 : 1;
      }
      const c = shade(x, y);
      r += c[0] * alpha; g += c[1] * alpha; b += c[2] * alpha; a += alpha;
    }
    const n = SS * SS, o = (py * size + px) * 4;
    buf[o] = a ? Math.round(r / a) : 0; buf[o + 1] = a ? Math.round(g / a) : 0; buf[o + 2] = a ? Math.round(b / a) : 0; buf[o + 3] = Math.round(255 * a / n);
  }
  return png(size, size, buf);
}

const out = path.join(__dirname, '..', 'icons');
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'icon-512.png'), render(512, { rounded: true, scale: 1 }));
fs.writeFileSync(path.join(out, 'icon-192.png'), render(192, { rounded: true, scale: 1 }));
fs.writeFileSync(path.join(out, 'maskable-512.png'), render(512, { rounded: false, scale: 0.78 }));
fs.writeFileSync(path.join(out, 'apple-touch-icon.png'), render(180, { rounded: false, scale: 0.9 }));
fs.writeFileSync(path.join(out, 'favicon-64.png'), render(64, { rounded: true, scale: 1 }));
console.log('icons written to', out);
