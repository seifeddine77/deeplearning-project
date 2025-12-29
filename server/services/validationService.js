class ValidationService {
  constructor() {
    this.validationRules = new Map();
    this.anomalyThreshold = 0.95;
    this.driftThreshold = 0.1;
  }

  /**
   * Valider les données entrantes
   */
  validateInputData(data, schema) {
    try {
      const errors = [];

      // Vérifier les champs requis
      if (schema.required) {
        for (const field of schema.required) {
          if (!data[field]) {
            errors.push(`Field '${field}' is required`);
          }
        }
      }

      // Vérifier les types
      if (schema.properties) {
        for (const [field, type] of Object.entries(schema.properties)) {
          if (data[field] && typeof data[field] !== type) {
            errors.push(`Field '${field}' must be of type ${type}`);
          }
        }
      }

      return {
        valid: errors.length === 0,
        errors
      };
    } catch (error) {
      console.error('❌ Error validating input data:', error.message);
      return {
        valid: false,
        errors: [error.message]
      };
    }
  }

  /**
   * Détecter les anomalies dans les prédictions
   */
  detectAnomalies(predictions, historicalData) {
    try {
      const anomalies = [];

      // Calculer la moyenne et l'écart-type historique
      const mean = historicalData.reduce((a, b) => a + b, 0) / historicalData.length;
      const variance = historicalData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / historicalData.length;
      const stdDev = Math.sqrt(variance);

      // Vérifier chaque prédiction
      predictions.forEach((pred, index) => {
        const zScore = Math.abs((pred - mean) / stdDev);
        
        if (zScore > 3) { // Plus de 3 écarts-types
          anomalies.push({
            index,
            value: pred,
            zScore,
            severity: 'high'
          });
        } else if (zScore > 2) {
          anomalies.push({
            index,
            value: pred,
            zScore,
            severity: 'medium'
          });
        }
      });

      return {
        hasAnomalies: anomalies.length > 0,
        anomalies,
        mean,
        stdDev
      };
    } catch (error) {
      console.error('❌ Error detecting anomalies:', error.message);
      return {
        hasAnomalies: false,
        anomalies: [],
        error: error.message
      };
    }
  }

  /**
   * Détecter la dérive du modèle (Model Drift)
   */
  detectModelDrift(currentMetrics, baselineMetrics) {
    try {
      const drift = {};
      const hasDrift = false;

      // Comparer les métriques
      for (const [metric, baselineValue] of Object.entries(baselineMetrics)) {
        const currentValue = currentMetrics[metric];
        const change = Math.abs(currentValue - baselineValue) / baselineValue;

        drift[metric] = {
          baseline: baselineValue,
          current: currentValue,
          changePercent: (change * 100).toFixed(2),
          hasDrift: change > this.driftThreshold
        };
      }

      const hasDriftDetected = Object.values(drift).some(d => d.hasDrift);

      return {
        hasDrift: hasDriftDetected,
        drift,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error detecting model drift:', error.message);
      return {
        hasDrift: false,
        error: error.message
      };
    }
  }

  /**
   * Valider la qualité des prédictions
   */
  validatePredictionQuality(predictions, confidence) {
    try {
      const qualityMetrics = {
        totalPredictions: predictions.length,
        highConfidence: 0,
        mediumConfidence: 0,
        lowConfidence: 0,
        averageConfidence: 0
      };

      let totalConfidence = 0;

      predictions.forEach((pred, index) => {
        const conf = confidence[index];
        totalConfidence += conf;

        if (conf >= 0.9) {
          qualityMetrics.highConfidence++;
        } else if (conf >= 0.7) {
          qualityMetrics.mediumConfidence++;
        } else {
          qualityMetrics.lowConfidence++;
        }
      });

      qualityMetrics.averageConfidence = (totalConfidence / predictions.length).toFixed(4);

      return {
        success: true,
        qualityMetrics,
        qualityScore: (qualityMetrics.highConfidence / predictions.length * 100).toFixed(2)
      };
    } catch (error) {
      console.error('❌ Error validating prediction quality:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Effectuer des tests de régression
   */
  performRegressionTest(currentResults, previousResults, tolerance = 0.05) {
    try {
      const regressions = [];

      for (const [metric, currentValue] of Object.entries(currentResults)) {
        const previousValue = previousResults[metric];
        const change = (currentValue - previousValue) / previousValue;

        if (change < -tolerance) {
          regressions.push({
            metric,
            previousValue,
            currentValue,
            changePercent: (change * 100).toFixed(2),
            severity: Math.abs(change) > 0.1 ? 'high' : 'medium'
          });
        }
      }

      return {
        hasRegressions: regressions.length > 0,
        regressions,
        testPassed: regressions.length === 0,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error performing regression test:', error.message);
      return {
        hasRegressions: false,
        testPassed: false,
        error: error.message
      };
    }
  }

  /**
   * Générer un rapport de validation
   */
  generateValidationReport(validationResults) {
    try {
      const report = {
        timestamp: new Date().toISOString(),
        summary: {
          totalTests: 0,
          passedTests: 0,
          failedTests: 0,
          successRate: 0
        },
        details: validationResults,
        recommendations: []
      };

      // Calculer les statistiques
      let passed = 0;
      let total = 0;

      for (const result of validationResults) {
        total++;
        if (result.success || result.testPassed || !result.hasAnomalies) {
          passed++;
        } else {
          report.recommendations.push(`⚠️ ${result.type}: ${result.message}`);
        }
      }

      report.summary.totalTests = total;
      report.summary.passedTests = passed;
      report.summary.failedTests = total - passed;
      report.summary.successRate = ((passed / total) * 100).toFixed(2);

      return {
        success: true,
        report
      };
    } catch (error) {
      console.error('❌ Error generating validation report:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new ValidationService();
