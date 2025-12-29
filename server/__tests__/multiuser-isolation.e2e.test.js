const request = require('supertest');
const { connectDB, disconnectDB, mongoose } = require('../config/mongodb');

const User = require('../models/User');
const Dataset = require('../models/Dataset');
const Model = require('../models/Model');
const Training = require('../models/Training');

const app = require('../index');

async function registerAndLogin(agent, { username, email, password }) {
  await agent
    .post('/api/auth/register')
    .send({ username, email, password })
    .expect((res) => {
      if (!res.body?.success) {
        throw new Error(`Register failed: ${res.body?.message || 'unknown error'}`);
      }
    });

  const loginRes = await agent
    .post('/api/auth/login')
    .send({ email, password })
    .expect(200);

  if (!loginRes.body?.success || !loginRes.body?.token) {
    throw new Error(`Login failed: ${loginRes.body?.message || 'unknown error'}`);
  }

  return {
    token: loginRes.body.token,
    userId: loginRes.body?.user?.id
  };
}

describe('E2E multi-user isolation', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await connectDB();

    // Ensure clean slate
    await Promise.all([
      User.deleteMany({}),
      Dataset.deleteMany({}),
      Model.deleteMany({}),
      Training.deleteMany({})
    ]);
  });

  afterAll(async () => {
    await Promise.all([
      User.deleteMany({}),
      Dataset.deleteMany({}),
      Model.deleteMany({}),
      Training.deleteMany({})
    ]);

    await disconnectDB();
    if (mongoose?.connection?.readyState) {
      await mongoose.connection.close();
    }
  });

  test('User A cannot see User B datasets/models/trainings', async () => {
    const agentA = request(app);
    const agentB = request(app);

    const a = await registerAndLogin(agentA, {
      username: 'userA',
      email: 'userA@example.com',
      password: 'password123'
    });
    const b = await registerAndLogin(agentB, {
      username: 'userB',
      email: 'userB@example.com',
      password: 'password123'
    });

    // Seed data for each user
    const dsA = await Dataset.create({
      userId: a.userId,
      name: 'datasetA',
      filePath: 'uploads/datasetA.csv',
      datasetType: 'tabular',
      totalSamples: 100,
      features: 4,
      classes: 3,
      labelFormat: 'one_hot',
      inputShape: [4]
    });

    const dsB = await Dataset.create({
      userId: b.userId,
      name: 'datasetB',
      filePath: 'uploads/datasetB.csv',
      datasetType: 'tabular',
      totalSamples: 120,
      features: 5,
      classes: 2,
      labelFormat: 'one_hot',
      inputShape: [5]
    });

    const mA = await Model.create({
      userId: a.userId,
      modelId: 'model_A',
      name: 'modelA',
      inputShape: [4],
      numClasses: 3,
      expectedFingerprint: { datasetType: 'tabular', features: 4, classes: 3, labelFormat: 'one_hot' }
    });

    const mB = await Model.create({
      userId: b.userId,
      modelId: 'model_B',
      name: 'modelB',
      inputShape: [5],
      numClasses: 2,
      expectedFingerprint: { datasetType: 'tabular', features: 5, classes: 2, labelFormat: 'one_hot' }
    });

    await Training.create({
      userId: a.userId,
      trainingRunId: 'run_A_1',
      modelId: mA.modelId,
      datasetId: dsA._id,
      epochs: 2,
      batchSize: 8,
      learningRate: 0.001,
      status: 'completed',
      progress: 100,
      history: { loss: [1, 0.5], accuracy: [0.4, 0.7], valLoss: [], valAccuracy: [] },
      finalMetrics: { loss: 0.5, accuracy: 0.7, valLoss: 0, valAccuracy: 0 },
      evaluationMetrics: { accuracy: 0.7, precision: 0.6, recall: 0.5, f1Score: 0.55, confusionMatrix: [[1]] },
      startedAt: new Date(),
      completedAt: new Date()
    });

    await Training.create({
      userId: b.userId,
      trainingRunId: 'run_B_1',
      modelId: mB.modelId,
      datasetId: dsB._id,
      epochs: 2,
      batchSize: 8,
      learningRate: 0.001,
      status: 'completed',
      progress: 100,
      history: { loss: [1, 0.4], accuracy: [0.5, 0.8], valLoss: [], valAccuracy: [] },
      finalMetrics: { loss: 0.4, accuracy: 0.8, valLoss: 0, valAccuracy: 0 },
      evaluationMetrics: { accuracy: 0.8, precision: 0.7, recall: 0.6, f1Score: 0.65, confusionMatrix: [[1]] },
      startedAt: new Date(),
      completedAt: new Date()
    });

    // /api/data/datasets
    const listA = await agentA
      .get('/api/data/datasets')
      .set('Authorization', `Bearer ${a.token}`)
      .expect(200);

    const namesA = (listA.body?.datasets || []).map((d) => d.name);
    expect(namesA).toContain('datasetA');
    expect(namesA).not.toContain('datasetB');

    // /api/model/list
    const modelsA = await agentA
      .get('/api/model/list')
      .set('Authorization', `Bearer ${a.token}`)
      .expect(200);

    const modelIdsA = (modelsA.body?.models || []).map((m) => m.id);
    expect(modelIdsA).toContain('model_A');
    expect(modelIdsA).not.toContain('model_B');

    // /api/training/history
    const histA = await agentA
      .get('/api/training/history')
      .set('Authorization', `Bearer ${a.token}`)
      .expect(200);

    const histModelsA = (histA.body?.history?.data || []).map((h) => h.modelId);
    expect(histModelsA).toContain('model_A');
    expect(histModelsA).not.toContain('model_B');

    // /api/training/model-comparison
    const cmpA = await agentA
      .get('/api/training/model-comparison')
      .query({ modelIds: 'model_A,model_B', dataset: 'test' })
      .set('Authorization', `Bearer ${a.token}`)
      .expect(200);

    const cmpModelsA = (cmpA.body?.comparison?.models || []).map((m) => m.modelId);
    expect(cmpModelsA).toEqual(['model_A', 'model_B']);

    const modelAEntry = (cmpA.body?.comparison?.models || []).find((m) => m.modelId === 'model_A');
    const modelBEntry = (cmpA.body?.comparison?.models || []).find((m) => m.modelId === 'model_B');

    expect(Number(modelAEntry?.accuracy)).toBeGreaterThan(0);
    // critical isolation: A should not receive B metrics
    expect(Number(modelBEntry?.accuracy)).toBe(0);

    // /api/dashboard/overview
    const dashA = await agentA
      .get('/api/dashboard/overview')
      .set('Authorization', `Bearer ${a.token}`)
      .expect(200);

    expect(dashA.body?.success).toBe(true);
    expect(dashA.body?.overview?.dataset?.datasetType).toBe('tabular');
    expect(dashA.body?.overview?.dataset?.totalSamples).toBe(100);
    expect(dashA.body?.overview?.dataset?.features).toBe(4);
    expect(dashA.body?.overview?.dataset?.classes).toBe(3);
  });
});
