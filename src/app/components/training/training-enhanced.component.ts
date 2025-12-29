import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { ToastComponent } from '../toast/toast.component';
import { TrainingMetricsComponent } from '../charts/training-metrics.component';
import { DataTableComponent } from '../data-table/data-table.component';

@Component({
  selector: 'app-training-enhanced',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, ToastComponent, TrainingMetricsComponent, DataTableComponent],
  template: `
    <app-toast></app-toast>
    
    <div style="min-height: calc(100vh - 70px); background: linear-gradient(135deg, #0066ff 0%, #00d4ff 50%, #7209b7 100%); padding: 32px 24px;">
      <div style="max-width: 1400px; margin: 0 auto;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="margin: 0; font-size: 2.5rem; font-weight: 700; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
            <mat-icon svgIcon="cap" style="vertical-align: -6px; margin-right: 10px; color: rgba(255,255,255,0.95);"></mat-icon>
            Model Training
          </h1>
          <p style="margin: 10px 0 0 0; font-size: 1rem; color: rgba(255,255,255,0.9);">Configure and train your neural network models</p>
        </div>

        <!-- Training Controls -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; margin-bottom: 30px;">
          <!-- Model Selection -->
          <div style="background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden;">
            <div style="background: linear-gradient(135deg, #7209b7 0%, #b5179e 100%); color: white; padding: 16px; border-radius: 12px 12px 0 0;">
              <h3 style="margin: 0; font-size: 1.125rem; font-weight: 600; display:flex; align-items:center; gap: 10px;">
                <mat-icon svgIcon="robot" style="color: rgba(255,255,255,0.95);"></mat-icon>
                Select Model
              </h3>
            </div>
            <div style="padding: 16px;">
              <div style="margin-bottom: 12px;">
                <label style="display: block; font-size: 0.875rem; font-weight: 600; color: #333; margin-bottom: 4px;">Available Models</label>
                <select [(ngModel)]="selectedModelId" (ngModelChange)="onModelSelectionChange($event)" [disabled]="loadingModels" style="width: 100%; padding: 8px; border: 2px solid #e0e0e0; border-radius: 6px; background: white;">
                  <option *ngIf="loadingModels" disabled>Loading models...</option>
                  <option *ngIf="!loadingModels && availableModels.length === 0" disabled>No models available</option>
                  <option *ngFor="let model of availableModels" [value]="model.id">{{ model.name }} ({{ model.layers }} layers)</option>
                </select>
              </div>
              <div *ngIf="selectedModelId" style="padding: 12px; background: #f0f4ff; border-radius: 6px; border-left: 4px solid #7209b7;">
                <p style="margin: 0 0 4px 0; font-size: 0.875rem; color: #333; font-weight: 600;">Selected Model Info</p>
                <p *ngIf="selectedModelName" style="margin: 0 0 2px 0; font-size: 0.75rem; color: #666;">Name: {{ selectedModelName }}</p>
                <p style="margin: 0 0 2px 0; font-size: 0.75rem; color: #666;">ID: {{ selectedModelId }}</p>
                <p style="margin: 0; font-size: 0.75rem; color: #666;">Models: {{ availableModels.length }} available</p>
              </div>
            </div>
          </div>

          <!-- Training Parameters -->
          <div style="background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden;">
            <div style="background: linear-gradient(135deg, #0066ff 0%, #00d4ff 100%); color: white; padding: 16px; border-radius: 12px 12px 0 0;">
              <h3 style="margin: 0; font-size: 1.125rem; font-weight: 600; display:flex; align-items:center; gap: 10px;">
                <mat-icon svgIcon="settings" style="color: rgba(255,255,255,0.95);"></mat-icon>
                Training Parameters
              </h3>
            </div>
            <div style="padding: 16px;">
              <div style="margin-bottom: 12px;">
                <label style="display: block; font-size: 0.875rem; font-weight: 600; color: #333; margin-bottom: 4px;">Epochs</label>
                <input type="number" [(ngModel)]="epochs" min="1" max="1000" style="width: 100%; padding: 8px; border: 2px solid #e0e0e0; border-radius: 6px;" />
              </div>
              <div style="margin-bottom: 12px;">
                <label style="display: block; font-size: 0.875rem; font-weight: 600; color: #333; margin-bottom: 4px;">Batch Size</label>
                <input type="number" [(ngModel)]="batchSize" min="1" max="256" style="width: 100%; padding: 8px; border: 2px solid #e0e0e0; border-radius: 6px;" />
              </div>
              <div style="margin-bottom: 12px;">
                <label style="display: block; font-size: 0.875rem; font-weight: 600; color: #333; margin-bottom: 4px;">Learning Rate</label>
                <input type="number" [(ngModel)]="learningRate" min="0.0001" max="0.1" step="0.0001" style="width: 100%; padding: 8px; border: 2px solid #e0e0e0; border-radius: 6px;" />
              </div>
              <div style="margin-bottom: 12px;">
                <label style="display: block; font-size: 0.875rem; font-weight: 600; color: #333; margin-bottom: 4px;">Validation Split</label>
                <input type="number" [(ngModel)]="validationSplit" min="0" max="1" step="0.1" style="width: 100%; padding: 8px; border: 2px solid #e0e0e0; border-radius: 6px;" />
              </div>
              <button (click)="startTraining()" [disabled]="isTraining || !selectedModelId" style="width: 100%; padding: 10px; margin-top: 8px; background: linear-gradient(90deg, #0066ff 0%, #00d4ff 100%); color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; transition: all 0.3s; opacity: {{ isTraining || !selectedModelId ? 0.6 : 1 }};">
                <mat-icon [svgIcon]="isTraining ? 'refresh' : 'play'" style="vertical-align: -5px; margin-right: 8px; color: rgba(255,255,255,0.95);"></mat-icon>
                {{ isTraining ? 'Training...' : 'Start Training' }}
              </button>
            </div>
          </div>

          <!-- Training Status -->
          <div style="background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden;">
            <div style="background: linear-gradient(135deg, #0066ff 0%, #00d4ff 100%); color: white; padding: 16px; border-radius: 12px 12px 0 0;">
              <h3 style="margin: 0; font-size: 1.125rem; font-weight: 600;"> Training Status</h3>
            </div>
            <div style="padding: 16px;">
              <div style="margin-bottom: 12px;">
                <p style="margin: 0 0 4px 0; font-size: 0.875rem; color: #666; font-weight: 600;">Status</p>
                <p style="margin: 0; font-size: 1.125rem; font-weight: 600; color: #0066ff;">{{ trainingStatus || 'Ready' }}</p>
              </div>
              <div style="margin-bottom: 12px;">
                <p style="margin: 0 0 4px 0; font-size: 0.875rem; color: #666; font-weight: 600;">Progress</p>
                <div style="width: 100%; height: 12px; background: #e5e7eb; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <div [style.width.%]="trainingProgress" style="height: 100%; background: linear-gradient(90deg, #0066ff 0%, #00d4ff 100%); transition: width 0.2s; box-shadow: 0 0 10px rgba(0, 102, 255, 0.5);"></div>
                </div>
                <p style="margin: 4px 0 0 0; font-size: 0.875rem; color: #0066ff; font-weight: 600;">{{ trainingProgress }}%</p>
              </div>
            </div>
          </div>

          <!-- Evaluation -->
          <div style="background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden;">
            <div style="background: linear-gradient(135deg, #0066ff 0%, #00d4ff 100%); color: white; padding: 16px; border-radius: 12px 12px 0 0;">
              <h3 style="margin: 0; font-size: 1.125rem; font-weight: 600;"> Evaluation</h3>
            </div>
            <div style="padding: 16px;">
              <div style="margin-bottom: 12px;">
                <label style="display: block; font-size: 0.875rem; font-weight: 600; color: #333; margin-bottom: 4px;">Dataset</label>
                <select [(ngModel)]="evaluationDataset" style="width: 100%; padding: 8px; border: 2px solid #e0e0e0; border-radius: 6px; background: white;">
                  <option value="test">test</option>
                  <option value="val">val</option>
                </select>
              </div>
              <button (click)="evaluateModel()" [disabled]="!isTraining && !trainingCompleted" style="width: 100%; padding: 10px; background: linear-gradient(90deg, #10b981 0%, #059669 100%); color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; margin-bottom: 12px;">
                Evaluate Model
              </button>
              <div *ngIf="evaluationMetrics" style="padding: 12px; background: #f0fdf4; border-radius: 6px; border-left: 4px solid #10b981;">
                <p style="margin: 0 0 6px 0; font-size: 0.875rem; color: #065f46; font-weight: 600;">Dataset: {{ evaluationDataset }}</p>
                <p style="margin: 0 0 4px 0; font-size: 0.875rem; color: #065f46;">Accuracy: {{ (evaluationMetrics.accuracy * 100).toFixed(2) }}%</p>
                <p style="margin: 0; font-size: 0.875rem; color: #065f46;">Loss: {{ evaluationMetrics.loss.toFixed(4) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Metrics Charts -->
        <div style="margin-top: 40px;">
          <app-training-metrics [trainingHistory]="chartHistory" [isTraining]="isTraining"></app-training-metrics>
        </div>

        <!-- Training History Table -->
        <app-data-table 
          [config]="trainingHistoryConfig"
          style="margin-top: 30px;">
        </app-data-table>
      </div>
    </div>
  `
})
export class TrainingEnhancedComponent implements OnInit {
  epochs = 10;
  batchSize = 32;
  learningRate = 0.001;
  validationSplit = 0.2;
  isTraining = false;
  trainingStatus = '';
  trainingProgress = 0;
  trainingCompleted = false;
  evaluationMetrics: any = null;
  evaluationDataset: 'test' | 'val' = 'test';
  selectedModelName: string | null = null;
  private trainingStatusInterval: any = null;
  chartHistory: any[] = [];
  
