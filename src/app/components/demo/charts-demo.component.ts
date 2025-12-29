import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TrainingMetricsComponent } from '../charts/training-metrics.component';
import { TrainingChartComponent } from '../charts/training-chart.component';
import { ConfusionMatrixComponent } from '../charts/confusion-matrix.component';
import { RocCurveComponent } from '../charts/roc-curve.component';
import { FeatureImportanceComponent } from '../charts/feature-importance.component';
import { ModelComparisonComponent } from '../charts/model-comparison.component';

@Component({
  selector: 'app-charts-demo',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    TrainingMetricsComponent,
    TrainingChartComponent,
    ConfusionMatrixComponent,
    RocCurveComponent,
    FeatureImportanceComponent,
    ModelComparisonComponent
  ],
  template: `
    <div style="min-height: 100vh; background: linear-gradient(135deg, #0066ff 0%, #00d4ff 50%, #7209b7 100%); padding: 32px 24px;">
      <div style="max-width: 1400px; margin: 0 auto;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="margin: 0; font-size: 2.5rem; font-weight: 700; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
            <mat-icon svgIcon="chart" style="vertical-align: -6px; margin-right: 10px; color: rgba(255,255,255,0.95);"></mat-icon>
            Galerie Complète des Graphiques
          </h1>
          <p style="margin: 10px 0 0 0; font-size: 1rem; color: rgba(255,255,255,0.9);">Tous les types de visualisations implémentées</p>
        </div>

        <!-- Stats -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 40px;">
          <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center;">
            <div style="font-size: 2rem; font-weight: 700; color: #0066ff;">6</div>
            <div style="font-size: 0.875rem; color: #666; margin-top: 4px;">Types de Graphiques</div>
          </div>
          <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center;">
            <div style="font-size: 2rem; font-weight: 700; color: #10b981;">12</div>
            <div style="font-size: 0.875rem; color: #666; margin-top: 4px;">Services Backend</div>
          </div>
          <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center;">
            <div style="font-size: 2rem; font-weight: 700; color: #f59e0b;">50+</div>
            <div style="font-size: 0.875rem; color: #666; margin-top: 4px;">Routes API</div>
          </div>
          <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center;">
            <div style="font-size: 2rem; font-weight: 700; color: #ef4444;">100%</div>
            <div style="font-size: 0.875rem; color: #666; margin-top: 4px;">Implémenté</div>
          </div>
        </div>

        <!-- Section 1: Training Metrics (4 graphiques) -->
        <div style="margin-bottom: 40px;">
          <h2 style="color: white; margin-bottom: 20px; font-size: 1.5rem; display:flex; align-items:center; gap: 10px;">
            <mat-icon svgIcon="one"></mat-icon>
            Métriques d'Entraînement en Temps Réel
          </h2>
          <app-training-metrics [trainingHistory]="trainingHistory" [isTraining]="false"></app-training-metrics>
        </div>

        <!-- Section 2: Training Chart -->
        <div style="background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); padding: 24px; margin-bottom: 40px;">
          <h2 style="margin: 0 0 20px 0; font-size: 1.5rem; font-weight: 600; color: #333; display:flex; align-items:center; gap: 10px;">
            <mat-icon svgIcon="two"></mat-icon>
            Progression d'Entraînement
          </h2>
          <app-training-chart [trainingHistory]="trainingHistory" [bestAccuracy]="bestAccuracy" [bestLoss]="bestLoss"></app-training-chart>
        </div>

        <!-- Section 3: Confusion Matrix -->
        <div style="background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); padding: 24px; margin-bottom: 40px;">
          <h2 style="margin: 0 0 20px 0; font-size: 1.5rem; font-weight: 600; color: #333; display:flex; align-items:center; gap: 10px;">
            <mat-icon svgIcon="three"></mat-icon>
            Matrice de Confusion
          </h2>
          <app-confusion-matrix [trainingHistory]="trainingHistory" [confusionData]="confusionData"></app-confusion-matrix>
        </div>

        <!-- Section 4: ROC Curve -->
        <div style="background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); padding: 24px; margin-bottom: 40px; height: 400px;">
          <h2 style="margin: 0 0 20px 0; font-size: 1.5rem; font-weight: 600; color: #333; display:flex; align-items:center; gap: 10px;">
            <mat-icon svgIcon="four"></mat-icon>
            Courbe ROC
          </h2>
          <app-roc-curve [trainingHistory]="trainingHistory" [rocData]="rocData"></app-roc-curve>
        </div>

        <!-- Section 5: Feature Importance -->
        <div style="background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); padding: 24px; margin-bottom: 40px; height: 400px;">
          <h2 style="margin: 0 0 20px 0; font-size: 1.5rem; font-weight: 600; color: #333; display:flex; align-items:center; gap: 10px;">
            <mat-icon svgIcon="five"></mat-icon>
            Importance des Features
          </h2>
          <app-feature-importance [trainingHistory]="trainingHistory" [featureData]="featureData"></app-feature-importance>
        </div>

        <!-- Section 6: Model Comparison -->
        <div style="background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); padding: 24px; margin-bottom: 40px; height: 400px;">
          <h2 style="margin: 0 0 20px 0; font-size: 1.5rem; font-weight: 600; color: #333; display:flex; align-items:center; gap: 10px;">
            <mat-icon svgIcon="six"></mat-icon>
            Comparaison de Modèles
          </h2>
          <app-model-comparison [trainingHistory]="trainingHistory" [comparisonData]="comparisonData"></app-model-comparison>
        </div>

        <!-- Footer -->
        <div style="background: rgba(255,255,255,0.1); border-radius: 12px; padding: 24px; text-align: center; color: white; margin-top: 40px;">
          <h3 style="margin: 0 0 12px 0; display:flex; align-items:center; justify-content:center; gap: 10px;">
            <mat-icon svgIcon="check"></mat-icon>
            Tous les Graphiques Sont Implémentés
          </h3>
          <p style="margin: 0; font-size: 0.875rem; opacity: 0.9;">Cliquez sur les onglets pour voir différentes métriques • Les données se mettent à jour en temps réel</p>
        </div>
      </div>
    </div>
  `
})
export class ChartsDemoComponent implements OnInit {
  trainingHistory: Array<{ epoch: number; loss: number; accuracy: number; valLoss?: number; valAccuracy?: number }> = [
    { epoch: 1, loss: 0.5, accuracy: 0.6, valLoss: 0.55, valAccuracy: 0.55 },
    { epoch: 2, loss: 0.45, accuracy: 0.65, valLoss: 0.5, valAccuracy: 0.6 },
    { epoch: 3, loss: 0.4, accuracy: 0.7, valLoss: 0.45, valAccuracy: 0.65 },
    { epoch: 4, loss: 0.35, accuracy: 0.75, valLoss: 0.4, valAccuracy: 0.7 },
    { epoch: 5, loss: 0.3, accuracy: 0.8, valLoss: 0.35, valAccuracy: 0.75 },
    { epoch: 6, loss: 0.25, accuracy: 0.85, valLoss: 0.3, valAccuracy: 0.8 },
    { epoch: 7, loss: 0.2, accuracy: 0.88, valLoss: 0.25, valAccuracy: 0.83 },
    { epoch: 8, loss: 0.15, accuracy: 0.9, valLoss: 0.22, valAccuracy: 0.85 },
    { epoch: 9, loss: 0.12, accuracy: 0.92, valLoss: 0.2, valAccuracy: 0.87 },
    { epoch: 10, loss: 0.1, accuracy: 0.95, valLoss: 0.18, valAccuracy: 0.9 }
  ];

