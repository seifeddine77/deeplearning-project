import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../services/api.service';
import { ToastComponent } from '../toast/toast.component';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-kaggle',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, ToastComponent],
  template: `
    <app-toast></app-toast>

    <div style="min-height: calc(100vh - 70px); background: linear-gradient(135deg, #0066ff 0%, #00d4ff 50%, #7209b7 100%); padding: 32px 24px;">
      <div style="max-width: 1200px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="margin: 0; font-size: 2.5rem; font-weight: 700; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
            <mat-icon svgIcon="cap" style="vertical-align: -10px; margin-right: 10px; color: rgba(255,255,255,0.95); font-size: 42px; width: 42px; height: 42px;"></mat-icon>
            Kaggle Datasets
          </h1>
          <p style="margin: 10px 0 0 0; font-size: 1rem; color: rgba(255,255,255,0.9);">Téléchargez et gérez vos datasets Kaggle</p>
        </div>

        <div *ngIf="errorMessage" style="margin-bottom: 16px; padding: 12px 14px; background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.35); color: #7f1d1d; border-radius: 12px; font-weight: 800;">
          {{ errorMessage }}
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; margin-bottom: 30px;">
          <div style="background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden;">
            <div style="background: linear-gradient(135deg, #0066ff 0%, #00d4ff 100%); color: white; padding: 16px; border-radius: 12px 12px 0 0;">
              <h3 style="margin: 0; font-size: 1.125rem; font-weight: 700; display:flex; align-items:center; gap: 10px;">
                <mat-icon svgIcon="chart" style="color: rgba(255,255,255,0.95);"></mat-icon>
                Datasets populaires
              </h3>
            </div>
            <div style="padding: 16px;">
              <p style="margin: 0; color: #666; font-size: 0.875rem;">
                Clique “Charger”, puis “Ouvrir sur Kaggle” pour télécharger manuellement le ZIP. Ensuite, va sur la page Data pour l’upload.
              </p>
              <button (click)="loadPopularDatasets()" [disabled]="isLoadingPopular" style="width: 100%; padding: 10px; margin-top: 12px; background: linear-gradient(90deg, #0066ff 0%, #00d4ff 100%); color: white; border: none; border-radius: 6px; font-weight: 700; cursor: pointer; opacity: {{ isLoadingPopular ? 0.7 : 1 }};">
                {{ isLoadingPopular ? 'Chargement...' : 'Charger' }}
              </button>

              <div *ngIf="popularDatasets.length" style="margin-top: 14px; display: grid; gap: 10px;">
                <div *ngFor="let d of popularDatasets" style="padding: 12px; border: 1px solid #e5e7eb; border-radius: 12px; background: #f8fafc;">
                  <div style="display: flex; justify-content: space-between; gap: 12px; align-items: flex-start;">
                    <div>
                      <div style="font-weight: 900; color: #0f172a;">{{ d.name }}</div>
                      <div style="color: #475569; font-size: 0.9rem;">{{ d.description }}</div>
                      <div style="color: #64748b; font-size: 0.85rem; margin-top: 6px;">Id: <span style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;">{{ d.id }}</span></div>
                    </div>
                    <button (click)="openOnKaggle(d.id)" style="padding: 8px 12px; background: #0ea5e9; color: white; border: none; border-radius: 10px; font-weight: 800; cursor: pointer; white-space: nowrap;">Ouvrir sur Kaggle</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style="background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden;">
            <div style="background: linear-gradient(135deg, #0066ff 0%, #00d4ff 100%); color: white; padding: 16px; border-radius: 12px 12px 0 0;">
              <h3 style="margin: 0; font-size: 1.125rem; font-weight: 700; display:flex; align-items:center; gap: 10px;">
                <mat-icon svgIcon="download" style="color: rgba(255,255,255,0.95);"></mat-icon>
                Télécharger (1 clic)
              </h3>
            </div>
            <div style="padding: 16px;">
              <p style="margin: 0 0 12px 0; color: #666; font-size: 0.875rem;">
                Télécharge directement dans <b>datasets/</b> via la clé Kaggle du serveur.
              </p>

              <div style="margin-bottom: 12px;">
                <label style="display: block; font-size: 0.875rem; font-weight: 700; color: #333; margin-bottom: 4px;">Dataset (slug Kaggle)</label>
                <input type="text" [(ngModel)]="datasetName" placeholder="Ex: zalando-research/fashionmnist" style="width: 100%; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 10px;" />
              </div>

              <button (click)="downloadDataset()" [disabled]="isDownloading" style="width: 100%; padding: 10px; background: linear-gradient(90deg, #0066ff 0%, #00d4ff 100%); color: white; border: none; border-radius: 10px; font-weight: 800; cursor: pointer; opacity: {{ isDownloading ? 0.7 : 1 }};">
                {{ isDownloading ? 'Téléchargement...' : 'Télécharger' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class KaggleComponent implements OnInit {
  datasetName = '';
  isDownloading = false;
  isLoadingPopular = false;
  errorMessage = '';
  popularDatasets: any[] = [];

  constructor(private apiService: ApiService, private toastService: ToastService) {}

  ngOnInit() {
  }

  loadPopularDatasets() {
    this.errorMessage = '';

    this.isLoadingPopular = true;
    this.apiService.getKagglePopularDatasets().subscribe(
      (resp: any) => {
        this.popularDatasets = Array.isArray(resp?.datasets) ? resp.datasets : [];
        this.isLoadingPopular = false;
      },
      (err: any) => {
        this.isLoadingPopular = false;
        this.errorMessage = err?.error?.message || err?.error?.error || 'Failed to load popular datasets';
        this.toastService.error(this.errorMessage, 3500);
      }
    );
  }

  downloadPopular(id: string) {
    const slug = String(id || '').trim();
    if (!slug) return;
    this.datasetName = slug;
    this.downloadDataset();
  }

  downloadDataset() {
    const datasetName = String(this.datasetName || '').trim();
    if (!datasetName) {
      this.errorMessage = 'Veuillez entrer un dataset (ex: owner/dataset-slug)';
      this.toastService.error(this.errorMessage, 3500);
      return;
    }

    if (!datasetName.includes('/')) {
      this.errorMessage = 'Format invalide. Utilise le slug Kaggle: owner/dataset (ex: zalando-research/fashionmnist)';
      this.toastService.error(this.errorMessage, 4000);
      return;
    }

    this.errorMessage = '';
    this.isDownloading = true;
    this.toastService.info('Téléchargement en cours...', 2500);

    this.apiService.downloadKaggleDataset({ datasetName }).subscribe(
      (resp: any) => {
        this.isDownloading = false;
        if (resp?.success) {
          this.toastService.success(resp?.message || 'Dataset téléchargé', 3500);
          this.datasetName = '';
          return;
        }
        const msg = resp?.message || resp?.error || 'Download failed';
        this.errorMessage = msg;
        this.toastService.error(msg, 4500);
      },
      (err: any) => {
        this.isDownloading = false;
        const msg = err?.error?.message || err?.error?.error || 'Download failed';
        this.errorMessage = msg;
        this.toastService.error(msg, 4500);
      }
    );
  }

  openOnKaggle(id: string) {
    const datasetId = String(id || '').trim();
    if (!datasetId) return;
    const url = `https://www.kaggle.com/datasets/${encodeURIComponent(datasetId)}`;
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      this.toastService.error('Impossible d’ouvrir Kaggle. Copie le lien manuellement: ' + url, 4500);
    }
  }
}
