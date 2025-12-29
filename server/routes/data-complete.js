const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const DataService = require('../services/dataService');
const logger = require('../config/logger');
const Dataset = require('../models/Dataset');
const { authMiddleware } = require('../middleware/auth');

// Helper function to analyze file and get statistics
async function analyzeFile(filePath, originalname) {
  try {
    const ext = path.extname(originalname).toLowerCase();
    let stats = { totalSamples: 0, features: 0, classes: 10 };

    if (ext === '.csv') {
      // Analyze CSV file
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.trim().split('\n');
      const totalSamples = lines.length - 1; // Exclude header
      const headerLine = lines[0];
      const features = headerLine.split(',').length - 1; // Exclude label column
      
      stats = {
        totalSamples: Math.max(totalSamples, 0),
        features: Math.max(features, 0),
        classes: 10
      };
      logger.info('CSV analyzed', { totalSamples: stats.totalSamples, features: stats.features });
    } 
    else if (ext === '.json') {
      // Analyze JSON file
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);
      const dataArray = Array.isArray(data) ? data : data.data || [];
      const totalSamples = dataArray.length;
      const features = dataArray.length > 0 ? Object.keys(dataArray[0]).length - 1 : 0; // Exclude label
      
      stats = {
        totalSamples: totalSamples,
        features: features,
        classes: 10
      };
      logger.info('JSON analyzed', { totalSamples: stats.totalSamples, features: stats.features });
    }
    else if (['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'].includes(ext)) {
      // Single image upload
      stats = {
        totalSamples: 1,
        features: 0,
        classes: 0
      };
      logger.info('Image analyzed (single file)', { ext, totalSamples: stats.totalSamples });
    } else {
      // Default for other/unknown formats: treat as one sample
      stats = {
        totalSamples: 1,
        features: 0,
        classes: 0
      };
      logger.info('Using default stats for format', { ext, totalSamples: stats.totalSamples });
    }

    return stats;
  } catch (error) {
    logger.error('Error analyzing file', { error: error.message });
    // Return safe defaults on error
    return { totalSamples: 1, features: 0, classes: 0 };
  }
}

// Multer configuration
const uploadMaxMb = Number(process.env.UPLOAD_MAX_MB || 500);
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: Math.max(1, uploadMaxMb) * 1024 * 1024 } // 500MB limit
});

async function safeUnlink(filePath) {
  try {
    if (!filePath) return;
    if (fsSync.existsSync(filePath)) {
      await fs.unlink(filePath);
    }
  } catch (e) {
    // ignore
  }
}

