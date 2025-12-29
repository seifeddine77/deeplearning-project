const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

const { authMiddleware } = require('../middleware/auth');
const logger = require('../config/logger');
const { transcribeWithWhisperCpp } = require('../services/whisperService');

const uploadMaxMb = Number(process.env.UPLOAD_MAX_MB || 500);
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: Math.max(1, uploadMaxMb) * 1024 * 1024 }
});

async function safeUnlink(filePath) {
  try {
    if (!filePath) return;
    if (fsSync.existsSync(filePath)) {
      await fs.unlink(filePath);
    }
  } catch (e) {
    // ignore
  }
}

router.post('/transcribe', authMiddleware, upload.single('file'), async (req, res) => {
  const start = Date.now();
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No audio file uploaded' });
    }

    const outputFormatRaw = String(req.body?.outputFormat || 'json').toLowerCase();
    const outputFormat = ['json', 'text', 'srt', 'vtt'].includes(outputFormatRaw) ? outputFormatRaw : 'json';
    const language = String(req.body?.language || '').trim();

    const inputPath = req.file.path;
    const originalName = req.file.originalname;
    const ext = String(path.extname(originalName) || '').toLowerCase();

    if (!ext || !['.wav', '.mp3', '.m4a', '.aac', '.ogg', '.flac', '.webm', '.mp4'].includes(ext)) {
      await safeUnlink(inputPath);
      return res.status(400).json({
        success: false,
        message: `Unsupported audio format: ${ext || 'unknown'}. Supported: wav, mp3, m4a, aac, ogg, flac, webm, mp4.`
      });
    }

    logger.info('Audio transcription requested', { outputFormat, language: language || null, originalName });

    const result = await transcribeWithWhisperCpp({
      inputFilePath: inputPath,
      outputFormat,
      language
    });

    await safeUnlink(inputPath);

    logger.info('Audio transcription completed', { ms: Date.now() - start, format: result?.format || outputFormat });

    return res.json({
      success: true,
      format: result?.format || outputFormat,
      text: result?.text || '',
      srt: result?.srt || '',
      vtt: result?.vtt || ''
    });
  } catch (error) {
    try {
      logger.error('Audio transcription failed', { message: error?.message, stack: error?.stack, stderr: error?.stderr });
    } catch (e) {
      // ignore
    }
    await safeUnlink(req.file?.path);
    return res.status(500).json({ success: false, message: 'Audio transcription failed', error: error?.message || String(error) });
  }
});

module.exports = router;
