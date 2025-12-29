const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const zlib = require('zlib');

function makeSeed(seed) {
  return { s: (Number(seed) >>> 0) || 1 };
}

function rand01(seedObj) {
  seedObj.s = (seedObj.s * 1664525 + 1013904223) >>> 0;
  return seedObj.s / 0xffffffff;
}

function randn(seedObj) {
  const u1 = rand01(seedObj) || 1e-9;
  const u2 = rand01(seedObj) || 1e-9;
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

function writeCsv(outPath, header, rows) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const lines = [header.join(',')];
  for (const r of rows) lines.push(r.join(','));
  fs.writeFileSync(outPath, lines.join('\n'), 'utf-8');
  console.log(`OK: ${outPath}`);
}

function generateTabularCsv(outPath, opts) {
  const seed = makeSeed(opts.seed);
  const n = Number(opts.rows || 2000);
  const features = Number(opts.features || 10);
  const difficulty = String(opts.difficulty || 'medium');

  const noise = difficulty === 'easy' ? 0.25 : (difficulty === 'hard' ? 0.9 : 0.55);
  const sep = difficulty === 'easy' ? 2.2 : (difficulty === 'hard' ? 0.9 : 1.4);

  const header = [];
  for (let i = 1; i <= features; i++) header.push(`f${i}`);
  header.push('label');

  const rows = [];

  // Non-linear boundary using polar radius + noise (not linearly separable).
  for (let i = 0; i < n; i++) {
    const a = rand01(seed) * 2 * Math.PI;
    const baseR = (i % 2 === 0 ? 1.0 : 2.0);
    const r = baseR + randn(seed) * noise;
    const x = r * Math.cos(a);
    const y = r * Math.sin(a);

    // Label depends on radius + some overlap.
    const score = (Math.sqrt(x * x + y * y) - 1.5) + randn(seed) * (noise * 0.5);
    const label = score > 0 ? 1 : 0;

    const row = new Array(features);
    // First 2 features are informative
    row[0] = (x + (label ? sep : -sep) + randn(seed) * noise).toFixed(6);
    row[1] = (y + (label ? sep : -sep) + randn(seed) * noise).toFixed(6);

    // Remaining features: mix of weak signal + noise
    for (let j = 2; j < features; j++) {
      const weak = (label ? 1 : -1) * (sep * 0.15);
      row[j] = (weak + randn(seed) * (noise * 1.2)).toFixed(6);
    }

    row.push(label === 1 ? 'B' : 'A');
    rows.push(row);
  }

  writeCsv(outPath, header, rows);
}

function generateSequenceCsv(outPath, opts) {
  const seed = makeSeed(opts.seed);
  const rows = Number(opts.rows || 3000);
  const features = Number(opts.features || 10);
  const difficulty = String(opts.difficulty || 'medium');

  const noise = difficulty === 'easy' ? 0.10 : (difficulty === 'hard' ? 0.45 : 0.25);
  const sep = difficulty === 'easy' ? 2.6 : (difficulty === 'hard' ? 1.1 : 1.8);
  const switchProb = difficulty === 'easy' ? 0.01 : (difficulty === 'hard' ? 0.05 : 0.025);

  const header = [];
  for (let i = 1; i <= features; i++) header.push(`f${i}`);
  header.push('label');

  const lines = [header.join(',')];

  // Hidden state Markov-ish; label is state at time t
  let state = 0;
  for (let t = 0; t < rows; t++) {
    if (rand01(seed) < switchProb) state = 1 - state;
    const label = state === 0 ? 'A' : 'B';
    const base = state === 0 ? 0.0 : sep;

    const row = [];
    for (let j = 0; j < features; j++) {
      const periodic = Math.sin((t / 12) + j) * (difficulty === 'easy' ? 0.25 : 0.4);
      const drift = Math.cos((t / 40) + j) * (difficulty === 'hard' ? 0.35 : 0.2);
      const v = base + periodic + drift + randn(seed) * noise;
      row.push(v.toFixed(6));
    }
    row.push(label);
    lines.push(row.join(','));
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, lines.join('\n'), 'utf-8');
  console.log(`OK: ${outPath}`);
}

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
  const stride = width * 3;
  const raw = Buffer.alloc((stride + 1) * height);

  for (let y = 0; y < height; y++) {
    const rowStart = y * (stride + 1);
    raw[rowStart] = 0;
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
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const compressed = zlib.deflateSync(raw, { level: 6 });
  const idat = pngChunk('IDAT', compressed);
  const iend = pngChunk('IEND', Buffer.alloc(0));
  const ihdrChunk = pngChunk('IHDR', ihdr);

  return Buffer.concat([signature, ihdrChunk, idat, iend]);
}