// @route   POST /api/data/upload
// @desc    Upload dataset
// @access  Private
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const userId = req.user?.userId;
    if (!userId) {
      await safeUnlink(req.file?.path);
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const normalizedUserId = mongoose.Types.ObjectId.isValid(String(userId))
      ? new mongoose.Types.ObjectId(String(userId))
      : userId;

    const rawDatasetType = (req.body && req.body.datasetType) ? String(req.body.datasetType) : 'tabular';
    const extWithDot = path.extname(req.file.originalname).toLowerCase();
    const hasSequenceParams = req.body?.timesteps != null || req.body?.stride != null;
    const wantsSequence = rawDatasetType === 'sequence' || rawDatasetType === 'text';
    const datasetType = (extWithDot === '.csv' && (hasSequenceParams || wantsSequence)) ? 'sequence' : rawDatasetType;

    // Analyze the uploaded file to get real statistics
    const fileStats = await analyzeFile(req.file.path, req.file.originalname);
    fileStats.datasetType = datasetType;

    // Process the dataset and (for tabular CSV) load real tensors
    let finalStats;
    if (datasetType === 'tabular' && extWithDot === '.csv') {
      logger.info('Upload pipeline selected: loadTabularCsv', { datasetType, ext: extWithDot });
      finalStats = await DataService.loadTabularCsv(req.file.path);
    } else if (datasetType === 'sequence' && extWithDot === '.csv') {
      logger.info('Upload pipeline selected: loadSequenceCsv', {
        datasetType,
        ext: extWithDot,
        timesteps: Number(req.body?.timesteps || 50),
        stride: Number(req.body?.stride || Number(req.body?.timesteps || 50))
      });
      finalStats = await DataService.loadSequenceCsv(req.file.path, {
        timesteps: Number(req.body?.timesteps || 50),
        stride: Number(req.body?.stride || Number(req.body?.timesteps || 50))
      });
    } else if (datasetType === 'image' && extWithDot === '.zip') {
      logger.info('Upload pipeline selected: loadImageZip', { datasetType, ext: extWithDot });
      finalStats = await DataService.loadImageZip(req.file.path, { imageSize: 64, channels: 3 });
    } else {
      logger.info('Upload pipeline selected: processDataset', { datasetType, ext: extWithDot });
      finalStats = await DataService.processDataset(req.file.path, fileStats);
    }

    const fileInfo = {
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadedAt: new Date().toISOString()
    };

    // Save dataset metadata to MongoDB
    let savedDataset = null;
    try {
      const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');
      const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'];
      const fileType = (ext === 'csv' || ext === 'json') ? ext : (imageExts.includes(ext) ? 'image' : 'other');
      const fp = finalStats?.fingerprint ? finalStats.fingerprint : null;
      const fpHash = finalStats?.fingerprintHash ? String(finalStats.fingerprintHash) : '';
      const labelFormat = finalStats?.labelFormat ? String(finalStats.labelFormat) : 'unknown';
      const inputShape = Array.isArray(finalStats?.inputShape) ? finalStats.inputShape : [];
      const datasetDoc = {
        userId: normalizedUserId,
        name: req.file.originalname,
        description: `Uploaded on ${new Date().toISOString()}`,
        filePath: req.file.path,
        fileSize: req.file.size,
        fileType: fileType,
        datasetType: datasetType,
        labelFormat,
        inputShape,
        totalSamples: finalStats.totalSamples,
        features: finalStats.features,
        classes: finalStats.classes,
        fingerprint: fp,
        fingerprintHash: fpHash,
        status: 'ready'
      };

      let saved;
      try {
        saved = await Dataset.findOneAndUpdate(
          { userId: normalizedUserId, name: datasetDoc.name },
          { $set: datasetDoc },
          { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
        );
      } catch (e) {
        const code = e?.code;
        const kp = e?.keyPattern;
        const isDupName = code === 11000 && kp && (kp.name === 1 || kp.name === true);
        if (!isDupName) throw e;

        const uniqueName = `${datasetDoc.name}_${Date.now()}`;
        const retryDoc = { ...datasetDoc, name: uniqueName };
        saved = await Dataset.findOneAndUpdate(
          { userId: normalizedUserId, name: uniqueName },
          { $set: retryDoc },
          { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
        );
      }

      savedDataset = saved;
      DataService.currentDatasetId = saved?._id ? String(saved._id) : null;

      logger.info('Dataset saved to MongoDB', { datasetId: saved?._id, upsert: true });
    } catch (dbError) {
      try {
        console.warn('Could not save dataset to MongoDB (raw):', dbError);
      } catch (e) {
        // ignore
      }
      logger.warn('Could not save dataset to MongoDB', {
        error: dbError.message,
        code: dbError.code,
        name: dbError.name,
        keyValue: dbError.keyValue,
        errors: dbError.errors ? Object.keys(dbError.errors) : undefined,
        stack: dbError.stack
      });
      // Continue even if MongoDB save fails
    }

    logger.info('Dataset uploaded', { 
      filename: req.file.originalname,
      totalSamples: finalStats.totalSamples,
      features: finalStats.features
    });

    // Calculate default split
    const trainSize = Math.floor(finalStats.totalSamples * 0.7);
    const testSize = Math.floor(finalStats.totalSamples * 0.2);
    const validationSize = finalStats.totalSamples - trainSize - testSize;

    res.json({
      success: true,
      message: 'Dataset uploaded successfully',
      file: fileInfo,
      datasetId: savedDataset?._id ? String(savedDataset._id) : null,
      stats: {
        datasetType: datasetType,
        totalSamples: finalStats.totalSamples,
        features: finalStats.features,
        classes: finalStats.classes,
        labelFormat: finalStats.labelFormat || 'unknown',
        inputShape: Array.isArray(finalStats.inputShape) ? finalStats.inputShape : [],
        fingerprint: finalStats.fingerprint || null,
        fingerprintHash: finalStats.fingerprintHash || '',
        trainSize: trainSize,
        trainPercentage: 70,
        testSize: testSize,
        testPercentage: 20,
        validationSize: validationSize,
        validationPercentage: 10
      }
    });
  } catch (error) {
    logger.error('Error uploading dataset', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error uploading dataset',
      error: error.message
    });
  }
});

