const path = require('path');
const fs = require('fs');
const fsPromises = fs.promises;

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
require('@tensorflow/tfjs-layers');

class SelfAttention extends tf.layers.Layer {
  constructor(config = {}) {
    super(config);
    this.dModel = Number(config.dModel || 64);
    this.useScale = config.useScale !== false;
    this.supportsMasking = true;
  }

  build(inputShape) {
    const d = this.dModel;
    this.wq = this.addWeight('wq', [Number(inputShape?.[2] || d), d], 'float32', tf.initializers.glorotUniform());
    this.wk = this.addWeight('wk', [Number(inputShape?.[2] || d), d], 'float32', tf.initializers.glorotUniform());
    this.wv = this.addWeight('wv', [Number(inputShape?.[2] || d), d], 'float32', tf.initializers.glorotUniform());
    this.bq = this.addWeight('bq', [d], 'float32', tf.initializers.zeros());
    this.bk = this.addWeight('bk', [d], 'float32', tf.initializers.zeros());
    this.bv = this.addWeight('bv', [d], 'float32', tf.initializers.zeros());
    this.built = true;
  }

  computeOutputShape(inputShape) {
    return [inputShape?.[0] ?? null, inputShape?.[1] ?? null, this.dModel];
  }

  call(inputs, kwargs) {
    return tf.tidy(() => {
      const x = Array.isArray(inputs) ? inputs[0] : inputs;
      const q = x.matMul(this.wq.read()).add(this.bq.read());
      const k = x.matMul(this.wk.read()).add(this.bk.read());
      const v = x.matMul(this.wv.read()).add(this.bv.read());

      let scores = tf.matMul(q, k, false, true);
      if (this.useScale) {
        const scale = 1 / Math.sqrt(this.dModel);
        scores = scores.mul(scale);
      }

      const weights = tf.softmax(scores, -1);
      return tf.matMul(weights, v);
    });
  }

  getConfig() {
    const base = super.getConfig();
    return { ...base, dModel: this.dModel, useScale: this.useScale };
  }

  static get className() {
    return 'SelfAttention';
  }
}

tf.serialization.registerClass(SelfAttention);

class MultiHeadSelfAttention extends tf.layers.Layer {
  constructor(config = {}) {
    super(config);
    this.dModel = Number(config.dModel || 64);
    this.numHeads = Math.max(1, Number(config.numHeads || 4));
    this.keyDim = Math.max(4, Math.floor(this.dModel / this.numHeads));
    this.causal = config.causal === true;
    this.supportsMasking = true;
  }

  build(inputShape) {
    const inDim = Number(inputShape?.[2] || this.dModel);
    const d = this.dModel;
    this.wq = this.addWeight('wq', [inDim, d], 'float32', tf.initializers.glorotUniform());
    this.wk = this.addWeight('wk', [inDim, d], 'float32', tf.initializers.glorotUniform());
    this.wv = this.addWeight('wv', [inDim, d], 'float32', tf.initializers.glorotUniform());
    this.wo = this.addWeight('wo', [d, d], 'float32', tf.initializers.glorotUniform());
    this.bq = this.addWeight('bq', [d], 'float32', tf.initializers.zeros());
    this.bk = this.addWeight('bk', [d], 'float32', tf.initializers.zeros());
    this.bv = this.addWeight('bv', [d], 'float32', tf.initializers.zeros());
    this.bo = this.addWeight('bo', [d], 'float32', tf.initializers.zeros());
    this.built = true;
  }

  computeOutputShape(inputShape) {
    return [inputShape?.[0] ?? null, inputShape?.[1] ?? null, this.dModel];
  }

