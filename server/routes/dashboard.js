const express = require('express');
const router = express.Router();
const logger = require('../config/logger');
const fs = require('fs');
const path = require('path');
const DataService = require('../services/dataService');
const ModelService = require('../services/modelService');
const TrainingService = require('../services/trainingService');
const Dataset = require('../models/Dataset');
const Training = require('../models/Training');
const Model = require('../models/Model');
const { authMiddleware } = require('../middleware/auth');

function last(arr) {
  return Array.isArray(arr) && arr.length ? arr[arr.length - 1] : null;
}

async function tryHydrateLatestDatasetStatsForUser(userId) {
  try {
    const hasStats = DataService?.stats && Object.keys(DataService.stats).length > 0;
    if (DataService?.isDataLoaded && hasStats && DataService?.currentDatasetId) return DataService.stats;

    if (!userId) return await tryHydrateLatestDatasetStats();

    const ds = await Dataset.findOne({ userId }).sort({ createdAt: -1 }).lean();
    if (!ds) return DataService?.stats || {};

    const totalSamples = safeNumber(ds.totalSamples, 0);
    const trainSize = safeNumber(ds?.split?.trainSize, Math.floor(totalSamples * 0.7));
    const testSize = safeNumber(ds?.split?.testSize, Math.floor(totalSamples * 0.2));
    const valSize = safeNumber(ds?.split?.valSize, Math.max(0, totalSamples - trainSize - testSize));

    DataService.stats = {
      ...DataService.stats,
      datasetType: ds.datasetType || DataService.stats?.datasetType || null,
      filePath: ds.filePath || DataService.stats?.filePath,
      totalSamples,
      features: safeNumber(ds.features, 0),
      classes: safeNumber(ds.classes, 0),
      labelFormat: ds.labelFormat || DataService.stats?.labelFormat || 'unknown',
      inputShape: Array.isArray(ds.inputShape) ? ds.inputShape : (DataService.stats?.inputShape || []),
      fingerprint: ds.fingerprint || DataService.stats?.fingerprint || null,
      fingerprintHash: ds.fingerprintHash || DataService.stats?.fingerprintHash || '',
      trainSize,
      testSize,
      valSize
    };
    DataService.isDataLoaded = true;
    DataService.currentDatasetId = ds?._id ? String(ds._id) : null;

    return DataService.stats;
  } catch (e) {
    return DataService?.stats || {};
  }
}

function safeNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function parseDateSafe(v) {
  const d = new Date(v);
  return Number.isFinite(d.getTime()) ? d : null;
}

async function tryAutoloadLatestModel() {
  try {
    if (ModelService.getModel?.()) {
      return ModelService.getCurrentModelId?.() || null;
    }

    const saved = ModelService.savedModels ? Object.values(ModelService.savedModels) : [];
    if (!saved.length) return null;

    const sorted = saved
      .map((m) => ({
        id: m?.id,
        name: m?.name,
        createdAt: parseDateSafe(m?.createdAt)?.getTime() || 0
      }))
      .filter((m) => !!m.id)
      .sort((a, b) => b.createdAt - a.createdAt);

    const latest = sorted[0];
    if (!latest) return null;

    // Best-effort: set current modelId for filtering even if model weights are not loaded.
    try {
      ModelService.currentModelId = latest.id;
    } catch (e) {
      // ignore
    }

    // Best-effort: try to load a persisted model from disk.
    // ModelService.loadModel expects a directory name under /models.
    const modelsDir = path.join(__dirname, '../../models');
    const candidates = [];

    // Prefer explicit saved folder names.
    candidates.push(latest.id);
    if (latest.name) candidates.push(String(latest.name));

    // Also try the newest directory under /models.
    try {
      if (fs.existsSync(modelsDir)) {
        const dirs = fs.readdirSync(modelsDir, { withFileTypes: true })
          .filter((d) => d.isDirectory())
          .map((d) => d.name);

        const newestDir = dirs
          .map((d) => {
            const stat = fs.statSync(path.join(modelsDir, d));
            return { d, mtime: stat?.mtime?.getTime?.() || 0 };
          })
          .sort((a, b) => b.mtime - a.mtime)[0]?.d;

        if (newestDir) candidates.push(newestDir);
      }
    } catch (e) {
      // ignore
    }

    for (const candidate of candidates) {
      try {
        const modelJson = path.join(modelsDir, candidate, 'model.json');
        if (!fs.existsSync(modelJson)) continue;
        await ModelService.loadModel(candidate);
        try {
          ModelService.currentModelId = latest.id;
          if (ModelService.savedModels?.[latest.id]) {
            ModelService.savedModels[latest.id].model = ModelService.getModel?.();
          }
        } catch (e) {
          // ignore
        }
        return latest.id;
      } catch (e) {
        // ignore and try next
      }
    }

    return latest.id;
  } catch (e) {
    return null;
  }
}

