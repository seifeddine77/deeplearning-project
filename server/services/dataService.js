const path = require('path');
const fs = require('fs');
const fsPromises = fs.promises;
const crypto = require('crypto');

if (process.platform === 'win32') {
  const tfjsNodeDepsDir = path.join(__dirname, '../../node_modules/@tensorflow/tfjs-node/deps/lib');
  if (fs.existsSync(tfjsNodeDepsDir) && !(process.env.PATH || '').includes(tfjsNodeDepsDir)) {
    process.env.PATH = `${tfjsNodeDepsDir};${process.env.PATH || ''}`;
  }
}

let tf;
try {
  tf = require('@tensorflow/tfjs-node');
} catch (e) {
  tf = require('@tensorflow/tfjs');
}

const AdmZip = require('adm-zip');

class DataService {
  constructor() {
    this.trainData = null;
    this.testData = null;
    this.valData = null;
    this.stats = {};
    this.isDataLoaded = false;  // Track if data has been uploaded
    this.tabularRaw = null;
    this.tabularTensors = null;
    this.imageRaw = null;
    this.imageTensors = null;
    this.sequenceRaw = null;
    this.sequenceTensors = null;
    this.currentDatasetId = null;
  }

  buildFingerprintFromStats(stats) {
    const datasetType = stats?.datasetType || 'tabular';
    const features = Number(stats?.features ?? 0);
    const classes = Number(stats?.classes ?? 0);
    const labelFormat = stats?.labelFormat || 'unknown';
    const inputShape = Array.isArray(stats?.inputShape) ? stats.inputShape : [];
    const split = {
      trainSize: Number(stats?.trainSize ?? 0),
      testSize: Number(stats?.testSize ?? 0),
      valSize: Number(stats?.valSize ?? 0)
    };

    const fingerprint = {
      version: 1,
      datasetType,
      features,
      classes,
      labelFormat,
      inputShape,
      split
    };

    const fingerprintHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(fingerprint))
      .digest('hex');