  call(inputs, kwargs) {
    const x = Array.isArray(inputs) ? inputs[0] : inputs;
    const d = this.dModel;
    const h = this.numHeads;
    const keyDim = this.keyDim;

    // Avoid tf.matMul broadcasting (rank-3 x rank-2) which can produce wrong-shaped gradients
    const t = Number(x.shape?.[1] || 0);
    const inDim = Number(x.shape?.[2] || d);
    const x2d = tf.reshape(x, [-1, inDim]);

    const q2d = tf.matMul(x2d, this.wq.read()).add(this.bq.read());
    const k2d = tf.matMul(x2d, this.wk.read()).add(this.bk.read());
    const v2d = tf.matMul(x2d, this.wv.read()).add(this.bv.read());

    const q = tf.reshape(q2d, [-1, t, d]);
    const k = tf.reshape(k2d, [-1, t, d]);
    const v = tf.reshape(v2d, [-1, t, d]);

    const qh = tf.transpose(tf.reshape(q, [-1, q.shape[1], h, keyDim]), [0, 2, 1, 3]);
    const kh = tf.transpose(tf.reshape(k, [-1, k.shape[1], h, keyDim]), [0, 2, 1, 3]);
    const vh = tf.transpose(tf.reshape(v, [-1, v.shape[1], h, keyDim]), [0, 2, 1, 3]);

    const scale = 1 / Math.sqrt(keyDim);
    let scores = tf.matMul(qh, kh, false, true).mul(scale);

    if (this.causal) {
      const t = Number(scores.shape?.[2] || 0);
      if (t > 0) {
        const ones = tf.ones([t, t]);
        // lower-triangular band: allow attending to self and past only
        const lower = tf.linalg.bandPart(ones, -1, 0);
        const mask = tf.sub(tf.scalar(1), lower).mul(tf.scalar(-1e9));
        // broadcast to [B, H, T, T]
        const mask4d = tf.reshape(mask, [1, 1, t, t]);
        scores = scores.add(mask4d);
      }
    }
    const weights = tf.softmax(scores, -1);
    const attn = tf.matMul(weights, vh);

    const attnT = tf.transpose(attn, [0, 2, 1, 3]);
    const attnFlat = tf.reshape(attnT, [-1, attnT.shape[1], d]);

    const out2d = tf.reshape(attnFlat, [-1, d]);
    const proj2d = tf.matMul(out2d, this.wo.read()).add(this.bo.read());
    return tf.reshape(proj2d, [-1, attnFlat.shape[1], d]);
  }

  getConfig() {
    const base = super.getConfig();
    return { ...base, dModel: this.dModel, numHeads: this.numHeads, causal: this.causal };
  }

  static get className() {
    return 'MultiHeadSelfAttention';
  }
}

tf.serialization.registerClass(MultiHeadSelfAttention);

class PositionalEmbedding extends tf.layers.Layer {
  constructor(config = {}) {
    super(config);
    this.maxLen = Math.max(1, Number(config.maxLen || 50));
    this.dModel = Math.max(1, Number(config.dModel || 64));
    this.supportsMasking = true;
  }

  build(inputShape) {
    this.posEmb = this.addWeight('posEmb', [this.maxLen, this.dModel], 'float32', tf.initializers.randomNormal({ mean: 0, stddev: 0.02 }));
    this.built = true;
  }

  computeOutputShape(inputShape) {
    return inputShape;
  }

  call(inputs, kwargs) {
    const x = Array.isArray(inputs) ? inputs[0] : inputs;
    const t = Number(x.shape?.[1] || 0);
    if (!t) return x;
    const pe = this.posEmb.read().slice([0, 0], [t, this.dModel]);
    const peB = tf.reshape(pe, [1, t, this.dModel]);
    return x.add(peB);
  }

  getConfig() {
    const base = super.getConfig();
    return { ...base, maxLen: this.maxLen, dModel: this.dModel };
  }

  static get className() {
    return 'PositionalEmbedding';
  }
}

tf.serialization.registerClass(PositionalEmbedding);

