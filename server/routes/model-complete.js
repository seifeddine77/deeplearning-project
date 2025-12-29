const express = require('express');
const router = express.Router();
const ModelService = require('../services/modelService');
const DataService = require('../services/dataService');
const logger = require('../config/logger');
const { authMiddleware } = require('../middleware/auth');
const Model = require('../models/Model');
const path = require('path');
const fs = require('fs');
const fsPromises = fs.promises;

function resolveCompileConfig({ learningRate = 0.001, labelFormat = 'unknown' } = {}) {
  const lr = Number(learningRate);
  const safeLr = Number.isFinite(lr) ? lr : 0.001;
  const lf = String(labelFormat || 'unknown').toLowerCase();
  const loss = (lf === 'sparse') ? 'sparseCategoricalCrossentropy' : 'categoricalCrossentropy';
  return {
    optimizer: 'adam',
    learningRate: safeLr,
    loss,
    metrics: ['accuracy'],
    labelFormat: (lf === 'sparse' ? 'sparse' : (lf === 'one_hot' ? 'one_hot' : 'unknown'))
  };
}

function resolveModelType(modelId) {
  const entry = (modelId && ModelService?.savedModels) ? ModelService.savedModels[modelId] : null;
  const arch = entry?.architecture || entry?.modelType || entry?.type;
  if (!arch) return 'Model';
  const s = String(arch).toLowerCase();
  if (s === 'dnn' || s.includes('dnn')) return 'DNN';
  if (s === 'cnn' || s.includes('cnn') && !s.includes('lstm')) return 'CNN';
  if (s === 'lstm' || s.includes('lstm') && !s.includes('cnn')) return 'LSTM';
  if (s === 'transformer' || s.includes('transformer')) return 'Transformer';
  if (s.includes('cnn') && s.includes('lstm')) return 'CNN+LSTM';
  return entry?.architecture || 'Model';
}