// @route   POST /api/data/preprocess
// @desc    Preprocess data
// @access  Private
router.post('/preprocess', authMiddleware, async (req, res) => {
  try {
    const { normalization = 'minmax' } = req.body;

    const result = await DataService.preprocessData(normalization);

    logger.info('Data preprocessed', { normalization });

    res.json({
      success: true,
      message: 'Data preprocessed successfully',
      preprocessing: {
        method: normalization,
        status: 'completed',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error preprocessing data', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error preprocessing data',
      error: error.message
    });
  }
});

// @route   POST /api/data/augment
// @desc    Augment data
// @access  Private
router.post('/augment', authMiddleware, async (req, res) => {
  try {
    const { augmentationType = 'rotation', params = {} } = req.body;

    const result = await DataService.augmentData(augmentationType, params);

    logger.info('Data augmented', { augmentationType });

    const originalSamples = result.originalSamples || 60000;
    const augmentedSamples = result.augmentedSamples || 2000;
    const totalAfterAugmentation = originalSamples + augmentedSamples;

    res.json({
      success: true,
      message: 'Data augmented successfully',
      augmentedSamples: augmentedSamples,
      augmentation: {
        type: augmentationType,
        originalSamples: originalSamples,
        augmentedSamples: augmentedSamples,
        totalAfterAugmentation: totalAfterAugmentation,
        status: 'completed',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error augmenting data', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error augmenting data',
      error: error.message
    });
  }
});

// @route   POST /api/data/split
// @desc    Split data into train/test/validation
// @access  Private
router.post('/split', authMiddleware, async (req, res) => {
  try {
    const { trainRatio = 0.7, testRatio = 0.2, valRatio = 0.1 } = req.body;

    // Valider les ratios
    const total = trainRatio + testRatio + valRatio;
    if (Math.abs(total - 1.0) > 0.01) {
      return res.status(400).json({
        success: false,
        message: 'Ratios must sum to 1.0'
      });
    }

    const result = await DataService.splitData(trainRatio, testRatio, valRatio);

    logger.info('Data split', { trainRatio, testRatio, valRatio, trainSize: result.trainSize, testSize: result.testSize, valSize: result.valSize });

    res.json({
      success: true,
      message: 'Data split successfully',
      split: {
        trainRatio: trainRatio,
        testRatio: testRatio,
        valRatio: valRatio,
        trainSize: result.trainSize,
        testSize: result.testSize,
        valSize: result.valSize,
        totalSamples: result.totalSamples,
        status: 'completed',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error splitting data', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error splitting data',
      error: error.message
    });
  }
});

// @route   GET /api/data/stats
// @desc    Get data statistics
// @access  Private
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const stats = await DataService.getDataStats();

    logger.info('Data statistics retrieved');

    res.json({
      success: true,
      message: 'Data statistics retrieved',
      stats: {
        totalSamples: stats.totalSamples || 0,
        features: stats.features || 0,
        classes: stats.classes || 0,
        datasetType: stats.datasetType || 'tabular',
        labelFormat: stats.labelFormat || 'unknown',
        inputShape: Array.isArray(stats.inputShape) ? stats.inputShape : [],
        fingerprint: stats.fingerprint || null,
        fingerprintHash: stats.fingerprintHash || '',
        datasetId: DataService.currentDatasetId || null,
        trainSize: stats.trainSize || 0,
        testSize: stats.testSize || 0,
        valSize: stats.valSize || 0,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error getting data stats', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error getting data stats',
      error: error.message
    });
  }
});

// @route   GET /api/data/datasets
// @desc    Get all saved datasets from MongoDB
// @access  Private
router.get('/datasets', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const datasets = await Dataset.find({ userId }).sort({ createdAt: -1 });

    logger.info('Datasets retrieved', { count: datasets.length });

    res.json({
      success: true,
      message: 'Datasets retrieved successfully',
      datasets: datasets.map(ds => ({
        _id: ds._id,
        name: ds.name,
        description: ds.description,
        fileSize: ds.fileSize,
        fileType: ds.fileType,
        datasetType: ds.datasetType,
        labelFormat: ds.labelFormat,
        inputShape: ds.inputShape,
        fingerprintHash: ds.fingerprintHash,
        totalSamples: ds.totalSamples,
        features: ds.features,
        classes: ds.classes,
        status: ds.status,
        createdAt: ds.createdAt,
        updatedAt: ds.updatedAt
      }))
    });
  } catch (error) {
    logger.error('Error retrieving datasets', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error retrieving datasets',
      error: error.message
    });
  }
});

