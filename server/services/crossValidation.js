const logger = require('../config/logger');

class CrossValidation {
  /**
   * K-Fold Cross-Validation
   */
  static kFold(data, labels, k = 5, evaluateFunction) {
    logger.info('Starting K-Fold Cross-Validation', { k, dataSize: data.length });

    if (k > data.length) {
      throw new Error(`k (${k}) cannot be greater than data size (${data.length})`);
    }

    const folds = this.createFolds(data, labels, k);
    const scores = [];

    folds.forEach((fold, index) => {
      logger.info(`K-Fold - Evaluating fold ${index + 1}/${k}`);

      const testData = fold.data;
      const testLabels = fold.labels;

      // Créer les données d'entraînement (tous les autres folds)
      const trainData = [];
      const trainLabels = [];

      folds.forEach((f, i) => {
        if (i !== index) {
          trainData.push(...f.data);
          trainLabels.push(...f.labels);
        }
      });

      try {
        const score = evaluateFunction(trainData, trainLabels, testData, testLabels);
        scores.push(score);
        logger.info(`K-Fold - Fold ${index + 1} score: ${score.toFixed(4)}`);
      } catch (error) {
        logger.error(`K-Fold - Error in fold ${index + 1}`, { error: error.message });
      }
    });

    const stats = this.calculateStats(scores);

    logger.info('K-Fold Cross-Validation completed', {
      k,
      meanScore: stats.mean.toFixed(4),
      stdScore: stats.std.toFixed(4),
      scores: scores.map(s => s.toFixed(4))
    });

    return {
      scores,
      meanScore: stats.mean,
      stdScore: stats.std,
      minScore: stats.min,
      maxScore: stats.max,
      k
    };
  }

  /**
   * Stratified K-Fold - Préserve la distribution des classes
   */
  static stratifiedKFold(data, labels, k = 5, evaluateFunction) {
    logger.info('Starting Stratified K-Fold Cross-Validation', { k, dataSize: data.length });

    if (k > data.length) {
      throw new Error(`k (${k}) cannot be greater than data size (${data.length})`);
    }

    // Grouper par classe
    const classesFolds = {};
    const uniqueClasses = [...new Set(labels)];

    uniqueClasses.forEach(cls => {
      const indices = labels
        .map((label, index) => ({ label, index }))
        .filter(item => item.label === cls)
        .map(item => item.index);

      classesFolds[cls] = this.createFolds(
        indices.map(i => data[i]),
        indices.map(i => labels[i]),
        k
      );
    });

    // Combiner les folds
    const folds = [];
    for (let i = 0; i < k; i++) {
      const foldData = [];
      const foldLabels = [];

      uniqueClasses.forEach(cls => {
        foldData.push(...classesFolds[cls][i].data);
        foldLabels.push(...classesFolds[cls][i].labels);
      });

      folds.push({ data: foldData, labels: foldLabels });
    }

    const scores = [];

    folds.forEach((fold, index) => {
      logger.info(`Stratified K-Fold - Evaluating fold ${index + 1}/${k}`);

      const testData = fold.data;
      const testLabels = fold.labels;

      const trainData = [];
      const trainLabels = [];

      folds.forEach((f, i) => {
        if (i !== index) {
          trainData.push(...f.data);
          trainLabels.push(...f.labels);
        }
      });

      try {
        const score = evaluateFunction(trainData, trainLabels, testData, testLabels);
        scores.push(score);
        logger.info(`Stratified K-Fold - Fold ${index + 1} score: ${score.toFixed(4)}`);
      } catch (error) {
        logger.error(`Stratified K-Fold - Error in fold ${index + 1}`, { error: error.message });
      }
    });

    const stats = this.calculateStats(scores);

    logger.info('Stratified K-Fold Cross-Validation completed', {
      k,
      meanScore: stats.mean.toFixed(4),
      stdScore: stats.std.toFixed(4)
    });

    return {
      scores,
      meanScore: stats.mean,
      stdScore: stats.std,
      minScore: stats.min,
      maxScore: stats.max,
      k,
      stratified: true
    };
  }