// @route   POST /api/model/create
// @desc    Create a new model (CNN+LSTM or Lightweight CNN)
// @access  Private
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const bodyInputShape = req.body?.inputShape;
    const bodyNumClasses = req.body?.numClasses;
    const modelType = req.body?.modelType ?? 'lightweight';

    const dsInputShape = Array.isArray(DataService?.stats?.inputShape) ? DataService.stats.inputShape : null;
    const dsNumClasses = Number(DataService?.stats?.classes ?? 0);

    const dsDatasetType = String(DataService?.stats?.datasetType || '').toLowerCase();
    const isImageDataset = dsDatasetType === 'image';

    const resolvedInputShape = (isImageDataset && Array.isArray(dsInputShape) && dsInputShape.length)
      ? dsInputShape
      : (Array.isArray(bodyInputShape)
        ? bodyInputShape
        : (Array.isArray(dsInputShape) && dsInputShape.length ? dsInputShape : [64, 64, 1]));

    const resolvedNumClasses = Number.isFinite(Number(bodyNumClasses))
      ? Number(bodyNumClasses)
      : (Number.isFinite(dsNumClasses) && dsNumClasses > 0 ? dsNumClasses : 10);

    let result;
    if (modelType === 'dnn') {
      result = await ModelService.createDNNModel(resolvedInputShape, resolvedNumClasses);
    } else if (modelType === 'cnn') {
      result = await ModelService.createCNNModel(resolvedInputShape, resolvedNumClasses);
    } else if (modelType === 'lstm') {
      result = await ModelService.createLSTMModel(resolvedInputShape, resolvedNumClasses);
    } else if (modelType === 'transformer') {
      result = await ModelService.createTransformerModel(resolvedInputShape, resolvedNumClasses);
    } else if (modelType === 'transformer_full') {
      result = await ModelService.createTransformerFullModel(resolvedInputShape, resolvedNumClasses);
    } else if (modelType === 'full') {
      result = await ModelService.createFullCNNLSTMModel(resolvedInputShape, resolvedNumClasses);
    } else {
      result = await ModelService.createCNNLSTMModel(resolvedInputShape, resolvedNumClasses);
    }
    
    // result is { model, modelId, name }
    const model = result?.model || result;
    const modelId = result?.modelId;
    const modelName = result?.name;
    const architecture = result?.architecture;

    const datasetFingerprint = DataService?.stats?.fingerprint || null;
    const compileConfig = resolveCompileConfig({
      learningRate: 0.001,
      labelFormat: DataService?.stats?.labelFormat || 'unknown'
    });

    logger.info('Model created', { inputShape: resolvedInputShape, numClasses: resolvedNumClasses, modelId });

    // Calculate actual parameters
    let totalParams = 0;
    try {
      totalParams = model.countParams?.() || 284682;
    } catch (e) {
      totalParams = 284682;
    }
    
    // Calculate model size (4 bytes per float32 parameter)
    const modelSizeMB = (totalParams * 4) / (1024 * 1024);

    // Persist metadata in MongoDB immediately (per user)
    try {
      const userId = req.user?.userId;
      if (userId && modelId) {
        if (ModelService?.savedModels?.[modelId]) {
          ModelService.savedModels[modelId].compileConfig = compileConfig;
          ModelService.savedModels[modelId].expectedFingerprint = datasetFingerprint;
          try {
            ModelService.saveModelsMetadata?.();
          } catch (e) {
            // ignore metadata save failures
          }
        }

        await Model.findOneAndUpdate(
          { userId, modelId },
          {
            userId,
            modelId,
            name: modelName || 'Model',
            inputShape: resolvedInputShape,
            numClasses: resolvedNumClasses,
            architecture: architecture || resolveModelType(modelId),
            modelType,
            layersCount: model.layers?.length || 0,
            totalParams,
            trainableParams: totalParams,
            status: 'created',
            savePath: '',
            filePath: '',
            compileConfig,
            expectedFingerprint: datasetFingerprint
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
    } catch (e) {
      // If Mongo is unavailable, keep file-based persistence only
    }

    res.json({
      success: true,
      message: 'Model created successfully',
      model: {
        modelId: modelId || 'current',
        name: modelName || 'Model',
        type: architecture || 'Model',
        inputShape: resolvedInputShape,
        numClasses: resolvedNumClasses,
        layers: model.layers?.length || 21,
        parameters: totalParams,
        modelSize: `~${Math.round(modelSizeMB)} MB`,
        status: 'ready',
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error creating model', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error creating model',
      error: error.message
    });
  }
});

// @route   GET /api/model/summary
// @desc    Get model summary
// @access  Private
router.get('/summary', authMiddleware, async (req, res) => {
  try {
    const model = ModelService.getModel();
    if (!model) {
      return res.status(400).json({
        success: false,
        message: 'Model not initialized. Create a model first.'
      });
    }

    const currentModelId = ModelService.getCurrentModelId?.() || null;
    const resolvedType = resolveModelType(currentModelId);

    const summary = await ModelService.getModelSummary();

    logger.info('Model summary retrieved');

    // Calculate actual parameters
    let totalParams = 0;
    try {
      totalParams = model.countParams?.() || 2500000;
    } catch (e) {
      totalParams = 2500000;
    }
    
    // Calculate model size (4 bytes per float32 parameter)
    const modelSizeMB = (totalParams * 4) / (1024 * 1024);

    const layersDetails = (model.layers || []).map((layer) => {
      const className = layer?.getClassName?.() || layer?.className || layer?.name || 'Layer';
      let layerParams = 0;
      try {
        layerParams = layer.countParams?.() || 0;
      } catch (e) {
        layerParams = 0;
      }
      const inShape = layer?.inputShape;
      const outShape = layer?.outputShape;

      const fmtShape = (s) => {
        if (!s) return null;
        if (Array.isArray(s) && Array.isArray(s[0])) return s;
        if (Array.isArray(s)) return [s];
        return [s];
      };

      return {
        name: layer?.name || className,
        type: className,
        inputShape: fmtShape(inShape),
        outputShape: fmtShape(outShape),
        params: layerParams
      };
    });

    res.json({
      success: true,
      message: 'Model summary retrieved',
      model: {
        type: resolvedType,
        layers: model.layers?.length || 21,
        parameters: totalParams,
        modelSize: `~${Math.round(modelSizeMB)} MB`,
        status: 'ready',
        layersDetails
      }
    });
  } catch (error) {
    logger.error('Error getting model summary', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error getting model summary',
      error: error.message
    });
  }
});

