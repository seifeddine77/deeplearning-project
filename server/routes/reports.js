const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');

const { authMiddleware } = require('../middleware/auth');
const logger = require('../config/logger');

const Training = require('../models/Training');
const Model = require('../models/Model');
const Dataset = require('../models/Dataset');
const notificationService = require('../services/notificationService');
const mongoose = require('mongoose');
let Report;
try {
  Report = require('../models/Report');
} catch (e) {
  Report = null;
}

function normalizeToArray(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') {
    return v.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
}

function safeNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeImages(images) {
  const arr = normalizeToArray(images);
  return arr
    .map((v) => (typeof v === 'string' ? v.trim() : ''))
    .filter(Boolean)
    .slice(0, 10);
}

function dataUrlToPngBuffer(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return null;
  const m = dataUrl.match(/^data:image\/(png|jpeg);base64,(.+)$/i);
  if (!m) return null;
  const b64 = m[2];
  try {
    return Buffer.from(b64, 'base64');
  } catch (e) {
    return null;
  }
}

function buildTransporterFromEnv() {
  const host = process.env.SMTP_HOST;
  const port = safeNumber(process.env.SMTP_PORT, 587);
  const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error('SMTP is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS (and optionally SMTP_PORT, SMTP_SECURE).');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass
    }
  });
}

async function buildAnalysisReportData({ userId, modelIds, dataset = 'test', trainingRunId = null }) {
  const ids = normalizeToArray(modelIds);
  if (!userId) throw new Error('Unauthorized');
  if (!ids.length) throw new Error('modelIds is required');

  // Load model metadata
  const modelDocs = await Model.find({ userId, modelId: { $in: ids } })
    .select('modelId name modelType architecture layersCount trainedAt createdAt expectedFingerprint')
    .lean();

  const modelById = (modelDocs || []).reduce((acc, m) => {
    acc[m.modelId] = m;
    return acc;
  }, {});

  // Determine dataset used for report: prefer the selected trainingRunId, else latest completed among chosen models
  let datasetDoc = null;
  let datasetId = null;

  try {
    if (trainingRunId) {
      const run = await Training.findOne({ userId, trainingRunId }).lean();
      datasetId = run?.datasetId || null;
    }
  } catch (e) {
    datasetId = null;
  }

  if (!datasetId) {
    const latestAny = await Training.findOne({ userId, modelId: { $in: ids }, status: 'completed', datasetId: { $ne: null } })
      .sort({ completedAt: -1, createdAt: -1 })
      .lean();
    datasetId = latestAny?.datasetId || null;
  }

  if (datasetId) {
    datasetDoc = await Dataset.findOne({ _id: datasetId, userId }).lean();
  }

  // Metrics per model (Mongo source-of-truth)
  const sessions = await Training.find({
    userId,
    modelId: { $in: ids },
    status: 'completed',
    ...(trainingRunId ? { trainingRunId } : {})
  })
    .sort({ completedAt: -1, createdAt: -1 })
    .lean();

  const sessionByModel = (sessions || []).reduce((acc, s) => {
    if (!s?.modelId) return acc;
    if (!acc[s.modelId]) acc[s.modelId] = s;
    return acc;
  }, {});

  const models = ids.map((id) => {
    const meta = modelById[id];
    const s = sessionByModel[id];
    const ev = s?.evaluationMetrics || {};
    const fm = s?.finalMetrics || {};

    return {
      modelId: id,
      name: meta?.name || null,
      modelType: meta?.modelType || null,
      architecture: meta?.architecture || null,
      layersCount: safeNumber(meta?.layersCount, 0),
      trainedAt: meta?.trainedAt || null,
      lastTrainingRunId: s?.trainingRunId || null,
      lastDatasetId: s?.datasetId || null,
      loss: safeNumber(fm.loss, 0),
      accuracy: safeNumber(ev.accuracy ?? fm.accuracy, 0),
      precision: safeNumber(ev.precision, 0),
      recall: safeNumber(ev.recall, 0),
      f1Score: safeNumber(ev.f1Score, 0),
      completedAt: s?.completedAt || s?.createdAt || null,
      dataset
    };
  });

  return {
    title: 'Analysis Report',
    createdAt: new Date().toISOString(),
    dataset: datasetDoc
      ? {
        id: String(datasetDoc._id),
        name: datasetDoc.name,
        datasetType: datasetDoc.datasetType,
        totalSamples: safeNumber(datasetDoc.totalSamples, 0),
        features: safeNumber(datasetDoc.features, 0),
        classes: safeNumber(datasetDoc.classes, 0),
        labelFormat: datasetDoc.labelFormat || 'unknown',
        fingerprintHash: datasetDoc.fingerprintHash || ''
      }
      : null,
    models
  };
}

