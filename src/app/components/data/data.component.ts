import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-data',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div style="min-height: calc(100vh - 70px); background: linear-gradient(135deg, #0066ff 0%, #00d4ff 50%, #7209b7 100%); padding: 32px 24px;">
      <div style="max-width: 1200px; margin: 0 auto;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="margin: 0; font-size: 2.5rem; font-weight: 700; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
            <mat-icon svgIcon="database" style="vertical-align: -6px; margin-right: 10px; color: rgba(255,255,255,0.95);"></mat-icon>
            Data Management
          </h1>
          <p style="margin: 10px 0 0 0; font-size: 1rem; color: rgba(255,255,255,0.9);">Manage, preprocess, and augment your datasets</p>
        </div>

        <!-- Cards Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; margin-bottom: 30px;">
          <!-- Upload Dataset -->
          <div style="background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden;">
            <div style="background: linear-gradient(135deg, #0066ff 0%, #00d4ff 100%); color: white; padding: 16px; border-radius: 12px 12px 0 0;">
              <h3 style="margin: 0; font-size: 1.125rem; font-weight: 600; display: flex; align-items: center; gap: 10px;">
                <mat-icon svgIcon="upload" style="color: rgba(255,255,255,0.95);"></mat-icon>
                Upload Dataset
              </h3>
            </div>
            <div style="padding: 16px;">
              <select [(ngModel)]="datasetType" style="width: 100%; padding: 8px; margin: 8px 0; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 0.875rem;">
                <option value="tabular">Tabular (DNN)</option>
                <option value="image">Image (CNN)</option>
                <option value="sequence">Sequence (RNN/LSTM)</option>
                <option value="text">Text (Transformer)</option>
                <option value="audio">Audio (Whisper)</option>
              </select>
              <div *ngIf="datasetType === 'audio'" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 8px 0;">
                <select [(ngModel)]="audioOutputFormat" style="width: 100%; padding: 8px; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 0.875rem;">
                  <option value="json">Text (default)</option>
                  <option value="text">Plain text</option>
                  <option value="srt">SRT</option>
                  <option value="vtt">VTT</option>
                </select>
                <input type="text" [(ngModel)]="audioLanguage" placeholder="Language (optional, e.g. en, fr)" style="width: 100%; padding: 8px; border: 2px solid #e0e0e0; border-radius: 6px;" />
              </div>
              <div *ngIf="datasetType === 'sequence' || datasetType === 'text'" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 8px 0;">
                <input type="number" [(ngModel)]="seqTimesteps" min="2" max="10000" placeholder="Timesteps" style="width: 100%; padding: 8px; border: 2px solid #e0e0e0; border-radius: 6px;" />
                <input type="number" [(ngModel)]="seqStride" min="1" max="10000" placeholder="Stride" style="width: 100%; padding: 8px; border: 2px solid #e0e0e0; border-radius: 6px;" />
              </div>
              <div
                class="dropzone"
                [class.is-dragover]="isDragOver"
                (click)="openFilePicker()"
                (dragover)="onDragOver($event)"
                (dragleave)="onDragLeave($event)"
                (drop)="onDrop($event)"
                style="margin: 8px 0;"
              >
                <div style="font-weight: 800;">Drop your file here</div>
                <div style="margin-top: 4px; font-size: 0.875rem; opacity: 0.8;">or click to browse</div>
                <div *ngIf="selectedFile" style="margin-top: 10px; font-size: 0.875rem;">
                  <span style="font-weight: 800;">Selected:</span>
                  {{ selectedFile.name }}
                  <span style="opacity: 0.75;">({{ formatBytes(selectedFile.size) }})</span>
                </div>
              </div>

              <input type="file" #fileInput (change)="onFileSelected($event)" style="width: 100%; padding: 8px; margin: 8px 0; border: 2px solid #e0e0e0; border-radius: 6px;" />
              <button (click)="uploadDataset()" style="width: 100%; padding: 10px; margin-top: 8px; background: linear-gradient(90deg, #0066ff 0%, #00d4ff 100%); color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">Upload</button>
              <p *ngIf="uploadStatus" style="margin-top: 8px; padding: 8px; background: #d1fae5; color: #065f46; border-radius: 6px; font-size: 0.875rem;">{{ uploadStatus }}</p>
              <div *ngIf="datasetType === 'audio' && audioTranscript" style="margin-top: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <button (click)="copyAudioTranscript()" style="padding: 10px; background: #0B5FFF; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">Copy transcript</button>
                <button (click)="downloadAudioTranscript()" style="padding: 10px; background: #111827; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">Download</button>
              </div>
              <div *ngIf="datasetType === 'audio' && audioTranscript" style="margin-top: 10px; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px; background: #f8fafc; max-height: 220px; overflow: auto; white-space: pre-wrap; font-size: 0.875rem;">
                {{ audioTranscript }}
              </div>
            </div>
          </div>

          <!-- Preprocess Data -->
          <div style="background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden;">
            <div style="background: linear-gradient(135deg, #0066ff 0%, #00d4ff 100%); color: white; padding: 16px; border-radius: 12px 12px 0 0;">
              <h3 style="margin: 0; font-size: 1.125rem; font-weight: 600; display: flex; align-items: center; gap: 10px;">
                <mat-icon svgIcon="settings" style="color: rgba(255,255,255,0.95);"></mat-icon>
                Preprocess Data
              </h3>
            </div>
            <div style="padding: 16px;">
              <select [(ngModel)]="normalizationMethod" style="width: 100%; padding: 8px; margin: 8px 0; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 0.875rem;">
                <option value="minmax">Min-Max Normalization</option>
                <option value="zscore">Z-Score Standardization</option>
              </select>
              <button (click)="preprocessData()" style="width: 100%; padding: 10px; margin-top: 8px; background: linear-gradient(90deg, #0066ff 0%, #00d4ff 100%); color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">Preprocess</button>
            </div>
          </div>

          <!-- Data Augmentation -->
          <div style="background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden;">
            <div style="background: linear-gradient(135deg, #0066ff 0%, #00d4ff 100%); color: white; padding: 16px; border-radius: 12px 12px 0 0;">
              <h3 style="margin: 0; font-size: 1.125rem; font-weight: 600; display: flex; align-items: center; gap: 10px;">
                <mat-icon svgIcon="image" style="color: rgba(255,255,255,0.95);"></mat-icon>
                Data Augmentation
              </h3>
            </div>
            <div style="padding: 16px;">
              <select [(ngModel)]="augmentationType" style="width: 100%; padding: 8px; margin: 8px 0; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 0.875rem;">
                <option value="crop">Crop/Slider</option>
                <option value="rotation">Rotation</option>
                <option value="flip">Flip</option>
              </select>
              <button (click)="augmentData()" style="width: 100%; padding: 10px; margin-top: 8px; background: linear-gradient(90deg, #0066ff 0%, #00d4ff 100%); color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">Augment</button>
            </div>
          </div>

          <!-- Train/Test Split -->
          <div style="background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden;">
            <div style="background: linear-gradient(135deg, #0066ff 0%, #00d4ff 100%); color: white; padding: 16px; border-radius: 12px 12px 0 0;">
              <h3 style="margin: 0; font-size: 1.125rem; font-weight: 600; display: flex; align-items: center; gap: 10px;">
                <mat-icon svgIcon="split" style="color: rgba(255,255,255,0.95);"></mat-icon>
                Train/Test Split
              </h3>
            </div>
            <div style="padding: 16px;">
              <div style="margin-bottom: 12px;">
                <label style="display: block; font-size: 0.875rem; font-weight: 600; color: #333; margin-bottom: 4px;">Train Ratio</label>
                <input type="number" [(ngModel)]="trainRatio" min="0" max="1" step="0.1" style="width: 100%; padding: 8px; border: 2px solid #e0e0e0; border-radius: 6px;" />
              </div>
              <div style="margin-bottom: 12px;">
                <label style="display: block; font-size: 0.875rem; font-weight: 600; color: #333; margin-bottom: 4px;">Test Ratio</label>
                <input type="number" [(ngModel)]="testRatio" min="0" max="1" step="0.1" style="width: 100%; padding: 8px; border: 2px solid #e0e0e0; border-radius: 6px;" />
              </div>
              <div style="margin-bottom: 12px;">
                <label style="display: block; font-size: 0.875rem; font-weight: 600; color: #333; margin-bottom: 4px;">Val Ratio</label>
                <input type="number" [(ngModel)]="valRatio" min="0" max="1" step="0.1" style="width: 100%; padding: 8px; border: 2px solid #e0e0e0; border-radius: 6px;" />
              </div>
              <button (click)="splitData()" style="width: 100%; padding: 10px; margin-top: 8px; background: linear-gradient(90deg, #0066ff 0%, #00d4ff 100%); color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">Split</button>
            </div>
          </div>
        </div>

        <!-- Reset Button -->
        <div style="text-align: center; margin-bottom: 30px;">
          <button (click)="resetData()" style="padding: 10px 20px; background: #ff6b6b; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.875rem; display: inline-flex; align-items: center; gap: 8px;">
            <mat-icon svgIcon="refresh" style="color: rgba(255,255,255,0.95);"></mat-icon>
            Reset All Data
          </button>
        </div>

        <!-- Statistics Card -->
        <div style="background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden;">
          <div style="background: linear-gradient(135deg, #0066ff 0%, #00d4ff 100%); color: white; padding: 16px; border-radius: 12px 12px 0 0;">
            <h3 style="margin: 0; font-size: 1.125rem; font-weight: 600; display: flex; align-items: center; gap: 10px;">
              <mat-icon svgIcon="chart" style="color: rgba(255,255,255,0.95);"></mat-icon>
              Data Statistics
            </h3>
          </div>
          <div style="padding: 16px;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px;">
              <div style="padding: 12px; background: #f5f5f5; border-radius: 6px; border-left: 4px solid #0066ff; text-align: center;">
                <div style="font-size: 0.75rem; color: #999; text-transform: uppercase; font-weight: 600;">Dataset Type</div>
                <div style="font-size: 1.1rem; font-weight: 700; color: #0066ff; margin-top: 4px;">{{ dataStats.datasetType || 'tabular' }}</div>
              </div>
              <div style="padding: 12px; background: #f5f5f5; border-radius: 6px; border-left: 4px solid #0066ff; text-align: center;">
                <div style="font-size: 0.75rem; color: #999; text-transform: uppercase; font-weight: 600;">Total Samples</div>
                <div style="font-size: 1.5rem; font-weight: 700; color: #0066ff; margin-top: 4px;">{{ dataStats.totalSamples }}</div>
              </div>
              <div style="padding: 12px; background: #f5f5f5; border-radius: 6px; border-left: 4px solid #0066ff; text-align: center;">
                <div style="font-size: 0.75rem; color: #999; text-transform: uppercase; font-weight: 600;">Features</div>
                <div style="font-size: 1.5rem; font-weight: 700; color: #0066ff; margin-top: 4px;">{{ dataStats.features ?? 0 }}</div>
              </div>
              <div style="padding: 12px; background: #f5f5f5; border-radius: 6px; border-left: 4px solid #0066ff; text-align: center;">
                <div style="font-size: 0.75rem; color: #999; text-transform: uppercase; font-weight: 600;">Classes</div>
                <div style="font-size: 1.5rem; font-weight: 700; color: #0066ff; margin-top: 4px;">{{ dataStats.classes ?? 0 }}</div>
              </div>
              <div style="padding: 12px; background: #f5f5f5; border-radius: 6px; border-left: 4px solid #0066ff; text-align: center;">
                <div style="font-size: 0.75rem; color: #999; text-transform: uppercase; font-weight: 600;">Input Shape</div>
                <div style="font-size: 0.95rem; font-weight: 700; color: #0066ff; margin-top: 6px; word-break: break-word;">{{ dataStats.inputShape || '-' }}</div>
              </div>
              <div style="padding: 12px; background: #f5f5f5; border-radius: 6px; border-left: 4px solid #0066ff; text-align: center;">
                <div style="font-size: 0.75rem; color: #999; text-transform: uppercase; font-weight: 600;">Train Size</div>
                <div style="font-size: 1.5rem; font-weight: 700; color: #0066ff; margin-top: 4px;">{{ dataStats.trainSize }}</div>
              </div>
              <div style="padding: 12px; background: #f5f5f5; border-radius: 6px; border-left: 4px solid #0066ff; text-align: center;">
                <div style="font-size: 0.75rem; color: #999; text-transform: uppercase; font-weight: 600;">Test Size</div>
                <div style="font-size: 1.5rem; font-weight: 700; color: #0066ff; margin-top: 4px;">{{ dataStats.testSize }}</div>
              </div>
              <div style="padding: 12px; background: #f5f5f5; border-radius: 6px; border-left: 4px solid #0066ff; text-align: center;">
                <div style="font-size: 0.75rem; color: #999; text-transform: uppercase; font-weight: 600;">Validation Size</div>
                <div style="font-size: 1.5rem; font-weight: 700; color: #0066ff; margin-top: 4px;">{{ dataStats.valSize }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
  ,styles: [`
    .dropzone {
      width: 100%;
      padding: 14px;
      border-radius: 10px;
      border: 2px dashed rgba(0, 102, 255, 0.35);
      background: rgba(0, 212, 255, 0.05);
      color: rgba(17, 24, 39, 0.92);
      cursor: pointer;
      user-select: none;
      transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
    }

    .dropzone:hover {
      border-color: rgba(0, 102, 255, 0.55);
      box-shadow: 0 0 0 4px rgba(0, 102, 255, 0.10);
    }

    .dropzone.is-dragover {
      border-color: rgba(0, 212, 255, 0.75);
      background: rgba(0, 212, 255, 0.10);
      box-shadow: 0 0 0 4px rgba(0, 212, 255, 0.14);
    }
  `]
})
export class DataComponent implements OnInit {
  @ViewChild('fileInput') fileInput: any;
  
