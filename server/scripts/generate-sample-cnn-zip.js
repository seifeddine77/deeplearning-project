const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const zlib = require('zlib');

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  const crcVal = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crcVal, 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function encodePngRgb(width, height, pixelFn) {
  // pixelFn(x,y) => [r,g,b]
  const stride = width * 3;
  const raw = Buffer.alloc((stride + 1) * height);

  for (let y = 0; y < height; y++) {
    const rowStart = y * (stride + 1);
    raw[rowStart] = 0; // filter type 0
    for (let x = 0; x < width; x++) {
      const [r, g, b] = pixelFn(x, y);
      const off = rowStart + 1 + x * 3;
      raw[off] = r & 255;
      raw[off + 1] = g & 255;
      raw[off + 2] = b & 255;
    }
  }

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const compressed = zlib.deflateSync(raw, { level: 6 });
  const idat = pngChunk('IDAT', compressed);
  const iend = pngChunk('IEND', Buffer.alloc(0));
  const ihdrChunk = pngChunk('IHDR', ihdr);

  return Buffer.concat([signature, ihdrChunk, idat, iend]);
}

function makeImageBuffer(kind, size, seed) {
  // Simple deterministic noise + stripes. Different colors per class.
  const redBias = kind === 'cats' ? 180 : 30;
  const blueBias = kind === 'dogs' ? 180 : 30;
  const greenBias = 40;

  // tiny seeded PRNG
  let s = (seed >>> 0) || 1;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };

  return encodePngRgb(size, size, (x, y) => {
    const stripe = (x + y) % 10 < 5 ? 40 : 0;
    const n = Math.floor(rand() * 30);
    const r = Math.min(255, redBias + stripe + n);
    const g = Math.min(255, greenBias + n);
    const b = Math.min(255, blueBias + stripe + n);
    return [r, g, b];
  });
}

async function main() {
  const outPath = process.argv[2] || path.join(process.cwd(), 'datasets', 'sample_cnn_dataset.zip');
  const imgSize = Math.max(8, Number(process.argv[3] || 64));
  const perClass = Math.max(5, Number(process.argv[4] || 40));

  const zip = new AdmZip();
  const classes = ['cats', 'dogs'];

  for (const cls of classes) {
    for (let i = 0; i < perClass; i++) {
      const buf = makeImageBuffer(cls, imgSize, i + (cls === 'cats' ? 1 : 100000));
      const name = `${cls}/${cls}_${String(i).padStart(4, '0')}.png`;
      zip.addFile(name, Buffer.from(buf));
    }
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  zip.writeZip(outPath);
  console.log(`OK: ${outPath}`);
  console.log(`classes=${classes.length} samplesPerClass=${perClass} imageSize=${imgSize}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
