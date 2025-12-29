import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ToastComponent } from '../toast/toast.component';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-manage-models',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, ToastComponent],
  template: `
    <app-toast></app-toast>

    <div style="min-height: calc(100vh - 70px); background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 45%, #7c3aed 100%); padding: 32px 24px;">
      <div style="max-width: 1200px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 26px;">
          <h1 style="margin: 0; font-size: 2.2rem; font-weight: 800; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
            <mat-icon style="vertical-align: -6px; margin-right: 10px;">psychology</mat-icon>
            Manage Models
          </h1>
          <p style="margin: 10px 0 0 0; font-size: 1rem; color: rgba(255,255,255,0.9);">List, rename, delete, load, and download model files</p>
        </div>

        <div style="background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); padding: 18px; margin-bottom: 18px; display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; align-items: center;">
          <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center;">
            <div style="font-weight: 800; color: #111;">Total: <span style="color: #2563eb;">{{ models.length }}</span></div>
            <div *ngIf="currentModelId" style="font-weight: 700; color: #111;">Current: <span style="color: #10b981;">{{ currentModelId }}</span></div>
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
            <div style="font-weight: 900; color: #111;">Saved models</div>
            <div style="font-size: 0.875rem; color: #6b7280;">Showing {{ models.length }} items</div>
          </div>

          <div *ngIf="models.length === 0" style="padding: 40px; text-align: center; color: #6b7280;">
            No models found.
          </div>

          <div *ngFor="let m of models" style="padding: 14px 18px; border-bottom: 1px solid #f1f5f9; display: flex; gap: 14px; align-items: flex-start;">
            <div style="width: 10px; height: 10px; border-radius: 999px; margin-top: 7px;" [style.background]="m.id === currentModelId ? '#10b981' : '#94a3b8'"></div>

            <div style="flex: 1;">
              <div style="display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap;">
                <div>
                  <div style="font-weight: 900; color: #111;">{{ m.name || m.id }}</div>
                  <div style="color: #475569; margin-top: 4px; font-size: 0.9rem;">
                    <span style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;">{{ m.id }}</span>
                    <span style="color: #cbd5e1;"> • </span>
                    <span>{{ m.architecture || m.modelType || '-' }}</span>
                    <span style="color: #cbd5e1;"> • </span>
                    <span>{{ m.layers ?? '-' }} layers</span>
                  </div>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: 0.8rem; color: #6b7280;">Saved: {{ formatDate(m.savedAt || m.createdAt) }}</div>
                  <div style="font-size: 0.8rem; color: #6b7280;">Params: {{ m.parameters ? (m.parameters | number) : '-' }}</div>
                </div>
              </div>

              <div style="margin-top: 12px; display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px;">
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px;">
                  <div style="font-size: 0.85rem; font-weight: 900; color: #0f172a; margin-bottom: 8px;">Rename</div>
                  <div style="display: flex; gap: 10px; align-items: center;">
                    <input [(ngModel)]="m._editName" placeholder="New name" style="flex: 1; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 10px;" />
                    <button (click)="saveName(m)" [disabled]="isLoading" style="padding: 10px 12px; background: #2563eb; color: white; border: none; border-radius: 10px; font-weight: 800; cursor: pointer; opacity: {{isLoading ? 0.7 : 1}};">Save</button>
                  </div>
                </div>

                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px;">
                  <div style="font-size: 0.85rem; font-weight: 900; color: #0f172a; margin-bottom: 8px;">Actions</div>
                  <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button (click)="load(m)" [disabled]="isLoading" style="padding: 8px 12px; background: #10b981; color: white; border: none; border-radius: 10px; font-weight: 800; cursor: pointer; opacity: {{isLoading ? 0.7 : 1}};">Load</button>
                    <button (click)="downloadAll(m)" [disabled]="isLoading" style="padding: 8px 12px; background: #0ea5e9; color: white; border: none; border-radius: 10px; font-weight: 800; cursor: pointer; opacity: {{isLoading ? 0.7 : 1}};">Download</button>
                    <button (click)="remove(m)" [disabled]="isLoading" style="padding: 8px 12px; background: #ef4444; color: white; border: none; border-radius: 10px; font-weight: 800; cursor: pointer; opacity: {{isLoading ? 0.7 : 1}};">Delete</button>
                  </div>
                </div>

                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px;">
                  <div style="font-size: 0.85rem; font-weight: 900; color: #0f172a; margin-bottom: 8px;">Files</div>
                  <div *ngIf="m._files?.length" style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <a *ngFor="let f of m._files" [href]="apiService.getModelFileDownloadUrl(m.id, f.filename)" target="_blank" style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 999px; background: #e0f2fe; color: #075985; text-decoration: none; font-weight: 800; font-size: 0.85rem;">
                      {{ f.filename }}
                    </a>
                  </div>
                  <div *ngIf="!m._files?.length" style="color: #64748b; font-size: 0.9rem;">No file list loaded.</div>
                  <div style="margin-top: 10px;">
                    <button (click)="loadFiles(m)" [disabled]="isLoading" style="padding: 8px 12px; background: #111827; color: white; border: none; border-radius: 10px; font-weight: 800; cursor: pointer; opacity: {{isLoading ? 0.7 : 1}};">List files</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ManageModelsComponent implements OnInit {
  models: any[] = [];
  currentModelId: string = '';
  isLoading = false;
  errorMessage = '';

  constructor(public apiService: ApiService, private toastService: ToastService) {}

  ngOnInit() {
    this.refresh();
  }

  refresh() {
    this.isLoading = true;
    this.errorMessage = '';

    this.apiService.getModels().subscribe(
      (resp: any) => {
        const items = Array.isArray(resp?.models) ? resp.models : [];
        this.currentModelId = String(resp?.currentModelId || '');
        this.models = items.map((m: any) => ({
          ...m,
          _editName: m?.name || '',
          _files: null
        }));
        this.isLoading = false;
      },
      (err: any) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || 'Failed to load models';
      }
    );
  }

  saveName(m: any) {
    const modelId = String(m?.id || '').trim();
    const name = String(m?._editName || '').trim();
    if (!modelId || !name) return;

    this.isLoading = true;
    this.apiService.updateModel(modelId, { name }).subscribe(
      (resp: any) => {
        m.name = resp?.model?.name || name;
        this.isLoading = false;
        this.toastService.success('Model updated', 2500);
      },
      (err: any) => {
        this.isLoading = false;
        this.toastService.error(err?.error?.message || 'Failed to update model', 3000);
      }
    );
  }

  load(m: any) {
    const modelId = String(m?.id || '').trim();
    if (!modelId) return;

    this.isLoading = true;
    this.apiService.loadModelById(modelId).subscribe(
      () => {
        this.currentModelId = modelId;
        this.isLoading = false;
        this.toastService.success('Model loaded', 2500);
      },
      (err: any) => {
        this.isLoading = false;
        this.toastService.error(err?.error?.message || 'Failed to load model', 3000);
      }
    );
  }

  loadFiles(m: any) {
    const modelId = String(m?.id || '').trim();
    if (!modelId) return;

    this.isLoading = true;
    this.apiService.listModelFiles(modelId).subscribe(
      (resp: any) => {
        m._files = Array.isArray(resp?.files) ? resp.files : [];
        this.isLoading = false;
      },
      () => {
        m._files = [];
        this.isLoading = false;
      }
    );
  }

  downloadAll(m: any) {
    const modelId = String(m?.id || '').trim();
    if (!modelId) return;

    this.isLoading = true;
    this.apiService.listModelFiles(modelId).subscribe(
      (resp: any) => {
        const files = Array.isArray(resp?.files) ? resp.files : [];
        files.forEach((f: any, idx: number) => {
          const filename = String(f?.filename || '').trim();
          if (!filename) return;
          setTimeout(() => {
            window.open(this.apiService.getModelFileDownloadUrl(modelId, filename), '_blank');
          }, idx * 150);
        });
        this.isLoading = false;
        this.toastService.info(`Downloading ${files.length} file(s)`, 2500);
      },
      (err: any) => {
        this.isLoading = false;
        this.toastService.error(err?.error?.message || 'Failed to list model files', 3000);
      }
    );
  }

  remove(m: any) {
    const modelId = String(m?.id || '').trim();
    if (!modelId) return;

    this.isLoading = true;
    this.apiService.deleteModel(modelId).subscribe(
      () => {
        this.models = this.models.filter((x: any) => String(x?.id) !== modelId);
        if (this.currentModelId === modelId) this.currentModelId = '';
        this.isLoading = false;
        this.toastService.success('Model deleted', 2500);
      },
      (err: any) => {
        this.isLoading = false;
        this.toastService.error(err?.error?.message || 'Failed to delete model', 3000);
      }
    );
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
