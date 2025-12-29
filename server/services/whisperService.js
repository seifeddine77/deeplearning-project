const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

function existsSyncSafe(p) {
  try {
    return !!p && fs.existsSync(p);
  } catch (e) {
    return false;
  }
}

async function safeUnlink(p) {
  try {
    if (!p) return;
    await fsPromises.unlink(p);
  } catch (e) {
    // ignore
  }
}

async function safeRmDir(dirPath) {
  try {
    if (!dirPath) return;
    await fsPromises.rm(dirPath, { recursive: true, force: true });
  } catch (e) {
    // ignore
  }
}

function runProcess(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      windowsHide: true,
      ...opts
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (d) => {
      stdout += String(d);
    });
    child.stderr?.on('data', (d) => {
      stderr += String(d);
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) return resolve({ stdout, stderr, code });
      const err = new Error(`Command failed (${code}): ${cmd} ${args.join(' ')}`);
      err.code = code;
      err.stdout = stdout;
      err.stderr = stderr;
      reject(err);
    });
  });
}

async function ensureDir(dirPath) {
  await fsPromises.mkdir(dirPath, { recursive: true });
}

function getWhisperBin() {
  const fromEnv = process.env.WHISPER_CPP_BIN || process.env.WHISPER_BIN || '';
  if (fromEnv) return fromEnv;
  return 'whisper-cli';
}

function getFfmpegBin() {
  return process.env.FFMPEG_BIN || 'ffmpeg';
}

function requireConfiguredModelPath() {
  const modelPath = process.env.WHISPER_CPP_MODEL || process.env.WHISPER_MODEL || '';
  if (!modelPath) {
    throw new Error('WHISPER_CPP_MODEL is not configured. Set it to the path of a ggml model (e.g. ggml-base.en.bin).');
  }
  return modelPath;
}

async function maybeConvertToWav(inputPath, workDir) {
  const ext = String(path.extname(inputPath) || '').toLowerCase();
  if (ext === '.wav') return inputPath;

  const ffmpeg = getFfmpegBin();
  const wavPath = path.join(workDir, 'audio.wav');

  await runProcess(ffmpeg, [
    '-y',
    '-i',
    inputPath,
    '-ac',
    '1',
    '-ar',
    '16000',
    wavPath
  ]);

  return wavPath;
}

async function readTextIfExists(filePath) {
  try {
    const b = await fsPromises.readFile(filePath, 'utf-8');
    return String(b || '').trim();
  } catch (e) {
    return '';
  }
}

async function transcribeWithWhisperCpp({ inputFilePath, outputFormat = 'json', language = '' }) {
  const whisperBin = getWhisperBin();
  const modelPath = requireConfiguredModelPath();

  if (!existsSyncSafe(inputFilePath)) {
    throw new Error('Input audio file not found');
  }
  if (!existsSyncSafe(modelPath)) {
    throw new Error(`Whisper model not found at: ${modelPath}`);
  }

  const workDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'whisper-'));
  const baseOut = path.join(workDir, 'out');

  try {
    const wavPath = await maybeConvertToWav(inputFilePath, workDir);

    const args = [
      '-m',
      modelPath,
      '-f',
      wavPath,
      '-of',
      baseOut,
      '-otxt',
      '-osrt',
      '-ovtt'
    ];

    const lang = String(language || '').trim();
    if (lang) {
      args.push('-l', lang);
    }

    await runProcess(whisperBin, args);

    const txtPath = `${baseOut}.txt`;
    const srtPath = `${baseOut}.srt`;
    const vttPath = `${baseOut}.vtt`;

    const text = await readTextIfExists(txtPath);
    const srt = await readTextIfExists(srtPath);
    const vtt = await readTextIfExists(vttPath);

    if (outputFormat === 'text') {
      return { format: 'text', text };
    }

    if (outputFormat === 'srt') {
      return { format: 'srt', srt };
    }

    if (outputFormat === 'vtt') {
      return { format: 'vtt', vtt };
    }

    return { format: 'json', text, srt, vtt };
  } finally {
    await safeRmDir(workDir);
  }
}

module.exports = {
  transcribeWithWhisperCpp,
  getWhisperBin,
  getFfmpegBin,
  requireConfiguredModelPath
};
