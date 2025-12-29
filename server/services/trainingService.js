const fs = require('fs');
const path = require('path');
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
const ModelService = require('./modelService');
const DataService = require('./dataService');
let Training;
try {
  Training = require('../models/Training');
} catch (e) {
  Training = null;
}

class TrainingService {
  constructor() {
    this.trainingHistory = [];
    this.metrics = {};
    this.isTraining = false;
    this.trainingByModel = {}; // Track training per model
    this.trainingProgressByModel = {}; // Track progress per model
    this.historyFile = path.join(__dirname, '../../data/training-history.json');

    if (this.shouldUseFileHistory()) {
      const dataDir = path.dirname(this.historyFile);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      this.loadHistory();
    }
  }

  shouldUseFileHistory() {
    return String(process.env.NODE_ENV || '').toLowerCase() === 'development'
      && String(process.env.USE_FILE_TRAINING_HISTORY || '').toLowerCase() === 'true';
  }

  assertDatasetCompatibleWithModel(modelId, purpose = 'operation') {
    const datasetType = DataService?.stats?.datasetType || 'tabular';
    const labelFormat = DataService?.stats?.labelFormat || 'unknown';
    const features = Number(DataService?.stats?.features ?? 0);
    const classes = Number(DataService?.stats?.classes ?? 0);

    if (!modelId || modelId === 'current') return;

    const modelMeta = ModelService?.savedModels?.[modelId] || {};
    const expected = modelMeta?.expectedFingerprint || null;
    if (!expected) return; // allow legacy models

    const problems = [];
    if (expected.datasetType && expected.datasetType !== datasetType) {
      problems.push(`datasetType expected=${expected.datasetType} got=${datasetType}`);
    }
    if (Number.isFinite(expected.features) && expected.features > 0 && expected.features !== features) {
      problems.push(`features expected=${expected.features} got=${features}`);
    }
    if (Number.isFinite(expected.classes) && expected.classes > 0 && expected.classes !== classes) {
      problems.push(`classes expected=${expected.classes} got=${classes}`);
    }
    if (expected.labelFormat && expected.labelFormat !== 'unknown' && expected.labelFormat !== labelFormat) {
      problems.push(`labelFormat expected=${expected.labelFormat} got=${labelFormat}`);
    }

    if (problems.length) {
      throw new Error(
        `Cannot ${purpose}: dataset is incompatible with this model (${modelId}). ` +
        `Fix by re-uploading the correct dataset or recreating the model for the current dataset. ` +
        `Details: ${problems.join(', ')}`
      );
    }
  }

  requireRealTabularTensors(purpose = 'operation') {
    const datasetType = DataService?.stats?.datasetType || 'tabular';
    const tabular = DataService.getTabularTrainTensors?.();
    if (!DataService?.isDataLoaded) {
      throw new Error(`Cannot ${purpose}: no dataset loaded. Upload/load a real dataset first.`);
    }
    if (datasetType !== 'tabular' || !tabular) {
      throw new Error(`Cannot ${purpose}: real tabular tensors not available. Please upload a CSV tabular dataset and ensure it is loaded.`);
    }
    return tabular;
  }

  requireRealImageTensors(purpose = 'operation') {
    const datasetType = DataService?.stats?.datasetType || 'tabular';
    const image = DataService.getImageTrainTensors?.();
    if (!DataService?.isDataLoaded) {
      throw new Error(`Cannot ${purpose}: no dataset loaded. Upload/load a real dataset first.`);
    }
    if (datasetType !== 'image' || !image) {
      throw new Error(`Cannot ${purpose}: real image tensors not available. Please upload an image ZIP dataset (folders-per-class) and ensure it is loaded.`);
    }
    return image;
  }

  requireRealSequenceTensors(purpose = 'operation') {
    const datasetType = DataService?.stats?.datasetType || 'tabular';
    const seq = DataService.getSequenceTrainTensors?.();
    if (!DataService?.isDataLoaded) {
      throw new Error(`Cannot ${purpose}: no dataset loaded. Upload/load a real dataset first.`);
    }
    if (datasetType !== 'sequence' || !seq) {
      throw new Error(`Cannot ${purpose}: real sequence tensors not available. Please upload a CSV sequence dataset and ensure it is loaded.`);
    }
    return seq;
  }

  loadHistory() {
    try {
      if (!this.shouldUseFileHistory()) {
        this.trainingHistory = [];
        return;
      }
      if (fs.existsSync(this.historyFile)) {
        const data = fs.readFileSync(this.historyFile, 'utf8');
        this.trainingHistory = JSON.parse(data);
        console.log(`✅ Loaded ${this.trainingHistory.length} training sessions from file`);
      }
    } catch (err) {
      console.warn('Could not load training history from file:', err.message);
      this.trainingHistory = [];
    }
  }

  saveHistory() {
    try {
      if (!this.shouldUseFileHistory()) return;
      fs.writeFileSync(this.historyFile, JSON.stringify(this.trainingHistory, null, 2));
    } catch (err) {
      console.warn('Could not save training history to file:', err.message);
    }
  }

