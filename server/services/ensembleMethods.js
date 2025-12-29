const logger = require('../config/logger');

class EnsembleMethods {
  /**
   * Voting Classifier - Combine les prédictions par vote
   */
  static votingClassifier(predictions, weights = null) {
    logger.info('Voting Classifier', { numModels: predictions.length });

    if (predictions.length === 0) {
      throw new Error('No predictions provided');
    }

    // Normaliser les poids
    if (!weights) {
      weights = Array(predictions.length).fill(1 / predictions.length);
    } else {
      const sum = weights.reduce((a, b) => a + b, 0);
      weights = weights.map(w => w / sum);
    }

    const numClasses = predictions[0][0].length;
    const numSamples = predictions[0].length;
    const ensemblePredictions = [];

    for (let i = 0; i < numSamples; i++) {
      const votes = Array(numClasses).fill(0);

      predictions.forEach((modelPreds, modelIndex) => {
        const pred = modelPreds[i];
        const predictedClass = pred.indexOf(Math.max(...pred));
        votes[predictedClass] += weights[modelIndex];
      });

      ensemblePredictions.push(votes);
    }

    logger.info('Voting Classifier completed', { numSamples, numClasses });

    return {
      predictions: ensemblePredictions,
      method: 'voting',
      numModels: predictions.length,
      weights
    };
  }

  /**
   * Averaging Ensemble - Moyenne les prédictions
   */
  static averagingEnsemble(predictions, weights = null) {
    logger.info('Averaging Ensemble', { numModels: predictions.length });

    if (predictions.length === 0) {
      throw new Error('No predictions provided');
    }

    // Normaliser les poids
    if (!weights) {
      weights = Array(predictions.length).fill(1 / predictions.length);
    } else {
      const sum = weights.reduce((a, b) => a + b, 0);
      weights = weights.map(w => w / sum);
    }

    const numSamples = predictions[0].length;
    const numClasses = predictions[0][0].length;
    const ensemblePredictions = [];

    for (let i = 0; i < numSamples; i++) {
      const averaged = Array(numClasses).fill(0);

      predictions.forEach((modelPreds, modelIndex) => {
        const pred = modelPreds[i];
        pred.forEach((prob, classIndex) => {
          averaged[classIndex] += prob * weights[modelIndex];
        });
      });

      ensemblePredictions.push(averaged);
    }

    logger.info('Averaging Ensemble completed', { numSamples, numClasses });

    return {
      predictions: ensemblePredictions,
      method: 'averaging',
      numModels: predictions.length,
      weights
    };
  }

  /**
   * Stacking - Utilise un meta-learner
   */
  static stacking(predictions, metaLabels, metaLearner) {
    logger.info('Stacking', { numModels: predictions.length });

    if (predictions.length === 0) {
      throw new Error('No predictions provided');
    }

    // Utiliser les prédictions comme features pour le meta-learner
    const metaFeatures = [];
    for (let i = 0; i < predictions[0].length; i++) {
      const features = [];
      predictions.forEach(modelPreds => {
        features.push(...modelPreds[i]);
      });
      metaFeatures.push(features);
    }

    logger.info('Stacking - Meta-features created', { numFeatures: metaFeatures[0].length });

    // Entraîner le meta-learner
    try {
      const metaPredictions = metaLearner(metaFeatures, metaLabels);

      logger.info('Stacking completed', { numModels: predictions.length });

      return {
        predictions: metaPredictions,
        method: 'stacking',
        numModels: predictions.length,
        metaFeatures
      };
    } catch (error) {
      logger.error('Stacking error', { error: error.message });
      throw error;
    }
  }

  /**
   * Bagging - Bootstrap Aggregating
   */
  static bagging(data, labels, baseModel, numModels = 10) {
    logger.info('Bagging', { numModels, dataSize: data.length });

    const models = [];
    const predictions = [];

    for (let i = 0; i < numModels; i++) {
      logger.info(`Bagging - Training model ${i + 1}/${numModels}`);

      // Bootstrap sample
      const bootstrapIndices = this.getBootstrapSample(data.length);
      const bootstrapData = bootstrapIndices.map(idx => data[idx]);
      const bootstrapLabels = bootstrapIndices.map(idx => labels[idx]);

      try {
        // Entraîner le modèle
        const model = baseModel(bootstrapData, bootstrapLabels);
        models.push(model);

        // Faire des prédictions
        const preds = model.predict(data);
        predictions.push(preds);
      } catch (error) {
        logger.error(`Bagging - Error training model ${i + 1}`, { error: error.message });
      }
    }

    logger.info('Bagging completed', { numModels: models.length });

    return {
      models,
      predictions,
      method: 'bagging',
      numModels: models.length
    };
  }

