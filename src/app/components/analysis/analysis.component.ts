import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import html2canvas from 'html2canvas';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { ToastComponent } from '../toast/toast.component';
import { TrainingMetricsComponent } from '../charts/training-metrics.component';
import { ConfusionMatrixComponent } from '../charts/confusion-matrix.component';
import { RocCurveComponent } from '../charts/roc-curve.component';
import { FeatureImportanceComponent } from '../charts/feature-importance.component';
import { ModelComparisonComponent } from '../charts/model-comparison.component';
import { DataTableComponent } from '../data-table/data-table.component';

@Component({
  selector: 'app-analysis',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    ToastComponent,
    TrainingMetricsComponent,
    ConfusionMatrixComponent,
    RocCurveComponent,
    FeatureImportanceComponent,
    ModelComparisonComponent,
    DataTableComponent
  ],
  template: `
    <app-toast></app-toast>
    
    <div style="min-height: calc(100vh - 70px); background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%); padding: 32px 24px;">
      <div style="max-width: 1400px; margin: 0 auto;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="margin: 0; font-size: 2.5rem; font-weight: 700; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
            <mat-icon svgIcon="chart" style="vertical-align: -6px; margin-right: 10px; color: rgba(255,255,255,0.95);"></mat-icon>
            Model Analysis & Results
          </h1>
          <p style="margin: 10px 0 0 0; font-size: 1rem; color: rgba(255,255,255,0.9);">Visualize training metrics, performance, and predictions</p>
        </div>

        <!-- Controls -->
        <div style="background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); padding: 24px; margin-bottom: 30px;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px;">
            <!-- Model Selection -->
            <div>
              <label style="display: block; font-size: 0.875rem; font-weight: 600; color: #333; margin-bottom: 8px;">Select Model</label>
              <select [(ngModel)]="selectedModelId" (change)="onModelChange()" style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 6px; background: white;">
                <option *ngFor="let model of availableModels" [value]="model.id">{{ model.name }}</option>
              </select>
            </div>

            <!-- Analysis Type -->
            <div>
              <label style="display: block; font-size: 0.875rem; font-weight: 600; color: #333; margin-bottom: 8px;">Analysis Type</label>
              <select [(ngModel)]="analysisType" (change)="onAnalysisTypeChange()" style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 6px; background: white;">
                <option value="training">Training Metrics</option>
                <option value="confusion">Confusion Matrix</option>
                <option value="roc">ROC Curve</option>
                <option value="feature">Feature Importance</option>
                <option value="comparison">Model Comparison</option>
              </select>
            </div>

            <!-- Refresh Button -->
            <div style="display: flex; align-items: flex-end;">
              <button (click)="refreshAnalysis()" style="width: 100%; padding: 10px; background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">
                <mat-icon svgIcon="refresh" style="vertical-align: -5px; margin-right: 8px; color: rgba(255,255,255,0.95);"></mat-icon>
                Refresh Data
              </button>
            </div>
          </div>

          <div style="height: 1px; background: #eee; margin: 20px 0;"></div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px;">
            <div>
              <label style="display: block; font-size: 0.875rem; font-weight: 600; color: #333; margin-bottom: 8px;">Report Scope</label>
              <select [(ngModel)]="reportScope" style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 6px; background: white;">
                <option value="selected">Selected model</option>
                <option value="all">All models</option>
              </select>
            </div>

            <div>
              <label style="display: block; font-size: 0.875rem; font-weight: 600; color: #333; margin-bottom: 8px;">Report Dataset</label>
              <select [(ngModel)]="reportDataset" style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 6px; background: white;">
                <option value="test">Test</option>
                <option value="val">Validation</option>
              </select>
            </div>

            <div style="display: flex; align-items: flex-end; gap: 12px;">
              <button (click)="exportPdf()" [disabled]="isExportingPdf" style="flex: 1; padding: 10px; background: #0ea5e9; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; opacity: {{isExportingPdf ? 0.7 : 1}};">
                <mat-icon [svgIcon]="isExportingPdf ? 'refresh' : 'file'" style="vertical-align: -5px; margin-right: 8px; color: rgba(255,255,255,0.95);"></mat-icon>
                {{ isExportingPdf ? 'Exporting...' : 'Export PDF' }}
              </button>
              <button (click)="openEmailModal()" style="flex: 1; padding: 10px; background: #10b981; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">
                <mat-icon svgIcon="mail" style="vertical-align: -5px; margin-right: 8px; color: rgba(255,255,255,0.95);"></mat-icon>
                Send Email
              </button>
            </div>
          </div>
        </div>

        <div *ngIf="isEmailModalOpen" style="position: fixed; inset: 0; background: rgba(0,0,0,0.55); display: flex; align-items: center; justify-content: center; padding: 24px; z-index: 50;">
          <div style="width: 100%; max-width: 720px; background: white; border-radius: 14px; box-shadow: 0 10px 40px rgba(0,0,0,0.25); padding: 22px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
              <h2 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: #111;">Send Analysis Report</h2>
              <button (click)="closeEmailModal()" style="background: transparent; border: none; cursor: pointer;">
                <mat-icon svgIcon="x"></mat-icon>
              </button>
            </div>

            <div style="display: grid; grid-template-columns: 1fr; gap: 12px;">
              <div>
                <label style="display: block; font-size: 0.875rem; font-weight: 600; color: #333; margin-bottom: 6px;">To (comma-separated)</label>
                <input [(ngModel)]="reportEmailTo" type="text" placeholder="example@domain.com, second@domain.com" style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 6px;" />
              </div>
              <div>
                <label style="display: block; font-size: 0.875rem; font-weight: 600; color: #333; margin-bottom: 6px;">Subject</label>
                <input [(ngModel)]="reportEmailSubject" type="text" style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 6px;" />
              </div>
              <div>
                <label style="display: block; font-size: 0.875rem; font-weight: 600; color: #333; margin-bottom: 6px;">Message</label>
                <textarea [(ngModel)]="reportEmailMessage" rows="4" style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 6px; resize: vertical;"></textarea>
              </div>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px;">
              <button (click)="closeEmailModal()" [disabled]="isSendingEmail" style="padding: 10px 14px; background: #e5e7eb; color: #111; border: none; border-radius: 6px; font-weight: 700; cursor: pointer; opacity: {{isSendingEmail ? 0.7 : 1}};">Cancel</button>
              <button (click)="sendReportEmail()" [disabled]="isSendingEmail" style="padding: 10px 14px; background: #10b981; color: white; border: none; border-radius: 6px; font-weight: 700; cursor: pointer; opacity: {{isSendingEmail ? 0.7 : 1}};">
                <mat-icon [svgIcon]="isSendingEmail ? 'refresh' : 'mail'" style="vertical-align: -5px; margin-right: 8px; color: rgba(255,255,255,0.95);"></mat-icon>
                {{ isSendingEmail ? 'Sending...' : 'Send' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Statistics Cards -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 30px;">
          <!-- Total Sessions -->
          <div style="background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); padding: 20px;">
            <p style="margin: 0 0 8px 0; font-size: 0.875rem; color: #666; font-weight: 600;">Total Training Sessions</p>
            <p style="margin: 0; font-size: 2rem; font-weight: 700; color: #667eea;">{{ totalSessions }}</p>
          </div>

          <!-- Best Accuracy -->
          <div style="background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); padding: 20px;">
            <p style="margin: 0 0 8px 0; font-size: 0.875rem; color: #666; font-weight: 600;">Best Accuracy</p>
            <p style="margin: 0; font-size: 2rem; font-weight: 700; color: #10b981;">{{ bestAccuracy }}%</p>
          </div>

          <!-- Lowest Loss -->
          <div style="background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); padding: 20px;">
            <p style="margin: 0 0 8px 0; font-size: 0.875rem; color: #666; font-weight: 600;">Lowest Loss</p>
            <p style="margin: 0; font-size: 2rem; font-weight: 700; color: #f59e0b;">{{ lowestLoss }}</p>
          </div>

          <!-- Models Count -->
          <div style="background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); padding: 20px;">
            <p style="margin: 0 0 8px 0; font-size: 0.875rem; color: #666; font-weight: 600;">Models Trained</p>
            <p style="margin: 0; font-size: 2rem; font-weight: 700; color: #8b5cf6;">{{ modelsTrained }}</p>
          </div>
        </div>

        <!-- Charts Section -->
        <div *ngIf="analysisType === 'training'" style="margin-bottom: 30px;">
          <app-training-metrics [trainingHistory]="trainingHistory" [isTraining]="false"></app-training-metrics>
        </div>

        <div *ngIf="analysisType === 'confusion'" style="margin-bottom: 30px;">
          <app-confusion-matrix [trainingHistory]="trainingHistory" [confusionData]="confusionData"></app-confusion-matrix>
        </div>

        <div *ngIf="analysisType === 'roc'" style="margin-bottom: 30px;">
          <app-roc-curve [trainingHistory]="trainingHistory" [rocData]="rocData"></app-roc-curve>
        </div>

        <div *ngIf="analysisType === 'feature'" style="margin-bottom: 30px;">
          <app-feature-importance [trainingHistory]="trainingHistory" [featureData]="featureData"></app-feature-importance>
        </div>

        <div *ngIf="analysisType === 'comparison'" style="margin-bottom: 30px;">
          <app-model-comparison [trainingHistory]="trainingHistory" [comparisonData]="comparisonData"></app-model-comparison>
        </div>

        <div style="position: absolute; left: -10000px; top: 0; width: 1200px; background: white;">
          <div #captureTraining>
            <app-training-metrics [trainingHistory]="trainingHistory" [isTraining]="false"></app-training-metrics>
          </div>
          <div #captureRoc>
            <app-roc-curve [trainingHistory]="trainingHistory" [rocData]="rocData"></app-roc-curve>
          </div>
          <div #captureFeature>
            <app-feature-importance [trainingHistory]="trainingHistory" [featureData]="featureData"></app-feature-importance>
          </div>
          <div #captureConfusion>
            <app-confusion-matrix [trainingHistory]="trainingHistory" [confusionData]="confusionData"></app-confusion-matrix>
          </div>
          <div #captureComparison>
            <app-model-comparison [trainingHistory]="trainingHistory" [comparisonData]="comparisonData"></app-model-comparison>
          </div>
        </div>

        <!-- Training History Table -->
        <div style="margin-bottom: 30px;">
          <app-data-table 
            [config]="trainingHistoryTableConfig"
            style="margin-top: 30px;">
          </app-data-table>
        </div>

        <!-- Model Details -->
        <div *ngIf="selectedModel" style="background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); padding: 24px; margin-bottom: 30px;">
          <h2 style="margin: 0 0 16px 0; font-size: 1.5rem; font-weight: 600; color: #333; display:flex; align-items:center; gap: 10px;">
            <mat-icon svgIcon="robot"></mat-icon>
            Selected Model Details
          </h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
            <div>
              <p style="margin: 0 0 4px 0; font-size: 0.875rem; color: #666;">Model Name</p>
              <p style="margin: 0; font-size: 1rem; font-weight: 600; color: #333;">{{ selectedModel.name }}</p>
            </div>
            <div>
              <p style="margin: 0 0 4px 0; font-size: 0.875rem; color: #666;">Model ID</p>
              <p style="margin: 0; font-size: 0.875rem; font-weight: 600; color: #667eea; word-break: break-all;">{{ selectedModel.id }}</p>
            </div>
            <div>
              <p style="margin: 0 0 4px 0; font-size: 0.875rem; color: #666;">Layers</p>
              <p style="margin: 0; font-size: 1rem; font-weight: 600; color: #333;">{{ selectedModel.layers }}</p>
            </div>
            <div>
              <p style="margin: 0 0 4px 0; font-size: 0.875rem; color: #666;">Created</p>
              <p style="margin: 0; font-size: 0.875rem; font-weight: 600; color: #333;">{{ selectedModel.createdAt | date:'short' }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AnalysisComponent implements OnInit {
  @ViewChild('captureTraining') captureTraining?: ElementRef<HTMLElement>;
  @ViewChild('captureRoc') captureRoc?: ElementRef<HTMLElement>;
  @ViewChild('captureFeature') captureFeature?: ElementRef<HTMLElement>;
  @ViewChild('captureConfusion') captureConfusion?: ElementRef<HTMLElement>;
  @ViewChild('captureComparison') captureComparison?: ElementRef<HTMLElement>;

  availableModels: any[] = [];
  selectedModelId: string | null = null;
  selectedModel: any = null;
  analysisType: string = 'training';

  reportDataset: 'test' | 'val' = 'test';
  reportScope: 'selected' | 'all' = 'selected';
  isEmailModalOpen = false;
  reportEmailTo = '';
  reportEmailSubject = 'Analysis Report';
  reportEmailMessage = 'Please find the analysis report attached.';
  isExportingPdf = false;
  isSendingEmail = false;
  
  allTrainingHistory: any[] = [];
  trainingHistory: any[] = [];
  confusionData: any = null;
  rocData: any = null;
  featureData: any = null;
  comparisonData: any = null;
  totalSessions = 0;
  bestAccuracy = 0;
  lowestLoss: string | number = 0;
  modelsTrained = 0;

  trainingHistoryTableConfig: any = {
    columns: [
      { key: 'modelId', label: 'Model ID' },
      { key: 'epochs', label: 'Epochs' },
      { key: 'batchSize', label: 'Batch Size' },
      { key: 'loss', label: 'Loss' },
      { key: 'accuracy', label: 'Accuracy' },
      { key: 'timestamp', label: 'Date' }
    ],
    data: [],
    pageSize: 5
  };

  constructor(
    private apiService: ApiService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadModels();
    this.loadTrainingData();
  }

  private getReportModelIds(): string[] {
    if (this.reportScope === 'all') {
      return (this.availableModels || []).map((m: any) => m?.id).filter(Boolean);
    }
    return this.selectedModelId ? [this.selectedModelId] : [];
  }

  openEmailModal() {
    this.isEmailModalOpen = true;
  }

  closeEmailModal() {
    this.isEmailModalOpen = false;
  }

  private async waitForRender(): Promise<void> {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }

  private async ensureReportDataLoaded(modelIds: string[]): Promise<void> {
    // These datasets are only loaded when the user switches tabs.
    // For PDF export we want them all loaded so offscreen blocks are populated.
    try {
      if (this.selectedModelId) {
        const [conf, roc, feat] = await Promise.all([
          firstValueFrom(this.apiService.getConfusionMatrix(this.selectedModelId, this.reportDataset, 5000)),
          firstValueFrom(this.apiService.getRocCurve(this.selectedModelId, this.reportDataset, 5000, 101)),
          firstValueFrom(this.apiService.getFeatureImportance(this.selectedModelId, 20))
        ]);

        this.confusionData = (conf as any)?.confusionMatrix || (conf as any)?.confusion || null;
        this.rocData = (roc as any)?.roc || null;
        this.featureData = (feat as any)?.featureImportance || null;
      } else {
        this.confusionData = null;
        this.rocData = null;
        this.featureData = null;
      }
    } catch (e) {
      // keep existing values
    }

    try {
      if (modelIds.length) {
        const resp = await firstValueFrom(this.apiService.getModelComparison(modelIds, this.reportDataset, 5000));
        this.comparisonData = (resp as any)?.comparison || null;
      } else {
        this.comparisonData = null;
      }
    } catch (e) {
      // keep existing values
    }

    await this.waitForRender();
  }

  private async buildReportImages(): Promise<string[]> {
    const refs: Array<{ key: string; ref?: ElementRef<HTMLElement> }> = [
      { key: 'training', ref: this.captureTraining },
      { key: 'roc', ref: this.captureRoc },
      { key: 'feature', ref: this.captureFeature },
      { key: 'confusion', ref: this.captureConfusion },
      { key: 'comparison', ref: this.captureComparison }
    ];

    const images: string[] = [];

    const modelIds = this.getReportModelIds();
    await this.ensureReportDataLoaded(modelIds);

    for (const item of refs) {
      const el = item.ref?.nativeElement;
      if (!el) continue;

      try {
        const canvas = await html2canvas(el, {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true
        });
        images.push(canvas.toDataURL('image/png'));
      } catch (e) {
        // ignore capture errors for individual blocks
      }
    }

    return images;
  }

  exportPdf() {
    const modelIds = this.getReportModelIds();
    if (!modelIds.length) {
      this.toastService.error('No models selected for report', 3000);
      return;
    }

    this.isExportingPdf = true;

    (async () => {
      const images = await this.buildReportImages();

      this.apiService.exportAnalysisPdf({
        modelIds,
        dataset: this.reportDataset,
        title: 'Analysis Report',
        images
      }).subscribe(
        (blob: Blob) => {
          try {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'analysis-report.pdf';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            this.toastService.success('PDF downloaded', 2500);
          } catch (e) {
            this.toastService.error('Failed to download PDF', 3000);
          } finally {
            this.isExportingPdf = false;
          }
        },
        (error: any) => {
          console.error('Error exporting PDF:', error);
          this.isExportingPdf = false;
          this.toastService.error(error?.error?.message || 'Failed to export PDF', 3000);
        }
      );
    })();
  }

  sendReportEmail() {
    const modelIds = this.getReportModelIds();
    if (!modelIds.length) {
      this.toastService.error('No models selected for report', 3000);
      return;
    }

    if (!this.reportEmailTo || !this.reportEmailTo.trim()) {
      this.toastService.error('Recipient email is required', 3000);
      return;
    }

    const to = this.reportEmailTo
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    this.isSendingEmail = true;

    (async () => {
      const images = await this.buildReportImages();

      this.apiService.emailAnalysisPdf({
        to,
        subject: this.reportEmailSubject,
        message: this.reportEmailMessage,
        modelIds,
        dataset: this.reportDataset,
        title: 'Analysis Report',
        images
      }).subscribe(
        () => {
          this.isSendingEmail = false;
          this.toastService.success('Report sent by email', 3000);
          this.closeEmailModal();
        },
        (error: any) => {
          console.error('Error sending report email:', error);
          this.isSendingEmail = false;
          this.toastService.error(error?.error?.message || 'Failed to send email', 3000);
        }
      );
    })();
  }

  loadModels() {
    this.apiService.getModels().subscribe(
      (response: any) => {
        this.availableModels = response.models || [];
        if (this.availableModels.length > 0) {
          this.selectedModelId = this.availableModels[0].id;
          this.selectedModel = this.availableModels[0];
        }
      },
      (error: any) => {
        console.error('Error loading models:', error);
        this.toastService.error('Failed to load models', 3000);
      }
    );
  }

  loadTrainingData() {
    this.apiService.getTrainingHistory().subscribe(
      (response: any) => {
        const history = response.history?.data || [];
        this.allTrainingHistory = history;
        this.applyModelFilter();
        
        // Calculate statistics
        this.calculateStatistics(this.trainingHistory);
        
        // Prepare table data
        this.trainingHistoryTableConfig.data = this.trainingHistory.map((h: any) => {
          const lossArr = h.history?.history?.loss || [];
          const accArr = h.history?.history?.acc || [];
          const lastLoss = lossArr.length ? lossArr[lossArr.length - 1] : null;
          const lastAcc = accArr.length ? accArr[accArr.length - 1] : null;
          return {
            modelId: h.modelId?.substring(0, 12) + '...' || 'N/A',
            epochs: h.config?.epochs || 'N/A',
            batchSize: h.config?.batchSize || 'N/A',
            loss: lastLoss != null ? Number(lastLoss).toFixed(4) : 'N/A',
            accuracy: lastAcc != null ? (Number(lastAcc) * 100).toFixed(2) + '%' : 'N/A',
            timestamp: new Date(h.timestamp).toLocaleString()
          };
        });
      },
      (error: any) => {
        console.error('Error loading training data:', error);
        this.toastService.error('Failed to load training data', 3000);
      }
    );
  }

  calculateStatistics(history: any[]) {
    if (history.length === 0) return;

    // Best accuracy
    let maxAccuracy = 0;
    history.forEach((h: any) => {
      const accArr = h.history?.history?.acc || [];
      const acc = accArr.length ? accArr[accArr.length - 1] : 0;
      if (acc > maxAccuracy) maxAccuracy = acc;
    });
    this.bestAccuracy = Math.round(maxAccuracy * 100);

    // Lowest loss
    let minLoss = Infinity;
    history.forEach((h: any) => {
      const lossArr = h.history?.history?.loss || [];
      const loss = lossArr.length ? lossArr[lossArr.length - 1] : Infinity;
      if (loss < minLoss) minLoss = loss;
    });
    this.lowestLoss = minLoss === Infinity ? 0 : minLoss.toFixed(4);

    // Models trained
    const uniqueModels = new Set(history.map((h: any) => h.modelId));
    this.modelsTrained = uniqueModels.size;
  }

  onModelChange() {
    const model = this.availableModels.find(m => m.id === this.selectedModelId);
    if (model) {
      this.selectedModel = model;
      this.applyModelFilter();
      this.totalSessions = this.trainingHistory.length;
      this.calculateStatistics(this.trainingHistory);
      this.trainingHistoryTableConfig.data = this.trainingHistory.map((h: any) => {
        const lossArr = h.history?.history?.loss || [];
        const accArr = h.history?.history?.acc || [];
        const lastLoss = lossArr.length ? lossArr[lossArr.length - 1] : null;
        const lastAcc = accArr.length ? accArr[accArr.length - 1] : null;
        return {
          modelId: h.modelId?.substring(0, 12) + '...' || 'N/A',
          epochs: h.config?.epochs || 'N/A',
          batchSize: h.config?.batchSize || 'N/A',
          loss: lastLoss != null ? Number(lastLoss).toFixed(4) : 'N/A',
          accuracy: lastAcc != null ? (Number(lastAcc) * 100).toFixed(2) + '%' : 'N/A',
          timestamp: new Date(h.timestamp).toLocaleString()
        };
      });
      this.toastService.success(`Selected model: ${model.name}`, 2000);

      if (this.analysisType === 'confusion') {
        this.loadConfusionMatrix();
      }

      if (this.analysisType === 'roc') {
        this.loadRocCurve();
      }

      if (this.analysisType === 'feature') {
        this.loadFeatureImportance();
      }

      if (this.analysisType === 'comparison') {
        this.loadModelComparison();
      }
    }
  }

  onAnalysisTypeChange() {
    this.toastService.info(`Switched to ${this.analysisType} analysis`, 2000);

    if (this.analysisType === 'confusion') {
      this.loadConfusionMatrix();
    }

    if (this.analysisType === 'roc') {
      this.loadRocCurve();
    }

    if (this.analysisType === 'feature') {
      this.loadFeatureImportance();
    }

    if (this.analysisType === 'comparison') {
      this.loadModelComparison();
    }
  }

  refreshAnalysis() {
    this.apiService.getTrainingHistory().subscribe(
      (response: any) => {
        this.allTrainingHistory = response.history?.data || [];
        this.applyModelFilter();

        this.totalSessions = this.trainingHistory.length;
        this.calculateStatistics(this.trainingHistory);

        this.trainingHistoryTableConfig.data = this.trainingHistory.map((h: any) => {
          const lossArr = h.history?.history?.loss || [];
          const accArr = h.history?.history?.acc || [];
          const lastLoss = lossArr.length ? lossArr[lossArr.length - 1] : null;
          const lastAcc = accArr.length ? accArr[accArr.length - 1] : null;
          return {
            modelId: h.modelId?.substring(0, 12) + '...' || 'N/A',
            epochs: h.config?.epochs || 'N/A',
            batchSize: h.config?.batchSize || 'N/A',
            loss: lastLoss != null ? Number(lastLoss).toFixed(4) : 'N/A',
            accuracy: lastAcc != null ? (Number(lastAcc) * 100).toFixed(2) + '%' : 'N/A',
            timestamp: new Date(h.timestamp).toLocaleString()
          };
        });
        
        this.toastService.success('Data refreshed', 2000);

        if (this.analysisType === 'confusion') {
          this.loadConfusionMatrix();
        }

        if (this.analysisType === 'roc') {
          this.loadRocCurve();
        }

        if (this.analysisType === 'feature') {
          this.loadFeatureImportance();
        }

        if (this.analysisType === 'comparison') {
          this.loadModelComparison();
        }
      },
      (error: any) => {
        console.error('Error refreshing data:', error);
        this.toastService.error('Failed to refresh data', 3000);
      }
    );
  }

  private loadModelComparison() {
    const ids = (this.availableModels || []).map((m: any) => m?.id).filter(Boolean);
    if (!ids.length) {
      this.comparisonData = null;
      return;
    }

    this.apiService.getModelComparison(ids, 'test', 5000).subscribe(
      (resp: any) => {
        this.comparisonData = resp?.comparison || null;
      },
      () => {
        this.comparisonData = null;
      }
    );
  }

  private loadFeatureImportance() {
    if (!this.selectedModelId) {
      this.featureData = null;
      return;
    }

    this.apiService.getFeatureImportance(this.selectedModelId, 20).subscribe(
      (resp: any) => {
        this.featureData = resp?.featureImportance || null;
      },
      () => {
        this.featureData = null;
      }
    );
  }

  private loadRocCurve() {
    if (!this.selectedModelId) {
      this.rocData = null;
      return;
    }

    this.apiService.getRocCurve(this.selectedModelId, 'test', 5000, 101).subscribe(
      (resp: any) => {
        this.rocData = resp?.roc || null;
      },
      () => {
        this.rocData = null;
      }
    );
  }

  private loadConfusionMatrix() {
    if (!this.selectedModelId) {
      this.confusionData = null;
      return;
    }

    this.apiService.getConfusionMatrix(this.selectedModelId, 'test', 5000).subscribe(
      (resp: any) => {
        this.confusionData = resp?.confusionMatrix || null;
      },
      () => {
        this.confusionData = null;
      }
    );
  }

  private applyModelFilter() {
    if (this.selectedModelId) {
      this.trainingHistory = this.allTrainingHistory.filter((h: any) => h.modelId === this.selectedModelId);
    } else {
      this.trainingHistory = this.allTrainingHistory;
    }
    this.totalSessions = this.trainingHistory.length;
  }
}