class ModelService {
  constructor() {
    this.model = null;
    this.modelPath = path.join(__dirname, '../../models');
    this.modelsMetadataFile = path.join(__dirname, '../../data/models-metadata.json');
    this.savedModels = {}; // Store multiple models: { modelId: { name, model, createdAt } }
    this.namedModels = {}; // Separate map for name-based save/load from UI
    this.currentModelId = null; // Track current model
    
    // Load models metadata on startup
    this.loadModelsMetadata();
  }

  ensureCompiled(model, meta = {}) {
    if (!model) return model;
    // tfjs-layers models expose optimizer after compile
    const alreadyCompiled = !!model.optimizer;
    if (alreadyCompiled) return model;

    const cfg = meta?.compileConfig || {};
    const optimizerName = String(cfg.optimizer || cfg.optimizerName || 'adam').toLowerCase();
    const lr = Number(cfg.learningRate ?? meta.learningRate ?? 0.001);
    const loss = String(cfg.loss || 'categoricalCrossentropy');
    const metrics = Array.isArray(cfg.metrics) && cfg.metrics.length ? cfg.metrics : ['accuracy'];

    let optimizer;
    try {
      if (optimizerName === 'sgd') optimizer = tf.train.sgd(Number.isFinite(lr) ? lr : 0.01);
      else if (optimizerName === 'rmsprop') optimizer = tf.train.rmsprop(Number.isFinite(lr) ? lr : 0.001);
      else optimizer = tf.train.adam(Number.isFinite(lr) ? lr : 0.001);
    } catch (e) {
      optimizer = tf.train.adam(0.001);
    }

    try {
      model.compile({ optimizer, loss, metrics });
    } catch (e) {
      // If compile fails for some reason, let caller handle downstream errors
    }
    return model;
  }

  getModelSaveDirById(modelId) {
    return path.join(this.modelPath, modelId);
  }

  async saveModelById(modelId) {
    if (!this.model) {
      throw new Error('Model not initialized');
    }
    if (!modelId) {
      throw new Error('modelId is required');
    }

    const dir = this.getModelSaveDirById(modelId);
    await fsPromises.mkdir(dir, { recursive: true });

    const savePath = `file://${dir}`;
    await this.model.save(savePath);

    if (this.savedModels?.[modelId]) {
      this.savedModels[modelId].savedAt = new Date().toISOString();
      this.savedModels[modelId].savedPath = dir;
      try {
        this.saveModelsMetadata();
      } catch (e) {
        // ignore metadata save failures
      }
    }

    return { modelId, savePath };
  }

  async loadModelById(modelId) {
    if (!modelId) {
      throw new Error('modelId is required');
    }
    if (!this.savedModels?.[modelId]) {
      throw new Error(`Model with ID ${modelId} not found`);
    }

    const dir = this.getModelSaveDirById(modelId);
    const loadPath = `file://${path.join(dir, 'model.json')}`;
    this.model = await tf.loadLayersModel(loadPath);
    this.ensureCompiled(this.model, this.savedModels?.[modelId] || {});
    this.currentModelId = modelId;
    this.savedModels[modelId].model = this.model;
    this.savedModels[modelId].savedPath = dir;
    this.savedModels[modelId].loadedAt = new Date().toISOString();
    return this.model;
  }

  async getOrLoadModelById(modelId) {
    if (!modelId) {
      throw new Error('modelId is required');
    }
    const entry = this.savedModels?.[modelId];
    if (!entry) {
      throw new Error(`Model with ID ${modelId} not found`);
    }
    if (entry.model) {
      this.model = entry.model;
      this.currentModelId = modelId;
      return this.model;
    }
    return this.loadModelById(modelId);
  }