  // Model selection
  availableModels: any[] = [];
  selectedModelId: string | null = null;
  loadingModels = false;

  trainingHistoryConfig: any = {
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'epochs', label: 'Epochs' },
      { key: 'batchSize', label: 'Batch Size' },
      { key: 'accuracy', label: 'Accuracy' },
      { key: 'loss', label: 'Loss' },
      { key: 'date', label: 'Date' }
    ],
    data: [],
    pageSize: 5
  };

  constructor(
    private apiService: ApiService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadTrainingHistory();
    this.loadAvailableModels();
  }

  loadAvailableModels() {
    this.loadingModels = true;
    this.apiService.getModels().subscribe(
      (response: any) => {
        this.availableModels = response.models || [];
        if (this.availableModels.length > 0) {
          this.selectedModelId = this.availableModels[0].id;
          this.selectedModelName = this.availableModels[0].name;
        }
        this.loadingModels = false;
      },
      (error: any) => {
        console.error('Error loading models:', error);
        this.toastService.error('Failed to load models', 3000);
        this.loadingModels = false;
      }
    );
  }

  onModelSelectionChange(modelId: string | null) {
    this.selectedModelId = modelId;
    const match = this.availableModels.find(m => m.id === modelId);
    this.selectedModelName = match?.name || null;
  }

  startTraining() {
    if (!this.selectedModelId) {
      this.toastService.error('Please select a model first', 3000);
      return;
    }

    this.isTraining = true;
    this.trainingStatus = 'Starting training...';
    this.trainingProgress = 0;
    this.trainingCompleted = false;

    const trainingConfig = {
      epochs: this.epochs,
      batchSize: this.batchSize,
      learningRate: this.learningRate,
      validationSplit: this.validationSplit,
      modelId: this.selectedModelId
    };

    this.apiService.startTraining(trainingConfig).subscribe(
      (response: any) => {
        this.toastService.success('Training started successfully', 3000);
        this.startPollingTrainingStatus(this.selectedModelId!);
      },
      (error: any) => {
        this.isTraining = false;
        this.toastService.error('Failed to start training: ' + error.error?.message, 5000);
      }
    );
  }

  private startPollingTrainingStatus(modelId: string) {
    if (this.trainingStatusInterval) {
      clearInterval(this.trainingStatusInterval);
      this.trainingStatusInterval = null;
    }

    const pollOnce = () => {
      this.apiService.getTrainingStatus(modelId).subscribe(
        (resp: any) => {
          const s = resp?.status;
          if (!s) return;

          const progress = Number(s.progress ?? 0);
          this.trainingProgress = Number.isFinite(progress) ? Math.max(0, Math.min(100, progress)) : 0;

          if (s.status === 'completed') {
            this.trainingStatus = 'Training completed!';
            this.trainingProgress = 100;
            if (this.trainingStatusInterval) {
              clearInterval(this.trainingStatusInterval);
              this.trainingStatusInterval = null;
            }
            this.completeTraining();
            return;
          }

          if (s.status === 'failed') {
            this.isTraining = false;
            this.trainingCompleted = false;
            this.trainingStatus = 'Training failed';
            if (this.trainingStatusInterval) {
              clearInterval(this.trainingStatusInterval);
              this.trainingStatusInterval = null;
            }
            this.toastService.error('Training failed: ' + (s.error || 'Unknown error'), 6000);
            return;
          }

          const epoch = Number(s.epoch ?? 0);
          const epochs = Number(s.epochs ?? 0);
          if (epochs > 0) {
            this.trainingStatus = `Training... Epoch ${epoch}/${epochs}`;
          } else {
            this.trainingStatus = `Training... ${Math.round(this.trainingProgress)}%`;
          }
        },
        () => {
          // Ignore transient polling errors
        }
      );
    };

    pollOnce();
    this.trainingStatusInterval = setInterval(pollOnce, 500);
  }

  completeTraining() {
    this.isTraining = false;
    this.trainingProgress = 100;
    this.trainingStatus = 'Training completed!';
    this.trainingCompleted = true;
    this.toastService.success('Training completed successfully!', 5000);
    
    // ✅ Récupérer les vraies données du backend
    this.apiService.getTrainingHistory().subscribe(
      (response: any) => {
        const history = response.history?.data || [];
        if (history.length > 0) {
          // Utiliser les vraies données (afficher la dernière valeur d'epoch)
          this.trainingHistoryConfig.data = history.map((h: any) => {
            const accArr = h.history?.history?.acc || [];
            const lossArr = h.history?.history?.loss || [];
            const lastAcc = accArr.length ? accArr[accArr.length - 1] : 0;
            const lastLoss = lossArr.length ? lossArr[lossArr.length - 1] : 0;
            return {
              id: h.modelId,
              epochs: h.config?.epochs || 'N/A',
              batchSize: h.config?.batchSize || 'N/A',
              accuracy: (Number(lastAcc) * 100).toFixed(2) + '%',
              loss: Number(lastLoss).toFixed(4),
              date: new Date(h.timestamp).toISOString().split('T')[0]
            };
          });

          this.refreshChartHistoryFromSessions(history);
          this.toastService.success('Training history updated!', 3000);
        }
      },
      (error: any) => {
        console.error('Error loading training history:', error);
        this.toastService.error('Failed to load training history', 3000);
      }
    );
  }

  evaluateModel() {
    if (!this.selectedModelId) {
      this.toastService.error('Please select a model first', 3000);
      return;
    }

    this.toastService.info('Evaluating model...', 3000);
    this.apiService.evaluateModel(this.evaluationDataset, this.selectedModelId).subscribe(
      (resp: any) => {
        const evaluation = resp?.evaluation;
        if (!evaluation) {
          this.toastService.error('No evaluation returned by server', 4000);
          return;
        }

        this.evaluationMetrics = {
          accuracy: evaluation.accuracy,
          loss: evaluation.loss
        };
        this.toastService.success('Model evaluated successfully!', 3000);
      },
      (error: any) => {
        this.toastService.error('Evaluation failed: ' + (error?.error?.message || error?.message || 'Unknown error'), 6000);
      }
    );
  }

  loadTrainingHistory() {
    // ✅ Charger l'historique depuis le backend
    this.apiService.getTrainingHistory().subscribe(
      (response: any) => {
        const history = response.history?.data || [];
        this.trainingHistoryConfig.data = history.map((h: any) => {
          const accArr = h.history?.history?.acc || [];
          const lossArr = h.history?.history?.loss || [];
          const lastAcc = accArr.length ? accArr[accArr.length - 1] : 0;
          const lastLoss = lossArr.length ? lossArr[lossArr.length - 1] : 0;
          return {
            id: h.modelId,
            epochs: h.config?.epochs || 'N/A',
            batchSize: h.config?.batchSize || 'N/A',
            accuracy: (Number(lastAcc) * 100).toFixed(2) + '%',
            loss: Number(lastLoss).toFixed(4),
            date: new Date(h.timestamp).toISOString().split('T')[0]
          };
        });

        this.refreshChartHistoryFromSessions(history);
      },
      (error: any) => {
        console.error('Error loading training history:', error);
      }
    );
  }

  private refreshChartHistoryFromSessions(sessions: any[]) {
    if (!sessions || sessions.length === 0) {
      this.chartHistory = [];
      return;
    }

    const selectedId = this.selectedModelId;
    const filtered = selectedId ? sessions.filter(s => s.modelId === selectedId) : sessions;
    const lastSession = filtered.length ? filtered[filtered.length - 1] : sessions[sessions.length - 1];

    const hist = lastSession?.history?.history;
    const lossArr = Array.isArray(hist?.loss) ? hist.loss : [];
    const accArr = Array.isArray(hist?.acc) ? hist.acc : [];
    const valLossArr = Array.isArray(hist?.val_loss) ? hist.val_loss : [];
    const valAccArr = Array.isArray(hist?.val_acc) ? hist.val_acc : [];

    const n = Math.max(lossArr.length, accArr.length, valLossArr.length, valAccArr.length);
    this.chartHistory = Array.from({ length: n }, (_, i) => ({
      epoch: i + 1,
      loss: lossArr[i] ?? null,
      accuracy: accArr[i] ?? null,
      valLoss: valLossArr[i] ?? null,
      valAccuracy: valAccArr[i] ?? null
    }));
  }
}
