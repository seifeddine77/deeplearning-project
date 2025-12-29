const express = require('express');
const router = express.Router();
const kaggleService = require('../services/kaggleService');

// @route   GET /api/kaggle/datasets
// @desc    Lister les datasets disponibles
// @access  Public
router.get('/datasets', async (req, res) => {
  try {
    const datasets = await kaggleService.listDatasets();
    res.json(datasets);
  } catch (error) {
    console.error('❌ Error listing datasets:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/kaggle/popular
// @desc    Obtenir les datasets populaires
// @access  Public
router.get('/popular', (req, res) => {
  try {
    const datasets = kaggleService.getPopularDatasets();
    res.json({
      success: true,
      datasets: datasets
    });
  } catch (error) {
    console.error('❌ Error getting popular datasets:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   POST /api/kaggle/download
// @desc    Télécharger un dataset depuis Kaggle
// @access  Private
router.post('/download', async (req, res) => {
  try {
    const { datasetName } = req.body;
    const kaggleUsername = String(req.body?.kaggleUsername || process.env.KAGGLE_USERNAME || '').trim();
    const kaggleKey = String(req.body?.kaggleKey || process.env.KAGGLE_KEY || '').trim();

    if (!datasetName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: datasetName'
      });
    }

    if (String(datasetName).trim() && !String(datasetName).includes('/')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid datasetName. Expected Kaggle slug format: owner/dataset (example: zalando-research/fashionmnist)'
      });
    }

    if (!kaggleUsername || !kaggleKey) {
      return res.status(400).json({
        success: false,
        message: 'Kaggle credentials missing. Set KAGGLE_USERNAME and KAGGLE_KEY in server .env (recommended) or pass them in request body.'
      });
    }

    const result = await kaggleService.downloadDataset(datasetName, kaggleUsername, kaggleKey);
    res.json(result);
  } catch (error) {
    console.error('❌ Error downloading dataset:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/kaggle/dataset/:name
// @desc    Obtenir les informations d'un dataset
// @access  Public
router.get('/dataset/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const info = await kaggleService.getDatasetInfo(name);
    res.json(info);
  } catch (error) {
    console.error('❌ Error getting dataset info:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   DELETE /api/kaggle/dataset/:name
// @desc    Supprimer un dataset
// @access  Private
router.delete('/dataset/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const result = await kaggleService.deleteDataset(name);
    res.json(result);
  } catch (error) {
    console.error('❌ Error deleting dataset:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
