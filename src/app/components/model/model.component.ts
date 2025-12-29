import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-model',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div style="min-height: calc(100vh - 70px); background: linear-gradient(135deg, #0066ff 0%, #00d4ff 50%, #7209b7 100%); padding: 32px 24px;">
      <div style="max-width: 1200px; margin: 0 auto;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="margin: 0; font-size: 2.5rem; font-weight: 700; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
            <mat-icon svgIcon="brain" style="vertical-align: -10px; margin-right: 10px; color: rgba(255,255,255,0.95); font-size: 42px; width: 42px; height: 42px;"></mat-icon>
            Model Configuration
          </h1>
          <p style="margin: 10px 0 0 0; font-size: 1rem; color: rgba(255,255,255,0.9);">Create, manage, and configure your CNN+LSTM models</p>
        </div>

        <!-- Cards Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; margin-bottom: 30px;">
          <!-- Create Model -->
          <div style="background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden;">
            <div style="background: linear-gradient(135deg, #0066ff 0%, #00d4ff 100%); color: white; padding: 16px; border-radius: 12px 12px 0 0;">
              <h3 style="margin: 0; font-size: 1.125rem; font-weight: 600; display:flex; align-items:center; gap: 10px;">
                <mat-icon svgIcon="plus" style="color: rgba(255,255,255,0.95);"></mat-icon>
                Create Model
              </h3>
            </div>
            <div style="padding: 16px;">
              <div style="margin-bottom: 12px;">
                <label style="display: block; font-size: 0.875rem; font-weight: 600; color: #333; margin-bottom: 4px;">Model Type</label>
                <select [(ngModel)]="modelType" style="width: 100%; padding: 8px; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 0.875rem;">
                  <option value="dnn">DNN (Tabular)</option>
                  <option value="cnn">CNN (Image)</option>
                  <option value="lstm">LSTM (Sequence)</option>
                  <option value="transformer">Transformer (Sequence)</option>
                  <option value="transformer_full">Transformer (Full)</option>
                  <option value="lightweight">CNN+LSTM (Default)</option>
                  <option value="full">CNN+LSTM (Full)</option>
                </select>
              </div>
              <div *ngIf="modelType !== 'dnn' && modelType !== 'lstm' && modelType !== 'transformer' && modelType !== 'transformer_full'" style="margin-bottom: 12px;">
                <label style="display: block; font-size: 0.875rem; font-weight: 600; color: #333; margin-bottom: 4px;">Input Height</label>
                <input type="number" [(ngModel)]="inputHeight" [readonly]="lockImageInputShape" min="32" max="512" style="width: 100%; padding: 8px; border: 2px solid #e0e0e0; border-radius: 6px;" />
              </div>
              <div *ngIf="modelType !== 'dnn' && modelType !== 'lstm' && modelType !== 'transformer' && modelType !== 'transformer_full'" style="margin-bottom: 12px;">
                <label style="display: block; font-size: 0.875rem; font-weight: 600; color: #333; margin-bottom: 4px;">Input Width</label>
                <input type="number" [(ngModel)]="inputWidth" [readonly]="lockImageInputShape" min="32" max="512" style="width: 100%; padding: 8px; border: 2px solid #e0e0e0; border-radius: 6px;" />
              </div>
              <div *ngIf="modelType !== 'dnn' && modelType !== 'lstm' && modelType !== 'transformer' && modelType !== 'transformer_full'" style="margin-bottom: 12px;">
                <label style="display: block; font-size: 0.875rem; font-weight: 600; color: #333; margin-bottom: 4px;">Channels</label>
                <input type="number" [(ngModel)]="channels" [readonly]="lockImageInputShape" min="1" max="3" style="width: 100%; padding: 8px; border: 2px solid #e0e0e0; border-radius: 6px;" />
                <div *ngIf="lockImageInputShape" style="margin-top: 6px; font-size: 0.8rem; color: #666;">
                  Using dataset input shape from Data page.
                </div>
              </div>
              <div *ngIf="modelType === 'lstm' || modelType === 'transformer' || modelType === 'transformer_full'" style="margin-bottom: 12px;">
                <label style="display: block; font-size: 0.875rem; font-weight: 600; color: #333; margin-bottom: 4px;">Sequence Timesteps</label>
                <input type="number" [(ngModel)]="seqTimesteps" min="1" max="10000" style="width: 100%; padding: 8px; border: 2px solid #e0e0e0; border-radius: 6px;" />
              </div>
              <div *ngIf="modelType === 'lstm' || modelType === 'transformer' || modelType === 'transformer_full'" style="margin-bottom: 12px;">
                <label style="display: block; font-size: 0.875rem; font-weight: 600; color: #333; margin-bottom: 4px;">Sequence Features</label>
                <input type="number" [(ngModel)]="seqFeatures" min="1" max="10000" style="width: 100%; padding: 8px; border: 2px solid #e0e0e0; border-radius: 6px;" />
              </div>
              <div style="margin-bottom: 12px;">
                <label style="display: block; font-size: 0.875rem; font-weight: 600; color: #333; margin-bottom: 4px;">Number of Classes</label>
                <input type="number" [(ngModel)]="numClasses" min="2" max="1000" style="width: 100%; padding: 8px; border: 2px solid #e0e0e0; border-radius: 6px;" />
              </div>
              <button (click)="createModel()" [disabled]="isCreating" style="width: 100%; padding: 10px; margin-top: 8px; background: linear-gradient(90deg, #0066ff 0%, #00d4ff 100%); color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; opacity: {{ isCreating ? 0.7 : 1 }};">{{ isCreating ? 'Creating...' : 'Create Model' }}</button>
              
              <!-- Progress Bar -->
              <div *ngIf="isCreating" style="margin-top: 12px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="font-size: 0.875rem; font-weight: 600; color: #0066ff;">{{ progressMessage }}</span>
                  <span style="font-size: 0.875rem; font-weight: 600; color: #0066ff;">{{ progressValue }}%</span>
                </div>
                <div style="width: 100%; height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden;">
                  <div style="height: 100%; background: linear-gradient(90deg, #0066ff 0%, #00d4ff 100%); width: {{ progressValue }}%; transition: width 0.3s ease; border-radius: 4px;"></div>
                </div>
              </div>
              
              <p *ngIf="modelStatus" style="margin-top: 8px; padding: 8px; background: #d1fae5; color: #065f46; border-radius: 6px; font-size: 0.875rem;">{{ modelStatus }}</p>
            </div>
          </div>

          <!-- Model Management -->
          <div style="background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden;">
            <div style="background: linear-gradient(135deg, #0066ff 0%, #00d4ff 100%); color: white; padding: 16px; border-radius: 12px 12px 0 0;">
              <h3 style="margin: 0; font-size: 1.125rem; font-weight: 600; display:flex; align-items:center; gap: 10px;">
                <mat-icon svgIcon="save" style="color: rgba(255,255,255,0.95);"></mat-icon>
                Model Management
              </h3>
            </div>
            <div style="padding: 16px;">
              <div style="margin-bottom: 12px;">
                <label style="display: block; font-size: 0.875rem; font-weight: 600; color: #333; margin-bottom: 4px;">Model Name</label>
                <input type="text" [(ngModel)]="modelName" placeholder="Enter model name" style="width: 100%; padding: 8px; border: 2px solid #e0e0e0; border-radius: 6px;" />
              </div>
              <div style="display: flex; gap: 12px;">
                <button (click)="saveModel()" style="flex: 1; padding: 10px; background: linear-gradient(90deg, #0066ff 0%, #00d4ff 100%); color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">Save</button>
                <button (click)="loadModel()" style="flex: 1; padding: 10px; background: #f5f5f5; color: #0066ff; border: 2px solid #0066ff; border-radius: 6px; font-weight: 600; cursor: pointer;">Load</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Architecture Card -->
        <div style="background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden; margin-bottom: 30px;">
          <div style="background: linear-gradient(135deg, #0066ff 0%, #00d4ff 100%); color: white; padding: 16px; border-radius: 12px 12px 0 0;">
            <h3 style="margin: 0; font-size: 1.125rem; font-weight: 600; display:flex; align-items:center; gap: 10px;">
              <mat-icon svgIcon="tree" style="color: rgba(255,255,255,0.95);"></mat-icon>
              Model Architecture
            </h3>
          </div>
          <div style="padding: 16px;">
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <ng-container *ngIf="modelSummary?.layersDetails?.length; else simpleArchitecture">
                <ng-container *ngFor="let layer of modelSummary.layersDetails; let i = index">
                  <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: #f5f5f5; border-radius: 6px; border-left: 4px solid #0066ff;">
                    <div style="background: linear-gradient(90deg, #0066ff 0%, #00d4ff 100%); color: white; padding: 6px 12px; border-radius: 4px; font-weight: 600; font-size: 12px; min-width: 80px; text-align: center;">{{ layer.type }}</div>
                    <div style="font-size: 13px; color: #666; flex: 1;">
                      {{ layer.name }}
                      <span *ngIf="layer.params != null"> • {{ layer.params | number }} params</span>
                      <span *ngIf="layer.outputShape"> • out: {{ layer.outputShape }}</span>
                    </div>
                  </div>
                  <div *ngIf="i < modelSummary.layersDetails.length - 1" style="text-align: center; color: #0066ff; font-size: 18px; font-weight: bold;">↓</div>
                </ng-container>
              </ng-container>

              <ng-template #simpleArchitecture>
                <ng-container *ngFor="let block of architectureBlocks; let i = index">
                  <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: #f5f5f5; border-radius: 6px; border-left: 4px solid #0066ff;">
                    <div style="background: linear-gradient(90deg, #0066ff 0%, #00d4ff 100%); color: white; padding: 6px 12px; border-radius: 4px; font-weight: 600; font-size: 12px; min-width: 80px; text-align: center;">{{ block.label }}</div>
                    <div style="font-size: 13px; color: #666; flex: 1;">{{ block.detail }}</div>
                  </div>
                  <div *ngIf="i < architectureBlocks.length - 1" style="text-align: center; color: #0066ff; font-size: 18px; font-weight: bold;">↓</div>
                </ng-container>
              </ng-template>
            </div>
          </div>
        </div>

        <!-- Summary Card -->
        <div *ngIf="modelCreated" style="background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden;">
          <div style="background: linear-gradient(135deg, #0066ff 0%, #00d4ff 100%); color: white; padding: 16px; border-radius: 12px 12px 0 0;">
            <h3 style="margin: 0; font-size: 1.125rem; font-weight: 600; display:flex; align-items:center; gap: 10px;">
              <mat-icon svgIcon="chart" style="color: rgba(255,255,255,0.95);"></mat-icon>
              Model Summary
            </h3>
          </div>
          <div style="padding: 16px;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px;">
              <div style="padding: 12px; background: #f5f5f5; border-radius: 6px; text-align: center;">
                <div style="font-size: 0.75rem; color: #999; text-transform: uppercase; font-weight: 600;">Type</div>
                <div style="font-size: 1.1rem; font-weight: 700; color: #0066ff; margin-top: 6px;">{{ modelSummary?.type || modelData?.type || '-' }}</div>
              </div>
              <div style="padding: 12px; background: #f5f5f5; border-radius: 6px; text-align: center;">
                <div style="font-size: 0.75rem; color: #999; text-transform: uppercase; font-weight: 600;">Layers</div>
                <div style="font-size: 1.5rem; font-weight: 700; color: #0066ff; margin-top: 4px;">{{ (modelSummary?.layers ?? modelData?.layers) ?? '-' }}</div>
              </div>
              <div style="padding: 12px; background: #f5f5f5; border-radius: 6px; text-align: center;">
                <div style="font-size: 0.75rem; color: #999; text-transform: uppercase; font-weight: 600;">Total Parameters</div>
                <div style="font-size: 1.5rem; font-weight: 700; color: #0066ff; margin-top: 4px;">{{ (modelSummary?.parameters ?? modelData?.parameters) ? ((modelSummary?.parameters ?? modelData?.parameters) | number) : '-' }}</div>
              </div>
              <div style="padding: 12px; background: #f5f5f5; border-radius: 6px; text-align: center;">
                <div style="font-size: 0.75rem; color: #999; text-transform: uppercase; font-weight: 600;">Trainable</div>
                <div style="font-size: 1.5rem; font-weight: 700; color: #0066ff; margin-top: 4px;">{{ (modelSummary?.parameters ?? modelData?.parameters) ? ((modelSummary?.parameters ?? modelData?.parameters) | number) : '-' }}</div>
              </div>
              <div style="padding: 12px; background: #f5f5f5; border-radius: 6px; text-align: center;">
                <div style="font-size: 0.75rem; color: #999; text-transform: uppercase; font-weight: 600;">Model Size</div>
                <div style="font-size: 1.5rem; font-weight: 700; color: #0066ff; margin-top: 4px;">{{ modelSummary?.modelSize || modelData?.modelSize || '-' }}</div>
              </div>
              <div style="padding: 12px; background: #f5f5f5; border-radius: 6px; text-align: center;">
                <div style="font-size: 0.75rem; color: #999; text-transform: uppercase; font-weight: 600;">Framework</div>
                <div style="font-size: 1.5rem; font-weight: 700; color: #0066ff; margin-top: 4px;">TF.js</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Empty State Message -->
        <div *ngIf="!modelCreated" style="background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); padding: 32px; text-align: center;">
          <div style="margin-bottom: 12px;">
            <mat-icon svgIcon="robot" style="font-size: 46px; width: 46px; height: 46px; color: #0066ff;"></mat-icon>
          </div>
          <h3 style="margin: 0 0 8px 0; font-size: 1.25rem; font-weight: 600; color: #333;">No Model Created Yet</h3>
          <p style="margin: 0; color: #999; font-size: 0.95rem;">Create a model above to see its summary and architecture details</p>
        </div>
      </div>
    </div>
  `
})
export class ModelComponent implements OnInit {
  inputHeight = 64;
  inputWidth = 64;
  channels = 1;
  seqTimesteps = 50;
  seqFeatures = 10;
  numClasses = 10;
  modelType: string = 'lightweight';
  datasetType: string = 'tabular';
  lockImageInputShape = false;
  datasetFeatures = 0;
  datasetClasses = 0;
  modelName = 'cnn-lstm-model';
  modelStatus = '';
  
  // Model state
  modelCreated = false;
  modelData: any = null;
  modelSummary: any = null;
  architectureBlocks: Array<{ label: string; detail: string }> = [];
  
  // Progress bar properties
  isCreating = false;
  progressValue = 0;
  progressMessage = '';
  progressSteps = [
    { step: 'Initializing', progress: 20 },
    { step: 'Building Conv2D Layers', progress: 40 },
    { step: 'Building LSTM Layer', progress: 60 },
    { step: 'Building Output Layer', progress: 80 },
    { step: 'Compiling Model', progress: 100 }
  ];
  currentStep = 0;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.apiService.getDataStats().subscribe(
      (response: any) => {
        const stats = response?.stats || response;
        const datasetType = stats?.datasetType || 'tabular';
        this.datasetType = String(datasetType || 'tabular');
        this.datasetFeatures = Number(stats?.features || 0);
        this.datasetClasses = Number(stats?.classes || 0);
        const inputShape = Array.isArray(stats?.inputShape) ? stats.inputShape : [];

        this.lockImageInputShape = String(datasetType).toLowerCase() === 'image' && inputShape.length === 3;
        if (this.lockImageInputShape) {
          this.inputHeight = Number(inputShape[0] || this.inputHeight);
          this.inputWidth = Number(inputShape[1] || this.inputWidth);
          this.channels = Number(inputShape[2] || this.channels);
        }

        if (datasetType === 'tabular') {
          this.modelType = 'dnn';
        } else if (datasetType === 'image') {
          this.modelType = 'cnn';
        } else if (datasetType === 'sequence') {
          this.modelType = 'lstm';
        }

        if (this.datasetClasses > 0) {
          this.numClasses = this.datasetClasses;
        }

        this.buildArchitectureBlocks();
      },
      () => {}
    );

    this.buildArchitectureBlocks();
  }

  createModel() {
    const inputShape = this.buildInputShapeForSelectedModel();

    if (!inputShape?.length) {
      this.modelStatus = '✗ Invalid input shape for selected model type';
      return;
    }

    if (this.datasetClasses > 0 && (this.modelType === 'dnn' || this.modelType === 'cnn' || this.modelType === 'lstm' || this.modelType === 'transformer' || this.modelType === 'transformer_full' || this.modelType === 'lightweight' || this.modelType === 'full')) {
      this.numClasses = this.datasetClasses;
    }
    
    // Start progress animation
    this.isCreating = true;
    this.progressValue = 0;
    this.currentStep = 0;
    this.progressMessage = this.progressSteps[0].step;
    
    // Simulate progress steps
    const progressInterval = setInterval(() => {
      if (this.currentStep < this.progressSteps.length - 1) {
        this.currentStep++;
        this.progressValue = this.progressSteps[this.currentStep].progress;
        this.progressMessage = this.progressSteps[this.currentStep].step;
      }
    }, 400);
    
    // Make API call
    this.apiService.createModel(inputShape, this.numClasses, this.modelType).subscribe(
      (response: any) => {
        clearInterval(progressInterval);
        this.progressValue = 100;
        this.progressMessage = 'Model Ready!';
        
        // Store model data
        this.modelData = response.model;
        this.modelCreated = true;
        this.buildArchitectureBlocks();
        this.refreshModelSummary();
        
        setTimeout(() => {
          this.isCreating = false;
          this.modelStatus = `✓ Model created successfully!`;
        }, 500);
      },
      (error: any) => {
        clearInterval(progressInterval);
        this.isCreating = false;
        this.modelCreated = false;
        this.modelSummary = null;
        this.modelStatus = `✗ Failed to create model`;
      }
    );
  }

  saveModel() {
    if (!this.modelName) {
      this.modelStatus = 'Please enter a model name';
      return;
    }

    this.apiService.saveModel(this.modelName).subscribe(
      (response: any) => {
        this.modelStatus = `✓ Model saved as "${this.modelName}"`;
      },
      (error: any) => {
        this.modelStatus = `✗ Failed to save model`;
      }
    );
  }

  loadModel() {
    if (!this.modelName) {
      this.modelStatus = 'Please enter a model name';
      return;
    }

    this.apiService.loadModel(this.modelName).subscribe(
      (response: any) => {
        this.modelStatus = `✓ Model "${this.modelName}" loaded successfully`;
        this.modelData = response?.model || null;
        this.modelCreated = !!this.modelData;

        // If the saved metadata includes useful fields, reflect them in the UI
        const maybeClasses = Number(this.modelData?.numClasses || this.modelData?.classes || 0);
        if (maybeClasses > 0) {
          this.numClasses = maybeClasses;
        }

        this.buildArchitectureBlocks();
        this.refreshModelSummary();
      },
      (error: any) => {
        this.modelStatus = `✗ Failed to load model`;
      }
    );
  }

  private refreshModelSummary() {
    this.apiService.getModelSummary().subscribe(
      (resp: any) => {
        this.modelSummary = resp?.model || resp || null;
      },
      () => {
        this.modelSummary = null;
      }
    );
  }

  private buildArchitectureBlocks() {
    const inputShape = this.formatInputShapeForSelectedModel();

    if (this.modelType === 'dnn') {
      this.architectureBlocks = [
        { label: 'Input', detail: inputShape },
        { label: 'Dense', detail: 'Hidden layers' },
        { label: 'Output', detail: `${this.numClasses} classes` }
      ];
      return;
    }

    if (this.modelType === 'cnn') {
      this.architectureBlocks = [
        { label: 'Input', detail: inputShape },
        { label: 'Conv2D', detail: 'Feature extraction' },
        { label: 'Dense', detail: 'Classification head' },
        { label: 'Output', detail: `${this.numClasses} classes` }
      ];
      return;
    }

    if (this.modelType === 'lstm') {
      this.architectureBlocks = [
        { label: 'Input', detail: inputShape },
        { label: 'LSTM', detail: 'Sequence modeling' },
        { label: 'Output', detail: `${this.numClasses} classes` }
      ];
      return;
    }

    if (this.modelType === 'transformer') {
      this.architectureBlocks = [
        { label: 'Input', detail: inputShape },
        { label: 'Transformer', detail: 'Self-attention encoder' },
        { label: 'Output', detail: `${this.numClasses} classes` }
      ];
      return;
    }

    if (this.modelType === 'transformer_full') {
      this.architectureBlocks = [
        { label: 'Input', detail: inputShape },
        { label: 'Transformer', detail: 'Multi-head self-attention encoder' },
        { label: 'Output', detail: `${this.numClasses} classes` }
      ];
      return;
    }

    // Default / hybrid
    this.architectureBlocks = [
      { label: 'Input', detail: inputShape },
      { label: 'Conv2D', detail: 'Feature extraction' },
      { label: 'LSTM', detail: 'Temporal modeling' },
      { label: 'Output', detail: `${this.numClasses} classes` }
    ];
  }

  private buildInputShapeForSelectedModel(): number[] {
    if (this.modelType === 'dnn') {
      if (this.datasetFeatures > 0) return [this.datasetFeatures];
      return [10];
    }

    if (this.modelType === 'lstm' || this.modelType === 'transformer' || this.modelType === 'transformer_full') {
      const t = Number(this.seqTimesteps || 0);
      const f = Number(this.seqFeatures || this.datasetFeatures || 0);
      if (t > 0 && f > 0) return [t, f];
      return [];
    }

    const h = Number(this.inputHeight || 0);
    const w = Number(this.inputWidth || 0);
    const c = Number(this.channels || 0);
    if (h > 0 && w > 0 && c > 0) return [h, w, c];
    return [];
  }

  private formatInputShapeForSelectedModel(): string {
    if (this.modelType === 'dnn') {
      const f = this.datasetFeatures > 0 ? this.datasetFeatures : 10;
      return `${f} features`;
    }

    if (this.modelType === 'lstm' || this.modelType === 'transformer' || this.modelType === 'transformer_full') {
      const t = Number(this.seqTimesteps || 0);
      const f = Number(this.seqFeatures || this.datasetFeatures || 0);
      return `${t}×${f}`;
    }

    return `${this.inputHeight}×${this.inputWidth}×${this.channels}`;
  }
}
