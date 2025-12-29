// const axios = require('axios'); // Package supprimé
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

class KaggleService {
  constructor() {
    this.datasetsDir = path.join(__dirname, '../../datasets');
    this.kaggleApi = 'https://www.kaggle.com/api/v1'; // Non utilisé sans axios
  }

  /**
   * Initialiser le répertoire des datasets
   */
  async initializeDatasetsDir() {
    try {
      await fs.mkdir(this.datasetsDir, { recursive: true });
      console.log('✅ Datasets directory initialized');
      return true;
    } catch (error) {
      console.error('❌ Error initializing datasets directory:', error.message);
      return false;
    }
  }

  /**
   * Télécharger un dataset depuis Kaggle
   * @param {string} datasetName - Nom du dataset (ex: 'mnist')
   * @param {string} kaggleUsername - Username Kaggle
   * @param {string} kaggleKey - API Key Kaggle
   */
  async downloadDataset(datasetName, kaggleUsername, kaggleKey) {
    try {
      console.log(`🔄 Downloading dataset: ${datasetName}`);

      // Créer le fichier de configuration Kaggle
      const kaggleConfigDir = path.join(process.env.HOME || process.env.USERPROFILE, '.kaggle');
      await fs.mkdir(kaggleConfigDir, { recursive: true });

      const kaggleJson = path.join(kaggleConfigDir, 'kaggle.json');
      await fs.writeFile(
        kaggleJson,
        JSON.stringify({
          username: kaggleUsername,
          key: kaggleKey
        }),
        { mode: 0o600 }
      );

      // Télécharger le dataset
      const safeFolderName = String(datasetName || '')
        .trim()
        .replace(/[^a-zA-Z0-9._-]+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 120);

      const datasetPath = path.join(this.datasetsDir, safeFolderName || 'dataset');
      await fs.mkdir(datasetPath, { recursive: true });

      const cmd1 = `kaggle datasets download -d "${datasetName}" -p "${datasetPath}" --unzip`;
      const cmd2 = `python -m kaggle.cli datasets download -d "${datasetName}" -p "${datasetPath}" --unzip`;

      let kaggleOnPath = true;
      try {
        await execPromise('where kaggle');
      } catch (e) {
        kaggleOnPath = false;
      }

      try {
        if (!kaggleOnPath) {
          throw new Error("kaggle command not found");
        }
        await execPromise(cmd1, { maxBuffer: 10 * 1024 * 1024 });
      } catch (e) {
        const msg = String(e?.message || '');
        const lower = msg.toLowerCase();
        const commandNotFound =
          lower.includes('not recognized') ||
          lower.includes('not found') ||
          lower.includes("n'est pas reconnu") ||
          lower.includes("nest pas reconnu") ||
          lower.includes('n’est pas reconnu') ||
          lower.includes('pas reconnu');

        if (commandNotFound) {
          await execPromise(cmd2, { maxBuffer: 10 * 1024 * 1024 });
        } else {
          throw e;
        }
      }

      console.log(`✅ Dataset downloaded: ${datasetName}`);
      return {
        success: true,
        datasetName,
        path: datasetPath,
        message: 'Dataset downloaded successfully'
      };
    } catch (error) {
      console.error(`❌ Error downloading dataset:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Lister les datasets disponibles
   */
  async listDatasets() {
    try {
      try {
        await fs.mkdir(this.datasetsDir, { recursive: true });
      } catch (e) {
        // ignore
      }

      const datasets = await fs.readdir(this.datasetsDir);
      const datasetInfo = [];

      for (const dataset of datasets) {
        const datasetPath = path.join(this.datasetsDir, dataset);
        try {
          const stats = await fs.stat(datasetPath);
          if (!stats?.isDirectory?.() ) continue;

          let files = [];
          try {
            files = await fs.readdir(datasetPath);
          } catch (e) {
            continue;
          }

          datasetInfo.push({
            name: dataset,
            path: datasetPath,
            size: stats.size,
            files: files,
            createdAt: stats.birthtime,
            updatedAt: stats.mtime
          });
        } catch (e) {
          continue;
        }
      }

      return {
        success: true,
        datasets: datasetInfo,
        count: datasetInfo.length
      };
    } catch (error) {
      console.error('❌ Error listing datasets:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtenir les informations d'un dataset
   */
  async getDatasetInfo(datasetName) {
    try {
      const datasetPath = path.join(this.datasetsDir, datasetName);
      const stats = await fs.stat(datasetPath);
      const files = await fs.readdir(datasetPath);

      // Calculer la taille totale
      let totalSize = 0;
      for (const file of files) {
        const filePath = path.join(datasetPath, file);
        const fileStats = await fs.stat(filePath);
        totalSize += fileStats.size;
      }

      return {
        success: true,
        name: datasetName,
        path: datasetPath,
        totalSize: totalSize,
        files: files,
        fileCount: files.length,
        createdAt: stats.birthtime,
        updatedAt: stats.mtime
      };
    } catch (error) {
      console.error('❌ Error getting dataset info:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Supprimer un dataset
   */
  async deleteDataset(datasetName) {
    try {
      const datasetPath = path.join(this.datasetsDir, datasetName);
      await fs.rm(datasetPath, { recursive: true, force: true });

      console.log(`✅ Dataset deleted: ${datasetName}`);
      return {
        success: true,
        message: `Dataset ${datasetName} deleted successfully`
      };
    } catch (error) {
      console.error('❌ Error deleting dataset:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtenir les datasets populaires
   */
  getPopularDatasets() {
    return [
      {
        id: 'oddrationale/mnist-in-csv',
        name: 'MNIST (CSV)',
        description: 'Handwritten digits classification (tabular pixels in CSV)',
        samples: 70000,
        type: 'Tabular'
      },
      {
        id: 'zalando-research/fashionmnist',
        name: 'Fashion-MNIST',
        description: 'Clothing images classification',
        samples: 70000,
        type: 'Image'
      },
      {
        id: 'uciml/iris',
        name: 'Iris Dataset',
        description: 'Classic flower classification dataset',
        samples: 150,
        type: 'Tabular'
      },
      {
        id: 'yasserh/titanic-dataset',
        name: 'Titanic Dataset',
        description: 'Titanic passenger survival prediction',
        samples: 891,
        type: 'Tabular'
      }
    ];
  }
}

module.exports = new KaggleService();