// @route   POST /api/model/save
// @desc    Save model to memory/database
// @access  Private
router.post('/save', authMiddleware, async (req, res) => {
  try {
    const { modelName = 'cnn-lstm-model' } = req.body;
    
    const model = ModelService.getModel();
    if (!model) {
      return res.status(400).json({
        success: false,
        message: 'Model not initialized. Create a model first.'
      });
    }

    let effectiveModelId = ModelService.getCurrentModelId?.() || null;
    if (!effectiveModelId && ModelService.savedModels) {
      const match = Object.values(ModelService.savedModels).find(m => m?.model === model);
      effectiveModelId = match?.id || null;
    }

    if (effectiveModelId && ModelService.savedModels && ModelService.savedModels[effectiveModelId]) {
      ModelService.savedModels[effectiveModelId].name = modelName;
      try {
        ModelService.saveModelsMetadata?.();
      } catch (e) {
        // ignore metadata save failures
      }
    }

    let persisted;
    if (effectiveModelId && typeof ModelService.saveModelById === 'function') {
      persisted = await ModelService.saveModelById(effectiveModelId);
    }

    const resolvedType = resolveModelType(effectiveModelId);

    const datasetFingerprint = DataService?.stats?.fingerprint || null;
    const compileConfig = resolveCompileConfig({
      learningRate: 0.001,
      labelFormat: DataService?.stats?.labelFormat || 'unknown'
    });

    // Store model metadata in memory (name-based) without touching savedModels by modelId
    ModelService.namedModels = ModelService.namedModels || {};
    ModelService.namedModels[modelName] = {
      name: modelName,
      type: resolvedType,
      layers: model.layers?.length || 0,
      parameters: model.countParams?.() || 0,
      savedAt: new Date().toISOString()
    };

    // Persist metadata in MongoDB (per user)
    try {
      const userId = req.user?.userId;
      if (userId && effectiveModelId) {
        if (ModelService?.savedModels?.[effectiveModelId]) {
          ModelService.savedModels[effectiveModelId].compileConfig = compileConfig;
          ModelService.savedModels[effectiveModelId].expectedFingerprint = datasetFingerprint;
          try {
            ModelService.saveModelsMetadata?.();
          } catch (e) {
            // ignore metadata save failures
          }
        }

        await Model.findOneAndUpdate(
          { userId, modelId: effectiveModelId },
          {
            userId,
            modelId: effectiveModelId,
            name: modelName,
            inputShape: ModelService.savedModels?.[effectiveModelId]?.inputShape,
            numClasses: ModelService.savedModels?.[effectiveModelId]?.numClasses,
            architecture: ModelService.savedModels?.[effectiveModelId]?.architecture || resolvedType,
            modelType: ModelService.savedModels?.[effectiveModelId]?.modelType,
            layersCount: model.layers?.length || 0,
            totalParams: model.countParams?.() || 0,
            trainableParams: model.countParams?.() || 0,
            status: 'created',
            savePath: persisted?.savePath || '',
            filePath: persisted?.savePath || '',
            compileConfig,
            expectedFingerprint: datasetFingerprint
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
    } catch (e) {
      // If Mongo is unavailable, keep file-based persistence only
    }

    logger.info('Model saved', { modelName });

    res.json({
      success: true,
      message: 'Model saved successfully',
      modelName,
      modelId: effectiveModelId || null,
      savePath: persisted?.savePath,
      savedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error saving model', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error saving model',
      error: error.message
    });
  }
});

// @route   POST /api/model/load
// @desc    Load model from memory/database
// @access  Private
router.post('/load', authMiddleware, async (req, res) => {
  try {
    const { modelName = 'cnn-lstm-model' } = req.body;

    // Check if model exists in saved models
    if (!ModelService.namedModels || !ModelService.namedModels[modelName]) {
      return res.status(400).json({
        success: false,
        message: `Model "${modelName}" not found. Save a model first.`
      });
    }

    const savedModel = ModelService.namedModels[modelName];

    logger.info('Model loaded', { modelName });

    res.json({
      success: true,
      message: 'Model loaded successfully',
      modelName,
      model: savedModel,
      status: 'ready'
    });
  } catch (error) {
    logger.error('Error loading model', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error loading model',
      error: error.message
    });
  }
});

// @route   GET /api/model/list
// @desc    Get list of saved models
// @access  Private
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    let modelList = [];
    try {
      const docs = await Model.find({ userId }).sort({ updatedAt: -1 }).lean();
      modelList = (docs || []).map((d) => ({
        id: d.modelId,
        name: d.name,
        createdAt: d.createdAt,
        architecture: d.architecture,
        modelType: d.modelType,
        layers: Number(d.layersCount ?? (Array.isArray(d.layers) ? d.layers.length : (d.layers || 0)) ?? 0),
        parameters: d.totalParams,
        inputShape: d.inputShape,
        numClasses: d.numClasses,
        savedAt: d.updatedAt,
        savedPath: d.savePath
      }));
    } catch (e) {
      modelList = [];
    }

    logger.info('Model list retrieved', { count: modelList.length });

    res.json({
      success: true,
      message: 'Model list retrieved',
      models: modelList,
      count: modelList.length,
      currentModelId: ModelService.getCurrentModelId()
    });
  } catch (error) {
    logger.error('Error getting model list', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error getting model list',
      error: error.message
    });
  }
});