  selectedFile: File | null = null;
  uploadStatus = '';
  audioTranscript = '';
  audioOutputFormat: string = 'json';
  audioLanguage = '';
  audioLastFormat: string = 'json';
  audioLastSrt = '';
  audioLastVtt = '';
  datasetType: string = 'tabular';
  seqTimesteps = 50;
  seqStride = 50;
  normalizationMethod = 'minmax';
  augmentationType = 'crop';
  trainRatio = 0.7;
  testRatio = 0.2;
  valRatio = 0.1;
  isDragOver = false;
  dataStats: any = {
    datasetType: 'tabular',
    totalSamples: 0,
    trainSize: 0,
    testSize: 0,
    valSize: 0
  };

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadDataStats();
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  openFilePicker() {
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.click();
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const file = event.dataTransfer?.files?.[0] || null;
    if (!file) return;
    this.selectedFile = file;

    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  formatBytes(bytes: number) {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / Math.pow(1024, i);
    return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
  }

  uploadDataset() {
    if (!this.selectedFile) {
      this.uploadStatus = '✗ Please select a file first';
      return;
    }

    if (this.datasetType === 'audio') {
      this.uploadStatus = 'Transcribing audio...';
      this.audioTranscript = '';
      this.audioLastFormat = 'json';
      this.audioLastSrt = '';
      this.audioLastVtt = '';
      this.apiService.transcribeAudio(this.selectedFile, this.audioOutputFormat, this.audioLanguage).subscribe(
        (response: any) => {
          this.audioLastFormat = String(response?.format || this.audioOutputFormat || 'json');
          this.audioLastSrt = String(response?.srt || '');
          this.audioLastVtt = String(response?.vtt || '');
          const text = response?.text || response?.srt || response?.vtt || '';
          this.audioTranscript = String(text || '');
          this.uploadStatus = '✓ Audio transcribed successfully!';
        },
        (error: any) => {
          const errorMsg = error.error?.message || error.error?.error || error.message || 'Unknown error';
          this.uploadStatus = `✗ Transcription failed: ${errorMsg}`;
        }
      );
      return;
    }

    this.uploadStatus = 'Uploading...';
    const effectiveType = (this.datasetType === 'text') ? 'sequence' : this.datasetType;
    const isSeq = effectiveType === 'sequence';
    const t = isSeq ? Number(this.seqTimesteps || 50) : undefined;
    const s = isSeq ? Number(this.seqStride || this.seqTimesteps || 50) : undefined;
    this.apiService.uploadDataset(this.selectedFile, effectiveType, t, s).subscribe(
      (response: any) => {
        this.uploadStatus = `✓ Dataset uploaded successfully! (${response.stats?.totalSamples ?? 0} samples)`;
        this.loadDataStats();
      },
      (error: any) => {
        const errorMsg = error.error?.message || error.message || 'Unknown error';
        this.uploadStatus = `✗ Upload failed: ${errorMsg}`;
      }
    );
  }

  preprocessData() {
    this.apiService.preprocessData(this.normalizationMethod).subscribe(
      (response: any) => {
        this.uploadStatus = `✓ Data preprocessed with ${this.normalizationMethod}`;
        this.loadDataStats();
      },
      (error: any) => {
        this.uploadStatus = `✗ Preprocessing failed`;
      }
    );
  }

  augmentData() {
    this.apiService.augmentData(this.augmentationType, {}).subscribe(
      (response: any) => {
        const augmentedSamples = response.augmentation?.augmentedSamples || response.augmentedSamples || 'undefined';
        const totalAfter = response.augmentation?.totalAfterAugmentation || 'unknown';
        this.uploadStatus = `✓ Data augmented (${augmentedSamples} new samples, total: ${totalAfter})`;
        
        // Wait a moment then reload stats
        setTimeout(() => {
          this.loadDataStats();
        }, 500);
      },
      (error: any) => {
        this.uploadStatus = `✗ Augmentation failed`;
      }
    );
  }

  splitData() {
    // Validate ratios sum to 1.0
    const total = this.trainRatio + this.testRatio + this.valRatio;
    if (Math.abs(total - 1.0) > 0.01) {
      this.uploadStatus = `✗ Ratios must sum to 1.0 (current: ${total.toFixed(2)})`;
      return;
    }

    this.apiService.splitData(this.trainRatio, this.testRatio, this.valRatio).subscribe(
      (response: any) => {
        // Extract split data from response
        const splitData = response.split || response;
        this.dataStats = {
          totalSamples: splitData.totalSamples || response.totalSamples || 0,
          trainSize: splitData.trainSize || response.trainSize || 0,
          testSize: splitData.testSize || response.testSize || 0,
          valSize: splitData.valSize || response.valSize || 0
        };
        this.uploadStatus = `✓ Data split completed (${this.trainRatio*100}% train, ${this.testRatio*100}% test, ${this.valRatio*100}% val)`;
        this.loadDataStats();  // Reload stats to ensure they're up to date
      },
      (error: any) => {
        this.uploadStatus = `✗ Split failed: ${error.error?.message || error.message || 'Unknown error'}`;
      }
    );
  }

  loadDataStats() {
    this.apiService.getDataStats().subscribe(
      (response: any) => {
        // Extract stats from response
        if (response.stats) {
          this.dataStats = {
            datasetType: response.stats.datasetType || response.stats.dataType || 'tabular',
            totalSamples: response.stats.totalSamples || 0,
            features: response.stats.features || 0,
            classes: response.stats.classes || 0,
            inputShape: Array.isArray(response.stats.inputShape) ? JSON.stringify(response.stats.inputShape) : (response.stats.inputShape || ''),
            trainSize: response.stats.trainSize || 0,
            testSize: response.stats.testSize || 0,
            valSize: response.stats.valSize || 0
          };
        } else {
          this.dataStats = response;
        }
      },
      (error: any) => console.error('Error loading data stats:', error)
    );
  }

  async copyAudioTranscript() {
    try {
      const text = String(this.audioTranscript || '');
      if (!text) return;
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      this.uploadStatus = '✓ Copied to clipboard';
    } catch (e: any) {
      this.uploadStatus = '✗ Copy failed';
    }
  }

  downloadAudioTranscript() {
    try {
      const fmt = String(this.audioOutputFormat || this.audioLastFormat || 'text').toLowerCase();
      let content = '';
      let ext = 'txt';
      let mime = 'text/plain;charset=utf-8';

      if (fmt === 'srt') {
        content = String(this.audioLastSrt || this.audioTranscript || '');
        ext = 'srt';
      } else if (fmt === 'vtt') {
        content = String(this.audioLastVtt || this.audioTranscript || '');
        ext = 'vtt';
      } else {
        content = String(this.audioTranscript || '');
        ext = 'txt';
      }

      const blob = new Blob([content], { type: mime });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `whisper-transcript.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      this.uploadStatus = '✗ Download failed';
    }
  }

  resetData() {
    // Call backend to reset data
    this.apiService.resetData().subscribe(
      (response: any) => {
        // Reset all frontend values to defaults
        this.selectedFile = null;
        this.uploadStatus = '';
        this.audioTranscript = '';
        this.audioOutputFormat = 'json';
        this.audioLanguage = '';
        this.audioLastFormat = 'json';
        this.audioLastSrt = '';
        this.audioLastVtt = '';
        this.normalizationMethod = 'minmax';
        this.augmentationType = 'crop';
        this.trainRatio = 0.7;
        this.testRatio = 0.2;
        this.valRatio = 0.1;
        this.dataStats = {
          totalSamples: 0,
          trainSize: 0,
          testSize: 0,
          valSize: 0
        };
        
        // Reset file input
        if (this.fileInput && this.fileInput.nativeElement) {
          this.fileInput.nativeElement.value = '';
        }
        
        this.uploadStatus = '✓ All data reset to defaults';
      },
      (error: any) => {
        this.uploadStatus = `✗ Reset failed: ${error.error?.message || error.message}`;
      }
    );
  }
}