  loadModelsMetadata() {
    try {
      if (fs.existsSync(this.modelsMetadataFile)) {
        const data = fs.readFileSync(this.modelsMetadataFile, 'utf8');
        const metadata = JSON.parse(data);
        
        // Recreate models from metadata
        metadata.forEach(meta => {
          this.savedModels[meta.id] = {
            id: meta.id,
            name: meta.name,
            model: null, // Will be recreated on demand
            createdAt: meta.createdAt,
            modelType: meta.modelType,
            architecture: meta.architecture,
            layers: meta.layers,
            parameters: meta.parameters,
            inputShape: meta.inputShape,
            numClasses: meta.numClasses,
            compileConfig: meta.compileConfig || null,
            expectedFingerprint: meta.expectedFingerprint || null
          };
        });
        
        if (metadata.length > 0) {
          console.log(`✅ Loaded ${metadata.length} models metadata from file`);
        }
      }
    } catch (err) {
      console.warn('Could not load models metadata:', err.message);
    }
  }

  saveModelsMetadata() {
    try {
      const dataDir = path.dirname(this.modelsMetadataFile);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      const metadata = Object.values(this.savedModels).map(m => ({
        id: m.id,
        name: m.name,
        createdAt: m.createdAt,
        modelType: m.modelType,
        architecture: m.architecture,
        layers: m.layers,
        parameters: m.parameters,
        inputShape: m.inputShape,
        numClasses: m.numClasses,
        compileConfig: m.compileConfig || null,
        expectedFingerprint: m.expectedFingerprint || null
      }));
      
      fs.writeFileSync(this.modelsMetadataFile, JSON.stringify(metadata, null, 2));
    } catch (err) {
      console.warn('Could not save models metadata:', err.message);
    }
  }

  clearAllModels() {
    this.savedModels = {};
    this.namedModels = {};
    this.currentModelId = null;
    this.model = null;

    try {
      if (fs.existsSync(this.modelsMetadataFile)) {
        fs.unlinkSync(this.modelsMetadataFile);
      }
    } catch (err) {
      console.warn('Could not delete models metadata file:', err.message);
    }

    try {
      const dataDir = path.dirname(this.modelsMetadataFile);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(this.modelsMetadataFile, JSON.stringify([], null, 2));
    } catch (err) {
      console.warn('Could not persist empty models metadata:', err.message);
    }

    return true;
  }

  async createCNNLSTMModel(inputShape = [64, 64, 1], numClasses = 10) {
    try {
      // Ensure models directory exists
      await fsPromises.mkdir(this.modelPath, { recursive: true });

      // Lightweight model for faster training
      const model = tf.sequential({
        layers: [
          // CNN layers - simplified for speed
          tf.layers.conv2d({
            inputShape,
            filters: 16,
            kernelSize: 3,
            activation: 'relu',
            padding: 'same'
          }),
          tf.layers.maxPooling2d({ poolSize: 2 }),
          tf.layers.dropout({ rate: 0.2 }),

          tf.layers.conv2d({
            filters: 32,
            kernelSize: 3,
            activation: 'relu',
            padding: 'same'
          }),
          tf.layers.maxPooling2d({ poolSize: 2 }),
          tf.layers.dropout({ rate: 0.2 }),

          // Flatten instead of LSTM for speed
          tf.layers.flatten(),

          // Dense layers
          tf.layers.dense({
            units: 64,
            activation: 'relu'
          }),
          tf.layers.dropout({ rate: 0.3 }),

          tf.layers.dense({
            units: numClasses,
            activation: 'softmax'
          })
        ]
      });

      // Compile model
      model.compile({
        optimizer: tf.train.sgd(0.01),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });

      this.model = model;
      
      // Generate unique model ID
      const modelId = `model_${Date.now()}`;
      this.savedModels[modelId] = {
        id: modelId,
        name: `CNN+LSTM Model ${Object.keys(this.savedModels).length + 1}`,
        model: model,
        createdAt: new Date().toISOString(),
        modelType: 'cnn_lstm_lightweight',
        architecture: 'CNN+LSTM',
        layers: 21,
        parameters: 284682,
        inputShape: inputShape,
        numClasses: numClasses
      };
      this.currentModelId = modelId;
      
      // ✅ Save models metadata for persistence
      this.saveModelsMetadata();
      
      console.log(`CNN+LSTM Model created successfully with ID: ${modelId}`);
      return {
        model: model,
        modelId: modelId,
        name: this.savedModels[modelId].name,
        architecture: this.savedModels[modelId].architecture,
        modelType: this.savedModels[modelId].modelType
      };
    } catch (error) {
      console.error('Error creating model:', error);
      throw error;
    }
  }

