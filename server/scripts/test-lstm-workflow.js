const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function jsonFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      'Content-Type': 'application/json'
    }
  });

  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!res.ok) {
    const msg = typeof body === 'object' && body ? (body.error || body.message || JSON.stringify(body)) : String(body);
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${msg}`);
  }
  return body;
}

async function authRegisterAndLogin() {
  const ts = Date.now();
  const email = `lstm_test_${ts}@example.com`;
  const password = 'Test12345!';
  const username = `lstm_test_${ts}`;

  await jsonFetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    body: JSON.stringify({ username, email, password })
  });

  const login = await jsonFetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });

  const token = login?.token;
  if (!token) throw new Error('Login did not return a token');
  return { token, email };
}

async function uploadSequenceCsv(token, csvPath, timesteps = 50, stride = 50) {
  const buf = fs.readFileSync(csvPath);
  const form = new FormData();
  form.append('datasetType', 'sequence');
  form.append('timesteps', String(timesteps));
  form.append('stride', String(stride));
  form.append('file', new Blob([buf], { type: 'text/csv' }), path.basename(csvPath));

  const res = await fetch(`${BASE_URL}/api/data/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: form
  });

  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!res.ok) {
    const msg = typeof body === 'object' && body ? (body.error || body.message || JSON.stringify(body)) : String(body);
    throw new Error(`Upload failed: HTTP ${res.status} ${res.statusText}: ${msg}`);
  }

  return body;
}

async function createLstmModel(token, inputShape = [50, 10], numClasses = 2) {
  const body = await jsonFetch(`${BASE_URL}/api/model/create`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ inputShape, numClasses, modelType: 'lstm' })
  });

  const modelId = body?.model?.modelId || body?.modelId || body?.data?.modelId;
  if (!modelId) {
    throw new Error(`Model create did not return modelId: ${JSON.stringify(body)}`);
  }

  return { modelId, raw: body };
}

async function startTraining(token, modelId, epochs = 5, batchSize = 32, learningRate = 0.001) {
  return jsonFetch(`${BASE_URL}/api/training/start`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ epochs, batchSize, learningRate, validationSplit: 0.2, modelId })
  });
}

async function waitForTraining(token, modelId, timeoutMs = 180000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const statusRes = await fetch(`${BASE_URL}/api/training/status?modelId=${encodeURIComponent(modelId)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const body = await statusRes.json();
    const status = body?.status?.status;
    const progress = body?.status?.progress;

    if (status === 'completed') return body;
    if (status === 'failed') throw new Error(`Training failed: ${JSON.stringify(body?.status || {})}`);

    process.stdout.write(`\rWaiting training... status=${status} progress=${progress}%   `);
    await sleep(1500);
  }
  throw new Error(`Timeout waiting training (>${timeoutMs}ms)`);
}

async function evaluate(token, modelId, dataset = 'test') {
  return jsonFetch(`${BASE_URL}/api/training/evaluate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ dataset, modelId })
  });
}

async function getDataStats(token) {
  const res = await fetch(`${BASE_URL}/api/data/stats`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(`Get data stats failed: ${body?.error || body?.message || JSON.stringify(body)}`);
  }
  return body;
}

async function confusionMatrix(token, modelId, dataset = 'test') {
  const res = await fetch(`${BASE_URL}/api/training/confusion-matrix?modelId=${encodeURIComponent(modelId)}&dataset=${encodeURIComponent(dataset)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(`Confusion matrix failed: ${body?.error || body?.message || JSON.stringify(body)}`);
  }
  return body;
}

async function main() {
  console.log('=== LSTM automated workflow test ===');
  console.log(`BASE_URL=${BASE_URL}`);

  const timesteps = Math.max(2, Number(process.env.TIMESTEPS || 50));
  const features = Math.max(2, Number(process.env.FEATURES || 10));
  const stride = Math.max(1, Number(process.env.STRIDE || timesteps));

  // 1) Generate sample csv
  const csvPath = path.join(process.cwd(), 'datasets', 'sample_lstm_sequence.csv');
  execFileSync(
    process.execPath,
    [path.join(process.cwd(), 'server', 'scripts', 'generate-sample-seq-csv.js'), csvPath, '1200', String(features)],
    { stdio: 'inherit' }
  );

  // 2) Register + login
  const { token, email } = await authRegisterAndLogin();
  console.log(`OK auth: ${email}`);

  // 3) Upload dataset
  const uploadRes = await uploadSequenceCsv(token, csvPath, timesteps, stride);
  console.log('OK upload:', {
    datasetId: uploadRes?.datasetId,
    stats: uploadRes?.stats
  });

  const statsRes = await getDataStats(token);
  console.log('OK /api/data/stats:', statsRes?.stats || statsRes);

  const s = statsRes?.stats || {};
  const inputShape = Array.isArray(s?.inputShape) ? s.inputShape : [];
  const labelFormat = String(s?.labelFormat || 'unknown');
  const classes = Number(s?.classes || 0);
  if (!inputShape.length || inputShape.length !== 2 || labelFormat !== 'one_hot' || classes < 2 || classes > 20) {
    throw new Error(
      `Sequence CSV was not tensorized by backend. Expected datasetType=sequence, inputShape=[timesteps,features], labelFormat=one_hot, classes≈2. ` +
      `Got inputShape=${JSON.stringify(inputShape)} labelFormat=${labelFormat} classes=${classes}. ` +
      `Fix: restart the backend server so /api/data/upload uses DataService.loadSequenceCsv().`
    );
  }

  // 4) Create model
  const created = await createLstmModel(token, [timesteps, features], 2);
  console.log('OK model:', { modelId: created.modelId });

  // 5) Train
  await startTraining(token, created.modelId, 5, 32, 0.001);
  console.log('OK training started');

  const status = await waitForTraining(token, created.modelId);
  console.log('\nOK training completed:', status?.status);

  // 6) Evaluate
  const evalRes = await evaluate(token, created.modelId, 'test');
  console.log('OK evaluate:', evalRes);

  // 7) Confusion matrix
  const cmRes = await confusionMatrix(token, created.modelId, 'test');
  console.log('OK confusion matrix:', {
    accuracy: cmRes?.confusionMatrix?.accuracy,
    precision: cmRes?.confusionMatrix?.precision,
    recall: cmRes?.confusionMatrix?.recall
  });

  console.log('=== SUCCESS ===');
}

main().catch((err) => {
  console.error('\n=== FAILED ===');
  console.error(err);
  process.exit(1);
});
