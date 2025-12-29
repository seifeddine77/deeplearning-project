const logger = require('../config/logger');

class HyperparameterTuning {
  /**
   * Grid Search - Teste toutes les combinaisons
   */
  static gridSearch(evaluateFunction, paramGrid) {
    logger.info('Starting Grid Search', { paramGrid });
    
    const results = [];
    const combinations = this.generateGridCombinations(paramGrid);

    combinations.forEach((params, index) => {
      logger.info(`Grid Search - Testing combination ${index + 1}/${combinations.length}`, { params });
      
      try {
        const score = evaluateFunction(params);
        results.push({
          params,
          score,
          index: index + 1
        });
      } catch (error) {
        logger.error('Grid Search - Error evaluating combination', { params, error: error.message });
      }
    });

    // Trier par score décroissant
    results.sort((a, b) => b.score - a.score);

    logger.info('Grid Search completed', {
      totalCombinations: combinations.length,
      bestScore: results[0]?.score,
      bestParams: results[0]?.params
    });

    return {
      bestParams: results[0]?.params,
      bestScore: results[0]?.score,
      results,
      totalCombinations: combinations.length
    };
  }

  /**
   * Random Search - Teste des combinaisons aléatoires
   */
  static randomSearch(evaluateFunction, paramGrid, iterations = 10) {
    logger.info('Starting Random Search', { iterations, paramGrid });
    
    const results = [];

    for (let i = 0; i < iterations; i++) {
      const params = this.generateRandomParams(paramGrid);
      
      logger.info(`Random Search - Testing iteration ${i + 1}/${iterations}`, { params });
      
      try {
        const score = evaluateFunction(params);
        results.push({
          params,
          score,
          iteration: i + 1
        });
      } catch (error) {
        logger.error('Random Search - Error evaluating params', { params, error: error.message });
      }
    }

    // Trier par score décroissant
    results.sort((a, b) => b.score - a.score);

    logger.info('Random Search completed', {
      iterations,
      bestScore: results[0]?.score,
      bestParams: results[0]?.params
    });

    return {
      bestParams: results[0]?.params,
      bestScore: results[0]?.score,
      results,
      iterations
    };
  }

  /**
   * Bayesian Optimization - Optimisation intelligente
   */
  static bayesianOptimization(evaluateFunction, paramGrid, iterations = 10) {
    logger.info('Starting Bayesian Optimization', { iterations, paramGrid });
    
    const results = [];
    const explored = [];

    for (let i = 0; i < iterations; i++) {
      let params;
      
      if (i === 0) {
        // Première itération: aléatoire
        params = this.generateRandomParams(paramGrid);
      } else {
        // Itérations suivantes: basées sur les résultats précédents
        params = this.selectNextParams(explored, paramGrid);
      }

      logger.info(`Bayesian Optimization - Iteration ${i + 1}/${iterations}`, { params });
      
      try {
        const score = evaluateFunction(params);
        results.push({
          params,
          score,
          iteration: i + 1
        });
        explored.push({ params, score });
      } catch (error) {
        logger.error('Bayesian Optimization - Error', { params, error: error.message });
      }
    }

    // Trier par score décroissant
    results.sort((a, b) => b.score - a.score);

    logger.info('Bayesian Optimization completed', {
      iterations,
      bestScore: results[0]?.score,
      bestParams: results[0]?.params
    });

    return {
      bestParams: results[0]?.params,
      bestScore: results[0]?.score,
      results,
      iterations
    };
  }

  /**
   * Générer toutes les combinaisons pour Grid Search
   */
  static generateGridCombinations(paramGrid) {
    const keys = Object.keys(paramGrid);
    const combinations = [];

    const generate = (index, current) => {
      if (index === keys.length) {
        combinations.push({ ...current });
        return;
      }

      const key = keys[index];
      const values = paramGrid[key];

      values.forEach(value => {
        current[key] = value;
        generate(index + 1, current);
      });
    };

    generate(0, {});
    return combinations;
  }

  /**
   * Générer des paramètres aléatoires
   */
  static generateRandomParams(paramGrid) {
    const params = {};

    Object.keys(paramGrid).forEach(key => {
      const values = paramGrid[key];
      params[key] = values[Math.floor(Math.random() * values.length)];
    });

    return params;
  }

  /**
   * Sélectionner les prochains paramètres basés sur les résultats précédents
   */
  static selectNextParams(explored, paramGrid) {
    // Stratégie simple: explorer autour des meilleurs paramètres
    if (explored.length === 0) {
      return this.generateRandomParams(paramGrid);
    }

    // Trier par score
    explored.sort((a, b) => b.score - a.score);
    const bestParams = explored[0].params;

    // Générer des paramètres proches des meilleurs
    const params = {};
    Object.keys(paramGrid).forEach(key => {
      const values = paramGrid[key];
      const currentValue = bestParams[key];
      const currentIndex = values.indexOf(currentValue);

      // Sélectionner une valeur proche
      const range = Math.max(1, Math.floor(values.length / 4));
      const minIndex = Math.max(0, currentIndex - range);
      const maxIndex = Math.min(values.length - 1, currentIndex + range);
      const randomIndex = Math.floor(Math.random() * (maxIndex - minIndex + 1)) + minIndex;

      params[key] = values[randomIndex];
    });

    return params;
  }

  /**
   * Obtenir les statistiques de tuning
   */
  static getStats(results) {
    const scores = results.map(r => r.score);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const std = Math.sqrt(variance);

    return {
      bestScore: Math.max(...scores),
      worstScore: Math.min(...scores),
      meanScore: mean,
      stdScore: std,
      totalEvaluations: results.length
    };
  }
}

module.exports = HyperparameterTuning;
