import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="min-height: calc(100vh - 70px); background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 50%, #a855f7 100%); padding: 32px 24px;">
      <div style="max-width: 1200px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 2.2rem; font-weight: 700; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">📄 Report History</h1>
          <p style="margin: 10px 0 0 0; font-size: 1rem; color: rgba(255,255,255,0.9);">Track generated PDFs and sent emails</p>
        </div>

        <div style="background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); padding: 18px; margin-bottom: 18px;">
          <div style="display: flex; gap: 12px; align-items: center; justify-content: space-between; flex-wrap: wrap;">
            <div style="display: flex; gap: 14px; align-items: center; flex-wrap: wrap;">
              <div style="font-weight: 700; color: #111;">Total: <span style="color: #0ea5e9;">{{ statsTotal }}</span></div>
              <div style="font-weight: 700; color: #111;">PDF: <span style="color: #10b981;">{{ statsPdf }}</span></div>
              <div style="font-weight: 700; color: #111;">Email: <span style="color: #f59e0b;">{{ statsEmail }}</span></div>
              <div *ngIf="errorMessage" style="color: #b91c1c; font-weight: 600;">{{ errorMessage }}</div>
            </div>

            <div style="display: flex; gap: 10px;">
              <button (click)="refresh()" [disabled]="isLoading" style="padding: 10px 14px; background: #0ea5e9; color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; opacity: {{isLoading ? 0.7 : 1}};">
                {{ isLoading ? 'Loading...' : 'Refresh' }}
              </button>
              <button (click)="clearFilters()" [disabled]="isLoading" style="padding: 10px 14px; background: #64748b; color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; opacity: {{isLoading ? 0.7 : 1}};">
                Clear filters
              </button>
            </div>
          </div>

          <div style="margin-top: 14px; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px;">
            <div>
              <div style="font-size: 0.85rem; font-weight: 700; color: #334155; margin-bottom: 6px;">Report type</div>
              <select [(ngModel)]="filters.reportType" (change)="refresh()" style="width: 100%; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 10px;">
                <option value="">All</option>
                <option value="analysis_pdf">analysis_pdf</option>
                <option value="analysis_email">analysis_email</option>
              </select>
            </div>

            <div>
              <div style="font-size: 0.85rem; font-weight: 700; color: #334155; margin-bottom: 6px;">Dataset</div>
              <select [(ngModel)]="filters.dataset" (change)="refresh()" style="width: 100%; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 10px;">
                <option value="">All</option>
                <option value="test">test</option>
                <option value="val">val</option>
              </select>
            </div>

            <div>
              <div style="font-size: 0.85rem; font-weight: 700; color: #334155; margin-bottom: 6px;">Model ID</div>
              <input [(ngModel)]="filters.modelId" (keydown.enter)="refresh()" placeholder="model_123" style="width: 100%; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 10px;" />
            </div>

            <div>
              <div style="font-size: 0.85rem; font-weight: 700; color: #334155; margin-bottom: 6px;">Training Run ID</div>
              <input [(ngModel)]="filters.trainingRunId" (keydown.enter)="refresh()" placeholder="run_..." style="width: 100%; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 10px;" />
            </div>

            <div>
              <div style="font-size: 0.85rem; font-weight: 700; color: #334155; margin-bottom: 6px;">Limit</div>
              <input type="number" [(ngModel)]="filters.limit" (change)="refresh()" min="1" max="200" style="width: 100%; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 10px;" />
            </div>
          </div>
        </div>

        <div style="background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden;">
          <div style="padding: 14px 18px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
            <div style="font-weight: 800; color: #111;">Reports</div>
            <div style="font-size: 0.875rem; color: #6b7280;">Showing {{ reports.length }} items</div>
          </div>

          <div *ngIf="reports.length === 0" style="padding: 40px; text-align: center; color: #6b7280;">
            No reports yet.
          </div>

          <div *ngFor="let r of reports" style="padding: 14px 18px; border-bottom: 1px solid #f1f5f9; display: flex; gap: 14px; align-items: flex-start;">
            <div style="width: 10px; height: 10px; border-radius: 999px; margin-top: 7px;" [style.background]="typeColor(r.reportType)"></div>

            <div style="flex: 1;">
              <div style="display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap;">
                <div>
                  <div style="font-weight: 800; color: #111;">{{ r.title || 'Report' }}</div>
                  <div style="color: #374151; margin-top: 4px;">
                    <span style="font-weight: 700;">{{ r.reportType }}</span>
                    <span style="color: #94a3b8;"> • </span>
                    <span>dataset: {{ r.dataset || '-' }}</span>
                  </div>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: 0.8rem; color: #6b7280;">{{ formatDate(r.createdAt) }}</div>
                  <div style="font-size: 0.8rem; color: #6b7280;">id: {{ r._id }}</div>
                </div>
              </div>

              <div style="margin-top: 10px; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px;">
                <div style="font-size: 0.9rem; color: #334155; background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 10px;">
                  <div style="font-weight: 800; color: #0f172a; margin-bottom: 6px;">Models</div>
                  <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 0.85rem; white-space: pre-wrap;">
                    {{ (r.modelIds && r.modelIds.length) ? r.modelIds.join(', ') : '-' }}
                  </div>
                </div>

                <div style="font-size: 0.9rem; color: #334155; background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 10px;">
                  <div style="font-weight: 800; color: #0f172a; margin-bottom: 6px;">Run</div>
                  <div>trainingRunId: <span style="font-family: ui-monospace, monospace;">{{ r.trainingRunId || '-' }}</span></div>
                  <div>datasetId: <span style="font-family: ui-monospace, monospace;">{{ r.datasetId || '-' }}</span></div>
                </div>

                <div *ngIf="r.reportType === 'analysis_email'" style="font-size: 0.9rem; color: #334155; background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 10px;">
                  <div style="font-weight: 800; color: #0f172a; margin-bottom: 6px;">Email</div>
                  <div>subject: <span style="font-weight: 700;">{{ r.emailSubject || '-' }}</span></div>
                  <div>recipients: <span style="font-family: ui-monospace, monospace;">{{ (r.recipients && r.recipients.length) ? r.recipients.join(', ') : '-' }}</span></div>
                </div>
              </div>

              <div style="margin-top: 10px; display: flex; gap: 10px;">
                <button (click)="remove(r)" [disabled]="isLoading" style="padding: 8px 12px; background: #ef4444; color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; opacity: {{isLoading ? 0.7 : 1}};">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ReportsComponent implements OnInit {
  reports: any[] = [];
  isLoading = false;
  errorMessage = '';

  statsTotal = 0;
  statsPdf = 0;
  statsEmail = 0;

  filters: {
    limit: number;
    reportType: string;
    dataset: string;
    modelId: string;
    trainingRunId: string;
  } = {
    limit: 50,
    reportType: '',
    dataset: '',
    modelId: '',
    trainingRunId: ''
  };

  constructor(private apiService: ApiService, private toastService: ToastService) {}

  ngOnInit() {
    this.refreshStats();
    this.refresh();
  }

  clearFilters() {
    this.filters = {
      limit: 50,
      reportType: '',
      dataset: '',
      modelId: '',
      trainingRunId: ''
    };
    this.refresh();
  }

  private refreshStats() {
    this.apiService.getReportStats().subscribe(
      (resp: any) => {
        const s = resp?.stats;
        this.statsTotal = Number(s?.total ?? 0) || 0;
        this.statsPdf = Number(s?.analysis_pdf ?? 0) || 0;
        this.statsEmail = Number(s?.analysis_email ?? 0) || 0;
      },
      () => {}
    );
  }

  refresh() {
    this.isLoading = true;
    this.errorMessage = '';

    const params = {
      limit: this.filters.limit,
      reportType: this.filters.reportType || undefined,
      dataset: this.filters.dataset || undefined,
      modelId: (this.filters.modelId || '').trim() || undefined,
      trainingRunId: (this.filters.trainingRunId || '').trim() || undefined
    };

    this.apiService.getReports(params).subscribe(
      (resp: any) => {
        this.reports = Array.isArray(resp?.reports) ? resp.reports : [];
        this.isLoading = false;
        this.refreshStats();
      },
      (err: any) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || 'Failed to load report history';
      }
    );
  }

  remove(r: any) {
    const id = String(r?._id || '').trim();
    if (!id) return;

    this.isLoading = true;
    this.apiService.deleteReport(id).subscribe(
      () => {
        this.toastService.success('Report deleted', 2500);
        this.reports = this.reports.filter((x: any) => String(x?._id) !== id);
        this.isLoading = false;
        this.refreshStats();
      },
      (err: any) => {
        this.isLoading = false;
        this.toastService.error(err?.error?.message || 'Failed to delete report', 3000);
      }
    );
  }

  formatDate(v: any): string {
    try {
      const d = new Date(v);
      if (Number.isNaN(d.getTime())) return '';
      return d.toLocaleString();
    } catch {
      return '';
    }
  }

  typeColor(reportType: string): string {
    switch ((reportType || '').toLowerCase()) {
      case 'analysis_email':
        return '#f59e0b';
      case 'analysis_pdf':
        return '#10b981';
      default:
        return '#0ea5e9';
    }
  }
}