  /**
   * Boosting - AdaBoost
   */
  static adaBoost(data, labels, baseModel, numModels = 10, learningRate = 1.0) {
    logger.info('AdaBoost', { numModels, learningRate });

    const models = [];
    const modelWeights = [];
    let sampleWeights = Array(data.length).fill(1 / data.length);

    for (let i = 0; i < numModels; i++) {
      logger.info(`AdaBoost - Training model ${i + 1}/${numModels}`);

      try {
        // Entraîner le modèle avec les poids
        const model = baseModel(data, labels, sampleWeights);
        models.push(model);

        // Calculer l'erreur
        const predictions = model.predict(data);
        let error = 0;
        predictions.forEach((pred, idx) => {
          const predictedClass = pred.indexOf(Math.max(...pred));
          if (predictedClass !== labels[idx]) {
            error += sampleWeights[idx];
          }
        });

        // Calculer le poids du modèle
        const alpha = learningRate * Math.log((1 - error) / (error + 1e-10));
        modelWeights.push(alpha);

        // Mettre à jour les poids des samples
        predictions.forEach((pred, idx) => {
          const predictedClass = pred.indexOf(Math.max(...pred));
          if (predictedClass !== labels[idx]) {
            sampleWeights[idx] *= Math.exp(alpha);
          }
        });

        // Normaliser les poids
        const sum = sampleWeights.reduce((a, b) => a + b, 0);
        sampleWeights = sampleWeights.map(w => w / sum);

        logger.info(`AdaBoost - Model ${i + 1} error: ${error.toFixed(4)}, alpha: ${alpha.toFixed(4)}`);
      } catch (error) {
        logger.error(`AdaBoost - Error training model ${i + 1}`, { error: error.message });
      }
    }

    logger.info('AdaBoost completed', { numModels: models.length });

    return {
      models,
      modelWeights,
      method: 'adaboost',
      numModels: models.length
    };
  }

  /**
   * Blending - Combine les prédictions avec un holdout set
   */
  static blending(trainData, trainLabels, testData, testLabels, models) {
    logger.info('Blending', { numModels: models.length });

    // Obtenir les prédictions de tous les modèles sur le test set
    const metaFeatures = [];
    models.forEach((model, idx) => {
      logger.info(`Blending - Getting predictions from model ${idx + 1}/${models.length}`);
      const preds = model.predict(testData);
      metaFeatures.push(preds);
    });

    // Combiner les prédictions
    const blendedPredictions = [];
    for (let i = 0; i < testData.length; i++) {
      const combined = Array(metaFeatures[0][i].length).fill(0);
      metaFeatures.forEach(modelPreds => {
        modelPreds[i].forEach((prob, idx) => {
          combined[idx] += prob;
        });
      });
      // Moyenne
      combined.forEach((_, idx) => {
        combined[idx] /= models.length;
      });
      blendedPredictions.push(combined);
    }

    logger.info('Blending completed', { numModels: models.length });

    return {
      predictions: blendedPredictions,
      method: 'blending',
      numModels: models.length
    };
  }

  /**
   * Obtenir un bootstrap sample
   */
  static getBootstrapSample(size) {
    const indices = [];
    for (let i = 0; i < size; i++) {
      indices.push(Math.floor(Math.random() * size));
    }
    return indices;
  }

  /**
   * Comparer les performances des ensembles
   */
  static compareEnsembles(results) {
    logger.info('Comparing ensemble methods', { numMethods: results.length });

    const comparison = results.map(result => ({
      method: result.method,
      accuracy: result.accuracy,
      precision: result.precision,
      recall: result.recall,
      f1Score: result.f1Score
    }));

    // Trier par accuracy
    comparison.sort((a, b) => b.accuracy - a.accuracy);

    logger.info('Ensemble comparison completed', {
      bestMethod: comparison[0].method,
      bestAccuracy: comparison[0].accuracy.toFixed(4)
    });

    return comparison;
  }
}

module.exports = EnsembleMethods;
