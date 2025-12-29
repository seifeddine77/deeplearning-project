const fs = require('fs');
const path = require('path');
const https = require('https');
const zlib = require('zlib');
const AdmZip = require('adm-zip');

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

function download(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(download(res.headers.location));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

function gunzip(buf) {
  return new Promise((resolve, reject) => {
    zlib.gunzip(buf, (err, out) => {
      if (err) return reject(err);
      resolve(out);
    });
  });
}

function untar(buf) {
  const files = new Map();
  let off = 0;

  function readString(b, start, len) {
    return b.subarray(start, start + len).toString('utf8').replace(/\0+$/, '').trim();
  }

  while (off + 512 <= buf.length) {
    const header = buf.subarray(off, off + 512);
    const name = readString(header, 0, 100);
    const sizeOct = readString(header, 124, 12);
    const typeFlag = readString(header, 156, 1);

    // End of archive (two consecutive zero blocks)
    if (!name) break;

    const size = parseInt(sizeOct, 8) || 0;
    const dataStart = off + 512;
    const dataEnd = dataStart + size;

    if (dataEnd > buf.length) throw new Error('Invalid tar (file exceeds buffer)');

    // typeFlag '0' or '' => regular file
    if (typeFlag === '0' || typeFlag === '') {
      files.set(name, buf.subarray(dataStart, dataEnd));
    }

    const padded = Math.ceil(size / 512) * 512;
    off = dataStart + padded;
  }

  return files;
}

async function main() {
  const outPath = process.argv[2] || path.join(process.cwd(), 'datasets', 'image', 'cifar10.zip');
  const maxPerClass = Math.max(0, Number(process.argv[3] || 1000));
  const includeTest = String(process.argv[4] || '1') !== '0';

  // Official CIFAR-10 binary version.
  const url = 'https://www.cs.toronto.edu/~kriz/cifar-10-binary.tar.gz';

  const classNames = [
    'airplane',
    'automobile',
    'bird',
    'cat',
    'deer',
    'dog',
    'frog',
    'horse',
    'ship',
    'truck'
  ];

  console.log('Downloading CIFAR-10...');
  const tgz = await download(url);
  const tarBuf = await gunzip(tgz);
  const files = untar(tarBuf);

  const zip = new AdmZip();
  const addedPerClass = new Array(10).fill(0);
  let addedTotal = 0;

  function addRecord(buf, idx, splitName) {
    const label = buf[0];
    if (label < 0 || label > 9) return;
    if (maxPerClass > 0 && addedPerClass[label] >= maxPerClass) return;

    const img = buf.subarray(1);
    const r = img.subarray(0, 1024);
    const g = img.subarray(1024, 2048);
    const b = img.subarray(2048, 3072);

    const png = encodePngRgb(32, 32, (x, y) => {
      const k = y * 32 + x;
      return [r[k], g[k], b[k]];
    });

    const clsName = classNames[label];
    const name = `${clsName}/${splitName}_${clsName}_${String(idx).padStart(6, '0')}.png`;
    zip.addFile(name, Buffer.from(png));
    addedPerClass[label] += 1;
    addedTotal += 1;
  }

  function processBatchFile(fileName, splitName) {
    const buf = files.get(fileName);
    if (!buf) throw new Error(`Missing file in tar: ${fileName}`);

    const recordSize = 3073;
    const n = Math.floor(buf.length / recordSize);
    for (let i = 0; i < n; i++) {
      const start = i * recordSize;
      const rec = buf.subarray(start, start + recordSize);
      addRecord(rec, i, splitName);
    }
  }

  for (let i = 1; i <= 5; i++) {
    processBatchFile(`cifar-10-batches-bin/data_batch_${i}.bin`, 'train');
  }

  if (includeTest) {
    processBatchFile('cifar-10-batches-bin/test_batch.bin', 'test');
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  zip.writeZip(outPath);

  console.log(`OK: ${outPath}`);
  console.log(`classes=10 addedTotal=${addedTotal} maxPerClass=${maxPerClass || 'unlimited'} (train + ${includeTest ? 'test' : 'no test'})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
