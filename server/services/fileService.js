const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const logger = require('../config/logger');

class FileService {
  constructor() {
    this.uploadsDir = path.join(__dirname, '../../uploads');
    this.backupDir = path.join(__dirname, '../../backups');
    this.maxFileSize = 500 * 1024 * 1024; // 500MB
    this.allowedMimeTypes = [
      'text/csv',
      'application/json',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/zip'
    ];
    this.allowedExtensions = ['.csv', '.json', '.jpg', '.jpeg', '.png', '.gif', '.zip'];

    // Créer les répertoires s'ils n'existent pas
    this.ensureDirectories();
  }

  /**
   * Créer les répertoires nécessaires
   */
  ensureDirectories() {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * Valider un fichier
   */
  validateFile(file) {
    const errors = [];

    // Vérifier que le fichier existe
    if (!file) {
      errors.push('No file provided');
      return { valid: false, errors };
    }

    // Vérifier la taille
    if (file.size > this.maxFileSize) {
      errors.push(`File size exceeds maximum of ${this.maxFileSize / 1024 / 1024}MB`);
    }

    // Vérifier l'extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!this.allowedExtensions.includes(ext)) {
      errors.push(`File extension ${ext} is not allowed. Allowed: ${this.allowedExtensions.join(', ')}`);
    }

    // Vérifier le MIME type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      errors.push(`MIME type ${file.mimetype} is not allowed`);
    }

    // Vérifier le nom du fichier
    if (!/^[a-zA-Z0-9._\-]+$/.test(file.originalname)) {
      errors.push('File name contains invalid characters');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Générer un hash du fichier
   */
  generateFileHash(filePath) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);

      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  /**
   * Compresser un fichier
   */
  async compressFile(filePath) {
    return new Promise((resolve, reject) => {
      const compressedPath = `${filePath}.gz`;
      const source = fs.createReadStream(filePath);
      const destination = fs.createWriteStream(compressedPath);
      const gzip = zlib.createGzip();

      source
        .pipe(gzip)
        .pipe(destination)
        .on('finish', () => {
          logger.info('File compressed', { filePath, compressedPath });
          resolve(compressedPath);
        })
        .on('error', reject);
    });
  }

  /**
   * Décompresser un fichier
   */
  async decompressFile(compressedPath) {
    return new Promise((resolve, reject) => {
      const decompressedPath = compressedPath.replace('.gz', '');
      const source = fs.createReadStream(compressedPath);
      const destination = fs.createWriteStream(decompressedPath);
      const gunzip = zlib.createGunzip();

      source
        .pipe(gunzip)
        .pipe(destination)
        .on('finish', () => {
          logger.info('File decompressed', { compressedPath, decompressedPath });
          resolve(decompressedPath);
        })
        .on('error', reject);
    });
  }

  /**
   * Créer une sauvegarde d'un fichier
   */
  async backupFile(filePath, backupName = null) {
    try {
      const fileName = path.basename(filePath);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = backupName || `${fileName}.backup.${timestamp}`;
      const backupPath = path.join(this.backupDir, backupFileName);

      // Copier le fichier
      fs.copyFileSync(filePath, backupPath);

      // Compresser la sauvegarde
      const compressedBackup = await this.compressFile(backupPath);

      // Supprimer l'original non compressé
      fs.unlinkSync(backupPath);

      logger.info('File backed up', { filePath, backupPath: compressedBackup });
      return compressedBackup;
    } catch (error) {
      logger.error('Backup failed', { filePath, error: error.message });
      throw error;
    }
  }

  /**
   * Restaurer une sauvegarde
   */
  async restoreBackup(backupPath, destinationPath) {
    try {
      // Décompresser
      const decompressedPath = await this.decompressFile(backupPath);

      // Copier vers la destination
      fs.copyFileSync(decompressedPath, destinationPath);

      // Supprimer le fichier décompressé temporaire
      fs.unlinkSync(decompressedPath);

      logger.info('Backup restored', { backupPath, destinationPath });
      return destinationPath;
    } catch (error) {
      logger.error('Restore failed', { backupPath, error: error.message });
      throw error;
    }
  }

  /**
   * Obtenir les informations d'un fichier
   */
  getFileInfo(filePath) {
    try {
      const stats = fs.statSync(filePath);
      const fileName = path.basename(filePath);
      const ext = path.extname(filePath);

      return {
        name: fileName,
        path: filePath,
        size: stats.size,
        sizeInMB: (stats.size / 1024 / 1024).toFixed(2),
        extension: ext,
        created: stats.birthtime,
        modified: stats.mtime,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory()
      };
    } catch (error) {
      logger.error('Failed to get file info', { filePath, error: error.message });
      return null;
    }
  }

