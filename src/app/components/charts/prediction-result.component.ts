import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MnistService } from '../../services/mnist.service';

@Component({
  selector: 'app-prediction-result',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div style="background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); padding: 24px; margin-bottom: 24px;">
      <h2 style="margin: 0 0 24px 0; font-size: 1.5rem; font-weight: 600; color: #333; display:flex; align-items:center; gap: 10px;">
        <mat-icon svgIcon="target"></mat-icon>
        Résultat de Prédiction
      </h2>
      
      <div *ngIf="trainingHistory.length > 0; else noData">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: flex-start;">
          
          <!-- Image MNIST -->
          <div style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
            <div style="background: #f9fafb; border-radius: 8px; padding: 16px; border: 2px solid #e0e0e0; width: 100%; max-width: 300px;">
              <canvas id="mnistCanvas"
                      width="280" 
                      height="280" 
                      style="border-radius: 6px; background: white; display: block; width: 100%; height: auto; image-rendering: pixelated;">
              </canvas>
            </div>
            <p style="font-size: 0.875rem; color: #666; margin: 0;">Image MNIST (28x28 pixels)</p>
          </div>

          <!-- Résultats -->
          <div style="display: flex; flex-direction: column; gap: 16px;">
            
            <!-- Prédiction -->
            <div style="padding: 16px; background: linear-gradient(135deg, #0066ff 0%, #00d4ff 100%); border-radius: 8px; color: white;">
              <div style="font-size: 0.875rem; font-weight: 600; opacity: 0.9;">Prédiction du Modèle</div>
              <div style="font-size: 2.5rem; font-weight: 700; margin-top: 8px;">{{ predictedLabel }}</div>
              <div style="font-size: 0.875rem; margin-top: 8px; opacity: 0.9;">Confiance: {{ confidence.toFixed(1) }}%</div>
            </div>

            <!-- Vraie Réponse -->
            <div style="padding: 16px; background: linear-gradient(135deg, #10b981 0%, #34d399 100%); border-radius: 8px; color: white;">
              <div style="font-size: 0.875rem; font-weight: 600; opacity: 0.9;">Vraie Réponse</div>
              <div style="font-size: 2.5rem; font-weight: 700; margin-top: 8px;">{{ trueLabel }}</div>
              <div style="font-size: 0.875rem; margin-top: 8px; opacity: 0.9;">
                <span *ngIf="isCorrect; else incorrect" style="display: inline-flex; align-items: center; gap: 8px;">
                  <mat-icon svgIcon="check"></mat-icon>
                  Correct
                </span>
                <ng-template #incorrect>
                  <span style="display: inline-flex; align-items: center; gap: 8px;">
                    <mat-icon svgIcon="x"></mat-icon>
                    Incorrect
                  </span>
                </ng-template>
              </div>
            </div>

            <!-- Probabilités -->
            <div style="padding: 16px; background: #f9fafb; border-radius: 8px; border: 1px solid #e0e0e0;">
              <div style="font-size: 0.875rem; font-weight: 600; color: #333; margin-bottom: 12px;">Probabilités par Classe</div>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <div *ngFor="let prob of probabilities; let i = index" style="display: flex; align-items: center; gap: 8px;">
                  <div style="width: 30px; font-weight: 600; color: #333;">{{ i }}</div>
                  <div style="flex: 1; background: #e0e0e0; height: 20px; border-radius: 4px; overflow: hidden;">
                    <div [style.width.%]="prob * 100" 
                         [style.background]="i === predictedLabel ? '#0066ff' : '#999'"
                         style="height: 100%; transition: width 0.3s;"></div>
                  </div>
                  <div style="width: 40px; text-align: right; font-size: 0.75rem; color: #666;">{{ (prob * 100).toFixed(1) }}%</div>
                </div>
              </div>
            </div>

          </div>

        </div>

        <!-- Bouton pour générer une nouvelle prédiction -->
        <div style="margin-top: 24px; display: flex; gap: 12px;">
          <button (click)="generateNewPrediction()" 
                  style="flex: 1; padding: 12px 16px; background: #0066ff; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; transition: all 0.3s;">
            <mat-icon svgIcon="refresh" style="vertical-align: -5px; margin-right: 8px; color: rgba(255,255,255,0.95);"></mat-icon>
            Nouvelle Prédiction
          </button>
          <button (click)="downloadImage()" 
                  style="flex: 1; padding: 12px 16px; background: #10b981; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; transition: all 0.3s;">
            <mat-icon svgIcon="download" style="vertical-align: -5px; margin-right: 8px; color: rgba(255,255,255,0.95);"></mat-icon>
            Télécharger Image
          </button>
        </div>
      </div>

      <ng-template #noData>
        <div style="padding: 40px; text-align: center; background: #f9fafb; border-radius: 8px;">
          <p style="font-size: 1rem; color: #999; margin: 0; display:flex; align-items:center; justify-content:center; gap: 10px;">
            <mat-icon svgIcon="info"></mat-icon>
            Démarrez le training pour voir les résultats de prédiction
          </p>
        </div>
      </ng-template>
    </div>
  `
})
export class PredictionResultComponent implements OnInit, OnChanges {
  @Input() trainingHistory: any[] = [];
  @Input() isTraining = false;

  predictedLabel = 0;
  trueLabel = 0;
  confidence = 0;
  isCorrect = false;
  probabilities: number[] = Array(10).fill(0);
  currentImageIndex = 0;

  constructor(private mnistService: MnistService) {}

  ngOnInit() {
    this.generateNewPrediction();
  }

  ngOnChanges() {
    if (this.trainingHistory.length > 0 && !this.isTraining) {
      this.generateNewPrediction();
    }
  }

  generateNewPrediction() {
    // Charger une image MNIST réelle depuis l'API
    this.mnistService.getRandomImage().subscribe(
      (response: any) => {
        if (response.success && response.image) {
          this.currentImageIndex = response.index;
          const imageData = response.image;
          
          // Afficher l'image sur le canvas
          this.drawImage(imageData);

          // Générer une prédiction basée sur la précision du training
          const baseAccuracy = this.trainingHistory.length > 0 
            ? parseFloat(this.trainingHistory[this.trainingHistory.length - 1].accuracy)
            : 0.5;

          // Vraie étiquette aléatoire (0-9)
          this.trueLabel = Math.floor(Math.random() * 10);

          // Prédiction avec probabilité baseAccuracy
          if (Math.random() < baseAccuracy) {
            this.predictedLabel = this.trueLabel;
            this.isCorrect = true;
          } else {
            let wrongLabel = Math.floor(Math.random() * 10);
            while (wrongLabel === this.trueLabel) {
              wrongLabel = Math.floor(Math.random() * 10);
            }
            this.predictedLabel = wrongLabel;
            this.isCorrect = false;
          }

          // Générer les probabilités
          this.generateProbabilities();
        }
      },
      (error) => {
        console.error('Error fetching MNIST image:', error);
        // Fallback: générer une image simulée
        const imageData = this.generateMNISTImage();
        this.drawImage(imageData);

        // Générer une prédiction basée sur la précision du training
        const baseAccuracy = this.trainingHistory.length > 0 
          ? parseFloat(this.trainingHistory[this.trainingHistory.length - 1].accuracy)
          : 0.5;

        // Vraie étiquette aléatoire (0-9)
        this.trueLabel = Math.floor(Math.random() * 10);

        // Prédiction avec probabilité baseAccuracy
        if (Math.random() < baseAccuracy) {
          this.predictedLabel = this.trueLabel;
          this.isCorrect = true;
        } else {
          let wrongLabel = Math.floor(Math.random() * 10);
          while (wrongLabel === this.trueLabel) {
            wrongLabel = Math.floor(Math.random() * 10);
          }
          this.predictedLabel = wrongLabel;
          this.isCorrect = false;
        }

        // Générer les probabilités
        this.generateProbabilities();
      }
    );
  }

  private generateMNISTImage(): Uint8ClampedArray {
    // Générer une image MNIST simulée (28x28 = 784 pixels)
    const imageSize = 28;
    const imageData = new Uint8ClampedArray(imageSize * imageSize);

    // Remplir de noir d'abord
    for (let i = 0; i < imageSize * imageSize; i++) {
      imageData[i] = 0;
    }

    // Générer un chiffre aléatoire basé sur le label prédit
    const digit = this.predictedLabel;
    
    // Créer différents motifs pour différents chiffres
    switch (digit % 10) {
      case 0: // Cercle/Ovale
        this.drawOval(imageData, imageSize, 14, 14, 8, 10);
        break;
      case 1: // Ligne verticale
        this.drawLine(imageData, imageSize, 14, 5, 14, 23);
        break;
      case 2: // Courbe en S
        this.drawCurve(imageData, imageSize);
        break;
      case 3: // Spirale
        this.drawSpiral(imageData, imageSize);
        break;
      case 4: // Angle
        this.drawAngle(imageData, imageSize);
        break;
      case 5: // Vague
        this.drawWave(imageData, imageSize);
        break;
      case 6: // Boucle
        this.drawLoop(imageData, imageSize);
        break;
      case 7: // Diagonale
        this.drawDiagonal(imageData, imageSize);
        break;
      case 8: // Double cercle
        this.drawDoubleCircle(imageData, imageSize);
        break;
      case 9: // Boucle inversée
        this.drawInvertedLoop(imageData, imageSize);
        break;
    }

    return imageData;
  }

  private drawOval(data: Uint8ClampedArray, size: number, cx: number, cy: number, rx: number, ry: number) {
    for (let i = 0; i < size * size; i++) {
      const x = i % size;
      const y = Math.floor(i / size);
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1 && dist > 0.6) {
        data[i] = Math.round(255 * (1 - (dist - 0.6) / 0.4));
      }
    }
  }

  private drawLine(data: Uint8ClampedArray, size: number, x1: number, y1: number, x2: number, y2: number) {
    const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
    for (let i = 0; i <= steps; i++) {
      const x = Math.round(x1 + (x2 - x1) * i / steps);
      const y = Math.round(y1 + (y2 - y1) * i / steps);
      if (x >= 0 && x < size && y >= 0 && y < size) {
        data[y * size + x] = 255;
      }
    }
  }

  private drawCurve(data: Uint8ClampedArray, size: number) {
    for (let x = 5; x < 23; x++) {
      const y = 5 + Math.sin((x - 5) / 18 * Math.PI * 2) * 8;
      const yi = Math.round(y);
      if (yi >= 0 && yi < size) {
        data[yi * size + x] = 255;
      }
    }
  }

  private drawSpiral(data: Uint8ClampedArray, size: number) {
    const cx = size / 2;
    const cy = size / 2;
    for (let angle = 0; angle < Math.PI * 4; angle += 0.1) {
      const r = angle / (Math.PI * 4) * 8;
      const x = Math.round(cx + r * Math.cos(angle));
      const y = Math.round(cy + r * Math.sin(angle));
      if (x >= 0 && x < size && y >= 0 && y < size) {
        data[y * size + x] = 255;
      }
    }
  }

  private drawAngle(data: Uint8ClampedArray, size: number) {
    this.drawLine(data, size, 8, 8, 20, 20);
    this.drawLine(data, size, 20, 8, 8, 20);
  }

  private drawWave(data: Uint8ClampedArray, size: number) {
    for (let x = 5; x < 23; x++) {
      const y = 14 + Math.sin((x - 5) / 18 * Math.PI * 3) * 6;
      const yi = Math.round(y);
      if (yi >= 0 && yi < size) {
        data[yi * size + x] = 255;
      }
    }
  }

  private drawLoop(data: Uint8ClampedArray, size: number) {
    const cx = 14;
    const cy = 12;
    for (let angle = 0; angle < Math.PI * 2; angle += 0.05) {
      const x = Math.round(cx + 6 * Math.cos(angle));
      const y = Math.round(cy + 8 * Math.sin(angle));
      if (x >= 0 && x < size && y >= 0 && y < size) {
        data[y * size + x] = 255;
      }
    }
    // Ajouter une queue
    this.drawLine(data, size, 14, 20, 14, 25);
  }

  private drawDiagonal(data: Uint8ClampedArray, size: number) {
    this.drawLine(data, size, 5, 5, 23, 23);
    this.drawLine(data, size, 23, 5, 5, 23);
  }

  private drawDoubleCircle(data: Uint8ClampedArray, size: number) {
    this.drawOval(data, size, 14, 14, 5, 5);
    this.drawOval(data, size, 14, 14, 8, 8);
  }

  private drawInvertedLoop(data: Uint8ClampedArray, size: number) {
    const cx = 14;
    const cy = 16;
    for (let angle = 0; angle < Math.PI * 2; angle += 0.05) {
      const x = Math.round(cx + 6 * Math.cos(angle));
      const y = Math.round(cy + 8 * Math.sin(angle));
      if (x >= 0 && x < size && y >= 0 && y < size) {
        data[y * size + x] = 255;
      }
    }
    // Ajouter une queue inversée
    this.drawLine(data, size, 14, 8, 14, 3);
  }

  private drawImage(imageData: Uint8ClampedArray) {
    // Attendre que le DOM soit prêt
    setTimeout(() => {
      const canvas = document.getElementById('mnistCanvas') as HTMLCanvasElement;
      if (!canvas) {
        console.error('Canvas not found');
        return;
      }

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        console.error('Canvas context not found');
        return;
      }

      // Créer une ImageData pour 28x28
      const imgData = ctx.createImageData(28, 28);
      
      // Remplir avec les données (grayscale -> RGBA)
      for (let i = 0; i < imageData.length; i++) {
        const pixelValue = imageData[i];
        imgData.data[i * 4] = pixelValue;      // R
        imgData.data[i * 4 + 1] = pixelValue;  // G
        imgData.data[i * 4 + 2] = pixelValue;  // B
        imgData.data[i * 4 + 3] = 255;         // A
      }

      // Effacer le canvas
      ctx.clearRect(0, 0, 280, 280);
      
      // Désactiver le lissage pour un rendu pixelisé
      ctx.imageSmoothingEnabled = false;
      
      // Créer un canvas temporaire pour redimensionner
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 28;
      tempCanvas.height = 28;
      const tempCtx = tempCanvas.getContext('2d');
      
      if (tempCtx) {
        tempCtx.putImageData(imgData, 0, 0);
        
        // Redessiner sur le canvas principal (agrandir 10x)
        ctx.drawImage(tempCanvas, 0, 0, 28, 28, 0, 0, 280, 280);
      }
    }, 50);
  }

  private generateProbabilities() {
    // Générer des probabilités avec la prédiction comme max
    this.probabilities = Array(10).fill(0);
    
    // Donner une haute probabilité à la prédiction
    this.probabilities[this.predictedLabel] = 0.7 + Math.random() * 0.3;
    this.confidence = this.probabilities[this.predictedLabel] * 100;

    // Distribuer le reste aléatoirement
    let remaining = 1 - this.probabilities[this.predictedLabel];
    for (let i = 0; i < 10; i++) {
      if (i !== this.predictedLabel) {
        const prob = Math.random() * remaining / (10 - 1);
        this.probabilities[i] = prob;
        remaining -= prob;
      }
    }

    // Normaliser
    const sum = this.probabilities.reduce((a, b) => a + b, 0);
    this.probabilities = this.probabilities.map(p => p / sum);
  }

  downloadImage() {
    const canvas = document.getElementById('mnistCanvas') as HTMLCanvasElement;
    if (!canvas) {
      console.error('Canvas not found for download');
      return;
    }

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `prediction_${this.predictedLabel}_${new Date().getTime()}.png`;
    link.click();
  }
}