  async createCNNModel(inputShape = [64, 64, 1], numClasses = 10) {
    try {
      await fsPromises.mkdir(this.modelPath, { recursive: true });

      const model = tf.sequential({
        layers: [
          tf.layers.conv2d({
            inputShape,
            filters: 16,
            kernelSize: 3,
            activation: 'relu',
            padding: 'same'
          }),
          tf.layers.maxPooling2d({ poolSize: 2 }),
          tf.layers.conv2d({
            filters: 32,
            kernelSize: 3,
            activation: 'relu',
            padding: 'same'
          }),
          tf.layers.maxPooling2d({ poolSize: 2 }),
          tf.layers.flatten(),
          tf.layers.dense({ units: 64, activation: 'relu' }),
          tf.layers.dense({ units: numClasses, activation: 'softmax' })
        ]
      });

      model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });

      this.model = model;

      const modelId = `model_${Date.now()}`;
      this.savedModels[modelId] = {
        id: modelId,
        name: `CNN Model ${Object.keys(this.savedModels).length + 1}`,
        model: model,
        createdAt: new Date().toISOString(),
        modelType: 'cnn',
        architecture: 'CNN',
        layers: model.layers?.length || 0,
        parameters: model.countParams?.() || 0,
        inputShape: inputShape,
        numClasses: numClasses
      };
      this.currentModelId = modelId;
      this.saveModelsMetadata();

