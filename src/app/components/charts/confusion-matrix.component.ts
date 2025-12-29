import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-confusion-matrix',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div style="background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); padding: 24px; margin-bottom: 24px;">
      <h2 style="margin: 0 0 24px 0; font-size: 1.5rem; font-weight: 600; color: #333; display:flex; align-items:center; gap: 10px;">
        <mat-icon svgIcon="chart"></mat-icon>
        Confusion Matrix - MNIST
      </h2>
      
      <div *ngIf="confusionMatrix.length > 0; else noData">
        <div style="display: flex; gap: 24px; margin-bottom: 24px;">
          <!-- Heatmap -->
          <div style="flex: 1; overflow-x: auto;">
            <div style="display: inline-block; position: relative;">
              <!-- Labels Y (True Label) -->
              <div style="display: flex; gap: 0;">
                <div style="width: 60px; display: flex; flex-direction: column; justify-content: flex-end; padding-bottom: 20px;">
                  <div style="writing-mode: vertical-rl; transform: rotate(180deg); text-align: center; font-weight: 600; color: #333; font-size: 0.875rem;">True Label</div>
                </div>
                
                <!-- Matrix -->
                <div>
                  <!-- Labels X (Predicted Label) -->
                  <div style="display: flex; gap: 0; margin-bottom: 8px;">
                    <div style="width: 20px;"></div>
                    <div *ngFor="let i of range(numClasses)" style="width: 50px; text-align: center; font-weight: 600; color: #333; font-size: 0.875rem;">{{ i }}</div>
                  </div>
                  
                  <!-- Heatmap cells -->
                  <div *ngFor="let row of confusionMatrix; let i = index" style="display: flex; gap: 0; margin-bottom: 2px;">
                    <div style="width: 20px; text-align: center; font-weight: 600; color: #333; font-size: 0.875rem; padding-top: 12px;">{{ i }}</div>
                    <div *ngFor="let cell of row; let j = index" 
                         [style.background]="getHeatmapColor(cell)"
                         [style.color]="cell > (maxCellValue * 0.6) ? 'white' : '#333'"
                         style="width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; border: 1px solid #e0e0e0; font-weight: 600; font-size: 0.75rem; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">
                      {{ cell }}
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- X Label -->
              <div style="text-align: center; margin-top: 12px; font-weight: 600; color: #333; font-size: 0.875rem;">Predicted Label</div>
            </div>
          </div>

          <!-- Colorbar -->
          <div style="width: 30px; display: flex; flex-direction: column; gap: 4px;">
            <div *ngFor="let color of colorbar" [style.background]="color" style="flex: 1; border: 1px solid #e0e0e0; border-radius: 2px;"></div>
            <div style="text-align: center; font-size: 0.75rem; color: #666; margin-top: 8px;">
              <div>{{ maxCellValue }}</div>
              <div style="margin-top: 4px;">0</div>
            </div>
          </div>
        </div>

        <!-- Metrics -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
          <div style="padding: 12px; background: #f0f9ff; border-radius: 6px; border-left: 4px solid #0066ff;">
            <div style="font-size: 0.875rem; color: #666; font-weight: 600;">Accuracy</div>
            <div style="font-size: 1.5rem; font-weight: 700; color: #0066ff; margin-top: 4px;">{{ (accuracy * 100).toFixed(1) }}%</div>
          </div>
          <div style="padding: 12px; background: #f0fdf4; border-radius: 6px; border-left: 4px solid #10b981;">
            <div style="font-size: 0.875rem; color: #666; font-weight: 600;">Precision</div>
            <div style="font-size: 1.5rem; font-weight: 700; color: #10b981; margin-top: 4px;">{{ (precision * 100).toFixed(1) }}%</div>
          </div>
          <div style="padding: 12px; background: #fef3c7; border-radius: 6px; border-left: 4px solid #f59e0b;">
            <div style="font-size: 0.875rem; color: #666; font-weight: 600;">Recall</div>
            <div style="font-size: 1.5rem; font-weight: 700; color: #f59e0b; margin-top: 4px;">{{ (recall * 100).toFixed(1) }}%</div>
          </div>
        </div>
      </div>

      <ng-template #noData>
        <div style="padding: 40px; text-align: center; background: #f9fafb; border-radius: 8px;">
          <p style="font-size: 1rem; color: #999; margin: 0; display:flex; align-items:center; justify-content:center; gap: 10px;">
            <mat-icon svgIcon="info"></mat-icon>
            Démarrez le training pour voir la matrice de confusion
          </p>
        </div>
      </ng-template>
    </div>
  `
})
export class ConfusionMatrixComponent implements OnInit, OnChanges {
  @Input() isTraining = false;
  @Input() trainingHistory: any[] = [];
  @Input() confusionData: any = null;

  confusionMatrix: number[][] = [];
  accuracy = 0;
  precision = 0;
  recall = 0;
  colorbar: string[] = [];

  constructor() {}

  ngOnInit() {
    this.generateColorbar();
    this.updateFromInputs();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['confusionData'] || changes['trainingHistory']) {
      this.updateFromInputs();
    }
  }

  private updateFromInputs() {
    const matrix = this.confusionData?.matrix;
    if (Array.isArray(matrix) && matrix.length > 0) {
      this.confusionMatrix = matrix;
      this.accuracy = Number(this.confusionData?.accuracy || 0);
      this.precision = Number(this.confusionData?.precision || 0);
      this.recall = Number(this.confusionData?.recall || 0);
      return;
    }

    this.confusionMatrix = [];
    this.accuracy = 0;
    this.precision = 0;
    this.recall = 0;
  }

  range(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i);
  }

  get numClasses(): number {
    return Array.isArray(this.confusionMatrix) ? this.confusionMatrix.length : 0;
  }

  get maxCellValue(): number {
    return this.getMaxCellValue();
  }

  private getMaxCellValue(): number {
    let max = 0;
    for (const row of this.confusionMatrix || []) {
      for (const v of row || []) {
        if (typeof v === 'number' && v > max) max = v;
      }
    }
    return max || 1;
  }

  getHeatmapColor(value: number): string {
    const max = this.getMaxCellValue();
    const normalized = Math.min(value / max, 1);
    
    // Create gradient from light blue to dark blue
    const hue = 210; // Blue hue
    const saturation = 100;
    const lightness = 100 - (normalized * 50); // From 100% (white) to 50% (dark blue)
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  private generateColorbar() {
    // Generate 20 colors for the colorbar
    this.colorbar = Array.from({ length: 20 }, (_, i) => {
      const normalized = i / 19;
      const hue = 210;
      const saturation = 100;
      const lightness = 100 - (normalized * 50);
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    });
  }
}
