// Generates PWA PNG icons (192x192, 512x512, apple-touch-icon 180x180)
// Run: node scripts/generate-pwa-icons.cjs
// No external dependencies required - uses built-in zlib

const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  const table = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c;
  }
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeB = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeB, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData));
  return Buffer.concat([len, typeB, data, crc]);
}

function createFootballPNG(size) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const rowBytes = 1 + size * 3;
  const raw = Buffer.alloc(size * rowBytes);
  const cx = size / 2, cy = size / 2;
  const outerR = size * 0.44;

  for (let y = 0; y < size; y++) {
    const rowOffset = y * rowBytes;
    raw[rowOffset] = 0;
    for (let x = 0; x < size; x++) {
      const dx = x - cx, dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const px = rowOffset + 1 + x * 3;

      if (dist <= outerR) {
        const t = dist / outerR;
        raw[px] = Math.min(255, Math.round(15 + t * 20));
        raw[px + 1] = Math.min(255, Math.round(180 - t * 60));
        raw[px + 2] = Math.min(255, Math.round(80 + t * 100));
      } else if (dist <= outerR + 2) {
        raw[px] = 50; raw[px + 1] = 200; raw[px + 2] = 120;
      } else {
        raw[px] = 10; raw[px + 1] = 22; raw[px + 2] = 40;
      }
    }
  }

  const compressed = zlib.deflateSync(raw);

  const appName = Buffer.from('QuizGoal 2026');
  const textData = Buffer.concat([
    Buffer.from('Application\x00', 'ascii'),
    appName,
  ]);

  const chunks = [
    makeChunk('IHDR', ihdr),
    makeChunk('tEXt', textData),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ];

  return Buffer.concat([signature, ...chunks]);
}

const publicDir = path.join(__dirname, '..', 'public');

console.log('Generating PWA icons...');

const icon192 = createFootballPNG(192);
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), icon192);
console.log('  ✓ icon-192.png (192x192)');

const icon512 = createFootballPNG(512);
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), icon512);
console.log('  ✓ icon-512.png (512x512)');

const appleIcon = createFootballPNG(180);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleIcon);
console.log('  ✓ apple-touch-icon.png (180x180)');

function createMinimalPNG(w, h) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc(h * (1 + w * 3));
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 3)] = 0;
    for (let x = 0; x < w; x++) {
      const px = y * (1 + w * 3) + 1 + x * 3;
      raw[px] = 10; raw[px + 1] = 22; raw[px + 2] = 40;
    }
  }
  const compressed = zlib.deflateSync(raw);
  const chunks = [
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ];
  return Buffer.concat([signature, ...chunks]);
}

fs.writeFileSync(path.join(publicDir, 'screenshot-home.png'), createMinimalPNG(200, 356));
console.log('  ✓ screenshot-home.png (placeholder)');
fs.writeFileSync(path.join(publicDir, 'scheduler-wide.png'), createMinimalPNG(356, 200));
console.log('  ✓ scheduler-wide.png (placeholder)');

console.log('\nAll icons generated! Run `npx vite build` to include them in the PWA.');