  getTrainingStatus(modelId = 'current') {
    const status = this.trainingProgressByModel[modelId];
    if (!status) {
      return {
        modelId,
        status: this.trainingByModel[modelId] ? 'in_progress' : 'idle',
        progress: this.trainingByModel[modelId] ? 0 : 0,
        epoch: 0,
        epochs: 0,
        isTraining: !!this.trainingByModel[modelId]
      };
    }

    return {
      ...status,
      modelId,
      isTraining: !!this.trainingByModel[modelId]
    };
  }

  async startTraining(config) {
    let modelId = 'current';
    let userId = null;
    let datasetId = null;
    try {
      modelId = config?.modelId || 'current';
      userId = config?.userId || null;
      datasetId = DataService?.currentDatasetId || null;
      const trainingRunId = (crypto.randomUUID ? crypto.randomUUID() : `run_${Date.now()}_${Math.random().toString(16).slice(2)}`);
      let trainingDocId = null;
      
      console.log(`🔍 startTraining called with config:`, config);
      console.log(`🔍 modelId: ${modelId}`);
      
      // Check if THIS model is already training
      if (this.trainingByModel[modelId]) {
        throw new Error(`Training already in progress for model ${modelId}`);
      }

      this.trainingByModel[modelId] = true;
      this.isTraining = true;

      // Initialize status early so UI doesn't stay at 0% if something fails before fit() starts
      this.trainingProgressByModel[modelId] = {
        status: 'initializing',
        progress: 0,
        epoch: 0,
        epochs: Math.min(Math.max(1, Number(config?.epochs) || 1), Number(process.env.TRAINING_MAX_EPOCHS || 100)),
        startedAt: new Date().toISOString(),
        trainingRunId,
        datasetId: datasetId || null
      };
      
      // Get model by ID if provided, otherwise use current model
      let model;
      if (config.modelId) {
        console.log(`🔍 Getting model by ID: ${config.modelId}`);
        model = await ModelService.getOrLoadModelById(config.modelId);
        console.log(`🔍 Model retrieved:`, model ? 'OK' : 'NULL');
      } else {
        console.log(`🔍 Getting current model`);
        model = ModelService.getModel();
        console.log(`🔍 Current model retrieved:`, model ? 'OK' : 'NULL');
      }

      if (!model) {
        throw new Error('Model not initialized');
      }

      this.assertDatasetCompatibleWithModel(config.modelId, 'train');

      // Verify model has fit method
      if (typeof model.fit !== 'function') {
        throw new Error(`Model does not have fit method. Model type: ${typeof model}, keys: ${Object.keys(model).join(', ')}`);
      }

      const {
        epochs = 10,
        batchSize = 32,
        learningRate = 0.001,
        validationSplit = 0.2
      } = config;

      // Enforce real dataset usage (no dummy data allowed)
      const datasetType = String(DataService?.stats?.datasetType || 'tabular');
      const tensors = datasetType === 'image'
        ? this.requireRealImageTensors('start training')
        : (datasetType === 'sequence'
          ? this.requireRealSequenceTensors('start training')
          : this.requireRealTabularTensors('start training'));

      const xTrain = tensors.xTrain;
      const yTrain = tensors.yTrain;
      const xVal = tensors.xVal;
      const yVal = tensors.yVal;
      console.log(`✅ Using real ${datasetType} dataset tensors: xTrain=${xTrain.shape}, yTrain=${yTrain.shape}`);

      // Train the model
      console.log(`Starting training with model: ${modelId}`);
      const maxEpochs = Number(process.env.TRAINING_MAX_EPOCHS || 100);
      const effectiveEpochs = Math.min(Math.max(1, Number(epochs) || 1), maxEpochs);

      // Create Mongo training session (source of truth)
      try {
        if (Training && userId) {
          const doc = await Training.create({
            userId,
            trainingRunId,
            modelId,
            datasetId: datasetId || null,
            epochs: Number(config.epochs || effectiveEpochs),
            batchSize: Number(config.batchSize || batchSize),
            learningRate: Number(config.learningRate || learningRate),
            validationSplit: Number(config.validationSplit || validationSplit),
            status: 'running',
            progress: 0,
            startedAt: new Date()
          });
          trainingDocId = doc?._id ? String(doc._id) : null;
        }
      } catch (e) {
        trainingDocId = null;
      }

      this.trainingProgressByModel[modelId] = {
        ...this.trainingProgressByModel[modelId],
        status: 'in_progress',
        progress: 0,
        epoch: 0,
        epochs: effectiveEpochs,
        startedAt: this.trainingProgressByModel[modelId]?.startedAt || new Date().toISOString(),
        trainingRunId,
        datasetId: datasetId || null
      };

      const fitArgs = {
        epochs: effectiveEpochs,
        batchSize: Math.max(batchSize, 16), // Minimum batch size
        ...(xVal && yVal ? { validationData: [xVal, yVal] } : { validationSplit }),
        verbose: 0, // Reduce verbosity for faster output
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            try {
              const loss = Number(logs?.loss ?? NaN);
              const acc = Number(logs?.acc ?? logs?.accuracy ?? NaN);
              const valLoss = Number(logs?.val_loss ?? logs?.valLoss ?? NaN);
              const valAcc = Number(logs?.val_acc ?? logs?.val_accuracy ?? logs?.valAccuracy ?? NaN);

              const lossStr = Number.isFinite(loss) ? loss.toFixed(4) : 'n/a';
              const accStr = Number.isFinite(acc) ? acc.toFixed(4) : 'n/a';
              console.log(`Epoch ${epoch + 1}: loss = ${lossStr}, acc = ${accStr}`);

              const progress = Math.round(((epoch + 1) / effectiveEpochs) * 100);

              try {
                if (Training && trainingDocId) {
                  Training.findByIdAndUpdate(trainingDocId, {
                    $set: {
                      status: 'running',
                      progress,
                      updatedAt: new Date()
                    }
                  }).exec();
                }
              } catch (e) {
                // ignore
              }

              this.trainingProgressByModel[modelId] = {
                ...this.trainingProgressByModel[modelId],
                status: 'in_progress',
                epoch: epoch + 1,
                progress,
                lastLogs: {
                  loss,
                  acc,
                  val_loss: valLoss,
                  val_acc: valAcc
                }
              };
            } catch (e) {
              // Never crash training from a logging/progress callback
              console.warn('onEpochEnd callback error:', e?.message || e);
            }
          }
        }
      };

