const express = require('express');
const router = express.Router();
const mlopsService = require('../services/mlopsService');

// @route   POST /api/mlops/pipeline/create
// @desc    Créer un nouveau pipeline MLops
// @access  Private
router.post('/pipeline/create', async (req, res) => {
  try {
    const { name, description, config } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: name'
      });
    }

    const pipelineConfig = {
      name,
      description: description || '',
      config: config || {}
    };

    const result = await mlopsService.createPipeline(pipelineConfig);
    res.json(result);
  } catch (error) {
    console.error('❌ Error creating pipeline:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   POST /api/mlops/pipeline/:id/execute
// @desc    Exécuter un pipeline complet
// @access  Private
router.post('/pipeline/:id/execute', async (req, res) => {
  try {
    const { id } = req.params;
    const pipelineConfig = req.body;

    if (!pipelineConfig.dataset) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: dataset'
      });
    }

    const result = await mlopsService.executePipeline(id, pipelineConfig);
    res.json(result);
  } catch (error) {
    console.error('❌ Error executing pipeline:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/mlops/pipeline/:id/results
// @desc    Obtenir les résultats d'un pipeline
// @access  Public
router.get('/pipeline/:id/results', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await mlopsService.getPipelineResults(id);
    res.json(result);
  } catch (error) {
    console.error('❌ Error getting pipeline results:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/mlops/pipelines
// @desc    Lister tous les pipelines
// @access  Public
router.get('/pipelines', async (req, res) => {
  try {
    const result = await mlopsService.listPipelines();
    res.json(result);
  } catch (error) {
    console.error('❌ Error listing pipelines:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   POST /api/mlops/pipeline/:id/collection
// @desc    Exécuter l'étape Collection
// @access  Private
router.post('/pipeline/:id/collection', async (req, res) => {
  try {
    const { id } = req.params;
    const { datasetInfo } = req.body;

    const result = await mlopsService.collection(id, datasetInfo);
    res.json(result);
  } catch (error) {
    console.error('❌ Error in collection stage:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   POST /api/mlops/pipeline/:id/preprocessing
// @desc    Exécuter l'étape Preprocessing
// @access  Private
router.post('/pipeline/:id/preprocessing', async (req, res) => {
  try {
    const { id } = req.params;
    const preprocessConfig = req.body;

    const result = await mlopsService.preprocessing(id, preprocessConfig);
    res.json(result);
  } catch (error) {
    console.error('❌ Error in preprocessing stage:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   POST /api/mlops/pipeline/:id/training
// @desc    Exécuter l'étape Training
// @access  Private
router.post('/pipeline/:id/training', async (req, res) => {
  try {
    const { id } = req.params;
    const trainingConfig = req.body;

    const result = await mlopsService.training(id, trainingConfig);
    res.json(result);
  } catch (error) {
    console.error('❌ Error in training stage:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   POST /api/mlops/pipeline/:id/evaluation
// @desc    Exécuter l'étape Evaluation
// @access  Private
router.post('/pipeline/:id/evaluation', async (req, res) => {
  try {
    const { id } = req.params;
    const evaluationConfig = req.body;

    const result = await mlopsService.evaluation(id, evaluationConfig);
    res.json(result);
  } catch (error) {
    console.error('❌ Error in evaluation stage:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   POST /api/mlops/pipeline/:id/testing
// @desc    Exécuter l'étape Testing
// @access  Private
router.post('/pipeline/:id/testing', async (req, res) => {
  try {
    const { id } = req.params;
    const testConfig = req.body;

    const result = await mlopsService.testing(id, testConfig);
    res.json(result);
  } catch (error) {
    console.error('❌ Error in testing stage:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
