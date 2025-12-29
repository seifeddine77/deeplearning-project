const express = require('express');
const router = express.Router();
const fileService = require('../services/fileService');
const { authMiddleware } = require('../middleware/auth');
const logger = require('../config/logger');

// @route   POST /api/files/validate
// @desc    Validate a file
// @access  Private
router.post('/validate', authMiddleware, (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No file provided'
      });
    }

    const file = req.files[0];
    const validation = fileService.validateFile(file);

    res.json({
      success: validation.valid,
      message: validation.valid ? 'File is valid' : 'File validation failed',
      errors: validation.errors,
      fileInfo: validation.valid ? {
        name: file.originalname,
        size: file.size,
        sizeInMB: (file.size / 1024 / 1024).toFixed(2),
        mimetype: file.mimetype
      } : null
    });
  } catch (error) {
    logger.error('File validation error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error validating file',
      error: error.message
    });
  }
});

// @route   POST /api/files/compress
// @desc    Compress a file
// @access  Private
router.post('/compress', authMiddleware, async (req, res) => {
  try {
    const { filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({
        success: false,
        message: 'File path is required'
      });
    }

    const compressedPath = await fileService.compressFile(filePath);
    const originalSize = fileService.getFileInfo(filePath).size;
    const compressedSize = fileService.getFileInfo(compressedPath).size;
    const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(2);

    res.json({
      success: true,
      message: 'File compressed successfully',
      compressedPath,
      originalSize,
      compressedSize,
      compressionRatio: `${compressionRatio}%`
    });
  } catch (error) {
    logger.error('File compression error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error compressing file',
      error: error.message
    });
  }
});

// @route   POST /api/files/decompress
// @desc    Decompress a file
// @access  Private
router.post('/decompress', authMiddleware, async (req, res) => {
  try {
    const { compressedPath } = req.body;

    if (!compressedPath) {
      return res.status(400).json({
        success: false,
        message: 'Compressed file path is required'
      });
    }

    const decompressedPath = await fileService.decompressFile(compressedPath);

    res.json({
      success: true,
      message: 'File decompressed successfully',
      decompressedPath
    });
  } catch (error) {
    logger.error('File decompression error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error decompressing file',
      error: error.message
    });
  }
});

// @route   POST /api/files/backup
// @desc    Backup a file
// @access  Private
router.post('/backup', authMiddleware, async (req, res) => {
  try {
    const { filePath, backupName } = req.body;

    if (!filePath) {
      return res.status(400).json({
        success: false,
        message: 'File path is required'
      });
    }

    const backupPath = await fileService.backupFile(filePath, backupName);

    res.json({
      success: true,
      message: 'File backed up successfully',
      backupPath
    });
  } catch (error) {
    logger.error('File backup error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error backing up file',
      error: error.message
    });
  }
});

// @route   POST /api/files/restore
// @desc    Restore a backup
// @access  Private
router.post('/restore', authMiddleware, async (req, res) => {
  try {
    const { backupPath, destinationPath } = req.body;

    if (!backupPath || !destinationPath) {
      return res.status(400).json({
        success: false,
        message: 'Backup path and destination path are required'
      });
    }

    const restoredPath = await fileService.restoreBackup(backupPath, destinationPath);

    res.json({
      success: true,
      message: 'Backup restored successfully',
      restoredPath
    });
  } catch (error) {
    logger.error('File restore error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error restoring backup',
      error: error.message
    });
  }
});

// @route   GET /api/files/info/:filePath
// @desc    Get file information
// @access  Private
router.get('/info', authMiddleware, (req, res) => {
  try {
    const { filePath } = req.query;

    if (!filePath) {
      return res.status(400).json({
        success: false,
        message: 'File path is required'
      });
    }

    const fileInfo = fileService.getFileInfo(filePath);

    if (!fileInfo) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    res.json({
      success: true,
      fileInfo
    });
  } catch (error) {
    logger.error('Get file info error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error getting file info',
      error: error.message
    });
  }
});

// @route   GET /api/files/list
// @desc    List files in a directory
// @access  Private
router.get('/list', authMiddleware, (req, res) => {
  try {
    const { directory, extension, minSize, maxSize } = req.query;

    if (!directory) {
      return res.status(400).json({
        success: false,
        message: 'Directory is required'
      });
    }

    const filter = {};
    if (extension) filter.extension = extension;
    if (minSize) filter.minSize = parseInt(minSize);
    if (maxSize) filter.maxSize = parseInt(maxSize);

    const files = fileService.listFiles(directory, filter);

    res.json({
      success: true,
      count: files.length,
      files
    });
  } catch (error) {
    logger.error('List files error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error listing files',
      error: error.message
    });
  }
});

// @route   POST /api/files/version
// @desc    Create a file version
// @access  Private
router.post('/version', authMiddleware, async (req, res) => {
  try {
    const { filePath, versionName } = req.body;

    if (!filePath) {
      return res.status(400).json({
        success: false,
        message: 'File path is required'
      });
    }

    const version = await fileService.createFileVersion(filePath, versionName);

    res.json({
      success: true,
      message: 'File version created successfully',
      version
    });
  } catch (error) {
    logger.error('Create file version error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error creating file version',
      error: error.message
    });
  }
});

// @route   GET /api/files/versions
// @desc    Get file versions
// @access  Private
router.get('/versions', authMiddleware, (req, res) => {
  try {
    const { fileName } = req.query;

    if (!fileName) {
      return res.status(400).json({
        success: false,
        message: 'File name is required'
      });
    }

    const versions = fileService.getFileVersions(fileName);

    res.json({
      success: true,
      count: versions.length,
      versions
    });
  } catch (error) {
    logger.error('Get file versions error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error getting file versions',
      error: error.message
    });
  }
});

// @route   GET /api/files/stats
// @desc    Get file statistics
// @access  Private
router.get('/stats', authMiddleware, (req, res) => {
  try {
    const { directory } = req.query;

    if (!directory) {
      return res.status(400).json({
        success: false,
        message: 'Directory is required'
      });
    }

    const stats = fileService.getFileStats(directory);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Get file stats error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error getting file stats',
      error: error.message
    });
  }
});

// @route   POST /api/files/cleanup
// @desc    Clean up old files
// @access  Private
router.post('/cleanup', authMiddleware, (req, res) => {
  try {
    const { directory, daysOld } = req.body;

    if (!directory) {
      return res.status(400).json({
        success: false,
        message: 'Directory is required'
      });
    }

    const result = fileService.cleanupOldFiles(directory, daysOld || 30);

    res.json({
      success: true,
      message: `${result.deletedCount} old files deleted`,
      result
    });
  } catch (error) {
    logger.error('Cleanup files error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error cleaning up files',
      error: error.message
    });
  }
});

// @route   DELETE /api/files/:filePath
// @desc    Delete a file
// @access  Private
router.delete('/', authMiddleware, (req, res) => {
  try {
    const { filePath } = req.query;

    if (!filePath) {
      return res.status(400).json({
        success: false,
        message: 'File path is required'
      });
    }

    const success = fileService.deleteFile(filePath);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    logger.error('Delete file error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error deleting file',
      error: error.message
    });
  }
});

module.exports = router;
