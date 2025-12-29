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

function parseIdxImages(buf) {
  const magic = buf.readUInt32BE(0);
  if (magic !== 2051) throw new Error(`Invalid IDX image magic: ${magic}`);
  const count = buf.readUInt32BE(4);
  const rows = buf.readUInt32BE(8);
  const cols = buf.readUInt32BE(12);
  const data = buf.subarray(16);
  return { count, rows, cols, data };
}

function parseIdxLabels(buf) {
  const magic = buf.readUInt32BE(0);
  if (magic !== 2049) throw new Error(`Invalid IDX label magic: ${magic}`);
  const count = buf.readUInt32BE(4);
  const data = buf.subarray(8);
  return { count, data };
}

async function main() {
  const outPath = process.argv[2] || path.join(process.cwd(), 'datasets', 'image', 'mnist.zip');
  const maxPerClass = Math.max(0, Number(process.argv[3] || 600));
  const useTest = String(process.argv[4] || '1') !== '0';

  const base = 'https://storage.googleapis.com/cvdf-datasets/mnist/';
  const files = {
    trainImages: 'train-images-idx3-ubyte.gz',
    trainLabels: 'train-labels-idx1-ubyte.gz',
    testImages: 't10k-images-idx3-ubyte.gz',
    testLabels: 't10k-labels-idx1-ubyte.gz'
  };

  console.log('Downloading MNIST...');
  const [trImgGz, trLblGz, teImgGz, teLblGz] = await Promise.all([
    download(base + files.trainImages),
    download(base + files.trainLabels),
    download(base + files.testImages),
    download(base + files.testLabels)
  ]);

  const [trImgBuf, trLblBuf, teImgBuf, teLblBuf] = await Promise.all([
    gunzip(trImgGz),
    gunzip(trLblGz),
    gunzip(teImgGz),
    gunzip(teLblGz)
  ]);

  const trainImages = parseIdxImages(trImgBuf);
  const trainLabels = parseIdxLabels(trLblBuf);

  if (trainImages.count !== trainLabels.count) {
    throw new Error(`MNIST train count mismatch: images=${trainImages.count} labels=${trainLabels.count}`);
  }

  let testImages = null;
  let testLabels = null;
  if (useTest) {
    testImages = parseIdxImages(teImgBuf);
    testLabels = parseIdxLabels(teLblBuf);
    if (testImages.count !== testLabels.count) {
      throw new Error(`MNIST test count mismatch: images=${testImages.count} labels=${testLabels.count}`);
    }
  }

  const zip = new AdmZip();
  const addedPerClass = new Array(10).fill(0);
  let addedTotal = 0;

  function maybeAddSample(label, pixels, idx, splitName) {
    const cls = String(label);
    if (maxPerClass > 0 && addedPerClass[label] >= maxPerClass) return;

    const png = encodePngRgb(28, 28, (x, y) => {
      const v = pixels[y * 28 + x];
      return [v, v, v];
    });

    const name = `${cls}/${splitName}_${cls}_${String(idx).padStart(6, '0')}.png`;
    zip.addFile(name, Buffer.from(png));
    addedPerClass[label] += 1;
    addedTotal += 1;
  }

  const imgSize = trainImages.rows * trainImages.cols;
  for (let i = 0; i < trainImages.count; i++) {
    const lbl = trainLabels.data[i];
    const start = i * imgSize;
    const pixels = trainImages.data.subarray(start, start + imgSize);
    maybeAddSample(lbl, pixels, i, 'train');
  }

  if (useTest && testImages && testLabels) {
    const imgSize2 = testImages.rows * testImages.cols;
    for (let i = 0; i < testImages.count; i++) {
      const lbl = testLabels.data[i];
      const start = i * imgSize2;
      const pixels = testImages.data.subarray(start, start + imgSize2);
      maybeAddSample(lbl, pixels, i, 'test');
    }
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  zip.writeZip(outPath);

  console.log(`OK: ${outPath}`);
  console.log(`classes=10 addedTotal=${addedTotal} maxPerClass=${maxPerClass || 'unlimited'} (train + ${useTest ? 'test' : 'no test'})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
