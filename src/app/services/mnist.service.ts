import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MnistService {
  private apiUrl = '/api/mnist';

  constructor(private http: HttpClient) { }

  /**
   * Récupère une image MNIST par index
   */
  getImage(index: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/image/${index}`);
  }

  /**
   * Récupère une image MNIST aléatoire
   */
  getRandomImage(): Observable<any> {
    return this.http.get(`${this.apiUrl}/random`);
  }

  /**
   * Récupère un lot d'images MNIST
   */
  getBatch(count: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/batch/${count}`);
  }

  /**
   * Récupère les statistiques du dataset MNIST
   */
  getStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats`);
  }

  /**
   * Convertit les données MNIST en image canvas
   */
  drawImageOnCanvas(imageData: number[], canvasId: string, size: number = 28) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Créer une ImageData
    const imgData = ctx.createImageData(size, size);
    
    // Remplir avec les données (grayscale -> RGBA)
    for (let i = 0; i < imageData.length; i++) {
      const pixelValue = imageData[i];
      imgData.data[i * 4] = pixelValue;      // R
      imgData.data[i * 4 + 1] = pixelValue;  // G
      imgData.data[i * 4 + 2] = pixelValue;  // B
      imgData.data[i * 4 + 3] = 255;         // A
    }

    // Effacer et redessiner
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    
    // Créer un canvas temporaire pour redimensionner
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = size;
    tempCanvas.height = size;
    const tempCtx = tempCanvas.getContext('2d');
    
    if (tempCtx) {
      tempCtx.putImageData(imgData, 0, 0);
      
      // Redessiner sur le canvas principal (agrandir)
      const scale = canvas.width / size;
      ctx.drawImage(tempCanvas, 0, 0, size, size, 0, 0, canvas.width, canvas.height);
    }
  }
}