function renderPdfToBuffer(report, images = []) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth = doc.page.width;
      const marginLeft = doc.page.margins.left;
      const marginRight = doc.page.margins.right;
      const contentWidth = pageWidth - marginLeft - marginRight;

      const drawTopBar = (title, subtitle) => {
        const topY = doc.page.margins.top - 20;
        doc.save();
        doc.rect(0, 0, pageWidth, 90).fill('#0B5FFF');
        doc.fillColor('#FFFFFF');
        doc.fontSize(20).text(title || 'Analysis Report', marginLeft, 26, { width: contentWidth, align: 'left' });
        doc.fontSize(10).fillColor('#E6EEFF').text(subtitle || '', marginLeft, 52, { width: contentWidth, align: 'left' });
        doc.restore();
        doc.moveDown(3.2);
        doc.y = Math.max(doc.y, 100);
      };

      const sectionTitle = (label) => {
        doc.moveDown(0.8);
        const y = doc.y;
        doc.save();
        doc.rect(marginLeft, y, contentWidth, 20).fill('#EEF2FF');
        doc.fillColor('#111827');
        doc.fontSize(12).text(label, marginLeft + 10, y + 5, { width: contentWidth - 20 });
        doc.restore();
        doc.y = y + 26;
      };

      const kvRow = (k, v) => {
        doc.fontSize(10).fillColor('#334155').text(String(k), { continued: true, width: 140 });
        doc.fillColor('#0f172a').text(String(v ?? ''), { width: contentWidth - 140 });
      };

      drawTopBar(report.title || 'Analysis Report', `Generated at: ${report.createdAt}`);

      sectionTitle('Dataset');
      if (!report.dataset) {
        doc.fontSize(10).fillColor('#334155').text('No dataset metadata available for this report.');
      } else {
        kvRow('Name', report.dataset.name);
        kvRow('Type', report.dataset.datasetType);
        kvRow('Samples', report.dataset.totalSamples);
        kvRow('Features', report.dataset.features);
        kvRow('Classes', report.dataset.classes);
        kvRow('Label format', report.dataset.labelFormat);
        kvRow('Fingerprint', report.dataset.fingerprintHash);
      }

      sectionTitle('Models');

      const models = report.models || [];
      if (!models.length) {
        doc.fontSize(10).fillColor('#334155').text('No model metadata available for this report.');
      } else {
        const startX = marginLeft;
        const y0 = doc.y;
        const colName = 190;
        const colAcc = 70;
        const colF1 = 70;
        const colLoss = 60;
        const colRun = contentWidth - (colName + colAcc + colF1 + colLoss);

        const headerH = 22;
        doc.save();
        doc.rect(startX, y0, contentWidth, headerH).fill('#111827');
        doc.fillColor('#FFFFFF').fontSize(10);
        doc.text('Model', startX + 8, y0 + 6, { width: colName - 10 });
        doc.text('Acc', startX + colName, y0 + 6, { width: colAcc, align: 'right' });
        doc.text('F1', startX + colName + colAcc, y0 + 6, { width: colF1, align: 'right' });
        doc.text('Loss', startX + colName + colAcc + colF1, y0 + 6, { width: colLoss, align: 'right' });
        doc.text('TrainingRun', startX + colName + colAcc + colF1 + colLoss, y0 + 6, { width: colRun - 8, align: 'left' });
        doc.restore();

        doc.y = y0 + headerH;
        const rowH = 22;

        models.forEach((m, idx) => {
          if (doc.y + rowH + 60 > doc.page.height - doc.page.margins.bottom) {
            doc.addPage();
            drawTopBar(report.title || 'Analysis Report', `Generated at: ${report.createdAt}`);
            sectionTitle('Models (continued)');
          }

          const y = doc.y;
          doc.save();
          doc.rect(startX, y, contentWidth, rowH).fill(idx % 2 === 0 ? '#F8FAFC' : '#FFFFFF');
          doc.restore();

          const name = m.name || m.modelId;
          const accPct = `${(safeNumber(m.accuracy, 0) * 100).toFixed(2)}%`;
          const f1Pct = `${(safeNumber(m.f1Score, 0) * 100).toFixed(2)}%`;
          const loss = `${safeNumber(m.loss, 0).toFixed(4)}`;
          const run = m.lastTrainingRunId || '-';

          doc.fillColor('#0f172a').fontSize(10);
          doc.text(name, startX + 8, y + 6, { width: colName - 12 });
          doc.fillColor('#0f172a').text(accPct, startX + colName, y + 6, { width: colAcc, align: 'right' });
          doc.fillColor('#0f172a').text(f1Pct, startX + colName + colAcc, y + 6, { width: colF1, align: 'right' });
          doc.fillColor('#0f172a').text(loss, startX + colName + colAcc + colF1, y + 6, { width: colLoss, align: 'right' });
          doc.fillColor('#334155').text(run, startX + colName + colAcc + colF1 + colLoss, y + 6, { width: colRun - 12, align: 'left' });

          doc.y = y + rowH;
        });

        doc.moveDown(0.8);
        doc.fillColor('#334155').fontSize(9).text('Note: model metrics are taken from the latest completed training session found in MongoDB.', { width: contentWidth });
      }

      const imgs = normalizeImages(images);
      if (imgs.length) {
        imgs.forEach((dataUrl, idx) => {
          const imgBuf = dataUrlToPngBuffer(dataUrl);
          if (!imgBuf) return;

          doc.addPage();
          drawTopBar(report.title || 'Analysis Report', `Charts & Visuals (${idx + 1}/${imgs.length})`);

          const usableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
          const usableHeight = doc.page.height - doc.page.margins.top - doc.page.margins.bottom - 30;
          const x = doc.page.margins.left;
          const y = doc.y;

          doc.save();
          doc.roundedRect(x, y, usableWidth, usableHeight, 10).strokeColor('#E5E7EB').lineWidth(1).stroke();
          doc.restore();

          doc.image(imgBuf, x + 10, y + 10, {
            fit: [usableWidth - 20, usableHeight - 20],
            align: 'center',
            valign: 'center'
          });
        });
      }

      const range = doc.bufferedPageRange();
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(range.start + i);
        const pageNo = i + 1;
        const totalPages = range.count;

        const footerY = doc.page.height - doc.page.margins.bottom + 18;
        doc.save();
        doc.fillColor('#94a3b8');
        doc.fontSize(9).text(`${pageNo} / ${totalPages}`, doc.page.margins.left, footerY, {
          width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
          align: 'right'
        });
        doc.restore();
      }

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

