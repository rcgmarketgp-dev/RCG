const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 calculation for PNG chunks
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcBuf = Buffer.alloc(4);
  const toCrc = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(toCrc), 0);

  return Buffer.concat([lenBuf, toCrc, crcBuf]);
}

function createPng(width, height, getPixel) {
  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]); // PNG Signature

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // 8-bit depth
  ihdr.writeUInt8(6, 9); // RGBA color type
  ihdr.writeUInt8(0, 10); // Compression method (deflate)
  ihdr.writeUInt8(0, 11); // Filter method
  ihdr.writeUInt8(0, 12); // Interlace method (none)

  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Raw uncompressed scanlines with filter byte 0 (None)
  const scanlineSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * scanlineSize);

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

// Draw professional gradient + machinery icon silhouette in pure math
function renderIconPixel(x, y, w, h, isMaskable) {
  // Normalize coords [0, 1]
  const nx = x / w;
  const ny = y / h;

  // Background gradient: Indigo to Deep Blue
  let r = Math.floor(30 + (67 - 30) * ny);
  let g = Math.floor(27 + (56 - 27) * ny);
  let b = Math.floor(75 + (202 - 75) * ny);
  let a = 255;

  // If not maskable, round corners with squircle
  if (!isMaskable) {
    const radius = 0.22;
    const dx = Math.max(0, Math.max(radius - nx, nx - (1 - radius)));
    const dy = Math.max(0, Math.max(radius - ny, ny - (1 - radius)));
    const dist = Math.hypot(dx, dy);
    if (dist > radius) {
      return [0, 0, 0, 0];
    }
  }

  // Centered coordinates [-1, 1]
  const cx = (nx - 0.5) * 2;
  const cy = (ny - 0.5) * 2;
  const radiusFromCenter = Math.hypot(cx, cy);

  // Machinery Crane / Gear Design
  // 1. Outer gear ring with teeth
  if (radiusFromCenter > 0.62 && radiusFromCenter < 0.74) {
    const angle = Math.atan2(cy, cx);
    const teeth = Math.sin(angle * 12);
    if (teeth > 0) {
      // Golden gear teeth
      return [245, 158, 11, 255]; // Amber 500
    }
  }

  // 2. Inner ring
  if (radiusFromCenter > 0.48 && radiusFromCenter < 0.54) {
    return [251, 191, 36, 255]; // Amber 400
  }

  // 3. Central Machinery Elements (Tracks, Body, Boom arm)
  // Track base (horizontal bar at bottom center)
  if (cy > 0.22 && cy < 0.42 && Math.abs(cx) < 0.60) {
    // Industrial steel track
    if (cy > 0.26 && cy < 0.38) {
      // track wheels
      const wheelPos = (cx + 0.6) % 0.24;
      if (wheelPos > 0.06 && wheelPos < 0.18) {
        return [251, 191, 36, 255]; // Golden wheels
      }
      return [15, 23, 42, 255]; // Dark track
    }
    return [224, 231, 255, 255]; // Steel frame
  }

  // Excavator Cabin / Body
  if (cy > -0.05 && cy <= 0.22 && cx > -0.42 && cx < 0.05) {
    // Window inside cabin
    if (cy > -0.01 && cy < 0.14 && cx > -0.36 && cx < -0.10) {
      return [30, 27, 75, 255]; // Dark cabin glass
    }
    return [245, 158, 11, 255]; // Amber body
  }

  // Boom Arm (diagonal line from cabin to top right)
  // Line 1: from (-0.05, 0.02) to (0.35, -0.38)
  const boom1Dist = Math.abs((cy - 0.02) - (-1.0 * (cx + 0.05)));
  if (boom1Dist < 0.06 && cx > -0.10 && cx < 0.40 && cy > -0.42 && cy < 0.06) {
    return [251, 191, 36, 255]; // Golden boom arm
  }

  // Bucket / Scoop at top right
  if (cx > 0.32 && cx < 0.52 && cy > -0.36 && cy < -0.12) {
    return [224, 231, 255, 255]; // Steel bucket
  }

  // Sparkle star at top left (-0.38, -0.45)
  const starDistX = Math.abs(cx - (-0.42));
  const starDistY = Math.abs(cy - (-0.45));
  if ((starDistX < 0.02 && starDistY < 0.12) || (starDistY < 0.02 && starDistX < 0.12)) {
    return [255, 255, 255, 255];
  }

  return [r, g, b, a];
}

const publicDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. pwa-192x192.png
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192, (x, y, w, h) => renderIconPixel(x, y, w, h, false)));
console.log('Generated pwa-192x192.png');

// 2. pwa-512x512.png
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512, (x, y, w, h) => renderIconPixel(x, y, w, h, false)));
console.log('Generated pwa-512x512.png');

// 3. pwa-maskable-512x512.png (full bleed background for Android squircles)
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512, (x, y, w, h) => renderIconPixel(x, y, w, h, true)));
console.log('Generated pwa-maskable-512x512.png');

// 4. apple-touch-icon.png (180x180)
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, (x, y, w, h) => renderIconPixel(x, y, w, h, false)));
console.log('Generated apple-touch-icon.png');

// 5. favicon.ico (fallback 32x32 png format)
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPng(32, 32, (x, y, w, h) => renderIconPixel(x, y, w, h, false)));
console.log('Generated favicon.ico');
