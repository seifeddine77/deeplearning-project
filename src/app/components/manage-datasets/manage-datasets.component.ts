import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-manage-datasets',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="min-height: calc(100vh - 70px); background: linear-gradient(135deg, #22c55e 0%, #0ea5e9 55%, #7c3aed 100%); padding: 32px 24px;">
      <div style="max-width: 1200px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 26px;">
          <h1 style="margin: 0; font-size: 2.2rem; font-weight: 800; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">Manage Datasets</h1>
          <p style="margin: 10px 0 0 0; font-size: 1rem; color: rgba(255,255,255,0.9);">Rename, delete, download, and replace dataset files</p>
        </div>

        <div style="background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); padding: 18px; margin-bottom: 18px; display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; align-items: center;">
          <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center;">
            <div style="font-weight: 800; color: #111;">Total: <span style="color: #0ea5e9;">{{ datasets.length }}</span></div>
            <div *ngIf="errorMessage" style="color: #b91c1c; font-weight: 700;">{{ errorMessage }}</div>
          </div>

          <div style="display: flex; gap: 10px;">
            <button (click)="refresh()" [disabled]="isLoading" style="padding: 10px 14px; background: #0ea5e9; color: white; border: none; border-radius: 10px; font-weight: 800; cursor: pointer; opacity: {{isLoading ? 0.7 : 1}};">
              {{ isLoading ? 'Loading...' : 'Refresh' }}
            </button>
          </div>
        </div>

        <div style="background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden;">
          <div style="padding: 14px 18px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
            <div style="font-weight: 900; color: #111;">Saved datasets</div>
            <div style="font-size: 0.875rem; color: #6b7280;">Showing {{ datasets.length }} items</div>
          </div>

          <div *ngIf="datasets.length === 0" style="padding: 40px; text-align: center; color: #6b7280;">
            No datasets found.
          </div>

          <div *ngFor="let ds of datasets" style="padding: 14px 18px; border-bottom: 1px solid #f1f5f9; display: flex; gap: 14px; align-items: flex-start;">
            <div style="width: 10px; height: 10px; border-radius: 999px; margin-top: 7px;" [style.background]="statusColor(ds.status)"></div>

            <div style="flex: 1;">
              <div style="display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap;">
                <div>
                  <div style="font-weight: 900; color: #111;">{{ ds.name }}</div>
                  <div style="color: #475569; margin-top: 4px; font-size: 0.9rem;">
                    <span style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;">{{ ds._id }}</span>
                    <span style="color: #cbd5e1;"> • </span>
                    <span>{{ ds.datasetType || '-' }}</span>
                    <span style="color: #cbd5e1;"> • </span>
                    <span>{{ ds.fileType || '-' }}</span>
                    <span style="color: #cbd5e1;"> • </span>
                    <span>{{ ds.totalSamples || 0 }} samples</span>
                  </div>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: 0.8rem; color: #6b7280;">Updated: {{ formatDate(ds.updatedAt) }}</div>
                  <div style="font-size: 0.8rem; color: #6b7280;">Fingerprint: {{ ds.fingerprintHash || '-' }}</div>
                </div>
              </div>

              <div style="margin-top: 12px; display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px;">
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px;">
                  <div style="font-size: 0.85rem; font-weight: 900; color: #0f172a; margin-bottom: 8px;">Rename</div>
                  <div style="display: flex; gap: 10px; align-items: center;">
                    <input [(ngModel)]="ds._editName" placeholder="New name" style="flex: 1; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 10px;" />
                    <button (click)="saveName(ds)" [disabled]="isLoading" style="padding: 10px 12px; background: #2563eb; color: white; border: none; border-radius: 10px; font-weight: 800; cursor: pointer; opacity: {{isLoading ? 0.7 : 1}};">Save</button>
                  </div>
                </div>

                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px;">
                  <div style="font-size: 0.85rem; font-weight: 900; color: #0f172a; margin-bottom: 8px;">Replace file</div>
                  <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                    <input type="file" (change)="onFileSelected($event, ds)" />
                    <select [(ngModel)]="ds._replaceType" style="padding: 8px 10px; border: 1px solid #e2e8f0; border-radius: 10px;">
                      <option value="">(keep)</option>
                      <option value="tabular">tabular</option>
                      <option value="image">image</option>
                      <option value="sequence">sequence</option>
                      <option value="text">text</option>
                      <option value="audio">audio</option>
                    </select>
                    <button (click)="replace(ds)" [disabled]="isLoading || !ds._selectedFile" style="padding: 10px 12px; background: #10b981; color: white; border: none; border-radius: 10px; font-weight: 800; cursor: pointer; opacity: {{(isLoading || !ds._selectedFile) ? 0.7 : 1}};">Replace</button>
                  </div>
                  <div *ngIf="ds._selectedFile" style="margin-top: 8px; color: #64748b; font-size: 0.85rem;">Selected: {{ ds._selectedFile?.name }}</div>
                </div>

                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px;">
                  <div style="font-size: 0.85rem; font-weight: 900; color: #0f172a; margin-bottom: 8px;">Actions</div>
                  <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <a [href]="apiService.getDatasetDownloadUrl(ds._id)" target="_blank" style="padding: 8px 12px; background: #0ea5e9; color: white; border-radius: 10px; text-decoration: none; font-weight: 800;">Download</a>
                    <button (click)="remove(ds)" [disabled]="isLoading" style="padding: 8px 12px; background: #ef4444; color: white; border: none; border-radius: 10px; font-weight: 800; cursor: pointer; opacity: {{isLoading ? 0.7 : 1}};">Delete</button>
                  </div>
                </div>
              </div>

              <div *ngIf="ds.description" style="margin-top: 10px; font-size: 0.9rem; color: #334155;">{{ ds.description }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ManageDatasetsComponent implements OnInit {
  datasets: any[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(public apiService: ApiService, private toastService: ToastService) {}

  ngOnInit() {
    this.refresh();
  }

  refresh() {
    this.isLoading = true;
    this.errorMessage = '';

    this.apiService.getDatasets().subscribe(
      (resp: any) => {
        const items = Array.isArray(resp?.datasets) ? resp.datasets : [];
        this.datasets = items.map((d: any) => ({
          ...d,
          _editName: d?.name || '',
          _selectedFile: null,
          _replaceType: ''
        }));
        this.isLoading = false;
      },
      (err: any) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || 'Failed to load datasets';
      }
    );
  }

  saveName(ds: any) {
    const id = String(ds?._id || '').trim();
    const name = String(ds?._editName || '').trim();
    if (!id || !name) return;

    this.isLoading = true;
    this.apiService.updateDataset(id, { name }).subscribe(
      (resp: any) => {
        ds.name = resp?.dataset?.name || name;
        this.isLoading = false;
        this.toastService.success('Dataset updated', 2500);
      },
      (err: any) => {
        this.isLoading = false;
        this.toastService.error(err?.error?.message || 'Failed to update dataset', 3000);
      }
    );
  }

  onFileSelected(event: any, ds: any) {
    ds._selectedFile = event?.target?.files?.[0] || null;
  }

  replace(ds: any) {
    const id = String(ds?._id || '').trim();
    const file: File | null = ds?._selectedFile || null;
    if (!id || !file) return;

    this.isLoading = true;
    const datasetType = String(ds?._replaceType || '').trim() || undefined;

    this.apiService.replaceDataset(id, file, datasetType).subscribe(
      (resp: any) => {
        const updated = resp?.dataset;
        if (updated) {
          Object.assign(ds, updated);
        }
        ds._selectedFile = null;
        ds._replaceType = '';
        this.isLoading = false;
        this.toastService.success('Dataset replaced', 2500);
      },
      (err: any) => {
        this.isLoading = false;
        this.toastService.error(err?.error?.message || 'Failed to replace dataset', 3000);
      }
    );
  }

  remove(ds: any) {
    const id = String(ds?._id || '').trim();
    if (!id) return;

    this.isLoading = true;
    this.apiService.deleteDataset(id).subscribe(
      () => {
        this.datasets = this.datasets.filter((x: any) => String(x?._id) !== id);
        this.isLoading = false;
        this.toastService.success('Dataset deleted', 2500);
      },
      (err: any) => {
        this.isLoading = false;
        this.toastService.error(err?.error?.message || 'Failed to delete dataset', 3000);
      }
    );
  }

  statusColor(status: any): string {
    const s = String(status || '').toLowerCase();
    if (s === 'ready') return '#10b981';
    if (s === 'processing') return '#f59e0b';
    if (s === 'error') return '#ef4444';
    return '#94a3b8';
  }

  formatDate(v: any): string {
    try {
      const d = new Date(v);
      if (Number.isNaN(d.getTime())) return '-';
      return d.toLocaleString();
    } catch {
      return '-';
    }
  }
}