// POST /api/reports/analysis/pdf
router.post('/analysis/pdf', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { modelIds, dataset = 'test', trainingRunId = null, title = 'Analysis Report', images = [] } = req.body || {};

    const report = await buildAnalysisReportData({ userId, modelIds, dataset, trainingRunId });
    report.title = title;

    // Persist report metadata (best-effort)
    try {
      if (Report && userId) {
        await Report.create({
          userId,
          reportType: 'analysis_pdf',
          title,
          dataset,
          modelIds: normalizeToArray(modelIds),
          trainingRunId: trainingRunId || null,
          datasetId: report?.dataset?.id || null,
          recipients: []
        });
      }
    } catch (e) {
      // ignore persistence errors
    }

    const pdfBuffer = await renderPdfToBuffer(report, images);

    await notificationService.addNotification(
      userId,
      'info',
      'Report Generated',
      'Analysis report PDF generated successfully',
      { type: 'analysis_report_pdf', modelIds: normalizeToArray(modelIds), dataset, trainingRunId }
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="analysis-report.pdf"');
    res.status(200).send(pdfBuffer);
  } catch (error) {
    logger.error('Error generating analysis PDF report', { error: error.message });
    notificationService.notifySystemError('Report Error', error.message);
    res.status(500).json({ success: false, message: 'Error generating PDF report', error: error.message });
  }
});

