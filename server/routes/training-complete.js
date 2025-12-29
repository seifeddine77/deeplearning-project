const express = require('express');
const router = express.Router();
const TrainingService = require('../services/trainingService');
const logger = require('../config/logger');
const { authMiddleware } = require('../middleware/auth');
const Training = require('../models/Training');
const Model = require('../models/Model');

function shouldUseFileFallback() {
  return String(process.env.NODE_ENV || '').toLowerCase() === 'development'
    && String(process.env.USE_FILE_TRAINING_HISTORY || '').toLowerCase() === 'true';
}

// @route   POST /api/training/start
// @desc    Start model training
// @access  Private
router.post('/start', authMiddleware, async (req, res) => {
  try {
    const { epochs = 10, batchSize = 32, learningRate = 0.001, validationSplit = 0.2, modelId } = req.body;

    // Vérifier si ce modèle est déjà en cours d'entraînement
    if (modelId && TrainingService.isModelTraining(modelId)) {
      return res.status(400).json({
        success: false,
        message: `Training already in progress for model ${modelId}`
      });
    }

    const config = { epochs, batchSize, learningRate, validationSplit, modelId, userId: req.user?.userId };
    
    // Start training in background (don't await)
    const trainingPromise = TrainingService.startTraining(config);
    
    // Log training completion when done
    trainingPromise
      .then(() => {
        logger.info('Training completed', { epochs, batchSize, modelId });
      })
      .catch((error) => {
        try {
          console.error('Training failed (raw):', error);
        } catch (e) {
          // ignore
        }
        logger.error('Training failed', {
          error: error?.message || String(error),
          name: error?.name,
          code: error?.code,
          stack: error?.stack
        });
      });

    logger.info('Training started', { epochs, batchSize, modelId });

    res.json({
      success: true,
      message: 'Training started successfully',
      training: {
        status: 'in_progress',
        epochs,
        batchSize,
        learningRate,
        modelId: modelId || 'current',
        startedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error starting training', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error starting training',
      error: error.message
    });
  }
});

// @route   GET /api/training/status
// @desc    Get real-time training status/progress
// @access  Private
router.get('/status', authMiddleware, (req, res) => {
  try {
    const modelId = req.query.modelId || 'current';
    const status = TrainingService.getTrainingStatus(modelId);

    res.json({
      success: true,
      message: 'Training status retrieved',
      status: {
        ...status,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error getting training status', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error getting training status',
      error: error.message
    });
  }
});

// @route   GET /api/training/confusion-matrix
// @desc    Compute confusion matrix from real predictions
// @access  Private
router.get('/confusion-matrix', authMiddleware, async (req, res) => {
  try {
    const modelId = req.query.modelId || 'current';
    const dataset = req.query.dataset || 'test';
    const maxSamples = req.query.maxSamples;

    const result = await TrainingService.getConfusionMatrix(modelId, dataset, maxSamples);
    logger.info('Confusion matrix computed', { dataset, modelId, samples: result.samples });

    res.json({
      success: true,
      message: 'Confusion matrix computed',
      confusionMatrix: result
    });
  } catch (error) {
    logger.error('Error computing confusion matrix', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error computing confusion matrix',
      error: error.message
    });
  }
});

// @route   GET /api/training/roc-curve
// @desc    Compute ROC curve (micro-average) from real predictions
// @access  Private
router.get('/roc-curve', authMiddleware, async (req, res) => {
  try {
    const modelId = req.query.modelId || 'current';
    const dataset = req.query.dataset || 'test';
    const maxSamples = req.query.maxSamples;
    const steps = req.query.steps;

    const result = await TrainingService.getRocCurveMicro(modelId, dataset, maxSamples, steps);
    logger.info('ROC curve computed', { dataset, modelId, samples: result.samples, auc: result.auc });

    res.json({
      success: true,
      message: 'ROC curve computed',
      roc: result
    });
  } catch (error) {
    logger.error('Error computing ROC curve', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error computing ROC curve',
      error: error.message
    });
  }
});

// @route   GET /api/training/feature-importance
// @desc    Compute feature importance from real model weights (tabular)
// @access  Private
router.get('/feature-importance', authMiddleware, async (req, res) => {
  try {
    const modelId = req.query.modelId || 'current';
    const topK = req.query.topK;

    const result = await TrainingService.getFeatureImportanceFromWeights(modelId, topK);
    logger.info('Feature importance computed', { modelId, topK: result.topK });

    res.json({
      success: true,
      message: 'Feature importance computed',
      featureImportance: result
    });
  } catch (error) {
    logger.error('Error computing feature importance', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error computing feature importance',
      error: error.message
    });
  }
});

