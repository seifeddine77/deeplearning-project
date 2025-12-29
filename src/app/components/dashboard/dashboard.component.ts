import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="page-data-bg">
      <div class="page-data-container">
        <div class="text-center" style="margin-bottom: 24px;">
          <h1 style="margin: 0; font-size: 2.5rem; font-weight: 700; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.2); display:flex; align-items:center; justify-content:center; gap: 10px;">
            <mat-icon svgIcon="dashboard" style="color: rgba(255,255,255,0.95);"></mat-icon>
            Dashboard
          </h1>
          <p style="margin: 10px 0 0 0; font-size: 1rem; color: rgba(255,255,255,0.9);">Model Status & Metrics Overview</p>

          <div class="row row-wrap justify-center" style="margin-top: 12px;">
            <button class="btn btn-secondary" (click)="refresh()" [disabled]="isLoading">
              <mat-icon svgIcon="refresh" style="margin-right: 8px;"></mat-icon>
              {{ isLoading ? 'Loading…' : 'Refresh' }}
            </button>
            <div class="chip">Last update: <strong>{{ lastUpdated || '-' }}</strong></div>
            <div class="chip" style="gap: 10px;">
              <span class="status-dot" [class.ok]="!errorMessage" [class.err]="!!errorMessage"></span>
              <span *ngIf="errorMessage">Error</span>
              <span *ngIf="!errorMessage">Live</span>
            </div>
            <div class="chip" style="gap: 10px;">
              <label style="display:flex; align-items:center; gap:8px; margin:0; font-weight: 700;">
                <input type="checkbox" [checked]="autoRefreshEnabled" (change)="toggleAutoRefresh($event)" />
                Auto-refresh
              </label>
              <select [value]="autoRefreshSeconds" (change)="onAutoRefreshSecondsChange($event)" style="width: auto; padding: 6px 10px; border-radius: 10px;">
                <option [value]="10">10s</option>
                <option [value]="30">30s</option>
                <option [value]="60">60s</option>
              </select>
            </div>
          </div>
        </div>

          <div *ngIf="errorMessage" class="alert alert-danger" style="margin-bottom: 16px;">
            <div style="font-weight: 700;">{{ errorMessage }}</div>
          </div>

        <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); margin-bottom: 30px;">
          <div class="card card-solid" style="overflow: hidden;">
            <div class="card-header-blue">
              <div style="display:flex; align-items:center; justify-content: space-between; gap: 12px;">
                <h3 style="margin: 0; font-size: 1.125rem; font-weight: 600;">Model Status</h3>
                <span class="badge" [class.ok]="modelStatus === 'ready'" [class.warn]="modelStatus === 'training'" [class.err]="modelStatus === 'error'">
                  {{ modelStatus || 'unknown' }}
                </span>
              </div>
            </div>
              <div class="dash-metrics">
                <div class="dash-row"><span>Status</span><strong>{{ modelStatus }}</strong></div>
                <div class="dash-row"><span>Accuracy</span><strong>{{ accuracy }}%</strong></div>
              </div>
          </div>

          <div class="card card-solid" style="overflow: hidden;">
            <div class="card-header-blue">
              <h3 style="margin: 0; font-size: 1.125rem; font-weight: 600;">Training Progress</h3>
            </div>
              <div class="dash-metrics">
                <div class="dash-row"><span>Epochs</span><strong>{{ epochs }}/{{ totalEpochs }}</strong></div>
                <div class="progress" style="margin-top: 10px;">
                  <div class="progress-bar" [style.width.%]="totalEpochs ? (epochs / totalEpochs) * 100 : 0"></div>
                </div>
              </div>
          </div>

          <div class="card card-solid" style="overflow: hidden;">
            <div class="card-header-blue">
              <h3 style="margin: 0; font-size: 1.125rem; font-weight: 600;">Dataset Info</h3>
            </div>
              <div class="dash-metrics">
                <div class="dash-row"><span>Total Samples</span><strong>{{ totalSamples }}</strong></div>
                <div class="dash-row"><span>Train/Test/Val</span><strong>{{ splitInfo }}</strong></div>
              </div>
          </div>

          <div class="card card-solid" style="overflow: hidden;">
            <div class="card-header-blue">
              <h3 style="margin: 0; font-size: 1.125rem; font-weight: 600;">System Info</h3>
            </div>
              <div class="dash-metrics">
                <div class="dash-row"><span>Framework</span><strong>TensorFlow.js</strong></div>
                <div class="dash-row"><span>Backend</span><strong>Node.js</strong></div>
              </div>
          </div>
        </div>

        <div class="card card-solid" style="overflow: hidden;">
          <div class="card-header-blue">
            <div style="display:flex; align-items:center; justify-content: space-between; gap: 12px;">
              <h3 style="margin: 0; font-size: 1.125rem; font-weight: 600;">Recent Metrics</h3>
              <span style="opacity: 0.9; font-weight: 700; font-size: 13px;">Sorted: newest first</span>
            </div>
          </div>
          <div class="table-wrap" style="padding: 16px;">
            <table>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th style="text-align: right;">Value</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngIf="sortedRecentMetrics.length === 0">
                  <td colspan="3" style="padding: 16px;">
                    <div style="font-weight: 800;">No metrics yet</div>
                    <div style="opacity: 0.7; margin-top: 6px;">Start a training run to populate this table.</div>
                  </td>
                </tr>
                <tr *ngFor="let metric of sortedRecentMetrics; let i = index" [class.zebra]="i % 2 === 1">
                  <td style="font-weight: 700;">{{ metric.name }}</td>
                  <td style="text-align: right; font-variant-numeric: tabular-nums;">{{ metric.value }}</td>
                  <td style="opacity: 0.75;">{{ metric.timestamp }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `
  ,styles: [`
    .dash-metrics {
      display: grid;
      gap: 10px;
    }

    .dash-row {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 12px;
      color: rgba(17, 24, 39, 0.72);
    }

    .dash-row strong {
      color: rgba(17, 24, 39, 0.95);
      font-weight: 800;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 6px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      background: rgba(17, 24, 39, 0.10);
      color: rgba(17, 24, 39, 0.85);
    }

    .badge.ok {
      background: rgba(16, 185, 129, 0.14);
      color: rgba(6, 95, 70, 0.95);
    }

    .badge.warn {
      background: rgba(245, 158, 11, 0.18);
      color: rgba(146, 64, 14, 0.95);
    }

    .badge.err {
      background: rgba(239, 68, 68, 0.16);
      color: rgba(127, 29, 29, 0.95);
    }

    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.45);
      box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.12);
    }

    .status-dot.ok {
      background: rgba(16, 185, 129, 0.95);
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.18);
    }

    .status-dot.err {
      background: rgba(239, 68, 68, 0.95);
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.18);
    }

    tr.zebra td {
      background: rgba(17, 24, 39, 0.03);
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  isLoading = false;
  errorMessage = '';
  lastUpdated = '';

  autoRefreshEnabled = false;
  autoRefreshSeconds = 30;
  private autoRefreshTimer: any = null;

  modelStatus = '-';
  accuracy = 0;
  epochs = 0;
  totalEpochs = 0;
  totalSamples = 0;
  splitInfo = '-';
  recentMetrics: any[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.refresh();
  }

  ngOnDestroy() {
    this.clearAutoRefresh();
  }

  get sortedRecentMetrics() {
    const list = Array.isArray(this.recentMetrics) ? [...this.recentMetrics] : [];
    list.sort((a: any, b: any) => Number(b?.timestampMs || 0) - Number(a?.timestampMs || 0));
    return list;
  }

  toggleAutoRefresh(event: any) {
    const enabled = !!event?.target?.checked;
    this.autoRefreshEnabled = enabled;
    if (enabled) {
      this.startAutoRefresh();
    } else {
      this.clearAutoRefresh();
    }
  }

  onAutoRefreshSecondsChange(event: any) {
    const next = Number(event?.target?.value || 30);
    this.autoRefreshSeconds = Number.isFinite(next) && next > 0 ? next : 30;
    if (this.autoRefreshEnabled) {
      this.startAutoRefresh();
    }
  }

  private startAutoRefresh() {
    this.clearAutoRefresh();
    this.autoRefreshTimer = setInterval(() => {
      if (!this.isLoading) {
        this.refresh();
      }
    }, this.autoRefreshSeconds * 1000);
  }

  private clearAutoRefresh() {
    if (this.autoRefreshTimer) {
      clearInterval(this.autoRefreshTimer);
      this.autoRefreshTimer = null;
    }
  }

  refresh() {
    this.isLoading = true;
    this.errorMessage = '';

    this.apiService.getDashboardOverview().subscribe(
      (resp: any) => {
        const ov = resp?.overview || null;
        this.lastUpdated = new Date().toLocaleString();

        this.modelStatus = ov?.model?.status || '-';
        const acc = ov?.model?.accuracy;
        this.accuracy = acc != null ? Number((Number(acc) * 100).toFixed(2)) : 0;

        this.epochs = Number(ov?.training?.epoch || 0);
        this.totalEpochs = Number(ov?.training?.epochs || 0);

        this.totalSamples = Number(ov?.dataset?.totalSamples || 0);
        const tr = Number(ov?.dataset?.trainSize || 0);
        const te = Number(ov?.dataset?.testSize || 0);
        const va = Number(ov?.dataset?.valSize || 0);
        const total = tr + te + va;
        if (total > 0) {
          this.splitInfo = `${Math.round((tr / total) * 100)}/${Math.round((te / total) * 100)}/${Math.round((va / total) * 100)}`;
        } else {
          this.splitInfo = '-';
        }

        this.recentMetrics = Array.isArray(ov?.recentMetrics) ? ov.recentMetrics.map((m: any) => {
          const ts = m?.timestamp ? new Date(m.timestamp) : null;
          return {
            name: m?.name,
            value: m?.value,
            timestamp: ts ? ts.toLocaleString() : '-',
            timestampMs: ts ? ts.getTime() : 0
          };
        }) : [];

        this.isLoading = false;
      },
      (err: any) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.error || err?.message || 'Failed to load dashboard';
      }
    );
  }
}