    return { fingerprint, fingerprintHash };
  }

  async processDataset(filePath, fileStats = null) {
    try {
      // Use provided file stats or defaults
      const stats = fileStats || {
        totalSamples: 60000,  // MNIST dataset size
        features: 784,        // 28x28 pixels
        classes: 10,          // Digits 0-9
      };

      const datasetType = stats.datasetType || 'tabular';

      this.stats = {
        ...stats,
        datasetType,
        filePath,
        labelFormat: stats.labelFormat || 'unknown',
        inputShape: Array.isArray(stats.inputShape) ? stats.inputShape : []
      };

      const fp = this.buildFingerprintFromStats(this.stats);
      this.stats.fingerprint = fp.fingerprint;
      this.stats.fingerprintHash = fp.fingerprintHash;

      this.isDataLoaded = true;  // Mark data as loaded
      return this.stats;
    } catch (error) {
      console.error('Error processing dataset:', error);
      throw error;
    }
  }

  async loadTabularCsv(filePath) {
    const content = await fsPromises.readFile(filePath, 'utf-8');
    const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length < 2) {
      throw new Error('CSV must contain header and at least one row');
    }

    const header = lines[0].split(',').map(h => String(h).trim());
    const firstHeader = (header[0] || '').toLowerCase();
    const lastHeader = (header[header.length - 1] || '').toLowerCase();
    const labelIndex = (firstHeader === 'label' || firstHeader === 'y' || firstHeader === 'target')
      ? 0
      : ((lastHeader === 'label' || lastHeader === 'y' || lastHeader === 'target') ? (header.length - 1) : (header.length - 1));

    const featureCount = Math.max(header.length - 1, 0);
    if (featureCount <= 0) {
      throw new Error('CSV must contain at least 1 feature column + 1 label column');
    }

    const x = [];
    const labels = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length < featureCount + 1) continue;
      const row = [];
      for (let j = 0; j < parts.length; j++) {
        if (j === labelIndex) continue;
        const v = Number(parts[j]);
        row.push(Number.isFinite(v) ? v : 0);
      }
      x.push(row);
      labels.push(String(parts[labelIndex]));
    }

    const uniq = Array.from(new Set(labels));
    uniq.sort();
    const labelToIndex = new Map(uniq.map((v, idx) => [v, idx]));
    const yIdx = labels.map(l => labelToIndex.get(l) ?? 0);

    const totalSamples = x.length;
    const classes = uniq.length || 0;

    if (totalSamples === 0) {
      throw new Error('No valid samples found in CSV');
    }

    const actualFeatureCount = x[0]?.length || featureCount;
    const xTensor = tf.tensor2d(x, [totalSamples, actualFeatureCount], 'float32');
    const yTensor = tf.oneHot(tf.tensor1d(yIdx, 'int32'), Math.max(classes, 2));

    this.tabularRaw = {
      xTensor,
      yTensor,
      featureCount: actualFeatureCount,
      classes: Math.max(classes, 2)
    };

    this.splitTabular(0.7, 0.2, 0.1);

    this.stats = {
      ...this.stats,
      datasetType: 'tabular',
      filePath,
      totalSamples,
      features: actualFeatureCount,
      classes: this.tabularRaw.classes,
      labelFormat: 'one_hot',
      inputShape: [actualFeatureCount],
      trainSize: this.trainData?.size || 0,
      testSize: this.testData?.size || 0,
      valSize: this.valData?.size || 0
    };

    const fp = this.buildFingerprintFromStats(this.stats);
    this.stats.fingerprint = fp.fingerprint;
    this.stats.fingerprintHash = fp.fingerprintHash;
    this.isDataLoaded = true;

    return this.stats;
  }

  async loadSequenceCsv(filePath, opts = {}) {
    const timesteps = Math.max(2, Number(opts.timesteps || 50));
    const stride = Math.max(1, Number(opts.stride || timesteps));

    const content = await fsPromises.readFile(filePath, 'utf-8');
    const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length < 2) {
      throw new Error('CSV must contain header and at least one row');
    }

    const header = lines[0].split(',').map(h => String(h).trim());
    const firstHeader = (header[0] || '').toLowerCase();
    const lastHeader = (header[header.length - 1] || '').toLowerCase();
    const labelIndex = (firstHeader === 'label' || firstHeader === 'y' || firstHeader === 'target')
      ? 0
      : ((lastHeader === 'label' || lastHeader === 'y' || lastHeader === 'target') ? (header.length - 1) : (header.length - 1));

    const featureCount = Math.max(header.length - 1, 0);
    if (featureCount <= 0) {
      throw new Error('CSV must contain at least 1 feature column + 1 label column');
    }

    const rowsX = [];
    const rowsLabel = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length < featureCount + 1) continue;
      const row = [];
      for (let j = 0; j < parts.length; j++) {
        if (j === labelIndex) continue;
        const v = Number(parts[j]);
        row.push(Number.isFinite(v) ? v : 0);
      }
      if (!row.length) continue;
      rowsX.push(row);
      rowsLabel.push(String(parts[labelIndex]));
    }

    if (rowsX.length < timesteps) {
      throw new Error(`Not enough rows (${rowsX.length}) to build sequences with timesteps=${timesteps}`);
    }

    const uniq = Array.from(new Set(rowsLabel));
    uniq.sort();
    const labelToIndex = new Map(uniq.map((v, idx) => [v, idx]));
    const classes = Math.max(uniq.length, 2);

    const sequencesX = [];
    const sequencesYIdx = [];
    for (let start = 0; start + timesteps <= rowsX.length; start += stride) {
      const seq = rowsX.slice(start, start + timesteps);
      if (seq.length !== timesteps) continue;
      sequencesX.push(seq);
      // Use label of last timestep as sequence label (common for windowing)
      const lbl = rowsLabel[start + timesteps - 1];
      sequencesYIdx.push(labelToIndex.get(lbl) ?? 0);
    }

    if (!sequencesX.length) {
      throw new Error('No sequences could be formed from CSV (check timesteps/stride)');
    }

    const totalSamples = sequencesX.length;
    const actualFeatureCount = sequencesX[0]?.[0]?.length || featureCount;

    const xTensor = tf.tensor3d(sequencesX, [totalSamples, timesteps, actualFeatureCount], 'float32');
    const yTensor = tf.oneHot(tf.tensor1d(sequencesYIdx, 'int32'), classes);

    this.sequenceRaw = {
      xTensor,
      yTensor,
      timesteps,
      featureCount: actualFeatureCount,
      classes
    };

    this.splitSequence(0.7, 0.2, 0.1);

    this.stats = {
      ...this.stats,
      datasetType: 'sequence',
      filePath,
      totalSamples,
      features: actualFeatureCount,
      classes,
      labelFormat: 'one_hot',
      inputShape: [timesteps, actualFeatureCount],
      trainSize: this.trainData?.size || 0,
      testSize: this.testData?.size || 0,
      valSize: this.valData?.size || 0
    };

    const fp = this.buildFingerprintFromStats(this.stats);
    this.stats.fingerprint = fp.fingerprint;
    this.stats.fingerprintHash = fp.fingerprintHash;
    this.isDataLoaded = true;

    return this.stats;
  }

  async loadImageZip(filePath, opts = {}) {
    const imageSize = Number(opts.imageSize || 64);
    const channels = Number(opts.channels || 3);
    const maxImages = Number(opts.maxImages || 0);

    if (!tf?.node?.decodeImage) {
      throw new Error('Image loading requires @tensorflow/tfjs-node (tf.node.decodeImage not available)');
    }

    const zip = new AdmZip(filePath);
    const entries = zip.getEntries();

    const isImageExt = (name) => {
      const lower = String(name || '').toLowerCase();
      return lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.bmp') || lower.endsWith('.webp');
    };

    const samples = [];
    for (const e of entries) {
      if (e.isDirectory) continue;
      if (!isImageExt(e.entryName)) continue;

      // folders-per-class: className/filename.jpg
      const parts = String(e.entryName).split(/[/\\]+/).filter(Boolean);
      if (parts.length < 2) continue;
      const className = parts[0];

      samples.push({ className, entry: e });
      if (maxImages > 0 && samples.length >= maxImages) break;
    }

    if (!samples.length) {
      throw new Error('No images found in zip. Expected folders-per-class structure (className/*.jpg)');
    }

    const classNames = Array.from(new Set(samples.map(s => s.className))).sort();
    const classToIndex = new Map(classNames.map((c, i) => [c, i]));
    const numClasses = Math.max(classNames.length, 2);

    const xs = [];
    const ys = [];

    for (const s of samples) {
      const buf = s.entry.getData();
      const x = tf.tidy(() => {
        const decoded = tf.node.decodeImage(buf, channels);
        const resized = tf.image.resizeBilinear(decoded, [imageSize, imageSize]);
        const normalized = resized.toFloat().div(tf.scalar(255));
        return normalized;
      });

      const idx = classToIndex.get(s.className) ?? 0;
      xs.push(x);
      ys.push(idx);
    }

    const xTensor = tf.stack(xs);
    xs.forEach(t => t.dispose());

    const yIdx = tf.tensor1d(ys, 'int32');
    const yTensor = tf.oneHot(yIdx, numClasses);
    yIdx.dispose();

    if (this.imageTensors) {
      this.imageTensors.xTrain?.dispose();
      this.imageTensors.yTrain?.dispose();
      this.imageTensors.xTest?.dispose();
      this.imageTensors.yTest?.dispose();
      this.imageTensors.xVal?.dispose();
      this.imageTensors.yVal?.dispose();
    }
    if (this.imageRaw) {
      this.imageRaw.xTensor?.dispose();
      this.imageRaw.yTensor?.dispose();
    }

    this.imageRaw = {
      xTensor,
      yTensor,
      totalSamples: xTensor.shape[0],
      imageSize,
      channels,
      classNames,
      classes: numClasses
    };

    this.splitImage(0.7, 0.2, 0.1);

    this.stats = {
      ...this.stats,
      datasetType: 'image',
      filePath,
      totalSamples: this.imageRaw.totalSamples,
      features: 0,
      classes: numClasses,
      labelFormat: 'one_hot',
      inputShape: [imageSize, imageSize, channels],
      trainSize: this.trainData?.size || 0,
      testSize: this.testData?.size || 0,
      valSize: this.valData?.size || 0,
      classNames
    };

    const fp = this.buildFingerprintFromStats(this.stats);
    this.stats.fingerprint = fp.fingerprint;
    this.stats.fingerprintHash = fp.fingerprintHash;
    this.isDataLoaded = true;

    return this.stats;
  }

  splitImage(trainRatio = 0.7, testRatio = 0.2, valRatio = 0.1) {
    if (!this.imageRaw?.xTensor || !this.imageRaw?.yTensor) {
      return null;
    }

    const total = trainRatio + testRatio + valRatio;
    if (Math.abs(total - 1.0) > 0.01) {
      throw new Error('Ratios must sum to 1.0');
    }

    const n = this.imageRaw.xTensor.shape[0];
    const indices = Array.from({ length: n }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    const trainSize = Math.floor(n * trainRatio);
    const testSize = Math.floor(n * testRatio);
    const valSize = n - trainSize - testSize;

    const trainIdx = tf.tensor1d(indices.slice(0, trainSize), 'int32');
    const testIdx = tf.tensor1d(indices.slice(trainSize, trainSize + testSize), 'int32');
    const valIdx = tf.tensor1d(indices.slice(trainSize + testSize), 'int32');

    const xTrain = tf.gather(this.imageRaw.xTensor, trainIdx);
    const yTrain = tf.gather(this.imageRaw.yTensor, trainIdx);
    const xTest = tf.gather(this.imageRaw.xTensor, testIdx);
    const yTest = tf.gather(this.imageRaw.yTensor, testIdx);
    const xVal = tf.gather(this.imageRaw.xTensor, valIdx);
    const yVal = tf.gather(this.imageRaw.yTensor, valIdx);

    trainIdx.dispose();
    testIdx.dispose();
    valIdx.dispose();

    this.imageTensors = { xTrain, yTrain, xTest, yTest, xVal, yVal };

    this.trainData = { size: trainSize };
    this.testData = { size: testSize };
    this.valData = { size: valSize };

    this.stats.trainSize = trainSize;
    this.stats.testSize = testSize;
    this.stats.valSize = valSize;

    return { trainSize, testSize, valSize };
  }

  getImageTrainTensors() {
    if (this.stats?.datasetType !== 'image') return null;
    if (!this.imageTensors?.xTrain || !this.imageTensors?.yTrain) return null;
    return this.imageTensors;
  }

  splitTabular(trainRatio = 0.7, testRatio = 0.2, valRatio = 0.1) {
    if (!this.tabularRaw?.xTensor || !this.tabularRaw?.yTensor) {
      return null;
    }

    const total = trainRatio + testRatio + valRatio;
    if (Math.abs(total - 1.0) > 0.01) {
      throw new Error('Ratios must sum to 1.0');
    }

    const n = this.tabularRaw.xTensor.shape[0];
    const indices = Array.from({ length: n }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    const trainSize = Math.floor(n * trainRatio);
    const testSize = Math.floor(n * testRatio);
    const valSize = n - trainSize - testSize;

    const trainIdx = tf.tensor1d(indices.slice(0, trainSize), 'int32');
    const testIdx = tf.tensor1d(indices.slice(trainSize, trainSize + testSize), 'int32');
    const valIdx = tf.tensor1d(indices.slice(trainSize + testSize), 'int32');

    if (this.tabularTensors) {
      this.tabularTensors.xTrain?.dispose();
      this.tabularTensors.yTrain?.dispose();
      this.tabularTensors.xTest?.dispose();
      this.tabularTensors.yTest?.dispose();
      this.tabularTensors.xVal?.dispose();
      this.tabularTensors.yVal?.dispose();
    }

    const xTrain = tf.gather(this.tabularRaw.xTensor, trainIdx);
    const yTrain = tf.gather(this.tabularRaw.yTensor, trainIdx);
    const xTest = tf.gather(this.tabularRaw.xTensor, testIdx);
    const yTest = tf.gather(this.tabularRaw.yTensor, testIdx);
    const xVal = tf.gather(this.tabularRaw.xTensor, valIdx);
    const yVal = tf.gather(this.tabularRaw.yTensor, valIdx);

    trainIdx.dispose();
    testIdx.dispose();
    valIdx.dispose();

    this.tabularTensors = { xTrain, yTrain, xTest, yTest, xVal, yVal };

    this.trainData = { size: trainSize };
    this.testData = { size: testSize };
    this.valData = { size: valSize };

    this.stats.trainSize = trainSize;
    this.stats.testSize = testSize;
    this.stats.valSize = valSize;

    return { trainSize, testSize, valSize };
  }

  getTabularTrainTensors() {
    if (this.stats?.datasetType !== 'tabular') return null;
    if (!this.tabularTensors?.xTrain || !this.tabularTensors?.yTrain) return null;
    return this.tabularTensors;
  }

  async preprocessData(normalization = 'minmax') {
    try {
      // Simulate data preprocessing
      const result = {
        method: normalization,
        samplesProcessed: this.stats.totalSamples || 1000,
        timestamp: new Date().toISOString()
      };

      if (normalization === 'minmax') {
        result.min = 0;
        result.max = 1;
      } else if (normalization === 'zscore') {
        result.mean = 0;
        result.std = 1;
      }

      return result;
    } catch (error) {
      console.error('Error preprocessing data:', error);
      throw error;
    }
  }

  async augmentData(augmentationType = 'crop', params = {}) {
    try {
      const originalSamples = this.stats.totalSamples || 60000;
      
      // Augmentation crée environ 30-50% de nouvelles images
      // Pas 100% (2x)!
      let augmentationFactor = 0.33; // 33% de nouvelles images
      
      if (augmentationType === 'crop') {
        augmentationFactor = 0.25; // Crop crée 25% de nouvelles images
      } else if (augmentationType === 'rotation') {
        augmentationFactor = 0.33; // Rotation crée 33% de nouvelles images
      } else if (augmentationType === 'flip') {
        augmentationFactor = 0.20; // Flip crée 20% de nouvelles images
      }
      
      const augmentedSamples = Math.floor(originalSamples * augmentationFactor);
      const totalAfterAugmentation = originalSamples + augmentedSamples;
      
      // UPDATE: Mettre à jour this.stats avec le nouveau total
      this.stats.totalSamples = totalAfterAugmentation;
      
      const result = {
        augmentationType,
        params,
        originalSamples: originalSamples,
        augmentedSamples: augmentedSamples,
        totalAfterAugmentation: totalAfterAugmentation,
        timestamp: new Date().toISOString()
      };

      if (augmentationType === 'crop') {
        result.cropSize = params.cropSize || 56;
      } else if (augmentationType === 'slider') {
        result.slideSteps = params.slideSteps || 4;
      }

      return result;
    } catch (error) {
      console.error('Error augmenting data:', error);
      throw error;
    }
  }

  async splitData(trainRatio = 0.7, testRatio = 0.2, valRatio = 0.1) {
    try {
      const dtype = String(this.stats?.datasetType || 'tabular');

      if (dtype === 'tabular' && this.tabularRaw?.xTensor && this.tabularRaw?.yTensor) {
        const result = this.splitTabular(trainRatio, testRatio, valRatio);
        return {
          ...(result || {}),
          trainRatio,
          testRatio,
          valRatio,
          totalSamples: this.tabularRaw.xTensor.shape[0],
          timestamp: new Date().toISOString()
        };
      }

      if (dtype === 'image' && this.imageRaw?.xTensor && this.imageRaw?.yTensor) {
        const result = this.splitImage(trainRatio, testRatio, valRatio);
        return {
          ...(result || {}),
          trainRatio,
          testRatio,
          valRatio,
          totalSamples: this.imageRaw.xTensor.shape[0],
          timestamp: new Date().toISOString()
        };
      }

      if (dtype === 'sequence' && this.sequenceRaw?.xTensor && this.sequenceRaw?.yTensor) {
        const result = this.splitSequence(trainRatio, testRatio, valRatio);
        return {
          ...(result || {}),
          trainRatio,
          testRatio,
          valRatio,
          totalSamples: this.sequenceRaw.xTensor.shape[0],
          timestamp: new Date().toISOString()
        };
      }

      const totalSamples = this.stats.totalSamples || 60000;
      
      const trainSize = Math.floor(totalSamples * trainRatio);
      const testSize = Math.floor(totalSamples * testRatio);
      const valSize = Math.floor(totalSamples * valRatio);

      this.trainData = { size: trainSize };
      this.testData = { size: testSize };
      this.valData = { size: valSize };
      
      // UPDATE: Store split info in stats for getDataStats()
      this.stats.trainSize = trainSize;
      this.stats.testSize = testSize;
      this.stats.valSize = valSize;

      return {
        trainSize,
        testSize,
        valSize,
        trainRatio,
        testRatio,
        valRatio,
        totalSamples,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error splitting data:', error);
      throw error;
    }
  }

  async getDataStats() {
    // Return stats if data exists (even if isDataLoaded is false)
    const hasData = this.stats && this.stats.totalSamples > 0;
    
    if (!hasData && !this.isDataLoaded) {
      return {
        totalSamples: 0,
        features: 0,
        classes: 0,
        datasetType: 'tabular',
        trainSize: 0,
        testSize: 0,
        valSize: 0,
        trainData: null,
        testData: null,
        valData: null,
        timestamp: new Date().toISOString()
      };
    }

    return {
      totalSamples: this.stats?.totalSamples || 0,
      features: this.stats?.features || 0,
      classes: this.stats?.classes || 0,
      datasetType: this.stats?.datasetType || 'tabular',
      labelFormat: this.stats?.labelFormat || 'unknown',
      inputShape: Array.isArray(this.stats?.inputShape) ? this.stats.inputShape : [],
      fingerprint: this.stats?.fingerprint || null,
      fingerprintHash: this.stats?.fingerprintHash || '',
      filePath: this.stats?.filePath || null,
      trainSize: this.stats?.trainSize || this.trainData?.size || 0,
      testSize: this.stats?.testSize || this.testData?.size || 0,
      valSize: this.stats?.valSize || this.valData?.size || 0,
      timestamp: new Date().toISOString()
    };
  }

  resetData() {
    // Reset all data to initial state
    this.trainData = null;
    this.testData = null;
    this.valData = null;
    if (this.tabularTensors) {
      this.tabularTensors.xTrain?.dispose();
      this.tabularTensors.yTrain?.dispose();
      this.tabularTensors.xTest?.dispose();
      this.tabularTensors.yTest?.dispose();
      this.tabularTensors.xVal?.dispose();
      this.tabularTensors.yVal?.dispose();
    }
    this.tabularTensors = null;
    if (this.tabularRaw) {
      this.tabularRaw.xTensor?.dispose();
      this.tabularRaw.yTensor?.dispose();
    }
    this.tabularRaw = null;

    if (this.imageTensors) {
      this.imageTensors.xTrain?.dispose();
      this.imageTensors.yTrain?.dispose();
      this.imageTensors.xTest?.dispose();
      this.imageTensors.yTest?.dispose();
      this.imageTensors.xVal?.dispose();
      this.imageTensors.yVal?.dispose();
    }
    this.imageTensors = null;
    if (this.imageRaw) {
      this.imageRaw.xTensor?.dispose();
      this.imageRaw.yTensor?.dispose();
    }
    this.imageRaw = null;

    if (this.sequenceTensors) {
      this.sequenceTensors.xTrain?.dispose();
      this.sequenceTensors.yTrain?.dispose();
      this.sequenceTensors.xTest?.dispose();
      this.sequenceTensors.yTest?.dispose();
      this.sequenceTensors.xVal?.dispose();
      this.sequenceTensors.yVal?.dispose();
    }
    this.sequenceTensors = null;
    if (this.sequenceRaw) {
      this.sequenceRaw.xTensor?.dispose();
      this.sequenceRaw.yTensor?.dispose();
    }
    this.sequenceRaw = null;
    this.stats = {};
    this.isDataLoaded = false;
    return { message: 'Data reset successfully' };
  }

  splitSequence(trainRatio = 0.7, testRatio = 0.2, valRatio = 0.1) {
    const x = this.sequenceRaw?.xTensor;
    const y = this.sequenceRaw?.yTensor;
    if (!x || !y) throw new Error('Sequence raw tensors not loaded');

    const n = x.shape[0];
    const trainSize = Math.floor(n * trainRatio);
    const testSize = Math.floor(n * testRatio);
    const valSize = n - trainSize - testSize;

    const xTrain = x.slice([0, 0, 0], [trainSize, x.shape[1], x.shape[2]]);
    const yTrain = y.slice([0, 0], [trainSize, y.shape[1]]);

    const xTest = x.slice([trainSize, 0, 0], [testSize, x.shape[1], x.shape[2]]);
    const yTest = y.slice([trainSize, 0], [testSize, y.shape[1]]);

    const xVal = x.slice([trainSize + testSize, 0, 0], [valSize, x.shape[1], x.shape[2]]);
    const yVal = y.slice([trainSize + testSize, 0], [valSize, y.shape[1]]);

    if (this.sequenceTensors) {
      this.sequenceTensors.xTrain?.dispose();
      this.sequenceTensors.yTrain?.dispose();
      this.sequenceTensors.xTest?.dispose();
      this.sequenceTensors.yTest?.dispose();
      this.sequenceTensors.xVal?.dispose();
      this.sequenceTensors.yVal?.dispose();
    }

    this.sequenceTensors = { xTrain, yTrain, xTest, yTest, xVal, yVal };
    this.trainData = { size: trainSize };
    this.testData = { size: testSize };
    this.valData = { size: valSize };
    this.stats.trainSize = trainSize;
    this.stats.testSize = testSize;
    this.stats.valSize = valSize;

    return { trainSize, testSize, valSize };
  }

  getSequenceTrainTensors() {
    return this.sequenceTensors;
  }

  // Helper method to normalize data
  normalizeData(data, min = 0, max = 1) {
    return tf.tidy(() => {
      const dataTensor = tf.tensor(data);
      const normalized = dataTensor
        .sub(dataTensor.min())
        .div(dataTensor.max().sub(dataTensor.min()))
        .mul(max - min)
        .add(min);
      return normalized;
    });
  }

  // Helper method to standardize data (z-score)
  standardizeData(data) {
    return tf.tidy(() => {
      const dataTensor = tf.tensor(data);
      const mean = dataTensor.mean();
      const std = tf.sqrt(
        dataTensor.sub(mean).square().mean()
      );
      return dataTensor.sub(mean).div(std);
    });
  }
}

module.exports = new DataService();
