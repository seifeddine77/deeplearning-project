import { Component, Input, OnInit, OnChanges, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-training-chart',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div style="background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); padding: 24px; margin-bottom: 24px;">
      <h2 style="margin: 0 0 24px 0; font-size: 1.5rem; font-weight: 600; color: #333; display:flex; align-items:center; gap: 10px;">
        <mat-icon svgIcon="chart"></mat-icon>
        Training Progress
      </h2>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; margin-bottom: 24px;">
        <div style="padding: 12px; background: #f0f9ff; border-radius: 6px; border-left: 4px solid #0066ff;">
          <div style="font-size: 0.875rem; color: #666; font-weight: 600;">Total Epochs</div>
          <div style="font-size: 1.5rem; font-weight: 700; color: #0066ff; margin-top: 4px;">{{ totalEpochs }}</div>
        </div>
        <div style="padding: 12px; background: #f0fdf4; border-radius: 6px; border-left: 4px solid #10b981;">
          <div style="font-size: 0.875rem; color: #666; font-weight: 600;">Final Accuracy</div>
          <div style="font-size: 1.5rem; font-weight: 700; color: #10b981; margin-top: 4px;">{{ finalAccuracy }}%</div>
        </div>
        <div style="padding: 12px; background: #fef3c7; border-radius: 6px; border-left: 4px solid #f59e0b;">
          <div style="font-size: 0.875rem; color: #666; font-weight: 600;">Final Loss</div>
          <div style="font-size: 1.5rem; font-weight: 700; color: #f59e0b; margin-top: 4px;">{{ finalLoss }}</div>
        </div>
      </div>

      <div style="background: #f9fafb; border-radius: 8px; padding: 16px;">
        <h3 style="margin: 0 0 16px 0; font-size: 1.125rem; font-weight: 600; color: #333;">Loss & Accuracy Over Epochs</h3>
        <canvas #trainingCanvas style="max-height: 300px;"></canvas>
      </div>
    </div>
  `
})
export class TrainingChartComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() trainingHistory: any[] = [];
  @Input() bestAccuracy: number = 0;
  @Input() bestLoss: number = 0;

  @ViewChild('trainingCanvas') trainingCanvas!: ElementRef<HTMLCanvasElement>;

  totalEpochs = 0;
  finalAccuracy = '0';
  finalLoss = '0';
  
  private chart: Chart | null = null;

  ngOnInit() {
    this.updateMetrics();
  }

  ngAfterViewInit() {
    this.createChart();
  }

  ngOnChanges() {
    this.updateMetrics();
    if (this.trainingCanvas) {
      this.createChart();
    }
  }

  private updateMetrics() {
    if (this.trainingHistory && this.trainingHistory.length > 0) {
      this.totalEpochs = this.trainingHistory.length;
      this.finalAccuracy = this.bestAccuracy.toFixed(4);
      this.finalLoss = this.bestLoss.toFixed(4);
    }
  }

  private createChart() {
    this.chart?.destroy();
    
    if (this.trainingHistory && this.trainingHistory.length > 0 && this.trainingCanvas) {
      const lossData = this.trainingHistory.map(h => parseFloat(h.loss));
      const accuracyData = this.trainingHistory.map(h => parseFloat(h.accuracy));
      const labels = this.trainingHistory.map(h => `Epoch ${h.epoch}`);

      const gridColor = 'rgba(15, 23, 42, 0.08)';
      const axisColor = 'rgba(15, 23, 42, 0.55)';
      const fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
      const lossColor = '#ef4444';
      const accColor = '#10b981';
      
      this.chart = new Chart(this.trainingCanvas.nativeElement, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Loss',
              data: lossData,
              borderColor: lossColor,
              backgroundColor: 'rgba(239, 68, 68, 0.10)',
              borderWidth: 2,
              tension: 0.35,
              fill: true,
              pointRadius: 0,
              pointHoverRadius: 4,
              pointHitRadius: 12,
              yAxisID: 'y'
            },
            {
              label: 'Accuracy',
              data: accuracyData,
              borderColor: accColor,
              backgroundColor: 'rgba(16, 185, 129, 0.10)',
              borderWidth: 2,
              tension: 0.35,
              fill: true,
              pointRadius: 0,
              pointHoverRadius: 4,
              pointHitRadius: 12,
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          devicePixelRatio: Math.max(1, Math.min(2, (window.devicePixelRatio || 1))),
          interaction: { mode: 'index', intersect: false },
          layout: { padding: { top: 6, right: 10, bottom: 6, left: 6 } },
          elements: {
            line: { borderJoinStyle: 'round' as const, borderCapStyle: 'round' as const },
            point: { radius: 0, hoverRadius: 4, hitRadius: 12 }
          },
          animation: { duration: 650, easing: 'easeOutQuart' as any },
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: {
                usePointStyle: true,
                boxWidth: 8,
                boxHeight: 8,
                color: axisColor,
                font: { family: fontFamily, size: 12, weight: 600 }
              }
            },
            tooltip: {
              backgroundColor: 'rgba(17, 24, 39, 0.92)',
              titleColor: 'rgba(255,255,255,0.92)',
              bodyColor: 'rgba(255,255,255,0.92)',
              padding: 10,
              cornerRadius: 10,
              displayColors: true,
              callbacks: {
                label: (ctx: any) => {
                  const label = String(ctx?.dataset?.label || '');
                  const v = Number(ctx?.parsed?.y ?? 0);
                  if (label.toLowerCase().includes('accuracy')) return `${label}: ${(v * 100).toFixed(2)}%`;
                  return `${label}: ${v.toFixed(4)}`;
                }
              }
            }
          },
          scales: {
            x: {
              grid: { color: gridColor },
              ticks: { color: axisColor, font: { family: fontFamily, size: 11, weight: 600 }, maxRotation: 0 }
            },
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              beginAtZero: true,
              grid: { color: gridColor },
              ticks: {
                color: axisColor,
                font: { family: fontFamily, size: 11, weight: 600 },
                callback: (value: any) => {
                  const v = Number(value);
                  return Number.isFinite(v) ? v.toFixed(2) : value;
                }
              }
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              beginAtZero: true,
              min: 0,
              max: 1,
              grid: { drawOnChartArea: false },
              ticks: {
                color: axisColor,
                font: { family: fontFamily, size: 11, weight: 600 },
                callback: (value: any) => {
                  const v = Number(value);
                  return Number.isFinite(v) ? `${Math.round(v * 100)}%` : value;
                }
              }
            }
          }
        }
      });
    }
  }
}