// POST /api/reports/analysis/email
router.post('/analysis/email', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { to, subject, message, modelIds, dataset = 'test', trainingRunId = null, title = 'Analysis Report', images = [] } = req.body || {};

    const recipients = normalizeToArray(to);
    if (!recipients.length) {
      return res.status(400).json({ success: false, message: 'to is required (string or array)' });
    }

    const report = await buildAnalysisReportData({ userId, modelIds, dataset, trainingRunId });
    report.title = title;

    const pdfBuffer = await renderPdfToBuffer(report, images);

    const transporter = buildTransporterFromEnv();
    const from = process.env.EMAIL_FROM || process.env.SMTP_USER;

    const mail = {
      from,
      to: recipients.join(','),
      subject: subject || 'Analysis Report',
      text: message || 'Please find the analysis report attached.',
      attachments: [
        {
          filename: 'analysis-report.pdf',
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    const info = await transporter.sendMail(mail);

    // Persist report metadata (best-effort)
    try {
      if (Report && userId) {
        await Report.create({
          userId,
          reportType: 'analysis_email',
          title,
          dataset,
          modelIds: normalizeToArray(modelIds),
          trainingRunId: trainingRunId || null,
          datasetId: report?.dataset?.id || null,
          recipients,
          emailSubject: subject || 'Analysis Report',
          messageId: info?.messageId || null
        });
      }
    } catch (e) {
      // ignore persistence errors
    }

    const notif = await notificationService.addNotification(
      userId,
      'success',
      'Report Sent',
      `Analysis report sent to ${recipients.length} recipient(s)`,
      { type: 'analysis_report_email', recipientsCount: recipients.length, modelIds: normalizeToArray(modelIds), dataset, trainingRunId, messageId: info?.messageId }
    );

    res.json({
      success: true,
      message: 'Report emailed successfully',
      messageId: info?.messageId || null,
      notification: notif
    });
  } catch (error) {
    logger.error('Error emailing analysis PDF report', { error: error.message });
    notificationService.notifySystemError('Email Report Error', error.message);
    res.status(500).json({ success: false, message: 'Error sending report email', error: error.message });
  }
});

// GET /api/reports?limit=50&reportType=analysis_pdf&dataset=test&modelId=...&trainingRunId=...
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    if (!Report) {
      return res.status(501).json({ success: false, message: 'Report history is not available (Report model missing)' });
    }

    const limitRaw = Number(req.query?.limit ?? 50);
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(200, limitRaw)) : 50;

    const reportType = String(req.query?.reportType || '').trim();
    const dataset = String(req.query?.dataset || '').trim();
    const modelId = String(req.query?.modelId || '').trim();
    const trainingRunId = String(req.query?.trainingRunId || '').trim();

    const q = { userId };
    if (reportType) q.reportType = reportType;
    if (dataset) q.dataset = dataset;
    if (trainingRunId) q.trainingRunId = trainingRunId;
    if (modelId) q.modelIds = modelId;

    const reports = await Report.find(q)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const count = await Report.countDocuments(q);

    return res.json({ success: true, reports: reports || [], count });
  } catch (error) {
    logger.error('Error retrieving report history', { error: error.message });
    return res.status(500).json({ success: false, message: 'Error retrieving report history', error: error.message });
  }
});

// GET /api/reports/stats
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    if (!Report) {
      return res.status(501).json({ success: false, message: 'Report stats are not available (Report model missing)' });
    }

    const total = await Report.countDocuments({ userId });
    const pdf = await Report.countDocuments({ userId, reportType: 'analysis_pdf' });
    const email = await Report.countDocuments({ userId, reportType: 'analysis_email' });

    return res.json({ success: true, stats: { total, analysis_pdf: pdf, analysis_email: email } });
  } catch (error) {
    logger.error('Error retrieving report stats', { error: error.message });
    return res.status(500).json({ success: false, message: 'Error retrieving report stats', error: error.message });
  }
});

// DELETE /api/reports/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (!Report) {
      return res.status(501).json({ success: false, message: 'Report history is not available (Report model missing)' });
    }

    const id = String(req.params?.id || '').trim();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid report id' });
    }

    const deleted = await Report.findOneAndDelete({ _id: id, userId }).lean();
    if (!deleted) return res.status(404).json({ success: false, message: 'Report not found' });

    return res.json({ success: true, deleted });
  } catch (error) {
    logger.error('Error deleting report', { error: error.message });
    return res.status(500).json({ success: false, message: 'Error deleting report', error: error.message });
  }
});

module.exports = router;