  bestAccuracy = 0.95;
  bestLoss = 0.1;

  confusionData = {
    matrix: [
      [95, 3, 2],
      [2, 96, 2],
      [3, 1, 96]
    ],
    accuracy: 0.95,
    precision: 0.94,
    recall: 0.93
  };

  rocData = {
    points: [
      [0, 0],
      [0.05, 0.85],
      [0.1, 0.9],
      [0.15, 0.92],
      [0.2, 0.94],
      [0.3, 0.96],
      [0.5, 0.98],
      [1, 1]
    ],
    auc: 0.95
  };

  featureData = {
    features: [
      { name: 'Feature 1', importance: 0.25 },
      { name: 'Feature 2', importance: 0.2 },
      { name: 'Feature 3', importance: 0.18 },
      { name: 'Feature 4', importance: 0.15 },
      { name: 'Feature 5', importance: 0.12 },
      { name: 'Feature 6', importance: 0.1 }
    ],
    topFeature: 'Feature 1',
    maxImportance: 0.25
  };

  comparisonData = {
    models: [
      { name: 'CNN-LSTM', accuracy: 0.95, loss: 0.1, precision: 0.94, recall: 0.96, f1: 0.95, modelType: 'cnn-lstm', layersCount: 21, modelId: 'demo_1' },
      { name: 'ResNet', accuracy: 0.92, loss: 0.15, precision: 0.91, recall: 0.93, f1: 0.92, modelType: 'cnn', layersCount: 50, modelId: 'demo_2' },
      { name: 'VGG', accuracy: 0.88, loss: 0.2, precision: 0.87, recall: 0.89, f1: 0.88, modelType: 'cnn', layersCount: 16, modelId: 'demo_3' }
    ]
  };

  ngOnInit() {
    console.log('Charts Demo Component Initialized');
    console.log('6 Types de Graphiques Disponibles:');
    console.log('1. Training Metrics (4 graphiques)');
    console.log('2. Training Chart');
    console.log('3. Confusion Matrix');
    console.log('4. ROC Curve');
    console.log('5. Feature Importance');
    console.log('6. Model Comparison');
  }
}
