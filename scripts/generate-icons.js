import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  const toCrc = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(toCrc), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function createPng(width, height) {
  const header = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bit
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // deflate
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Draw icon with navy blue background (#0f172a / #1e3a8a) and a center badge
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  const cx = width / 2;
  const cy = height / 2;
  const r = width * 0.38;
  const innerR = width * 0.35;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // No filter
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Rounded squircle background (#0f172a to #1e3a8a gradient)
      const grad = y / height;
      let rBg = Math.round(15 + grad * 15);
      let gBg = Math.round(23 + grad * 35);
      let bBg = Math.round(42 + grad * 96);
      let aBg = 255;

      // Outer gold circle ring
      if (Math.abs(dist - r) < width * 0.02) {
        // Gold #f59e0b
        rawData[pxOffset] = 245;
        rawData[pxOffset + 1] = 158;
        rawData[pxOffset + 2] = 11;
        rawData[pxOffset + 3] = 255;
      } else if (dist < innerR) {
        // Inner blue circle
        const inGrad = (y - (cy - innerR)) / (innerR * 2);
        const rIn = Math.round(30 + inGrad * 20);
        const gIn = Math.round(64 + inGrad * 50);
        const bIn = Math.round(175 + inGrad * 60);

        // Center graduation cap / book shape (white #ffffff)
        // Diamond cap top: |dx| / (innerR * 0.65) + |dy + innerR * 0.2| / (innerR * 0.25) <= 1
        const capY = dy + innerR * 0.15;
        const inCapTop = (Math.abs(dx) / (innerR * 0.6)) + (Math.abs(capY) / (innerR * 0.25)) <= 1;
        const inBook = (Math.abs(dx) < innerR * 0.45) && (dy > 0 && dy < innerR * 0.45);

        if (inCapTop || inBook) {
          rawData[pxOffset] = 255;
          rawData[pxOffset + 1] = 255;
          rawData[pxOffset + 2] = 255;
          rawData[pxOffset + 3] = 255;
        } else {
          rawData[pxOffset] = rIn;
          rawData[pxOffset + 1] = gIn;
          rawData[pxOffset + 2] = bIn;
          rawData[pxOffset + 3] = 255;
        }
      } else {
        rawData[pxOffset] = rBg;
        rawData[pxOffset + 1] = gBg;
        rawData[pxOffset + 2] = bBg;
        rawData[pxOffset + 3] = aBg;
      }
    }
  }

  const idatData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', idatData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180));

console.log('Successfully generated PWA PNG icons!');