  /**
   * Lister les fichiers d'un répertoire
   */
  listFiles(directory, filter = null) {
    try {
      const files = fs.readdirSync(directory);
      let fileList = files.map(file => {
        const filePath = path.join(directory, file);
        return this.getFileInfo(filePath);
      });

      // Filtrer les fichiers
      if (filter) {
        fileList = fileList.filter(file => {
          if (filter.extension && !file.extension.includes(filter.extension)) return false;
          if (filter.minSize && file.size < filter.minSize) return false;
          if (filter.maxSize && file.size > filter.maxSize) return false;
          return true;
        });
      }

      return fileList;
    } catch (error) {
      logger.error('Failed to list files', { directory, error: error.message });
      return [];
    }
  }

  /**
   * Supprimer un fichier
   */
  deleteFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info('File deleted', { filePath });
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Failed to delete file', { filePath, error: error.message });
      throw error;
    }
  }

  /**
   * Créer une version d'un fichier
   */
  async createFileVersion(filePath, versionName = null) {
    try {
      const fileName = path.basename(filePath);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const versionFileName = versionName || `${fileName}.v${timestamp}`;
      const versionPath = path.join(this.uploadsDir, 'versions', versionFileName);

      // Créer le répertoire versions s'il n'existe pas
      const versionsDir = path.join(this.uploadsDir, 'versions');
      if (!fs.existsSync(versionsDir)) {
        fs.mkdirSync(versionsDir, { recursive: true });
      }

      // Copier le fichier
      fs.copyFileSync(filePath, versionPath);

      // Générer le hash
      const hash = await this.generateFileHash(versionPath);

      logger.info('File version created', { filePath, versionPath, hash });
      return { versionPath, hash, timestamp };
    } catch (error) {
      logger.error('Failed to create file version', { filePath, error: error.message });
      throw error;
    }
  }

  /**
   * Obtenir l'historique des versions
   */
  getFileVersions(fileName) {
    try {
      const versionsDir = path.join(this.uploadsDir, 'versions');
      if (!fs.existsSync(versionsDir)) {
        return [];
      }

      const files = fs.readdirSync(versionsDir);
      const versions = files
        .filter(file => file.includes(fileName))
        .map(file => {
          const filePath = path.join(versionsDir, file);
          return this.getFileInfo(filePath);
        })
        .sort((a, b) => b.modified - a.modified);

      return versions;
    } catch (error) {
      logger.error('Failed to get file versions', { fileName, error: error.message });
      return [];
    }
  }

  /**
   * Obtenir les statistiques des fichiers
   */
  getFileStats(directory) {
    try {
      const files = this.listFiles(directory);
      const stats = {
        totalFiles: files.length,
        totalSize: 0,
        totalSizeInMB: 0,
        byExtension: {},
        largestFile: null,
        smallestFile: null
      };

      files.forEach(file => {
        stats.totalSize += file.size;
        stats.totalSizeInMB = (stats.totalSize / 1024 / 1024).toFixed(2);

        // Par extension
        if (!stats.byExtension[file.extension]) {
          stats.byExtension[file.extension] = { count: 0, size: 0 };
        }
        stats.byExtension[file.extension].count++;
        stats.byExtension[file.extension].size += file.size;

        // Plus grand fichier
        if (!stats.largestFile || file.size > stats.largestFile.size) {
          stats.largestFile = file;
        }

        // Plus petit fichier
        if (!stats.smallestFile || file.size < stats.smallestFile.size) {
          stats.smallestFile = file;
        }
      });

      return stats;
    } catch (error) {
      logger.error('Failed to get file stats', { directory, error: error.message });
      return null;
    }
  }

  /**
   * Nettoyer les anciens fichiers
   */
  cleanupOldFiles(directory, daysOld = 30) {
    try {
      const files = this.listFiles(directory);
      const now = Date.now();
      const thirtyDaysAgo = now - (daysOld * 24 * 60 * 60 * 1000);

      let deletedCount = 0;
      files.forEach(file => {
        if (file.modified.getTime() < thirtyDaysAgo) {
          this.deleteFile(file.path);
          deletedCount++;
        }
      });

      logger.info('Old files cleaned up', { directory, daysOld, deletedCount });
      return { deletedCount, totalFiles: files.length };
    } catch (error) {
      logger.error('Failed to cleanup old files', { directory, error: error.message });
      throw error;
    }
  }
}

module.exports = new FileService();