      const history = await model.fit(xTrain, yTrain, fitArgs);

      console.log(`Training completed. History object:`, history);

      // Extract history data from TensorFlow history object
      const historyData = {
        loss: history.history.loss || [],
        acc: history.history.acc || [],
        val_loss: history.history.val_loss || [],
        val_acc: history.history.val_acc || []
      };

      console.log(`History data extracted:`, historyData);

      // Optional dev fallback: write file history
      if (this.shouldUseFileHistory()) {
        const trainingRecord = {
          modelId: modelId,
          userId: userId,
          trainingRunId,
          datasetId: datasetId || null,
          config: {
            epochs: config.epochs,
            batchSize: config.batchSize,
            learningRate: config.learningRate
          },
          history: {
            history: historyData
          },
          timestamp: new Date().toISOString()
        };

        this.trainingHistory.push(trainingRecord);
        this.saveHistory();
      }

      // Persist to MongoDB (source of truth)
      try {
        if (Training && userId) {
          const lastLoss = historyData.loss.length ? Number(historyData.loss[historyData.loss.length - 1]) : 0;
          const lastAcc = historyData.acc.length ? Number(historyData.acc[historyData.acc.length - 1]) : 0;
          const lastValLoss = historyData.val_loss.length ? Number(historyData.val_loss[historyData.val_loss.length - 1]) : 0;
          const lastValAcc = historyData.val_acc.length ? Number(historyData.val_acc[historyData.val_acc.length - 1]) : 0;

          // Compute evaluation metrics once at end (test set)
          let evalMetrics = null;
          try {
            const cm = await this.getConfusionMatrix(modelId, 'test', 5000);
            const accuracy = Number(cm?.accuracy ?? 0);
            const precision = Number(cm?.precision ?? 0);
            const recall = Number(cm?.recall ?? 0);
            const f1Score = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;
            evalMetrics = {
              accuracy,
              precision,
              recall,
              f1Score,
              confusionMatrix: cm?.matrix || []
            };
          } catch (e) {
            evalMetrics = null;
          }

          if (trainingDocId) {
            await Training.findByIdAndUpdate(trainingDocId, {
              $set: {
                trainingRunId,
                datasetId: datasetId || null,
                status: 'completed',
                progress: 100,
                history: {
                  loss: historyData.loss,
                  accuracy: historyData.acc,
                  valLoss: historyData.val_loss,
                  valAccuracy: historyData.val_acc
                },
                finalMetrics: {
                  loss: lastLoss,
                  accuracy: lastAcc,
                  valLoss: lastValLoss,
                  valAccuracy: lastValAcc
                },
                evaluationMetrics: evalMetrics ? evalMetrics : undefined,
                completedAt: new Date(),
                updatedAt: new Date()
              }
            });
          } else {
            await Training.create({
              userId,
              trainingRunId,
              modelId,
              datasetId: datasetId || null,
              epochs: Number(config.epochs || effectiveEpochs),
              batchSize: Number(config.batchSize || batchSize),
              learningRate: Number(config.learningRate || learningRate),
              validationSplit: Number(config.validationSplit || validationSplit),
              status: 'completed',
              progress: 100,
              history: {
                loss: historyData.loss,
                accuracy: historyData.acc,
                valLoss: historyData.val_loss,
                valAccuracy: historyData.val_acc
              },
              finalMetrics: {
                loss: lastLoss,
                accuracy: lastAcc,
                valLoss: lastValLoss,
                valAccuracy: lastValAcc
              },
              evaluationMetrics: evalMetrics ? evalMetrics : undefined,
              startedAt: this.trainingProgressByModel[modelId]?.startedAt ? new Date(this.trainingProgressByModel[modelId].startedAt) : null,
              completedAt: new Date()
            });
          }
        }
      } catch (e) {
        // If Mongo is unavailable, keep file-based persistence only
      }

      // NOTE: Do not dispose tensors from DataService (owned by DataService)