// @route   PUT /api/data/datasets/:id
// @desc    Update dataset metadata (rename/description)
// @access  Private
router.put('/datasets/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const id = String(req.params?.id || '').trim();
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (!id) return res.status(400).json({ success: false, message: 'Dataset id is required' });

    const name = String(req.body?.name || '').trim();
    const description = String(req.body?.description || '').trim();
    if (!name) return res.status(400).json({ success: false, message: 'name is required' });

    const updated = await Dataset.findOneAndUpdate(
      { _id: id, userId },
      { $set: { name, ...(description != null ? { description } : {}) } },
      { new: true }
    ).lean();

    if (!updated) return res.status(404).json({ success: false, message: 'Dataset not found' });

    return res.json({ success: true, message: 'Dataset updated', dataset: updated });
  } catch (error) {
    logger.error('Error updating dataset', { error: error.message });
    return res.status(500).json({ success: false, message: 'Error updating dataset', error: error.message });
  }
});

// @route   GET /api/data/datasets/:id/download
// @desc    Download dataset file
// @access  Private
router.get('/datasets/:id/download', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const id = String(req.params?.id || '').trim();
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (!id) return res.status(400).json({ success: false, message: 'Dataset id is required' });

    const ds = await Dataset.findOne({ _id: id, userId }).lean();
    if (!ds) return res.status(404).json({ success: false, message: 'Dataset not found' });

    const filePath = ds.filePath;
    if (!filePath || !fsSync.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Dataset file not found on server' });
    }

    const downloadName = ds.name || path.basename(filePath);
    return res.download(filePath, downloadName);
  } catch (error) {
    logger.error('Error downloading dataset', { error: error.message });
    return res.status(500).json({ success: false, message: 'Error downloading dataset', error: error.message });
  }
});