  /**
   * Leave-One-Out Cross-Validation
   */
  static leaveOneOut(data, labels, evaluateFunction) {
    logger.info('Starting Leave-One-Out Cross-Validation', { dataSize: data.length });

    const scores = [];

    data.forEach((sample, index) => {
      if ((index + 1) % 10 === 0) {
        logger.info(`Leave-One-Out - Evaluating sample ${index + 1}/${data.length}`);
      }

      const testData = [sample];
      const testLabel = [labels[index]];

      const trainData = data.filter((_, i) => i !== index);
      const trainLabels = labels.filter((_, i) => i !== index);

      try {
        const score = evaluateFunction(trainData, trainLabels, testData, testLabel);
        scores.push(score);
      } catch (error) {
        logger.error(`Leave-One-Out - Error at sample ${index}`, { error: error.message });
      }
    });

    const stats = this.calculateStats(scores);

    logger.info('Leave-One-Out Cross-Validation completed', {
      meanScore: stats.mean.toFixed(4),
      stdScore: stats.std.toFixed(4),
      totalSamples: data.length
    });

    return {
      scores,
      meanScore: stats.mean,
      stdScore: stats.std,
      minScore: stats.min,
      maxScore: stats.max,
      method: 'leave-one-out'
    };
  }

  /**
   * Time Series Split - Pour les données temporelles
   */
  static timeSeriesSplit(data, labels, k = 5, evaluateFunction) {
    logger.info('Starting Time Series Split', { k, dataSize: data.length });

    const folds = this.createTimeSeriesFolds(data, labels, k);
    const scores = [];

    folds.forEach((fold, index) => {
      logger.info(`Time Series Split - Evaluating fold ${index + 1}/${k}`);

      const trainData = fold.trainData;
      const trainLabels = fold.trainLabels;
      const testData = fold.testData;
      const testLabels = fold.testLabels;

      try {
        const score = evaluateFunction(trainData, trainLabels, testData, testLabels);
        scores.push(score);
        logger.info(`Time Series Split - Fold ${index + 1} score: ${score.toFixed(4)}`);
      } catch (error) {
        logger.error(`Time Series Split - Error in fold ${index + 1}`, { error: error.message });
      }
    });

    const stats = this.calculateStats(scores);

    logger.info('Time Series Split completed', {
      k,
      meanScore: stats.mean.toFixed(4),
      stdScore: stats.std.toFixed(4)
    });

    return {
      scores,
      meanScore: stats.mean,
      stdScore: stats.std,
      minScore: stats.min,
      maxScore: stats.max,
      k,
      method: 'time-series-split'
    };
  }

  /**
   * Créer les folds pour K-Fold
   */
  static createFolds(data, labels, k) {
    const folds = [];
    const foldSize = Math.ceil(data.length / k);

    for (let i = 0; i < k; i++) {
      const start = i * foldSize;
      const end = Math.min(start + foldSize, data.length);

      folds.push({
        data: data.slice(start, end),
        labels: labels.slice(start, end)
      });
    }

    return folds;
  }

  /**
   * Créer les folds pour Time Series Split
   */
  static createTimeSeriesFolds(data, labels, k) {
    const folds = [];
    const totalSize = data.length;
    const testSize = Math.floor(totalSize / (k + 1));

    for (let i = 0; i < k; i++) {
      const trainEnd = (i + 1) * testSize;
      const testEnd = trainEnd + testSize;

      folds.push({
        trainData: data.slice(0, trainEnd),
        trainLabels: labels.slice(0, trainEnd),
        testData: data.slice(trainEnd, testEnd),
        testLabels: labels.slice(trainEnd, testEnd)
      });
    }

    return folds;
  }

  /**
   * Calculer les statistiques
   */
  static calculateStats(scores) {
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const std = Math.sqrt(variance);

    return {
      mean,
      std,
      min: Math.min(...scores),
      max: Math.max(...scores),
      median: this.getMedian(scores)
    };
  }

  /**
   * Obtenir la médiane
   */
  static getMedian(scores) {
    const sorted = [...scores].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }
}

module.exports = CrossValidation;