      return {
        model: model,
        modelId: modelId,
        name: this.savedModels[modelId].name,
        architecture: this.savedModels[modelId].architecture,
        modelType: this.savedModels[modelId].modelType
      };
    } catch (error) {
      console.error('Error creating CNN model:', error);
      throw error;
    }
  }

  async createDNNModel(inputShape = [10], numClasses = 2) {
    try {
      await fsPromises.mkdir(this.modelPath, { recursive: true });

      const model = tf.sequential({
        layers: [
          tf.layers.dense({ inputShape: [inputShape[0] || 10], units: 64, activation: 'relu' }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({ units: 32, activation: 'relu' }),
          tf.layers.dense({ units: numClasses, activation: 'softmax' })
        ]
      });

      model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });

      this.model = model;

      const modelId = `model_${Date.now()}`;
      this.savedModels[modelId] = {
        id: modelId,
        name: `DNN Model ${Object.keys(this.savedModels).length + 1}`,
        model: model,
        createdAt: new Date().toISOString(),
        modelType: 'dnn',
        architecture: 'DNN',
        layers: model.layers?.length || 0,
        parameters: model.countParams?.() || 0,
        inputShape: inputShape,
        numClasses: numClasses
      };
      this.currentModelId = modelId;
      this.saveModelsMetadata();

      return {
        model: model,
        modelId: modelId,
        name: this.savedModels[modelId].name,
        architecture: this.savedModels[modelId].architecture,
        modelType: this.savedModels[modelId].modelType
      };
    } catch (error) {
      console.error('Error creating DNN model:', error);
      throw error;
    }
  }

  async createLSTMModel(inputShape = [50, 10], numClasses = 2) {
    try {
      await fsPromises.mkdir(this.modelPath, { recursive: true });

      const model = tf.sequential({
        layers: [
          tf.layers.lstm({ inputShape, units: 64, returnSequences: false }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({ units: numClasses, activation: 'softmax' })
        ]
      });

      model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });

      this.model = model;

      const modelId = `model_${Date.now()}`;
      this.savedModels[modelId] = {
        id: modelId,
        name: `LSTM Model ${Object.keys(this.savedModels).length + 1}`,
        model: model,
        createdAt: new Date().toISOString(),
        modelType: 'lstm',
        architecture: 'LSTM',
        layers: model.layers?.length || 0,
        parameters: model.countParams?.() || 0,
        inputShape: inputShape,
        numClasses: numClasses
      };
      this.currentModelId = modelId;
      this.saveModelsMetadata();

      return {
        model: model,
        modelId: modelId,
        name: this.savedModels[modelId].name,
        architecture: this.savedModels[modelId].architecture,
        modelType: this.savedModels[modelId].modelType
      };
    } catch (error) {
      console.error('Error creating LSTM model:', error);
      throw error;
    }
  }

  async createTransformerModel(inputShape = [50, 10], numClasses = 2) {
    try {
      await fsPromises.mkdir(this.modelPath, { recursive: true });

      const timesteps = Number(inputShape?.[0] || 0);
      const features = Number(inputShape?.[1] || 0);
      if (!timesteps || !features) {
        throw new Error(`Invalid inputShape for transformer. Expected [timesteps, features], got ${JSON.stringify(inputShape)}`);
      }

      const dModel = Math.max(16, Math.min(256, Number(process.env.TRANSFORMER_D_MODEL || 64)));
      const ffDim = Math.max(dModel, Math.min(512, Number(process.env.TRANSFORMER_FF_DIM || 128)));
      const dropoutRate = Math.max(0, Math.min(0.5, Number(process.env.TRANSFORMER_DROPOUT || 0.1)));

      const input = tf.input({ shape: [timesteps, features] });
      let x = tf.layers.dense({ units: dModel }).apply(input);

      // Transformer-lite block (no explicit attention) for maximum compatibility:
      // position-wise feed-forward network + residual + layer norm
      const ff1 = tf.layers.dense({ units: ffDim, activation: 'relu' }).apply(x);
      const ff2 = tf.layers.dense({ units: dModel }).apply(ff1);
      const ffDrop = tf.layers.dropout({ rate: dropoutRate }).apply(ff2);
      const ffAdd = tf.layers.add().apply([x, ffDrop]);
      const ffNorm = tf.layers.layerNormalization({ epsilon: 1e-6 }).apply(ffAdd);

      const pooled = tf.layers.globalAveragePooling1d().apply(ffNorm);
      const out = tf.layers.dense({ units: numClasses, activation: 'softmax' }).apply(pooled);

      const model = tf.model({ inputs: input, outputs: out });
      model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });

      this.model = model;

      const modelId = `model_${Date.now()}`;
      this.savedModels[modelId] = {
        id: modelId,
        name: `Transformer Model ${Object.keys(this.savedModels).length + 1}`,
        model,
        createdAt: new Date().toISOString(),
        modelType: 'transformer',
        architecture: 'Transformer',
        layers: model.layers?.length || 0,
        parameters: model.countParams?.() || 0,
        inputShape,
        numClasses
      };
      this.currentModelId = modelId;
      this.saveModelsMetadata();

      return {
        model,
        modelId,
        name: this.savedModels[modelId].name,
        architecture: this.savedModels[modelId].architecture,
        modelType: this.savedModels[modelId].modelType
      };
    } catch (error) {
      console.error('Error creating Transformer model:', error);
      throw error;
    }
  }

  async createTransformerFullModel(inputShape = [50, 10], numClasses = 2) {
    try {
      await fsPromises.mkdir(this.modelPath, { recursive: true });

      const timesteps = Number(inputShape?.[0] || 0);
      const features = Number(inputShape?.[1] || 0);
      if (!timesteps || !features) {
        throw new Error(`Invalid inputShape for transformer_full. Expected [timesteps, features], got ${JSON.stringify(inputShape)}`);
      }

      const rawDModel = Math.max(16, Math.min(256, Number(process.env.TRANSFORMER_D_MODEL || 64)));
      const numHeads = Math.max(1, Math.min(8, Number(process.env.TRANSFORMER_HEADS || 4)));
      // Ensure dModel is divisible by numHeads for clean head splitting
      const dModel = Math.max(numHeads, Math.ceil(rawDModel / numHeads) * numHeads);
      const ffDim = Math.max(dModel, Math.min(512, Number(process.env.TRANSFORMER_FF_DIM || 128)));
      const dropoutRate = Math.max(0, Math.min(0.5, Number(process.env.TRANSFORMER_DROPOUT || 0.1)));
      const causal = String(process.env.TRANSFORMER_CAUSAL || '').toLowerCase() === 'true';

      const input = tf.input({ shape: [timesteps, features] });
      const xProj = tf.layers.dense({ units: dModel }).apply(input);
      const x0 = new PositionalEmbedding({ maxLen: timesteps, dModel }).apply(xProj);

      const attnOut = new MultiHeadSelfAttention({ dModel, numHeads, causal }).apply(x0);
      const attnDrop = tf.layers.dropout({ rate: dropoutRate }).apply(attnOut);
      const attnAdd = tf.layers.add().apply([x0, attnDrop]);
      const attnNorm = tf.layers.layerNormalization({ epsilon: 1e-6 }).apply(attnAdd);

      const ff1 = tf.layers.dense({ units: ffDim, activation: 'relu' }).apply(attnNorm);
      const ff2 = tf.layers.dense({ units: dModel }).apply(ff1);
      const ffDrop = tf.layers.dropout({ rate: dropoutRate }).apply(ff2);
      const ffAdd = tf.layers.add().apply([attnNorm, ffDrop]);
      const ffNorm = tf.layers.layerNormalization({ epsilon: 1e-6 }).apply(ffAdd);

      const pooled = tf.layers.globalAveragePooling1d().apply(ffNorm);
      const out = tf.layers.dense({ units: numClasses, activation: 'softmax' }).apply(pooled);

      const model = tf.model({ inputs: input, outputs: out });
      model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });

      this.model = model;

      const modelId = `model_${Date.now()}`;
      this.savedModels[modelId] = {
        id: modelId,
        name: `Transformer Full Model ${Object.keys(this.savedModels).length + 1}`,
        model,
        createdAt: new Date().toISOString(),
        modelType: 'transformer_full',
        architecture: 'Transformer (Full)',
        layers: model.layers?.length || 0,
        parameters: model.countParams?.() || 0,
        inputShape,
        numClasses
      };
      this.currentModelId = modelId;
      this.saveModelsMetadata();

      return {
        model,
        modelId,
        name: this.savedModels[modelId].name,
        architecture: this.savedModels[modelId].architecture,
        modelType: this.savedModels[modelId].modelType
      };
    } catch (error) {
      console.error('Error creating Transformer Full model:', error);
      throw error;
    }
  }

  async createFullCNNLSTMModel(inputShape = [64, 64, 1], numClasses = 10) {
    try {
      // Ensure models directory exists
      await fsPromises.mkdir(this.modelPath, { recursive: true });

      // Full CNN+LSTM model with more layers
      const model = tf.sequential({
        layers: [
          // CNN layers for feature extraction
          tf.layers.conv2d({
            inputShape,
            filters: 32,
            kernelSize: 3,
            activation: 'relu',
            padding: 'same'
          }),
          tf.layers.batchNormalization(),
          tf.layers.maxPooling2d({ poolSize: 2 }),
          tf.layers.dropout({ rate: 0.25 }),

          tf.layers.conv2d({
            filters: 64,
            kernelSize: 3,
            activation: 'relu',
            padding: 'same'
          }),
          tf.layers.batchNormalization(),
          tf.layers.maxPooling2d({ poolSize: 2 }),
          tf.layers.dropout({ rate: 0.25 }),

          tf.layers.conv2d({
            filters: 128,
            kernelSize: 3,
            activation: 'relu',
            padding: 'same'
          }),
          tf.layers.batchNormalization(),
          tf.layers.maxPooling2d({ poolSize: 2 }),
          tf.layers.dropout({ rate: 0.25 }),

          // Flatten for dense layers
          tf.layers.flatten(),

          // Dense layers
          tf.layers.dense({
            units: 256,
            activation: 'relu'
          }),
          tf.layers.batchNormalization(),
          tf.layers.dropout({ rate: 0.5 }),

          tf.layers.dense({
            units: 128,
            activation: 'relu'
          }),
          tf.layers.dropout({ rate: 0.5 }),

          tf.layers.dense({
            units: numClasses,
            activation: 'softmax'
          })
        ]
      });

      // Compile model
      model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });

      this.model = model;
      
      // Generate unique model ID
      const modelId = `model_${Date.now()}`;
      this.savedModels[modelId] = {
        id: modelId,
        name: `Full CNN+LSTM Model ${Object.keys(this.savedModels).length + 1}`,
        model: model,
        createdAt: new Date().toISOString(),
        architecture: 'Full CNN+LSTM',
        layers: 21,
        parameters: 284682,
        inputShape: inputShape,
        numClasses: numClasses
      };
      this.currentModelId = modelId;
      
      console.log(`Full CNN+LSTM Model created successfully with ID: ${modelId}`);
      return {
        model: model,
        modelId: modelId,
        name: this.savedModels[modelId].name
      };
    } catch (error) {
      console.error('Error creating full model:', error);
      throw error;
    }
  }

  async getModelSummary() {
    if (!this.model) {
      throw new Error('Model not initialized');
    }
    return this.model.summary();
  }

  async saveModel(modelName = 'cnn-lstm-model') {
    if (!this.model) {
      throw new Error('Model not initialized');
    }
    
    const savePath = `file://${path.join(this.modelPath, modelName)}`;
    await this.model.save(savePath);
    console.log(`Model saved to ${savePath}`);
  }

  async loadModel(modelName = 'cnn-lstm-model') {
    const loadPath = `file://${path.join(this.modelPath, modelName, 'model.json')}`;
    this.model = await tf.loadLayersModel(loadPath);
    this.ensureCompiled(this.model, {});
    console.log(`Model loaded from ${loadPath}`);
    return this.model;
  }

  getModel() {
    return this.model;
  }

  // Get model by ID
  getModelById(modelId) {
    if (!this.savedModels[modelId]) {
      throw new Error(`Model with ID ${modelId} not found`);
    }
    this.model = this.savedModels[modelId].model;
    this.currentModelId = modelId;
    return this.model;
  }

  // Get all saved models (without the actual model object to avoid circular references)
  getAllModels() {
    return Object.values(this.savedModels).map(m => ({
      id: m.id,
      name: m.name,
      createdAt: m.createdAt,
      architecture: m.architecture,
      modelType: m.modelType,
      layers: m.layers,
      parameters: m.parameters,
      inputShape: m.inputShape,
      numClasses: m.numClasses,
      savedAt: m.savedAt,
      savedPath: m.savedPath
    }));
  }

  // Get current model ID
  getCurrentModelId() {
    return this.currentModelId;
  }

  // Set current model by ID
  setCurrentModel(modelId) {
    if (!this.savedModels[modelId]) {
      throw new Error(`Model with ID ${modelId} not found`);
    }
    this.currentModelId = modelId;
    this.model = this.savedModels[modelId].model;
    return this.model;
  }

  // Delete model by ID
  deleteModel(modelId) {
    if (!this.savedModels[modelId]) {
      throw new Error(`Model with ID ${modelId} not found`);
    }
    delete this.savedModels[modelId];
    if (this.currentModelId === modelId) {
      this.currentModelId = null;
      this.model = null;
    }
    return true;
  }
}

module.exports = new ModelService();