// @route   PUT /api/data/datasets/:id/replace
// @desc    Replace dataset file (re-upload) while keeping same dataset record
// @access  Private
router.put('/datasets/:id/replace', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const userId = req.user?.userId;
    const id = String(req.params?.id || '').trim();
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (!id) return res.status(400).json({ success: false, message: 'Dataset id is required' });
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const existing = await Dataset.findOne({ _id: id, userId });
    if (!existing) {
      await safeUnlink(req.file.path);
      return res.status(404).json({ success: false, message: 'Dataset not found' });
    }

    const datasetType = (req.body && req.body.datasetType) ? String(req.body.datasetType) : (existing.datasetType || 'tabular');

    // Analyze + process
    const fileStats = await analyzeFile(req.file.path, req.file.originalname);
    fileStats.datasetType = datasetType;

    const extWithDot = path.extname(req.file.originalname).toLowerCase();
    let finalStats;
    if (datasetType === 'tabular' && extWithDot === '.csv') {
      finalStats = await DataService.loadTabularCsv(req.file.path);
    } else if (datasetType === 'sequence' && extWithDot === '.csv') {
      finalStats = await DataService.loadSequenceCsv(req.file.path, {
        timesteps: Number(req.body?.timesteps || 50),
        stride: Number(req.body?.stride || Number(req.body?.timesteps || 50))
      });
    } else if (datasetType === 'image' && extWithDot === '.zip') {
      finalStats = await DataService.loadImageZip(req.file.path, { imageSize: 64, channels: 3 });
    } else {
      finalStats = await DataService.processDataset(req.file.path, fileStats);
    }

    const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');
    const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'];
    const fileType = (ext === 'csv' || ext === 'json') ? ext : (imageExts.includes(ext) ? 'image' : 'other');
    const fp = finalStats?.fingerprint ? finalStats.fingerprint : null;
    const fpHash = finalStats?.fingerprintHash ? String(finalStats.fingerprintHash) : '';
    const labelFormat = finalStats?.labelFormat ? String(finalStats.labelFormat) : 'unknown';
    const inputShape = Array.isArray(finalStats?.inputShape) ? finalStats.inputShape : [];

    const oldFilePath = existing.filePath;

    existing.filePath = req.file.path;
    existing.fileSize = req.file.size;
    existing.fileType = fileType;
    existing.datasetType = datasetType;
    existing.labelFormat = labelFormat;
    existing.inputShape = inputShape;
    existing.totalSamples = finalStats.totalSamples;
    existing.features = finalStats.features;
    existing.classes = finalStats.classes;
    existing.fingerprint = fp;
    existing.fingerprintHash = fpHash;
    existing.status = 'ready';
    await existing.save();

    DataService.currentDatasetId = String(existing._id);

    // Remove old file best-effort
    if (oldFilePath && oldFilePath !== existing.filePath) {
      await safeUnlink(oldFilePath);
    }

    return res.json({
      success: true,
      message: 'Dataset replaced successfully',
      datasetId: String(existing._id),
      stats: {
        datasetType: datasetType,
        totalSamples: finalStats.totalSamples,
        features: finalStats.features,
        classes: finalStats.classes,
        labelFormat: finalStats.labelFormat || 'unknown',
        inputShape: Array.isArray(finalStats.inputShape) ? finalStats.inputShape : [],
        fingerprint: finalStats.fingerprint || null,
        fingerprintHash: finalStats.fingerprintHash || ''
      }
    });
  } catch (error) {
    logger.error('Error replacing dataset', { error: error.message });
    return res.status(500).json({ success: false, message: 'Error replacing dataset', error: error.message });
  }
});

// @route   DELETE /api/data/datasets/:id
// @desc    Delete dataset (db + file)
// @access  Private
router.delete('/datasets/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const id = String(req.params?.id || '').trim();
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (!id) return res.status(400).json({ success: false, message: 'Dataset id is required' });

    const deleted = await Dataset.findOneAndDelete({ _id: id, userId }).lean();
    if (!deleted) return res.status(404).json({ success: false, message: 'Dataset not found' });

    await safeUnlink(deleted.filePath);

    if (DataService.currentDatasetId && String(DataService.currentDatasetId) === String(id)) {
      DataService.currentDatasetId = null;
    }

    return res.json({ success: true, message: 'Dataset deleted', deleted });
  } catch (error) {
    logger.error('Error deleting dataset', { error: error.message });
    return res.status(500).json({ success: false, message: 'Error deleting dataset', error: error.message });
  }
});

// @route   POST /api/data/reset
// @desc    Reset all data
// @access  Private
router.post('/reset', authMiddleware, async (req, res) => {
  try {
    const result = await DataService.resetData();

    logger.info('Data reset');

    res.json({
      success: true,
      message: 'All data reset successfully',
      result
    });
  } catch (error) {
    logger.error('Error resetting data', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error resetting data',
      error: error.message
    });
  }
});

module.exports = router;
