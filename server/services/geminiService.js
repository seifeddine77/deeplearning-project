// const axios = require('axios'); // Package supprimé
const https = require('https');
const { URL } = require('url');

function postJson(url, body, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = JSON.stringify(body);

    const options = {
      method: 'POST',
      hostname: u.hostname,
      path: `${u.pathname}${u.search}`,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...extraHeaders
      }
    };

    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => {
        raw += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = raw ? JSON.parse(raw) : {};
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ data: parsed });
            return;
          }

          const msg = parsed?.error?.message || `HTTP ${res.statusCode}`;
          reject(new Error(msg));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent'; // Non utilisé sans axios
    this.model = 'gemini-2.5-pro';
  }

  /**
   * Analyser un dataset avec Gemini
   */
  async analyzeDataset(datasetInfo) {
    try {
      if (!this.apiKey) {
        console.warn('⚠️  Gemini API key not configured');
        return {
          success: false,
          error: 'Gemini API key not configured'
        };
      }

      const prompt = `
        Analyze this dataset and provide insights:
        
        Dataset Name: ${datasetInfo.name}
        Total Samples: ${datasetInfo.totalSamples}
        Features: ${datasetInfo.features}
        Classes: ${datasetInfo.classes}
        File Type: ${datasetInfo.fileType}
        
        Please provide:
        1. Dataset overview
        2. Recommended preprocessing steps
        3. Suitable ML algorithms
        4. Potential challenges
        5. Best practices for this dataset
      `;

      const response = await postJson(`${this.apiUrl}?key=${this.apiKey}`, {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      });

      const analysis = response.data.candidates[0].content.parts[0].text;

      return {
        success: true,
        analysis: analysis,
        datasetName: datasetInfo.name
      };
    } catch (error) {
      console.error('❌ Error analyzing dataset with Gemini:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Générer une stratégie d'entraînement
   */
  async generateTrainingStrategy(modelInfo, datasetInfo) {
    try {
      if (!this.apiKey) {
        return {
          success: false,
          error: 'Gemini API key not configured'
        };
      }

      const prompt = `
        Generate a training strategy for this ML model:
        
        Model: ${modelInfo.architecture}
        Input Shape: ${modelInfo.inputShape}
        Number of Classes: ${modelInfo.numClasses}
        
        Dataset: ${datasetInfo.name}
        Total Samples: ${datasetInfo.totalSamples}
        Features: ${datasetInfo.features}
        
        Please provide:
        1. Recommended hyperparameters (epochs, batch size, learning rate)
        2. Data augmentation techniques
        3. Regularization strategies
        4. Early stopping criteria
        5. Validation strategy
        6. Expected performance metrics
      `;

      const response = await postJson(`${this.apiUrl}?key=${this.apiKey}`, {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      });

      const strategy = response.data.candidates[0].content.parts[0].text;

      return {
        success: true,
        strategy: strategy,
        model: modelInfo.architecture,
        dataset: datasetInfo.name
      };
    } catch (error) {
      console.error('❌ Error generating training strategy:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Analyser les résultats d'entraînement
   */
  async analyzeTrainingResults(trainingResults) {
    try {
      if (!this.apiKey) {
        return {
          success: false,
          error: 'Gemini API key not configured'
        };
      }

      const prompt = `
        Analyze these training results and provide insights:
        
        Final Accuracy: ${trainingResults.accuracy}
        Final Loss: ${trainingResults.loss}
        Validation Accuracy: ${trainingResults.valAccuracy}
        Validation Loss: ${trainingResults.valLoss}
        Epochs: ${trainingResults.epochs}
        Duration: ${trainingResults.duration}s
        
        Please provide:
        1. Model performance assessment
        2. Signs of overfitting/underfitting
        3. Recommendations for improvement
        4. Potential issues and solutions
        5. Next steps for optimization
      `;

      const response = await postJson(`${this.apiUrl}?key=${this.apiKey}`, {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      });

      const analysis = response.data.candidates[0].content.parts[0].text;

      return {
        success: true,
        analysis: analysis,
        metrics: trainingResults
      };
    } catch (error) {
      console.error('❌ Error analyzing training results:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Générer un rapport complet
   */
  async generateReport(projectInfo) {
    try {
      if (!this.apiKey) {
        return {
          success: false,
          error: 'Gemini API key not configured'
        };
      }

      const prompt = `
        Generate a comprehensive ML project report:
        
        Project: ${projectInfo.name}
        Model: ${projectInfo.model}
        Dataset: ${projectInfo.dataset}
        Accuracy: ${projectInfo.accuracy}
        Loss: ${projectInfo.loss}
        
        Please generate:
        1. Executive Summary
        2. Project Overview
        3. Methodology
        4. Results and Performance
        5. Conclusions
        6. Recommendations for Future Work
      `;

      const response = await postJson(`${this.apiUrl}?key=${this.apiKey}`, {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      });

      const report = response.data.candidates[0].content.parts[0].text;

      return {
        success: true,
        report: report,
        project: projectInfo.name
      };
    } catch (error) {
      console.error('❌ Error generating report:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Vérifier la configuration de l'API
   */
  isConfigured() {
    return !!this.apiKey;
  }

  /**
   * Obtenir le statut de l'API
   */
  getStatus() {
    return {
      model: this.model,
      configured: this.isConfigured(),
      apiUrl: this.apiUrl
    };
  }
}

module.exports = new GeminiService();
