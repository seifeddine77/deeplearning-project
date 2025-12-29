const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color] || ''}${msg}\x1b[0m`);
}

async function test() {
  try {
    log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
    log('║         🎓 TRAINING PHASE - FINAL VERIFICATION 🎓         ║', 'cyan');
    log('╚════════════════════════════════════════════════════════════╝\n', 'cyan');

    let passed = 0, failed = 0;

    // ==================== SECTION 1: MODEL CREATION ====================
    log('📦 SECTION 1: MODEL CREATION', 'blue');
    log('─'.repeat(60), 'blue');

    let model1Id = null, model2Id = null, model3Id = null;

    // Test 1.1: Create Lightweight Model 1
    log('\n1.1 Create Lightweight Model 1', 'yellow');
    try {
      const res = await axios.post(`${BASE_URL}/model/create`, {
        inputShape: [64, 64, 1],
        numClasses: 10,
        modelType: 'lightweight'
      });
      model1Id = res.data.model.modelId;
      log(`✅ Created: ${model1Id}`, 'green');
      log(`   Layers: ${res.data.model.layers}`, 'yellow');
      passed++;
    } catch (e) {
      log(`❌ Failed: ${e.message}`, 'red');
      failed++;
    }

    // Test 1.2: Create Lightweight Model 2
    log('\n1.2 Create Lightweight Model 2', 'yellow');
    try {
      const res = await axios.post(`${BASE_URL}/model/create`, {
        inputShape: [64, 64, 1],
        numClasses: 10,
        modelType: 'lightweight'
      });
      model2Id = res.data.model.modelId;
      log(`✅ Created: ${model2Id}`, 'green');
      log(`   Layers: ${res.data.model.layers}`, 'yellow');
      passed++;
    } catch (e) {
      log(`❌ Failed: ${e.message}`, 'red');
      failed++;
    }

    // Test 1.3: Create Full CNN+LSTM Model
    log('\n1.3 Create Full CNN+LSTM Model', 'yellow');
    try {
      const res = await axios.post(`${BASE_URL}/model/create`, {
        inputShape: [64, 64, 1],
        numClasses: 10,
        modelType: 'full'
      });
      model3Id = res.data.model.modelId;
      log(`✅ Created: ${model3Id}`, 'green');
      log(`   Layers: ${res.data.model.layers}`, 'yellow');
      passed++;
    } catch (e) {
      log(`❌ Failed: ${e.message}`, 'red');
      failed++;
    }

    // ==================== SECTION 2: MODEL LISTING ====================
    log('\n\n📋 SECTION 2: MODEL LISTING', 'blue');
    log('─'.repeat(60), 'blue');

    log('\n2.1 Get Models List', 'yellow');
    try {
      const res = await axios.get(`${BASE_URL}/model/list`);
      const models = res.data.models || [];
      log(`✅ Retrieved ${models.length} models:`, 'green');
      models.forEach((m, i) => {
        log(`   ${i + 1}. ${m.name} (${m.id})`, 'yellow');
      });
      if (models.length >= 3) {
        passed++;
      } else {
        failed++;
      }
    } catch (e) {
      log(`❌ Failed: ${e.message}`, 'red');
      failed++;
    }

    // ==================== SECTION 3: TRAINING ====================
    log('\n\n🚀 SECTION 3: TRAINING', 'blue');
    log('─'.repeat(60), 'blue');

    // Test 3.1: Train Model 1
    log('\n3.1 Train Lightweight Model 1', 'yellow');
    if (model1Id) {
      try {
        const res = await axios.post(`${BASE_URL}/training/start`, {
          epochs: 1,
          batchSize: 32,
          modelId: model1Id
        });
        if (res.data.success) {
          log(`✅ Training started`, 'green');
          log(`   Status: ${res.data.training.status}`, 'yellow');
          log(`   Model ID: ${res.data.training.modelId}`, 'yellow');
          passed++;
        } else {
          failed++;
        }
      } catch (e) {
        log(`❌ Failed: ${e.message}`, 'red');
        failed++;
      }
    }

    // Wait for training
    log('\n⏳ Waiting 8 seconds for training to complete...', 'yellow');
    await new Promise(r => setTimeout(r, 8000));

    // Test 3.2: Train Model 2 (while Model 1 might still be training)
    log('\n3.2 Train Lightweight Model 2 (Independent)', 'yellow');
    if (model2Id) {
      try {
        const res = await axios.post(`${BASE_URL}/training/start`, {
          epochs: 1,
          batchSize: 32,
          modelId: model2Id
        });
        if (res.data.success) {
          log(`✅ Training started`, 'green');
          log(`   Status: ${res.data.training.status}`, 'yellow');
          passed++;
        } else {
          failed++;
        }
      } catch (e) {
        log(`❌ Failed: ${e.message}`, 'red');
        failed++;
      }
    }

    // Wait
    log('\n⏳ Waiting 5 seconds...', 'yellow');
    await new Promise(r => setTimeout(r, 5000));

    // Test 3.3: Train Model 3
    log('\n3.3 Train Full CNN+LSTM Model', 'yellow');
    if (model3Id) {
      try {
        const res = await axios.post(`${BASE_URL}/training/start`, {
          epochs: 1,
          batchSize: 32,
          modelId: model3Id
        });
        if (res.data.success) {
          log(`✅ Training started`, 'green');
          log(`   Status: ${res.data.training.status}`, 'yellow');
          passed++;
        } else {
          failed++;
        }
      } catch (e) {
        log(`❌ Failed: ${e.message}`, 'red');
        failed++;
      }
    }

    // Wait
    log('\n⏳ Waiting 5 seconds...', 'yellow');
    await new Promise(r => setTimeout(r, 5000));

    // ==================== SECTION 4: EVALUATION ====================
    log('\n\n📊 SECTION 4: EVALUATION', 'blue');
    log('─'.repeat(60), 'blue');

    // Test 4.1: Evaluate Model 1
    log('\n4.1 Evaluate Model 1', 'yellow');
    if (model1Id) {
      try {
        const res = await axios.post(`${BASE_URL}/training/evaluate`, {
          modelId: model1Id,
          dataset: 'test'
        });
        if (res.data.success) {
          log(`✅ Evaluated`, 'green');
          log(`   Loss: ${res.data.evaluation.loss.toFixed(4)}`, 'yellow');
          log(`   Accuracy: ${res.data.evaluation.accuracy.toFixed(4)}`, 'yellow');
          passed++;
        } else {
          failed++;
        }
      } catch (e) {
        log(`❌ Failed: ${e.message}`, 'red');
        failed++;
      }
    }

    // Test 4.2: Evaluate Model 3
    log('\n4.2 Evaluate Model 3 (Full)', 'yellow');
    if (model3Id) {
      try {
        const res = await axios.post(`${BASE_URL}/training/evaluate`, {
          modelId: model3Id,
          dataset: 'test'
        });
        if (res.data.success) {
          log(`✅ Evaluated`, 'green');
          log(`   Loss: ${res.data.evaluation.loss.toFixed(4)}`, 'yellow');
          log(`   Accuracy: ${res.data.evaluation.accuracy.toFixed(4)}`, 'yellow');
          passed++;
        } else {
          failed++;
        }
      } catch (e) {
        log(`❌ Failed: ${e.message}`, 'red');
        failed++;
      }
    }

    // ==================== SECTION 5: PREDICTIONS ====================
    log('\n\n🔮 SECTION 5: PREDICTIONS', 'blue');
    log('─'.repeat(60), 'blue');

    // Test 5.1: Predict with Model 1
    log('\n5.1 Predict with Model 1', 'yellow');
    if (model1Id) {
      try {
        const inputData = Array(64 * 64).fill(0.5);
        const res = await axios.post(`${BASE_URL}/training/predict`, {
          inputData: inputData,
          modelId: model1Id
        });
        if (res.data.success) {
          log(`✅ Prediction made`, 'green');
          log(`   Class: ${res.data.prediction.predictedClass}`, 'yellow');
          log(`   Confidence: ${(res.data.prediction.confidence * 100).toFixed(2)}%`, 'yellow');
          passed++;
        } else {
          failed++;
        }
      } catch (e) {
        log(`❌ Failed: ${e.message}`, 'red');
        failed++;
      }
    }

    // Test 5.2: Predict with Model 3
    log('\n5.2 Predict with Model 3 (Full)', 'yellow');
    if (model3Id) {
      try {
        const inputData = Array(64 * 64).fill(0.5);
        const res = await axios.post(`${BASE_URL}/training/predict`, {
          inputData: inputData,
          modelId: model3Id
        });
        if (res.data.success) {
          log(`✅ Prediction made`, 'green');
          log(`   Class: ${res.data.prediction.predictedClass}`, 'yellow');
          log(`   Confidence: ${(res.data.prediction.confidence * 100).toFixed(2)}%`, 'yellow');
          passed++;
        } else {
          failed++;
        }
      } catch (e) {
        log(`❌ Failed: ${e.message}`, 'red');
        failed++;
      }
    }

    // ==================== SECTION 6: HISTORY & METRICS ====================
    log('\n\n📈 SECTION 6: HISTORY & METRICS', 'blue');
    log('─'.repeat(60), 'blue');

    // Test 6.1: Get Training History
    log('\n6.1 Get Training History', 'yellow');
    try {
      const res = await axios.get(`${BASE_URL}/training/history`);
      const history = res.data.history.data || [];
      log(`✅ Retrieved ${history.length} training session(s)`, 'green');
      
      // Group by model
      const byModel = {};
      history.forEach(h => {
        if (!byModel[h.modelId]) byModel[h.modelId] = [];
        byModel[h.modelId].push(h);
      });
      
      Object.entries(byModel).forEach(([modelId, sessions]) => {
        log(`   Model ${modelId}: ${sessions.length} session(s)`, 'yellow');
      });
      
      if (history.length >= 3) {
        passed++;
      } else {
        log(`   ⚠️ Expected 3+ sessions, got ${history.length}`, 'yellow');
      }
    } catch (e) {
      log(`❌ Failed: ${e.message}`, 'red');
      failed++;
    }

    // Test 6.2: Get Metrics
    log('\n6.2 Get Training Metrics', 'yellow');
    try {
      const res = await axios.get(`${BASE_URL}/training/metrics`);
      if (res.data.success) {
        log(`✅ Metrics retrieved`, 'green');
        log(`   Training Status: ${res.data.metrics.isTraining ? 'IN PROGRESS' : 'COMPLETED'}`, 'yellow');
        log(`   History Count: ${res.data.metrics.trainingHistoryCount}`, 'yellow');
        passed++;
      } else {
        failed++;
      }
    } catch (e) {
      log(`❌ Failed: ${e.message}`, 'red');
      failed++;
    }

    // ==================== SUMMARY ====================
    log('\n\n╔════════════════════════════════════════════════════════════╗', 'cyan');
    log('║                    📊 TEST SUMMARY 📊                      ║', 'cyan');
    log('╚════════════════════════════════════════════════════════════╝\n', 'cyan');

    log(`✅ Tests Passed: ${passed}`, 'green');
    log(`❌ Tests Failed: ${failed}`, failed > 0 ? 'red' : 'green');
    
    const total = passed + failed;
    const rate = Math.round((passed / total) * 100);
    log(`🎯 Success Rate: ${rate}%\n`, rate === 100 ? 'green' : 'yellow');

    if (failed === 0) {
      log('╔════════════════════════════════════════════════════════════╗', 'green');
      log('║           🎉 ALL TESTS PASSED - PHASE COMPLETE! 🎉        ║', 'green');
      log('╚════════════════════════════════════════════════════════════╝\n', 'green');
    }

  } catch (e) {
    log(`\n❌ FATAL ERROR: ${e.message}`, 'red');
  }
}

test();