// @route   GET /api/training/model-comparison
// @desc    Compare multiple models using real evaluation/confusion metrics
// @access  Private
router.get('/model-comparison', authMiddleware, async (req, res) => {
  try {
    const modelIdsRaw = req.query.modelIds;
    const dataset = req.query.dataset || 'test';
    const maxSamples = req.query.maxSamples;
    const force = String(req.query.force || '').toLowerCase() === 'true';

    const modelIds = typeof modelIdsRaw === 'string'
      ? modelIdsRaw.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const userId = req.user?.userId;

    let result;
    if (!force && userId) {
      // Use stored Mongo metrics (fast path)
      const sessions = await Training.find({
        userId,
        modelId: { $in: modelIds },
        status: 'completed'
      })
        .sort({ completedAt: -1, createdAt: -1 })
        .lean();

      const byModel = (sessions || []).reduce((acc, s) => {
        if (!s?.modelId) return acc;
        if (!acc[s.modelId]) acc[s.modelId] = s;
        return acc;
      }, {});

      const models = (modelIds || []).map((id) => {
        const s = byModel[id];
        const ev = s?.evaluationMetrics || {};
        const fm = s?.finalMetrics || {};
        return {
          modelId: id,
          accuracy: Number(ev.accuracy ?? fm.accuracy ?? 0),
          loss: Number(fm.loss ?? 0),
          precision: Number(ev.precision ?? 0),
          recall: Number(ev.recall ?? 0),
          f1: Number(ev.f1Score ?? 0),
          trainingRunId: s?.trainingRunId || null,
          datasetId: s?.datasetId || null,
          timestamp: (s?.completedAt || s?.createdAt || new Date()).toISOString()
        };
      });

      result = {
        dataset,
        models,
        source: 'mongo',
        timestamp: new Date().toISOString()
      };
    } else {
      // Force recompute (slow path)
      result = await TrainingService.getModelComparison(modelIds, dataset, maxSamples);
      result.source = 'recomputed';
    }

    let metaByModelId = {};
    try {
      if (userId && Array.isArray(result?.models) && result.models.length) {
        const ids = result.models.map(m => m?.modelId).filter(Boolean);
        const metas = await Model.find({ userId, modelId: { $in: ids } })
          .select('modelId name modelType architecture layersCount trainedAt createdAt')
          .lean();
        metaByModelId = (metas || []).reduce((acc, m) => {
          acc[m.modelId] = m;
          return acc;
        }, {});

        result.models = result.models.map((m) => {
          const meta = metaByModelId[m.modelId];
          return {
            ...m,
            name: meta?.name || null,
            modelType: meta?.modelType || null,
            architecture: meta?.architecture || null,
            layersCount: Number(meta?.layersCount ?? 0),
            trainedAt: meta?.trainedAt || null,
            createdAt: meta?.createdAt || null
          };
        });
      }
    } catch (e) {
      // ignore metadata lookup errors
    }
    logger.info('Model comparison computed', { dataset, models: result.models?.length || 0 });

    res.json({
      success: true,
      message: 'Model comparison computed',
      comparison: result
    });
  } catch (error) {
    logger.error('Error computing model comparison', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error computing model comparison',
      error: error.message
    });
  }
});

// @route   GET /api/training/history
// @desc    Get training history
// @access  Private
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    let history = [];
    try {
      if (userId) {
        const sessions = await Training.find({ userId }).sort({ createdAt: -1 }).lean();
        history = (sessions || []).map((s) => ({
          trainingRunId: s.trainingRunId,
          modelId: s.modelId,
          datasetId: s.datasetId || null,
          config: {
            epochs: s.epochs,
            batchSize: s.batchSize,
            learningRate: s.learningRate,
            validationSplit: s.validationSplit
          },
          history: {
            history: {
              loss: s.history?.loss || [],
              acc: s.history?.accuracy || [],
              val_loss: s.history?.valLoss || [],
              val_acc: s.history?.valAccuracy || []
            }
          },
          timestamp: (s.completedAt || s.createdAt || new Date()).toISOString()
        }));
      }
    } catch (e) {
      history = [];
    }

    if (!history.length && shouldUseFileFallback()) {
      history = await TrainingService.getTrainingHistory();
      if (userId) {
        history = (history || []).filter(h => h.userId === userId);
      }
    }

    logger.info('Training history retrieved');

    res.json({
      success: true,
      message: 'Training history retrieved',
      history: {
        sessions: history.length,
        data: history,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error getting training history', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error getting training history',
      error: error.message
    });
  }
});

// @route   POST /api/training/evaluate
// @desc    Evaluate model
// @access  Private
router.post('/evaluate', authMiddleware, async (req, res) => {
  try {
    const { dataset = 'test', modelId } = req.body;

    const evaluation = await TrainingService.evaluateModel(modelId, dataset);

    logger.info('Model evaluated', { dataset, modelId });

    res.json({
      success: true,
      message: 'Model evaluated successfully',
      evaluation: {
        dataset,
        loss: evaluation.loss,
        accuracy: evaluation.accuracy,
        modelId: modelId || 'current',
        timestamp: evaluation.timestamp
      }
    });
  } catch (error) {
    logger.error('Error evaluating model', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error evaluating model',
      error: error.message
    });
  }
});

// @route   POST /api/training/predict
// @desc    Make predictions
// @access  Private
router.post('/predict', authMiddleware, async (req, res) => {
  try {
    const { inputData, modelId } = req.body;

    if (!inputData) {
      return res.status(400).json({
        success: false,
        message: 'Input data is required'
      });
    }

    const prediction = await TrainingService.predict(inputData, modelId);

    logger.info('Prediction made', { predictedClass: prediction.predictedClass, modelId });

    res.json({
      success: true,
      message: 'Prediction made successfully',
      prediction: {
        predictions: prediction.predictions,
        predictedClass: prediction.predictedClass,
        confidence: prediction.confidence,
        modelId: modelId || 'current',
        timestamp: prediction.timestamp
      }
    });
  } catch (error) {
    logger.error('Error making prediction', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error making prediction',
      error: error.message
    });
  }
});

// @route   GET /api/training/metrics
// @desc    Get training metrics
// @access  Private
router.get('/metrics', authMiddleware, async (req, res) => {
  try {
    const metrics = await TrainingService.getMetrics();

    logger.info('Training metrics retrieved');

    res.json({
      success: true,
      message: 'Training metrics retrieved',
      metrics: {
        isTraining: metrics.isTraining,
        trainingHistoryCount: metrics.trainingHistoryCount,
        metrics: metrics.metrics,
        timestamp: metrics.timestamp
      }
    });
  } catch (error) {
    logger.error('Error getting metrics', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error getting metrics',
      error: error.message
    });
  }
});

module.exports = router;
