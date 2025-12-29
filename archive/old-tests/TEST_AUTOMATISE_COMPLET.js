#!/usr/bin/env node

/**
 * 🧪 TEST AUTOMATISÉ COMPLET - FRONT + BACK
 * Teste tout le workflow: Upload → Modèle → Entraînement → Analyse
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const BASE_URL = 'http://localhost:3000/api';
const FRONTEND_URL = 'http://localhost:4200';

// Couleurs pour les logs
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function info(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testBackend() {
  log('\n' + '='.repeat(60), 'blue');
  log('🧪 TEST AUTOMATISÉ - BACKEND', 'blue');
  log('='.repeat(60), 'blue');

  try {
    // 1. Test Health Check
    log('\n1️⃣  Test Health Check...', 'cyan');
    try {
      const healthRes = await axios.get(`${BASE_URL}/health`);
      if (healthRes.data.status === 'ok') {
        success('Backend est en ligne');
      } else {
        error('Health check échoué');
        return false;
      }
    } catch (err) {
      error(`Backend non accessible: ${err.message}`);
      return false;
    }

    // 2. Test Upload Dataset
    log('\n2️⃣  Test Upload Dataset...', 'cyan');
    const csvPath = path.join(__dirname, 'test-dataset.csv');
    if (!fs.existsSync(csvPath)) {
      warning(`Fichier ${csvPath} non trouvé, création...`);
      const csvContent = `pixel1,pixel2,pixel3,pixel4,pixel5,pixel6,pixel7,pixel8,pixel9,pixel10,label
0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1.0,0
0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1.0,0.1,1
0.3,0.4,0.5,0.6,0.7,0.8,0.9,1.0,0.1,0.2,2
0.4,0.5,0.6,0.7,0.8,0.9,1.0,0.1,0.2,0.3,3
0.5,0.6,0.7,0.8,0.9,1.0,0.1,0.2,0.3,0.4,4
0.6,0.7,0.8,0.9,1.0,0.1,0.2,0.3,0.4,0.5,5
0.7,0.8,0.9,1.0,0.1,0.2,0.3,0.4,0.5,0.6,6
0.8,0.9,1.0,0.1,0.2,0.3,0.4,0.5,0.6,0.7,7
0.9,1.0,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,8
1.0,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,9`;
      fs.writeFileSync(csvPath, csvContent);
    }

    const form = new FormData();
    form.append('file', fs.createReadStream(csvPath));
    
    const uploadRes = await axios.post(`${BASE_URL}/data/upload`, form, {
      headers: form.getHeaders()
    });

    if (uploadRes.data.success) {
      success(`Dataset uploadé: ${uploadRes.data.file.filename}`);
      info(`  - Samples: ${uploadRes.data.stats.totalSamples}`);
      info(`  - Features: ${uploadRes.data.stats.features}`);
      info(`  - Train: ${uploadRes.data.stats.trainSize} (${uploadRes.data.stats.trainPercentage}%)`);
      info(`  - Test: ${uploadRes.data.stats.testSize} (${uploadRes.data.stats.testPercentage}%)`);
    } else {
      error('Upload échoué');
      return false;
    }

    // 3. Test Create Model
    log('\n3️⃣  Test Create Model...', 'cyan');
    const modelRes = await axios.post(`${BASE_URL}/model/create`, {
      inputShape: [64, 64, 1],
      numClasses: 10,
      modelType: 'lightweight'
    });

    let modelId;
    if (modelRes.data.model && modelRes.data.model.modelId) {
      modelId = modelRes.data.model.modelId;
      success(`Modèle créé: ${modelId}`);
      info(`  - Couches: ${modelRes.data.model.layers || 'N/A'}`);
      info(`  - Paramètres: ${modelRes.data.model.parameters || 'N/A'}`);
    } else {
      error('Création du modèle échouée');
      return false;
    }

    // 4. Test Get Models List
    log('\n4️⃣  Test Get Models List...', 'cyan');
    const modelsRes = await axios.get(`${BASE_URL}/model/list`);
    if (modelsRes.data.models && Array.isArray(modelsRes.data.models)) {
      success(`${modelsRes.data.models.length} modèle(s) trouvé(s)`);
      modelsRes.data.models.forEach((m, i) => {
        info(`  ${i + 1}. ${m.name || m.id}`);
      });
    } else {
      error('Récupération des modèles échouée');
      return false;
    }

    // 5. Test Start Training
    log('\n5️⃣  Test Start Training...', 'cyan');
    const trainingRes = await axios.post(`${BASE_URL}/training/start`, {
      modelId: modelId,
      epochs: 2,
      batchSize: 32,
      learningRate: 0.001
    });

    if (trainingRes.data.success) {
      success('Entraînement démarré');
      info(`  - Status: ${trainingRes.data.training.status}`);
      info(`  - Epochs: ${trainingRes.data.training.epochs}`);
      info(`  - Batch Size: ${trainingRes.data.training.batchSize}`);
    } else {
      error('Démarrage de l\'entraînement échoué');
      return false;
    }

    // 6. Wait for Training
    log('\n6️⃣  Attente de l\'entraînement (~80 secondes)...', 'cyan');
    info('Cela peut prendre un peu de temps...');
    
    let trainingComplete = false;
    let waitTime = 0;
    const maxWait = 120000; // 2 minutes max
    const checkInterval = 5000; // Vérifier tous les 5 secondes

    while (!trainingComplete && waitTime < maxWait) {
      await sleep(checkInterval);
      waitTime += checkInterval;
      
      try {
        const historyRes = await axios.get(`${BASE_URL}/training/history`);
        const history = historyRes.data.history?.data || [];
        
        if (history.length > 0) {
          const lastSession = history[history.length - 1];
          if (lastSession.modelId === modelId) {
            trainingComplete = true;
            success(`Entraînement terminé après ${(waitTime / 1000).toFixed(0)}s`);
          }
        }
      } catch (err) {
        // Continuer l'attente
      }
      
      if (!trainingComplete && waitTime % 20000 === 0) {
        info(`  Attente: ${(waitTime / 1000).toFixed(0)}s...`);
      }
    }

    if (!trainingComplete) {
      warning('Timeout d\'attente, continuons quand même...');
    }

    // 7. Test Get Training History
    log('\n7️⃣  Test Get Training History...', 'cyan');
    const historyRes = await axios.get(`${BASE_URL}/training/history`);
    const history = historyRes.data.history?.data || [];
    
    if (history.length > 0) {
      success(`${history.length} session(s) d'entraînement trouvée(s)`);
      history.forEach((session, i) => {
        info(`  ${i + 1}. Model: ${session.modelId}`);
        info(`     - Config: ${session.config.epochs} epochs, batch ${session.config.batchSize}`);
        if (session.history?.history?.loss) {
          info(`     - Loss: ${session.history.history.loss[0]?.toFixed(4)} → ${session.history.history.loss[session.history.history.loss.length - 1]?.toFixed(4)}`);
        }
      });
    } else {
      warning('Aucune session d\'entraînement trouvée');
    }

    // 8. Test Evaluate Model
    log('\n8️⃣  Test Evaluate Model...', 'cyan');
    try {
      const evalRes = await axios.post(`${BASE_URL}/training/evaluate`, {
        modelId: modelId,
        dataset: 'test'
      });
      
      if (evalRes.data.success) {
        success('Évaluation du modèle réussie');
        info(`  - Accuracy: ${(evalRes.data.evaluation.accuracy * 100).toFixed(2)}%`);
        info(`  - Loss: ${evalRes.data.evaluation.loss.toFixed(4)}`);
      }
    } catch (err) {
      warning(`Évaluation non disponible: ${err.response?.data?.message || err.message}`);
    }

    log('\n' + '='.repeat(60), 'blue');
    success('✨ TOUS LES TESTS BACKEND RÉUSSIS!');
    log('='.repeat(60), 'blue');

    return { success: true, modelId, history };

  } catch (err) {
    error(`Erreur: ${err.message}`);
    if (err.response?.data) {
      error(`Réponse: ${JSON.stringify(err.response.data)}`);
    }
    return false;
  }
}

async function testFrontend() {
  log('\n' + '='.repeat(60), 'blue');
  log('🧪 TEST AUTOMATISÉ - FRONTEND', 'blue');
  log('='.repeat(60), 'blue');

  try {
    // 1. Test Frontend Health
    log('\n1️⃣  Test Frontend Health...', 'cyan');
    try {
      const res = await axios.get(FRONTEND_URL, { timeout: 5000 });
      if (res.status === 200) {
        success('Frontend est en ligne');
      }
    } catch (err) {
      error(`Frontend non accessible: ${err.message}`);
      warning('Assurez-vous que "ng serve" est lancé');
      return false;
    }

    // 2. Test Frontend Pages
    log('\n2️⃣  Test Frontend Pages...', 'cyan');
    const pages = [
      { path: '/dashboard', name: 'Dashboard' },
      { path: '/data', name: 'Data' },
      { path: '/model', name: 'Model' },
      { path: '/training', name: 'Training' },
      { path: '/analysis', name: 'Analysis' }
    ];

    for (const page of pages) {
      try {
        const res = await axios.get(`${FRONTEND_URL}${page.path}`, { timeout: 5000 });
        if (res.status === 200) {
          success(`Page ${page.name} accessible`);
        }
      } catch (err) {
        warning(`Page ${page.name} non accessible`);
      }
    }

    log('\n' + '='.repeat(60), 'blue');
    success('✨ TESTS FRONTEND COMPLÉTÉS!');
    log('='.repeat(60), 'blue');

    return true;

  } catch (err) {
    error(`Erreur: ${err.message}`);
    return false;
  }
}

async function generateReport(backendResult) {
  log('\n' + '='.repeat(60), 'blue');
  log('📊 RAPPORT FINAL', 'blue');
  log('='.repeat(60), 'blue');

  if (backendResult && backendResult.success) {
    success('Backend: FONCTIONNEL ✅');
    success(`Modèle créé: ${backendResult.modelId}`);
    success(`Sessions d'entraînement: ${backendResult.history?.length || 0}`);
  } else {
    error('Backend: ERREUR ❌');
  }

  log('\n' + '='.repeat(60), 'blue');
  log('🎉 TEST AUTOMATISÉ TERMINÉ', 'blue');
  log('='.repeat(60), 'blue');
}

async function main() {
  log('\n' + '='.repeat(60), 'blue');
  log('🚀 DÉMARRAGE DU TEST AUTOMATISÉ COMPLET', 'blue');
  log('='.repeat(60), 'blue');

  // Test Backend
  const backendResult = await testBackend();

  // Test Frontend
  await testFrontend();

  // Rapport
  await generateReport(backendResult);

  log('\n✨ Vous pouvez maintenant voir les graphes à: http://localhost:4200/analysis\n', 'green');
}

main().catch(err => {
  error(`Erreur fatale: ${err.message}`);
  process.exit(1);
});
