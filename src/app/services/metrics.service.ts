import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MetricsService {

  /**
   * Calcule la matrice de confusion
   * @param trueLabels - Vraies classes (0-9)
   * @param predictedLabels - Classes prédites (0-9)
   * @returns Matrice de confusion 10x10
   */
  calculateConfusionMatrix(trueLabels: number[], predictedLabels: number[]): number[][] {
    const matrix: number[][] = Array(10).fill(null).map(() => Array(10).fill(0));

    for (let i = 0; i < trueLabels.length; i++) {
      const trueLabel = trueLabels[i];
      const predictedLabel = predictedLabels[i];
      matrix[trueLabel][predictedLabel]++;
    }

    return matrix;
  }

  /**
   * Calcule l'accuracy à partir de la matrice de confusion
   */
  calculateAccuracy(confusionMatrix: number[][]): number {
    let correct = 0;
    let total = 0;

    for (let i = 0; i < confusionMatrix.length; i++) {
      for (let j = 0; j < confusionMatrix[i].length; j++) {
        total += confusionMatrix[i][j];
        if (i === j) {
          correct += confusionMatrix[i][j];
        }
      }
    }

    return total > 0 ? correct / total : 0;
  }

  /**
   * Calcule la précision (Precision) pour chaque classe
   */
  calculatePrecision(confusionMatrix: number[][]): number[] {
    const precision: number[] = [];

    for (let j = 0; j < confusionMatrix[0].length; j++) {
      let truePositives = confusionMatrix[j][j];
      let falsePositives = 0;

      for (let i = 0; i < confusionMatrix.length; i++) {
        if (i !== j) {
          falsePositives += confusionMatrix[i][j];
        }
      }

      const p = (truePositives + falsePositives) > 0 
        ? truePositives / (truePositives + falsePositives) 
        : 0;
      precision.push(p);
    }

    return precision;
  }

  /**
   * Calcule le recall (Sensibilité) pour chaque classe
   */
  calculateRecall(confusionMatrix: number[][]): number[] {
    const recall: number[] = [];

    for (let i = 0; i < confusionMatrix.length; i++) {
      let truePositives = confusionMatrix[i][i];
      let falseNegatives = 0;

      for (let j = 0; j < confusionMatrix[i].length; j++) {
        if (i !== j) {
          falseNegatives += confusionMatrix[i][j];
        }
      }

      const r = (truePositives + falseNegatives) > 0 
        ? truePositives / (truePositives + falseNegatives) 
        : 0;
      recall.push(r);
    }

    return recall;
  }

  /**
   * Calcule le F1-Score pour chaque classe
   */
  calculateF1Score(precision: number[], recall: number[]): number[] {
    return precision.map((p, i) => {
      const r = recall[i];
      return (p + r) > 0 ? 2 * (p * r) / (p + r) : 0;
    });
  }

  /**
   * Calcule la moyenne macro des métriques
   */
  calculateMacroAverage(values: number[]): number {
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  }

  /**
   * Génère les points pour la courbe ROC
   * @param trueLabels - Vraies classes
   * @param predictedProbs - Probabilités prédites (0-1)
   * @returns Points ROC [[fpr, tpr], ...]
   */
  generateROCCurve(trueLabels: number[], predictedProbs: number[]): Array<[number, number]> {
    const rocPoints: Array<[number, number]> = [];

    // Trier par probabilité décroissante
    const sorted = trueLabels.map((label, idx) => ({
      label,
      prob: predictedProbs[idx],
      idx
    })).sort((a, b) => b.prob - a.prob);

    let tp = 0;
    let fp = 0;
    const totalPositives = trueLabels.filter(l => l === 1).length;
    const totalNegatives = trueLabels.filter(l => l === 0).length;

    rocPoints.push([0, 0]);

    for (const item of sorted) {
      if (item.label === 1) {
        tp++;
      } else {
        fp++;
      }

      const tpr = totalPositives > 0 ? tp / totalPositives : 0;
      const fpr = totalNegatives > 0 ? fp / totalNegatives : 0;
      rocPoints.push([fpr, tpr]);
    }

    return rocPoints;
  }

  /**
   * Calcule l'AUC (Area Under Curve)
   */
  calculateAUC(rocPoints: Array<[number, number]>): number {
    let auc = 0;

    for (let i = 1; i < rocPoints.length; i++) {
      const x1 = rocPoints[i - 1][0];
      const x2 = rocPoints[i][0];
      const y1 = rocPoints[i - 1][1];
      const y2 = rocPoints[i][1];

      auc += (x2 - x1) * (y1 + y2) / 2;
    }

    return auc;
  }

  /**
   * Calcule l'importance des features basée sur les poids du modèle
   * @param weights - Poids du modèle (dernière couche Dense)
   * @returns Importance de chaque feature
   */
  calculateFeatureImportance(weights: number[][]): number[] {
    const importance: number[] = Array(weights[0].length).fill(0);

    for (let i = 0; i < weights.length; i++) {
      for (let j = 0; j < weights[i].length; j++) {
        importance[j] += Math.abs(weights[i][j]);
      }
    }

    // Normaliser entre 0 et 1
    const maxImportance = Math.max(...importance);
    return importance.map(imp => maxImportance > 0 ? imp / maxImportance : 0);
  }

  /**
   * Génère les prédictions à partir des probabilités (comme np.argmax)
   */
  getPredictedClasses(predictions: number[][]): number[] {
    return predictions.map(pred => {
      let maxIdx = 0;
      let maxVal = pred[0];
      for (let i = 1; i < pred.length; i++) {
        if (pred[i] > maxVal) {
          maxVal = pred[i];
          maxIdx = i;
        }
      }
      return maxIdx;
    });
  }

  /**
   * Calcule les probabilités de confiance pour chaque prédiction
   */
  getConfidenceScores(predictions: number[][]): number[] {
    return predictions.map(pred => Math.max(...pred));
  }

  /**
   * Génère un rapport complet des métriques
   */
  generateMetricsReport(
    trueLabels: number[],
    predictedLabels: number[],
    predictedProbs: number[][]
  ): any {
    const confusionMatrix = this.calculateConfusionMatrix(trueLabels, predictedLabels);
    const accuracy = this.calculateAccuracy(confusionMatrix);
    const precision = this.calculatePrecision(confusionMatrix);
    const recall = this.calculateRecall(confusionMatrix);
    const f1Score = this.calculateF1Score(precision, recall);

    return {
      confusionMatrix,
      accuracy,
      precision: this.calculateMacroAverage(precision),
      recall: this.calculateMacroAverage(recall),
      f1Score: this.calculateMacroAverage(f1Score),
      precisionPerClass: precision,
      recallPerClass: recall,
      f1ScorePerClass: f1Score,
      confidenceScores: this.getConfidenceScores(predictedProbs)
    };
  }
}
