import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-model-comparison',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div style="background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); padding: 24px; margin-bottom: 24px;">
      <h2 style="margin: 0 0 24px 0; font-size: 1.5rem; font-weight: 600; color: #333; display:flex; align-items:center; gap: 10px;">
        <mat-icon svgIcon="chart"></mat-icon>
        Model Comparison
      </h2>
      
      <div *ngIf="trainingHistory.length > 0; else noData">
        <div style="display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap;">
          <button *ngFor="let metric of metrics" 
                  (click)="setMetric(metric)"
                  [style.background]="selectedMetric === metric ? '#0066ff' : '#e0e0e0'"
                  [style.color]="selectedMetric === metric ? 'white' : '#333'"
                  style="padding: 8px 16px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; transition: all 0.3s;">
            {{ metric }}
          </button>
        </div>

        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
            <thead>
              <tr style="background: #f5f5f5;">
                <th style="padding: 12px; border: 1px solid #e0e0e0; font-weight: 600; color: #333; text-align: left;">Model</th>
                <th style="padding: 12px; border: 1px solid #e0e0e0; font-weight: 600; color: #333; text-align: center;">{{ selectedMetric }}</th>
                <th style="padding: 12px; border: 1px solid #e0e0e0; font-weight: 600; color: #333; text-align: center;">Rank</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let model of models; let i = index" style="border-bottom: 1px solid #e0e0e0;">
                <td style="padding: 12px; border: 1px solid #e0e0e0; color: #333;">
                  <div style="font-weight: 600;">{{ model.displayName }}</div>
                  <div *ngIf="model.subTitle" style="margin-top: 2px; font-size: 0.75rem; color: #6b7280;">{{ model.subTitle }}</div>
                </td>
                <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: center; color: #0066ff; font-weight: 600;">{{ model[selectedMetric] }}</td>
                <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: center;">
                  <span style="display: inline-block; background: #0066ff; color: white; padding: 4px 8px; border-radius: 4px; font-weight: 600;">{{ i + 1 }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <ng-template #noData>
        <div style="padding: 40px; text-align: center; background: #f9fafb; border-radius: 8px;">
          <p style="font-size: 1rem; color: #999; margin: 0; display:flex; align-items:center; justify-content:center; gap: 10px;">
            <mat-icon svgIcon="info"></mat-icon>
            Démarrez le training pour voir la comparaison des modèles
          </p>
        </div>
      </ng-template>
    </div>
  `
})
export class ModelComparisonComponent implements OnInit, OnChanges {
  @Input() isTraining = false;
  @Input() trainingHistory: any[] = [];
  @Input() comparisonData: any = null;

  metrics = ['accuracy', 'loss', 'precision', 'recall', 'f1'];
  selectedMetric = 'accuracy';
  models: any[] = [];

  constructor() {}

  ngOnInit() {
    this.updateFromInputs();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['comparisonData'] || changes['trainingHistory']) {
      this.updateFromInputs();
    }
  }

  private updateFromInputs() {
    const models = this.comparisonData?.models;
    if (!Array.isArray(models) || models.length === 0) {
      this.models = [];
      return;
    }

    const metric = this.selectedMetric;
    this.models = models
      .map((m: any) => ({
        displayName: (m.name || m.modelId || '-'),
        subTitle: this.buildSubTitle(m),
        accuracy: Number(m.accuracy ?? 0).toFixed(4),
        loss: Number(m.loss ?? 0).toFixed(4),
        precision: Number(m.precision ?? 0).toFixed(4),
        recall: Number(m.recall ?? 0).toFixed(4),
        f1: Number(m.f1 ?? 0).toFixed(4),
        _raw: m
      }))
      .sort((a: any, b: any) => {
        const av = Number(a._raw?.[metric] ?? 0);
        const bv = Number(b._raw?.[metric] ?? 0);
        if (metric === 'loss') return av - bv;
        return bv - av;
      });
  }

  private buildSubTitle(m: any): string {
    const parts: string[] = [];
    const type = (m.modelType || '').toString().trim();
    const arch = (m.architecture || '').toString().trim();
    const layersCount = Number(m.layersCount ?? 0);

    if (type) parts.push(type.toUpperCase());
    if (arch) parts.push(arch);
    if (layersCount > 0) parts.push(`${layersCount} layers`);

    const id = (m.modelId || '').toString();
    if (id) parts.push(`id: ${id}`);

    return parts.join(' | ');
  }

  setMetric(metric: string) {
    this.selectedMetric = metric;
    this.updateFromInputs();
  }
}
