import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  // Authentication endpoints
  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, { email, password });
  }

  register(username: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, { username, email, password });
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/logout`, {});
  }

  getCurrentUser(): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/me`);
  }

  updateProfile(data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/auth/profile`, data);
  }

  changePassword(oldPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/change-password`, { oldPassword, newPassword });
  }

  // Model endpoints
  createModel(inputShape: number[], numClasses: number, modelType: string = 'lightweight'): Observable<any> {
    return this.http.post(`${this.apiUrl}/model/create`, { inputShape, numClasses, modelType });
  }

  getModelSummary(): Observable<any> {
    return this.http.get(`${this.apiUrl}/model/summary`);
  }

  saveModel(modelName: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/model/save`, { modelName });
  }

  loadModel(modelName: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/model/load`, { modelName });
  }

  getModels(): Observable<any> {
    return this.http.get(`${this.apiUrl}/model/list`);
  }

  loadModelById(modelId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/model/load-by-id`, { modelId });
  }

  updateModel(modelId: string, payload: { name: string; description?: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/model/${encodeURIComponent(modelId)}`, payload);
  }

  deleteModel(modelId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/model/${encodeURIComponent(modelId)}`);
  }

  listModelFiles(modelId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/model/${encodeURIComponent(modelId)}/files`);
  }

  getModelFileDownloadUrl(modelId: string, filename: string): string {
    return `${this.apiUrl}/model/${encodeURIComponent(modelId)}/files/${encodeURIComponent(filename)}`;
  }

  // Kaggle endpoints
  getKagglePopularDatasets(): Observable<any> {
    return this.http.get(`${this.apiUrl}/kaggle/popular`);
  }

  listKaggleLocalDatasets(): Observable<any> {
    return this.http.get(`${this.apiUrl}/kaggle/datasets`);
  }

  downloadKaggleDataset(payload: { datasetName: string; kaggleUsername?: string; kaggleKey?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/kaggle/download`, payload);
  }

  getKaggleDatasetInfo(name: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/kaggle/dataset/${encodeURIComponent(name)}`);
  }

  deleteKaggleDataset(name: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/kaggle/dataset/${encodeURIComponent(name)}`);
  }

  // Data endpoints
  uploadDataset(file: File, datasetType: string = 'tabular', timesteps?: number, stride?: number): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('datasetType', datasetType);
    if (timesteps != null) {
      formData.append('timesteps', String(timesteps));
    }
    if (stride != null) {
      formData.append('stride', String(stride));
    }
    return this.http.post(`${this.apiUrl}/data/upload`, formData);
  }

  preprocessData(normalization: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/data/preprocess`, { normalization });
  }

  transcribeAudio(file: File, outputFormat: string = 'json', language?: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('outputFormat', outputFormat);
    if (language != null && String(language).trim()) {
      formData.append('language', String(language).trim());
    }
    return this.http.post(`${this.apiUrl}/audio/transcribe`, formData);
  }

  augmentData(augmentationType: string, params: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/data/augment`, { augmentationType, params });
  }

  splitData(trainRatio: number, testRatio: number, valRatio: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/data/split`, { trainRatio, testRatio, valRatio });
  }

  getDataStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/data/stats`);
  }

  // Training endpoints
  startTraining(config: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/training/start`, config);
  }

  getTrainingStatus(modelId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/training/status?modelId=${encodeURIComponent(modelId)}`);
  }

  getTrainingHistory(): Observable<any> {
    return this.http.get(`${this.apiUrl}/training/history`);
  }

  getConfusionMatrix(modelId: string, dataset: string = 'test', maxSamples?: number): Observable<any> {
    const qs = new URLSearchParams({
      modelId: modelId,
      dataset: dataset,
      ...(maxSamples != null ? { maxSamples: String(maxSamples) } : {})
    });
    return this.http.get(`${this.apiUrl}/training/confusion-matrix?${qs.toString()}`);
  }

  getRocCurve(modelId: string, dataset: string = 'test', maxSamples?: number, steps?: number): Observable<any> {
    const qs = new URLSearchParams({
      modelId: modelId,
      dataset: dataset,
      ...(maxSamples != null ? { maxSamples: String(maxSamples) } : {}),
      ...(steps != null ? { steps: String(steps) } : {})
    });
    return this.http.get(`${this.apiUrl}/training/roc-curve?${qs.toString()}`);
  }

  getFeatureImportance(modelId: string, topK: number = 20): Observable<any> {
    const qs = new URLSearchParams({
      modelId: modelId,
      topK: String(topK)
    });
    return this.http.get(`${this.apiUrl}/training/feature-importance?${qs.toString()}`);
  }

  getModelComparison(modelIds: string[], dataset: string = 'test', maxSamples: number = 5000): Observable<any> {
    const qs = new URLSearchParams({
      modelIds: (modelIds || []).join(','),
      dataset: dataset,
      maxSamples: String(maxSamples)
    });
    return this.http.get(`${this.apiUrl}/training/model-comparison?${qs.toString()}`);
  }

  evaluateModel(dataset: string, modelId?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/training/evaluate`, { dataset, modelId });
  }

  predict(inputData: any, modelId?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/training/predict`, { inputData, modelId });
  }

  getMetrics(): Observable<any> {
    return this.http.get(`${this.apiUrl}/training/metrics`);
  }

  getDashboardOverview(): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard/overview`);
  }

  resetData(): Observable<any> {
    return this.http.post(`${this.apiUrl}/data/reset`, {});
  }

  getDatasets(): Observable<any> {
    return this.http.get(`${this.apiUrl}/data/datasets`);
  }

  updateDataset(datasetId: string, payload: { name: string; description?: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/data/datasets/${encodeURIComponent(datasetId)}`, payload);
  }

  deleteDataset(datasetId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/data/datasets/${encodeURIComponent(datasetId)}`);
  }

  getDatasetDownloadUrl(datasetId: string): string {
    return `${this.apiUrl}/data/datasets/${encodeURIComponent(datasetId)}/download`;
  }

  replaceDataset(datasetId: string, file: File, datasetType?: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (datasetType) formData.append('datasetType', datasetType);
    return this.http.put(`${this.apiUrl}/data/datasets/${encodeURIComponent(datasetId)}/replace`, formData);
  }

  // Notifications endpoints
  getNotifications(limit: number = 50): Observable<any> {
    return this.http.get(`${this.apiUrl}/notifications?limit=${encodeURIComponent(String(limit))}`);
  }

  getUnreadNotifications(): Observable<any> {
    return this.http.get(`${this.apiUrl}/notifications/unread`);
  }

  getNotificationStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/notifications/stats`);
  }

  markNotificationRead(id: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/notifications/${encodeURIComponent(id)}/read`, {});
  }

  markAllNotificationsRead(): Observable<any> {
    return this.http.put(`${this.apiUrl}/notifications/read-all`, {});
  }

  deleteNotification(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/notifications/${encodeURIComponent(id)}`);
  }

  // Reports history endpoints
  getReports(params?: { limit?: number; reportType?: string; dataset?: string; modelId?: string; trainingRunId?: string }): Observable<any> {
    const qs = new URLSearchParams({
      ...(params?.limit != null ? { limit: String(params.limit) } : {}),
      ...(params?.reportType ? { reportType: params.reportType } : {}),
      ...(params?.dataset ? { dataset: params.dataset } : {}),
      ...(params?.modelId ? { modelId: params.modelId } : {}),
      ...(params?.trainingRunId ? { trainingRunId: params.trainingRunId } : {})
    });

    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return this.http.get(`${this.apiUrl}/reports${suffix}`);
  }

  getReportStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/reports/stats`);
  }

  deleteReport(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/reports/${encodeURIComponent(id)}`);
  }

  exportAnalysisPdf(payload: { modelIds: string[]; dataset?: string; trainingRunId?: string | null; title?: string; images?: string[] }): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/reports/analysis/pdf`, payload, { responseType: 'blob' });
  }

  emailAnalysisPdf(payload: { to: string | string[]; subject?: string; message?: string; modelIds: string[]; dataset?: string; trainingRunId?: string | null; title?: string; images?: string[] }): Observable<any> {
    return this.http.post(`${this.apiUrl}/reports/analysis/email`, payload);
  }
}
