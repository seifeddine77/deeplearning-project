import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-gemini',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div style="min-height: calc(100vh - 70px); background: linear-gradient(135deg, #0066ff 0%, #00d4ff 50%, #7209b7 100%); padding: 32px 24px;">
      <div style="max-width: 1200px; margin: 0 auto;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="margin: 0; font-size: 2.5rem; font-weight: 700; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
            <mat-icon svgIcon="robot" style="vertical-align: -6px; margin-right: 10px; color: rgba(255,255,255,0.95);"></mat-icon>
            Gemini 2.5 AI Assistant
          </h1>
          <p style="margin: 10px 0 0 0; font-size: 1rem; color: rgba(255,255,255,0.9);">Analyse intelligente avec l'IA générative Google</p>
        </div>

        <!-- Cards Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; margin-bottom: 30px;">
          <!-- API Status -->
          <div style="background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden;">
            <div style="background: linear-gradient(135deg, #0066ff 0%, #00d4ff 100%); color: white; padding: 16px; border-radius: 12px 12px 0 0;">
              <h3 style="margin: 0; font-size: 1.125rem; font-weight: 600; display:flex; align-items:center; gap: 10px;">
                <mat-icon svgIcon="chart" style="color: rgba(255,255,255,0.95);"></mat-icon>
                Statut API
              </h3>
            </div>
            <div style="padding: 16px;">
              <div style="padding: 12px; background: #f9fafb; border-radius: 8px; border-left: 4px solid #0066ff;">
                <p style="margin: 0 0 4px 0; font-size: 0.875rem; color: #666; font-weight: 600;">Status</p>
                <p style="margin: 0; font-size: 1.125rem; font-weight: 600; color: #0066ff; display:flex; align-items:center; gap: 10px;">
                  <mat-icon [svgIcon]="apiConfigured ? 'check' : 'x'" [style.color]="apiConfigured ? '#10b981' : '#ef4444'"></mat-icon>
                  {{ apiConfigured ? 'Configurée' : 'Non Configurée' }}
                </p>
              </div>
            </div>
          </div>

          <!-- API Configuration -->
          <div style="background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden;">
            <div style="background: linear-gradient(135deg, #0066ff 0%, #00d4ff 100%); color: white; padding: 16px; border-radius: 12px 12px 0 0;">
              <h3 style="margin: 0; font-size: 1.125rem; font-weight: 600; display:flex; align-items:center; gap: 10px;">
                <mat-icon svgIcon="key" style="color: rgba(255,255,255,0.95);"></mat-icon>
                Configurer l'API
              </h3>
            </div>
            <div style="padding: 16px;">
              <div style="margin-bottom: 12px;">
                <label style="display: block; font-size: 0.875rem; font-weight: 600; color: #333; margin-bottom: 4px;">Clé API Gemini</label>
                <input 
                  type="password" 
                  [(ngModel)]="apiKey" 
                  placeholder="Entrez votre clé API"
                  style="width: 100%; padding: 8px; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 0.875rem;"
                />
              </div>
              <button (click)="configureApi()" style="width: 100%; padding: 10px; background: linear-gradient(90deg, #0066ff 0%, #00d4ff 100%); color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">
                Configurer
              </button>
            </div>
          </div>

          <!-- Dataset Analysis -->
          <div style="background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden;">
            <div style="background: linear-gradient(135deg, #0066ff 0%, #00d4ff 100%); color: white; padding: 16px; border-radius: 12px 12px 0 0;">
              <h3 style="margin: 0; font-size: 1.125rem; font-weight: 600; display:flex; align-items:center; gap: 10px;">
                <mat-icon svgIcon="chart" style="color: rgba(255,255,255,0.95);"></mat-icon>
                Analyser Dataset
              </h3>
            </div>
            <div style="padding: 16px;">
              <div style="margin-bottom: 12px;">
                <label style="display: block; font-size: 0.875rem; font-weight: 600; color: #333; margin-bottom: 4px;">Nom du Dataset</label>
                <input 
                  type="text" 
                  [(ngModel)]="datasetName" 
                  placeholder="Ex: MNIST"
                  style="width: 100%; padding: 8px; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 0.875rem;"
                />
              </div>
              <button (click)="analyzeDataset()" [disabled]="isAnalyzing" style="width: 100%; padding: 10px; background: linear-gradient(90deg, #0066ff 0%, #00d4ff 100%); color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">
                <mat-icon [svgIcon]="isAnalyzing ? 'refresh' : 'search'" style="vertical-align: -5px; margin-right: 8px; color: rgba(255,255,255,0.95);"></mat-icon>
                {{ isAnalyzing ? 'Analyse...' : 'Analyser' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Messages -->
        <div *ngIf="errorMessage" style="background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden; border-left: 4px solid #ef4444;">
          <div style="padding: 16px; color: #dc2626; background-color: #fee2e2;">
            <span style="display: inline-flex; align-items: center; gap: 10px;">
              <mat-icon svgIcon="x"></mat-icon>
              {{ errorMessage }}
            </span>
          </div>
        </div>

        <div *ngIf="successMessage" style="background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden; border-left: 4px solid #10b981;">
          <div style="padding: 16px; color: #065f46; background-color: #d1fae5;">
            <span style="display: inline-flex; align-items: center; gap: 10px;">
              <mat-icon svgIcon="check"></mat-icon>
              {{ successMessage }}
            </span>
          </div>
        </div>
      </div>
    </div>
  `
})
export class GeminiComponent implements OnInit {
  apiConfigured = false;
  isAnalyzing = false;
  apiKey = '';
  datasetName = '';
  errorMessage = '';
  successMessage = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.checkApiStatus();
  }

  configureApi() {
    if (!this.apiKey) {
      this.errorMessage = 'Veuillez entrer votre clé API';
      return;
    }
    this.apiConfigured = true;
    this.successMessage = 'API configurée avec succès!';
    this.errorMessage = '';
  }

  checkApiStatus() {
    this.http.get('http://localhost:3000/api/gemini/status')
      .subscribe(
        (response: any) => {
          if (response.success) {
            this.apiConfigured = response.status.configured;
          }
        },
        (error) => {
          console.error('Erreur lors de la vérification du statut:', error);
        }
      );
  }

  analyzeDataset() {
    if (!this.datasetName) {
      this.errorMessage = 'Veuillez entrer le nom du dataset';
      return;
    }
    this.isAnalyzing = true;
    setTimeout(() => {
      this.isAnalyzing = false;
      this.successMessage = `Analyse de ${this.datasetName} complétée!`;
      this.errorMessage = '';
    }, 2000);
  }
}