router.post('/load-by-id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const modelId = String(req.body?.modelId || '').trim();
    if (!modelId) return res.status(400).json({ success: false, message: 'modelId is required' });

    // Ensure user owns it
    const doc = await Model.findOne({ userId, modelId }).lean();
    if (!doc) return res.status(404).json({ success: false, message: 'Model not found' });

    await ModelService.loadModelById(modelId);
    logger.info('Model loaded by id', { modelId });

    return res.json({
      success: true,
      message: 'Model loaded successfully',
      modelId
    });
  } catch (error) {
    logger.error('Error loading model by id', { error: error.message });
    return res.status(500).json({ success: false, message: 'Error loading model by id', error: error.message });
  }
});

router.put('/:modelId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const modelId = String(req.params?.modelId || '').trim();
    const name = String(req.body?.name || '').trim();
    const description = String(req.body?.description || '').trim();
    if (!modelId) return res.status(400).json({ success: false, message: 'modelId is required' });
    if (!name) return res.status(400).json({ success: false, message: 'name is required' });

    const updated = await Model.findOneAndUpdate(
      { userId, modelId },
      { $set: { name, ...(description != null ? { description } : {}) } },
      { new: true }
    ).lean();

    if (!updated) return res.status(404).json({ success: false, message: 'Model not found' });

    if (ModelService?.savedModels?.[modelId]) {
      ModelService.savedModels[modelId].name = name;
      ModelService.savedModels[modelId].description = description;
      try {
        ModelService.saveModelsMetadata?.();
      } catch (e) {
        // ignore
      }
    }

    logger.info('Model updated', { modelId });
    return res.json({ success: true, message: 'Model updated', model: updated });
  } catch (error) {
    logger.error('Error updating model', { error: error.message });
    return res.status(500).json({ success: false, message: 'Error updating model', error: error.message });
  }
});