function makeImageBuffer(className, size, seedValue, difficulty) {
  const seed = makeSeed(seedValue);

  const hard = difficulty === 'hard';
  const easy = difficulty === 'easy';

  // Make classes partially overlapping on purpose when difficulty increases.
  const base = {
    cats: [200, 60, 60],
    dogs: [60, 200, 60],
    birds: [60, 60, 200]
  };

  const bias = base[className] || [120, 120, 120];
  const mix = easy ? 0.0 : (hard ? 0.55 : 0.3);
  const noiseAmp = easy ? 18 : (hard ? 70 : 40);

  const stripeAmp = easy ? 45 : (hard ? 25 : 35);
  const stripeSize = easy ? 10 : (hard ? 6 : 8);
  const angleMode = className === 'cats' ? 0 : (className === 'dogs' ? 1 : 2);

  // mix biases to reduce separability
  const b2 = [
    bias[0] * (1 - mix) + 120 * mix,
    bias[1] * (1 - mix) + 120 * mix,
    bias[2] * (1 - mix) + 120 * mix
  ];

  return encodePngRgb(size, size, (x, y) => {
    const n = Math.floor(rand01(seed) * noiseAmp);

    let stripe;
    if (angleMode === 0) stripe = (x + y) % (stripeSize * 2) < stripeSize ? stripeAmp : 0;
    else if (angleMode === 1) stripe = (x - y + 1000) % (stripeSize * 2) < stripeSize ? stripeAmp : 0;
    else stripe = (x % (stripeSize * 2)) < stripeSize ? stripeAmp : 0;

    const r = Math.min(255, Math.max(0, Math.floor(b2[0] + stripe + n - noiseAmp / 2)));
    const g = Math.min(255, Math.max(0, Math.floor(b2[1] + stripe + n - noiseAmp / 2)));
    const b = Math.min(255, Math.max(0, Math.floor(b2[2] + stripe + n - noiseAmp / 2)));

    return [r, g, b];
  });
}

function generateImageZip(outPath, opts) {
  const difficulty = String(opts.difficulty || 'medium');
  const imgSize = Math.max(16, Number(opts.imgSize || 64));
  const perClass = Math.max(10, Number(opts.perClass || 60));
  const seedBase = Number(opts.seed || 123);

  const zip = new AdmZip();
  const classes = ['cats', 'dogs', 'birds'];

  for (const cls of classes) {
    for (let i = 0; i < perClass; i++) {
      const buf = makeImageBuffer(cls, imgSize, seedBase + i + (cls === 'cats' ? 1 : (cls === 'dogs' ? 10000 : 20000)), difficulty);
      const name = `${cls}/${cls}_${String(i).padStart(4, '0')}.png`;
      zip.addFile(name, Buffer.from(buf));
    }
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  zip.writeZip(outPath);
  console.log(`OK: ${outPath}`);
}

function main() {
  const root = path.join(process.cwd(), 'datasets');
  const seed = Number(process.env.DATASETS_SEED || 12345);

  const tabularDir = path.join(root, 'tabular');
  const seqDir = path.join(root, 'sequence');
  const imgDir = path.join(root, 'image');

  generateTabularCsv(path.join(tabularDir, 'tabular_easy.csv'), { seed, rows: 2500, features: 10, difficulty: 'easy' });
  generateTabularCsv(path.join(tabularDir, 'tabular_medium.csv'), { seed: seed + 1, rows: 3000, features: 10, difficulty: 'medium' });
  generateTabularCsv(path.join(tabularDir, 'tabular_hard.csv'), { seed: seed + 2, rows: 3500, features: 10, difficulty: 'hard' });

  generateSequenceCsv(path.join(seqDir, 'sequence_easy.csv'), { seed: seed + 10, rows: 3000, features: 10, difficulty: 'easy' });
  generateSequenceCsv(path.join(seqDir, 'sequence_medium.csv'), { seed: seed + 11, rows: 3500, features: 10, difficulty: 'medium' });
  generateSequenceCsv(path.join(seqDir, 'sequence_hard.csv'), { seed: seed + 12, rows: 4500, features: 10, difficulty: 'hard' });

  generateImageZip(path.join(imgDir, 'image_easy.zip'), { seed: seed + 20, imgSize: 64, perClass: 80, difficulty: 'easy' });
  generateImageZip(path.join(imgDir, 'image_medium.zip'), { seed: seed + 21, imgSize: 64, perClass: 80, difficulty: 'medium' });
  generateImageZip(path.join(imgDir, 'image_hard.zip'), { seed: seed + 22, imgSize: 64, perClass: 80, difficulty: 'hard' });

  console.log('Done. Folder:', root);
}

main();
