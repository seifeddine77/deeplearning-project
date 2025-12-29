import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-roc-curve',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div style="background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); padding: 24px; margin-bottom: 24px;">
      <h2 style="margin: 0 0 24px 0; font-size: 1.5rem; font-weight: 600; color: #333; display:flex; align-items:center; gap: 10px;">
        <mat-icon svgIcon="chart"></mat-icon>
        ROC Curve
      </h2>
      
      <div *ngIf="trainingHistory.length > 0; else noData">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
          <div style="padding: 12px; background: #f0f9ff; border-radius: 6px; border-left: 4px solid #0066ff;">
            <div style="font-size: 0.875rem; color: #666; font-weight: 600;">AUC Score</div>
            <div style="font-size: 1.5rem; font-weight: 700; color: #0066ff; margin-top: 4px;">{{ aucScore.toFixed(4) }}</div>
          </div>
          <div style="padding: 12px; background: #f0fdf4; border-radius: 6px; border-left: 4px solid #10b981;">
            <div style="font-size: 0.875rem; color: #666; font-weight: 600;">Classification</div>
            <div style="font-size: 1.5rem; font-weight: 700; color: #10b981; margin-top: 4px;">{{ classification }}</div>
          </div>
        </div>

        <div style="background: #f9fafb; border-radius: 8px; padding: 16px;">
          <h3 style="margin: 0 0 16px 0; font-size: 1.125rem; font-weight: 600; color: #333;">True Positive Rate vs False Positive Rate</h3>
          <svg width="100%" height="300" style="border: 1px solid #e0e0e0; border-radius: 6px;">
            <polyline [attr.points]="rocPoints" style="fill:none;stroke:#0066ff;stroke-width:2" />
            <polyline points="30,270 270,30" style="fill:none;stroke:#999;stroke-width:1;stroke-dasharray:5,5" />
          </svg>
          <p style="margin: 12px 0 0 0; font-size: 0.875rem; color: #666;">The blue curve shows the ROC curve, the dashed line represents random classifier (AUC=0.5)</p>
        </div>
      </div>

      <ng-template #noData>
        <div style="padding: 40px; text-align: center; background: #f9fafb; border-radius: 8px;">
          <p style="font-size: 1rem; color: #999; margin: 0; display:flex; align-items:center; justify-content:center; gap: 10px;">
            <mat-icon svgIcon="info"></mat-icon>
            Démarrez le training pour voir la courbe ROC
          </p>
        </div>
      </ng-template>
    </div>
  `
})
export class RocCurveComponent implements OnInit, OnChanges {
  @Input() isTraining = false;
  @Input() trainingHistory: any[] = [];
  @Input() rocData: any = null;

  rocPoints = '';
  aucScore = 0.5;
  classification = 'Poor';

  rocCurvePoints: Array<[number, number]> = [];

  constructor() {}

  ngOnInit() {
    this.updateFromInputs();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['rocData'] || changes['trainingHistory']) {
      this.updateFromInputs();
    }
  }

  private updateFromInputs() {
    const points = this.rocData?.points;
    const auc = this.rocData?.auc;

    if (!Array.isArray(points) || points.length === 0) {
      this.rocPoints = '';
      this.aucScore = 0;
      this.classification = 'No Data';
      this.rocCurvePoints = [];
      return;
    }

    this.rocCurvePoints = points;
    this.aucScore = Number(auc ?? 0);

    if (this.aucScore >= 0.9) this.classification = 'Excellent';
    else if (this.aucScore >= 0.8) this.classification = 'Good';
    else if (this.aucScore >= 0.7) this.classification = 'Fair';
    else if (this.aucScore >= 0.6) this.classification = 'Poor';
    else if (this.aucScore > 0) this.classification = 'Fail';
    else this.classification = 'No Data';

    // Convert to SVG points
    const width = 600;
    const height = 300;
    const padding = 30;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;

    this.rocPoints = this.rocCurvePoints
      .map(([fpr, tpr]: any) => {
        const x = padding + Number(fpr) * chartWidth;
        const y = height - padding - Number(tpr) * chartHeight;
        return `${x},${y}`;
      })
      .join(' ');
  }

}