router.get('/:modelId/files', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const modelId = String(req.params?.modelId || '').trim();
    if (!modelId) return res.status(400).json({ success: false, message: 'modelId is required' });

    const doc = await Model.findOne({ userId, modelId }).lean();
    if (!doc) return res.status(404).json({ success: false, message: 'Model not found' });

    const dir = ModelService.getModelSaveDirById(modelId);
    const exists = fs.existsSync(dir);
    if (!exists) return res.json({ success: true, files: [] });

    const files = await fsPromises.readdir(dir);
    const allowed = (files || []).filter((f) => {
      const lower = String(f).toLowerCase();
      if (lower === 'model.json') return true;
      if (lower.endsWith('.bin')) return true;
      if (lower.endsWith('.json')) return true;
      return false;
    });

    return res.json({
      success: true,
      files: allowed.map((f) => ({
        filename: f,
        url: `/api/model/${encodeURIComponent(modelId)}/files/${encodeURIComponent(f)}`
      }))
    });
  } catch (error) {
    logger.error('Error listing model files', { error: error.message });
    return res.status(500).json({ success: false, message: 'Error listing model files', error: error.message });
  }
});

router.get('/:modelId/files/:filename', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const modelId = String(req.params?.modelId || '').trim();
    const filename = String(req.params?.filename || '').trim();
    if (!modelId || !filename) return res.status(400).json({ success: false, message: 'modelId and filename are required' });

    const doc = await Model.findOne({ userId, modelId }).lean();
    if (!doc) return res.status(404).json({ success: false, message: 'Model not found' });

    if (filename.includes('..') || filename.includes('\\') || filename.includes('/')) {
      return res.status(400).json({ success: false, message: 'Invalid filename' });
    }

    const lower = filename.toLowerCase();
    const ok = (lower === 'model.json') || lower.endsWith('.bin') || lower.endsWith('.json');
    if (!ok) return res.status(400).json({ success: false, message: 'File type not allowed' });

    const dir = ModelService.getModelSaveDirById(modelId);
    const filePath = path.join(dir, filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'File not found' });

    return res.download(filePath);
  } catch (error) {
    logger.error('Error downloading model file', { error: error.message });
    return res.status(500).json({ success: false, message: 'Error downloading model file', error: error.message });
  }
});

router.delete('/:modelId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const modelId = String(req.params?.modelId || '').trim();
    if (!modelId) return res.status(400).json({ success: false, message: 'modelId is required' });

    const deleted = await Model.findOneAndDelete({ userId, modelId }).lean();
    if (!deleted) return res.status(404).json({ success: false, message: 'Model not found' });

    try {
      if (ModelService?.savedModels?.[modelId]) {
        delete ModelService.savedModels[modelId];
        if (ModelService.currentModelId === modelId) {
          ModelService.currentModelId = null;
        }
        try {
          ModelService.saveModelsMetadata?.();
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      // ignore
    }

    const dir = ModelService.getModelSaveDirById(modelId);
    try {
      if (fs.existsSync(dir)) {
        await fsPromises.rm(dir, { recursive: true, force: true });
      }
    } catch (e) {
      // ignore
    }

    logger.info('Model deleted', { modelId });
    return res.json({ success: true, message: 'Model deleted', deleted });
  } catch (error) {
    logger.error('Error deleting model', { error: error.message });
    return res.status(500).json({ success: false, message: 'Error deleting model', error: error.message });
  }
});

// @route   POST /api/model/clear
// @desc    Clear all saved models (metadata + in-memory)
// @access  Private
router.post('/clear', authMiddleware, async (req, res) => {
  try {
    ModelService.clearAllModels();
    logger.info('All models cleared');
    res.json({
      success: true,
      message: 'All models cleared'
    });
  } catch (error) {
    logger.error('Error clearing models', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error clearing models',
      error: error.message
    });
  }
});

module.exports = router;