      // Mark training as complete for this model
      this.trainingByModel[modelId] = false;
      this.isTraining = false;

      this.trainingProgressByModel[modelId] = {
        ...this.trainingProgressByModel[modelId],
        status: 'completed',
        progress: 100,
        completedAt: new Date().toISOString()
      };

      return history;
    } catch (error) {
      // Mark training as complete even on error
      this.trainingByModel[modelId] = false;
      this.isTraining = false;

      this.trainingProgressByModel[modelId] = {
        ...(this.trainingProgressByModel[modelId] || {}),
        status: 'failed',
        error: error?.message || String(error),
        completedAt: new Date().toISOString()
      };

      try {
        if (Training && config?.userId && modelId) {
          await Training.create({
            userId: config.userId,
            trainingRunId: (crypto.randomUUID ? crypto.randomUUID() : `run_${Date.now()}_${Math.random().toString(16).slice(2)}`),
            modelId,
            datasetId: datasetId || DataService?.currentDatasetId || null,
            epochs: Number(config.epochs || 0),
            batchSize: Number(config.batchSize || 0),
            learningRate: Number(config.learningRate || 0),
            validationSplit: Number(config.validationSplit || 0),
            status: 'failed',
            progress: Number(this.trainingProgressByModel[modelId]?.progress || 0),
            error: error?.message || String(error),
            startedAt: this.trainingProgressByModel[modelId]?.startedAt ? new Date(this.trainingProgressByModel[modelId].startedAt) : null,
            completedAt: new Date()
          });
        }
      } catch (e) {
        // ignore DB failures
      }

      console.error('Error during training:', error);
      throw error;
    }
  }

  async getModelComparison(modelIds = [], dataset = 'test', maxSamples = 5000) {
    try {
      const ids = Array.isArray(modelIds) ? modelIds.filter(Boolean) : [];
      if (ids.length === 0) {
        const fromHistory = Array.from(new Set((this.trainingHistory || []).map((h) => h?.modelId).filter(Boolean)));
        if (fromHistory.length === 0) {
          throw new Error('No modelIds provided and no training history available');
        }
        ids.push(...fromHistory);
      }

      const results = [];
      for (const id of ids) {
        let evaluation;
        let cm;
        try {
          evaluation = await this.evaluateModel(id, dataset);
        } catch (e) {
          evaluation = null;
        }
        try {
          cm = await this.getConfusionMatrix(id, dataset, maxSamples);
        } catch (e) {
          cm = null;
        }

        const precision = Number(cm?.precision ?? 0);
        const recall = Number(cm?.recall ?? 0);
        const f1 = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;

        results.push({
          modelId: id,
          accuracy: Number(evaluation?.accuracy ?? cm?.accuracy ?? 0),
          loss: Number(evaluation?.loss ?? 0),
          precision,
          recall,
          f1
        });
      }

      return {
        dataset,
        models: results,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error computing model comparison:', error);
      throw error;
    }
  }

  async getFeatureImportanceFromWeights(modelId = null, topK = 20) {
    try {
      this.assertDatasetCompatibleWithModel(modelId, 'compute feature importance');
      const resolvedModelId = modelId || ModelService.getCurrentModelId?.() || null;
      const model = resolvedModelId
        ? await ModelService.getOrLoadModelById(resolvedModelId)
        : ModelService.getModel();
      if (!model) {
        throw new Error('Model not initialized');
      }

      const datasetType = String(DataService?.stats?.datasetType || 'tabular');
      if (datasetType !== 'tabular') {
        const tensors = datasetType === 'image'
          ? this.requireRealImageTensors('compute feature importance')
          : (datasetType === 'sequence'
            ? this.requireRealSequenceTensors('compute feature importance')
            : this.requireRealTabularTensors('compute feature importance'));

        const x = tensors.xTest;
        const y = tensors.yTest;
        if (!x || !y) {
          throw new Error('Dataset tensors not available for feature importance');
        }

        const xRank = Array.isArray(x.shape) ? x.shape.length : 0;
        const maxSamples = Math.max(10, Math.min(Number(process.env.FEATURE_IMPORTANCE_MAX_SAMPLES || 500) || 500, x.shape?.[0] || 0));
        const n = x.shape?.[0] || 0;
        const useN = Math.max(1, Math.min(maxSamples, n));

        let xEval = x;
        let yEval = y;
        let createdSlice = false;
        if (useN < n) {
          if (xRank === 2) {
            xEval = x.slice([0, 0], [useN, x.shape[1]]);
          } else if (xRank === 3) {
            xEval = x.slice([0, 0, 0], [useN, x.shape[1], x.shape[2]]);
          } else if (xRank === 4) {
            xEval = x.slice([0, 0, 0, 0], [useN, x.shape[1], x.shape[2], x.shape[3]]);
          } else {
            throw new Error(`Unsupported x tensor rank for feature importance: ${xRank}`);
          }
          yEval = y.slice([0, 0], [useN, y.shape[1]]);
          createdSlice = true;
        }

        const computeAccuracy = async (xT, yT) => {
          const preds = model.predict(xT);
          const predIdx = preds.argMax(-1);
          const trueIdx = yT.argMax(-1);
          const eq = predIdx.equal(trueIdx);
          const accT = eq.mean();
          const accArr = await accT.data();
          const acc = Number(accArr?.[0] ?? 0);
          if (preds?.dispose) preds.dispose();
          predIdx.dispose();
          trueIdx.dispose();
          eq.dispose();
          accT.dispose();
          return acc;
        };

        const baselineAcc = await computeAccuracy(xEval, yEval);

        let featureCount = 0;
        if (xRank === 3) {
          featureCount = Number(xEval.shape?.[2] || 0);
        } else if (xRank === 4) {
          featureCount = Number(xEval.shape?.[3] || 0);
        } else if (xRank === 2) {
          featureCount = Number(xEval.shape?.[1] || 0);
        }
        if (!featureCount) {
          throw new Error('Unable to infer feature count for permutation importance');
        }

        const k = Math.max(1, Math.min(Number(topK) || 20, featureCount));

        const importances = [];
        if (xRank === 4) {
          const height = Number(xEval.shape?.[1] || 0);
          const width = Number(xEval.shape?.[2] || 0);
          const grid = Math.max(2, Math.min(12, Number(process.env.FEATURE_IMPORTANCE_IMAGE_GRID || 6)));
          const patchH = Math.max(1, Math.floor(height / grid));
          const patchW = Math.max(1, Math.floor(width / grid));
          const channels = Number(xEval.shape?.[3] || 1);

          for (let gy = 0; gy < grid; gy++) {
            for (let gx = 0; gx < grid; gx++) {
              const y0 = gy * patchH;
              const x0 = gx * patchW;
              const y1 = (gy === grid - 1) ? height : Math.min(height, (gy + 1) * patchH);
              const x1 = (gx === grid - 1) ? width : Math.min(width, (gx + 1) * patchW);
              const hLen = Math.max(1, y1 - y0);
              const wLen = Math.max(1, x1 - x0);

              let xOcc = null;
              try {
                const top = y0 > 0 ? xEval.slice([0, 0, 0, 0], [useN, y0, width, channels]) : null;
                const midTop = xEval.slice([0, y0, 0, 0], [useN, hLen, x0, channels]);
                const midOcc = tf.zeros([useN, hLen, wLen, channels]);
                const midRight = (x0 + wLen < width)
                  ? xEval.slice([0, y0, x0 + wLen, 0], [useN, hLen, width - (x0 + wLen), channels])
                  : null;
                const mid = tf.concat([midTop, midOcc, ...(midRight ? [midRight] : [])], 2);
                const bottom = (y0 + hLen < height)
                  ? xEval.slice([0, y0 + hLen, 0, 0], [useN, height - (y0 + hLen), width, channels])
                  : null;
                xOcc = tf.concat([...(top ? [top] : []), mid, ...(bottom ? [bottom] : [])], 1);

                const occAcc = await computeAccuracy(xOcc, yEval);
                const drop = Math.max(0, baselineAcc - occAcc);
                importances.push({
                  index: gy * grid + gx,
                  name: `Patch (${gx + 1},${gy + 1})`,
                  importance: drop,
                  meta: { x0, y0, x1: x0 + wLen, y1: y0 + hLen }
                });

                if (top) top.dispose();
                if (midTop) midTop.dispose();
                midOcc.dispose();
                if (midRight) midRight.dispose();
                mid.dispose();
                if (bottom) bottom.dispose();
              } finally {
                if (xOcc?.dispose) xOcc.dispose();
              }
            }
          }
        } else {
          for (let f = 0; f < featureCount; f++) {
            let xPerm = null;
            try {
              const xArr = xEval.arraySync();
              if (xRank === 3) {
                const N = xArr.length;
                const T = xArr[0]?.length || 0;
                const vals = [];
                for (let i = 0; i < N; i++) {
                  for (let t = 0; t < T; t++) vals.push(xArr[i][t][f]);
                }
                for (let i = vals.length - 1; i > 0; i--) {
                  const j = Math.floor(Math.random() * (i + 1));
                  const tmp = vals[i];
                  vals[i] = vals[j];
                  vals[j] = tmp;
                }
                let p = 0;
                for (let i = 0; i < N; i++) {
                  for (let t = 0; t < T; t++) {
                    xArr[i][t][f] = vals[p++];
                  }
                }
                xPerm = tf.tensor3d(xArr, xEval.shape, 'float32');
              } else if (xRank === 2) {
                const N = xArr.length;
                const vals = [];
                for (let i = 0; i < N; i++) vals.push(xArr[i][f]);
                for (let i = vals.length - 1; i > 0; i--) {
                  const j = Math.floor(Math.random() * (i + 1));
                  const tmp = vals[i];
                  vals[i] = vals[j];
                  vals[j] = tmp;
                }
                for (let i = 0; i < N; i++) xArr[i][f] = vals[i];
                xPerm = tf.tensor2d(xArr, xEval.shape, 'float32');
              } else {
                throw new Error(`Unsupported x tensor rank for permutation importance: ${xRank}`);
              }

              const permAcc = await computeAccuracy(xPerm, yEval);
              const drop = Math.max(0, baselineAcc - permAcc);
              importances.push({ index: f, name: `Feature ${f + 1}`, importance: drop });
            } finally {
              if (xPerm?.dispose) xPerm.dispose();
            }
          }
        }

        const maxDrop = Math.max(...importances.map((v) => v.importance), 0);
        const normalized = maxDrop > 0
          ? importances.map((v) => ({ ...v, importance: v.importance / maxDrop }))
          : importances.map((v) => ({ ...v, importance: 0 }));

        const features = normalized
          .sort((a, b) => b.importance - a.importance)
          .slice(0, k);

        const topFeature = features.length ? features[0].name : 'N/A';
        const maxImportance = features.length ? features[0].importance : 0;

        if (createdSlice) {
          xEval.dispose();
          yEval.dispose();
        }

        return {
          modelId: modelId || 'current',
          method: 'permutation_accuracy_drop',
          datasetType,
          dataset: 'test',
          samples: useN,
          baselineAccuracy: baselineAcc,
          totalFeatures: featureCount,
          topK: k,
          topFeature,
          maxImportance,
          features,
          timestamp: new Date().toISOString()
        };
      }

      const tabular = DataService.getTabularTrainTensors?.();
      if (!tabular) {
        throw new Error('Tabular tensors not available for feature importance');
      }

      // Find first Dense layer (closest to input features)
      const layers = model.layers || [];
      const denseLayer = layers.find((l) => (l?.getClassName?.() || '').toLowerCase() === 'dense');
      if (!denseLayer) {
        throw new Error('No Dense layer found to compute feature importance');
      }

      const weights = denseLayer.getWeights?.() || [];
      const kernel = weights[0];
      if (!kernel) {
        throw new Error('Dense layer has no kernel weights');
      }

      const kernelArr = await kernel.array(); // shape: [inFeatures, units]
      const inFeatures = kernelArr.length;

      const importance = new Array(inFeatures).fill(0);
      for (let i = 0; i < inFeatures; i++) {
        const row = kernelArr[i] || [];
        let sum = 0;
        for (let j = 0; j < row.length; j++) {
          sum += Math.abs(Number(row[j]) || 0);
        }
        importance[i] = sum;
      }

      const maxImp = Math.max(...importance, 0);
      const normalized = maxImp > 0 ? importance.map((v) => v / maxImp) : importance.map(() => 0);

      const k = Math.max(1, Math.min(Number(topK) || 20, normalized.length));
      const features = normalized
        .map((imp, idx) => ({ index: idx, name: `Feature ${idx + 1}`, importance: imp }))
        .sort((a, b) => b.importance - a.importance)
        .slice(0, k);

      const topFeature = features.length ? features[0].name : 'N/A';
      const maxImportance = features.length ? features[0].importance : 0;

      return {
        modelId: modelId || 'current',
        method: 'dense_weights',
        totalFeatures: normalized.length,
        topK: k,
        topFeature,
        maxImportance,
        features,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error computing feature importance:', error);
      throw error;
    }
  }

  async getRocCurveMicro(modelId = null, dataset = 'test', maxSamples = 5000, steps = 101) {
    try {
      this.assertDatasetCompatibleWithModel(modelId, 'compute ROC curve');
      let model;
      if (modelId) {
        model = await ModelService.getOrLoadModelById(modelId);
      } else {
        model = ModelService.getModel();
      }

      if (!model) {
        throw new Error('Model not initialized');
      }

      const datasetType = String(DataService?.stats?.datasetType || 'tabular');
      const tensors = datasetType === 'image'
        ? this.requireRealImageTensors('compute ROC curve')
        : (datasetType === 'sequence'
          ? this.requireRealSequenceTensors('compute ROC curve')
          : this.requireRealTabularTensors('compute ROC curve'));

      const x = dataset === 'val' ? tensors.xVal : tensors.xTest;
      const y = dataset === 'val' ? tensors.yVal : tensors.yTest;
      if (!x || !y) {
        throw new Error(`Dataset tensors not available for '${dataset}'`);
      }

      const numClasses = y.shape?.[1] || 0;
      if (!numClasses) {
        throw new Error('Unable to infer number of classes from labels tensor');
      }

      const n = x.shape?.[0] || 0;
      const useN = Math.max(1, Math.min(Number(maxSamples) || n, n));

      let xEval = x;
      let yEval = y;
      let createdSlice = false;
      if (useN < n) {
        const xRank = Array.isArray(x.shape) ? x.shape.length : 0;
        const yRank = Array.isArray(y.shape) ? y.shape.length : 0;

        if (xRank === 2) {
          xEval = x.slice([0, 0], [useN, x.shape[1]]);
        } else if (xRank === 3) {
          xEval = x.slice([0, 0, 0], [useN, x.shape[1], x.shape[2]]);
        } else if (xRank === 4) {
          xEval = x.slice([0, 0, 0, 0], [useN, x.shape[1], x.shape[2], x.shape[3]]);
        } else {
          throw new Error(`Unsupported x tensor rank for ROC curve: ${xRank}`);
        }

        if (yRank === 2) {
          yEval = y.slice([0, 0], [useN, y.shape[1]]);
        } else {
          throw new Error(`Unsupported y tensor rank for ROC curve: ${yRank}`);
        }
        createdSlice = true;
      }

      const preds = model.predict(xEval);
      const probs = await preds.array();
      const yTrueOneHot = await yEval.array();

      // micro-average: flatten all classes into binary labels
      const trueLabels = [];
      const scores = [];
      for (let i = 0; i < yTrueOneHot.length; i++) {
        for (let c = 0; c < numClasses; c++) {
          trueLabels.push(yTrueOneHot[i][c] ? 1 : 0);
          scores.push(probs[i][c]);
        }
      }

      const stepCount = Math.max(2, Math.min(Number(steps) || 101, 1001));
      const thresholds = Array.from({ length: stepCount }, (_, i) => i / (stepCount - 1));
      const rocPoints = [];

      for (const threshold of thresholds) {
        let tp = 0;
        let fp = 0;
        let tn = 0;
        let fn = 0;
        for (let i = 0; i < trueLabels.length; i++) {
          const predPos = scores[i] >= threshold ? 1 : 0;
          const actual = trueLabels[i];
          if (predPos === 1 && actual === 1) tp++;
          else if (predPos === 1 && actual === 0) fp++;
          else if (predPos === 0 && actual === 0) tn++;
          else fn++;
        }

        const tpr = (tp + fn) > 0 ? tp / (tp + fn) : 0;
        const fpr = (fp + tn) > 0 ? fp / (fp + tn) : 0;
        rocPoints.push([fpr, tpr]);
      }

      // AUC via trapezoidal rule after sorting by FPR
      rocPoints.sort((a, b) => a[0] - b[0]);
      let auc = 0;
      for (let i = 0; i < rocPoints.length - 1; i++) {
        const x1 = rocPoints[i][0];
        const x2 = rocPoints[i + 1][0];
        const y1 = rocPoints[i][1];
        const y2 = rocPoints[i + 1][1];
        auc += (x2 - x1) * (y1 + y2) / 2;
      }

      if (preds?.dispose) preds.dispose();
      if (createdSlice) {
        xEval.dispose();
        yEval.dispose();
      }

      return {
        modelId: modelId || 'current',
        dataset,
        type: 'micro',
        samples: useN,
        numClasses,
        auc,
        points: rocPoints,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error computing ROC curve:', error);
      throw error;
    }
  }

  async getTrainingHistory() {
    return this.trainingHistory;
  }

  isModelTraining(modelId) {
    return this.trainingByModel[modelId] || false;
  }

  async evaluateModel(modelId = null, dataset = 'test') {
    try {
      this.assertDatasetCompatibleWithModel(modelId, 'evaluate');
      const datasetType = String(DataService?.stats?.datasetType || 'tabular');
      const tensors = datasetType === 'image'
        ? this.requireRealImageTensors('evaluate')
        : (datasetType === 'sequence'
          ? this.requireRealSequenceTensors('evaluate')
          : this.requireRealTabularTensors('evaluate'));
      const xEval = dataset === 'val' ? tensors.xVal : tensors.xTest;
      const yEval = dataset === 'val' ? tensors.yVal : tensors.yTest;
      if (!xEval || !yEval) {
        throw new Error(`Dataset tensors not available for '${dataset}'. Load a real dataset first.`);
      }

      let model;
      if (modelId) {
        model = await ModelService.getOrLoadModelById(modelId);
      } else {
        model = ModelService.getModel();
      }

      if (!model) {
        throw new Error('Model not initialized');
      }

      const evaluation = await model.evaluate(xEval, yEval);
      const [loss, accuracy] = await Promise.all([
        evaluation[0].data(),
        evaluation[1].data()
      ]);

      const result = {
        dataset,
        loss: loss[0],
        accuracy: accuracy[0],
        timestamp: new Date().toISOString()
      };

      this.metrics[dataset] = result;

      // Clean up
      evaluation[0].dispose();
      evaluation[1].dispose();

      return result;
    } catch (error) {
      console.error('Error evaluating model:', error);
      throw error;
    }
  }

  async getConfusionMatrix(modelId = null, dataset = 'test', maxSamples = 5000) {
    try {
      this.assertDatasetCompatibleWithModel(modelId, 'compute confusion matrix');
      const datasetType = String(DataService?.stats?.datasetType || 'tabular');
      const tensors = datasetType === 'image'
        ? this.requireRealImageTensors('compute confusion matrix')
        : (datasetType === 'sequence'
          ? this.requireRealSequenceTensors('compute confusion matrix')
          : this.requireRealTabularTensors('compute confusion matrix'));
      const x = dataset === 'val' ? tensors.xVal : tensors.xTest;
      const y = dataset === 'val' ? tensors.yVal : tensors.yTest;
      if (!x || !y) {
        throw new Error(`Dataset tensors not available for '${dataset}'`);
      }

      let model;
      if (modelId) {
        model = await ModelService.getOrLoadModelById(modelId);
      } else {
        model = ModelService.getModel();
      }

      if (!model) {
        throw new Error('Model not initialized');
      }

      const numClasses = y.shape?.[1] || 0;
      if (!numClasses) {
        throw new Error('Unable to infer number of classes from labels tensor');
      }

      const n = x.shape?.[0] || 0;
      const useN = Math.max(1, Math.min(Number(maxSamples) || n, n));

      let xEval = x;
      let yEval = y;
      let createdSlice = false;

      if (useN < n) {
        const xRank = Array.isArray(x.shape) ? x.shape.length : 0;
        const yRank = Array.isArray(y.shape) ? y.shape.length : 0;

        if (xRank === 2) {
          xEval = x.slice([0, 0], [useN, x.shape[1]]);
        } else if (xRank === 3) {
          xEval = x.slice([0, 0, 0], [useN, x.shape[1], x.shape[2]]);
        } else if (xRank === 4) {
          xEval = x.slice([0, 0, 0, 0], [useN, x.shape[1], x.shape[2], x.shape[3]]);
        } else {
          throw new Error(`Unsupported x tensor rank for confusion matrix: ${xRank}`);
        }

        if (yRank === 2) {
          yEval = y.slice([0, 0], [useN, y.shape[1]]);
        } else {
          throw new Error(`Unsupported y tensor rank for confusion matrix: ${yRank}`);
        }
        createdSlice = true;
      }

      const preds = model.predict(xEval);
      const yPredTensor = preds.argMax(-1);
      const yTrueTensor = yEval.argMax(-1);

      const [yPred, yTrue] = await Promise.all([yPredTensor.data(), yTrueTensor.data()]);

      const matrix = Array.from({ length: numClasses }, () => Array(numClasses).fill(0));
      let correct = 0;
      for (let i = 0; i < yTrue.length; i++) {
        const t = yTrue[i];
        const p = yPred[i];
        if (t === p) correct++;
        if (t >= 0 && t < numClasses && p >= 0 && p < numClasses) {
          matrix[t][p] += 1;
        }
      }

      const accuracy = yTrue.length ? correct / yTrue.length : 0;

      // Macro precision/recall
      let totalPrecision = 0;
      let totalRecall = 0;
      for (let c = 0; c < numClasses; c++) {
        const tp = matrix[c][c];
        let fp = 0;
        let fn = 0;
        for (let r = 0; r < numClasses; r++) {
          if (r !== c) fp += matrix[r][c];
        }
        for (let k = 0; k < numClasses; k++) {
          if (k !== c) fn += matrix[c][k];
        }

        const prec = (tp + fp) > 0 ? tp / (tp + fp) : 0;
        const rec = (tp + fn) > 0 ? tp / (tp + fn) : 0;
        totalPrecision += prec;
        totalRecall += rec;
      }

      const precision = numClasses ? totalPrecision / numClasses : 0;
      const recall = numClasses ? totalRecall / numClasses : 0;

      // Clean up
      yPredTensor.dispose();
      yTrueTensor.dispose();
      if (preds?.dispose) preds.dispose();
      if (createdSlice) {
        xEval.dispose();
        yEval.dispose();
      }

      return {
        modelId: modelId || 'current',
        dataset,
        numClasses,
        samples: yTrue.length,
        matrix,
        accuracy,
        precision,
        recall,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error computing confusion matrix:', error);
      throw error;
    }
  }

  async predict(inputData, modelId = null) {
    try {
      this.assertDatasetCompatibleWithModel(modelId, 'predict');
      if (!inputData) {
        throw new Error('Input data is required');
      }

      let model;
      if (modelId) {
        model = await ModelService.getOrLoadModelById(modelId);
      } else {
        model = ModelService.getModel();
      }

      if (!model) {
        throw new Error('Model not initialized');
      }

      const datasetType = DataService?.stats?.datasetType || 'tabular';
      let input;
      if (datasetType === 'tabular') {
        const features = Number(DataService?.stats?.features ?? 0);
        if (!features || !Number.isFinite(features)) {
          throw new Error('Cannot predict: invalid feature count for tabular dataset');
        }
        const row = Array.isArray(inputData) ? inputData : [inputData];
        if (!Array.isArray(row) || row.length !== features) {
          throw new Error(`Cannot predict: inputData must be an array of length ${features} for tabular dataset`);
        }
        input = tf.tensor2d([row], [1, features]);
      } else {
        input = tf.tensor4d(inputData, [1, 64, 64, 1]);
      }
      const prediction = model.predict(input);
      const predictionData = await prediction.data();

      const result = {
        predictions: Array.from(predictionData),
        predictedClass: Array.from(predictionData).indexOf(Math.max(...Array.from(predictionData))),
        confidence: Math.max(...Array.from(predictionData)),
        timestamp: new Date().toISOString()
      };

      // Clean up
      input.dispose();
      prediction.dispose();

      return result;
    } catch (error) {
      console.error('Error during prediction:', error);
      throw error;
    }
  }

  async getMetrics() {
    return {
      metrics: this.metrics,
      isTraining: this.isTraining,
      trainingHistoryCount: this.trainingHistory.length,
      timestamp: new Date().toISOString()
    };
  }

  isModelTraining(modelId = null) {
    if (modelId) {
      return this.trainingByModel[modelId] || false;
    }
    return this.isTraining;
  }
}

module.exports = new TrainingService();
