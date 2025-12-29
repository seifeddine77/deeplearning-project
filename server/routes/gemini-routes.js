const express = require('express');
const router = express.Router();
const geminiService = require('../services/geminiService');

// @route   GET /api/gemini/status
// @desc    Vérifier le statut de l'API Gemini
// @access  Public
router.get('/status', (req, res) => {
  try {
    const status = geminiService.getStatus();
    res.json({
      success: true,
      status: status
    });
  } catch (error) {
    console.error('❌ Error getting Gemini status:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   POST /api/gemini/analyze-dataset
// @desc    Analyser un dataset avec Gemini
// @access  Private
router.post('/analyze-dataset', async (req, res) => {
  try {
    const { datasetInfo } = req.body;

    if (!datasetInfo) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: datasetInfo'
      });
    }

    const result = await geminiService.analyzeDataset(datasetInfo);
    res.json(result);
  } catch (error) {
    console.error('❌ Error analyzing dataset:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   POST /api/gemini/training-strategy
// @desc    Générer une stratégie d'entraînement
// @access  Private
router.post('/training-strategy', async (req, res) => {
  try {
    const { modelInfo, datasetInfo } = req.body;

    if (!modelInfo || !datasetInfo) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: modelInfo, datasetInfo'
      });
    }

    const result = await geminiService.generateTrainingStrategy(modelInfo, datasetInfo);
    res.json(result);
  } catch (error) {
    console.error('❌ Error generating training strategy:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   POST /api/gemini/analyze-results
// @desc    Analyser les résultats d'entraînement
// @access  Private
router.post('/analyze-results', async (req, res) => {
  try {
    const { trainingResults } = req.body;

    if (!trainingResults) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: trainingResults'
      });
    }

    const result = await geminiService.analyzeTrainingResults(trainingResults);
    res.json(result);
  } catch (error) {
    console.error('❌ Error analyzing training results:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   POST /api/gemini/generate-report
// @desc    Générer un rapport complet
// @access  Private
router.post('/generate-report', async (req, res) => {
  try {
    const { projectInfo } = req.body;

    if (!projectInfo) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: projectInfo'
      });
    }

    const result = await geminiService.generateReport(projectInfo);
    res.json(result);
  } catch (error) {
    console.error('❌ Error generating report:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
