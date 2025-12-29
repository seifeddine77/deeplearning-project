import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-mlops',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div style="min-height: calc(100vh - 70px); background: linear-gradient(135deg, #0066ff 0%, #00d4ff 50%, #7209b7 100%); padding: 32px 24px;">
      <div style="max-width: 1200px; margin: 0 auto;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="margin: 0; font-size: 2.5rem; font-weight: 700; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
            <mat-icon svgIcon="rocket" style="vertical-align: -6px; margin-right: 10px; color: rgba(255,255,255,0.95);"></mat-icon>
            MLops Pipeline
          </h1>
          <p style="margin: 10px 0 0 0; font-size: 1rem; color: rgba(255,255,255,0.9);">Workflow complet: Collection → Preprocessing → Training → Evaluation → Testing</p>
        </div>

        <!-- Cards Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; margin-bottom: 30px;">
          <!-- Pipeline Creation -->
          <div style="background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden;">
            <div style="background: linear-gradient(135deg, #0066ff 0%, #00d4ff 100%); color: white; padding: 16px; border-radius: 12px 12px 0 0;">
              <h3 style="margin: 0; font-size: 1.125rem; font-weight: 600; display:flex; align-items:center; gap: 10px;">
                <mat-icon svgIcon="check" style="color: rgba(255,255,255,0.95);"></mat-icon>
                Créer un Pipeline
              </h3>
            </div>
            <div style="padding: 16px;">
              <div style="margin-bottom: 12px;">
                <label style="display: block; font-size: 0.875rem; font-weight: 600; color: #333; margin-bottom: 4px;">Nom du Pipeline</label>
                <input 
                  type="text" 
                  [(ngModel)]="pipelineName" 
                  placeholder="Ex: MNIST Classification"
                  style="width: 100%; padding: 8px; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 0.875rem;"
                />
              </div>
              <div style="margin-bottom: 12px;">
                <label style="display: block; font-size: 0.875rem; font-weight: 600; color: #333; margin-bottom: 4px;">Description</label>
                <textarea 
                  [(ngModel)]="pipelineDescription" 
                  placeholder="Description du pipeline"
                  style="width: 100%; padding: 8px; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 0.875rem; resize: vertical; min-height: 80px;"
                ></textarea>
              </div>
              <button (click)="createPipeline()" style="width: 100%; padding: 10px; margin-top: 8px; background: linear-gradient(90deg, #0066ff 0%, #00d4ff 100%); color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">
                Créer Pipeline
              </button>
            </div>
          </div>

          <!-- Pipeline Execution -->
          <div style="background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden;" *ngIf="currentPipeline">
            <div style="background: linear-gradient(135deg, #0066ff 0%, #00d4ff 100%); color: white; padding: 16px; border-radius: 12px 12px 0 0;">
              <h3 style="margin: 0; font-size: 1.125rem; font-weight: 600; display:flex; align-items:center; gap: 10px;">
                <mat-icon svgIcon="bolt" style="color: rgba(255,255,255,0.95);"></mat-icon>
                Exécuter le Pipeline
              </h3>
            </div>
            <div style="padding: 16px;">
              <div style="margin-bottom: 12px;">
                <label style="display: block; font-size: 0.875rem; font-weight: 600; color: #333; margin-bottom: 4px;">Dataset</label>
                <select [(ngModel)]="selectedDataset" style="width: 100%; padding: 8px; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 0.875rem;">
              <option value="">Sélectionner un dataset</option>
              <option value="mnist">MNIST</option>
              <option value="cifar-10">CIFAR-10</option>
              <option value="fashion-mnist">Fashion MNIST</option>
              <option value="iris">Iris</option>
              <option value="titanic">Titanic</option>
            </select>
          </div>

          <!-- Training Parameters -->
          <div class="form-row">
            <div class="form-group">
              <label>Epochs</label>
              <input 
                type="number" 
                [(ngModel)]="trainingParams.epochs" 
                class="input-field"
              />
            </div>
            <div class="form-group">
              <label>Batch Size</label>
              <input 
                type="number" 
                [(ngModel)]="trainingParams.batchSize" 
                class="input-field"
              />
            </div>
            <div class="form-group">
              <label>Learning Rate</label>
              <input 
                type="number" 
                [(ngModel)]="trainingParams.learningRate" 
                step="0.0001"
                class="input-field"
              />
            </div>
          </div>

            <button 
              (click)="executePipeline()" 
              [disabled]="isExecuting"
              class="btn-primary"
            >
              <mat-icon [svgIcon]="isExecuting ? 'refresh' : 'rocket'" style="vertical-align: -5px; margin-right: 8px;"></mat-icon>
              {{ isExecuting ? 'Exécution en cours...' : 'Exécuter Pipeline' }}
            </button>
          </div>
        </div>

        <!-- Pipeline Progress -->
        <div class="card" *ngIf="pipelineProgress">
          <div class="card-header">
            <span style="display: inline-flex; align-items: center; gap: 10px;">
              <mat-icon svgIcon="chart"></mat-icon>
              Progression du Pipeline
            </span>
          </div>
          <div class="card-body">
            <div class="progress-container">
              <div class="stage" *ngFor="let stage of pipelineStages">
                <div class="stage-name">{{ stage }}</div>
                <div class="stage-status" [ngClass]="getStageStatus(stage)">
                  {{ getStageStatusText(stage) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Results -->
        <div class="card" *ngIf="pipelineResults">
          <div class="card-header">
            <span style="display: inline-flex; align-items: center; gap: 10px;">
              <mat-icon svgIcon="chart"></mat-icon>
              Résultats du Pipeline
            </span>
          </div>
          <div class="card-body">
            <div class="results-grid">
            <!-- Collection Results -->
            <div class="result-card" *ngIf="pipelineResults.collection">
              <h3 style="display: inline-flex; align-items: center; gap: 10px;">
                <mat-icon svgIcon="database"></mat-icon>
                Collection
              </h3>
              <div class="result-content">
                <p><strong>Dataset:</strong> {{ pipelineResults.collection.data.datasetName }}</p>
                <p><strong>Samples:</strong> {{ pipelineResults.collection.data.totalSamples }}</p>
                <p><strong>Features:</strong> {{ pipelineResults.collection.data.features }}</p>
                <p><strong>Classes:</strong> {{ pipelineResults.collection.data.classes }}</p>
              </div>
            </div>

            <!-- Preprocessing Results -->
            <div class="result-card" *ngIf="pipelineResults.preprocessing">
              <h3 style="display: inline-flex; align-items: center; gap: 10px;">
                <mat-icon svgIcon="settings"></mat-icon>
                Preprocessing
              </h3>
              <div class="result-content">
                <p><strong>Normalization:</strong> {{ pipelineResults.preprocessing.data.normalizationMethod }}</p>
                <p><strong>Train Ratio:</strong> {{ pipelineResults.preprocessing.data.trainRatio }}</p>
                <p><strong>Test Ratio:</strong> {{ pipelineResults.preprocessing.data.testRatio }}</p>
                <p><strong>Val Ratio:</strong> {{ pipelineResults.preprocessing.data.valRatio }}</p>
              </div>
            </div>

            <!-- Training Results -->
            <div class="result-card" *ngIf="pipelineResults.training">
              <h3 style="display: inline-flex; align-items: center; gap: 10px;">
                <mat-icon svgIcon="cap"></mat-icon>
                Training
              </h3>
              <div class="result-content">
                <p><strong>Accuracy:</strong> {{ (pipelineResults.training.data.accuracy * 100).toFixed(2) }}%</p>
                <p><strong>Loss:</strong> {{ pipelineResults.training.data.loss.toFixed(4) }}</p>
                <p><strong>Val Accuracy:</strong> {{ (pipelineResults.training.data.valAccuracy * 100).toFixed(2) }}%</p>
                <p><strong>Duration:</strong> {{ pipelineResults.training.data.duration }}s</p>
              </div>
            </div>

            <!-- Evaluation Results -->
            <div class="result-card" *ngIf="pipelineResults.evaluation">
              <h3 style="display: inline-flex; align-items: center; gap: 10px;">
                <mat-icon svgIcon="check"></mat-icon>
                Evaluation
              </h3>
              <div class="result-content">
                <p><strong>Accuracy:</strong> {{ (pipelineResults.evaluation.data.accuracy * 100).toFixed(2) }}%</p>
                <p><strong>Precision:</strong> {{ (pipelineResults.evaluation.data.precision * 100).toFixed(2) }}%</p>
                <p><strong>Recall:</strong> {{ (pipelineResults.evaluation.data.recall * 100).toFixed(2) }}%</p>
                <p><strong>F1 Score:</strong> {{ pipelineResults.evaluation.data.f1Score.toFixed(4) }}</p>
              </div>
            </div>

            <!-- Testing Results -->
            <div class="result-card" *ngIf="pipelineResults.testing">
              <h3 style="display: inline-flex; align-items: center; gap: 10px;">
                <mat-icon svgIcon="flask"></mat-icon>
                Testing
              </h3>
              <div class="result-content">
                <p><strong>Test Accuracy:</strong> {{ (pipelineResults.testing.data.accuracy * 100).toFixed(2) }}%</p>
                <p><strong>Inference Time:</strong> {{ pipelineResults.testing.data.inferenceTime }}ms</p>
                <p><strong>Throughput:</strong> {{ pipelineResults.testing.data.throughput }} samples/s</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <div class="card" *ngIf="errorMessage" style="border-left: 4px solid #ef4444;">
          <div class="card-body" style="color: #dc2626; background-color: #fee2e2;">
            <span style="display: inline-flex; align-items: center; gap: 10px;">
              <mat-icon svgIcon="x"></mat-icon>
              {{ errorMessage }}
            </span>
          </div>
        </div>

        <!-- Success Message -->
        <div class="card" *ngIf="successMessage" style="border-left: 4px solid #10b981;">
          <div class="card-body" style="color: #065f46; background-color: #d1fae5;">
            <span style="display: inline-flex; align-items: center; gap: 10px;">
              <mat-icon svgIcon="check"></mat-icon>
              {{ successMessage }}
            </span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .mlops-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }

    .mlops-header {
      text-align: center;
      margin-bottom: 40px;
    }

    .mlops-header h1 {
      margin: 0;
      font-size: 2.5rem;
      font-weight: 700;
      color: #0066ff;
    }

    .mlops-header p {
      margin: 10px 0 0 0;
      font-size: 1rem;
      color: #666;
    }

    .mlops-content {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      color: #333;
      font-size: 0.875rem;
    }

    .input-field {
      width: 100%;
      padding: 10px;
      border: 2px solid #e0e0e0;
      border-radius: 6px;
      font-size: 0.875rem;
      font-family: inherit;
    }

    .input-field:focus {
      outline: none;
      border-color: #0066ff;
      box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.1);
    }

    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .progress-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
    }

    .stage {
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;
      text-align: center;
    }

    .stage-name {
      font-weight: 600;
      color: #333;
      margin-bottom: 8px;
      text-transform: capitalize;
    }

    .stage-status {
      padding: 8px;
      border-radius: 4px;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .stage-status.completed {
      background: #d1fae5;
      color: #065f46;
    }

    .stage-status.pending {
      background: #fef3c7;
      color: #92400e;
    }

    .results-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
    }

    .result-card {
      padding: 16px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
    }

    .result-card h3 {
      margin: 0 0 12px 0;
      font-size: 1rem;
      color: #0066ff;
    }

    .result-content p {
      margin: 8px 0;
      font-size: 0.875rem;
      color: #555;
    }
  `]
})
export class MlopsComponent implements OnInit {
  pipelineName = '';
  pipelineDescription = '';
  currentPipeline: any = null;
  selectedDataset = '';
  isExecuting = false;
  errorMessage = '';
  successMessage = '';
  pipelineProgress: any = null;
  pipelineResults: any = null;

  pipelineStages = ['collection', 'preprocessing', 'training', 'evaluation', 'testing'];
  completedStages: string[] = [];

  trainingParams = {
    epochs: 50,
    batchSize: 32,
    learningRate: 0.001
  };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.initializeComponent();
  }

  initializeComponent() {
    console.log('MLops Component initialized');
  }

  createPipeline() {
    if (!this.pipelineName) {
      this.errorMessage = 'Veuillez entrer un nom pour le pipeline';
      return;
    }

    const payload = {
      name: this.pipelineName,
      description: this.pipelineDescription,
      config: {}
    };

    this.http.post('http://localhost:3000/api/mlops/pipeline/create', payload)
      .subscribe(
        (response: any) => {
          if (response.success) {
            this.currentPipeline = response.pipeline;
            this.successMessage = `Pipeline créé: ${response.pipeline.id}`;
            this.errorMessage = '';
          }
        },
        (error) => {
          this.errorMessage = 'Erreur lors de la création du pipeline';
          console.error(error);
        }
      );
  }

  executePipeline() {
    if (!this.currentPipeline || !this.selectedDataset) {
      this.errorMessage = 'Veuillez sélectionner un dataset';
      return;
    }

    this.isExecuting = true;
    this.completedStages = [];
    this.pipelineProgress = { stages: this.pipelineStages };

    const payload = {
      dataset: {
        name: this.selectedDataset,
        totalSamples: 70000,
        features: 784,
        classes: 10,
        fileType: 'csv'
      },
      preprocessing: {
        normalizationMethod: 'minmax',
        augmentationTypes: ['rotation', 'zoom'],
        trainRatio: 0.7,
        testRatio: 0.2,
        valRatio: 0.1
      },
      training: this.trainingParams,
      evaluation: {},
      testing: {
        testDatasetName: 'test_set',
        testSamples: 1000
      }
    };

    this.http.post(
      `http://localhost:3000/api/mlops/pipeline/${this.currentPipeline.id}/execute`,
      payload
    ).subscribe(
      (response: any) => {
        if (response.success) {
          this.completedStages = this.pipelineStages;
          this.getPipelineResults();
          this.successMessage = 'Pipeline exécuté avec succès!';
          this.errorMessage = '';
        }
        this.isExecuting = false;
      },
      (error) => {
        this.errorMessage = 'Erreur lors de l\'exécution du pipeline';
        this.isExecuting = false;
        console.error(error);
      }
    );
  }

  getPipelineResults() {
    this.http.get(
      `http://localhost:3000/api/mlops/pipeline/${this.currentPipeline.id}/results`
    ).subscribe(
      (response: any) => {
        if (response.success) {
          this.pipelineResults = response.results;
        }
      },
      (error) => {
        console.error('Erreur lors de la récupération des résultats:', error);
      }
    );
  }

  getStageStatus(stage: string): string {
    if (this.completedStages.includes(stage)) {
      return 'completed';
    }
    return 'pending';
  }

  getStageStatusText(stage: string): string {
    if (this.completedStages.includes(stage)) {
      return 'Complété';
    }
    return 'En attente';
  }
}
