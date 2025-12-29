import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-feature-importance',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div style="background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); padding: 24px; margin-bottom: 24px;">
      <h2 style="margin: 0 0 24px 0; font-size: 1.5rem; font-weight: 600; color: #333; display:flex; align-items:center; gap: 10px;">
        <mat-icon svgIcon="search"></mat-icon>
        Feature Importance
      </h2>
      
      <div *ngIf="trainingHistory.length > 0; else noData">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
          <div style="padding: 12px; background: #f0f9ff; border-radius: 6px; border-left: 4px solid #0066ff;">
            <div style="font-size: 0.875rem; color: #666; font-weight: 600;">Top Feature</div>
            <div style="font-size: 1.5rem; font-weight: 700; color: #0066ff; margin-top: 4px;">{{ topFeature }}</div>
          </div>
          <div style="padding: 12px; background: #f0fdf4; border-radius: 6px; border-left: 4px solid #10b981;">
            <div style="font-size: 0.875rem; color: #666; font-weight: 600;">Max Importance</div>
            <div style="font-size: 1.5rem; font-weight: 700; color: #10b981; margin-top: 4px;">{{ maxImportance.toFixed(4) }}</div>
          </div>
        </div>

        <div style="background: #f9fafb; border-radius: 8px; padding: 16px;">
          <h3 style="margin: 0 0 16px 0; font-size: 1.125rem; font-weight: 600; color: #333;">Feature Importance Scores</h3>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div *ngFor="let feature of features" style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 120px; font-size: 0.875rem; font-weight: 600; color: #333;">{{ feature.name }}</div>
              <div style="flex: 1; background: #e0e0e0; height: 24px; border-radius: 4px; overflow: hidden;">
                <div [style.width.%]="feature.importance * 100" style="height: 100%; background: linear-gradient(90deg, #0066ff 0%, #00d4ff 100%); transition: width 0.3s;"></div>
              </div>
              <div style="width: 60px; text-align: right; font-size: 0.875rem; font-weight: 600; color: #0066ff;">{{ (feature.importance * 100).toFixed(1) }}%</div>
            </div>
          </div>
        </div>
      </div>

      <ng-template #noData>
        <div style="padding: 40px; text-align: center; background: #f9fafb; border-radius: 8px;">
          <p style="font-size: 1rem; color: #999; margin: 0; display:flex; align-items:center; justify-content:center; gap: 10px;">
            <mat-icon svgIcon="info"></mat-icon>
            Démarrez le training pour voir l'importance des features
          </p>
        </div>
      </ng-template>
    </div>
  `
})
export class FeatureImportanceComponent implements OnInit, OnChanges {
  @Input() isTraining = false;
  @Input() trainingHistory: any[] = [];
  @Input() featureData: any = null;

  features: any[] = [];
  topFeature = 'Feature 1';
  maxImportance = 0.9234;

  constructor() {}

  ngOnInit() {
    this.updateFromInputs();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['featureData'] || changes['trainingHistory']) {
      this.updateFromInputs();
    }
  }

  private updateFromInputs() {
    const feats = this.featureData?.features;
    if (Array.isArray(feats) && feats.length > 0) {
      this.features = feats;
      this.topFeature = String(this.featureData?.topFeature || feats[0]?.name || 'N/A');
      this.maxImportance = Number(this.featureData?.maxImportance ?? feats[0]?.importance ?? 0);
      return;
    }

    this.features = [];
    this.topFeature = 'N/A';
    this.maxImportance = 0;
  }
}
