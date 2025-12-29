import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Subject } from 'rxjs';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-training-metrics',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div style="background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); padding: 24px; margin-bottom: 24px;">
      <h2 style="margin: 0 0 24px 0; font-size: 1.5rem; font-weight: 600; color: #333; display:flex; align-items:center; gap: 10px;">
        <mat-icon svgIcon="chart"></mat-icon>
        Métriques d'Entraînement en Temps Réel
      </h2>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 24px;">
        <!-- Loss Chart -->
        <div style="background: #f9fafb; border-radius: 8px; padding: 16px;">
          <h3 style="margin: 0 0 16px 0; font-size: 1.125rem; font-weight: 600; color: #333; display:flex; align-items:center; gap: 10px;">
            <mat-icon svgIcon="chart"></mat-icon>
            Loss
          </h3>
          <canvas #lossCanvas style="max-height: 250px;"></canvas>
          <p style="margin: 8px 0 0 0; font-size: 0.875rem; color: #666;">Epoch: {{ currentEpoch }} | Loss: {{ currentLoss }}</p>
        </div>

        <!-- Accuracy Chart -->
        <div style="background: #f9fafb; border-radius: 8px; padding: 16px;">
          <h3 style="margin: 0 0 16px 0; font-size: 1.125rem; font-weight: 600; color: #333; display:flex; align-items:center; gap: 10px;">
            <mat-icon svgIcon="chart"></mat-icon>
            Accuracy
          </h3>
          <canvas #accuracyCanvas style="max-height: 250px;"></canvas>
          <p style="margin: 8px 0 0 0; font-size: 0.875rem; color: #666;">Epoch: {{ currentEpoch }} | Accuracy: {{ currentAccuracy }}</p>
        </div>

        <!-- Validation Loss Chart -->
        <div style="background: #f9fafb; border-radius: 8px; padding: 16px;">
          <h3 style="margin: 0 0 16px 0; font-size: 1.125rem; font-weight: 600; color: #333; display:flex; align-items:center; gap: 10px;">
            <mat-icon svgIcon="chart"></mat-icon>
            Validation Loss
          </h3>
          <canvas #valLossCanvas style="max-height: 250px;"></canvas>
          <p style="margin: 8px 0 0 0; font-size: 0.875rem; color: #666;">Epoch: {{ currentEpoch }} | Val Loss: {{ currentValLoss }}</p>
        </div>

        <!-- Validation Accuracy Chart -->
        <div style="background: #f9fafb; border-radius: 8px; padding: 16px;">
          <h3 style="margin: 0 0 16px 0; font-size: 1.125rem; font-weight: 600; color: #333; display:flex; align-items:center; gap: 10px;">
            <mat-icon svgIcon="chart"></mat-icon>
            Validation Accuracy
          </h3>
          <canvas #valAccuracyCanvas style="max-height: 250px;"></canvas>
          <p style="margin: 8px 0 0 0; font-size: 0.875rem; color: #666;">Epoch: {{ currentEpoch }} | Val Accuracy: {{ currentValAccuracy }}</p>
        </div>
      </div>
    </div>
  `
})
export class TrainingMetricsComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit {
  @Input() trainingHistory: any[] = [];
  @Input() isTraining = false;

  @ViewChild('lossCanvas') lossCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('accuracyCanvas') accuracyCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('valLossCanvas') valLossCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('valAccuracyCanvas') valAccuracyCanvas!: ElementRef<HTMLCanvasElement>;

  private destroy$ = new Subject<void>();
  private lossChart: Chart | null = null;
  private accuracyChart: Chart | null = null;
  private valLossChart: Chart | null = null;
  private valAccuracyChart: Chart | null = null;

  // Valeurs actuelles
  currentEpoch = 0;
  currentLoss = '0';
  currentAccuracy = '0';
  currentValLoss = '0';
  currentValAccuracy = '0';

  ngOnInit() {
    this.updateChartsFromTrainingHistory();
  }

  ngAfterViewInit() {
    this.createCharts();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroyCharts();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['trainingHistory']) {
      this.updateChartsFromTrainingHistory();
      if (this.lossCanvas) {
        this.createCharts();
      }
    }
  }

  private destroyCharts() {
    this.lossChart?.destroy();
    this.accuracyChart?.destroy();
    this.valLossChart?.destroy();
    this.valAccuracyChart?.destroy();
  }

  private createCharts() {
    this.destroyCharts();
    
    if (this.trainingHistory && this.trainingHistory.length > 0) {
      const labels = this.trainingHistory.map(h => `Epoch ${h.epoch}`);
      const lossData = this.trainingHistory.map(h => Number(h.loss));
      const accuracyData = this.trainingHistory.map(h => Number(h.accuracy));
      const valLossData = this.trainingHistory.map(h => h.valLoss != null ? Number(h.valLoss) : null);
      const valAccuracyData = this.trainingHistory.map(h => h.valAccuracy != null ? Number(h.valAccuracy) : null);

      const gridColor = 'rgba(15, 23, 42, 0.08)';
      const axisColor = 'rgba(15, 23, 42, 0.55)';
      const fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";

      const baseOptions = {
        responsive: true,
        maintainAspectRatio: false,
        devicePixelRatio: Math.max(1, Math.min(2, (window.devicePixelRatio || 1))),
        interaction: { mode: 'index' as const, intersect: false },
        layout: { padding: { top: 6, right: 10, bottom: 4, left: 6 } },
        elements: {
          line: { borderJoinStyle: 'round' as const, borderCapStyle: 'round' as const },
          point: { radius: 0, hoverRadius: 4, hitRadius: 12 }
        },
        animation: { duration: 650, easing: 'easeOutQuart' as any },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.92)',
            titleColor: 'rgba(255,255,255,0.92)',
            bodyColor: 'rgba(255,255,255,0.92)',
            padding: 10,
            cornerRadius: 10,
            displayColors: true
          }
        },
        scales: {
          x: {
            grid: { color: gridColor },
            ticks: { color: axisColor, font: { family: fontFamily, size: 11, weight: 600 } }
          },
          y: {
            grid: { color: gridColor },
            ticks: { color: axisColor, font: { family: fontFamily, size: 11, weight: 600 } }
          }
        }
      };

      const lossChartOptions = {
        ...baseOptions,
        scales: {
          ...baseOptions.scales,
          y: {
            ...(baseOptions.scales as any).y,
            beginAtZero: true
          }
        }
      };

      const accChartOptions = {
        ...baseOptions,
        scales: {
          ...baseOptions.scales,
          y: {
            ...(baseOptions.scales as any).y,
            beginAtZero: true,
            min: 0,
            max: 1,
            ticks: {
              ...(baseOptions.scales as any).y.ticks,
              callback: (value: any) => {
                const v = Number(value);
                return Number.isFinite(v) ? `${Math.round(v * 100)}%` : value;
              }
            }
          }
        }
      };

      if (this.lossCanvas) {
        this.lossChart = new Chart(this.lossCanvas.nativeElement, {
          type: 'line',
          data: {
            labels,
            datasets: [{
              label: 'Loss',
              data: lossData,
              borderColor: '#ef4444',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderWidth: 2,
              tension: 0.35,
              fill: true,
              pointRadius: 0,
              pointHoverRadius: 4,
              pointHitRadius: 12
            }]
          },
          options: lossChartOptions as any
        });
      }

      if (this.accuracyCanvas) {
        this.accuracyChart = new Chart(this.accuracyCanvas.nativeElement, {
          type: 'line',
          data: {
            labels,
            datasets: [{
              label: 'Accuracy',
              data: accuracyData,
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              borderWidth: 2,
              tension: 0.35,
              fill: true,
              pointRadius: 0,
              pointHoverRadius: 4,
              pointHitRadius: 12
            }]
          },
          options: accChartOptions as any
        });
      }

      if (this.valLossCanvas) {
        this.valLossChart = new Chart(this.valLossCanvas.nativeElement, {
          type: 'line',
          data: {
            labels,
            datasets: [{
              label: 'Val Loss',
              data: valLossData,
              borderColor: '#f59e0b',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              borderWidth: 2,
              tension: 0.35,
              fill: true,
              pointRadius: 0,
              pointHoverRadius: 4,
              pointHitRadius: 12
            }]
          },
          options: lossChartOptions as any
        });
      }

      if (this.valAccuracyCanvas) {
        this.valAccuracyChart = new Chart(this.valAccuracyCanvas.nativeElement, {
          type: 'line',
          data: {
            labels,
            datasets: [{
              label: 'Val Accuracy',
              data: valAccuracyData,
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              borderWidth: 2,
              tension: 0.35,
              fill: true,
              pointRadius: 0,
              pointHoverRadius: 4,
              pointHitRadius: 12
            }]
          },
          options: accChartOptions as any
        });
      }
    }
  }

  private updateChartsFromTrainingHistory() {
    if (this.trainingHistory && this.trainingHistory.length > 0) {
      let transformedData: any[] = [];

      // Format A: already per-epoch points: {epoch, loss, accuracy, valLoss?, valAccuracy?}
      if (this.trainingHistory.every((e: any) => e && typeof e.epoch !== 'undefined' && typeof e.loss !== 'undefined' && typeof e.accuracy !== 'undefined')) {
        transformedData = this.trainingHistory.map((e: any) => ({
          epoch: Number(e.epoch),
          loss: Number(e.loss),
          accuracy: Number(e.accuracy),
          valLoss: e.valLoss != null ? Number(e.valLoss) : null,
          valAccuracy: e.valAccuracy != null ? Number(e.valAccuracy) : null
        }));
      } else {
        // Format B: sessions from backend: {history: {history: {loss:[], acc:[], val_loss:[], val_acc:[]}}}
        const lastSession = this.trainingHistory[this.trainingHistory.length - 1];
        const hist = lastSession?.history?.history;
        const lossArr = Array.isArray(hist?.loss) ? hist.loss : [];
        const accArr = Array.isArray(hist?.acc) ? hist.acc : [];
        const valLossArr = Array.isArray(hist?.val_loss) ? hist.val_loss : [];
        const valAccArr = Array.isArray(hist?.val_acc) ? hist.val_acc : [];
        const n = Math.max(lossArr.length, accArr.length, valLossArr.length, valAccArr.length);

        transformedData = Array.from({ length: n }, (_, i) => ({
          epoch: i + 1,
          loss: lossArr[i] ?? 0,
          accuracy: accArr[i] ?? 0,
          valLoss: valLossArr[i] ?? null,
          valAccuracy: valAccArr[i] ?? null
        }));
      }

      // Update current values
      if (transformedData.length > 0) {
        const lastEntry = transformedData[transformedData.length - 1];
        this.currentEpoch = lastEntry.epoch;
        this.currentLoss = lastEntry.loss.toFixed(4);
        this.currentAccuracy = (lastEntry.accuracy * 100).toFixed(2);
        this.currentValLoss = (lastEntry.valLoss != null ? Number(lastEntry.valLoss) : 0).toFixed(4);
        this.currentValAccuracy = ((lastEntry.valAccuracy != null ? Number(lastEntry.valAccuracy) : 0) * 100).toFixed(2);
      }
      
      // Update trainingHistory with transformed data for createCharts
      this.trainingHistory = transformedData;
      this.createCharts();
    }
  }
}