async function tryHydrateLatestDatasetStats() {
  try {
    const hasStats = DataService?.stats && Object.keys(DataService.stats).length > 0;
    if (DataService?.isDataLoaded && hasStats) return DataService.stats;

    const ds = await Dataset.findOne().sort({ createdAt: -1 }).lean();
    if (!ds) return DataService?.stats || {};

    const totalSamples = safeNumber(ds.totalSamples, 0);
    const trainSize = safeNumber(ds?.split?.trainSize, Math.floor(totalSamples * 0.7));
    const testSize = safeNumber(ds?.split?.testSize, Math.floor(totalSamples * 0.2));
    const valSize = safeNumber(ds?.split?.valSize, Math.max(0, totalSamples - trainSize - testSize));

    DataService.stats = {
      ...DataService.stats,
      datasetType: ds.datasetType || DataService.stats?.datasetType || null,
      filePath: ds.filePath || DataService.stats?.filePath,
      totalSamples,
      features: safeNumber(ds.features, 0),
      classes: safeNumber(ds.classes, 0),
      trainSize,
      testSize,
      valSize
    };
    DataService.isDataLoaded = true;

    return DataService.stats;
  } catch (e) {
    return DataService?.stats || {};
  }
}

// @route   GET /api/dashboard/overview
// @desc    Aggregated dashboard overview (dataset + model + training + recent metrics)
// @access  Private
router.get('/overview', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const datasetStats = await tryHydrateLatestDatasetStatsForUser(userId);

    // Prefer Mongo as source-of-truth for current model selection
    let currentModelIdFromMongo = null;
    try {
      if (userId) {
        const latestModelDoc = await Model.findOne({ userId }).sort({ updatedAt: -1 }).lean();
        currentModelIdFromMongo = latestModelDoc?.modelId || null;
      }
    } catch (e) {
      currentModelIdFromMongo = null;
    }

    const autoloadedModelId = await tryAutoloadLatestModel();
    const currentModelId = currentModelIdFromMongo || ModelService.getCurrentModelId?.() || autoloadedModelId || 'current';

    let modelSummary = null;
    try {
      const ms = await ModelService.getModelSummary?.();
      modelSummary = ms?.model ? ms.model : ms;
    } catch (e) {
      modelSummary = null;
    }

    const trainingStatus = TrainingService.getTrainingStatus?.(currentModelId) || {
      modelId: currentModelId,
      status: 'idle',
      progress: 0,
      epoch: 0,
      epochs: 0,
      isTraining: false
    };

    // Mongo source-of-truth for recent metrics
    let latestSession = null;
    try {
      if (userId && currentModelId && currentModelId !== 'current') {
        latestSession = await Training.findOne({ userId, modelId: currentModelId, status: 'completed' })
          .sort({ completedAt: -1, createdAt: -1 })
          .lean();
      }
    } catch (e) {
      latestSession = null;
    }

    const histLoss = latestSession?.history?.loss || [];
    const histAcc = latestSession?.history?.accuracy || [];
    const histValLoss = latestSession?.history?.valLoss || [];
    const histValAcc = latestSession?.history?.valAccuracy || [];

    const latestAcc = safeNumber(last(histAcc), null);
    const latestLoss = safeNumber(last(histLoss), null);
    const latestValLoss = safeNumber(last(histValLoss), null);
    const latestValAcc = safeNumber(last(histValAcc), null);

    const latestTs = (latestSession?.completedAt || latestSession?.createdAt)
      ? new Date(latestSession.completedAt || latestSession.createdAt).toISOString()
      : null;

    const recentMetrics = [];
    if (latestLoss != null) recentMetrics.push({ name: 'Loss', value: latestLoss.toFixed(4), timestamp: latestTs });
    if (latestAcc != null) recentMetrics.push({ name: 'Accuracy', value: `${(latestAcc * 100).toFixed(2)}%`, timestamp: latestTs });
    if (latestValLoss != null) recentMetrics.push({ name: 'Validation Loss', value: latestValLoss.toFixed(4), timestamp: latestTs });
    if (latestValAcc != null) recentMetrics.push({ name: 'Validation Accuracy', value: `${(latestValAcc * 100).toFixed(2)}%`, timestamp: latestTs });

    const overview = {
      model: {
        id: currentModelId,
        status: modelSummary?.status || (ModelService.getModel?.() ? 'ready' : 'not_initialized'),
        accuracy: latestAcc,
        summary: modelSummary
      },
      training: {
        status: trainingStatus?.status || (trainingStatus?.isTraining ? 'in_progress' : 'idle'),
        epoch: safeNumber(trainingStatus?.epoch, 0),
        epochs: safeNumber(trainingStatus?.epochs, 0),
        progress: safeNumber(trainingStatus?.progress, 0),
        lastLogs: trainingStatus?.lastLogs || null
      },
      dataset: {
        datasetType: datasetStats?.datasetType || null,
        totalSamples: safeNumber(datasetStats?.totalSamples, 0),
        features: safeNumber(datasetStats?.features, 0),
        classes: safeNumber(datasetStats?.classes, 0),
        trainSize: safeNumber(datasetStats?.trainSize, 0),
        testSize: safeNumber(datasetStats?.testSize, 0),
        valSize: safeNumber(datasetStats?.valSize, 0)
      },
      recentMetrics,
      system: {
        framework: 'TensorFlow.js',
        backend: 'Node.js'
      },
      timestamp: new Date().toISOString()
    };

    logger.info('Dashboard overview retrieved', {
      hasModel: !!ModelService.getModel?.(),
      modelId: currentModelId,
      hasDataset: !!DataService?.isDataLoaded,
      trainingSessions: latestSession ? 1 : 0
    });

    res.json({
      success: true,
      message: 'Dashboard overview retrieved',
      overview
    });
  } catch (error) {
    logger.error('Error getting dashboard overview', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error getting dashboard overview',
      error: error.message
    });
  }
});

module.exports = router;
